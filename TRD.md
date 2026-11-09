# Technical Requirements Document (TRD)
## Project Name: Toolforge Architecture & Zero-Cost Cloud Deployment

### 1. Architectural Stack

```mermaid
graph TD
    Client[Web Browser / Mobile Client] -->|HTTPS Requests| CDN[Vercel Edge / Cloudflare CDN]
    CDN -->|Static Files HTML/CSS/JS| Vercel[Vercel Serverless Frontend]
    CDN -->|API Proxy /api/run/*| HF[Hugging Face Spaces / Railway Worker]
    
    subgraph Worker Container [Free Docker Worker (2 vCPU, 16 GB RAM)]
        NodeEntry[Node.js Gateway Port 7860]
        PythonBridge[Python 3.12 + FastAPI / Bridge Worker]
        SemLock[Concurrency Semaphore: max_jobs=2]
        RamDisk[In-Memory RAM Disk /dev/shm]
        
        NodeEntry --> PythonBridge
        PythonBridge --> SemLock
        SemLock --> RamDisk
    end
    
    HF --> Worker Container
```

---

### 2. The Free-Tier Architecture Blueprint

#### 2.1. The Vercel + Hugging Face / Render Synergy
As analyzed in `Hosting Python Scripts for Free.pdf`:
1. **Frontend Hosting (Vercel Hobby Tier - Free)**:
   - Hosts static HTML, optimized CSS, and client-side JavaScript.
   - Zero cost, unlimited global CDN edge distribution, automatic SSL certificate provisioning, and 100/100 Core Web Vitals delivery.
2. **Heavy Python Processing (Hugging Face Spaces - Free 2 vCPU, 16 GB RAM)**:
   - Eliminates Vercel's strict 250 MB serverless bundle limit and 60-second timeouts.
   - High memory allowance (16 GB) allows heavy document processing (PyMuPDF, python-docx, openpyxl, yt-dlp) without Out-Of-Memory (OOM) crashes.
   - **48-Hour Inactivity Solution**: An automated health check pings `GET /api/health` every 10 minutes via cron-job.org, UptimeRobot, or GitHub Actions.

---

### 3. Concurrency & Resource Protection
- **Semaphore Guard**: Heavy tasks (PDF extraction, OCR, video downloads) are constrained to `Semaphore(2)` to prevent 100% CPU lock on dual-core machines.
- **Ephemeral Storage**: All temporary input and output files are created in `/dev/shm` (Linux RAM disk) or temporary directories with automatic deletion immediately after stream response completion.
- **No Database Overhead**: Zero user tracking requirement removes MongoDB network latency and connection pool exhaustion risks.

---

### 4. Technical SEO & Web Standards Compliance
- **Server Headers**:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Cache Control**:
  - HTML documents: `public, max-age=0, must-revalidate`
  - Immutable CSS/JS/Images: `public, max-age=31536000, immutable`
- **Robots & Crawlers**:
  - Standard compliant `robots.txt` granting access to all reputable search bots (Googlebot, Bingbot, Slurp, DuckDuckBot).
  - Explicit URL definitions in `sitemap.xml` with last modified ISO timestamps.
