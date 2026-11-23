# Personal Portfolio — Release Notes

The Toolforge application remains the default root experience. The personal portfolio is available as a separate static page at:

- Local / self-hosted: `/portfolio.html`
- Example when Toolforge is hosted at its existing domain: `https://toolforge.dev/portfolio.html`

The Toolforge sidebar now links to the portfolio. The existing dashboard, tool runner, API routes and Python bridge remain in place.

## Files

| File | Purpose |
|---|---|
| `server/public/portfolio.html` | Semantic portfolio page, SEO/social metadata and Person JSON-LD |
| `server/public/portfolio.css` | Responsive futuristic visual system |
| `server/public/portfolio.js` | Sector doors, project directories, modal navigation and keyboard support |
| `server/public/index.html` | Adds a link from Toolforge to the portfolio |
| `server/public/styles.css` | Styles the new sidebar shortcut |

## Portfolio experience

Six interactive sector doors organize the public project catalogue:

1. Robotics & Autonomy
2. Mechatronics & Simulation
3. AI & Intelligent Systems
4. Systems & Developer Tools
5. Products & Creative Tech
6. Research & Documentation

Each door opens a project panel with a concise description, technology context and a direct repository link. The page also highlights BSRM industrial training, The MTE Mind YouTube channel and public contact destinations.

## Run locally

Start Toolforge as usual:

```bash
cd server
npm start
```

Open `http://127.0.0.1:7077/portfolio.html`.

No additional packages or build step are required for the portfolio.

## Release checklist

- [x] Preserve the existing Toolforge root app and API.
- [x] Add the standalone portfolio page and responsive styles.
- [x] Add interactive sector doors and project links.
- [x] Add links from Toolforge to the portfolio.
- [x] Add basic SEO, Open Graph and Person structured metadata.
- [ ] Preview at desktop, tablet and mobile widths.
- [ ] Verify all external project links and descriptions before public announcement.
- [ ] Confirm the public deployment serves `/portfolio.html`, `/portfolio.css` and `/portfolio.js`.
- [ ] Replace or supplement the default GitHub profile link with a custom domain when one is configured.

## Accuracy notes

Project descriptions are summarized from public repository READMEs and the profile's project index. Some repositories have no README or could not be read through the GitHub connector; those entries use deliberately short descriptions and should be reviewed. No project is described as commercially deployed unless the repository itself supports that claim.

The social/contact links currently included are GitHub, LinkedIn, YouTube (@mtemind) and the email published in the GitHub profile. No additional social accounts were guessed.

## Hosting note

The existing Toolforge server serves files in `server/public` from the web root and already supports static HTML, CSS and JavaScript. Therefore the portfolio can be released alongside Toolforge without changing its server architecture. If deploying on GitHub Pages under a repository subpath instead, adjust root-relative asset paths and configure Pages separately; this repository's current Toolforge runtime is the intended first deployment target.
