import { describe, expect, it } from 'vitest';
import {
  READING_STALE_MINUTES,
  newestReadingAt,
  readingAgeMinutes,
  readingsAreStale,
} from '../src/readingFreshness.js';
import type { GaugeReading } from '../src/schemas/gauge.js';

const reading = (timestamp: string, cfs = 42): GaugeReading => ({ gaugeId: 'g1', cfs, timestamp });

describe('readingFreshness', () => {
  it('keys staleness off the reading timestamp, not the fetch', () => {
    const now = Date.parse('2026-09-05T12:00:00Z');
    const fresh = [reading('2026-09-05T11:30:00Z')];
    const stale = [reading('2026-09-05T08:00:00Z')];
    expect(readingsAreStale(fresh, now)).toBe(false);
    expect(readingsAreStale(stale, now)).toBe(true);
    expect(READING_STALE_MINUTES).toBe(180);
  });

  it('picks the newest usable reading and ignores junk timestamps', () => {
    const newest = newestReadingAt([
      reading('2026-09-05T10:00:00Z'),
      reading('2026-09-05T11:00:00Z'),
      { gaugeId: 'g1', timestamp: 'not-a-date' },
    ]);
    expect(newest).toBe(Date.parse('2026-09-05T11:00:00Z'));
    expect(newestReadingAt([])).toBeNull();
    expect(newestReadingAt([{ gaugeId: 'g1', timestamp: 'garbage' }])).toBeNull();
  });

  it('computes reading age in minutes, floored at zero, null with no readings', () => {
    const now = Date.parse('2026-09-05T12:00:00Z');
    expect(readingAgeMinutes([reading('2026-09-05T11:00:00Z')], now)).toBe(60);
    // A future-dated reading never produces a negative age.
    expect(readingAgeMinutes([reading('2026-09-05T13:00:00Z')], now)).toBe(0);
    expect(readingAgeMinutes([], now)).toBeNull();
  });

  it('honors a custom staleness window', () => {
    const now = Date.parse('2026-09-05T12:00:00Z');
    const readings = [reading('2026-09-05T11:30:00Z')];
    expect(readingsAreStale(readings, now, 60)).toBe(false);
    expect(readingsAreStale(readings, now, 30)).toBe(false); // exactly the age is not stale
    expect(readingsAreStale(readings, now, 29)).toBe(true);
  });
});
