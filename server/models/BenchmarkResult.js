import mongoose from 'mongoose';

// One persisted benchmark measurement for a single (algorithm, inputSize) pair.
const benchmarkResultSchema = new mongoose.Schema(
  {
    algorithm: {
      type: String,
      required: true,
      enum: ['kmp', 'rabinKarp', 'ahoCorasick'],
    },
    inputSize: { type: Number, required: true }, // characters scanned
    patternCount: { type: Number, required: true },
    avgTimeMs: { type: Number, required: true },
    peakMemoryKb: { type: Number, required: true },
    matchCount: { type: Number, required: true },
    runAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('BenchmarkResult', benchmarkResultSchema);
