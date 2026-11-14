#!/bin/bash
# ============================================================
# Toolforge start.sh — dual-process launcher
# Starts the Node.js gateway (port $PORT) and optionally a
# FastAPI heavy worker (port 8000) on the same container.
#
# Role is controlled by the TOOLFORGE_ROLE env var:
#   gateway  — Node.js only (Render.com, default)
#   worker   — FastAPI only (Koyeb.com heavy worker)
#   full     — both on same container (local dev / HF Spaces)
# ============================================================

set -euo pipefail

ROLE="${TOOLFORGE_ROLE:-full}"
PORT="${PORT:-7860}"
FASTAPI_PORT="${FASTAPI_PORT:-8000}"
JOB_DIR="${JOB_RAM_DIR:-/tmp/sword_jobs}"

mkdir -p "$JOB_DIR"
echo "⚡ Toolforge starting — role=$ROLE port=$PORT"

# --- FastAPI heavy worker ---
start_worker() {
    echo "  🐍 Starting FastAPI heavy worker on :$FASTAPI_PORT …"
    exec uvicorn worker:app \
        --host 127.0.0.1 \
        --port "$FASTAPI_PORT" \
        --workers 1 \
        --timeout-keep-alive 30 \
        --log-level warning
}

# --- Node.js gateway ---
start_gateway() {
    echo "  🟢 Starting Node.js gateway on :$PORT …"
    exec node /app/server/index.js
}

case "$ROLE" in
  worker)
    start_worker
    ;;
  gateway)
    start_gateway
    ;;
  full|*)
    # Start FastAPI in background, then Node.js in foreground
    # FastAPI sidecar handles heavy tools locally (no Koyeb needed for local dev)
    if command -v uvicorn &>/dev/null && [ -f /app/worker.py ]; then
        uvicorn worker:app \
            --host 127.0.0.1 \
            --port "$FASTAPI_PORT" \
            --workers 1 \
            --timeout-keep-alive 30 \
            --log-level warning &
        WORKER_PID=$!
        echo "  🐍 FastAPI worker PID=$WORKER_PID"
        # Wait up to 5s for FastAPI to be ready
        for i in $(seq 1 10); do
            curl -sf "http://127.0.0.1:$FASTAPI_PORT/health" >/dev/null 2>&1 && break
            sleep 0.5
        done
    fi
    start_gateway
    ;;
esac
