import { describe, expect, it } from 'vitest';
import {
  GAP_FACTOR,
  GaugeHistorySchema,
  dedupeSamples,
  gaugeHistoryUrl,
  historyWindow,
  medianIntervalMs,
  metricStats,
  metricsInWindow,
  normalizeSamples,
  recentChangeText,
  splitAtGaps,
  windowSamples,
  type GaugeHistorySample,
  type NormalizedSample,
} from '../src/features/waters/gaugeHistory';
import {
  FIXTURE_NOW_MS,
  denseHistoryFixture,
  repeatedSamplesFixture,
  sparseHistoryFixture,
} from '../src/features/waters/gaugeHistoryFixtures';

/**
 * Pure gauge-history model (ADR 0014): timestamp normalization, defensive
 * dedupe (newest emission wins per gauge+metric+timestamp), gap detection and
 * PRESERVATION (>3× median cadence — never interpolated), 24h/7d/30d windowing,
 * per-window stats, and the "recent measured change" summary discipline.
 */

const HOUR = 3_600_000;

describe('fixtures', () => {
  it('fixtures parse against the local ADR-0014 schema', () => {
    expect(GaugeHistorySchema.parse(denseHistoryFixture())).toBeTruthy();
    expect(GaugeHistorySchema.parse(sparseHistoryFixture())).toBeTruthy();
  });

  it('dense fixture is hourly and temperature covers only the last 7 days', () => {
    const normalized = normalizeSamples(denseHistoryFixture().samples);
    expect(normalized).toHaveLength(721);
    expect(medianIntervalMs(normalized)).toBe(HOUR);
    const withTemp = normalized.filter((s) => s.tempC !== undefined);
    expect(withTemp[0]!.timestampMs).toBe(FIXTURE_NOW_MS - 168 * HOUR);
    expect(withTemp).toHaveLength(169);
  });
});

describe('normalizeSamples', () => {
  it('converts ISO stamps to epoch ms and sorts ascending', () => {
    const normalized = normalizeSamples([
      { timestamp: '2026-09-30T12:00:00Z', cfs: 2 },
      { timestamp: '2026-09-30T10:00:00Z', cfs: 1 },
      { timestamp: '2026-09-30T09:00:00-05:00', cfs: 0.5 }, // == 14:00Z
    ]);
    expect(normalized.map((s) => s.timestampMs)).toEqual([
      Date.parse('2026-09-30T10:00:00Z'),
      Date.parse('2026-09-30T12:00:00Z'),
      Date.parse('2026-09-30T14:00:00Z'),
    ]);
  });

  it('drops samples that carry no measured metric and unparsable stamps', () => {
    const normalized = normalizeSamples([
      { timestamp: '2026-09-30T12:00:00Z', cfs: 2 },
      { timestamp: '2026-09-30T11:00:00Z' }, // no metric → not a measurement
      { timestamp: 'not-a-stamp', cfs: 3 } as unknown as GaugeHistorySample,
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]!.cfs).toBe(2);
  });
});

describe('dedupeSamples (same gauge+metric+timestamp keeps newest)', () => {
  it('keeps the newest emission per metric and merges metrics at one stamp', () => {
    const deduped = dedupeSamples(normalizeSamples(repeatedSamplesFixture()));
    expect(deduped).toHaveLength(3); // 4 raw rows → 3 distinct timestamps
    const sixHour = deduped.find((s) => s.timestampMs === FIXTURE_NOW_MS - 6 * HOUR)!;
    // The LATER row at the same instant wins for cfs…
    expect(sixHour.cfs).toBe(224);
    // …and its tempC merges in (the earlier row had none).
    expect(sixHour.tempC).toBe(16.5);
    // Rows with a unique timestamp pass through untouched.
    expect(deduped.find((s) => s.timestampMs === FIXTURE_NOW_MS - 12 * HOUR)!.cfs).toBe(180);
  });

  it('is idempotent on already-deduplicated input', () => {
    const once = dedupeSamples(normalizeSamples(denseHistoryFixture().samples));
    expect(dedupeSamples(once)).toEqual(once);
    expect(once).toHaveLength(721);
  });
});

describe('splitAtGaps (detect and PRESERVE gaps — never interpolate)', () => {
  it('splits the sparse fixture at its 36-hour outage', () => {
    const normalized = normalizeSamples(sparseHistoryFixture().samples);
    const segments = splitAtGaps(normalized);
    expect(segments.length).toBe(2);
    // Stage reports all the way through; the outage is 60h-ago → 24h-ago.
    expect(segments[1]!.gapBeforeMs).toBe(36 * HOUR);
    expect(segments[0]!.samples).toHaveLength(19);
    expect(segments[1]!.samples).toHaveLength(5);
  });

  it('keeps a 3× cadence jump unbroken (strictly greater is a gap)', () => {
    const base = FIXTURE_NOW_MS - 48 * HOUR;
    const hourly: NormalizedSample[] = [0, 1, 2, 3, 4].map((i) => ({
      timestampMs: base + i * HOUR,
      cfs: 10,
    }));
    // Exactly 3× cadence: NOT a gap.
    const at3x = splitAtGaps([...hourly, { timestampMs: base + 7 * HOUR, cfs: 11 }]);
    expect(at3x).toHaveLength(1);
    // Strictly beyond 3×: a gap.
    const beyond3x = splitAtGaps([...hourly, { timestampMs: base + 7 * HOUR + 1, cfs: 11 }]);
    expect(beyond3x).toHaveLength(2);
    expect(beyond3x[1]!.gapBeforeMs).toBe(3 * HOUR + 1);
    expect(GAP_FACTOR).toBe(3);
  });

  it('never splits a dense series and tolerates a single sample', () => {
    const dense = normalizeSamples(denseHistoryFixture().samples);
    expect(splitAtGaps(dense)).toHaveLength(1);
    expect(splitAtGaps([{ timestampMs: FIXTURE_NOW_MS, cfs: 5 }])).toEqual([
      { samples: [{ timestampMs: FIXTURE_NOW_MS, cfs: 5 }] },
    ]);
  });
});

