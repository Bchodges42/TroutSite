import type { BugObservation } from './schemas/observation.js';
import type { HatchChart } from './schemas/hatchChart.js';
import type { BugTaxon } from './schemas/taxon.js';

/** Highest possible matchHatch score: 5 attribute points + 2 hatch-chart points + 1 season record. */
export const MATCH_HATCH_MAX_SCORE = 8;

export interface RankedTaxon {
  taxon: BugTaxon;
  /** Raw deterministic score; max is MATCH_HATCH_MAX_SCORE. */
  score: number;
  maxScore: number;
  /** Stable machine-readable tokens: size | tails | gills | bodyShape | bodyColor | hatchChart | seasonRecord. */
  matchedAttributes: string[];
  /** The taxon's month record lists the observed month for the observed region. */
  monthInRegion: boolean;
  /** Some hatch chart entry (region+month) lists this taxon. */
  inHatchChart: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Pure, deterministic match-the-hatch ranking (00-SHARED-CONTEXT §6). No randomness, no AI.
 *
 * Scoring (frozen in contracts-v1.0.0, transparent by design):
 *  +1 each attribute match: hook size inside the taxon's sizeRange (inclusive), tails, gills,
 *     bodyShape, bodyColor (case-insensitive against the taxon's color list)  → 0–5
 *  +2 if a HatchChart for the observed region+month lists the taxon (strong "hatching now" signal)
 *  +1 if the taxon's monthsActiveByRegion record for the observed region includes the month
 *
 * Taxa with a total score of 0 are omitted, so a fully unknown observation yields [].
 * Ties break deterministically: score desc, then commonName asc, then id asc.
 * Inputs are never mutated.
 */
export function matchHatch(
  observation: BugObservation,
  charts: HatchChart[],
  taxa: BugTaxon[],
): RankedTaxon[] {
  const chartTaxonIds = new Set(
    charts
      .filter((c) => c.regionId === observation.regionId && c.month === observation.month)
      .flatMap((c) => c.entries.map((e) => e.taxonId)),
  );

  const ranked: RankedTaxon[] = [];
  for (const taxon of taxa) {
    const matched: string[] = [];
    let score = 0;

    if (
      observation.sizeHook >= taxon.sizeRange[0] &&
      observation.sizeHook <= taxon.sizeRange[1]
    ) {
      score += 1;
      matched.push('size');
    }
    if (observation.tails === taxon.keyAttributes.tails) {
      score += 1;
      matched.push('tails');
    }
    if (observation.gills === taxon.keyAttributes.gills) {
      score += 1;
      matched.push('gills');
    }
    if (observation.bodyShape === taxon.keyAttributes.bodyShape) {
      score += 1;
      matched.push('bodyShape');
    }
    const observedColor = observation.bodyColor.trim().toLowerCase();
    if (taxon.keyAttributes.bodyColor.some((c) => c.trim().toLowerCase() === observedColor)) {
      score += 1;
      matched.push('bodyColor');
    }

    const inHatchChart = chartTaxonIds.has(taxon.id);
    if (inHatchChart) {
      score += 2;
      matched.push('hatchChart');
    }

    const months = taxon.monthsActiveByRegion[observation.regionId];
    const monthInRegion = Array.isArray(months) && months.includes(observation.month);
    if (monthInRegion) {
      score += 1;
      matched.push('seasonRecord');
    }

    if (score <= 0) continue;

    ranked.push({
      taxon,
      score,
      maxScore: MATCH_HATCH_MAX_SCORE,
      matchedAttributes: matched,
      monthInRegion,
      inHatchChart,
      confidence: score >= 6 ? 'high' : score >= 4 ? 'medium' : 'low',
    });
  }

  return ranked.sort(
    (a, b) =>
      b.score - a.score ||
      a.taxon.commonName.localeCompare(b.taxon.commonName) ||
      a.taxon.id.localeCompare(b.taxon.id),
  );
}
