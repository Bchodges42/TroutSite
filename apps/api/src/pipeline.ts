import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Db } from './db.js';
import { parseInstantValues, runGaugesJob } from './ingest/usgs.js';
import { runStockingJob } from './ingest/stockingJob.js';
import { getAdapters } from './ingest/stocking/index.js';
import { buildSnapshots } from './snapshots/build.js';
import { startJob } from './jobs/run.js';

export type JobName = 'gauges' | 'stocking' | 'snapshots';

export interface PipelineConfig {
  snapshotsDir: string;
  contentPackDir: string;
  rawDir: string;
  userAgent: string;
  fixturesDir: string;
}

export interface JobOutcome {
  job: JobName;
  ok: boolean;
  detail: Record<string, unknown>;
}

/** Resolve pipeline paths from env (relative paths anchor at the api package root/cwd). */
export function pipelineConfig(env: {
  TROUT_SNAPSHOTS_DIR?: string;
  TROUT_CONTENT_DIR?: string;
  TROUT_RAW_DIR?: string;
  USGS_USER_AGENT?: string;
}, fixturesDir?: string): PipelineConfig {
  const contentDir = resolve(env.TROUT_CONTENT_DIR ?? '../../packages/content');
  return {
    snapshotsDir: resolve(env.TROUT_SNAPSHOTS_DIR ?? '../web/public'),
    contentPackDir: resolve(contentDir, 'dist/pack'),
    rawDir: resolve(env.TROUT_RAW_DIR ?? 'data/raw'),
    userAgent: env.USGS_USER_AGENT ?? 'trout-local/0.1.0 (contact: set USGS_USER_AGENT in env)',
    fixturesDir: fixturesDir ?? resolve('fixtures'),
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
  errors: string[];
  warnings: string[];
}

/**
 * --dry-run: parse every recorded fixture (USGS JSON + each state adapter's artifacts),
 * validate against the frozen contracts, and touch NOTHING — no DB, no snapshots, no
 * raw captures, no network (non-negotiable #3).
 */
export function dryRun(cfg: PipelineConfig): DryRunResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let readings = 0;
  let events = 0;
  let fixtureSets = 0;

  // USGS fixtures: every *.json directly under fixtures/USGS/.
  for (const f of listFiles(join(cfg.fixturesDir, 'USGS')).filter((x) => x.endsWith('.json'))) {
    fixtureSets += 1;
    try {
      const parsed = JSON.parse(readFileSync(join(cfg.fixturesDir, 'USGS', f), 'utf8'));
      readings += parseInstantValues(parsed).length;
    } catch (err) {
      errors.push(`USGS/${f}: ${(err as Error).message}`);
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

  return { ok: errors.length === 0, fixtureSets, readings, events, errors, warnings };
}

/** Run one pipeline job against the live world (network + SQLite + snapshots). */
export async function runJob(
  db: Db,
  cfg: PipelineConfig,
  job: JobName,
  opts: { now?: Date; states?: string[] } = {},
): Promise<JobOutcome> {
  const now = opts.now ?? new Date();
  if (job === 'gauges') {
    await runGaugesJob(db, { userAgent: cfg.userAgent });
    const snap = buildSnapshots({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir, now });
    return { job, ok: true, detail: { ...snap, files: snap.files.length } };
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
