// Observation freshness plumbing and the two banding tables.
//
// The trout banding (trout-mode conditions for waters whose trout
// applicability is current) and the generic banding (all-fish fishability,
// and trout-mode display for waters where trout presence is not current)
// are deliberately separate functions over the same freshness plumbing.
// All-fish mode never reuses the trout bands — see docs/FISHABILITY-MODEL.md.

import { FISHABILITY_CONFIG } from './config';
import { elapsedDays, toUtcMs } from './time';
import type {
  EvidenceConfidence,
  FishabilityBand,
  Observation,
  ObservationMetric,
} from './types';

const FRESH_MS = FISHABILITY_CONFIG.freshness.currentHours * 3_600_000;
const STALE_MS = FISHABILITY_CONFIG.freshness.maxUsableDays * 86_400_000;

export type ObservationFreshness = 'current' | 'aging' | 'stale';

export function freshnessOf(observedAt: string, nowIso: string): ObservationFreshness {
  const age = toUtcMs(nowIso, 'timestamp') - toUtcMs(observedAt, 'observedAt');
  if (age <= FRESH_MS) return 'current';
  if (age <= STALE_MS) return 'aging';
  return 'stale';
}

/**
 * The freshest observation for a metric (ties resolved to the earliest
 * input position among equal timestamps, for determinism), or null.
 */
export function freshestObservation(
  observations: readonly Observation[],
  metric: ObservationMetric,
  nowIso: string,
): Observation | null {
  const nowMs = toUtcMs(nowIso, 'timestamp');
  let best: Observation | null = null;
  let bestMs = Number.NEGATIVE_INFINITY;
  for (const obs of observations) {
    if (obs.metric !== metric) continue;
    const ms = toUtcMs(obs.observedAt, 'observedAt');
    // Clock-skewed future observations are ignored, not scored.
    if (ms > nowMs) continue;
    if (ms > bestMs) {
      best = obs;
      bestMs = ms;
    }
  }
  return best;
}

export type WarmEvidence =
  | 'current-warm'
  | 'stale-warm'
  | 'current-cool'
  | 'stale-cool'
  | 'no-temperature';

export type TemperatureRead = {
  kind: WarmEvidence;
  freshest: Observation | null;
  /** Days since the freshest temperature observation (null when none). */
  ageDays: number | null;
  warmCountCurrent: number;
};

/**
 * Classify temperature evidence against the warm-water cutoff. The
 * freshest temperature observation decides the direction; older warm
 * observations can never make the water "currently warm".
 */
export function readTemperature(
  observations: readonly Observation[],
  nowIso: string,
  cutoffC: number,
): TemperatureRead {
  const temps = observations.filter((obs) => obs.metric === 'temperature-c');
  if (temps.length === 0) {
    return { kind: 'no-temperature', freshest: null, ageDays: null, warmCountCurrent: 0 };
  }
  const freshest = freshestObservation(observations, 'temperature-c', nowIso);
  const ageDays =
    freshest === null ? null : elapsedDays(freshest.observedAt, nowIso);
  let warmCountCurrent = 0;
  for (const obs of temps) {
    if (obs.value >= cutoffC && freshnessOf(obs.observedAt, nowIso) === 'current') {
      warmCountCurrent += 1;
    }
  }
  if (freshest === null) {
    return { kind: 'no-temperature', freshest: null, ageDays: null, warmCountCurrent: 0 };
  }
  const current = freshnessOf(freshest.observedAt, nowIso) === 'current';
  if (freshest.value >= cutoffC) {
    return {
      kind: current ? 'current-warm' : 'stale-warm',
      freshest,
      ageDays,
      warmCountCurrent,
    };
  }
  return {
    kind: current ? 'current-cool' : 'stale-cool',
    freshest,
    ageDays,
    warmCountCurrent,
  };
}

/** True when any flow/stage/reservoir observation is fresh enough to score. */
export function hasUsableFlowEvidence(
  observations: readonly Observation[],
  nowIso: string,
): boolean {
  return observations.some(
    (obs) =>
      (obs.metric === 'discharge-cfs' ||
        obs.metric === 'stage-ft' ||
        obs.metric === 'reservoir-level-ft') &&
      freshnessOf(obs.observedAt, nowIso) !== 'stale',
  );
}

/** Confidence for a computed band: two fresh metric families → high, one → medium. */
export function bandConfidence(
  observations: readonly Observation[],
  nowIso: string,
): EvidenceConfidence {
  let families = 0;
  if (freshestObservation(observations, 'temperature-c', nowIso) !== null) families += 1;
  if (hasUsableFlowEvidence(observations, nowIso)) families += 1;
  return families >= 2 ? 'high' : 'medium';
}

/**
 * Trout-mode condition banding for waters whose trout applicability is
 * current. Temperature drives the band (trout comfort bands from
 * config); flow contributes presence-of-water only, because no reference
 * flow range is available in FishabilityInput. [REQUIRES VALIDATION]
 */
export function troutConditionBand(
  observations: readonly Observation[],
  nowIso: string,
): FishabilityBand | 'unknown' {
  const cfg = FISHABILITY_CONFIG.trout;
  const flow = freshestObservation(observations, 'discharge-cfs', nowIso);
  const flowUsable = flow !== null && freshnessOf(flow.observedAt, nowIso) !== 'stale';

  if (flowUsable && flow.value < FISHABILITY_CONFIG.general.lowFlowSuspicionCfs) return 'poor';

  const temp = freshestObservation(observations, 'temperature-c', nowIso);
  if (temp !== null && freshnessOf(temp.observedAt, nowIso) !== 'stale') {
    if (temp.value > cfg.tempMarginalHighC) return 'poor';
    if (temp.value < cfg.tempMarginalLowC) return 'poor';
    if (temp.value >= cfg.tempIdealMinC && temp.value <= cfg.tempIdealMaxC) return 'good';
    return 'fair';
  }

  if (flowUsable) return 'fair';
  return 'unknown';
}

/**
 * Generic all-fish banding: fresh water presence and survivable
 * temperature only. It deliberately knows nothing about species-specific
 * habitat quality. [REQUIRES VALIDATION — thresholds are survivability
 * bounds, not quality statements.]
 */
export function generalFishabilityBand(
  observations: readonly Observation[],
  nowIso: string,
): FishabilityBand | 'unknown' {
  const cfg = FISHABILITY_CONFIG.general;
  const flow = freshestObservation(observations, 'discharge-cfs', nowIso);
  const flowUsable = flow !== null && freshnessOf(flow.observedAt, nowIso) !== 'stale';
  const stage =
    freshestObservation(observations, 'stage-ft', nowIso) ??
    freshestObservation(observations, 'reservoir-level-ft', nowIso);
  const stageUsable = stage !== null && freshnessOf(stage.observedAt, nowIso) !== 'stale';
  const temp = freshestObservation(observations, 'temperature-c', nowIso);
  const tempUsable = temp !== null && freshnessOf(temp.observedAt, nowIso) !== 'stale';

  if (!flowUsable && !stageUsable && !tempUsable) return 'unknown';
  if (flowUsable && flow.value < FISHABILITY_CONFIG.general.lowFlowSuspicionCfs) return 'poor';
  if (tempUsable) {
    if (temp.value >= cfg.lethalTempC || temp.value <= cfg.freezingTempC) return 'poor';
    if (temp.value >= cfg.hotTempC) return 'fair';
  }
  if (flowUsable || stageUsable) return 'good';
  return 'fair';
}
