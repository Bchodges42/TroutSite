import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import http from 'node:http';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const staticServer = resolve(repoRoot, 'infra/static-server.mjs');

async function freePort(): Promise<number> {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('could not allocate a test port');
  const port = address.port;
  await new Promise<void>((resolveClose, rejectClose) => probe.close((err) => (err ? rejectClose(err) : resolveClose())));
  return port;
}

async function startStaticServer(
  distDir: string,
  args: string[] = [],
): Promise<{ child: ChildProcessWithoutNullStreams; port: number }> {
  const port = await freePort();
  const child = spawn(process.execPath, [staticServer, distDir, String(port), ...args], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ready = new Promise<void>((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('static server did not start')), 5_000);
    child.stdout.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('static server on')) {
        clearTimeout(timer);
        resolveReady();
      }
    });
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`static server exited before ready: ${code}`)));
  });
  await ready;
  return { child, port };
}

describe('secondary-origin static server path safety', () => {
  let tempDir: string | undefined;
  let child: ChildProcessWithoutNullStreams | undefined;

  afterEach(() => {
    child?.kill();
    child = undefined;
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  });

  it('rejects encoded traversal, malformed escapes, and non-GET methods', async () => {
    tempDir = mkdtempSync(join('/tmp', 'trout-static-test-'));
    const distDir = join(tempDir, 'dist');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, 'index.html'), '<html>safe shell</html>');
    writeFileSync(join(tempDir, 'secret.txt'), 'should never be served');
    const started = await startStaticServer(distDir);
    child = started.child;
    const base = `http://127.0.0.1:${started.port}`;

    for (const attack of ['/%2e%2e%2fsecret.txt', '/..%2fsecret.txt', `/${'..%2f'.repeat(120)}secret.txt`]) {
      const response = await fetch(`${base}${attack}`);
      expect(response.status, attack).toBe(404);
      expect(await response.text(), attack).not.toContain('should never be served');
    }

    const malformed = await fetch(`${base}/%E0%A4%A`);
    expect(malformed.status).toBe(404);

    const method = await fetch(`${base}/index.html`, { method: 'POST' });
    expect(method.status).toBe(405);
    expect(method.headers.get('allow')).toBe('GET, HEAD');

    const navigation = await fetch(`${base}/client-route`, { headers: { accept: 'text/html' } });
    expect(navigation.status).toBe(200);
    expect(await navigation.text()).toContain('safe shell');
  });

  it('does not expose upstream proxy connection details', async () => {
    tempDir = mkdtempSync(join('/tmp', 'trout-static-proxy-test-'));
    const distDir = join(tempDir, 'dist');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, 'index.html'), '<html>safe shell</html>');
    const started = await startStaticServer(distDir, ['--proxy', 'v1/portal=http://127.0.0.1:1']);
    child = started.child;

    const response = await fetch(`http://127.0.0.1:${started.port}/v1/portal/me`);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'portal API unavailable' });
  });
});

/**
 * T2-45 (review PASS1-2): the proxy used to buffer the entire request body
 * BEFORE contacting the API — an unauthenticated 1 MiB POST was fully accepted
 * into memory, then answered 401. The proxy now enforces a streaming byte cap
 * (honest, missing, or lying Content-Length) and a bounded body deadline, and
 * a rejected request never reaches the upstream API.
 */
