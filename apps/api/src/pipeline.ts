import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Db } from './db.js';
import { parseInstantValues, runGaugesJob } from './ingest/usgs.js';
import { parseWaterDataResponse } from './ingest/usgs-waterdata.js';
import { runStockingJob } from './ingest/stockingJob.js';
import { getAdapters } from './ingest/stocking/index.js';
import { buildSnapshots } from './snapshots/build.js';
import { runEvidenceJob } from './evidence/evidenceJob.js';
import { runConditionsReadingsJob } from './evidence/conditionsBridge.js';
import { parseUsgsObservations } from './evidence/usgs-provider.js';
import { parseTvaObservations } from './evidence/tva-provider.js';
import { parseTwraEvidence } from './evidence/twra-evidence.js';
import { TWRA_PAGE_URL } from './ingest/stocking/tn.js';
import { startJob } from './jobs/run.js';
import { runPressureJob } from './evidence/nws-provider.js';

/**
 * Dispatcher job names (F05): 'pressure' is the NWS area pressure/rain job —
 * reachable from BOTH stacks (dev pm2 cron AND the canonical Windows refresh)
 * through `ingest --job=pressure` / runJob, instead of living only in its
 * declaration and tests.
 */
export type JobName = 'gauges' | 'stocking' | 'evidence' | 'snapshots' | 'pressure';

export interface PipelineConfig {
  snapshotsDir: string;
  contentPackDir: string;
  rawDir: string;
  userAgent: string;
  usgsProvider: 'legacy' | 'waterdata';
  usgsWaterDataApiKey?: string;
  fixturesDir: string;
}

export interface JobOutcome {
  job: JobName;
  ok: boolean;
  detail: Record<string, unknown>;
}

// apps/api/{src,dist}/pipeline.* sit three levels below the repo root. Anchoring
// path defaults here (not process.cwd()) keeps every entrypoint resolving the same
// tree: pnpm scripts run with cwd=apps/api, but the pm2 cron/api processes run with
// cwd=REPO_ROOT — the cwd-anchored defaults made the cron look for the content pack
// two levels ABOVE the repo (the 2026-09-08 "content pack not found" incident).
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));

/** Resolve pipeline paths from env (relative paths anchor at the repo root, cwd-independent). */
export function pipelineConfig(env: {
  TROUT_SNAPSHOTS_DIR?: string;
  TROUT_CONTENT_DIR?: string;
  TROUT_RAW_DIR?: string;
  USGS_USER_AGENT?: string;
  USGS_PROVIDER?: 'legacy' | 'waterdata';
  USGS_WATERDATA_API_KEY?: string;
}, fixturesDir?: string): PipelineConfig {
  const contentDir = resolve(REPO_ROOT, env.TROUT_CONTENT_DIR ?? 'packages/content');
  return {
    snapshotsDir: resolve(REPO_ROOT, env.TROUT_SNAPSHOTS_DIR ?? 'apps/web/public'),
    contentPackDir: resolve(contentDir, 'dist/pack'),
    rawDir: resolve(REPO_ROOT, env.TROUT_RAW_DIR ?? 'apps/api/data/raw'),
    userAgent: env.USGS_USER_AGENT ?? 'trout-local/0.1.0 (contact: set USGS_USER_AGENT in env)',
    usgsProvider: env.USGS_PROVIDER ?? 'waterdata',
    ...(env.USGS_WATERDATA_API_KEY ? { usgsWaterDataApiKey: env.USGS_WATERDATA_API_KEY } : {}),
    fixturesDir: fixturesDir ?? resolve(REPO_ROOT, 'apps/api/fixtures'),
  };
}

function listFiles(dir: string): string[] {
  try {
    return readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());
  } catch {
    return [];
  }
}

export interface DryRunResult {
  ok: boolean;
  fixtureSets: number;
  readings: number;
  events: number;
  observations: number;
  evidenceStockingEvents: number;
  errors: string[];
  warnings: string[];
}

/**
 * --dry-run: parse every recorded fixture (USGS JSON + each state adapter's artifacts +
 * the evidence-layer providers' fixtures), validate against the frozen contracts, and
 * touch NOTHING — no DB, no snapshots, no raw captures, no network (non-negotiable #3).
 */
