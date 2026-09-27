# Screenshot harness

Dev-only. `harness.html` loads the real `popup` or `dashboard` page with a fake `chrome.*` API and dummy fund data (query: `page`, `data=empty`, `theme=light|dark`). `serve.py` serves the repo and delays `/hold.css` so headless Chrome's load-time screenshot waits for the async render (without it the shots come out blank). `capture.sh` writes `docs/screenshots/`.

- Data must stay obviously fake ("Sample ...", "Demo ..."). Never use real holdings.
- The theme is pinned by inlining `styles.css` with the dark media block removed or unwrapped, so keep that block in the form `@media (prefers-color-scheme: dark) { ... }` with the closing brace at column 0.
- Chrome Web Store needs 1280x800 (or 640x400) images: use `store-popup.png` and `dashboard.png` / `dashboard-dark.png`, and `icons/icon-128.png` as the store icon.
