import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { StockingEventSchema } from '@trout/contracts';
import type { StockingEvent } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import { getAdapters } from './stocking/index.js';
import type { FetchCtx, RawFetch, StateAdapter } from './stocking/types.js';

/** Adapters registered for ingestion are maintained in ./stocking/index.ts. */

/** Persist raw artifacts: {rawDir}/{stateId}/{YYYY-MM-DD}.{suffix} (audit trail, §8). */
export function saveRawArtifacts(rawDir: string, stateId: string, now: Date, raw: RawFetch): string[] {
  const date = now.toISOString().slice(0, 10);
  const dir = join(rawDir, stateId);
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const a of raw.artifacts) {
    const p = join(dir, `${date}.${a.suffix}`);
    writeFileSync(p, a.content, 'utf8');
    written.push(p);
  }
  return written;
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
