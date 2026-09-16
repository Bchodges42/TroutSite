import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { labelDecision, labelSpeciesNote, shouldShowLabel } from '../src/features/map/labelPolicy';

const INDEX_DIR = dirname(fileURLToPath(import.meta.url));
const riverIndex = JSON.parse(readFileSync(join(INDEX_DIR, '../src/features/map/riverIndex.json'), 'utf8')) as { id: string }[];

const FEATURED_IDS = [
  'boone-tailwater', 'caney-fork-river', 'clinch-river', 'duck-river-tailwater', 'elk-river',
  'french-broad-river', 'ft-patrick-henry-tailwater', 'hiwassee-river', 'obey-river',
  'parksville-tailwater', 'south-holston-river', 'watauga-river', 'norris-lake', 'cherokee-lake',
  'douglas-lake', 'watts-bar-lake', 'fort-loudoun-lake', 'chickamauga-lake', 'old-hickory-lake',
  'j-percy-priest-lake', 'tims-ford-lake', 'center-hill-lake', 'dale-hollow-lake', 'kentucky-lake',
  'lake-barkley', 'south-holston-lake', 'pickwick-lake', 'tellico-lake', 'boone-lake', 'watauga-lake',
  'reelfoot-lake', 'cumberland-river', 'tennessee-river', 'mississippi-river', 'duck-river-lower',
  'buffalo-river', 'obed-river', 'duck-river-mouth',
] as const;
const REFERENCE_IDS = [
  'beech-lake', 'cameron-brown-lake', 'covington-fbc-pond', 'edmund-orgill-lake', 'johnson-park-lake',
  'lake-graham', 'martin-city-pond', 'milan-city-pond', 'paris-city-park-lake', 'shelby-farms-lake',
  'union-city-reelfoot-pond', 'valentine-park-pond', 'yale-road-park-lake', 'wilbur-lake',
  'ocoee-number-three-lake', 'sinking-creek-wilson',
] as const;

/**
 * The catalog-truth stand-in the map joins at runtime: species come from the
 * streams snapshot the app already loads (never guessed for unset waters).
 */
const TROUT_IDS = new Set(['holston-river', 'daddys-creek', 'south-holston-river']);

function ctx(overrides: Partial<Parameters<typeof shouldShowLabel>[1]> = {}) {
  return {
    mode: 'trout' as const,
    troutIds: TROUT_IDS,
    extent: 0.02,
    zoom: 10,
    selected: false,
    assessed: false,
    ...overrides,
  };
}

