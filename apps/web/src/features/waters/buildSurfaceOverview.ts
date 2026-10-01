import type { ConditionSnapshot, Stream } from '@trout/contracts';
import type { FishabilityFocus, SpeciesMode, WaterDecisionView } from '../map/waterDecision';
import { toWaterDecisionView } from '../map/waterDecision';
import { buildWaterOverview, type WaterOverview } from '../../lib/waterOverview';

/** Same union as riverMapSelectors.ConditionStatus — the adjudicated status words. */
type ConditionStatus = 'good' | 'fair' | 'poor' | 'no-data';

export interface SurfaceOverviewInput {
  stream: Stream;
  /** Latest conditions snapshot for this water — null when none is cached. */
  snapshot: ConditionSnapshot | null | undefined;
  /** The surface's already-adjudicated status (statusForScore output). */
  status: ConditionStatus;
  /** The snapshot's score as the surface carries it (null when unassessed). */
  score: number | null;
  /** Catalog species verbatim — undefined stays the unknown state. */
  species: Stream['species'];
  mode: SpeciesMode;
  month: number;
  /** True when the snapshot arrived from a live fetch this session. */
  live: boolean;
  /** Deterministic clock for freshness (same discipline as contracts). */
  nowMs: number;
  /** Focus-species fishability in all-fish mode (F6), when the surface has it. */
  fishability?: FishabilityFocus;
  /** Newest matched published stocking event, when the surface has one. */
  lastStockingEvent?: WaterOverview['stocking']['lastEvent'];
}

export interface SurfaceOverview {
  overview: WaterOverview;
  decision: WaterDecisionView | null;
  /** Context for `overviewConditionStatus` — present exactly when a decision exists. */
  decisionContext: {
    species: 'trout' | 'warmwater' | undefined;
    status: ConditionStatus;
    fishability?: FishabilityFocus;
  } | null;
}

/**
 * ONE composition point for the map inspector and the stream detail page:
 * both surfaces hand over the data they already hold and receive the same
 * WaterOverview (via toWaterDecisionView + buildWaterOverview, the single
 * classification and overview authorities). No surface recomputes its own
 * summary.
 */
export function buildSurfaceOverview(input: SurfaceOverviewInput): SurfaceOverview {
  const feature = {
    stream: input.stream,
    status: input.status,
    score: input.status !== 'no-data' ? input.score : null,
    snapshot: input.snapshot ?? undefined,
    species: input.species,
  };
  const decision = input.snapshot
    ? toWaterDecisionView(feature, input.mode, input.month, input.fishability)
    : null;
  const overview = buildWaterOverview({
    stream: input.stream,
    decision,
    conditions: input.snapshot ?? null,
    offlineSaved: input.snapshot != null && !input.live,
    nowMs: input.nowMs,
    lastStockingEvent: input.lastStockingEvent,
    sourcesCount: input.stream.officialSources?.length ?? 0,
  });
  return {
    overview,
    decision,
    decisionContext: decision
      ? { species: input.species, status: input.status, fishability: input.fishability }
      : null,
  };
}
