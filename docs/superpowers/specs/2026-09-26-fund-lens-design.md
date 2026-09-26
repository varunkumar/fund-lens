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
- Popup shows both sources' rows, per-source totals and a combined total, plus
  last-synced time per source.
- No dedupe: the user confirmed the sources do not overlap. Rows are listed per
  source with a source label.
- No credentials are read or stored. No network requests from the extension.
  Data lives only in `chrome.storage.local`.
- Permissions: `storage`, `activeTab`, host access to the two origins.

## Architecture

Plain ES modules, no build step.

```
manifest.json
src/
  adapters/kfintech.js   DOM -> raw rows
  adapters/cams.js       clicks each AMC tab, DOM -> raw rows
  core/parse.js          "₹9,99,999.50" / "-1,234.5 (-3%)" -> number
  core/store.js          per-source rows + syncedAt in chrome.storage.local
  content.js             picks adapter by hostname, answers "sync" message
  popup/popup.html|js    Sync button, table, totals
test/                    node:test unit tests and adapter fixture tests
```

Each unit has one job. Adapters return `[{ fundName, invested, current }]` and
know nothing about storage or the popup. `parse.js` is pure. `store.js` is the
only writer of storage. The popup reads storage and sends the sync message.

## Data flow

1. User opens a portfolio page and clicks **Sync this site**.
2. Popup messages the content script in that tab.
3. Content script runs the matching adapter and returns rows (or an error).
4. Popup saves `{ source, rows, syncedAt }` via `store.js` and re-renders.

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
