import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema } from './shared.js';

/**
 * Provenance-first evidence contract (data-sources lane, contracts-v1.1.0 additive).
 *
 * Everything here is what an upstream authority published, normalized — never
 * interpreted. Consumers (Session 3 fishability/scoring) decide what it MEANS;
 * this layer only guarantees what was OBSERVED, WHERE it came from, and WHEN:
 *   - retrievedAt is when WE fetched; observedAt is when the source says the
 *     measurement was taken. They are never interchangeable.
 *   - A scheduled stocking is not a completed stocking (status carries that).
 *   - A missing observation stays missing — there is no zero substitution.
 *   - Source qualifiers (e.g. USGS "P" provisional) pass through untouched.
 */

/** Physical metrics the evidence layer can carry. Units are baked into the name. */
export const WaterMetricSchema = z.enum([
  'temperature-c',
  'discharge-cfs',
  'stage-ft',
  'reservoir-level-ft',
  /** Barometric (sea-level) pressure, hectopascals (F8, contract v2 additive):
   *  NWS ASOS stations mapped to catalog REGIONS — area-level, never per-water. */
  'pressure-hpa',
  /** Dissolved oxygen, mg/L; a constraint/context measurement, not a score bonus. */
  'dissolved-oxygen-mg-l',
  /** Gauge precipitation, millimetres; context only, never a score input. */
  'precipitation-mm',
]);
export type WaterMetric = z.infer<typeof WaterMetricSchema>;

/** One reading from one upstream source at one moment. */
export const WaterObservationSchema = z.object({
  /** Stable source id from the data-sources registry (e.g. 'usgs-nwis-iv'). */
  sourceId: z.string().min(1),
  sourceUrl: z.string().url(),
  /** When the measurement was taken per the source (NOT when we fetched it). */
  observedAt: IsoDateTimeSchema,
  metric: WaterMetricSchema,
  value: z.number().finite(),
  /**
   * Verbatim source qualifier (e.g. USGS 'P' = provisional/approved-pending).
   * Only present when the source supplies one — never invented here.
   */
  qualifier: z.string().min(1).optional(),
});
export type WaterObservation = z.infer<typeof WaterObservationSchema>;

/** How much we know about whether a published stocking actually happened. */
export const StockingStatusSchema = z.enum(['scheduled', 'reported-complete', 'unknown']);
export type StockingStatus = z.infer<typeof StockingStatusSchema>;

/** One stocking row from one source, with the source's own date precision. */
export const EvidenceStockingEventSchema = z.object({
  sourceId: z.string().min(1),
  sourceUrl: z.string().url(),
  date: IsoDateSchema,
  /** The precision the SOURCE published — never upgraded (week-of stays week). */
  datePrecision: z.enum(['day', 'week', 'month']),
  status: StockingStatusSchema,
  /** Species exactly as published, lowercased free text (e.g. ['rainbow trout']). */
  species: z.array(z.string().min(1)).optional(),
});
export type EvidenceStockingEvent = z.infer<typeof EvidenceStockingEventSchema>;

/** A regulation statement from its governing authority. */
export const EvidenceRegulationSchema = z.object({
  /** Authority that published it (e.g. 'TWRA', 'TVA', 'NPS', 'USACE', 'USFS'). */
  authority: z.string().min(1),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  effectiveFrom: IsoDateSchema.optional(),
  effectiveThrough: IsoDateSchema.optional(),
  summary: z.string().min(1).optional(),
});
export type EvidenceRegulation = z.infer<typeof EvidenceRegulationSchema>;

/** A per-source failure recorded during evidence assembly (never silently dropped). */
export const EvidenceErrorSchema = z.object({
  sourceId: z.string().min(1),
  /** Stable machine code, e.g. 'upstream-http-503', 'upstream-unparseable'. */
  code: z.string().min(1),
  message: z.string().min(1),
});
export type EvidenceError = z.infer<typeof EvidenceErrorSchema>;

/** The full per-water evidence record. */
export const WaterEvidenceSchema = z.object({
  waterId: z.string().min(1),
  /** When this evidence set was assembled/fetched — always ≥ every observedAt. */
  retrievedAt: IsoDateTimeSchema,
  observations: z.array(WaterObservationSchema),
  stockingEvents: z.array(EvidenceStockingEventSchema),
  regulations: z.array(EvidenceRegulationSchema),
  errors: z.array(EvidenceErrorSchema),
});
export type WaterEvidence = z.infer<typeof WaterEvidenceSchema>;

/** Payload served at GET /v1/evidence/waters.json (WaterEvidence[]). */
export const WaterEvidenceSetSchema = z.array(WaterEvidenceSchema);
export type WaterEvidenceSet = z.infer<typeof WaterEvidenceSetSchema>;
