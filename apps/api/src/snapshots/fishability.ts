import {
  ActivityOutlookSchema,
  FishabilitySnapshotSchema,
  scoreFishability,
  spawnStateFor,
  spawnStateLabel,
  spawnStateValue,
  type ActivityComponent,
  type FishabilityScore,
  type FishabilitySnapshot,
  type GaugeReading,
  type SpeciesComfortBands,
  type SpeciesKey,
  type SpawnState,
  type SpawnThresholds,
  type Stream,
} from '@trout/contracts';
import { PRESSURE_STALE_MINUTES } from '../evidence/nws-provider.js';

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
  spawn?: {
    onsetC?: { value?: number; sources?: string[] } | null;
    endC?: { value?: number; sources?: string[] } | null;
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

export interface SpawnInfo {
  thresholds: SpawnThresholds;
  /** The F2 citation behind the spawn window — required for the activity row. */
  evidenceUrl: string;
}

/**
 * F9 bridge: F2's cited spawn window (onsetC/endC) → scoring thresholds plus
 * the citation the activity row will carry. Null when either bound is unsourced
 * (bluegill has onset only, striped-bass neither) or no citation URL exists —
 * the water then simply gets no spawn-state component.
 */
export function spawnThresholdsFromReference(ref: SpeciesReferenceLike | undefined): SpawnInfo | null {
  const onset = ref?.spawn?.onsetC?.value;
  const end = ref?.spawn?.endC?.value;
  if (typeof onset !== 'number' || typeof end !== 'number' || onset > end) return null;
  const evidenceUrl = ref?.spawn?.onsetC?.sources?.[0] ?? ref?.spawn?.endC?.sources?.[0];
  if (!evidenceUrl) return null;
  return { thresholds: { onsetC: onset, endC: end }, evidenceUrl };
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
 * (the same slice conditions are scored from); `bandsBySpecies` and
 * `spawnBySpecies` carry only species with scoreable, sourced values;
 * `pressureByRegion` carries fresh F8 area-pressure rows keyed by regionId.
 * Every targetSpecies the water names gets an entry — scoreable species
 * scored, the rest an honest assessed:false row ("no cited bands yet"), never
 * a fabricated number.
 */
export function buildFishabilitySnapshot(
  stream: Stream,
  readings: GaugeReading[],
  bandsBySpecies: ReadonlyMap<SpeciesKey, SpeciesComfortBands>,
  nowMs: number,
  spawnBySpecies: ReadonlyMap<SpeciesKey, SpawnInfo> = new Map(),
  pressureByRegion: ReadonlyMap<string, PressureInfo> = new Map(),
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
    bySpecies[species] = {
      comfort,
      activity: activityFor(
        readings,
        comfort,
        species,
        spawnBySpecies.get(species) ?? null,
        pressureByRegion.get(stream.regionId) ?? null,
        nowMs,
      ),
    };
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

/** Fresh F8 area-pressure row for a region (only rows with a derivable trend). */
export interface PressureInfo {
  /** latest − ~3 h baseline, hPa (a number — null-trend rows are omitted upstream). */
  deltaHpa: number;
  station: string;
  observedAt: string;
}

/**
 * Activity assembly (weights always sum to exactly 1):
 *   water-temperature only                            → 1.0
 *   + spawn-state (F9)                                → 0.7 / 0.3
 *   + pressure-trend (F8)                             → 0.8 / 0.2
 *   + both                                            → 0.6 / 0.25 / 0.15
 * All components derive from the SAME fresh temperature observation the
 * comfort row cites (cross-checked below) — no assessment, no components.
 * The pressure component reflects the REGION's station trend (area-level:
 * the label says so), never a per-water claim.
 */
function activityFor(
  readings: GaugeReading[],
  comfort: FishabilityScore,
  species: SpeciesKey,
  spawn: SpawnInfo | null,
  pressure: PressureInfo | null,
  nowMs: number,
): { total: number; components: ActivityComponent[]; spawnState?: SpawnState } {
  if (!comfort.assessed || !comfort.freshness) return { total: 0, components: [] };
  const byAge = [...readings].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const tempReading = byAge.find((r) => typeof r.tempC === 'number');
  const tempC = tempReading?.tempC;
  if (tempReading === undefined || typeof tempC !== 'number') {
    return { total: 0, components: [] };
  }
  if (tempReading.timestamp !== comfort.freshness.observedAt) {
    return { total: 0, components: [] };
  }
  const evidenceUrl = temperatureEvidenceUrl(tempReading.gaugeId);
  if (!evidenceUrl) return { total: 0, components: [] };

  // A stored pressure row ages like any observation: past the provider's
  // staleness window it stops being area context (T1-6 discipline).
  const pressureFresh =
    pressure !== null && nowMs - Date.parse(pressure.observedAt) <= PRESSURE_STALE_MINUTES * 60_000;

  const speciesName = species.replaceAll('-', ' ');
  const components: ActivityComponent[] = [];
  let spawnState: SpawnState | undefined;

  const tempWeight = spawn ? (pressureFresh ? 0.6 : 0.7) : pressureFresh ? 0.8 : 1;
  components.push(
    component({
      factor: 'water-temperature',
      value: comfort.value,
      weight: tempWeight,
      evidenceUrl,
      confidence: 'measured',
      label: 'Water temperature',
    }),
  );

  if (spawn) {
    const state = spawnStateFor(tempC, spawn.thresholds);
    spawnState = state;
    components.push(
      component({
        factor: 'spawn-state',
        value: spawnStateValue(state),
        weight: pressureFresh ? 0.25 : 0.3,
        evidenceUrl: spawn.evidenceUrl,
        confidence: 'derived',
        label: spawnStateLabel(state, speciesName),
      }),
    );
  }

  if (pressureFresh && pressure) {
    // Falling pressure → positive (fish feed ahead of fronts); a hard rise →
    // negative. 10 value-points per hPa is the normalization (documented in
    // the report; F2's per-species pressure sensitivity is still needs-source).
    const value = Math.round(Math.min(100, Math.max(0, 50 - 10 * pressure.deltaHpa)));
    components.push(
      component({
        factor: 'pressure-trend',
        value,
        weight: spawn ? 0.15 : 0.2,
        evidenceUrl: `https://www.weather.gov/wrh/timeseries?site=${encodeURIComponent(pressure.station)}`,
        confidence: 'derived',
        label: 'Area pressure trend (nearby regional station, not this water)',
      }),
    );
  }

  const total = Math.min(100, Math.max(0, Math.round(50 + components.reduce((s, c) => s + c.contribution, 0))));
  return ActivityOutlookSchema.parse({ total, components, ...(spawnState !== undefined ? { spawnState } : {}) });
}

function component(
  parts: Pick<ActivityComponent, 'factor' | 'value' | 'weight' | 'evidenceUrl' | 'label'> & { confidence?: ActivityComponent['confidence'] },
): ActivityComponent {
  const c: ActivityComponent = {
    factor: parts.factor,
    value: parts.value,
    weight: parts.weight,
    contribution: Math.round(parts.weight * (parts.value - 50) * 10) / 10,
    evidenceUrl: parts.evidenceUrl,
    confidence: parts.confidence ?? 'derived',
    label: parts.label,
  };
  return c;
}
