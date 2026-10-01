import type { RiverMapFeature } from './riverMapSelectors';
import type { EvidenceState, FishabilityScore, OpportunityHeadline, SpeciesKey } from '@trout/contracts';
import { READING_STALE_MINUTES } from '@trout/contracts';
import { monthWindowLabel } from '../../lib/troutCalendar';

/**
 * The catalog's adjudicated fishery opportunity (ADR 0010), carried into the
 * view model. Absent = the water has not been through evidence adjudication —
 * consumers treat that as unresolved, NEVER as a negative.
 */
export type OpportunityView = {
  trout: OpportunityHeadline;
  evidenceState: EvidenceState;
  statement?: string;
  reachScope?: string;
  asOf?: string;
  caveats: string[];
  unresolvedQuestion?: string;
};

/**
 * The focus species' comfort score for one water, when the snapshot has it
 * (F6). `null` = the water carries no fishability for the focus species.
 */
export type FishabilityFocus = {
  species: SpeciesKey;
  comfort: FishabilityScore;
} | null;

/**
 * F04: freshness as the decision view sees it. A snapshot payload freezes
 * `ageMinutes` at generation time; lib/fishability's hooks stamp the freshness
 * at the data boundary with the observation's CURRENT age. Structurally
 * matched here (no import) so this adapter stays a pure leaf. Absent stamp =
 * generation-time age is the only known age (legacy payloads, direct tests).
 */
type ComfortFreshness = {
  observedAt: string;
  ageMinutes: number;
  currentAgeMinutes?: number;
};

/**
 * F04: current age in minutes of the observation behind a comfort score — the
 * boundary stamp when one was served, else the generation-time age frozen in
 * the payload. `null` when the comfort carries no observation at all. Pure:
 * the clock was applied upstream, at the data boundary.
 */
export function assessmentAgeMinutes(comfort: Pick<FishabilityScore, 'freshness'>): number | null {
  const f: ComfortFreshness | null = comfort.freshness;
  if (!f) return null;
  const age = f.currentAgeMinutes ?? f.ageMinutes;
  return Number.isFinite(age) ? Math.max(0, age) : null;
}

/**
 * F04: true when the observation behind a comfort score is past the shared
 * reading window NOW — the same gate scoreFishability applies at generation
 * (READING_STALE_MINUTES, 3 h). The scoring pipeline would refuse that
 * observation today, so a cached score it produced must present as a clearly
 * labeled historical assessment with reduced confidence, never as current.
 */
export function isHistoricalAssessment(comfort: Pick<FishabilityScore, 'freshness'>): boolean {
  const age = assessmentAgeMinutes(comfort);
  return age !== null && age > READING_STALE_MINUTES;
}

/**
 * WaterDecisionView — the presentation view model the filter/metric UI
 * consumes. This adapter is the SINGLE classification authority for species
 * applicability (H3 remediation 2026-09-07): filters, map colors, legend
 * scope, and inspector copy all read from here instead of re-testing
 * `feature.species`. The catalog's own words stay the source of truth —
 * missing `species` is UNKNOWN, never trout, and is never "fixed" by guessing.
 *
 * An authored programmatic month list describes stocking plans, not current
 * trout presence or a legal fishing season. Only a regulatory window can
 * close a season in this view. Uncertainty stays visible and scoreless.
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
  /** Catalog `yearRound`, carried for surfaces that phrase the seasonal verdict
   *  (a year-round programmatic water must never read winter-only). */
  yearRound?: boolean;
  /** Authored regulatory or stocking months; the latter are never presence evidence. */
  seasonMonths?: number[];
  /** Set only for a regulatory season; a stocking plan cannot establish it. */
  inSeason?: boolean;
  displayMetric: 'trout-condition' | 'fishability' | 'unassessed';
  fishability?: 'good' | 'fair' | 'poor' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  /** F04: for the fishability metric — 'historical' when the supporting
   *  observation is past the shared reading window at read time (cache
   *  provenance: the payload's generation-time age never grows, so the stamp
   *  from the data boundary is the truth). A historical metric keeps its band
   *  but must be labeled a historical assessment with reduced confidence,
   *  never current conditions. Absent for the trout-condition metric. */
  assessmentRecency?: 'current' | 'historical';
  /** Adjudicated fishery opportunity from the catalog (ADR 0010). Derived
   * ONLY from the authored `opportunity` block — undefined when the water
   * has not been adjudicated, which is an honest "not yet", not a negative. */
  opportunity?: OpportunityView;
  reasons: string[];
  cautions: string[];
};

