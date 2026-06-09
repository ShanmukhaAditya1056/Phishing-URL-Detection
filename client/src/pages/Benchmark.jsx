import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getBenchmarks, runBenchmark } from '../api.js';

const ALGOS = ['kmp', 'rabinKarp', 'ahoCorasick'];
const COLORS = { kmp: '#38bdf8', rabinKarp: '#f59e0b', ahoCorasick: '#22c55e' };
const LABELS = { kmp: 'KMP', rabinKarp: 'Rabin-Karp', ahoCorasick: 'Aho-Corasick' };

const COMPLEXITY = [
  { algo: 'KMP', time: 'O(n + m) per pattern', space: 'O(m)', multi: 'No' },
  { algo: 'Rabin-Karp', time: 'O(n + m) avg, O(nm) worst', space: 'O(1)', multi: 'With multiple runs' },
  { algo: 'Aho-Corasick', time: 'O(n + m + z) total', space: 'O(m·Σ)', multi: 'Yes — single pass' },
];

// Keep only the most recent measurement per (algorithm, inputSize), then pivot
// into rows keyed by inputSize for charting.
function pivot(results, metric) {
  const latest = new Map(); // key -> doc
  for (const r of results) {
    const key = `${r.algorithm}@${r.inputSize}`;
    const prev = latest.get(key);
    if (!prev || new Date(r.runAt) > new Date(prev.runAt)) latest.set(key, r);
  }

  const bySize = new Map();
  for (const r of latest.values()) {
    if (!bySize.has(r.inputSize)) bySize.set(r.inputSize, { inputSize: r.inputSize });
    bySize.get(r.inputSize)[r.algorithm] = r[metric];
  }
  return [...bySize.values()].sort((a, b) => a.inputSize - b.inputSize);
}

export default function Benchmark() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setResults(await getBenchmarks());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRun() {
    setLoading(true);
    setError('');
    try {
      await runBenchmark();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const timeData = pivot(results, 'avgTimeMs');
  const memData = pivot(results, 'peakMemoryKb');
  const hasData = timeData.length > 0;

  return (
    <>
      <h1>Benchmark</h1>
      <p className="subtitle">
        Empirical comparison of KMP, Rabin-Karp and Aho-Corasick across growing input sizes.
      </p>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted">
            {hasData
              ? `Showing latest results across ${timeData.length} input sizes.`
              : 'No results yet — run the benchmark to generate data.'}
          </span>
          <button onClick={handleRun} disabled={loading}>
            {loading ? 'Running…' : 'Run benchmark'}
          </button>
        </div>
        {error && <p className="error" style={{ marginBottom: 0 }}>{error}</p>}
      </div>

      {hasData && (
        <div className="grid-2">
          <div className="card">
            <h3>Average time vs input size (ms)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="inputSize" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Legend />
                {ALGOS.map((a) => (
                  <Line key={a} type="monotone" dataKey={a} name={LABELS[a]} stroke={COLORS[a]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>Peak heap memory (KB)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="inputSize" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Legend />
                {ALGOS.map((a) => (
                  <Bar key={a} dataKey={a} name={LABELS[a]} fill={COLORS[a]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Complexity summary</h3>
        <table>
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Time complexity</th>
              <th>Space</th>
              <th>Multi-pattern</th>
            </tr>
          </thead>
          <tbody>
            {COMPLEXITY.map((c) => (
              <tr key={c.algo}>
                <td style={{ color: COLORS[Object.keys(LABELS).find((k) => LABELS[k] === c.algo)] }}>
                  <strong>{c.algo}</strong>
                </td>
                <td>{c.time}</td>
                <td>{c.space}</td>
                <td>{c.multi}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ marginBottom: 0 }}>
          n = text length, m = total pattern length, z = number of matches, Σ = alphabet size.
        </p>
      </div>
    </>
  );
}
