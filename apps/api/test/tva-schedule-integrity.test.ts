import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ReleaseScheduleSchema } from '@trout/contracts';
import { runConditionsReadingsJob } from '../src/evidence/conditionsBridge.js';
import { TVA_SCHEDULE_MONITORS } from '../src/evidence/monitors.js';
import { fixturesDir, makeEnv, readFixture, type TestEnv } from './helpers.js';

/**
 * Release-schedule ingest integrity (audit 2026-10-14 §1): live 2026-10-14
 * generation-releases payloads (with Noon/Midnight) must persist complete; a
 * partially-parseable payload must fail closed (unavailable + job error), and a
 * failed predicted-data fetch must not hide valid release blocks.
 */
const json = (body: unknown, status = 200) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function liveReleases(id: string): unknown[] {
  const rel = `TVA/generation-releases-${id}-2026-10-14.json`;
  return existsSync(join(fixturesDir(), rel)) ? (JSON.parse(readFixture(rel)) as unknown[]) : [];
}

function scheduleFetch(overrides: {
  releases?: Record<string, unknown>;
  predictedStatus?: Record<string, number>;
}): typeof fetch {
  const observed = JSON.parse(readFixture('TVA/observed-data-NRST1-2026-10-14.json'));
  const predicted = JSON.parse(readFixture('TVA/predicted-data-NRST1-2026-10-14.json'));
  return (async (input: Parameters<typeof fetch>[0]) => {
    const url = typeof input === 'string' ? input : input.toString();
    const rel = /generation-releases\/([^/?]+)$/.exec(url);
    if (rel) {
      const id = decodeURIComponent(rel[1]!);
      return json(overrides.releases?.[id] ?? liveReleases(id));
    }
    const pred = /predicted-data\/([^/?]+)$/.exec(url);
    if (pred) {
      const status = overrides.predictedStatus?.[decodeURIComponent(pred[1]!)];
      return status ? json('nope', status) : json(predicted);
    }
    if (/observed-data\//.test(url)) return json(observed);
    return new Response('', { status: 200 }); // USACE A2W: empty body = unknown series
  }) as typeof fetch;
}

function schedules(db: TestEnv['db']) {
  const rows = db.prepare('SELECT water_id, payload FROM release_schedules').all() as { water_id: string; payload: string }[];
  return new Map(rows.map((r) => [r.water_id, ReleaseScheduleSchema.parse(JSON.parse(r.payload))]));
}

describe('TVA release schedule ingest integrity', () => {
  let env: TestEnv;
  beforeEach(() => {
    env = makeEnv();
  });
  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  const run = (fetchImpl: typeof fetch) =>
    runConditionsReadingsJob(env.db, {
      userAgent: 'test-agent/1.0',
      fetchImpl,
      spacingMs: 0,
      tvaSpacingMs: 0,
      releaseSchedules: true,
    });

  it('persists every live Noon/Midnight block (Clinch 3, South Holston 6, Hiwassee 5)', async () => {
    const result = await run(scheduleFetch({}));
    expect(result.releaseSchedules).toBe(Object.keys(TVA_SCHEDULE_MONITORS).length);
    const byWater = schedules(env.db);
    expect(byWater.get('clinch-river')).toMatchObject({ status: 'available' });
    expect(byWater.get('clinch-river')?.releases).toHaveLength(3);
    expect(byWater.get('south-holston-river')?.releases).toHaveLength(6);
    expect(byWater.get('hiwassee-river')?.releases).toHaveLength(5);
    expect(byWater.get('elk-river')?.releases.map((b) => `${b.startTime}-${b.endTime}`)).toEqual([
      'Midnight-Midnight',
      'Midnight-Midnight',
    ]);
    expect(result.warnings.join(' ')).not.toMatch(/rows unparseable/);
  });

  it('fails closed on a partial parse: unavailable, no blocks, job error + warning', async () => {
    const result = await run(
      scheduleFetch({
        releases: {
          NRST1: [
            { Day: '10/14/2026', Time: '1 AM - Midnight EDT', Generators: '2 or more' },
            { Day: '10/15/2026', Time: 'Sunup - Sundown EDT', Generators: '2 or more' },
          ],
        },
      }),
    );
    const clinch = schedules(env.db).get('clinch-river');
    expect(clinch?.status).toBe('unavailable');
    expect(clinch?.releases).toEqual([]);
    expect(clinch?.error).toMatch(/1 of 2 rows unparseable/);
    expect(result.errors).toBeGreaterThanOrEqual(1);
    expect(result.warnings.join(' ')).toMatch(/NRST1 \(clinch-river\) unavailable/);
  });

  it('a failed predicted-data fetch keeps the release blocks available', async () => {
    const result = await run(scheduleFetch({ predictedStatus: { HADT1: 503 } }));
    const hiwassee = schedules(env.db).get('hiwassee-river');
    expect(hiwassee?.status).toBe('available');
    expect(hiwassee?.releases).toHaveLength(5);
    expect(hiwassee?.forecasts).toEqual([]);
    expect(result.warnings.join(' ')).toMatch(/TVA forecast HADT1 \(hiwassee-river\) unavailable/);
  });

  it('a non-array release payload is unavailable, never an honest-looking "empty"', async () => {
    await run(scheduleFetch({ releases: { SHDT1: { message: 'maintenance' } } }));
    const sh = schedules(env.db).get('south-holston-river');
    expect(sh?.status).toBe('unavailable');
    expect(sh?.error).toMatch(/not an array/);
  });
});
