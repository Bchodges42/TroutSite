import { describe, expect, it } from 'vitest';
import { labelSpeciesNote, shouldShowLabel } from '../src/features/map/labelPolicy';

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
