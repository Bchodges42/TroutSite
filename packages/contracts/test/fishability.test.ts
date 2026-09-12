import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  ActivityComponentSchema,
  ActivityOutlookSchema,
  ENDPOINTS,
  FishabilityScoreSchema,
  FishabilitySnapshotSchema,
  SpeciesComfortBandsSchema,
  SpeciesKeySchema,
  StreamSchema,
} from '../src/index.js';
import { makeStream } from './helpers.js';

/** The smallmouth ladder used across the F1/F4 tests (°C, ADR 0007 example). */
export const smallmouthBands = {
  species: 'smallmouth-bass' as const,
  unit: 'degC' as const,
  lethalLow: 0,
  avoidanceLow: 10,
  optimalLow: 18,
  optimalHigh: 26,
  avoidanceHigh: 30,
  lethalHigh: 33,
};

function component(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    factor: 'water-temperature',
    value: 80,
    contribution: 15,
    weight: 0.6,
    evidenceUrl: 'https://example.com/gauge/01234500',
    confidence: 'measured',
    label: 'Water temperature',
    ...overrides,
  };
}

describe('SpeciesKeySchema', () => {
  it('accepts exactly the seven frozen species keys', () => {
    const keys = [
      'largemouth-bass',
      'smallmouth-bass',
      'spotted-bass',
      'crappie',
      'bluegill',
      'channel-catfish',
      'striped-bass',
    ];
    expect(SpeciesKeySchema.options).toEqual(keys);
    for (const key of keys) expect(SpeciesKeySchema.parse(key)).toBe(key);
  });

  it('rejects unknown or badly-cased keys', () => {
    expect(() => SpeciesKeySchema.parse('walleye')).toThrow(ZodError);
    expect(() => SpeciesKeySchema.parse('Largemouth-Bass')).toThrow(ZodError);
    expect(() => SpeciesKeySchema.parse('trout')).toThrow(ZodError);
  });
});

describe('SpeciesComfortBandsSchema', () => {
  it('accepts a well-ordered ladder', () => {
    expect(SpeciesComfortBandsSchema.parse(smallmouthBands)).toBeDefined();
  });

  it('accepts a degenerate (single-point) optimal range', () => {
    expect(
      SpeciesComfortBandsSchema.parse({ ...smallmouthBands, optimalLow: 20, optimalHigh: 20 }),
    ).toBeDefined();
  });

  it('rejects each out-of-order boundary', () => {
    const cases = [
      { ...smallmouthBands, avoidanceLow: 0 }, // avoidanceLow == lethalLow
      { ...smallmouthBands, optimalLow: 9 }, // optimalLow < avoidanceLow
      { ...smallmouthBands, optimalHigh: 17 }, // optimalHigh < optimalLow
      { ...smallmouthBands, avoidanceHigh: 25 }, // avoidanceHigh <= optimalHigh
      { ...smallmouthBands, lethalHigh: 30 }, // lethalHigh <= avoidanceHigh
    ];
    for (const bands of cases) expect(() => SpeciesComfortBandsSchema.parse(bands)).toThrow(ZodError);
  });

  it('rejects a non-celsius unit', () => {
    expect(() => SpeciesComfortBandsSchema.parse({ ...smallmouthBands, unit: 'degF' })).toThrow(ZodError);
  });
});

describe('ActivityComponentSchema', () => {
  it('accepts a fully-attributed component', () => {
    expect(ActivityComponentSchema.parse(component())).toBeDefined();
  });

  it('rejects out-of-range value / weight / contribution', () => {
    expect(() => ActivityComponentSchema.parse(component({ value: 101 }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ value: -1 }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ weight: 1.2 }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ contribution: 51 }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ contribution: -51 }))).toThrow(ZodError);
  });

  it('rejects an unknown confidence, factor, or non-URL evidence', () => {
    expect(() => ActivityComponentSchema.parse(component({ confidence: 'vibes' }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ factor: 'moon-phase' }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ evidenceUrl: 'not a url' }))).toThrow(ZodError);
    expect(() => ActivityComponentSchema.parse(component({ label: '' }))).toThrow(ZodError);
  });
});

