import { describe, expect, it } from 'vitest';
import {
  classifyTwraGrid,
  parseTwraEvidence,
  parseTwraSpeciesList,
  recentRowsToEvidenceEvents,
  scheduleRowsToEvidenceEvents,
} from '../src/evidence/twra-evidence.js';
import { readFixture } from './helpers.js';

const PAGE_URL = 'https://www.tn.gov/twra/fishing/trout-information-stockings.html';
const NOW = new Date('2026-09-04T12:00:00Z');

function scheduleRow(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    REGION: '1',
    COUNTY: 'Caroll',
    LOCATION: 'McKenzie City Park',
    TYPE: 'Winter',
    'STOCKING DAY': '1/14/2026',
    'STOCKING WEEK': '',
    'STOCKING MONTHS': '',
    SPECIES: 'Rainbow Trout',
    ...overrides,
  };
}

describe('evidence: TWRA grid classification', () => {
  it('classifies grids by column signature, not URL or order', () => {
    expect(classifyTwraGrid([scheduleRow()])).toBe('schedule');
    expect(classifyTwraGrid([{ Region: '2', Destination: 'Ft. Campbell', 'Stocking Date': '07/22/2026' }])).toBe('recent');
    expect(classifyTwraGrid([{ junk: 'x' }])).toBe('unknown');
    expect(classifyTwraGrid([])).toBe('unknown');
  });

  it('parses the recorded 2026-09-04 capture: both grids, correct classes', () => {
    const artifacts = [
      { suffix: 'html', content: readFixture('TN/2026-09-04-stockings-page.html'), url: PAGE_URL },
      { suffix: 'schedule.exceldriven.json', content: readFixture('TN/2026-09-04-schedule.exceldriven.json'), url: PAGE_URL },
      { suffix: 'recent.exceldriven.json', content: readFixture('TN/2026-09-04-recent.exceldriven.json'), url: PAGE_URL },
    ];
    const result = parseTwraEvidence(artifacts, { now: NOW });
    expect(result.scheduleRows.length).toBeGreaterThan(500);
    expect(result.recentRows.length).toBeGreaterThan(0);
    expect(result.scheduleRows.every((r) => r.event.status === 'scheduled')).toBe(true);
    expect(result.recentRows.every((r) => r.event.status === 'reported-complete')).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('keeps the real page URL as sourceUrl even when garbage html artifacts share the set', () => {
    const artifacts = [
      { suffix: 'html', content: '<html>garbage</html>', url: 'https://example.test/garbage' },
      { suffix: 'html', content: readFixture('TN/2026-09-04-stockings-page.html'), url: PAGE_URL },
      { suffix: 'exceldriven.json', content: readFixture('TN/2026-09-04-schedule.exceldriven.json'), url: PAGE_URL },
    ];
    const result = parseTwraEvidence(artifacts, { now: NOW });
    expect(result.scheduleRows.length).toBeGreaterThan(0);
    expect(result.scheduleRows[0]?.event.sourceUrl).toBe(PAGE_URL);
  });
});

describe('evidence: TWRA stocking date precision (preserved, never upgraded)', () => {
  it('exact day rows carry day precision', () => {
    const { rows } = scheduleRowsToEvidenceEvents([scheduleRow() as never], PAGE_URL, { now: NOW });
    expect(rows[0]?.event.datePrecision).toBe('day');
    expect(rows[0]?.event.date).toBe('2026-01-14');
    expect(rows[0]?.event.status).toBe('scheduled');
  });

  it('week-of rows carry week precision (the Sunday date, not a fabricated day)', () => {
    const { rows } = scheduleRowsToEvidenceEvents(
      [scheduleRow({ 'STOCKING DAY': '', 'STOCKING WEEK': '6/7/2026' }) as never],
      PAGE_URL,
      { now: NOW },
    );
    expect(rows[0]?.event.datePrecision).toBe('week');
    expect(rows[0]?.event.date).toBe('2026-06-07');
  });

  it('TBD month rows carry month precision', () => {
    const { rows } = scheduleRowsToEvidenceEvents(
      [scheduleRow({ 'STOCKING DAY': 'TBD 12/2026' }) as never],
      PAGE_URL,
      { now: NOW },
    );
    expect(rows[0]?.event.datePrecision).toBe('month');
    expect(rows[0]?.event.date).toBe('2026-12-01');
  });

  it('month-initial rows resolve to the next occurrence with month precision', () => {
    const { rows } = scheduleRowsToEvidenceEvents(
      [scheduleRow({ 'STOCKING DAY': '', 'STOCKING MONTHS': 'J, F, M' }) as never],
      PAGE_URL,
      { now: NOW },
    );
    expect(rows[0]?.event.datePrecision).toBe('month');
    expect(rows[0]?.event.date).toBe('2027-01-01');
  });

  it('month-initial rows pick the NEAREST listed remaining month (F35, evidence side)', () => {
    // A M–D schedule consulted in late September used to jump to March 2027,
    // hiding April–December of the current season from evidence.
    const { rows } = scheduleRowsToEvidenceEvents(
      [scheduleRow({ 'STOCKING DAY': '', 'STOCKING MONTHS': 'M, A, M, J, J, A, S, O, N, D' }) as never],
      PAGE_URL,
      { now: new Date('2026-09-29T12:00:00Z') },
    );
    expect(rows[0]?.event.datePrecision).toBe('month');
    expect(rows[0]?.event.date).toBe('2026-09-01');
  });

  it('month-initial rows roll to next year only after all listed months passed (F35)', () => {
    const { rows } = scheduleRowsToEvidenceEvents(
      [scheduleRow({ 'STOCKING DAY': '', 'STOCKING MONTHS': 'J, F, M, N, D' }) as never],
      PAGE_URL,
      { now: new Date('2026-09-29T12:00:00Z') },
    );
    // J,F,M passed; N,D of the SAME season are still ahead → November 2026, not January 2027.
    expect(rows[0]?.event.date).toBe('2026-11-01');
    expect(rows[0]?.event.datePrecision).toBe('month');
  });

  it('species text stays as published (lowercased), never inferred from water names', () => {
    expect(parseTwraSpeciesList('Rainbow Trout')).toEqual(['rainbow trout']);
    expect(parseTwraSpeciesList('Rainbow, Brown Trout')).toEqual(['rainbow', 'brown trout']);
    expect(parseTwraSpeciesList('Brook Trout')).toEqual(['brook trout']);
    expect(parseTwraSpeciesList('')).toBeUndefined();
  });

  it('rows without any usable date are skipped with a warning (not invented)', () => {
    const { rows, skipped, warnings } = scheduleRowsToEvidenceEvents(
      [scheduleRow({ 'STOCKING DAY': '', 'STOCKING WEEK': '', 'STOCKING MONTHS': '' }) as never],
      PAGE_URL,
      { now: NOW },
    );
    expect(rows).toHaveLength(0);
    expect(skipped).toBe(1);
    expect(warnings[0]).toContain('no usable date');
  });
});

describe('evidence: scheduled vs completed distinction', () => {
  it('recent-report rows become reported-complete with day precision', () => {
    const { rows } = recentRowsToEvidenceEvents(
      [{ Region: '2', Destination: 'Ft. Campbell', 'Stocking Date': '07/22/2026' }],
      PAGE_URL,
    );
    expect(rows[0]?.event).toMatchObject({
      sourceId: 'twra-recent-stockings',
      date: '2026-07-22',
      datePrecision: 'day',
      status: 'reported-complete',
    });
  });

  it('a scheduled row whose window passed STAYS scheduled (never auto-completed)', () => {
    const { rows } = scheduleRowsToEvidenceEvents([scheduleRow() as never], PAGE_URL, {
      now: new Date('2026-06-01T12:00:00Z'), // months after 1/14/2026
    });
    expect(rows[0]?.event.status).toBe('scheduled');
    expect(rows[0]?.event.date).toBe('2026-01-14');
  });

  it('recent rows carry no species (TWRA publishes none — none is invented)', () => {
    const { rows } = recentRowsToEvidenceEvents(
      [{ Region: '2', Destination: 'Norris TW', 'Stocking Date': '08/07/2026' }],
      PAGE_URL,
    );
    expect(rows[0]?.event.species).toBeUndefined();
  });

  it('unparseable recent dates are skipped with a warning', () => {
    const { rows, warnings } = recentRowsToEvidenceEvents(
      [{ Region: '2', Destination: 'X', 'Stocking Date': 'July 22' }],
      PAGE_URL,
    );
    expect(rows).toHaveLength(0);
    expect(warnings[0]).toContain('unparseable date');
  });
});
