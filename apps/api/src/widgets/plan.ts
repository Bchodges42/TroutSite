import type {
  ConditionSnapshot,
  FishabilitySnapshot,
  GaugeReading,
  StockingEvent,
  Stream,
} from '@trout/contracts';
import { READING_STALE_MINUTES } from '@trout/contracts';

/**
 * Shop conditions widget — pure presentation model (ADR 0018).
 *
 * Given the public snapshot records a widget instance has selected
 * (?waters=id1,id2 — capped), this module produces the display model the embed
 * artifact renders: name/type label, applicable species, each usable reading
 * with its OWN age, the assessment status in the SAME band vocabulary as the
 * product, source attribution, and the "Open in Trout" link. It is the single
 * semantic authority for the widget surface.
 *
 * SERIALIZATION DISCIPLINE (binding for this file): `embed.ts` embeds these
 * functions into the static artifact via `Function.prototype.toString()` so the
 * shipped HTML executes the exact model that is tested here (same presentation
 * semantics as the product, mechanically). Every function below therefore must
 * be a top-level `export function` whose body references ONLY its parameters,
 * its locals, and language globals — never module-level values, imports, or
 * `const`s. Semantics constants ride in explicitly through the `sem` argument;
 * types are erased at compile time. The parity test in test/widgets.test.ts
 * evaluates the emitted artifact bytes and pins this: if someone references a
 * module local, the artifact evaluation throws and the test fails.
 *
 * Honesty rules (same family as every conditions surface):
 *  - `score.assessed === false` means no usable data → status "No data"; a REAL
 *    assessment of 0 renders as Poor, never as "No data" (contracts §conditions).
 *  - Freshness is per-metric: a reading row's age comes from that metric's OWN
 *    observation time (`metricTimes[metric] ?? timestamp`), never from another
 *    metric's stamp — same discipline as `readingFreshness.ts`/scoreFishability
 *    (a working flow sensor must not renew a stopped temperature sensor).
 *  - A stale reading is still shown, WITH its age; it is never silently dropped
 *    and never presented as fresh.
 *  - Absent fishability/stocking simply omit their rows; nothing is synthesized.
 */

/** Public presentation semantics for the widget. The canonical instance is
 *  `WIDGET_SEMANTICS`; the artifact receives it as a JSON literal (`var SEM`),
 *  and every model function takes it explicitly (serialization discipline). */
export interface WidgetSemantics {
  /** Per-metric freshness gate (minutes) — READING_STALE_MINUTES (canonical). */
  staleMinutes: number;
  /** Band thresholds — the product's scoreBand (apps/web/src/lib/conditions.ts). */
  bandGoodMin: number;
  bandFairMin: number;
  /** Maximum waters a single widget instance may select. */
  maxWaters: number;
  /** Same-origin snapshot URLs the artifact fetches at runtime. */
  streamsUrl: string;
  conditionsUrl: string;
  /** '/v1/fishability/{id}.json' — {id} replaced with the encoded water id. */
  fishabilityUrlTemplate: string;
  /** '/v1/stocking/{state}-recent.json' — {state} replaced with the state id. */
  stockingUrlTemplate: string;
  /** '/conditions/{id}' — {id} replaced; the site origin (if any) is prepended. */
  detailPathTemplate: string;
  /** Copy blocks (attribution is binding: agencies own the data). */
  sourceAttribution: string;
  openLabel: string;
  unavailableLabel: string;
  loadingLabel: string;
  fetchErrorLabel: string;
  usageHint: string;
}

/** The canonical semantics instance. Band values are pinned by
 *  test/widgets.test.ts against the product's scoreBand parity values (70/40);
 *  the stale gate is the contract's own constant, not a widget-local number. */
