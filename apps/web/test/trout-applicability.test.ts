// Trout-applicability decision tests: month-aware classification of
// trout presence across stocking age, species evidence, temperature, and
// stocking-record status. All times are UTC-explicit; see
// fishability-model.test.ts for timezone/determinism coverage.

import { describe, expect, it } from 'vitest';
import {
  evaluateWater,
  selectVisibleWaters,
  type FishabilityInput,
} from '../src/domain/fishability';

const input = (over: Partial<FishabilityInput> = {}): FishabilityInput => ({
  now: '2026-09-15T12:00:00Z',
  mode: 'trout',
  waterId: 'test-water',
  waterbodyType: 'creek',
  speciesEvidence: [],
  observations: [],
  stockingEvents: [],
  ...over,
});

describe('trout applicability — September with only old winter stocking', () => {
  const oldWinterStocking = {
    date: '2026-02-10',
    datePrecision: 'day',
    status: 'reported-complete',
  } as const;

  it('is seasonal-uncertain (never confidently current) without temperature evidence', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [oldWinterStocking],
        seasonalPolicy: { stockedMonths: [12, 1, 2] },
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
    expect(decision.confidence).toBe('medium');
    expect(decision.visibility).toBe('deemphasize');
    expect(decision.displayMetric).toBe('unassessed');
    expect(decision.fishability).toBeUndefined();
    expect(decision.reasons.join(' ')).toMatch(/retention window/i);
    // Uncertainty stays inspectable: de-emphasized, never silently excluded.
    const { included, excluded } = selectVisibleWaters([decision]);
    expect(included).toHaveLength(1);
    expect(excluded).toHaveLength(0);
  });

  it('is seasonal-uncertain even without an explicit stockedMonths policy', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [oldWinterStocking],
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
  });

  it('becomes seasonal-likely-absent with sustained current warm water, and is excludable', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [oldWinterStocking],
        observations: [
          { metric: 'temperature-c', value: 26.5, observedAt: '2026-09-14T12:00:00Z' },
        ],
        seasonalPolicy: { stockedMonths: [12, 1, 2] },
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-likely-absent');
    // Explicit off-season policy + >2x retention + current warmth → high confidence.
    expect(decision.confidence).toBe('high');
    expect(decision.reasons.join(' ')).toMatch(/26\.5°C/);
    expect(decision.reasons.join(' ')).toMatch(/cutoff/i);
    expect(decision.cautions.join(' ')).toMatch(/inference|not a certainty/i);

    const { included, excluded } = selectVisibleWaters([decision]);
    expect(included).toHaveLength(0);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]?.rule).toBe('seasonal-likely-absent-high-confidence');
    expect(excluded[0]?.reasons.length).toBeGreaterThan(0);
  });
});