export type SpeciesMode = 'trout' | 'all';

/**
 * Candidate-B visibility rule (feat/map-prominence decision package): when the
 * owner picks the "geographic anchors" featured set, featured plain-warmwater
 * waters (Tennessee River, Mississippi River) stay VISIBLE as dim, subordinate
 * context in trout mode instead of being excluded by the 2026-09-07 campaign
 * rule. Default off = candidate A behavior (plain warmwater excluded). Their
 * labels style subordinate via labelPolicy — they never read as trout.
 */
export const FEATURED_WARMWATER_CONTEXT = false;

/**
 * COMPATIBILITY ADAPTER — current catalog data → WaterDecisionView.
 *
 * Mapping (current data only):
 *   - the catalog's adjudicated `opportunity` block (ADR 0010) refines the
 *     read when present: year-round-trout / seasonal-stocked-trout / mixed
 *     are documented-trout waters; warmwater-focus is a POSITIVE warmwater
 *     claim (never "no trout"); unresolved means just that — never a hidden
 *     negative. An UNAUTHORED block (absent) is `unknown` applicability: the
 *     water stays discoverable and neutral, never trout, never absent.
 *   - waters WITHOUT catalog species are `unknown` applicability: included in
 *     trout mode so they stay discoverable, but they never wear trout-condition
 *     language, scores, or band colors — unverified, not silently confirmed.
 *   - warmwater catalog waters are `not-trout` (presentation wording is
 *     "warmwater focus", never a biological exclusion); no generic
 *     fishability value exists yet, so they render `unassessed` (never the
 *     trout score). A warmwater water WITH a stocking program (the Harpeth's
 *     December trout stocking — owner decision 2026-09-04) stays visible in
 *     trout mode, de-emphasized; plain warmwater is excluded there.
 *   - confirmed trout waters with a real assessment render `trout-condition`
 *     while their authored window is open; out of season they dim, not hide
 *     (owner refinement 2026-09-10).
 *   - confirmed trout waters without an assessment render `unassessed` — a
 *     missing assessment is never presented as an assessment.
 *   - authored regulatory seasonMonths can establish an open/closed season.
 *     Programmatic months are a schedule, never a presence or closure claim.
 *     The former legacy Nov–Mar fallback was removed by ADR 0010.
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
  // NO fallback synthesis: no authored window = no seasonal verdict.
  // ADR 0010: on a yearRound:true water the window is the STOCKING calendar,
  // never a presence window — September must not read "out of season"/"likely
  // absent" on a year-round tailwater (the exact contradiction the evidence
  // audit flagged). Presence is always open there; the stocking window still
  // shows via the ledger caveats and the season box.
  const seasonMonths = feature.stream.seasonMonths ?? undefined;
  const seasonKind = feature.stream.seasonKind ?? undefined;
  const yearRoundFishery = feature.stream.yearRound === true;
  const regulatoryWindow = seasonKind === 'regulatory' && !yearRoundFishery && seasonMonths !== undefined;
  const inSeason = regulatoryWindow
    ? month === undefined || seasonMonths.includes(month)
    : undefined;
  const opportunityBlock = feature.stream.opportunity;
  // A verified seasonal stocking program remains seasonal when a misleading
  // catalog month window has been removed. The schedule alone cannot earn a
  // live trout-condition score.
  const adjudicatedSeasonal = opportunityBlock?.trout === 'seasonal-stocked-trout' || opportunityBlock?.trout === 'mixed';
  const seasonal =
    feature.species === 'trout' && (seasonMonths !== undefined || adjudicatedSeasonal) && !yearRoundFishery
      ? regulatoryWindow && inSeason === false
        ? ('seasonal-likely-absent' as const)
        : ('seasonal-uncertain' as const)
      : null;
  // ADR 0010: the adjudicated opportunity refines applicability for waters
  // whose species field is absent or ambiguous. It never creates a negative.
  const opportunity: OpportunityView | undefined = opportunityBlock
    ? {
        trout: opportunityBlock.trout,
        evidenceState: opportunityBlock.evidenceState,
        ...(opportunityBlock.statement ? { statement: opportunityBlock.statement } : {}),
        ...(opportunityBlock.reachScope ? { reachScope: opportunityBlock.reachScope } : {}),
        ...(opportunityBlock.asOf ? { asOf: opportunityBlock.asOf } : {}),
        caveats: opportunityBlock.caveats ?? [],
        ...(opportunityBlock.unresolvedQuestion ? { unresolvedQuestion: opportunityBlock.unresolvedQuestion } : {}),
      }
    : undefined;
  const opportunityTroutDocumented =
    opportunityBlock != null &&
    (opportunityBlock.trout === 'year-round-trout' ||
      opportunityBlock.trout === 'seasonal-stocked-trout' ||
      opportunityBlock.trout === 'mixed');
  const opportunityWarmwaterFocus = opportunityBlock?.trout === 'warmwater-focus';
  const troutApplicability = opportunityBlock?.trout === 'unresolved'
    ? ('unknown' as const)
    : opportunityWarmwaterFocus
      ? ('not-trout' as const)
      : seasonal ?? (warmwater
    ? ('not-trout' as const)
    : speciesUnknown
      ? opportunityTroutDocumented
        ? assessed
          ? ('confirmed-current' as const)
          : ('unknown' as const)
        : ('unknown' as const)
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
  // F04: a cached assessment ages. Whether the score's supporting observation
  // is past the reading window NOW decides current vs historical presentation.
  const historicalAssessment = fishabilityActive && isHistoricalAssessment(fishability!.comfort);
  // Trout-mode visibility. Campaign base (2026-09-07): stocked warmwater stays
  // visible-but-dim, plain warmwater is excluded. Owner refinement (2026-09-10,
  // "not completely gone but MUCH easier to distinguish"): a DOCUMENTED trout
  // water out of season — the winter ponds in July — stays visible but
  // de-emphasized; it never wears a score there are no fish for.
  // ADR 0010: warmwater-focus (adjudicated positive) behaves like plain
  // warmwater here; a warmwater-focus water with a documented trout program
  // ('mixed', or a stocked program) keeps the stocked-warmwater de-emphasis.
  const visibility: WaterDecisionView['visibility'] =
    mode === 'trout'
      ? warmwater || opportunityWarmwaterFocus
        ? feature.stream.stockingProgram ||
          opportunityBlock?.trout === 'mixed' ||
          opportunityBlock?.trout === 'seasonal-stocked-trout' ||
          (FEATURED_WARMWATER_CONTEXT && feature.stream.display === 'featured')
          ? 'deemphasize'
          : 'exclude'
        : troutApplicability === 'seasonal-likely-absent'
          ? 'deemphasize'
          : 'include'
      : 'include';
  const assessmentReasons = fishabilityActive ? fishability!.comfort.reasons : reasons;
  return {
    waterId: feature.stream.id,
    visibility,
    troutApplicability,
    ...(seasonal ? { seasonKind, yearRound: feature.stream.yearRound, seasonMonths } : {}),
    inSeason,
    opportunity,
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
    // A focus-species band comes from that species' comfort score only.
    fishability: fishabilityActive
      ? fishability!.comfort.value >= 70 ? 'good' : fishability!.comfort.value >= 40 ? 'fair' : 'poor'
      : undefined,
    ...(fishabilityActive
      ? { assessmentRecency: historicalAssessment ? ('historical' as const) : ('current' as const) }
      : {}),
    confidence: fishabilityActive
      ? historicalAssessment
        ? // F04: a historical assessment keeps its band but loses current
          // confidence — below even the un-fresh-but-current 'medium'.
          ('low' as const)
        : fishability!.comfort.freshness
          ? ('high' as const)
          : ('medium' as const)
      : (troutApplicability === 'confirmed-current' ||
          (troutApplicability === 'seasonal-uncertain' && inSeason === true)) &&
        assessed
        ? (feature.snapshot?.readings.length ? 'high' : 'medium')
        : 'low',
    reasons: assessmentReasons,
    cautions: assessmentReasons.filter((r) => /dangerously|avoid stressing|heat|flushing|do not fish|stress begins/i.test(r)),
  };
}

/**
 * The catalog's seasonal fact, phrased for the surface the visitor is on.
 * Derived from the water's own season fields. Programmatic months are a
 * stocking calendar, never a month-level finding that trout are present.
 */
