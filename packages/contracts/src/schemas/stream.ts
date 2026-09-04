import { z } from 'zod';
import { StateIdSchema, WaterbodyTypeSchema, OfficialSourceSchema, RegionIdSchema } from './shared.js';

export const IdealFlowSchema = z
  .object({
    min: z.number(),
    max: z.number(),
    unit: z.literal('cfs'),
  })
  .refine((r) => r.min <= r.max, { message: 'idealFlow.min must be <= idealFlow.max' });
export type IdealFlow = z.infer<typeof IdealFlowSchema>;

export const StreamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stateId: StateIdSchema,
  waterbodyType: WaterbodyTypeSchema,
  regionId: RegionIdSchema,
  gaugeIds: z.array(z.string().min(1)),
  stockingProgram: z.boolean(),
  idealFlow: z.array(IdealFlowSchema),
  /** Species focus: 'trout' waters are scored for trout fishability;
   *  'warmwater' rivers (smallmouth/panfish) are listed but never trout-scored. */
  species: z.enum(['trout', 'warmwater']).optional(),
  notes: z.string().optional(),
  officialSources: z.array(OfficialSourceSchema),
});
export type Stream = z.infer<typeof StreamSchema>;
