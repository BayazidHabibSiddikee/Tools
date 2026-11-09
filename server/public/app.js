/* ==============================================================================
   Toolforge Global Interactive Engine (app.js)
   Zero external dependencies. High performance hash router & form generator.
   ============================================================================== */

"use strict";

(function () {
  const STATE = {
    registry: { categories: [], tools: [] },
    toolMap: new Map(),
    currentView: "dashboard",
    currentTool: null,
    history: [],
    theme: localStorage.getItem("tf_theme") || "dark",
    scope: "workspace",
    systemPollTimer: null,
    cpuHistory: [10, 15, 20, 18, 25, 22, 19, 30],
  };

  // DOM Elements
  const DOM = {
    app: document.querySelector(".app"),
    sidebar: document.getElementById("sidebar"),
    scrim: document.getElementById("scrim"),
    menuBtn: document.getElementById("menuBtn"),
    themeBtn: document.getElementById("themeBtn"),
    themeIcon: document.getElementById("themeIcon"),
    crumbs: document.getElementById("crumbs"),
    searchBtn: document.getElementById("searchBtn"),
    palette: document.getElementById("palette"),
    paletteInput: document.getElementById("paletteInput"),
    paletteResults: document.getElementById("paletteResults"),
    toasts: document.getElementById("toasts"),
    navItems: document.querySelectorAll(".nav-item"),
    categoryNav: document.getElementById("categoryNav"),
    navToolCount: document.getElementById("navToolCount"),
    heroCount: document.getElementById("heroCount"),
    heroRepeat: document.getElementById("heroRepeat"),
    // Views
    views: {
      dashboard: document.getElementById("view-dashboard"),
      tools: document.getElementById("view-tools"),
      run: document.getElementById("view-run"),
      files: document.getElementById("view-files"),
      history: document.getElementById("view-history"),
    },
    // Dashboard Stats
    statTools: document.getElementById("statTools"),
    statCpu: document.getElementById("statCpu"),
    statMem: document.getElementById("statMem"),
    statDisk: document.getElementById("statDisk"),
    heroHost: document.getElementById("heroHost"),
    heroCpu: document.getElementById("heroCpu"),
    heroUptime: document.getElementById("heroUptime"),
    heroLoad: document.getElementById("heroLoad"),
    heroMem: document.getElementById("heroMem"),
    heroDisk: document.getElementById("heroDisk"),
    heroNode: document.getElementById("heroNode"),
    sparkArea: document.getElementById("sparkArea"),
    sparkLineEl: document.getElementById("sparkLineEl"),
    quickGrid: document.getElementById("quickGrid"),
    recentList: document.getElementById("recentList"),
    // Tools View
    toolSearch: document.getElementById("toolSearch"),
    categoryChips: document.getElementById("categoryChips"),
    toolGrid: document.getElementById("toolGrid"),
    // Run View
    runTitle: document.getElementById("runTitle"),
    runDesc: document.getElementById("runDesc"),
    runModule: document.getElementById("runModule"),
    runFunction: document.getElementById("runFunction"),
    runCategory: document.getElementById("runCategory"),
    runIcon: document.getElementById("runIcon"),
    runForm: document.getElementById("runForm"),
    runFields: document.getElementById("runFields"),
    runSubmit: document.getElementById("runSubmit"),
    runState: document.getElementById("runState"),
    runOutput: document.getElementById("runOutput"),
    copyOutput: document.getElementById("copyOutput"),
    resetForm: document.getElementById("resetForm"),
    // Files View
    filePanel: document.getElementById("filePanel"),
    scopeTabs: document.getElementById("scopeTabs"),
    refreshFiles: document.getElementById("refreshFiles"),
    // History View
    historyPanel: document.getElementById("historyPanel"),
    clearHistory: document.getElementById("clearHistory"),
    // Modal
    tipBtn: document.getElementById("tipBtn"),
    supportModal: document.getElementById("supportModal"),
    btcAddress: document.getElementById("btcAddress"),
    copyBtcBtn: document.getElementById("copyBtcBtn"),
  };

  // ---------------------------------------------------------------------------
  // Notifications / Toasts
  // ---------------------------------------------------------------------------
  function showToast(title, message, type = "info", duration = 3500) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const iconName = type === "ok" ? "#i-check" : type === "err" ? "#i-x" : "#i-spark";
    toast.innerHTML = `
      <div class="toast-icon"><svg class="icon"><use href="${iconName}"/></svg></div>
      <div class="toast-body">
        <strong>${escapeHtml(title)}</strong>
        ${message ? `<span>${escapeHtml(message)}</span>` : ""}
      </div>
    `;
    DOM.toasts.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("out");
      toast.addEventListener("animationend", () => toast.remove());
    }, duration);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------------------------------------------------------------------------
  // Theme Management
  // ---------------------------------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    STATE.theme = theme;
    localStorage.setItem("tf_theme", theme);
    if (DOM.themeIcon) {
      DOM.themeIcon.innerHTML = `<use href="${theme === 'dark' ? '#i-moon' : '#i-sun'}"/>`;
    }
  }

  // ---------------------------------------------------------------------------
  // API Fetch Utilities
  // ---------------------------------------------------------------------------
  async function fetchJson(endpoint, options = {}) {
    try {
      const res = await fetch(endpoint, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Application Routing & Views
  // ---------------------------------------------------------------------------
  function setRoute(hash) {
    window.location.hash = hash;
  }

  function handleRoute() {
    const raw = (window.location.hash || "#/dashboard").slice(1);
    const [path, queryString] = raw.split("?");
    const params = new URLSearchParams(queryString || "");

    // Close mobile nav drawer
    DOM.app.classList.remove("nav-open");
    DOM.scrim.hidden = true;

    if (path.startsWith("/tool/")) {
      const toolId = path.replace("/tool/", "").trim();
      openToolView(toolId);
      return;
    }

    const viewName = path.replace("/", "").trim() || "dashboard";
    switchView(viewName, params);
  }

  function switchView(viewName, params = new URLSearchParams()) {
    if (!DOM.views[viewName]) viewName = "dashboard";
    STATE.currentView = viewName;

    // Toggle active containers
    Object.keys(DOM.views).forEach((v) => {
      DOM.views[v].hidden = v !== viewName;
    });

    // Update nav active classes
    DOM.navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.nav === viewName);
    });

    // Update breadcrumbs
    renderBreadcrumbs(viewName);

    if (viewName === "dashboard") {
      updateDashboardData();
    } else if (viewName === "tools") {
      const cat = params.get("cat");
      renderToolGrid(cat);
    } else if (viewName === "files") {
      loadFiles(STATE.scope);
    } else if (viewName === "history") {
      loadHistory();
    }
  }

  function renderBreadcrumbs(viewName, subItem = null) {
    const crumbs = [`<a href="#/dashboard">Toolforge</a>`];
    if (viewName === "tools") {
      crumbs.push(`<span>Tools</span>`);
    } else if (viewName === "run" && subItem) {
      crumbs.push(`<a href="#/tools">Tools</a>`);
      crumbs.push(`<span>${escapeHtml(subItem.title)}</span>`);
    } else if (viewName === "files") {
      crumbs.push(`<span>Files &amp; Artifacts</span>`);
    } else if (viewName === "history") {
      crumbs.push(`<span>Execution History</span>`);
    } else {
      crumbs.push(`<span>Dashboard</span>`);
    }
    DOM.crumbs.innerHTML = crumbs.join(`<span class="crumb-sep">/</span>`);
  }

  // ---------------------------------------------------------------------------
  // Initial Boot & Tool Registry
  // ---------------------------------------------------------------------------
  async function initApp() {
    try {
      const data = await fetchJson("/api/tools");
      STATE.registry = data;
      STATE.toolMap = new Map((data.tools || []).map((t) => [t.id, t]));

      renderCategories(data.categories || []);
      DOM.navToolCount.textContent = data.tools.length;
      DOM.heroCount.textContent = data.tools.length;
      DOM.statTools.textContent = data.tools.length;

      // Start periodic health polling
      pollSystemSnapshot();
      STATE.systemPollTimer = setInterval(pollSystemSnapshot, 8000);

      // Handle Route
      handleRoute();
      loadHistory(true);
    } catch (err) {
      showToast("Connection Error", "Failed to reach toolforge backend API.", "err");
    }
  }

  function renderCategories(categories) {
    DOM.categoryNav.innerHTML = categories
      .map(
        (c) => `
        <a class="cat-link" href="#/tools?cat=${encodeURIComponent(c.id)}">
          <span class="cat-dot" style="background:${c.accent || '#8b9cff'}"></span>
          <span>${escapeHtml(c.name)}</span>
        </a>
      `
      )
      .join("");
  }

  // ---------------------------------------------------------------------------
  // Dashboard & Metrics
  // ---------------------------------------------------------------------------
  async function pollSystemSnapshot() {
    try {
      const data = await fetchJson("/api/system");
      if (DOM.statCpu) DOM.statCpu.textContent = `${data.cpu.usage}%`;
      if (DOM.heroCpu) DOM.heroCpu.textContent = `${data.cpu.usage}%`;
      if (DOM.statMem) DOM.statMem.textContent = `${data.memory.percent}%`;
      if (DOM.heroMem) DOM.heroMem.textContent = `${Math.round(data.memory.used / 1024 / 1024)}MB / ${Math.round(data.memory.total / 1024 / 1024)}MB`;
      if (DOM.heroHost) DOM.heroHost.textContent = data.hostname || "127.0.0.1";
      if (DOM.heroNode) DOM.heroNode.textContent = data.node || "v26.x";
      if (DOM.heroUptime) DOM.heroUptime.textContent = `uptime ${Math.round(data.uptime / 60)}m`;
      if (DOM.heroLoad) DOM.heroLoad.textContent = `load ${data.cpu.load[0] || '0.0'}`;

      if (data.disk) {
        const diskPct = `${data.disk.percent}%`;
        if (DOM.statDisk) DOM.statDisk.textContent = diskPct;
        if (DOM.heroDisk) DOM.heroDisk.textContent = `${Math.round(data.disk.used / 1e9)}GB (${diskPct})`;
      }

      // Sparkline visualization
      STATE.cpuHistory.push(data.cpu.usage);
      if (STATE.cpuHistory.length > 16) STATE.cpuHistory.shift();
      drawSparkline(STATE.cpuHistory);
    } catch (e) {
      // Offline or transient error
    }
  }

  function drawSparkline(points) {
    if (!DOM.sparkArea || !DOM.sparkLineEl) return;
    const width = 220;
    const height = 56;
    const max = Math.max(100, ...points);
    const step = width / (points.length - 1);

    const coords = points.map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    DOM.sparkLineEl.setAttribute("points", coords.join(" "));
    DOM.sparkArea.setAttribute(
      "d",
      `M0,${height} L${coords.join(" L")} L${width},${height} Z`
    );
  }

  function updateDashboardData() {
    // Render quick tools
    const featuredIds = ["calculator", "crypto-price", "docx-to-pdf", "qr-code", "web-search", "translate"];
    const featured = featuredIds
      .map((id) => STATE.toolMap.get(id))
      .filter(Boolean);

    DOM.quickGrid.innerHTML = featured
      .map(
        (t) => `
        <a class="quick-card" href="#/tool/${encodeURIComponent(t.id)}">
          <div class="quick-icon"><svg class="icon"><use href="#i-${t.icon || 'tools'}"/></svg></div>
          <div>
            <strong>${escapeHtml(t.title)}</strong>
            <p>${escapeHtml(t.description)}</p>
          </div>
        </a>
      `
      )
      .join("");
  }

  // ---------------------------------------------------------------------------
  // Tools Exploration & Filtering
  // ---------------------------------------------------------------------------
  function renderToolGrid(activeCategory = null) {
    const filterText = (DOM.toolSearch.value || "").toLowerCase().trim();

    // Render Category Filter Chips
    const chips = [
      `<button class="chip ${!activeCategory ? 'active' : ''}" data-cat="">All (${STATE.registry.tools.length})</button>`
    ];
    (STATE.registry.categories || []).forEach((c) => {
      const isSelected = activeCategory === c.id;
      chips.push(
        `<button class="chip ${isSelected ? 'active' : ''}" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>`
      );
    });
    DOM.categoryChips.innerHTML = chips.join("");

    // Filter tools
    const tools = STATE.registry.tools.filter((t) => {
      const matchesCat = !activeCategory || t.category === activeCategory;
      const matchesQuery =
        !filterText ||
        t.title.toLowerCase().includes(filterText) ||
        t.description.toLowerCase().includes(filterText) ||
        t.module.toLowerCase().includes(filterText);
      return matchesCat && matchesQuery;
    });

    if (tools.length === 0) {
      DOM.toolGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 48px;">
          <span class="empty-icon"><svg class="icon"><use href="#i-search"/></svg></span>
          <h3>No matching utilities found</h3>
          <p>Try searching for a different keyword or select another category filter.</p>
        </div>
      `;
      return;
    }

    DOM.toolGrid.innerHTML = tools
      .map(
        (t) => `
        <a class="tool-card" href="#/tool/${encodeURIComponent(t.id)}">
          <div class="tool-card-head">
            <span class="tool-icon"><svg class="icon"><use href="#i-${t.icon || 'tools'}"/></svg></span>
            <span class="tag">${escapeHtml(t.category)}</span>
          </div>
          <h3>${escapeHtml(t.title)}</h3>
          <p>${escapeHtml(t.description)}</p>
          <div class="tool-card-foot">
            <span class="mono">${escapeHtml(t.module)}.${escapeHtml(t.function)}</span>
            <svg class="icon arrow"><use href="#i-arrow-right"/></svg>
          </div>
        </a>
      `
      )
      .join("");
  }

  // ---------------------------------------------------------------------------
  // Tool Execution Engine
  // ---------------------------------------------------------------------------
  function openToolView(toolId) {
    const tool = STATE.toolMap.get(toolId);
    if (!tool) {
      showToast("Tool Not Found", `Utility ID '${toolId}' is not registered.`, "err");
      setRoute("#/tools");
      return;
    }

    STATE.currentTool = tool;
    STATE.currentView = "run";

    Object.keys(DOM.views).forEach((v) => {
      DOM.views[v].hidden = v !== "run";
    });

    renderBreadcrumbs("run", tool);

    // Update Header
    DOM.runTitle.textContent = tool.title;
    DOM.runDesc.textContent = tool.description;
    DOM.runModule.textContent = tool.module;
    DOM.runFunction.textContent = tool.function;
    DOM.runCategory.textContent = tool.category;
    DOM.runIcon.innerHTML = `<svg class="icon"><use href="#i-${tool.icon || 'spark'}"/></svg>`;

    // Generate Form
    renderToolForm(tool);

    // Clear output
    DOM.runState.innerHTML = `<span class="dot"></span>Idle`;
    DOM.runOutput.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon"><svg class="icon"><use href="#i-terminal"/></svg></span>
        <h3>Ready to run</h3>
        <p>Adjust parameters and click <strong>Run tool</strong>.</p>
      </div>
    `;
    DOM.copyOutput.disabled = true;
  }

  function renderToolForm(tool) {
    DOM.runFields.innerHTML = (tool.fields || [])
      .map((field) => {
        const id = `field_${field.name}`;
        let inputHtml = "";
        const reqAttr = field.required ? "required" : "";

        if (field.type === "textarea") {
          inputHtml = `<textarea id="${id}" name="${field.name}" rows="${field.rows || 4}" placeholder="${escapeHtml(field.placeholder || '')}" ${reqAttr}>${escapeHtml(field.default || '')}</textarea>`;
        } else if (field.type === "select") {
          const opts = (field.options || [])
            .map((opt) => `<option value="${escapeHtml(opt.value)}" ${opt.value === field.default ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`)
            .join("");
          inputHtml = `<select id="${id}" name="${field.name}" ${reqAttr}>${opts}</select>`;
        } else if (field.type === "switch") {
          inputHtml = `
            <label class="switch-wrap">
              <input type="checkbox" id="${id}" name="${field.name}" ${field.default ? 'checked' : ''} />
              <span class="switch-slider"></span>
            </label>
          `;
        } else {
          // text, number, list
          const type = field.type === "number" ? "number" : "text";
          const step = field.step ? `step="${field.step}"` : "";
          const min = field.min !== undefined ? `min="${field.min}"` : "";
          const max = field.max !== undefined ? `max="${field.max}"` : "";
          inputHtml = `<input type="${type}" id="${id}" name="${field.name}" value="${escapeHtml(field.default !== undefined ? field.default : '')}" placeholder="${escapeHtml(field.placeholder || '')}" ${step} ${min} ${max} ${reqAttr} />`;
        }

        return `
          <div class="field-group">
            <label for="${id}">
              ${escapeHtml(field.label)}
              ${field.required ? '<span class="req">*</span>' : ''}
            </label>
            ${inputHtml}
            ${field.help ? `<small class="field-help">${escapeHtml(field.help)}</small>` : ''}
          </div>
        `;
      })
      .join("");
  }

  async function executeCurrentTool(e) {
    if (e) e.preventDefault();
    const tool = STATE.currentTool;
    if (!tool) return;

    const formData = new FormData(DOM.runForm);
    const args = {};

    (tool.fields || []).forEach((field) => {
      if (field.type === "switch") {
        args[field.name] = formData.has(field.name);
      } else {
        const val = formData.get(field.name);
        args[field.name] = val !== null ? val : "";
      }
    });

    DOM.runSubmit.disabled = true;
    DOM.runState.innerHTML = `<span class="dot pulse"></span>Running…`;

    const startTime = performance.now();
    try {
      const response = await fetchJson("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, args }),
      });

      const elapsed = (performance.now() - startTime).toFixed(1);
      renderExecutionOutput(response, elapsed);
      showToast("Execution Complete", `${tool.title} finished in ${elapsed}ms`, response.ok ? "ok" : "err");
      loadHistory(true);
    } catch (err) {
      renderExecutionOutput({ ok: false, error: { message: err.message } }, 0);
      showToast("Execution Failed", err.message, "err");
    } finally {
      DOM.runSubmit.disabled = false;
    }
  }

  function renderExecutionOutput(data, elapsedMs) {
    DOM.copyOutput.disabled = false;
    DOM.copyOutput.dataset.payload = JSON.stringify(data, null, 2);

    if (!data.ok) {
      DOM.runState.innerHTML = `<span class="dot err"></span>Error`;
      DOM.runOutput.innerHTML = `
        <div class="result-error">
          <h4>Execution Failed (${data.error?.type || 'Error'})</h4>
          <p>${escapeHtml(data.error?.message || 'An unknown error occurred.')}</p>
          ${data.error?.traceback ? `<pre class="traceback">${escapeHtml(data.error.traceback)}</pre>` : ''}
        </div>
      `;
      return;
    }

    DOM.runState.innerHTML = `<span class="dot ok"></span>Success (${elapsedMs || data.durationMs}ms)`;

    // Check if result is an image or bytes
    if (typeof data.result === "string" && data.result.startsWith("data:image/")) {
      DOM.runOutput.innerHTML = `
        <div class="result-img-box">
          <img src="${data.result}" alt="Generated Output" style="max-width: 100%; border-radius: 8px;" />
        </div>
      `;
      return;
    }

    // Tabular representation if array of objects
    if (Array.isArray(data.result) && data.result.length > 0 && typeof data.result[0] === "object") {
      const headers = Object.keys(data.result[0]);
      DOM.runOutput.innerHTML = `
        <div class="result-table-wrap">
          <table class="data-table">
            <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
            <tbody>
              ${data.result.slice(0, 100).map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(String(row[h] !== undefined ? row[h] : ''))}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    // Standard formatted string or JSON
    const display = typeof data.result === "object" ? JSON.stringify(data.result, null, 2) : String(data.result || "No return value.");
    DOM.runOutput.innerHTML = `
      <pre class="result-code"><code>${escapeHtml(display)}</code></pre>
      ${data.stdout ? `<div class="stdout-box"><h5>Console Output (stdout)</h5><pre>${escapeHtml(data.stdout)}</pre></div>` : ''}
    `;
  }

  // ---------------------------------------------------------------------------
  // Workspace File Management
  // ---------------------------------------------------------------------------
  async function loadFiles(scope = "workspace") {
    STATE.scope = scope;
    DOM.filePanel.innerHTML = `<div class="loading-state">Loading ${scope} files…</div>`;

    try {
      const data = await fetchJson(`/api/files?scope=${encodeURIComponent(scope)}`);
      const files = data.files || [];

      if (files.length === 0) {
        DOM.filePanel.innerHTML = `
          <div class="empty-state" style="padding: 48px;">
            <span class="empty-icon"><svg class="icon"><use href="#i-folder"/></svg></span>
            <h3>No files found in ${scope}</h3>
            <p>Run document or archive tools to create artifacts here.</p>
          </div>
        `;
        return;
      }

      DOM.filePanel.innerHTML = `
        <div class="file-list">
          ${files
            .map(
              (f) => `
            <div class="file-row">
              <span class="file-icon"><svg class="icon"><use href="#i-file"/></svg></span>
              <div class="file-info">
                <strong>${escapeHtml(f.name)}</strong>
                <span class="mono file-meta">${formatBytes(f.size)} · ${new Date(f.modified).toLocaleDateString()}</span>
              </div>
              <a class="btn ghost compact" href="/api/files/download?scope=${scope}&path=${encodeURIComponent(f.path)}" download="${escapeHtml(f.name)}">
                <svg class="icon"><use href="#i-download"/></svg> Download
              </a>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } catch (err) {
      DOM.filePanel.innerHTML = `<div class="empty-state"><p class="err">${escapeHtml(err.message)}</p></div>`;
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------
  async function loadHistory(silent = false) {
    try {
      const data = await fetchJson("/api/history?limit=50");
      STATE.history = data.entries || [];

      if (DOM.recentList) {
        if (STATE.history.length === 0) {
          DOM.recentList.innerHTML = `<p class="subtle" style="padding: 16px 0;">No tools have been run yet.</p>`;
        } else {
          DOM.recentList.innerHTML = STATE.history
            .slice(0, 5)
            .map(
              (h) => `
              <div class="recent-item">
                <span class="status-indicator ${h.ok ? 'ok' : 'err'}"></span>
                <div>
                  <strong>${escapeHtml(h.title)}</strong>
                  <span class="mono subtle">${new Date(h.timestamp).toLocaleTimeString()} (${h.durationMs}ms)</span>
                </div>
              </div>
            `
            )
            .join("");
        }
      }

      if (STATE.currentView === "history" && DOM.historyPanel) {
        if (STATE.history.length === 0) {
          DOM.historyPanel.innerHTML = `
            <div class="empty-state" style="padding: 48px;">
              <span class="empty-icon"><svg class="icon"><use href="#i-clock"/></svg></span>
              <h3>No run history</h3>
              <p>Execute utilities to build a local activity timeline.</p>
            </div>
          `;
          return;
        }

        DOM.historyPanel.innerHTML = `
          <div class="history-list">
            ${STATE.history
              .map(
                (h) => `
              <div class="history-row">
                <span class="status-indicator ${h.ok ? 'ok' : 'err'}"></span>
                <div class="history-content">
                  <strong>${escapeHtml(h.title)}</strong>
                  <span class="mono subtle">${new Date(h.timestamp).toLocaleString()} · ${h.durationMs}ms</span>
                </div>
                <span class="tag">${escapeHtml(h.category)}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      }
    } catch (e) {
      if (!silent) showToast("History Error", "Could not load history.", "err");
    }
  }

  // ---------------------------------------------------------------------------
  // Command Palette (Ctrl+K / Cmd+K)
  // ---------------------------------------------------------------------------
  function openPalette() {
    DOM.palette.hidden = false;
    DOM.paletteInput.value = "";
    DOM.paletteInput.focus();
    renderPaletteResults("");
  }

  function closePalette() {
    DOM.palette.hidden = true;
  }

  function renderPaletteResults(query) {
    const q = query.toLowerCase().trim();
    const tools = (STATE.registry.tools || []).filter(
      (t) => !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );

    if (tools.length === 0) {
      DOM.paletteResults.innerHTML = `<div class="palette-empty">No matching tools or pages.</div>`;
      return;
    }

    DOM.paletteResults.innerHTML = tools
      .slice(0, 8)
      .map(
        (t, idx) => `
        <div class="palette-item ${idx === 0 ? 'selected' : ''}" data-tool="${encodeURIComponent(t.id)}">
          <div class="palette-item-icon"><svg class="icon"><use href="#i-${t.icon || 'tools'}"/></svg></div>
          <div class="palette-item-text">
            <strong>${escapeHtml(t.title)}</strong>
            <span>${escapeHtml(t.description)}</span>
          </div>
          <span class="palette-kind">${escapeHtml(t.category)}</span>
        </div>
      `
      )
      .join("");
  }

  // ---------------------------------------------------------------------------
  // Event Listeners Wiring
  // ---------------------------------------------------------------------------
  window.addEventListener("hashchange", handleRoute);

  DOM.themeBtn?.addEventListener("click", () => {
    applyTheme(STATE.theme === "dark" ? "light" : "dark");
  });

  DOM.menuBtn?.addEventListener("click", () => {
    DOM.app.classList.toggle("nav-open");
    DOM.scrim.hidden = !DOM.app.classList.contains("nav-open");
  });

  DOM.scrim?.addEventListener("click", () => {
    DOM.app.classList.remove("nav-open");
    DOM.scrim.hidden = true;
  });

  DOM.searchBtn?.addEventListener("click", openPalette);

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      if (DOM.palette.hidden) openPalette();
      else closePalette();
    } else if (e.key === "Escape") {
      closePalette();
      if (DOM.supportModal) DOM.supportModal.hidden = true;
    }
  });

  DOM.paletteInput?.addEventListener("input", (e) => renderPaletteResults(e.target.value));

  DOM.paletteResults?.addEventListener("click", (e) => {
    const item = e.target.closest(".palette-item");
    if (!item) return;
    const toolId = decodeURIComponent(item.dataset.tool);
    closePalette();
    setRoute(`#/tool/${toolId}`);
  });

  DOM.palette?.querySelector("[data-close-palette]")?.addEventListener("click", closePalette);

  DOM.toolSearch?.addEventListener("input", () => {
    const activeChip = DOM.categoryChips.querySelector(".chip.active");
    renderToolGrid(activeChip ? activeChip.dataset.cat : null);
  });

  DOM.categoryChips?.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    DOM.categoryChips.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderToolGrid(btn.dataset.cat);
  });

  DOM.runForm?.addEventListener("submit", executeCurrentTool);

  DOM.copyOutput?.addEventListener("click", () => {
    const payload = DOM.copyOutput.dataset.payload;
    if (payload) {
      navigator.clipboard.writeText(payload);
      showToast("Copied", "Result copied to clipboard.", "ok");
    }
  });

  DOM.scopeTabs?.addEventListener("click", (e) => {
    const tab = e.target.closest("button");
    if (!tab) return;
    DOM.scopeTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    tab.classList.add("active");
    loadFiles(tab.dataset.scope);
  });

  DOM.refreshFiles?.addEventListener("click", () => loadFiles(STATE.scope));

  DOM.clearHistory?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear your local run history?")) {
      await fetchJson("/api/history", { method: "DELETE" });
      loadHistory();
      showToast("History Cleared", "Local execution log removed.", "ok");
    }
  });

  // Tip / Support Modal Wiring
  DOM.tipBtn?.addEventListener("click", () => {
    if (DOM.supportModal) DOM.supportModal.hidden = false;
  });

  DOM.supportModal?.querySelector(".modal-close")?.addEventListener("click", () => {
    if (DOM.supportModal) DOM.supportModal.hidden = true;
  });

  DOM.supportModal?.querySelector(".modal-scrim")?.addEventListener("click", () => {
    if (DOM.supportModal) DOM.supportModal.hidden = true;
  });

  DOM.copyBtcBtn?.addEventListener("click", () => {
    const addr = DOM.btcAddress?.textContent;
    if (addr) {
      navigator.clipboard.writeText(addr.trim());
      showToast("Address Copied", "Bitcoin address copied to clipboard.", "ok");
    }
  });

  // Apply Initial Theme
  applyTheme(STATE.theme);

  // Initialize
  initApp();
})();
