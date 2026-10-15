import type { GaugeReading } from './schemas/gauge.js';
import type { Stream } from './schemas/stream.js';

const METRICS = ['cfs', 'tempC', 'heightFt', 'dissolvedOxygenMgL', 'reservoirLevelFt', 'precipitationMm'] as const;

/** A primary gauge is a reach decision, not a race between sensor timestamps.
 * References remain inspectable but never substitute for a missing primary. */
export function selectGaugeReadings(stream: Stream, readings: GaugeReading[]) {
  const relevant = readings.filter((r) => stream.gaugeIds.includes(r.gaugeId));
  const policy = stream.gaugePolicy;
  if (!policy) return { readings: relevant, referenceReadings: [] as GaugeReading[] };
  const references = new Set(policy.references.map((r) => r.gaugeId));
  const selected: GaugeReading[] = [];
  const referenceReadings: GaugeReading[] = [];
  for (const reading of relevant) {
    if (references.has(reading.gaugeId)) { referenceReadings.push(reading); continue; }
    const local: GaugeReading = { gaugeId: reading.gaugeId, timestamp: reading.timestamp };
    if (reading.metricTimes) local.metricTimes = {};
    let excluded = false;
    for (const metric of METRICS) {
      if (reading[metric] === undefined) continue;
      const primary = policy.primary[metric];
      if (primary && primary !== reading.gaugeId) { excluded = true; continue; }
      local[metric] = reading[metric];
      if (reading.metricTimes) local.metricTimes![metric] = reading.metricTimes[metric] ?? reading.timestamp;
    }
    if (local.metricTimes && Object.keys(local.metricTimes).length) {
      local.timestamp = Object.values(local.metricTimes).sort((a, b) => Date.parse(b) - Date.parse(a))[0]!;
    }
    if (METRICS.some((metric) => local[metric] !== undefined)) selected.push(local);
    if (excluded) referenceReadings.push(reading);
  }
  return { readings: selected, referenceReadings };
}
