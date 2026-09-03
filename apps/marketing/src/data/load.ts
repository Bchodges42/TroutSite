/**
 * Build-time data layer — ROLE 5.
 *
 * Loads the fixture JSON in ./fixtures and validates EVERY entity against the
 * frozen Zod schemas in @trout/contracts (contracts-v1.0.0). The Astro build
 * fails loudly on invalid or orphaned data, which is what makes the programmatic
 * templates safe to run unattended.
 *
 * Marketing pages render from BUILD-TIME data, never from the live API: CI and
 * static builds run without the laptop server. Two data sources (§12 #3, ROLE 5
 * assumption + ADR 0005):
 *
 *  - default: the bundled `fixtures/` (illustrative, marked "(sample)") — what
 *    CI and the e2e suite build against, deterministic and offline;
 *  - `MARKETING_DATA_DIR=<apps/web/public>` at build time (deploy.sh does this
 *    after regenerating snapshots): the REAL /v1/* + /content/* snapshot tree
 *    the api builder writes — same shapes, same frozen-schema validation.
 *
 * In fixture mode, ConditionSnapshot scores are computed here with the frozen
 * pure `scoreConditions()` so a marketing page can never drift from the PWA's
 * scoring logic (§1.1, §6); in snapshot mode the scores come from the same
 * function inside the snapshot builder and are validated as-is.
 */
import {
  BugTaxonSchema,
  FlyPatternSchema,
  GaugeReadingSchema,
  HatchChartSchema,
  ShopReportSchema,
  ShopSchema,
  StockingEventSchema,
  StreamSchema,
  scoreConditions,
} from '@trout/contracts';
import type {
  BugTaxon,
  ConditionSnapshot,
  FlyPattern,
  GaugeReading,
  HatchChart,
  Shop,
  ShopReport,
  StockingEvent,
  Stream,
} from '@trout/contracts';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { ConditionSnapshotSchema } from '@trout/contracts';
import { REGIONS } from './states.js';

/** Real snapshot tree (apps/web/public) when set; bundled fixtures otherwise. */
const DATA_DIR = process.env.MARKETING_DATA_DIR;

// Fixture mode: the JSON is bundled at build time (Vite raw glob) so the module
// stays self-contained no matter where Astro chunks it.
const FIXTURE_FILES = import.meta.glob('./fixtures/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function readJson(rel: string): unknown {
  if (DATA_DIR) {
    return JSON.parse(readFileSync(join(resolve(DATA_DIR), rel), 'utf8'));
  }
  const raw = FIXTURE_FILES[`./fixtures/${rel}`];
  if (raw === undefined) throw new Error(`[marketing] missing bundled fixture: ${rel}`);
  return JSON.parse(raw);
}

/**
 * Soft content (stocking schedules, shop reports) may legitimately be absent on
 * a first deploy before the first successful scrape — an empty list beats a
 * failed build. Core files (streams/conditions/hatch/content pack) stay strict.
 */
function readSoftJson(rel: string, fixtureRel: string): unknown {
  if (DATA_DIR) {
    const p = join(resolve(DATA_DIR), rel);
    if (!existsSync(p)) {
      console.warn(`[marketing] real data: ${rel} not generated yet — rendering empty`);
      return [];
    }
    return JSON.parse(readFileSync(p, 'utf8'));
  }
  return readJson(fixtureRel);
}

const taxaJson = readJson(DATA_DIR ? 'content/taxa.json' : 'taxa.json');
const patternsJson = readJson(DATA_DIR ? 'content/patterns.json' : 'patterns.json');
const streamsJson = readJson(DATA_DIR ? 'v1/streams.json' : 'streams.tn.json');
const stockingJson = readSoftJson('v1/stocking/TN.json', 'stocking.tn.json');
const shopsJson = readJson(DATA_DIR ? 'v1/shops/TN.json' : 'shops.tn.json');
const reportsJson = readSoftJson('v1/reports/recent.json', 'reports.tn.json');

