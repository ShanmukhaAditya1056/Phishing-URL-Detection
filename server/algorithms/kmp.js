// ---------------------------------------------------------------------------
// Knuth–Morris–Pratt (KMP) string matching.
//
// Shared contract:  search(text, patterns) -> [{ pattern, index }]
//
// KMP matches a single pattern against a text in O(n + m) time, where n is the
// text length and m the pattern length. The trick is the LPS table: when a
// mismatch happens after matching some characters, instead of restarting the
// pattern from scratch (the naive O(n*m) approach) we shift the pattern by the
// largest amount that still keeps the already-matched prefix valid.
// ---------------------------------------------------------------------------

/**
 * Build the LPS ("Longest Proper Prefix which is also a Suffix") table, a.k.a.
 * the failure function, for a pattern.
 *
 * lps[i] = the length of the longest proper prefix of pattern[0..i] that is
 *          also a suffix of pattern[0..i].
 * "Proper" means it cannot be the whole substring itself.
 *
 * Example for "ABABC":
 *   index : 0 1 2 3 4
 *   char  : A B A B C
 *   lps   : 0 0 1 2 0
 * At index 3 ("ABAB"), the prefix "AB" is also the suffix "AB", so lps=2.
 * When matching later fails, lps tells us how many characters we can keep.
 *
 * @param {string} pattern
 * @returns {number[]} lps table, same length as the pattern.
 */
export function buildLps(pattern) {
  const m = pattern.length;
  const lps = new Array(m).fill(0);

  // `len` tracks the length of the previous longest prefix-suffix.
  let len = 0;
  let i = 1; // lps[0] is always 0, so start comparing from index 1.

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      // Characters match: extend the current prefix-suffix by one.
      len += 1;
      lps[i] = len;
      i += 1;
    } else if (len > 0) {
      // Mismatch but we had matched something: fall back to the previous best
      // prefix-suffix length. We do NOT advance i — we retry with shorter len.
      len = lps[len - 1];
    } else {
      // Mismatch with len === 0: no prefix-suffix here.
      lps[i] = 0;
      i += 1;
    }
  }

  return lps;
}

/**
 * Run KMP for one pattern over the text, collecting every match start index.
 *
 * @param {string} text
 * @param {string} pattern
 * @returns {Array<{ pattern: string, index: number }>}
 */
function searchOne(text, pattern) {
  const matches = [];
  const n = text.length;
  const m = pattern.length;
  if (m === 0 || m > n) return matches;

  const lps = buildLps(pattern);

  let i = 0; // pointer into text
  let j = 0; // pointer into pattern

  while (i < n) {
    if (text[i] === pattern[j]) {
      i += 1;
      j += 1;
      if (j === m) {
        // Full match ends at i-1, so it started at i - m.
        matches.push({ pattern, index: i - m });
        // Use the failure table to look for overlapping matches too.
        j = lps[j - 1];
      }
    } else if (j > 0) {
      // Mismatch after some progress: shift pattern using the LPS table
      // instead of moving i back. This is what makes KMP linear.
      j = lps[j - 1];
    } else {
      // Mismatch at the very first pattern char: just advance the text.
      i += 1;
    }
  }

  return matches;
}

/**
 * Shared-contract entry point. KMP has no native multi-pattern mode, so it
 * simply loops over each pattern independently.
 *
 * @param {string} text
 * @param {string[]} patterns
 * @returns {Array<{ pattern: string, index: number }>}
 */
export function search(text, patterns) {
  const results = [];
  for (const pattern of patterns) {
    results.push(...searchOne(text, pattern));
  }
  return results;
}

export default search;