describe('labelPolicy.shouldShowLabel (H5 mode-aware label hierarchy)', () => {
  it('titles major trout waters statewide in trout mode', () => {
    expect(
      shouldShowLabel({ id: 'holston-river', species: 'trout' }, ctx({ extent: 0.31, zoom: 5 })),
    ).toBe(true);
  });

  it('gives a major warmwater water a SUBORDINATE label in trout mode, full title in all-fish mode', () => {
    const water = { id: 'buffalo-river', species: 'warmwater' as const, display: 'featured' as const };
    // Featured anchors stay nameable in trout mode (owner complaint 2026-09-16:
    // major waters must not render as silent grey shapes) — but subordinate.
    expect(labelDecision(water, ctx({ extent: 0.4, zoom: 6 }))).toBe('subordinate');
    expect(shouldShowLabel(water, ctx({ extent: 0.4, zoom: 6 }))).toBe(true);
    expect(shouldShowLabel(water, ctx({ extent: 0.4, zoom: 6, mode: 'all' }))).toBe(true);
    // A NON-featured warmwater water keeps the old silence.
    expect(
      shouldShowLabel({ id: 'harpeth-river', species: 'warmwater' }, ctx({ extent: 0.4, zoom: 6 })),
    ).toBe(false);
  });

  it('never gives an unknown-species water a FULL title in trout mode; featured anchors go subordinate', () => {
    // species unset — the catalog does not say, and the policy never guesses:
    // a featured anchor reads subordinate (dim, honest "Unverified" note).
    const featured = { id: 'cumberland-river', display: 'featured' as const };
    expect(labelDecision(featured, ctx({ extent: 0.45, zoom: 6 }))).toBe('subordinate');
    expect(shouldShowLabel(featured, ctx({ extent: 0.45, zoom: 6, mode: 'all' }))).toBe(true);
    // A SMALL unknown water in all-fish mode keeps the unchanged zoom gates:
    // it titles once the local zoom opens, like any other small water.
    expect(
      shouldShowLabel({ id: 'cumberland-river' }, ctx({ extent: 0.02, zoom: 9.4, mode: 'all' })),
    ).toBe(false);
    expect(
      shouldShowLabel({ id: 'cumberland-river' }, ctx({ extent: 0.02, zoom: 9.5, mode: 'all' })),
    ).toBe(true);
    // And a small NON-featured unknown water stays corridor-only in trout mode.
    expect(
      shouldShowLabel({ id: 'some-creek' }, ctx({ extent: 0.02, zoom: 9.5 })),
    ).toBe(false);
  });

  it('keeps small-waters gates unchanged in both modes', () => {
    const pocket = { id: 'daddys-creek', species: 'trout' as const };
    // Pocket water (extent < 0.05): local zoom only.
    expect(shouldShowLabel(pocket, ctx({ extent: 0.02, zoom: 9.4 }))).toBe(false);
    expect(shouldShowLabel(pocket, ctx({ extent: 0.02, zoom: 9.5 }))).toBe(true);
    // Mid-size water (0.05 ≤ extent < 0.3): approach zoom.
    expect(shouldShowLabel(pocket, ctx({ extent: 0.12, zoom: 8.4 }))).toBe(false);
    expect(shouldShowLabel(pocket, ctx({ extent: 0.12, zoom: 8.5 }))).toBe(true);
    // The same gates in all-fish mode for a small trout water.
    expect(shouldShowLabel(pocket, ctx({ extent: 0.02, zoom: 9.4, mode: 'all' }))).toBe(false);
    expect(shouldShowLabel(pocket, ctx({ extent: 0.02, zoom: 9.5, mode: 'all' }))).toBe(true);
  });

  it('uses an explicit label tier without changing selectability', () => {
    const water = { id: 'falling-water-river' };
    expect(
      shouldShowLabel(water, ctx({ mode: 'all', extent: 0.6, zoom: 8.4, labelMinZoom: 8.5 })),
    ).toBe(false);
    expect(
      shouldShowLabel(water, ctx({ mode: 'all', extent: 0.6, zoom: 8.5, labelMinZoom: 8.5 })),
    ).toBe(true);
  });

  it('shows an assessed small trout water at any zoom, in either mode', () => {
    const water = { id: 'daddys-creek', species: 'trout' as const };
    expect(shouldShowLabel(water, ctx({ extent: 0.02, zoom: 5, assessed: true }))).toBe(true);
    expect(
      shouldShowLabel(water, ctx({ extent: 0.02, zoom: 5, assessed: true, mode: 'all' })),
    ).toBe(true);
  });

  it('always titles the selected water — with honest species naming, not a trout claim', () => {
    const warm = { id: 'harpeth-river', species: 'warmwater' as const };
    expect(shouldShowLabel(warm, ctx({ extent: 0.02, zoom: 5, selected: true }))).toBe(true);
    const unknown = { id: 'some-creek' };
    expect(shouldShowLabel(unknown, ctx({ extent: 0.02, zoom: 5, selected: true }))).toBe(true);
    // And selection does not conjure a title for a non-selected water.
    expect(shouldShowLabel(warm, ctx({ extent: 0.02, zoom: 5 }))).toBe(false);
  });
});

