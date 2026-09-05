// All-fish fishability, filtering, zero-flow handling, determinism, and
// model-versioning tests for the pure decision model.

import { describe, expect, it } from 'vitest';
import {
  evaluateWater,
  MODEL_VERSION,
  selectVisibleWaters,
  type FishabilityInput,
  type WaterDecision,
} from '../src/domain/fishability';

const input = (over: Partial<FishabilityInput> = {}): FishabilityInput => ({
  now: '2026-09-15T12:00:00Z',
  mode: 'all-fish',
  waterId: 'test-water',
  waterbodyType: 'creek',
  speciesEvidence: [],
  observations: [],
  stockingEvents: [],
  ...over,
});

describe('all-fish mode — general fishability', () => {
  it('scores fresh flow and temperature as good without pretending species-specific quality', () => {
    const decision = evaluateWater(
      input({
        observations: [
          { metric: 'discharge-cfs', value: 210, observedAt: '2026-09-14T12:00:00Z' },
          { metric: 'temperature-c', value: 22, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(decision.displayMetric).toBe('fishability');
    expect(decision.fishability).toBe('good');
    expect(decision.confidence).toBe('high');
    expect(decision.cautions.join(' ')).toMatch(/not species-specific/i);
  });

  it('treats zero CFS as a real reading (poor), not missing data', () => {
    const decision = evaluateWater(
      input({
        observations: [
          { metric: 'discharge-cfs', value: 0, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(decision.fishability).toBe('poor');
    expect(decision.displayMetric).toBe('fishability');
    expect(decision.cautions.join(' ')).toMatch(/zero discharge is a real reading/i);
  });

  it('zero CFS also degrades trout-mode conditions for an applicable water', () => {
    const decision = evaluateWater(
      input({
        mode: 'trout',
        speciesEvidence: [
          { species: 'brown trout', basis: 'wild-population', confidence: 'high' },
        ],
        observations: [
          { metric: 'discharge-cfs', value: 0, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(decision.troutApplicability).toBe('confirmed-current');
    expect(decision.fishability).toBe('poor');
    expect(decision.displayMetric).toBe('trout-condition');
  });

  it('caps at fair under hot (but not lethal) water and reads stage/reservoir level as water presence', () => {
    const hot = evaluateWater(
      input({
        observations: [
          { metric: 'temperature-c', value: 33, observedAt: '2026-09-14T12:00:00Z' },
          { metric: 'stage-ft', value: 2.4, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(hot.fishability).toBe('fair');

    const reservoir = evaluateWater(
      input({
        waterbodyType: 'lake',
        observations: [
          { metric: 'reservoir-level-ft', value: 641.2, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
    );
    expect(reservoir.fishability).toBe('good');
  });

  it('returns unassessed with no observations, and unknown (not a band) with only stale ones', () => {
    const empty = evaluateWater(input());
    expect(empty.displayMetric).toBe('unassessed');
    expect(empty.fishability).toBeUndefined();

    const staleOnly = evaluateWater(
      input({
        observations: [
          { metric: 'discharge-cfs', value: 120, observedAt: '2026-08-01T12:00:00Z' },
        ],
      }),
    );
    expect(staleOnly.fishability).toBe('unknown');
    expect(staleOnly.displayMetric).toBe('unassessed');
    expect(staleOnly.confidence).toBe('low');
  });

  it('never returns trout-condition in all-fish mode for any water', () => {
    const cases: FishabilityInput[] = [
      input({
        waterbodyType: 'tailrace',
        speciesEvidence: [
          { species: 'trout', basis: 'year-round-managed', confidence: 'high' },
        ],
        observations: [
          { metric: 'temperature-c', value: 26, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
      input({
        speciesEvidence: [
          { species: 'brown trout', basis: 'wild-population', confidence: 'high' },
        ],
        observations: [
          { metric: 'temperature-c', value: 12, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
      input({
        stockingEvents: [
          { date: '2026-09-01', datePrecision: 'day', status: 'reported-complete' },
        ],
        observations: [
          { metric: 'discharge-cfs', value: 40, observedAt: '2026-09-14T12:00:00Z' },
        ],
      }),
      input(),
      input({
        speciesEvidence: [{ species: 'largemouth bass', basis: 'wild-population', confidence: 'high' }],
      }),
    ];
    const decisions = cases.map((c) => evaluateWater(c));
    for (const decision of decisions) {
      expect(decision.displayMetric).not.toBe('trout-condition');
    }
    // Applicability is still computed as background truth, but never drives display.
    expect(decisions[0]?.troutApplicability).toBe('confirmed-current');
    expect(decisions[0]?.displayMetric).toBe('fishability');
    expect(decisions[0]?.fishability).toBe('fair');
  });

  it('does not reuse the trout band: 22°C with flow is good for all-fish, fair for trout', () => {
    const observations = [
      { metric: 'temperature-c' as const, value: 22, observedAt: '2026-09-14T12:00:00Z' },
      { metric: 'discharge-cfs' as const, value: 100, observedAt: '2026-09-14T12:00:00Z' },
    ];
    const allFish = evaluateWater(input({ observations }));
    const trout = evaluateWater(
      input({
        mode: 'trout',
        speciesEvidence: [
          { species: 'brown trout', basis: 'wild-population', confidence: 'high' },
        ],
        observations,
      }),
    );
    expect(allFish.fishability).toBe('good');
    expect(allFish.displayMetric).toBe('fishability');
    expect(trout.fishability).toBe('fair');
    expect(trout.displayMetric).toBe('trout-condition');
  });
});

describe('filtering — selectVisibleWaters', () => {
  const includeWater = evaluateWater(
    input({
      waterId: 'wild-creek',
      mode: 'trout',
      speciesEvidence: [
        { species: 'brown trout', basis: 'wild-population', confidence: 'high' },
      ],
    }),
  );
  const notTroutWater = evaluateWater(
    input({
      waterId: 'bass-lake',
      mode: 'trout',
      speciesEvidence: [
        { species: 'largemouth bass', basis: 'wild-population', confidence: 'high' },
      ],
    }),
  );
  const uncertainWater = evaluateWater(
    input({
      waterId: 'old-put-and-take',
      mode: 'trout',
      speciesEvidence: [
        { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
      ],
      stockingEvents: [
        { date: '2026-02-10', datePrecision: 'day', status: 'reported-complete' },
      ],
    }),
  );
  const decisions = [includeWater, notTroutWater, uncertainWater];

  it('includes and de-emphasizes in stable order, and explains every exclusion', () => {
    const result = selectVisibleWaters(decisions);
    expect(result.included.map((d: WaterDecision) => d.waterId)).toEqual([
      'wild-creek',
      'old-put-and-take',
    ]);
    expect(result.deemphasized.map((d: WaterDecision) => d.waterId)).toEqual([
      'old-put-and-take',
    ]);
    expect(result.excluded).toHaveLength(1);
    expect(result.excluded[0]?.decision.waterId).toBe('bass-lake');
    expect(result.excluded[0]?.rule).toBe('not-trout');
    expect(result.excluded[0]?.reasons.length).toBeGreaterThan(0);
    expect(result.selected).toBeNull();
  });

  it('keeps a selected water inspectable even when filtered from the general list', () => {
    const result = selectVisibleWaters(decisions, { selectedWaterId: 'bass-lake' });
    expect(result.excluded.map((e) => e.decision.waterId)).toEqual(['bass-lake']);
    expect(result.included.map((d: WaterDecision) => d.waterId)).not.toContain('bass-lake');
    expect(result.selected?.waterId).toBe('bass-lake');
    // The selected decision is complete and inspectable.
    expect(result.selected?.reasons.length).toBeGreaterThan(0);
    expect(result.selected?.visibility).toBe('exclude');
  });

  it('echoes a selected water that is visible normally', () => {
    const result = selectVisibleWaters(decisions, { selectedWaterId: 'wild-creek' });
    expect(result.selected?.waterId).toBe('wild-creek');
    expect(result.included.map((d: WaterDecision) => d.waterId)).toContain('wild-creek');
  });

  it('never excludes uncertain waters (they are de-emphasized, still visible)', () => {
    const result = selectVisibleWaters([uncertainWater]);
    expect(result.excluded).toHaveLength(0);
    expect(result.included).toHaveLength(1);
  });
});

describe('determinism and time zones', () => {
  const scenario: Partial<FishabilityInput> = {
    speciesEvidence: [
      { species: 'rainbow trout', basis: 'seasonal-stocking', confidence: 'high' },
    ],
    stockingEvents: [{ date: '2026-02-10', datePrecision: 'day', status: 'reported-complete' }],
    observations: [
      { metric: 'temperature-c', value: 26.5, observedAt: '2026-09-14T12:00:00Z' },
    ],
    seasonalPolicy: { stockedMonths: [12, 1, 2] },
  };

  it('produces identical decisions for the same instant expressed in Z or with an offset', () => {
    const zulu = evaluateWater(input({ ...scenario, now: '2026-09-15T12:00:00Z' }));
    const offset = evaluateWater(input({ ...scenario, now: '2026-09-15T08:00:00-04:00' }));
    expect(offset).toEqual(zulu);
  });

  it('treats date-only, explicit-UTC, and zone-free stocking dates identically', () => {
    const dateOnly = evaluateWater(
      input({ ...scenario, stockingEvents: [{ date: '2026-02-10', datePrecision: 'day', status: 'reported-complete' }] }),
    );
    const explicitUtc = evaluateWater(
      input({ ...scenario, stockingEvents: [{ date: '2026-02-10T00:00:00Z', datePrecision: 'day', status: 'reported-complete' }] }),
    );
    const zoneFree = evaluateWater(
      input({ ...scenario, stockingEvents: [{ date: '2026-02-10T00:00:00', datePrecision: 'day', status: 'reported-complete' }] }),
    );
    expect(explicitUtc).toEqual(dateOnly);
    // The zone-free form is UTC by model rule, so it matches even on a
    // machine whose local timezone is not UTC.
    expect(zoneFree).toEqual(dateOnly);
  });

  it('derives the model month from the UTC instant, not the local offset', () => {
    const decision = evaluateWater(
      input({ ...scenario, now: '2026-09-30T23:30:00-05:00' }),
      { debug: true },
    );
    // Local time says September 30; UTC says October 1.
    expect(decision.debug?.monthUtc).toBe(10);
  });

  it('is repeatable and does not mutate its input', () => {
    const frozen = input({ ...scenario });
    const snapshot = JSON.stringify(frozen);
    const first = evaluateWater(frozen);
    const second = evaluateWater(frozen);
    expect(second).toEqual(first);
    expect(JSON.stringify(frozen)).toBe(snapshot);
  });

  it('throws on unparsable timestamps instead of guessing', () => {
    expect(() => evaluateWater(input({ now: 'not-a-date' }))).toThrow(/unparsable now/);
    expect(() =>
      evaluateWater(
        input({
          stockingEvents: [
            { date: 'February sometime', datePrecision: 'month', status: 'reported-complete' },
          ],
        }),
      ),
    ).toThrow(/unparsable stocking date/);
  });
});

describe('model versioning and debug metadata', () => {
  it('exposes a semver model version, included in debug metadata on request', () => {
    expect(MODEL_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    const plain = evaluateWater(input({ observations: [
      { metric: 'discharge-cfs', value: 10, observedAt: '2026-09-14T12:00:00Z' },
    ] }));
    expect(plain).not.toHaveProperty('debug');

    const debugged = evaluateWater(input(), { debug: true });
    expect(debugged.debug?.modelVersion).toBe(MODEL_VERSION);
    expect(debugged.debug?.monthUtc).toBe(9);
    expect(debugged.debug?.retentionDays).toBe(60);
    expect(debugged.debug?.warmEvidence).toBe('no-temperature');
    expect(debugged.debug?.elapsedDaysSinceLastCompletedStocking).toBeNull();
  });

  it('reports stocking age and warm evidence in debug metadata', () => {
    const decision = evaluateWater(
      input({
        stockingEvents: [{ date: '2026-02-10', datePrecision: 'day', status: 'reported-complete' }],
        observations: [
          { metric: 'temperature-c', value: 27, observedAt: '2026-08-01T12:00:00Z' },
        ],
        seasonalPolicy: { stockedMonths: [12, 1, 2] },
      }),
      { debug: true },
    );
    // Feb 10 00:00Z → Sep 15 12:00Z = 217.5 days.
    expect(decision.debug?.elapsedDaysSinceLastCompletedStocking).toBe(217.5);
    expect(decision.debug?.warmEvidence).toBe('stale-warm');
  });
});
