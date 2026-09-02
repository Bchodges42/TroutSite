import { describe, expect, it } from 'vitest';
import { flowTrend, scoreBand, whatChanged } from '../src/lib/conditions';
import type { GaugeReading } from '@trout/contracts';

const reading = (over: Partial<GaugeReading>): GaugeReading => ({
  gaugeId: 'g1',
  cfs: 200,
  timestamp: '2026-09-01T14:00Z',
  ...over,
});

describe('flowTrend', () => {
  it('detects rising, falling, and steady flow', () => {
    const rising = [reading({ cfs: 300, timestamp: '2026-09-01T14:00Z' }), reading({ cfs: 100, timestamp: '2026-09-01T13:00Z' })];
    const falling = [reading({ cfs: 100, timestamp: '2026-09-01T14:00Z' }), reading({ cfs: 300, timestamp: '2026-09-01T13:00Z' })];
    const steady = [reading({ cfs: 200, timestamp: '2026-09-01T14:00Z' }), reading({ cfs: 198, timestamp: '2026-09-01T13:00Z' })];
    expect(flowTrend(rising)).toBe('rising');
    expect(flowTrend(falling)).toBe('falling');
    expect(flowTrend(steady)).toBe('steady');
  });

  it('is unknown without two cfs readings', () => {
    expect(flowTrend([reading({})])).toBe('unknown');
    expect(flowTrend([])).toBe('unknown');
    expect(flowTrend([reading({ cfs: undefined }), reading({})])).toBe('unknown');
  });
});

describe('scoreBand', () => {
  it('bands scores into good/fair/poor', () => {
    expect(scoreBand(90)).toBe('good');
    expect(scoreBand(70)).toBe('good');
    expect(scoreBand(69)).toBe('fair');
    expect(scoreBand(40)).toBe('fair');
    expect(scoreBand(39)).toBe('poor');
    expect(scoreBand(0)).toBe('poor');
  });
});

describe('whatChanged ("since your last visit")', () => {
  it('reports a significant flow change', () => {
    const prev = [reading({ cfs: 200, timestamp: '2026-09-01T08:00Z' })];
    const next = [reading({ cfs: 300, timestamp: '2026-09-01T14:00Z' })];
    const changes = whatChanged(prev, next);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toContain('Flow is up from 200 cfs to 300 cfs');
  });

  it('ignores insignificant flow drift', () => {
    const prev = [reading({ cfs: 200, timestamp: '2026-09-01T08:00Z' })];
    const next = [reading({ cfs: 205, timestamp: '2026-09-01T14:00Z' })];
    expect(whatChanged(prev, next)).toHaveLength(0);
  });

  it('reports a ≥1°C temperature move', () => {
    const prev = [reading({ tempC: 10, timestamp: '2026-09-01T08:00Z' })];
    const next = [reading({ tempC: 12, timestamp: '2026-09-01T14:00Z' })];
    expect(whatChanged(prev, next)[0]).toContain('10°C to 12°C');
  });

  it('reports new readings appearing', () => {
    const prev = [reading({})];
    const next = [reading({ timestamp: '2026-09-01T15:00Z' }), reading({ timestamp: '2026-09-01T14:00Z' })];
    expect(whatChanged(prev, next)).toContain('1 new gauge reading since your last visit.');
  });

  it('says nothing when both sides are empty', () => {
    expect(whatChanged([], [])).toHaveLength(0);
  });
});
