#!/usr/bin/env node
"use strict";

/**
 * Toolforge server
 * -----------------
 * A zero-dependency Node HTTP server that serves a single-page UI and exposes
 * the Python tools in the parent directory through `bridge.py`.
 *
 *   node server/index.js            -> http://127.0.0.1:7077
 *   PORT=8080 node server/index.js  -> http://127.0.0.1:8080
 *   HOST=0.0.0.0 node server/index.js
 */

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const { publicRegistry, toolMap, publicTool } = require("./tools");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const WORKSPACE_DIR = path.join(ROOT, "workspace");
const DATA_DIR = path.join(ROOT, "data");
const DOWNLOADS_DIR = path.join(ROOT, "..", "downloads");
const BRIDGE = path.join(ROOT, "bridge.py");

const PORT = Number(process.env.PORT || 7077);
const HOST = process.env.HOST || "127.0.0.1";
const PYTHON = process.env.PYTHON || "python3";
// 512 MB cloud cap: lower upload limit to 15 MB so a single buffer never
// exceeds ~120 MB in-process (original was 2 MB, bumped to 15 MB upload)
const MAX_BODY = 15 * 1024 * 1024;
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const HISTORY_LIMIT = 200;
const DEFAULT_TIMEOUT = 60_000;

// ---------------------------------------------------------------------------
// Dual-cloud heavy worker proxy (Koyeb.com)
// Set HEAVY_WORKER_URL in Render dashboard env vars to route OCR + yt-dlp
// to the dedicated Koyeb container.
// If unset, falls through to the local Python bridge on the same container.
// ---------------------------------------------------------------------------
const HEAVY_WORKER_URL = process.env.HEAVY_WORKER_URL || null;

// Tool IDs that are routed to the heavy worker when HEAVY_WORKER_URL is set
const HEAVY_TOOL_IDS = new Set([
  "ocr-scan",
  "yt-dl",
  "youtube-transcript",
  "pdf-to-docx",
  "docx-to-pdf",
]);

/**
 * Proxy a request body to the Koyeb heavy worker and pipe the response back.
 * Uses only Node.js built-ins (https module) — zero npm dependencies.
 */
async function proxyToHeavyWorker(req, res, rawBody) {
  const target = new URL(HEAVY_WORKER_URL);
  const isHttps = target.protocol === "https:";
  const transport = isHttps ? require("node:https") : require("node:http");

  return new Promise((resolve) => {
    const options = {
      hostname: target.hostname,
      port: target.port || (isHttps ? 443 : 80),
      path: "/api/run",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(rawBody),
        "X-Forwarded-For": req.socket?.remoteAddress || "unknown",
        "X-Origin-Secret": process.env.ORIGIN_SECRET || "",
      },
      timeout: 90_000,
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        "Content-Type": proxyRes.headers["content-type"] || "application/json",
        "X-Proxied-By": "toolforge-gateway",
      });
      proxyRes.pipe(res);
      proxyRes.on("end", resolve);
    });

    proxyReq.on("error", (err) => {
      console.error("[heavy-proxy] error:", err.message);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: false,
          error: { type: "ProxyError", message: `Heavy worker unreachable: ${err.message}` },
        }));
      }
      resolve();
    });

    proxyReq.write(rawBody);
    proxyReq.end();
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".zip": "application/zip",
  ".gz": "application/gzip",
};

// --------------------------------------------------------------------------- //
// History
// --------------------------------------------------------------------------- //

let history = [];
let historyWriteTimer = null;

function loadHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) history = parsed.slice(0, HISTORY_LIMIT);
    else if (parsed && Array.isArray(parsed.entries)) history = parsed.entries.slice(0, HISTORY_LIMIT);
  } catch {
    history = [];
  }
}

function scheduleHistorySave() {
  if (historyWriteTimer) return;
  historyWriteTimer = setTimeout(async () => {
    historyWriteTimer = null;
    try {
      await fsp.mkdir(DATA_DIR, { recursive: true });
      await fsp.writeFile(
        HISTORY_FILE,
        JSON.stringify({ updatedAt: new Date().toISOString(), entries: history }, null, 2),
      );
    } catch (err) {
      console.error("[history] save failed:", err.message);
    }
  }, 400);
}

function recordRun(entry) {
  history.unshift(entry);
  if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
  scheduleHistorySave();
}

