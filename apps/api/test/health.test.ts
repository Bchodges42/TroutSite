import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildApp } from '../src/app.js';
import { conditionsFeedHealth } from '../src/snapshots/health.js';
import { makeEnv, makeTempDir, type TestEnv } from './helpers.js';

/**
 * C1 (2026-09-07 incident): production served a valid-200 conditions feed in
 * which every record was unassessed and nextExpectedUpdate <= fetchedAt (the
 * builder's "gauges unhealthy" stamp). Health must expose that state instead
 * of reporting a green 200.
 */

function writeFeed(dir: string, rows: unknown[]): string {
  const v1 = join(dir, 'v1', 'conditions');
  mkdirSync(v1, { recursive: true });
  const file = join(v1, 'latest.json');
  writeFileSync(file, JSON.stringify(rows));
  return file;
}

// The incident signature: 146 records, all readings empty, buildStale.
const incidentFeed = (fetchedAt: string) =>
  Array.from({ length: 146 }, () => ({
    streamId: 's',
    readings: [],
    score: { value: 0, assessed: false, reasons: ['No gauge readings are available.'] },
    fetchedAt,
    nextExpectedUpdate: fetchedAt,
  }));

describe('conditionsFeedHealth', () => {
  it('is neutral when no snapshot directory is wired', () => {
    const v = conditionsFeedHealth(undefined);
    expect(v.present).toBe(false);
    expect(v.healthy).toBe(true);
  });

  it('reports missing directory as unhealthy', () => {
    const dir = makeTempDir();
    try {
      const v = conditionsFeedHealth(dir, new Date('2026-09-07T00:00:00Z'));
      expect(v.present).toBe(false);
      expect(v.healthy).toBe(false);
      expect(v.reason).toMatch(/not been generated/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('flags catalog-wide zero observations with the stale build stamp as unhealthy', () => {
    const dir = makeTempDir();
    try {
      writeFeed(dir, incidentFeed('2026-09-06T02:23:49.255Z'));
      const v = conditionsFeedHealth(dir, new Date('2026-09-06T03:00:00Z'));
      expect(v.present).toBe(true);
      expect(v.records).toBe(146);
      expect(v.assessed).toBe(0);
      expect(v.buildStale).toBe(true);
      expect(v.healthy).toBe(false);
      expect(v.reason).toMatch(/zero observations/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stays healthy when observations exist, even with the stale stamp (last-known data preserved)', () => {
    const dir = makeTempDir();
    try {
      const t = '2026-09-06T02:23:49.255Z';
      writeFeed(dir, [
        {
          streamId: 's',
          readings: [{ gaugeId: '03533000', timestamp: t, cfs: 100 }],
          score: { value: 70, assessed: true, reasons: [] },
          fetchedAt: t,
          nextExpectedUpdate: t,
        },
      ]);
      const v = conditionsFeedHealth(dir, new Date('2026-09-06T03:00:00Z'));
      expect(v.buildStale).toBe(true);
      expect(v.assessed).toBe(1);
      expect(v.healthy).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('flags a feed that has not regenerated within its cadence budget', () => {
    const dir = makeTempDir();
    try {
      const t = '2026-09-06T02:23:49.255Z';
      writeFeed(dir, [
        {
          streamId: 's',
          readings: [{ gaugeId: '03533000', timestamp: t, cfs: 100 }],
          score: { value: 70, assessed: true, reasons: [] },
          fetchedAt: t,
          nextExpectedUpdate: '2026-09-06T03:23:49.255Z',
        },
      ]);
      // Assessed data preserved, but nothing has run for 7 hours — the cron
      // is dead even though the last build was fine.
      const v = conditionsFeedHealth(dir, new Date('2026-09-06T09:30:00Z'));
      expect(v.ageMinutes).toBeGreaterThan(360);
      expect(v.healthy).toBe(false);
      expect(v.reason).toMatch(/minutes old/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // T1-10 (review PASS2-3): rows that fail the frozen ConditionSnapshot
  // contract used to count as healthy because the checks only read the fields
  // they happened to know about.
  it('rejects a feed of empty objects as malformed (T1-10)', () => {
    const dir = makeTempDir();
    try {
      writeFeed(dir, [{}]);
      const v = conditionsFeedHealth(dir, new Date('2026-09-06T03:00:00Z'));
      expect(v.present).toBe(true);
      expect(v.records).toBe(1);
      expect(v.healthy).toBe(false);
      expect(v.reason).toMatch(/fail the ConditionSnapshot contract/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects rows with invalid fetchedAt / nextExpectedUpdate timestamps (T1-10)', () => {
    const dir = makeTempDir();
    try {
      writeFeed(dir, [
        {
          streamId: 's',
          readings: [],
          score: { value: 50, assessed: true, reasons: [] },
          fetchedAt: 'not-a-timestamp',
          nextExpectedUpdate: 'also-not-a-timestamp',
        },
      ]);
      const v = conditionsFeedHealth(dir);
      expect(v.healthy).toBe(false);
      expect(v.reason).toMatch(/fail the ConditionSnapshot contract/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a feed when even one row is malformed (T1-10)', () => {
    const dir = makeTempDir();
    try {
      const t = '2026-09-06T02:23:49.255Z';
      writeFeed(dir, [
        {
          streamId: 'good',
          readings: [{ gaugeId: '03533000', timestamp: t, cfs: 100 }],
          score: { value: 70, assessed: true, reasons: [] },
          fetchedAt: t,
          nextExpectedUpdate: t,
        },
        { streamId: 'bad' },
      ]);
      const v = conditionsFeedHealth(dir, new Date('2026-09-06T03:00:00Z'));
      expect(v.records).toBe(2);
      expect(v.assessed).toBe(1);
      expect(v.healthy).toBe(false);
      expect(v.reason).toMatch(/1 of 2/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('GET /healthz conditions verdict', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp> | null = null;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(async () => {
    if (app) await app.close();
    app = null;
    // Close the SQLite handle before removing the tree (Windows EPERM).
    try {
      env.db.close();
    } catch {
      /* already closed */
    }
    rmSync(env.dir, { recursive: true, force: true, maxRetries: 3 });
  });

  it('reports ok:false with a conditions verdict for the incident feed', async () => {
    writeFeed(env.snapshotsDir, incidentFeed('2026-09-06T02:23:49.255Z'));
    app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.conditions.healthy).toBe(false);
    expect(body.conditions.records).toBe(146);
    expect(body.jobs).toBeDefined();
  });

  it('reports ok:true when the feed carries observations', async () => {
    const t = '2026-09-06T02:23:49.255Z';
    writeFeed(env.snapshotsDir, [
      {
        streamId: 's',
        readings: [{ gaugeId: '03533000', timestamp: t, cfs: 100 }],
        score: { value: 70, assessed: true, reasons: [] },
        fetchedAt: new Date().toISOString(),
        nextExpectedUpdate: new Date(Date.now() + 3_600_000).toISOString(),
      },
    ]);
    app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.json().ok).toBe(true);
    expect(res.json().conditions.healthy).toBe(true);
  });
});


describe('GET /healthz degraded (2026-09-16 skew retro)', () => {
  // The ten-day blind spot this block locks shut: jobs.snapshots.status read
  // 'error' inside the payload while `ok` stayed true and nothing acted on it.
  // degraded/degradedReasons lift pipeline health to the top level, additively.
  let env: TestEnv;
  let app: ReturnType<typeof buildApp> | null = null;

  const insertJob = (
    status: string,
    opts: { job?: string; startedMinAgo: number; finishedMinAgo?: number; detail?: unknown } = { startedMinAgo: 1 },
  ): void => {
    const job = opts.job ?? 'snapshots';
    const startedAt = new Date(Date.now() - opts.startedMinAgo * 60_000).toISOString();
    const finishedAt =
      opts.finishedMinAgo === undefined ? null : new Date(Date.now() - opts.finishedMinAgo * 60_000).toISOString();
    env.db
      .prepare('INSERT INTO jobs_log (job, status, started_at, finished_at, detail) VALUES (?, ?, ?, ?, ?)')
      .run(job, status, startedAt, finishedAt, opts.detail === undefined ? null : JSON.stringify(opts.detail));
  };

  beforeEach(() => {
    env = makeEnv();
    // Green read path (C1 gate): a fresh, assessed conditions feed, so `ok`
    // reflects the read path and these tests isolate the degraded flag.
    const t = new Date().toISOString();
    writeFeed(env.snapshotsDir, [
      {
        streamId: 's',
        readings: [{ gaugeId: '03533000', timestamp: t, cfs: 100 }],
        score: { value: 70, assessed: true, reasons: [] },
        fetchedAt: t,
        nextExpectedUpdate: new Date(Date.now() + 3_600_000).toISOString(),
      },
    ]);
  });

  afterEach(async () => {
    if (app) await app.close();
    app = null;
    try {
      env.db.close();
    } catch {
      /* already closed */
    }
    rmSync(env.dir, { recursive: true, force: true, maxRetries: 3 });
  });

  it('flags an errored snapshots run WITHOUT flipping ok (read path still serving)', async () => {
    insertJob('error', {
      startedMinAgo: 65,
      finishedMinAgo: 64,
      detail: { error: 'hydroIdentity is required for selectable line waters' },
    });
    app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    await app.ready();
    const body = (await app.inject({ method: 'GET', url: '/healthz' })).json();
    expect(body.ok).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.degradedReasons.join(' ')).toMatch(
      /snapshots: last run errored: hydroIdentity is required for selectable line waters/,
    );
  });

  it('flags a quiet hourly pipeline (snapshots finished > 24h ago)', async () => {
    insertJob('ok', { startedMinAgo: 25 * 60, finishedMinAgo: 25 * 60 });
    app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    await app.ready();
    const body = (await app.inject({ method: 'GET', url: '/healthz' })).json();
    expect(body.degraded).toBe(true);
    expect(body.degradedReasons.join(' ')).toMatch(/snapshots: finished \d+h ago/);
  });

  it('flags a stuck running run (over an hour in running state)', async () => {
    insertJob('running', { startedMinAgo: 90 });
    app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    await app.ready();
    const body = (await app.inject({ method: 'GET', url: '/healthz' })).json();
    expect(body.degraded).toBe(true);
    expect(body.degradedReasons.join(' ')).toMatch(/snapshots: running for 1h/);
  });

  it('stays clean when the pipeline is fresh and ok', async () => {
    insertJob('ok', { job: 'seed', startedMinAgo: 60, finishedMinAgo: 59 });
    insertJob('ok', { startedMinAgo: 30, finishedMinAgo: 29 });
    app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    await app.ready();
    const body = (await app.inject({ method: 'GET', url: '/healthz' })).json();
    expect(body.ok).toBe(true);
    expect(body.degraded).toBe(false);
    expect(body.degradedReasons).toEqual([]);
  });

  it('the bare app keeps the exact contract shape {ok:true}', async () => {
    const bare = buildApp({ logger: false });
    await bare.ready();
    try {
      expect((await bare.inject({ method: 'GET', url: '/healthz' })).json()).toEqual({ ok: true });
    } finally {
      await bare.close();
    }
  });
});
