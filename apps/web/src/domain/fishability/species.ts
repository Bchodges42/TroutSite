// Species-evidence classification for the fishability model.
//
// Species strings are free-form in FishabilityInput, so trout vs non-trout
// is decided lexically: explicit "trout" family markers win first, bare
// TWRA stocking codes count as trout only when the whole string matches,
// and known warmwater gamefish markers classify as non-trout. Anything
// else is "ambiguous" and never drives a not-trout or presence decision.
// [REQUIRES VALIDATION: the lexical tables in config.ts should be reviewed
// against the real catalog vocabulary (species: 'trout' | 'warmwater' and
// TWRA stocking codes).]

import { BASIS_AUTHORITY, CONFIDENCE_RANK, NON_TROUT_SPECIES_MARKERS, TROUT_BARE_SPECIES } from './config';
import type { EvidenceConfidence, SpeciesEvidence, SpeciesEvidenceBasis } from './types';

export type SpeciesClass = 'trout' | 'non-trout' | 'ambiguous';

export function classifySpecies(species: string): SpeciesClass {
  const s = species.trim().toLowerCase();
  if (/(^|\W)(trout|cutbow|cutthroat|steelhead)(\W|$)/.test(s)) return 'trout';
  if (TROUT_BARE_SPECIES.has(s)) return 'trout';
  if (NON_TROUT_SPECIES_MARKERS.some((marker) => s.includes(marker))) return 'non-trout';
  return 'ambiguous';
}

const YEAR_ROUND_BASES: ReadonlySet<SpeciesEvidenceBasis> = new Set([
  'wild-population',
  'year-round-managed',
]);

/** The strongest trout-classified evidence entry, or null. */
export function strongestTroutEvidence(
  entries: readonly SpeciesEvidence[],
): SpeciesEvidence | null {
  let best: SpeciesEvidence | null = null;
  for (const entry of entries) {
    if (classifySpecies(entry.species) !== 'trout') continue;
    if (
      best === null ||
      BASIS_AUTHORITY[entry.basis] > BASIS_AUTHORITY[best.basis] ||
      (BASIS_AUTHORITY[entry.basis] === BASIS_AUTHORITY[best.basis] &&
        CONFIDENCE_RANK[entry.confidence] > CONFIDENCE_RANK[best.confidence])
    ) {
      best = entry;
    }
  }
  return best;
}

/**
 * The strongest authoritative NON-trout evidence (wild/managed warmwater
 * population at high confidence), or null. Ambiguous species never count.
 */
export function strongestNonTroutEvidence(
  entries: readonly SpeciesEvidence[],
): SpeciesEvidence | null {
  let best: SpeciesEvidence | null = null;
  for (const entry of entries) {
    if (classifySpecies(entry.species) !== 'non-trout') continue;
    if (!YEAR_ROUND_BASES.has(entry.basis)) continue;
    if (entry.confidence !== 'high') continue;
    if (
      best === null ||
      BASIS_AUTHORITY[entry.basis] > BASIS_AUTHORITY[best.basis]
    ) {
      best = entry;
    }
  }
  return best;
}

/** Whether any trout-classified evidence exists at all (any basis). */
export function hasAnyTroutEvidence(entries: readonly SpeciesEvidence[]): boolean {
  return entries.some((entry) => classifySpecies(entry.species) === 'trout');
}

export function minConfidence(
  a: EvidenceConfidence,
  b: EvidenceConfidence,
): EvidenceConfidence {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}
