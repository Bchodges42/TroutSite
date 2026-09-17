import { describe, expect, it } from 'vitest';
import {
  coreName,
  countiesOf,
  eventsFromGeojson,
  normalizeName,
  parseFeedSpecies,
  programMonths,
  resolveEvent,
  normCounty,
  loadCatalog,
  ALIASES,
} from '../scripts/classification/lib.mjs';

const catalog = loadCatalog();

describe('event derivation', () => {
  it('maps TWRA program labels to months, unpinned otherwise', () => {
    expect(programMonths('Winter')).toEqual([12, 1, 2]);
    expect(programMonths('Spring')).toEqual([3, 4, 5]);
    expect(programMonths('Tailwater')).toBeNull();
    expect(programMonths('Reservoir')).toBeNull();
  });

  it('parses feed species codes and rejects junk', () => {
    expect(parseFeedSpecies('rainbow_brown')).toEqual(['brown', 'rainbow']);
    expect(parseFeedSpecies('Rainbow')).toEqual(['rainbow']);
    expect(parseFeedSpecies('brook_brown_rainbow')).toEqual(['brook', 'brown', 'rainbow']);
    expect(parseFeedSpecies('stream')).toEqual([]);
    expect(parseFeedSpecies(undefined)).toEqual([]);
  });

  it('keys events on the stream field, not the access-site name', () => {
    const fc = {
      features: [
        { properties: { site: 'Pumphouse', stream: 'Little Buffalo River', county: 'Lawrence', program: 'Spring', class: 'stream', species: 'rainbow' }, geometry: { coordinates: [-87.5, 35.4] } },
        { properties: { site: 'Boat Ramp', stream: 'Little Buffalo River', county: 'Lawrence', program: 'Spring', class: 'stream', species: 'rainbow' }, geometry: { coordinates: [-87.51, 35.38] } },
      ],
    };
    const { events } = eventsFromGeojson(fc as never);
    expect(events).toHaveLength(1);
    expect(events[0].water).toBe('Little Buffalo River');
    expect(events[0].points).toBe(2);
    expect(events[0].accessSites).toContain('Pumphouse');
  });
});

describe('name normalization', () => {
  it('strips parentheticals, markers, and expands compass abbreviations', () => {
    expect(normalizeName('Harpeth River (Williamson County reaches)')).toBe('harpeth river');
    expect(normalizeName('Puncheon Camp Creek #1')).toBe('puncheon camp creek');
    expect(normalizeName('W. Prong Little Pigeon River')).toBe('west prong little pigeon river');
    expect(normalizeName('The Mill Pond')).toBe('mill pond');
  });

  it('keeps type words (they disambiguate Mill Creek vs Mill Pond)', () => {
    expect(normalizeName('Mill Creek')).not.toBe(normalizeName('Mill Pond'));
  });

  it('strips type words only for the county-gated core fallback', () => {
    expect(coreName('South Holston Tailwater')).toBe('south holston');
    expect(coreName('South Holston River')).toBe('south holston');
  });

  it('compares counties space-insensitively (feed "Vanburen")', () => {
    expect(normCounty('Van Buren')).toBe(normCounty('Vanburen'));
  });
});

describe('entity resolution (ambiguous joins queue, never guess)', () => {
  it('matches an exact unique name', () => {
    const r = resolveEvent({ water: 'Salt Lick Creek', site: 'x', county: 'Macon', program: 'Spring' }, catalog, ALIASES);
    expect(r).toMatchObject({ slug: 'salt-lick-creek', how: 'name' });
  });

  it('narrows same-named waters by county', () => {
    const r = resolveEvent({ water: 'Cane Creek', site: 'x', county: 'Vanburen', program: 'Spring' }, catalog, ALIASES);
    expect(r).toMatchObject({ slug: 'cane-creek', how: 'name+county' });
  });

  it('queues the Mill Creek (Hickman) false positive instead of guessing', () => {
    const r = resolveEvent({ water: 'Mill Creek', site: 'Mill Creek', county: 'Hickman', program: 'Spring' }, catalog, ALIASES);
    expect(r.slug).toBeNull();
    expect(r.how).toBe('ambiguous');
  });

  it('resolves documented identity corrections via aliases', () => {
    const r = resolveEvent({ water: 'Puncheon Camp Creek #1', site: 'x', county: 'Grainger', program: 'Spring' }, catalog, ALIASES);
    expect(r).toMatchObject({ slug: 'puncheon-camp-creek', how: 'alias' });
  });

  it('uses the county-gated core-name fallback for TWRA naming conventions', () => {
    const r = resolveEvent({ water: 'South Holston Tailwater', site: 'x', county: 'Sullivan', program: 'Tailwater' }, catalog, ALIASES);
    expect(r).toMatchObject({ slug: 'south-holston-river', how: 'core+county', confidence: 'medium' });
  });

  it('returns counties arrays normalized', () => {
    const doc = catalog.find((w) => w.slug === 'cane-creek')!.doc;
    expect(countiesOf(doc)).toContain('vanburen');
  });
});
