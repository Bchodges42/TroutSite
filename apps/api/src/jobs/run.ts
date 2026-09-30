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

/** A finished hourly-pipeline job older than this missed ~24 hourly cadences. */
export const HOURLY_PIPELINE_MAX_AGE_HOURS = 24;
/** A 'running' row older than this is a stuck run, not a live one. */
const STUCK_RUN_HOURS = 1;

/**
 * Scheduler expectations (F05): every job the schedule SHOULD run, with its
 * staleness budget. Hourly pipeline jobs get 24 h (missed ~24 cadences);
 * the daily stocking/evidence feeds get 48 h (two missed dailies). This is
 * what makes a MISSING feed visible: production Windows ran the hourly
 * seed→gauges→snapshots loop for months with stocking/evidence/pressure
 * never scheduled at all, and health stayed green because only jobs with a
 * jobs_log row were ever inspected.
 */
export interface ExpectedJobSpec {
  /** A finished run older than this — or the total absence of runs while the
   *  pipeline demonstrably runs — degrades /healthz. */
  staleAfterHours: number;
  /** Human label for the degraded reason. */
  label: string;
}
export const EXPECTED_JOBS: Record<string, ExpectedJobSpec> = {
  gauges: { staleAfterHours: 24, label: 'hourly pipeline' },
  pressure: { staleAfterHours: 24, label: 'hourly pipeline' },
  snapshots: { staleAfterHours: HOURLY_PIPELINE_MAX_AGE_HOURS, label: 'hourly pipeline' },
  stocking: { staleAfterHours: 48, label: 'daily feeds' },
  evidence: { staleAfterHours: 48, label: 'daily feeds' },
};

/**
 * Pipeline-health reasons for /healthz `degraded` (2026-09-16 skew retro).
 *
 * `ok` gates the read path: what visitors see RIGHT NOW (conditions + fishability
 * verdicts). It deliberately ignores jobs_log — during the 2026-09-06..16 skew
 * every visitor saw good (stale) data while the snapshots job errored hourly,
 * and /healthz answered ok:true with the error buried in `jobs` where nothing
 * read it. `degraded` is the additive surface for exactly that: an errored job,
 * a stuck run, an hourly-pipeline job gone quiet — or (F05) an expected job
 * with NO run at all — without flipping ok (a stale-but-serving site is not
 * down, so verify-site/deploy/watchdog keep acting on ok alone).
 */
export function jobDegradation(jobs: Record<string, JobRunSummary>, now = new Date()): string[] {
  const reasons: string[] = [];
  for (const job of Object.values(jobs)) {
    if (job.status === 'error') {
      const err = job.detail && typeof job.detail.error === 'string' ? `: ${job.detail.error}` : '';
      reasons.push(`${job.job}: last run errored${err}`);
      continue;
    }
    const spec = EXPECTED_JOBS[job.job];
    if (!spec) continue;
    if (job.status === 'running') {
      const hours = (now.getTime() - Date.parse(job.startedAt)) / 3_600_000;
      if (Number.isFinite(hours) && hours > STUCK_RUN_HOURS) {
        reasons.push(`${job.job}: running for ${Math.floor(hours)}h (stuck run?)`);
      }
      continue;
    }
    if (job.status === 'ok' && job.finishedAt) {
      const hours = (now.getTime() - Date.parse(job.finishedAt)) / 3_600_000;
      if (Number.isFinite(hours) && hours > spec.staleAfterHours) {
        reasons.push(
          `${job.job}: finished ${Math.floor(hours)}h ago (${spec.label} expected <${spec.staleAfterHours}h)`,
        );
      }
    }
  }
  // F05: never-run expected jobs. Only reported once this host demonstrably
  // runs the pipeline (some expected job has a row) — a bare/portal-only DB
  // with an empty jobs_log has nothing to compare against and stays silent.
  const anyPipelineRun = Object.values(jobs).some((j) => EXPECTED_JOBS[j.job] !== undefined);
  if (anyPipelineRun) {
    for (const [name, spec] of Object.entries(EXPECTED_JOBS)) {
      if (!jobs[name]) {
        reasons.push(`${name}: no run ever recorded (expected ${spec.label})`);
      }
    }
  }
  return reasons.sort();
}
