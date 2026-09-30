import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dispatchMapTap, type MapTapSurface } from '../src/features/map/TennesseeMap';

/**
 * F45 — touch taps must not select a river before an overlapping gauge or
 * stocking overlay. One overlay-first dispatch routine serves BOTH the mouse
 * click and the touch tap; the touch handler arms the synthetic-click
 * suppression only AFTER the intended action dispatched (the old touch path
 * selected the river straight from the hit test and armed the timer, so an
 * overlapping gauge never opened its popup on a touchscreen).
 */

const POINT = { x: 20, y: 20 };
const LNG_LAT = { lng: -86.1, lat: 35.8 };

function surface(overrides: Partial<MapTapSurface> = {}): MapTapSurface {
  return {
    overlayAt: vi.fn(() => null),
    overlayFeatureAt: vi.fn(() => undefined),
    riverAt: vi.fn(() => null),
    openOverlay: vi.fn(),
    selectRiver: vi.fn(),
    ...overrides,
  };
}

describe('dispatchMapTap — one overlay-first routine for mouse and touch (F45)', () => {
  it('a point hitting both an enabled gauge and the river opens the popup, never selects the river', () => {
    const feature = { properties: { id: '035listens' } };
    const s = surface({
      overlayAt: vi.fn(() => ({ kind: 'gauge' as const })),
      overlayFeatureAt: vi.fn(() => feature),
      riverAt: vi.fn(() => 'caney-fork-river'),
    });
    const dispatched = dispatchMapTap(s, POINT, LNG_LAT);
    expect(dispatched).toBe('gauge');
    expect(s.openOverlay).toHaveBeenCalledWith('gauge', feature, LNG_LAT);
    expect(s.selectRiver).not.toHaveBeenCalled();
  });

  it('dispatches stocking and attractor overlays the same way', () => {
    for (const kind of ['stocking', 'attractor'] as const) {
      const feature = { properties: { site: 'x' } };
      const s = surface({
        overlayAt: vi.fn(() => ({ kind })),
        overlayFeatureAt: vi.fn(() => feature),
        riverAt: vi.fn(() => 'caney-fork-river'),
      });
      expect(dispatchMapTap(s, POINT, LNG_LAT)).toBe(kind);
      expect(s.openOverlay).toHaveBeenCalledWith(kind, feature, LNG_LAT);
      expect(s.selectRiver).not.toHaveBeenCalled();
    }
  });

  it('falls through to the river when the overlay dot carries no popup feature', () => {
    const s = surface({
      overlayAt: vi.fn(() => ({ kind: 'gauge' as const })),
      overlayFeatureAt: vi.fn(() => undefined),
      riverAt: vi.fn(() => 'caney-fork-river'),
    });
    expect(dispatchMapTap(s, POINT, LNG_LAT)).toBe('river');
    expect(s.openOverlay).not.toHaveBeenCalled();
    expect(s.selectRiver).toHaveBeenCalledWith('caney-fork-river');
  });

  it('selects the river when no overlay is enabled under the tap', () => {
    const s = surface({ riverAt: vi.fn(() => 'beech-lake') });
    expect(dispatchMapTap(s, POINT, LNG_LAT)).toBe('river');
    expect(s.selectRiver).toHaveBeenCalledWith('beech-lake');
  });

  it('does nothing on empty water', () => {
    const s = surface();
    expect(dispatchMapTap(s, POINT, LNG_LAT)).toBeNull();
    expect(s.selectRiver).not.toHaveBeenCalled();
    expect(s.openOverlay).not.toHaveBeenCalled();
  });
});

describe('touch and click handlers share the routine (F45 wiring pin)', () => {
  // The handlers bind inside the map 'load' closure and cannot run without a
  // WebGL context; pin the wiring in source (same honesty gate as the 44px
  // CSS pin and the F44 dependency-list pin).
  const source = readFileSync(resolve(process.cwd(), 'src/features/map/TennesseeMap.tsx'), 'utf8');
  const touchCancel = source.indexOf("map.on('touchcancel'");
  it('the touchend handler dispatches through the shared routine and suppresses only after', () => {
    const handler = source.slice(source.indexOf("map.on('touchend'"), touchCancel);
    expect(handler).toContain('dispatchMapTap(tapSurface');
    // Suppression timer is armed AFTER the dispatch, never instead of it.
    const dispatchAt = handler.indexOf('dispatchMapTap(');
    const suppressAt = handler.indexOf('lastTouchSelection = Date.now()');
    expect(dispatchAt).toBeGreaterThan(-1);
    expect(suppressAt).toBeGreaterThan(dispatchAt);
    // The old bug selected the river directly from the hit test.
    expect(handler).not.toMatch(/latest\.current\.onSelect\(/);
  });
  it('the click handler goes through the same routine behind the duplicate guard', () => {
    const click = source.slice(
      source.indexOf("map.on('click'"),
      source.indexOf("map.on('mouseout'", source.indexOf("map.on('click'")),
    );
    expect(click).toContain('if (Date.now() - lastTouchSelection < 500) return;');
    expect(click).toContain('dispatchMapTap(tapSurface');
    // No second, divergent selection path on mouse.
    expect(click).not.toMatch(/latest\.current\.onSelect\(/);
  });
});
