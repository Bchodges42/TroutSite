import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { registerOwnerRoutes } from '../src/owner/routes.js';
import { insertCorrection } from '../src/corrections/service.js';
import type { CorrectionCategory } from '../src/corrections/schema.js';
import { makeEnv, type TestEnv } from './helpers.js';
import { nextExpectedRunIso, ownerJobRows, ownerEvidenceSummary } from '../src/owner/service.js';

/**
 * OWNER-DASHBOARD lane (ADR 0017): bearer-gated read-only owner surface with
 * its OWN credential. Covers: fail-closed registration, constant-time bearer
 * auth, dashboard shape over seeded jobs_log + temp snapshots, corrections
 * summary reuse, the research queue from a fixture content pack, tolerance of
 * missing watch tables (migration 021 pending), and modest rate limiting.
 */

const OWNER_TOKEN = 'test-owner-token-0123456789abcdef';
const NOW = Date.parse('2026-09-30T12:00:00Z');

let receiptCounter = 0;

function seedJob(
  db: TestEnv['db'],
  job: string,
  status: string,
  startedAt: string,
  finishedAt: string | null,
  detail: unknown = undefined,
): void {
  db.prepare('INSERT INTO jobs_log (job, status, started_at, finished_at, detail) VALUES (?, ?, ?, ?, ?)')
    .run(job, status, startedAt, finishedAt, detail === undefined ? null : JSON.stringify(detail));
}

/** Write a healthy conditions feed + fishability snapshot into a temp snapshots dir. */
function seedSnapshots(dir: string): void {
  const t = '2026-09-30T11:50:00.000Z'; // 10 min before NOW — fresh, buildStale false
  const conditionsDir = join(dir, 'v1', 'conditions');
  mkdirSync(conditionsDir, { recursive: true });
  writeFileSync(
    join(conditionsDir, 'latest.json'),
    JSON.stringify([
      {
        streamId: 'watauga-river',
        readings: [{ gaugeId: '03533000', timestamp: t, cfs: 1200 }],
        score: { value: 72, assessed: true, reasons: [] },
        fetchedAt: t,
        nextExpectedUpdate: '2026-09-30T12:50:00.000Z',
      },
    ]),
  );
  const fishDir = join(dir, 'v1', 'fishability');
  mkdirSync(fishDir, { recursive: true });
  writeFileSync(
    join(fishDir, 'watauga-river.json'),
    JSON.stringify({
      streamId: 'watauga-river',
      fetchedAt: t,
      bySpecies: {
        'smallmouth-bass': {
          comfort: { species: 'smallmouth-bass', value: 61, reasons: [], assessed: false, freshness: null },
          activity: { total: 50, components: [] },
        },
      },
    }),
  );
  mkdirSync(join(dir, 'v1', 'reports'), { recursive: true });
  writeFileSync(join(dir, 'v1', 'streams.json'), JSON.stringify([]));
  writeFileSync(join(dir, 'v1', 'reports', 'recent.json'), JSON.stringify([]));
}

function seedContentPack(dir: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'streams.json'),
    JSON.stringify({
      streams: [
        {
          id: 'elk-river',
          name: 'Elk River',
          regionId: 'tn-south-cumberland',
          targetSpecies: ['smallmouth-bass'],
          seasonMonths: [3, 4, 5],
          seasonKind: 'programmatic',
          officialSources: [
            { label: 'TWRA — Tennessee fishing regulations', url: 'https://www.tn.gov/twra/fishing.html' },
            { label: 'TWRA — Tailwater access maps', url: 'https://www.tn.gov/twra/access.html' },
          ],
          notes: 'Multiple put-in points below the dam.',
          opportunity: { trout: 'seasonal-stocked-trout', evidenceState: 'documented', asOf: '2026', sources: [{ label: 's', url: 'https://www.tn.gov/s', kind: 'program-description', retrieved: '2026-09-01' }] },
        },
        {
          id: 'watauga-river',
          name: 'Watauga River',
          regionId: 'tn-northeast-watauga',
          opportunity: {
            trout: 'unresolved',
            evidenceState: 'conflicting',
            asOf: '2025',
            unresolvedQuestion: 'Does the year-round tailwater claim still hold after the 2024 drawdown study?',
            sources: [{ label: 's', url: 'https://www.tn.gov/s', kind: 'survey', retrieved: '2025-01-01' }],
          },
        },
        {
          id: 'holston-river',
          name: 'Holston River',
          regionId: 'tn-northeast-holston',
          opportunity: {
            trout: 'seasonal-stocked-trout',
            evidenceState: 'historical',
            asOf: '2019',
            sources: [{ label: 's', url: 'https://www.tn.gov/s', kind: 'schedule-table', retrieved: '2019-03-01' }],
          },
        },
        {
          id: 'caney-fork-river',
          name: 'Caney Fork River',
          regionId: 'tn-middle-caney-fork',
          opportunity: {
            trout: 'year-round-trout',
            evidenceState: 'documented',
            asOf: '2026',
            sources: [{ label: 's', url: 'https://www.tn.gov/s', kind: 'agency-assessment', retrieved: '2026-05-01' }],
          },
        },
      ],
    }),
  );
}

