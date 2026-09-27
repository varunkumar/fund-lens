import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount } from '../src/core/parse.js';

test('parses Indian digit grouping and rupee sign', () => {
  assert.equal(parseAmount('₹9,99,999.50'), 999999.5);
  assert.equal(parseAmount('1,25,000.00'), 125000);
  assert.equal(parseAmount(' ₹ 99,999 '), 99999);
});

test('parses negatives in both styles', () => {
  assert.equal(parseAmount('-₹99.9'), -99.9);
  assert.equal(parseAmount('₹-1,234.50'), -1234.5);
  assert.equal(parseAmount('(1,234.50)'), -1234.5);
});

test('zero is a real value', () => {
  assert.equal(parseAmount('₹0'), 0);
  assert.equal(parseAmount('0.00'), 0);
});

test('returns null for empty or garbage, never NaN or 0', () => {
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('   '), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount('12abc'), null);
  assert.equal(parseAmount(null), null);
  assert.equal(parseAmount(undefined), null);
});