loadHistory();

// --------------------------------------------------------------------------- //
// Utilities
// --------------------------------------------------------------------------- //

function sendJSON(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(payload);
}

function sendError(res, status, message, extra = {}) {
  sendJSON(res, status, { ok: false, error: message, ...extra });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("Request body too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function inside(base, target) {
  const rel = path.relative(base, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function safeJoin(base, requested) {
  const decoded = decodeURIComponent(requested);
  const target = path.resolve(base, "." + path.sep + decoded.replace(/^[/\\]+/, ""));
  return inside(base, target) ? target : null;
}

async function fileStatSafe(target) {
  try {
    return await fsp.stat(target);
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------- //
// Bridge invocation
// --------------------------------------------------------------------------- //

function runPython(tool, args) {
  const payload = JSON.stringify({
    module: tool.module,
    function: tool.function,
    args: args || {},
  });

  const timeout = Math.max(1000, Number(tool.timeout) || DEFAULT_TIMEOUT);

  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let finished = false;

    const child = spawn(PYTHON, [BRIDGE], {
      cwd: WORKSPACE_DIR,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
        TOOLFORGE_TOOLS_DIR: path.resolve(ROOT, ".."),
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      resolve({
        ok: false,
        error: {
          type: "Timeout",
          message: `Tool exceeded its ${Math.round(timeout / 1000)}s timeout and was stopped.`,
          traceback: "",
        },
        stdout,
        stderr,
        durationMs: Date.now() - started,
      });
    }, timeout);

    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
      if (stdout.length > 4_000_000) stdout = stdout.slice(-4_000_000);
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
      if (stderr.length > 400_000) stderr = stderr.slice(-400_000);
    });

    child.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({
        ok: false,
        error: {
          type: "SpawnError",
          message: `Could not start Python (${PYTHON}): ${err.message}`,
          traceback: "",
        },
        stdout,
        stderr,
        durationMs: Date.now() - started,
      });
    });

    child.on("close", () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      const trimmed = stdout.trim();
      const line = trimmed.split("\n").filter(Boolean).pop();

      if (!line) {
        resolve({
          ok: false,
          error: {
            type: "BridgeError",
            message: stderr.trim() || "The Python bridge produced no output.",
            traceback: stderr,
          },
          stdout,
          stderr,
          durationMs: Date.now() - started,
        });
        return;
      }

      try {
        const parsed = JSON.parse(line);
        parsed.stdout = parsed.stdout || stderr; // never lose stray output
        parsed.bridgeStderr = stderr && stderr !== parsed.stdout ? stderr : "";
        resolve(parsed);
      } catch {
        resolve({
          ok: false,
          error: {
            type: "BadBridgeOutput",
            message: "The Python bridge returned output that was not valid JSON.",
            traceback: `${trimmed.slice(-4000)}\n\n${stderr.slice(-4000)}`,
          },
          stdout,
          stderr,
          durationMs: Date.now() - started,
        });
      }
    });

    child.stdin.on("error", () => {
      /* the child may exit before we finish writing */
    });
    child.stdin.end(payload);
  });
}

// --------------------------------------------------------------------------- //
// System snapshot
// --------------------------------------------------------------------------- //

let lastCpu = os.cpus().map((c) => c.times);

function cpuUsage() {
  const current = os.cpus().map((c) => c.times);
  let idle = 0;
  let total = 0;
  current.forEach((times, i) => {
    const prev = lastCpu[i] || times;
    const idleDelta = times.idle - prev.idle;
    const totalDelta =
      times.user - prev.user +
      times.nice - prev.nice +
      times.sys - prev.sys +
      times.idle - prev.idle +
      times.irq - prev.irq;
    idle += idleDelta;
    total += totalDelta;
  });
  lastCpu = current;
  if (total <= 0) return 0;
  return Math.round((1 - idle / total) * 1000) / 10;
}

function diskInfo() {
  try {
    const stats = fs.statfsSync(ROOT);
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    return {
      total,
      free,
      used: total - free,
      percent: total ? Math.round(((total - free) / total) * 1000) / 10 : 0,
    };
  } catch {
    return null;
  }
}

