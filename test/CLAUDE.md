# Tests

- Run with `npm test` (`node --test 'test/**/*.js'`).
- Fixtures in `fixtures/` are synthetic, trimmed copies of the real page structure with fake data. Never commit real portfolio data or captures.
- DOM tests use `linkedom` (`parseHTML`). It has no layout, so tests check structure and text, not appearance. Visual checks are done with `tools/screenshots/capture.sh`.
- `export-rules.test.js` covers export, page rules, chart data and SVG rendering.
