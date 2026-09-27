import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { scrapeKfintech } from '../src/adapters/kfintech.js';
import { AdapterError } from '../src/adapters/errors.js';
import { loadFixture } from './helpers.js';

test('extracts scheme-level rows and ignores nested folio tables', () => {
  const result = scrapeKfintech(loadFixture('kfintech.html'));
  assert.deepEqual(result, {
    rows: [
      { fundName: 'Alpha Bluechip Fund - Direct Plan Growth', invested: 100000, current: 125000.5 },
      { fundName: 'Beta Small Cap Fund - Direct Plan Growth', invested: 50000, current: 48500 },
    ],
    partial: false,
    failed: [],
  });
});

test('throws when the portfolio table is missing', () => {
  const { document } = parseHTML('<html><body><p>Session expired</p></body></html>');
  assert.throws(() => scrapeKfintech(document), AdapterError);
});

test('throws when expected columns are missing (layout changed)', () => {
  const { document } = parseHTML(
    '<table class="kfin-portfolio-table"><tr><th>Scheme Name</th><th>Units</th></tr><tr><td>X</td><td>1</td></tr></table>',
  );
  assert.throws(() => scrapeKfintech(document), /column/i);
});

test('throws on an unparseable amount instead of zeroing it', () => {
  const html = `<table class="kfin-portfolio-table">
    <tr><th>Scheme Name</th><th>Cost Value (₹)</th><th>Current Value (₹)</th></tr>
    <tr><td>X Fund</td><td>N/A</td><td>10.00</td></tr></table>`;
  assert.throws(() => scrapeKfintech(parseHTML(html).document), /amount/i);
});

test('throws when there are no scheme rows', () => {
  const html = `<table class="kfin-portfolio-table">
    <tr><th>Scheme Name</th><th>Cost Value (₹)</th><th>Current Value (₹)</th></tr></table>`;
  assert.throws(() => scrapeKfintech(parseHTML(html).document), /no holdings/i);
});

test('skips a trailing total row', () => {
  const html = `<table class="kfin-portfolio-table">
    <tr><th>Scheme Name</th><th>Cost Value (₹)</th><th>Current Value (₹)</th></tr>
    <tr><td>X Fund</td><td>10</td><td>12</td></tr>
    <tr><td>Total</td><td>10</td><td>12</td></tr></table>`;
  assert.equal(scrapeKfintech(parseHTML(html).document).rows.length, 1);
});
