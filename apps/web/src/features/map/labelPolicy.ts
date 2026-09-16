import type { SpeciesMode } from './waterDecision';

/**
 * H5 label prominence policy — the pure half of the map's DOM label pass.
 *
 * The map effect (TennesseeMap) owns markers, collision, and camera math; this
 * module owns the ONE question that changed for mode-awareness: may this water
 * wear a name right now? Keeping it pure keeps the rule testable against the
 * exact catalog truth the map joins at runtime.
 *
 * Inputs are the signals the map already has: geographic extent from
 * riverIndex.json bounds, the live zoom, selection/assessment state, the
 * species filter mode, and the set of catalog-trout waters (`troutIds`, built
 * from the same streams snapshot the map corridors use — never a second fetch,
 * never a guess for waters whose species the catalog leaves unset).
 */

/** Waters this large earn a statewide title (major rivers and lakes). */
export const MAJOR_EXTENT = 0.3;
/** Waters at least this large may title on approach (mid-size rivers). */
export const MINOR_EXTENT = 0.05;
/** Zoom where mid-size waters become nameable. */
export const APPROACH_ZOOM = 8.5;
/** Zoom where pocket waters become nameable. */
export const LOCAL_ZOOM = 9.5;

/**
 * Owner complaint 2026-09-16 ("major lakes render as dim unlabeled grey
 * shapes in the default trout mode"): a FEATURED anchor water the catalog
 * cannot verify as trout — the major reservoirs — may still say its name in
 * trout mode, but only as a subordinate (dim, small) label that never reads
 * as a trout claim. The aria/title words stay honest via labelSpeciesNote
 * ("Warmwater"/"Unverified"). Flip to false to restore corridor-only silence
 * for non-trout featured waters.
 */
export const FEATURED_ANCHOR_SUBORDINATE_LABELS = true;

export type LabelWater = {
  id: string;
  /** Catalog species for this water; absent means the catalog does not say. */
  species?: 'trout' | 'warmwater';
  /** Authored prominence tier. Missing keeps the pre-campaign extent policy for old fixtures. */
  display?: 'featured' | 'standard' | 'reference';
};

export type LabelGateContext = {
  /** Species filter mode — the values RiverMapPage reads from ?species=. */
  mode: SpeciesMode;
  /** Waters the catalog lists with species: trout (authoritative, no guessing). */
  troutIds: ReadonlySet<string>;
  /** max(width, height) of the water's index bounds, in degrees. */
  extent: number;
  /** Current map zoom. */
  zoom: number;
  /** Optional cataloged visibility tier; membership and prominence are separate. */
  labelMinZoom?: number;
  selected: boolean;
  assessed: boolean;
  /** Seasonal decision says the water is absent for the selected month. */
  seasonalAbsent?: boolean;
};

/**
 * How a water may present its name right now:
 * - 'titled' — a full-prominence name label.
 * - 'subordinate' — a name label styled below the map's trout story (dim,
 *   small): the water is a statewide anchor the visitor should be able to
 *   name, but it makes no trout claim in trout mode.
 * - 'hidden' — corridor/dot only.
 */
export type LabelVerdict = 'hidden' | 'subordinate' | 'titled';

/**
 * May this water show its name label, and at what prominence?
 *
 * - Selected always shows: the user navigated here on purpose, and the label
 *   carries the honest species note (see labelSpeciesNote) in every mode.
 * - Trout mode: ONLY catalog-trout waters earn a full title, and only by the
 *   same prominence gates as before (major statewide, mid-size on approach,
 *   pocket waters local, assessed anytime). Warmwater and unknown-species
 *   waters render corridor/dot only — an unverified water is never presented
 *   as trout by wearing a title in the trout filter. EXCEPTION (see
 *   FEATURED_ANCHOR_SUBORDINATE_LABELS): a featured anchor water stays
 *   nameable as a subordinate label — the major reservoirs are geography a
 *   first-paint map must be able to name even before their species is
 *   verified; they never borrow trout styling or trout vocabulary.
 * - All-fish mode: the mode makes no trout claim, so large waters of ANY
 *   species (including unknown) title statewide; small waters stay gated by
 *   zoom/assessment exactly as before.
 */
export function labelDecision(water: LabelWater, ctx: LabelGateContext): LabelVerdict {
  if (ctx.selected) return 'titled';
  if (ctx.seasonalAbsent) return 'hidden';
  // In trout mode a non-trout or unverified water never earns a full title —
  // not by prominence, not by assessment (assessedIds only contains confirmed
  // trout, but the policy stays honest on its own terms).
  if (ctx.mode === 'trout' && !ctx.troutIds.has(water.id)) {
    if (water.display === 'featured' && FEATURED_ANCHOR_SUBORDINATE_LABELS) return 'subordinate';
    return 'hidden';
  }
  // Explicit authored label tiers (selectable-river expansion) win when set;
  // the display-tier + extent heuristics govern every other water.
  if (ctx.labelMinZoom != null) return ctx.zoom >= ctx.labelMinZoom || ctx.assessed ? 'titled' : 'hidden';
  if (water.display === 'reference') return 'hidden';
  if (water.display === 'featured') return 'titled';
  if (water.display === 'standard') return ctx.zoom >= LOCAL_ZOOM ? 'titled' : 'hidden';
  const zoomGate = ctx.extent >= MINOR_EXTENT ? ctx.zoom >= APPROACH_ZOOM : ctx.zoom >= LOCAL_ZOOM;
  return ctx.extent >= MAJOR_EXTENT || zoomGate || ctx.assessed ? 'titled' : 'hidden';
}

/**
 * Boolean form of labelDecision for callers that only need visibility
 * (subordinate labels ARE visible).
 */
export function shouldShowLabel(water: LabelWater, ctx: LabelGateContext): boolean {
  return labelDecision(water, ctx) !== 'hidden';
}

export type LabelSpeciesNote = 'Warmwater' | 'Unverified' | null;

/**
 * Species word appended to a label's aria/title so the text never implies a
 * trout claim the catalog does not make. Confirmed trout is the app's default
 * vocabulary and takes no note; warmwater says so; a water whose species the
 * catalog leaves unset reads "Unverified" (the same word the index rows use).
 */
export function labelSpeciesNote(
  water: LabelWater,
  ctx: Pick<LabelGateContext, 'troutIds'>,
): LabelSpeciesNote {
  const species = water.species ?? (ctx.troutIds.has(water.id) ? 'trout' : undefined);
  if (species === 'warmwater') return 'Warmwater';
  if (species == null) return 'Unverified';
  return null;
}
