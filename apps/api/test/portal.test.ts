import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FishabilitySnapshot } from '@trout/contracts';
import { buildApp } from '../src/app.js';
import { buildSnapshots } from '../src/snapshots/build.js';
import { bearerToken, mintShopToken, signShopToken, verifyShopToken } from '../src/portal/tokens.js';
import { makeEnv, type TestEnv } from './helpers.js';

const SECRET = 'test-portal-secret-0123456789abcdef';

describe('shop tokens', () => {
  it('round-trips the expiring v1 format (apps/admin/TOKENS.md) and rejects forgery/tampering', () => {
    const iat = Date.now();
    const token = signShopToken(SECRET, 'test-fly-shop', iat, iat + 86_400_000);
    expect(token).toMatch(/^v1\.test-fly-shop\.\d+\.\d+\.[A-Za-z0-9_-]+$/);
    expect(verifyShopToken(SECRET, token)).toBe('test-fly-shop');
    expect(verifyShopToken('wrong-secret', token)).toBeNull();
    expect(verifyShopToken(SECRET, `${token}x`)).toBeNull();
    expect(verifyShopToken(SECRET, 'garbage')).toBeNull();
    expect(verifyShopToken(SECRET, 'v1..')).toBeNull();
  });

  it('rejects expired tokens (expiry checked before the HMAC)', () => {
    const iat = Date.now() - 86_400_000;
    const expired = signShopToken(SECRET, 'test-fly-shop', iat, iat + 1000);
    const reasons: string[] = [];
    expect(verifyShopToken(SECRET, expired, Date.now(), (r) => reasons.push(r))).toBeNull();
    expect(reasons).toEqual(['expired']);
    expect(mintShopToken(SECRET, 'test-fly-shop', 30)).toMatch(/^v1\.test-fly-shop\./);
  });

  it('rejects invalid prefixes, non-forward expiry, and oversized shop ids', () => {
    const now = Date.now();
    const valid = signShopToken(SECRET, 'test-fly-shop', now, now + 60_000);
    expect(verifyShopToken(SECRET, valid.replace(/^v1\./, 'v2.'))).toBeNull();
    expect(verifyShopToken(SECRET, signShopToken(SECRET, 'test-fly-shop', now, now))).toBeNull();
    expect(verifyShopToken(SECRET, signShopToken(SECRET, 'x'.repeat(81), now, now + 60_000))).toBeNull();
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
    token = mintShopToken(SECRET, 'test-fly-shop', 30);
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
          stateId: 'TN',
          town: 'Elizabethton',
          websiteUrl: 'https://example.com/test-fly-shop',
          reportsEnabled: true,
        },
      });
    });

    it('uses generic auth errors for missing, malformed, expired, and unknown-shop tokens', async () => {
      const missing = await app.inject({ method: 'GET', url: '/v1/portal/me' });
      expect(missing.statusCode).toBe(401);
      expect(missing.json()).toEqual({ error: 'unauthorized' });

      const forged = await app.inject({
        method: 'GET',
        url: '/v1/portal/me',
        headers: { authorization: `Bearer ${mintShopToken('other-secret', 'test-fly-shop', 30)}` },
      });
      expect(forged.statusCode).toBe(401);
      expect(forged.json()).toEqual({ error: 'unauthorized' });

      const now = Date.now();
      const expired = await app.inject({
        method: 'GET',
        url: '/v1/portal/me',
        headers: { authorization: `Bearer ${signShopToken(SECRET, 'test-fly-shop', now - 2_000, now - 1_000)}` },
      });
      expect(expired.statusCode).toBe(401);
      expect(expired.json()).toEqual({ error: 'unauthorized' });

      const unknown = await app.inject({
        method: 'GET',
        url: '/v1/portal/me',
        headers: { authorization: `Bearer ${mintShopToken(SECRET, 'no-such-shop', 30)}` },
      });
      expect(unknown.statusCode).toBe(403);
      expect(unknown.json()).toEqual({ error: 'forbidden' });
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
        readFileSync(join(env.snapshotsDir, 'v1', 'reports', 'recent.json'), 'utf8'),
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

    it('accepts and passes through an https photoUrl, rejects non-https (ADR 0002)', async () => {
      const ok = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, photoUrl: 'https://example.com/photos/bwo.jpg' },
      });
      expect(ok.statusCode).toBe(201);
      const { report } = ok.json() as { report: { photoUrl?: string } };
      expect(report.photoUrl).toBe('https://example.com/photos/bwo.jpg');

      const http = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, photoUrl: 'http://example.com/photos/bwo.jpg' },
      });
      expect(http.statusCode).toBe(422);
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

    it('enforces the app-wide 128 KiB body limit', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/portal/reports',
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, body: 'x'.repeat(130 * 1024) },
      });
      expect(res.statusCode).toBe(413);
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
        headers: { authorization: 'Bearer v1.zm9v.123.456.zm9v' },
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
      expect(disabled.json()).toEqual({ error: 'forbidden' });
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
      expect(me.json()).toEqual({ error: 'service unavailable' });
      const post = await unconfigured.inject({ method: 'POST', url: '/v1/portal/reports', payload: validBody });
      expect(post.statusCode).toBe(503);
      expect(post.json()).toEqual({ error: 'service unavailable' });
      await unconfigured.close();
    });
  });
});

