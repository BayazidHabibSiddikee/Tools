# Data Schema & API Contract (Schema.md)

## 1. Tool Definition Schema
Every tool registered on the platform adheres to this JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ToolDefinition",
  "type": "object",
  "required": ["id", "category", "title", "description", "module", "function", "fields"],
  "properties": {
    "id": { "type": "string" },
    "category": { "type": "string", "enum": ["utilities", "data", "knowledge", "documents", "media", "archives", "vault", "system"] },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "module": { "type": "string" },
    "function": { "type": "string" },
    "icon": { "type": "string" },
    "timeout": { "type": "integer", "default": 60000 },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "label", "type"],
        "properties": {
          "name": { "type": "string" },
          "label": { "type": "string" },
          "type": { "type": "string", "enum": ["text", "textarea", "number", "select", "switch", "list"] },
          "required": { "type": "boolean", "default": false },
          "default": {},
          "placeholder": { "type": "string" },
          "help": { "type": "string" },
          "options": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": { "type": "string" },
                "label": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 2. API Endpoints Contract

### `GET /api/health`
- **Description**: Lightweight health status ping (used by uptime monitors to keep containers warm).
- **Response**:
```json
{
  "ok": true,
  "name": "Toolforge",
  "version": "1.0.0",
  "uptime": 12480,
  "tools": 39,
  "time": "2026-11-09T18:00:00.000Z"
}
```

### `GET /api/tools`
- **Description**: Lists all available categories and tool definitions.
- **Response**:
```json
{
  "ok": true,
  "categories": [
    { "id": "utilities", "name": "Utilities", "icon": "calculator", "accent": "#6ee7ff", "blurb": "Everyday math..." }
  ],
  "tools": [ /* Array of ToolDefinitions */ ]
}
```

### `POST /api/run/:toolId`
- **Description**: Invokes the Python bridge for the given tool identifier.
- **Request Body**:
```json
{
  "args": {
    "expression": "sqrt(144) + 2 ** 10"
  }
}
```
- **Response**:
```json
{
  "ok": true,
  "toolId": "calculator",
  "module": "student_tools",
  "function": "calculate",
  "result": 1036.0,
  "stdout": "",
  "stderr": "",
  "durationMs": 4.12
}
```

---

## 3. SEO Rich Snippet (JSON-LD) Entity Schema
Embedded in the homepage to maximize Google Search visibility and sitelinks:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://toolforge.dev/#organization",
      "name": "Toolforge",
      "url": "https://toolforge.dev/",
      "logo": "https://toolforge.dev/logo.png",
      "description": "Free, fast, privacy-focused online utility suite powered by Python and modern serverless infrastructure."
    },
    {
      "@type": "WebApplication",
      "@id": "https://toolforge.dev/#webapp",
      "name": "Toolforge Online Python Toolbox",
      "url": "https://toolforge.dev/",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Scientific & Programmer Calculators",
        "Instant Word to PDF & PDF to Word Conversion",
        "Cryptocurrency & Stock Market Quotes",
        "YouTube Transcript Extraction & Multi-language Translation",
        "Archive Compression & Extraction (ZIP, TAR, 7z)"
      ]
    }
  ]
}
```
