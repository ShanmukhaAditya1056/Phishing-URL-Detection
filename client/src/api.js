// Thin API wrapper. Requests go to /api and are proxied to the backend by Vite.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const detectUrl = (url) =>
  request('/detect', { method: 'POST', body: JSON.stringify({ url }) });

export const getBenchmarks = () => request('/benchmark');

export const runBenchmark = (sizes) =>
  request('/benchmark/run', {
    method: 'POST',
    body: JSON.stringify(sizes ? { sizes } : {}),
  });