export const WIDGET_SEMANTICS: WidgetSemantics = {
  staleMinutes: READING_STALE_MINUTES,
  bandGoodMin: 70,
  bandFairMin: 40,
  maxWaters: 4,
  streamsUrl: '/v1/streams.json',
  conditionsUrl: '/v1/conditions/latest.json',
  fishabilityUrlTemplate: '/v1/fishability/{id}.json',
  stockingUrlTemplate: '/v1/stocking/{state}-recent.json',
  detailPathTemplate: '/conditions/{id}',
  sourceAttribution: 'Data: USGS/TVA — verify with the agency',
  openLabel: 'Open in Trout',
  unavailableLabel: 'No data',
  loadingLabel: 'Loading conditions…',
  fetchErrorLabel: 'Conditions unavailable — check the river directly',
  usageHint: 'Add ?waters=<water-id>[,<water-id>…] (up to 4) to show waters.',
};

export type WidgetBand = 'good' | 'fair' | 'poor';

/** One usable reading row, with its OWN age (per-metric freshness). */
export interface WidgetReadingRow {
  metric: 'cfs' | 'tempC' | 'heightFt';
  label: string;
  valueText: string;
  ageMinutes: number;
  ageText: string;
  /** True when this metric's own observation is older than sem.staleMinutes. */
  stale: boolean;
}

/** One species' comfort status from the water's fishability snapshot. */
export interface WidgetSpeciesRow {
  species: string;
  value: number | null;
  band: WidgetBand | null;
  statusLabel: string;
}

/** The display model for one selected water. */
export interface WidgetWaterModel {
  id: string;
  name: string;
  typeLabel: string;
  /** null = unassessed (no usable data) — renders "No data", never zero. */
  band: WidgetBand | null;
  statusLabel: string;
  score: number | null;
  readings: WidgetReadingRow[];
  /** Applicable species display names (targetSpecies, else catalog fallback). */
  species: string[];
  speciesRows: WidgetSpeciesRow[];
  /** Most recent stocking event phrased per its date precision, or null. */
  stockingText: string | null;
  openUrl: string;
}

export interface WidgetModel {
  waters: WidgetWaterModel[];
}

/** One resolved water: catalog row + its conditions (+ optional contexts). */
export interface WidgetWaterInput {
  stream: Stream;
  conditions: ConditionSnapshot;
  fishability: FishabilitySnapshot | null;
  stocking: StockingEvent[] | null;
  /** SITE_URL origin or '' for relative links. */
  siteUrl: string;
}

export interface WidgetModelArgs {
  /** The raw ?waters= query value (string | null | undefined). */
  watersParam: string | null | undefined;
  streams: Stream[];
  conditions: ConditionSnapshot[];
  fishabilityByWater?: Record<string, FishabilitySnapshot>;
  stockingByWater?: Record<string, StockingEvent[]>;
  nowMs: number;
  siteUrl: string;
}

/**
 * Parse the ?waters= value: split on commas, trim, drop empties, dedupe,
 * keep the first `maxWaters`. Pure so tests pin the cap discipline.
 */
export function parseWatersParam(raw: unknown, maxWaters: number): string[] {
  const text = typeof raw === 'string' ? raw : '';
  const out: string[] = [];
  const seen: Record<string, boolean> = {};
  const parts = text.split(',');
  for (let i = 0; i < parts.length; i++) {
    const id = parts[i]!.trim();
    if (id === '' || seen[id]) continue;
    seen[id] = true;
    out.push(id);
    if (out.length >= maxWaters) break;
  }
  return out;
}

/**
 * Band vocabulary — MUST stay identical to the product's scoreBand
 * (apps/web/src/lib/conditions.ts: ≥70 good, ≥40 fair, else poor). Contracts
 * does not export the band function (only the raw scores), so this is the
 * widget-side reimplementation; the thresholds live in `sem` and the parity
 * values 70/40 are pinned by test/widgets.test.ts.
 */
export function scoreBand(score: number, bandGoodMin: number, bandFairMin: number): WidgetBand {
  if (score >= bandGoodMin) return 'good';
  if (score >= bandFairMin) return 'fair';
  return 'poor';
}

