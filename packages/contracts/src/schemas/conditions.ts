import { z } from 'zod';
import { GaugeReadingSchema } from './gauge.js';
import { IsoDateTimeSchema } from './shared.js';

/** Fishability score: 0–100 plus plain-English reasons. */
export const ConditionScoreSchema = z.object({
  value: z.number().int().min(0).max(100),
  reasons: z.array(z.string()),
});
export type ConditionScore = z.infer<typeof ConditionScoreSchema>;

export const ConditionSnapshotSchema = z.object({
  streamId: z.string().min(1),
  readings: z.array(GaugeReadingSchema),
  score: ConditionScoreSchema,
  fetchedAt: IsoDateTimeSchema,
  nextExpectedUpdate: IsoDateTimeSchema,
});
export type ConditionSnapshot = z.infer<typeof ConditionSnapshotSchema>;
