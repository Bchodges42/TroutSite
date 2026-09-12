import {
  ActivityOutlookSchema,
  FishabilitySnapshotSchema,
  scoreFishability,
  type ActivityComponent,
  type FishabilityScore,
  type FishabilitySnapshot,
  type GaugeReading,
  type SpeciesComfortBands,
  type SpeciesKey,
  type Stream,
} from '@trout/contracts';

/**
 * F5 fishability emission (contract v2, ADR 0007): per-water snapshots at
 * GET /v1/fishability/<streamId>.json for every water whose F3 catalog entry
 * names targetSpecies. Waters without targetSpecies emit NOTHING — honest
 * absence, never an empty promise (the T1-8 pattern).
 *
 * Comfort comes from scoreFishability over the stream's readings and the F2
 * bands. Activity today carries exactly one factor — water temperature, the
 * only one with a live measured source — weighted 1.0 (weights sum to 1);
 * flow-trend / pressure-trend / spawn-state join in Stage 3+ as their sources
 * land (F8/F9), never before. Evidence URLs follow the evidence pipeline's
 * established per-source pages; a temperature from a gauge without a stable
 * public page emits NO activity component (comfort still emits).
 */

/** Minimal view of one species entry in the built content pack (species.json). */
export interface SpeciesReferenceLike {
  comfort?: {
    optimalC?: { min?: number; max?: number; citationStatus?: string };
    avoidanceC?: { value?: number; citationStatus?: string };
    lethalC?: { value?: number; citationStatus?: string };
  };
}

/**
 * Bridge F2's authored reference (high-side cited ceilings — ADR 0007 Stage 3
 * amendment) onto the contract's SpeciesComfortBands. Returns null when the
 * species cannot be scored honestly (any warm-side value missing): the water
 * then emits an assessed:false comfort row rather than a guess.
 */
export function bandsFromReference(
  speciesId: SpeciesKey,
  ref: SpeciesReferenceLike | undefined,
): SpeciesComfortBands | null {
  const comfort = ref?.comfort;
  const optimal = comfort?.optimalC;
  const avoidance = comfort?.avoidanceC?.value;
  const lethal = comfort?.lethalC?.value;
  if (
    !optimal ||
    typeof optimal.min !== 'number' ||
    typeof optimal.max !== 'number' ||
    typeof avoidance !== 'number' ||
    typeof lethal !== 'number'
  ) {
    return null;
  }
  const bands: SpeciesComfortBands = {
    species: speciesId,
    unit: 'degC',
    optimalLow: optimal.min,
    optimalHigh: optimal.max,
    avoidanceHigh: avoidance,
    lethalHigh: lethal,
  };
  return isBandOrderValid(bands) ? bands : null;
}

function isBandOrderValid(b: SpeciesComfortBands): boolean {
  return b.optimalLow <= b.optimalHigh && b.optimalHigh < b.avoidanceHigh && b.avoidanceHigh < b.lethalHigh;
}

/** Public source page for the gauge that supplied a temperature (evidence-pipeline patterns). */
export function temperatureEvidenceUrl(gaugeId: string): string | null {
  if (/^\d+$/.test(gaugeId)) return `https://waterdata.usgs.gov/monitoring-location/${gaugeId}`;
  if (gaugeId.startsWith('tva:')) return 'https://www.tva.com/environment/lake-levels';
  if (gaugeId.startsWith('usace:')) return 'https://water.usace.army.mil/';
  return null;
}

/**
 * Build one water's snapshot. `readings` are the stream's own gauge readings
 * (the same slice conditions are scored from); `bandsBySpecies` carries only
 * species with scoreable, cited warm-side bands. Every targetSpecies the water
 * names gets an entry — scoreable species scored, the rest an honest
 * assessed:false row ("no cited bands yet"), never a fabricated number.
 */
export function buildFishabilitySnapshot(
  stream: Stream,
  readings: GaugeReading[],
  bandsBySpecies: ReadonlyMap<SpeciesKey, SpeciesComfortBands>,
  nowMs: number,
): FishabilitySnapshot {
  const target = stream.targetSpecies ?? [];
  const bySpecies: FishabilitySnapshot['bySpecies'] = {};
  for (const species of target) {
    const bands = bandsBySpecies.get(species);
    if (!bands) {
      bySpecies[species] = {
        comfort: cannotAssess(species),
        activity: { total: 0, components: [] },
      };
      continue;
    }
    const comfort = scoreFishability(readings, species, bands, nowMs);
    bySpecies[species] = { comfort, activity: activityFor(readings, comfort) };
  }
  return FishabilitySnapshotSchema.parse({
    streamId: stream.id,
    fetchedAt: new Date(nowMs).toISOString(),
    bySpecies,
  });
}

function cannotAssess(species: SpeciesKey): FishabilityScore {
  return {
    species,
    value: 0,
    reasons: ['No cited temperature comfort bands for this species yet — not guessed.'],
    assessed: false,
    freshness: null,
  };
}

/**
 * The one measurable activity factor today: water temperature, weight 1.0.
 * Emitted only when comfort actually assessed from a fresh observation — the
 * same observation backs both rows, so no assessment means no component
 * (an empty outlook is honest "no activity data", never a fabricated −50).
 */
function activityFor(
  readings: GaugeReading[],
  comfort: FishabilityScore,
): { total: number; components: ActivityComponent[] } {
  if (!comfort.assessed || !comfort.freshness) return { total: 0, components: [] };
  const byAge = [...readings].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const tempReading = byAge.find((r) => typeof r.tempC === 'number');
  if (!tempReading || tempReading.timestamp !== comfort.freshness.observedAt) {
    return { total: 0, components: [] };
  }
  const evidenceUrl = temperatureEvidenceUrl(tempReading.gaugeId);
  if (!evidenceUrl) return { total: 0, components: [] };
  const component: ActivityComponent = {
    factor: 'water-temperature',
    value: comfort.value,
    contribution: comfort.value - 50,
    weight: 1,
    evidenceUrl,
    confidence: 'measured',
    label: 'Water temperature',
  };
  const total = Math.min(100, Math.max(0, Math.round(50 + component.contribution)));
  return ActivityOutlookSchema.parse({ total, components: [component] });
}
