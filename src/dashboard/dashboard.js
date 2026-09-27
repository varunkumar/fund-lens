import { createStore } from '../core/store.js';
import { buildView } from '../core/summary.js';
import { renderPortfolio } from '../ui/render.js';

const store = createStore();
const root = document.getElementById('root');

async function refresh() {
  renderPortfolio(document, root, buildView(await store.loadAll()));
}

document.getElementById('clear').addEventListener('click', () => store.clear());
chrome.storage.onChanged.addListener(refresh);
setInterval(refresh, 30_000); // keeps "expires in" honest and drops expired data
refresh();
