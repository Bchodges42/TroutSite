import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseInstantValues, runGaugesJob, latestReadings, fetchInstantValues } from '../src/ingest/usgs.js';
import { jobHealthy } from '../src/jobs/run.js';
import { makeEnv, mockFetch, readFixture } from './helpers.js';

describe('parseInstantValues', () => {
  it('parses the recorded real USGS response (cfs + gage height, absent temp)', () => {
    const readings = parseInstantValues(JSON.parse(readFixture('USGS/iv-2026-09-02.json')));
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      gaugeId: '03586500',
      cfs: 5.74,
      heightFt: 1.18,
      timestamp: '2026-09-02T14:30:00.000-05:00',
    });
    expect(readings[0]?.tempC).toBeUndefined();
  });

  it('handles missing params, sentinels, empty series, and newest-wins ordering', () => {
    const readings = parseInstantValues(JSON.parse(readFixture('USGS/iv-edge-cases.json')));
    const bySite = new Map(readings.map((r) => [r.gaugeId, r]));

    // cfs + temp present, gage height absent
    expect(bySite.get('01234500')).toMatchObject({ cfs: 242, tempC: 16.5 });
    expect(bySite.get('01234500')?.heightFt).toBeUndefined();

    // sentinel -999999 → no usable metric; reading kept with timestamp only
    expect(bySite.get('01234501')?.cfs).toBeUndefined();

    // newest of three values wins (3.22 at 15:00, not 3.10 at 13:00)
    expect(bySite.get('01234502')?.heightFt).toBe(3.22);

    // a series with an empty values array yields no reading at all
    expect(bySite.has('01234503')).toBe(false);
  });
});

describe('fetchInstantValues', () => {
  it('requests the expected waterservices URL with parameter codes and batches', async () => {
    const { fetchImpl, urls } = mockFetch(200, () => readFixture('USGS/iv-2026-09-02.json'));
    const readings = await fetchInstantValues(['03586500', '03466000'], {
      userAgent: 'test-agent/1.0 (contact: test@example.com)',
      fetchImpl,
    });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('https://waterservices.usgs.gov/nwis/iv/');
    expect(urls[0]).toContain('sites=03586500,03466000');
    expect(urls[0]).toContain('parameterCd=00060,00065,00010');
    expect(readings).toHaveLength(1);
  });

  it('throws on HTTP errors (caller decides how to recover)', async () => {
    const { fetchImpl } = mockFetch(404, () => 'not found');
    await expect(
      fetchInstantValues(['03586500'], {
        userAgent: 'test-agent/1.0',
        fetchImpl,
        baseUrl: 'https://waterservices.usgs.gov/nwis/iv/',
      }),
    ).rejects.toThrow(/HTTP 404/);
  });
});

describe('runGaugesJob', () => {
  let env: ReturnType<typeof makeEnv>;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('stores one normalized+raw row per gauge from fixture data', async () => {
    const { fetchImpl } = mockFetch(200, () => readFixture('USGS/iv-2026-09-02.json'));
    const result = await runGaugesJob(env.db, {
      userAgent: 'test-agent/1.0',
      fetchImpl,
    });
    expect(result.items).toBe(1); // fixture data arrives for the requested site
    expect(result.sites).toBe(1); // only watauga-river wires a gauge in the fixture content
    expect(result.warnings).toHaveLength(0);

    const rows = env.db.prepare('SELECT * FROM gauge_readings_raw').all() as {
      gauge_id: string;
      cfs: number | null;
      height_ft: number | null;
      payload: string;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.cfs).toBe(5.74);
    expect(rows[0]?.height_ft).toBe(1.18);
    expect(JSON.parse(rows[0]?.payload ?? '{}')).toMatchObject({ gaugeId: '03586500' });

    expect(env.db.prepare("SELECT COUNT(*) AS n FROM jobs_log WHERE job='gauges' AND status='ok'").get()).toMatchObject({ n: 1 });
    expect(jobHealthy(env.db, 'gauges')).toBe(true);
  });

  it('records an error row and rethrows on network failure (pipeline survives)', async () => {
    const { fetchImpl } = mockFetch(404, () => 'nope');
    await expect(
      runGaugesJob(env.db, { userAgent: 'test-agent/1.0', fetchImpl }),
    ).rejects.toThrow(/HTTP 404/);
    const job = env.db
      .prepare("SELECT status, detail FROM jobs_log WHERE job='gauges' ORDER BY id DESC LIMIT 1")
      .get() as { status: string; detail: string | null };
    expect(job.status).toBe('error');
    expect(job.detail).toContain('HTTP 404');
    expect(jobHealthy(env.db, 'gauges')).toBe(false);
  });

  it('exposes latestReadings for the snapshot builder', async () => {
    const { fetchImpl } = mockFetch(200, () => readFixture('USGS/iv-2026-09-02.json'));
    await runGaugesJob(env.db, { userAgent: 'test-agent/1.0', fetchImpl });
    const latest = latestReadings(env.db);
    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ gaugeId: '03586500', cfs: 5.74, heightFt: 1.18 });
  });
});
