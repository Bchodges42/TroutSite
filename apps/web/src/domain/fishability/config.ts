// Named configuration for the fishability decision model.
// Every threshold the model uses lives here — no scattered magic numbers
// elsewhere in the domain folder. Values marked [REQUIRES VALIDATION]
// are working assumptions from the existing repo scoring (see
// packages/contracts/src/scoreConditions.ts) or general fisheries common
// sense; none have been biologically validated for Tennessee waters.

export const MODEL_VERSION = '1.0.0';

export const FISHABILITY_CONFIG = {
  freshness: {
    /**
     * Observations at most this many hours old count as "current" and may
     * drive decisions (e.g. current warmth). [REQUIRES VALIDATION]
     */
    currentHours: 72,
    /**
     * Observations older than this many days are stale: they never score
     * fishability and cannot drive absence/presence conclusions.
     * [REQUIRES VALIDATION]
     */
    maxUsableDays: 14,
  },

  trout: {
    /**
     * Trout temperature comfort band, °C. Below tempMarginalLowC or above
     * tempMarginalHighC is poor for trout; between is marginal.
     * Mirrors packages/contracts scoreConditions. [REQUIRES VALIDATION]
     */
    tempIdealMinC: 6,
    tempIdealMaxC: 20,
    tempMarginalLowC: 2,
    tempMarginalHighC: 24,
    /**
     * Default warm-water cutoff, °C. Water at or above this temperature is
     * treated as thermally stressful for trout; sustained current warmth
     * above it supports seasonal-likely-absent for stocked-only waters.
     * Per-water seasonalPolicy.warmWaterCutoffC overrides this.
     * [REQUIRES VALIDATION]
     */
    defaultWarmWaterCutoffC: 24,
    /**
     * Number of fresh (within currentHours) temperature observations at or
     * above the cutoff required to call warmth "sustained". A single fresh
     * warm reading still supports seasonal-likely-absent, but high
     * confidence (and therefore list exclusion) additionally requires this
     * many corroborating warm readings. [REQUIRES VALIDATION]
     */
    minSustainedWarmObservations: 1,
    /**
     * How close (°C) the freshest cool reading must sit to the warm cutoff
     * for seasonal-uncertain reasons to say "near the cutoff" instead of
     * implying there is no temperature evidence at all.
     * [REQUIRES VALIDATION]
     */
    nearWarmCutoffDeltaC: 3,
  },

  stocking: {
    /**
     * Default put-and-take retention window, days, used when
     * seasonalPolicy.expectedRetentionDays is absent. Stocked-trout
     * presence is only asserted within this window after a completed
     * stocking. [REQUIRES VALIDATION]
     */
    defaultRetentionDays: 60,
    /**
     * When the last completed stocking is older than this multiple of the
     * retention window AND an explicit stockedMonths policy excludes the
     * current month AND warmth is sustained (see
     * trout.minSustainedWarmObservations), seasonal-likely-absent reaches
     * high confidence (and may be excluded from the general list).
     * [REQUIRES VALIDATION]
     */
    highConfidenceAbsenceRetentionMultiple: 2,
    /**
     * How far ahead (days) a scheduled stocking counts as "upcoming"
     * evidence in reasons. [REQUIRES VALIDATION]
     */
    scheduleUpcomingDays: 45,
    /**
     * Date-precision grace (days): how far the true stocking date may sit
     * from the published nominal date for week/month precision. Absence
     * claims use the youngest plausible age (nominal − grace); decisive
     * high-confidence aging uses the oldest plausible age (nominal +
     * grace), so a nominal-day convention cannot flip the classification.
     * [REQUIRES VALIDATION]
     */
    precisionGraceDays: { day: 0, week: 7, month: 15 } as const,
  },

  general: {
    /**
     * All-fish mode temperature bands, °C. These are generic
     * survivability bounds for warmwater gamefish, NOT species-specific
     * quality statements. [REQUIRES VALIDATION]
     */
    lethalTempC: 35,
    hotTempC: 32,
    freezingTempC: 0,
    /**
     * Fresh discharge below this (cfs) is treated as near-dry → poor in
     * both bandings, because no per-water reference flow range exists in
     * FishabilityInput. A single global threshold is necessarily crude;
     * per-water reference ranges are a documented future extension.
     * [REQUIRES VALIDATION]
     */
    lowFlowSuspicionCfs: 1,
  },

  filter: {
    /** Rule names surfaced in FilteredWaters.excluded[].rule. */
    rules: {
      notTrout: 'not-trout',
      likelyAbsentHighConfidence: 'seasonal-likely-absent-high-confidence',
      visibilityExclude: 'visibility-exclude',
    } as const,
  },
} as const;

/** Species-basis authority ranking: higher wins. */
export const BASIS_AUTHORITY: Record<
  'wild-population' | 'year-round-managed' | 'seasonal-stocking' | 'reported' | 'unknown',
  number
> = {
  'wild-population': 4,
  'year-round-managed': 3,
  'seasonal-stocking': 2,
  reported: 1,
  unknown: 0,
};

/** Confidence ranking: higher wins. */
export const CONFIDENCE_RANK: Record<'high' | 'medium' | 'low', number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Bare species strings that are treated as trout only when the ENTIRE
 * (trimmed, lowercased) species string equals one of these — TWRA stocking
 * codes from packages/contracts/src/schemas/stocking.ts. Compounds such as
 * "brown bullhead" or "brook lamprey" do NOT match; only explicit
 * markers below classify those.
 */
export const TROUT_BARE_SPECIES = new Set([
  'trout',
  'rainbow',
  'brown',
  'brook',
  'cutbow',
  'golden',
  'steelhead',
  'rainbow trout',
  'brown trout',
  'brook trout',
  'lake trout',
  'golden trout',
]);

/**
 * Substrings that positively identify a non-trout gamefish when they occur
 * anywhere in the species string. "warmwater" covers the catalog enum value
 * used by packages/contracts (species: 'trout' | 'warmwater').
 */
export const NON_TROUT_SPECIES_MARKERS = [
  'warmwater',
  'bass',
  'bluegill',
  'sunfish',
  'crappie',
  'catfish',
  'walleye',
  'sauger',
  'perch',
  'pickerel',
  'muskie',
  'musky',
  'pike',
  'carp',
  'drum',
  'bullhead',
  'shad',
  'gar',
  'sturgeon',
  'paddlefish',
] as const;
