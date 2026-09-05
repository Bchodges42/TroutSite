// Pure decision-model types for month-aware trout applicability and
// all-fish fishability. No React, network, or storage dependencies.
// Owned by the fishability lane (see docs/FISHABILITY-MODEL.md).

export type FishabilityMode = 'trout' | 'all-fish';

export type SpeciesEvidenceBasis =
  | 'wild-population'
  | 'year-round-managed'
  | 'seasonal-stocking'
  | 'reported'
  | 'unknown';

export type EvidenceConfidence = 'high' | 'medium' | 'low';

export type SpeciesEvidence = {
  species: string;
  basis: SpeciesEvidenceBasis;
  confidence: EvidenceConfidence;
  sourceDate?: string;
};

export type ObservationMetric =
  | 'temperature-c'
  | 'discharge-cfs'
  | 'stage-ft'
  | 'reservoir-level-ft';

export type Observation = {
  metric: ObservationMetric;
  value: number;
  observedAt: string;
  qualifier?: string;
};

export type StockingDatePrecision = 'day' | 'week' | 'month';

export type StockingStatus = 'scheduled' | 'reported-complete' | 'unknown';

export type StockingEvent = {
  date: string;
  datePrecision: StockingDatePrecision;
  status: StockingStatus;
  species?: string[];
};

export type SeasonalPolicy = {
  /** Months (1–12, January = 1) in which stocking is expected to occur. */
  stockedMonths?: number[];
  expectedRetentionDays?: number;
  warmWaterCutoffC?: number;
};

export type FishabilityInput = {
  now: string;
  mode: FishabilityMode;
  waterId: string;
  waterbodyType: string;
  speciesEvidence: Array<SpeciesEvidence>;
  observations: Array<Observation>;
  stockingEvents: Array<StockingEvent>;
  seasonalPolicy?: SeasonalPolicy;
};

export type WaterVisibility = 'include' | 'deemphasize' | 'exclude';

export type TroutApplicability =
  | 'confirmed-current'
  | 'probable-current'
  | 'seasonal-uncertain'
  | 'seasonal-likely-absent'
  | 'not-trout'
  | 'unknown';

export type DisplayMetric = 'trout-condition' | 'fishability' | 'unassessed';

export type FishabilityBand = 'good' | 'fair' | 'poor' | 'unknown';

export type WaterDecision = {
  waterId: string;
  visibility: WaterVisibility;
  troutApplicability: TroutApplicability;
  displayMetric: DisplayMetric;
  fishability?: FishabilityBand;
  confidence: EvidenceConfidence;
  reasons: string[];
  evidenceUsed: string[];
  cautions: string[];
};

/**
 * Opt-in debug metadata appended to a WaterDecision by `evaluateWater`
 * when `{ debug: true }` is passed. The core WaterDecision shape is
 * unchanged without the flag.
 */
export type DecisionDebug = {
  modelVersion: string;
  /** UTC month of `now` (1–12, January = 1). */
  monthUtc: number;
  retentionDays: number;
  elapsedDaysSinceLastCompletedStocking: number | null;
  warmEvidence:
    | 'current-warm'
    | 'stale-warm'
    | 'current-cool'
    | 'stale-cool'
    | 'no-temperature';
  strongestTroutEvidence: SpeciesEvidence | null;
  freshestObservations: Array<Observation>;
};

export type FilterExclusion = {
  decision: WaterDecision;
  /** Named filter rule that produced the exclusion (see FISHABILITY_CONFIG.filter). */
  rule: string;
  reasons: string[];
};

export type FilteredWaters = {
  /**
   * Waters shown in the general list: `include` decisions first (stable
   * input order), then `deemphasized` ones. Excluded waters are absent.
   */
  included: WaterDecision[];
  /** The subset of `included` carrying `visibility: 'deemphasize'`. */
  deemphasized: WaterDecision[];
  /** Waters removed from the general list, each with the named rule and reasons. */
  excluded: FilterExclusion[];
  /**
   * The decision whose waterId matches `options.selectedWaterId`, echoed
   * even when it is excluded from the general list — a selected water
   * remains inspectable via this field.
   */
  selected: WaterDecision | null;
};
