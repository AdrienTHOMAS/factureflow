import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: make a GET request and return { status, body }
async function get(url) {
  const { default: http } = await import('node:http');
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// We start the server on a different port to avoid conflict
const TEST_PORT = 8099;

// Patch env before requiring server logic
process.env.PORT = TEST_PORT;

// We'll import the express app logic inline (simpler: just spawn a child)
import { spawn } from 'node:child_process';
import { join } from 'node:path';

let serverProcess;

// Start server before tests
const serverReady = new Promise((resolve, reject) => {
  serverProcess = spawn(process.execPath, [join(__dirname, '../server.js')], {
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProcess.stdout.on('data', (d) => {
    if (d.toString().includes('running')) resolve();
  });
  serverProcess.stderr.on('data', (d) => {
    // ignore sqlite warnings
  });
  serverProcess.on('error', reject);
  // timeout
  setTimeout(() => reject(new Error('Server did not start in time')), 10000);
});

test('server starts and / returns 200', async () => {
  await serverReady;
  const res = await get(`http://localhost:${TEST_PORT}/`);
  assert.equal(res.status, 200);
});

test('/health returns 200 with status ok', async () => {
  await serverReady;
  const res = await get(`http://localhost:${TEST_PORT}/health`);
  assert.equal(res.status, 200);
  const json = JSON.parse(res.body);
  assert.equal(json.status, 'ok');
});

after(() => {
  if (serverProcess) serverProcess.kill();
});
