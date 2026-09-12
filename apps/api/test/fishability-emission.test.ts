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
    setTargetSpecies('watauga-river', ['smallmouth-bass', 'bluegill']);
    insertReading(22); // inside smallmouth's optimal 20–26.7
    const pack = writeSpeciesPack();

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: pack, now: NOW });
    expect(result.fishabilityWaters).toBe(1);

    const out = join(env.snapshotsDir, 'v1', 'fishability', 'watauga-river.json');
    const snapshot = JSON.parse(readFileSync(out, 'utf8')) as FishabilitySnapshot;
    expect(FishabilitySnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.streamId).toBe('watauga-river');
    expect(snapshot.fetchedAt).toBe(NOW.toISOString());

    // Scoreable species: optimal comfort + a single transparent activity factor.
    const smallmouth = snapshot.bySpecies['smallmouth-bass']!;
    expect(smallmouth.comfort).toMatchObject({ species: 'smallmouth-bass', value: 90, assessed: true });
    expect(smallmouth.comfort.freshness).toEqual({
      observedAt: new Date(NOW_MS - 10 * 60_000).toISOString(),
      ageMinutes: 10,
    });
    expect(smallmouth.activity.total).toBe(90);
    expect(smallmouth.activity.components).toHaveLength(1);
    expect(smallmouth.activity.components[0]).toMatchObject({
      factor: 'water-temperature',
      value: 90,
      contribution: 40,
      weight: 1,
      evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03486000',
      confidence: 'measured',
      label: 'Water temperature',
    });

    // Cataloged but unscoreable: honest cannot-assess, no fabricated numbers.
    const bluegill = snapshot.bySpecies['bluegill']!;
    expect(bluegill.comfort).toMatchObject({ value: 0, assessed: false, freshness: null });
    expect(bluegill.comfort.reasons.join(' ')).toMatch(/No cited temperature comfort bands/);
    expect(bluegill.activity).toEqual({ total: 0, components: [] });

    // The other seeded stream has no targetSpecies → no file at all.
    expect(existsSync(join(env.snapshotsDir, 'v1', 'fishability', 'test-tailrace-b.json'))).toBe(false);
    expect(readdirSync(join(env.snapshotsDir, 'v1', 'fishability'))).toEqual(['watauga-river.json']);
  });

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
