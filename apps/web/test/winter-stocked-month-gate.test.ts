import { describe, expect, it } from 'vitest';
import { identityLabel, recentStockingActive, toWaterDecisionView } from '../src/features/map/waterDecision';
import type { RiverMapFeature } from '../src/features/map/riverMapSelectors';

/** A winter-stocked warmwater water (the Beech Lake / Harpeth pattern):
 *  warmwater species + a stocking program + a Dec–Feb window. */
function winterStocked(partial: Record<string, unknown> = {}): RiverMapFeature {
  return {
    stream: {
      id: 'beech-lake', name: 'Beech Lake', species: 'warmwater',
      stockingProgram: true, seasonMonths: [12, 1, 2], seasonKind: 'programmatic',
      yearRound: false, idealFlow: [], gaugeIds: [],
    },
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

describe('winter-stocked identity + month gating', () => {
  it('labels the water Warmwater — Winter Stocked w/ trout in EVERY month', () => {
    expect(identityLabel(winterStocked())).toContain('Warmwater — Winter Stocked w/ trout');
    // the identity does not change with the season
    expect(identityLabel(winterStocked())).toBe(identityLabel(winterStocked()));
  });

  it('in the PEAK OF SUMMER the trout overlay is absent — dimmed, no trout metric', () => {
    const view = toWaterDecisionView(winterStocked({ score: 70, status: 'good' }), 'trout', 7);
    expect(view.troutApplicability).toBe('seasonal-likely-absent');
    expect(view.visibility).toBe('deemphasize'); // visible, honest, de-emphasized
    expect(view.displayMetric).toBe('unassessed'); // no trout score in July
  });

  it('in the stocking window the trout overlay applies', () => {
    const view = toWaterDecisionView(winterStocked({ score: 70, status: 'good' }), 'trout', 1);
    expect(view.troutApplicability).toBe('seasonal-uncertain');
    expect(view.visibility).toBe('include');
    expect(view.inSeason).toBe(true);
  });

  it('in-window WITHOUT a fresh stocking report stays honestly unassessed (the snapshot score is warmwater-curved)', () => {
    const view = toWaterDecisionView(winterStocked({ score: 70, status: 'good' }), 'trout', 1);
    expect(view.displayMetric).toBe('unassessed');
  });

  it('in-window WITH a fresh stocking report wears the trout-curve re-score', () => {
    // event 10 days ago, clock valid — the hook re-scored the feature score
    const event = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);
    const until = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
    const f = winterStocked({
      score: 74, status: 'good', // re-scored at the hook (trout curve)
      stockedTroutNow: { lastEventDay: event, until },
      snapshot: { score: { value: 74, reasons: [], assessed: true }, readings: [{ gaugeId: 'g', timestamp: event + 'T10:00:00Z', cfs: 90, tempC: 8 }] },
    });
    const view = toWaterDecisionView(f, 'trout', 1);
    expect(view.displayMetric).toBe('trout-condition');
    expect(view.visibility).toBe('include');
  });

  it('keeps a fresh-stocking override alive past the plain window on window end + 21 days', () => {
    // pure clock test: event Dec 20 2025 with a Dec-Feb window stays active
    // through the March holdover, while the plain 30-day window would not
    const withWindow = { lastEventDay: '2025-12-20', windowMonths: [12, 1, 2] };
    const now = new Date('2026-02-15T12:00:00Z');
    expect(recentStockingActive(withWindow, now)).toBe(true);
    expect(recentStockingActive({ lastEventDay: '2025-12-20' }, now)).toBe(false);
    // and toWaterDecisionView honors the override on the feature
    const f = winterStocked({
      stockedTroutNow: { lastEventDay: '2025-12-20', until: new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10) },
      snapshot: { score: { value: 60, reasons: [], assessed: true }, readings: [{ gaugeId: 'g', timestamp: '2026-02-10T10:00:00Z', cfs: 90, tempC: 10 }] },
    });
    const view = toWaterDecisionView(f, 'trout', 2);
    expect(view.troutApplicability).toBe('confirmed-current');
    expect(view.visibility).toBe('include');
  });

  it('status text never promises trout out of season', () => {
    const view = toWaterDecisionView(winterStocked(), 'trout', 7);
    expect(view.displayMetric).not.toBe('trout-condition');
  });

  it('labels a year-round trout stream and a plain warmwater water distinctly', () => {
    const trout = winterStocked({
      species: 'trout', stream: { id: 'caney', name: 'Caney Fork', species: 'trout', yearRound: true, seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], idealFlow: [], gaugeIds: [] },
    });
    expect(identityLabel(trout)).toBe('Trout Stream — Year Round');
    const plain = winterStocked({ stream: { id: 'x', name: 'X', species: 'warmwater', idealFlow: [], gaugeIds: [] } });
    expect(identityLabel(plain)).toBe('Warmwater');
  });
});
