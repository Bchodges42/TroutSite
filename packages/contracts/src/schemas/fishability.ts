import { z } from 'zod';
import { IsoDateTimeSchema } from './shared.js';

/**
 * Fishability contract v2 (ADR 0007): per-species thermal comfort plus a
 * transparent, deterministic activity outlook. Same data-honesty family as
 * ConditionScore — a clamped 0 is a REAL assessment; only `assessed: false`
 * means "no data"; freshness keys off each observation's own timestamp.
 */

/** The seven game species the fishability spine scores (frozen in v2; additive via ADR). */
export const SpeciesKeySchema = z.enum([
  'largemouth-bass',
  'smallmouth-bass',
  'spotted-bass',
  'crappie',
  'bluegill',
  'channel-catfish',
  'striped-bass',
]);
export type SpeciesKey = z.infer<typeof SpeciesKeySchema>;

/**
 * One species' thermal comfort ladder in °C (authored by F2 with citations;
 * consumed by scoreFishability). The WARM side is always a full contiguous
 * ladder: optimalLow <= optimalHigh < avoidanceHigh < lethalHigh. The COLD side
 * (lethalLow, avoidanceLow) is OPTIONAL: F2's cited sources are chronic/acute
 * HIGH-side ceilings, and no cold-side value is sourced for the contract's
 * warmwater species (Stage 3 amendment to ADR 0007 — cold-side numbers must not
 * be invented). When absent, temperatures below the optimal range score as
 * avoidance (inactive) and can never be lethal.
 */
export const SpeciesComfortBandsSchema = z
  .object({
    species: SpeciesKeySchema,
    unit: z.literal('degC'),
    lethalLow: z.number().optional(),
    avoidanceLow: z.number().optional(),
    optimalLow: z.number(),
    optimalHigh: z.number(),
    avoidanceHigh: z.number(),
    lethalHigh: z.number(),
  })
  .refine(
    (b) =>
      b.optimalLow <= b.optimalHigh &&
      b.optimalHigh < b.avoidanceHigh &&
      b.avoidanceHigh < b.lethalHigh &&
      // Cold side, when present, must order toward the optimal range.
      (b.avoidanceLow === undefined || b.avoidanceLow < b.optimalLow) &&
      (b.lethalLow === undefined || b.avoidanceLow === undefined || b.lethalLow < b.avoidanceLow) &&
      (b.lethalLow === undefined || b.avoidanceLow !== undefined || b.lethalLow < b.optimalLow),
    {
      message:
        'comfort bands must satisfy (lethalLow <) avoidanceLow (<) optimalLow <= optimalHigh < avoidanceHigh < lethalHigh',
    },
  );
export type SpeciesComfortBands = z.infer<typeof SpeciesComfortBandsSchema>;

/** Where a component's evidence comes from — drives the UI's confidence labels. */
export const ActivityConfidenceSchema = z.enum(['measured', 'derived', 'heuristic']);
export type ActivityConfidence = z.infer<typeof ActivityConfidenceSchema>;

/** Temperature-triggered spawn state (F9): never calendared, only observed water temperature. */
export const SpawnStateSchema = z.enum(['PRE_SPAWN', 'SPAWNING', 'POST_SPAWN', 'N_A']);
export type SpawnState = z.infer<typeof SpawnStateSchema>;

/** One species' sourced spawning temperature window (F2: onset/end, both cited). */
export const SpawnThresholdsSchema = z
  .object({ onsetC: z.number(), endC: z.number() })
  .refine((t) => t.onsetC <= t.endC, { message: 'spawn onsetC must be <= endC' });
export type SpawnThresholds = z.infer<typeof SpawnThresholdsSchema>;

/** The activity factors (closed set in v2; a new factor goes through the ADR process). */
export const ActivityFactorSchema = z.enum([
  'water-temperature',
  'flow-trend',
  'pressure-trend',
  'spawn-state',
]);
export type ActivityFactor = z.infer<typeof ActivityFactorSchema>;

/**
 * One transparent row of the activity outlook (one per factor):
 *  - value: the factor's own measurement/score normalized to 0–100;
 *  - weight: the factor's share of the outlook (all weights sum to 1 ± 0.01);
 *  - contribution: points this factor adds to the total — weight × (value − 50),
 *    tolerance 1.5 for rounding; −50…+50;
 *  - evidenceUrl: the source behind the value (always present — no uncited factor);
 *  - label: plain-language name the UI shows.
 */
