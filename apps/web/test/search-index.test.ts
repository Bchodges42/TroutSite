import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import {
  buildEntries,
  levenshtein,
  match,
  normalizeText,
  normalizeToken,
  type SearchEntryInput,
} from '../src/features/search/searchIndex';
import { regionName } from '../src/data/regions';
import pack from '../public/content-pack/streams.json';
import { RiverSearch } from '../src/features/map/RiverSearch';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Real catalog rows (names/aliases/counties verbatim from
 *  packages/content/streams/tn) so every assertion hits a true water. */
const CATALOG: SearchEntryInput[] = [
  {
    id: 'wolf-river-west-tennessee',
    name: 'Wolf River',
    regionId: 'tn-west',
    regionLabel: 'West TN — Winter Trout',
    counties: ['Shelby'],
    waterbodyType: 'river',
  },
  {
    id: 'wolf-river-fentress',
    name: 'Wolf River (Fentress County headwaters)',
    aliases: ['Wolf River'],
    regionId: 'tn-upper-cumberland',
    regionLabel: 'Upper Cumberland',
    counties: ['Fentress'],
    waterbodyType: 'creek',
  },
  {
    id: 'piney-river-hickman',
    name: 'Piney River (Hickman County)',
    aliases: ['Piney River'],
    regionId: 'tn-middle-duck-elk',
    regionLabel: 'Middle TN — Duck & Elk',
    counties: ['Hickman'],
    waterbodyType: 'river',
  },
  {
    id: 'piney-river-rhea',
    name: 'Piney River (Rhea County)',
    regionId: 'tn-se-hiwassee',
    regionLabel: 'Southeast TN — Hiwassee',
    counties: ['Rhea'],
    waterbodyType: 'river',
  },
  {
    id: 'caney-fork-river',
    name: 'Caney Fork River (Center Hill tailwater)',
    regionId: 'tn-middle-caney-fork',
    regionLabel: 'Middle TN — Caney Fork',
    counties: ['DeKalb'],
    waterbodyType: 'tailrace',
  },
  {
    id: 'caney-fork-upper',
    name: 'Caney Fork River (above Center Hill Lake)',
    regionId: 'tn-middle-caney-fork',
    regionLabel: 'Middle TN — Caney Fork',
    counties: ['Cumberland', 'DeKalb'],
    waterbodyType: 'river',
  },
  {
    id: 'collins-river',
    name: 'Collins River',
    regionId: 'tn-middle-caney-fork',
    regionLabel: 'Middle TN — Caney Fork',
    counties: ['Warren'],
    waterbodyType: 'river',
  },
  {
    id: 'buffalo-creek-grainger',
    name: 'Buffalo Creek (Grainger County)',
    regionId: 'tn-east-holston',
    regionLabel: 'East TN — Holston Tailwaters',
    counties: ['Grainger'],
    waterbodyType: 'creek',
  },
  {
    id: 'boone-tailwater',
    name: 'Boone Tailwater (South Fork Holston River)',
    regionId: 'tn-east-holston',
    regionLabel: 'East TN — Holston Tailwaters',
    counties: ['Sullivan'],
    waterbodyType: 'tailrace',
  },
  {
    id: 'north-fork-holston-river',
    name: 'North Fork Holston River',
    regionId: 'tn-east-holston',
    regionLabel: 'East TN — Holston Tailwaters',
    waterbodyType: 'river',
    allFishOnly: true,
  },
  {
    id: 'norris-lake',
    name: 'Norris Lake',
    regionId: 'tn-east-clinch',
    regionLabel: 'East TN — Clinch & Powell',
    waterbodyType: 'lake',
    allFishOnly: true,
  },
  {
    id: 'martin-city-pond',
    name: 'Martin City Pond',
    regionId: 'tn-west',
    regionLabel: 'West TN — Winter Trout',
    waterbodyType: 'pond',
    allFishOnly: true,
  },
  {
    id: 'forked-deer-river',
    name: 'Forked Deer River',
    regionId: 'tn-west',
    regionLabel: 'West TN — Winter Trout',
    waterbodyType: 'river',
  },
  {
    id: 'duck-river-tailwater',
    name: 'Duck River (Normandy tailwater)',
    regionId: 'tn-middle-duck-elk',
    regionLabel: 'Middle TN — Duck & Elk',
    counties: ['Bedford'],
    waterbodyType: 'tailrace',
  },
  {
    id: 'duck-river-lower',
    name: 'Duck River (Shelbyville to Columbia)',
    regionId: 'tn-middle-duck-elk',
    regionLabel: 'Middle TN — Duck & Elk',
    counties: ['Bedford', 'Marshall', 'Maury'],
    waterbodyType: 'river',
  },
];

