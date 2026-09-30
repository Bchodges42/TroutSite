import type { GaugeHistory, GaugeHistorySample } from './gaugeHistory';

/**
 * Deterministic gauge-history fixtures (ADR 0014 shape) for tests and dev
 * (`DEV_FIXTURES=1` data files can be generated from these). All timestamps are
 * anchored to FIXTURE_NOW_MS — pin the clock there (or pass `nowMs`) and every
 * window/dedupe/gap assertion is exact.
 *
 * The fixtures honor the same honesty rules as the real endpoint: measurements
 * only, gaps carried as gaps, no fabricated history before the record begins.
 */

/** 2026-09-30T12:00:00Z — pin tests to this instant. */
export const FIXTURE_NOW_MS = Date.parse('2026-09-30T12:00:00Z');
export const FIXTURE_RETRIEVED_AT = '2026-09-30T12:00:00Z';
export const FIXTURE_SOURCE_URL = 'https://waterdata.usgs.gov/monitoring-location/03471500';

export const FIXTURE_GAUGE_ID = '03471500';
export const FIXTURE_SPARSE_GAUGE_ID = '03471505';

function iso(baseMs: number, hoursAgo: number): string {
  return new Date(baseMs - hoursAgo * 3_600_000).toISOString();
}

/**
 * Dense hourly record for the last 30 days (721 samples): discharge the whole
 * way, water temperature only over the last 7 days — so metric availability is
 * genuinely shorter than the record, the way real gauges report.
 */
export function denseHistoryFixture(overrides: Partial<GaugeHistory> = {}): GaugeHistory {
  const samples: GaugeHistorySample[] = [];
  for (let hoursAgo = 720; hoursAgo >= 0; hoursAgo--) {
    const sample: GaugeHistorySample = {
      timestamp: iso(FIXTURE_NOW_MS, hoursAgo),
      cfs: Math.round((200 + 20 * Math.sin(hoursAgo / 12)) * 10) / 10,
    };
    if (hoursAgo <= 168) {
      sample.tempC = Math.round((14 + 3 * Math.sin(hoursAgo / 24)) * 10) / 10;
    }
    samples.push(sample);
  }
  return {
    gaugeId: FIXTURE_GAUGE_ID,
    metrics: ['cfs', 'tempC'],
    samples,
    samplingCadenceNote: 'Hourly readings where reported by the gauge.',
    retrievedAt: FIXTURE_RETRIEVED_AT,
    sourceUrl: FIXTURE_SOURCE_URL,
    ...overrides,
  };
}

/**
 * Sparse 6-hour-cadence record over the last 7 days with a deliberate 36-hour
 * outage (hoursAgo 24–60 removed): 36 h > 3 × 6 h cadence, so the gap detector
 * must split the series. Stage is reported throughout; discharge only on the
 * older side and the newest few samples (per-metric sparsity → scatter).
 */
export function sparseHistoryFixture(overrides: Partial<GaugeHistory> = {}): GaugeHistory {
  const samples: GaugeHistorySample[] = [];
  for (let hoursAgo = 168; hoursAgo >= 0; hoursAgo -= 6) {
    if (hoursAgo < 60 && hoursAgo > 24) continue; // the 36-hour outage
    const sample: GaugeHistorySample = {
      timestamp: iso(FIXTURE_NOW_MS, hoursAgo),
      heightFt: Math.round((3.2 + 0.4 * Math.sin(hoursAgo / 10)) * 100) / 100,
    };
    // Discharge drops out of the gauge report for the most recent stretch.
    if (hoursAgo >= 60 || hoursAgo <= 12) {
      sample.cfs = Math.round((120 + 10 * Math.cos(hoursAgo / 8)) * 10) / 10;
    }
    samples.push(sample);
  }
  return {
    gaugeId: FIXTURE_SPARSE_GAUGE_ID,
    metrics: ['cfs', 'heightFt'],
    samples,
    samplingCadenceNote: 'Gauge reports every 6 hours; a multi-day outage is visible as a gap.',
    retrievedAt: FIXTURE_RETRIEVED_AT,
    sourceUrl: 'https://waterdata.usgs.gov/monitoring-location/03471505',
    ...overrides,
  };
}

/** Raw samples for the dedupe test: the same timestamp measured twice, the
 *  newer emission (later in the array) must win per metric. */
export function repeatedSamplesFixture(): GaugeHistorySample[] {
  return [
    { timestamp: iso(FIXTURE_NOW_MS, 6), cfs: 210 },
    { timestamp: iso(FIXTURE_NOW_MS, 12), cfs: 180, tempC: 15 },
    // Same instant re-measured later: newer cfs wins, tempC merges in.
    { timestamp: iso(FIXTURE_NOW_MS, 6), cfs: 224, tempC: 16.5 },
    { timestamp: iso(FIXTURE_NOW_MS, 18), cfs: 205 },
  ];
}
