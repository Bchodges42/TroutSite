import { z } from 'zod';
import { IsoDateTimeSchema } from './shared.js';

/** Seasonal hydrologic context, never an ideal/safe-wading range. */
export const HistoricalFlowSchema = z.object({
  gaugeId: z.string().regex(/^\d{8}$/),
  month: z.number().int().min(1).max(12),
  p25: z.number().finite().nonnegative(),
  median: z.number().finite().nonnegative(),
  p75: z.number().finite().nonnegative(),
  sampleCount: z.number().int().min(1),
  unit: z.literal('cfs'),
  basis: z.literal('USGS approved month-of-year discharge normals'),
  sourceUrl: z.string().url(),
  retrievedAt: IsoDateTimeSchema,
  parentTimeSeriesId: z.string().min(1),
  computationId: z.string().min(1),
}).refine((v) => v.p25 <= v.median && v.median <= v.p75, 'percentiles must be ordered');
export type HistoricalFlow = z.infer<typeof HistoricalFlowSchema>;
