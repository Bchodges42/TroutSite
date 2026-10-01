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
import http from 'node:http';

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

// ---------------------------------------------------------------------------
// F06 (2026-09-29 audit): with a proxy configured, the portal's public history
// read GET /v1/reports/recent.json must be forwarded to the same upstream —
// the admin fetches it same-origin, and before the fix it 404'd on this
// origin while login/publish worked.
// ---------------------------------------------------------------------------

/** Minimal stand-in for the API origin: records every request it receives. */
async function withUpstream(fn) {
  const hits = [];
  const upstream = http.createServer((req, res) => {
    const pathOnly = (req.url ?? '/').split('?')[0];
    hits.push({ method: req.method, path: req.url, authorization: req.headers.authorization });
    if (pathOnly === '/v1/owner/dashboard' || pathOnly === '/v1/owner/publication-preview') {
      const authorized = req.headers.authorization === 'Bearer owner-test';
      res.writeHead(authorized ? 200 : 401, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(authorized ? { state: 'not-prepared', publication: null } : { error: 'unauthorized' }));
      return;
    }
    if (req.method === 'GET' && pathOnly === '/v1/reports/recent.json') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify([{ id: 'rep-upstream-1', body: 'upstream feed' }]));
      return;
    }
    if (req.method === 'GET' && pathOnly === '/v1/portal/me') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ shop: { id: 's' } }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: `upstream not found: ${req.url}` }));
  });
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  const port = upstream.address().port;
  try {
    await fn(`http://127.0.0.1:${port}`, hits);
  } finally {
    await new Promise((r) => upstream.close(r));
  }
}

async function withProxiedServer(upstreamPort, fn, proxySpec = `v1/portal=http://127.0.0.1:${upstreamPort}`) {
  const root = makeFixture();
  const child = spawn(process.execPath, [SCRIPT, root, '0', '--proxy', proxySpec], {
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
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    child.kill();
  }
}

test('F06: public reports feed is forwarded to the API upstream', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    const upstreamPort = new URL(upstreamBase).port;
    await withProxiedServer(upstreamPort, async (base) => {
      const res = await get(`${base}/v1/reports/recent.json`, 'application/json');
      assert.equal(res.status, 200);
      assert.match(res.body, /rep-upstream-1/);
      assert.ok(hits.some((h) => h.method === 'GET' && h.path === '/v1/reports/recent.json'));
    });
  });
});

test('owner reads reach the API with their own bearer and retain its no-store and auth boundary', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    await withProxiedServer(new URL(upstreamBase).port, async (base) => {
      for (const path of ['/v1/owner/dashboard', '/v1/owner/publication-preview']) {
        assert.equal((await fetch(base + path)).status, 401);
        assert.equal((await fetch(base + path, { headers: { authorization: 'Bearer shop-test' } })).status, 401);
        const res = await fetch(base + path, { headers: { authorization: 'Bearer owner-test' } });
        assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), 'no-store');
        assert.ok(hits.some((hit) => hit.path === path && hit.authorization === 'Bearer owner-test'));
      }
    });
  });
});

test('owner forwarding permits only fixed reads and never adds owner actions or a general proxy', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    await withProxiedServer(new URL(upstreamBase).port, async (base) => {
      assert.equal((await fetch(base + '/v1/owner/dashboard', { method: 'POST' })).status, 405);
      assert.equal((await fetch(base + '/v1/owner/publish')).status, 404);
      assert.equal((await fetch(base + '/v1/owner/publication-preview/extra')).status, 404);
      assert.equal(hits.length, 0);
    });
  });
});

test('F06: query strings on the forwarded read reach the upstream', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    const upstreamPort = new URL(upstreamBase).port;
    await withProxiedServer(upstreamPort, async (base) => {
      const res = await fetch(`${base}/v1/reports/recent.json?limit=1`);
      assert.equal(res.status, 200);
      assert.ok(hits.some((h) => h.path.startsWith('/v1/reports/recent.json') && h.path.includes('limit=1')));
    });
  });
});

test('F06: only GET/HEAD of the listed read is forwarded (POST stays local)', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    const upstreamPort = new URL(upstreamBase).port;
    await withProxiedServer(upstreamPort, async (base) => {
      const post = await fetch(`${base}/v1/reports/recent.json`, { method: 'POST', body: '{}' });
      assert.equal(post.status, 405); // static server's method gate, NOT the upstream
      assert.equal(hits.some((h) => h.method === 'POST'), false);
    });
  });
});

test('F06: unlisted /v1/reports paths are NOT forwarded', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    const upstreamPort = new URL(upstreamBase).port;
    await withProxiedServer(upstreamPort, async (base) => {
      const res = await get(`${base}/v1/reports/other.json`, 'application/json');
      assert.equal(res.status, 404); // local 404, upstream untouched
      assert.equal(hits.some((h) => h.path === '/v1/reports/other.json'), false);
    });
  });
});

test('F06: /v1/portal proxy keeps working alongside the public read', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    const upstreamPort = new URL(upstreamBase).port;
    await withProxiedServer(upstreamPort, async (base) => {
      const res = await get(`${base}/v1/portal/me`, 'application/json');
      assert.equal(res.status, 200);
      assert.match(res.body, /"shop"/);
    });
  });
});

test('F06: without --proxy nothing is forwarded (static posture unchanged)', async () => {
  await withUpstream(async (upstreamBase, hits) => {
    const upstreamPort = new URL(upstreamBase).port;
    // Spawn with a proxy spec pointing at a DEAD port? No — spawn WITHOUT --proxy.
    const root = makeFixture();
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
      const res = await get(`http://127.0.0.1:${port}/v1/reports/recent.json`, 'application/json');
      assert.equal(res.status, 404);
      assert.equal(hits.length, 0);
    } finally {
      child.kill();
    }
  });
});
