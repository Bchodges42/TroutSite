import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConditionSnapshotSchema,
  ShopSchema,
  ShopReportSchema,
  StreamSchema,
  StockingEventSchema,
  scoreConditions,
} from '@trout/contracts';
import { buildSnapshots, recentReports } from '../src/snapshots/build.js';
import { runGaugesJob } from '../src/ingest/usgs.js';
import { runStockingJob } from '../src/ingest/stockingJob.js';
import { TWRA_PAGE_URL } from '../src/ingest/stocking/tn.js';
import { deterministicId } from '../src/lib/ids.js';
import { makeEnv, mockFetch, readFixture, type TestEnv } from './helpers.js';

const NOW = new Date('2026-09-02T17:00:00Z');

describe('buildSnapshots', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('produces every endpoint snapshot, all contract-valid, with no temp leftovers', async () => {
    // Populate SQLite through the real pipeline: gauges (fixture) + stocking (fixture).
    // Fixture data keyed to the gauge the seeded stream actually requests.
    const usgsFixture = readFixture('USGS/iv-2026-09-02.json').replaceAll('03586500', '03486000');
    const usgs = mockFetch(200, () => usgsFixture);
    await runGaugesJob(env.db, { userAgent: 'test-agent/1.0', fetchImpl: usgs.fetchImpl });
    const twra = mockFetch(200, (url) =>
      url === TWRA_PAGE_URL
        ? readFixture('TN/2026-09-02.html')
        : readFixture('TN/2026-09-02.exceldriven.json'),
    );
    await runStockingJob(env.db, { fetchImpl: twra.fetchImpl, userAgent: 'test-agent/1.0', rawDir: env.rawDir, now: NOW });

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });

    expect(result.streams).toBe(2);
    expect(result.conditions).toBe(2);
    expect(result.stockingByState.TN).toBeGreaterThan(500);
    expect(result.shopsByState.TN).toBe(1);

    // Files match the endpoint map; no atomic-write temp files left behind.
    const rel = (p: string) => p.slice(env.snapshotsDir.length + 1);
    const written = result.files.map(rel).sort();
    expect(written).toContain(join('v1', 'streams.json'));
    expect(written).toContain(join('v1', 'conditions', 'latest.json'));
    expect(written).toContain(join('v1', 'stocking', 'TN.json'));
    expect(written).toContain(join('v1', 'stocking', 'TN-recent.json'));
    expect(written).toContain(join('v1', 'shops', 'TN.json'));
    expect(written).toContain(join('v1', 'reports', 'recent.json'));
    const all = listFiles(env.snapshotsDir);
    expect(all.every((f) => !f.includes('.tmp-'))).toBe(true);

    // Every payload validates against the frozen contract schemas.
    const streams = JSON.parse(readOut(env.snapshotsDir, join('v1', 'streams.json'))) as unknown[];
    expect(streams).toHaveLength(2);
    streams.forEach((s) => expect(StreamSchema.safeParse(s).success).toBe(true));

    // 3-month recency slice (S1 window/sort support): subset of full history,
    // every row inside [NOW-90d, ∞) (upcoming schedules stay in-window),
    // newest-first ordering.
    const fullStocking = JSON.parse(readOut(env.snapshotsDir, join('v1', 'stocking', 'TN.json'))) as {
      date: string;
      streamName: string;
    }[];
    const recentStocking = JSON.parse(readOut(env.snapshotsDir, join('v1', 'stocking', 'TN-recent.json'))) as {
      date: string;
      streamName: string;
    }[];
    expect(recentStocking.length).toBeGreaterThan(0);
    expect(recentStocking.length).toBeLessThan(fullStocking.length);
    const cutoff = new Date(NOW.getTime() - 90 * 86_400_000).toISOString().slice(0, 10);
    for (const e of recentStocking) expect(e.date >= cutoff).toBe(true);
    for (let i = 1; i < recentStocking.length; i += 1) {
      expect(recentStocking[i - 1].date >= recentStocking[i].date).toBe(true);
    }
    expect(result.stockingRecentByState.TN).toBe(recentStocking.length);


    const conditions = JSON.parse(readOut(env.snapshotsDir, join('v1', 'conditions', 'latest.json'))) as unknown[];
    expect(conditions).toHaveLength(2);
    conditions.forEach((c) => expect(ConditionSnapshotSchema.safeParse(c).success).toBe(true));
    const holston = conditions.find((c) => (c as { streamId: string }).streamId === 'watauga-river') as {
      readings: { gaugeId: string }[];
      score: { value: number };
      fetchedAt: string;
      nextExpectedUpdate: string;
    };
    expect(holston.readings.map((r) => r.gaugeId)).toEqual(['03486000']);
    expect(holston.score.value).toBeGreaterThan(0);
    expect(holston.fetchedAt).toBe(NOW.toISOString());
    // Healthy gauges job → fresh until now + 1h.
    expect(Date.parse(holston.nextExpectedUpdate) - Date.parse(holston.fetchedAt)).toBe(3_600_000);

    const stocking = JSON.parse(readOut(env.snapshotsDir, join('v1', 'stocking', 'TN.json'))) as unknown[];
    stocking.forEach((e) => expect(StockingEventSchema.safeParse(e).success).toBe(true));
    expect(stocking.length).toBeGreaterThan(500);

    const shops = JSON.parse(readOut(env.snapshotsDir, join('v1', 'shops', 'TN.json'))) as unknown[];
    expect(shops).toHaveLength(1);
    shops.forEach((s) => expect(ShopSchema.safeParse(s).success).toBe(true));

    const reports = JSON.parse(readOut(env.snapshotsDir, join('v1', 'reports', 'recent.json'))) as unknown[];
    expect(reports).toEqual([]);
  });

  it('flags conditions stale (nextExpectedUpdate = now) when the gauges job errored', async () => {
    const bad = mockFetch(404, () => 'gone');
    await expect(
      runGaugesJob(env.db, { userAgent: 'test-agent/1.0', fetchImpl: bad.fetchImpl }),
    ).rejects.toThrow(/HTTP 404/);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    const conditions = JSON.parse(
      readOut(env.snapshotsDir, join('v1', 'conditions', 'latest.json')),
    ) as { nextExpectedUpdate: string; fetchedAt: string }[];
    for (const c of conditions) {
      // Immediately stale: consumers treat now > nextExpectedUpdate as stale (documented).
      expect(Date.parse(c.nextExpectedUpdate)).toBe(Date.parse(c.fetchedAt));
    }
  });

  it('overwrites existing snapshot files atomically and prunes orphan state files', () => {
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    // Second run with a different timestamp must replace, not append or corrupt.
    const later = new Date(NOW.getTime() + 60_000);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: later });
    const conditions = JSON.parse(
      readOut(env.snapshotsDir, join('v1', 'conditions', 'latest.json')),
    ) as { fetchedAt: string }[];
    expect(conditions[0]?.fetchedAt).toBe(later.toISOString());
    expect(listFiles(env.snapshotsDir).filter((f) => f.includes('.tmp-'))).toHaveLength(0);

    // Orphan pruning: a stocking file for a state with no events disappears.
    const orphan = join(env.snapshotsDir, 'v1', 'stocking', 'ZZ.json');
    mkdirSync(join(env.snapshotsDir, 'v1', 'stocking'), { recursive: true });
    writeRaw(orphan, '[]');
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: later });
    expect(existsSync(orphan)).toBe(false);
  });

  it('limits reports/recent.json to the last 30 days, newest first', () => {
    const shop = env.db.prepare("SELECT id, website_url FROM shops WHERE id='test-fly-shop'").get() as {
      id: string;
      website_url: string;
    };
    const insert = env.db.prepare(
      `INSERT INTO shop_reports (id, shop_id, stream_id, date, body, hot_patterns, attribution_url, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const mk = (ageDays: number) => {
      const publishedAt = new Date(NOW.getTime() - ageDays * 86_400_000).toISOString();
      insert.run(
        deterministicId('report', String(ageDays)),
        shop.id,
        'watauga-river',
        publishedAt.slice(0, 10),
        `Report ${ageDays} days old`,
        '[]',
        shop.website_url,
        publishedAt,
      );
    };
    mk(1);
    mk(10);
    mk(29);
    mk(31); // outside the window
    mk(400); // outside the window

    const reports = recentReports(env.db, NOW);
    expect(reports.map((r) => r.date)).toEqual([
      new Date(NOW.getTime() - 86_400_000).toISOString().slice(0, 10),
      new Date(NOW.getTime() - 10 * 86_400_000).toISOString().slice(0, 10),
      new Date(NOW.getTime() - 29 * 86_400_000).toISOString().slice(0, 10),
    ]);
    reports.forEach((r) => expect(ShopReportSchema.safeParse(r).success).toBe(true));
    // Attribution is present on every report.
    expect(reports.every((r) => r.shopName === 'Test Fly Shop (fixture)' && r.attributionUrl === shop.website_url)).toBe(true);

    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    const written = JSON.parse(readOut(env.snapshotsDir, join('v1', 'reports', 'recent.json'))) as unknown[];
    expect(written).toHaveLength(3);
  });
});

/** Scoring parity: the snapshot's score must equal what a client recomputes offline
 *  from the same snapshot readings with the frozen pure function (non-negotiable). */
describe('scoring parity (server snapshot == client recompute)', () => {
  function insertReading(
    db: TestEnv['db'],
    reading: { gaugeId: string; cfs?: number; heightFt?: number; tempC?: number; timestamp: string },
  ): void {
    db.prepare(
      `INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, observed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      reading.gaugeId,
      reading.timestamp,
      JSON.stringify(reading),
      reading.cfs ?? null,
      reading.heightFt ?? null,
      reading.tempC ?? null,
      reading.timestamp,
    );
  }

  function loadConditions(snapshotsDir: string): {
    streamId: string;
    readings: Parameters<typeof scoreConditions>[1];
    score: { value: number; reasons: string[] };
  }[] {
    return JSON.parse(readOut(snapshotsDir, join('v1', 'conditions', 'latest.json')));
  }

  function loadStream(snapshotsDir: string, id: string): Parameters<typeof scoreConditions>[0] {
    const all = JSON.parse(readOut(snapshotsDir, join('v1', 'streams.json'))) as unknown[];
    return StreamSchema.parse(all.find((s) => (s as { id: string }).id === id));
  }

  it('builder score equals scoreConditions recomputed from snapshot readings (ideal flow + temp)', () => {
    const env2 = makeEnv();
    try {
      // 350 cfs sits inside South Holston's 150–600 ideal range; 16.5°C is ideal → 80+10.
      insertReading(env2.db, {
        gaugeId: '03486000',
        cfs: 350,
        tempC: 16.5,
        timestamp: '2026-09-02T16:30:00.000Z',
      });
      buildSnapshots({ db: env2.db, snapshotsDir: env2.snapshotsDir, now: NOW });

      const conditions = loadConditions(env2.snapshotsDir);
      expect(conditions).toHaveLength(2);
      for (const c of conditions) {
        const recomputed = scoreConditions(loadStream(env2.snapshotsDir, c.streamId), c.readings);
        expect(recomputed).toEqual(c.score);
      }
      const holston = conditions.find((c) => c.streamId === 'watauga-river');
      expect(holston?.score.value).toBe(90);
      expect(holston?.score.reasons.join(' ')).toContain('within the ideal range');
      expect(holston?.score.reasons.join(' ')).toContain('11–19°C trout activity window');
    } finally {
      env2.db.close();
      rmSync(env2.dir, { recursive: true, force: true });
    }
  });

  it('low flow and high-water cases produce plain-English reasons clients can recompute', () => {
    const env2 = makeEnv();
    try {
      // 40 cfs, far below the 150 cfs minimum → deficit penalty; no temp reading.
      insertReading(env2.db, {
        gaugeId: '03486000',
        cfs: 40,
        timestamp: '2026-09-02T16:30:00.000Z',
      });
      buildSnapshots({ db: env2.db, snapshotsDir: env2.snapshotsDir, now: NOW });

      const conditions = loadConditions(env2.snapshotsDir);
      const holston = conditions.find((c) => c.streamId === 'watauga-river');
      expect(holston).toBeDefined();
      const recomputed = scoreConditions(loadStream(env2.snapshotsDir, 'watauga-river'), holston!.readings);
      expect(holston!.score).toEqual(recomputed);
      // (100-40)/100 deficit → 80 - round(0.6*70) = 38.
      expect(holston!.score.value).toBe(38);
      expect(holston!.score.reasons.join(' ')).toContain('water is low');
    } finally {
      env2.db.close();
      rmSync(env2.dir, { recursive: true, force: true });
    }
  });
});

