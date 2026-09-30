import { describe, expect, it } from 'vitest';
import { civilDate, julianDayForTest, solarPosition, solarWindows, solarWindowsForCivilDate } from '../src/lib/solar';

/**
 * F11 — deterministic solar math. Reference values cross-checked against
 * NOAA's solar calculator for Nashville (36.16°N, 86.78°W) and Memphis
 * (35.15°N, 90.05°W).
 *
 * F11 remediation (2026-09-29 audit): the implementation dropped the
 * radians→degrees conversion in the equation of time (4·E instead of
 * 4·radToDeg(E)), shifting crossings by up to ~9.7 min. The old Memphis
 * reference values below had been transcribed from the buggy output; they are
 * replaced with values derived from the NOAA algorithm by hand (and consistent
 * with published Memphis sunrise/sunset for the date), and the EOT magnitude
 * is now pinned across the annual range against the standard approximation
 * EOT ≈ 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B), B = 2π(d−81)/364 — an
 * independent reference, not a copy of the implementation.
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
    // 2026-01-15. Derived from the NOAA algorithm by hand (EOT ≈ −9.3 min,
    // half-day ≈ 5.02 h at 35.15°N, declination ≈ −21.2°): solar noon
    // 18:09:30 UTC (12:09:30 CST — Memphis sits on the CST meridian), sunrise
    // ≈ 13:08:30 UTC (7:08:30 AM CST), sunset ≈ 23:10:30 UTC (5:10:30 PM CST),
    // consistent with published Memphis values for the date. (The previous
    // reference here, 12:59:06/23:01:38, was the buggy EOT output — the audit's
    // F11 in encoded form.)
    const date = Date.UTC(2026, 0, 15);
    const w = solarWindows(date, 35.15, -90.05);
    const noaaSunrise = Date.UTC(2026, 0, 15, 13, 8, 30);
    const noaaSunset = Date.UTC(2026, 0, 15, 23, 10, 30);
    expect(Math.abs(w.sunrise! - noaaSunrise)).toBeLessThan(5 * 60_000);
    expect(Math.abs(w.sunset! - noaaSunset)).toBeLessThan(5 * 60_000);
  });

  it('equation of time agrees with the independent approximation across the year', () => {
    // Sample the 1st and 15th of every month; the standard approximation
    // carries a known ±0.5–1 min error vs NOAA's full series, so 4 minutes of
    // tolerance is generous for catching the F11 regression (the buggy EOT was
    // ~25× too small — a ≈9–16 min disagreement at the extrema).
    const days = [
      [2026, 0, 1], [2026, 0, 15], [2026, 1, 15], [2026, 2, 1], [2026, 3, 15],
      [2026, 4, 1], [2026, 5, 15], [2026, 6, 1], [2026, 7, 15], [2026, 8, 1],
      [2026, 9, 15], [2026, 10, 3], [2026, 11, 1], [2026, 11, 15],
    ];
    for (const [year, monthIdx, day] of days) {
      const dayOfYear =
        (Date.UTC(year, monthIdx, day) - Date.UTC(year, 0, 1)) / 86_400_000 + 1;
      const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
      const approx =
        9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
      const jd = julianDayForTest(Date.UTC(year, monthIdx, day));
      const { eqTimeMin } = solarPosition(jd);
      expect(Math.abs(eqTimeMin - approx)).toBeLessThan(4);
    }
  });

  it('EOT reaches its documented annual extrema (≈ −14.2 and +16.4 minutes)', () => {
    // Mid-February: ≈ −14.2 min. Early November: ≈ +16.4 min. The buggy EOT
    // never exceeded ~0.3 min, so a loose ±3 min band still excludes it.
    const feb = solarPosition(julianDayForTest(Date.UTC(2026, 1, 12))).eqTimeMin;
    const nov = solarPosition(julianDayForTest(Date.UTC(2026, 10, 3))).eqTimeMin;
    expect(feb).toBeLessThan(-11);
    expect(feb).toBeGreaterThan(-17.5);
    expect(nov).toBeGreaterThan(13);
    expect(nov).toBeLessThan(19);
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

describe('civilDate / solarWindowsForCivilDate — F12 local calendar truth', () => {
  it('an evening instant west of UTC keeps the visitor’s civil date', () => {
    // Sept 30, 01:00 UTC = Sept 29, 8:00 p.m. America/Chicago (CDT, UTC−5) —
    // the audit's exact scenario: todayIso/solar must not roll to Sept 30.
    const eveningChicago = Date.UTC(2026, 8, 30, 1, 0, 0);
    expect(civilDate(eveningChicago)).toEqual({ year: 2026, month: 9, day: 29 });
  });

  it('solarWindowsForCivilDate equals the UTC-day windows of that civil date', () => {
    const civil = { year: 2026, month: 8, day: 14 };
    const viaCivil = solarWindowsForCivilDate(civil, 36.16, -86.78);
    const viaUtc = solarWindows(Date.UTC(2026, 7, 14), 36.16, -86.78);
    expect(viaCivil).toEqual(viaUtc);
  });
});
