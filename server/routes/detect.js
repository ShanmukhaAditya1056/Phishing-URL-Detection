// Detection route (Module C).
//   POST /api/detect { url } -> Aho-Corasick scan against the Pattern dictionary
//
// Returns matched patterns (with category + severity), a verdict and a riskScore.
import { Router } from 'express';

import search from '../algorithms/ahoCorasick.js';
import Pattern from '../models/Pattern.js';

const router = Router();

/**
 * Turn matched patterns into a 0-100 risk score and a verdict.
 *
 * Score = sum of severities of DISTINCT matched patterns, normalised against a
 * cap so a few high-severity hits already push the score high. Verdict bands:
 *   >= 50 phishing, >= 20 suspicious, else safe.
 */
function scoreMatches(enriched) {
  const distinct = new Map();
  for (const m of enriched) {
    if (!distinct.has(m.pattern)) distinct.set(m.pattern, m.severity);
  }
  const severitySum = [...distinct.values()].reduce((a, b) => a + b, 0);

  // Cap normalisation: ~3 critical (severity 5) hits => 100.
  const riskScore = Math.min(100, Math.round((severitySum / 15) * 100));

  let verdict = 'safe';
  if (riskScore >= 50) verdict = 'phishing';
  else if (riskScore >= 20) verdict = 'suspicious';

  return { riskScore, verdict };
}

router.post('/', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ error: 'Body must include a non-empty "url" string.' });
    }

    const patternDocs = await Pattern.find({}).lean();
    const patternStrings = patternDocs.map((p) => p.pattern);
    const meta = new Map(patternDocs.map((p) => [p.pattern, p]));

    // Single Aho-Corasick pass over the URL.
    const rawMatches = search(url, patternStrings);

    // Enrich each match with its category + severity.
    const matches = rawMatches.map((m) => {
      const info = meta.get(m.pattern);
      return {
        pattern: m.pattern,
        index: m.index,
        category: info?.category ?? 'unknown',
        severity: info?.severity ?? 1,
      };
    });

    const { riskScore, verdict } = scoreMatches(matches);

    res.json({ url, matches, verdict, riskScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
