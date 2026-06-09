// Lightweight tests using Node's built-in test runner (no extra deps).
//   node --test server/algorithms/kmp.test.js   (or: npm test)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import search, { buildLps } from './kmp.js';

test('buildLps computes the failure table correctly', () => {
  assert.deepEqual(buildLps('ABABC'), [0, 0, 1, 2, 0]);
  assert.deepEqual(buildLps('AAAA'), [0, 1, 2, 3]);
  assert.deepEqual(buildLps('ABCDE'), [0, 0, 0, 0, 0]);
});

test('finds a single pattern at the correct index', () => {
  const text = 'http://secure-login.paypa1.com/verify';
  const matches = search(text, ['paypa1']);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].pattern, 'paypa1');
  assert.equal(matches[0].index, text.indexOf('paypa1'));
});

test('finds multiple patterns and reports each occurrence', () => {
  const text = 'abxabcabxabc';
  const matches = search(text, ['abc', 'abx']);
  const byPattern = (p) => matches.filter((m) => m.pattern === p).map((m) => m.index);
  assert.deepEqual(byPattern('abc'), [3, 9]);
  assert.deepEqual(byPattern('abx'), [0, 6]);
});

test('handles overlapping occurrences', () => {
  // "aa" occurs at 0,1,2 in "aaaa".
  const matches = search('aaaa', ['aa']);
  assert.deepEqual(matches.map((m) => m.index), [0, 1, 2]);
});

test('returns no matches when pattern is absent or longer than text', () => {
  assert.deepEqual(search('hello', ['world']), []);
  assert.deepEqual(search('hi', ['hello']), []);
  assert.deepEqual(search('hello', ['']), []);
});
