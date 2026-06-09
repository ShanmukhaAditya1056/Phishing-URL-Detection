# CLAUDE.md — Project context for Claude Code

## What this is
**Phishing URL Detection with Algorithm Analysis** — an academic capstone, MERN
stack (MongoDB, Express, React, Node). It flags suspicious URLs by matching them
against a dictionary of known phishing patterns, and empirically compares three
classic string-matching algorithms: **KMP**, **Rabin-Karp**, and **Aho-Corasick**.

This is a **defensive / educational** project. It detects and scores suspicious
URLs against a known-pattern dictionary. It does not generate attacks.

## The shared contract (do not break)
All three algorithms expose the SAME signature so they are drop-in
interchangeable in the benchmark harness:

```js
search(text, patterns) -> [{ pattern, index }]
```

- `text` is a string (one URL, or many URLs concatenated for scaling tests).
- `patterns` is an array of strings.
- Returns one entry per match occurrence: the matched pattern and the 0-based
  index in `text` where it starts.

Each algorithm file exports `search` as a **named** export and also as the
**default** export.

| File                            | Algorithm    | Strategy                                  |
|---------------------------------|--------------|-------------------------------------------|
| `server/algorithms/kmp.js`      | KMP          | LPS failure table; loops over patterns    |
| `server/algorithms/rabinKarp.js`| Rabin-Karp   | Rolling polynomial hash; loops over patterns |
| `server/algorithms/ahoCorasick.js` | Aho-Corasick | Trie + failure/output links; single pass  |

## The three modules
- **Module A — KMP + data layer:** `kmp.js`, `data/patterns.json`, `data/seed.js`.
  Foundation: seeds patterns + URL samples that everything else depends on.
- **Module B — Rabin-Karp + benchmarking:** `rabinKarp.js`,
  `benchmark/runBenchmark.js`, `routes/benchmark.js`. The empirical core.
- **Module C — Aho-Corasick + dashboard:** `ahoCorasick.js`, `routes/detect.js`,
  the React app in `client/`. The detection feature + demo UI.

## Layout
```
server/
  algorithms/   kmp.js rabinKarp.js ahoCorasick.js (+ *.test.js)
  models/       Pattern.js UrlSample.js BenchmarkResult.js
  routes/       detect.js benchmark.js
  data/         patterns.json seed.js
  benchmark/    runBenchmark.js
  app.js        express app + middleware + routes
  server.js     mongoose connect + listen
client/         Vite + React dashboard
```

## Conventions
- ES modules throughout (`"type": "module"`). Always use `.js` extensions in
  relative imports.
- Mongoose models:
  - `Pattern   { pattern, category, severity }`
  - `UrlSample { url, label('phishing'|'legit'), length }`
  - `BenchmarkResult { algorithm, inputSize, patternCount, avgTimeMs, peakMemoryKb, matchCount, runAt }`
- Benchmark uses `process.hrtime.bigint()` for time and
  `process.memoryUsage().heapUsed` for space; warm-up + N reps + average.

## Commands
- `npm install` (root) and `npm --prefix client install`
- `npm run seed` — load patterns + URL samples into Mongo
- `npm test` — algorithm unit tests
- `npm run benchmark` — CLI benchmark, prints a table + persists results
- `npm run dev` — server + client together
