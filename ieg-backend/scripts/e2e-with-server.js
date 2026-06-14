/**
 * Runs E2E smoke tests, starting the API server if health check is not already up.
 * Usage: npm run test:e2e:ci
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { spawn } = require('child_process');
const path = require('path');

const HOST = process.env.API_HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HEALTH_URL = `http://${HOST}:${PORT}/health`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function isServerUp() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(maxMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await isServerUp()) return true;
    await wait(500);
  }
  return false;
}

async function main() {
  let child = null;
  let startedByUs = false;

  if (await isServerUp()) {
    console.log(`API already running at ${HEALTH_URL}\n`);
  } else {
    console.log(`Starting API server on port ${PORT}...\n`);
    startedByUs = true;
    child = spawn(process.execPath, [path.join(__dirname, '../src/server.js')], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    child.stdout?.on('data', (d) => process.stdout.write(d));
    child.stderr?.on('data', (d) => process.stderr.write(d));

    const ready = await waitForServer();
    if (!ready) {
      child.kill();
      console.error(`Server did not become ready at ${HEALTH_URL} within 45s.`);
      console.error('Check MONGO_URI / Atlas connectivity and PORT conflicts.');
      process.exit(1);
    }
    console.log('Server ready.\n');
  }

  const e2e = spawn(process.execPath, [path.join(__dirname, 'e2e-smoke.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, API_HOST: HOST },
    stdio: 'inherit',
  });

  const code = await new Promise((resolve) => {
    e2e.on('close', resolve);
  });

  if (startedByUs && child) {
    child.kill('SIGTERM');
    await wait(500);
  }

  process.exit(code ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
