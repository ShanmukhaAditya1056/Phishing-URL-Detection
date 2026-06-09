// ---------------------------------------------------------------------------
// Rabin–Karp string matching.
//
// Shared contract:  search(text, patterns) -> [{ pattern, index }]
//
// Idea: hash the pattern once, then slide a window of the same length across
// the text maintaining a ROLLING hash. Comparing two numbers is O(1), so most
// windows are rejected instantly. Only when hashes collide do we verify the
// characters (guarding against false positives from hash collisions).
//
// Time:  O(n + m) average, O(n*m) worst case (pathological collisions).
// Space: O(1) extra per pattern.
// ---------------------------------------------------------------------------

// A large prime modulus keeps hashes bounded and collisions rare. Using
// Number is safe here because BASE * MOD stays well under 2^53.
const BASE = 256; // treat each char code as a digit in base 256
const MOD = 1_000_000_007;

/**
 * Compute the polynomial hash of a string of length L:
 *   h = (s[0]*BASE^(L-1) + s[1]*BASE^(L-2) + ... + s[L-1]) mod MOD
 */
function hashOf(str, len) {
  let h = 0;
  for (let i = 0; i < len; i++) {
    h = (h * BASE + str.charCodeAt(i)) % MOD;
  }
  return h;
}

/** Literal character check, used to confirm a hash match is real. */
function verify(text, start, pattern) {
  for (let k = 0; k < pattern.length; k++) {
    if (text[start + k] !== pattern[k]) return false;
  }
  return true;
}

/**
 * Run Rabin–Karp for one pattern over the text.
 */
function searchOne(text, pattern) {
  const matches = [];
  const n = text.length;
  const m = pattern.length;
  if (m === 0 || m > n) return matches;

  // highOrder = BASE^(m-1) mod MOD — the weight of the leading character,
  // needed to "remove" it from the rolling hash as the window advances.
  let highOrder = 1;
  for (let i = 0; i < m - 1; i++) {
    highOrder = (highOrder * BASE) % MOD;
  }

  const patternHash = hashOf(pattern, m);
  let windowHash = hashOf(text, m); // hash of text[0..m-1]

  for (let i = 0; i <= n - m; i++) {
    // Compare hashes first (cheap), verify characters only on a hash hit.
    if (windowHash === patternHash && verify(text, i, pattern)) {
      matches.push({ pattern, index: i });
    }

    // Roll the hash forward to the window starting at i+1:
    //   1. remove the leading char text[i]      (subtract its weighted value)
    //   2. shift everything left one position    (multiply by BASE)
    //   3. add the new trailing char text[i+m]
    if (i < n - m) {
      const leading = text.charCodeAt(i);
      const trailing = text.charCodeAt(i + m);
      windowHash = (windowHash - leading * highOrder % MOD + MOD) % MOD;
      windowHash = (windowHash * BASE + trailing) % MOD;
    }
  }

  return matches;
}

/**
 * Shared-contract entry point: loop Rabin–Karp over each pattern.
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

/**
 * Multi-pattern variant for the report's "multiple runs vs. one pass" discussion.
 *
 * Classic Rabin–Karp can scan for many patterns of the SAME length in a single
 * sweep: hash every pattern into a Set keyed by length, then for each window
 * check the Set instead of one fixed pattern hash. Patterns of differing
 * lengths still need separate sweeps — which is exactly the trade-off that
 * motivates Aho-Corasick (a true single-pass multi-pattern algorithm).
 *
 * @param {string} text
 * @param {string[]} patterns
 * @returns {Array<{ pattern: string, index: number }>}
 */
export function searchMulti(text, patterns) {
  const results = [];
  const n = text.length;

  // Bucket patterns by length; each bucket is one sweep over the text.
  const byLength = new Map();
  for (const pattern of patterns) {
    const m = pattern.length;
    if (m === 0 || m > n) continue;
    if (!byLength.has(m)) byLength.set(m, []);
    byLength.get(m).push(pattern);
  }

  for (const [m, group] of byLength) {
    // Map hash -> list of patterns with that hash (collisions still verified).
    const hashToPatterns = new Map();
    for (const pattern of group) {
      const h = hashOf(pattern, m);
      if (!hashToPatterns.has(h)) hashToPatterns.set(h, []);
      hashToPatterns.get(h).push(pattern);
    }

    let highOrder = 1;
    for (let i = 0; i < m - 1; i++) highOrder = (highOrder * BASE) % MOD;

    let windowHash = hashOf(text, m);
    for (let i = 0; i <= n - m; i++) {
      const candidates = hashToPatterns.get(windowHash);
      if (candidates) {
        for (const pattern of candidates) {
          if (verify(text, i, pattern)) results.push({ pattern, index: i });
        }
      }
      if (i < n - m) {
        const leading = text.charCodeAt(i);
        const trailing = text.charCodeAt(i + m);
        windowHash = (windowHash - leading * highOrder % MOD + MOD) % MOD;
        windowHash = (windowHash * BASE + trailing) % MOD;
      }
    }
  }

  return results;
}

export default search;
