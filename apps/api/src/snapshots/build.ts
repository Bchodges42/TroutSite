import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  ConditionSnapshotSchema,
  ShopReportSchema,
  ShopSchema,
  StreamSchema,
  StockingEventSchema,
  scoreConditions,
} from '@trout/contracts';
import type { ConditionSnapshot, Shop, ShopReport, Stream, StockingEvent } from '@trout/contracts';
import type { Db } from '../db.js';
import { latestReadings } from '../ingest/usgs.js';
import { jobHealthy } from '../jobs/run.js';
import { writeJsonAtomic } from '../lib/jsonFile.js';

export interface BuildOptions {
  db: Db;
  snapshotsDir: string;
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
      `SELECT r.id, r.shop_id, r.stream_id, r.date, r.body, r.hot_patterns, r.attribution_url, r.published_at,
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
}

/**
 * Regenerate every Role-3 snapshot file into apps/web/public/data (the sanctioned
 * apps/web write, §3/§5). All payloads are validated against the frozen contract
 * schemas BEFORE writing; writes are atomic (temp + rename).
 *
 * Stale signal: ConditionSnapshot.nextExpectedUpdate is now+1h while the last gauges
 * job was healthy, `now` when it errored (immediately stale for consumers). Stocking
 * staleness rides on each event's fetchedAt (failed states are not rewritten).
 */
export function buildSnapshots(opts: BuildOptions): SnapshotResult {
  const { db, snapshotsDir, now } = opts;
  const conditionsTtl = opts.conditionsTtlMs ?? 3_600_000;
  const files: string[] = [];

  // ── streams.json (GET /v1/streams → Stream[]) ──────────────────────────────
  const streamRows = db.prepare('SELECT * FROM streams ORDER BY name').all() as StreamRow[];
  const streams = rowsToStreams(streamRows);
  const streamsPath = join(snapshotsDir, 'streams.json');
  writeJsonAtomic(streamsPath, streams);
  files.push(streamsPath);

  // ── conditions/latest.json (ConditionSnapshot[]) ───────────────────────────
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
  const conditionsPath = join(snapshotsDir, 'conditions', 'latest.json');
  writeJsonAtomic(conditionsPath, conditions);
  files.push(conditionsPath);

  // ── stocking/{state}.json (StockingEvent[]) ────────────────────────────────
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
      sourceUrl: r.source_url,
      fetchedAt: r.fetched_at,
    });
    const list = eventsByState.get(event.stateId) ?? [];
    list.push(event);
    eventsByState.set(event.stateId, list);
  }
  const stockingDir = join(snapshotsDir, 'stocking');
  for (const [stateId, events] of eventsByState) {
    const p = join(stockingDir, `${stateId}.json`);
    writeJsonAtomic(p, events);
    files.push(p);
    stockingByState[stateId] = events.length;
  }
  pruneOrphans(stockingDir, [...eventsByState.keys()], files);

  // ── shops/{state}.json (Shop[]) ────────────────────────────────────────────
  const shopsByState: Record<string, number> = {};
  const shopRows = db.prepare('SELECT * FROM shops ORDER BY state_id, name').all() as ShopRow[];
  const shopsByStateMap = new Map<string, Shop[]>();
  for (const shop of rowsToShops(shopRows)) {
    const list = shopsByStateMap.get(shop.stateId) ?? [];
    list.push(shop);
    shopsByStateMap.set(shop.stateId, list);
  }
  const shopsDir = join(snapshotsDir, 'shops');
  for (const [stateId, shops] of shopsByStateMap) {
    const p = join(shopsDir, `${stateId}.json`);
    writeJsonAtomic(p, shops);
    files.push(p);
    shopsByState[stateId] = shops.length;
  }
  pruneOrphans(shopsDir, [...shopsByStateMap.keys()], files);

  // ── reports/recent.json (ShopReport[], last 30 days) ───────────────────────
  const reports = recentReports(db, now);
  const reportsPath = join(snapshotsDir, 'reports', 'recent.json');
  writeJsonAtomic(reportsPath, reports);
  files.push(reportsPath);

  return {
    files,
    streams: streams.length,
    conditions: conditions.length,
    stockingByState,
    shopsByState,
    reports: reports.length,
  };
}

/** Remove state files that no longer correspond to data (keeps the dir == contract). */
function pruneOrphans(dir: string, keepStates: string[], files: string[]): void {
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
