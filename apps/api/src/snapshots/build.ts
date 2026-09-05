import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  BugTaxonSchema,
  ConditionSnapshotSchema,
  FishingInformationSchema,
  FlyPatternSchema,
  HatchChartSchema,
  ShopReportSchema,
  ShopSchema,
  StreamSchema,
  StockingEventSchema,
  WaterEvidenceSetSchema,
  scoreConditions,
} from '@trout/contracts';
import type {
  ConditionSnapshot,
  HatchChart,
  Shop,
  ShopReport,
  Stream,
  StockingEvent,
  WaterEvidence,
} from '@trout/contracts';
import type { Db } from '../db.js';
import { latestReadings } from '../ingest/usgs.js';
import { jobHealthy } from '../jobs/run.js';
import { writeJsonAtomic } from '../lib/jsonFile.js';

export interface BuildOptions {
  db: Db;
  /**
   * Web public root (apps/web/public). Snapshots are written AT their served URLs:
   * v1/** per the frozen ENDPOINTS map + content/*.json (bundled content pack).
   * Served from disk without a web rebuild, so cron refreshes them in place.
   */
  snapshotsDir: string;
  /**
   * Built content pack (packages/content/dist/pack, Role 4). Source for the /v1/hatch
   * charts and the /content/{taxa,patterns}.json precache payloads. When absent, hatch
   * + content emission is skipped with a warning (empty pack in Phase 0).
   */
  contentPackDir?: string;
  now: Date;
  /** Hourly gauge cadence (§5 schedule) — the fresh-until horizon for conditions. */
  conditionsTtlMs?: number;
}

interface StreamRow {
  id: string;
  name: string;
  state_id: string;
  waterbody_type: string;
  region_id: string;
  gauge_ids: string;
  stocking_program: number;
  ideal_flow: string;
  notes: string | null;
  official_sources: string;
}

interface ShopRow {
  id: string;
  name: string;
  state_id: string;
  town: string;
  website_url: string;
  reports_enabled: number;
}

interface ReportRow {
  id: string;
  shop_id: string;
  stream_id: string | null;
  date: string;
  body: string;
  hot_patterns: string;
  attribution_url: string;
  photo_url: string | null;
  published_at: string;
}

function rowsToStreams(rows: StreamRow[]): Stream[] {
  return rows.map((r) =>
    StreamSchema.parse({
      id: r.id,
      name: r.name,
      stateId: r.state_id,
      waterbodyType: r.waterbody_type,
      regionId: r.region_id,
      gaugeIds: JSON.parse(r.gauge_ids) as string[],
      stockingProgram: r.stocking_program === 1,
      idealFlow: JSON.parse(r.ideal_flow),
      ...(r.notes ? { notes: r.notes } : {}),
      officialSources: JSON.parse(r.official_sources),
    }),
  );
}

function rowsToShops(rows: ShopRow[]): Shop[] {
  return rows.map((r) =>
    ShopSchema.parse({
      id: r.id,
      name: r.name,
      stateId: r.state_id,
      town: r.town,
      websiteUrl: r.website_url,
      reportsEnabled: r.reports_enabled === 1,
    }),
  );
}

/** Reports snapshot payload: last 30 days, newest first (§6 endpoint contract). */
export function recentReports(db: Db, now: Date, limit = 100): ShopReport[] {
  const cutoff = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 19);
  const rows = db
    .prepare(
      `SELECT r.id, r.shop_id, r.stream_id, r.date, r.body, r.hot_patterns, r.attribution_url, r.photo_url, r.published_at,
              s.name AS shop_name
       FROM shop_reports r JOIN shops s ON s.id = r.shop_id
       WHERE r.published_at >= ?
       ORDER BY r.published_at DESC
       LIMIT ?`,
    )
    .all(cutoff, limit) as (ReportRow & { shop_name: string })[];
  return rows.map((r) =>
    ShopReportSchema.parse({
      id: r.id,
      shopId: r.shop_id,
      shopName: r.shop_name,
      streamId: r.stream_id ?? undefined,
      date: r.date,
      body: r.body,
      hotPatterns: JSON.parse(r.hot_patterns),
      attributionUrl: r.attribution_url,
      ...(r.photo_url ? { photoUrl: r.photo_url } : {}),
      publishedAt: r.published_at,
    }),
  );
}

export interface SnapshotResult {
  files: string[];
  streams: number;
  conditions: number;
  stockingByState: Record<string, number>;
  shopsByState: Record<string, number>;
  reports: number;
  hatchCharts: number;
  contentPack: boolean;
  evidenceWaters: number | null;
  warnings: string[];
}

/**
 * Regenerate every snapshot file into apps/web/public AT the URLs the frozen
 * ENDPOINTS map serves (GET /v1/* → static JSON) plus the bundled content pack
 * (/content/{taxa,patterns}.json). All payloads are validated against the frozen
 * contract schemas BEFORE writing; writes are atomic (temp + rename).
 *
 * Stale signal: ConditionSnapshot.nextExpectedUpdate is now+1h while the last gauges
 * job was healthy, `now` when it errored (immediately stale for consumers). Stocking
 * staleness rides on each event's fetchedAt (failed states are not rewritten).
 */
