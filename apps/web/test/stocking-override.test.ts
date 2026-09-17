import { describe, expect, it } from 'vitest';
import {
  recentStockingActive,
  stockedTroutScore,
  STOCKING_OVERRIDE_DAYS,
  toWaterDecisionView,
} from '../src/features/map/waterDecision';
import type { RiverMapFeature } from '../src/features/map/riverMapSelectors';

const NOW = new Date('2026-09-17T12:00:00Z');

function feature(partial: Record<string, unknown>): RiverMapFeature {
  return {
    stream: { id: 'test-water', name: 'Test Water', idealFlow: [{ min: 50, max: 400 }], gaugeIds: [] },
    snapshot: undefined,
    status: 'good',
    color: '#000',
    score: null,
    species: 'warmwater',
    freshness: null,
    hatchChart: null,
    hatchDominant: null,
    hatchHalo: { active: false, color: '' },
    stocking: null,
    stockingCount: 0,
    report: null,
    reportCount: 0,
    logCount: 0,
    ...partial,
  } as never;
}

describe('recent-stocking trout override', () => {
  it('activates inside the 30-day decay window', () => {
    expect(recentStockingActive({ lastEventDay: '2026-09-10' }, NOW)).toBe(true);
    expect(recentStockingActive({ lastEventDay: '2026-08-20' }, NOW)).toBe(true); // day 28
  });

  it('expires after the decay window — the override does not last forever', () => {
    expect(recentStockingActive({ lastEventDay: '2026-08-01' }, NOW)).toBe(false); // day 47
    expect(STOCKING_OVERRIDE_DAYS).toBe(30);
  });

  it('a documented window extends the override to window end + 21 days', () => {
    // window Dec–Feb: event on Dec 20 (2025) — 30-day plain window ends Jan 19,
    // but window-end extension keeps it alive into March.
    const withWindow = { lastEventDay: '2025-12-20', windowMonths: [12, 1, 2] };
    expect(recentStockingActive(withWindow, new Date('2026-02-15T12:00:00Z'))).toBe(true);
    expect(recentStockingActive({ lastEventDay: '2025-12-20' }, new Date('2026-02-15T12:00:00Z'))).toBe(false);
  });

  it('re-scores a warmwater water on the trout curve while stocked', () => {
    const readings = [{ gaugeId: '123', timestamp: '2026-09-17T10:00:00Z', cfs: 120, tempC: 14 }];
    const scored = stockedTroutScore(
      { id: 'test-water', idealFlow: [{ min: 50, max: 400 }], gaugeIds: [] },
      readings,
    );
    // 14 °C is inside the cited 11–19 °C trout activity window — trout curve bonus
    expect(scored?.assessed).toBe(true);
    expect(scored?.value).toBeGreaterThan(50);
    expect(scored?.reasons[0]).toContain('trout curve');
  });

  it('returns null (no guess) when there are no readings', () => {
    expect(stockedTroutScore({ id: 'x', idealFlow: [], gaugeIds: [] }, [])).toBeNull();
  });

  it('displays a warmwater water as trout while the override is live', () => {
    const until = new Date(NOW.getTime() + 10 * 86_400_000).toISOString().slice(0, 10);
    const f = feature({
      species: 'warmwater',
      score: 62,
      status: 'fair',
      stockedTroutNow: { lastEventDay: '2026-09-10', until },
      snapshot: { score: { value: 62, reasons: [], assessed: true }, readings: [{ gaugeId: 'g', timestamp: '2026-09-17T10:00:00Z', cfs: 120, tempC: 14 }] },
    });
    const view = toWaterDecisionView(f, 'trout', 9);
    expect(view.visibility).toBe('include'); // not excluded, not dimmed
    expect(view.troutApplicability).toBe('confirmed-current');
    expect(view.displayMetric).toBe('trout-condition'); // trout metric, not fishability
    expect(view.reasons.some((x) => x.includes('Fresh TWRA stocking report'))).toBe(true);
  });

  it('reverts the water when the decay window has passed', () => {
    const until = '2026-08-31'; // expired clock on a stale snapshot
    const f = feature({
      species: 'warmwater',
      score: 62,
      status: 'fair',
      stockedTroutNow: { lastEventDay: '2026-08-01', until },
      snapshot: { score: { value: 62, reasons: [], assessed: true }, readings: [] },
    });
    const view = toWaterDecisionView(f, 'trout', 9);
    expect(view.troutApplicability).toBe('not-trout');
    expect(view.visibility).toBe('exclude'); // plain warmwater behavior returns
  });

  it('still shows plain warmwater waters as warmwater without a stocking report', () => {
    const f = feature({ species: 'warmwater', score: null, status: 'no-data' });
    const view = toWaterDecisionView(f, 'trout', 9);
    expect(view.troutApplicability).toBe('not-trout');
    expect(view.visibility).toBe('exclude');
  });
});
