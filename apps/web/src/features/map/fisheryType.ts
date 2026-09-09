/**
 * Fishery-type classification — the pure derivation behind the legend's
 * water-class grouping (the state that replaces condition bands when the
 * conditions feed carries no assessments).
 *
 * The catalog's own words stay the source of truth, exactly as in
 * waterDecision.ts: a row name is only earned by explicit fields, and a water
 * the catalog does not describe stays `unknown` — counted honestly or omitted,
 * never guessed into a prettier class.
 */

export type FisheryType = 'tailwater' | 'wild' | 'stocked' | 'other' | 'unknown';

/** Only the catalog fields the classification reads. */
export type FisheryTypeFields = {
  /** Canonical catalog classification (session-1 attribute) — wins when set. */
  fishery?: 'wild' | 'stocked' | 'tailwater' | null;
  waterbodyType?: string | null;
  species?: 'trout' | 'warmwater' | null;
  stockingProgram?: boolean | null;
};

export type FisheryTypeCounts = Record<FisheryType, number>;

/**
 * Classify one water from catalog fields.
 *
 * - tailwater: the catalog types the water as a dam-release tailrace.
 * - wild: species AND stocking program both explicit — trout, never stocked.
 * - stocked: the catalog documents a stocking program (trout or the few
 *   warmwater waters with winter trout stocking).
 * - other: a fully-described water that is none of the named classes
 *   (warmwater rivers, unprogrammed waters, major lakes).
 * - unknown: no fields at all — there is nothing honest to claim.
 */
export function fisheryType(fields: FisheryTypeFields): FisheryType {
  const { fishery, waterbodyType, species, stockingProgram } = fields;
  // The catalog's own classification is authoritative when the evidence has
  // reached; the derived rules below only serve waters it has not yet covered.
  if (fishery === 'tailwater' || fishery === 'wild' || fishery === 'stocked') return fishery;
  if (waterbodyType === 'tailrace') return 'tailwater';
  // Both parts must be explicit: a missing stockingProgram is never read as
  // "wild", and a missing species is never read as trout.
  if (species === 'trout' && stockingProgram === false) return 'wild';
  if (stockingProgram === true) return 'stocked';
  if (waterbodyType != null || species != null || stockingProgram != null) return 'other';
  return 'unknown';
}

/** Product wording for each class — matches the legend grouping rows. */
export const FISHERY_TYPE_LABELS: Record<FisheryType, string> = {
  tailwater: 'Tailwater',
  wild: 'Wild trout',
  stocked: 'Stocked',
  other: 'Other fish waters',
  unknown: 'Unclassified',
};

/** Count every water into its class — the legend grouping's honest numbers. */
export function fisheryTypeCounts(streams: Iterable<FisheryTypeFields>): FisheryTypeCounts {
  const counts: FisheryTypeCounts = { tailwater: 0, wild: 0, stocked: 0, other: 0, unknown: 0 };
  for (const stream of streams) counts[fisheryType(stream)] += 1;
  return counts;
}
