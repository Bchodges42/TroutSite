import { describe, expect, it } from 'vitest';
import {
  formatDate,
  scoreLabel,
  scorePresentation,
  stockingPrecisionDate,
  stockingStatusLabel,
  SCORE_FAIR_MIN,
  SCORE_GOOD_MIN,
} from './format';

/** F07 audit probes (2026-09-29): the marketing score label must be
 * assessment-aware, share the PWA's 70/40 bands, and render an assessed
 * zero as Poor (clamped-0 lethal semantics). */
describe('scoreLabel — assessment-aware fishability verdicts (F07)', () => {
  it('never turns unassessed data into a verdict', () => {
    // Audit probe: temperature-only value=10, assessed=false rendered "Poor".
    expect(scoreLabel(10, false)).toBe('No data');
    expect(scoreLabel(90, false)).toBe('No data');
    // Legacy snapshots without `assessed`: a 0 is indistinguishable from the
    // "cannot assess" sentinel, so it must stay an honest unavailable state.
    expect(scoreLabel(0, undefined)).toBe('No data');
  });

  it('renders an assessed zero as Poor (clamped-0 lethal semantics)', () => {
    // Audit probe: 25°C + flow, assessed=true, value=0 rendered "No data".
    expect(scoreLabel(0, true)).toBe('Poor');
  });

  it('infers a real assessment from a nonzero value on legacy snapshots', () => {
    // Unassessed results are always exactly 0, so a nonzero value PROVES
    // the score was assessed even when the flag predates the field.
    expect(scoreLabel(10, undefined)).toBe('Poor');
    expect(scoreLabel(72, undefined)).toBe('Good');
  });

  it('uses the PWA/contract 70/40 bands, not Astro’s old 75/50', () => {
    expect(SCORE_GOOD_MIN).toBe(70);
    expect(SCORE_FAIR_MIN).toBe(40);
    expect(scoreLabel(70, true)).toBe('Good');
    expect(scoreLabel(72, true)).toBe('Good'); // old Astro bands: Fair (cut at 75)
    expect(scoreLabel(69, true)).toBe('Fair');
    expect(scoreLabel(45, true)).toBe('Fair'); // old Astro bands: Poor (cut at 50)
    expect(scoreLabel(40, true)).toBe('Fair');
    expect(scoreLabel(39, true)).toBe('Poor');
  });

  it('pairs every label with a consistent band color', () => {
    expect(scorePresentation(85, true)).toMatchObject({ label: 'Good', assessed: true });
    expect(scorePresentation(0, true).label).toBe('Poor');
    expect(scorePresentation(0, false)).toMatchObject({ label: 'No data', assessed: false });
    // Assessed vs unassessed must never share a color.
    expect(scorePresentation(0, true).color).not.toBe(scorePresentation(0, false).color);
  });
});

/** F08 audit probes: precision and source status must survive presentation.
 *  The StockingEvent feed carries NO completed-release field, so no row may
 *  ever be presented as a TWRA release record. */
describe('stockingPrecisionDate — published precision is preserved (F08)', () => {
  it('renders a month-window row as a month, never a fabricated exact day', () => {
    // Audit probe: date=2026-12-01, datePrecision=month rendered "Dec 1, 2026".
    expect(stockingPrecisionDate('2026-12-01', 'month')).toBe('December 2026');
  });

  it('renders a week row as the week of the placeholder day', () => {
    expect(stockingPrecisionDate('2026-12-01', 'week')).toBe('Week of Dec 1, 2026');
  });

  it('renders day precision (and legacy rows without the flag) as an exact date', () => {
    expect(stockingPrecisionDate('2026-12-16', 'day')).toBe('Dec 16, 2026');
    expect(stockingPrecisionDate('2026-12-16', undefined)).toBe('Dec 16, 2026');
  });

  it('falls back to the raw string for malformed dates', () => {
    expect(stockingPrecisionDate('not-a-date', 'month')).toBe('not-a-date');
  });
});

describe('stockingStatusLabel — plans stay plans (F08)', () => {
  const today = '2026-09-29';

  it('keeps future entries scheduled with their published precision', () => {
    expect(stockingStatusLabel('2026-12-16', 'day', today)).toBe('Scheduled');
    expect(stockingStatusLabel('2026-12-01', 'month', today)).toBe('Month window · scheduled');
    expect(stockingStatusLabel('2027-03-01', 'week', today)).toBe('Week of · scheduled');
  });

  it('keeps past-dated entries past-scheduled — never "reported completed"', () => {
    expect(stockingStatusLabel('2026-08-28', 'day', today)).toBe('Past-scheduled');
    expect(stockingStatusLabel('2026-08-20', 'month', today)).toBe('Month window · past-scheduled');
    expect(stockingStatusLabel('2026-08-25', 'week', today)).toBe('Week of · past-scheduled');
  });

  it('treats today itself as scheduled (a plan until the day has passed)', () => {
    expect(stockingStatusLabel('2026-09-29', 'day', today)).toBe('Scheduled');
  });

  it('never uses release/completion vocabulary for any state', () => {
    for (const date of ['2026-08-28', '2026-12-16', '2026-12-01', '2027-03-01']) {
      for (const precision of ['day', 'week', 'month', undefined] as const) {
        const label = stockingStatusLabel(date, precision, today);
        expect(label).not.toMatch(/reported|released|completed/i);
      }
    }
  });
});

describe('formatDate (existing helper)', () => {
  it('formats ISO dates as "Dec 1, 2026"', () => {
    expect(formatDate('2026-12-01')).toBe('Dec 1, 2026');
  });
});
