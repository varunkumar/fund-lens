import { TTL_MS } from '../core/store.js';

// Milliseconds until the earliest section expires (plus 1s margin), or null if none.
export function msUntilNextExpiry(sections, now) {
  if (!sections || sections.length === 0) return null;
  const earliest = Math.min(...sections.map((s) => s.syncedAt));
  return Math.max(0, earliest + TTL_MS - now + 1000);
}

// Returns a function to call after every refresh with the view; it re-arms a single timer.
export function createExpiryRefresher(refresh, now = () => Date.now()) {
  let timer = null;
  return (view) => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const ms = msUntilNextExpiry(view?.sections, now());
    if (ms !== null) timer = setTimeout(refresh, ms);
  };
}
