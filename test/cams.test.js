import test from 'node:test';
import assert from 'node:assert/strict';
import { scrapeCams } from '../src/adapters/cams.js';
import { AdapterError } from '../src/adapters/errors.js';
import { loadFixture } from './helpers.js';

const tile = (name, invested, current) => `
  <app-scheme-tile><div class="scheme_box"><div class="scheme_title_card">
    <div class="scheme_title"><img><span class="title">${name}</span></div>
    <div class="footer_nav">
      <div class="price invested"><label>Invested</label><span>${invested}</span></div>
      <div class="price current"><label>Current</label><span>${current}</span></div>
      <div class="price current"><label>XIRR</label><div class="returns">12%</div></div>
      <div class="price current"><label>Today's G/L</label><span class="gain_value">₹99</span></div>
    </div>
  </div></div></app-scheme-tile>`;

// Wires the fixture's AMC labels so a click renders that AMC's tiles, like the real app.
function wire(doc, amcs, log = []) {
  const wrapper = doc.querySelector('.scheme_list_wrapper');
  const slides = [...doc.querySelectorAll('.swiper-slide')];
  slides.forEach((slide, i) => {
    slide.querySelector('label').addEventListener('click', () => {
      log.push(i);
      doc.querySelectorAll('.swiper-slide input').forEach((inp, j) => (j === i ? inp.setAttribute('checked', '') : inp.removeAttribute('checked')));
      wrapper.innerHTML = amcs[i] ?? '';
    });
  });
  wrapper.innerHTML = amcs[0];
  return log;
}
const instant = async () => 'settled';

test('clicks every AMC tab, scrapes tiles, and restores the original tab', async () => {
  const doc = loadFixture('cams.html');
  const log = wire(doc, [
    tile('Alpha Bluechip Fund - Direct Growth', '₹99,999', '₹1,20,000.5'),
    tile('Beta Value Fund - Direct Growth', '₹50,000', '₹47,000') + tile('Beta Debt Fund - Direct Growth', '₹10,000', '₹10,500'),
  ]);
  const result = await scrapeCams(doc, { waitSettle: instant });
  assert.deepEqual(result.rows, [
    { fundName: 'Alpha Bluechip Fund - Direct Growth', invested: 99999, current: 120000.5 },
    { fundName: 'Beta Value Fund - Direct Growth', invested: 50000, current: 47000 },
    { fundName: 'Beta Debt Fund - Direct Growth', invested: 10000, current: 10500 },
  ]);
  assert.equal(result.partial, false);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(log, [0, 1, 0], 'visits each tab then restores tab 0');
});

test('a tab that never settles is reported; other tabs are kept (partial)', async () => {
  const doc = loadFixture('cams.html');
  wire(doc, [tile('Alpha Fund', '₹100', '₹110'), tile('Beta Fund', '₹1', '₹2')]);
  let calls = 0;
  const flaky = async () => (++calls === 2 ? 'timeout' : 'settled');
  const result = await scrapeCams(doc, { waitSettle: flaky });
  assert.equal(result.partial, true);
  assert.deepEqual(result.failed, ['Beta AMC']);
  assert.deepEqual(result.rows.map((r) => r.fundName), ['Alpha Fund']);
});

test('the invested and current values come from labels, not class order', async () => {
  const doc = loadFixture('cams.html');
  wire(doc, [
    `<app-scheme-tile><div class="scheme_title"><span class="title">Swapped Fund</span></div>
       <div class="price current"><label>Current</label><span>₹200</span></div>
       <div class="price invested"><label>Invested</label><span>₹150</span></div></app-scheme-tile>`,
    '',
  ]);
  const result = await scrapeCams(doc, { waitSettle: instant });
  assert.deepEqual(result.rows, [{ fundName: 'Swapped Fund', invested: 150, current: 200 }]);
});

test('throws when there are no AMC tabs', async () => {
  const doc = loadFixture('cams.html');
  doc.querySelectorAll('.swiper-slide').forEach((s) => s.remove());
  await assert.rejects(() => scrapeCams(doc, { waitSettle: instant }), AdapterError);
});

test('throws on an unparseable amount instead of zeroing it', async () => {
  const doc = loadFixture('cams.html');
  wire(doc, [tile('Bad Fund', 'N/A', '₹5'), '']);
  await assert.rejects(() => scrapeCams(doc, { waitSettle: instant }), /amount/i);
});

test('throws when nothing was scraped at all', async () => {
  const doc = loadFixture('cams.html');
  wire(doc, ['', '']);
  await assert.rejects(() => scrapeCams(doc, { waitSettle: instant }), /no holdings/i);
});

test('a tab whose render never arrives (stale tiles) is failed, not duplicated', async () => {
  const doc = loadFixture('cams.html');
  wire(doc, [tile('Alpha Fund', '₹100', '₹110'), tile('Alpha Fund', '₹100', '₹110')]);
  const result = await scrapeCams(doc, { waitSettle: instant });
  assert.deepEqual(result.rows.map((r) => r.fundName), ['Alpha Fund']);
  assert.equal(result.partial, true);
  assert.deepEqual(result.failed, ['Beta AMC']);
});

test('a settled tab with zero tiles is reported failed', async () => {
  const doc = loadFixture('cams.html');
  wire(doc, [tile('Alpha Fund', '₹100', '₹110'), '']);
  const result = await scrapeCams(doc, { waitSettle: instant });
  assert.equal(result.partial, true);
  assert.deepEqual(result.failed, ['Beta AMC']);
  assert.equal(result.rows.length, 1);
});

test('the original tab is restored even when a later tab throws', async () => {
  const doc = loadFixture('cams.html');
  const log = wire(doc, [tile('Alpha Fund', '₹100', '₹110'), tile('Bad Fund', 'N/A', '₹5')]);
  await assert.rejects(() => scrapeCams(doc, { waitSettle: instant }), /amount/i);
  assert.deepEqual(log, [0, 1, 0]);
  const inputs = [...doc.querySelectorAll('.swiper-slide input')];
  assert.equal(inputs[0].hasAttribute('checked'), true);
  assert.equal(inputs[1].hasAttribute('checked'), false);
});
