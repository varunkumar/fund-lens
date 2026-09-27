import test from 'node:test';
import assert from 'node:assert/strict';
import { buildView } from '../src/core/summary.js';

const entry = (rows, extra = {}) => ({ rows, partial: false, failed: [], syncedAt: 5, ...extra });

test('totals per section and combined, with float-safe rounding', () => {
  const view = buildView({
    kfintech: entry([{ fundName: 'A', invested: 0.1, current: 0.2 }, { fundName: 'B', invested: 0.2, current: 0.4 }]),
    cams: entry([{ fundName: 'C', invested: 100, current: 150.5 }]),
  });
  assert.equal(view.sections.length, 2);
  assert.equal(view.sections[0].source, 'kfintech');
  assert.equal(view.sections[0].invested, 0.3);
  assert.equal(view.sections[0].current, 0.6);
  assert.equal(view.combined.invested, 100.3);
  assert.equal(view.combined.current, 151.1);
  assert.equal(view.combined.gain, 50.8);
  assert.deepEqual(view.missing, []);
});

test('row gain and share of combined current value', () => {
  const view = buildView({ cams: entry([{ fundName: 'C', invested: 100, current: 150 }, { fundName: 'D', invested: 50, current: 50 }]) });
  const [c, d] = view.sections[0].rows;
  assert.equal(c.gain, 50);
  assert.equal(c.share, 75);
  assert.equal(d.share, 25);
});

test('gainPct is null when nothing is invested; missing lists absent sources', () => {
  const view = buildView({ cams: entry([{ fundName: 'Z', invested: 0, current: 0 }]) });
  assert.equal(view.combined.gainPct, null);
  assert.equal(view.sections[0].rows[0].share, 0);
  assert.deepEqual(view.missing, ['KFintech']);
});

test('partial flags and syncedAt are carried through', () => {
  const view = buildView({ cams: entry([], { partial: true, failed: ['HDFC'], syncedAt: 42 }) });
  const s = view.sections[0];
  assert.equal(s.partial, true);
  assert.deepEqual(s.failed, ['HDFC']);
  assert.equal(s.syncedAt, 42);
});

test('empty input gives an empty view', () => {
  const view = buildView({});
  assert.deepEqual(view.sections, []);
  assert.deepEqual(view.missing, ['KFintech', 'myCAMS']);
  assert.equal(view.combined.invested, 0);
});