const entries = () => buildEntries(CATALOG);

describe('Search normalization', () => {
  it('expands the reviewed whole-token abbreviation map', () => {
    expect(normalizeToken('CR')).toBe('creek');
    expect(normalizeToken('rvr')).toBe('river');
    expect(normalizeToken('rvr.')).toBe('river'); // punctuation stripped first
    expect(normalizeToken('lk')).toBe('lake');
    expect(normalizeToken('pd')).toBe('pond');
    expect(normalizeToken('nf')).toBe('north fork');
    expect(normalizeToken('sf')).toBe('south fork');
    expect(normalizeToken('ef')).toBe('east fork');
    expect(normalizeToken('wf')).toBe('west fork');
    expect(normalizeToken('tw')).toBe('tailwater');
    // Real words pass through untouched — expansion is whole-token only.
    expect(normalizeToken('crab')).toBe('crab');
    expect(normalizeToken('Creek')).toBe('creek');
  });
  it('leaves the DROPPED abbreviation inert (pn)', () => {
    // 'pn' → 'pond' was reviewed and dropped: speculative shorthand with no
    // demonstrated angler use; restraint beats coverage.
    expect(normalizeToken('pn')).toBe('pn');
  });
  it('normalizes phrases token-wise, expanding abbreviations', () => {
    expect(normalizeText('Buffalo CR.')).toBe('buffalo creek');
    expect(normalizeText('Caney TW')).toBe('caney tailwater');
    expect(normalizeText('NF Holston')).toBe('north fork holston');
    expect(normalizeText('  Ducky’s   Creek ')).toBe('ducky s creek');
  });
  it('computes plain Levenshtein distance', () => {
    expect(levenshtein('piney', 'piney')).toBe(0);
    expect(levenshtein('pieny', 'piney')).toBe(2); // transposition = 2 plain edits
    expect(levenshtein('camy', 'caney')).toBe(2);
    expect(levenshtein('camy', 'piney')).toBe(4); // even at distance 4, the first-letter anchor rejects it
  });
});

describe('Search tiers', () => {
  it('returns [] for an empty or blank query', () => {
    expect(match('', entries())).toEqual([]);
    expect(match('   ', entries())).toEqual([]);
  });

  it('ranks exact identity above prefix, and never below it', () => {
    // 'Wolf River': the plain-name west TN water is an exact name; the
    // Fentress reach matches its own 'Wolf River' alias exactly too — both
    // tier 1, exact identity first, and nothing outranks them.
    const wolf = match('Wolf River', entries());
    expect(wolf[0]).toMatchObject({
      tier: 1,
      reason: 'exact-name',
      field: 'name',
      entry: expect.objectContaining({ id: 'wolf-river-west-tennessee' }),
    });
    expect(wolf[1]).toMatchObject({
      tier: 1,
      reason: 'exact-alias',
      entry: expect.objectContaining({ id: 'wolf-river-fentress' }),
    });
    for (const m of wolf) expect(m.tier).toBe(1);
  });

  it('ranks an exact alias above another reach’s name prefix', () => {
    const piney = match('Piney River', entries());
    expect(piney[0]).toMatchObject({
      tier: 1,
      reason: 'exact-alias',
      field: 'alias',
      entry: expect.objectContaining({ id: 'piney-river-hickman' }),
    });
    expect(piney[1]).toMatchObject({
      tier: 2,
      entry: expect.objectContaining({ id: 'piney-river-rhea' }),
    });
  });

  it('matches name prefixes at tier 2 with a prefix reason', () => {
    const caney = match('Caney Fork', entries());
    const prefixed = caney.filter((m) => m.tier === 2);
    expect(prefixed).toHaveLength(2);
    expect(prefixed.map((m) => m.entry.id).sort()).toEqual(
      ['caney-fork-river', 'caney-fork-upper'].sort(),
    );
    for (const m of prefixed) {
      expect(m.reason).toBe('prefix');
      expect(m.field).toBe('name');
    }
    // The region-only match (Collins River sits in the Caney Fork region)
    // ranks strictly below every name prefix.
    expect(caney.at(-1)).toMatchObject({ tier: 3, field: 'region' });
  });

  it('matches word-boundary fragments at tier 3', () => {
    const deer = match('fork deer', entries());
    expect(deer.map((m) => m.entry.id)).toContain('forked-deer-river');
    expect(deer.every((m) => m.tier >= 3)).toBe(true);
  });

  it('finds waters by region name and county, marked with the matched field', () => {
    const region = match('Hiwassee', entries());
    expect(region.length).toBeGreaterThan(0);
    expect(region[0]).toMatchObject({ tier: 3, field: 'region' });
    // DeKalb is a county of the Caney tailwater but is NOT in its name.
    const county = match('DeKalb', entries());
    expect(county.find((m) => m.entry.id === 'caney-fork-river')).toMatchObject({
      field: 'county',
      tier: 3,
    });
  });

  it('always carries a matchReason and matched field', () => {
    for (const query of ['Wolf River', 'Piney', 'Caney Fork', 'pieny', 'buffalo cr']) {
      for (const m of match(query, entries())) {
        expect(['exact-name', 'exact-alias', 'prefix', 'fuzzy']).toContain(m.reason);
        expect(['name', 'alias', 'region', 'county']).toContain(m.field);
      }
    }
  });
});

