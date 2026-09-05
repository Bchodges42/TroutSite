import { describe, expect, it } from 'vitest';
import {
  decisionStatusText,
  metricLabel,
  toWaterDecisionView,
} from '../src/features/map/waterDecision';
import type { ConditionSnapshot } from '@trout/contracts';

/** Minimal RiverMapFeature stand-in — only fields the adapter reads. */
function feature(overrides: {
  id?: string;
  species?: 'trout' | 'warmwater';
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
    species: overrides.species ?? 'trout',
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
