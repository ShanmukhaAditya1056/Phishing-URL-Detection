# Phishing URL Detection with Algorithm Analysis

A MERN-stack capstone that detects phishing URLs via **string pattern matching**
and empirically compares three classic algorithms — **KMP**, **Rabin-Karp**, and
**Aho-Corasick** — on time and space.

> **Defensive / educational.** It flags suspicious URLs against a dictionary of
> known phishing patterns. It does not generate attacks.

## What it does
- **Detect:** scan a URL against a curated pattern dictionary (Aho-Corasick,
  single pass) and return matched patterns, a verdict, and a risk score.
- **Benchmark:** run all three algorithms over the same inputs at increasing
  sizes, measuring average time and peak memory, and chart the results.

## The shared contract
All three algorithms expose the same signature, so they are drop-in
interchangeable in the benchmark harness:

```js
search(text, patterns) -> [{ pattern, index }]
```

- **KMP** (`server/algorithms/kmp.js`) — LPS/failure table, loops over patterns.
- **Rabin-Karp** (`server/algorithms/rabinKarp.js`) — rolling polynomial hash.
- **Aho-Corasick** (`server/algorithms/ahoCorasick.js`) — trie + failure links,
  single pass over the text.

## The three-module split
The project was built as three interlocking modules:

| Module | Owner area | Files |
|--------|-----------|-------|
| **A — KMP + data layer** | foundation everything depends on | `algorithms/kmp.js`, `data/patterns.json`, `data/seed.js` |
| **B — Rabin-Karp + benchmarking** | the empirical core | `algorithms/rabinKarp.js`, `benchmark/runBenchmark.js`, `routes/benchmark.js` |
| **C — Aho-Corasick + dashboard** | detection + demo UI | `algorithms/ahoCorasick.js`, `routes/detect.js`, `client/` |

The shared `search(text, patterns)` contract is what keeps the benchmark fair
and the three algorithms interchangeable — don't break it.

## Project layout
```
server/
  algorithms/   kmp.js rabinKarp.js ahoCorasick.js (+ *.test.js)
  models/       Pattern.js UrlSample.js BenchmarkResult.js
  routes/       detect.js benchmark.js
  data/         patterns.json seed.js
  benchmark/    runBenchmark.js
  app.js        server.js
client/         Vite + React dashboard (URL Checker + Benchmark pages)
```

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string)

## Setup
```bash
# 1. install backend deps (root)
npm install

# 2. install frontend deps
npm --prefix client install

# 3. configure environment
cp .env.example .env        # Windows: copy .env.example .env
#    edit MONGO_URI / PORT if needed

# 4. seed patterns + URL samples into MongoDB
npm run seed
#    optionally load a real dataset (CSV with columns: url,label):
#    npm run seed -- ./path/to/phishing_urls.csv
```

## Run
```bash
# backend + frontend together
npm run dev
#   backend  -> http://localhost:5000
#   frontend -> http://localhost:5173

# or individually
npm run server
npm run client
```

## Algorithm tests
```bash
npm test            # Node's built-in test runner over server/algorithms/*.test.js
```

## Benchmark
```bash
npm run benchmark   # CLI: runs the harness, prints a table, persists results
```
Or from the dashboard's **Benchmark** page, click **Run benchmark**.

## API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/detect` | `{ url }` → `{ url, matches, verdict, riskScore }` |
| `GET`  | `/api/benchmark` | saved `BenchmarkResult` documents |
| `POST` | `/api/benchmark/run` | run harness, persist + return results |
| `GET`  | `/api/health` | service health check |

## Complexity reference
| Algorithm | Time | Space | Multi-pattern |
|-----------|------|-------|---------------|
| KMP | O(n + m) per pattern | O(m) | No |
| Rabin-Karp | O(n + m) avg, O(nm) worst | O(1) | With multiple runs |
| Aho-Corasick | O(n + m + z) total | O(m·Σ) | Yes — single pass |

n = text length, m = total pattern length, z = number of matches, Σ = alphabet size.

## Real dataset
`seed.js` accepts a CSV (`url,label`). Public sources include PhishTank and
Kaggle phishing-URL datasets — download one, point the seeder at it, and the
benchmark runs on real data.
