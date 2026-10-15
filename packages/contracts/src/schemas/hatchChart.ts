import { z } from 'zod';
import { RegionIdSchema } from './shared.js';

export const HatchStageSchema = z.enum(['nymph', 'larva', 'dun', 'spinner', 'adult']);
export type HatchStage = z.infer<typeof HatchStageSchema>;

export const TimeOfDaySchema = z.enum(['am', 'midday', 'pm', 'evening']);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

/** A specimen record supports presence at the stated locality/period. It does
 * not validate this chart's month, time-of-day or relative abundance. */
export const HatchRegionalRecordSchema = z.object({
  label: z.string().min(1), url: z.string().url(), locality: z.string().min(1),
  observationPeriod: z.string().min(1), taxonScope: z.string().min(1),
  lifeStage: z.string().min(1), pinpoint: z.string().min(1),
  supportedClaim: z.literal('regional-presence'),
});

export const HatchEntrySchema = z.object({
  taxonId: z.string().min(1),
  stage: HatchStageSchema,
  timeOfDay: TimeOfDaySchema,
  abundance: z.number().int().min(1).max(5),
  patterns: z.array(z.string().min(1)),
  regionalRecords: z.array(HatchRegionalRecordSchema).optional(),
});
export type HatchEntry = z.infer<typeof HatchEntrySchema>;

export const HatchChartSchema = z.object({
  regionId: RegionIdSchema,
  month: z.number().int().min(1).max(12),
  entries: z.array(HatchEntrySchema),
  evidenceBasis: z.literal('editorial').optional(),
  evidenceNote: z.string().optional(),
});
export type HatchChart = z.infer<typeof HatchChartSchema>;
