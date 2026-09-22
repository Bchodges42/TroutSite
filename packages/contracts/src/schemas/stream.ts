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

/**
 * The visitor-facing trout-opportunity headline (ADR 0010). Angling
 * OPPORTUNITY at a stated water/reach — never a biological census:
 *  - 'year-round-trout'          documented year-round trout angling opportunity
 *  - 'seasonal-stocked-trout'    seasonally maintained stocked trout fishery
 *  - 'warmwater-focus'           positively documented warmwater fishery (does
 *                                NOT mean trout are absent; may coexist with a
 *                                seasonal trout program)
 *  - 'mixed'                     warmwater focus AND a documented trout program
 *  - 'unresolved'                evidence missing/contradictory/stale/ambiguous —
 *                                a first-class result, never a hidden negative
 */
export const OpportunityHeadlineSchema = z.enum([
  'year-round-trout',
  'seasonal-stocked-trout',
  'warmwater-focus',
  'mixed',
  'unresolved',
]);
export type OpportunityHeadline = z.infer<typeof OpportunityHeadlineSchema>;

/** Plain evidence quality, kept separate from the headline and from any
 * production-reuse question. No calibrated percentages. */
export const EvidenceStateSchema = z.enum([
  'documented',
  'limited',
  'historical',
  'conflicting',
  'unresolved',
]);
export type EvidenceState = z.infer<typeof EvidenceStateSchema>;

/** One claim-specific source behind an opportunity headline. Dates stay
 * distinct: observationPeriod / publicationDate / effectiveDate describe the
 * SOURCE; retrieved is when WE fetched it (never promotes freshness onto an
 * old observation). */
export const OpportunitySourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum([
    'agency-assessment',
    'schedule-table',
    'completed-release-report',
    'survey',
    'creel',
    'temperature-series',
    'legal-designation',
    'firsthand-report',
    'community-observation',
    'program-description',
  ]),
  observationPeriod: z.string().min(1).optional(),
  publicationDate: z.string().min(1).optional(),
  retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'retrieved must be YYYY-MM-DD'),
  pinpoint: z.string().min(1).optional(),
});
export type OpportunitySource = z.infer<typeof OpportunitySourceSchema>;

/** The documented fishery-opportunity block (ADR 0010). Authored from the
 * evidence ledger; absent = not yet adjudicated, which consumers must treat
 * exactly like 'unresolved', never as a negative. */
export const OpportunitySchema = z
  .object({
    trout: OpportunityHeadlineSchema,
    evidenceState: EvidenceStateSchema,
    /** One visitor-facing sentence, authored from the evidence ledger. */
    statement: z.string().min(1).optional(),
    /** The reach/lake area the headline is evidenced FOR when it is not the
     * whole catalog feature ("first ~11 miles below Tims Ford Dam"). */
    reachScope: z.string().min(1).optional(),
    /** The observation/report year the headline rests on (YYYY or YYYY-MM). */
    asOf: z.string().regex(/^\d{4}(-\d{2})?$/, 'asOf must be YYYY or YYYY-MM'),
    sources: z.array(OpportunitySourceSchema).optional(),
    caveats: z.array(z.string().min(1)).optional(),
    /** When unresolved: the precise missing proposition / next source. */
    unresolvedQuestion: z.string().min(1).optional(),
  })
  .superRefine((opportunity, ctx) => {
    if (opportunity.trout === 'unresolved') {
      if (!opportunity.unresolvedQuestion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unresolvedQuestion'],
          message: 'unresolved headline must state the missing proposition',
        });
      }
      return;
    }
    if (!opportunity.sources || opportunity.sources.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sources'],
        message: 'a non-unresolved headline requires claim-specific sources',
      });
    }
    if (opportunity.trout === 'warmwater-focus' && opportunity.evidenceState === 'unresolved') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceState'],
        message: 'warmwater-focus is a positive claim and cannot rest on unresolved evidence',
      });
    }
  });
export type Opportunity = z.infer<typeof OpportunitySchema>;


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
  /** Documented fishery opportunity, authored from the evidence ledger
   * (ADR 0010). Durable fishery information — never carries live conditions.
   * Absent = not adjudicated; consumers treat that as unresolved, never as
   * "no trout" or any other negative. */
  opportunity: OpportunitySchema.optional(),
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
