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
  /** Trout-fishery identity: 'tailwater' = dam-controlled release fishery;
   *  'stocked' = put-and-take stocking without dam control;
   *  'wild' = naturally reproducing (self-sustaining) fishery.
   *  Absent = evidence does not reach — never guessed. */
  fishery: z.enum(['wild', 'stocked', 'tailwater']).optional(),
  /** The trout fishery (opportunity to catch trout, stocking season + regs/wild
   *  backbone combined) is viable year-round — not merely that stocking happens
   *  sometime during the year. Absent = undetermined. */
  yearRound: z.boolean().optional(),
  notes: z.string().optional(),
  officialSources: z.array(OfficialSourceSchema),
});
export type Stream = z.infer<typeof StreamSchema>;
