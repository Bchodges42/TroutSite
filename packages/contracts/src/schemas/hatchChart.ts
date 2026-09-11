import { z } from 'zod';
import { RegionIdSchema } from './shared.js';

export const HatchStageSchema = z.enum(['nymph', 'larva', 'dun', 'spinner', 'adult']);
export type HatchStage = z.infer<typeof HatchStageSchema>;

export const TimeOfDaySchema = z.enum(['am', 'midday', 'pm', 'evening']);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

export const HatchEntrySchema = z.object({
  taxonId: z.string().min(1),
  stage: HatchStageSchema,
  timeOfDay: TimeOfDaySchema,
  abundance: z.number().int().min(1).max(5),
  patterns: z.array(z.string().min(1)),
});
export type HatchEntry = z.infer<typeof HatchEntrySchema>;

export const HatchChartSchema = z.object({
  regionId: RegionIdSchema,
  month: z.number().int().min(1).max(12),
  entries: z.array(HatchEntrySchema),
});
export type HatchChart = z.infer<typeof HatchChartSchema>;