describe('ActivityOutlookSchema', () => {
  it('accepts components whose weights sum to 1 and contributions match weight × (value − 50)', () => {
    const outlook = {
      total: 53,
      components: [
        component({ factor: 'water-temperature', value: 80, weight: 0.6, contribution: 18 }), // 0.6 × 30
        component({
          factor: 'flow-trend',
          value: 70,
          weight: 0.4,
          contribution: 8,
          confidence: 'derived',
          label: 'Flow trend',
          evidenceUrl: 'https://example.com/usgs',
        }), // 0.4 × 20
      ],
    };
    expect(ActivityOutlookSchema.parse(outlook)).toBeDefined();
  });

  it('accepts an empty component list (no activity data)', () => {
    expect(ActivityOutlookSchema.parse({ total: 0, components: [] })).toBeDefined();
  });

  it('rejects weights that do not sum to 1 when components exist', () => {
    const outlook = { total: 50, components: [component({ weight: 0.5, contribution: 0 })] };
    expect(() => ActivityOutlookSchema.parse(outlook)).toThrow(/sum to 1/);
  });

  it('rejects a contribution inconsistent with weight × (value − 50) beyond tolerance', () => {
    const outlook = {
      total: 90,
      components: [component({ value: 80, weight: 0.6, contribution: 40 })], // 0.6 × 30 = 18, off by 22
    };
    expect(() => ActivityOutlookSchema.parse(outlook)).toThrow(/contribution/);
  });

  it('accepts rounding within the 1.5-point tolerance', () => {
    const outlook = { total: 81, components: [component({ value: 80, weight: 1, contribution: 30.2 })] };
    expect(ActivityOutlookSchema.parse(outlook)).toBeDefined();
  });
});

describe('FishabilityScoreSchema', () => {
  it('accepts an assessed score with freshness', () => {
    const score = {
      species: 'bluegill',
      value: 90,
      reasons: ['Water temperature 24°C is in the optimal range for bluegill.'],
      assessed: true,
      freshness: { observedAt: '2026-09-12T15:00:00Z', ageMinutes: 12 },
    };
    expect(FishabilityScoreSchema.parse(score)).toBeDefined();
  });

  it('accepts a cannot-assess score with null freshness', () => {
    const score = { species: 'crappie', value: 0, reasons: ['No data.'], assessed: false, freshness: null };
    expect(FishabilityScoreSchema.parse(score)).toBeDefined();
  });

  it('rejects out-of-range values, a non-integer value, or malformed freshness', () => {
    const base = { species: 'bluegill', value: 90, reasons: [], assessed: true, freshness: null };
    expect(() => FishabilityScoreSchema.parse({ ...base, value: 101 })).toThrow(ZodError);
    expect(() => FishabilityScoreSchema.parse({ ...base, value: 12.5 })).toThrow(ZodError);
    expect(() =>
      FishabilityScoreSchema.parse({ ...base, freshness: { observedAt: 'yesterday', ageMinutes: 1 } }),
    ).toThrow(ZodError);
    expect(() =>
      FishabilityScoreSchema.parse({ ...base, freshness: { observedAt: '2026-09-12T15:00:00Z', ageMinutes: -1 } }),
    ).toThrow(ZodError);
    expect(() => FishabilityScoreSchema.parse({ ...base, species: 'walleye' })).toThrow(ZodError);
  });
});

describe('FishabilitySnapshotSchema', () => {
  it('accepts a species-keyed comfort + activity map', () => {
    const snapshot = {
      streamId: 'duck-river',
      fetchedAt: '2026-09-12T15:00:00Z',
      bySpecies: {
        'smallmouth-bass': {
          comfort: {
            species: 'smallmouth-bass',
            value: 90,
            reasons: ['optimal'],
            assessed: true,
            freshness: { observedAt: '2026-09-12T15:00:00Z', ageMinutes: 5 },
          },
          activity: { total: 80, components: [component({ weight: 1, contribution: 30 })] },
        },
      },
    };
    expect(FishabilitySnapshotSchema.parse(snapshot)).toBeDefined();
  });

  it('rejects an unknown species key in bySpecies', () => {
    const snapshot = {
      streamId: 'x',
      fetchedAt: '2026-09-12T15:00:00Z',
      bySpecies: {
        walleye: {
          comfort: { species: 'walleye', value: 0, reasons: [], assessed: false, freshness: null },
          activity: { total: 0, components: [] },
        },
      },
    };
    expect(() => FishabilitySnapshotSchema.parse(snapshot)).toThrow(ZodError);
  });
});

describe('contract v2 additive surface', () => {
  it('adds the fishability endpoint without touching existing routes', () => {
    expect(ENDPOINTS.fishabilityForWater('duck-river')).toBe('/v1/fishability/duck-river.json');
    expect(ENDPOINTS.conditionsLatest).toBe('/v1/conditions/latest.json');
    expect(ENDPOINTS.streams).toBe('/v1/streams');
  });

  it('parses streams with the new optional targetSpecies', () => {
    const withSpecies = StreamSchema.parse(makeStream({ targetSpecies: ['smallmouth-bass', 'bluegill'] }));
    expect(withSpecies.targetSpecies).toEqual(['smallmouth-bass', 'bluegill']);
  });

  it('parses streams without targetSpecies and rejects unknown species keys', () => {
    const bare = StreamSchema.parse(makeStream());
    expect(bare.targetSpecies).toBeUndefined();
    expect(() => StreamSchema.parse(makeStream({ targetSpecies: ['trout'] as never }))).toThrow(ZodError);
  });
});
