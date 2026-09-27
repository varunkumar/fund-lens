import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

test('linkedom parses html', () => {
  const { document } = parseHTML('<div class="a">hi</div>');
  assert.equal(document.querySelector('.a').textContent, 'hi');
});
