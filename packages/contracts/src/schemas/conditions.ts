import { z } from 'zod';
import { GaugeReadingSchema } from './gauge.js';
import { IsoDateTimeSchema } from './shared.js';

/** Fishability score: 0–100 plus plain-English reasons. */
export const ConditionScoreSchema = z.object({
  value: z.number().int().min(0).max(100),
  reasons: z.array(z.string()),
  /**
   * False when there was no usable data to assess (no readings, gauge mismatch,
   * or no flow/stage value). A REAL assessment can also land on 0 — e.g. lethal
   * water temperature clamping a floored flow score — and must render as Poor,
   * never "No data". Optional so snapshots generated before this field existed
   * still validate; consumers treat missing as "cannot distinguish".
   */
  assessed: z.boolean().optional(),
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
