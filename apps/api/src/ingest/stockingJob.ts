import { createHash } from 'node:crypto';
import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { StockingEventSchema } from '@trout/contracts';
import type { StockingEvent } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import { getAdapters } from './stocking/index.js';
import type { FetchCtx, RawArtifact, RawFetch, StateAdapter } from './stocking/types.js';

/** Adapters registered for ingestion are maintained in ./stocking/index.ts. */

/** One line of the raw-capture manifest: what was fetched, from where, intact how proven. */
export interface RawCaptureEntry {
  /** File name inside the capture directory. */
  file: string;
  url: string;
  suffix: string;
  gridKind?: string;
  sha256: string;
  bytes: number;
}

export interface RawCaptureManifest {
  /** Run timestamp used in every artifact filename of this run, e.g. 20260929T163000Z. */
  run: string;
  fetchedAt: string;
  artifacts: RawCaptureEntry[];
}

/** Filesystem-safe token: collapse everything outside [A-Za-z0-9._-] to '_', cap length. */
function safeToken(s: string, maxLen: number): string {
  const cleaned = s.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return (cleaned.length > 0 ? cleaned : 'capture').slice(0, maxLen);
}

/** Run stamp for filenames — compact UTC, no ':' (illegal in Windows filenames). */
function runStamp(now: Date): string {
  const iso = now.toISOString();
  return `${iso.slice(0, 10).replace(/-/g, '')}T${iso.slice(11, 19).replace(/:/g, '')}Z`;
}

/**
 * Write {file} atomically: content lands in a unique temp file first and is renamed
 * into place, so a crash mid-write can never leave a truncated capture behind.
 * `writeFile` is injectable for failure tests.
 */
