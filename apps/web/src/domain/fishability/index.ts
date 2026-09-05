// Public API of the fishability decision model.
// Pure, deterministic, no network / storage / React dependencies.

export { MODEL_VERSION, FISHABILITY_CONFIG } from './config';
export { evaluateWater, buildStockingProfile, type EvaluateOptions } from './evaluate';
export { selectVisibleWaters } from './filter';
export { classifySpecies } from './species';
export { freshestObservation, freshnessOf, readTemperature } from './observations';
export { elapsedDays, toUtcMs, utcMonth } from './time';
export type {
  DecisionDebug,
  DisplayMetric,
  EvidenceConfidence,
  FilteredWaters,
  FilterExclusion,
  FishabilityBand,
  FishabilityInput,
  FishabilityMode,
  Observation,
  ObservationMetric,
  SeasonalPolicy,
  SpeciesEvidence,
  SpeciesEvidenceBasis,
  StockingDatePrecision,
  StockingEvent,
  StockingStatus,
  TroutApplicability,
  WaterDecision,
  WaterVisibility,
} from './types';
