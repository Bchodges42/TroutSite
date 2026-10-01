import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import {
  BugTaxonSchema,
  ConditionSnapshotSchema,
  FishingInformationSchema,
  FlyPatternSchema,
  GaugeHistorySchema,
  HatchChartSchema,
  ShopReportSchema,
  ShopSchema,
  ReleaseScheduleSchema,
  SpeciesKeySchema,
  StreamSchema,
  StockingEventSchema,
  WaterEvidenceSetSchema,
  scoreConditions,
} from '@trout/contracts';
import type {
  ConditionSnapshot,
  GaugeHistory,
  HatchChart,
  Shop,
  ShopReport,
  SpeciesComfortBands,
  SpeciesKey,
  Stream,
  StockingEvent,
  WaterEvidence,
  ReleaseSchedule,
} from '@trout/contracts';
import type { Db } from '../db.js';
import { latestReadings } from '../ingest/usgs.js';
import { jobHealthy } from '../jobs/run.js';
import { writeJsonAtomic } from '../lib/jsonFile.js';
import { emitWidgetArtifacts } from '../widgets/embed.js';
import { bandsFromReference, buildFishabilitySnapshot, spawnThresholdsFromReference, type PressureInfo, type RainInfo, type SpeciesReferenceLike, type SpawnInfo } from './fishability.js';

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
  /**
   * Public site origin (SITE_URL) baked into the shop widget's "Open in Trout"
   * links (ADR 0018). Unset → relative /conditions/<id> links, which are correct
   * wherever the artifact is served (the embed iframe's document origin IS the
   * site). Wiring env.SITE_URL through the scheduled pass is a later step; the
   * artifact never needs it to function.
   */
  siteUrl?: string;
}

interface StreamRow {
  id: string;
  name: string;
  aliases: string;
  state_id: string;
  waterbody_type: string;
  region_id: string;
  hydro_identity: string | null;
  display: string | null;
  gauge_ids: string;
  stocking_program: number;
  ideal_flow: string;
  ideal_flow_source: string | null;
  season_months: string | null;
  season_kind: string | null;
  species_evidence: string | null;
  species: string | null;
  target_species: string | null;
  fishery: string | null;
  year_round: number | null;
  opportunity: string | null;
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
  return rows.map((r) => {
    const aliases = JSON.parse(r.aliases) as string[];
    return StreamSchema.parse({
      id: r.id,
      name: r.name,
      ...(aliases.length ? { aliases } : {}),
      stateId: r.state_id,
      waterbodyType: r.waterbody_type,
      regionId: r.region_id,
      ...(r.hydro_identity ? { hydroIdentity: JSON.parse(r.hydro_identity) } : {}),
      ...(r.display ? { display: r.display as 'featured' | 'standard' | 'reference' } : {}),
      gaugeIds: JSON.parse(r.gauge_ids) as string[],
      stockingProgram: r.stocking_program === 1,
      idealFlow: JSON.parse(r.ideal_flow),
      ...(r.ideal_flow_source ? { idealFlowSource: r.ideal_flow_source as 'editorial' | 'official' | 'measured' | 'derived' } : {}),
      ...(r.season_months ? { seasonMonths: JSON.parse(r.season_months) } : {}),
      ...(r.season_kind ? { seasonKind: r.season_kind as 'regulatory' | 'programmatic' } : {}),
      ...(r.notes ? { notes: r.notes } : {}),
      ...(r.species ? { species: r.species as 'trout' | 'warmwater' } : {}),
      ...(r.target_species ? { targetSpecies: JSON.parse(r.target_species) } : {}),
      ...(r.species_evidence ? { speciesEvidence: JSON.parse(r.species_evidence) } : {}),
      ...(r.fishery ? { fishery: r.fishery as 'wild' | 'stocked' | 'tailwater' } : {}),
      ...(r.year_round == null ? {} : { yearRound: r.year_round === 1 }),
      ...(r.opportunity ? { opportunity: JSON.parse(r.opportunity) } : {}),
      officialSources: JSON.parse(r.official_sources),
    });
  });
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
  fishabilityWaters: number;
  stockingByState: Record<string, number>;
  /** Rows per state in the 3-month recency slices ({state}-recent.json). */
  stockingRecentByState: Record<string, number>;
  shopsByState: Record<string, number>;
  reports: number;
  hatchCharts: number;
  contentPack: boolean;
  evidenceWaters: number | null;
  releaseSchedules: number;
  /** Per-gauge history files emitted under /v1/gauge-history/ (ADR 0014). */
  gaugeHistories: number;
  /** Static widget artifacts emitted under /v1/widgets/ (ADR 0018). */
  widgetArtifacts: number;
  warnings: string[];
}

export interface ReportFeedResult {
  /** Absolute path of the feed file (v1/reports/recent.json under snapshotsDir). */
  path: string;
  reports: number;
}

