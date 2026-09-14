import {
  ActivityOutlookSchema,
  FishabilitySnapshotSchema,
  scoreFishability,
  spawnStateFor,
  spawnStateLabel,
  spawnStateValue,
  type ActivityComponent,
  type FishabilityScore,
  type FlowTrendContext,
  type FishabilitySnapshot,
  type GaugeReading,
  type SpeciesComfortBands,
  type SpeciesKey,
  type SpawnState,
  type SpawnThresholds,
  type Stream,
} from '@trout/contracts';

/**
 * F5 fishability emission (contract v2, ADR 0007): per-water snapshots at
 * GET /v1/fishability/<streamId>.json for every water whose F3 catalog entry
 * names targetSpecies. Waters without targetSpecies emit NOTHING — honest
 * absence, never an empty promise (the T1-8 pattern).
 *
 * Comfort comes from scoreFishability over the stream's readings and the F2
 * bands. Activity components are source-gated: each factor is emitted only when
 * its evidence and confidence are available, and weighted totals never imply
 * an unavailable factor. Evidence URLs follow the evidence pipeline's
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
 * `pressure` is optional area-level context and never a weighted input.
 * `rain` is an optional region fallback when no gauge precipitation is present.
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
  pressure?: PressureInfo,
  rain?: RainInfo,
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
      ),
    };
  }
  const rainContext = rainContextFor(readings, rain);
  return FishabilitySnapshotSchema.parse({
    streamId: stream.id,
    fetchedAt: new Date(nowMs).toISOString(),
    bySpecies,
    ...(pressure ? { pressureContext: pressureContextFor(pressure) } : {}),
    ...(rainContext ? { rainContext } : {}),
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

/** Fresh area pressure shown as context; it is deliberately absent from scoring. */
export interface PressureInfo {
  deltaHpa: number;
  station: string;
  observedAt: string;
  direction: 'rising' | 'falling' | 'stable';
}

export interface RainInfo {
  precipitationMm: number;
  station: string;
  observedAt: string;
}

function pressureContextFor(pressure: PressureInfo) {
  const delta = pressure.deltaHpa >= 0 ? `+${pressure.deltaHpa}` : `${pressure.deltaHpa}`;
  return {
    direction: pressure.direction,
    deltaHpa: pressure.deltaHpa,
    station: pressure.station,
    confidence: 'derived' as const,
    evidenceUrl: `https://api.weather.gov/stations/${encodeURIComponent(pressure.station)}/observations`,
    observedAt: pressure.observedAt,
    label: `Area pressure ${pressure.direction} ${delta} hPa over about 3 hours`,
  };
}

function rainContextFor(readings: GaugeReading[], fallback?: RainInfo) {
  const reading = [...readings]
    .filter((r) => typeof r.precipitationMm === 'number' && Number.isFinite(r.precipitationMm))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  if (reading && reading.precipitationMm !== undefined) {
    const amount = Math.round(reading.precipitationMm * 10) / 10;
    return {
      precipitationMm: amount,
      confidence: 'measured' as const,
      evidenceUrl: temperatureEvidenceUrl(reading.gaugeId) ?? `https://waterdata.usgs.gov/monitoring-location/${reading.gaugeId}`,
      observedAt: reading.timestamp,
      label: amount > 0 ? `Recent rain: ${amount} mm at the gauge` : 'No measurable rain at the gauge recently',
    };
  }
  if (!fallback) return undefined;
  const amount = Math.round(fallback.precipitationMm * 10) / 10;
  return {
    precipitationMm: amount,
    confidence: 'measured' as const,
    evidenceUrl: `https://api.weather.gov/stations/${encodeURIComponent(fallback.station)}/observations`,
    observedAt: fallback.observedAt,
    label: amount > 0 ? `Recent area rain: ${amount} mm` : 'No measurable area rain recently',
  };
}

/**
 * Activity assembly (weights always sum to exactly 1):
 *   water-temperature only                            → 1.0
 *   + spawn-state (F9)                                → 0.7 / 0.3
 *   Flow movement is emitted separately as context. Pressure remains a
 *   detail-page context row but is not a weighted activity input (D11).
 * All components derive from the SAME fresh temperature observation the
 * comfort row cites (cross-checked below) — no assessment, no components.
 */
function activityFor(
  readings: GaugeReading[],
  comfort: FishabilityScore,
  species: SpeciesKey,
  spawn: SpawnInfo | null,
): { total: number; components: ActivityComponent[]; spawnState?: SpawnState; flowTrend?: FlowTrendContext } {
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

  const speciesName = species.replaceAll('-', ' ');
  const components: ActivityComponent[] = [];
  let spawnState: SpawnState | undefined;

  const tempWeight = spawn ? 0.7 : 1;
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
        weight: 0.3,
        evidenceUrl: spawn.evidenceUrl,
        confidence: 'heuristic',
        label: `${spawnStateLabel(state, speciesName)} (heuristic estimate)`,
      }),
    );
  }

  const total = Math.min(100, Math.max(0, Math.round(50 + components.reduce((s, c) => s + c.contribution, 0))));
  const flowTrend = flowTrendFor(readings);
  return ActivityOutlookSchema.parse({
    total,
    components,
    ...(spawnState !== undefined ? { spawnState } : {}),
    ...(flowTrend ? { flowTrend } : {}),
  });
}

function flowTrendFor(readings: GaugeReading[]) {
  const byGauge = new Map<string, GaugeReading[]>();
  for (const reading of readings) {
    if (typeof reading.cfs !== 'number' || !Number.isFinite(reading.cfs)) continue;
    byGauge.set(reading.gaugeId, [...(byGauge.get(reading.gaugeId) ?? []), reading]);
  }
  const pair = [...byGauge.values()]
    .map((rows) => [...rows].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)))
    .find((rows) => rows.length >= 2);
  if (!pair) return undefined;
  const latest = pair[0]!;
  const previous = pair[1]!;
  const delta = latest.cfs! - previous.cfs!;
  const relative = Math.abs(delta) / Math.max(Math.abs(previous.cfs!), 1);
  const direction = relative <= 0.05 ? 'stable' : delta > 0 ? 'rising' : 'falling';
  const evidenceUrl = temperatureEvidenceUrl(latest.gaugeId) ?? `https://waterdata.usgs.gov/monitoring-location/${latest.gaugeId}`;
  return {
    direction,
    magnitude: Math.round(Math.abs(delta) * 10) / 10,
    confidence: 'derived' as const,
    evidenceUrl,
    observedAt: latest.timestamp,
    label: `Flow trend: ${direction} (${Math.round(Math.abs(delta) * 10) / 10} cfs change; context only)`,
  };
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
