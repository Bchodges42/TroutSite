import type { RiverMapFeature } from './riverMapSelectors';

/**
 * WaterDecisionView — the presentation view model the filter/metric UI
 * consumes. This adapter is the SINGLE classification authority for species
 * applicability (H3 remediation 2026-09-07): filters, map colors, legend
 * scope, and inspector copy all read from here instead of re-testing
 * `feature.species`. The catalog's own words stay the source of truth —
 * missing `species` is UNKNOWN, never trout, and is never "fixed" by guessing.
 */
export type WaterDecisionView = {
  waterId: string;
  visibility: 'include' | 'deemphasize' | 'exclude';
  troutApplicability:
    | 'confirmed-current'
    | 'probable-current'
    | 'seasonal-uncertain'
    | 'seasonal-likely-absent'
    | 'not-trout'
    | 'unknown';
  displayMetric: 'trout-condition' | 'fishability' | 'unassessed';
  fishability?: 'good' | 'fair' | 'poor' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  cautions: string[];
};

export type SpeciesMode = 'trout' | 'all';

/**
 * COMPATIBILITY ADAPTER — current catalog data → WaterDecisionView.
 *
 * Mapping (current data only):
 *   - waters WITHOUT catalog species are `unknown` applicability: included in
 *     trout mode so they stay discoverable, but they never wear trout-condition
 *     language, scores, or band colors — unverified, not silently confirmed.
 *   - warmwater catalog waters are `not-trout`; no generic fishability value
 *     exists yet, so they render `unassessed` (never the trout score). A
 *     warmwater water WITH a stocking program (the Harpeth's December trout
 *     stocking — owner decision 2026-09-04) stays visible in trout mode,
 *     de-emphasized; plain warmwater is excluded there.
 *   - confirmed trout waters with a real assessment render `trout-condition`.
 *   - confirmed trout waters without one render `unassessed` — a missing
 *     assessment is never presented as an assessment.
 */
export function toWaterDecisionView(
  feature: Pick<
    RiverMapFeature,
    'stream' | 'status' | 'score' | 'snapshot' | 'species'
  >,
  mode: SpeciesMode,
): WaterDecisionView {
  const warmwater = feature.species === 'warmwater';
  const speciesUnknown = feature.species == null;
  const assessed = feature.status !== 'no-data' && feature.score !== null;
  const reasons = feature.snapshot?.score.reasons ?? [];

  return {
    waterId: feature.stream.id,
    visibility:
      mode === 'trout' && warmwater
        ? feature.stream.stockingProgram
          ? 'deemphasize'
          : 'exclude'
        : 'include',
    troutApplicability: warmwater
      ? 'not-trout'
      : speciesUnknown
        ? 'unknown'
        : assessed
          ? 'confirmed-current'
          : 'unknown',
    // Only a CONFIRMED trout water with a real assessment may wear the trout
    // metric. Unknown species never borrow it, even when gauges exist.
    displayMetric: feature.species === 'trout' && assessed ? 'trout-condition' : 'unassessed',
    // No generic fishability source exists in the current pipeline. The field
    // stays undefined rather than borrowing the trout score.
    fishability: undefined,
    confidence: assessed && feature.species === 'trout' ? (feature.snapshot?.readings.length ? 'high' : 'medium') : 'low',
    reasons,
    cautions: reasons.filter((r) => /dangerously|avoid stressing|heat|flushing/i.test(r)),
  };
}

/** Plain-language label for the metric a surface is displaying. */
export function metricLabel(view: Pick<WaterDecisionView, 'displayMetric'>): string {
  if (view.displayMetric === 'trout-condition') return 'Trout conditions';
  if (view.displayMetric === 'fishability') return 'Fishability';
  return 'Unassessed';
}

/**
 * Status text for index rows. In all-fish mode a warmwater water never wears
 * trout-condition language, an unverified-species water says so explicitly,
 * and an unassessed water never wears a band.
 */
export function decisionStatusText(
  view: WaterDecisionView,
  feature: Pick<RiverMapFeature, 'species' | 'status'>,
): string {
  if (view.displayMetric === 'trout-condition') {
    return feature.status === 'good'
      ? 'Good'
      : feature.status === 'fair'
        ? 'Fair'
        : feature.status === 'poor'
          ? 'Poor'
          : 'Unassessed';
  }
  if (view.displayMetric === 'fishability') {
    return view.fishability && view.fishability !== 'unknown'
      ? view.fishability.charAt(0).toUpperCase() + view.fishability.slice(1)
      : 'Unassessed';
  }
  return feature.species === 'warmwater'
    ? 'Warmwater'
    : feature.species == null
      ? 'Unverified'
      : 'Unassessed';
}

/** Map-line color token for a feature under the current decision. */
export type DecisionColorToken = 'warmwater' | 'good' | 'fair' | 'poor' | 'no-data';
export function decisionColorToken(
  view: WaterDecisionView,
  feature: Pick<RiverMapFeature, 'species' | 'status'>,
): DecisionColorToken {
  if (view.troutApplicability === 'not-trout') return 'warmwater';
  // Only confirmed-trout assessed waters carry a band; unknown species and
  // unassessed waters render the neutral no-data tone on the map.
  if (view.displayMetric === 'trout-condition') return feature.status;
  return 'no-data';
}
