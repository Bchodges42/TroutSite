import { describe, expect, it } from 'vitest';
import {
  fetchTvaGenerationReleases,
  fetchTvaPredictedData,
  parseTvaGenerationReleases,
  parseTvaPredictedData,
} from '../src/evidence/tva-provider.js';
import { ReleaseScheduleSchema } from '@trout/contracts';
import { readFixture } from './helpers.js';

const releases = JSON.parse(readFixture('TVA/generation-releases-NRST1-2026-09-13.json'));
const forecast = JSON.parse(readFixture('TVA/predicted-data-NRST1-2026-09-13.json'));
const cordellHullReleases = JSON.parse(readFixture('TVA/generation-releases-COHT1-2026-09-13.json'));
const cordellHullForecast = JSON.parse(readFixture('TVA/predicted-data-COHT1-2026-09-13.json'));

describe('TVA release and forecast parsers', () => {
  it('preserves generator blocks, dates, and per-dam timezone labels', () => {
    expect(parseTvaGenerationReleases(releases)).toEqual([
      { date: '2026-09-13', startTime: '1 AM', endTime: '5 AM', timeZone: 'EDT', generators: '0' },
      { date: '2026-09-13', startTime: '5 AM', endTime: '9 AM', timeZone: 'EDT', generators: '1' },
      { date: '2026-09-14', startTime: '5 PM', endTime: '9 PM', timeZone: 'EDT', generators: '2 or more' },
    ]);
  });

  it('accepts an empty release array as an honest empty state', () => {
    expect(parseTvaGenerationReleases([])).toEqual([]);
  });

  it('normalizes mixed forecast typing and keeps missing inflow missing', () => {
    expect(parseTvaPredictedData(forecast)).toEqual([
      { date: '2026-09-13', averageInflowCfs: 572, midnightElevationFt: 1011.49, averageOutflowCfs: 1962 },
      { date: '2026-09-14', averageInflowCfs: 600, midnightElevationFt: 1011.55, averageOutflowCfs: 2100 },
      { date: '2026-09-15', midnightElevationFt: 1011.6, averageOutflowCfs: 0 },
    ]);
  });

  it('fixture-tests Cordell Hull with CDT labels and no day-one inflow', () => {
    expect(parseTvaGenerationReleases(cordellHullReleases)).toEqual([
      { date: '2026-09-13', startTime: '12 AM', endTime: '6 AM', timeZone: 'CDT', generators: '0' },
      { date: '2026-09-13', startTime: '6 AM', endTime: '10 AM', timeZone: 'CDT', generators: '1' },
    ]);
    expect(parseTvaPredictedData(cordellHullForecast)).toEqual([
      { date: '2026-09-13', midnightElevationFt: 482.1, averageOutflowCfs: 0 },
      { date: '2026-09-14', averageInflowCfs: 860, midnightElevationFt: 482.22, averageOutflowCfs: 3200 },
      { date: '2026-09-15', averageInflowCfs: 900, midnightElevationFt: 482.3, averageOutflowCfs: 3400 },
    ]);
  });

  it('fetches both JSON endpoints with the required browser headers', async () => {
    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      urls.push(String(input));
      expect(new Headers(init?.headers).get('accept')).toBe('application/json');
      expect(new Headers(init?.headers).get('user-agent')).toContain('trout-test');
      return new Response(JSON.stringify(String(input).includes('generation-releases') ? releases : forecast), { status: 200 });
    };
    const opts = { userAgent: 'trout-test/1.0', fetchImpl, baseUrl: 'https://tva.test/RestApi' };
    await expect(fetchTvaGenerationReleases('NRST1', opts)).resolves.toHaveLength(3);
    await expect(fetchTvaPredictedData('NRST1', opts)).resolves.toHaveLength(3);
    expect(urls).toEqual([
      'https://tva.test/RestApi/generation-releases/NRST1',
      'https://tva.test/RestApi/predicted-data/NRST1',
    ]);
  });

  // Regression (2026-09-29 production incident): TVA publishes negative
  // AverageInflow during reservoir drawdowns; the release-forecast contract is
  // nonnegative, and one such row aborted the entire gauges ingest.
  it('omits negative/non-finite forecast values instead of breaking the contract', () => {
    const drawdownPayload = [
      { Day: '09/28/2026', AverageInflow: '1,234', MidnightElevation: '1011.49', AverageOutflow: '1,962' },
      { Day: '09/29/2026', AverageInflow: '-4,021', MidnightElevation: '1011.55', AverageOutflow: '-75' },
      { Day: '09/30/2026', AverageInflow: 'NaN', MidnightElevation: '1011.6', AverageOutflow: '2,100' },
    ];
    const rows = parseTvaPredictedData(drawdownPayload);
    expect(rows).toEqual([
      { date: '2026-09-28', averageInflowCfs: 1234, midnightElevationFt: 1011.49, averageOutflowCfs: 1962 },
      { date: '2026-09-29', midnightElevationFt: 1011.55 },
      { date: '2026-09-30', midnightElevationFt: 1011.6, averageOutflowCfs: 2100 },
    ]);
    // The whole point: what the provider emits must now clear the contract
    // schema that killed the 2026-09-29 gauges job at forecasts[2].
    expect(() =>
      ReleaseScheduleSchema.parse({
        waterId: 'norris-tailwater',
        locationId: 'NRST1',
        retrievedAt: '2026-09-29T02:00:00.000Z',
        sourceUrl: 'https://www.tva.com/portal/lakeinfo/NRST1',
        status: 'available',
        releases: [],
        forecasts: rows,
      }),
    ).not.toThrow();
  });
});
