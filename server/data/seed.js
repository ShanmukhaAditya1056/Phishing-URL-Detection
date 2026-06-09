// ---------------------------------------------------------------------------
// Seeder (Module A — data layer).
//
//   npm run seed                  -> seeds patterns.json + the built-in URL set
//   npm run seed -- ./urls.csv    -> additionally loads a CSV (columns: url,label)
//
// Everything else in the project (detection, benchmarks) depends on this data.
// ---------------------------------------------------------------------------
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import Pattern from '../models/Pattern.js';
import UrlSample from '../models/UrlSample.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/phishing-url-detection';

// ~40 phishing-style URLs that exercise the pattern dictionary, and ~40 benign
// ones. Self-contained so the project runs fully offline.
const PHISHING_URLS = [
  'http://secure-login.paypa1.com/verify-account',
  'http://g00gle-account-update.xyz/signin-verify',
  'https://faceb00k-confirm-identity.tk/login.php',
  'http://amaz0n-claim-reward.top/free-gift',
  'https://micros0ft-reset-password.cf/unlock-account',
  'http://app1e-id-verify-account.gq/webscr',
  'https://netfllix-billing.update-billing.zip/',
  'http://bankofamerlca-secure-login.com/validate-account',
  'https://paypa1.com@phishingsite.ru/confirm-identity',
  'http://0utlook-webmail-verify.xyz/account-update',
  'https://whatsapp-verify-now.tk/you-won',
  'http://prize-claim.g00gle.mom/act-now',
  'https://urgent-action-required.amaz0n.top/suspended',
  'http://login.paypa1-com.secure-login.xyz/',
  'https://verify-account.app1e.cf/reset-password',
  'http://free-gift-claim-reward.gq/limited-offer',
  'https://xn--pple-43d.com/secure-login',
  'http://micros0ft365-login.verify-account.zip/',
  'https://account-update.faceb00k.tk/confirm-identity',
  'http://g00gle-drive-share.xyz/redirect=evil.com',
  'https://secure-login.bankofamerlca.top/webscr',
  'http://you-won-a-prize.amaz0n.mom/claim-reward',
  'https://paypa1.verify-account.gq/unlock-account',
  'http://confirm-identity.netfllix.cf/billing',
  'https://app1e-icloud.signin-verify.tk/',
  'http://reset-password.0utlook.xyz/validate-account',
  'https://urgent-action.g00gle.zip/suspended-account',
  'http://secure-login-paypa1.com.evil.ru/webscr',
  'https://amaz0n-prize-claim.top/act-now',
  'http://faceb00k-security.verify-account.gq/',
  'https://micros0ft-support.unlock-account.tk/',
  'http://bit.ly//free-gift-claim',
  'https://data:text/html;base64,PHNjcmlwdD4=',
  'http://ipgrabber.tracking.xyz/login.php',
  'https://double--hyphen-secure-login.cf/verify-account',
  'http://g00gle.com%2faccount%2fverify.tk/',
  'https://netfllix-update-billing.mom/confirm-identity',
  'http://app1e-pay-verify.zip/claim-reward',
  'https://whatsapp-verify.paypa1.gq/you-won',
  'http://limited-offer-act-now.amaz0n.top/prize-claim',
];

const LEGIT_URLS = [
  'https://www.google.com/search?q=string+matching',
  'https://github.com/torvalds/linux',
  'https://www.wikipedia.org/wiki/Aho-Corasick_algorithm',
  'https://stackoverflow.com/questions/tagged/javascript',
  'https://www.amazon.com/dp/B08N5WRWNW',
  'https://www.paypal.com/us/home',
  'https://www.microsoft.com/en-us/microsoft-365',
  'https://www.apple.com/iphone/',
  'https://www.netflix.com/browse',
  'https://www.facebook.com/help',
  'https://news.ycombinator.com/news',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://www.nytimes.com/section/technology',
  'https://www.bbc.com/news',
  'https://www.reddit.com/r/programming',
  'https://www.linkedin.com/feed/',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.coursera.org/learn/algorithms-part1',
  'https://www.khanacademy.org/computing/computer-science',
  'https://docs.mongodb.com/manual/',
  'https://nodejs.org/en/docs/',
  'https://react.dev/learn',
  'https://expressjs.com/en/4x/api.html',
  'https://vitejs.dev/guide/',
  'https://www.cloudflare.com/learning/',
  'https://www.bankofamerica.com/online-banking/',
  'https://outlook.live.com/mail/0/',
  'https://drive.google.com/drive/my-drive',
  'https://www.dropbox.com/home',
  'https://www.spotify.com/us/premium/',
  'https://www.airbnb.com/s/homes',
  'https://www.booking.com/index.html',
  'https://maps.google.com/maps',
  'https://translate.google.com/',
  'https://www.imdb.com/chart/top/',
  'https://www.w3schools.com/js/',
  'https://leetcode.com/problemset/all/',
  'https://www.kaggle.com/datasets',
  'https://arxiv.org/abs/1011.4088',
  'https://www.gnu.org/software/bash/manual/',
];

/**
 * Minimal CSV parser for two columns: url,label. Handles an optional header
 * and ignores blank lines. (Kept dependency-free on purpose.)
 */
function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  const rows = [];
  for (const line of lines) {
    const [url, label] = line.split(',').map((s) => s.trim());
    if (!url || !label) continue;
    // Skip a header row like "url,label".
    if (url.toLowerCase() === 'url' && label.toLowerCase() === 'label') continue;
    const normalized = label.toLowerCase();
    if (normalized !== 'phishing' && normalized !== 'legit') continue;
    rows.push({ url, label: normalized, length: url.length });
  }
  return rows;
}

function toSamples(urls, label) {
  return urls.map((url) => ({ url, label, length: url.length }));
}

async function seed() {
  const csvPath = process.argv[2]; // optional path to a real dataset

  await mongoose.connect(MONGO_URI);
  console.log(`[seed] connected to ${MONGO_URI}`);

  // --- Patterns ---
  const patternsPath = path.join(__dirname, 'patterns.json');
  const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
  await Pattern.deleteMany({});
  await Pattern.insertMany(patterns);
  console.log(`[seed] inserted ${patterns.length} patterns`);

  // --- URL samples ---
  let samples = [...toSamples(PHISHING_URLS, 'phishing'), ...toSamples(LEGIT_URLS, 'legit')];

  if (csvPath) {
    const csvSamples = parseCsv(csvPath);
    samples = samples.concat(csvSamples);
    console.log(`[seed] loaded ${csvSamples.length} samples from ${csvPath}`);
  }

  await UrlSample.deleteMany({});
  await UrlSample.insertMany(samples);
  const phishing = samples.filter((s) => s.label === 'phishing').length;
  const legit = samples.length - phishing;
  console.log(`[seed] inserted ${samples.length} URL samples (${phishing} phishing, ${legit} legit)`);

  await mongoose.disconnect();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
