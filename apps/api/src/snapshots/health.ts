import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionSnapshotSchema, FishabilitySnapshotSchema } from '@trout/contracts';
import type { ConditionSnapshot } from '@trout/contracts';

/**
 * Feed-level health for the published conditions snapshot (C1 remediation,
 * 2026-09-07). The per-record `nextExpectedUpdate <= fetchedAt` stamp is the
 * builder's documented "gauges job unhealthy at build time" signal; combined
 * with catalog-wide zero observations it is exactly the shape production
 * served during the empty-feed incident. This module turns that signal into
 * something /healthz (and deploy verification) can act on instead of
 * reporting a green 200 while every water reads Unassessed.
 */

/** A feed older than this has missed its hourly cadence by a wide margin. */
const MAX_AGE_MINUTES = 360;

export interface ConditionsFeedVerdict {
  /** False when the feed file is absent or webPublicDir is not wired. */
  present: boolean;
  /** False only when the feed cannot serve current-conditions use. */
  healthy: boolean;
  reason: string | null;
  records: number;
  assessed: number;
  /** Builder distress signal: gauges job was unhealthy when this was built. */
  buildStale: boolean;
  fetchedAt: string | null;
  ageMinutes: number | null;
}

export function conditionsFeedHealth(
  webPublicDir: string | undefined,
  now = new Date(),
): ConditionsFeedVerdict {
  const base: ConditionsFeedVerdict = {
    present: false,
    healthy: true,
    reason: null,
    records: 0,
    assessed: 0,
    buildStale: false,
    fetchedAt: null,
    ageMinutes: null,
  };
  // Not wired (tests / portal-only builds): nothing to judge, stay neutral.
  if (!webPublicDir) return base;
  const file = join(webPublicDir, 'v1', 'conditions', 'latest.json');
  if (!existsSync(file)) {
    return { ...base, healthy: false, reason: 'conditions feed has not been generated' };
  }
  let rows: Array<{
    score?: { assessed?: boolean };
    fetchedAt?: string;
    nextExpectedUpdate?: string;
  }>;
  try {
    rows = JSON.parse(readFileSync(file, 'utf8')) as typeof rows;
  } catch {
    return { ...base, healthy: false, reason: 'conditions feed is not valid JSON' };
  }
  if (!Array.isArray(rows)) {
    return { ...base, healthy: false, reason: 'conditions feed is not an array' };
  }
  // T1-10: a row that does not satisfy the frozen ConditionSnapshot contract
  // (missing fields, invalid fetchedAt, garbage scores) is exactly the kind of
  // feed the app cannot honestly render. Previously `[{}]` or rows with
  // non-ISO timestamps passed as healthy because the checks below only looked
  // at fields they happened to read.
  const validRows: ConditionSnapshot[] = [];
  let malformed = 0;
  for (const row of rows) {
    const parsed = ConditionSnapshotSchema.safeParse(row);
    if (parsed.success) validRows.push(parsed.data);
    else malformed += 1;
  }
  const rowsForSignals = validRows;
  const fetchedAt = rowsForSignals.find((r) => r?.fetchedAt)?.fetchedAt ?? null;
  const nextExpectedUpdate = rowsForSignals.find((r) => r?.nextExpectedUpdate)?.nextExpectedUpdate ?? null;
  const ageMinutes = fetchedAt
    ? Math.max(0, Math.round((now.getTime() - Date.parse(fetchedAt)) / 60_000))
    : null;
  const buildStale =
    fetchedAt != null &&
    nextExpectedUpdate != null &&
    Date.parse(nextExpectedUpdate) <= Date.parse(fetchedAt);
  const assessed = validRows.filter((r) => r?.score?.assessed === true).length;
  const verdict: ConditionsFeedVerdict = {
    ...base,
    present: true,
    records: rows.length,
    assessed,
    buildStale,
    fetchedAt,
    ageMinutes,
  };
  if (rows.length === 0) {
    return { ...verdict, healthy: false, reason: 'conditions feed is empty' };
  }
  if (malformed > 0) {
    return {
      ...verdict,
      healthy: false,
      reason: `${malformed} of ${rows.length} conditions rows fail the ConditionSnapshot contract`,
    };
  }
  if (assessed === 0 && buildStale) {
    return {
      ...verdict,
      healthy: false,
      reason:
        'catalog-wide zero observations and the gauges job was unhealthy when the feed was built',
    };
  }
  if (ageMinutes != null && ageMinutes > MAX_AGE_MINUTES) {
    return {
      ...verdict,
      healthy: false,
      reason: `conditions feed is ${ageMinutes} minutes old (limit ${MAX_AGE_MINUTES})`,
    };
  }
  return verdict;
}

export interface FishabilityFeedVerdict {
  /** False when no fishability snapshots have ever been emitted (feature off — healthy). */
  present: boolean;
  /** False when emitted snapshots exist but any fails its contract. */
  healthy: boolean;
  reason: string | null;
  files: number;
}

/**
 * F5 malformation detector (contract v2, ADR 0007): every emitted
 * /v1/fishability/*.json must satisfy the frozen FishabilitySnapshotSchema.
 * A missing directory is the honest "no water is cataloged for scoring" state
 * — healthy. A directory that exists (emission ran) must contain only
 * contract-valid snapshots; any malformed file fails health, exactly the
 * T1-10 discipline the conditions feed follows.
 */
export function fishabilityFeedHealth(webPublicDir: string | undefined): FishabilityFeedVerdict {
  const base: FishabilityFeedVerdict = { present: false, healthy: true, reason: null, files: 0 };
  if (!webPublicDir) return base;
  const dir = join(webPublicDir, 'v1', 'fishability');
  if (!existsSync(dir)) return base;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    return { ...base, present: true, healthy: false, reason: 'fishability snapshot directory exists but is empty' };
  }
  let malformed = 0;
  for (const f of files) {
    let ok = false;
    try {
      ok = FishabilitySnapshotSchema.safeParse(JSON.parse(readFileSync(join(dir, f), 'utf8'))).success;
    } catch {
      ok = false;
    }
    if (!ok) malformed += 1;
  }
  const verdict: FishabilityFeedVerdict = { present: true, healthy: malformed === 0, reason: null, files: files.length };
  if (malformed > 0) {
    return {
      ...verdict,
      healthy: false,
      reason: `${malformed} of ${files.length} fishability snapshots fail the FishabilitySnapshot contract`,
    };
  }
  return verdict;
}
