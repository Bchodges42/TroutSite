import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from '../db.js';
import { conditionsFeedHealth, fishabilityFeedHealth } from '../snapshots/health.js';
import { latestJobRuns } from '../jobs/run.js';
import { listCorrectionsForReview, OPEN_STATUSES, type CorrectionRow } from '../corrections/service.js';
import {
  OWNER_JOB_OUTCOMES,
  OWNER_JOB_NAME_RE,
  OWNER_JOB_SCHEDULE,
  OWNER_CORRECTION_STATUSES,
  RESEARCH_EVIDENCE_STATES,
  RESEARCH_QUEUE_LIMIT,
  type OwnerCorrectionSummary,
  type OwnerDashboard,
  type OwnerFeedVerdict,
  type OwnerJobOutcome,
  type OwnerJobRow,
  type OwnerResearchItem,
} from './schema.js';

/**
 * Read-only data assembly for the owner dashboard (ADR 0017). Pure data access
 * — no Fastify types here. EVERY reader is tolerant: a missing table, a missing
 * snapshot file, or a malformed content pack degrades that one section (or
 * omits it); it never fails the endpoint.
 */

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Map a free-form jobs_log.status onto the enumerated outcome vocabulary. */
function outcomeOf(status: string): OwnerJobOutcome {
  return (OWNER_JOB_OUTCOMES as readonly string[]).includes(status)
    ? (status as OwnerJobOutcome)
    : 'unknown';
}

/**
 * Next scheduled fire after `fromMs`, derived from OWNER_JOB_SCHEDULE (which
 * mirrors src/cron.ts). Host-local clock on purpose — node-cron schedules in
 * server-local time. Best-effort editorial estimate, not a contract.
 */
