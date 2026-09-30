import { z } from 'zod';
import { IsoDateTimeSchema } from './shared.js';

/**
 * Gauge history (ADR 0014) — GET /v1/gauge-history/{gaugeId}.json, one static
 * file per gauge emitted from `gauge_readings_raw` by the snapshot builder
 * (contracts-v2.5.0, additive per ADR 0008).
 *
 * Honesty rules are contract-level: the payload holds measurements only — no
 * fabricated pre-launch history (the file starts at the oldest retained row),
 * no interpolation (gaps travel as gaps), deduplicated per timestamp with the
 * newest fetched_at row winning per metric, and the 90-day raw retention is a
 * FLOOR — completeness is never implied. A gauge with no rows gets no file at
 * all; the 404 is the honest absence signal. Later metrics
 * (`reservoirLevelFt` / `dissolvedOxygenMgL` / `precipitationMm`) may join
 * purely additively (new enum members + optional sample fields; old consumers
 * keep parsing).
 */

/** The history-chart metrics (ADR 0014). Presentation order is the consumer's job. */
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
  /** One row per timestamp, ascending; deduplicated per timestamp (ADR 0014 rule 4). */
  samples: z.array(GaugeHistorySampleSchema).min(1),
  /** Free-text cadence statement from the source; omitted when nothing honest can be claimed. */
  samplingCadenceNote: z.string().min(1).optional(),
  /** When the builder produced the file (staleness anchor for consumers). */
  retrievedAt: IsoDateTimeSchema,
  /** Official source for the "verify" link (USGS monitoring-location page for the gauge). */
  sourceUrl: z.string().url(),
});
export type GaugeHistory = z.infer<typeof GaugeHistorySchema>;
