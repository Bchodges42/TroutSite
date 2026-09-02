import { z } from 'zod';

export const PatternTypeSchema = z.enum([
  'nymph',
  'dry',
  'emerger',
  'spinner',
  'streamer',
  'wet',
  'terrestrial',
]);
export type PatternType = z.infer<typeof PatternTypeSchema>;

export const FlyPatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: PatternTypeSchema,
  /** Taxon ids this pattern imitates. */
  imitates: z.array(z.string().min(1)),
  hookSizes: z.array(z.number().int().positive()),
  difficulty: z.number().int().min(1).max(5),
  materials: z.array(z.string().min(1)),
  notes: z.string(),
  license: z.enum(['public-domain', 'attributed']),
  attribution: z.string().optional(),
});
export type FlyPattern = z.infer<typeof FlyPatternSchema>;