export function nextExpectedRunIso(job: string, fromMs: number | null): string | null {
  const spec = OWNER_JOB_SCHEDULE[job];
  if (!spec || fromMs === null || !Number.isFinite(fromMs)) return null;
  const next = new Date(fromMs);
  if (spec.kind === 'hourly') {
    next.setMinutes(spec.minute ?? 0, 0, 0);
    if (next.getTime() <= fromMs) next.setTime(next.getTime() + HOUR_MS);
  } else {
    next.setHours(spec.hour ?? 0, spec.minute ?? 0, 0, 0);
    if (next.getTime() <= fromMs) next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

/** ISO mtime of a file, or null when it does not exist (never throws). */
function mtimeIso(path: string): string | null {
  try {
    return existsSync(path) ? statSync(path).mtime.toISOString() : null;
  } catch {
    return null;
  }
}

/** Newest .json mtime inside a directory, or null (never throws). */
function newestJsonMtime(dir: string): string | null {
  try {
    if (!existsSync(dir)) return null;
    let newest: number | null = null;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const m = statSync(join(dir, f)).mtimeMs;
      if (newest === null || m > newest) newest = m;
    }
    return newest === null ? null : new Date(newest).toISOString();
  } catch {
    return null;
  }
}

/**
 * Per-job observability rows for the dashboard: the union of the schedule map
 * (expected jobs — silence is a finding, F05) and the sanitized jobs_log
 * names. Detail JSON from jobs_log NEVER leaves the process (it can embed raw
 * upstream error text — ADR 0017 §4).
 */
export function ownerJobRows(db: Db, now: Date): { jobs: OwnerJobRow[]; omittedJobNames: number } {
  const latest = latestJobRuns(db); // existing service — same source /healthz uses

  interface Aggregate {
    last_attempt: string | null;
    last_success: string | null;
    runs_24h: number;
  }
  const aggregates = new Map<string, Aggregate>();
  for (
    const row of db
      .prepare(
        `SELECT job,
                MAX(started_at) AS last_attempt,
                MAX(CASE WHEN status = 'ok' THEN COALESCE(finished_at, started_at) END) AS last_success,
                SUM(CASE WHEN started_at >= ? THEN 1 ELSE 0 END) AS runs_24h
         FROM jobs_log GROUP BY job`,
      )
      .all(new Date(now.getTime() - DAY_MS).toISOString()) as Array<Aggregate & { job: string }>
  ) {
    aggregates.set(row.job, row);
  }

  const jobs: OwnerJobRow[] = [];
  let omitted = 0;
  const names = new Set<string>([...Object.keys(OWNER_JOB_SCHEDULE), ...Object.keys(latest)]);
  for (const name of names) {
    if (!OWNER_JOB_NAME_RE.test(name)) {
      omitted += 1;
      continue;
    }
    const expected = OWNER_JOB_SCHEDULE[name] !== undefined;
    const agg = aggregates.get(name);
    const run = latest[name];
    const lastAttemptAt = agg?.last_attempt ?? run?.startedAt ?? null;
    const lastSuccessAt = agg?.last_success ?? null;
    const baseMs =
      lastAttemptAt !== null && Number.isFinite(Date.parse(lastAttemptAt))
        ? Date.parse(lastAttemptAt)
        : null;
    jobs.push({
      name,
      expected,
      lastAttemptAt,
      lastSuccessAt,
      lastOutcome: outcomeOf(run?.status ?? ''),
      runsLast24h: agg?.runs_24h ?? 0,
      nextExpectedRun: expected ? nextExpectedRunIso(name, baseMs) : null,
      neverRun: expected && run === undefined,
    });
  }
  // Expected jobs first (the operator's primary scan), then alphabetical.
  jobs.sort((a, b) =>
    a.expected === b.expected ? a.name.localeCompare(b.name) : a.expected ? -1 : 1,
  );
  return { jobs, omittedJobNames: omitted };
}

/** Feed health cards via the EXISTING health.ts verdicts + file mtimes. */
export function ownerFeedVerdicts(snapshotsDir: string | undefined, now: Date): OwnerFeedVerdict[] {
  const verdicts: OwnerFeedVerdict[] = [];
  const conditions = conditionsFeedHealth(snapshotsDir, now);
  verdicts.push({
    area: 'conditions',
    present: conditions.present,
    healthy: conditions.healthy,
    reason: conditions.reason,
    fileMtime: snapshotsDir ? mtimeIso(join(snapshotsDir, 'v1', 'conditions', 'latest.json')) : null,
    ageMinutes: conditions.ageMinutes,
    extra: {
      records: conditions.records,
      assessed: conditions.assessed,
      buildStale: conditions.buildStale,
      fetchedAt: conditions.fetchedAt,
    },
  });
  const fishability = fishabilityFeedHealth(snapshotsDir);
  verdicts.push({
    area: 'fishability',
    present: fishability.present,
    healthy: fishability.healthy,
    reason: fishability.reason,
    fileMtime: snapshotsDir ? newestJsonMtime(join(snapshotsDir, 'v1', 'fishability')) : null,
    ageMinutes: null,
    extra: { files: fishability.files },
  });
  return verdicts;
}

/** Known snapshot areas + their latest file times (only existing files listed). */
export function snapshotFreshness(snapshotsDir: string | undefined): {
  latestFileTimes: Record<string, string>;
} {
  const latest: Record<string, string> = {};
  if (!snapshotsDir) return { latestFileTimes: latest };
  const areas: Array<[string, string]> = [
    ['conditions', join(snapshotsDir, 'v1', 'conditions', 'latest.json')],
    ['fishability', join(snapshotsDir, 'v1', 'fishability')],
    ['streams', join(snapshotsDir, 'v1', 'streams.json')],
    ['reportsRecent', join(snapshotsDir, 'v1', 'reports', 'recent.json')],
    ['contentPackStreams', join(snapshotsDir, 'content-pack', 'streams.json')],
  ];
  for (const [area, path] of areas) {
    const isDir = area === 'fishability';
    const mtime = isDir ? newestJsonMtime(path) : mtimeIso(path);
    if (mtime) latest[area] = mtime;
  }
  return { latestFileTimes: latest };
}

/** True when a table exists (migration 021's watch/push tables are OPTIONAL). */
function tableExists(db: Db, nameRe: RegExp): string | null {
  try {
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const match = rows.map((r) => r.name).find((n) => nameRe.test(n));
    return match ?? null;
  } catch {
    return null;
  }
}

function countRows(db: Db, table: string): number | null {
  try {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get() as { n: number };
    return row.n;
  } catch {
    return null;
  }
}

/**
 * Queue counts. Corrections counts through the canonical status vocabulary;
 * the watch/push counts are tolerant of migration 021 not having run yet —
 * a missing table yields null ("not present"), never an error.
 */
export function ownerCounts(db: Db): OwnerDashboard['counts'] {
  const byStatus: Record<string, number> = {};
  for (const status of OWNER_CORRECTION_STATUSES) byStatus[status] = 0;
  let open = 0;
  try {
    const rows = db
      .prepare('SELECT status, COUNT(*) AS n FROM corrections GROUP BY status')
      .all() as Array<{ status: string; n: number }>;
    for (const row of rows) {
      if ((OWNER_CORRECTION_STATUSES as readonly string[]).includes(row.status)) {
        byStatus[row.status] = row.n;
      } else {
        byStatus[row.status.slice(0, 40)] = row.n; // CHECK-constrained today; never echo raw junk
      }
      if ((OPEN_STATUSES as readonly string[]).includes(row.status)) open += row.n;
    }
  } catch {
    // corrections table missing → zeros; the rest of the dashboard still answers
  }
  const watchTable = tableExists(db, /^watch/);
  const pushTable = tableExists(db, /push_subscription/);
  return {
    correctionsByStatus: byStatus,
    correctionsOpen: open,
    watchRules: watchTable ? countRows(db, watchTable) : null,
    pushSubscriptions: pushTable ? countRows(db, pushTable) : null,
  };
}

/** Minimal structural read of one content-pack stream record (no zod — tolerance first). */
interface PackStream {
  id: string;
  name: string;
  regionId: string;
  evidenceState?: string;
  headline?: string;
  asOf?: string;
  unresolvedQuestion?: string;
  targetSpecies?: unknown;
  seasonMonths?: unknown;
  seasonKind?: unknown;
  officialSources?: unknown;
  notes?: unknown;
}

function asPackStream(raw: unknown): PackStream | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== 'string' || s.id.length === 0) return null;
  return {
    id: s.id.slice(0, 128),
    name: typeof s.name === 'string' ? s.name.slice(0, 200) : s.id.slice(0, 128),
    regionId: typeof s.regionId === 'string' ? s.regionId.slice(0, 80) : '',
    evidenceState: typeof s.opportunity === 'object' && s.opportunity !== null
      ? (s.opportunity as Record<string, unknown>).evidenceState as string | undefined
      : undefined,
    headline: typeof s.opportunity === 'object' && s.opportunity !== null
      ? ((s.opportunity as Record<string, unknown>).trout as string | undefined)
      : undefined,
    asOf: typeof s.opportunity === 'object' && s.opportunity !== null
      ? ((s.opportunity as Record<string, unknown>).asOf as string | undefined)
      : undefined,
    unresolvedQuestion: typeof s.opportunity === 'object' && s.opportunity !== null
      ? ((s.opportunity as Record<string, unknown>).unresolvedQuestion as string | undefined)
      : undefined,
    targetSpecies: s.targetSpecies,
    seasonMonths: s.seasonMonths,
    seasonKind: s.seasonKind,
    officialSources: s.officialSources,
    notes: s.notes,
  };
}

