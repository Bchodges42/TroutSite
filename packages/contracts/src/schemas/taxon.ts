import { z } from 'zod';

export const GillsSchema = z.enum(['lamellae', 'filaments', 'none']);
export type Gills = z.infer<typeof GillsSchema>;

export const BodyShapeSchema = z.enum(['slender', 'robust']);
export type BodyShape = z.infer<typeof BodyShapeSchema>;

export const BugTaxonSchema = z.object({
  id: z.string().min(1),
  commonName: z.string().min(1),
  sciName: z.string().min(1),
  order: z.string().min(1),
  family: z.string().min(1),
  /** Inclusive hook-size range [minHook, maxHook]. */
  sizeRange: z
    .tuple([z.number(), z.number()])
    .refine(([min, max]) => min <= max, { message: 'sizeRange min must be <= max' }),
  keyAttributes: z.object({
    tails: z.union([z.literal(2), z.literal(3)]),
    gills: GillsSchema,
    bodyShape: BodyShapeSchema,
    bodyColor: z.array(z.string().min(1)).min(1),
    mouthparts: z.string(),
  }),
  habitat: z.array(z.string()),
  /** Months (1–12) the taxon is active, keyed by regionId. */
  monthsActiveByRegion: z.record(z.array(z.number().int().min(1).max(12))),
  notes: z.string(),
  /** Attribution culture: every taxon cites at least one source. */
  sources: z.array(z.string().min(1)).min(1),
});
export type BugTaxon = z.infer<typeof BugTaxonSchema>;
