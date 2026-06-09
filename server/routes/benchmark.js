// Benchmark routes (Module B).
//   POST /api/benchmark/run  -> run the harness, persist + return results
//   GET  /api/benchmark      -> return saved BenchmarkResult docs (for charts)
import { Router } from 'express';

import BenchmarkResult from '../models/BenchmarkResult.js';
import { runBenchmarks } from '../benchmark/runBenchmark.js';

const router = Router();

// GET saved results, newest first. Useful for charting historical runs.
router.get('/', async (_req, res) => {
  try {
    const results = await BenchmarkResult.find({}).sort({ runAt: -1, inputSize: 1 }).lean();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST run: optionally accept custom input sizes in the body.
router.post('/run', async (req, res) => {
  try {
    const { sizes } = req.body || {};
    const results = await runBenchmarks(Array.isArray(sizes) ? sizes : undefined);
    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
