import { describe, expect, it } from 'vitest';
import {
  scoreActivity,
  scoreFishability,
  type ActivityComponent,
  type GaugeReading,
  type SpeciesComfortBands,
} from '../src/index.js';
import { smallmouthBands } from './fishability.test.js';

const NOW = Date.parse('2026-09-12T16:00:00Z');

function reading(overrides: Partial<GaugeReading> & { tempC?: number; ageMinutes?: number }): GaugeReading {
  const { ageMinutes = 10, tempC, ...rest } = overrides;
  return {
    gaugeId: '01234500',
    ...(tempC !== undefined ? { tempC } : {}),
    timestamp: new Date(NOW - ageMinutes * 60_000).toISOString(),
    ...rest,
  } as GaugeReading;
}

describe('scoreFishability boundaries', () => {
  const cases: Array<[number, number, boolean, string]> = [
    // [temp °C, expected value, expected assessed, zone]
    [smallmouthBands.lethalLow, 0, true, 'lethal-low'], // exactly lethalLow → lethal
    [smallmouthBands.lethalHigh, 0, true, 'lethal-high'], // exactly lethalHigh → lethal
    [smallmouthBands.avoidanceLow, 40, true, 'avoidance-low'], // exactly avoidanceLow
    [smallmouthBands.avoidanceHigh, 40, true, 'avoidance-high'], // exactly avoidanceHigh
    [smallmouthBands.optimalLow, 90, true, 'optimal-low-edge'], // exactly optimalLow
    [smallmouthBands.optimalHigh, 90, true, 'optimal-high-edge'], // exactly optimalHigh
    [(smallmouthBands.optimalLow + smallmouthBands.optimalHigh) / 2, 90, true, 'optimal-middle'],
  ];
  for (const [tempC, value, assessed, zone] of cases) {
    it(`zones ${tempC}°C as ${zone} → ${value}`, () => {
      const score = scoreFishability([reading({ tempC })], 'smallmouth-bass', smallmouthBands, NOW);
      expect(score.value).toBe(value);
      expect(score.assessed).toBe(assessed);
    });
  }

  it('a lethal clamped-0 is a REAL assessment (Poor, not No data)', () => {
    const score = scoreFishability([reading({ tempC: 35 })], 'smallmouth-bass', smallmouthBands, NOW);
    expect(score).toMatchObject({ value: 0, assessed: true });
    expect(score.reasons.join(' ')).toMatch(/lethal/i);
    expect(score.reasons.join(' ')).toMatch(/not missing data/i);
    expect(score.freshness).not.toBeNull();
  });

  it('cannot-assess when no reading carries a temperature', () => {
    const score = scoreFishability([reading({})], 'smallmouth-bass', smallmouthBands, NOW);
    expect(score).toMatchObject({ value: 0, assessed: false, freshness: null });
    expect(score.reasons.join(' ')).toMatch(/No water-temperature reading/);
  });

  it('cannot-assess on an empty reading list', () => {
    const score = scoreFishability([], 'smallmouth-bass', smallmouthBands, NOW);
    expect(score).toMatchObject({ value: 0, assessed: false, freshness: null });
  });

  it('cannot-assess when the temperature is past the freshness window (per-metric age)', () => {
    const score = scoreFishability(
      [reading({ tempC: 22, ageMinutes: 181 })],
      'smallmouth-bass',
      smallmouthBands,
      NOW,
    );
    expect(score.assessed).toBe(false);
    expect(score.freshness).toBeNull();
    expect(score.reasons.join(' ')).toMatch(/181 minutes old/);
  });

  it('a temperature exactly at the 180-minute window boundary is still fresh', () => {
    const score = scoreFishability(
      [reading({ tempC: 22, ageMinutes: 180 })],
      'smallmouth-bass',
      smallmouthBands,
      NOW,
    );
    expect(score.assessed).toBe(true);
    expect(score.freshness?.ageMinutes).toBe(180);
  });

  it('uses the temperature of the newest reading that carries one (per-metric observation age)', () => {
    const score = scoreFishability(
      [reading({ ageMinutes: 5 }), reading({ tempC: 22, ageMinutes: 30 })],
      'smallmouth-bass',
      smallmouthBands,
      NOW,
    );
    expect(score.assessed).toBe(true);
    expect(score.freshness?.observedAt).toBe(new Date(NOW - 30 * 60_000).toISOString());
  });

  it('cannot-assess when bands are for a different species', () => {
    const score = scoreFishability([reading({ tempC: 22 })], 'bluegill', smallmouthBands, NOW);
    expect(score).toMatchObject({ species: 'bluegill', value: 0, assessed: false, freshness: null });
    expect(score.reasons.join(' ')).toMatch(/smallmouth-bass/);
  });

  // Stage 3 amendment: high-side-only bands (no sourced cold side) — cold water
  // is avoidance, never lethal, and the warm side scores exactly as before.
  const highOnly: SpeciesComfortBands = {
    species: 'largemouth-bass',
    unit: 'degC',
    optimalLow: 26.7,
    optimalHigh: 30,
    avoidanceHigh: 32,
    lethalHigh: 34,
  };

  it('scores cold water as avoidance (40), never lethal, when no cold side is authored', () => {
    const cold = scoreFishability([reading({ tempC: 5 })], 'largemouth-bass', highOnly, NOW);
    expect(cold).toMatchObject({ value: 40, assessed: true });
    expect(cold.reasons.join(' ')).toMatch(/below/);
    const freezing = scoreFishability([reading({ tempC: -2 })], 'largemouth-bass', highOnly, NOW);
    expect(freezing.value).toBe(40);
    expect(freezing.reasons.join(' ')).not.toMatch(/lethal/i);
  });

  it('warm-side zones unchanged for high-side-only bands', () => {
    expect(scoreFishability([reading({ tempC: 28 })], 'largemouth-bass', highOnly, NOW).value).toBe(90);
    expect(scoreFishability([reading({ tempC: 31 })], 'largemouth-bass', highOnly, NOW).value).toBe(40);
    const lethal = scoreFishability([reading({ tempC: 35 })], 'largemouth-bass', highOnly, NOW);
    expect(lethal).toMatchObject({ value: 0, assessed: true });
  });
});

