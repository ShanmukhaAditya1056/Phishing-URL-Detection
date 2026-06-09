import mongoose from 'mongoose';

// A labelled URL used to seed detection demos and drive benchmark input sizes.
const urlSampleSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    label: { type: String, required: true, enum: ['phishing', 'legit'] },
    length: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('UrlSample', urlSampleSchema);
