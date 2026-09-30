import { z } from 'zod';
import { IsoDateTimeSchema } from '@trout/contracts';

/**
 * Gauge history (ADR 0014) — GET /v1/gauge-history/{gaugeId}.json.
 *
 * The zod schema lives here until the API lane lands the emission, then moves
 * to packages/contracts/src/schemas/gaugeHistory.ts (see the ADR's "Contract
 * home" section). Honesty rules are shared with the API side: the payload holds
 * measurements only — no fabricated pre-launch history, no interpolation, gaps
 * are carried as gaps, 90-day retention is a floor and completeness is never
 * implied.
 */

export const GAUGE_HISTORY_METRICS = ['cfs', 'tempC', 'heightFt'] as const;
export type GaugeMetric = (typeof GAUGE_HISTORY_METRICS)[number];

export const GaugeHistorySampleSchema = z.object({
  timestamp: IsoDateTimeSchema,
  cfs: z.number().optional(),
  tempC: z.number().optional(),
  heightFt: z.number().optional(),
});
export type GaugeHistorySample = z.infer<typeof GaugeHistorySampleSchema>;

export const GaugeHistorySchema = z.object({
  gaugeId: z.string().min(1),
  /** Which metrics the gauge reports — only metrics present in the samples. */
  metrics: z.array(z.enum(GAUGE_HISTORY_METRICS)).min(1),
  samples: z.array(GaugeHistorySampleSchema).min(1),
  samplingCadenceNote: z.string().min(1).optional(),
  retrievedAt: IsoDateTimeSchema,
  sourceUrl: z.string().url(),
});
export type GaugeHistory = z.infer<typeof GaugeHistorySchema>;

/** The per-gauge history file URL (ADR 0014). Kept beside the local schema so
 *  the contracts move is a single-file re-export. */
export function gaugeHistoryUrl(gaugeId: string): string {
  return `/v1/gauge-history/${encodeURIComponent(gaugeId)}.json`;
}

// ── Pure model ───────────────────────────────────────────────────────────────
// Everything below is UI-agnostic and unit-tested directly; the chart component
// only formats what these functions return.

/** A sample with its timestamp normalized to epoch millis, sorted ascending. */
export interface NormalizedSample {
  timestampMs: number;
  cfs?: number;
  tempC?: number;
  heightFt?: number;
}

/**
 * Parse ISO timestamps to epoch ms, drop samples that carry no measured metric
 * (a sample with no value is not a measurement), sort ascending.
 */
export function normalizeSamples(samples: GaugeHistorySample[]): NormalizedSample[] {
  return samples
    .map((s) => ({
      timestampMs: Date.parse(s.timestamp),
      ...(typeof s.cfs === 'number' ? { cfs: s.cfs } : {}),
      ...(typeof s.tempC === 'number' ? { tempC: s.tempC } : {}),
      ...(typeof s.heightFt === 'number' ? { heightFt: s.heightFt } : {}),
    }))
    .filter(
      (s) =>
        Number.isFinite(s.timestampMs) &&
        (s.cfs !== undefined || s.tempC !== undefined || s.heightFt !== undefined),
    )
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

/**
 * Defensive dedupe (the emitter deduplicates per timestamp too, ADR 0014 rule 4):
 * one sample per timestamp; when the same gauge+metric+timestamp arrives twice,
 * the NEWEST emission wins (later array order = newer), per metric. Metrics from
 * repeated rows at one timestamp merge into a single sample.
 */
export function dedupeSamples(samples: NormalizedSample[]): NormalizedSample[] {
  const byTimestamp = new Map<number, NormalizedSample>();
  for (const s of samples) {
    const existing = byTimestamp.get(s.timestampMs);
    if (!existing) {
      byTimestamp.set(s.timestampMs, { ...s });
      continue;
    }
    for (const metric of GAUGE_HISTORY_METRICS) {
      if (s[metric] !== undefined) existing[metric] = s[metric];
    }
  }
  return [...byTimestamp.values()].sort((a, b) => a.timestampMs - b.timestampMs);
}

/** Median interval between consecutive samples — the gauge's representative
 *  cadence. Robust against a few outliers; null when fewer than 2 stamps. */
export function medianIntervalMs(samples: NormalizedSample[]): number | null {
  const deltas: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i]!.timestampMs - samples[i - 1]!.timestampMs;
    if (d > 0) deltas.push(d);
  }
  if (deltas.length === 0) return null;
  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  return deltas.length % 2 === 1
    ? deltas[mid]!
    : Math.round((deltas[mid - 1]! + deltas[mid]!) / 2);
}

