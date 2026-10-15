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
  /** Present when merged sensors observed at different times. */
  metricTimes: z.object({
    cfs: IsoDateTimeSchema.optional(), heightFt: IsoDateTimeSchema.optional(),
    tempC: IsoDateTimeSchema.optional(), dissolvedOxygenMgL: IsoDateTimeSchema.optional(),
    reservoirLevelFt: IsoDateTimeSchema.optional(), precipitationMm: IsoDateTimeSchema.optional(),
  }).optional(),
});
export type GaugeReading = z.infer<typeof GaugeReadingSchema>;
