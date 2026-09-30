import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreFishability } from '@trout/contracts';
import {
  fetchWaterDataReadings,
  parseWaterDataResponse,
  WATERDATA_PARAMETER_CODES,
} from '../src/ingest/usgs-waterdata.js';

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), 'fixtures/USGS-WATERDATA/latest-continuous-03518500.json'), 'utf8'),
);

describe('USGS Water Data OGC API', () => {
  it('parses mixed string/number features, offsets, and DO while dropping sentinel rows', () => {
    // UPDATED with the F01 fix (2026-09-29 audit): the recorded fixture's
    // discharge/temperature/DO are stamped 12:00Z while gage height is
    // 12:01-04:00 (= 16:01Z) — 4h01m newer. The old expectation merged those
    // 4h-old metrics under the fresh height stamp (the exact laundering F01
    // bans); the T1-6 freshness window (3 h, same as the legacy parser)
    // now drops them and the reading carries the height metric only.
    const rows = parseWaterDataResponse(fixture);
    expect(rows).toEqual([
      {
        gaugeId: '03518500',
        heightFt: 4.2,
        timestamp: '2026-09-13T16:01:00.000Z',
      },
    ]);
  });

  it('merges parameters observed at the same instant (offsets normalized) under one stamp', () => {
    const rows = parseWaterDataResponse({
      features: [
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00060', time: '2026-09-13T16:01:00Z', value: 245 } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00065', time: '2026-09-13T12:01:00-04:00', value: 4.2 } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00010', time: '2026-09-13T16:01:00Z', value: 16.4 } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00300', time: '2026-09-13T16:01:00Z', value: 7.1 } },
      ],
    });
    expect(rows).toEqual([
      {
        gaugeId: '1',
        cfs: 245,
        heightFt: 4.2,
        tempC: 16.4,
        dissolvedOxygenMgL: 7.1,
        timestamp: '2026-09-13T16:01:00.000Z',
      },
    ]);
  });

  it('drops invalid qualifiers and non-positive discharge before scoring', () => {
    const rows = parseWaterDataResponse({
      features: [
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00060', time: '2026-09-13T12:00:00Z', value: 0 } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00060', time: '2026-09-13T12:01:00Z', value: 5, qualifier: 'Ice' } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00300', time: '2026-09-13T12:02:00Z', value: 4 } },
      ],
    });
    expect(rows).toEqual([{ gaugeId: '1', dissolvedOxygenMgL: 4, timestamp: '2026-09-13T12:02:00.000Z' }]);
  });

  it('normalizes USGS 00045 precipitation inches to millimetres as context', () => {
    const rows = parseWaterDataResponse({
      features: [
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00045', time: '2026-09-13T12:00:00Z', value: '0.25' } },
      ],
    });
    expect(rows).toEqual([{ gaugeId: '1', precipitationMm: 6.35, timestamp: '2026-09-13T12:00:00.000Z' }]);
  });

  it('fetches the modern endpoint with server-only key and stable parameter set', async () => {
    let requested = '';
    const fetchImpl: typeof fetch = async (input) => {
      requested = String(input);
      return new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const result = await fetchWaterDataReadings(['03518500', 'tva:NRST1'], {
      userAgent: 'trout-test/1.0',
      apiKey: 'server-test-key',
      fetchImpl,
      baseUrl: 'https://waterdata.test/ogcapi/v0',
    });
    const url = new URL(requested);
    expect(url.pathname).toBe('/ogcapi/v0/collections/latest-continuous/items');
    expect(url.searchParams.get('monitoring_location_id')).toBe('USGS-03518500');
    expect(url.searchParams.get('parameter_code')).toBe(WATERDATA_PARAMETER_CODES.join(','));
    expect(url.searchParams.get('api_key')).toBe('server-test-key');
    expect(result.readings).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it('warns loudly when keyless development mode is used', async () => {
    const result = await fetchWaterDataReadings([], { userAgent: 'trout-test/1.0' });
    expect(result.warnings[0]).toMatch(/API key is not configured/i);
  });
});

describe('F01: per-metric observation time (default Water Data parser)', () => {
  const site = (parameter_code: string, time: string, value: number) => ({
    properties: { monitoring_location_id: 'USGS-1', parameter_code, time, value },
  });

  it('audit probe: a month-old temperature must NOT wear the fresh flow timestamp', () => {
    // Flow reported 2026-09-29 12:00Z, temperature last reported 2026-08-29 12:00Z
    // (31 days earlier). The old parser stamped BOTH with 12:00Z, so the scorer
    // accepted obsolete temperature as a 5-minute-old reading.
    const rows = parseWaterDataResponse({
      features: [site('00060', '2026-09-29T12:00:00Z', 100), site('00010', '2026-08-29T12:00:00Z', 22)],
    });
    expect(rows).toEqual([{ gaugeId: '1', cfs: 100, timestamp: '2026-09-29T12:00:00.000Z' }]);
  });

  it('keeps each metric\'s own observation time via metricTimes when they differ within the window', () => {
    const rows = parseWaterDataResponse({
      features: [
        site('00060', '2026-09-29T12:00:00Z', 100),
        site('00010', '2026-09-29T11:00:00Z', 22), // 1 h behind flow — inside the 3 h window
      ],
    });
    expect(rows).toEqual([
      {
        gaugeId: '1',
        cfs: 100,
        tempC: 22,
        timestamp: '2026-09-29T12:00:00.000Z',
        metricTimes: { tempC: '2026-09-29T11:00:00.000Z' },
      },
    ]);
  });

  it('end to end: fresh flow cannot renew temperature freshness (comfort cannot-assess)', () => {
    const readings = parseWaterDataResponse({
      features: [site('00060', '2026-09-29T12:00:00Z', 100), site('00010', '2026-08-29T12:00:00Z', 22)],
    });
    const score = scoreFishability(
      readings,
      'smallmouth-bass',
      {
        species: 'smallmouth-bass',
        unit: 'degC',
        lethalLow: 0,
        avoidanceLow: 10,
        optimalLow: 18,
        optimalHigh: 26,
        avoidanceHigh: 30,
        lethalHigh: 33,
      },
      Date.parse('2026-09-29T12:05:00Z'), // 5 minutes after the flow observation
    );
    // Before the fix this produced comfort 90, assessed:true, ageMinutes=5 from
    // 31-day-old water. The honest answer is "cannot assess temperature".
    expect(score.assessed).toBe(false);
    expect(score.freshness).toBeNull();
  });
});
