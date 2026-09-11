import type { ConditionScore } from './schemas/conditions.js';
import type { GaugeReading } from './schemas/gauge.js';
import type { IdealFlow } from './schemas/stream.js';
import type { Stream } from './schemas/stream.js';

/**
 * Pure, deterministic fishability scoring (00-SHARED-CONTEXT §6).
 * No clock, no network, no randomness: callers pass the readings; staleness/TTL is a UI concern.
 *
 * Scoring model (frozen in contracts-v1.0.0, documented for transparency):
 *  - Flow is the dominant factor. Base 80 when the newest cfs reading falls inside any of the
 *    stream's idealFlow ranges; outside a range the score falls off with the relative distance
 *    from the nearest range (floor 10). With no cfs but a stage height, base 50 (low confidence).
 *  - Temperature adjusts the flow score: +10 in the 6–20°C ideal window, 0 in the 2–6 / 20–24°C
 *    marginal bands, −15 near freezing (<2°C), −30 dangerously warm (>24°C).
 *  - Score is clamped to 0–100. A clamped 0 is a REAL assessment (e.g. floored
 *    flow minus the dangerous-heat penalty) and callers must render it as Poor;
 *    only `assessed: false` returns mean "no data". Empty/foreign-gauge readings
 *    score 0 with an explanatory reason and `assessed: false`.
 */
const FLOW_BASE_WITHIN = 80;
const FLOW_PENALTY_MAX = 70;
const FLOW_SCORE_FLOOR = 10;
const HEIGHT_ONLY_BASE = 50;

const TEMP_IDEAL_MIN_C = 6;
const TEMP_IDEAL_MAX_C = 20;
const TEMP_MARGINAL_LOW_C = 2;
const TEMP_MARGINAL_HIGH_C = 24;
const TEMP_IDEAL_BONUS = 10;
const TEMP_COLD_PENALTY = 15;
const TEMP_HEAT_PENALTY = 30;

function timestampMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/** Distance from a cfs value to an ideal range (0 when inside). */
function rangeDistance(range: IdealFlow, cfs: number): number {
  if (cfs >= range.min && cfs <= range.max) return 0;
  return cfs < range.min ? range.min - cfs : cfs - range.max;
}

/**
 * Score how fishable a stream is right now, with plain-English reasons.
 * Deterministic: same inputs always produce the same output.
 */
export function scoreConditions(stream: Stream, readings: GaugeReading[]): ConditionScore {
  if (readings.length === 0) {
    return {
      value: 0,
      reasons: ['No gauge readings are available, so conditions cannot be assessed.'],
      assessed: false,
    };
  }

  // Only trust readings from gauges configured for this stream.
  const relevant =
    stream.gaugeIds.length > 0
      ? readings.filter((r) => stream.gaugeIds.includes(r.gaugeId))
      : readings;
  if (relevant.length === 0) {
    return {
      value: 0,
      reasons: [
        `Readings do not match this stream's configured gauges (${stream.gaugeIds.join(', ')}).`,
      ],
      assessed: false,
    };
  }

  // Newest first; find the most recent reading that actually carries a flow value.
  const byAge = [...relevant].sort((a, b) => timestampMs(b.timestamp) - timestampMs(a.timestamp));
  const cfsReading = byAge.find((r) => typeof r.cfs === 'number');

  let value: number;
  let assessed = true;
  const reasons: string[] = [];

  if (cfsReading && typeof cfsReading.cfs === 'number') {
    const cfs = cfsReading.cfs;
    const inside = stream.idealFlow.find((r) => cfs >= r.min && cfs <= r.max);
    if (inside) {
      value = FLOW_BASE_WITHIN;
      reasons.push(
        `Flow ${fmt(cfs)} cfs is within the ideal range (${fmt(inside.min)}–${fmt(inside.max)} cfs).`,
      );
    } else if (stream.idealFlow.length === 0) {
      value = HEIGHT_ONLY_BASE;
      reasons.push(
        `Flow ${fmt(cfs)} cfs was measured, but no ideal flow range is configured for this stream.`,
      );
    } else {
      const nearest = stream.idealFlow.reduce((best, r) =>
        rangeDistance(r, cfs) < rangeDistance(best, cfs) ? r : best,
      );
      if (cfs < nearest.min) {
        const deficit = nearest.min > 0 ? (nearest.min - cfs) / nearest.min : 1;
        value = Math.max(FLOW_SCORE_FLOOR, FLOW_BASE_WITHIN - Math.round(deficit * FLOW_PENALTY_MAX));
        reasons.push(
          `Flow ${fmt(cfs)} cfs is below the ideal range (${fmt(nearest.min)}–${fmt(
            nearest.max,
          )} cfs) — water is low.`,
        );
      } else {
        const surplus = (cfs - nearest.max) / Math.max(nearest.max, 1);
        value = Math.max(FLOW_SCORE_FLOOR, FLOW_BASE_WITHIN - Math.round(surplus * FLOW_PENALTY_MAX));
        reasons.push(
          `Flow ${fmt(cfs)} cfs is above the ideal range (${fmt(nearest.min)}–${fmt(
            nearest.max,
          )} cfs) — water is high and may be unsafe.`,
        );
      }
    }
  } else {
    const heightReading = byAge.find((r) => typeof r.heightFt === 'number');
    if (heightReading && typeof heightReading.heightFt === 'number') {
      value = HEIGHT_ONLY_BASE;
      reasons.push(
        `No flow (cfs) reading — scored from stage height ${fmt(
          heightReading.heightFt,
        )} ft with limited confidence.`,
      );
    } else {
      value = 0;
      reasons.push('The gauge returned no usable flow or stage data.');
      // Readings exist but carry nothing assessable — same "cannot assess"
      // contract as the empty/mismatched paths above. Temperature may still
      // adjust the value below, so this is recorded as a flag, not an early
      // return (preserves the historical scoring for temp-only readings).
      assessed = false;
    }
  }

  const tempReading = byAge.find((r) => typeof r.tempC === 'number');
  if (tempReading && typeof tempReading.tempC === 'number') {
    const t = tempReading.tempC;
    if (t >= TEMP_IDEAL_MIN_C && t <= TEMP_IDEAL_MAX_C) {
      value += TEMP_IDEAL_BONUS;
      reasons.push(`Water temperature ${fmt(t)}°C is in the ideal window for trout activity.`);
    } else if (t < TEMP_MARGINAL_LOW_C) {
      value -= TEMP_COLD_PENALTY;
      reasons.push(`Water temperature ${fmt(t)}°C is near freezing — fish are sluggish.`);
    } else if (t > TEMP_MARGINAL_HIGH_C) {
      value -= TEMP_HEAT_PENALTY;
      reasons.push(`Water temperature ${fmt(t)}°C is dangerously warm — avoid stressing trout.`);
    } else {
      reasons.push(`Water temperature ${fmt(t)}°C is marginal for trout activity.`);
    }
  } else {
    reasons.push('No water-temperature reading is available.');
  }

  if (relevant.length > 1) {
    reasons.push(`Scored from ${relevant.length} gauge readings (newest used).`);
  }

  return { value: Math.min(100, Math.max(0, Math.round(value))), reasons, assessed };
}