describe('portal proxy body limits (T2-45)', () => {
  let tempDir: string | undefined;
  let child: ChildProcessWithoutNullStreams | undefined;
  let upstream: ReturnType<typeof createUpstreamSpy> | undefined;

  function createUpstreamSpy() {
    const seen: { path: string; bytes: number }[] = [];
    const server = http.createServer((req, res) => {
      let bytes = 0;
      req.on('data', (c: Buffer) => {
        bytes += c.length;
      });
      req.on('end', () => {
        seen.push({ path: req.url ?? '', bytes });
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
      });
    });
    return {
      server,
      seen,
      listen(): Promise<number> {
        return new Promise((resolveListen) => {
          server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (!address || typeof address === 'string') throw new Error('no spy port');
            resolveListen(address.port);
          });
        });
      },
      close() {
        server.close();
      },
    };
  }

  afterEach(() => {
    child?.kill();
    child = undefined;
    upstream?.close();
    upstream = undefined;
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  });

  async function startProxy(opts: { maxBodyBytes?: number; timeoutMs?: number } = {}): Promise<number> {
    tempDir = mkdtempSync(join('/tmp', 'trout-t245-'));
    const distDir = join(tempDir, 'dist');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, 'index.html'), '<html>safe shell</html>');

    upstream = createUpstreamSpy();
    const upstreamPort = await upstream.listen();

    const port = await freePort();
    child = spawn(process.execPath, [staticServer, distDir, String(port), '--proxy', `v1/portal=http://127.0.0.1:${upstreamPort}`], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...(opts.maxBodyBytes ? { TROUT_PROXY_MAX_BODY_BYTES: String(opts.maxBodyBytes) } : {}),
        ...(opts.timeoutMs ? { TROUT_PROXY_BODY_TIMEOUT_MS: String(opts.timeoutMs) } : {}),
      },
    });
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new Error('static server did not start')), 5_000);
      child!.stdout.on('data', (chunk: Buffer) => {
        if (chunk.toString().includes('static server on')) {
          clearTimeout(timer);
          resolveReady();
        }
      });
    });
    return port;
  }

  function rawRequest(
    port: number,
    opts: { headers?: Record<string, string>; chunked?: boolean; bodyBytes?: number; chunkSize?: number },
  ): Promise<{ status: number; body: string; ms: number }> {
    return new Promise((resolveRaw, rejectRaw) => {
      const started = Date.now();
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          method: 'POST',
          path: '/v1/portal/reports',
          ...(opts.chunked ? {} : {}),
          headers: opts.headers ?? (opts.chunked ? { 'Transfer-Encoding': 'chunked' } : {}),
        },
        (res) => {
          let body = '';
          res.on('data', (c: Buffer) => {
            body += c.toString();
          });
          res.on('end', () => resolveRaw({ status: res.statusCode ?? 0, body, ms: Date.now() - started }));
        },
      );
      req.on('error', (err) => {
        // The proxy destroys the socket after rejecting; the response may or
        // may not have been delivered before destruction.
        rejectRaw(err);
      });
      const total = opts.bodyBytes ?? 0;
      const chunkSize = opts.chunkSize ?? 64 * 1024;
      let sent = 0;
      const pump = setInterval(() => {
        if (sent >= total) {
          clearInterval(pump);
          req.end();
          return;
        }
        const n = Math.min(chunkSize, total - sent);
        sent += n;
        req.write(Buffer.alloc(n, 0x41));
      }, 5);
    });
  }

  it('forwards small bodies and the API 401 still arrives', async () => {
    const port = await startProxy();
    const out = await rawRequest(port, { headers: { 'content-length': '11' }, bodyBytes: 11, chunkSize: 11 });
    expect(out.status).toBe(401);
    expect(JSON.parse(out.body)).toEqual({ error: 'unauthorized' });
    expect(upstream!.seen).toHaveLength(1);
    expect(upstream!.seen[0]!.bytes).toBe(11);
  }, 20_000);

  it('rejects an oversized body with an honest Content-Length before the upstream is contacted', async () => {
    const port = await startProxy({ maxBodyBytes: 128 * 1024 });
    const out = await rawRequest(port, { headers: { 'content-length': String(2 * 1024 * 1024) }, bodyBytes: 2 * 1024 * 1024 });
    expect(out.status).toBe(413);
    expect(out.ms).toBeLessThan(5_000);
    expect(upstream!.seen).toHaveLength(0);
  }, 30_000);

  it('rejects oversized chunked bodies (missing Content-Length) by streaming count', async () => {
    const port = await startProxy({ maxBodyBytes: 128 * 1024 });
    const out = await rawRequest(port, { chunked: true, bodyBytes: 2 * 1024 * 1024 });
    expect(out.status).toBe(413);
    expect(upstream!.seen).toHaveLength(0);
  }, 30_000);

  it('caps a lying Content-Length: 413 or a parser RST, never upstream traffic, never a hang', async () => {
    // A body LONGER than the declared content-length is an HTTP protocol
    // violation Node's own parser handles by resetting the socket — sometimes
    // before our handler can deliver its 413. Either way the proxy must not
    // buffer unbounded bytes or contact the upstream.
    const port = await startProxy({ maxBodyBytes: 128 * 1024 });
    const outcome = await rawRequest(port, { headers: { 'content-length': '10' }, bodyBytes: 512 * 1024 }).then(
      (r) => ({ status: r.status }),
      (err: NodeJS.ErrnoException) => ({ status: err.code === 'ECONNRESET' ? 'reset' : 'other-error' }),
    );
    expect([413, 'reset']).toContain(outcome.status);
    expect(upstream!.seen).toHaveLength(0);
  }, 30_000);

  it('times out a body that never finishes (idle/bounded duration)', async () => {
    const port = await startProxy({ maxBodyBytes: 128 * 1024, timeoutMs: 500 });
    const started = Date.now();
    const out = await new Promise<{ status: number }>((resolve, rejectHard) => {
      const hardTimer = setTimeout(() => rejectHard(new Error('proxy never answered the timed-out body')), 15_000);
      const req = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/v1/portal/reports', headers: { 'Transfer-Encoding': 'chunked' } }, (res) => {
        res.resume();
        res.on('end', () => {
          clearTimeout(hardTimer);
          resolve({ status: res.statusCode ?? 0 });
        });
      });
      req.write('a little');
      // never end() — the deadline must answer
      req.on('error', () => {
        /* socket destroyed after rejection */
      });
    });
    const elapsed = Date.now() - started;
    expect(out.status).toBe(408);
    expect(elapsed).toBeLessThan(5_000);
    expect(upstream!.seen).toHaveLength(0);
  }, 20_000);
});
