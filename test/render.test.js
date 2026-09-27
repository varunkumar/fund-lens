import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { renderPortfolio, formatInr, formatAgo } from '../src/ui/render.js';
import { buildView } from '../src/core/summary.js';
import { TTL_MS } from '../src/core/store.js';

const entry = (rows, extra = {}) => ({ rows, partial: false, failed: [], syncedAt: 0, ...extra });
const setup = () => {
  const { document } = parseHTML('<div id="root"></div>');
  return { document, root: document.getElementById('root') };
};

test('formatInr uses Indian grouping and 2 decimals', () => {
  assert.equal(formatInr(1234567.5), '₹12,34,567.50');
  assert.equal(formatInr(-99), '-₹99.00');
});

test('formatAgo', () => {
  assert.equal(formatAgo(30_000), 'just now');
  assert.equal(formatAgo(5 * 60_000), '5 min ago');
});

test('renders rows, section totals, combined totals and missing sources', () => {
  const { document, root } = setup();
  const view = buildView({
    cams: entry([{ fundName: 'Alpha Fund', invested: 100, current: 150 }, { fundName: 'Beta Fund', invested: 50, current: 40 }]),
  });
  renderPortfolio(document, root, view, { now: 10 * 60_000 });
  const text = root.textContent;
  assert.match(text, /myCAMS/);
  assert.match(text, /Alpha Fund/);
  assert.match(text, /₹150\.00/);
  assert.match(text, /Not synced: KFintech/);
  assert.match(text, /Synced 10 min ago/);
  assert.match(text, /expires in 50 min/);
  assert.match(text, /Combined/);
  assert.match(text, /₹190\.00/, 'combined current');
});

test('default sort is current value descending; clicking a header re-sorts', () => {
  const { document, root } = setup();
  const view = buildView({
    cams: entry([{ fundName: 'Alpha', invested: 1, current: 10 }, { fundName: 'Beta', invested: 1, current: 30 }, { fundName: 'Gamma', invested: 1, current: 20 }]),
  });
  renderPortfolio(document, root, view, { now: 0 });
  const names = () => [...root.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent);
  assert.deepEqual(names(), ['Beta', 'Gamma', 'Alpha']);
  const fundHeader = [...root.querySelectorAll('th')].find((th) => th.textContent === 'Fund');
  fundHeader.click();
  assert.deepEqual(names(), ['Alpha', 'Beta', 'Gamma']);
});

test('partial sync shows a warning naming the failed AMCs', () => {
  const { document, root } = setup();
  const view = buildView({ cams: entry([{ fundName: 'A', invested: 1, current: 1 }], { partial: true, failed: ['Beta AMC'] }) });
  renderPortfolio(document, root, view, { now: 0 });
  assert.match(root.textContent, /Partial sync/);
  assert.match(root.textContent, /Beta AMC/);
});

test('compact mode omits Gain and Share columns; empty view shows guidance', () => {
  const { document, root } = setup();
  const view = buildView({ cams: entry([{ fundName: 'A', invested: 1, current: 2 }]) });
  renderPortfolio(document, root, view, { now: 0, compact: true });
  assert.ok(![...root.querySelectorAll('th')].some((th) => th.textContent === 'Share'));
  renderPortfolio(document, root, buildView({}), { now: 0 });
  assert.match(root.textContent, /No data yet/);
  assert.match(root.textContent, new RegExp(`${TTL_MS / 60000} min`));
});