function readPackStreams(contentDir: string | undefined): PackStream[] | null {
  if (!contentDir) return null;
  try {
    const file = join(contentDir, 'streams.json');
    if (!existsSync(file)) return null;
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed !== null &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as { streams?: unknown }).streams)
        ? ((parsed as { streams: unknown[] }).streams)
        : null;
    if (!list) return null;
    return list.map(asPackStream).filter((s): s is PackStream => s !== null);
  } catch {
    return null;
  }
}

/** `officialSources` label/url text matching a claim keyword (tolerant read). */
function sourceTextMentions(s: PackStream, re: RegExp): boolean {
  if (!Array.isArray(s.officialSources)) return false;
  return s.officialSources.some((entry) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const e = entry as Record<string, unknown>;
    return re.test(typeof e.label === 'string' ? e.label : '') || re.test(typeof e.url === 'string' ? e.url : '');
  });
}

/**
 * Which claim areas have NO authored evidence at all on the record
 * (species / season / access / regulations buckets). These are ABSENCE
 * heuristics over the content pack — an editorial pointer for where to pull
 * sources first, never a claim that evidence does not exist in the world.
 */
export function claimsNeedingEvidence(s: PackStream): string[] {
  const claims: string[] = [];
  if (!Array.isArray(s.targetSpecies) || s.targetSpecies.length === 0) claims.push('species');
  if (!Array.isArray(s.seasonMonths) || s.seasonMonths.length === 0 || typeof s.seasonKind !== 'string') {
    claims.push('season');
  }
  if (!sourceTextMentions(s, /regulation/i)) claims.push('regulations');
  const notesText = typeof s.notes === 'string' ? s.notes : '';
  if (!sourceTextMentions(s, /access|ramp|put-in/i) && !/\baccess\b|ramp|put-in/i.test(notesText)) {
    claims.push('access');
  }
  return claims;
}

export interface ResearchQueue {
  total: number;
  truncated: boolean;
  queue: OwnerResearchItem[];
}

