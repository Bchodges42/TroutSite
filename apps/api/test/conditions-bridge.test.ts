import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildConditionsReading, runConditionsReadingsJob } from '../src/evidence/conditionsBridge.js';
import { fetchUsgsObservations } from '../src/evidence/usgs-provider.js';
import { USACE_TAILWATER_SERIES } from '../src/evidence/usace-provider.js';
import { TVA_MONITORS } from '../src/evidence/monitors.js';
import { runGaugesJob, latestReadings } from '../src/ingest/usgs.js';
import { ConditionSnapshotSchema, StreamSchema } from '@trout/contracts';
import type { WaterObservation } from '@trout/contracts';
import { buildSnapshots } from '../src/snapshots/build.js';
import { makeEnv, readFixture, type TestEnv } from './helpers.js';

/** Recorded TVA observed-data rows (Norris Dam, fixtures/TVA). */
const tvaRows = JSON.parse(readFixture('TVA/observed-data-NRST1-2026-09-04.json'));
const NOW = new Date('2026-09-08T18:00:00Z');

/** Build a mock fetch that answers the TVA + USACE endpoints from fixtures. */
function bridgeFetch(opts: { tvaRowsFor?: (locationId: string) => unknown[] | null | undefined } = {}): {
  fetchImpl: typeof fetch;
  urls: string[];
} {
  const urls: string[] = [];
  const fetchImpl = (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    urls.push(url);
    const tvaMatch = /observed-data\/([^/?]+)$/.exec(url);
    if (tvaMatch) {
      const rows = opts.tvaRowsFor?.(decodeURIComponent(tvaMatch[1]!));
      if (rows === null) return new Response('forbidden', { status: 403 });
      return new Response(JSON.stringify(rows ?? tvaRows), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('water.usace.army.mil')) {
      if (url.includes('CETT1-')) {
        const body = url.includes('Flow.Ave')
          ? readFixture('USACE/CETT1-flow.json')
          : url.includes('Elev-Tail')
            ? readFixture('USACE/CETT1-stage.json')
            : readFixture('USACE/CETT1-temp.json');
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('', { status: 200 }); // unknown/empty series → A2W answers 200 with 0 bytes
    }
    return new Response('unexpected url', { status: 404 });
  }) as typeof fetch;
  return { fetchImpl, urls };
}

function runBridge(db: TestEnv['db'], fetchImpl: typeof fetch) {
  return runConditionsReadingsJob(db, {
    userAgent: 'test-agent/1.0',
    fetchImpl,
    spacingMs: 0,
    tvaSpacingMs: 0,
  });
}

interface RawReadingRow {
  gauge_id: string;
  cfs: number | null;
  height_ft: number | null;
  temp_c: number | null;
  payload: string;
}

function readings(db: TestEnv['db']): RawReadingRow[] {
  return db.prepare('SELECT * FROM gauge_readings_raw ORDER BY gauge_id').all() as RawReadingRow[];
}

function readOut(dir: string, rel: string): unknown {
  return JSON.parse(readFileSync(join(dir, rel), 'utf8'));
}

describe('buildConditionsReading (observation → GaugeReading merge)', () => {
  const obs = (over: Partial<WaterObservation>): WaterObservation =>
    ({
      sourceId: 'tva-restapi',
      sourceUrl: 'https://www.tva.com/environment/lake-levels',
      observedAt: '2026-09-08T15:00:00-04:00',
      metric: 'discharge-cfs',
      value: 2181,
      ...over,
    }) as WaterObservation;

  it('maps discharge→cfs, stage→heightFt, temperature→tempC and keeps the raw rows in the payload', () => {
    const result = buildConditionsReading(
      'usace:CETT1',
      'usace-a2w',
      [
        obs({ metric: 'discharge-cfs', value: 250, observedAt: '2026-09-08T06:00:00Z' }),
        obs({ metric: 'stage-ft', value: 476.31, observedAt: '2026-09-08T06:00:00Z' }),
        obs({ metric: 'temperature-c', value: 11.1, observedAt: '2026-09-08T06:00:00Z' }),
      ],
      {
        'discharge-cfs': { key: 'CETT1...Flow...', value: ['2026-09-08T06:00:00Z', 250] },
      },
    );
    expect(result?.reading).toEqual({
      gaugeId: 'usace:CETT1',
      cfs: 250,
      heightFt: 476.31,
      tempC: 11.1,
      timestamp: '2026-09-08T06:00:00Z',
    });
    const payload = JSON.parse(result?.payload ?? '{}') as { source: string; rows: Record<string, unknown> };
    expect(payload.source).toBe('usace-a2w');
    expect(payload.rows['discharge-cfs']).toMatchObject({ key: 'CETT1...Flow...' });
  });

  it('skips reservoir-level-ft (not a conditions input) and returns null when nothing usable remains', () => {
    expect(
      buildConditionsReading('tva:NRST1', 'tva-restapi', [
        obs({ metric: 'reservoir-level-ft', value: 1012.93 }),
      ]),
    ).toBeNull();
  });

  it('is newest-wins per metric and stamps the reading with the newest INCLUDED metric', () => {
    const result = buildConditionsReading('tva:WL', 'tva-restapi', [
      obs({ metric: 'discharge-cfs', value: 100, observedAt: '2026-09-08T14:00:00-04:00' }),
      obs({ metric: 'discharge-cfs', value: 300, observedAt: '2026-09-08T15:00:00-04:00' }),
      obs({ metric: 'stage-ft', value: 827.69, observedAt: '2026-09-08T10:00:00-04:00' }),
    ]);
    expect(result?.reading.cfs).toBe(300);
    expect(result?.reading.heightFt).toBe(827.69);
    expect(result?.reading.timestamp).toBe('2026-09-08T15:00:00-04:00');
  });
});

describe('runConditionsReadingsJob (TVA + USACE → gauge_readings_raw)', () => {
  let env: ReturnType<typeof makeEnv>;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('persists namespaced readings with mapped columns, raw payloads, and leaves the USGS job alone', async () => {
    const { fetchImpl } = bridgeFetch();
    const result = await runBridge(env.db, fetchImpl);

    expect(result.errors).toBe(0);
    // DHTT1/JPPT1/CORT1 have no captured fixtures → all three of their series
    // answer the A2W "unknown TSID" empty-body warning (9 warnings total).
    expect(result.warnings.filter((w) => w.includes('USACE')).length).toBe(9);
    for (const station of ['DHTT1', 'JPPT1', 'CORT1']) {
      expect(result.warnings.join(' ')).toContain(station);
    }
    expect(result.tvaLocations).toBe(12);
    expect(result.usaceStations).toBe(4);
    // 12 TVA tailwater monitors + the one USACE station with fixture data.
    expect(result.gauges).toBe(13);
    expect(result.items).toBe(13);

    const rows = readings(env.db);
    const byId = new Map(rows.map((r) => [r.gauge_id, r]));
    // TVA tailwater: prefixed id, cfs + height mapped from the Norris fixture rows.
    const clinch = byId.get('tva:NRST1');
    expect(clinch?.cfs).toBeGreaterThan(0);
    expect(clinch?.height_ft).toBeGreaterThan(0);
    expect(JSON.parse(clinch?.payload ?? '{}')).toMatchObject({ source: 'tva-restapi', gaugeId: 'tva:NRST1' });
    expect(JSON.parse(clinch?.payload ?? '{}').rows['discharge-cfs']).toMatchObject({ Day: expect.any(String) });
    // USACE tailwater: flow + stage + °F→°C temp from the captured CETT1 fixtures.
    const caney = byId.get('usace:CETT1');
    expect(caney).toMatchObject({ cfs: 250, height_ft: 476.31 });
    expect(caney?.temp_c).toBeCloseTo(11.1, 5);
    // TVA lake/reservoir monitors (role 'reservoir') are never written.
    expect(byId.has('tva:WBOT1')).toBe(false);
    // The bridge never touches the USGS job row.
    expect(env.db.prepare("SELECT COUNT(*) AS n FROM jobs_log WHERE job='gauges'").get()).toMatchObject({ n: 0 });
    expect(env.db.prepare("SELECT COUNT(*) AS n FROM jobs_log WHERE job='gauges-conditions' AND status='ok'").get()).toMatchObject({ n: 1 });

    // The snapshot builder's latestReadings serves the prefixed gauges unchanged.
    const latest = latestReadings(env.db);
    expect(latest.map((r) => r.gaugeId)).toContain('tva:NRST1');
    expect(latest.map((r) => r.gaugeId)).toContain('usace:CETT1');
  });

  it('soft-fails per source: one failing TVA dam becomes a warning, the rest still persist', async () => {
    const { fetchImpl } = bridgeFetch({ tvaRowsFor: (id) => (id === 'WL' ? null : undefined) });
    const result = await runBridge(env.db, fetchImpl);
    expect(result.errors).toBe(1);
    expect(result.warnings.join(' ')).toMatch(/TVA WL \(watauga-river\) failed/);
    const byId = new Map(readings(env.db).map((r) => [r.gauge_id, r]));
    expect(byId.has('tva:WL')).toBe(false);
    expect(byId.has('tva:NRST1')).toBe(true);
  });

  it('guards the USGS lanes: non-numeric gauge ids never reach NWIS', async () => {
    env.db
      .prepare("UPDATE streams SET gauge_ids = ? WHERE id = 'watauga-river'")
      .run(JSON.stringify(['03486000', 'tva:NRST1', 'usace:CETT1']));

    // Ingest lane: the gauges job requests only the numeric site.
    const urls: string[] = [];
    const fetchImpl = (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      urls.push(url);
      return new Response(readFixture('USGS/iv-2026-09-02.json'), { status: 200 });
    }) as typeof fetch;
    const result = await runGaugesJob(env.db, { userAgent: 'test-agent/1.0', fetchImpl });
    expect(result.sites).toBe(1);
    expect(urls.join(' ')).toContain('sites=03486000');
    expect(urls.join(' ')).not.toMatch(/tva:|usace:/);

    // Evidence lane: the same filter applies to fetchUsgsObservations (the fixture's
    // two series → two per-metric observations, still only one NWIS call).
    const evidence = await fetchUsgsObservations(['03486000', 'tva:NRST1'], { userAgent: 'test-agent/1.0', fetchImpl });
    expect(evidence).toHaveLength(2);
    const none = await fetchUsgsObservations(['tva:NRST1', 'usace:CETT1'], { userAgent: 'test-agent/1.0', fetchImpl });
    expect(none).toEqual([]);
    expect(urls.filter((u) => u.includes('sites=')).length).toBe(2); // no extra NWIS call for prefixed ids
  });
});