/** Status label for a band — null band is the honest "no data" state. */
export function bandStatusLabel(band: WidgetBand | null, sem: WidgetSemantics): string {
  if (band === 'good') return 'Good';
  if (band === 'fair') return 'Fair';
  if (band === 'poor') return 'Poor';
  return sem.unavailableLabel;
}

/** Catalog waterbody type → visitor-facing type label (unknown → River). */
export function waterTypeLabel(waterbodyType: string): string {
  if (waterbodyType === 'tailrace') return 'Tailwater';
  if (waterbodyType === 'spring') return 'Spring creek';
  if (waterbodyType === 'lake') return 'Lake';
  if (waterbodyType === 'pond') return 'Pond';
  if (waterbodyType === 'creek') return 'Creek';
  return 'River';
}

/**
 * Locale-independent measurement text: one decimal max, thousands grouped.
 * Pins the presentation of apps/web/src/lib/units.ts formatNum (which uses
 * Intl) with a deterministic implementation — grouping keeps large flows
 * readable at widget size; the widget never needs locale-specific decimals.
 */
export function formatMetricNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = String(rounded);
  return text.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Human age text for a reading row (compact; shown even when stale). */
export function formatAge(ageMinutes: number): string {
  if (ageMinutes < 1) return 'just now';
  if (ageMinutes < 60) return ageMinutes + ' min ago';
  const hours = Math.floor(ageMinutes / 60);
  if (hours < 48) return hours + ' h ago';
  return Math.floor(hours / 24) + ' d ago';
}

/**
 * Epoch ms of a metric's OWN observation inside one reading:
 * `metricTimes[metric] ?? timestamp` (the contract's per-metric discipline).
 * 0 = unreadable timestamp → the caller must treat the metric as unusable.
 */
export function readingObservedMs(reading: GaugeReading, metric: string): number {
  const times = reading.metricTimes
    ? (reading.metricTimes as unknown as Record<string, string | undefined>)
    : undefined;
  const own = times ? times[metric] : undefined;
  const ms = Date.parse(own || reading.timestamp);
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * The usable reading rows for a water, one per metric the gauges actually
 * report. Per metric: the NEWEST reading carrying that metric wins, its OWN
 * observation time (metricTimes override) sets the age, and a metric whose
 * every timestamp is unreadable is omitted (unusable — never a guess).
 */
export function buildReadingRows(
  readings: GaugeReading[],
  nowMs: number,
  sem: WidgetSemantics,
): WidgetReadingRow[] {
  const metrics: { key: 'cfs' | 'tempC' | 'heightFt'; label: string; unit: string }[] = [
    { key: 'cfs', label: 'Flow', unit: ' cfs' },
    { key: 'tempC', label: 'Water temp', unit: '°C' },
    { key: 'heightFt', label: 'Gauge height', unit: ' ft' },
  ];
  const rows: WidgetReadingRow[] = [];
  for (let i = 0; i < metrics.length; i++) {
    const meta = metrics[i]!;
    let bestValue: number | null = null;
    let bestMs = 0;
    const source = readings as unknown as Record<string, unknown>[];
    for (let j = 0; j < readings.length; j++) {
      const value = source[j]![meta.key];
      if (typeof value !== 'number') continue;
      const ms = readingObservedMs(readings[j]!, meta.key);
      if (ms <= 0) continue; // unreadable timestamp = unusable observation
      if (bestValue === null || ms > bestMs) {
        bestValue = value;
        bestMs = ms;
      }
    }
    if (bestValue === null) continue;
    const ageMinutes = Math.max(0, Math.floor((nowMs - bestMs) / 60000));
    rows.push({
      metric: meta.key,
      label: meta.label,
      valueText: formatMetricNumber(bestValue) + meta.unit,
      ageMinutes: ageMinutes,
      ageText: formatAge(ageMinutes),
      stale: ageMinutes > sem.staleMinutes,
    });
  }
  return rows;
}

/** 'smallmouth-bass' → 'Smallmouth Bass'; tolerant of unknown keys. */
export function speciesDisplayName(key: string): string {
  return capitalizeWords(key);
}

/** Split on spaces/hyphens, capitalize each word, rejoin. */
export function capitalizeWords(raw: string): string {
  const parts = raw.split(/[\s-]+/);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const word = parts[i]!;
    if (word === '') continue;
    out.push(word.charAt(0).toUpperCase() + word.slice(1));
  }
  return out.join(' ');
}

