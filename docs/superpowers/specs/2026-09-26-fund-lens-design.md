# fund-lens design

Chrome extension (Manifest V3) that reads a mutual fund portfolio from the
user's logged-in myCAMS and KFintech sessions and shows both in one popup with
totals. Everything stays in the browser.

## Findings that drive the design (from recon captures)

| | KFintech `mfs.kfintech.com` | myCAMS `newmycams.camsonline.com` |
|---|---|---|
| Data source | Server-rendered HTML, no JSON calls | Angular SPA, no calls after load, state encrypted in `sessionStorage` |
| Rows | `table.kfin-portfolio-table`: Scheme Name, Units, Cost Value, Current Value, Appreciation; nested per-folio tables | `app-scheme-tile`: `.scheme_title .title` (name), `.price.invested span`, `.price.current span`, units |
| Catch | none | only the selected AMC's schemes are in the DOM; AMCs are swiper tabs (`app-amc-tile`) |

Network interception is not viable for either site, so both adapters read the
rendered DOM. Decrypting CAMS session storage is explicitly out of scope.

## Scope

- Output row: `Source | Fund Name | Invested Amount | Current Value`.
- Popup and a full-page dashboard (opened from the popup) share one renderer:
  both sources' rows, per-source totals, a combined total, gain/loss, share of
  portfolio, click-to-sort columns, and last-synced time per source.
- Storage keeps only the latest extraction per source (each sync overwrites;
  no history). Entries expire 1 hour after `syncedAt`: expired data is never
  shown, is removed on read, and is purged by a 5-minute `chrome.alarms` job.
  A "Clear data" button removes everything immediately.
- No dedupe: the user confirmed the sources do not overlap. Rows are listed per
  source with a source label.
- No credentials are read or stored. No network requests from the extension.
  Data lives only in `chrome.storage.local`.
- Permissions: `storage`, `alarms`. Content scripts are matched to the two
  origins; no host permissions, no `tabs`, no `activeTab`.

## Architecture

Plain ES modules, no build step.

```
manifest.json
src/
  adapters/kfintech.js   DOM -> raw rows
  adapters/cams.js       clicks each AMC tab, DOM -> raw rows
  core/parse.js          "₹9,99,999.50" / "-1,234.5 (-3%)" -> number
  core/sources.js        source ids, labels, hostname -> source
  core/store.js          latest rows + syncedAt per source, 1h TTL, purge
  core/summary.js        stored entries -> view model (totals, gain, share)
  content.js             loader (dynamic import of content-main.js)
  content-main.js        picks adapter by hostname, syncs, saves to store
  background.js          alarm that purges expired entries
  ui/render.js|styles.css shared renderer for popup and dashboard
  popup/popup.html|js    Sync button, compact view, open dashboard, clear
  dashboard/dashboard.html|js  full-page view
test/                    node:test unit tests and adapter fixture tests
```

Each unit has one job. Adapters return `[{ fundName, invested, current }]` and
know nothing about storage or the popup. `parse.js` is pure. `store.js` is the
only writer of storage. The popup reads storage and sends the sync message.

## Data flow

1. User opens a portfolio page and clicks **Sync this site**.
2. Popup messages the content script in that tab.
3. Content script runs the matching adapter and saves the result via
   `store.js` itself (so a popup closing mid-sync loses nothing), then replies
   with a status.
4. Popup and dashboard re-render from `chrome.storage.onChanged`.

## Adapter notes

- **KFintech:** use the scheme-level rows of `table.kfin-portfolio-table`
  (skip the per-folio and transaction sub-tables). Invested = Cost Value,
  Current = Current Value. Locate columns by header text, not position.
- **CAMS:** for each AMC tab, click it, wait for scheme tiles to settle
  (MutationObserver with a timeout, no fixed sleeps), scrape, and finally
  restore the originally selected tab. Invested and current are located by
  their `label` text ("Invested", "Current"), not by class order. Handle the
  "zero balance" toggle if hidden funds affect totals.

## Error handling

- Adapter finds no rows or an unexpected header set: return a clear error
  ("layout changed") and keep the previous stored data untouched.
- Numbers that fail to parse are reported, never silently zeroed.
- CAMS tab that does not settle within the timeout: report which AMC failed
  and keep the AMCs that succeeded, marked as a partial sync.

## Testing

- `parse.js`: Indian grouping, rupee sign, negatives, parenthesised percent.
- Adapters: fixtures built from the recon structure, run under `node:test`
  with a DOM shim (linkedom). Fixtures contain synthetic data only.
- Manual check against the live sites before calling it done.

## Out of scope

Dedupe, folio-level detail, transactions, XIRR, decrypting site storage,
background or automatic syncing, any remote backend.
