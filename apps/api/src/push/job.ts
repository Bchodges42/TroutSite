import type { Db } from '../db.js';
import { startJob } from '../jobs/run.js';
import {
  bundleNotices,
  digestTitle,
  evaluateRules,
  readEvidenceFromSnapshots,
  type Notice,
} from './evaluate.js';
import {
  deleteSubscription,
  listAllRulesWithSubscriptions,
  pruneStaleSubscriptions,
  recordArmState,
  recordFiredRule,
  recordFeedState,
} from './service.js';
import type { Notifier } from './notifier.js';

/**
 * One run of the `watchlists` cron job (ADR 0016 §5) — the DB orchestration
 * around the PURE evaluateRules engine. Lives in push/job.ts (not cron.ts) so
 * tests can run it against a temp DB without executing the scheduler's module
 * side effects (openDb + node-cron timers).
 *
 * Reads the same static snapshot files the web fetches (v1/conditions/latest,
 * v1/stocking/TN-recent, v1/reports/recent) — NEVER upstream providers — and
 * delivers through the Notifier seam (stub unless VAPID keys are set). Fired
 * decisions persist as last_notified_at + arm_state; dead endpoints (404/410)
 * and 180-day-stale subscriptions are forgotten. The job writes its own
 * jobs_log row (non-negotiable #5), so cron.ts stays a thin single-flight shell.
 */

export interface WatchlistsJobDeps {
  db: Db;
  snapshotsDir: string;
  notifier: Notifier;
  states?: string[];
  now?: Date;
}

function noticeFor(
  waterName: string | undefined,
  rule: {
    water_id: string;
    kind: string;
    metric: string | null;
    threshold_op: string | null;
    threshold: number | null;
  },
): { title: string; body: string } {
  const name = waterName ?? rule.water_id;
  if (rule.kind === 'stocking') {
    return {
      title: `Stocking update — ${name}`,
      body: `Published stocking schedule updated for ${name}. A planned day or week is not confirmation of a completed release. Check the source in Trout.`,
    };
  }
  if (rule.kind === 'report') {
    return { title: `New shop report — ${name}`, body: `A fly shop posted a fresh report for ${name}.` };
  }
  const metric = rule.metric === 'cfs' ? 'flow' : 'water temperature';
  return {
    title: `${name} conditions shifted`,
    body: `${metric} crossed ${rule.threshold_op} your watch level (${rule.threshold}).`,
  };
}

export async function runWatchlistsJob(deps: WatchlistsJobDeps): Promise<Record<string, unknown>> {
  const { db, notifier } = deps;
  const now = deps.now ?? new Date();
  // Non-negotiable #5: every run lands one jobs_log row, written by the job
  // itself (the same discipline as the pipeline runners) so a direct test can
  // assert it and the cron wrapper stays a thin single-flight shell.
  const handle = startJob(db, 'watchlists');
  try {
    const detail = await evaluateOnce(db, notifier, deps, now);
    if (Number(detail.failed) > 0) handle.fail(new Error('Some watch notifications could not be delivered.'), detail);
    else handle.ok(detail);
    return detail;
  } catch (err) {
    handle.fail(err);
    throw err;
  }
}

async function evaluateOnce(
  db: Db,
  notifier: Notifier,
  deps: WatchlistsJobDeps,
  now: Date,
): Promise<Record<string, unknown>> {
  const joined = listAllRulesWithSubscriptions(db);
  const waterNames = new Map<string, string>();
  try {
    const rows = db.prepare('SELECT id, name FROM streams').all() as Array<{ id: string; name: string }>;
    for (const r of rows) waterNames.set(r.id, r.name);
  } catch {
    // names are cosmetic in notices; the id stands in
  }

  const evidence = readEvidenceFromSnapshots(db, deps.snapshotsDir, deps.states ?? ['TN']);
  const decisions = evaluateRules(
    joined.map((j) => j.rule),
    evidence,
    { now: now.getTime() },
  );

  // Join fired decisions with their subscription's delivery keys → notices.
  const ruleById = new Map(joined.map((j) => [j.rule.id, j.rule]));
  const notices: Notice[] = [];
  for (const d of decisions) {
    if (!d.fired) continue;
    const rule = ruleById.get(d.ruleId)!;
    const copy = noticeFor(waterNames.get(d.waterId), rule);
    notices.push({
      subscriptionId: d.subscriptionId,
      ruleId: d.ruleId,
      waterId: d.waterId,
      kind: d.kind,
      title: copy.title,
      body: copy.body,
      url: `/conditions/${d.waterId}`,
    });
  }

  const plan = bundleNotices(notices);
  let sent = 0;
  let failed = 0;
  let gone = 0;
  const deliveredRules = new Set<number>();
  const deliver = async (subscriptionId: string, payload: unknown, ruleIds: number[]): Promise<void> => {
    const subscription = joined.find((j) => j.rule.subscription_id === subscriptionId)?.subscription;
    if (!subscription) return;
    const status = await notifier.send(
      {
        subscriptionId,
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );
    if (status === 'sent' && notifier.canPush) {
      sent += 1;
      for (const id of ruleIds) deliveredRules.add(id);
    } else if (status === 'gone') {
      gone += 1;
      // The browser dropped this subscription — forget it now rather than
      // letting the 180-day retention clock run out on a dead watchlist.
      deleteSubscription(db, subscriptionId);
    } else if (status === 'failed') {
      failed += 1;
    }
  };
  for (const n of plan.singles) {
    await deliver(n.subscriptionId, { kind: 'watch', title: n.title, body: n.body, url: n.url }, [n.ruleId]);
  }
  for (const digest of plan.digests) {
    await deliver(digest.subscriptionId, {
      kind: 'watch-digest',
      title: digestTitle(digest.notices),
      url: '/conditions',
      waters: digest.notices.map((n) => ({ waterId: n.waterId, title: n.title, body: n.body, url: n.url })),
    }, digest.notices.map((n) => n.ruleId));
  }

  // Only acknowledged deliveries consume a transition. Failed sends retry;
  // a dry run may record payloads but must never mutate notification memory.
  for (const d of decisions) {
    if (d.fired && deliveredRules.has(d.ruleId)) {
      recordFiredRule(db, d.ruleId, d.armState ?? 'above', now, d.feedKey);
    } else if (!d.fired && notifier.canPush && d.armState !== undefined && d.armState !== null) {
      recordArmState(db, d.ruleId, d.armState);
    }
    if (!d.fired && notifier.canPush && d.feedKey) recordFeedState(db, d.ruleId, d.feedKey);
  }
  const pruned = pruneStaleSubscriptions(db, now);

  return {
    rules: joined.length,
    evaluated: decisions.length,
    fired: notices.length,
    singles: plan.singles.length,
    digests: plan.digests.length,
    sent,
    failed,
    gone,
    pruned,
    dryRun: !notifier.canPush,
  };
}
