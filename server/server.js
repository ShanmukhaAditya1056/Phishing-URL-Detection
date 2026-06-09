// Boots the HTTP server: connect to MongoDB, then listen.
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/phishing-url-detection';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[db] connected to ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
