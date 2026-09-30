/**
 * F11 — deterministic client-side solar math (NOAA spreadsheet method).
 * No API, no location permission: the water's coordinates come from the
 * bundled river index anchors and the date is the visitor's local today.
 * Output feeds the "today's windows" presentation, which is labeled
 * heuristic — solar position is a proxy for feeding behavior, not a
 * measurement.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Julian day at 0:00 UTC of the given calendar date (epoch-anchored: exact
 *  for the Gregorian calendar, no integer-formula transcription risk).
 *  Exported for tests. */
export function julianDayForTest(dayStartUtcMs: number): number {
  return dayStartUtcMs / 86_400_000 + 2_440_587.5;
}

function julianDay(dayStartUtcMs: number): number {
  return julianDayForTest(dayStartUtcMs);
}

/** Solar declination (degrees) and equation of time (minutes) for a Julian day.
 *  Exported for tests (F11: the EOT magnitude is pinned against an independent
 *  reference across the annual range). */
export function solarPosition(jd: number): { declinationDeg: number; eqTimeMin: number } {
  const t = (jd - 2451545) / 36525;
  const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const m = (357.52911 + t * (35999.05029 - 0.0001537 * t)) * RAD;
  const c =
    (1.914602 - t * (0.004817 + 0.000014 * t)) * Math.sin(m) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * m) +
    0.000289 * Math.sin(3 * m);
  const trueLong = l0 + c;
  const omega = (125.04 - 1934.136 * t) * RAD;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
  const eps =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const declinationDeg = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG;
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eq =
    y * Math.sin(2 * l0 * RAD) -
    2 * e * Math.sin(m) +
    4 * e * y * Math.sin(m) * Math.cos(2 * l0 * RAD) -
    0.5 * y * y * Math.sin(4 * l0 * RAD) -
    1.25 * e * e * Math.sin(2 * m);
  // F11 (2026-09-29 audit): NOAA's equation of time is E (radians) →
  // eqTime = radToDeg(E) × 4 minutes. The original code dropped the
  // radians→degrees conversion (4 × E), shifting every crossing by the
  // annual EOT magnitude (~±4 min at noon, up to ~10 min on the crossings).
  return { declinationDeg, eqTimeMin: 4 * eq * DEG };
}

export interface SolarWindows {
  /** Sunrise/sunset as UTC epoch ms (null when the sun never crosses). */
  sunrise: number | null;
  sunset: number | null;
  /** Heuristic feeding windows: dawn/dusk ±60 minutes around the crossings. */
  dawnWindow: [number, number] | null;
  duskWindow: [number, number] | null;
}

/** A calendar date as the visitor experiences it, independent of UTC. */
export interface CivilDate {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

/**
 * F12 (2026-09-29 audit): the LOCAL civil date for an instant. "Today's
 * windows" must follow the visitor's calendar — at 8 p.m. America/Chicago
 * the UTC calendar date is already tomorrow. Time acquisition stays with
 * the caller; this is a pure conversion.
 */
export function civilDate(dateMs: number): CivilDate {
  const d = new Date(dateMs);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function solarWindowsForDayStart(dayStartUtc: number, lat: number, lon: number): SolarWindows {
  const jd = julianDay(dayStartUtc);
  const { declinationDeg, eqTimeMin } = solarPosition(jd);
  const solarNoonUtc = dayStartUtc + (720 - 4 * lon - eqTimeMin) * 60_000;
  const dec = declinationDeg * RAD;
  const latRad = lat * RAD;
  const cosH =
    (Math.cos(90.833 * RAD) - Math.sin(latRad) * Math.sin(dec)) /
    (Math.cos(latRad) * Math.cos(dec));
  if (cosH > 1 || cosH < -1) {
    return { sunrise: null, sunset: null, dawnWindow: null, duskWindow: null };
  }
  const hourAngleMin = Math.acos(cosH) * DEG * 4; // minutes
  const sunrise = solarNoonUtc - hourAngleMin * 60_000;
  const sunset = solarNoonUtc + hourAngleMin * 60_000;
  const WINDOW = 60 * 60_000; // ±60 minutes, heuristic
  return {
    sunrise,
    sunset,
    dawnWindow: [sunrise - WINDOW, sunrise + WINDOW],
    duskWindow: [sunset - WINDOW, sunset + WINDOW],
  };
}

/**
 * Sunrise/sunset for a coordinate on the UTC day containing `dateMs`,
 * zenith 90.833° (accounts for refraction + solar disc). Deterministic:
 * the same inputs always produce the same minutes.
 *
 * Prefer {@link solarWindowsForCivilDate} for anything labeled "today":
 * this variant anchors on the UTC calendar day (documented behavior — the
 * F12 audit found "today" presentations must use the visitor's civil date).
 */
export function solarWindows(dateMs: number, lat: number, lon: number): SolarWindows {
  const d = new Date(dateMs);
  const dayStartUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return solarWindowsForDayStart(dayStartUtc, lat, lon);
}

/**
 * Sunrise/sunset for a coordinate on an explicit CIVIL calendar date
 * (F12) — the visitor's local "today", chosen by the caller.
 */
export function solarWindowsForCivilDate(civil: CivilDate, lat: number, lon: number): SolarWindows {
  return solarWindowsForDayStart(Date.UTC(civil.year, civil.month - 1, civil.day), lat, lon);
}
