import { describe, expect, it, vi, afterEach } from 'vitest';
import { flowTrend, scoreBand, whatChanged } from '../src/lib/conditions';
import { freshnessLabel, plainStatus, statusForScore } from '../src/features/map/riverMapSelectors';
import { scoreConditions, newestReadingAt, readingsAreStale, READING_STALE_MINUTES } from '@trout/contracts';
import type { GaugeReading, Stream } from '@trout/contracts';

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

describe('plainStatus', () => {
  it('never fabricates a score for no-data rivers', () => {
    expect(plainStatus('no-data', null)).toBe('No data');
    expect(plainStatus('poor', null)).toBe('No data');
  });

  it('keeps numeric status wording for scored rivers', () => {
    expect(plainStatus('good', 90)).toBe('90 · Good');
    expect(plainStatus('fair', 50)).toBe('50 · Fair');
    expect(plainStatus('poor', 37)).toBe('37 · Poor');
  });
});

describe('statusForScore', () => {
  it('treats a cannot-assess 0 score as no-data, never "0 · Poor"', () => {
    expect(statusForScore(0, true)).toBe('no-data');
    expect(statusForScore(null, false)).toBe('no-data');
    expect(statusForScore(37, true)).toBe('poor');
    expect(statusForScore(90, true)).toBe('good');
  });

  it('honors the assessed flag: a real 0 is Poor, an unassessed one is no-data', () => {
    // Real assessment clamped to 0 (lethal water temp over a floored flow).
    expect(statusForScore(0, true, true)).toBe('poor');
    // Explicitly cannot-assess (no usable flow/stage despite readings).
    expect(statusForScore(0, true, false)).toBe('no-data');
    // assessed=false wins even at a nonzero value (temp-only adjustment path).
    expect(statusForScore(10, true, false)).toBe('no-data');
    // Legacy snapshots without the flag keep the old inference.
    expect(statusForScore(0, true, undefined)).toBe('no-data');
    expect(statusForScore(55, true, true)).toBe('fair');
  });
});

const stream = { gaugeIds: ['g1'], idealFlow: [{ min: 100, max: 400 }] } as unknown as Stream;

describe('scoreConditions assessed flag', () => {
  it('a real assessment clamped to 0 by dangerous heat stays assessed (render Poor)', () => {
    // Flow far below range floors the flow score near 10; 27 °C subtracts 30 → clamps to 0.
    const s = scoreConditions(stream, [reading({ cfs: 5, tempC: 27 })]);
    expect(s.value).toBe(0);
    expect(s.assessed).toBe(true);
  });

  it('marks no-readings and gauge-mismatch as not assessed', () => {
    expect(scoreConditions(stream, []).assessed).toBe(false);
    const mismatched = scoreConditions(stream, [reading({ gaugeId: 'other', cfs: 200 })]);
    expect(mismatched.value).toBe(0);
    expect(mismatched.assessed).toBe(false);
  });

  it('marks readings with no usable flow/stage as not assessed (temp may still adjust value)', () => {
    const s = scoreConditions(stream, [reading({ cfs: undefined, heightFt: undefined, tempC: 12 })]);
    expect(s.assessed).toBe(false);
  });

  it('normal assessments report assessed true', () => {
    const s = scoreConditions(stream, [reading({ cfs: 200, tempC: 12 })]);
    expect(s.value).toBe(90); // 80 base + 10 ideal-temp bonus
    expect(s.assessed).toBe(true);
  });
});

describe('readingFreshness helpers', () => {
  const now = Date.parse('2026-09-01T15:00Z');

  it('newestReadingAt picks the newest usable timestamp and ignores junk', () => {
    const readings = [
      reading({ timestamp: '2026-09-01T13:00Z' }),
      reading({ timestamp: '2026-09-01T14:30Z' }),
      reading({ timestamp: 'not-a-date' }),
    ];
    expect(newestReadingAt(readings)).toBe(Date.parse('2026-09-01T14:30Z'));
    expect(newestReadingAt([])).toBeNull();
  });

  it('readingsAreStale keys off reading age, not fetch time', () => {
    const fresh = [reading({ timestamp: '2026-09-01T14:00Z' })]; // 60 min old
    const stale = [reading({ timestamp: '2026-09-01T09:00Z' })]; // 6 h old
    expect(readingsAreStale(fresh, now)).toBe(false);
    expect(readingsAreStale(stale, now)).toBe(true);
    expect(readingsAreStale([], now)).toBe(false); // nothing to be stale about
    expect(READING_STALE_MINUTES).toBe(180);
  });
});

describe('freshnessLabel observed-age semantics', () => {
  afterEach(() => vi.useRealTimers());

  it('reports reading age on a live fetch, and flags stale data even when fetched now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-09-01T15:00Z'));
    const fetchedAt = Date.parse('2026-09-01T14:59Z');
    const observedAt = Date.parse('2026-09-01T14:45Z'); // 15 min old reading
    expect(freshnessLabel(fetchedAt, true, observedAt)).toBe('Live · observed 15 min ago');
    const old = Date.parse('2026-09-01T08:00Z'); // 7 h old reading
    expect(freshnessLabel(fetchedAt, true, old)).toBe('Stale · observed 7 hr ago');
    expect(freshnessLabel(fetchedAt, false, old)).toContain('Offline · last known');
    expect(freshnessLabel(null, true)).toBe('Never updated');
  });
});
