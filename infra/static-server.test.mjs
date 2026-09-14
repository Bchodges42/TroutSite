/* eslint-disable no-undef -- Node test run directly (no bundler types) */
/**
 * Regression tests for infra/static-server.mjs path containment.
 *
 * The 2026-09-10 audit proved GET /..%2Fsecret.txt (or /%2e%2e/...) read
 * files OUTSIDE the served dist root — decodeURIComponent reconstitutes ../
 * and path.join alone does not contain it. These tests spawn the real server
 * on an ephemeral port and assert every escape shape is refused while normal
 * serving keeps working.
 *
 * Run: node --test infra/static-server.test.mjs   (or `pnpm test:infra`)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const SCRIPT = resolve(import.meta.dirname, 'static-server.mjs');

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'trout-static-'));
  writeFileSync(join(root, 'index.html'), '<html>shell</html>');
  writeFileSync(join(root, 'app.js'), 'console.log(1)');
  mkdirSync(join(root, 'v1'), { recursive: true });
  writeFileSync(join(root, 'v1', 'streams.json'), '[{"id":"t"}]');
  // The secret that must NEVER be reachable lives OUTSIDE the dist root.
  writeFileSync(join(root, '..', 'trout-static-secret.txt'), 'TOO_SECRET_TO_SERVE');
  return root;
}

async function withServer(fn) {
  const root = makeFixture();
  // Port 0 = ephemeral; the server prints its actual port on startup.
  const child = spawn(process.execPath, [SCRIPT, root, '0'], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const port = await new Promise((resolvePort, reject) => {
    let buf = '';
    child.stdout.on('data', (d) => {
      buf += String(d);
      const m = buf.match(/127\.0\.0\.1:(\d+)/);
      if (m) resolvePort(Number(m[1]));
    });
    setTimeout(() => reject(new Error('server did not report a port')), 4000);
  });
  try {
    await fn(`http://127.0.0.1:${port}`, root);
  } finally {
    child.kill();
  }
}

async function get(url, accept = 'text/html,application/json') {
  const res = await fetch(url, { headers: { accept } });
  return { status: res.status, body: await res.text() };
}

test('normal files keep serving', async () => {
  await withServer(async (base) => {
    const shell = await get(base + '/');
    assert.equal(shell.status, 200);
    assert.match(shell.body, /shell/);
    const js = await get(base + '/app.js');
    assert.equal(js.status, 200);
  });
});

test('frozen extensionless snapshot route resolves .json inside the root', async () => {
  await withServer(async (base) => {
    const snap = await get(base + '/v1/streams', 'application/json');
    assert.equal(snap.status, 200);
    assert.match(snap.body, /"id":"t"/);
  });
});

test('encoded traversal (..%2F) is refused', async () => {
  await withServer(async (base) => {
    const res = await get(base + '/..%2Ftrout-static-secret.txt', 'application/json');
    assert.equal(res.status, 404);
    assert.doesNotMatch(res.body, /TOO_SECRET/);
  });
});

test('plain ../ traversal is refused', async () => {
  await withServer(async (base) => {
    const res = await get(base + '/../trout-static-secret.txt', 'application/json');
    assert.equal(res.status, 404);
    assert.doesNotMatch(res.body, /TOO_SECRET/);
  });
});

test('deep encoded traversal to an absolute-target style path is refused', async () => {
  await withServer(async (base) => {
    const res = await get(base + '/%2e%2e/%2e%2e/trout-static-secret.txt', 'application/json');
    assert.equal(res.status, 404);
  });
});

test('traversal into the .json fallback is refused', async () => {
  await withServer(async (base) => {
    // ../trout-static-secret (no extension) must NOT resolve ../trout-static-secret.txt
    const res = await get(base + '/..%2Ftrout-static-secret', 'application/json');
    assert.equal(res.status, 404);
    assert.doesNotMatch(res.body, /TOO_SECRET/);
  });
});
