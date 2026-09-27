import { SOURCES } from './sources.js';

export const TTL_MS = 60 * 60 * 1000;
const keyOf = (source) => `portfolio:${source}`;

// area: anything with async get/set/remove (chrome.storage.local in the extension).
export function createStore(area = globalThis.chrome?.storage?.local, now = () => Date.now()) {
  const expired = (entry) => !Number.isFinite(entry.syncedAt) || now() - entry.syncedAt >= TTL_MS;

  async function readAll() {
    const raw = await area.get(SOURCES.map(keyOf));
    return SOURCES.filter((s) => raw[keyOf(s)]).map((s) => [s, raw[keyOf(s)]]);
  }

  return {
    // Overwrites: only the latest extraction per source is ever kept.
    async save(source, { rows, partial, failed }) {
      await area.set({ [keyOf(source)]: { rows, partial: !!partial, failed: failed ?? [], syncedAt: now() } });
    },

    async loadAll() {
      const live = {};
      const stale = [];
      for (const [source, entry] of await readAll()) {
        if (expired(entry)) stale.push(keyOf(source));
        else live[source] = entry;
      }
      if (stale.length) await area.remove(stale);
      return live;
    },

    async purgeExpired() {
      const stale = (await readAll()).filter(([, e]) => expired(e)).map(([s]) => keyOf(s));
      if (stale.length) await area.remove(stale);
      return stale.length;
    },

    async clear() {
      await area.remove(SOURCES.map(keyOf));
    },
  };
}
