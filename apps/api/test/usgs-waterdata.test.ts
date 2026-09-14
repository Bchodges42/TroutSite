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
  it('parses mixed string/number features, offsets, and DO while dropping sentinel rows', () => {
    const rows = parseWaterDataResponse(fixture);
    expect(rows).toEqual([
      {
        gaugeId: '03518500',
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
