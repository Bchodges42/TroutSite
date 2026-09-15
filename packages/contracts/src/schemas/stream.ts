import { z } from 'zod';
import { StateIdSchema, WaterbodyTypeSchema, OfficialSourceSchema, RegionIdSchema } from './shared.js';
import { SpeciesKeySchema } from './fishability.js';

export const IdealFlowSchema = z
  .object({
    min: z.number(),
    max: z.number(),
    unit: z.literal('cfs'),
  })
  .refine((r) => r.min <= r.max, { message: 'idealFlow.min must be <= idealFlow.max' });
export type IdealFlow = z.infer<typeof IdealFlowSchema>;

export const DisplayTierSchema = z.enum(['featured', 'standard', 'reference']);
export type DisplayTier = z.infer<typeof DisplayTierSchema>;

export const SeasonKindSchema = z.enum(['regulatory', 'programmatic']);
export type SeasonKind = z.infer<typeof SeasonKindSchema>;

export const SpeciesEvidenceSchema = z.object({
  species: SpeciesKeySchema,
  kind: z.enum(['agency', 'regulatory', 'stocking', 'plan', 'editorial']),
  url: z.string().url(),
  retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'retrieved must be YYYY-MM-DD'),
});
export type SpeciesEvidence = z.infer<typeof SpeciesEvidenceSchema>;

export const StreamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Alternate official/local names used by catalog search and source joins. */
  aliases: z.array(z.string().min(1)).optional(),
  stateId: StateIdSchema,
  waterbodyType: WaterbodyTypeSchema,
  regionId: RegionIdSchema,
  display: DisplayTierSchema.optional(),
  gaugeIds: z.array(z.string().min(1)),
  stockingProgram: z.boolean(),
  idealFlow: z.array(IdealFlowSchema),
  idealFlowSource: z.enum(['editorial', 'official', 'measured', 'derived']).optional(),
  /** Species focus: 'trout' waters are scored for trout fishability;
   *  'warmwater' rivers (smallmouth/panfish) are listed but never trout-scored. */
  species: z.enum(['trout', 'warmwater']).optional(),
  /** Which of the seven contract game species the water is managed FOR, authored
   *  from TWRA evidence (F3 catalog). Contract v2 (ADR 0007). Absent = not
   *  cataloged — never guessed. Unrelated to the program-type `species` above,
   *  which is unchanged. */
  targetSpecies: z.array(SpeciesKeySchema).optional(),
  /** Trout-fishery identity: 'tailwater' = dam-controlled release fishery;
   *  'stocked' = put-and-take stocking without dam control;
   *  'wild' = naturally reproducing (self-sustaining) fishery.
   *  Absent = evidence does not reach — never guessed. */
  fishery: z.enum(['wild', 'stocked', 'tailwater']).optional(),
  /** The trout fishery (opportunity to catch trout, stocking season + regs/wild
   *  backbone combined) is viable year-round — not merely that stocking happens
   *  sometime during the year. Absent = undetermined. */
  yearRound: z.boolean().optional(),
  seasonMonths: z.array(z.number().int().min(1).max(12)).max(12).refine((months) => new Set(months).size === months.length, { message: 'seasonMonths must not contain duplicates' }).optional(),
  seasonKind: SeasonKindSchema.optional(),
  speciesEvidence: z.array(SpeciesEvidenceSchema).optional(),
  notes: z.string().optional(),
  officialSources: z.array(OfficialSourceSchema),
}).superRefine((stream, ctx) => {
  if (stream.seasonMonths !== undefined && stream.seasonKind === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['seasonKind'], message: 'seasonKind is required when seasonMonths is present' });
  }
  if (stream.seasonKind !== undefined && stream.seasonMonths === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['seasonMonths'], message: 'seasonMonths is required when seasonKind is present' });
  }
});
export type Stream = z.infer<typeof StreamSchema>;
