import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app.js';

describe('GET /healthz', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('responds 200 with { ok: true }', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('sets security headers on health and error responses', async () => {
    const health = await app.inject({ method: 'GET', url: '/healthz' });
    const missing = await app.inject({ method: 'GET', url: '/nope' });
    for (const res of [health, missing]) {
      expect(res.headers['strict-transport-security']).toBe('max-age=63072000');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['permissions-policy']).toBe('geolocation=(self), camera=(), microphone=()');
    }
    expect(health.headers['cache-control']).toBe('no-store');
  });

  it('protects health telemetry when a watchdog token is configured', async () => {
    const protectedApp = buildApp({ logger: false, watchdogToken: 'watchdog-test-secret' });
    const missing = await protectedApp.inject({ method: 'GET', url: '/healthz' });
    const wrong = await protectedApp.inject({
      method: 'GET',
      url: '/healthz',
      headers: { 'x-watchdog-token': 'wrong' },
    });
    const correct = await protectedApp.inject({
      method: 'GET',
      url: '/healthz',
      headers: { 'x-watchdog-token': 'watchdog-test-secret' },
    });
    expect(missing.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(missing.json()).toEqual({ error: 'unauthorized' });
    expect(wrong.json()).toEqual({ error: 'unauthorized' });
    expect(correct.statusCode).toBe(200);
    expect(correct.json()).toEqual({ ok: true });
    expect(missing.headers['cache-control']).toBe('no-store');
    await protectedApp.close();
  });

  it('404s on unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
  });

  it('does not let non-GET methods reach the SPA fallback', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'trout-fallback-test-'));
    writeFileSync(join(dir, 'index.html'), '<html>shell</html>');
    const withDist = buildApp({ logger: false, webDistDir: dir });
    try {
      const res = await withDist.inject({ method: 'POST', url: '/healthz' });
      expect(res.statusCode).toBe(405);
      expect(res.headers.allow).toBe('GET, HEAD');
      expect(res.json()).toEqual({ error: 'method not allowed' });
    } finally {
      await withDist.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('static read path (ADR 0004, integration §12 #10)', () => {
  let dir: string;
  let app: ReturnType<typeof buildApp> | null = null;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trout-app-test-'));
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

  it('boots with both snapshot + dist trees and serves each at its URL', async () => {
    // Regression: two prefix:'/' statics collided ('/*' clash) and trout-api
    // crash-looped under pm2. Each tree now mounts at its own prefix.
    app = buildApp({
      logger: false,
      webPublicDir: join(dir, 'public'),
      webDistDir: join(dir, 'dist'),
    });
    await app.ready();

    const reports = await app.inject({ method: 'GET', url: '/v1/reports/recent.json' });
    expect(reports.statusCode).toBe(200);
    expect(reports.json()).toEqual([]);

    const taxa = await app.inject({ method: 'GET', url: '/content/taxa.json' });
    expect(taxa.statusCode).toBe(200);

    const shell = await app.inject({ method: 'GET', url: '/' });
    expect(shell.statusCode).toBe(200);
    expect(shell.body).toContain('trout-pwa');
  });

  it('refuses path traversal out of the static roots (audit 2026-09-10)', async () => {
    // A file OUTSIDE both served roots must be unreachable through every
    // encoded-../ shape (pins the @fastify/static >=10.1.1 guard + our own
    // roots; the raw infra/static-server.mjs bug is covered by
    // infra/static-server.test.mjs).
    writeFileSync(join(dir, 'secret-outside-roots.txt'), 'TOO_SECRET_TO_SERVE');
    app = buildApp({
      logger: false,
      webPublicDir: join(dir, 'public'),
      webDistDir: join(dir, 'dist'),
    });
    await app.ready();
    // The router (@fastify/static >=10.1.1 + find-my-way) normalizes or rejects
    // every ../ shape; depending on shape the response is a 403/404 or the PWA
    // shell fallback. The SECURITY property under test: the outside-the-roots
    // file never ships — no 200 may carry file content, only the HTML shell.
    const attempts = [
      '/v1/../secret-outside-roots.txt',
      '/v1/%2e%2e/secret-outside-roots.txt',
      '/v1/..%2fsecret-outside-roots.txt',
      '/content/..%2F..%2Fsecret-outside-roots.txt',
      '/..%2Fsecret-outside-roots.txt',
    ];
    for (const url of attempts) {
      const res = await app.inject({ method: 'GET', url, headers: { accept: 'application/json' } });
      expect(res.body).not.toContain('TOO_SECRET');
      if (res.statusCode === 200) {
        expect(res.headers['content-type']).toContain('text/html');
      }
    }
  });

  it('falls back to the PWA shell for client routes but 404s API paths', async () => {
    app = buildApp({
      logger: false,
      webPublicDir: join(dir, 'public'),
      webDistDir: join(dir, 'dist'),
    });
    await app.ready();

    const deep = await app.inject({ method: 'GET', url: '/conditions' });
    expect(deep.statusCode).toBe(200);
    expect(deep.body).toContain('trout-pwa');

    const missing = await app.inject({ method: 'GET', url: '/v1/reports/nope.json' });
    expect(missing.statusCode).toBe(404);

    const backingFile = await app.inject({ method: 'GET', url: '/v1/streams.json' });
    expect(backingFile.statusCode).toBe(404);
  });

  it('answers GET /v1/streams live from the snapshot file', async () => {
    app = buildApp({
      logger: false,
      webPublicDir: join(dir, 'public'),
      webDistDir: join(dir, 'dist'),
    });
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/v1/streams?state=TN' });
    // Empty snapshot file parses as an empty list (filter over zero streams).
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('holds the allowedPath guard against static route-guard bypass vectors (T2-47)', async () => {
    // Audit probe (GHSA-83w8-p2f5-377r): '//'-prefixed paths routed differently
    // through @fastify/static 7 and served the blocked implementation file.
    app = buildApp({
      logger: false,
      webPublicDir: join(dir, 'public'),
      webDistDir: join(dir, 'dist'),
    });
    await app.ready();

    const vectors = [
      '/v1/streams.json',
      '/v1/streams.json/',
      '/v1/./streams.json',
      '/v1/%2e/streams.json',
      '/v1//streams.json',
      '/v1/streams%2ejson',
      '/v1/STREAMS.JSON',
      '/v1/streams.json?x=1',
      '/./v1/streams.json',
      '/content//taxa.json',
    ];
    for (const v of vectors) {
      const res = await app.inject({ method: 'GET', url: v });
      expect(res.statusCode, v).not.toBe(200);
      expect(res.body, v).not.toContain('streams');
    }
    // The frozen contract route still answers normally.
    const ok = await app.inject({ method: 'GET', url: '/v1/streams' });
    expect(ok.statusCode).toBe(200);
  });
});
