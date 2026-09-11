import { describe, expect, it } from 'vitest';
import { MATCH_HATCH_MAX_SCORE, matchHatch } from '../src/index.js';
import { makeChart, makeObservation, makeTaxon } from './helpers.js';

const oliveBwo = () => makeTaxon();

describe('matchHatch', () => {
  it('scores a perfect observation at the documented maximum', () => {
    const ranked = matchHatch(makeObservation(), [makeChart()], [oliveBwo()]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.score).toBe(MATCH_HATCH_MAX_SCORE);
    expect(ranked[0]!.matchedAttributes).toEqual([
      'size',
      'tails',
      'gills',
      'bodyShape',
      'bodyColor',
      'hatchChart',
      'seasonRecord',
    ]);
    expect(ranked[0]!.confidence).toBe('high');
    expect(ranked[0]!.inHatchChart).toBe(true);
    expect(ranked[0]!.monthInRegion).toBe(true);
  });

  it('ranks attribute-only matches without chart or season evidence', () => {
    const ranked = matchHatch(
      makeObservation({ regionId: 'ok-lower-mountain-fork', month: 5 }),
      [makeChart()], // chart is for tx-hill-country / April — irrelevant here
      [oliveBwo()],
    );
    expect(ranked[0]!.score).toBe(5);
    expect(ranked[0]!.confidence).toBe('medium');
    expect(ranked[0]!.inHatchChart).toBe(false);
    expect(ranked[0]!.monthInRegion).toBe(false);
    expect(ranked[0]!.matchedAttributes).not.toContain('hatchChart');
    expect(ranked[0]!.matchedAttributes).not.toContain('seasonRecord');
  });

  it('treats the size range as inclusive at both ends', () => {
    const withTaxa = (sizeHook: number) =>
      matchHatch(makeObservation({ sizeHook }), [], [oliveBwo()])[0]?.matchedAttributes ?? [];

    expect(withTaxa(16)).toContain('size'); // minHook
    expect(withTaxa(22)).toContain('size'); // maxHook
    expect(withTaxa(15)).not.toContain('size');
    expect(withTaxa(23)).not.toContain('size');
  });

  it('matches bodyColor case-insensitively and trims whitespace', () => {
    expect(matchHatch(makeObservation({ bodyColor: 'OLIVE' }), [], [oliveBwo()])[0]!.matchedAttributes).toContain(
      'bodyColor',
    );
    expect(
      matchHatch(makeObservation({ bodyColor: '  Olive ' }), [], [oliveBwo()])[0]!.matchedAttributes,
    ).toContain('bodyColor');
    expect(
      matchHatch(makeObservation({ bodyColor: 'chartreuse' }), [], [oliveBwo()])[0]!.matchedAttributes,
    ).not.toContain('bodyColor');
  });

  it('only boosts taxa listed for the exact region and month in a hatch chart', () => {
    const boosted = matchHatch(makeObservation(), [makeChart()], [oliveBwo()]);
    expect(boosted[0]!.matchedAttributes).toContain('hatchChart');

    const otherRegion = matchHatch(makeObservation(), [makeChart({ regionId: 'ok-lower-mountain-fork' })], [
      oliveBwo(),
    ]);
    expect(otherRegion[0]!.matchedAttributes).not.toContain('hatchChart');

    const otherMonth = matchHatch(makeObservation(), [makeChart({ month: 5 })], [oliveBwo()]);
    expect(otherMonth[0]!.matchedAttributes).not.toContain('hatchChart');
  });

  it('adds the season-record point only when the observed month is listed for the region', () => {
    const january = matchHatch(makeObservation({ month: 12 }), [], [oliveBwo()]);
    expect(january[0]!.matchedAttributes).toContain('seasonRecord');

    const may = matchHatch(makeObservation({ month: 5 }), [], [oliveBwo()]);
    expect(may[0]!.matchedAttributes).not.toContain('seasonRecord');

    const unknownRegion = matchHatch(makeObservation({ regionId: 'ar-white-river' }), [], [oliveBwo()]);
    expect(unknownRegion[0]!.matchedAttributes).not.toContain('seasonRecord');
  });

  it('honors month boundaries 1 and 12', () => {
    for (const month of [1, 12]) {
      const ranked = matchHatch(makeObservation({ month }), [], [oliveBwo()]);
      expect(ranked[0]!.matchedAttributes).toContain('seasonRecord');
    }
  });

  it('returns [] for a completely unknown observation (no attribute, chart, or season match)', () => {
    const ranked = matchHatch(
      makeObservation({ sizeHook: 6, bodyColor: 'pink', tails: 2, gills: 'filaments', bodyShape: 'robust', month: 7 }),
      [],
      [oliveBwo()],
    );
    expect(ranked).toEqual([]);
  });

  it('still includes a taxon whose only signal is the season record (low confidence)', () => {
    const ranked = matchHatch(
      makeObservation({ sizeHook: 6, bodyColor: 'pink', tails: 2, gills: 'filaments', bodyShape: 'robust' }),
      [],
      [oliveBwo()],
    );
    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.score).toBe(1);
    expect(ranked[0]!.confidence).toBe('low');
  });

  it('returns [] for an empty taxa list', () => {
    expect(matchHatch(makeObservation(), [makeChart()], [])).toEqual([]);
  });

  it('sorts by score descending with a deterministic alphabetical tie-break', () => {
    const taxa = [
      makeTaxon({ id: 'z-taxa', commonName: 'Zebra Midge', sizeRange: [18, 18] }),
      makeTaxon({ id: 'a-taxa', commonName: 'Adams', sizeRange: [18, 18] }),
      makeTaxon({ id: 'm-taxa', commonName: 'Midge', sizeRange: [18, 18] }),
    ];
    const ranked = matchHatch(makeObservation(), [], taxa);
    expect(ranked.map((r) => r.taxon.commonName)).toEqual(['Adams', 'Midge', 'Zebra Midge']);
  });

  it('breaks remaining ties by taxon id', () => {
    const taxa = [
      makeTaxon({ id: 'b-dup', commonName: 'Same Name' }),
      makeTaxon({ id: 'a-dup', commonName: 'Same Name' }),
    ];
    const ranked = matchHatch(makeObservation(), [], taxa);
    expect(ranked.map((r) => r.taxon.id)).toEqual(['a-dup', 'b-dup']);
  });

  it('never mutates its inputs', () => {
    const taxa = [oliveBwo(), makeTaxon({ id: 'other', sizeRange: [10, 10] })];
    const charts = [makeChart()];
    const taxaBefore = JSON.stringify(taxa);
    const chartsBefore = JSON.stringify(charts);
    matchHatch(makeObservation(), charts, taxa);
    expect(JSON.stringify(taxa)).toBe(taxaBefore);
    expect(JSON.stringify(charts)).toBe(chartsBefore);
  });

  it('classifies confidence as high (>=6), medium (>=4) or low (<4)', () => {
    expect(matchHatch(makeObservation(), [makeChart()], [oliveBwo()])[0]!.confidence).toBe('high'); // 7+
    expect(matchHatch(makeObservation({ month: 5 }), [], [oliveBwo()])[0]!.confidence).toBe('medium'); // 5
    expect(
      matchHatch(makeObservation({ tails: 2, gills: 'filaments', bodyShape: 'robust' }), [], [oliveBwo()])[0]!
        .confidence,
    ).toBe('low'); // size + color = 2
  });
});