/**
 * Regenerate ONLY the report feed (v1/reports/recent.json) from the accepted
 * shop_reports rows. This is the publication entry point for the portal's
 * POST /v1/portal/reports route (F02, 2026-09-29 audit): the route must never
 * run the whole builder — it has no content pack, so a full rebuild would
 * rewrite every species assessment as an honest-but-degraded cannot-assess row.
 * The feed itself needs only the database (last 30 days, newest first), so no
 * reference pack is involved. buildSnapshots reuses this exact function during
 * scheduled runs, so both paths write identical bytes at the same URL.
 */
export function publishReportFeed(opts: { db: Db; snapshotsDir: string; now: Date }): ReportFeedResult {
  const reports = recentReports(opts.db, opts.now);
  const path = join(opts.snapshotsDir, 'v1', 'reports', 'recent.json');
  writeJsonAtomic(path, reports);
  return { path, reports: reports.length };
}

/**
 * Regenerate every snapshot file for the URLs the frozen ENDPOINTS map serves
 * (GET /v1/* → static JSON) plus the bundled content pack
 * (/content/{taxa,patterns}.json). All payloads are validated against the frozen
 * contract schemas BEFORE anything is published.
 *
 * Generation atomicity (F21, 2026-09-29 audit): per-file atomic writes do not
 * give GENERATION atomicity — a build that threw halfway used to leave part of
 * the new generation published next to the old one. The builder therefore:
 *   1. recovers any interrupted promotion (restores the preserved prior
 *      generation, removes stale staging dirs),
 *   2. builds and validates the ENTIRE new generation inside a staging
 *      directory (seeded from the current live trees, so files this run does
 *      not regenerate — evidence, hatch charts — carry forward and prunes see
 *      them); any error here leaves the live tree untouched,
 *   3. promotes: backs up the live trees, renames every staged file into
 *      place (fast per-file atomic renames — Windows has no atomic dir-swap),
 *      removes entries the new generation dropped, and VERIFIES the live file
 *      set and bytes equal the staged generation,
 *   4. on any promotion failure restores the preserved prior generation.
 * The prior generation survives every failure point: staging error (untouched),
 * mid-promotion error (rolled back from the backup; if the rollback itself is
 * obstructed, the backup directory is retained and the next build retries),
 * process death between steps (the same recovery runs at step 1 of the next
 * build). Served URLs and bytes are unchanged — files still land at
 * snapshotsDir/v1/** and snapshotsDir/content/**.
 *
 * Stale signal: ConditionSnapshot.nextExpectedUpdate is now+1h while the last gauges
 * job was healthy, `now` when it errored (immediately stale for consumers). Stocking
 * staleness rides on each event's fetchedAt (failed states are not rewritten).
 */
export function buildSnapshots(opts: BuildOptions): SnapshotResult {
  const { snapshotsDir } = opts;
  recoverInterruptedPromotion(snapshotsDir);
  const stageDir = join(snapshotsDir, `${STAGE_PREFIX}${process.pid}`);
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });
  try {
    const result = buildGeneration(opts, stageDir);
    promoteGeneration(snapshotsDir, stageDir);
    // Report files at their live URLs — the staging prefix is an implementation
    // detail (callers slice these paths against snapshotsDir).
    result.files = result.files.map((p) => remapStagePathToLive(p, stageDir, snapshotsDir));
    return result;
  } finally {
    // On success promotion already consumed the staging tree; on any failure
    // this removes the partial generation. Either way nothing is left behind.
    rmSync(stageDir, { recursive: true, force: true });
  }
}

/** The publication-managed subtrees of snapshotsDir (everything the builder writes). */
const MANAGED_TREES = ['v1', 'content'] as const;
const STAGE_PREFIX = '.snap-stage-';
const PREV_PREFIX = '.snap-prev-';
const REMOVED_SUFFIX = ' (removed)';

/**
 * Build-time freshness gate for fishability pressureContext (F48): a
 * region_pressure row is only published while its observation is inside this
 * window; an expired row is treated as unavailable (the context is omitted —
 * a stopped feed must not keep presenting an old 3-hour trend as current).
 * The window is 6 h = 2× the ingest acceptance window (PRESSURE_STALE_MINUTES,
 * 3 h): the pressure job only writes rows whose observation was ≤3 h old and
 * builds run hourly, so healthy rows are ≤~4 h old here — 6 h never drops a
 * live row while a frozen one is dropped by the next build after the window.
 * It matches the region_precipitation gate below, so area context has one
 * freshness rule. The payload keeps observedAt, so clients can display the
 * observation age; no recent observations = no context.
 */
const PRESSURE_CONTEXT_MAX_AGE_MS = 6 * 60 * 60_000;

/**
 * Gauge-history window (ADR 0014) — mirrors RAW_RETENTION_DAYS in
 * ingest/usgs.ts (the gauges job's 90-day raw prune). It is a FLOOR, never a
 * completeness promise: whatever survived in gauge_readings_raw is what the
 * file holds, and the file always starts at the oldest retained row.
 */
