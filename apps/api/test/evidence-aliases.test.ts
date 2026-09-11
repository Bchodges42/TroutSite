import { describe, expect, it } from 'vitest';
import { baseName, catalogCounties, normalizeCounty, normalizeName, resolveWaterAlias } from '../src/evidence/aliases.js';
import type { CatalogWaterName } from '../src/evidence/aliases.js';

/** Mini-catalog mirroring the real names that make resolution hard. */
const CATALOG: CatalogWaterName[] = [
  { waterId: 'clinch-river', name: 'Clinch River (Norris tailwater)' },
  { waterId: 'duck-river-tailwater', name: 'Duck River (Normandy tailwater)' },
  { waterId: 'duck-river-lower', name: 'Duck River (Shelbyville to Columbia)' },
  { waterId: 'elk-river', name: 'Elk River (Tims Ford tailwater)' },
  { waterId: 'elk-river-lower', name: 'Elk River (Prospect to state line)' },
  { waterId: 'wolf-river-fentress', name: 'Wolf River (Fentress County headwaters)' },
  { waterId: 'wolf-river-west-tennessee', name: 'Wolf River (West Tennessee)' },
  { waterId: 'east-fork-stones-river', name: 'East Fork Stones River' },
  { waterId: 'west-fork-stones-river', name: 'West Fork Stones River' },
  { waterId: 'east-fork-shoal-creek', name: 'East Fork Shoal Creek' },
  { waterId: 'shoal-creek', name: 'Shoal Creek' },
  { waterId: 'mill-creek-overton', name: 'Mill Creek (Overton County)' },
  { waterId: 'brush-creek-cocke', name: 'Brush Creek (Cocke County)' },
  { waterId: 'barren-fork-river', name: 'Barren Fork River' },
  { waterId: 'north-prong-barren-fork', name: 'North Prong Barren Fork' },
  { waterId: 'little-sequatchie-river', name: 'Little Sequatchie River' },
  { waterId: 'sequatchie-river', name: 'Sequatchie River (headwaters)' },
  { waterId: 'cane-creek', name: 'Cane Creek' },
  { waterId: 'watauga-river', name: 'Watauga River (Wilbur tailwater)' },
];

describe('evidence: alias normalization helpers', () => {
  it('normalizes punctuation, case and whitespace away', () => {
    expect(normalizeName("Richardson 'Byrd' Creek")).toBe('richardson byrd creek');
    expect(normalizeName('Parksville(Ocoee #1) TW / Ocoee River')).toBe('parksville ocoee 1 tw ocoee river');
    expect(normalizeName('W. Prong Little Pigeon R. (Pigeon Forge)')).toBe('w prong little pigeon r pigeon forge');
  });

  it('extracts base names and county claims', () => {
    expect(baseName('Brush Creek (Cocke County)')).toBe('Brush Creek');
    expect(catalogCounties('Buffalo Creek (Grainger County)')).toEqual(['grainger']);
    expect(catalogCounties('Little River (Smokies / Blount County)')).toEqual(['blount']);
    expect(catalogCounties('Duck River (Normandy tailwater)')).toEqual([]);
  });

  it('normalizes TWRA county spellings', () => {
    expect(normalizeCounty('Grainger County')).toBe('grainger');
    expect(normalizeCounty('DeKalb')).toBe('dekalb');
    expect(normalizeCounty('Caroll')).toBe('caroll');
    expect(normalizeCounty(undefined)).toBeUndefined();
  });
});

