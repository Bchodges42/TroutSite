import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FishabilitySnapshotSchema,
  scoreFishability,
  type FishabilitySnapshot,
  type SpeciesComfortBands,
} from '@trout/contracts';
import { buildApp } from '../src/app.js';
import { buildSnapshots } from '../src/snapshots/build.js';
import { fishabilityFeedHealth } from '../src/snapshots/health.js';
import { makeEnv, type TestEnv } from './helpers.js';

const NOW = new Date('2026-09-12T17:00:00Z');
const NOW_MS = NOW.getTime();

/**
 * F5 fishability emission (contract v2, ADR 0007): snapshots for waters whose
 * catalog names targetSpecies, honest absence for waters without, honest
 * cannot-assess rows for species whose F2 bands are not fully sourced, and a
 * malformation detector wired into /healthz. Tested with fixture species data;
 * live data flows when Session B's F3 targetSpecies authoring lands.
 */
describe('F5 fishability emission', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  function setTargetSpecies(streamId: string, species: string[]): void {
    env.db.prepare('UPDATE streams SET target_species = ? WHERE id = ?').run(JSON.stringify(species), streamId);
  }

  function insertReading(tempC: number, ageMinutes = 10): void {
    const ts = new Date(NOW_MS - ageMinutes * 60_000).toISOString();
    env.db
      .prepare(
        `INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, observed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('03486000', ts, JSON.stringify({ gaugeId: '03486000', tempC, timestamp: ts }), 350, null, tempC, ts);
  }

  /** Fixture species pack mirroring the F2 YAML shape (high-side-only bands). */
  function writeSpeciesPack(): string {
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
              optimalC: { min: 20, max: 26.7, basis: 'field-activity', sources: ['https://littleriveroutfitters.com/pages/fishing/smallmouth-reproduction.html'] },
              avoidanceC: { value: 29, basis: 'chronic-mwat', sources: ['https://example.com/avoid'] },
              lethalC: { value: 31, basis: 'acute-mdmt', sources: ['https://example.com/lethal'] },
            },
            spawn: {
              onsetC: { value: 12.8, sources: ['https://littleriveroutfitters.com/pages/fishing/smallmouth-reproduction.html'] },
              endC: { value: 21.1, sources: ['https://littleriveroutfitters.com/pages/fishing/smallmouth-reproduction.html'] },
            },
          },
          {
            // Comfort-scoreable but NO spawn window authored → temp-only activity.
            id: 'largemouth-bass',
            displayName: 'Largemouth bass',
            comfort: {
              optimalC: { min: 26.7, max: 30, basis: 'lab-preferred', sources: ['https://example.com/lmb-optimal'] },
              avoidanceC: { value: 32, basis: 'chronic-mwat', sources: ['https://example.com/lmb-avoid'] },
              lethalC: { value: 34, basis: 'acute-mdmt', sources: ['https://example.com/lmb-lethal'] },
            },
          },
          {
            // Cataloged but not yet scoreable: no sourced optimal range.
            id: 'bluegill',
            displayName: 'Bluegill',
            comfort: {
              avoidanceC: { value: 32, basis: 'chronic-mwat', sources: ['https://example.com/avoid'] },
              lethalC: { value: 35, basis: 'acute-mdmt', sources: ['https://example.com/lethal'] },
            },
          },
        ],
      }),
    );
    return pack;
  }

  it('emits a contract-valid snapshot for waters with targetSpecies and nothing for waters without', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass', 'bluegill', 'largemouth-bass']);
    insertReading(22); // smallmouth: optimal comfort + POST_SPAWN shoulder; largemouth: below optimal
    const pack = writeSpeciesPack();

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    expect(result.fishabilityWaters).toBe(1);

    const out = join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json');
    const snapshot = JSON.parse(readFileSync(out, 'utf8')) as FishabilitySnapshot;
    expect(FishabilitySnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.streamId).toBe('watauga-river');
    expect(snapshot.fetchedAt).toBe(NOW.toISOString());

    // Smallmouth: cited spawn window present → two transparent components.
    const smallmouth = snapshot.bySpecies['smallmouth-bass']!;
    expect(smallmouth.comfort).toMatchObject({ species: 'smallmouth-bass', value: 90, assessed: true });
    expect(smallmouth.activity.components).toHaveLength(2);
    expect(smallmouth.activity.components[0]).toMatchObject({
      factor: 'water-temperature',
      value: 90,
      weight: 0.7,
      contribution: 28,
      evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03486000',
      confidence: 'measured',
      label: 'Water temperature',
    });
    expect(smallmouth.activity.components[1]).toMatchObject({
      factor: 'spawn-state',
      value: 30,
      weight: 0.3,
      contribution: -6,
      confidence: 'derived',
      evidenceUrl: 'https://littleriveroutfitters.com/pages/fishing/smallmouth-reproduction.html',
    });
    expect(smallmouth.activity.components[1]!.label).toMatch(/post-spawn/);
    expect(smallmouth.activity.spawnState).toBe('POST_SPAWN');
    expect(smallmouth.activity.total).toBe(72); // 50 + 28 − 6

    // Largemouth: scoreable comfort, NO spawn window → temperature alone, weight 1.
    const largemouth = snapshot.bySpecies['largemouth-bass']!;
    expect(largemouth.comfort).toMatchObject({ value: 40, assessed: true }); // 22 < optimal 26.7
    expect(largemouth.activity.total).toBe(40); // 50 + 1.0×(40−50)
    expect(largemouth.activity.components).toHaveLength(1);
    expect(largemouth.activity.components[0]!.weight).toBe(1);
    expect(largemouth.activity.spawnState).toBeUndefined();

    // Cataloged but unscoreable: honest cannot-assess, no fabricated numbers.
    const bluegill = snapshot.bySpecies['bluegill']!;
    expect(bluegill.comfort).toMatchObject({ value: 0, assessed: false, freshness: null });
    expect(bluegill.comfort.reasons.join(' ')).toMatch(/No cited temperature comfort bands/);
    expect(bluegill.activity).toEqual({ total: 0, components: [] });

    // The other seeded stream has no targetSpecies → no file at all.
    expect(existsSync(join(env.snapshotsDir, 'v1', 'fishability', 'test-tailrace-b.json'))).toBe(false);
    expect(readdirSync(join(env.snapshotsDir, 'v1', 'fishability'))).toEqual(['watauga-river.json']);
  });

  it('F9: PRE_SPAWN boosts, SPAWNING is neutral with the conservation label, POST_SPAWN reduces', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    const pack = writeSpeciesPack();

    // PRE_SPAWN shoulder (12.8−4 ≤ 12 < 12.8): comfort 40 (below optimal), spawn +9.
    insertReading(12);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    let smallmouth = readSmallmouth();
    expect(smallmouth.activity.spawnState).toBe('PRE_SPAWN');
    expect(smallmouth.activity.components[1]).toMatchObject({ value: 80, contribution: 9 });
    expect(smallmouth.activity.components[1]!.label).toMatch(/pre-spawn/);
    const preTotal = smallmouth.activity.total;

    // SPAWNING window (12.8 ≤ 16 ≤ 21.1): neutral value 50, conservation label.
    env.db.prepare('DELETE FROM gauge_readings_raw').run();
    insertReading(16);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    smallmouth = readSmallmouth();
    expect(smallmouth.activity.spawnState).toBe('SPAWNING');
    expect(smallmouth.activity.components[1]).toMatchObject({ value: 50, contribution: 0 });
    expect(smallmouth.activity.components[1]!.label).toBe('On beds — handle and release quickly');
    // Its own contribution is 0 — neutral is asserted on the component above.

    // POST_SPAWN shoulder (21.1 < 22 ≤ 25.1): reduced value 30.
    env.db.prepare('DELETE FROM gauge_readings_raw').run();
    insertReading(22);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    smallmouth = readSmallmouth();
    expect(smallmouth.activity.spawnState).toBe('POST_SPAWN');
    const postTotal = smallmouth.activity.total;

    // The spawn FACTOR orders boost > neutral > reduce (asserted per state above:
    // +9 > 0 > −6). Against each state's temp-only counterfactual (same comfort,
    // weight 1.0 — 50 + (comfort − 50)): pre-spawn lifts the outlook above it,
    // spawning stays at it (its own contribution is 0), post-spawn drags it down.
    expect(preTotal).toBe(52); // 40 (temp-only at comfort 40) + 9 spawn boost
    expect(postTotal).toBe(72); // 90 (temp-only at comfort 90) − 6 spawn drag
    expect(preTotal).toBeGreaterThan(40); // boosted vs no-spawn counterfactual
    expect(postTotal).toBeLessThan(90); // reduced vs no-spawn counterfactual
  }, 30_000);

  function readSmallmouth(): FishabilitySnapshot['bySpecies'][string] {
    const snapshot = JSON.parse(
      readFileSync(join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json'), 'utf8'),
    ) as FishabilitySnapshot;
    return snapshot.bySpecies['smallmouth-bass']!;
  }

  it('pressure-trend component: falling area pressure is positive, hard rise negative, with the area-level caveat', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    const pack = writeSpeciesPack();
    // The fixture stream's region (tn-east-tailwaters) is fixture-only — the
    // honest behavior for a region with no F8 row is omission (covered below).
    const regionId = (env.db.prepare('SELECT region_id FROM streams WHERE id = ?').get('watauga-river') as { region_id: string }).region_id;
    const upsert = env.db.prepare(
      `INSERT INTO region_pressure (region_id, observed_at, retrieved_at, pressure_hpa, trend_hpa_3h, trend_direction, station)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    // Falling 2.5 hPa/3h (synthetic): value 75, contribution +3.75 (w 0.15).
    insertReading(24); // comfort 90; spawn state at 24 °C: POST_SPAWN shoulder
    upsert.run(regionId, new Date(NOW_MS - 30 * 60_000).toISOString(), NOW.toISOString(), 1014.5, -2.5, 'falling', 'KTRI');
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    let smallmouth = readSmallmouth();
    expect(smallmouth.activity.components).toHaveLength(3);
    const falling = smallmouth.activity.components.find((c) => c.factor === 'pressure-trend')!;
    expect(falling).toMatchObject({ value: 75, weight: 0.15, contribution: 3.8, confidence: 'derived' }); // 3.75 rounded to 0.1
    expect(falling.evidenceUrl).toBe('https://www.weather.gov/wrh/timeseries?site=KTRI');
    expect(falling.label).toMatch(/Area pressure/i);
    expect(falling.label).toMatch(/not this water/);
    // 50 + 0.6×(90−50) + 0.25×(30−50) + 0.15×(75−50) = 72.75 → 73.
    expect(smallmouth.activity.total).toBe(73);

    // Hard rise +4 hPa/3h: value 10, contribution −6 (w 0.15).
    env.db.prepare('DELETE FROM region_pressure').run();
    upsert.run(regionId, new Date(NOW_MS - 30 * 60_000).toISOString(), NOW.toISOString(), 1018.5, 4, 'rising', 'KTRI');
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    smallmouth = readSmallmouth();
    const rising = smallmouth.activity.components.find((c) => c.factor === 'pressure-trend')!;
    expect(rising).toMatchObject({ value: 10, contribution: -6 });
  }, 30_000);

  it('pressure component is omitted when the row is stale or absent, and weights stay normalized', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    const pack = writeSpeciesPack();
    const regionId = (env.db.prepare('SELECT region_id FROM streams WHERE id = ?').get('watauga-river') as { region_id: string }).region_id;

    // No row at all → temp + spawn only (0.7 / 0.3).
    insertReading(24);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    let smallmouth = readSmallmouth();
    expect(smallmouth.activity.components.map((c) => c.weight).sort()).toEqual([0.3, 0.7]);
    expect(smallmouth.activity.components.some((c) => c.factor === 'pressure-trend')).toBe(false);

    // Stale row (4 h old observation) → honestly omitted, weights stay normalized.
    env.db.prepare('DELETE FROM region_pressure').run();
    env.db
      .prepare(
        `INSERT INTO region_pressure (region_id, observed_at, retrieved_at, pressure_hpa, trend_hpa_3h, trend_direction, station)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(regionId, new Date(NOW_MS - 240 * 60_000).toISOString(), NOW.toISOString(), 1014.5, -2.5, 'falling', 'KTRI');
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    smallmouth = readSmallmouth();
    expect(smallmouth.activity.components.some((c) => c.factor === 'pressure-trend')).toBe(false);
    const weightSum = smallmouth.activity.components.reduce((s, c) => s + c.weight, 0);
    expect(Math.abs(weightSum - 1)).toBeLessThanOrEqual(0.01);
  }, 30_000);

  it('emits nothing when no water has targetSpecies (honest absence)', () => {
    const pack = writeSpeciesPack();
    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    expect(result.fishabilityWaters).toBe(0);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'fishability'))).toBe(false);
  });

  it('cannot-assess (never scores) when the temp observation is stale, and emits no activity component', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    insertReading(22, 240); // 4 h old — past the 3 h window
    const pack = writeSpeciesPack();
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });

    const snapshot = JSON.parse(
      readFileSync(join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json'), 'utf8'),
    ) as FishabilitySnapshot;
    const smallmouth = snapshot.bySpecies['smallmouth-bass']!;
    expect(smallmouth.comfort.assessed).toBe(false);
    expect(smallmouth.comfort.freshness).toBeNull();
    expect(smallmouth.activity).toEqual({ total: 0, components: [] });
  });

  it('parity: the emitted comfort equals scoreFishability recomputed from the same readings and bridged bands', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    insertReading(24);
    const pack = writeSpeciesPack();
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });

    const snapshot = JSON.parse(
      readFileSync(join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json'), 'utf8'),
    ) as FishabilitySnapshot;
    const bands: SpeciesComfortBands = {
      species: 'smallmouth-bass',
      unit: 'degC',
      optimalLow: 20,
      optimalHigh: 26.7,
      avoidanceHigh: 29,
      lethalHigh: 31,
    };
    const readings = [{ gaugeId: '03486000', tempC: 24, timestamp: new Date(NOW_MS - 10 * 60_000).toISOString() }];
    const recomputed = scoreFishability(readings, 'smallmouth-bass', bands, NOW_MS);
    expect(snapshot.bySpecies['smallmouth-bass']!.comfort).toEqual(recomputed);
  });

  it('prunes fishability files when a water loses its targetSpecies', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    const pack = writeSpeciesPack();
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    expect(existsSync(join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json'))).toBe(true);

    setTargetSpecies('watauga-river', []);
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    expect(existsSync(join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json'))).toBe(false);
  });

  it('malformation detector: healthy on emitted snapshots, unhealthy on a corrupt file, and /healthz gates on it', () => {
    setTargetSpecies('watauga-river', ['smallmouth-bass']);
    insertReading(22);
    const pack = writeSpeciesPack();
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });

    const healthy = fishabilityFeedHealth(env.snapshotsDir);
    expect(healthy).toMatchObject({ present: true, healthy: true, files: 1 });

    const file = join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json');
    writeFileSync(file, JSON.stringify({ streamId: 'watauga-river', bySpecies: 'garbage' }));

    const broken = fishabilityFeedHealth(env.snapshotsDir);
    expect(broken.healthy).toBe(false);
    expect(broken.reason).toMatch(/1 of 1 fishability snapshots fail/);

    // The conditions feed in this fixture was built at the fixed NOW, which the
    // real-time health check would call stale — repin it to the real clock so
    // this test isolates the fishability verdict.
    const conditionsPath = join(env.snapshotsDir, 'v1', 'conditions', 'latest.json');
    const conditions = JSON.parse(readFileSync(conditionsPath, 'utf8')) as Array<Record<string, unknown>>;
    const realNow = new Date().toISOString();
    for (const row of conditions) {
      row.fetchedAt = realNow;
      row.nextExpectedUpdate = realNow;
    }
    writeFileSync(conditionsPath, JSON.stringify(conditions));

    // /healthz gates ok on the fishability verdict (C1 semantics extended).
    const app = buildApp({ logger: false, db: env.db, webPublicDir: env.snapshotsDir });
    return app
      .ready()
      .then(() => app.inject({ method: 'GET', url: '/healthz' }))
      .then((res) => {
        const body = res.json();
        expect(body.ok).toBe(false);
        expect(body.fishability.healthy).toBe(false);
        expect(body.conditions.healthy).toBe(true); // the conditions feed is fine
      })
      .finally(() => app.close());
  });

  it('a missing fishability directory stays healthy (feature honestly off)', () => {
    const v = fishabilityFeedHealth(env.snapshotsDir);
    expect(v).toEqual({ present: false, healthy: true, reason: null, files: 0 });
    expect(fishabilityFeedHealth(undefined)).toEqual({ present: false, healthy: true, reason: null, files: 0 });
  });
});
