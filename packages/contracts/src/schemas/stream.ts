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

/** Stable hydrography identity used to join catalog waters to reviewed NHD traces. */
export const HydroIdentitySchema = z
  .object({
    /** GNIS feature identifiers; leading zeroes are significant. */
    gnisIds: z.array(z.string().regex(/^\d{8}$/, 'GNIS ids must be eight digits')).min(1),
    /** Eight-digit USGS HUC watershed identifiers; leading zeroes are significant. */
    huc8s: z.array(z.string().regex(/^\d{8}$/, 'HUC8s must be eight digits')).min(1),
    counties: z.array(z.string().min(1)).min(1).optional(),
    receivingWater: z.string().min(1).optional(),
  })
  .superRefine((identity, ctx) => {
    if (new Set(identity.gnisIds).size !== identity.gnisIds.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gnisIds'], message: 'gnisIds must not contain duplicates' });
    }
    if (new Set(identity.huc8s).size !== identity.huc8s.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['huc8s'], message: 'huc8s must not contain duplicates' });
    }
    if (identity.counties && new Set(identity.counties.map((county) => county.toLowerCase())).size !== identity.counties.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['counties'], message: 'counties must not contain duplicates' });
    }
  });
export type HydroIdentity = z.infer<typeof HydroIdentitySchema>;

export const StreamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Alternate official/local names used by catalog search and source joins. */
  aliases: z.array(z.string().min(1)).optional(),
  stateId: StateIdSchema,
  waterbodyType: WaterbodyTypeSchema,
  regionId: RegionIdSchema,
  hydroIdentity: HydroIdentitySchema.optional(),
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
  if (['river', 'creek', 'tailrace', 'spring'].includes(stream.waterbodyType) && stream.hydroIdentity === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hydroIdentity'], message: 'hydroIdentity is required for selectable line waters' });
  }
  if (stream.seasonMonths !== undefined && stream.seasonKind === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['seasonKind'], message: 'seasonKind is required when seasonMonths is present' });
  }
  if (stream.seasonKind !== undefined && stream.seasonMonths === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['seasonMonths'], message: 'seasonMonths is required when seasonKind is present' });
  }
});
export type Stream = z.infer<typeof StreamSchema>;