describe('labelPolicy.labelDecision (featured-anchor subordinate treatment, 2026-09-16 complaint)', () => {
  it('labels the unverified major lake subordinate at statewide zoom in trout mode', () => {
    // Watts Bar: display featured, species UNSET — the exact first-paint
    // complaint. It must say its name (dim) rather than render as a silent
    // grey shape, without ever implying trout.
    const lake = { id: 'watts-bar-lake', display: 'featured' as const };
    expect(labelDecision(lake, ctx({ extent: 0.5, zoom: 5.7 }))).toBe('subordinate');
    expect(labelDecision(lake, ctx({ extent: 0.5, zoom: 9.5 }))).toBe('subordinate');
  });

  it('selection restores full prominence over the subordinate treatment', () => {
    const lake = { id: 'watts-bar-lake', display: 'featured' as const };
    expect(labelDecision(lake, ctx({ extent: 0.5, zoom: 5.7, selected: true }))).toBe('titled');
  });

  it('seasonal absence still hides a featured anchor label', () => {
    const lake = { id: 'tellico-lake', display: 'featured' as const };
    expect(labelDecision(lake, ctx({ extent: 0.4, zoom: 6, seasonalAbsent: true }))).toBe('hidden');
    expect(labelDecision(lake, ctx({ extent: 0.4, zoom: 6, seasonalAbsent: true, selected: true }))).toBe('titled');
  });

  it('a warmwater major river goes subordinate in trout mode but never borrows trout styling', () => {
    // The subordinate verdict is for the MAP to style dim; the species note
    // stays honest ("Warmwater") so the label never reads as a trout claim.
    const river = { id: 'obed-river', species: 'warmwater' as const, display: 'featured' as const };
    expect(labelDecision(river, ctx({ extent: 0.35, zoom: 5.7 }))).toBe('subordinate');
    expect(labelSpeciesNote(river, { troutIds: TROUT_IDS })).toBe('Warmwater');
  });
});

describe('labelPolicy.labelSpeciesNote (honest aria/title words)', () => {
  it('takes no note for confirmed trout', () => {
    expect(
      labelSpeciesNote({ id: 'holston-river', species: 'trout' }, { troutIds: TROUT_IDS }),
    ).toBeNull();
  });

  it('says Warmwater for warmwater waters', () => {
    expect(
      labelSpeciesNote({ id: 'harpeth-river', species: 'warmwater' }, { troutIds: TROUT_IDS }),
    ).toBe('Warmwater');
  });

  it('says Unverified when the catalog leaves species unset', () => {
    expect(labelSpeciesNote({ id: 'some-creek' }, { troutIds: TROUT_IDS })).toBe('Unverified');
  });
});

describe('authored map display tiers', () => {
  it('covers the complete real river index with the campaign 38/136/16 assignment (expansion waters ride labelMinZoom)', () => {
    const indexIds = new Set(riverIndex.map((r) => r.id));
    const featured = new Set(FEATURED_IDS);
    const reference = new Set(REFERENCE_IDS);
    expect(FEATURED_IDS).toHaveLength(38);
    expect(REFERENCE_IDS).toHaveLength(16);
    expect(FEATURED_IDS.length + REFERENCE_IDS.length).toBeLessThan(riverIndex.length);
    expect(new Set([...FEATURED_IDS, ...REFERENCE_IDS]).size).toBe(54);
    expect([...featured, ...reference].every((id) => indexIds.has(id))).toBe(true);
    expect(riverIndex.length - featured.size - reference.size).toBe(136);
  });

  it('titles 38 featured waters statewide/approach and admits 136 standard waters locally', () => {
    const standardIds = riverIndex
      .map((r) => r.id)
      .filter((id) => !FEATURED_IDS.includes(id as (typeof FEATURED_IDS)[number]) && !REFERENCE_IDS.includes(id as (typeof REFERENCE_IDS)[number]));
    const waters = [
      ...FEATURED_IDS.map((id) => ({ id, display: 'featured' as const })),
      ...standardIds.map((id) => ({ id, display: 'standard' as const })),
      ...REFERENCE_IDS.map((id) => ({ id, display: 'reference' as const })),
    ];
    const titleAt = (zoom: number) => waters.filter((water) => shouldShowLabel(water, ctx({ mode: 'all', zoom }))).length;
    expect(titleAt(5)).toBe(38);
    expect(titleAt(8.5)).toBe(38);
    expect(titleAt(9.5)).toBe(174);
    expect(waters.filter((water) => water.display === 'standard' && shouldShowLabel(water, ctx({ mode: 'all', zoom: 9.5 })))).toHaveLength(136);
  });

  it('suppresses an out-of-season auto-title while preserving explicit selection', () => {
    const water = { id: 'watauga-river', display: 'featured' as const, species: 'trout' as const };
    expect(shouldShowLabel(water, ctx({ mode: 'all', zoom: 5, seasonalAbsent: true }))).toBe(false);
    expect(shouldShowLabel(water, ctx({ mode: 'all', zoom: 5, seasonalAbsent: true, selected: true }))).toBe(true);
  });
});
