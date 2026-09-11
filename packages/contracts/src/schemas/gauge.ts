import { z } from 'zod';
import { IsoDateTimeSchema } from './shared.js';

export const GaugeReadingSchema = z.object({
  gaugeId: z.string().min(1),
  cfs: z.number().optional(),
  heightFt: z.number().optional(),
  tempC: z.number().optional(),
  timestamp: IsoDateTimeSchema,
});
export type GaugeReading = z.infer<typeof GaugeReadingSchema>;