describe('evidence: explicit alias overrides', () => {
  it('resolves dam-form TWRA names to the tailwater catalog id', () => {
    expect(resolveWaterAlias('Norris Tailwater / Clinch River', 'Claiborne', CATALOG)).toMatchObject({
      kind: 'resolved',
      waterId: 'clinch-river',
      via: 'explicit-alias',
    });
    expect(resolveWaterAlias('Wilbur Tailwater / Watauga River', 'Carter', CATALOG)).toMatchObject({
      waterId: 'watauga-river',
    });
    expect(resolveWaterAlias('Normandy TW / Duck River', 'Coffee', CATALOG)).toMatchObject({
      waterId: 'duck-river-tailwater',
    });
    expect(resolveWaterAlias('Tims Ford TW / Elk River', 'Franklin', CATALOG)).toMatchObject({
      waterId: 'elk-river',
    });
  });

  it('resolves spelling variants only through the explicit table (which wins over catalog)', () => {
    // The explicit override maps TWRA "Sulphur Fork Creek" to the catalog's
    // sulfur-fork-creek even though the mini-catalog here doesn't list it.
    expect(resolveWaterAlias('Sulphur Fork Creek', 'Robertson', CATALOG)).toMatchObject({
      kind: 'resolved',
      waterId: 'sulfur-fork-creek',
      via: 'explicit-alias',
    });
    expect(resolveWaterAlias('Whiteoak Creek', 'Coffee', CATALOG)).toMatchObject({
      waterId: 'white-oak-creek',
      via: 'explicit-alias',
    });
    // A spelling variant WITHOUT an override stays unmatched.
    expect(resolveWaterAlias('Sulphur Creek', undefined, CATALOG)).toMatchObject({ kind: 'unmatched' });
  });

  it('never matches by first word or substring', () => {
    // "W. Fork Stones River - Manson Pike Trailhead" must not hit East Fork Stones.
    const r = resolveWaterAlias('W. Fork Stones River - Manson Pike Trailhead', 'Rutherford', CATALOG);
    expect(r.kind === 'resolved' && r.waterId === 'east-fork-stones-river').toBe(false);
    // "East Fork Shoal Creek" must not match "Shoal Creek" by tail words either.
    expect(resolveWaterAlias('East Fork Shoal Creek', 'Franklin', CATALOG)).toMatchObject({
      waterId: 'east-fork-shoal-creek',
      via: 'exact-name',
    });
  });
});

describe('evidence: alias ambiguity rejection', () => {
  it('rejects bare names colliding with multiple catalog waters', () => {
    expect(resolveWaterAlias('Duck River', undefined, CATALOG)).toMatchObject({
      kind: 'ambiguous',
      candidates: ['duck-river-lower', 'duck-river-tailwater'],
    });
    expect(resolveWaterAlias('Elk River', undefined, CATALOG)).toMatchObject({ kind: 'ambiguous' });
  });

  it('disambiguates colliding names only via a county alias', () => {
    expect(resolveWaterAlias('Wolf River', 'Fentress', CATALOG)).toMatchObject({
      waterId: 'wolf-river-fentress',
      via: 'explicit-county-alias',
    });
    expect(resolveWaterAlias('Wolf River', 'Shelby', CATALOG)).toMatchObject({
      waterId: 'wolf-river-west-tennessee',
    });
    // Unknown county for a colliding name stays ambiguous — never guessed.
    expect(resolveWaterAlias('Wolf River', 'Grundy', CATALOG)).toMatchObject({ kind: 'ambiguous' });
    expect(resolveWaterAlias('Wolf River', undefined, CATALOG)).toMatchObject({ kind: 'ambiguous' });
  });

  it('refuses a match when the TWRA county contradicts the catalog county', () => {
    // TWRA's "Mill Creek" is Hickman County; the catalog's Mill Creek is Overton.
    expect(resolveWaterAlias('Mill Creek', 'Hickman', CATALOG)).toMatchObject({
      kind: 'county-mismatch',
      waterId: 'mill-creek-overton',
      rowCounty: 'hickman',
      catalogCounties: ['overton'],
    });
    // A catalog county-qualified water without a row county is not confirmable.
    expect(resolveWaterAlias('Mill Creek', undefined, CATALOG)).toMatchObject({ kind: 'county-required' });
    // Matching county confirms the match.
    expect(resolveWaterAlias('Brush Creek', 'Cocke', CATALOG)).toMatchObject({
      waterId: 'brush-creek-cocke',
      via: 'exact-name',
    });
  });

  it('leaves names with no catalog counterpart unmatched', () => {
    expect(resolveWaterAlias('Acorn Lake (Montgomery Bell SP)', 'Montgomery', CATALOG)).toMatchObject({ kind: 'unmatched' });
    expect(resolveWaterAlias('Cherokee TW / Holston River', 'Jefferson', CATALOG)).toMatchObject({ kind: 'unmatched' });
  });

  it('resolves plain full-name matches', () => {
    expect(resolveWaterAlias('Barren Fork River', undefined, CATALOG)).toMatchObject({
      waterId: 'barren-fork-river',
      via: 'exact-name',
    });
  });
});
