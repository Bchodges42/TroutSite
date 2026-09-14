import { describe, expect, it } from 'vitest';
import { parseWaterDataResponse } from '../src/ingest/usgs-waterdata.js';

function feature(overrides: Record<string, unknown> = {}): unknown {
  return {
    type: 'Feature',
    properties: {
      monitoring_location_id: 'USGS-03433500',
      parameter_code: '00060',
      time: '2026-09-14T00:00:00Z',
      value: '37.8',
      ...overrides,
    },
  };
}

describe('parseWaterDataResponse — live qualifier shapes (2026-09-14 ingest crash)', () => {
  it('accepts array qualifiers (["P"]) and keeps the value', () => {
    const readings = parseWaterDataResponse({ features: [feature({ qualifier: ['P'] })] });
    expect(readings).toHaveLength(1);
    expect(readings[0]?.cfs).toBe(37.8);
  });

  it('drops readings whose array qualifier marks them invalid', () => {
    const readings = parseWaterDataResponse({ features: [feature({ qualifier: ['Ice'] })] });
    expect(readings).toHaveLength(0);
  });

  it('still accepts plain-string qualifiers', () => {
    const readings = parseWaterDataResponse({ features: [feature({ qualifier: 'P' })] });
    expect(readings).toHaveLength(1);
  });

  it('rejects non-positive discharge regardless of qualifier shape', () => {
    const readings = parseWaterDataResponse({ features: [feature({ value: '-168', qualifier: ['P'] })] });
    expect(readings).toHaveLength(0);
  });
});
