import test from 'node:test';
import assert from 'node:assert/strict';
import { waitSettle } from '../src/adapters/wait-settle.js';
import { loadFixture } from './helpers.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const setup = () => {
  const doc = loadFixture('cams.html');
  return { doc, root: doc.querySelector('.main_cont') };
};
const add = (doc, root) => root.appendChild(doc.createElement('p'));

test('a mutation made synchronously after the call counts', async () => {
  const { doc, root } = setup();
  const t0 = Date.now();
  const p = waitSettle(root, { firstMs: 400, quietMs: 20, timeoutMs: 1000 });
  add(doc, root);
  assert.equal(await p, 'settled');
  assert.ok(Date.now() - t0 < 300, 'resolved via quiet period, not firstMs');
});

test('settles after the quiet period following mutations', async () => {
  const { doc, root } = setup();
  const p = waitSettle(root, { firstMs: 500, quietMs: 30, timeoutMs: 1000 });
  add(doc, root);
  await sleep(10);
  add(doc, root);
  assert.equal(await p, 'settled');
});

test('settles after firstMs when nothing mutates', async () => {
  const { root } = setup();
  const t0 = Date.now();
  assert.equal(await waitSettle(root, { firstMs: 30, quietMs: 500, timeoutMs: 1000 }), 'settled');
  assert.ok(Date.now() - t0 < 400);
});

test('times out when mutations never go quiet', async () => {
  const { doc, root } = setup();
  const iv = setInterval(() => add(doc, root), 5);
  try {
    assert.equal(await waitSettle(root, { firstMs: 500, quietMs: 50, timeoutMs: 120 }), 'timeout');
  } finally {
    clearInterval(iv);
  }
});

test('ignores attribute-only mutations', async () => {
  const { doc, root } = setup();
  // linkedom delivers attribute records to childList observers regardless of options
  // (unlike browsers), so filter records by the requested options like a real MutationObserver.
  const view = doc.defaultView;
  const Real = view.MutationObserver;
  const Filtered = class extends Real {
    constructor(cb) {
      super((records, obs) => {
        const wanted = records.filter((r) => r.type !== 'attributes' || this.opts.attributes);
        if (wanted.length) cb(wanted, obs);
      });
    }
    observe(_fakeRoot, opts) {
      this.opts = opts;
      super.observe(root, opts);
    }
  };
  // defaultView is a read-only proxy, so hand waitSettle a stand-in root exposing the filtered observer.
  const fakeRoot = { ownerDocument: { defaultView: { MutationObserver: Filtered } } };
  let n = 0;
  const iv = setInterval(() => root.setAttribute('data-x', String(n++)), 5);
  try {
    assert.equal(await waitSettle(fakeRoot, { firstMs: 60, quietMs: 500, timeoutMs: 300 }), 'settled');
  } finally {
    clearInterval(iv);
  }
});
