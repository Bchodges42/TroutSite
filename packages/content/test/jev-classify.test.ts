import { describe, expect, it } from 'vitest';
import {
  CATEGORY_CRITERIA,
  CATEGORY_LABELS,
  MONTHS,
  evidenceState,
  normalizeMonth,
  questionsForMonth,
} from '../scripts/classification/jev-classify.mjs';

describe('Jev Tennessee fishery classifier setup', () => {
  it('exposes exactly the requested three category probabilities', () => {
    expect(Object.keys(CATEGORY_CRITERIA)).toEqual([
      'trout-stream-year-round',
      'warmwater-yearly-stocked-winter-trout',
      'warmwater-no-trout',
    ]);
    expect(Object.values(CATEGORY_LABELS)).toEqual([
      'Trout Stream - year round',
      'Warm water - Yearly stocked winter trout',
      'warm water(no trout)',
    ]);
    expect(Object.keys(questionsForMonth('July').category.criteria)).toEqual(Object.keys(CATEGORY_CRITERIA));
  });

  it('passes an explicit month to the current and annual questions', () => {
    const questions = questionsForMonth('July');
    expect(questions.current_month_trout.instructions).toContain('July (month 7)');
    expect(questions.month_December.instructions).toContain('December (month 12)');
    expect(questions.evidence_quality.type).toBe('score');
    expect(Object.keys(questions).filter((key) => key.startsWith('month_'))).toHaveLength(12);
  });

  it('keeps Fishbrain freshwater trout separate from excluded marine labels', () => {
    const state = evidenceState('boone-tailwater', { month: 'July' });
    const discovery = state.evidence.fishbrainDiscovery;
    expect(state.requestedMonth).toMatchObject({ number: 7, name: 'July' });
    expect(discovery.available).toBe(true);
    expect(discovery.dataset.collectionNote).toContain('Research-only');
    expect(discovery.freshwaterTrout.map((item) => item.name)).toContain('Rainbow trout');
    expect(discovery.excludedMarineOrBrackish.map((item) => item.name)).toContain('Sea trout');
    expect(discovery.segmentReviewReasons.length).toBeGreaterThan(0);
    expect(discovery.interpretationRule).toContain('not establish abundance');
  });

  it('keeps a warmwater river from becoming trout water due to Fishbrain absence', () => {
    const state = evidenceState('obed-river', { month: 7 });
    expect(state.water.waterbodyType).toBe('river');
    expect(state.evidence.auditedLedger.slots.Species[0].noneFound).toBe(true);
    expect(state.evidence.twraStocking.matchedEvents).toHaveLength(0);
    expect(state.evidence.fishbrainDiscovery.freshwaterTrout).toHaveLength(0);
    expect(state.safeguards.join(' ')).toContain('not year-round without direct year-round evidence');
  });

  it('normalizes only valid one-based months', () => {
    expect(normalizeMonth(1)).toBe(1);
    expect(normalizeMonth('December')).toBe(12);
    expect(() => normalizeMonth(0)).toThrow(RangeError);
    expect(MONTHS).toHaveLength(12);
  });
});
