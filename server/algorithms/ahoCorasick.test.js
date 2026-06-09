import { test } from 'node:test';
import assert from 'node:assert/strict';

import search from './ahoCorasick.js';
import kmp from './kmp.js';

const sort = (arr) =>
  [...arr].sort((a, b) => a.index - b.index || a.pattern.localeCompare(b.pattern));

test('classic Aho-Corasick example finds overlapping patterns', () => {
  // Patterns a, ab, bab, bc, bca, c, caa over "abccab".
  const text = 'abccab';
  const patterns = ['a', 'ab', 'bc', 'c'];
  const matches = sort(search(text, patterns));
  // a@0, ab@0, bc@1, c@2, c@3, a@4, ab@4
  assert.deepEqual(matches, sort([
    { pattern: 'a', index: 0 },
    { pattern: 'ab', index: 0 },
    { pattern: 'bc', index: 1 },
    { pattern: 'c', index: 2 },
    { pattern: 'c', index: 3 },
    { pattern: 'a', index: 4 },
    { pattern: 'ab', index: 4 },
  ]));
});

test('agrees with KMP on a realistic URL + pattern set', () => {
  const text = 'http://secure-login.paypa1.com/verify-account?free-gift';
  const patterns = ['secure-login', 'paypa1', 'verify-account', 'free-gift', 'login.'];
  assert.deepEqual(sort(search(text, patterns)), sort(kmp(text, patterns)));
});

test('returns no matches when none present', () => {
  assert.deepEqual(search('hello world', ['phish', 'evil']), []);
});
