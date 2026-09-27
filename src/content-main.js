import { sourceForHost } from './core/sources.js';
import { createStore } from './core/store.js';
import { scrapeKfintech } from './adapters/kfintech.js';
import { scrapeCams } from './adapters/cams.js';

const DEFAULT_ADAPTERS = { kfintech: scrapeKfintech, cams: scrapeCams };

export async function runSync(doc, host, store, { adapters = DEFAULT_ADAPTERS } = {}) {
  const source = sourceForHost(host);
  if (!source) return { ok: false, error: 'This page is not a supported portfolio site.' };
  try {
    const result = await (adapters[source] ?? DEFAULT_ADAPTERS[source])(doc);
    await store.save(source, result);
    return { ok: true, source, count: result.rows.length, partial: result.partial, failed: result.failed };
  } catch (err) {
    return { ok: false, error: err?.message || 'Sync failed' };
  }
}

export function createSyncGuard(fn) {
  let running = false;
  return async (...args) => {
    if (running) return { ok: false, error: 'A sync is already running. Wait for it to finish.' };
    running = true;
    try {
      return await fn(...args);
    } finally {
      running = false;
    }
  };
}

export function init() {
  const store = createStore();
  const guarded = createSyncGuard(() => runSync(document, location.hostname, store));
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'fund-lens:sync') return false;
    guarded().then(sendResponse);
    return true; // async response
  });
}
