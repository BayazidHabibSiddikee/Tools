"""
Toolforge Heavy Worker — FastAPI (Koyeb.com)
============================================
Handles CPU/memory-intensive tools that would OOM a 512 MB gateway:
  - OCR scan (tesseract)
  - YouTube download (yt-dlp)
  - YouTube transcript
  - PDF ↔ DOCX conversion (PyMuPDF / pdf2docx)

Render proxies /api/run requests for HEAVY_TOOL_IDS here.
X-Origin-Secret header is verified for every request.

Run:
    TOOLFORGE_ROLE=worker uvicorn worker:app --host 0.0.0.0 --port 7860
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import traceback
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

# ── Config ──────────────────────────────────────────────────────────────────
ORIGIN_SECRET = os.environ.get("ORIGIN_SECRET", "")
JOB_DIR = Path(os.environ.get("JOB_RAM_DIR", "/tmp/sword_jobs"))
JOB_DIR.mkdir(parents=True, exist_ok=True)

# Cap PIL image pixels to prevent OOM on 512 MB
try:
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = 12_000_000
except ImportError:
    pass

# Semaphore: at most 1 heavy job at once (protects 0.1 vCPU Koyeb free tier)
_SEM = asyncio.Semaphore(1)

# Add tools directory to path so bridge imports work
TOOLS_DIR = Path(__file__).parent
for _p in [str(TOOLS_DIR), str(TOOLS_DIR.parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Toolforge Heavy Worker", docs_url=None, redoc_url=None)


@app.get("/health")
async def health():
    return {"ok": True, "role": "worker", "time": time.time()}


@app.post("/api/run")
async def run_tool(request: Request):
    # Verify shared secret from Render gateway
    if ORIGIN_SECRET:
        secret = request.headers.get("X-Origin-Secret", "")
        if secret != ORIGIN_SECRET:
            raise HTTPException(status_code=403, detail="Forbidden")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    tool_id: str = body.get("toolId", "")
    args: dict = body.get("args", {}) or {}

    # Import bridge encode helper
    try:
        from server.bridge import encode  # type: ignore
    except ImportError:
        from bridge import encode  # type: ignore

    async with _SEM:
        return JSONResponse(await _dispatch(tool_id, args, encode))


async def _dispatch(tool_id: str, args: dict, encode) -> dict:
    """Route tool_id to the right Python function and return a bridge-style response."""
    started = time.perf_counter()

    def _run() -> Any:
        """Blocking call — runs in executor so we don't stall the event loop."""
        if tool_id == "ocr-scan":
            from office_tools import ocr_scan  # type: ignore
            return ocr_scan(**args)

        if tool_id in ("yt-dl", "youtube-download"):
            from doc_tools import youtube_download  # type: ignore
            return youtube_download(**args)

        if tool_id == "youtube-transcript":
            from knowledge_hub import youtube_transcript  # type: ignore
            return youtube_transcript(**args)

        if tool_id == "pdf-to-docx":
            from office_tools import pdf_to_docx  # type: ignore
            return pdf_to_docx(**args)

        if tool_id == "docx-to-pdf":
            from office_tools import docx_to_pdf  # type: ignore
            return docx_to_pdf(**args)

        raise ValueError(f"Unknown heavy tool: {tool_id!r}")

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, _run)
        return {
            "ok": True,
            "result": encode(result),
            "durationMs": round((time.perf_counter() - started) * 1000, 2),
            "stdout": "",
            "stderr": "",
            "error": None,
        }
    except Exception as exc:
        return {
            "ok": False,
            "result": None,
            "durationMs": round((time.perf_counter() - started) * 1000, 2),
            "stdout": "",
            "stderr": "",
            "error": {
                "type": type(exc).__name__,
                "message": str(exc),
                "traceback": traceback.format_exc()[-4000:],
            },
        }
