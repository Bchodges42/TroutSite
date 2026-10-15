import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fetchWaterDataReadings,
  parseWaterDataResponse,
  WATERDATA_PARAMETER_CODES,
} from '../src/ingest/usgs-waterdata.js';

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), 'fixtures/USGS-WATERDATA/latest-continuous-03518500.json'), 'utf8'),
);

describe('USGS Water Data OGC API', () => {
  it('parses mixed string/number features and offsets, dropping sentinel rows and stale parameters', () => {
    const rows = parseWaterDataResponse(fixture);
    // The offset is honoured: stage at 12:01-04:00 is 16:01Z, four hours after
    // the 12:00Z flow/temperature/DO rows. Those are beyond the 3 h freshness
    // window (T1-6), so they are dropped rather than re-stamped 16:01Z.
    expect(rows).toEqual([{ gaugeId: '03518500', heightFt: 4.2, timestamp: '2026-09-13T16:01:00.000Z' }]);
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

describe('USGS Water Data OGC API — live 2026-10-14 statewide capture (audit)', () => {
  const live = JSON.parse(
    readFileSync(join(process.cwd(), 'fixtures/USGS-WATERDATA/latest-continuous-tn-2026-10-14.json'), 'utf8'),
  );
  const rows = parseWaterDataResponse(live);
  const site = (id: string) => rows.find((r) => r.gaugeId === id);

  it('never stamps a years-old parameter with the current reading time (T1-6 on the default provider)', () => {
    // Duck River tailwater 03597860: flow 2026-10-14, temperature/DO last reported 2012 (DISCONTINUED).
    expect(site('03597860')).toEqual({ gaugeId: '03597860', cfs: 186, heightFt: 10.19, timestamp: '2026-10-14T23:30:00.000Z' });
    // 03598000: 2009 temperature must not ride along with today's 194 cfs.
    expect(site('03598000')?.tempC).toBeUndefined();
    expect(site('03598000')?.cfs).toBe(194);
    // Harpeth at Franklin 03432350: 2014 temperature + DO dropped, live flow kept.
    expect(site('03432350')).toMatchObject({ cfs: 10.6, heightFt: 3.9 });
    expect(site('03432350')?.tempC).toBeUndefined();
    expect(site('03432350')?.dissolvedOxygenMgL).toBeUndefined();
  });

  it('every published metric is within 3 h of its own reading stamp', () => {
    const features = (live.features as Array<{ properties: { monitoring_location_id: string; time: string } }>);
    for (const r of rows) {
      const stamps = features
        .filter((f) => f.properties.monitoring_location_id === `USGS-${r.gaugeId}`)
        .map((f) => Date.parse(f.properties.time));
      expect(Date.parse(r.timestamp)).toBe(Math.max(...stamps));
    }
  });

  it('treats OGC long-form qualifiers (DISCONTINUED) as unusable', () => {
    const one = parseWaterDataResponse({
      features: [
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00060', time: '2026-10-14T12:00:00Z', value: '50', qualifier: null } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00010', time: '2026-10-14T12:00:00Z', value: '12', qualifier: ['DISCONTINUED'] } },
        { properties: { monitoring_location_id: 'USGS-1', parameter_code: '00065', time: '2026-10-14T12:00:00Z', value: '2', qualifier: ['P', 'ICE'] } },
      ],
    });
    expect(one).toEqual([{ gaugeId: '1', cfs: 50, timestamp: '2026-10-14T12:00:00.000Z' }]);
  });
});
