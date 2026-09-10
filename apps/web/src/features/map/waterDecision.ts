import type { RiverMapFeature } from './riverMapSelectors';
import { troutPresenceNow, type TroutCalendar, type TroutPresenceNow } from '../../lib/troutCalendar';

/**
 * WaterDecisionView — the presentation view model the filter/metric UI
 * consumes. This adapter is the SINGLE classification authority for species
 * applicability (H3 remediation 2026-09-07): filters, map colors, legend
 * scope, and inspector copy all read from here instead of re-testing
 * `feature.species`. The catalog's own words stay the source of truth —
 * missing `species` is UNKNOWN, never trout, and is never "fixed" by guessing.
 *
 * Seasonality (2026-09-10, owner direction): the trout calendar decides
 * whether a water CONTAINS TROUT THIS MONTH. A documented trout water that is
 * out of season (a winter put-and-take pond in July) never wears a condition
 * score — there are no fish to score. Uncertainty is surfaced, never smoothed:
 * unclassified waters read "needs data" and stay scoreless.
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
  /** Season-aware trout presence for the CURRENT month (calendar may be absent). */
  presence: TroutPresenceNow | null;
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
 *   - confirmed trout waters with a real assessment render `trout-condition` —
 *     UNLESS the calendar says the water holds no trout this month.
 *   - confirmed trout waters without an assessment render `unassessed` — a
 *     missing assessment is never presented as an assessment.
 */
export function toWaterDecisionView(
  feature: Pick<
    RiverMapFeature,
    'stream' | 'status' | 'score' | 'snapshot' | 'species'
  >,
  mode: SpeciesMode,
  calendar?: TroutCalendar | null,
  now?: Date,
): WaterDecisionView {
  const warmwater = feature.species === 'warmwater';
  const speciesUnknown = feature.species == null;
  const assessed = feature.status !== 'no-data' && feature.score !== null;
  const reasons = feature.snapshot?.score.reasons ?? [];
  const entry = calendar?.waters[feature.stream.id];
  const presence = calendar ? troutPresenceNow(entry, now) : null;
  // Out of season = the calendar documents trout here, but not this month.
  const outOfSeason = presence?.state === 'absent';
  const noTroutNow = presence?.state === 'none' || outOfSeason;
  // A score may only show for a CONFIRMED trout water that (a) has a real
  // assessment and (b) actually contains trout right now.
  const scoreable = feature.species === 'trout' && assessed && !noTroutNow;

  // Trout-mode visibility (owner direction 2026-09-10, refined same day:
  // "I don't want them completely gone but MUCH easier to distinguish"). A
  // documented trout water out of season — Stones River, a December–February
  // stocking, in September — STAYS VISIBLE but de-emphasized: dimmed and
  // dashed on the map, labeled "no trout now", sorted last in the list.
  // Waters the calendar documents as having no trout program at all (Kentucky
  // Lake) are excluded outright. Unclassified waters stay discoverable but
  // never read as trout.
  let visibility: WaterDecisionView['visibility'] = 'include';
  if (mode === 'trout') {
    if (warmwater) {
      if (!calendar) {
        // No calendar in this bundle: the legacy owner ruling (2026-09-04)
        // applies unchanged — a stocked warmwater water stays visible-but-dim.
        visibility = feature.stream.stockingProgram ? 'deemphasize' : 'exclude';
      } else {
        // Stocked warmwater (the Harpeth): a real winter fishery on a warm
        // base — always visible, de-emphasized; the season strip says when.
        visibility = feature.stream.stockingProgram ? 'deemphasize' : 'exclude';
      }
    } else if (presence?.state === 'absent') {
      visibility = 'deemphasize';
    } else if (presence?.state === 'none') {
      visibility = 'exclude';
    }
  }

  return {
    waterId: feature.stream.id,
    visibility,
    troutApplicability: warmwater
      ? 'not-trout'
      : speciesUnknown
        ? 'unknown'
        : assessed
          ? 'confirmed-current'
          : 'unknown',
    displayMetric: scoreable ? 'trout-condition' : 'unassessed',
    // No generic fishability source exists in the current pipeline. The field
    // stays undefined rather than borrowing the trout score.
    fishability: undefined,
    confidence: assessed && feature.species === 'trout' ? (feature.snapshot?.readings.length ? 'high' : 'medium') : 'low',
    presence,
    reasons,
    cautions: reasons.filter((r) => /dangerously|avoid stressing|heat|flushing|do not fish|stress begins/i.test(r)),
  };
}

/** Plain-language label for the metric a surface is displaying. */
export function metricLabel(view: Pick<WaterDecisionView, 'displayMetric'>): string {
  if (view.displayMetric === 'trout-condition') return 'Trout conditions';
  if (view.displayMetric === 'fishability') return 'Fishability';
  return 'Unassessed';
}

/**
 * Status text for index rows. Season-aware: an out-of-season trout water says
 * so instead of wearing a condition band (no fish = nothing to score); a
 * warmwater water never wears trout-condition language; an unverified-species
 * water asks for data instead of hinting at trout; an unassessed water never
 * wears a band.
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
  // Presence-aware text outranks the generic fallbacks where the calendar speaks.
  if (view.presence) {
    if (view.presence.state === 'none') return 'Warmwater';
    if (view.presence.state === 'absent') return 'No trout now';
    if (view.presence.state === 'uncertain') return 'Needs data';
    if (view.presence.state === 'present' && view.presence.fresh) return 'In season · fresh';
  }
  return feature.species === 'warmwater'
    ? 'Warmwater'
    : feature.species == null
      ? 'Needs data'
      : 'Unassessed';
}

/** Map-line color token for a feature under the current decision. */
export type DecisionColorToken = 'warmwater' | 'good' | 'fair' | 'poor' | 'no-data';
export function decisionColorToken(
  view: WaterDecisionView,
  feature: Pick<RiverMapFeature, 'species' | 'status'>,
): DecisionColorToken {
  if (view.troutApplicability === 'not-trout') return 'warmwater';
  // Only confirmed-trout assessed waters carrying trout NOW get a band;
  // unknown species, unassessed, and out-of-season waters render the neutral
  // no-data tone on the map — missing fish or missing data never render as a
  // condition.
  if (view.displayMetric === 'trout-condition') return feature.status;
  return 'no-data';
}

/**
 * Fishery class for the map's class-outline layer (owner direction 2026-09-10:
 * trout vs warmwater must be legible as a highlight, not just a filter).
 * `null` = unclassified — no outline, the water hasn't earned a class.
 */
export function classOutline(
  feature: Pick<RiverMapFeature, 'stream' | 'species'>,
  calendar: TroutCalendar | null | undefined,
): 'trout' | 'warmwater' | null {
  if (feature.species === 'warmwater') return 'warmwater';
  if (feature.species === 'trout') {
    // Uncertain calendar presence still gets the trout outline — the CLASS is
    // documented; the outline is about fishery class, not this month's fish.
    return 'trout';
  }
  // Undocumented species: the calendar's research classification may speak.
  const cls = calendar?.waters[feature.stream.id]?.classification;
  if (cls === 'trout-wild' || cls === 'trout-stocked' || cls === 'tailwater-trout') return 'trout';
  if (cls === 'warmwater') return 'warmwater';
  return null;
}
