# Adapters

One scraper per site. Each returns normalised rows `{fundName, invested, current}` and throws an error from `errors.js` when the page is not what it expects. On error the previous stored data is kept.

## KFintech (`kfintech.js`)
- Reads every `table.kfin-portfolio-table`. Columns are found by header text, not position.
- Nested per-folio tables are skipped. Only short rows that contain a nested table are skipped; any other short row throws "unreadable row" (this makes a total row without a nested table a known risk).

## myCAMS (`cams.js`)
- Angular SPA. AMC tabs are `.swiperAMCwiseListing .swiper-slide`, each holding `input + label > app-amc-tile`. The scraper clicks each tab (label first, then the input as a fallback if it is still unchecked) and waits with `waitSettle`.
- One `app-scheme-tile` holds one `.scheme_box` per fund (`fundCards`). Never assume one fund per tile. Name is `.scheme_title .title`; amounts are `.price` blocks matched by their `label` text ("Invested", "Current").
- Re-query slides on every pass (Angular replaces nodes). A tab whose signature is unchanged, or that yields zero tiles, is a failure, and a partial result is reported. The user's original tab is restored in `finally`.

## Rules
- `waitSettle(root)` must start observing before the click, or a fast render is missed.
- Update the fixtures in `test/fixtures/` and add a test before changing selectors. If a site changes layout, fail loudly rather than guess.
