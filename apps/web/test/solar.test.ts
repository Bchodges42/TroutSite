import { describe, expect, it } from 'vitest';
import { solarWindows } from '../src/lib/solar';

/**
 * F11 — deterministic solar math. Reference values cross-checked against
 * NOAA's solar calculator for Nashville (36.16°N, 86.78°W) and Memphis
 * (35.15°N, 90.05°W).
 */
describe('solarWindows — deterministic dawn/dusk math', () => {
  it('computes Nashville summer solstice sunrise/sunset within ±5 min of NOAA', () => {
    // 2026-06-21, local TN date. NOAA spreadsheet: sunrise 10:28:30 UTC
    // (5:28 AM CDT), sunset 01:05:48 UTC next day (8:05 PM CDT).
    const date = Date.UTC(2026, 5, 21);
    const w = solarWindows(date, 36.16, -86.78);
    expect(w.sunrise).not.toBeNull();
    expect(w.sunset).not.toBeNull();
    const noaaSunrise = Date.UTC(2026, 5, 21, 10, 28, 30);
    const noaaSunset = Date.UTC(2026, 5, 22, 1, 5, 48);
    expect(Math.abs(w.sunrise! - noaaSunrise)).toBeLessThan(5 * 60_000);
    expect(Math.abs(w.sunset! - noaaSunset)).toBeLessThan(5 * 60_000);
  });

  it('computes Memphis winter sunrise/sunset within ±5 min of NOAA', () => {
    // 2026-01-15. NOAA spreadsheet: sunrise 12:59:06 UTC (6:59 AM CST),
    // sunset 23:01:38 UTC (5:01 PM CST).
    const date = Date.UTC(2026, 0, 15);
    const w = solarWindows(date, 35.15, -90.05);
    const noaaSunrise = Date.UTC(2026, 0, 15, 12, 59, 6);
    const noaaSunset = Date.UTC(2026, 0, 15, 23, 1, 38);
    expect(Math.abs(w.sunrise! - noaaSunrise)).toBeLessThan(5 * 60_000);
    expect(Math.abs(w.sunset! - noaaSunset)).toBeLessThan(5 * 60_000);
  });

  it('windows are ±60 minutes around the crossings and dawn precedes dusk', () => {
    const date = Date.UTC(2026, 8, 14);
    const w = solarWindows(date, 36.16, -86.78);
    expect(w.dawnWindow![0]).toBe(w.sunrise! - 3_600_000);
    expect(w.dawnWindow![1]).toBe(w.sunrise! + 3_600_000);
    expect(w.duskWindow![0]).toBe(w.sunset! - 3_600_000);
    expect(w.duskWindow![1]).toBe(w.sunset! + 3_600_000);
    expect(w.dawnWindow![1]).toBeLessThan(w.duskWindow![0]);
  });

  it('is deterministic and monotonic across consecutive days', () => {
    const a = solarWindows(Date.UTC(2026, 5, 21), 36.16, -86.78);
    const b = solarWindows(Date.UTC(2026, 5, 21), 36.16, -86.78);
    expect(a).toEqual(b);
    const c = solarWindows(Date.UTC(2026, 5, 22), 36.16, -86.78);
    expect(c.sunrise!).toBeGreaterThan(a.sunrise!);
  });

  it('returns nulls (never fabricated times) where the sun does not cross', () => {
    // High-latitude winter: polar night at 70°N on the December solstice.
    const w = solarWindows(Date.UTC(2026, 11, 21), 70, 25);
    expect(w.sunrise).toBeNull();
    expect(w.sunset).toBeNull();
    expect(w.dawnWindow).toBeNull();
    expect(w.duskWindow).toBeNull();
  });
});
