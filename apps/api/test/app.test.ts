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

  it('404s on unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
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
});