describe('Search abbreviation and typo behavior', () => {
  it('matches common angler shorthand against real catalog names', () => {
    // "Buffalo Cr" → Buffalo Creek (Grainger County), a real prefix match.
    expect(match('Buffalo Cr', entries())[0]).toMatchObject({
      entry: expect.objectContaining({ id: 'buffalo-creek-grainger' }),
    });
    // "nf holston" → North Fork Holston River via the nf expansion.
    expect(match('nf holston', entries())[0]).toMatchObject({
      entry: expect.objectContaining({ id: 'north-fork-holston-river' }),
    });
    // "boone tw" → the Boone Tailwater row; the tw expansion lands a prefix.
    expect(match('boone tw', entries())[0]).toMatchObject({
      entry: expect.objectContaining({ id: 'boone-tailwater' }),
      tier: 2,
    });
  });

  it('tolerates real typos only after exact and prefix tiers come up empty', () => {
    const pieny = match('pieny', entries());
    expect(pieny[0]).toMatchObject({
      tier: 4,
      reason: 'fuzzy',
      entry: expect.objectContaining({ id: 'piney-river-hickman' }),
    });
    const camy = match('camy', entries());
    expect(camy.map((m) => m.entry.id)).toContain('caney-fork-river');
    expect(camy.every((m) => m.reason === 'fuzzy')).toBe(true);
  });

  it('never adds fuzzy noise while exact tiers have hits', () => {
    // 'Wood River' is a distance-1 typo-neighbor of 'Wolf River', but the
    // fuzzy tier is gated: tiers 1-3 matched, so it never runs.
    const gated = buildEntries([
      ...CATALOG,
      { id: 'wood-river', name: 'Wood River', waterbodyType: 'river' },
    ]);
    const wolf = match('Wolf River', gated);
    expect(wolf.map((m) => m.entry.id)).not.toContain('wood-river');
    expect(wolf[0]?.reason).toBe('exact-name');
  });

  it('keeps the dropped abbreviation inert and short tokens fuzzy-free', () => {
    // 'pn' was dropped from the map: it must NOT reach Martin City Pond…
    expect(match('pn', entries())).toEqual([]);
    // …while the kept 'pd' still finds ponds…
    expect(match('pd', entries())[0]).toMatchObject({
      entry: expect.objectContaining({ id: 'martin-city-pond' }),
    });
    // …and sub-4-char tokens never fuzzy-match on their own.
    expect(match('xy', entries())).toEqual([]);
  });

  it('is deterministic — the same query ranks identically twice', () => {
    expect(match('caney', entries())).toEqual(match('caney', entries()));
  });
});

describe('Disambiguation metadata', () => {
  it('carries base name, reach, counties, and type for repeated names', () => {
    const ducks = buildEntries(CATALOG).filter((e) => e.baseName === 'Duck River');
    expect(ducks.map((d) => d.id)).toEqual(['duck-river-tailwater', 'duck-river-lower']);
    expect(ducks[0]).toMatchObject({
      reach: 'Normandy tailwater',
      counties: ['Bedford'],
      waterbodyType: 'tailrace',
    });
    expect(ducks[1]).toMatchObject({
      reach: 'Shelbyville to Columbia',
      counties: ['Bedford', 'Marshall', 'Maury'],
      waterbodyType: 'river',
    });
  });
});

