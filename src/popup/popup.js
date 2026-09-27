import { createStore } from '../core/store.js';
import { buildView } from '../core/summary.js';
import { renderPortfolio } from '../ui/render.js';

const store = createStore();
const root = document.getElementById('root');
const status = document.getElementById('status');

let sort = { key: 'current', dir: 'desc' };

async function refresh() {
  try {
    renderPortfolio(document, root, buildView(await store.loadAll()), { compact: true, sort, onSortChange: (s) => { sort = s; } });
  } catch {
    root.textContent = 'Could not load data.';
  }
}

document.getElementById('sync').addEventListener('click', async () => {
  status.textContent = 'Syncing...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'fund-lens:sync' });
    status.textContent = res?.ok ? `Synced ${res.count} funds${res.partial ? ' (partial)' : ''}.` : (res?.error || 'Sync failed. Reload the page and try again.');
  } catch {
    status.textContent = 'Open your myCAMS or KFintech portfolio page, reload it, then try again.';
  }
});
document.getElementById('dash').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') });
});
document.getElementById('clear').addEventListener('click', async () => {
  await store.clear();
  status.textContent = 'Cleared.';
});

chrome.storage.onChanged.addListener(refresh);
refresh();