/**
 * F02 regression (2026-09-29 senior code audit): publishing a shop report used to
 * run the ENTIRE snapshot builder without the content pack, overwriting every
 * species assessment with honest-but-degraded cannot-assess rows (the audit's
 * smallmouth snapshot went 90/assessed → 0/unassessed), and a feed-write failure
 * after the DB INSERT returned 500 while the accepted row stayed saved — so the
 * retry double-inserted. These tests pin the corrected contract:
 *   1. the route publishes ONLY v1/reports/recent.json;
 *   2. durable acceptance is separate from feed publication (201 + feed status);
 *   3. the same Idempotency-Key replays the accepted report instead of
 *      double-inserting.
 */
describe('F02 regression: publishing a report must not rewrite the snapshot set', () => {
  const NOW = new Date('2026-09-29T15:00:00Z');
  const validBody = {
    streamId: 'watauga-river',
    date: '2026-09-29',
    body: 'Sulphur spinner fall around 8pm; fish are keyed on size 18 patterns.',
    hotPatterns: [{ patternId: 'sulphur-spinner', hookSize: 18 }],
  };

  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(() => {
    env = makeEnv();
    // The audit scenario: a scheduled build assessed smallmouth bass from the
    // cited pack bands (comfort 90 at 22 °C), then an ordinary report POST ran.
    env.db
      .prepare("UPDATE streams SET target_species = ? WHERE id = 'watauga-river'")
      .run(JSON.stringify(['smallmouth-bass']));
    const ts = new Date(NOW.getTime() - 10 * 60_000).toISOString();
    env.db
      .prepare(
        `INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, observed_at)
         VALUES ('03486000', ?, ?, 350, null, 22, ?)`,
      )
      .run(ts, JSON.stringify({ gaugeId: '03486000', cfs: 350, tempC: 22, timestamp: ts }), ts);
    scheduledBuild(env);
    app = buildApp({ db: env.db, portal: { secret: SECRET, snapshotsDir: env.snapshotsDir } });
    token = mintShopToken(SECRET, 'test-fly-shop', 30);
  });

  afterEach(async () => {
    await app.close();
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  /** Mimics the scheduled snapshots job: species bands from a content pack. */
  function scheduledBuild(env: TestEnv): void {
    const pack = join(env.dir, 'pack');
    mkdirSync(pack, { recursive: true });
    writeFileSync(
      join(pack, 'species.json'),
      JSON.stringify({
        species: [
          {
            id: 'smallmouth-bass',
            displayName: 'Smallmouth bass',
            comfort: {
              optimalC: { min: 20, max: 26.7, basis: 'field-activity', sources: ['https://example.com/smb-optimal'] },
              avoidanceC: { value: 29, basis: 'chronic-mwat', sources: ['https://example.com/smb-avoid'] },
              lethalC: { value: 31, basis: 'acute-mdmt', sources: ['https://example.com/smb-lethal'] },
            },
            spawn: {
              onsetC: { value: 12.8, sources: ['https://example.com/smb-spawn'] },
              endC: { value: 21.1, sources: ['https://example.com/smb-spawn'] },
            },
          },
        ],
      }),
    );
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
  }

  function reportCount(): number {
    return (env.db.prepare('SELECT COUNT(*) AS n FROM shop_reports').get() as { n: number }).n;
  }

  it('publishes only the report feed: species snapshots stay byte-identical', async () => {
    const fishPath = join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json');
    const conditionsPath = join(env.snapshotsDir, 'v1', 'conditions', 'latest.json');
    const fishBefore = readFileSync(fishPath, 'utf8');
    const conditionsBefore = readFileSync(conditionsPath, 'utf8');
    // Precondition: the scheduled build produced the audit's healthy snapshot.
    const before = JSON.parse(fishBefore) as FishabilitySnapshot;
    expect(before.bySpecies['smallmouth-bass']?.comfort).toMatchObject({ value: 90, assessed: true });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/portal/reports',
      headers: { authorization: `Bearer ${token}` },
      payload: validBody,
    });
    expect(res.statusCode).toBe(201);

    // ...and NOTHING else was rewritten: the smallmouth assessment survives.
    expect(readFileSync(fishPath, 'utf8')).toBe(fishBefore);
    expect(readFileSync(conditionsPath, 'utf8')).toBe(conditionsBefore);

    // The feed was refreshed with the new report, and the response says so.
    const { report, feed } = res.json() as { report: { id: string }; feed: { published: boolean } };
    expect(feed.published).toBe(true);
    const feedRows = JSON.parse(
      readFileSync(join(env.snapshotsDir, 'v1', 'reports', 'recent.json'), 'utf8'),
    ) as { id: string }[];
    expect(feedRows.some((r) => r.id === report.id)).toBe(true);
  });

  it('a failed feed write still accepts the report truthfully (201 + feed status, not 500)', async () => {
    // Obstruct exactly the feed path: a directory where recent.json must land,
    // so every write to the feed fails while the rest of the disk is writable.
    const feedPath = join(env.snapshotsDir, 'v1', 'reports', 'recent.json');
    rmSync(feedPath);
    mkdirSync(feedPath, { recursive: true });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/portal/reports',
      headers: { authorization: `Bearer ${token}` },
      payload: validBody,
    });
    // Durable acceptance must not be reported as a server error.
    expect(res.statusCode).toBe(201);
    const body = res.json() as { report: { id: string }; feed: { published: boolean } };
    expect(body.report.id).toBeDefined();
    expect(body.feed.published).toBe(false);
    expect(reportCount()).toBe(1);
  });

  it('retries are idempotent: the same Idempotency-Key replays the accepted report', async () => {
    const feedPath = join(env.snapshotsDir, 'v1', 'reports', 'recent.json');
    rmSync(feedPath);
    mkdirSync(feedPath, { recursive: true }); // feed write fails until cleared
    const headers = { authorization: `Bearer ${token}`, 'idempotency-key': 'retry-key-1' };

    const first = await app.inject({ method: 'POST', url: '/v1/portal/reports', headers, payload: validBody });
    expect(first.statusCode).toBe(201);
    const firstBody = first.json() as {
      report: { id: string };
      idempotentReplay?: boolean;
      feed: { published: boolean };
    };
    expect(firstBody.idempotentReplay).toBeUndefined();
    expect(firstBody.feed.published).toBe(false);

    const retry = await app.inject({ method: 'POST', url: '/v1/portal/reports', headers, payload: validBody });
    expect(retry.statusCode).toBe(200);
    const retryBody = retry.json() as {
      report: { id: string };
      idempotentReplay: boolean;
      feed: { published: boolean };
    };
    expect(retryBody.idempotentReplay).toBe(true);
    expect(retryBody.report.id).toBe(firstBody.report.id);
    expect(retryBody.feed.published).toBe(false);
    expect(reportCount()).toBe(1);

    // Once the obstruction clears, a later retry of the SAME report heals the
    // feed without creating a second row.
    rmSync(feedPath, { recursive: true, force: true });
    const healed = await app.inject({ method: 'POST', url: '/v1/portal/reports', headers, payload: validBody });
    expect(healed.statusCode).toBe(200);
    expect((healed.json() as { feed: { published: boolean } }).feed.published).toBe(true);
    const feedRows = JSON.parse(readFileSync(feedPath, 'utf8')) as { id: string }[];
    expect(feedRows.filter((r) => r.id === firstBody.report.id)).toHaveLength(1);
    expect(reportCount()).toBe(1);

    // A different key is a different report — normal publication keeps working.
    const other = await app.inject({
      method: 'POST',
      url: '/v1/portal/reports',
      headers: { ...headers, 'idempotency-key': 'retry-key-2' },
      payload: validBody,
    });
    expect(other.statusCode).toBe(201);
    expect((other.json() as { idempotentReplay?: boolean }).idempotentReplay).toBeUndefined();
    expect(reportCount()).toBe(2);
  });

  it('rejects a malformed Idempotency-Key with 400 (clients must not silently lose idempotency)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/portal/reports',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': 'unclear key with spaces' },
      payload: validBody,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'invalid idempotency key' });
    expect(reportCount()).toBe(0);
  });
});
