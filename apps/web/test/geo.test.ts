import { describe, expect, it } from 'vitest';
import { formatMiles, haversineMiles, nearestStreams } from '../src/lib/geo';

describe('on-device distance math ("near me")', () => {
  const knoxville = { lat: 35.96, lon: -83.92 };
  const nashville = { lat: 36.16, lon: -86.78 };

  it('computes a sane haversine distance', () => {
    // Knoxville → Nashville is roughly 160 miles as the crow flies.
    const d = haversineMiles(knoxville, nashville);
    expect(d).toBeGreaterThan(140);
    expect(d).toBeLessThan(180);
  });

  it('is zero for identical points', () => {
    expect(haversineMiles(knoxville, knoxville)).toBeCloseTo(0, 5);
  });

  it('sorts streams by distance and skips unknown geo', () => {
    const streams = [
      { id: 'far' },
      { id: 'near' },
      { id: 'no-geo' },
    ];
    const geo = {
      far: { lat: 36.5, lon: -82.1 }, // a few hundred miles away
      near: { lat: 35.97, lon: -83.93 },
    };
    const sorted = nearestStreams(streams, geo, knoxville);
    expect(sorted.map((s) => s.stream.id)).toEqual(['near', 'far']);
    expect(sorted[0].miles).toBeLessThan(sorted[1].miles);
  });

  it('formats miles', () => {
    expect(formatMiles(3.21)).toBe('3.2 mi');
    expect(formatMiles(42.6)).toBe('43 mi');
  });
});
