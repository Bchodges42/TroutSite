import { z } from 'zod';
import { IsoDateTimeSchema } from './shared.js';

export const GaugeReadingSchema = z.object({
  gaugeId: z.string().min(1),
  cfs: z.number().optional(),
  heightFt: z.number().optional(),
  tempC: z.number().optional(),
  /** Reservoir pool elevation, ft; presentation context only. */
  reservoirLevelFt: z.number().nonnegative().optional(),
  /** Dissolved oxygen, mg/L. Constraint context only; never a positive score input. */
  dissolvedOxygenMgL: z.number().nonnegative().optional(),
  /** Recent precipitation at the gauge, millimetres; context only. */
  precipitationMm: z.number().nonnegative().optional(),
  timestamp: IsoDateTimeSchema,
  /**
   * Observation time PER METRIC (F01, 2026-09-29 audit): when a gauge reports
   * different parameters at different instants, `timestamp` stays the NEWEST
   * metric's observation time (the reading's merged stamp, for compatibility),
   * while each entry here carries that metric's OWN observed time. An entry is
   * emitted only when the metric's own time differs from `timestamp` — an
   * absent entry means "observed at `timestamp`".
   * Freshness gates must use the per-metric time: another metric's timestamp
   * cannot establish a metric's freshness (a working flow sensor must not
   * renew a stopped temperature sensor).
   */
  metricTimes: z
    .object({
      cfs: IsoDateTimeSchema.optional(),
      heightFt: IsoDateTimeSchema.optional(),
      tempC: IsoDateTimeSchema.optional(),
      reservoirLevelFt: IsoDateTimeSchema.optional(),
      dissolvedOxygenMgL: IsoDateTimeSchema.optional(),
      precipitationMm: IsoDateTimeSchema.optional(),
    })
    .optional(),
});
export type GaugeReading = z.infer<typeof GaugeReadingSchema>;
