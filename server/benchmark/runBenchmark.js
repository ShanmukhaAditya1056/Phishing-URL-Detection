// ---------------------------------------------------------------------------
// Benchmark harness (Module B — the empirical core of the report).
//
// Profiles all THREE algorithms identically through the shared contract
//     search(text, patterns) -> [{ pattern, index }]
// so the comparison is fair. Measures time with process.hrtime.bigint() and
// space with process.memoryUsage().heapUsed. Uses warm-up runs + N repetitions
// and reports the AVERAGE — never a single noisy run.
//
// CLI:   npm run benchmark
// API :  runBenchmarks() is imported by routes/benchmark.js
// ---------------------------------------------------------------------------
import 'dotenv/config';
import mongoose from 'mongoose';

import kmp from '../algorithms/kmp.js';
import rabinKarp from '../algorithms/rabinKarp.js';
import ahoCorasick from '../algorithms/ahoCorasick.js';

import Pattern from '../models/Pattern.js';
import UrlSample from '../models/UrlSample.js';
import BenchmarkResult from '../models/BenchmarkResult.js';

const ALGORITHMS = {
  kmp,
  rabinKarp,
  ahoCorasick,
};

// Input sizes (in characters) we scale across to reveal asymptotic behaviour.
const DEFAULT_TARGET_SIZES = [100, 500, 1000, 5000, 10000];
const WARMUP_RUNS = 3;
const MEASURED_RUNS = 10;

/**
 * Build a text of approximately `targetChars` characters by repeating /
 * concatenating the corpus of URLs. This is what lets us vary input size.
 */
function buildInput(urls, targetChars) {
  if (urls.length === 0) return '';
  let text = '';
  let i = 0;
  while (text.length < targetChars) {
    text += urls[i % urls.length] + ' ';
    i += 1;
  }
  return text.slice(0, targetChars);
}

/**
 * Time a single algorithm at a single input size.
 * Returns { avgTimeMs, peakMemoryKb, matchCount }.
 */
function profile(fn, text, patterns) {
  // Warm-up: let the JIT optimise the hot path before we measure.
  for (let i = 0; i < WARMUP_RUNS; i++) fn(text, patterns);

  let peakHeap = 0;
  let matchCount = 0;
  let totalNs = 0n;

  for (let i = 0; i < MEASURED_RUNS; i++) {
    const start = process.hrtime.bigint();
    const matches = fn(text, patterns);
    const end = process.hrtime.bigint();

    totalNs += end - start;
    matchCount = matches.length; // deterministic across runs
    const heap = process.memoryUsage().heapUsed;
    if (heap > peakHeap) peakHeap = heap;
  }

  const avgTimeMs = Number(totalNs / BigInt(MEASURED_RUNS)) / 1e6;
  return {
    avgTimeMs: Number(avgTimeMs.toFixed(6)),
    peakMemoryKb: Number((peakHeap / 1024).toFixed(1)),
    matchCount,
  };
}

/**
 * Core routine. Loads patterns + URL samples (passed in so it can run with or
 * without a live DB), profiles every algorithm at every input size, and
 * returns an array of result objects (NOT yet persisted).
 *
 * @param {{ patterns: string[], urls: string[], sizes?: number[] }} data
 */
export function benchmark({ patterns, urls, sizes = DEFAULT_TARGET_SIZES }) {
  const results = [];
  const corpusChars = urls.reduce((sum, u) => sum + u.length + 1, 0);

  for (const target of sizes) {
    // Don't fabricate sizes larger than we can build from the corpus alone;
    // buildInput repeats URLs, so any target is fine, but cap at a sane max.
    const text = buildInput(urls, target);
    const inputSize = text.length;

    for (const [name, fn] of Object.entries(ALGORITHMS)) {
      const { avgTimeMs, peakMemoryKb, matchCount } = profile(fn, text, patterns);
      results.push({
        algorithm: name,
        inputSize,
        patternCount: patterns.length,
        avgTimeMs,
        peakMemoryKb,
        matchCount,
        runAt: new Date(),
      });
    }
  }

  return { results, corpusChars };
}

/**
 * DB-backed entry point used by the API route: pull data from Mongo, run the
 * benchmark, persist each result, and return them.
 *
 * Assumes a mongoose connection is already open (the route/app owns the
 * connection lifecycle).
 */
export async function runBenchmarks(sizes) {
  const patternDocs = await Pattern.find({}).lean();
  const urlDocs = await UrlSample.find({}).lean();

  const patterns = patternDocs.map((p) => p.pattern);
  const urls = urlDocs.map((u) => u.url);

  const { results } = benchmark({ patterns, urls, sizes });

  // Persist a fresh batch (keep history append-only).
  const saved = await BenchmarkResult.insertMany(results);
  return saved;
}

/** Pretty-print results as a console table grouped by input size. */
function printTable(results) {
  const rows = results.map((r) => ({
    algorithm: r.algorithm,
    inputSize: r.inputSize,
    patterns: r.patternCount,
    avgTimeMs: r.avgTimeMs,
    peakMemKb: r.peakMemoryKb,
    matches: r.matchCount,
  }));
  console.table(rows);
}

// CLI mode: connect, run, persist, print, disconnect.
async function main() {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/phishing-url-detection';

  await mongoose.connect(MONGO_URI);
  console.log(`[benchmark] connected to ${MONGO_URI}`);

  const saved = await runBenchmarks();
  console.log(`[benchmark] ran ${saved.length} measurements:\n`);
  printTable(saved);

  await mongoose.disconnect();
  console.log('\n[benchmark] done — results persisted to BenchmarkResult.');
}

// Only run main() when invoked directly (not when imported by a route).
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith('runBenchmark.js');
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[benchmark] failed:', err);
    process.exit(1);
  });
}
