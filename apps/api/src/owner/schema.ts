import type { Db } from '../db.js';

/**
 * Owner dashboard shape + schedule constants (ADR 0017).
 *
 * The owner surface is a READ-ONLY publication-review view over data the
 * pipeline already produces: jobs_log, the snapshot files, the corrections
 * queue, and the content pack. It carries its OWN credential
 * (OWNER_DASHBOARD_TOKEN) — never the shop portal HMAC secret, never the
 * corrections moderator token, never WATCHDOG_TOKEN.
 */

/**
 * The cron schedule map, mirrored from src/cron.ts (the worker's schedule is
 * the source of truth; keep this table in sync when cron.ts changes — the
 * comment there documents the same five lines). `nextExpectedRun` on the
 * dashboard is derived from this table, so a job that misses its slot is
 * visible as a future timestamp that never arrives, and an expected job with
 * NO jobs_log row at all is flagged `neverRun` (the F05 discipline).
 *
 * Times are host-local because node-cron schedules without an explicit
 * timezone option; derivation uses the server's local clock to match.
 */
export interface OwnerJobScheduleSpec {
  /** The cron expression in src/cron.ts (documentation, not re-parsed). */
  cron: string;
  kind: 'hourly' | 'daily' | 'interval';
  intervalMinutes?: number;
  /** hourly: the minute of the hour the job fires at. */
  minute?: number;
  /** daily: local hour + minute the job fires at. */
  hour?: number;
}

export const OWNER_JOB_SCHEDULE: Record<string, OwnerJobScheduleSpec> = {
  gauges: { cron: '5 * * * *', kind: 'hourly', minute: 5 },
  pressure: { cron: '35 * * * *', kind: 'hourly', minute: 35 },
  stocking: { cron: '0 6 * * *', kind: 'daily', hour: 6, minute: 0 },
  evidence: { cron: '20 6 * * *', kind: 'daily', hour: 6, minute: 20 },
  snapshots: { cron: '30 4 * * *', kind: 'daily', hour: 4, minute: 30 },
  watchlists: { cron: '*/15 * * * *', kind: 'interval', intervalMinutes: 15 },
};

/** Windows hourly tasks anchor at installation time, not at cron's :05/:35. */
export const OWNER_WINDOWS_JOB_SCHEDULE: Record<string, OwnerJobScheduleSpec> = {
  gauges: { cron: 'schtasks hourly', kind: 'interval', intervalMinutes: 60 },
  pressure: { cron: 'schtasks hourly', kind: 'interval', intervalMinutes: 60 },
  snapshots: { cron: 'schtasks hourly', kind: 'interval', intervalMinutes: 60 },
  stocking: { cron: 'schtasks daily 06:00', kind: 'daily', hour: 6 },
  evidence: { cron: 'schtasks daily 06:00', kind: 'daily', hour: 6 },
  watchlists: { cron: 'schtasks every 15 min', kind: 'interval', intervalMinutes: 15 },
};
export type SchedulerProfile = 'windows' | 'cron' | 'unknown';

/**
 * Enumerated job outcomes (sanitization floor, ADR 0017 §4): jobs_log.status
 * is mapped onto exactly these values and the free-form `detail` JSON (which
 * can embed raw upstream error text) NEVER leaves the process.
 */
export const OWNER_JOB_OUTCOMES = ['ok', 'error', 'running', 'unknown'] as const;
export type OwnerJobOutcome = (typeof OWNER_JOB_OUTCOMES)[number];

/**
 * Job names are code-written, but the dashboard still treats them as input:
 * only names matching this strict charset ever reach the payload. Anything
 * else is counted in `omittedJobNames` instead of echoed.
 */
export const OWNER_JOB_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/;

/** Corrections statuses, in the order the dashboard shows them. */
export const OWNER_CORRECTION_STATUSES = [
  'received',
  'needs-more-evidence',
  'accepted',
  'rejected',
  'resolved',
] as const;