describe('windowSamples (24h / 7d / 30d)', () => {
  const dense = normalizeSamples(denseHistoryFixture().samples);

  it('windows the dense hourly record exactly', () => {
    expect(windowSamples(dense, historyWindow('24h').ms, FIXTURE_NOW_MS)).toHaveLength(25);
    expect(windowSamples(dense, historyWindow('7d').ms, FIXTURE_NOW_MS)).toHaveLength(169);
    expect(windowSamples(dense, historyWindow('30d').ms, FIXTURE_NOW_MS)).toHaveLength(721);
  });

  it('excludes future-dated stamps (clock skew never leaks into the window)', () => {
    const skewed = [...dense, { timestampMs: FIXTURE_NOW_MS + HOUR, cfs: 999 }];
    expect(windowSamples(skewed, historyWindow('24h').ms, FIXTURE_NOW_MS)).toHaveLength(25);
  });

  it('the sparse record fits inside 30d the same as 7d', () => {
    const sparse = normalizeSamples(sparseHistoryFixture().samples);
    const w7 = windowSamples(sparse, historyWindow('7d').ms, FIXTURE_NOW_MS);
    const w30 = windowSamples(sparse, historyWindow('30d').ms, FIXTURE_NOW_MS);
    expect(w7).toHaveLength(w30.length);
    expect(w7.length).toBeGreaterThan(0);
  });
});

describe('metricStats + recentChangeText', () => {
  it('computes min/max/last per metric over the window', () => {
    const dense = normalizeSamples(denseHistoryFixture().samples);
    const w24 = windowSamples(dense, historyWindow('24h').ms, FIXTURE_NOW_MS);
    const stats = metricStats(w24, 'cfs')!;
    expect(stats.count).toBe(25);
    // The dense fixture's cfs at "now" (hoursAgo 0) is exactly 200.
    expect(stats.last).toBe(200);
    // Expected extremes over integer hours 0..24 with cfs = 200 + 20·sin(h/12),
    // recomputed from the same generator (sin ≥ 0 in this range, peak near h=19).
    const hours = Array.from({ length: 25 }, (_, i) => i);
    const values = hours.map((h) => Math.round((200 + 20 * Math.sin(h / 12)) * 10) / 10);
    expect(stats.min).toBe(Math.min(...values));
    expect(stats.max).toBe(Math.max(...values));
    expect(metricsInWindow(w24)).toEqual(['tempC', 'cfs']);
  });

  it('returns null stats for a metric the gauge does not report', () => {
    const sparse24 = windowSamples(
      normalizeSamples(sparseHistoryFixture().samples),
      historyWindow('24h').ms,
      FIXTURE_NOW_MS,
    );
    expect(metricStats(sparse24, 'tempC')).toBeNull();
    expect(metricsInWindow(sparse24)).toEqual(['cfs', 'heightFt']);
  });

  it('phrases measured change between endpoints without interpolation claims', () => {
    const stats = {
      metric: 'cfs' as const,
      count: 12,
      min: 9.5,
      max: 10.5,
      first: 10.5,
      firstTimestampMs: 1,
      last: 9.5,
      lastTimestampMs: 2,
    };
    const text = recentChangeText(stats, (n) => `${n} cfs`);
    expect(text).toContain('10.5 cfs → 9.5 cfs');
    expect(text).toMatch(/nothing interpolated/i);
  });

  it('reads formatted-equal endpoints as steady, never invents a trend', () => {
    const stats = {
      metric: 'cfs' as const,
      count: 5,
      min: 200.02,
      max: 200.04,
      first: 200.04,
      firstTimestampMs: 1,
      last: 200.02,
      lastTimestampMs: 2,
    };
    const text = recentChangeText(stats, (n) => `${Math.round(n)} cfs`);
    expect(text).toMatch(/held near 200 cfs/i);
  });

  it('returns null for a single observation (no change can be measured)', () => {
    const stats = metricStats(
      [{ timestampMs: 1, cfs: 10 }],
      'cfs',
    );
    expect(stats).toBeTruthy();
    expect(recentChangeText(stats!, (n) => `${n} cfs`)).toBeNull();
  });
});

describe('gaugeHistoryUrl', () => {
  it('builds the frozen ADR-0014 URL and encodes the gauge id segment', () => {
    expect(gaugeHistoryUrl('03471500')).toBe('/v1/gauge-history/03471500.json');
    expect(gaugeHistoryUrl('tva:SSH')).toBe('/v1/gauge-history/tva%3ASSH.json');
  });
});
