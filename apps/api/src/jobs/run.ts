import type { Db } from '../db.js';

export interface JobDetail {
  items?: number;
  errors?: number;
  warnings?: string[];
  [key: string]: unknown;
}

export interface JobHandle {
  /** Record success and close the row. */
  ok(detail?: JobDetail): void;
  /** Record a failure and close the row. Soft-fail callers still call ok() with errors>0
   *  when the pipeline survived; fail(err) is for crashes/aborts. */
  fail(err: unknown, detail?: JobDetail): void;
}

/**
 * jobs_log is the ingestion observability surface (non-negotiable #5): every run gets
 * one row with started/finished timestamps and a JSON detail blob (items/errors/warnings).
 */
export function startJob(db: Db, job: string): JobHandle {
  const startedAt = new Date().toISOString();
  const res = db
    .prepare('INSERT INTO jobs_log (job, status, started_at) VALUES (?, ?, ?)')
    .run(job, 'running', startedAt);
  const rowId = Number(res.lastInsertRowid);

  const finish = (status: string, detail: JobDetail | undefined, finishedAt: string): void => {
    db.prepare('UPDATE jobs_log SET status = ?, finished_at = ?, detail = ? WHERE id = ?').run(
      status,
      finishedAt,
      detail === undefined ? null : JSON.stringify(detail),
      rowId,
    );
  };

  return {
    ok(detail) {
      finish('ok', detail, new Date().toISOString());
    },
    fail(err, detail) {
      const message = err instanceof Error ? err.message : String(err);
      finish('error', { ...(detail ?? {}), error: message }, new Date().toISOString());
    },
  };
}

export interface JobRunSummary {
  job: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  detail: JobDetail | null;
}

/** Latest row per job name — backs the /healthz job health summary. */
export function latestJobRuns(db: Db): Record<string, JobRunSummary> {
  const rows = db
    .prepare(
      `SELECT job, status, started_at, finished_at, detail
       FROM jobs_log
       WHERE id IN (SELECT MAX(id) FROM jobs_log GROUP BY job)`,
    )
    .all() as { job: string; status: string; started_at: string; finished_at: string | null; detail: string | null }[];
  const out: Record<string, JobRunSummary> = {};
  for (const r of rows) {
    let detail: JobDetail | null = null;
    if (r.detail) {
      try {
        detail = JSON.parse(r.detail) as JobDetail;
      } catch {
        detail = null;
      }
    }
    out[r.job] = {
      job: r.job,
      status: r.status,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      detail,
    };
  }
  return out;
}

/** True when the newest run of `job` is a healthy ok (used for the snapshot stale flag). */
export function jobHealthy(db: Db, job: string): boolean {
  const row = db
    .prepare('SELECT status FROM jobs_log WHERE job = ? ORDER BY id DESC LIMIT 1')
    .get(job) as { status: string } | undefined;
  return row?.status === 'ok';
}
