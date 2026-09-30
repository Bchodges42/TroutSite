import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GaugeHistorySchema } from '@trout/contracts';
import { buildSnapshots } from '../src/snapshots/build.js';
import { makeEnv, type TestEnv } from './helpers.js';
import type { Db } from '../src/db.js';

/**
 * Gauge-history snapshot emission (ADR 0014): one static file per gauge under
 * /v1/gauge-history/, emitted from gauge_readings_raw in the same snapshot pass
 * as conditions/latest.json. Honesty rules asserted here: dedupe per timestamp
 * (newest fetched_at wins per metric, metrics merge), all-null rows dropped,
 * no file for a gauge with no rows, 90-day retention as a floor, and per-gauge
 * prune on rebuild.
 */

const NOW = new Date('2026-09-30T12:00:00Z');
const GAUGE = '03471500';

function insertReading(
  db: Db,
  r: {
    gaugeId: string;
    fetchedAt: string;
    observedAt: string;
    cfs?: number | null;
    heightFt?: number | null;
    tempC?: number | null;
  },
): void {
  db.prepare(
    `INSERT INTO gauge_readings_raw
       (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, dissolved_oxygen_mg_l, reservoir_level_ft, precipitation_mm, observed_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?)`,
  ).run(
    r.gaugeId,
    r.fetchedAt,
    JSON.stringify({ gaugeId: r.gaugeId, timestamp: r.observedAt }),
    r.cfs ?? null,
    r.heightFt ?? null,
    r.tempC ?? null,
    r.observedAt,
  );
}

describe('gauge history snapshot emission (ADR 0014)', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('emits the deduplicated, merged history at the frozen URL — numeric USGS ids only', () => {
    // Same timestamp fetched twice: the NEWEST fetched_at row wins per metric…
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T11:05:00Z', observedAt: '2026-09-30T11:00:00Z', cfs: 100 });
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T11:30:00Z', observedAt: '2026-09-30T11:00:00Z', cfs: 110, tempC: 16.5 });
    // …and a row that carries ONLY tempC at its own stamp merges in separately.
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T11:30:00Z', observedAt: '2026-09-30T10:00:00Z', tempC: 16 });
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T12:01:00Z', observedAt: '2026-09-30T12:00:00Z', cfs: 120 });
    // Dirty row: every history metric null → not a measurement, dropped.
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T12:01:00Z', observedAt: '2026-09-30T09:00:00Z' });
    // tva:/usace: ids belong to the conditions bridge and get NO file.
    insertReading(env.db, { gaugeId: 'tva:SSH', fetchedAt: '2026-09-30T12:00:00Z', observedAt: '2026-09-30T11:00:00Z', cfs: 5000 });

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    expect(result.gaugeHistories).toBe(1);

    const path = join(env.snapshotsDir, 'v1', 'gauge-history', `${GAUGE}.json`);
    expect(existsSync(path)).toBe(true);
    expect(result.files).toContain(path);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'gauge-history', 'tva%3ASSH.json'))).toBe(false);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'gauge-history', 'tva:SSH.json'))).toBe(false);

    const history = GaugeHistorySchema.parse(JSON.parse(readFileSync(path, 'utf8')));
    expect(history.gaugeId).toBe(GAUGE);
    expect(history.metrics).toEqual(['cfs', 'tempC']);
    expect(history.samples).toEqual([
      { timestamp: '2026-09-30T10:00:00Z', tempC: 16 },
      { timestamp: '2026-09-30T11:00:00Z', cfs: 110, tempC: 16.5 },
      { timestamp: '2026-09-30T12:00:00Z', cfs: 120 },
    ]);
    expect(history.retrievedAt).toBe(NOW.toISOString());
    expect(history.sourceUrl).toBe(`https://waterdata.usgs.gov/monitoring-location/${GAUGE}`);
  });

  it('emits NO file for a gauge with no raw rows (the 404 is the honest absence signal)', () => {
    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    expect(result.gaugeHistories).toBe(0);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'gauge-history'))).toBe(false);
  });

  it('respects the 90-day retention floor — rows out of retention are naturally absent', () => {
    // 91 days old: outside the window even if the raw prune has not run yet.
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-07-01T12:05:00Z', observedAt: '2026-07-01T12:00:00Z', cfs: 42 });
    // 30 days old: inside the window, still measured.
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-08-31T12:05:00Z', observedAt: '2026-08-31T12:00:00Z', cfs: 150 });
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T12:01:00Z', observedAt: '2026-09-30T11:00:00Z', cfs: 200 });

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    expect(result.gaugeHistories).toBe(1);
    const history = GaugeHistorySchema.parse(
      JSON.parse(readFileSync(join(env.snapshotsDir, 'v1', 'gauge-history', `${GAUGE}.json`), 'utf8')),
    );
    // The file begins at the oldest RETAINED row — no fabricated pre-launch history.
    expect(history.samples.map((s) => s.timestamp)).toEqual([
      '2026-08-31T12:00:00Z',
      '2026-09-30T11:00:00Z',
    ]);
  });

  it('prunes a stale gauge file on rebuild while other gauges keep theirs', () => {
    insertReading(env.db, { gaugeId: GAUGE, fetchedAt: '2026-09-30T12:00:00Z', observedAt: '2026-09-30T11:00:00Z', cfs: 100 });
    const other = '03471505';
    insertReading(env.db, { gaugeId: other, fetchedAt: '2026-09-30T12:00:00Z', observedAt: '2026-09-30T11:00:00Z', tempC: 15 });

    const first = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });
    expect(first.gaugeHistories).toBe(2);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'gauge-history', `${GAUGE}.json`))).toBe(true);

    env.db.prepare('DELETE FROM gauge_readings_raw WHERE gauge_id = ?').run(GAUGE);
    const later = new Date(NOW.getTime() + 3_600_000);
    const second = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: later });
    expect(second.gaugeHistories).toBe(1);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'gauge-history', `${GAUGE}.json`))).toBe(false);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'gauge-history', `${other}.json`))).toBe(true);
    // The prune is recorded in the generation manifest like every other removal.
    expect(second.files).toContain(
      `${join(env.snapshotsDir, 'v1', 'gauge-history', `${GAUGE}.json`)} (removed)`,
    );
  });
});