function atomicWriteFile(path: string, content: string, writeFile: (p: string, c: string) => void): void {
  const tmp = `${path}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    writeFile(tmp, content);
    renameSync(tmp, path);
  } catch (err) {
    try {
      unlinkSync(tmp);
    } catch {
      // best-effort cleanup; the original error is what matters
    }
    throw err;
  }
}

/**
 * Persist EVERY fetched artifact of one run under collision-proof names (F36) and
 * record a URL/hash manifest. Each file is named
 *   {runStamp}.{seq}.{captureKind?}.{source-slug}.{suffix}
 * so two grids that share a suffix (TWRA ships schedule + recent-report both as
 * *.exceldriven.json) can never overwrite one another, and re-runs land beside —
 * not on top of — earlier captures. The manifest ({runStamp}.manifest.json) is
 * written LAST as the run's commit record: its presence says the run stored every
 * artifact; its entries map each file back to its source URL and sha256.
 */
export function saveRawCaptures(
  dir: string,
  now: Date,
  artifacts: readonly RawArtifact[],
  opts: { writeFile?: (path: string, content: string) => void } = {},
): RawCaptureManifest {
  const writeFile = opts.writeFile ?? ((p, c) => atomicWriteFile(p, c, writeFileSync));
  mkdirSync(dir, { recursive: true });
  const stamp = runStamp(now);
  const manifest: RawCaptureManifest = { run: stamp, fetchedAt: now.toISOString(), artifacts: [] };
  artifacts.forEach((a, i) => {
    const seq = String(i).padStart(2, '0');
    const kind = a.captureKind ? `${safeToken(a.captureKind, 40)}.` : '';
    // Stable source identifier: the source URL's file name minus its captured
    // suffix (the TWRA CMS datatable id lives there and changes per deploy).
    const base = basename(new URL(a.url).pathname);
    const stripped = base.toLowerCase().endsWith(`.${a.suffix.toLowerCase()}`)
      ? base.slice(0, -1 * (a.suffix.length + 1))
      : base.replace(/\.[A-Za-z0-9]+$/, '');
    const slug = safeToken(stripped, 64);
    const file = `${stamp}.${seq}.${kind}${slug}.${safeToken(a.suffix, 60)}`;
    const path = join(dir, file);
    writeFile(path, a.content);
    manifest.artifacts.push({
      file,
      url: a.url,
      suffix: a.suffix,
      ...(a.captureKind ? { gridKind: a.captureKind } : {}),
      sha256: createHash('sha256').update(a.content, 'utf8').digest('hex'),
      bytes: Buffer.byteLength(a.content, 'utf8'),
    });
  });
  writeFile(join(dir, `${stamp}.manifest.json`), JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * Persist raw artifacts for a stocking adapter run into {rawDir}/{stateId}/
 * (audit trail, §8) — one collision-proof file per fetched artifact plus a
 * URL/hash manifest (see saveRawCaptures). Returns the written file paths.
 */
export function saveRawArtifacts(rawDir: string, stateId: string, now: Date, raw: RawFetch): string[] {
  const dir = join(rawDir, stateId);
  const manifest = saveRawCaptures(dir, now, raw.artifacts);
  return manifest.artifacts.map((e) => join(dir, e.file));
}

function upsertEvents(db: Db, events: StockingEvent[]): number {
  const insert = db.prepare(`
    INSERT INTO stocking_events (id, state_id, stream_name, county, species, count, date, date_precision, source_url, fetched_at)
    VALUES (@id, @state_id, @stream_name, @county, @species, @count, @date, @date_precision, @source_url, @fetched_at)
    ON CONFLICT(id) DO UPDATE SET
      stream_name=@stream_name, county=@county, species=@species, count=@count,
      date=@date, date_precision=@date_precision, source_url=@source_url, fetched_at=@fetched_at
  `);
  return db.transaction(() => {
    let n = 0;
    for (const e of events) {
      insert.run({
        id: e.id,
        state_id: e.stateId,
        stream_name: e.streamName,
        county: e.county ?? null,
        species: e.species,
        count: e.count ?? null,
        date: e.date,
        date_precision: e.datePrecision ?? null,
        source_url: e.sourceUrl,
        fetched_at: e.fetchedAt,
      });
      n += 1;
    }
    return n;
  })();
}

export interface StockingStateResult {
  stateId: string;
  items: number;
  rawFiles: string[];
  warnings: string[];
  /** false when the fetch/normalize failed soft (pipeline survived, data went stale). */
  ok: boolean;
}

export interface StockingJobResult extends JobDetail {
  items: number;
  /** false when every state (or the only state) soft-failed. */
  ok: boolean;
  states: StockingStateResult[];
}

export interface RunStockingOptions {
  adapters?: StateAdapter[];
  states?: string[];
}

/**
 * Stocking job: for every registered adapter, fetchLatest → raw snapshots → normalize →
 * contract-validate → upsert. A failing state SOFT-FAILS: error row in jobs_log, the
 * process and the other states keep going, previous events stay in SQLite (stale).
 */
export async function runStockingJob(
  db: Db,
  ctx: Omit<FetchCtx, 'now'> & { now?: Date },
  opts: RunStockingOptions = {},
): Promise<StockingJobResult> {
  const now = ctx.now ?? new Date();
  const adapters = (opts.adapters ?? getAdapters()).filter(
    (a) => !opts.states || opts.states.includes(a.stateId),
  );
  const handle = startJob(db, 'stocking');
  const stateResults: StockingStateResult[] = [];

  for (const adapter of adapters) {
    const stateHandle = startJob(db, `stocking:${adapter.stateId}`);
    try {
      const raw = await adapter.fetchLatest({ ...ctx, now });
      saveRawArtifacts(ctx.rawDir, adapter.stateId, now, raw);
      const { events, warnings } = adapter.normalize(raw, { now });
      // Fixtures are law: nothing enters SQLite without validating against the frozen schema.
      const invalid = events.filter((e) => !StockingEventSchema.safeParse(e).success);
      if (invalid.length > 0) {
        throw new Error(`${invalid.length} event(s) failed StockingEventSchema validation`);
      }
      const items = upsertEvents(db, events);
      const detail: JobDetail = { items, warnings };
      const result: StockingStateResult = {
        stateId: adapter.stateId,
        items,
        rawFiles: [],
        warnings,
        ok: true,
      };
      stateHandle.ok(detail);
      stateResults.push(result);
    } catch (err) {
      const cause = (err as { cause?: { message?: string; code?: string } }).cause;
      const message = `${err instanceof Error ? err.message : String(err)}${cause ? ` (cause: ${cause.message ?? cause.code ?? 'unknown'})` : ''}`;
      stateHandle.fail(err, { items: 0 });
      stateResults.push({
        stateId: adapter.stateId,
        items: 0,
        rawFiles: [],
        warnings: [`soft-fail: ${message}`],
        ok: false,
      });
    }
  }

  const items = stateResults.reduce((n, s) => n + s.items, 0);
  const failing = stateResults.filter((s) => !s.ok);
  const detail: JobDetail = {
    items,
    errors: failing.length,
    warnings: stateResults.flatMap((s) => s.warnings.map((w) => `${s.stateId}: ${w}`)),
    states: stateResults.map((s) => ({ stateId: s.stateId, items: s.items, ok: s.ok })),
  };
  if (adapters.length > 0 && failing.length === adapters.length) {
    handle.fail(new Error('all stocking adapters failed'), detail);
  } else {
    handle.ok(detail);
  }
  return { ...detail, items, ok: failing.length < adapters.length, states: stateResults };
}
