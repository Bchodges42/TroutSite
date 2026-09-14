import type { RiverMapFeature } from './riverMapSelectors';
import type { FishabilityScore, SpeciesKey } from '@trout/contracts';

/**
 * The focus species' comfort score for one water, when the snapshot has it
 * (F6). `null` = the water carries no fishability for the focus species.
 */
export type FishabilityFocus = {
  species: SpeciesKey;
  comfort: FishabilityScore;
} | null;

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
  seasonKind?: 'regulatory' | 'programmatic';
  /** True when the water carries an authored season window and the current
   *  month is inside it — the seasonal chip still renders, but the water's
   *  own score wears through (2026-09-14: in-season tailwaters must not read
   *  unassessed just because an authored window exists). */
  inSeason?: boolean;
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
 *   - authored seasonMonths are the only calendar window used for seasonal
 *     applicability. Legacy yearRound:false rows retain the conservative
 *     Nov–Mar fallback until they are authored.
 */
export function toWaterDecisionView(
  feature: Pick<
    RiverMapFeature,
    'stream' | 'status' | 'score' | 'snapshot' | 'species'
  >,
  mode: SpeciesMode,
  month?: number,
  fishability?: FishabilityFocus,
): WaterDecisionView {
  const warmwater = feature.species === 'warmwater';
  const speciesUnknown = feature.species == null;
  const assessed = feature.status !== 'no-data' && feature.score !== null;
  const reasons = feature.snapshot?.score.reasons ?? [];
  // 1-based months; authored windows carry their regulatory/programmatic kind.
  const seasonMonths = feature.stream.seasonMonths ?? (feature.stream.yearRound === false ? [11, 12, 1, 2, 3] : undefined);
  const seasonKind = feature.stream.seasonKind ?? (feature.stream.yearRound === false ? 'programmatic' : undefined);
  const inSeason = month === undefined || seasonMonths === undefined || seasonMonths.includes(month);
  const seasonal =
    feature.species === 'trout' && seasonMonths !== undefined
      ? inSeason
        ? ('seasonal-uncertain' as const)
        : ('seasonal-likely-absent' as const)
      : null;
  const troutApplicability = seasonal ?? (warmwater
    ? ('not-trout' as const)
    : speciesUnknown
      ? ('unknown' as const)
      : assessed
        ? ('confirmed-current' as const)
        : ('unknown' as const));
  // F6 (TASK 3): in all-fish mode a water whose snapshot carries an ASSESSED
  // comfort score for the focus species wears that fishability metric —
  // warmwater waters finally get their own real score. Unknown-species waters
  // and unassessed comfort stay honestly unassessed. Trout mode is untouched.
  const fishabilityActive =
    mode === 'all' &&
    !!fishability &&
    fishability.comfort.assessed;
  return {
    waterId: feature.stream.id,
    visibility:
      mode === 'trout' && warmwater
        ? feature.stream.stockingProgram
          ? 'deemphasize'
          : 'exclude'
        : 'include',
    troutApplicability,
    ...(seasonal ? { seasonKind } : {}),
    inSeason: seasonal ? inSeason : undefined,
    // Only a CONFIRMED, in-season trout water with a real assessment may wear
    // the trout metric; authored-window waters wear it while their window is
    // open (the chip carries the window), all-fish mode may wear the FOCUS
    // species' real fishability. Unknown species and out-of-season waters
    // never borrow a metric they have no data for.
    displayMetric: fishabilityActive
      ? ('fishability' as const)
      : (troutApplicability === 'confirmed-current' ||
          (troutApplicability === 'seasonal-uncertain' && inSeason === true)) &&
        assessed
        ? ('trout-condition' as const)
        : ('unassessed' as const),
    // No generic fishability source exists in the current pipeline. The field
    // stays undefined rather than borrowing the trout score.
    fishability: undefined,
    confidence: fishabilityActive
      ? (fishability!.comfort.freshness ? 'high' : 'medium')
      : (troutApplicability === 'confirmed-current' ||
          (troutApplicability === 'seasonal-uncertain' && inSeason === true)) &&
        assessed
        ? (feature.snapshot?.readings.length ? 'high' : 'medium')
        : 'low',
    reasons,
    cautions: reasons.filter((r) => /dangerously|avoid stressing|heat|flushing/i.test(r)),
  };
}

/** The catalog's seasonal fact, phrased for the surface the visitor is on. */
export function seasonalChipText(view: Pick<WaterDecisionView, 'troutApplicability' | 'seasonKind'>): string | null {
  if (view.troutApplicability === 'seasonal-likely-absent')
    return view.seasonKind === 'regulatory' ? 'REGULATORY — out of season' : 'PROGRAMMATIC — out of season';
  if (view.troutApplicability === 'seasonal-uncertain')
    return view.seasonKind === 'regulatory' ? 'REGULATORY — seasonal fishery' : 'PROGRAMMATIC — seasonal fishery';
  return null;
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
  fishability?: FishabilityFocus,
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
  if (view.troutApplicability === 'seasonal-likely-absent') return 'Out of season';
  if (view.troutApplicability === 'seasonal-uncertain') return 'Seasonal';
  // F6: the fishability metric's band text comes from the real comfort score
  // (same scoreBand ladder as the trout metric).
  if (view.displayMetric === 'fishability') {
    if (!fishability || !fishability.comfort.assessed) return 'No data';
    const b = fishability.comfort.value;
    return b >= 70 ? 'Good' : b >= 40 ? 'Fair' : 'Poor';
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
  fishability?: FishabilityFocus,
): DecisionColorToken {
  if (view.troutApplicability === 'not-trout') {
    // In all-fish mode a warmwater water wears its focus-species fishability
    // band like any other water (F6 TASK 2); without that metric it keeps the
    // honest warmwater bronze.
    if (view.displayMetric === 'fishability' && fishability?.comfort.assessed) {
      return fishability.comfort.value >= 70
        ? 'good'
        : fishability.comfort.value >= 40
          ? 'fair'
          : 'poor';
    }
    return 'warmwater';
  }
  if (view.displayMetric === 'fishability' && fishability?.comfort.assessed) {
    return fishability.comfort.value >= 70
      ? 'good'
      : fishability.comfort.value >= 40
        ? 'fair'
        : 'poor';
  }
  // Only confirmed-trout assessed waters carry a band; unknown species and
  // unassessed waters render the neutral no-data tone on the map.
  if (view.displayMetric === 'trout-condition') return feature.status;
  return 'no-data';
}
