import mongoose from 'mongoose';

// A known phishing indicator: a plain substring searched for inside URLs.
const patternSchema = new mongoose.Schema(
  {
    pattern: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    // 1 (low) .. 5 (critical) — feeds the risk score.
    severity: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model('Pattern', patternSchema);
