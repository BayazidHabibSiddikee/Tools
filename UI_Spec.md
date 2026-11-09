# UI & UX Specification (UI_Spec.md)

## 1. Design Philosophy
- **Speed First**: Sub-50ms interaction response, zero jank, minimal DOM weight, no external heavy runtime frameworks required for core rendering.
- **Developer-Centric Elegance**: Monospace accents, subtle glow borders, frosted glass surfaces, and high-readability contrast ratios adhering to WCAG 2.1 AA.
- **Dark Mode Native with Adaptive Switch**: Defaults to a dark slate palette (`#080c14`) with a polished light mode toggle.

---

## 2. Color Palette & Typography

### Dark Theme (Default)
| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--bg` | `#080c14` | Primary body background |
| `--panel` | `rgba(15, 23, 42, 0.75)` | Cards, sidebar, modal backgrounds |
| `--border` | `rgba(255, 255, 255, 0.08)` | Subdued card & divider borders |
| `--border-strong` | `rgba(255, 255, 255, 0.16)` | Focused inputs and highlighted cards |
| `--accent` | `#6366f1` (Indigo) / `#38bdf8` (Sky) | Primary call-to-actions & active states |
| `--text` | `#f1f5f9` | High-contrast body & header text |
| `--muted` | `#94a3b8` | Supporting text, descriptions, hints |
| `--ok` | `#10b981` | Success states, online badge, clean outputs |
| `--err` | `#f43f5e` | Error states, validation failures, alerts |

### Typography
- **Headings & UI**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Code & Inputs**: `JetBrains Mono, Fira Code, ui-monospace, Menlo, Consolas, monospace`

---

## 3. Responsive Breakpoint Rules
- **Desktop (>= 1024px)**: Fixed persistent sidebar (260px) + flexible central content workspace + sticky execution inspector / output card.
- **Tablet (768px – 1023px)**: Collapsed icon sidebar or slide-over drawer; single-column tool form with output stacked below.
- **Mobile (< 768px)**: Floating top header with drawer menu toggle (`hamburger`), search trigger button, full-width touch-friendly tool cards, bottom-sheet style toasts and modals.

---

## 4. Accessibility & Core Web Vitals Guarantees
- All interactive controls have `aria-label`, `role`, and distinct `:focus-visible` outlines.
- Form inputs have explicit `<label>` tags with matching `for` identifiers.
- Images, icons, and SVGs include `alt` text or `aria-hidden="true"` with accompanying descriptive text.
- Cumulative Layout Shift (CLS) is zero by specifying fixed dimensions or aspect ratios on media and dynamic cards.