export const ActivityComponentSchema = z.object({
  factor: ActivityFactorSchema,
  value: z.number().min(0).max(100),
  contribution: z.number().min(-50).max(50),
  weight: z.number().min(0).max(1),
  evidenceUrl: z.string().url(),
  confidence: ActivityConfidenceSchema,
  label: z.string().min(1),
});
export type ActivityComponent = z.infer<typeof ActivityComponentSchema>;

/** Flow movement is transparent context, not a positive activity factor. */
export const FlowTrendContextSchema = z.object({
  direction: z.enum(['rising', 'falling', 'stable']),
  magnitude: z.number().min(0),
  confidence: z.literal('derived'),
  evidenceUrl: z.string().url(),
  observedAt: IsoDateTimeSchema,
  label: z.string().min(1),
});
export type FlowTrendContext = z.infer<typeof FlowTrendContextSchema>;

/** Area-level weather context shown on a water detail; never a score factor. */
export const PressureContextSchema = z.object({
  direction: z.enum(['rising', 'falling', 'stable']),
  deltaHpa: z.number(),
  station: z.string().min(1),
  confidence: z.literal('derived'),
  evidenceUrl: z.string().url(),
  observedAt: IsoDateTimeSchema,
  label: z.string().min(1),
});
export type PressureContext = z.infer<typeof PressureContextSchema>;

/** Recent gauge rain context; zero is a valid dry observation. */
export const RainContextSchema = z.object({
  precipitationMm: z.number().nonnegative(),
  confidence: z.literal('measured'),
  evidenceUrl: z.string().url(),
  observedAt: IsoDateTimeSchema,
  label: z.string().min(1),
});
export type RainContext = z.infer<typeof RainContextSchema>;

/**
 * The activity outlook: a transparent weighted total (50 = neutral; each factor
 * visibly moves it) plus the ordered component rows. `components` is ordered
 * descending by |contribution| (stable — equal contributions keep authoring
 * order). Empty components = no activity data; total 0 renders as honest
 * unavailability (the T1-8 pattern), never as "bad fishing".
 */
export const ActivityOutlookSchema = z
  .object({
    total: z.number().int().min(0).max(100),
    components: z.array(ActivityComponentSchema),
    /** The spawn state behind the spawn-state component, when one was emitted
     *  (F9). Absent = the species has no sourced spawn window (or no fresh
     *  temperature) — never guessed from the calendar. */
    spawnState: SpawnStateSchema.optional(),
    flowTrend: FlowTrendContextSchema.optional(),
  })
  .refine(
    (a) => a.components.length === 0 || Math.abs(a.components.reduce((s, c) => s + c.weight, 0) - 1) <= 0.01,
    { message: 'activity component weights must sum to 1 (± 0.01) when components are present' },
  )
  .refine(
    (a) =>
      a.components.every(
        (c) => Math.abs(c.contribution - c.weight * (c.value - 50)) <= 1.5,
      ),
    { message: 'each contribution must equal weight × (value − 50) within 1.5 points' },
  );
export type ActivityOutlook = z.infer<typeof ActivityOutlookSchema>;

/**
 * Per-species comfort score — the FishabilityScore contract (ADR 0007). Same
 * honesty family as ConditionScore:
 *  - value 0 with assessed: true = REAL assessment that landed on lethal (Poor);
 *  - assessed: false = cannot assess (no non-stale temperature) — renders "No data";
 *  - freshness is the age of the observation that produced the score (its OWN
 *    timestamp, T1-6), null when nothing fresh enough was available.
 */
export const FishabilityScoreSchema = z.object({
  species: SpeciesKeySchema,
  value: z.number().int().min(0).max(100),
  reasons: z.array(z.string()),
  assessed: z.boolean(),
  /** The observation that scored: its own timestamp and its age at scoring time. */
  freshness: z
    .object({
      observedAt: IsoDateTimeSchema,
      ageMinutes: z.number().int().min(0),
    })
    .nullable(),
});
export type FishabilityScore = z.infer<typeof FishabilityScoreSchema>;

/**
 * What the F5 pipeline emits per monitored water (GET /v1/fishability/<id>.json):
 * one comfort + activity pair per cataloged species. Absent species = not
 * cataloged on that water (never guessed); absent file = water not scored.
 */
export const FishabilitySnapshotSchema = z.object({
  streamId: z.string().min(1),
  fetchedAt: IsoDateTimeSchema,
  bySpecies: z.record(SpeciesKeySchema, z.object({ comfort: FishabilityScoreSchema, activity: ActivityOutlookSchema })),
  pressureContext: PressureContextSchema.optional(),
  rainContext: RainContextSchema.optional(),
});
export type FishabilitySnapshot = z.infer<typeof FishabilitySnapshotSchema>;
