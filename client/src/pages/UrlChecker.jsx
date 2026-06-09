import { useState } from 'react';
import { detectUrl } from '../api.js';
import HighlightedUrl from '../components/HighlightedUrl.jsx';

const SEVERITY_COLORS = {
  1: '#64748b',
  2: '#0ea5e9',
  3: '#f59e0b',
  4: '#fb923c',
  5: '#ef4444',
};

const VERDICT_COLOR = {
  safe: 'var(--safe)',
  suspicious: 'var(--suspicious)',
  phishing: 'var(--phishing)',
};

const EXAMPLES = [
  'http://secure-login.paypa1.com/verify-account',
  'https://www.github.com/torvalds/linux',
  'https://g00gle-account-update.xyz/signin-verify',
];

export default function UrlChecker() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function check(target) {
    const value = (target ?? url).trim();
    if (!value) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await detectUrl(value);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>URL Checker</h1>
      <p className="subtitle">
        Scans a URL against the phishing-pattern dictionary using Aho-Corasick (single pass).
      </p>

      <div className="card">
        <div className="row">
          <input
            type="text"
            placeholder="Paste a URL, e.g. http://secure-login.paypa1.com/verify-account"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
          />
          <button onClick={() => check()} disabled={loading}>
            {loading ? 'Scanning…' : 'Check URL'}
          </button>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="muted" style={{ alignSelf: 'center' }}>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="secondary"
              style={{ fontWeight: 500, fontSize: 13 }}
              onClick={() => {
                setUrl(ex);
                check(ex);
              }}
            >
              {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
            </button>
          ))}
        </div>
        {error && <p className="error" style={{ marginBottom: 0 }}>{error}</p>}
      </div>

      {result && (
        <div className="card">
          <div className={`verdict ${result.verdict}`}>
            <span className="dot" />
            {result.verdict}
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>Risk score</strong>
              <strong>{result.riskScore} / 100</strong>
            </div>
            <div className="meter">
              <div
                style={{
                  width: `${result.riskScore}%`,
                  background: VERDICT_COLOR[result.verdict],
                }}
              />
            </div>
          </div>

          <h3 style={{ marginBottom: 4 }}>Scanned URL</h3>
          <HighlightedUrl url={result.url} matches={result.matches} />

          <h3 style={{ marginBottom: 0 }}>
            Matched patterns{' '}
            <span className="muted" style={{ fontWeight: 400 }}>
              ({result.matches.length})
            </span>
          </h3>
          {result.matches.length === 0 ? (
            <p className="muted">No known phishing patterns matched.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Index</th>
                </tr>
              </thead>
              <tbody>
                {result.matches.map((m, i) => (
                  <tr key={`${m.pattern}-${m.index}-${i}`}>
                    <td><code>{m.pattern}</code></td>
                    <td>{m.category}</td>
                    <td>
                      <span
                        className="chip"
                        style={{ background: SEVERITY_COLORS[m.severity], color: '#0b1120' }}
                      >
                        {m.severity}
                      </span>
                    </td>
                    <td>{m.index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