export function seasonalChipText(
  view: Pick<WaterDecisionView, 'troutApplicability' | 'seasonKind' | 'inSeason' | 'yearRound' | 'seasonMonths'>,
): string | null {
  return seasonalVerdict(view)?.chip ?? null;
}

export type SeasonalVerdict = {
  kindWord: 'regulatory' | 'programmatic';
  kindLabel: 'REGULATORY' | 'PROGRAMMATIC';
  outOfSeason: boolean;
  yearRound: boolean;
  /** Authored window as a display label, e.g. "Mar–Dec". */
  windowLabel: string;
  /** Assessment-card verdict, e.g. "PROGRAMMATIC — in season". */
  title: string;
  /** Assessment-card prose (the "reason" slot). */
  prose: string;
  /** Short chip line (same words as the title). */
  chip: string;
  /** Longer seasonal-note paragraph for the drawer's season section. */
  note: string;
};

/**
 * Single derivation of the seasonal verdict + prose from the water's authored
 * season fields. `seasonal-uncertain` means the window is open now
 * (`seasonal-likely-absent` is its closed twin), so the in-season branch never
 * needs the month again.
 */
export function seasonalVerdict(
  view: Pick<WaterDecisionView, 'troutApplicability' | 'seasonKind' | 'inSeason' | 'yearRound' | 'seasonMonths'>,
): SeasonalVerdict | null {
  if (view.troutApplicability !== 'seasonal-likely-absent' && view.troutApplicability !== 'seasonal-uncertain') {
    return null;
  }
  if (!view.seasonMonths?.length) return null;
  const kindWord = view.seasonKind === 'regulatory' ? ('regulatory' as const) : ('programmatic' as const);
  const kindLabel = kindWord.toUpperCase() as SeasonalVerdict['kindLabel'];
  const outOfSeason = view.troutApplicability === 'seasonal-likely-absent';
  const yearRound = view.yearRound === true;
  const windowLabel = monthWindowLabel(view.seasonMonths ?? []);
  if (kindWord === 'programmatic') {
    const title = yearRound ? 'PROGRAMMATIC — year-round fishery' : 'PROGRAMMATIC — stocking schedule';
    const prose = `The catalog lists ${windowLabel} stocking months. A stocking schedule is a plan, not a record that fish were released or are present now. Check TWRA for current releases and fishing rules.`;
    const note = `Listed stocking months: ${windowLabel}. Dates do not establish current trout presence or a legal fishing season.`;
    return { kindWord, kindLabel, outOfSeason: false, yearRound, windowLabel, title, prose, chip: title, note };
  }
  if (outOfSeason) {
    const title = `${kindLabel} — out of season`;
    const prose =
      `The catalog documents a regulatory trout season here (${windowLabel}); the window is closed now. The gauge readings below still describe flow and temperature — verify current rules with the official source.`;
    const note = `This water's documented regulatory trout window is ${windowLabel}; it is closed now. The regional hatch calendar describes insect activity, not permission to fish or trout presence.`;
    return { kindWord, kindLabel, outOfSeason, yearRound, windowLabel, title, prose, chip: title, note };
  }
  const title = yearRound ? `${kindLabel} — year-round program` : `${kindLabel} — in season`;
  const prose = yearRound
    ? `The catalog documents trout holding here year-round — a ${kindWord} stocking program with a documented ${windowLabel} window. The gauge readings below describe current flow and temperature.`
    : `The catalog's ${kindWord} window (${windowLabel}) is open now. The gauge readings below still describe flow and temperature — verify stocking timing with the official source.`;
  const note = yearRound
    ? `The catalog documents trout here year-round (documented window ${windowLabel}). The regional hatch calendar below the surface still describes insect activity for the area.`
    : `The catalog's ${kindWord} window is ${windowLabel} — open now. The regional hatch calendar below the surface still describes insect activity; verify stocking timing with the official source.`;
  return { kindWord, kindLabel, outOfSeason, yearRound, windowLabel, title, prose, chip: title, note };
}

