import type { GaugeReading } from './schemas/gauge.js';
import type { FishabilityScore, SpeciesComfortBands, SpeciesKey } from './schemas/fishability.js';
import { READING_STALE_MINUTES } from './readingFreshness.js';

/**
 * Per-species thermal comfort scoring (ADR 0007, F4). Deterministic and
 * clock-free in the same discipline as scoreConditions: callers pass `nowMs`
 * so results are reproducible offline; no network, no randomness. Inputs are
 * never mutated.
 *
 * Semantics mirror scoreConditions exactly where they are species-agnostic:
 *  - a value of 0 with assessed: true is a REAL assessment (lethal water —
 *    renders as Poor, never "No data");
 *  - assessed: false = cannot assess (no usable temperature) — renders "No data";
 *  - freshness is per-metric: the temperature observation's OWN timestamp is
 *    the only truth about when it was observed (T1-6), and an observation
 *    older than READING_STALE_MINUTES does not score.
 *
 * Comfort is thermal: thermal tolerance is what differs between these species.
 * Flow suitability stays per-stream (idealFlow via scoreConditions) and is not
 * duplicated here. All readings passed in are trusted to belong to the water.
 */
export function scoreFishability(
  readings: GaugeReading[],
  species: SpeciesKey,
  bands: SpeciesComfortBands,
  nowMs: number,
): FishabilityScore {
  const cannotAssess = (reason: string): FishabilityScore => ({
    species,
    value: 0,
    reasons: [reason],
    assessed: false,
    freshness: null,
  });

  if (bands.species !== species) {
    return cannotAssess(`Comfort bands are for ${bands.species}, not ${species}.`);
  }
  if (readings.length === 0) {
    return cannotAssess('No gauge readings are available, so comfort cannot be assessed.');
  }

  // Per-metric freshness (scoreConditions pattern): newest reading that
  // actually carries a temperature — that reading's own timestamp is the
  // metric's observation time.
  const byAge = [...readings].sort((a, b) => timestampMs(b.timestamp) - timestampMs(a.timestamp));
  const tempReading = byAge.find((r) => typeof r.tempC === 'number');
  if (!tempReading || typeof tempReading.tempC !== 'number') {
    return cannotAssess('No water-temperature reading is available for this water.');
  }

  const observedAtMs = timestampMs(tempReading.timestamp);
  const ageMinutes = Math.max(0, Math.floor((nowMs - observedAtMs) / 60_000));
  const freshness = { observedAt: tempReading.timestamp, ageMinutes };
  const freshnessInvalid = !Number.isFinite(observedAtMs) || observedAtMs <= 0;
  if (freshnessInvalid) {
    return cannotAssess('The latest water-temperature observation has an unreadable timestamp.');
  }
  if (ageMinutes > READING_STALE_MINUTES) {
    return cannotAssess(
      `The latest water-temperature observation is ${ageMinutes} minutes old (limit ${READING_STALE_MINUTES}).`,
    );
  }

  const t = tempReading.tempC;
  const speciesName = species.replaceAll('-', ' ');

  // Contiguous zones. Warm side (always authored): optimal | avoidance | lethal.
  // Cold side: lethal/avoidance boundaries are OPTIONAL (ADR 0007 Stage 3
  // amendment — F2's cited values are high-side only); without them, anything
  // below the optimal range is avoidance (fish are cold-inactive) and can
  // never be scored lethal.
  if (t >= bands.lethalHigh || (bands.lethalLow !== undefined && t <= bands.lethalLow)) {
    return {
      species,
      value: 0,
      reasons: [
        `Water temperature ${fmt(t)}°C is lethal for ${speciesName} — fish are not actively feeding. This is a real assessment, not missing data.`,
      ],
      assessed: true,
      freshness,
    };
  }
  if (t < bands.optimalLow) {
    return {
      species,
      value: 40,
      reasons: [
        `Water temperature ${fmt(t)}°C is below ${speciesName}'s comfort range (${fmt(bands.optimalLow)}–${fmt(bands.optimalHigh)}°C) — fish are sluggish and feeding is limited.`,
      ],
      assessed: true,
      freshness,
    };
  }
  if (t > bands.optimalHigh) {
    return {
      species,
      value: 40,
      reasons: [
        `Water temperature ${fmt(t)}°C is above ${speciesName}'s comfort range (${fmt(bands.optimalLow)}–${fmt(bands.optimalHigh)}°C) — fish have moved to cooler water or stopped feeding.`,
      ],
      assessed: true,
      freshness,
    };
  }
  return {
    species,
    value: 90,
    reasons: [
      `Water temperature ${fmt(t)}°C is in the optimal range for ${speciesName} (${fmt(bands.optimalLow)}–${fmt(bands.optimalHigh)}°C).`,
    ],
    assessed: true,
    freshness,
  };
}

function timestampMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}
