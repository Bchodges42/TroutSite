import { describe, expect, it } from 'vitest';
import { matchStocking, normalizeWaterName } from '../src/stockingMatch';
import { metricTimestamp } from '../src/readingFreshness';
import type { StockingEvent } from '../src/schemas/stocking';

const event = (streamName: string, date = '2026-09-01', county?: string): StockingEvent => ({
  id: streamName + date, streamName, date, county, stateId: 'TN', species: 'rainbow',
  sourceUrl: 'https://www.tn.gov/twra/fishing', fetchedAt: '2026-09-30T12:00:00Z',
});
describe('shared stocking identity and measurement clocks', () => {
  it('uses own metric clocks with legacy fallback', () => {
    const reading = { gaugeId: '12345678', timestamp: '2026-09-30T12:00:00Z', metricTimes: { tempC: '2026-09-29T12:00:00Z' } };
    expect(metricTimestamp(reading, 'tempC')).toBe('2026-09-29T12:00:00Z');
    expect(metricTimestamp(reading, 'cfs')).toBe(reading.timestamp);
  });
  it('normalizes abbreviations and decoration', () => {
    expect(normalizeWaterName('Center Hill TW / Caney Fork River*')).toBe('center hill tailwater caney fork river');
  });
  it('resolves exact, curated, county and unique containment tiers', () => {
    const streams = [{ id: 'caney-fork-river', name: 'Caney Fork River (Center Hill)' },
      { id: 'shoal', name: 'Shoal Creek', aliases: ['Shoal'] },
      { id: 'wolf-river-fentress', name: 'Wolf River (Fentress)' },
      { id: 'wolf-west', name: 'Wolf River' }];
    const result = matchStocking(streams, [event('Center Hill TW / Caney Fork River'), event('Shoal Creek'),
      event('Shoal Creek', '2026-09-02'), event('Wolf River', undefined, ' Fentress County '), event('Shoal Creek reach'), event('Unknown')]);
    expect(result.byStream.get('caney-fork-river')).toHaveLength(1);
    expect(result.byStream.get('shoal')?.map((row) => row.date)).toEqual(['2026-09-02', '2026-09-01', '2026-09-01']);
    expect(result.byStream.get('wolf-river-fentress')).toHaveLength(1);
    expect(result.byStream.has('wolf-west')).toBe(false);
    expect(result.unmatched).toBe(1);
  });
  it('never resolves a curated or county reach absent from the active catalog', () => {
    expect(matchStocking([], [event('Center Hill TW / Caney Fork River'), event('Wolf River', undefined, 'Fentress')]))
      .toMatchObject({ unmatched: 2, byStream: new Map() });
  });
  it('keeps shared aliases and ambiguous containments unmatched', () => {
    const streams = [{ id: 'a', name: 'River reach A', aliases: ['Shared'] }, { id: 'b', name: 'Little River reach', aliases: ['Shared'] }];
    expect(matchStocking(streams, [event('Shared'), event('River'), event('')]).unmatched).toBe(3);
  });
});