/**
 * Evidence states that put a water on the editorial research queue
 * (ADR 0010): conflicting/unresolved/historical are exactly the
 * "someone should pull sources" states; documented/limited are not.
 */
export const RESEARCH_EVIDENCE_STATES = ['conflicting', 'unresolved', 'historical'] as const;

/** Hard cap on research-queue rows in one payload (bounded response). */
export const RESEARCH_QUEUE_LIMIT = 200;

export interface OwnerJobRow {
  name: string;
  /** True when the job is in OWNER_JOB_SCHEDULE (a job the worker should run). */
  expected: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastOutcome: OwnerJobOutcome;
  runsLast24h: number;
  /** Derived from OWNER_JOB_SCHEDULE; null for never-run or non-scheduled jobs. */
  nextExpectedRun: string | null;
  /** Expected job with no jobs_log row at all (F05: silence is a finding). */
  neverRun: boolean;
}

export interface OwnerFeedVerdict {
  area: 'conditions' | 'fishability';
  /** False when the feed has never been generated (or dir not wired). */
  present: boolean;
  healthy: boolean;
  reason: string | null;
  /** File mtime of the snapshot backing the verdict (build freshness signal). */
  fileMtime: string | null;
  ageMinutes: number | null;
  extra: Record<string, unknown>;
}

export interface OwnerDashboard {
  generatedAt: string;
  jobs: OwnerJobRow[];
  /** Count of jobs_log names dropped by the name sanitizer (never their names). */
  omittedJobNames: number;
  feeds: OwnerFeedVerdict[];
  snapshotFreshness: { latestFileTimes: Record<string, string> };
  counts: {
    correctionsByStatus: Record<string, number>;
    correctionsOpen: number;
    /** null = table not present yet (migration 021 pending) — never an error. */
    watchRules: number | null;
    pushSubscriptions: number | null;
  };
  /** Omitted entirely when no contentDir is wired — the endpoint never fails. */
  unresolvedEvidence?: {
    byState: Record<string, number>;
    researchCount: number;
    waters: Array<{
      id: string;
      name: string;
      regionId: string;
      evidenceState: string;
      headline: string | null;
      asOf: string | null;
    }>;
  };
}

export interface OwnerCorrectionSummary {
  id: number;
  status: string;
  category: string;
  waterId: string;
  waterName: string | null;
  field: string | null;
  proposedCorrection: string;
  riskFlags: string[];
  receivedAt: string;
  updatedAt: string;
}

export interface OwnerResearchItem {
  id: string;
  name: string;
  regionId: string;
  evidenceState: string;
  headline: string | null;
  asOf: string | null;
  unresolvedQuestion: string | null;
  /** Absence heuristics over the authored record (ADR 0017): which claim
   *  areas have NO evidence recorded at all. Editorial aid, not a verdict. */
  claimsNeedingEvidence: string[];
}

export interface OwnerDeps {
  db: Db;
  /** Snapshot root (TROUT_SNAPSHOTS_DIR / webPublicDir) for feed health + mtimes. */
  snapshotsDir?: string;
  /** Directory containing the content pack streams.json (content-pack dir). */
  contentDir?: string;
  /**
   * OWNER_DASHBOARD_TOKEN — the owner surface's own shared secret. When unset
   * the factory registers NOTHING (fail-closed by absence, like PORTAL_SECRET
   * for the portal write routes). Must never equal any other credential.
   */
  ownerToken?: string;
  schedulerProfile?: SchedulerProfile;
  watchlistsEnabled?: boolean;
  /** Test seam for the rate limiter. */
  limits?: Partial<OwnerRateLimits>;
  /** Test seam: injectable clock for the rate limiter + derived timestamps. */
  now?: () => number;
}

export interface OwnerRateLimits {
  requestsPerHour: number;
  requestsPerDay: number;
}

export const OWNER_DEFAULT_LIMITS: OwnerRateLimits = {
  requestsPerHour: 60,
  requestsPerDay: 240,
};