/** Content-pack emission (integration seam): /v1/hatch/* + /content/{taxa,patterns}.json
 *  are derived from the built pack (packages/content/dist/pack) in the same run. */
describe('content pack emission', () => {
  it('emits hatch charts at /v1/hatch and bare-array content payloads, stripping pack extras', () => {
    const env2 = makeEnv();
    try {
      const pack = join(env2.dir, 'pack');
      mkdirSync(join(pack, 'hatch', 'tn-test-region'), { recursive: true });
      const taxon = {
        id: 'baetis-tricaudatus',
        commonName: 'Blue-Winged Olive',
        sciName: 'Baetis tricaudatus',
        order: 'Ephemeroptera',
        family: 'Baetidae',
        sizeRange: [16, 22],
        keyAttributes: {
          tails: 3,
          gills: 'lamellae',
          bodyShape: 'slender',
          bodyColor: ['olive'],
          mouthparts: 'chewing',
        },
        habitat: ['riffles'],
        monthsActiveByRegion: { 'tn-test-region': [4, 5] },
        notes: '',
        sources: ['https://www.troutnut.com/hatch/47'],
        // pack extras that must NOT reach the PWA payload:
        svg: '<svg/>',
        stages: ['nymph', 'dun'],
      };
      const pattern = {
        id: 'pheasant-tail-nymph',
        name: 'Pheasant Tail Nymph',
        type: 'nymph',
        imitates: ['baetis-tricaudatus'],
        hookSizes: [16, 18],
        difficulty: 2,
        materials: ['pheasant tail fibers'],
        notes: '',
        license: 'public-domain',
      };
      writeFileSync(join(pack, 'bugs.json'), JSON.stringify({ taxa: [taxon] }));
      writeFileSync(join(pack, 'patterns.json'), JSON.stringify({ patterns: [pattern] }));
      writeFileSync(
        join(pack, 'hatch', 'tn-test-region', '4.json'),
        JSON.stringify({
          regionId: 'tn-test-region',
          month: 4,
          entries: [
            { taxonId: 'baetis-tricaudatus', stage: 'dun', timeOfDay: 'midday', abundance: 3, patterns: ['pheasant-tail-nymph'] },
          ],
        }),
      );

      const result = buildSnapshots({
        db: env2.db,
        snapshotsDir: env2.snapshotsDir,
        contentPackDir: pack,
        now: NOW,
      });
      expect(result.contentPack).toBe(true);
      expect(result.hatchCharts).toBe(1);

      const taxa = JSON.parse(readOut(env2.snapshotsDir, join('content', 'taxa.json'))) as Record<string, unknown>[];
      expect(taxa).toHaveLength(1);
      expect(taxa[0]!.id).toBe('baetis-tricaudatus');
      expect(taxa[0]).not.toHaveProperty('svg');
      expect(taxa[0]).not.toHaveProperty('stages');

      const patterns = JSON.parse(readOut(env2.snapshotsDir, join('content', 'patterns.json'))) as unknown[];
      expect(patterns).toHaveLength(1);

      const chart = JSON.parse(
        readOut(env2.snapshotsDir, join('v1', 'hatch', 'tn-test-region', '4.json')),
      ) as { regionId: string; month: number; entries: unknown[] };
      expect(chart.regionId).toBe('tn-test-region');
      expect(chart.entries).toHaveLength(1);
    } finally {
      env2.db.close();
      rmSync(env2.dir, { recursive: true, force: true });
    }
  });

  it('warns (and still writes DB snapshots) when the content pack is absent', () => {
    const env2 = makeEnv();
    try {
      const result = buildSnapshots({ db: env2.db, snapshotsDir: env2.snapshotsDir, now: NOW });
      expect(result.contentPack).toBe(false);
      expect(result.warnings.some((w) => w.includes('content pack'))).toBe(true);
      expect(existsSync(join(env2.snapshotsDir, 'v1', 'streams.json'))).toBe(true);
      expect(existsSync(join(env2.snapshotsDir, 'content', 'taxa.json'))).toBe(false);
    } finally {
      env2.db.close();
      rmSync(env2.dir, { recursive: true, force: true });
    }
  });
});

function readOut(dir: string, rel: string): string {
  return JSON.stringify(JSON.parse(readFileSync(join(dir, rel), 'utf8')));
}

function writeRaw(path: string, content: string): void {
  writeFileSync(path, content);
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  walk(dir);
  return out;
  function walk(d: string): void {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(p);
    }
  }
}
