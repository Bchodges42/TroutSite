import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { bearerToken, signShopToken, verifyShopToken } from '../src/portal/tokens.js';
import { makeEnv, type TestEnv } from './helpers.js';

const SECRET = 'test-portal-secret-0123456789abcdef';

describe('shop tokens', () => {
  it('round-trips and rejects forgery/tampering', () => {
    const token = signShopToken(SECRET, 'test-fly-shop');
    expect(token.startsWith('t1.')).toBe(true);
    expect(verifyShopToken(SECRET, token)).toBe('test-fly-shop');
    expect(verifyShopToken('wrong-secret', token)).toBeNull();
    expect(verifyShopToken(SECRET, `${token}x`)).toBeNull();
    expect(verifyShopToken(SECRET, 'garbage')).toBeNull();
    expect(verifyShopToken(SECRET, 't1..')).toBeNull();
  });

  it('extracts bearer tokens case-insensitively', () => {
    expect(bearerToken('Bearer abc')).toBe('abc');
    expect(bearerToken('bearer abc')).toBe('abc');
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
  });
});

describe('portal API', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(() => {
    env = makeEnv();
    app = buildApp({ db: env.db, portal: { secret: SECRET, snapshotsDir: env.snapshotsDir } });
    token = signShopToken(SECRET, 'test-fly-shop');
  });

  afterEach(async () => {
    await app.close();
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  describe('GET /healthz', () => {
    it('returns contract shape without a db, additive jobs summary with one', async () => {
      const bare = buildApp();
      const resBare = await bare.inject({ method: 'GET', url: '/healthz' });
      expect(resBare.json()).toEqual({ ok: true });
      await bare.close();

      const res = await app.inject({ method: 'GET', url: '/healthz' });
      const body = res.json() as { ok: boolean; jobs: Record<string, { status: string }> };
      expect(body.ok).toBe(true);
      // The env seeds fixture content, so the seed run is already in the summary.
      expect(body.jobs.seed?.status).toBe('ok');
    });
  });

  describe('GET /v1/portal/me', () => {
    it('resolves a valid token to the shop identity', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/portal/me', headers: { authorization: `Bearer ${token}` } });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        shop: {
          id: 'test-fly-shop',
          name: 'Test Fly Shop (fixture)',
          town: 'Elizabethton',
          websiteUrl: 'https://example.com/test-fly-shop',
          reportsEnabled: true,
        },
      });
    });

    it('401s on missing/garbage tokens, 403 on unknown shop', async () => {
      const missing = await app.inject({ method: 'GET', url: '/v1/portal/me' });
      expect(missing.statusCode).toBe(401);

      const forged = await app.inject({
        method: 'GET',
        url: '/v1/portal/me',
        headers: { authorization: `Bearer ${signShopToken('other-secret', 'test-fly-shop')}` },
      });
      expect(forged.statusCode).toBe(401);

      const unknown = await app.inject({
        method: 'GET',
        url: '/v1/portal/me',
        headers: { authorization: `Bearer ${signShopToken(SECRET, 'no-such-shop')}` },
      });
      expect(unknown.statusCode).toBe(403);
    });
  });

  describe('POST /v1/portal/reports', () => {
    const validBody = {
      streamId: 'watauga-river',
      date: '2026-09-01',
      body: 'Sulphur spinner fall around 8pm; fish are keyed on size 18 patterns.',
      hotPatterns: [{ patternId: 'sulphur-spinner', hookSize: 18 }],
    };

    it('accepts a valid token, persists the report, regenerates reports/recent.json', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: validBody,
      });
      expect(res.statusCode).toBe(201);
      const { report } = res.json() as { report: { id: string; shopId: string; shopName: string; attributionUrl: string } };
      expect(report.shopId).toBe('test-fly-shop');
      expect(report.shopName).toBe('Test Fly Shop (fixture)');
      expect(report.attributionUrl).toBe('https://example.com/test-fly-shop');

      const row = env.db.prepare('SELECT * FROM shop_reports WHERE id = ?').get(report.id) as { body: string };
      expect(row.body).toContain('Sulphur');

      // Appears in the regenerated snapshot with attribution (DoD).
      const snapshot = JSON.parse(
        readFileSync(join(env.snapshotsDir, 'reports', 'recent.json'), 'utf8'),
      ) as { id: string; shopName: string }[];
      expect(snapshot.some((r) => r.id === report.id && r.shopName === report.shopName)).toBe(true);
    });

    it('rejects HTML injection and normalizes input to plain text', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, body: '<script>alert(1)</script>BWO hatch  <b>today</b>' },
      });
      expect(res.statusCode).toBe(201);
      const { report } = res.json() as { report: { body: string } };
      expect(report.body).not.toContain('<');
      expect(report.body).toContain('BWO hatch');
      expect(report.body).toContain('today');
    });

    it('rejects oversized bodies with 422', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, body: 'x'.repeat(4001) },
      });
      expect(res.statusCode).toBe(422);
    });

    it('rejects unknown streamId and malformed patternIds with 422', async () => {
      const unknown = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, streamId: 'no-such-creek' },
      });
      expect(unknown.statusCode).toBe(422);

      const badPattern = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, hotPatterns: [{ patternId: '' }] },
      });
      expect(badPattern.statusCode).toBe(422);
    });

    it('401/403 on bad auth, 403 when reports disabled, 429 when rate limited', async () => {
      const noToken = await app.inject({ method: 'POST', url: '/v1/portal/reports', payload: validBody });
      expect(noToken.statusCode).toBe(401);

      const badToken = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: 'Bearer t1.zm9v.zm9v' },
        payload: validBody,
      });
      expect(badToken.statusCode).toBe(401);

      env.db.prepare('UPDATE shops SET reports_enabled = 0 WHERE id = ?').run('test-fly-shop');
      const disabled = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: validBody,
      });
      expect(disabled.statusCode).toBe(403);
      env.db.prepare('UPDATE shops SET reports_enabled = 1 WHERE id = ?').run('test-fly-shop');

      const limited = buildApp({
        db: env.db,
        portal: { secret: SECRET, snapshotsDir: env.snapshotsDir, rateLimit: { max: 2, windowMs: 3_600_000 } },
      });
      for (let i = 0; i < 2; i += 1) {
        const ok = await limited.inject({
          method: 'POST',
          url: '/v1/portal/reports',
          headers: { authorization: `Bearer ${token}` },
          payload: { ...validBody, body: `report ${i}` },
        });
        expect(ok.statusCode).toBe(201);
      }
      const fourth = await limited.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, body: 'one too many' },
      });
      expect(fourth.statusCode).toBe(429);
      await limited.close();
    });

    it('fails closed (503) when PORTAL_SECRET is not configured', async () => {
      const unconfigured = buildApp({ db: env.db, portal: { snapshotsDir: env.snapshotsDir } });
      const me = await unconfigured.inject({ method: 'GET', url: '/v1/portal/me' });
      expect(me.statusCode).toBe(503);
      const post = await unconfigured.inject({ method: 'POST', url: '/v1/portal/reports', payload: validBody });
      expect(post.statusCode).toBe(503);
      await unconfigured.close();
    });
  });
});
