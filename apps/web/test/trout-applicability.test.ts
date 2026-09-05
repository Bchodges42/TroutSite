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

const oldWinterStocking = {
  date: '2026-02-10',
  datePrecision: 'day',
  status: 'reported-complete',
} as const;

describe('trout applicability — September with only old winter stocking', () => {
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
    // The aged-out comparison actually fired (not the within-window phrasing).
    expect(decision.reasons.join(' ')).toMatch(/past the \d+-day retention window/i);
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

  it('becomes seasonal-likely-absent with current warm water, and is excludable only at high confidence', () => {
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
    expect(decision.reasons.join(' ')).toMatch(/26\.5/);
    expect(decision.reasons.join(' ')).toMatch(/cutoff/i);
    expect(decision.cautions.join(' ')).toMatch(/inference|not a certainty/i);

    const { included, excluded } = selectVisibleWaters([decision]);
    expect(included).toHaveLength(0);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]?.rule).toBe('seasonal-likely-absent-high-confidence');
    expect(excluded[0]?.reasons.length).toBeGreaterThan(0);
  });

  it('flips absence confidence at the 2x-retention boundary, not at a blessed constant', () => {
    // 2026-05-17T12:00Z is exactly 121 days before now; 2026-05-18T12:00Z is
    // exactly 120 (= 2 x 60). Same decision otherwise.
    const make = (date: string) =>
      evaluateWater(
        input({
          speciesEvidence: [
            { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
          ],
          stockingEvents: [{ date, datePrecision: 'day', status: 'reported-complete' }],
          observations: [
            { metric: 'temperature-c', value: 26.5, observedAt: '2026-09-14T12:00:00Z' },
          ],
          seasonalPolicy: { stockedMonths: [12, 1, 2] },
        }),
      );
    const decisive = make('2026-05-17T12:00:00Z');
    const borderline = make('2026-05-18T12:00:00Z');
    expect(decisive.troutApplicability).toBe('seasonal-likely-absent');
    expect(decisive.confidence).toBe('high');
    expect(borderline.troutApplicability).toBe('seasonal-likely-absent');
    expect(borderline.confidence).toBe('medium');
    // Medium-confidence absence is de-emphasized, never silently excluded.
    const { included, excluded } = selectVisibleWaters([borderline]);
    expect(included).toHaveLength(1);
    expect(excluded).toHaveLength(0);
  });

  it('requires corroborating warm readings for high confidence when minSustainedWarmObservations is raised', () => {
    const observations = [
      { metric: 'temperature-c' as const, value: 26.5, observedAt: '2026-09-14T12:00:00Z' },
    ];
    const corroboratedObservations = [
      ...observations,
      { metric: 'temperature-c' as const, value: 25.5, observedAt: '2026-09-13T12:00:00Z' },
    ];
    const base = {
      speciesEvidence: [
        { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
      ],
      stockingEvents: [oldWinterStocking],
      seasonalPolicy: { stockedMonths: [12, 1, 2] },
    } as const;

    // Default config (min 1): one fresh warm reading supports high-confidence absence.
    const singleDefault = evaluateWater(input({ ...base, observations }));
    expect(singleDefault.confidence).toBe('high');
    expect(singleDefault.visibility).toBe('exclude');

    // With the named override at 2, a single warm reading drops to medium
    // confidence: de-emphasized, never silently excluded, with a caution
    // saying corroboration is needed.
    const singleStrict = evaluateWater(input({ ...base, observations }), {
      overrides: { trout: { minSustainedWarmObservations: 2 } },
    });
    expect(singleStrict.troutApplicability).toBe('seasonal-likely-absent');
    expect(singleStrict.confidence).toBe('medium');
    expect(singleStrict.visibility).toBe('deemphasize');
    expect(singleStrict.cautions.join(' ')).toMatch(/corroborating warm readings/i);

    // Two fresh warm readings satisfy the stricter requirement.
    const corroborated = evaluateWater(
      input({ ...base, observations: corroboratedObservations }),
      { overrides: { trout: { minSustainedWarmObservations: 2 } } },
    );
    expect(corroborated.confidence).toBe('high');
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

  it('gives month-precision stocking dates the benefit of the doubt at the retention boundary', () => {
    // Nominal age 67 days > 60-day retention, but with month precision the
    // true date could sit up to 15 days later (youngest plausible age 52),
    // so presence must survive the nominal boundary.
    const withGrace = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [
          { date: '2026-07-10', datePrecision: 'month', status: 'reported-complete' },
        ],
      }),
    );
    expect(withGrace.troutApplicability).toBe('probable-current');
    expect(withGrace.confidence).toBe('medium');
    expect(withGrace.cautions.join(' ')).toMatch(/"month" precision|approximate/i);

    // Far past even the oldest plausible age, uncertainty resumes.
    const agedOut = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [
          { date: '2026-04-10', datePrecision: 'month', status: 'reported-complete' },
        ],
      }),
    );
    expect(agedOut.troutApplicability).toBe('seasonal-uncertain');
  });

  it('says "near the cutoff" instead of implying no temperature evidence when the freshest reading is cool but close', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
        ],
        stockingEvents: [oldWinterStocking],
        observations: [
          { metric: 'temperature-c', value: 22, observedAt: '2026-09-14T12:00:00Z' },
        ],
        seasonalPolicy: { stockedMonths: [12, 1, 2] },
      }),
    );
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
    expect(decision.reasons.join(' ')).toMatch(/near, but below, the 24°C cutoff/i);
  });

  it('ignores a future-dated completed stocking with an explicit caution', () => {
    const decision = evaluateWater(
      input({
        stockingEvents: [
          { date: '2026-10-01', datePrecision: 'day', status: 'reported-complete' },
        ],
      }),
    );
    // A "completed" event dated in the future is bad data: it asserts no
    // presence, and the water falls back to record-exists uncertainty.
    expect(decision.troutApplicability).toBe('seasonal-uncertain');
    expect(decision.confidence).toBe('low');
    expect(decision.cautions.join(' ')).toMatch(/future|bad data/i);
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
    expect(decision.visibility).toBe('include');
  });

  it('does not call low-confidence wild evidence "documented"; keeps it visible but de-emphasized', () => {
    const decision = evaluateWater(
      input({
        speciesEvidence: [
          { species: 'brown trout', basis: 'wild-population', confidence: 'low' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('probable-current');
    expect(decision.confidence).toBe('low');
    expect(decision.reasons.join(' ')).toMatch(/unverified/i);
    expect(decision.reasons.join(' ')).not.toMatch(/documented/);
    // Weak presence stays inspectable but ranked below solid waters.
    const { included, deemphasized } = selectVisibleWaters([decision]);
    expect(included).toHaveLength(1);
    expect(deemphasized).toHaveLength(1);
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