describe('Real bundled catalog (public/content-pack/streams.json)', () => {
  // The runtime-built index from the REAL precached pack — the bundled catalog
  // IS the offline index, so the review claims above are pinned against it.
  interface PackStream {
    id: string;
    name: string;
    aliases?: string[];
    regionId: string;
    waterbodyType?: string;
    species?: string;
    hydroIdentity?: { counties?: string[] };
  }
  const PACK = (pack as { streams: PackStream[] }).streams;
  const realEntries = () =>
    buildEntries(
      PACK.map((s) => ({
        id: s.id,
        name: s.name,
        aliases: s.aliases,
        regionId: s.regionId,
        regionLabel: regionName(s.regionId),
        counties: s.hydroIdentity?.counties,
        waterbodyType: s.waterbodyType,
        allFishOnly: s.species === 'warmwater',
      })),
    );

  it('indexes the full offline catalog, 15 warmwater-only waters deep', () => {
    expect(PACK.length).toBe(190);
    expect(realEntries().filter((e) => e.allFishOnly)).toHaveLength(15);
  });

  it('keeps the dropped abbreviation and sub-short tokens inert across all 190 waters', () => {
    expect(match('pn', realEntries())).toEqual([]);
    expect(match('xy', realEntries())).toEqual([]);
  });

  it('serves angler shorthand against real catalog rows', () => {
    expect(match('nf holston', realEntries())[0]).toMatchObject({
      entry: expect.objectContaining({ id: 'north-fork-holston-river' }),
    });
    expect(match('buffalo cr', realEntries())[0]).toMatchObject({
      entry: expect.objectContaining({ id: 'buffalo-creek-grainger' }),
    });
  });

  it('tolerates real typos across the full catalog, fuzzies only', () => {
    const pieny = match('pieny', realEntries());
    expect(pieny.map((m) => m.entry.id)).toContain('piney-river-hickman');
    expect(pieny.every((m) => m.reason === 'fuzzy' && m.tier === 4)).toBe(true);
    expect(match('camy', realEntries()).map((m) => m.entry.id)).toContain('caney-fork-river');
  });

  it('disambiguates the real repeated Duck River reaches', () => {
    const ducks = match('Duck River', realEntries());
    expect(ducks).toHaveLength(3);
    expect(ducks.every((m) => m.entry.baseName === 'Duck River')).toBe(true);
    expect(ducks.every((m) => m.entry.counties.length > 0 && m.entry.waterbodyType)).toBe(true);
    expect(ducks[0]).toMatchObject({ tier: 2, reason: 'prefix' });
  });
});

describe('RiverSearch scope and commit rules', () => {
  /** The full catalog rows as RiverMapPage/AppShell pass them (Stream shape:
   *  species flags the scope; hydroIdentity carries the counties). */
  const streams = CATALOG.map((s) => ({
    id: s.id,
    name: s.name,
    aliases: s.aliases,
    regionId: s.regionId ?? 'tn-west',
    species: (s.allFishOnly ? 'warmwater' : 'trout') as 'trout' | 'warmwater',
    waterbodyType: s.waterbodyType,
    hydroIdentity: { counties: s.counties ?? [] },
  }));

  it('offers one explicit all-fish widening when the trout scope is empty', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(createElement(RiverSearch, { streams, onSelect }));
    await user.type(screen.getByRole('combobox'), 'norris');
    // Norris Lake is warmwater-only: hidden in the trout scope, but the
    // widening action says so explicitly — never an auto-switch.
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /search all fish/i }));
    expect(await screen.findByRole('option', { name: /Norris Lake/i })).toBeInTheDocument();
  });

  it('requires explicit selection for fuzzy-only results', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(createElement(RiverSearch, { streams, onSelect }));
    const input = screen.getByRole('combobox');
    await user.type(input, 'camy');
    const options = await screen.findAllByRole('option');
    expect(options[0].textContent).toContain('Caney Fork River');
    expect(options[0].textContent).toContain('similar');
    await user.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled(); // a fuzzy top result never silently commits
    await user.keyboard('{ArrowUp}{Enter}');
    // Explicit navigation commits the highlighted row — whichever reach that
    // is (localeCompare puts the "above Center Hill Lake" reach first).
    expect(onSelect).toHaveBeenCalledWith('caney-fork-upper');
  });

  it('still commits an exact prefix on Enter and shows disambiguation for repeats', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(createElement(RiverSearch, { streams, onSelect }));
    await user.type(screen.getByRole('combobox'), 'Duck River');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2); // both Duck River reaches, trout scope
    expect(options[0]).toHaveTextContent('Duck River (Normandy tailwater)');
    expect(options[0].textContent).toContain('Bedford'); // county · type line
    expect(options[0].textContent).toContain('Tailwater');
    expect(options[1].textContent).toContain('Marshall');
    expect(options[1].textContent).toContain('Maury · River');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('duck-river-tailwater');
  });
});
