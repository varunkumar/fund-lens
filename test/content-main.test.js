import test from 'node:test';
import assert from 'node:assert/strict';
import { runSync } from '../src/content-main.js';
import { AdapterError } from '../src/adapters/errors.js';
import { loadFixture } from './helpers.js';

const fakeStore = () => ({ saved: [], async save(source, result) { this.saved.push([source, result]); } });

test('syncs KFintech from the real adapter and saves the result', async () => {
  const store = fakeStore();
  const res = await runSync(loadFixture('kfintech.html'), 'mfs.kfintech.com', store);
  assert.deepEqual(res, { ok: true, source: 'kfintech', count: 2, partial: false, failed: [] });
  assert.equal(store.saved.length, 1);
  assert.equal(store.saved[0][0], 'kfintech');
});

test('unknown host reports an error and saves nothing', async () => {
  const store = fakeStore();
  const res = await runSync(loadFixture('kfintech.html'), 'example.com', store);
  assert.equal(res.ok, false);
  assert.match(res.error, /not a supported/i);
  assert.equal(store.saved.length, 0);
});

test('adapter failure is reported and the store is untouched', async () => {
  const store = fakeStore();
  const adapters = { cams: async () => { throw new AdapterError('myCAMS: layout changed'); } };
  const res = await runSync(loadFixture('cams.html'), 'newmycams.camsonline.com', store, { adapters });
  assert.deepEqual(res, { ok: false, error: 'myCAMS: layout changed' });
  assert.equal(store.saved.length, 0);
});

test('partial CAMS results are saved and flagged', async () => {
  const store = fakeStore();
  const adapters = { cams: async () => ({ rows: [{ fundName: 'A', invested: 1, current: 2 }], partial: true, failed: ['Beta AMC'] }) };
  const res = await runSync(loadFixture('cams.html'), 'newmycams.camsonline.com', store, { adapters });
  assert.deepEqual(res, { ok: true, source: 'cams', count: 1, partial: true, failed: ['Beta AMC'] });
  assert.equal(store.saved[0][1].partial, true);
});

import { createSyncGuard } from '../src/content-main.js';

test('sync guard dedupes concurrent calls and re-runs after settle or rejection', async () => {
  let calls = 0;
  let release;
  let fail = false;
  const fn = () => { calls++; return new Promise((res, rej) => { release = () => (fail ? rej(new Error('x')) : res({ ok: true })); }); };
  const guarded = createSyncGuard(fn);
  const first = guarded();
  const busy = await guarded();
  assert.equal(busy.ok, false);
  assert.match(busy.error, /already running/i);
  assert.equal(calls, 1);
  release();
  assert.deepEqual(await first, { ok: true });
  const second = guarded();
  fail = true;
  release();
  await assert.rejects(second);
  const third = guarded();
  assert.equal(calls, 3);
  fail = false;
  release();
  await third;
});
