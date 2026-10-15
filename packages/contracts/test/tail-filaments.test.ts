import { describe, expect, it } from 'vitest';
import { BugObservationSchema, TailFilamentCountSchema, matchHatch } from '../src/index.js';
import { makeObservation, makeTaxon } from './helpers.js';

describe('tail-filament evidence', () => {
  it.each([0, 1, 2, 3, 'unknown', 'not-applicable'] as const)('accepts %s without coercing it to two tails', (tails) => {
    expect(TailFilamentCountSchema.parse(tails)).toBe(tails);
    expect(BugObservationSchema.parse(makeObservation({ tails })).tails).toBe(tails);
  });
  it.each(['unknown', 'not-applicable'] as const)('does not award an invented match for %s', (tails) => {
    const taxon = makeTaxon();
    taxon.keyAttributes.tails = tails;
    expect(matchHatch(makeObservation({ tails }), [], [taxon])[0]!.matchedAttributes).not.toContain('tails');
  });
  it('uses an observed absence to favor caddis over a two-tailed mayfly', () => {
    const caddis = makeTaxon({ id: 'caddis', commonName: 'Caddis' });
    caddis.keyAttributes.tails = 0;
    const mayfly = makeTaxon({ id: 'mayfly', commonName: 'Mayfly' });
    mayfly.keyAttributes.tails = 2;
    const result = matchHatch(makeObservation({ tails: 0 }), [], [mayfly, caddis]);
    expect(result[0]!.taxon.id).toBe('caddis');
    expect(result[0]!.score - result[1]!.score).toBe(1);
    expect(result[1]!.matchedAttributes).not.toContain('tails');
  });
});
