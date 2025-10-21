## Copilot / AI contributor quick guide

This project is a small static site (HTML/CSS/JS) with lightweight, prototype data handling.
Use these notes to make focused, low-risk changes.

Key ideas
- Single-page HTML files live at project root (e.g. `index.html`, `upload.html`, `leaf.html`).
- Most client logic is plain ES5/ES6 in top-level `.js` files (e.g. `index.js`, `upload.js`, `globalHandler.js`).
- Persistent data has two patterns in the repo:
  - Browser-only prototype: `localStorage` keys `leafLibrary` and `lotusLibrary` (see `upload.html` and `upload.js` inline script). These store arrays of card objects.
  - Node-side prototype: `upload.js` (server-side style) writes card HTML files into `cards/` and JSON into `data/` using `fs`. Treat this as a developer helper, not production code.

Important files (quick reference)
- `index.html` / `index.js` — navigation and card thumbnails.
- `upload.html` — primary client upload form. Uses `localStorage` to save card objects keyed by `leafLibrary` or `lotusLibrary`.
- `upload.js` — a Node-style script that demonstrates writing `cards/card_<ID>.html` and `data/<section>Library.json`. Only runnable under Node (has `require('fs')`).
- `globalHandler.js` / `crisis-listener.js` — listen to `storage` events and redirect to `crisis.html` if `crisisActive` is true.
- `css/style*.css` — multiple theme files. Theme link element id: `theme-link` (used by `theme.js`).

Data shapes & naming conventions
- Card object (in `localStorage` libraries): { id, title, content, section, votes:{yes, no}, status }
- Card filenames (Node script): `cards/card_<ID>.html` (see `upload.js`) — server-side prototype creates full HTML pages.
- LocalStorage keys: `leafLibrary`, `lotusLibrary`, `crisisActive` (boolean stored as string).

Common patterns to follow when editing
- Prefer minimal, non-breaking edits to HTML structure because many pages include inline scripts.
- When adding new JS modules, keep paths relative to the HTML that will load them (many pages use `script` tags with `defer`).
- For data features: decide whether to use the client `localStorage` approach (works in-browser with no server) or the Node `fs` approach (requires running script under Node). Don't mix both unless you update both flows.

Run / debug workflows
- Static preview (recommended): serve the folder over HTTP and open the site in a browser (avoids CORS and fs path issues).
  - PowerShell (Windows):
    ```powershell
    # using Python 3
    python -m http.server 8000

    # or using the npm http-server (if installed)
    npx http-server -p 8000
    ```
  - Then open http://localhost:8000 in your browser.
- Inspect client state: open DevTools → Application → Local Storage. Check `leafLibrary` / `lotusLibrary` and `crisisActive`.
- Run Node prototype scripts (only when editing `upload.js` behavior): use Node in the project root. Example:
    ```powershell
    node upload.js
    ```
  Note: `upload.js` assumes `cards/` and `data/` directories or will create them; review file paths before running.

Examples of project-specific edits
- To add a new theme option, update `css/` with a new `styleX.css` and add an option in the `<select>` or in `theme.js` which swaps the `href` of the element with id `theme-link`.
- To add a card metadata field: update the client form in `upload.html`, push the new property into the card object saved to `localStorage`, and update any pages that read from `leafLibrary`/`lotusLibrary`.

Safety notes
- Many scripts are prototype-level and perform filesystem writes; treat `upload.js` as non-production. Avoid running or modifying it without understanding its side effects.
- No automated tests or build pipeline are present. Small changes should be validated manually by serving the site and using the browser console.

If you change cross-cutting data formats
- Update both the client `localStorage` usage (inlined in HTML files) and the server-side prototype (`upload.js`) to keep examples consistent.

If you want me to expand this file
- Tell me which areas to expand (examples: full list of keys in `localStorage`, preferred folder layout for a future backend, or sample unit tests). I can iterate.
