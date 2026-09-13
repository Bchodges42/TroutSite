/**
 * F11 — deterministic client-side solar math (NOAA spreadsheet method).
 * No API, no location permission: the water's coordinates come from the
 * bundled river index anchors and the date is the visitor's local today.
 * Output feeds the "today's windows" presentation, which is labeled
 * heuristic — solar position is a proxy for feeding behavior, not a
 * measurement.
 */

const RAD = Math.PI / 180;

/** Julian day at 0:00 UTC of the given calendar date (epoch-anchored: exact
 *  for the Gregorian calendar, no integer-formula transcription risk). */
function julianDay(dayStartUtcMs: number): number {
  return dayStartUtcMs / 86_400_000 + 2_440_587.5;
}

/** Solar declination (degrees) and equation of time (minutes) for a Julian day. */
function solarPosition(jd: number): { declinationDeg: number; eqTimeMin: number } {
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
  const declinationDeg = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * (180 / Math.PI);
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eq =
    y * Math.sin(2 * l0 * RAD) -
    2 * e * Math.sin(m) +
    4 * e * y * Math.sin(m) * Math.cos(2 * l0 * RAD) -
    0.5 * y * y * Math.sin(4 * l0 * RAD) -
    1.25 * e * e * Math.sin(2 * m);
  return { declinationDeg, eqTimeMin: 4 * eq };
}

export interface SolarWindows {
  /** Sunrise/sunset as UTC epoch ms (null when the sun never crosses). */
  sunrise: number | null;
  sunset: number | null;
  /** Heuristic feeding windows: dawn/dusk ±60 minutes around the crossings. */
  dawnWindow: [number, number] | null;
  duskWindow: [number, number] | null;
}

/**
 * Sunrise/sunset for a coordinate on the UTC day containing `dateMs`,
 * zenith 90.833° (accounts for refraction + solar disc). Deterministic:
 * the same inputs always produce the same minutes.
 */
export function solarWindows(dateMs: number, lat: number, lon: number): SolarWindows {
  const d = new Date(dateMs);
  const dayStartUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
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
  const hourAngleMin = Math.acos(cosH) * (180 / Math.PI) * 4; // minutes
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
