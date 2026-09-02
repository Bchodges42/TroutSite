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
  sourceUrl: z.string().url(),
  fetchedAt: IsoDateTimeSchema,
});
export type StockingEvent = z.infer<typeof StockingEventSchema>;
