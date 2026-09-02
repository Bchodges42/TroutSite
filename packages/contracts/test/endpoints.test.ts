import { describe, expect, it } from 'vitest';
import { ENDPOINTS } from '../src/index.js';

describe('ENDPOINTS (frozen endpoint map)', () => {
  it('exposes the literal snapshot routes', () => {
    expect(ENDPOINTS.streams).toBe('/v1/streams');
    expect(ENDPOINTS.conditionsLatest).toBe('/v1/conditions/latest.json');
    expect(ENDPOINTS.reportsRecent).toBe('/v1/reports/recent.json');
    expect(ENDPOINTS.portalReports).toBe('/v1/portal/reports');
    expect(ENDPOINTS.healthz).toBe('/healthz');
  });

  it('builds the parameterized snapshot routes', () => {
    expect(ENDPOINTS.stocking('TX')).toBe('/v1/stocking/TX.json');
    expect(ENDPOINTS.shops('OK')).toBe('/v1/shops/OK.json');
    expect(ENDPOINTS.hatch('tx-hill-country', 4)).toBe('/v1/hatch/tx-hill-country/4.json');
  });
});