/** Real mode: one HatchChart per file under v1/hatch/{region}/{month}.json. */
function loadHatchJson(): unknown {
  if (!DATA_DIR) return readJson('hatch.tn.json');
  const root = join(resolve(DATA_DIR), 'v1', 'hatch');
  const charts: unknown[] = [];
  for (const region of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    for (const f of readdirSync(join(root, region)).filter((f) => f.endsWith('.json'))) {
      charts.push(JSON.parse(readFileSync(join(root, region, f), 'utf8')));
    }
  }
  return charts;
}
const hatchJson = loadHatchJson();

// ---------------------------------------------------------------------------
// Parse + validate every fixture file against the frozen contracts.
// ---------------------------------------------------------------------------

const taxonList = z.array(BugTaxonSchema).parse(taxaJson);
const patternList = z.array(FlyPatternSchema).parse(patternsJson);
const hatchList = z.array(HatchChartSchema).parse(hatchJson);
const streamList = z.array(StreamSchema).parse(streamsJson);
const stockingList = z.array(StockingEventSchema).parse(stockingJson);
const shopList = z.array(ShopSchema).parse(shopsJson);
const reportList = z.array(ShopReportSchema).parse(reportsJson);

let snapshots: ConditionSnapshot[];
let snapshotSource: { snapshots: { streamId: string; readings: GaugeReading[] }[] } | undefined;
if (DATA_DIR) {
  // Real mode: the snapshot builder already scored with the same pure function.
  snapshots = z.array(ConditionSnapshotSchema).parse(readJson('v1/conditions/latest.json'));
} else {
  const readingsFile = z
    .object({
      _readme: z.string().optional(),
      snapshots: z.array(
        z.object({
          streamId: z.string().min(1),
          readings: z.array(GaugeReadingSchema),
        }),
      ),
    })
    .parse(readJson('readings.tn.json'));
  snapshotSource = readingsFile;
}

// ---------------------------------------------------------------------------
// Cross-reference lint (marketing-side; Role 4's CI gate checks the YAML pack).
// Build fails on orphans so no page can render a dead pattern/taxon/stream link.
// ---------------------------------------------------------------------------

function assertCrossReferences(): void {
  const errors: string[] = [];
  const taxonIds = new Set(taxonList.map((t) => t.id));
  const patternIds = new Set(patternList.map((p) => p.id));
  const streamIds = new Set(streamList.map((s) => s.id));
  const regionIds = new Set(streamList.map((s) => s.regionId));

  for (const p of patternList) {
    for (const id of p.imitates) {
      if (!taxonIds.has(id)) errors.push(`pattern ${p.id} imitates unknown taxon "${id}"`);
    }
  }
  for (const c of hatchList) {
    if (!regionIds.has(c.regionId)) {
      errors.push(`hatch chart references unknown regionId "${c.regionId}"`);
    }
    for (const e of c.entries) {
      if (!taxonIds.has(e.taxonId)) {
        errors.push(`hatch ${c.regionId}/${c.month} references unknown taxon "${e.taxonId}"`);
      }
      for (const pid of e.patterns) {
        if (!patternIds.has(pid)) {
          errors.push(`hatch ${c.regionId}/${c.month} references unknown pattern "${pid}"`);
        }
      }
    }
  }
  for (const r of reportList) {
    if (!shopList.some((s) => s.id === r.shopId)) {
      errors.push(`report ${r.id} references unknown shop "${r.shopId}"`);
    }
    if (r.streamId && !streamIds.has(r.streamId)) {
      errors.push(`report ${r.id} references unknown stream "${r.streamId}"`);
    }
    for (const hp of r.hotPatterns) {
      if (!patternIds.has(hp.patternId)) {
        errors.push(`report ${r.id} references unknown pattern "${hp.patternId}"`);
      }
    }
  }
  for (const sid of (snapshotSource?.snapshots ?? []).map((s) => s.streamId)) {
    if (!streamIds.has(sid)) errors.push(`readings reference unknown stream "${sid}"`);
  }
  const regionIdsFromRegistry = new Set(REGIONS.map((r) => r.id));
  for (const s of streamList) {
    if (!regionIdsFromRegistry.has(s.regionId)) {
      errors.push(`stream ${s.id} references region "${s.regionId}" missing from states.ts REGIONS`);
    }
  }
  if (errors.length > 0) {
    throw new Error(`[marketing] fixture cross-reference errors:\n  - ${errors.join('\n  - ')}`);
  }
}