describe('catalog ↔ registry wiring', () => {
  it('every non-numeric catalog gaugeId resolves to a TVA/USACE registry entry', () => {
    const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/content/streams/tn');
    const wired = new Map<string, string[]>();
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
      const yaml = parseYaml(readFileSync(join(dir, f), 'utf8')) as { id?: string; gaugeIds?: string[] };
      for (const g of yaml.gaugeIds ?? []) {
        if (/^\d+(\.\d+)?$/.test(g)) continue; // USGS numeric ids
        wired.set(g, [...(wired.get(g) ?? []), yaml.id ?? f]);
      }
    }
    expect(wired.size).toBeGreaterThanOrEqual(13);
    for (const [gaugeId, waters] of wired) {
      const [prefix, id] = gaugeId.split(':');
      if (prefix === 'tva') {
        // Water → monitor: the catalog id must equal the registry's locationId.
        for (const waterId of waters) {
          expect(TVA_MONITORS[waterId]?.locationId, `${gaugeId} wired by ${waterId} not in TVA_MONITORS`).toBe(id);
        }
      } else if (prefix === 'usace') {
        const series = USACE_TAILWATER_SERIES[id ?? ''];
        expect(series, `${gaugeId} (${waters.join(',')}) not in USACE_TAILWATER_SERIES`).toBeDefined();
        for (const waterId of waters) {
          expect(series?.waterId).toBe(waterId);
        }
      } else {
        throw new Error(`unknown gauge namespace: ${gaugeId}`);
      }
    }
    // CORT1 is registered but deliberately NOT wired into cumberland-river gaugeIds.
    expect([...wired.keys()]).not.toContain('usace:CORT1');
  });
});

