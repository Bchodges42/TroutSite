import { describe, expect, it } from 'vitest';
import { TN_BOUNDS, statewideCamera } from '../src/features/map/mapTokens';

/**
 * H1 (2026-09-07): the old fixed minZoom 5.3 clamped every statewide fit on
 * phone widths — Tennessee's 8.71° longitude span needs ~z 4.6–4.8 at 390/320
 * CSS px, so "Show all Tennessee" cropped both extremities. The shared
 * overview camera must keep one floor rule: never above 5.3, and never above
 * the zoom the state actually needs at the current viewport.
 */
describe('statewideCamera (shared overview fit)', () => {
  it('needs a zoom far below the old 5.3 floor on phone widths', () => {
    for (const [w, h] of [
      [390, 844],
      [320, 568],
    ] as const) {
      const cam = statewideCamera(w, h);
      expect(cam.fitZoom).toBeLessThan(5.3);
      expect(cam.minZoom).toBe(cam.fitZoom);
      expect(cam.minZoom).toBeGreaterThan(3.5); // sanity: still a state-level view
    }
  });

  it('keeps the product 5.3 floor on desktop, where the fit exceeds it', () => {
    const cam = statewideCamera(1440, 900);
    expect(cam.fitZoom).toBeGreaterThan(5.3);
    expect(cam.minZoom).toBe(5.3);
  });

  it('never clamps the fit with maxZoom', () => {
    for (const [w, h] of [
      [1440, 900],
      [390, 844],
      [320, 568],
    ] as const) {
      expect(statewideCamera(w, h).fitZoom).toBeLessThanOrEqual(statewideCamera(w, h).maxZoom);
      expect(statewideCamera(w, h).maxZoom).toBe(7);
    }
  });

  it('uses tighter padding on narrow viewports, one shared value per viewport', () => {
    expect(statewideCamera(390, 844).padding).toBe(24);
    expect(statewideCamera(1440, 900).padding).toBe(46);
  });

  it('fits the full longitude span at the returned zoom for the given viewport', () => {
    // Reverse the mercator fit: at fitZoom, the projected span of TN_BOUNDS
    // must fit inside width - 2·padding.
    const w = 320;
    const h = 568;
    const cam = statewideCamera(w, h);
    const span = TN_BOUNDS[1][0] - TN_BOUNDS[0][0];
    const projectedPx = (span / 360) * 512 * Math.pow(2, cam.fitZoom);
    expect(projectedPx).toBeLessThanOrEqual(w - cam.padding * 2 + 0.01);
    expect(projectedPx).toBeGreaterThan(w - cam.padding * 2 - 6); // tight fit, not wasteful
  });

  it('keeps the maxBounds coverage floor below the overview zoom (the clamp that actually cropped H1)', () => {
    // MapLibre will not zoom out past the point where TN_MAX_BOUNDS covers
    // the viewport; if that floor rose above fitZoom, fitBounds would be
    // clamped and the state cropped again. Assert the margin per viewport.
    const TN_MAX_BOUNDS: [[number, number], [number, number]] = [
      [-92, 26.5],
      [-79.5, 45.2],
    ];
    const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    for (const [w, h] of [
      [390, 780],
      [320, 504],
      [1440, 824],
    ] as const) {
      const cam = statewideCamera(w, h);
      const fieldH = h; // approximate: header varies, margin below covers it
      const coverageZoom = Math.log2((fieldH * 2 * Math.PI) / ((mercY(TN_MAX_BOUNDS[1][1]) - mercY(TN_MAX_BOUNDS[0][1])) * 512));
      expect(coverageZoom).toBeLessThan(cam.fitZoom);
    }
  });
});
