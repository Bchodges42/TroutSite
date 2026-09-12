import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app.js';

/**
 * T0-1 regression: a conditional HEAD (If-None-Match on the ETag of a prior
 * HEAD) on any static mount made @fastify/static 7.0.4 call reply.send twice,
 * which threw ERR_HTTP_HEADERS_SENT and exited the process. These tests must
 * run against a REAL listening socket (app.inject never reaches Node's
 * response writer, where the crash lived) and must keep issuing requests
 * after the 304s — a dead process fails everything below.
 */
describe('conditional HEAD on static mounts (T0-1)', () => {
  let dir: string;
  let app: ReturnType<typeof buildApp> | null = null;
  let baseUrl: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trout-t01-test-'));
    mkdirSync(join(dir, 'public', 'v1', 'reports'), { recursive: true });
    mkdirSync(join(dir, 'public', 'content'), { recursive: true });
    mkdirSync(join(dir, 'dist'), { recursive: true });
    writeFileSync(join(dir, 'public', 'v1', 'streams.json'), '[]');
    writeFileSync(join(dir, 'public', 'v1', 'reports', 'recent.json'), '[]');
    writeFileSync(join(dir, 'public', 'content', 'taxa.json'), '[]');
    writeFileSync(join(dir, 'dist', 'index.html'), '<html>trout-pwa</html>');
  });

  afterEach(async () => {
    if (app) await app.close();
    app = null;
    rmSync(dir, { recursive: true, force: true });
  });

  function request(method: 'GET' | 'HEAD', path: string, headers: Record<string, string> = {}): Promise<{ status: number; etag: string | undefined }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        `${baseUrl}${path}`,
        { method, headers },
        (res) => {
          res.resume();
          res.on('end', () => resolve({ status: res.statusCode ?? 0, etag: res.headers.etag }));
        },
      );
      req.on('error', reject);
      req.end();
    });
  }

  const mounts = ['/v1/reports/recent.json', '/content/taxa.json', '/index.html'];

  for (const path of mounts) {
    it(`survives GET/HEAD with and without conditional headers on ${path}`, async () => {
      app = buildApp({
        logger: false,
        webPublicDir: join(dir, 'public'),
        webDistDir: join(dir, 'dist'),
      });
      await app.listen({ port: 0, host: '127.0.0.1' });
      baseUrl = `http://127.0.0.1:${app.server.address().port}`;

      const get = await request('GET', path);
      expect(get.status).toBe(200);

      const head = await request('HEAD', path);
      expect(head.status).toBe(200);
      expect(head.etag).toBeTruthy();

      // The killing sequence — twice, on the real socket.
      const etag = head.etag as string;
      const cond1 = await request('HEAD', path, { 'if-none-match': etag });
      expect(cond1.status).toBe(304);
      const cond2 = await request('HEAD', path, { 'if-none-match': etag });
      expect(cond2.status).toBe(304);

      // Process still alive: another round-trip answers.
      const after = await request('GET', path);
      expect(after.status).toBe(200);
    });
  }

  it('GET revalidation also stays 304 on every mount', async () => {
    app = buildApp({
      logger: false,
      webPublicDir: join(dir, 'public'),
      webDistDir: join(dir, 'dist'),
    });
    await app.listen({ port: 0, host: '127.0.0.1' });
    baseUrl = `http://127.0.0.1:${app.server.address().port}`;

    for (const path of mounts) {
      const head = await request('HEAD', path);
      const getCond = await request('GET', path, { 'if-none-match': head.etag as string });
      expect(getCond.status).toBe(304);
    }
    const alive = await request('HEAD', '/healthz');
    expect(alive.status).toBe(200);
  });
});
