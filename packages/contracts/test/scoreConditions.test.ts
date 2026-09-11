import { describe, expect, it } from 'vitest';
import { scoreConditions } from '../src/index.js';
import { makeReading, makeStream } from './helpers.js';

describe('scoreConditions', () => {
  it('returns 0 with an explanatory reason when there are no readings at all', () => {
    const result = scoreConditions(makeStream(), []);
    expect(result.value).toBe(0);
    expect(result.reasons[0]).toMatch(/no gauge readings/i);
  });

  it('returns 0 when readings come from gauges not configured on the stream', () => {
    const result = scoreConditions(makeStream(), [makeReading({ gaugeId: '99999999' })]);
    expect(result.value).toBe(0);
    expect(result.reasons[0]).toMatch(/do not match/);
  });

  it('treats a stream with no gaugeIds as accepting any readings', () => {
    const result = scoreConditions(makeStream({ gaugeIds: [] }), [
      makeReading({ gaugeId: 'anything' }),
    ]);
    expect(result.value).toBeGreaterThan(0);
  });

  it('scores high when flow is inside the ideal range and temperature is ideal', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 250, tempC: 15 })]);
    expect(result.value).toBe(90); // 80 flow base + 10 temperature bonus
    expect(result.reasons.join(' ')).toMatch(/within the ideal range/);
    expect(result.reasons.join(' ')).toMatch(/ideal window/);
  });

  it('leaves the score unchanged for a marginal temperature', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 250, tempC: 21 })]);
    expect(result.value).toBe(80);
    expect(result.reasons.join(' ')).toMatch(/marginal/);
  });

  it('penalizes low flow proportionally to the deficit', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 50, tempC: 15 })]);
    expect(result.value).toBe(55); // 80 - round(0.5 * 70) = 45, +10 temp
    expect(result.reasons.join(' ')).toMatch(/below the ideal range/);
  });

  it('floors the flow score at 10 for extremely low water', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 0, tempC: 15 })]);
    expect(result.value).toBe(20); // 80 - 70 floored at 10, +10 temp
  });

  it('penalizes high flow proportionally to the surplus', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 440, tempC: 15 })]);
    expect(result.value).toBe(83); // 80 - round(0.1 * 70) = 73, +10 temp
    expect(result.reasons.join(' ')).toMatch(/above the ideal range/);
  });

  it('floors the flow score at 10 for dangerous high water', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 800, tempC: 15 })]);
    expect(result.value).toBe(20); // 80 - 70 floored at 10, +10 temp
  });

  it('scores 50 with limited confidence when only stage height is available', () => {
    const result = scoreConditions(makeStream(), [
      makeReading({ cfs: undefined, heightFt: 3.1, tempC: undefined }),
    ]);
    expect(result.value).toBe(50);
    expect(result.reasons.join(' ')).toMatch(/limited confidence/);
    expect(result.reasons.join(' ')).toMatch(/no water-temperature reading/i);
  });

  it('returns 0 (plus temperature context) when the gauge has no flow or stage data', () => {
    const result = scoreConditions(makeStream(), [
      makeReading({ cfs: undefined, heightFt: undefined, tempC: 15 }),
    ]);
    expect(result.value).toBe(10); // 0 base + 10 temperature bonus
    expect(result.reasons.join(' ')).toMatch(/no usable flow or stage data/i);
  });

  it('penalizes near-freezing water', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 250, tempC: 1 })]);
    expect(result.value).toBe(65); // 80 - 15
    expect(result.reasons.join(' ')).toMatch(/near freezing/);
  });

  it('penalizes dangerously warm water', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 250, tempC: 26 })]);
    expect(result.value).toBe(50); // 80 - 30
    expect(result.reasons.join(' ')).toMatch(/dangerously warm/);
  });

  it('clamps the final score to 0', () => {
    const result = scoreConditions(makeStream(), [makeReading({ cfs: 10, tempC: 26 })]);
    expect(result.value).toBe(0); // 17 - 30 → clamped
  });

  it('uses the newest cfs reading when readings arrive unsorted', () => {
    const result = scoreConditions(makeStream(), [
      makeReading({ cfs: 120, tempC: 10, timestamp: '2026-04-01T13:00Z' }),
      makeReading({ cfs: 250, tempC: 15, timestamp: '2026-04-01T14:00Z' }),
    ]);
    expect(result.value).toBe(90); // newest (250 cfs) is inside the range
  });

  it('sorts readings with unparsable timestamps oldest', () => {
    const result = scoreConditions(makeStream(), [
      makeReading({ cfs: 999, timestamp: 'not-a-date' }),
      makeReading({ cfs: 250, tempC: 15, timestamp: '2026-04-01T14:00Z' }),
    ]);
    expect(result.value).toBe(90); // the unparsable one is treated as oldest
  });

  it('accepts a cfs inside any of several seasonal ideal ranges', () => {
    const result = scoreConditions(
      makeStream({ idealFlow: [{ min: 100, max: 400, unit: 'cfs' }, { min: 600, max: 900, unit: 'cfs' }] }),
      [makeReading({ cfs: 700, tempC: 15 })],
    );
    expect(result.value).toBe(90);
  });

  it('scores 50 when flow exists but the stream has no ideal range configured', () => {
    const result = scoreConditions(makeStream({ idealFlow: [] }), [
      makeReading({ cfs: 250, tempC: undefined }),
    ]);
    expect(result.value).toBe(50);
    expect(result.reasons.join(' ')).toMatch(/no ideal flow range is configured/i);
  });

  it('notes when multiple gauge readings were aggregated', () => {
    const result = scoreConditions(makeStream({ gaugeIds: ['08155500', '08155400'] }), [
      makeReading({ gaugeId: '08155500', cfs: 250, tempC: 15 }),
      makeReading({ gaugeId: '08155400', cfs: 260, tempC: 15, timestamp: '2026-04-01T13:00Z' }),
    ]);
    expect(result.reasons.join(' ')).toMatch(/2 gauge readings/);
  });
});
