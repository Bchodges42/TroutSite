import { z } from 'zod';
import { BodyShapeSchema, GillsSchema } from './taxon.js';
import { RegionIdSchema } from './shared.js';

/** What the angler observed on the water; input to matchHatch(). */
export const BugObservationSchema = z.object({
  sizeHook: z.number().int().positive(),
  bodyColor: z.string().min(1),
  tails: z.union([z.literal(2), z.literal(3)]),
  gills: GillsSchema,
  bodyShape: BodyShapeSchema,
  month: z.number().int().min(1).max(12),
  regionId: RegionIdSchema,
});
export type BugObservation = z.infer<typeof BugObservationSchema>;
