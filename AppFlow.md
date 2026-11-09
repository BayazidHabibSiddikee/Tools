# Application Flow & User Journeys (AppFlow.md)

## 1. High-Level Flowchart

```mermaid
flowchart TD
    A[Visitor Lands on Homepage] --> B{Search Intent / Goal}
    B -->|Discovery / Browsing| C[Browse Categories: Utilities, Docs, Media, Data, etc.]
    B -->|Direct Search| D[Trigger Command Palette Ctrl+K or Top Search Bar]
    B -->|Direct URL| E[Direct Tool Route #/tool/:toolId]
    
    C --> F[Select Tool Card]
    D --> F
    E --> F
    
    F --> G[Dynamic Tool Form Rendered]
    G --> H[User Inputs Parameters & Files]
    H --> I[Click 'Run Tool']
    
    I --> J{Validation Check}
    J -->|Invalid / Missing Input| K[Highlight Field & Show Inline Error Alert]
    K --> H
    J -->|Valid| L[Dispatch Async POST to /api/run/:id]
    
    L --> M[Display Active Spinner & Execution State]
    M --> N[Backend Execution via Python Bridge]
    
    N -->|Execution Error| O[Display Formatted Error + Traceback]
    N -->|Success| P[Render Structured Output: JSON / Table / Image / File Download]
    
    P --> Q[Log to Local History Storage]
    P --> R[Allow One-Click Copy, Re-run, or Download]
    
    A --> S[Click 'Support / Tip']
    S --> T[Open Modal: Buy Me A Coffee + Scannable Bitcoin QR]
```

---

## 2. Detailed User Journeys

### Journey 1: Search Engine Traffic & Instant Conversion
1. **Entry**: User searches "free docx to pdf without upload limits" on Google.
2. **Landing**: Crawlable static landing page loads in under 400ms with full semantic markup, high-contrast typography, and explicit privacy guarantees ("Local & In-Memory").
3. **Action**: The user scrolls or searches for "Word to PDF", inputs file or selects local workspace path, and hits Execute.
4. **Result**: Within milliseconds, output appears with a direct download link and execution time badge.

### Journey 2: Keyboard Power User (Command Palette)
1. **Trigger**: User hits `Ctrl + K` (or `Cmd + K` on macOS).
2. **Search**: Types `crypto` or `calc` or `zip`. Fuzzy search instantly highlights matching tools.
3. **Selection**: Presses `Enter` or arrows down to switch immediately to the tool view.
4. **Execution**: Defaults are prefilled for immediate one-click testing.

### Journey 3: Workspace File Exploration & Download
1. **Navigation**: User visits `#/files`.
2. **Interaction**: Views generated QR codes, merged PDFs, or exported CSVs saved in the workspace.
3. **Management**: Direct download or cleanup.
