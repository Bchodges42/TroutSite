import { describe, expect, it } from 'vitest';
import { chooseWaterCandidate, distanceToGeometry, type SelectionCandidate } from '../src/features/map/selection';

const line = (
  id: string,
  coordinates: [number, number][],
  lengthKm: number,
): SelectionCandidate => ({
  id,
  layerId: 'rivers-hit',
  geometry: { type: 'LineString', coordinates },
  lengthKm,
});

describe('deterministic map selection', () => {
  it('uses nearest geometry for ordinary nearby parallel lines', () => {
    const result = chooseWaterCandidate([5, 0], [
      line('short-parallel', [[0, 2], [10, 2]], 2),
      line('long-parallel', [[0, 8], [10, 8]], 80),
    ]);
    expect(result).toBe('short-parallel');
  });

  it('prefers the longer main stem only at a true overlap/confluence tie', () => {
    const result = chooseWaterCandidate([4.5, 0.5], [
      line('tributary', [[0, 0], [10, 0]], 4),
      line('main-stem', [[5, -5], [5, 5]], 120),
    ]);
    expect(result).toBe('main-stem');
  });

  it('keeps polygon and point hit distances stable', () => {
    expect(
      distanceToGeometry([0, 0], { type: 'Polygon', coordinates: [] }, 'rivers-water-hit'),
    ).toBe(6);
    expect(
      distanceToGeometry([0, 0], { type: 'Polygon', coordinates: [] }, 'rivers-water-hit-outline'),
    ).toBe(9);
    expect(distanceToGeometry([0, 0], { type: 'Point', coordinates: [3, 4] }, 'rivers-point-hit')).toBe(5);
  });

  it('is stable for exact ties', () => {
    expect(
      chooseWaterCandidate([0, 0], [
        line('z-water', [[-1, 1], [1, 1]], 10),
        line('a-water', [[-1, -1], [1, -1]], 10),
      ]),
    ).toBe('a-water');
  });
});