const GAUGE_HISTORY_WINDOW_DAYS = 90;

function remapStagePathToLive(p: string, stageDir: string, liveDir: string): string {
  const removed = p.endsWith(REMOVED_SUFFIX);
  const base = removed ? p.slice(0, -REMOVED_SUFFIX.length) : p;
  const live = join(liveDir, relative(stageDir, base));
  return removed ? `${live}${REMOVED_SUFFIX}` : live;
}

/** Build and validate the whole generation into `outDir` (a staging directory). */
function buildGeneration(opts: BuildOptions, outDir: string): SnapshotResult {
  const { db, snapshotsDir, now } = opts;
  const conditionsTtl = opts.conditionsTtlMs ?? 3_600_000;
  const files: string[] = [];
  const warnings: string[] = [];
  const v1Dir = join(outDir, 'v1');

  // Seed the staging tree from the current live generation: files this run does
  // not regenerate (e.g. /v1/evidence/waters.json before its first job) must
  // carry forward, and the prune passes below must see them.
  for (const tree of MANAGED_TREES) {
    const liveTree = join(snapshotsDir, tree);
    if (existsSync(liveTree)) cpSync(liveTree, join(outDir, tree), { recursive: true });
  }

  // ── v1/streams.json (GET /v1/streams → Stream[]) ───────────────────────────
  // The ?state= query is answered live by the API route, which filters this file.
  // archived_at IS NULL = the F22 removal policy: seed-archived waters keep
  // their report history in the DB but leave the published catalog here.
  const streamRows = db.prepare('SELECT * FROM streams WHERE archived_at IS NULL ORDER BY name').all() as StreamRow[];
  const streams = rowsToStreams(streamRows);
  const streamsPath = join(v1Dir, 'streams.json');
  writeJsonAtomic(streamsPath, streams);
  files.push(streamsPath);

  // ── v1/conditions/latest.json (ConditionSnapshot[]) ────────────────────────
  const gaugesOk = jobHealthy(db, 'gauges');
  const readings = latestReadings(db, now.getTime());
  const nextExpectedUpdate = new Date(now.getTime() + (gaugesOk ? conditionsTtl : 0)).toISOString();
  const fetchedAt = now.toISOString();
  const conditions: ConditionSnapshot[] = streams.map((s) => {
    const streamReadings =
      s.gaugeIds.length > 0 ? readings.filter((r) => s.gaugeIds.includes(r.gaugeId)) : [];
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

  // ── v1/gauge-history/{gaugeId}.json (GaugeHistory, ADR 0014) ───────────────
  const gaugeHistories = emitGaugeHistory(db, { v1Dir, now, files });

  // ── v1/fishability/{streamId}.json (FishabilitySnapshot, contract v2 / ADR 0007) ──
  // One file per water whose catalog entry names targetSpecies; waters without
  // targetSpecies emit nothing. Bands come from the content pack's species.json
  // (F2, cited values — high-side-only ladders per the ADR Stage 3 amendment);
  // species whose warm-side values are not fully sourced emit an honest
  // assessed:false row instead of a guess. Activity components are emitted only
  // when their source and confidence are available; they never imply missing data.
  const fishabilityWaters = emitFishability(db, { streams, readings, v1Dir, packDir: opts.contentPackDir, now, files, warnings });

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
  // ── v1/stocking/{state}-recent.json — 3-month rolling window, recency-first ──
  // Session-1 window/sort support for the stocking redesign: TWRA rows are
  // SCHEDULES (datePrecision day|week|month), so the window keeps upcoming
  // planned rows inside it (date >= cutoff) rather than only completed past
  // drops, and the file is sorted newest-first for recency-first consumers.
  // Never fabricate completion dates — phrasing stays the consumer's job.
  const stockingRecentByState: Record<string, number> = {};
  const recentCutoff = new Date(now.getTime() - 90 * 86_400_000).toISOString().slice(0, 10);
  for (const [stateId, events] of eventsByState) {
    const recent = events
      .filter((e) => e.date >= recentCutoff)
      .sort((a, b) => b.date.localeCompare(a.date) || a.streamName.localeCompare(b.streamName));
    const p = join(stockingDir, `${stateId}-recent.json`);
    writeJsonAtomic(p, recent);
    files.push(p);
    stockingRecentByState[stateId] = recent.length;
  }
  for (const [stateId, events] of eventsByState) {
    const p = join(stockingDir, `${stateId}.json`);
    writeJsonAtomic(p, events);
    files.push(p);
    stockingByState[stateId] = events.length;
  }
  pruneStateFiles(stockingDir, [...eventsByState.keys()], files);

  // ── v1/shops/{state}.json (Shop[]) ─────────────────────────────────────────
  const shopsByState: Record<string, number> = {};
  // F22: archived shops keep report history but leave the published catalog.
  const shopRows = db.prepare('SELECT * FROM shops WHERE archived_at IS NULL ORDER BY state_id, name').all() as ShopRow[];
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
  // F02: the same feed-scoped publication the portal report route uses, so the
  // scheduled build and the live route write identical bytes at the same URL.
  const reportFeed = publishReportFeed({ db, snapshotsDir: outDir, now });
  files.push(reportFeed.path);

  // ── v1/widgets/conditions-embed.html (shop embed widget, ADR 0018) ─────────
  // ONE static, self-contained HTML artifact per generation: shop selection
  // rides the ?waters= query at runtime (the inline script fetches the same
  // public /v1/*.json snapshots), so there are no per-shop files. Emitted and
  // pruned in this pass exactly like every other managed file, and listed in
  // the generation manifest below.
  const widgetArtifacts = emitWidgetArtifacts({ v1Dir, files, siteUrl: opts.siteUrl });

  // ── v1/evidence/waters.json (WaterEvidence[], data-sources lane) ───────────
  // Re-emits the newest evidence_runs payload (written by the evidence job). No
  // evidence job has run yet → skipped with a warning; never synthesized.
  let evidenceWaters: number | null = null;
  const evidenceRow = db
    .prepare('SELECT payload FROM evidence_runs ORDER BY retrieved_at DESC, id DESC LIMIT 1')
    .get() as { payload: string } | undefined;
  if (evidenceRow) {
    const evidence = WaterEvidenceSetSchema.parse(
      JSON.parse(evidenceRow.payload),
    ) as WaterEvidence[];
    const evidencePath = join(v1Dir, 'evidence', 'waters.json');
    writeJsonAtomic(evidencePath, evidence);
    files.push(evidencePath);
    evidenceWaters = evidence.length;
  } else {
    warnings.push(
      'no evidence_runs yet — /v1/evidence/waters.json not regenerated (run the evidence job)',
    );
  }

  // ── v1/release-schedule/{waterId}.json (TVA context, never a score factor) ──
  const releaseDir = join(v1Dir, 'release-schedule');
  const releaseRows = db
    .prepare('SELECT water_id, payload FROM release_schedules ORDER BY water_id')
    .all() as { water_id: string; payload: string }[];
  const releaseIds: string[] = [];
  for (const row of releaseRows) {
    const schedule = ReleaseScheduleSchema.parse(JSON.parse(row.payload)) as ReleaseSchedule;
    const p = join(releaseDir, `${row.water_id}.json`);
    writeJsonAtomic(p, schedule);
    files.push(p);
    releaseIds.push(row.water_id);
  }
  pruneJsonFiles(releaseDir, releaseIds, files);

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
    const taxaPath = join(outDir, 'content', 'taxa.json');
    const patternsPath = join(outDir, 'content', 'patterns.json');
    writeJsonAtomic(taxaPath, taxa);
    writeJsonAtomic(patternsPath, patterns);
    files.push(taxaPath, patternsPath);

    // Fishing-information content (data-sources lane): served as /content/fishing.json.
    const fishingPackPath = join(packDir, 'fishing.json');
    if (existsSync(fishingPackPath)) {
      const fishingRaw = JSON.parse(readFileSync(fishingPackPath, 'utf8')) as { fishing?: unknown };
      const fishing = FishingInformationSchema.parse(fishingRaw.fishing);
      const fishingPath = join(outDir, 'content', 'fishing.json');
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
      const monthFiles = readdirSync(join(hatchRoot, region)).filter((f) =>
        /^\d{1,2}\.json$/.test(f),
      );
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
    fishabilityWaters,
    stockingByState,
    stockingRecentByState,
    shopsByState,
    reports: reportFeed.reports,
    hatchCharts,
    contentPack,
    evidenceWaters,
    releaseSchedules: releaseRows.length,
    gaugeHistories,
    widgetArtifacts,
    warnings,
  };
}

function readPackEntities<T>(path: string, key: string, schema: { parse: (v: unknown) => T }): T[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const list = raw[key];
  if (!Array.isArray(list)) throw new Error(`${path}: expected a "${key}" array`);
  return list.map((entry) => schema.parse(entry));
}

/**
 * Promote a fully staged generation onto the live tree (F21). The prior
 * generation is copied to a backup directory FIRST and only removed after the
 * promotion verifies; every failure between the two restores the backup.
 *
 * Windows notes: there is no atomic directory replacement, so promotion is a
 * sorted pass of per-file atomic renames (rename-over-existing is atomic per
 * file). Transient destination locks (AV/indexer holding a just-written file)
 * retry briefly instead of failing the whole publication. Sorted order keeps
 * failures reproducible, and rollback best-effort restores every restorable
 * path; a path whose restore is obstructed keeps its backup copy on disk (the
 * backup directory is then retained and the next build's recovery retries it).
 */
function promoteGeneration(liveDir: string, stageDir: string): void {
  // Capture the staged manifest BEFORE promoting: the renames below MOVE files
  // out of staging, so verification and extras-removal must work from this
  // snapshot of the generation (file set, directory set, content hashes).
  const stagedRel = stagedFileList(stageDir);
  const stagedFiles = new Set(stagedRel);
  const stagedDirs = new Set(stagedDirList(stageDir));
  const stagedHashes = new Map<string, string>();
  for (const rel of stagedRel) stagedHashes.set(rel, hashFile(join(stageDir, rel)));
  const backupDir = join(liveDir, `${PREV_PREFIX}${process.pid}`);
  rmSync(backupDir, { recursive: true, force: true });
  let backupMade = false;
  for (const tree of MANAGED_TREES) {
    const liveTree = join(liveDir, tree);
    if (existsSync(liveTree)) {
      cpSync(liveTree, join(backupDir, tree), { recursive: true });
      backupMade = true;
    }
  }
  try {
    // 1. Fast switch: rename every staged file over its live URL.
    for (const rel of stagedRel) {
      const dest = join(liveDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      renameWithRetry(join(stageDir, rel), dest);
    }
    // 2. Remove live entries the new generation dropped. Staging was seeded
    //    from the live trees, so anything live without a staged counterpart is
    //    a deliberate prune (or foreign debris — the dir==contract invariant
    //    prunes it exactly like the per-directory prune passes do).
    for (const tree of MANAGED_TREES) {
      const liveTree = join(liveDir, tree);
      if (existsSync(liveTree)) removeLiveExtras(liveTree, tree, stagedFiles, stagedDirs);
    }
    // 3. Verify the switch against the captured manifest: the live file set
    //    equals the staged set, byte for byte. This is what makes the
    //    promotion "controlled" rather than a best-effort copy.
    const liveRel = liveFileList(liveDir);
    if (liveRel.length !== stagedRel.length || liveRel.some((r) => !stagedFiles.has(r))) {
      throw new Error(
        `promoted file set does not match the staged generation (live=${liveRel.length} staged=${stagedRel.length})`,
      );
    }
    for (const rel of stagedRel) {
      if (hashFile(join(liveDir, rel)) !== stagedHashes.get(rel)) {
        throw new Error(`promoted file ${rel} does not match the staged generation`);
      }
    }
  } catch (err) {
    if (backupMade) {
      try {
        restoreGeneration(liveDir, backupDir);
        rmSync(backupDir, { recursive: true, force: true });
      } catch (restoreErr) {
        throw new Error(
          `snapshot promotion failed (${(err as Error).message}) and rollback was incomplete (${(restoreErr as Error).message}); prior generation kept at ${backupDir}`,
        );
      }
    }
    throw err;
  }
  rmSync(backupDir, { recursive: true, force: true });
}

/**
 * Restore the preserved generation in `backupDir` over the live tree: copy
 * every backup file back, then remove live entries the prior generation does
 * not have (added by the failed promotion). Per-file best-effort so one
 * obstructed path cannot stop the rest of the rollback; throws if ANY path
 * could not be restored (caller keeps the backup in that case).
 */
function restoreGeneration(liveDir: string, backupDir: string): void {
  const backupRel = stagedFileList(backupDir);
  const failures: string[] = [];
  for (const rel of backupRel) {
    const dest = join(liveDir, rel);
    try {
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(join(backupDir, rel), dest);
    } catch {
      failures.push(rel);
    }
  }
  const backupSet = new Set(backupRel);
  for (const tree of MANAGED_TREES) {
    const liveTree = join(liveDir, tree);
    if (existsSync(liveTree)) {
      for (const rel of scanTree(liveTree).files) {
        const abs = join(liveTree, rel);
        if (backupSet.has(join(tree, rel))) continue;
        try {
          rmSync(abs, { recursive: statSync(abs).isDirectory(), force: true });
        } catch {
          failures.push(join(tree, rel));
        }
      }
    }
  }
  if (failures.length > 0) {
    throw new Error(`could not restore: ${failures.join(', ')}`);
  }
}

/**
 * Startup recovery for a promotion interrupted by process death (F21): a
 * `.snap-prev-*` directory means death between backup and cleanup — restore it
 * (the last complete generation wins) and drop it. Stale staging directories
 * are partial work by definition and are removed. Directories owned by a live
 * process are left alone (concurrent builds by pid).
 */
function recoverInterruptedPromotion(liveDir: string): void {
  let entries: string[];
  try {
    entries = readdirSync(liveDir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.startsWith(PREV_PREFIX)) continue;
    if (ownedByLiveProcess(entry, PREV_PREFIX)) continue;
    const backupDir = join(liveDir, entry);
    try {
      restoreGeneration(liveDir, backupDir);
      rmSync(backupDir, { recursive: true, force: true });
    } catch (err) {
      // Obstructed restore: keep the backup for the next recovery attempt and
      // continue — a fully staged+promoted generation will overwrite the tree
      // below anyway. Never let recovery block publication outright.
      process.stderr.write(`snapshot recovery could not restore ${backupDir}: ${(err as Error).message}\n`);
    }
  }
  for (const entry of entries) {
    if (!entry.startsWith(STAGE_PREFIX)) continue;
    if (ownedByLiveProcess(entry, STAGE_PREFIX)) continue;
    rmSync(join(liveDir, entry), { recursive: true, force: true });
  }
}

function ownedByLiveProcess(entry: string, prefix: string): boolean {
  const pid = Number.parseInt(entry.slice(prefix.length), 10);
  if (!Number.isInteger(pid) || pid === process.pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM'; // exists, not ours to signal
  }
}

function liveFileList(liveDir: string): string[] {
  return stagedFileList(liveDir);
}

/** Relative file paths (sorted) under each managed tree of root. */
function stagedFileList(root: string): string[] {
  const out: string[] = [];
  for (const tree of MANAGED_TREES) {
    for (const rel of scanTree(join(root, tree)).files) out.push(join(tree, rel));
  }
  return out.sort();
}

/** Relative directory paths (sorted) under each managed tree of root. */
function stagedDirList(root: string): string[] {
  const out: string[] = [];
  for (const tree of MANAGED_TREES) {
    for (const rel of scanTree(join(root, tree)).dirs) out.push(join(tree, rel));
  }
  return out.sort();
}

/** Relative file + directory paths under root ([] when it does not exist). */
function scanTree(root: string): { files: string[]; dirs: string[] } {
  const files: string[] = [];
  const dirs: string[] = [];
  walk(root, '');
  return { files: files.sort(), dirs: dirs.sort() };
  function walk(base: string, prefix: string): void {
    let entries: string[];
    try {
      entries = readdirSync(join(base, prefix));
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = prefix ? join(prefix, entry) : entry;
      const p = join(base, rel);
      if (statSync(p).isDirectory()) {
        dirs.push(rel);
        walk(base, rel);
      } else {
        files.push(rel);
      }
    }
  }
}

/** Remove live entries that have no counterpart in the staged generation. */
function removeLiveExtras(
  liveDir: string,
  prefix: string,
  stagedFiles: Set<string>,
  stagedDirs: Set<string>,
): void {
  for (const entry of readdirSync(liveDir)) {
    const p = join(liveDir, entry);
    const rel = prefix ? join(prefix, entry) : entry;
    const isDir = statSync(p).isDirectory();
    if (stagedFiles.has(rel) || stagedDirs.has(rel)) {
      if (isDir) removeLiveExtras(p, rel, stagedFiles, stagedDirs);
    } else {
      rmSync(p, { recursive: isDir, force: true });
    }
  }
}

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/**
 * renameSync with a short retry for transient Windows destination locks
 * (EPERM/EBUSY/EACCES from an AV/indexer holding the target file). Other
 * errors (e.g. the destination is a directory) surface immediately.
 */
function renameWithRetry(src: string, dest: string, attempts = 5): void {
  let last: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      renameSync(src, dest);
      return;
    } catch (err) {
      last = err;
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES') throw err;
    }
    sleepSync(25 * attempt);
  }
  throw last;
}

/** Synchronous backoff (Atomics.wait — no timers, works anywhere in Node). */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Emit /v1/gauge-history/{gaugeId}.json (ADR 0014, additive contracts-v2.5.0)
 * from gauge_readings_raw and prune files for gauges that lost all their rows.
 * Returns the gauges emitted.
 *
 * Honesty rules (binding): the file starts at the oldest retained row — no
 * fabricated pre-launch history; NO interpolation — gaps travel as gaps; one
 * sample per timestamp with the NEWEST fetched_at row winning per metric
 * (metrics from different rows at one instant merge into one sample — the same
 * semantics as the web's defensive dedupe); rows where every history metric is
 * null are dropped; a gauge with no usable rows emits NO file — the 404 is the
 * honest "no history" signal. Only numeric USGS ids qualify: tva:/usace:-
 * prefixed rows belong to the conditions bridge and get no file.
 */
function emitGaugeHistory(db: Db, ctx: { v1Dir: string; now: Date; files: string[] }): number {
  interface GaugeRawRow {
    gauge_id: string;
    observed_at: string;
    cfs: number | null;
    height_ft: number | null;
    temp_c: number | null;
    payload: string;
  }
  let rows: GaugeRawRow[];
  try {
    const cutoff = new Date(ctx.now.getTime() - GAUGE_HISTORY_WINDOW_DAYS * 86_400_000).toISOString();
    // F34: observed_at values may carry mixed UTC offsets — instant comparison
    // via julianday, never text. fetched_at ascending puts the newest row of
    // each gauge+timestamp last, so the per-metric overwrites below keep the
    // newest fetched_at's value.
    rows = db
      .prepare(
        `SELECT gauge_id, observed_at, cfs, height_ft, temp_c, payload
         FROM gauge_readings_raw
         WHERE observed_at IS NOT NULL AND julianday(observed_at) >= julianday(?)
         ORDER BY gauge_id, julianday(fetched_at) ASC`,
      )
      .all(cutoff) as GaugeRawRow[];
  } catch {
    // Table/columns missing (pre-002 DB) — history is honestly absent.
    return 0;
  }

  interface SampleValues {
    timestamp: string;
    cfs?: number;
    tempC?: number;
    heightFt?: number;
  }
  const byGauge = new Map<string, Map<number, SampleValues>>();
  for (const r of rows) {
    if (!/^\d+$/.test(r.gauge_id)) continue; // tva:/usace: — conditions bridge, no file
    const observedMs = Date.parse(r.observed_at);
    if (!Number.isFinite(observedMs)) continue;
    let byInstant = byGauge.get(r.gauge_id);
    if (!byInstant) {
      byInstant = new Map<number, SampleValues>();
      byGauge.set(r.gauge_id, byInstant);
    }
    let metricTimes: Record<string, unknown> = {};
    try {
      const raw = JSON.parse(r.payload) as { metricTimes?: Record<string, unknown> };
      if (raw?.metricTimes && typeof raw.metricTimes === 'object') metricTimes = raw.metricTimes;
    } catch { /* Legacy rows use observed_at. */ }
    for (const [metric, value] of [['cfs', r.cfs], ['tempC', r.temp_c], ['heightFt', r.height_ft]] as const) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      const own = metricTimes[metric];
      const time = own === undefined ? observedMs : typeof own === 'string' ? Date.parse(own) : Number.NaN;
      if (!Number.isFinite(time) || time < ctx.now.getTime() - GAUGE_HISTORY_WINDOW_DAYS * 86_400_000 || time > ctx.now.getTime() + 60_000) continue;
      const sample = byInstant.get(time) ?? { timestamp: new Date(time).toISOString() };
      sample[metric] = value;
      byInstant.set(time, sample);
    }
  }

  const gaugeDir = join(ctx.v1Dir, 'gauge-history');
  const emitted: string[] = [];
  for (const [gaugeId, byInstant] of byGauge) {
    const samples = [...byInstant.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, s]) => s)
      .filter((s) => s.cfs !== undefined || s.tempC !== undefined || s.heightFt !== undefined);
    if (samples.length === 0) continue; // no measurement survived → no file (honest absence)
    const metrics = (['cfs', 'tempC', 'heightFt'] as const).filter((metric) =>
      samples.some((s) => s[metric] !== undefined),
    );
    const history = GaugeHistorySchema.parse({
      gaugeId,
      metrics,
      samples,
      retrievedAt: ctx.now.toISOString(),
      // Same USGS source link the fishability evidence uses.
      sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${gaugeId}`,
    }) satisfies GaugeHistory;
    const p = join(gaugeDir, `${gaugeId}.json`);
    writeJsonAtomic(p, history);
    ctx.files.push(p);
    emitted.push(gaugeId);
  }
  // A gauge that lost all rows (or never had usable ones) must lose its file
  // even when no gauge qualifies anymore — prune FIRST discipline, shared with
  // emitFishability.
  pruneJsonFiles(gaugeDir, emitted, ctx.files);
  return emitted.length;
}

/**
 * Emit /v1/fishability/{streamId}.json for every water with targetSpecies and
 * prune files for waters that no longer have any. Returns the waters emitted.
 */
function emitFishability(
  db: Db,
  ctx: {
    streams: Stream[];
    readings: ReturnType<typeof latestReadings>;
    v1Dir: string;
    packDir?: string;
    now: Date;
    files: string[];
    warnings: string[];
  },
): number {
  const scoring = ctx.streams.filter((s) => (s.targetSpecies?.length ?? 0) > 0);
  // Prune FIRST: a water that lost its targetSpecies must lose its file even
  // when no water qualifies anymore (otherwise the last emission lingers).
  pruneFishabilityFiles(join(ctx.v1Dir, 'fishability'), scoring.map((s) => s.id), ctx.files);
  if (scoring.length === 0) return 0;

  const bandsBySpecies = new Map<SpeciesKey, SpeciesComfortBands>();
  const spawnBySpecies = new Map<SpeciesKey, SpawnInfo>();
  const speciesPackPath = ctx.packDir ? join(ctx.packDir, 'species.json') : undefined;
  if (speciesPackPath && existsSync(speciesPackPath)) {
    const raw = JSON.parse(readFileSync(speciesPackPath, 'utf8')) as {
      species?: Array<{ id: string } & SpeciesReferenceLike>;
    };
    for (const entry of raw.species ?? []) {
      const parsed = SpeciesKeySchema.safeParse(entry.id);
      if (!parsed.success) continue;
      const bands = bandsFromReference(parsed.data, entry);
      if (bands) bandsBySpecies.set(parsed.data, bands);
      const spawn = spawnThresholdsFromReference(entry);
      if (spawn) spawnBySpecies.set(parsed.data, spawn);
    }
  } else {
    ctx.warnings.push('content pack has no species.json — fishability rows emit as cannot-assess (honest)');
  }

  const fishDir = join(ctx.v1Dir, 'fishability');
  // Pressure is an area-level context row only; it never enters the activity
  // total or any comfort score.
  const pressureByRegion = new Map<string, PressureInfo>();
  const rainByRegion = new Map<string, RainInfo>();
  try {
    const rows = db.prepare('SELECT region_id, observed_at, trend_hpa_3h, trend_direction, station FROM region_pressure').all() as {
      region_id: string;
      observed_at: string;
      trend_hpa_3h: number | null;
      trend_direction: 'rising' | 'falling' | 'stable';
      station: string;
    }[];
    // F48: an observation older than the freshness window is unavailable
    // context, not current context — omit it (the ingest job leaves the last
    // accepted row in place when a feed goes quiet, so age must be re-checked
    // here at every build, not just at ingest time).
    const expiredPressureRegions: string[] = [];
    for (const r of rows) {
      if (r.trend_hpa_3h === null) continue;
      if (ctx.now.getTime() - Date.parse(r.observed_at) > PRESSURE_CONTEXT_MAX_AGE_MS) {
        expiredPressureRegions.push(r.region_id);
        continue;
      }
      pressureByRegion.set(r.region_id, {
        deltaHpa: r.trend_hpa_3h,
        station: r.station,
        observedAt: r.observed_at,
        direction: r.trend_direction,
      });
    }
    if (expiredPressureRegions.length > 0) {
      ctx.warnings.push(
        `region pressure older than ${PRESSURE_CONTEXT_MAX_AGE_MS / 3_600_000}h omitted from fishability context (feed stale?): ${expiredPressureRegions.sort().join(', ')}`,
      );
    }
  } catch {
    // Table missing (pre-009 DB) — pressure context is honestly absent.
  }
  try {
    const rows = db.prepare('SELECT region_id, observed_at, precipitation_mm, station FROM region_precipitation').all() as {
      region_id: string;
      observed_at: string;
      precipitation_mm: number;
      station: string;
    }[];
    for (const r of rows) {
      if (ctx.now.getTime() - Date.parse(r.observed_at) > 6 * 60 * 60_000) continue;
      rainByRegion.set(r.region_id, {
        precipitationMm: r.precipitation_mm,
        station: r.station,
        observedAt: r.observed_at,
      });
    }
  } catch {
    // Table missing (pre-013 DB) — region rain fallback is honestly absent.
  }

  let emitted = 0;
  for (const stream of scoring) {
    const streamReadings =
      stream.gaugeIds.length > 0 ? ctx.readings.filter((r) => stream.gaugeIds.includes(r.gaugeId)) : [];
    const snapshot = buildFishabilitySnapshot(
      stream,
      streamReadings,
      bandsBySpecies,
      ctx.now.getTime(),
      spawnBySpecies,
      pressureByRegion.get(stream.regionId),
      rainByRegion.get(stream.regionId),
    );
    const p = join(fishDir, `${stream.id}.json`);
    writeJsonAtomic(p, snapshot);
    ctx.files.push(p);
    emitted += 1;
  }
  return emitted;
}

/** Remove fishability files for waters that no longer carry targetSpecies. */
function pruneFishabilityFiles(fishDir: string, keepStreamIds: string[], files: string[]): void {
  let existing: string[];
  try {
    existing = readdirSync(fishDir);
  } catch {
    return;
  }
  for (const f of existing) {
    if (!f.endsWith('.json')) continue;
    const streamId = f.slice(0, -'.json'.length);
    if (!keepStreamIds.includes(streamId)) {
      const p = join(fishDir, f);
      rmSync(p);
      files.push(`${p} (removed)`);
    }
  }
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
    // `{state}.json` full history + `{state}-recent.json` rolling-window slices
    // share the prune lifecycle of their state.
    const stateId = f.slice(0, -'.json'.length).replace(/-recent$/, '');
    if (!keepStates.includes(stateId)) {
      const p = join(dir, f);
      rmSync(p);
      files.push(`${p} (removed)`);
    }
  }
}

/** Remove per-water context files that no longer have a persisted source row. */
function pruneJsonFiles(dir: string, keepIds: string[], files: string[]): void {
  let existing: string[];
  try {
    existing = readdirSync(dir);
  } catch {
    return;
  }
  for (const f of existing) {
    if (!f.endsWith('.json')) continue;
    const id = f.slice(0, -'.json'.length);
    if (!keepIds.includes(id)) {
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