function insertTestCorrection(
  db: TestEnv['db'],
  overrides: { waterId?: string; category?: CorrectionCategory; proposed?: string } = {},
): number {
  receiptCounter += 1;
  const row = insertCorrection(db, {
    submission: {
      waterId: overrides.waterId ?? 'watauga-river',
      category: overrides.category ?? 'regulations',
      proposedCorrection: overrides.proposed ?? 'The creel limit shown is the old two-fish rule; update it.',
      submittedAt: NOW,
    },
    receiptHash: Buffer.alloc(32, receiptCounter),
    receiptLast4: 'TEST',
    now: new Date(NOW),
  });
  return row.id;
}

interface AppHandle {
  app: FastifyInstance;
  env: TestEnv;
  snapshotsDir: string;
  contentDir: string;
}

function makeOwnerApp(opts: { withToken?: boolean; limits?: { requestsPerHour: number; requestsPerDay: number } } = {}): AppHandle {
  const env = makeEnv();
  const snapshotsDir = join(env.dir, 'public');
  const contentDir = join(env.dir, 'content-pack');
  seedSnapshots(snapshotsDir);
  seedContentPack(contentDir);
  const app = buildApp({ db: env.db });
  // The exact wiring the coordinator adds to app.ts (one line + env var):
  registerOwnerRoutes(app, {
    db: env.db,
    snapshotsDir,
    contentDir,
    ownerToken: opts.withToken === false ? undefined : OWNER_TOKEN,
    limits: opts.limits,
    schedulerProfile: 'cron',
    now: () => NOW,
  });
  return { app, env, snapshotsDir, contentDir };
}

