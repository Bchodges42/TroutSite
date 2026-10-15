import { describe, expect, it } from 'vitest';
import {
  parseTvaClockHour,
  parseTvaGenerationReleaseReport,
  parseTvaObservations,
  parseTvaTimestamp,
  tvaReleaseBlockInterval,
} from '../src/evidence/tva-provider.js';
import { readFixture } from './helpers.js';

/**
 * Regression (data-integrity audit 2026-10-14 §1, P0): TVA started writing
 * "Noon" and "Midnight" in its time labels. Both parsers accepted only
 * "<n> AM/PM", so those rows were silently dropped — Clinch (NRST1) parsed 3
 * rows to 0 and showed "no published schedule" while ~8,050 cfs was releasing.
 * Every fixture below is a verbatim live payload captured 2026-10-14.
 */
const LIVE = ['BOOT1', 'CEHT1', 'DLHT1', 'HADT1', 'NRMT1', 'NRST1', 'SHDT1', 'TMFT1', 'WL'] as const;
const live = (id: string) => JSON.parse(readFixture(`TVA/generation-releases-${id}-2026-10-14.json`)) as unknown[];
const HOUR = 60 * 60_000;

describe('TVA Noon/Midnight labels (live 2026-10-14 payloads)', () => {
  it('parses the clock words', () => {
    expect(parseTvaClockHour('Noon')).toBe(12);
    expect(parseTvaClockHour('Midnight')).toBe(0);
    expect(parseTvaClockHour('midnight')).toBe(0);
    expect(parseTvaClockHour('12 AM')).toBe(0);
    expect(parseTvaClockHour('12 PM')).toBe(12);
    expect(parseTvaClockHour('13 PM')).toBeNull();
    expect(parseTvaClockHour('Dawn')).toBeNull();
    expect(parseTvaTimestamp('10/14/2026', 'Noon EDT')).toBe('2026-10-14T12:00:00-04:00');
    expect(parseTvaTimestamp('10/14/2026', 'Midnight CDT')).toBe('2026-10-14T00:00:00-05:00');
  });

  it.each(LIVE)('%s: every upstream release row parses (raw count = parsed count)', (id) => {
    const payload = live(id);
    const report = parseTvaGenerationReleaseReport(payload);
    expect(report.dropped).toEqual([]);
    expect(report.blocks).toHaveLength(payload.length);
    expect(report.rawRows).toBe(payload.length);
  });

  it('Clinch NRST1 3→3, South Holston SHDT1 6→6, Hiwassee HADT1 5→5', () => {
    expect(parseTvaGenerationReleaseReport(live('NRST1')).blocks).toHaveLength(3);
    expect(parseTvaGenerationReleaseReport(live('SHDT1')).blocks).toHaveLength(6);
    expect(parseTvaGenerationReleaseReport(live('HADT1')).blocks).toHaveLength(5);
  });

  it('keeps TVA labels verbatim and rolls a Midnight end into the next day', () => {
    const [first, allDay, tail] = parseTvaGenerationReleaseReport(live('NRST1')).blocks;
    expect(first).toEqual({ date: '2026-10-14', startTime: '1 AM', endTime: 'Midnight', timeZone: 'EDT', generators: '2 or more' });
    // "1 AM - Midnight" = 01:00 → 24:00 on the 14th (23 h), not 01:00 → 00:00 (negative).
    const a = tvaReleaseBlockInterval(first!);
    expect(a && new Date(a.startMs).toISOString()).toBe('2026-10-14T05:00:00.000Z');
    expect(a && new Date(a.endMs).toISOString()).toBe('2026-10-15T04:00:00.000Z');
    // "Midnight - Midnight" is TVA's all-day block: 24 h, never zero-length.
    const b = tvaReleaseBlockInterval(allDay!);
    expect(b && b.endMs - b.startMs).toBe(24 * HOUR);
    expect(b && new Date(b.startMs).toISOString()).toBe('2026-10-15T04:00:00.000Z');
    // The blocks tile with no gap: each starts where the previous one ended.
    const c = tvaReleaseBlockInterval(tail!);
    expect(a?.endMs).toBe(b?.startMs);
    expect(b?.endMs).toBe(c?.startMs);
  });

  it('a whole published day of blocks tiles contiguously (Boone, Noon in the middle)', () => {
    const blocks = parseTvaGenerationReleaseReport(live('BOOT1')).blocks;
    const intervals = blocks.map((b) => tvaReleaseBlockInterval(b));
    for (let i = 1; i < intervals.length; i += 1) {
      expect(intervals[i]?.startMs).toBe(intervals[i - 1]?.endMs);
    }
    const noon = blocks.find((b) => b.startTime === 'Noon');
    expect(noon && new Date(tvaReleaseBlockInterval(noon)!.startMs).toISOString()).toBe('2026-10-14T16:00:00.000Z');
  });

  it('Tims Ford CDT all-day zero-generation blocks are 24 h each', () => {
    for (const b of parseTvaGenerationReleaseReport(live('TMFT1')).blocks) {
      const iv = tvaReleaseBlockInterval(b);
      expect(iv && iv.endMs - iv.startMs).toBe(24 * HOUR);
      expect(b.generators).toBe('0');
    }
  });

  it('reports unparseable rows instead of silently dropping them', () => {
    const report = parseTvaGenerationReleaseReport([
      { Day: '10/14/2026', Time: '1 AM - Midnight EDT', Generators: '1' },
      { Day: '10/14/2026', Time: 'Dusk - Dawn EDT', Generators: '1' },
    ]);
    expect(report.blocks).toHaveLength(1);
    expect(report.dropped).toEqual([{ Day: '10/14/2026', Time: 'Dusk - Dawn EDT', Generators: '1' }]);
    expect(() => parseTvaGenerationReleaseReport({ error: 'oops' })).toThrow(/not an array/);
  });

  it('observed data keeps the Noon row (latest reading no longer falls back an hour)', () => {
    const rows = JSON.parse(readFixture('TVA/observed-data-NRST1-2026-10-14.json'));
    const noonRow = rows.find((r: { Time: string }) => r.Time === 'Noon EDT');
    expect(noonRow).toBeDefined();
    const fromNoonOnly = parseTvaObservations([noonRow], { locationId: 'NRST1' });
    expect(fromNoonOnly.find((o) => o.metric === 'discharge-cfs')).toMatchObject({
      value: 8051,
      observedAt: '2026-10-14T12:00:00-04:00',
    });
    const cht = JSON.parse(readFixture('TVA/observed-data-CEHT1-2026-10-14.json'));
    const parsedTimes = cht.map((r: { Day: string; Time: string }) => parseTvaTimestamp(r.Day, r.Time));
    expect(parsedTimes).not.toContain(null);
  });
});
