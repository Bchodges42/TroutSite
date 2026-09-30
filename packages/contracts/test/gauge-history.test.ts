import { describe, expect, it } from 'vitest';
import {
  ENDPOINTS,
  GAUGE_HISTORY_METRICS,
  GaugeHistorySchema,
} from '../src/index.js';

const NOW = '2026-09-30T12:00:00Z';
const SOURCE = 'https://waterdata.usgs.gov/monitoring-location/03471500';

const validPayload = {
  gaugeId: '03471500',
  metrics: ['cfs', 'tempC'],
  samples: [
    { timestamp: '2026-09-30T10:00:00Z', cfs: 110, tempC: 16.5 },
    { timestamp: '2026-09-30T11:00:00Z', cfs: 120 },
  ],
  samplingCadenceNote: 'hourly where reported',
  retrievedAt: NOW,
  sourceUrl: SOURCE,
};

describe('GaugeHistorySchema (ADR 0014, additive contracts-v2.5.0)', () => {
  it('accepts a valid payload and preserves measured values as ingested', () => {
    const parsed = GaugeHistorySchema.parse(validPayload);
    expect(parsed.gaugeId).toBe('03471500');
    expect(parsed.metrics).toEqual(['cfs', 'tempC']);
    expect(parsed.samples[0]).toMatchObject({ cfs: 110, tempC: 16.5 });
    expect(parsed.samples[1]).toMatchObject({ cfs: 120 });
    expect('tempC' in (parsed.samples[1] ?? {})).toBe(false);
    expect(parsed.retrievedAt).toBe(NOW);
    expect(parsed.sourceUrl).toBe(SOURCE);
  });

  it('accepts the minimal honest shape (no cadence note, single metric and sample)', () => {
    expect(
      GaugeHistorySchema.parse({
        gaugeId: '03471500',
        metrics: ['heightFt'],
        samples: [{ timestamp: '2026-09-30T11:00:00Z', heightFt: 3.1 }],
        retrievedAt: NOW,
        sourceUrl: SOURCE,
      }).samplingCadenceNote,
    ).toBeUndefined();
  });

  it('rejects empty samples (a gauge with no measurements gets no file, never a shell)', () => {
    expect(
      GaugeHistorySchema.safeParse({ ...validPayload, samples: [] }).success,
    ).toBe(false);
  });

  it('rejects unknown metrics (the metrics array is a closed enum)', () => {
    expect(
      GaugeHistorySchema.safeParse({ ...validPayload, metrics: ['cfs', 'turbidity'] }).success,
    ).toBe(false);
  });

  it('rejects an empty metrics array, empty gauge id, and non-URL source', () => {
    expect(GaugeHistorySchema.safeParse({ ...validPayload, metrics: [] }).success).toBe(false);
    expect(GaugeHistorySchema.safeParse({ ...validPayload, gaugeId: '' }).success).toBe(false);
    expect(GaugeHistorySchema.safeParse({ ...validPayload, sourceUrl: 'not-a-url' }).success).toBe(false);
  });

  it('exposes the metric tuple and the frozen per-gauge endpoint', () => {
    expect(GAUGE_HISTORY_METRICS).toEqual(['cfs', 'tempC', 'heightFt']);
    expect(ENDPOINTS.gaugeHistory('03471500')).toBe('/v1/gauge-history/03471500.json');
  });
});
