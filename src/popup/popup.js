import { createStore } from '../core/store.js';
import { buildView } from '../core/summary.js';
import { renderPortfolio } from '../ui/render.js';
import { createExpiryRefresher } from '../ui/expiry.js';

const store = createStore();
const root = document.getElementById('root');
const status = document.getElementById('status');

const armExpiry = createExpiryRefresher(() => refresh());
let sort = { key: 'current', dir: 'desc' };

async function refresh() {
  try {
    const view = buildView(await store.loadAll());
    armExpiry(view);
    renderPortfolio(document, root, view, { compact: true, sort, onSortChange: (s) => { sort = s; } });
  } catch {
    root.textContent = 'Could not load data.';
  }
}

const syncBtn = document.getElementById('sync');
syncBtn.addEventListener('click', async () => {
  syncBtn.disabled = true;
  status.textContent = 'Syncing...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'fund-lens:sync' });
    status.textContent = res?.ok ? `Synced ${res.count} funds${res.partial ? ' (partial)' : ''}.` : (res?.error || 'Sync failed. Reload the page and try again.');
  } catch {
    status.textContent = 'Open your myCAMS or KFintech portfolio page, reload it, then try again.';
  } finally {
    syncBtn.disabled = false;
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