/**
 * The editorial research queue: waters whose opportunity block sits in
 * conflicting | unresolved | historical (ADR 0010 states), data-driven from
 * the content pack. A missing/absent opportunity block is treated exactly
 * like 'unresolved' for COUNTING (that is the contract's own rule) but the
 * queue lists only waters WITH an explicit research-state block.
 */
export function ownerResearchQueue(
  contentDir: string | undefined,
  states: readonly string[] = RESEARCH_EVIDENCE_STATES,
): ResearchQueue | null {
  const streams = readPackStreams(contentDir);
  if (streams === null) return null;
  const byState: Record<string, number> = {};
  const queue: OwnerResearchItem[] = [];
  let researchCount = 0;
  for (const s of streams) {
    const state = s.evidenceState ?? 'unresolved'; // absent block = unadjudicated = unresolved
    byState[state] = (byState[state] ?? 0) + 1;
    if (!states.includes(state)) continue;
    researchCount += 1;
    if (queue.length >= RESEARCH_QUEUE_LIMIT) continue;
    queue.push({
      id: s.id,
      name: s.name,
      regionId: s.regionId,
      evidenceState: state,
      headline: s.headline ?? null,
      asOf: s.asOf ?? null,
      unresolvedQuestion: s.unresolvedQuestion ? s.unresolvedQuestion.slice(0, 300) : null,
      claimsNeedingEvidence: claimsNeedingEvidence(s),
    });
  }
  return { total: researchCount, truncated: researchCount > queue.length, queue };
}

/** Waters-by-evidence-state summary for the dashboard (omitted when no pack). */
export function ownerEvidenceSummary(
  contentDir: string | undefined,
): OwnerDashboard['unresolvedEvidence'] {
  const streams = readPackStreams(contentDir);
  if (streams === null) return undefined;
  const byState: Record<string, number> = {};
  const researchWaters: NonNullable<OwnerDashboard['unresolvedEvidence']>['waters'] = [];
  for (const s of streams) {
    const state = s.evidenceState ?? 'unresolved';
    byState[state] = (byState[state] ?? 0) + 1;
    if (RESEARCH_EVIDENCE_STATES.includes(state as (typeof RESEARCH_EVIDENCE_STATES)[number])) {
      if (researchWaters.length < RESEARCH_QUEUE_LIMIT) {
        researchWaters.push({
          id: s.id,
          name: s.name,
          regionId: s.regionId,
          evidenceState: state,
          headline: s.headline ?? null,
          asOf: s.asOf ?? null,
        });
      }
    }
  }
  return { byState, researchCount: researchWaters.length, waters: researchWaters };
}

/** Summary shape for the owner's corrections table (no receipt material at all). */
function toCorrectionSummary(row: CorrectionRow): OwnerCorrectionSummary {
  return {
    id: row.id,
    status: row.status,
    category: row.category,
    waterId: row.water_id,
    waterName: row.water_name,
    field: row.field,
    proposedCorrection: row.proposed_correction,
    riskFlags: row.risk_flags ? row.risk_flags.split(',').filter(Boolean) : [],
    receivedAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Owner corrections SUMMARY — reuses the corrections SERVICE query
 * (listCorrectionsForReview) so there is exactly one SQL definition; the
 * moderator route's auth stays independent (ADR 0017: the owner token grants
 * read visibility, never moderator powers, and this pass adds no powers at
 * all — the owner lane is GET-only).
 */
export function ownerCorrectionsSummary(
  db: Db,
  filters: { status?: string; limit?: number } = {},
): OwnerCorrectionSummary[] {
  return listCorrectionsForReview(db, {
    status: filters.status,
    limit: Math.min(filters.limit ?? 100, 200),
  }).map(toCorrectionSummary);
}

/** Assemble the full dashboard payload (all sections individually tolerant). */
export function ownerDashboard(
  db: Db,
  opts: { snapshotsDir?: string; contentDir?: string; now?: Date } = {},
): OwnerDashboard {
  const now = opts.now ?? new Date();
  const { jobs, omittedJobNames } = ownerJobRows(db, now);
  const dashboard: OwnerDashboard = {
    generatedAt: now.toISOString(),
    jobs,
    omittedJobNames,
    feeds: ownerFeedVerdicts(opts.snapshotsDir, now),
    snapshotFreshness: snapshotFreshness(opts.snapshotsDir),
    counts: ownerCounts(db),
  };
  const evidence = ownerEvidenceSummary(opts.contentDir);
  if (evidence) dashboard.unresolvedEvidence = evidence;
  return dashboard;
}

export { HOUR_MS, DAY_MS };
