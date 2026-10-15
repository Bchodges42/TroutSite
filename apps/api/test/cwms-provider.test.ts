import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fetchCwmsObservations, parseCwmsValues, usableCwmsQuality } from '../src/evidence/cwms-provider.js';
import { runConditionsReadingsJob } from '../src/evidence/conditionsBridge.js';
import { USACE_TAILWATER_SERIES } from '../src/evidence/usace-provider.js';
import { makeEnv } from './helpers.js';

const now = new Date('2026-10-15T00:30:00Z');
const time = new Date('2026-10-15T00:00:00Z').getTime();
const capture = (id: string) => JSON.parse(readFileSync(resolve(import.meta.dirname,
  '../../../docs/research/2026-10-14-source-audit/captures', `${id}.txt`), 'utf8'));
const response = (name: string, unit: string, values: unknown[], extra = {}) =>
  ({ name, 'office-id': 'LRN', units: unit, values, ...extra });

describe('documented CWMS adapter', () => {
  it.each(['CETT1', 'DHTT1', 'JPPT1', 'CORT1'])('parses real flow and Celsius captures for %s', async (station) => {
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      expect(url.origin).toBe('https://cwms-data.usace.army.mil');
      expect(url.searchParams.get('office')).toBe('LRN');
      const flow = url.searchParams.get('unit') === 'cfs';
      const id = station === 'CETT1' && flow ? 'cwms-centerhill-flow'
        : `cwms-${station}-${flow ? 'flow' : 'temperature'}`;
      return Response.json(capture(id));
    }) as typeof fetch;
    const result = await fetchCwmsObservations(station, { userAgent: 'test', now, fetchImpl, spacingMs: 0 });
    expect(result.errors).toBe(0);
    expect(result.observations).toHaveLength(2);
    expect(result.observations[1]).toMatchObject({ metric: 'temperature-c', qualifier: '0', sourceId: 'usace-cwms' });
    if (station === 'CETT1') expect(result.observations[1]?.value).toBe(14.31);
  });

  it('retains zero but excludes stale, future, missing and quality-flagged values', () => {
    const parsed = parseCwmsValues([
      [time - 4 * 3600000, 500, 0], [now.getTime() + 1000, 999, 0],
      [time + 1000, 99, 4], [time + 2000, 99, 8], [time + 3000, 99, 16],
      [time + 4000, null, 0], [time, 0, 0], [time + 5000, -999999, 0],
    ], { name: 'test', metric: 'discharge-cfs', now, sourceUrl: 'https://example.gov/' });
    expect(parsed.observation?.value).toBe(0);
    expect(parsed.point).toEqual([time, 0, 0]);
    expect(usableCwmsQuality(undefined)).toBe(false);
    expect(usableCwmsQuality(3)).toBe(true);
  });

  it('reads every cursor page before selecting the newest point', async () => {
    let pages = 0;
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      pages++;
      return Response.json(response(url.searchParams.get('name')!, url.searchParams.get('unit')!,
        [[time + (url.searchParams.has('page') ? 1000 : 0), 10, 0]],
        url.searchParams.has('page') ? {} : { 'next-page': 'cursor-2' }));
    }) as typeof fetch;
    const result = await fetchCwmsObservations('CETT1', { userAgent: 'test', fetchImpl, now, spacingMs: 0 });
    expect(pages).toBe(4);
    expect(result.observations[0]?.observedAt).toBe(new Date(time + 1000).toISOString());
  });

  it.each(['units', 'identity', 'cursor-loop', 'failed-page', 'malformed'])('withholds a partial/bad flow series (%s), retaining healthy temperature', async (failure) => {
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const name = url.searchParams.get('name')!;
      const unit = url.searchParams.get('unit')!;
      if (unit === 'C') return Response.json(response(name, unit, [[time, 12, 0]]));
      if (failure === 'units') return Response.json(response(name, 'cms', [[time, 5, 0]]));
      if (failure === 'identity') return Response.json(response('wrong station', unit, [[time, 5, 0]]));
      if (failure === 'malformed') return new Response('not JSON');
      if (failure === 'failed-page' && url.searchParams.has('page')) return new Response('', { status: 503 });
      return Response.json(response(name, unit, [[time, 5, 0]], { 'next-page': 'same' }));
    }) as typeof fetch;
    const result = await fetchCwmsObservations('CETT1', { userAgent: 'test', fetchImpl, now, spacingMs: 0 });
    expect(result.errors).toBe(1);
    expect(result.observations.map((o) => o.metric)).toEqual(['temperature-c']);
  });

  it('uses CWMS by default in the production bridge and records source provenance', async () => {
    const env = makeEnv();
    try {
      const fetchImpl = (async (input: string | URL | Request) => {
        const url = new URL(String(input));
        if (url.hostname === 'www.tva.com') return Response.json([]);
        expect(url.hostname).toBe('cwms-data.usace.army.mil');
        return Response.json(response(url.searchParams.get('name')!, url.searchParams.get('unit')!, [[time, 12, 0]]));
      }) as typeof fetch;
      const result = await runConditionsReadingsJob(env.db, { userAgent: 'test', fetchImpl,
        now, spacingMs: 0, tvaSpacingMs: 0 });
      expect(result.usaceStations).toBe(3); // CORT1 remains coverage-only for the multi-dam Cumberland.
      const row = env.db.prepare('SELECT payload, temp_c FROM gauge_readings_raw WHERE gauge_id = ?').get('usace:CETT1') as { payload: string; temp_c: number };
      expect(row.temp_c).toBe(12);
      expect(JSON.parse(row.payload).source).toBe('usace-cwms');
      expect(JSON.parse(row.payload).rows['discharge-cfs'].key).toBe(USACE_TAILWATER_SERIES.CETT1!.flow);
    } finally { env.db.close(); rmSync(env.dir, { recursive: true, force: true }); }
  });
});
