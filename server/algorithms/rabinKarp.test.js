import { test } from 'node:test';
import assert from 'node:assert/strict';

import search, { searchMulti } from './rabinKarp.js';

test('finds a pattern at the correct index', () => {
  const text = 'http://g00gle-account.xyz/verify-account';
  const matches = search(text, ['g00gle']);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].index, text.indexOf('g00gle'));
});

test('handles overlapping occurrences', () => {
  const matches = search('aaaa', ['aa']);
  assert.deepEqual(matches.map((m) => m.index), [0, 1, 2]);
});

test('multi-pattern variant matches the simple variant', () => {
  const text = 'verify-account secure-login verify-account paypa1';
  const patterns = ['verify-account', 'secure-login', 'paypa1'];
  const sort = (arr) =>
    [...arr].sort((a, b) => a.index - b.index || a.pattern.localeCompare(b.pattern));
  assert.deepEqual(sort(searchMulti(text, patterns)), sort(search(text, patterns)));
});

test('returns no matches when absent', () => {
  assert.deepEqual(search('hello world', ['phish']), []);
});