/**
 * Stocking events that name THIS water: case-insensitive match of the event's
 * streamName against the catalog name or any alias (stocking feeds carry
 * names, not ids). Newest first by date, then species for stable order.
 */
export function matchStockingEvents(events: StockingEvent[], stream: Stream): StockingEvent[] {
  const names: string[] = [stream.name];
  const aliases = stream.aliases;
  if (aliases) {
    for (let i = 0; i < aliases.length; i++) names.push(aliases[i]!);
  }
  const lower: string[] = [];
  for (let i = 0; i < names.length; i++) lower.push(names[i]!.trim().toLowerCase());
  const matched: StockingEvent[] = [];
  for (let i = 0; i < events.length; i++) {
    if (lower.indexOf(events[i]!.streamName.trim().toLowerCase()) !== -1) matched.push(events[i]!);
  }
  matched.sort(
    (a, b) => b.date.localeCompare(a.date) || a.species.localeCompare(b.species),
  );
  return matched;
}

/**
 * Honest stocking sentence for the newest event (B09): a 'week'/'month'
 * schedule row must never read as a verified stocking day, so the precision
 * is part of the phrasing. No event → null (row omitted, nothing synthesized).
 */
export function buildStockingText(events: StockingEvent[]): string | null {
  if (events.length === 0) return null;
  const event = events[0]!;
  const speciesText = capitalizeWords(event.species) + ' trout';
  if (event.datePrecision === 'week') {
    return 'Stocked week of ' + event.date + ' (scheduled) — ' + speciesText;
  }
  if (event.datePrecision === 'month') {
    return 'Stocking scheduled ' + monthYear(event.date) + ' — ' + speciesText;
  }
  if (event.datePrecision === 'day') {
    return 'Stocked ' + event.date + ' — ' + speciesText;
  }
  return 'Stocking reported ' + event.date + ' — ' + speciesText;
}

/** 'YYYY-MM-DD' → 'Month YYYY' (for month-precision schedules). */
export function monthYear(date: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthIndex = Number(date.slice(5, 7)) - 1;
  return (months[monthIndex] || 'Month') + ' ' + date.slice(0, 4);
}

/**
 * The "Open in Trout" URL: the site origin (SITE_URL) + the web app's frozen
 * detail route ('/conditions/{id}'). An empty siteUrl yields a relative URL —
 * correct inside the embed iframe, whose document origin IS the site.
 */
export function formatDetailUrl(siteUrl: string, waterId: string, sem: WidgetSemantics): string {
  const base = (siteUrl || '').replace(/\/+$/, '');
  const path = sem.detailPathTemplate.replace('{id}', encodeURIComponent(waterId));
  return base + path;
}

/**
 * Build one water's display model. Unassessed conditions (`assessed: false`)
 * produce band null / score null / "No data"; a REAL 0 produces Poor with
 * score 0. Stale readings stay in `readings` with their own ages.
 */
