// ---------------------------------------------------------------------------
// Aho–Corasick multi-pattern string matching.
//
// Shared contract:  search(text, patterns) -> [{ pattern, index }]
//
// Unlike KMP and Rabin–Karp (which scan the text once PER pattern), Aho–Corasick
// builds a single automaton from ALL patterns and finds every match in ONE pass
// over the text. This is why it dominates as the number of patterns grows.
//
//   1. GOTO  (trie): all patterns inserted into a trie of characters.
//   2. FAIL  (failure links): for each node, the longest proper suffix of the
//      string spelled by that node that is also a prefix of some pattern. This
//      is the multi-pattern generalisation of KMP's LPS table.
//   3. OUTPUT (output links): patterns that end at a node, PLUS patterns
//      reachable by following failure links (suffixes that are themselves
//      complete patterns), so overlapping matches are not missed.
//
// Time:  O(n + m + z)  (n = text, m = total pattern length, z = matches)
// Space: O(m * Σ)      (Σ = alphabet size; here implemented with Maps)
// ---------------------------------------------------------------------------

class Node {
  constructor() {
    this.children = new Map(); // char -> Node (the GOTO/trie edges)
    this.fail = null; // failure link
    this.output = []; // indices into the pattern list that END here
    this.depth = 0;
  }
}

/**
 * Build the Aho–Corasick automaton from a list of patterns.
 * Returns the root node plus the original pattern array (for reporting).
 */
function buildAutomaton(patterns) {
  const root = new Node();

  // --- Phase 1: build the trie (GOTO function). ---
  patterns.forEach((pattern, patternIndex) => {
    if (!pattern) return; // skip empty patterns
    let node = root;
    for (const ch of pattern) {
      if (!node.children.has(ch)) {
        const child = new Node();
        child.depth = node.depth + 1;
        node.children.set(ch, child);
      }
      node = node.children.get(ch);
    }
    node.output.push(patternIndex);
  });

  // --- Phase 2: BFS to wire up failure + output links. ---
  const queue = [];

  // Depth-1 nodes fail straight back to the root.
  for (const child of root.children.values()) {
    child.fail = root;
    queue.push(child);
  }

  while (queue.length > 0) {
    const current = queue.shift();

    for (const [ch, child] of current.children) {
      // Find the failure link for `child`: follow current's failure chain
      // until some node has an edge labelled `ch`, else fall back to root.
      let fallback = current.fail;
      while (fallback !== null && !fallback.children.has(ch)) {
        fallback = fallback.fail;
      }
      child.fail = fallback === null ? root : fallback.children.get(ch) || root;

      // Merge the output of the failure target: any pattern that is a suffix
      // ending here is also a match here. This captures overlapping patterns.
      child.output = child.output.concat(child.fail.output);

      queue.push(child);
    }
  }

  return root;
}

/**
 * Shared-contract entry point. Builds the automaton once, then scans the text
 * a single time reporting every (pattern, index) match.
 *
 * @param {string} text
 * @param {string[]} patterns
 * @returns {Array<{ pattern: string, index: number }>}
 */
export function search(text, patterns) {
  const matches = [];
  if (patterns.length === 0 || text.length === 0) return matches;

  const root = buildAutomaton(patterns);

  let node = root;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Follow failure links until we can consume `ch` (or reach root).
    while (node !== root && !node.children.has(ch)) {
      node = node.fail;
    }
    if (node.children.has(ch)) {
      node = node.children.get(ch);
    } // else stay at root

    // Report every pattern ending at this node (includes suffix matches via
    // the merged output links).
    if (node.output.length > 0) {
      for (const patternIndex of node.output) {
        const pattern = patterns[patternIndex];
        // Match ends at i, so it starts at i - pattern.length + 1.
        matches.push({ pattern, index: i - pattern.length + 1 });
      }
    }
  }

  return matches;
}

export default search;
