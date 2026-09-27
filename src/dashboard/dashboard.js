import { createStore } from '../core/store.js';
import { buildView } from '../core/summary.js';
import { renderPortfolio } from '../ui/render.js';
import { createExpiryRefresher } from '../ui/expiry.js';

const store = createStore();
const root = document.getElementById('root');

const armExpiry = createExpiryRefresher(() => refresh());
let sort = { key: 'current', dir: 'desc' };

async function refresh() {
  try {
    const view = buildView(await store.loadAll());
    armExpiry(view);
    renderPortfolio(document, root, view, { sort, onSortChange: (s) => { sort = s; } });
  } catch {
    root.textContent = 'Could not load data.';
  }
}

document.getElementById('clear').addEventListener('click', () => store.clear());
chrome.storage.onChanged.addListener(refresh);
setInterval(refresh, 30_000); // keeps "expires in" honest and drops expired data
refresh();