describe('trout applicability — recently stocked winter water', () => {
  it('is probable-current within the retention window with good trout conditions', () => {
    const decision = evaluateWater(
      input({
        now: '2026-01-20T12:00:00Z',
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [
          { date: '2026-01-05', datePrecision: 'day', status: 'reported-complete' },
        ],
        observations: [
          { metric: 'temperature-c', value: 8, observedAt: '2026-01-19T12:00:00Z' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('probable-current');
    expect(decision.confidence).toBe('high');
    expect(decision.visibility).toBe('include');
    expect(decision.displayMetric).toBe('trout-condition');
    expect(decision.fishability).toBe('good');
    expect(decision.cautions.join(' ')).toMatch(/put-and-take/i);
  });

  it('never asserts confirmed-current from stocking alone', () => {
    const decision = evaluateWater(
      input({
        now: '2026-01-20T12:00:00Z',
        stockingEvents: [
          { date: '2026-01-05', datePrecision: 'day', status: 'reported-complete' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('probable-current');
    expect(decision.troutApplicability).not.toBe('confirmed-current');
  });

  it('flags a completed stocking recorded outside the configured stocking months', () => {
    const decision = evaluateWater(
      input({
        now: '2026-09-15T12:00:00Z',
        stockingEvents: [
          { date: '2026-09-05', datePrecision: 'day', status: 'reported-complete' },
        ],
        seasonalPolicy: { stockedMonths: [12, 1, 2] },
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
    expect(decision.cautions.join(' ')).toMatch(/misattributed|outside the configured/i);
  });
});

describe('trout applicability — wild trout stream in September', () => {
  it('stays confirmed-current regardless of month', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          {
            species: 'brown trout',
            basis: 'wild-population',
            confidence: 'high',
            sourceDate: '2026-06-01',
          },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('confirmed-current');
    expect(decision.confidence).toBe('high');
    expect(decision.visibility).toBe('include');
    expect(decision.reasons.join(' ')).toMatch(/September/);
    // No observations → nothing to display, honestly unassessed.
    expect(decision.displayMetric).toBe('unassessed');
    expect(decision.fishability).toBeUndefined();
  });

  it('downgrades medium-confidence wild evidence to probable-current', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'brown trout', basis: 'wild-population', confidence: 'medium' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('probable-current');
    expect(decision.confidence).toBe('medium');
  });
});

describe('trout applicability — tailwater with verified year-round management', () => {
  it('stays confirmed-current through a brutal summer; warmth degrades conditions, not presence', () => {
    const decision = evaluateWater(
      input({
        waterbodyType: 'tailrace',
        speciesEvidence: [
          { species: 'trout', basis: 'year-round-managed', confidence: 'high' },
        ],
        observations: [
          { metric: 'temperature-c', value: 26, observedAt: '2026-09-14T12:00:00Z' },
          { metric: 'discharge-cfs', value: 350, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('confirmed-current');
    expect(decision.displayMetric).toBe('trout-condition');
    expect(decision.fishability).toBe('poor');
    expect(decision.cautions.join(' ')).toMatch(/thermally stressed|cutoff/i);
    expect(decision.evidenceUsed.join(' ')).toContain('year-round-managed');
  });
});

describe('trout applicability — warm stale observation vs warm current observation', () => {
  const base = {
    speciesEvidence: [
      { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
    ],
    stockingEvents: [
      { date: '2026-02-10', datePrecision: 'day', status: 'reported-complete' },
    ],
    seasonalPolicy: { stockedMonths: [12, 1, 2] },
  } as const;

  it('a 45-day-old warm reading does not drive seasonal-likely-absent', () => {
    const decision = evaluateWater(
      input({
        ...base,
        observations: [
          { metric: 'temperature-c', value: 27, observedAt: '2026-08-01T12:00:00Z' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
    expect(decision.troutApplicability).not.toBe('seasonal-likely-absent');
    expect(decision.cautions.join(' ')).toMatch(/stale/i);
  });

  it('a 1-day-old warm reading does drive seasonal-likely-absent', () => {
    const decision = evaluateWater(
      input({
        ...base,
        observations: [
          { metric: 'temperature-c', value: 27, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-likely-absent');
  });

  it('respects a per-water warmWaterCutoffC override', () => {
    const observations = [
      { metric: 'temperature-c' as const, value: 23, observedAt: '2026-09-14T12:00:00Z' },
    ];
    const strict = evaluateWater(
      input({ ...base, observations, seasonalPolicy: { stockedMonths: [12, 1, 2], warmWaterCutoffC: 20 } }),
    );
    const lenient = evaluateWater(
      input({ ...base, observations, seasonalPolicy: { stockedMonths: [12, 1, 2], warmWaterCutoffC: 24 } }),
    );
    expect(strict.troutApplicability).toBe('seasonal-likely-absent');
    expect(lenient.troutApplicability).toBe('seasonal-uncertain');
  });
});

describe('trout applicability — missing stocking history', () => {
  it('treats missing history as uncertainty, never fabricated absence', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'medium' },
        ],
        stockingEvents: [],
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
    expect(decision.confidence).toBe('low');
    expect(decision.reasons.join(' ')).toMatch(/missing history|uncertainty, not absence/i);
    const { included, excluded } = selectVisibleWaters([decision]);
    expect(included).toHaveLength(1);
    expect(excluded).toHaveLength(0);
  });

  it('returns unknown with no evidence at all, and discharge alone is never proof of trout', () => {
    const decision = evaluateWater(
      input({
        observations: [
          { metric: 'discharge-cfs', value: 250, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('unknown');
    expect(decision.confidence).toBe('low');
    expect(decision.cautions.join(' ')).toMatch(/discharge observations alone/i);
    // Flow data still supports generic conditions.
    expect(decision.displayMetric).toBe('fishability');
    expect(decision.fishability).toBe('good');
  });

  it('returns unknown for trout evidence whose basis is unknown', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [{ species: 'trout', basis: 'unknown', confidence: 'low' }],
      }),
    );
    expect(decision.troutApplicability).toBe('unknown');
    expect(decision.reasons.join(' ')).toMatch(/basis is unknown/i);
  });
});

describe('trout applicability — scheduled vs completed stocking', () => {
  it('a schedule alone never asserts presence; a completed report does', () => {
    const scheduled = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [
          { date: '2026-10-01', datePrecision: 'day', status: 'scheduled' },
        ],
      }),
    );
    expect(scheduled.troutApplicability).toBe('seasonal-uncertain');
    expect(scheduled.confidence).toBe('low');
    expect(scheduled.reasons.join(' ')).toMatch(/weaker evidence than a completed/i);

    const completed = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [
          { date: '2026-09-01', datePrecision: 'day', status: 'reported-complete' },
        ],
      }),
    );
    expect(completed.troutApplicability).toBe('probable-current');
    expect(completed.confidence).toBe('high');
  });
});

describe('trout applicability — conflicting species evidence', () => {
  it('authoritative non-trout evidence wins over weak trout evidence', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'largemouth bass', basis: 'wild-population', confidence: 'high' },
          { species: 'brown trout', basis: 'reported', confidence: 'high' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('not-trout');
    expect(decision.visibility).toBe('exclude');
  });

  it('strong year-round trout evidence survives a conflicting non-trout report', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'largemouth bass', basis: 'wild-population', confidence: 'high' },
          { species: 'brown trout', basis: 'wild-population', confidence: 'high' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('confirmed-current');
    expect(decision.cautions.join(' ')).toMatch(/conflicting species evidence/i);
  });

  it('catalog-style "warmwater" species evidence excludes the water from trout lists', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [{ species: 'warmwater', basis: 'wild-population', confidence: 'high' }],
      }),
    );
    expect(decision.troutApplicability).toBe('not-trout');
  });

  it('non-trout stocking events are not trout evidence', () => {
    const decision = evaluateWater(
      input({
        stockingEvents: [
          {
            date: '2026-09-01',
            datePrecision: 'day',
            status: 'reported-complete',
            species: ['largemouth bass'],
          },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('unknown');
  });
});
