import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema, StateIdSchema } from './shared.js';

export const SpeciesSchema = z.enum(['rainbow', 'brown', 'cutbow', 'brook', 'other']);
export type Species = z.infer<typeof SpeciesSchema>;

export const StockingEventSchema = z.object({
  id: z.string().min(1),
  stateId: StateIdSchema,
  streamName: z.string().min(1),
  county: z.string().min(1).optional(),
  species: SpeciesSchema,
  count: z.number().int().nonnegative().optional(),
  date: IsoDateSchema,
  /**
   * How precise the published date is (B09). TWRA publishes exact days,
   * "week of" dates, and month-only windows; `date` normalizes all three to
   * an ISO day (week/month → first day of the window). Consumers MUST NOT
   * present a 'week'/'month' row as a verified stocking day — say "published
   * schedule" instead. Optional for snapshots generated before this field.
   */
  datePrecision: z.enum(['day', 'week', 'month']).optional(),
  /**
   * What the row is (ADR 0012). 'scheduled' = a row of the published stocking
   * SCHEDULE — a plan, even once its date has passed. 'reported' = a row of
   * the agency's completed-stockings report (TWRA "Trout Stocking Locations
   * Report") — the only rows a consumer may present as "stocked". Absent on
   * snapshots built before this field: treat as 'scheduled'.
   */
  status: z.enum(['scheduled', 'reported']).optional(),
  sourceUrl: z.string().url(),
  fetchedAt: IsoDateTimeSchema,
});
export type StockingEvent = z.infer<typeof StockingEventSchema>;
