# FundLens

Manifest V3 Chrome extension that reads the user's logged-in myCAMS (`newmycams.camsonline.com`) and KFintech (`mfs.kfintech.com`) portfolio pages, normalises them to `Fund Name | Invested Amount | Current Value`, and shows a popup and a dashboard. See `README.md` for behaviour and `docs/superpowers/` (main checkout) for the design spec and plan.

## Hard rules
- No credentials: never ask for, read or store them.
- No network requests, no backend, no remote scripts (MV3 CSP). All data stays in `chrome.storage.local`.
- Only the latest extraction per source is stored (one overwritten key, `portfolio:<source>`), with a 1 hour TTL (`TTL_MS` in `src/core/store.js`). Never keep history.
- No dedupe across sources (user confirmed no overlap).
- Extraction is DOM based, one adapter per site. Do not intercept the sites' API calls.
- Build DOM with `createElement`/`textContent` (or `createElementNS` for SVG). No `innerHTML`.
- Permissions are `storage`, `alarms`, `declarativeContent` only. Adding one needs a README privacy update.
- Supported hosts live in one place: `HOSTS` in `src/core/sources.js` (also drives the content script matches, which must be kept in sync in `manifest.json`).

## Layout
- `src/adapters/` site scrapers (`cams.js`, `kfintech.js`), `wait-settle.js`, `errors.js`. See its own `CLAUDE.md`.
- `src/core/` pure logic, no DOM: `parse`, `sources`, `store`, `summary` (`buildView`), `chart-data`, `export`, `page-rules`.
- `src/ui/` shared rendering: `render.js` (tables), `charts.js` (inline SVG), `confirm.js`, `expiry.js`, `styles.css` (light and dark via `prefers-color-scheme`).
- `src/content.js` is a classic script that dynamically imports `src/content-main.js` (needs `web_accessible_resources`). Message contract: `{type:'fund-lens:sync'}` -> `{ok, source, count, partial, failed}` or `{ok:false, error}`.
- `src/popup/`, `src/dashboard/`, `src/background.js` (expiry alarm, action enabled only on supported hosts).
- `icons/` extension icons (16/32/48/128). `docs/brand/` README logo. `docs/screenshots/` generated images.
- `tools/screenshots/` dev-only screenshot harness. Never referenced by the manifest.

## Commands
- `npm test` runs `node --test 'test/**/*.js'` (glob form is required on Node 24). Node >= 22.
- `tools/screenshots/capture.sh` regenerates `docs/screenshots/*.png`.
- Load unpacked from the repo root at `chrome://extensions` to try it.

## Conventions
- ES modules, no build step, no runtime dependencies. `linkedom` is a dev dependency for DOM tests.
- Test first for logic. Scrapers are tested against synthetic fixtures in `test/fixtures/`; UI is tested with linkedom.
- Never use em dashes in code, docs or commit messages. Use commas, periods, colons or hyphens.
- Commit messages end with the Co-Authored-By trailer from the session instructions.
