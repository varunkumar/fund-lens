import test from 'node:test';
import assert from 'node:assert/strict';
import { toTsv, toCsv } from '../src/core/export.js';
import { supportedPageConditions } from '../src/core/page-rules.js';
import { SUPPORTED_HOSTS } from '../src/core/sources.js';
import { allocation, bySource, investedVsCurrent, gainPerFund } from '../src/core/chart-data.js';
import { buildView } from '../src/core/summary.js';

const entry = (rows) => ({ rows, partial: false, failed: [], syncedAt: 0 });
const view = buildView({
  kfintech: entry([{ fundName: 'Tab\tFund', invested: 1000, current: 1500.5 }]),
  cams: entry([{ fundName: 'Comma, "Q" Fund', invested: 200, current: 100 }, { fundName: 'Zero', invested: 0, current: 0 }]),
});

test('supported hosts are exactly the two portfolio sites', () => {
  assert.deepEqual(SUPPORTED_HOSTS.sort(), ['mfs.kfintech.com', 'newmycams.camsonline.com']);
  const c = supportedPageConditions();
  assert.equal(c.length, 2);
  assert.ok(c.every((x) => x.pageUrl.schemes[0] === 'https'));
});

test('TSV has a header, plain numbers, and no tabs inside cells', () => {
  const lines = toTsv(view).split('\n');
  assert.equal(lines[0], 'Source\tFund Name\tInvested Amount\tCurrent Value');
  assert.equal(lines[1], 'KFintech\tTab Fund\t1000\t1500.5');
  assert.ok(lines.every((l) => l.split('\t').length === 4));
});

test('CSV quotes commas and quotes', () => {
  assert.match(toCsv(view), /myCAMS,"Comma, ""Q"" Fund",200,100/);
});

test('allocation folds the tail into Others and sums to 100%', () => {
  const rows = Array.from({ length: 9 }, (_, i) => ({ fundName: `F${i}`, invested: 1, current: 10 + i }));
  const a = allocation(buildView({ cams: entry(rows) }), 6);
  assert.equal(a.length, 7);
  assert.equal(a.at(-1).label, 'Others');
  assert.ok(Math.abs(a.reduce((x, s) => x + s.pct, 0) - 100) < 1e-6);
  assert.deepEqual(allocation(buildView({})), []);
});

test('bySource, investedVsCurrent and gainPerFund', () => {
  assert.deepEqual(bySource(view).map((s) => s.label), ['KFintech', 'myCAMS']);
  assert.equal(investedVsCurrent(view)[0].label, 'Tab\tFund');
  const g = gainPerFund(view);
  assert.equal(g.length, 2, 'zero-invested fund skipped');
  assert.equal(g[0].pct, 50.05);
  assert.equal(g[1].pct, -50);
});

import { parseHTML } from 'linkedom';
import { renderCharts } from '../src/ui/charts.js';

test('renderCharts draws svg charts with legends, and nothing for an empty view', () => {
  const { document } = parseHTML('<div id="c"></div>');
  const c = document.getElementById('c');
  renderCharts(document, c, view);
  assert.equal(c.querySelectorAll('svg').length, 4);
  assert.match(c.textContent, /Allocation by fund/);
  assert.match(c.textContent, /Comma, "Q" Fund/);
  assert.ok(c.querySelectorAll('circle').length >= 1);
  renderCharts(document, c, buildView({}));
  assert.equal(c.children.length, 0);
});
