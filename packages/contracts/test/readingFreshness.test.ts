import { describe, expect, it } from 'vitest';
import {
  READING_STALE_MINUTES,
  newestReadingAt,
  readingAgeMinutes,
  readingsAreStale,
} from '../src/index.js';
import { makeReading } from './helpers.js';

describe('readingFreshness', () => {
  const NOW = Date.parse('2026-09-04T20:00:00Z');

  it('exposes the default stale threshold', () => {
    expect(READING_STALE_MINUTES).toBe(180);
  });

  it('newestReadingAt picks the newest reading and ignores unparseable timestamps', () => {
    const readings = [
      makeReading({ timestamp: '2026-09-04T18:00:00Z' }),
      makeReading({ gaugeId: '03433500', timestamp: '2026-09-04T19:30:00Z' }),
      makeReading({ gaugeId: '03430200', timestamp: 'not-a-timestamp' }),
    ];
    expect(newestReadingAt(readings)).toBe(Date.parse('2026-09-04T19:30:00Z'));
    expect(newestReadingAt([])).toBeNull();
  });

  it('readingAgeMinutes measures age from the newest reading, floored at zero', () => {
    const readings = [makeReading({ timestamp: '2026-09-04T19:00:00Z' })];
    expect(readingAgeMinutes(readings, NOW)).toBe(60);
    // A reading timestamped in the future is an age of 0, never negative.
    expect(readingAgeMinutes([makeReading({ timestamp: '2026-09-04T21:00:00Z' })], NOW)).toBe(0);
    expect(readingAgeMinutes([], NOW)).toBeNull();
  });

  it('readingsAreStale keys off reading age, not fetch success', () => {
    const fresh = [makeReading({ timestamp: '2026-09-04T19:00:00Z' })];
    const stale = [makeReading({ timestamp: '2026-09-04T14:00:00Z' })];
    expect(readingsAreStale(fresh, NOW)).toBe(false);
    expect(readingsAreStale(stale, NOW)).toBe(true);
    // No readings → not stale (there is nothing to be stale about).
    expect(readingsAreStale([], NOW)).toBe(false);
    // Custom threshold is honored.
    expect(readingsAreStale(stale, NOW, 400)).toBe(false);
  });
});
