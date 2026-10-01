import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { Db } from '../db.js';
import { READING_STALE_MINUTES, matchStocking, StockingEventSchema, type StockingEvent } from '@trout/contracts';
import type { WatchRuleRow } from './service.js';
import type { WatchKind, WatchMetric } from './schema.js';

/**
 * The watchlist evaluation engine (ADR 0016 §5) — PURE. No clock, no I/O: the
 * caller passes `now`, the rules, and an EvidenceView built from the SAME
 * snapshot files the web reads (v1/conditions/latest.json,
 * v1/stocking/TN-recent.json, v1/reports/recent.json). The engine never hits
 * upstream providers, never touches the DB mid-run, and returns a decisions
 * array so every transition is testable and traceable.
 *
 * A rule fires only when ALL of these hold:
 *   1. evidence exists for its kind (a condition rule with no reading, or a
 *      stale one, NEVER fires — a source outage must not invent a fishing
 *      condition; outage notices are deliberately NOT in v1);
 *   2. the water is outside quiet hours (the WATER's local time — all v1
 *      waters are Tennessee, so the zone is America/Chicago statewide);
 *   3. the rule's cooldown has elapsed;
 *   4. a MEANINGFUL transition happened: for condition rules, the reading
 *      crossed the threshold through the full hysteresis dead band, in the
 *      direction opposite to the last armed side; for stocking/report rules, a
 *      feed row newer than the rule's last notice (or its creation).
 */

/** Fresh-evidence window for condition rules — the contracts stale horizon. */
export const READING_FRESHNESS_MS = READING_STALE_MINUTES * 60_000;

/** All cataloged v1 waters are in Tennessee; the water's local zone is fixed. */
export const WATER_TIME_ZONE = 'America/Chicago';

/** Notices for one subscription above this count collapse into one digest. */
export const DIGEST_THRESHOLD = 3;

export interface ConditionObservation {
  value: number;
  /** Epoch ms of the METRIC'S OWN observation (per-metric time when present). */
  observedAt: number;
}

export interface FeedItem {
  /** Stocking: ISO day. Report: ISO day too (ShopReport.date). */
  date: string;
  /** Reports: exact publish instant (ShopReport.publishedAt); stockings omit. */
  publishedAt?: string;
  key?: string;
}

/**
 * What the evaluator may know about the world. Lookups are keyed by catalog
 * water id; a miss means "no evidence" (never "zero").
 */
export interface EvidenceView {
  condition: (waterId: string, metric: WatchMetric) => ConditionObservation | null;
  stocking: (waterId: string) => FeedItem | null;
  report: (waterId: string) => FeedItem | null;
}

export type DecisionReason =
  // condition rules
  | 'no-evidence'
  | 'stale-evidence'
  | 'quiet-hours'
  | 'cooldown'
  | 'armed' // first decisive reading: baseline set, nothing fired
  | 'waiting-dead-band' // reading inside the hysteresis band
  | 'no-change' // decisive reading but on the already-armed side
  | 'rearmed'
  | 'crossed-above'
  | 'crossed-below'
  // stocking/report rules
  | 'no-new-feed-item'
  | 'new-stocking-event'
  | 'new-report';

export interface Decision {
  ruleId: number;
  subscriptionId: string;
  waterId: string;
  kind: WatchKind;
  fired: boolean;
  reason: DecisionReason;
  /** The arm_state the caller should persist (condition rules only). */
  armState?: 'above' | 'below' | null;
  /** For fired feed rules: the day that triggered the notice. */
  feedDate?: string;
  feedKey?: string;
}

export interface EvaluateOptions {
  now: number;
  /** Injectable water-local clock "HH:MM" (tests); default America/Chicago. */
  localHHMM?: (nowMs: number, timeZone?: string) => string;
}

/** Hysteresis side of a reading, or null inside the dead band. */
function sideOf(value: number, threshold: number, hysteresis: number): 'above' | 'below' | null {
  if (value > threshold + hysteresis) return 'above';
  if (value < threshold - hysteresis) return 'below';
  return null;
}

