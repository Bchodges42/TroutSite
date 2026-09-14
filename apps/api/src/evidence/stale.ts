import type { EvidenceStockingEvent, WaterObservation } from '@trout/contracts';

/**
 * Staleness detection (pure, caller-supplied clock — same discipline as
 * scoreConditions: no internal time).
 *
 * "Stale" NEVER means deleted: evidence keeps every row we retrieved. Staleness
 * flags tell Session 3 (and coverage) which data is too old to act on.
 */

/**
 * Max age (hours) of an observation before it should not drive decisions,
 * by metric. River gauges publish every 15–60 min; TVA elevations hourly.
 * A missing observation is a different situation entirely — this is only about
 * observations we HAVE.
 */
export const OBSERVATION_MAX_AGE_HOURS: Record<WaterObservation['metric'], number> = {
  'temperature-c': 24,
  'discharge-cfs': 24,
  'stage-ft': 24,
  'reservoir-level-ft': 72,
  // NWS ASOS reports hourly (5-minute feeds exist); pressure also moves slowly,
  // but the provider already refuses rows older than its 3 h staleness window.
  'pressure-hpa': 6,
  'dissolved-oxygen-mg-l': 24,
  'precipitation-mm': 6,
};

export function observationAgeHours(obs: WaterObservation, nowMs: number): number {
  const observed = Date.parse(obs.observedAt);
  if (Number.isNaN(observed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (nowMs - observed) / 3_600_000);
}

export function isStaleObservation(obs: WaterObservation, nowMs: number): boolean {
  const limit = OBSERVATION_MAX_AGE_HOURS[obs.metric];
  return observationAgeHours(obs, nowMs) > limit;
}

export function staleObservationIds(observations: WaterObservation[], nowMs: number): string[] {
  return observations.filter((o) => isStaleObservation(o, nowMs)).map((o) => `${o.sourceUrl}|${o.metric}|${o.observedAt}`);
}

/**
 * Stocking staleness: how long after a schedule window we treat a still-'scheduled'
 * row as an outdated schedule row (the event window passed and TWRA never reported
 * it completed). The row KEEPS status 'scheduled' — a missed window is not proof
 * the stocking happened or didn't; it is proof the schedule row aged out.
 */
export const SCHEDULE_STALE_DAYS: Record<EvidenceStockingEvent['datePrecision'], number> = {
  day: 14,
  week: 21, // week-of + 5-day window + slack
  month: 45, // month window + slack
};

/** True when a 'scheduled' row's published window has passed by its staleness slack. */
export function isStaleScheduledEvent(event: EvidenceStockingEvent, now: Date): boolean {
  if (event.status !== 'scheduled') return false;
  const slack = SCHEDULE_STALE_DAYS[event.datePrecision];
  const cutoff = new Date(now.getTime() - slack * 86_400_000).toISOString().slice(0, 10);
  return event.date < cutoff;
}

export function staleScheduledEvents(events: EvidenceStockingEvent[], now: Date): EvidenceStockingEvent[] {
  return events.filter((e) => isStaleScheduledEvent(e, now));
}