function systemSnapshot() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptime: os.uptime(),
    node: process.version,
    python: PYTHON,
    cpu: {
      model: (os.cpus()[0] || {}).model || "Unknown CPU",
      cores: os.cpus().length,
      usage: cpuUsage(),
      load: os.loadavg().map((n) => Math.round(n * 100) / 100),
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      percent: Math.round(((totalMem - freeMem) / totalMem) * 1000) / 10,
    },
    disk: diskInfo(),
    workspace: WORKSPACE_DIR,
    toolsDir: path.resolve(ROOT, ".."),
    history: history.length,
  };
}

// --------------------------------------------------------------------------- //
// Files
// --------------------------------------------------------------------------- //

const SCOPES = {
  workspace: WORKSPACE_DIR,
  downloads: DOWNLOADS_DIR,
};

async function listFiles(scope) {
  const base = SCOPES[scope];
  if (!base) return null;
  await fsp.mkdir(base, { recursive: true });

  const results = [];
  const visit = async (dir, prefix, depth) => {
    if (depth > 3 || results.length > 500) return;
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const abs = path.join(dir, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await visit(abs, rel, depth + 1);
      } else if (entry.isFile()) {
        const stat = await fileStatSafe(abs);
        if (!stat) continue;
        results.push({
          name: entry.name,
          path: rel,
          size: stat.size,
          modified: stat.mtime.toISOString(),
          scope,
          ext: path.extname(entry.name).slice(1).toLowerCase(),
        });
      }
      if (results.length > 500) return;
    }
  };
  await visit(base, "", 0);
  results.sort((a, b) => (a.modified < b.modified ? 1 : -1));
  return results;
}

