# ============================================================
# Toolforge – 512 MB Dual-Cloud Dockerfile
# Targets: Render.com (gateway) & Koyeb.com (heavy worker)
# Base: python:3.11-slim-bookworm
# Node.js: 20 LTS  |  Port: 7860 (Render/Koyeb/HF default)
# ============================================================

FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Prevent Python malloc from hoarding fragmented arenas (saves ~30 MB idle)
    MALLOC_ARENA_MAX=2 \
    # Cap Node.js old-space so it never spikes past 128 MB on a 512 MB box
    NODE_OPTIONS="--max-old-space-size=128" \
    PORT=7860 \
    HOST=0.0.0.0 \
    # FastAPI sidecar running on the same container (gateway role only)
    FASTAPI_URL=http://127.0.0.1:8000 \
    # Heavy worker on Koyeb — set this env var on Render dashboard
    # HEAVY_WORKER_URL=https://your-app.koyeb.app
    # Use /tmp instead of /dev/shm (shm capped at 64 MB on free clouds)
    JOB_RAM_DIR=/tmp/sword_jobs \
    NODE_ENV=production

# --- System packages ---
# Strip X11/LibreOffice entirely; use pure-Python doc tools instead
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    # OCR (English + Bangla — heavy worker only; comment out on gateway)
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-ben \
    # Media processing — heavy worker only
    ffmpeg \
    yt-dlp \
    # Archive tools
    p7zip-full \
    unzip \
    # Pillow / OpenCV native deps
    libgl1 \
    libglib2.0-0 \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python deps (install before COPY . . for layer caching) ---
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Node deps ---
COPY package.json ./
RUN npm install --omit=dev --prefix /app/server 2>/dev/null || true && \
    npm cache clean --force 2>/dev/null || true

# --- App source ---
COPY . .
RUN chmod +x /app/start.sh 2>/dev/null || true

# --- Create job temp dir ---
RUN mkdir -p /tmp/sword_jobs && chmod 777 /tmp/sword_jobs

# --- HF Space metadata (ignored by Render/Koyeb) ---
# title: Toolforge
# emoji: ⚡
# sdk: docker
# pinned: false

EXPOSE 7860

# --- Health check ---
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:7860/api/health || exit 1

CMD ["/app/start.sh"]
