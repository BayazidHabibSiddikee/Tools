---
title: Toolforge
emoji: ⚡
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
license: mit
short_description: 39 instant Python utilities. Zero cost. Zero tracking.
---

# Toolforge

> **39 instant Python utilities. Zero cost. Zero tracking.**

A free, open-source toolkit that runs directly in your browser — no account required, no data stored.

## Features

- 🔧 **39 tools** across 8 categories: Utilities, Data, Knowledge, Documents, Media, Archives, Vault, System
- ⚡ Instant execution via Python bridge
- 🌙 Dark/Light theme
- 🔒 Privacy-first — no user tracking, no database, in-memory execution only
- 📂 Workspace file manager
- 🕐 Run history

## Categories

| Category | Tools |
|----------|-------|
| Utilities | Calculator, Unit converter, Colour picker, QR code, UUID, … |
| Data | Crypto price, Stock quote, Currency FX, CSV analyser, … |
| Knowledge | Wikipedia, Dictionary, Weather, Translate, … |
| Documents | PDF merge/split, DOCX→PDF, OCR, Markdown, … |
| Media | Image resize/convert, Thumbnail downloader, … |
| Archives | ZIP/TAR create/extract, … |
| Vault | Password generator, Hash, Encode/Decode, … |
| System | System info, Process list, Disk usage, … |

## Running Locally

```bash
git clone https://github.com/BayazidHabibSiddikee/toolforge
cd toolforge/server
npm start
# → http://127.0.0.1:7077
```

## Tech Stack

- **Frontend:** Vanilla JS SPA (zero npm dependencies), custom CSS design system
- **Backend:** Zero-dependency Node.js HTTP server
- **Python Bridge:** `server/bridge.py` — stdin JSON → Python function → stdout JSON
- **Hosting:** HuggingFace Spaces (Docker) + Vercel (optional static CDN)

## License

MIT © Bayazid Habib Siddikee
