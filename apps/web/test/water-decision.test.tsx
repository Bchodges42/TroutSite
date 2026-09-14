import { describe, expect, it } from 'vitest';
import {
  decisionColorToken,
  decisionStatusText,
  metricLabel,
  seasonalChipText,
  toWaterDecisionView,
} from '../src/features/map/waterDecision';
import type { ConditionSnapshot } from '@trout/contracts';

/** Minimal RiverMapFeature stand-in — only fields the adapter reads. */
function feature(overrides: {
  id?: string;
  species?: 'trout' | 'warmwater' | undefined;
  score?: number | null;
  assessed?: boolean;
  reasons?: string[];
  readings?: number;
}) {
  return {
    stream: { id: overrides.id ?? 'test-water', name: 'Test Water' },
    status:
      overrides.score == null || overrides.assessed === false
        ? ('no-data' as const)
        : overrides.score >= 70
          ? ('good' as const)
          : overrides.score >= 40
            ? ('fair' as const)
            : ('poor' as const),
    score: overrides.assessed === false ? null : (overrides.score ?? null),
    snapshot: overrides.score == null
      ? undefined
      : ({
          score: {
            value: overrides.score,
            assessed: overrides.assessed !== false,
            reasons: overrides.reasons ?? ['Within the ideal range.'],
          },
          readings: Array.from({ length: overrides.readings ?? 2 }, () => ({})),
        } as unknown as ConditionSnapshot),
    // H3: an explicit `undefined` species is the unknown state — it must reach
    // the adapter as absent, never pre-defaulted to trout.
    species: 'species' in overrides ? overrides.species : ('trout' as const),
  };
}

describe('WaterDecisionView compatibility adapter', () => {
  it('presents an assessed trout water as trout-condition with high confidence', () => {
    const view = toWaterDecisionView(feature({ score: 82, readings: 3 }), 'trout');
    expect(view.displayMetric).toBe('trout-condition');
    expect(view.troutApplicability).toBe('confirmed-current');
    expect(view.visibility).toBe('include');
    expect(view.confidence).toBe('high');
    expect(view.fishability).toBeUndefined();
    expect(view.reasons).toEqual(['Within the ideal range.']);
  });

  it('never converts missing data into an assessment', () => {
    const view = toWaterDecisionView(feature({ score: null }), 'trout');
    expect(view.displayMetric).toBe('unassessed');
    expect(view.troutApplicability).toBe('unknown');
    expect(view.confidence).toBe('low');
    expect(metricLabel(view)).toBe('Unassessed');
  });

  it('marks warmwater waters not-trout and never reuses the trout score as fishability', () => {
    for (const mode of ['trout', 'all'] as const) {
      const view = toWaterDecisionView(feature({ species: 'warmwater', score: 90 }), mode);
      expect(view.troutApplicability).toBe('not-trout');
      expect(view.displayMetric).toBe('unassessed');
      expect(view.fishability).toBeUndefined();
      expect(decisionStatusText(view, { species: 'warmwater', status: 'good' })).toBe('Warmwater');
    }
  });

  it('excludes warmwater waters from trout mode and includes them in all-fish mode', () => {
    const f = feature({ species: 'warmwater', score: null });
    expect(toWaterDecisionView(f, 'trout').visibility).toBe('exclude');
    expect(toWaterDecisionView(f, 'all').visibility).toBe('include');
  });

  it('keeps a stocked warmwater water visible but de-emphasized in trout mode (owner decision 2026-09-04)', () => {
    // harpeth-river is warmwater yet stocked with trout in December — hiding
    // it would hide a real fishery.
    const stocked = {
      ...feature({ species: 'warmwater', score: null }),
      stream: { id: 'harpeth-river', name: 'Harpeth River', stockingProgram: true },
    };
    const view = toWaterDecisionView(stocked, 'trout');
    expect(view.visibility).toBe('deemphasize');
    expect(view.troutApplicability).toBe('not-trout');
    expect(view.displayMetric).toBe('unassessed');
    expect(decisionStatusText(view, { species: 'warmwater', status: 'no-data' })).toBe(
      'Warmwater',
    );
  });

  // H3 (2026-09-07): 43 catalog records ship without a species field. The old
  // `?? 'trout'` default silently entered them into trout mode with
  // trout-assessment language; unknown must stay distinguishable.
  it('keeps missing species unknown and discoverable, never confirmed trout', () => {
    const unknown = feature({ species: undefined, score: null });
    const view = toWaterDecisionView(unknown, 'trout');
    expect(view.troutApplicability).toBe('unknown');
    expect(view.displayMetric).toBe('unassessed');
    // Discoverable in trout mode (unverified, labeled), not excluded.
    expect(view.visibility).toBe('include');
    expect(view.confidence).toBe('low');
    expect(decisionStatusText(view, { species: undefined, status: 'no-data' })).toBe(
      'Unverified',
    );
  });

  it('withholds trout-condition language from an assessed water with unknown species', () => {
    // Real gauge readings may exist for such a water; the trout band still
    // must not claim it.
    const view = toWaterDecisionView(feature({ species: undefined, score: 82, readings: 3 }), 'trout');
    expect(view.displayMetric).toBe('unassessed');
    expect(view.troutApplicability).toBe('unknown');
    expect(view.confidence).toBe('low');
    expect(decisionStatusText(view, { species: undefined, status: 'good' })).toBe('Unverified');
  });

  it('colors unknown species as the neutral no-data tone on the map', () => {
    const unknown = feature({ species: undefined, score: 82 });
    expect(
      decisionColorToken(toWaterDecisionView(unknown, 'trout'), { species: undefined, status: 'good' }),
    ).toBe('no-data');
    const trout = feature({ score: 82 });
    expect(
      decisionColorToken(toWaterDecisionView(trout, 'trout'), { species: 'trout', status: 'good' }),
    ).toBe('good');
  });

  it('surfaces danger-language reasons as cautions', () => {
    const view = toWaterDecisionView(
      feature({
        score: 8,
        reasons: ['Flow within the ideal range.', 'Dangerously warm water — avoid stressing fish.'],
      }),
      'all',
    );
    expect(view.displayMetric).toBe('trout-condition');
    expect(view.cautions).toEqual(['Dangerously warm water — avoid stressing fish.']);
    expect(decisionStatusText(view, { species: 'trout', status: 'poor' })).toBe('Poor');
  });

  it('labels metrics without borrowing language across modes', () => {
    const assessed = toWaterDecisionView(feature({ score: 75 }), 'trout');
    const unassessed = toWaterDecisionView(feature({ score: null }), 'all');
    expect(metricLabel(assessed)).toBe('Trout conditions');
    expect(metricLabel(unassessed)).toBe('Unassessed');
    expect(decisionStatusText(assessed, { species: 'trout', status: 'good' })).toBe('Good');
  });
});