describe('conditions end-to-end: a tva: gauge scores a tailwater', () => {
  it('bridge reading → conditions snapshot assessed:true with a cfs-driven score', async () => {
    const env2 = makeEnv();
    try {
      // Wire the seeded stream to the TVA gauge id exactly like the catalog YAML does.
      env2.db
        .prepare("UPDATE streams SET gauge_ids = ? WHERE id = 'watauga-river'")
        .run(JSON.stringify(['tva:WL']));
      const streamRow = env2.db.prepare('SELECT gauge_ids FROM streams WHERE id = ?').get('watauga-river') as { gauge_ids: string };
      expect(JSON.parse(streamRow.gauge_ids)).toEqual(['tva:WL']);

      const { fetchImpl } = bridgeFetch({
        // 300 cfs sits inside the fixture stream's 100–500 idealFlow range.
        tvaRowsFor: (id) =>
          id === 'WL'
            ? [{ Day: '09/08/2026', Time: '11 AM EDT', ReservoirElevation: '1,957.22', TailwaterElevation: '1,484.71', AverageHourlyDischarge: '300' }]
            : undefined,
      });
      const result = await runBridge(env2.db, fetchImpl);
      expect(result.gauges).toBeGreaterThan(0);

      const snap = buildSnapshots({ db: env2.db, snapshotsDir: env2.snapshotsDir, now: NOW });
      expect(snap.conditions).toBe(2);
      const conditions = readOut(env2.snapshotsDir, join('v1', 'conditions', 'latest.json')) as unknown[];
      const watauga = conditions.find((c) => (c as { streamId: string }).streamId === 'watauga-river');
      expect(ConditionSnapshotSchema.safeParse(watauga).success).toBe(true);
      const parsed = watauga as { readings: { gaugeId: string; cfs: number }[]; score: { value: number; assessed: boolean; reasons: string[] } };
      expect(parsed.readings.map((r) => r.gaugeId)).toEqual(['tva:WL']);
      expect(parsed.readings[0]?.cfs).toBe(300);
      expect(parsed.score.assessed).toBe(true);
      expect(parsed.score.value).toBe(80); // 300 cfs inside 100–500 → base 80, no temp reading
      expect(parsed.score.reasons.join(' ')).toContain('within the ideal range');

      // The snapshot stream itself carries the namespaced id (StreamSchema-valid).
      const streams = readOut(env2.snapshotsDir, join('v1', 'streams.json')) as unknown[];
      const wired = streams.find((s) => (s as { id: string }).id === 'watauga-river');
      expect(StreamSchema.parse(wired).gaugeIds).toEqual(['tva:WL']);
    } finally {
      env2.db.close();
      rmSync(env2.dir, { recursive: true, force: true });
    }
  });
});
