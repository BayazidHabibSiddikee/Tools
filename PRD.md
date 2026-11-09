# Product Requirements Document (PRD)
## Project Name: Toolforge (Free Python Utility Platform & Workspace)

### 1. Vision & Executive Summary
Toolforge is a high-performance, mobile-first web application that exposes a suite of over 35+ Python utilities, office tools, market data analyzers, converters, media utilities, and casual productivity widgets into a unified, zero-cost architecture. The platform is designed to be hosted for free using a modern hybrid stack:
- **Frontend / Presentation Layer**: Clean, high-performance static/SSR web frontend with comprehensive On-Page and Technical SEO, optimized for Core Web Vitals, rich JSON-LD snippets, and responsive cross-device usability.
- **Backend & Execution Engine**: Hybrid Node.js entrypoint (serving WebSockets, state, and API routing) paired with a FastAPI / Python bridge execution worker container (deployable on Hugging Face Spaces 2 vCPU / 16 GB RAM or Render/Railway/Fly.io free tiers).
- **Monetization & Support**: Lightweight tipping system (Buy Me a Coffee + Crypto/Bitcoin one-click modal) with zero friction and no forced paywalls.

---

### 2. User Personas & Target Audience
1. **Students & Researchers**: Need fast unit conversion, math evaluation, PDF merging/splitting, document conversion (Word/Excel/PDF), and research note saving without expensive software or data tracking.
2. **Developers & Power Users**: Need programmer base conversions (hex/bin/oct/dec), QR code generation, process inspection, system resource monitoring, and text archiving.
3. **Casual & Daily Web Users**: Looking for fast cryptocurrency/stock price checks, weather updates, route navigation, news digests, and translation tools.

---

### 3. Core Feature Requirements

#### 3.1. Unified Multi-Category Tool Suite
- **Utilities**: Expression Calculator, Programmer Calculator (Base 2/8/10/16), Unit Converter (Length, Weight, Temp, Volume), QR Code Generator & Preview, Note Saver.
- **Data & Markets**: Real-time Crypto Price tracker (CoinGecko integration), Stock Price lookup (Yahoo Finance resolution).
- **Knowledge & Search**: Web Search, Readable Page Content Extractor, Academic PDF Finder, Weather Reports, City Places Discovery, Route Planner, and Flood Monitoring.
- **Document Management**: Word to PDF, PDF to Word, Excel to PDF, PDF to Excel, CSV to XLSX, XLSX to CSV, PDF Page Merge, PDF Splitter, PDF to Image, PDF to Text layer extractor, Text to PDF, and Images to PDF.
- **Media & Language**: YouTube Transcript Extractor, Video URL parser, Multi-language Text Translation (Bangla, Spanish, French, German, Chinese, Japanese, etc.).
- **Archive Management**: Create/Extract ZIP, TAR (.gz, .bz2, .xz), and 7z archives.
- **System & Workspace**: System Process Explorer, Process Search by PID/Name, Agent Private Notes/Vault.

#### 3.2. Technical & On-Page SEO Requirements
- **100/100 Core Web Vitals Target**: Semantic HTML5, CSS custom properties, zero render-blocking unnecessary scripts, inline SVG sprites, preconnects, and responsive layout without layout shifts (CLS = 0).
- **Header & Semantic Hierarchy**: Exactly one `<h1>` per page, strictly nested `<h2>` and `<h3>` tags, contextual breadcrumbs.
- **Metadata**: Unique title tags, keyword-targeted meta descriptions, canonical URLs on every route, Open Graph (`og:*`), Twitter Cards (`summary_large_image`).
- **Structured Data (JSON-LD)**: `WebApplication`, `SoftwareApplication`, and `Organization` schemas with feature lists, ratings, author attribution, and breadcrumbs.
- **Crawlability Assets**: `robots.txt` with sitemap directives, dynamic XML sitemap (`sitemap.xml`), and `.htaccess`/Nginx/Vercel configuration rules enforcing HTTPS and strict security headers.

#### 3.3. Performance & Free Tier Hosting Safeguards
- **In-Memory & Ephemeral**: Converted files are processed in-memory or in temporary ramdisk (`/dev/shm` / ephemeral disk) with immediate cleanup.
- **Concurrency Limiting**: Background semaphore queue to prevent CPU starvation on heavy jobs (PDF rendering, image OCR).
- **Keep-Alive Resilience**: Health endpoint (`/api/health`) configured for uptime pinging (UptimeRobot / Cron-job.org) to prevent free-tier containers from sleeping.
