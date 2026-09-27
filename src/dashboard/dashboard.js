import { createStore } from '../core/store.js';
import { buildView } from '../core/summary.js';
import { renderPortfolio } from '../ui/render.js';
import { createExpiryRefresher } from '../ui/expiry.js';
import { confirmClick } from '../ui/confirm.js';
import { renderCharts } from '../ui/charts.js';
import { toTsv, toCsv } from '../core/export.js';

const store = createStore();
const root = document.getElementById('root');
const charts = document.getElementById('charts');
const status = document.getElementById('status');
let lastView = null;

const armExpiry = createExpiryRefresher(() => refresh());
let sort = { key: 'current', dir: 'desc' };

async function refresh() {
  try {
    const view = buildView(await store.loadAll());
    lastView = view;
    armExpiry(view);
    renderCharts(document, charts, view);
    renderPortfolio(document, root, view, { sort, onSortChange: (s) => { sort = s; } });
  } catch {
    root.textContent = 'Could not load data.';
  }
}

const say = (msg) => { status.textContent = msg; setTimeout(() => { status.textContent = ''; }, 3000); };
document.getElementById('copy').addEventListener('click', async () => {
  if (!lastView?.sections.length) return say('Nothing to export yet.');
  try {
    await navigator.clipboard.writeText(toTsv(lastView));
    say('Copied. Paste into your sheet.');
  } catch {
    say('Copy failed. Use Download CSV instead.');
  }
});
document.getElementById('csv').addEventListener('click', () => {
  if (!lastView?.sections.length) return say('Nothing to export yet.');
  const url = URL.createObjectURL(new Blob([toCsv(lastView)], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FundLens-portfolio.csv';
  a.click();
  URL.revokeObjectURL(url);
});
confirmClick(document.getElementById('clear'), () => store.clear());
chrome.storage.onChanged.addListener(refresh);
setInterval(refresh, 30_000); // keeps "expires in" honest and drops expired data
refresh();
