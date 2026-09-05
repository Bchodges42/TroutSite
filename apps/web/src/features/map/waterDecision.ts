import type { RiverMapFeature } from './riverMapSelectors';

/**
 * WaterDecisionView — the presentation view model the filter/metric UI
 * consumes. The canonical shape (and the seasonal/species logic that will
 * populate it) belongs to the pure fishability model and arrives when
 * Session 3 merges. NOTHING in this file implements seasonal or species
 * applicability logic — the adapter below is a COMPATIBILITY shim over the
 * current catalog data only, and every branch maps straight onto fields the
 * catalog already supplies.
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
 * Clearly labeled as such per the redesign brief: once Session 3's decision
 * model merges, this function becomes a thin call into that model and this
 * file keeps only the type. Do not extend this mapping with seasonal or
 * species-population reasoning.
 *
 * Mapping (current data only):
 *   - warmwater catalog waters are `not-trout`; no generic fishability value
 *     exists yet, so they render `unassessed` (never the trout score).
 *   - trout waters with a real assessment render `trout-condition`.
 *   - trout waters without one render `unassessed` — a missing assessment is
 *     never presented as an assessment.
 */
export function toWaterDecisionView(
  feature: Pick<
    RiverMapFeature,
    'stream' | 'status' | 'score' | 'snapshot' | 'species'
  >,
  mode: SpeciesMode,
): WaterDecisionView {
  const warmwater = feature.species === 'warmwater';
  const assessed = feature.status !== 'no-data' && feature.score !== null;
  const reasons = feature.snapshot?.score.reasons ?? [];

  return {
    waterId: feature.stream.id,
    // Session 3 will drive visibility; until then it mirrors the two current
    // UI filters: species mode and nothing else.
    visibility: mode === 'trout' && warmwater ? 'exclude' : 'include',
    troutApplicability: warmwater
      ? 'not-trout'
      : assessed
        ? 'confirmed-current'
        : 'unknown',
    displayMetric: !warmwater && assessed ? 'trout-condition' : 'unassessed',
    // No generic fishability source exists in the current pipeline. The field
    // stays undefined rather than borrowing the trout score.
    fishability: undefined,
    confidence: assessed ? (feature.snapshot?.readings.length ? 'high' : 'medium') : 'low',
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
 * trout-condition language, and an unassessed water never wears a band.
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
  return feature.species === 'warmwater' ? 'Warmwater' : 'Unassessed';
}
