# ============================================================
# Toolforge – HuggingFace Spaces Dockerfile
# ============================================================
# Base: python:3.12-slim  (official slim image, ~125 MB)
# Node.js: 20.x LTS (via NodeSource)
# Port: 7860 (HuggingFace default; maps to our PORT env var)
#
# Deploy steps:
#   1. Push this repo to a HuggingFace Space (Docker SDK)
#   2. HF builds this image automatically on each push
#   3. Space runs the Node.js server on port 7860
#   4. Set HOST=0.0.0.0 so HF can reach the container
# ============================================================

FROM python:3.12-slim

# --- System packages ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    libmagic1 \
    # For pypdf / pillow native deps
    libgomp1 \
    # For folium/matplotlib headless
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# --- Node.js 20 LTS ---
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# --- Python deps ---
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- App source ---
COPY . .

# --- Expose HuggingFace default port ---
EXPOSE 7860

# --- Runtime environment ---
ENV PORT=7860
ENV HOST=0.0.0.0
ENV NODE_ENV=production
# Point app.js to self (relative) — no cross-origin needed when frontend
# and backend are on the same HF Space container.
# If you split Vercel (frontend) + HF (backend), set this in index.html:
#   <script>window.TF_API_BASE = 'https://your-username-toolforge.hf.space'</script>

# --- Health check ---
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:7860/api/health || exit 1

# --- Start ---
CMD ["node", "server/index.js"]