async function serveFile(res, scope, relPath) {
  const base = SCOPES[scope];
  if (!base) return sendError(res, 404, "Unknown file scope.");

  const target = safeJoin(base, relPath);
  if (!target) return sendError(res, 403, "Path escapes the allowed directory.");

  const stat = await fileStatSafe(target);
  if (!stat || !stat.isFile()) return sendError(res, 404, "File not found.");

  const ext = path.extname(target).toLowerCase();
  const inline = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".svg", ".txt", ".md", ".csv"].includes(ext);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${path.basename(target).replace(/"/g, "")}"`,
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(target).pipe(res);
}

// --------------------------------------------------------------------------- //
// Static files
// --------------------------------------------------------------------------- //

async function serveStatic(res, pathname) {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const target = safeJoin(PUBLIC_DIR, rel.split("?")[0]);
  if (!target) return sendError(res, 403, "Forbidden.");

  const stat = await fileStatSafe(target);
  if (!stat || !stat.isFile()) {
    // SPA fallback for unknown non-API routes
    const fallback = path.join(PUBLIC_DIR, "index.html");
    const fbStat = await fileStatSafe(fallback);
    if (fbStat) {
      res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
      return fs.createReadStream(fallback).pipe(res);
    }
    return sendError(res, 404, "Not found.");
  }

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300",
  });
  fs.createReadStream(target).pipe(res);
}

// --------------------------------------------------------------------------- //
// API
// --------------------------------------------------------------------------- //

async function handleApi(req, res, url) {
  const { method } = req;

  if ((url.pathname === "/api/health" || url.pathname === "/health") && method === "GET") {
    return sendJSON(res, 200, {
      ok: true,
      name: "Toolforge",
      version: "1.0.0",
      uptime: Math.round(process.uptime()),
      tools: publicRegistry().tools.length,
      heavyWorker: HEAVY_WORKER_URL ? "configured" : "local",
      time: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/tools" && method === "GET") {
    return sendJSON(res, 200, { ok: true, ...publicRegistry() });
  }

  if (url.pathname === "/api/system" && method === "GET") {
    return sendJSON(res, 200, { ok: true, ...systemSnapshot() });
  }

  if (url.pathname === "/api/history" && method === "GET") {
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, HISTORY_LIMIT);
    return sendJSON(res, 200, { ok: true, entries: history.slice(0, limit), total: history.length });
  }

  if (url.pathname === "/api/history" && method === "DELETE") {
    history = [];
    scheduleHistorySave();
    return sendJSON(res, 200, { ok: true });
  }

  if (url.pathname === "/api/files" && method === "GET") {
    const scope = url.searchParams.get("scope") || "workspace";
    const files = await listFiles(scope);
    if (!files) return sendError(res, 400, "Unknown file scope.");
    return sendJSON(res, 200, { ok: true, scope, files });
  }

  if (url.pathname === "/api/run" && method === "POST") {
    let body;
    let rawBody;
    try {
      rawBody = await readBody(req);
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (err) {
      return sendError(res, err.status || 400, err.message || "Invalid JSON body.");
    }

    const tool = toolMap.get(body.toolId);
    if (!tool) return sendError(res, 404, `Unknown tool: ${body.toolId || "(none)"}`);

    // ---------------------------------------------------------------------------
    // Route heavy tools to Koyeb worker when HEAVY_WORKER_URL is configured
    // ---------------------------------------------------------------------------
    if (HEAVY_WORKER_URL && HEAVY_TOOL_IDS.has(tool.id)) {
      console.log(`[proxy→koyeb] ${tool.id}`);
      return proxyToHeavyWorker(req, res, rawBody);
    }
    const args = body.args && typeof body.args === "object" ? body.args : {};

    // Validate required fields and coerce numbers before they reach Python.
    const cleaned = {};
    for (const field of tool.fields || []) {
      let value = args[field.name];
      if (field.type === "number" && value !== "" && value !== undefined && value !== null) {
        const num = Number(value);
        value = Number.isFinite(num) ? num : value;
      }
      if (field.type === "switch") value = Boolean(value);
      if (field.type === "list") {
        value = Array.isArray(value)
          ? value
          : String(value || "")
              .split(/\r?\n|,/)
              .map((s) => s.trim())
              .filter(Boolean);
      }
      if (value === undefined || value === null || value === "") continue;
      cleaned[field.name] = value;
    }

    const missing = (tool.fields || [])
      .filter((f) => f.required && (cleaned[f.name] === undefined || cleaned[f.name] === ""))
      .map((f) => f.label || f.name);
    if (missing.length) {
      return sendError(res, 400, `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
    }

    const result = await runPython(tool, cleaned);
    let response = result.result;
    if (result.ok && typeof tool.postProcess === "function") {
      try {
        response = tool.postProcess(response);
      } catch (err) {
        result.ok = false;
        result.error = { type: "PostProcessError", message: err.message, traceback: "" };
      }
    }

    const entry = {
      id: crypto.randomUUID(),
      toolId: tool.id,
      title: tool.title,
      category: tool.category,
      ok: Boolean(result.ok),
      timestamp: new Date().toISOString(),
      durationMs: result.durationMs || 0,
      args: cleaned,
      error: result.error || null,
      stdout: (result.stdout || "").slice(0, 8000),
      stderr: (result.stderr || "").slice(0, 4000),
    };
    recordRun(entry);

    return sendJSON(res, result.ok ? 200 : 200, {
      ok: Boolean(result.ok),
      run: entry,
      result: response,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      bridgeStderr: result.bridgeStderr || "",
      error: result.error || null,
      durationMs: result.durationMs || 0,
    });
  }

  return sendError(res, 404, `No API route for ${method} ${url.pathname}`);
}

// --------------------------------------------------------------------------- //
// Server
// --------------------------------------------------------------------------- //

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    return sendError(res, 400, "Malformed request URL.");
  }

  res.on("finish", () => {
    if (!process.env.QUIET) {
      const ms = Date.now() - started;
      console.log(`${req.method} ${url.pathname} ${res.statusCode} ${ms}ms`);
    }
  });

  try {
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }

    if (url.pathname.startsWith("/files/")) {
      const rest = url.pathname.slice("/files/".length);
      const [scope, ...parts] = rest.split("/");
      const rel = parts.join("/");
      return await serveFile(res, scope, rel);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendError(res, 405, "Method not allowed.");
    }

    return await serveStatic(res, url.pathname);
  } catch (err) {
    console.error("[server]", err);
    if (!res.headersSent) sendError(res, 500, err.message || "Internal server error.");
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  const shown = HOST === "0.0.0.0" || HOST === "::" ? "localhost" : HOST;
  console.log("");
  console.log("  ⚡ Toolforge");
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  UI       http://${shown}:${PORT}`);
  console.log(`  Tools    ${path.resolve(ROOT, "..")}`);
  console.log(`  Python   ${PYTHON}`);
  console.log(`  Bound    ${HOST}:${PORT}  (Ctrl+C to stop)`);
  console.log("");
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log("\n  Shutting down Toolforge…");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  });
}