/** A run of consecutive samples with no gap inside it. */
export interface HistorySegment {
  samples: NormalizedSample[];
  /** Width of the data gap IMMEDIATELY BEFORE this segment (first: undefined). */
  gapBeforeMs?: number;
}

/** A gap is an interval > GAP_FACTOR × the median cadence between consecutive samples. */
export const GAP_FACTOR = 3;

/**
 * Split the series at gaps (ADR 0014: detect and PRESERVE gaps — never
 * interpolate across them). The chart draws each segment as its own stroke with
 * a visible break marker at every gapBeforeMs.
 */
export function splitAtGaps(samples: NormalizedSample[], factor = GAP_FACTOR): HistorySegment[] {
  if (samples.length === 0) return [];
  const cadence = medianIntervalMs(samples);
  if (cadence == null) return [{ samples }];
  const segments: HistorySegment[] = [{ samples: [samples[0]!] }];
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1]!;
    const current = samples[i]!;
    const delta = current.timestampMs - previous.timestampMs;
    if (delta > factor * cadence) {
      segments.push({ samples: [current], gapBeforeMs: delta });
    } else {
      segments[segments.length - 1]!.samples.push(current);
    }
  }
  return segments;
}

// ── Windows ──────────────────────────────────────────────────────────────────

export type HistoryWindowId = '24h' | '7d' | '30d';

export interface HistoryWindow {
  id: HistoryWindowId;
  label: string;
  ms: number;
}

export const HISTORY_WINDOWS: readonly HistoryWindow[] = [
  { id: '24h', label: '24 hours', ms: 24 * 3_600_000 },
  { id: '7d', label: '7 days', ms: 7 * 86_400_000 },
  { id: '30d', label: '30 days', ms: 30 * 86_400_000 },
] as const;

export function historyWindow(id: HistoryWindowId): HistoryWindow {
  return HISTORY_WINDOWS.find((w) => w.id === id) ?? HISTORY_WINDOWS[0]!;
}

/** Samples inside [now − windowMs, now]. Future-dated stamps (clock skew) are
 *  excluded — the window never shows a reading that has not happened yet. */
export function windowSamples(
  samples: NormalizedSample[],
  windowMs: number,
  nowMs: number,
): NormalizedSample[] {
  const cutoff = nowMs - windowMs;
  return samples.filter((s) => s.timestampMs >= cutoff && s.timestampMs <= nowMs);
}

// ── Per-window stats + "recent measured change" ──────────────────────────────

export interface MetricStats {
  metric: GaugeMetric;
  /** How many samples in the window actually carry this metric. */
  count: number;
  min: number;
  max: number;
  first: number;
  firstTimestampMs: number;
  last: number;
  lastTimestampMs: number;
}

/** Min/max/first/last for one metric over an ascending sample list. */
export function metricStats(samples: NormalizedSample[], metric: GaugeMetric): MetricStats | null {
  const carrying = samples.filter((s) => typeof s[metric] === 'number');
  if (carrying.length === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const s of carrying) {
    const v = s[metric] as number;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const first = carrying[0]!;
  const last = carrying[carrying.length - 1]!;
  return {
    metric,
    count: carrying.length,
    min,
    max,
    first: first[metric] as number,
    firstTimestampMs: first.timestampMs,
    last: last[metric] as number,
    lastTimestampMs: last.timestampMs,
  };
}

/**
 * "Recent measured change" for the summary line: first → last measured value
 * inside the window, same gauge, endpoints only. When the two endpoints format
 * identically the series reads as steady — the text never claims a trend beyond
 * the two measured observations, and never interpolates between them.
 */
export function recentChangeText(
  stats: MetricStats,
  formatValue: (n: number) => string,
): string | null {
  if (stats.count < 2) return null;
  const from = formatValue(stats.first);
  const to = formatValue(stats.last);
  const observations = `${stats.count} measured observations`;
  if (from === to) {
    return `Measured change: none beyond reading precision — held near ${to} across ${observations}.`;
  }
  return `Measured change: ${from} → ${to} between the first and last of ${observations} (endpoints only — nothing interpolated between samples).`;
}

/** Metrics the gauge reports AND that carry at least one sample in the window,
 *  in presentation order (temperature, discharge, stage). */
export function metricsInWindow(samples: NormalizedSample[]): GaugeMetric[] {
  const order: GaugeMetric[] = ['tempC', 'cfs', 'heightFt'];
  return order.filter((metric) => samples.some((s) => typeof s[metric] === 'number'));
}