function parseHHMM(v: string): number {
  const [h, m] = v.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * Quiet-window test. Window may wrap midnight (start > end). start === end is
 * the degenerate window — treated as a full-day quiet (the only safe reading
 * of "same minute start and end").
 */
export function inQuietHours(hhmm: string, start: string, end: string): boolean {
  const t = parseHHMM(hhmm);
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  if (s === e) return true;
  if (s < e) return t >= s && t < e;
  return t >= s || t < e;
}

/** Default water-local wall clock (America/Chicago), "HH:MM" 24-hour. */
export function waterLocalHHMM(nowMs: number, timeZone: string = WATER_TIME_ZONE): string {
  // hour12:false + hourCycle h23 keeps midnight at "00".
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(nowMs));
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function evaluateRules(
  rules: WatchRuleRow[],
  evidence: EvidenceView,
  opts: EvaluateOptions,
): Decision[] {
  const localHHMM = opts.localHHMM ?? waterLocalHHMM;
  const now = opts.now;
  const decisions: Decision[] = [];

  for (const rule of rules) {
    const base: Decision = {
      ruleId: rule.id,
      subscriptionId: rule.subscription_id,
      waterId: rule.water_id,
      kind: rule.kind,
      fired: false,
      reason: 'no-evidence',
    };

    // ── 1. evidence gate (kind-specific) ──────────────────────────────────
    if (rule.kind === 'condition') {
      const obs =
        rule.metric && rule.threshold !== null
          ? evidence.condition(rule.water_id, rule.metric)
          : null;
      if (!obs) {
        decisions.push({ ...base, reason: 'no-evidence' });
        continue;
      }
      if (!Number.isFinite(obs.value) || !Number.isFinite(obs.observedAt)
        || obs.observedAt > now + 60_000 || now - obs.observedAt > READING_FRESHNESS_MS) {
        decisions.push({ ...base, reason: 'stale-evidence' });
        continue;
      }

      // ── 2. quiet hours (water-local) ────────────────────────────────────
      if (
        rule.quiet_hours_start &&
        rule.quiet_hours_end &&
        inQuietHours(localHHMM(now, rule.quiet_time_zone ?? WATER_TIME_ZONE), rule.quiet_hours_start, rule.quiet_hours_end)
      ) {
        decisions.push({ ...base, reason: 'quiet-hours' });
        continue;
      }

      // ── 3. cooldown ─────────────────────────────────────────────────────
      if (
        rule.last_notified_at &&
        now - Date.parse(rule.last_notified_at) < rule.cooldown_minutes * 60_000
      ) {
        decisions.push({ ...base, reason: 'cooldown' });
        continue;
      }

      // ── 4. meaningful transition through the dead band ─────────────────
      const side = sideOf(obs.value, rule.threshold!, rule.hysteresis);
      if (side === null) {
        decisions.push({
          ...base,
          reason: 'waiting-dead-band',
          armState: rule.arm_state ?? null,
        });
        continue;
      }
      if (!rule.arm_state) {
        // First decisive reading ARMS the rule without firing — a freshly
        // created watch (or a cold restart) has no baseline to cross.
        decisions.push({ ...base, reason: 'armed', armState: side });
        continue;
      }
      if (side === rule.arm_state) {
        decisions.push({ ...base, reason: 'no-change', armState: side });
        continue;
      }
      if (side !== rule.threshold_op) {
        decisions.push({ ...base, reason: 'rearmed', armState: side });
        continue;
      }
      decisions.push({
        ...base,
        fired: true,
        reason: side === 'above' ? 'crossed-above' : 'crossed-below',
        armState: side,
      });
      continue;
    }

    // ── feed rules: stocking / report ─────────────────────────────────────
    const item = rule.kind === 'stocking' ? evidence.stocking(rule.water_id) : evidence.report(rule.water_id);
    if (!item) {
      decisions.push({ ...base, reason: 'no-evidence' });
      continue;
    }
    if (
      rule.quiet_hours_start &&
      rule.quiet_hours_end &&
      inQuietHours(localHHMM(now, rule.quiet_time_zone ?? WATER_TIME_ZONE), rule.quiet_hours_start, rule.quiet_hours_end)
    ) {
      decisions.push({ ...base, reason: 'quiet-hours' });
      continue;
    }
    if (
      rule.last_notified_at &&
      now - Date.parse(rule.last_notified_at) < rule.cooldown_minutes * 60_000
    ) {
      decisions.push({ ...base, reason: 'cooldown' });
      continue;
    }
    // Baseline: the last notice, or the rule's creation — a feed item must be
    // NEWER than both the day the rule started and anything already announced.
    const baselineMs = Date.parse(rule.last_notified_at ?? rule.created_at);
    if (item.key && rule.last_feed_key) {
      const seen = new Set(rule.last_feed_key.split(','));
      if (item.key.split(',').every((key) => seen.has(key))) {
        decisions.push({ ...base, reason: 'no-new-feed-item', feedKey: item.key });
        continue;
      }
    }
    const itemMs =
      item.publishedAt
        ? Date.parse(item.publishedAt)
        : Date.parse(`${item.date}T00:00:00Z`);
    if (!Number.isFinite(itemMs) || itemMs > now + 60_000
      || (!rule.last_feed_key && itemMs <= baselineMs)) {
      decisions.push({ ...base, reason: 'no-new-feed-item', feedKey: item.key });
      continue;
    }
    decisions.push({
      ...base,
      fired: true,
      reason: rule.kind === 'stocking' ? 'new-stocking-event' : 'new-report',
      feedDate: item.date,
      feedKey: item.key,
    });
  }

  return decisions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Digest bundling (pure): > DIGEST_THRESHOLD notices for one subscription in a
// single run collapse into ONE digest payload, so a storm of crossing rules is
// one buzz, not six.
// ─────────────────────────────────────────────────────────────────────────────

export interface Notice {
  subscriptionId: string;
  ruleId: number;
  waterId: string;
  kind: WatchKind;
  title: string;
  body: string;
  /** In-app deep link (same-origin path). */
  url: string;
}

export interface Digest {
  subscriptionId: string;
  notices: Notice[];
}

export interface NoticePlan {
  singles: Notice[];
  digests: Digest[];
}

export function bundleNotices(notices: Notice[]): NoticePlan {
  const bySubscription = new Map<string, Notice[]>();
  for (const n of notices) {
    const list = bySubscription.get(n.subscriptionId) ?? [];
    list.push(n);
    bySubscription.set(n.subscriptionId, list);
  }
  const singles: Notice[] = [];
  const digests: Digest[] = [];
  for (const [subscriptionId, group] of bySubscription) {
    if (group.length > DIGEST_THRESHOLD) {
      digests.push({ subscriptionId, notices: group });
    } else {
      singles.push(...group);
    }
  }
  return { singles, digests };
}

export function digestTitle(notices: Notice[]): string {
  return `${notices.length} watched waters changed`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence building (the ONE impure corner): reads the same static snapshot
// files the web fetches — never upstream providers. Missing files yield an
// empty view (rules then decide 'no-evidence' and stay silent — the honest
// outage posture).
// ─────────────────────────────────────────────────────────────────────────────

interface RawConditionSnapshot {
  streamId: string;
  readings: Array<{
    cfs?: number;
    tempC?: number;
    timestamp: string;
    metricTimes?: { cfs?: string; tempC?: string };
  }>;
}

interface RawShopReport {
  streamId?: string;
  date: string;
  publishedAt: string;
}

/**
 * Normalize a water name for stocking matching: lowercase, collapse
 * punctuation/whitespace. Deliberately simpler than the web's tiered
 * stockingMatch — v1 evaluation matches exact normalized names and the
 * catalog's own aliases only, and would rather stay silent than mis-attribute
 * a stocking to the wrong reach (containment matching is NOT ported).
 */
export function normalizeWaterName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function readEvidenceFromSnapshots(
  db: Db,
  snapshotsDir: string,
  states: readonly string[] = ['TN'],
): EvidenceView {
  // ── conditions: newest per-metric observation per stream ──────────────────
  const conditions = new Map<string, Map<WatchMetric, ConditionObservation>>();
  const conditionsPath = join(snapshotsDir, 'v1', 'conditions', 'latest.json');
  if (existsSync(conditionsPath)) {
    try {
      const parsed = JSON.parse(readFileSync(conditionsPath, 'utf8')) as RawConditionSnapshot[];
      for (const snap of Array.isArray(parsed) ? parsed : []) {
        const perMetric = new Map<WatchMetric, ConditionObservation>();
        for (const r of snap.readings ?? []) {
          for (const metric of ['tempC', 'cfs'] as const) {
            const value = r[metric];
            if (typeof value !== 'number') continue;
            const observedAtMs = Date.parse(r.metricTimes?.[metric] ?? r.timestamp);
            if (!Number.isFinite(observedAtMs)) continue;
            const current = perMetric.get(metric);
            if (!current || observedAtMs > current.observedAt) {
              perMetric.set(metric, { value, observedAt: observedAtMs });
            }
          }
        }
        if (perMetric.size > 0) conditions.set(snap.streamId, perMetric);
      }
    } catch {
      // unreadable snapshot → no condition evidence; rules stay silent
    }
  }

  // ── stocking: newest normalized-name match from the recent feed ───────────
  const waters: Array<{ id: string; name: string; aliases: string[] }> = [];
  try {
    const rows = db
      .prepare('SELECT id, name, aliases FROM streams WHERE archived_at IS NULL')
      .all() as Array<{ id: string; name: string; aliases: string }>;
    for (const row of rows) {
      let aliases: string[] = [];
      try {
        const parsed = JSON.parse(row.aliases ?? '[]') as unknown;
        if (Array.isArray(parsed)) aliases = parsed.filter((v): v is string => typeof v === 'string');
      } catch {
        // malformed alias list — the canonical name still works
      }
      waters.push({ id: row.id, name: row.name, aliases });
    }
  } catch {
    // no catalog → no stocking matching
  }
  const stocking = new Map<string, FeedItem>();
  for (const state of states) {
    const p = join(snapshotsDir, 'v1', 'stocking', `${state}-recent.json`);
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8')) as unknown;
      const events: StockingEvent[] = [];
      for (const value of Array.isArray(raw) ? raw : []) {
        const parsed = StockingEventSchema.safeParse(value);
        if (parsed.success) events.push(parsed.data);
      }
      for (const [waterId, list] of matchStocking(waters, events).byStream) {
        // Exclude fetch time: refreshing an unchanged schedule is not a new event.
        const keys = list.map(({ fetchedAt: _fetchedAt, ...event }) => createHash('sha256').update(JSON.stringify(event)).digest('hex')).sort();
        const latest = [...list].sort((a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt))[0]!;
        stocking.set(waterId, { date: latest.date, publishedAt: latest.fetchedAt, key: keys.join(',') });
      }
    } catch {
      // unreadable feed → no stocking evidence
    }
  }

  // ── reports: newest shop report keyed by the optional streamId ────────────
  const reports = new Map<string, FeedItem>();
  const reportsPath = join(snapshotsDir, 'v1', 'reports', 'recent.json');
  if (existsSync(reportsPath)) {
    try {
      const items = JSON.parse(readFileSync(reportsPath, 'utf8')) as RawShopReport[];
      for (const rep of Array.isArray(items) ? items : []) {
        if (!rep.streamId) continue;
        const current = reports.get(rep.streamId);
        if (!current || Date.parse(rep.publishedAt) > Date.parse(current.publishedAt ?? '')) {
          reports.set(rep.streamId, { date: rep.date, publishedAt: rep.publishedAt });
        }
      }
    } catch {
      // unreadable feed → no report evidence
    }
  }

  return {
    condition: (waterId, metric) => conditions.get(waterId)?.get(metric) ?? null,
    stocking: (waterId) => stocking.get(waterId) ?? null,
    report: (waterId) => reports.get(waterId) ?? null,
  };
}

/** ISO day `d` shifted by `days` — used by tests and retention cutoffs. */
export function isoDayMinus(days: number, nowMs: number): string {
  return isoDay(nowMs - days * 86_400_000);
}
