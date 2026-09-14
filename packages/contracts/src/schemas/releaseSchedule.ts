import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema } from './shared.js';

/** One generator-release block as published by TVA. */
export const ReleaseBlockSchema = z.object({
  date: IsoDateSchema,
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  timeZone: z.enum(['EST', 'EDT', 'CST', 'CDT']),
  generators: z.string().min(1),
});
export type ReleaseBlock = z.infer<typeof ReleaseBlockSchema>;

/** Forward-looking TVA dam context. These rows are never score factors. */
export const ReleaseForecastRowSchema = z.object({
  date: IsoDateSchema,
  averageInflowCfs: z.number().finite().nonnegative().optional(),
  midnightElevationFt: z.number().finite().nonnegative().optional(),
  averageOutflowCfs: z.number().finite().nonnegative().optional(),
});
export type ReleaseForecastRow = z.infer<typeof ReleaseForecastRowSchema>;

export const ReleaseScheduleSchema = z.object({
  waterId: z.string().min(1),
  locationId: z.string().min(1),
  retrievedAt: IsoDateTimeSchema,
  sourceUrl: z.string().url(),
  status: z.enum(['available', 'empty', 'unavailable']),
  releases: z.array(ReleaseBlockSchema),
  forecasts: z.array(ReleaseForecastRowSchema),
  /** Human-readable upstream failure; absent on available/empty rows. */
  error: z.string().min(1).optional(),
});
export type ReleaseSchedule = z.infer<typeof ReleaseScheduleSchema>;
