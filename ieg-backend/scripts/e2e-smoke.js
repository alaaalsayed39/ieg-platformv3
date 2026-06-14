/**
 * End-to-end API smoke tests against running server + Atlas.
 *
 * Usage:
 *   npm run dev          # terminal 1 — start API first
 *   npm run test:e2e     # terminal 2
 *
 * Or one command (starts server if not already up):
 *   npm run test:e2e:ci
 *
 * Env:
 *   PORT / API_HOST / API_BASE_URL — override target (default 127.0.0.1:5000)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const HOST = process.env.API_HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const API_ROOT = process.env.API_BASE_URL || `http://${HOST}:${PORT}`;
const BASE = `${API_ROOT.replace(/\/$/, '')}/api/v1`;
const HEALTH_URL = `${API_ROOT.replace(/\/$/, '')}/health`;

const results = [];

const explainFetchError = (err, url) => {
  const code = err?.cause?.code || err?.code;
  if (code === 'ECONNREFUSED') {
    return `Cannot connect to ${url} — backend is not running. Start it with: npm run dev`;
  }
  if (code === 'ENOTFOUND') {
    return `Host not found for ${url} — check API_HOST / API_BASE_URL in .env`;
  }
  if (err?.name === 'TimeoutError' || code === 'ETIMEDOUT') {
    return `Timeout reaching ${url} — server may be hung or Atlas connection blocking startup`;
  }
  return err?.message || String(err);
};

const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    const msg = explainFetchError(e, API_ROOT);
    results.push({ name, ok: false, error: msg });
    console.log(`  ✗ ${name}: ${msg}`);
  }
};

const json = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
};

const fetchWithTimeout = (url, options = {}, ms = 15000) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(ms) });

let buyerToken, exporterToken, adminToken;

async function login(email, password) {
  const res = await fetchWithTimeout(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await json(res);
  return data.data.accessToken;
}

/** Preflight: ensure API is reachable before running tests */
async function assertServerUp() {
  try {
    const res = await fetchWithTimeout(HEALTH_URL, {}, 5000);
    if (!res.ok) {
      throw new Error(`Health returned HTTP ${res.status}`);
    }
    const h = await res.json();
    if (h.database?.status !== 'connected') {
      throw new Error(`API is up but MongoDB status is "${h.database?.status}" — check MONGO_URI / Atlas`);
    }
    return h;
  } catch (e) {
    const msg = explainFetchError(e, HEALTH_URL);
    console.error('\n  Preflight failed:', msg);
    console.error('\n  Target configuration:');
    console.error(`    HEALTH_URL : ${HEALTH_URL}`);
    console.error(`    API_BASE   : ${BASE}`);
    console.error(`    PORT (.env): ${process.env.PORT || '(default 5000)'}`);
    console.error(`    CLIENT_URL : ${process.env.CLIENT_URL || '(not set)'}`);
    console.error('\n  CORS only affects browsers — "fetch failed" in Node means TCP connection refused.\n');
    throw new Error(msg);
  }
}

async function main() {
  console.log('\nIEG E2E Smoke Tests');
  console.log(`  Target: ${HEALTH_URL}\n`);

  const health = await assertServerUp();
  console.log(`  Preflight OK — database: ${health.database?.name} (${health.database?.provider})\n`);

  await test('Health + Atlas', async () => {
    if (!health.database?.name) throw new Error('No database name in health response');
  });

  await test('Public marketplace products', async () => {
    const res = await fetchWithTimeout(`${BASE}/products?limit=5`);
    const data = await json(res);
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No published products — run: npm run seed');
    }
  });

  await test('Buyer login', async () => {
    buyerToken = await login('buyer1@ieg.com', 'Buyer@1234');
  });

  await test('Exporter login', async () => {
    exporterToken = await login('exporter1@ieg.com', 'Export@1234');
  });

  await test('Admin login', async () => {
    adminToken = await login('admin@ieg.com', 'Admin@1234');
  });

  await test('Exporter quote list', async () => {
    const res = await fetchWithTimeout(`${BASE}/orders/quotes/list`, {
      headers: { Authorization: `Bearer ${exporterToken}` },
    });
    const data = await json(res);
    if (!Array.isArray(data.data)) throw new Error('Invalid quotes response');
  });

  await test('Buyer orders stats', async () => {
    const res = await fetchWithTimeout(`${BASE}/orders/stats`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    await json(res);
  });

  await test('Shipping requests API', async () => {
    const res = await fetchWithTimeout(`${BASE}/shipping-requests?status=pending`, {
      headers: { Authorization: `Bearer ${await login('shipper1@ieg.com', 'Ship@1234')}` },
    });
    const data = await json(res);
    if (!Array.isArray(data.data)) throw new Error('Invalid shipping requests');
  });

  await test('Shipments export report', async () => {
    const res = await fetchWithTimeout(`${BASE}/shipments/export/report`, {
      headers: { Authorization: `Bearer ${await login('shipper1@ieg.com', 'Ship@1234')}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const text = await res.text();
    if (!text.includes('Container')) throw new Error('Invalid CSV');
  });

  await test('Admin dashboard', async () => {
    const res = await fetchWithTimeout(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await json(res);
    if (!data.data?.stats) throw new Error('No dashboard stats');
  });

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