export function buildWaterModel(
  input: WidgetWaterInput,
  nowMs: number,
  sem: WidgetSemantics,
): WidgetWaterModel {
  const stream = input.stream;
  const score = input.conditions.score;
  const assessed = score.assessed !== false;
  const band = assessed ? scoreBand(score.value, sem.bandGoodMin, sem.bandFairMin) : null;

  // Applicable species: the cataloged target species when authored, else the
  // catalog's program-type fallback ('trout' | 'warmwater'); absent = no claim.
  const species: string[] = [];
  const target = stream.targetSpecies;
  if (target) {
    for (let i = 0; i < target.length; i++) species.push(speciesDisplayName(target[i]!));
  } else if (stream.species === 'trout') {
    species.push('Trout');
  } else if (stream.species === 'warmwater') {
    species.push('Warmwater');
  }

  // Per-species comfort from the fishability snapshot (optional context): a
  // snapshot that says assessed:false renders "No data" per species, and an
  // absent snapshot renders no species rows at all.
  const speciesRows: WidgetSpeciesRow[] = [];
  const bySpecies = input.fishability ? input.fishability.bySpecies : null;
  if (bySpecies) {
    const keys = Object.keys(bySpecies);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const entry = (bySpecies as Record<string, { comfort: { assessed: boolean; value: number } }>)[key]!;
      const comfort = entry.comfort;
      if (comfort.assessed) {
        const speciesBand = scoreBand(comfort.value, sem.bandGoodMin, sem.bandFairMin);
        speciesRows.push({
          species: speciesDisplayName(key),
          value: comfort.value,
          band: speciesBand,
          statusLabel: bandStatusLabel(speciesBand, sem),
        });
      } else {
        speciesRows.push({
          species: speciesDisplayName(key),
          value: null,
          band: null,
          statusLabel: sem.unavailableLabel,
        });
      }
    }
  }

  const stockingText = input.stocking ? buildStockingText(matchStockingEvents(input.stocking, stream)) : null;

  return {
    id: stream.id,
    name: stream.name,
    typeLabel: waterTypeLabel(String(stream.waterbodyType)),
    band: band,
    statusLabel: bandStatusLabel(band, sem),
    score: assessed ? score.value : null,
    readings: buildReadingRows(input.conditions.readings, nowMs, sem),
    species: species,
    speciesRows: speciesRows,
    stockingText: stockingText,
    openUrl: formatDetailUrl(input.siteUrl, stream.id, sem),
  };
}

/**
 * Join the requested ids against the catalog + conditions snapshots, in
 * REQUEST ORDER, deduped. Unknown ids are skipped (never fabricated); a water
 * missing from either snapshot is skipped — the widget shows what exists.
 */
export function assembleWaterRows(
  streams: Stream[],
  conditions: ConditionSnapshot[],
  ids: string[],
): WidgetWaterInput[] {
  const streamById: Record<string, Stream> = {};
  for (let i = 0; i < streams.length; i++) streamById[streams[i]!.id] = streams[i]!;
  const conditionsById: Record<string, ConditionSnapshot> = {};
  for (let i = 0; i < conditions.length; i++) conditionsById[conditions[i]!.streamId] = conditions[i]!;
  const out: WidgetWaterInput[] = [];
  const seen: Record<string, boolean> = {};
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    if (seen[id]) continue;
    seen[id] = true;
    const stream = streamById[id];
    const snapshot = conditionsById[id];
    if (!stream || !snapshot) continue;
    out.push({ stream: stream, conditions: snapshot, fishability: null, stocking: null, siteUrl: '' });
  }
  return out;
}

/**
 * Top entry: the full widget display model for a ?waters= selection against
 * the public snapshots. Optional fishability/stocking maps are attached when
 * the runtime managed to fetch them (their absence is honest, not an error).
 */
export function buildConditionsWidgetModel(
  args: WidgetModelArgs,
  sem: WidgetSemantics,
): WidgetModel {
  const ids = parseWatersParam(args.watersParam, sem.maxWaters);
  const inputs = assembleWaterRows(args.streams, args.conditions, ids);
  const waters: WidgetWaterModel[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    input.siteUrl = args.siteUrl;
    if (args.fishabilityByWater && args.fishabilityByWater[input.stream.id]) {
      input.fishability = args.fishabilityByWater[input.stream.id]!;
    }
    if (args.stockingByWater && args.stockingByWater[input.stream.id]) {
      input.stocking = args.stockingByWater[input.stream.id]!;
    }
    waters.push(buildWaterModel(input, args.nowMs, sem));
  }
  return { waters: waters };
}