describe('scoreFishability properties (seeded, deterministic)', () => {
  // mulberry32 — a tiny seeded PRNG so "property" runs are reproducible.
  function prng(seed: number): () => number {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomBands(rand: () => number): SpeciesComfortBands {
    for (;;) {
      const lethalLow = -5 + Math.floor(rand() * 5); // -5..-1
      const avoidanceLow = lethalLow + 1 + Math.floor(rand() * 8);
      const optimalLow = avoidanceLow + 1 + Math.floor(rand() * 6);
      const optimalHigh = optimalLow + Math.floor(rand() * 5);
      const avoidanceHigh = optimalHigh + 1 + Math.floor(rand() * 6);
      const lethalHigh = avoidanceHigh + 1 + Math.floor(rand() * 6);
      const bands = {
        species: 'largemouth-bass' as const,
        unit: 'degC' as const,
        lethalLow,
        avoidanceLow,
        optimalLow,
        optimalHigh,
        avoidanceHigh,
        lethalHigh,
      };
      if (isBandOrderValid(bands)) return bands;
    }
  }

  function isBandOrderValid(b: SpeciesComfortBands): boolean {
    return (
      b.lethalLow < b.avoidanceLow &&
      b.avoidanceLow < b.optimalLow &&
      b.optimalLow <= b.optimalHigh &&
      b.optimalHigh < b.avoidanceHigh &&
      b.avoidanceHigh < b.lethalHigh
    );
  }

  it('every score is a well-formed contract row for any temperature and any bands', () => {
    const rand = prng(20260912);
    for (let i = 0; i < 300; i += 1) {
      const bands = randomBands(rand);
      const tempC = -20 + rand() * 65;
      const ageMinutes = Math.floor(rand() * 300);
      const score = scoreFishability(
        [reading({ tempC, ageMinutes })],
        'largemouth-bass',
        bands,
        NOW,
      );
      expect(Number.isInteger(score.value)).toBe(true);
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
      if (score.assessed) {
        expect(score.reasons.length).toBeGreaterThan(0);
        expect(score.freshness).not.toBeNull();
        // Only lethal (0), avoidance (40), and optimal (90) values exist.
        expect([0, 40, 90]).toContain(score.value);
      } else {
        expect(score.value).toBe(0);
        expect(score.freshness).toBeNull();
      }
    }
  });

  it('zone membership is a pure function of temperature: same input, same score', () => {
    const rand = prng(42);
    const bands = randomBands(rand);
    const tempC = bands.optimalLow + rand() * (bands.optimalHigh - bands.optimalLow);
    const readings = [reading({ tempC })];
    const a = scoreFishability(readings, 'largemouth-bass', bands, NOW);
    const b = scoreFishability(readings, 'largemouth-bass', bands, NOW);
    expect(a).toEqual(b);
  });

  it('never mutates its inputs (frozen inputs score without throwing, values unchanged)', () => {
    const readings = [Object.freeze({ ...reading({ tempC: 22 }), timestamp: reading({ tempC: 22 }).timestamp })];
    const bands: SpeciesComfortBands = Object.freeze({ ...smallmouthBands }) as SpeciesComfortBands;
    const before = JSON.stringify(readings);
    const score = scoreFishability(readings as GaugeReading[], 'smallmouth-bass', bands, NOW);
    expect(JSON.stringify(readings)).toBe(before);
    expect(score.assessed).toBe(true);
  });

  it('comfort ordering holds across all zones: optimal (90) > avoidance (40) > lethal (0)', () => {
    const rand = prng(7);
    for (let i = 0; i < 100; i += 1) {
      const bands = randomBands(rand);
      const optimal = scoreFishability(
        [reading({ tempC: (bands.optimalLow + bands.optimalHigh) / 2 })],
        'largemouth-bass',
        bands,
        NOW,
      );
      const avoidance = scoreFishability(
        [reading({ tempC: (bands.optimalHigh + bands.avoidanceHigh) / 2 })],
        'largemouth-bass',
        bands,
        NOW,
      );
      const lethal = scoreFishability([reading({ tempC: bands.lethalHigh + 5 })], 'largemouth-bass', bands, NOW);
      expect(optimal.value).toBe(90);
      expect(avoidance.value).toBe(40);
      expect(lethal.value).toBe(0);
      expect(optimal.value).toBeGreaterThan(avoidance.value);
      expect(avoidance.value).toBeGreaterThan(lethal.value);
    }
  });
});

describe('scoreActivity', () => {
  function comp(overrides: Partial<ActivityComponent>): ActivityComponent {
    return {
      factor: 'water-temperature',
      value: 80,
      contribution: 30,
      weight: 1,
      evidenceUrl: 'https://example.com/x',
      confidence: 'measured',
      label: 'Water temperature',
      ...overrides,
    };
  }

  it('total = 50 + Σ contribution, clamped to 0–100', () => {
    expect(
      scoreActivity([comp({ contribution: 30 }), comp({ factor: 'flow-trend', contribution: 8, weight: 0, value: 50 })])
        .total,
    ).toBe(88);
    expect(scoreActivity([comp({ contribution: 50 }), comp({ factor: 'flow-trend', contribution: 50, weight: 0, value: 100 })]).total).toBe(100);
    expect(scoreActivity([comp({ contribution: -50 }), comp({ factor: 'flow-trend', contribution: -50, weight: 0, value: 0 })]).total).toBe(0);
  });

  it('orders components descending by |contribution|', () => {
    const out = scoreActivity([
      comp({ factor: 'flow-trend', contribution: 5 }),
      comp({ contribution: -30 }),
      comp({ factor: 'spawn-state', contribution: 12 }),
    ]);
    expect(out.components.map((c) => Math.abs(c.contribution))).toEqual([30, 12, 5]);
  });

  it('breaks ties stably (authoring order preserved)', () => {
    const out = scoreActivity([
      comp({ factor: 'water-temperature', contribution: 10 }),
      comp({ factor: 'flow-trend', contribution: -10 }),
      comp({ factor: 'pressure-trend', contribution: 10 }),
    ]);
    expect(out.components.map((c) => c.factor)).toEqual([
      'water-temperature',
      'flow-trend',
      'pressure-trend',
    ]);
  });

  it('empty components → total 0, empty list (honest unavailability)', () => {
    expect(scoreActivity([])).toEqual({ total: 0, components: [] });
  });

  it('never mutates its input', () => {
    const input = Object.freeze([comp({ contribution: 5 }), comp({ contribution: 30 })]) as ActivityComponent[];
    const before = JSON.stringify(input);
    const out = scoreActivity(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(out.components[0]!.contribution).toBe(30);
  });

  it('is deterministic: same inputs, same outlook', () => {
    const input = [comp({ contribution: 3 }), comp({ contribution: -17 }), comp({ contribution: 17 })];
    expect(scoreActivity(input)).toEqual(scoreActivity(input.map((c) => ({ ...c }))));
  });
});
