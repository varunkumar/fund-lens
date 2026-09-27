import test from 'node:test';
import assert from 'node:assert/strict';
import { msUntilNextExpiry } from '../src/ui/expiry.js';
import { TTL_MS } from '../src/core/store.js';

test('null when there are no sections', () => {
  assert.equal(msUntilNextExpiry([], 0), null);
  assert.equal(msUntilNextExpiry(undefined, 0), null);
});

test('earliest expiry plus a 1s margin, never negative', () => {
  const sections = [{ syncedAt: 2000 }, { syncedAt: 1000 }];
  assert.equal(msUntilNextExpiry(sections, 1500), 1000 + TTL_MS - 1500 + 1000);
  assert.equal(msUntilNextExpiry(sections, 1000 + TTL_MS * 2), 0);
});
