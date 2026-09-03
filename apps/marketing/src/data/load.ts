/**
 * Build-time data layer — ROLE 5.
 *
 * Loads the fixture JSON in ./fixtures and validates EVERY entity against the
 * frozen Zod schemas in @trout/contracts (contracts-v1.0.0). The Astro build
 * fails loudly on invalid or orphaned data, which is what makes the programmatic
 * templates safe to run unattended.
 *
 * Marketing pages render from FIXTURES (build-time data), never from the live
 * API: CI and static builds run without the laptop server. When the Integration
 * role wires real snapshot JSON in (§12 #3), swap the imports in
 * `fixtures/` for the regenerated snapshot files — the getters and validation
 * stay identical.
 *
 * ConditionSnapshot scores are NOT stored in fixtures: they are computed here
 * with the frozen pure `scoreConditions()` so a marketing page can never drift
 * from the PWA's scoring logic (§1.1 offline-first, §6 contracts).
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
import { z } from 'zod';
import { REGIONS } from './states.js';
import taxaJson from './fixtures/taxa.json';
import patternsJson from './fixtures/patterns.json';
import hatchJson from './fixtures/hatch.tn.json';
import streamsJson from './fixtures/streams.tn.json';
import stockingJson from './fixtures/stocking.tn.json';
import readingsJson from './fixtures/readings.tn.json';
import shopsJson from './fixtures/shops.tn.json';
import reportsJson from './fixtures/reports.tn.json';

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
  .parse(readingsJson);

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
  const snapshotStreamIds = new Set(readingsFile.snapshots.map((s) => s.streamId));
  for (const sid of snapshotStreamIds) {
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

function buildSnapshots(): ConditionSnapshot[] {
  const out: ConditionSnapshot[] = [];
  for (const file of readingsFile.snapshots) {
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

const snapshots = buildSnapshots();

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
