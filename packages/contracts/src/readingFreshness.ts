import type { GaugeReading } from './schemas/gauge.js';

/**
 * Reading-age semantics (pure, no clock): a reading's own timestamp is the only
 * truth about when conditions were observed. A "live" network fetch of a
 * six-hour-old reading is still six-hour-old data — freshness labels must key
 * off this age, not off fetch success. Callers pass `nowMs` so results stay
 * deterministic for tests and offline replays (same discipline as
 * scoreConditions: no internal clock).
 */
export const READING_STALE_MINUTES = 180;

function timestampMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Epoch ms of the newest usable reading, or null when there is none. */
export function newestReadingAt(readings: GaugeReading[]): number | null {
  let newest: number | null = null;
  for (const r of readings) {
    const ms = timestampMs(r.timestamp);
    if (ms > 0 && (newest === null || ms > newest)) newest = ms;
  }
  return newest;
}

/** Minutes since the newest reading was observed, or null with no readings. */
export function readingAgeMinutes(readings: GaugeReading[], nowMs: number): number | null {
  const at = newestReadingAt(readings);
  if (at === null) return null;
  return Math.max(0, (nowMs - at) / 60_000);
}

/** True when the newest reading is older than `maxAgeMinutes` (default 3 h). */
export function readingsAreStale(
  readings: GaugeReading[],
  nowMs: number,
  maxAgeMinutes: number = READING_STALE_MINUTES,
): boolean {
  const age = readingAgeMinutes(readings, nowMs);
  return age !== null && age > maxAgeMinutes;
}
