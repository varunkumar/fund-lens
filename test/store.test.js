import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, TTL_MS } from '../src/core/store.js';
import { sourceForHost, SOURCES } from '../src/core/sources.js';

// Minimal in-memory stand-in for chrome.storage.local.
function fakeArea() {
  const data = {};
  return {
    data,
    async get(keys) {
      const list = keys == null ? Object.keys(data) : [].concat(keys);
      return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, structuredClone(data[k])]));
    },
    async set(obj) { Object.assign(data, structuredClone(obj)); },
    async remove(keys) { for (const k of [].concat(keys)) delete data[k]; },
  };
}
const result = (n) => ({ rows: [{ fundName: 'F' + n, invested: 1, current: 2 }], partial: false, failed: [] });

test('sourceForHost maps the two portals and rejects others', () => {
  assert.equal(sourceForHost('mfs.kfintech.com'), 'kfintech');
  assert.equal(sourceForHost('newmycams.camsonline.com'), 'cams');
  assert.equal(sourceForHost('example.com'), null);
  assert.deepEqual(SOURCES, ['kfintech', 'cams']);
});

test('save then loadAll returns the entry with syncedAt', async () => {
  const store = createStore(fakeArea(), () => 1000);
  await store.save('cams', result(1));
  const all = await store.loadAll();
  assert.equal(all.cams.syncedAt, 1000);
  assert.equal(all.cams.rows[0].fundName, 'F1');
  assert.equal(all.kfintech, undefined);
});

test('a second save overwrites; no history is kept', async () => {
  const area = fakeArea();
  let t = 1000;
  const store = createStore(area, () => t);
  await store.save('cams', result(1));
  t = 2000;
  await store.save('cams', result(2));
  assert.deepEqual(Object.keys(area.data), ['portfolio:cams']);
  const all = await store.loadAll();
  assert.equal(all.cams.rows[0].fundName, 'F2');
  assert.equal(all.cams.syncedAt, 2000);
});

test('entries expire exactly at the 1 hour TTL', async () => {
  const area = fakeArea();
  let t = 0;
  const store = createStore(area, () => t);
  await store.save('cams', result(1));
  t = TTL_MS - 1;
  assert.ok((await store.loadAll()).cams);
  t = TTL_MS;
  assert.deepEqual(await store.loadAll(), {});
  assert.deepEqual(area.data, {}, 'expired entry removed from storage on read');
});

test('purgeExpired removes only expired entries and reports the count', async () => {
  const area = fakeArea();
  let t = 0;
  const store = createStore(area, () => t);
  await store.save('cams', result(1));
  t = TTL_MS - 10;
  await store.save('kfintech', result(2));
  t = TTL_MS + 5;
  assert.equal(await store.purgeExpired(), 1);
  assert.deepEqual(Object.keys(area.data), ['portfolio:kfintech']);
});

test('clear removes everything', async () => {
  const area = fakeArea();
  const store = createStore(area, () => 0);
  await store.save('cams', result(1));
  await store.save('kfintech', result(2));
  await store.clear();
  assert.deepEqual(area.data, {});
});

test('an entry without a valid syncedAt is treated as expired and removed', async () => {
  const area = fakeArea();
  area.data['portfolio:cams'] = { rows: [], partial: false, failed: [] };
  const store = createStore(area, () => 1000);
  assert.deepEqual(await store.loadAll(), {});
  assert.equal(area.data['portfolio:cams'], undefined);
  area.data['portfolio:kfintech'] = { rows: [], syncedAt: 'x' };
  assert.equal(await store.purgeExpired(), 1);
});