assertCrossReferences();

// ---------------------------------------------------------------------------
// Condition snapshots: computed with the FROZEN pure scoreConditions().
// ---------------------------------------------------------------------------

function buildSnapshotsFromReadings(): ConditionSnapshot[] {
  const out: ConditionSnapshot[] = [];
  for (const file of snapshotSource?.snapshots ?? []) {
    const stream = streamList.find((s) => s.id === file.streamId);
    if (!stream) continue;
    const readings: GaugeReading[] = file.readings;
    const score = scoreConditions(stream, readings);
    const fetchedAt = readings.reduce((max, r) => (r.timestamp > max ? r.timestamp : max), '');
    out.push({
      streamId: stream.id,
      readings,
      score,
      fetchedAt,
      // Snapshot cadence is hourly (§3); this timestamp only feeds the
      // "as of" language on static pages and is replaced at integration.
      nextExpectedUpdate: fetchedAt,
    });
  }
  return out;
}

if (snapshotSource) {
  snapshots = buildSnapshotsFromReadings();
}


// ---------------------------------------------------------------------------
// Public getters (all synchronous; data is fully materialized at module load).
// ---------------------------------------------------------------------------

export function getStreams(stateId = 'TN'): Stream[] {
  return streamList.filter((s) => s.stateId === stateId);
}

export function getStream(id: string): Stream | undefined {
  return streamList.find((s) => s.id === id);
}

export function getSnapshots(): ConditionSnapshot[] {
  return snapshots;
}

export function getSnapshot(streamId: string): ConditionSnapshot | undefined {
  return snapshots.find((s) => s.streamId === streamId);
}

export function getStockingEvents(stateId = 'TN'): StockingEvent[] {
  return stockingList.filter((e) => e.stateId === stateId);
}

export function getTaxa(): BugTaxon[] {
  return taxonList;
}

export function getTaxon(id: string): BugTaxon | undefined {
  return taxonList.find((t) => t.id === id);
}

export function getPatterns(): FlyPattern[] {
  return patternList;
}

export function getPattern(id: string): FlyPattern | undefined {
  return patternList.find((p) => p.id === id);
}

export function getHatchCharts(regionId?: string): HatchChart[] {
  const charts = regionId ? hatchList.filter((c) => c.regionId === regionId) : hatchList;
  return [...charts].sort((a, b) =>
    a.regionId === b.regionId ? a.month - b.month : a.regionId.localeCompare(b.regionId),
  );
}

/** HatchChart[] for one region, one per month 1–12, sorted ascending. */
export function getYearlyHatch(regionId: string): HatchChart[] {
  return getHatchCharts(regionId);
}

export function getShops(stateId = 'TN'): Shop[] {
  return shopList.filter((s) => s.stateId === stateId);
}

export function getReports(): ShopReport[] {
  return [...reportList].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getReportsForStream(streamId: string): ShopReport[] {
  return getReports().filter((r) => r.streamId === streamId);
}

/** Map<streamName (as published by the agency), StockingEvent[]> for a state. */
export function getStockingByStream(stateId = 'TN'): Map<string, StockingEvent[]> {
  const map = new Map<string, StockingEvent[]>();
  for (const e of getStockingEvents(stateId)) {
    const list = map.get(e.streamName) ?? [];
    list.push(e);
    map.set(e.streamName, list);
  }
  return map;
}