/** Plain-language label for the metric a surface is displaying. */
export function metricLabel(view: Pick<WaterDecisionView, 'displayMetric'>): string {
  if (view.displayMetric === 'trout-condition') return 'Trout conditions';
  if (view.displayMetric === 'fishability') return 'Fishability';
  return 'Unassessed';
}

/** Visitor-facing headline wording for the adjudicated opportunity
 * (ADR 0010 vocabulary — opportunity, never biological certainty). */
export function opportunityHeadlineText(view: Pick<WaterDecisionView, 'opportunity'>): string | null {
  const o = view.opportunity;
  if (!o) return null;
  switch (o.trout) {
    case 'year-round-trout':
      return 'Year-round trout opportunity';
    case 'seasonal-stocked-trout':
      return 'Seasonal stocked trout opportunity';
    case 'warmwater-focus':
      return 'Warmwater fishing focus';
    case 'mixed':
      return 'Mixed fishery (warmwater + stocked trout)';
    case 'unresolved':
      return 'Trout status unresolved';
  }
}

/** Short status label for list rows (browse/conditions) — the adjudicated
 * headline, or null when the water has not been adjudicated. */
export function opportunityStatusLabel(view: Pick<WaterDecisionView, 'opportunity'>): string | null {
  const o = view.opportunity;
  if (!o) return null;
  switch (o.trout) {
    case 'year-round-trout':
      return 'Year-round trout';
    case 'seasonal-stocked-trout':
      return 'Seasonal stocked';
    case 'warmwater-focus':
      return 'Warmwater focus';
    case 'mixed':
      return 'Mixed fishery';
    case 'unresolved':
      return 'Unresolved';
  }
}

