# Fund Lens

Chrome extension (Manifest V3) that combines your myCAMS and KFintech mutual fund portfolios.

## Privacy
- Reads only the page you are already logged in to. Never asks for or stores credentials.
- Makes no network requests. Data lives only in `chrome.storage.local`.
- Keeps only the latest sync per site and deletes it 1 hour after it was taken.

## Install
1. `chrome://extensions`, enable Developer mode, "Load unpacked", pick this folder.
2. Log in to myCAMS (`newmycams.camsonline.com`) or KFintech (`mfs.kfintech.com`) and reload the page once so the extension attaches.

## Use
- On a portfolio page click the extension icon, then "Sync this site". On myCAMS open the dashboard AMC list first; the extension clicks through each AMC tab and restores your selection.
- "Dashboard" opens the full-page view with gain, share of portfolio and sortable columns.

## Develop
`npm install && npm test`. The scrapers are tested against synthetic HTML fixtures in `test/fixtures/`; if a site changes its layout the adapter reports an error and keeps the previous data.