export function buildSnapshots(opts: BuildOptions): SnapshotResult {
  const { db, snapshotsDir, now } = opts;
  const conditionsTtl = opts.conditionsTtlMs ?? 3_600_000;
  const files: string[] = [];
  const warnings: string[] = [];
  const v1Dir = join(snapshotsDir, 'v1');

  // ── v1/streams.json (GET /v1/streams → Stream[]) ───────────────────────────
  // The ?state= query is answered live by the API route, which filters this file.
  const streamRows = db.prepare('SELECT * FROM streams ORDER BY name').all() as StreamRow[];
  const streams = rowsToStreams(streamRows);
  const streamsPath = join(v1Dir, 'streams.json');
  writeJsonAtomic(streamsPath, streams);
  files.push(streamsPath);

  // ── v1/conditions/latest.json (ConditionSnapshot[]) ────────────────────────
  const gaugesOk = jobHealthy(db, 'gauges');
  const readings = latestReadings(db);
  const nextExpectedUpdate = new Date(now.getTime() + (gaugesOk ? conditionsTtl : 0)).toISOString();
  const fetchedAt = now.toISOString();
  const conditions: ConditionSnapshot[] = streams.map((s) => {
    const streamReadings = s.gaugeIds.length > 0 ? readings.filter((r) => s.gaugeIds.includes(r.gaugeId)) : [];
    return ConditionSnapshotSchema.parse({
      streamId: s.id,
      readings: streamReadings,
      score: scoreConditions(s, streamReadings),
      fetchedAt,
      nextExpectedUpdate,
    });
  });
  const conditionsPath = join(v1Dir, 'conditions', 'latest.json');
  writeJsonAtomic(conditionsPath, conditions);
  files.push(conditionsPath);

  // ── v1/stocking/{state}.json (StockingEvent[]) ─────────────────────────────
  const stockingByState: Record<string, number> = {};
  const stockingRows = db
    .prepare('SELECT * FROM stocking_events ORDER BY state_id, date, stream_name')
    .all() as {
    id: string;
    state_id: string;
    stream_name: string;
    county: string | null;
    species: string;
    count: number | null;
    date: string;
    date_precision: string | null;
    source_url: string;
    fetched_at: string;
  }[];
  const eventsByState = new Map<string, StockingEvent[]>();
  for (const r of stockingRows) {
    const event = StockingEventSchema.parse({
      id: r.id,
      stateId: r.state_id,
      streamName: r.stream_name,
      county: r.county ?? undefined,
      species: r.species,
      count: r.count ?? undefined,
      date: r.date,
      datePrecision: r.date_precision ?? undefined,
      sourceUrl: r.source_url,
      fetchedAt: r.fetched_at,
    });
    const list = eventsByState.get(event.stateId) ?? [];
    list.push(event);
    eventsByState.set(event.stateId, list);
  }
  const stockingDir = join(v1Dir, 'stocking');
  for (const [stateId, events] of eventsByState) {
    const p = join(stockingDir, `${stateId}.json`);
    writeJsonAtomic(p, events);
    files.push(p);
    stockingByState[stateId] = events.length;
  }
  pruneStateFiles(stockingDir, [...eventsByState.keys()], files);

  // ── v1/shops/{state}.json (Shop[]) ─────────────────────────────────────────
  const shopsByState: Record<string, number> = {};
  const shopRows = db.prepare('SELECT * FROM shops ORDER BY state_id, name').all() as ShopRow[];
  const shopsByStateMap = new Map<string, Shop[]>();
  for (const shop of rowsToShops(shopRows)) {
    const list = shopsByStateMap.get(shop.stateId) ?? [];
    list.push(shop);
    shopsByStateMap.set(shop.stateId, list);
  }
  const shopsDir = join(v1Dir, 'shops');
  for (const [stateId, shops] of shopsByStateMap) {
    const p = join(shopsDir, `${stateId}.json`);
    writeJsonAtomic(p, shops);
    files.push(p);
    shopsByState[stateId] = shops.length;
  }
  pruneStateFiles(shopsDir, [...shopsByStateMap.keys()], files);

  // ── v1/reports/recent.json (ShopReport[], last 30 days) ────────────────────
  const reports = recentReports(db, now);
  const reportsPath = join(v1Dir, 'reports', 'recent.json');
  writeJsonAtomic(reportsPath, reports);
  files.push(reportsPath);

  // ── v1/evidence/waters.json (WaterEvidence[], data-sources lane) ───────────
  // Re-emits the newest evidence_runs payload (written by the evidence job). No
  // evidence job has run yet → skipped with a warning; never synthesized.
  let evidenceWaters: number | null = null;
  const evidenceRow = db
    .prepare('SELECT payload FROM evidence_runs ORDER BY retrieved_at DESC, id DESC LIMIT 1')
    .get() as { payload: string } | undefined;
  if (evidenceRow) {
    const evidence = WaterEvidenceSetSchema.parse(JSON.parse(evidenceRow.payload)) as WaterEvidence[];
    const evidencePath = join(v1Dir, 'evidence', 'waters.json');
    writeJsonAtomic(evidencePath, evidence);
    files.push(evidencePath);
    evidenceWaters = evidence.length;
  } else {
    warnings.push('no evidence_runs yet — /v1/evidence/waters.json not regenerated (run the evidence job)');
  }

  // ── v1/hatch/{regionId}/{month}.json + content/{taxa,patterns}.json ────────
  // Both come from the built content pack (Role 4): hatch charts are already in the
  // HatchChart snapshot shape; taxa/patterns are re-emitted as the bare arrays the
  // PWA precaches (pack extras like the inlined per-taxon SVG are stripped by the
  // schema parse — the PWA draws its own order-level line art).
  let hatchCharts = 0;
  let contentPack = false;
  const packDir = opts.contentPackDir;
  if (packDir && existsSync(join(packDir, 'bugs.json'))) {
    contentPack = true;
    const taxa = readPackEntities(join(packDir, 'bugs.json'), 'taxa', BugTaxonSchema);
    const patterns = readPackEntities(join(packDir, 'patterns.json'), 'patterns', FlyPatternSchema);
    const taxaPath = join(snapshotsDir, 'content', 'taxa.json');
    const patternsPath = join(snapshotsDir, 'content', 'patterns.json');
    writeJsonAtomic(taxaPath, taxa);
    writeJsonAtomic(patternsPath, patterns);
    files.push(taxaPath, patternsPath);

    // Fishing-information content (data-sources lane): served as /content/fishing.json.
    const fishingPackPath = join(packDir, 'fishing.json');
    if (existsSync(fishingPackPath)) {
      const fishingRaw = JSON.parse(readFileSync(fishingPackPath, 'utf8')) as { fishing?: unknown };
      const fishing = FishingInformationSchema.parse(fishingRaw.fishing);
      const fishingPath = join(snapshotsDir, 'content', 'fishing.json');
      writeJsonAtomic(fishingPath, fishing);
      files.push(fishingPath);
    } else {
      warnings.push('content pack has no fishing.json — /content/fishing.json not regenerated');
    }

    const hatchRoot = join(packDir, 'hatch');
    const regionDirs = readdirSync(hatchRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    const keptRegions: string[] = [];
    for (const region of regionDirs) {
      const monthFiles = readdirSync(join(hatchRoot, region)).filter((f) => /^\d{1,2}\.json$/.test(f));
      if (monthFiles.length === 0) continue;
      keptRegions.push(region);
      for (const f of monthFiles) {
        const chart = HatchChartSchema.parse(
          JSON.parse(readFileSync(join(hatchRoot, region, f), 'utf8')),
        ) as HatchChart;
        const p = join(v1Dir, 'hatch', region, f);
        writeJsonAtomic(p, chart);
        files.push(p);
        hatchCharts += 1;
      }
    }
    pruneHatchRegions(join(v1Dir, 'hatch'), keptRegions, files);
  } else {
    warnings.push('content pack not found — /v1/hatch/* and /content/*.json not regenerated');
  }

  return {
    files,
    streams: streams.length,
    conditions: conditions.length,
    stockingByState,
    shopsByState,
    reports: reports.length,
    hatchCharts,
    contentPack,
    evidenceWaters,
    warnings,
  };
}

function readPackEntities<T>(path: string, key: string, schema: { parse: (v: unknown) => T }): T[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const list = raw[key];
  if (!Array.isArray(list)) throw new Error(`${path}: expected a "${key}" array`);
  return list.map((entry) => schema.parse(entry));
}

/** Remove state files that no longer correspond to data (keeps the dir == contract). */
function pruneStateFiles(dir: string, keepStates: string[], files: string[]): void {
  let existing: string[];
  try {
    existing = readdirSync(dir);
  } catch {
    return;
  }
  for (const f of existing) {
    if (!f.endsWith('.json')) continue;
    const stateId = f.slice(0, -'.json'.length);
    if (!keepStates.includes(stateId)) {
      const p = join(dir, f);
      rmSync(p);
      files.push(`${p} (removed)`);
    }
  }
}

/** Remove hatch region dirs that no longer exist in the content pack. */
function pruneHatchRegions(hatchDir: string, keepRegions: string[], files: string[]): void {
  let existing: string[];
  try {
    existing = readdirSync(hatchDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return;
  }
  for (const region of existing) {
    if (!keepRegions.includes(region)) {
      const p = join(hatchDir, region);
      rmSync(p, { recursive: true, force: true });
      files.push(`${p} (removed)`);
    }
  }
}