/** Evidence-state chip text ("Documented · 2026", "Limited", …). */
export function opportunityEvidenceText(view: Pick<WaterDecisionView, 'opportunity'>): string | null {
  const o = view.opportunity;
  if (!o) return null;
  const stateWord =
    o.evidenceState === 'documented'
      ? 'Documented'
      : o.evidenceState === 'limited'
        ? 'Limited'
        : o.evidenceState === 'historical'
          ? 'Historical'
          : o.evidenceState === 'conflicting'
            ? 'Conflicting'
            : 'Unresolved';
  return o.asOf ? `${stateWord} · ${o.asOf}` : stateWord;
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
  if (view.troutApplicability === 'seasonal-uncertain') return opportunityStatusLabel(view) ?? 'Seasonal';
  // Adjudicated opportunity outranks the generic fallbacks on lists (ADR
  // 0010) — an unresolved verdict must stay visible as unresolved, and a
  // documented headline must not hide behind "Unassessed".
  const opportunityLabel = opportunityStatusLabel(view);
  if (opportunityLabel) return opportunityLabel;
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
      ? 'Needs data'
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

/**
 * Fishery class for the map's class-outline layer (owner direction 2026-09-10:
 * trout vs warmwater must be legible as a highlight, not just a filter).
 * `null` = unclassified — no outline, the water hasn't earned a class.
 */
export function classOutline(
  feature: Pick<RiverMapFeature, 'stream' | 'species'>,
): 'trout' | 'warmwater' | null {
  // The adjudicated opportunity controls the outline when it conflicts with
  // an older broad species tag. A reach-specific trout program on an otherwise
  // warmwater river (Red River/Billy Dunlop Park) does not recolor the whole
  // river trout. Unresolved waters earn no fishery-class outline.
  const opp = feature.stream.opportunity;
  if (opp) {
    if (opp.trout === 'warmwater-focus') return 'warmwater';
    if (opp.trout === 'unresolved') return null;
    if (feature.species === 'warmwater' && opp.trout === 'seasonal-stocked-trout' && opp.reachScope) return 'warmwater';
    return 'trout';
  }
  if (feature.species === 'warmwater') return 'warmwater';
  if (feature.species === 'trout') {
    // Uncertain calendar presence still gets the trout outline — the CLASS is
    // documented; the outline is about fishery class, not this month's fish.
    return 'trout';
  }
  return null;
}