describe('T1-18/19 — seasonal applicability (yearRound + month)', () => {
  // beech-lake shape: a catalog trout water with an honest winter-only program.
  function seasonalFeature(overrides: { score?: number | null; assessed?: boolean; yearRound?: boolean; species?: 'trout' | 'warmwater' | undefined } = {}) {
    const f = feature({
      score: overrides.score ?? 82,
      assessed: overrides.assessed,
      species: 'species' in overrides ? overrides.species : 'trout',
    });
    return {
      ...f,
      stream: { ...f.stream, yearRound: overrides.yearRound ?? false },
    };
  }

  it('a yearRound:false trout water in a summer month is seasonal-likely-absent and never wears the trout metric', () => {
    const view = toWaterDecisionView(seasonalFeature({ score: 82 }), 'trout', 7);
    expect(view.troutApplicability).toBe('seasonal-likely-absent');
    expect(view.displayMetric).toBe('unassessed');
    expect(view.confidence).toBe('low');
    expect(seasonalChipText(view)).toBe('PROGRAMMATIC — out of season');
    expect(decisionStatusText(view, { species: 'trout', status: 'good' })).toBe('Out of season');
  });

  it('the same water inside the winter window is seasonal-uncertain, not confirmed', () => {
    const view = toWaterDecisionView(seasonalFeature({ score: 82 }), 'trout', 1);
    expect(view.troutApplicability).toBe('seasonal-uncertain');
    expect(view.displayMetric).toBe('unassessed');
    expect(seasonalChipText(view)).toBe('PROGRAMMATIC — seasonal fishery');
    expect(decisionStatusText(view, { species: 'trout', status: 'good' })).toBe('Seasonal');
  });

  it('without a month the seasonal water stays uncertain — absence is never claimed blind', () => {
    const view = toWaterDecisionView(seasonalFeature({ score: 82 }), 'trout');
    expect(view.troutApplicability).toBe('seasonal-uncertain');
  });

  it('a yearRound:true (or unset) trout water keeps confirmed-current behavior', () => {
    const yearRound = toWaterDecisionView(seasonalFeature({ score: 82, yearRound: true }), 'trout', 7);
    expect(yearRound.troutApplicability).toBe('confirmed-current');
    expect(yearRound.displayMetric).toBe('trout-condition');
    const unset = toWaterDecisionView(feature({ score: 82 }), 'trout', 7);
    expect(unset.troutApplicability).toBe('confirmed-current');
    expect(unset.displayMetric).toBe('trout-condition');
  });

  it('an unassessed seasonal water stays out-of-season with no fabricated band', () => {
    const view = toWaterDecisionView(seasonalFeature({ score: null }), 'trout', 7);
    expect(view.troutApplicability).toBe('seasonal-likely-absent');
    expect(view.displayMetric).toBe('unassessed');
    expect(decisionStatusText(view, { species: 'trout', status: 'no-data' })).toBe('Out of season');
  });

  it('seasonal state never reaches warmwater or unknown-species waters', () => {
    const warm = toWaterDecisionView(seasonalFeature({ species: 'warmwater', score: null }), 'trout', 7);
    expect(warm.troutApplicability).toBe('not-trout');
    expect(seasonalChipText(warm)).toBeNull();
    const unknown = toWaterDecisionView(seasonalFeature({ species: undefined, score: null }), 'trout', 7);
    expect(unknown.troutApplicability).toBe('unknown');
    expect(seasonalChipText(unknown)).toBeNull();
  });
});