export function dryRun(cfg: PipelineConfig): DryRunResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let readings = 0;
  let events = 0;
  let fixtureSets = 0;
  let observations = 0;
  let evidenceStockingEvents = 0;

  // USGS fixtures: every *.json directly under fixtures/USGS/.
  for (const f of listFiles(join(cfg.fixturesDir, 'USGS')).filter((x) => x.endsWith('.json'))) {
    fixtureSets += 1;
    try {
      const parsed = JSON.parse(readFileSync(join(cfg.fixturesDir, 'USGS', f), 'utf8'));
      readings += parseInstantValues(parsed).length;
      observations += parseUsgsObservations(parsed).length;
    } catch (err) {
      errors.push(`USGS/${f}: ${(err as Error).message}`);
    }
  }

  // Modern Water Data OGC-API fixtures are kept beside the legacy NWIS set so
  // migration tests exercise both parsers without contacting the network.
  for (const f of listFiles(join(cfg.fixturesDir, 'USGS-WATERDATA')).filter((x) => x.endsWith('.json'))) {
    fixtureSets += 1;
    try {
      const parsed = JSON.parse(readFileSync(join(cfg.fixturesDir, 'USGS-WATERDATA', f), 'utf8'));
      readings += parseWaterDataResponse(parsed).length;
    } catch (err) {
      errors.push(`USGS-WATERDATA/${f}: ${(err as Error).message}`);
    }
  }

  // TVA fixtures: fixtures/TVA/observed-data-*.json row arrays (evidence provider).
  for (const f of listFiles(join(cfg.fixturesDir, 'TVA')).filter((x) => x.startsWith('observed-data-') && x.endsWith('.json'))) {
    fixtureSets += 1;
    try {
      const parsed = JSON.parse(readFileSync(join(cfg.fixturesDir, 'TVA', f), 'utf8')) as unknown[];
      const obs = parseTvaObservations(parsed as Parameters<typeof parseTvaObservations>[0], { locationId: 'DRYRUN' });
      observations += obs.length;
      if (obs.length === 0) warnings.push(`TVA/${f}: parsed to zero observations`);
    } catch (err) {
      errors.push(`TVA/${f}: ${(err as Error).message}`);
    }
  }

  // Evidence-layer TWRA fixtures: dated artifact sets also parsed through the
  // two-grid evidence parser (schedule vs recent-report).
  {
    const dir = join(cfg.fixturesDir, 'TN');
    const dated = listFiles(dir).filter((f) => /^\d{4}-\d{2}-\d{2}[.-]/.test(f)).sort();
    const dates = [...new Set(dated.map((f) => f.slice(0, 'YYYY-MM-DD'.length)))];
    for (const date of dates) {
      const artifacts = dated
        .filter((f) => f.startsWith(`${date}.`) || f.startsWith(`${date}-`))
        .map((f) => {
          const rawSuffix = f.slice(date.length + 1);
          const suffix = rawSuffix.endsWith('.html') ? 'html' : rawSuffix;
          // Evidence events carry sourceUrl; fixtures must validate, so the TWRA
          // page URL stands in for the fixture filename here.
          return { suffix, content: readFileSync(join(dir, f), 'utf8'), url: TWRA_PAGE_URL };
        });
      const hasPage = artifacts.some((a) => a.suffix === 'html' || a.suffix.endsWith('.html'));
      const hasJson = artifacts.some((a) => a.suffix.endsWith('.json') || a.suffix.endsWith('.exceldriven.json'));
      if (!hasPage || !hasJson) continue;
      fixtureSets += 1;
      try {
        const result = parseTwraEvidence(artifacts, { now: new Date() });
        evidenceStockingEvents += result.scheduleRows.length + result.recentRows.length;
        warnings.push(...result.warnings.map((w) => `TN/${date} (evidence): ${w}`));
      } catch (err) {
        errors.push(`TN/${date} (evidence): parseTwraEvidence threw: ${(err as Error).message}`);
      }
    }
  }

  // Stocking fixtures: fixtures/<STATE>/ holding one or more {date}.* artifact sets.
  for (const adapter of getAdapters()) {
    const dir = join(cfg.fixturesDir, adapter.stateId);
    const dated = listFiles(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}[.-]/.test(f))
      .sort();
    if (dated.length === 0) {
      warnings.push(`no fixtures for state ${adapter.stateId} — add some under fixtures/${adapter.stateId}/`);
      continue;
    }
    const dates = [...new Set(dated.map((f) => f.slice(0, 'YYYY-MM-DD'.length)))];
    for (const date of dates) {
      const artifacts = dated
        .filter((f) => f.startsWith(`${date}.`) || f.startsWith(`${date}-`))
        .map((f) => {
          const rawSuffix = f.slice(date.length + 1);
          // Descriptive fixture names ({date}-redesign.html) still map to their type.
          const suffix = rawSuffix.endsWith('.html') ? 'html' : rawSuffix;
          return {
            suffix,
            content: readFileSync(join(dir, f), 'utf8'),
            url: adapter.sourceUrl,
          };
        });
      fixtureSets += 1;
      try {
        const result = adapter.normalize({ artifacts, fetchedAt: new Date().toISOString() }, { now: new Date() });
        events += result.events.length;
        warnings.push(...result.warnings.map((w) => `${adapter.stateId}/${date}: ${w}`));
      } catch (err) {
        errors.push(
          `${adapter.stateId}/${date}: normalize threw (adapters must never throw on fixtures): ${(err as Error).message}`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    fixtureSets,
    readings,
    events,
    observations,
    evidenceStockingEvents,
    errors,
    warnings,
  };
}

/** Run one pipeline job against the live world (network + SQLite + snapshots). */
export async function runJob(
  db: Db,
  cfg: PipelineConfig,
  job: JobName,
  opts: { now?: Date; states?: string[]; fetchImpl?: typeof fetch } = {},
): Promise<JobOutcome> {
  const now = opts.now ?? new Date();
  if (job === 'pressure') {
    // F05: NWS area pressure/rain through the dispatcher. The job soft-fails
    // per station; a COMPLETE failure (every station errored, nothing stored)
    // is a failed dispatch, mirroring the F33 outcome discipline.
    const result = await runPressureJob(db, {
      userAgent: cfg.userAgent,
      now,
      ...(opts.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
    });
    const snap = buildSnapshots({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir, now });
    const completeFailure = result.errors > 0 && result.stored === 0;
    return { job, ok: !completeFailure, detail: { ...result, snapshots: snap.files.length } };
  }
  if (job === 'gauges') {
    const usgsResult = await runGaugesJob(db, {
      userAgent: cfg.userAgent,
      provider: cfg.usgsProvider,
      waterDataApiKey: cfg.usgsWaterDataApiKey,
    });
    // Non-USGS gauge sources (TVA + USACE) into gauge_readings_raw — the same
    // lane, its own jobs_log row; build.ts still keys staleness on 'gauges'.
    const conditions = await runConditionsReadingsJob(db, {
      userAgent: cfg.userAgent,
      releaseSchedules: true,
      includeReservoirs: true,
    });
    const snap = buildSnapshots({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir, now });
    // F33: the dispatcher no longer swallows the ingestion result. A complete
    // conditions failure (every station errored, nothing stored) is a failed
    // dispatch even though the bridge soft-failed internally.
    const conditionsFailed = conditions.errors > 0 && conditions.gauges === 0;
    return {
      job,
      ok: !conditionsFailed,
      detail: {
        usgs: { items: usgsResult.items, sites: usgsResult.sites, warnings: usgsResult.warnings },
        conditionsIngest: conditions,
        ...snap,
        files: snap.files.length,
      },
    };
  }
  if (job === 'stocking') {
    const result = await runStockingJob(
      db,
      {
        fetchImpl: fetch,
        userAgent: cfg.userAgent,
        rawDir: cfg.rawDir,
        now,
      },
      { states: opts.states },
    );
    const snap = buildSnapshots({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir, now });
    const failing = result.states.filter((s) => !s.ok).length;
    return { job, ok: failing === 0, detail: { ...result, snapshots: snap.files.length } };
  }
  if (job === 'evidence') {
    const result = await runEvidenceJob(
      db,
      { contentPackDir: cfg.contentPackDir, rawDir: cfg.rawDir, userAgent: cfg.userAgent },
      { now },
    );
    const snap = buildSnapshots({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir, now });
    // F33: a failed evidence run (every expected observation source down) is a
    // failed dispatch — the payload still stores, carrying last-good data.
    return { job, ok: result.outcome !== 'failed', detail: { ...result, snapshots: snap.files.length } };
  }
  const handle = startJob(db, 'snapshots');
  try {
    const snap = buildSnapshots({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir, now });
    const detail = { ...snap, files: snap.files.length };
    handle.ok(detail);
    return { job, ok: true, detail };
  } catch (err) {
    handle.fail(err);
    throw err;
  }
}
