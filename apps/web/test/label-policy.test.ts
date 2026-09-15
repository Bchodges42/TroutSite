import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { labelSpeciesNote, shouldShowLabel } from '../src/features/map/labelPolicy';

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
  'buffalo-river', 'obed-river',
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

  it('hides a major warmwater water in trout mode but titles it in all-fish mode', () => {
    const water = { id: 'buffalo-river', species: 'warmwater' as const };
    expect(shouldShowLabel(water, ctx({ extent: 0.4, zoom: 6 }))).toBe(false);
    expect(shouldShowLabel(water, ctx({ extent: 0.4, zoom: 6, mode: 'all' }))).toBe(true);
  });

  it('never titles an unknown-species water in trout mode, majors only in all-fish mode', () => {
    // species unset — the catalog does not say, and the policy never guesses.
    const water = { id: 'cumberland-river' };
    expect(shouldShowLabel(water, ctx({ extent: 0.45, zoom: 6 }))).toBe(false);
    expect(shouldShowLabel(water, ctx({ extent: 0.45, zoom: 6, mode: 'all' }))).toBe(true);
    // A SMALL unknown water in all-fish mode keeps the unchanged zoom gates:
    // it titles once the local zoom opens, like any other small water.
    expect(
      shouldShowLabel({ id: 'cumberland-river' }, ctx({ extent: 0.02, zoom: 9.4, mode: 'all' })),
    ).toBe(false);
    expect(
      shouldShowLabel({ id: 'cumberland-river' }, ctx({ extent: 0.02, zoom: 9.5, mode: 'all' })),
    ).toBe(true);
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
  it('covers the complete real river index with the campaign 37/136/16 assignment (expansion waters ride labelMinZoom)', () => {
    const indexIds = new Set(riverIndex.map((r) => r.id));
    const featured = new Set(FEATURED_IDS);
    const reference = new Set(REFERENCE_IDS);
    expect(FEATURED_IDS).toHaveLength(37);
    expect(REFERENCE_IDS).toHaveLength(16);
    expect(FEATURED_IDS.length + REFERENCE_IDS.length).toBeLessThan(riverIndex.length);
    expect(new Set([...FEATURED_IDS, ...REFERENCE_IDS]).size).toBe(53);
    expect([...featured, ...reference].every((id) => indexIds.has(id))).toBe(true);
    expect(riverIndex.length - featured.size - reference.size).toBe(136);
  });

  it('titles 37 featured waters statewide/approach and admits 136 standard waters locally', () => {
    const standardIds = riverIndex
      .map((r) => r.id)
      .filter((id) => !FEATURED_IDS.includes(id as (typeof FEATURED_IDS)[number]) && !REFERENCE_IDS.includes(id as (typeof REFERENCE_IDS)[number]));
    const waters = [
      ...FEATURED_IDS.map((id) => ({ id, display: 'featured' as const })),
      ...standardIds.map((id) => ({ id, display: 'standard' as const })),
      ...REFERENCE_IDS.map((id) => ({ id, display: 'reference' as const })),
    ];
    const titleAt = (zoom: number) => waters.filter((water) => shouldShowLabel(water, ctx({ mode: 'all', zoom }))).length;
    expect(titleAt(5)).toBe(37);
    expect(titleAt(8.5)).toBe(37);
    expect(titleAt(9.5)).toBe(173);
    expect(waters.filter((water) => water.display === 'standard' && shouldShowLabel(water, ctx({ mode: 'all', zoom: 9.5 })))).toHaveLength(136);
  });

  it('suppresses an out-of-season auto-title while preserving explicit selection', () => {
    const water = { id: 'watauga-river', display: 'featured' as const, species: 'trout' as const };
    expect(shouldShowLabel(water, ctx({ mode: 'all', zoom: 5, seasonalAbsent: true }))).toBe(false);
    expect(shouldShowLabel(water, ctx({ mode: 'all', zoom: 5, seasonalAbsent: true, selected: true }))).toBe(true);
  });
});
