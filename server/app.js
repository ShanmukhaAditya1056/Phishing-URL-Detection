// Express application: middleware + route mounting.
// Kept separate from server.js so it can be imported by tests without
// opening a network listener or a DB connection.
import express from 'express';
import cors from 'cors';

import detectRouter from './routes/detect.js';
import benchmarkRouter from './routes/benchmark.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'phishing-url-detection' });
});

app.use('/api/detect', detectRouter);
app.use('/api/benchmark', benchmarkRouter);

export default app;