function get(app: FastifyInstance, url: string, token: string | null = OWNER_TOKEN) {
  return app.inject({
    method: 'GET',
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

let current: AppHandle | null = null;

it('reports actual Windows cadence, unknown schedules, instant ordering and uncapped evidence totals', () => {
  current = makeOwnerApp();
  const { env, contentDir } = current;
  expect(nextExpectedRunIso('gauges', NOW, 'windows')).toBe(new Date(NOW + 3_600_000).toISOString());
  expect(nextExpectedRunIso('gauges', NOW, 'unknown')).toBeNull();
  seedJob(env.db, 'gauges', 'ok', '2026-09-30T12:00:00Z', '2026-09-30T12:01:00Z');
  seedJob(env.db, 'gauges', 'error', '2026-09-30T13:00:00+02:00', '2026-09-30T13:01:00+02:00');
  const rows = ownerJobRows(env.db, new Date(NOW), 'windows', false).jobs;
  expect(rows.find((job) => job.name === 'gauges')).toMatchObject({ lastOutcome: 'ok', lastAttemptAt: '2026-09-30T12:00:00Z', lastSuccessAt: '2026-09-30T12:01:00Z' });
  expect(rows.some((job) => job.name === 'watchlists')).toBe(false);
  writeFileSync(join(contentDir, 'streams.json'), JSON.stringify({ streams: Array.from({ length: 210 }, (_, index) => ({
    id: `water-${index}`, name: `Water ${index}`, regionId: 'tn-west', opportunity: { evidenceState: 'unresolved' },
  })) }));
  const evidence = ownerEvidenceSummary(contentDir);
  expect(evidence?.researchCount).toBe(210);
  expect(evidence?.waters).toHaveLength(200);
});

beforeEach(() => {
  current = null;
});

afterEach(() => {
  if (current) {
    current.app.close();
    current.env.db.close();
    rmSync(current.env.dir, { recursive: true, force: true });
    current = null;
  }
});

describe('credentials — own token, fail-closed registration', () => {
  it('registers NOTHING when OWNER_DASHBOARD_TOKEN is unset (404, not 503-shaped)', async () => {
    current = makeOwnerApp({ withToken: false });
    const res = await get(current.app, '/v1/owner/dashboard', null);
    expect(res.statusCode).toBe(404);
    const withGuess = await get(current.app, '/v1/owner/dashboard', OWNER_TOKEN);
    expect(withGuess.statusCode).toBe(404);
  });

  it('401s a missing or wrong bearer token with an identical body', async () => {
    current = makeOwnerApp();
    const missing = await get(current.app, '/v1/owner/dashboard', null);
    const wrong = await get(current.app, '/v1/owner/dashboard', 'wrong-token-entirely');
    expect(missing.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(missing.json()).toEqual(wrong.json());
    expect(missing.headers['cache-control']).toBe('no-store');
  });

  it('never accepts a valid SHOP token shape as an owner credential', async () => {
    current = makeOwnerApp();
    // A structurally-valid shop portal token (v1.<shopId>.<iat>.<exp>.<sig>) is
    // just another wrong string to this lane — the credential spaces are disjoint.
    const shopShaped = 'v1.42.1760000000000.1860000000000.c2ln';
    const res = await get(current.app, '/v1/owner/dashboard', shopShaped);
    expect(res.statusCode).toBe(401);
  });

  it('rate-limits modestly with Retry-After, even for the correct token', async () => {
    current = makeOwnerApp({ limits: { requestsPerHour: 2, requestsPerDay: 100 } });
    const first = await get(current.app, '/v1/owner/dashboard');
    const second = await get(current.app, '/v1/owner/dashboard');
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    const third = await get(current.app, '/v1/owner/dashboard');
    expect(third.statusCode).toBe(429);
    expect(third.headers['retry-after']).toBeDefined();
  });
});

describe('GET /v1/owner/dashboard', () => {
  function seedPipeline(env: TestEnv): void {
    seedJob(env.db, 'gauges', 'ok', '2026-09-30T11:05:00.000Z', '2026-09-30T11:06:00.000Z', { items: 3 });
    seedJob(env.db, 'snapshots', 'error', '2026-09-29T13:00:00.000Z', '2026-09-29T13:01:00.000Z', {
      error: 'SECRET-NTFY-TOPIC upstream refused',
    });
    seedJob(env.db, 'pressure', 'ok', '2026-09-29T03:35:00.000Z', '2026-09-29T03:36:00.000Z', { items: 8 });
    seedJob(env.db, 'stocking', 'ok', '2026-09-30T06:00:00.000Z', '2026-09-30T06:02:00.000Z', { items: 12 });
    seedJob(env.db, 'bogus job name!!', 'ok', '2026-09-30T07:00:00.000Z', '2026-09-30T07:00:30.000Z');
  }

  it('reports per-job health, flags the never-run expected job, and leaks no detail', async () => {
    current = makeOwnerApp();
    seedPipeline(current.env);
    const res = await get(current.app, '/v1/owner/dashboard');
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.generatedAt).toBe('2026-09-30T12:00:00.000Z');
    const byName = Object.fromEntries(body.jobs.map((j: { name: string }) => [j.name, j]));

    // Expected jobs are all present — including the one that NEVER ran (F05).
    for (const name of ['gauges', 'pressure', 'stocking', 'evidence', 'snapshots']) {
      expect(byName[name]).toBeDefined();
      expect(byName[name].expected).toBe(true);
    }
    expect(byName.evidence.neverRun).toBe(true);
    expect(byName.evidence.lastAttemptAt).toBeNull();
    expect(byName.evidence.runsLast24h).toBe(0);
    expect(byName.evidence.nextExpectedRun).toBeNull();
    expect(byName.evidence.lastOutcome).toBe('unknown');

    expect(byName.gauges.lastOutcome).toBe('ok');
    expect(byName.gauges.lastSuccessAt).toBe('2026-09-30T11:06:00.000Z');
    expect(byName.gauges.runsLast24h).toBe(1);
    expect(byName.snapshots.lastOutcome).toBe('error');
    expect(byName.snapshots.runsLast24h).toBe(1);
    expect(byName.pressure.runsLast24h).toBe(0); // last run > 24h ago
    expect(byName.pressure.lastSuccessAt).toBe('2026-09-29T03:36:00.000Z');

    // nextExpectedRun derives from the schedule map: the next local :05 after
    // the last gauges attempt — strictly in the future, within one hour.
    const next = new Date(byName.gauges.nextExpectedRun);
    const from = new Date('2026-09-30T11:05:00.000Z');
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    expect(next.getTime()).toBeLessThanOrEqual(from.getTime() + 3_600_000);
    expect(next.getMinutes()).toBe(5);
    expect(next.getSeconds()).toBe(0);
    expect(byName.gauges.neverRun).toBe(false);

    // Sanitization floor: the unsanitizable job name is counted, never echoed,
    // and the raw error detail (which embeds a topic-ish secret) never leaks.
    expect(body.omittedJobNames).toBe(1);
    expect(res.body).not.toContain('bogus job name');
    expect(res.body).not.toContain('SECRET-NTFY-TOPIC');
    expect(byName.snapshots).not.toHaveProperty('detail');
  });

  it('summarizes feed health from the existing verdicts + file mtimes', async () => {
    current = makeOwnerApp();
    seedPipeline(current.env);
    const body = (await get(current.app, '/v1/owner/dashboard')).json();

    const conditions = body.feeds.find((f: { area: string }) => f.area === 'conditions');
    const fishability = body.feeds.find((f: { area: string }) => f.area === 'fishability');
    expect(conditions.present).toBe(true);
    expect(conditions.healthy).toBe(true);
    expect(conditions.ageMinutes).toBe(10);
    expect(conditions.fileMtime).toBeTruthy();
    expect(conditions.extra.records).toBe(1);
    expect(conditions.extra.assessed).toBe(1);
    expect(fishability.present).toBe(true);
    expect(fishability.healthy).toBe(true);
    expect(fishability.extra.files).toBe(1);

    expect(body.snapshotFreshness.latestFileTimes.conditions).toBeTruthy();
    expect(body.snapshotFreshness.latestFileTimes.fishability).toBeTruthy();
    expect(body.snapshotFreshness.latestFileTimes.streams).toBeTruthy();
    expect(body.snapshotFreshness.latestFileTimes.reportsRecent).toBeTruthy();
  });

  it('counts corrections by status and degrades gracefully around the watch tables', async () => {
    current = makeOwnerApp();
    insertTestCorrection(current.env.db);
    insertTestCorrection(current.env.db);
    insertTestCorrection(current.env.db, { category: 'access', proposed: 'The boat ramp closure ended in March; please re-check.' });
    const body = (await get(current.app, '/v1/owner/dashboard')).json();

    expect(body.counts.correctionsByStatus.received).toBe(3);
    expect(body.counts.correctionsOpen).toBe(3);
    expect(body.counts.correctionsByStatus.accepted).toBe(0);
    // Migration 021 landed (ADR 0016, parallel lane): fresh DBs count real rows.
    expect(body.counts.watchRules).toBe(0);
    expect(body.counts.pushSubscriptions).toBe(0);

    // Watch rows count without their contents ever being read (the push table
    // stores endpoint keys — the dashboard must only ever see a COUNT).
    current.env.db
      .prepare(
        'INSERT INTO push_subscriptions (subscription_id, endpoint, endpoint_hash, p256dh, auth, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('sub-a', 'https://push.example/a', Buffer.alloc(32, 1), 'k1', 's1', new Date(NOW).toISOString(), new Date(NOW).toISOString());
    current.env.db
      .prepare('INSERT INTO watch_rules (subscription_id, water_id, kind, created_at) VALUES (?, ?, ?, ?)')
      .run('sub-a', 'watauga-river', 'condition', new Date(NOW).toISOString());
    current.env.db
      .prepare('INSERT INTO watch_rules (subscription_id, water_id, kind, created_at) VALUES (?, ?, ?, ?)')
      .run('sub-a', 'elk-river', 'stocking', new Date(NOW).toISOString());
    const after = (await get(current.app, '/v1/owner/dashboard')).json();
    expect(after.counts.watchRules).toBe(2);

    // Tolerance: an UNMIGRATED database (tables absent — pre-021 file) yields
    // null for both, while corrections still count.
    current.env.db.exec('DROP TABLE watch_rules; DROP TABLE push_subscriptions;');
    const bare = (await get(current.app, '/v1/owner/dashboard')).json();
    expect(bare.counts.watchRules).toBeNull();
    expect(bare.counts.pushSubscriptions).toBeNull();
    expect(bare.counts.correctionsOpen).toBe(3);
    expect(bare.jobs.length).toBeGreaterThan(0);
  });

  it('summarizes unresolved evidence from the content pack and omits the section when none is wired', async () => {
    current = makeOwnerApp();
    const body = (await get(current.app, '/v1/owner/dashboard')).json();
    expect(body.unresolvedEvidence).toBeDefined();
    expect(body.unresolvedEvidence.byState).toMatchObject({
      documented: 2,
      conflicting: 1,
      historical: 1,
    });
    expect(body.unresolvedEvidence.researchCount).toBe(2);

    // Without a content dir the section is omitted (never a failure).
    const bare = makeEnv();
    const bareApp = buildApp({ db: bare.db });
    registerOwnerRoutes(bareApp, { db: bare.db, ownerToken: OWNER_TOKEN, now: () => NOW });
    try {
      const res = await get(bareApp, '/v1/owner/dashboard');
      expect(res.statusCode).toBe(200);
      expect(res.json().unresolvedEvidence).toBeUndefined();
    } finally {
      bareApp.close();
      bare.db.close();
      try {
        rmSync(bare.dir, { recursive: true, force: true });
      } catch {
        // Windows: a lingering WAL handle can block the delete; the temp dir is disposable.
      }
    }
  });
});

describe('GET /v1/owner/corrections', () => {
  it('reuses the corrections service behind the owner token and exposes no receipt material', async () => {
    current = makeOwnerApp();
    insertTestCorrection(current.env.db);
    insertTestCorrection(current.env.db, { waterId: 'elk-river', category: 'access' });
    insertTestCorrection(current.env.db, { proposed: 'Stocking moved to the Hwy 70 bridge put-in for 2026.' });

    const all = await get(current.app, '/v1/owner/corrections');
    expect(all.statusCode).toBe(200);
    const list = all.json().corrections;
    expect(list).toHaveLength(3);
    expect(list[0].status).toBe('received');
    expect(typeof list[0].proposedCorrection).toBe('string');
    expect(list[0].riskFlags).toContain('regulations');
    // Summary floor: no receipt hash, no receipt last4, no audit rows.
    expect(Object.keys(list[0])).toEqual(
      expect.arrayContaining(['id', 'status', 'category', 'waterId', 'proposedCorrection', 'receivedAt']),
    );
    expect(all.body).not.toContain('receiptHash');
    expect(all.body).not.toContain('receipt_hash');
    expect(all.body).not.toContain('receiptLast4');

    const filtered = await get(current.app, '/v1/owner/corrections?status=received&limit=1');
    expect(filtered.json().corrections).toHaveLength(1);
    const empty = await get(current.app, '/v1/owner/corrections?status=accepted');
    expect(empty.json().corrections).toHaveLength(0);
    // Junk filters are ignored rather than echoed into SQL.
    const junk = await get(current.app, '/v1/owner/corrections?status=%22%3BDROP%20TABLE');
    expect(junk.statusCode).toBe(200);
  });

  it('answers 401 without the owner token on every owner route', async () => {
    current = makeOwnerApp();
    for (const url of ['/v1/owner/dashboard', '/v1/owner/corrections', '/v1/owner/research-queue']) {
      const res = await get(current.app, url, null);
      expect(res.statusCode).toBe(401);
    }
  });
});

describe('GET /v1/owner/research-queue', () => {
  it('lists conflicting/unresolved/historical waters with claim buckets from the pack', async () => {
    current = makeOwnerApp();
    const res = await get(current.app, '/v1/owner/research-queue');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(2);
    expect(body.truncated).toBe(false);
    const ids = body.queue.map((q: { id: string }) => q.id);
    expect(ids).toEqual(['watauga-river', 'holston-river']); // documented waters excluded

    const watauga = body.queue[0];
    expect(watauga.evidenceState).toBe('conflicting');
    expect(watauga.unresolvedQuestion).toMatch(/drawdown study/);
    // The conflicting water has no species/season/access/regulation evidence at all.
    expect(watauga.claimsNeedingEvidence).toEqual(
      expect.arrayContaining(['species', 'season', 'regulations', 'access']),
    );
    // The documented elk-river control has every claim covered and is NOT queued.
    expect(ids).not.toContain('elk-river');
  });

  it('answers an honest empty queue when no content pack is wired', async () => {
    current = makeOwnerApp();
    const bare = makeEnv();
    const bareApp = buildApp({ db: bare.db });
    registerOwnerRoutes(bareApp, { db: bare.db, ownerToken: OWNER_TOKEN, now: () => NOW });
    try {
      const res = await get(bareApp, '/v1/owner/research-queue');
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ total: 0, truncated: false, queue: [] });
    } finally {
      bareApp.close();
      bare.db.close();
      try {
        rmSync(bare.dir, { recursive: true, force: true });
      } catch {
        // Windows: a lingering WAL handle can block the delete; the temp dir is disposable.
      }
    }
  });
});
