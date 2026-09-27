import { createStore } from '../core/store.js';
import { buildView } from '../core/summary.js';
import { renderPortfolio } from '../ui/render.js';

const store = createStore();
const root = document.getElementById('root');
const status = document.getElementById('status');

async function refresh() {
  renderPortfolio(document, root, buildView(await store.loadAll()), { compact: true });
}

document.getElementById('sync').addEventListener('click', async () => {
  status.textContent = 'Syncing...';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'fund-lens:sync' });
    status.textContent = res.ok ? `Synced ${res.count} funds${res.partial ? ' (partial)' : ''}.` : res.error;
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