describe('F6 TASK 3 — fishability displayMetric from real snapshot data', () => {
  const comfort = (value: number, assessed = true) => ({
    species: 'largemouth-bass' as const,
    value,
    reasons: ['Temperature is in the optimal range'],
    assessed,
    freshness: assessed ? { observedAt: '2026-09-14T10:00:00Z', ageMinutes: 30 } : null,
  });
  const focus = { species: 'largemouth-bass' as const, comfort: comfort(84) };
  const warmwaterF = feature({ species: 'warmwater', score: null });

  it('all-fish mode wears the focus species fishability when assessed', () => {
    const view = toWaterDecisionView(warmwaterF, 'all', 9, focus);
    expect(view.displayMetric).toBe('fishability');
    expect(view.confidence).toBe('high');
    expect(decisionStatusText(view, { species: 'warmwater', status: 'good' }, focus)).toBe('Good');
  });

  it('comfort bands map to Good/Fair/Poor and map colors', () => {
    for (const [value, text] of [[84, 'Good'], [55, 'Fair'], [22, 'Poor']] as const) {
      const v = toWaterDecisionView(warmwaterF, 'all', 9, { ...focus, comfort: comfort(value) });
      expect(decisionStatusText(v, { species: 'warmwater', status: 'no-data' }, { ...focus, comfort: comfort(value) })).toBe(text);
      expect(decisionColorToken(v, warmwaterF, { ...focus, comfort: comfort(value) })).toBe(
        text.toLowerCase(),
      );
    }
  });

  it('unassessed comfort and missing data stay honestly unassessed', () => {
    const noData = { species: 'largemouth-bass' as const, comfort: comfort(0, false) };
    const view = toWaterDecisionView(warmwaterF, 'all', 9, noData);
    expect(view.displayMetric).toBe('unassessed');
    expect(decisionStatusText(view, { species: 'warmwater', status: 'no-data' }, noData)).toBe(
      'Warmwater',
    );
    const none = toWaterDecisionView(warmwaterF, 'all', 9, undefined);
    expect(none.displayMetric).toBe('unassessed');
    expect(decisionColorToken(none, warmwaterF)).toBe('warmwater');
  });

  it('trout mode is untouched: trout-condition behavior holds with comfort present', () => {
    const troutF = feature({ species: 'trout', score: 82 });
    const view = toWaterDecisionView(troutF, 'trout', 9, focus);
    expect(view.displayMetric).toBe('trout-condition');
    const warm = toWaterDecisionView(warmwaterF, 'trout', 9, focus);
    expect(warm.displayMetric).toBe('unassessed');
    expect(warm.troutApplicability).toBe('not-trout');
  });

  it('unknown-species waters stay unassessed even with comfort data', () => {
    const unknownF = feature({ species: undefined, score: null });
    const view = toWaterDecisionView(unknownF, 'all', 9, focus);
    expect(view.troutApplicability).toBe('unknown');
    // The water still wears the focus species' real score — the metric comes
    // from the snapshot, not a species guess.
    expect(view.displayMetric).toBe('fishability');
  });
});
