import { createECDH } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, expect, it, vi } from 'vitest';
import { WatchRuleSchema } from '../src/push/schema.js';
import { upsertSubscription, insertWatchRule, getWatchRule, type WatchRuleRow } from '../src/push/service.js';
import { evaluateRules, readEvidenceFromSnapshots, type EvidenceView } from '../src/push/evaluate.js';
import { runWatchlistsJob } from '../src/push/job.js';
import { makeEnv, type TestEnv } from './helpers.js';

const now = Date.parse('2026-10-01T15:00:00Z');
const rule: WatchRuleRow = { id: 1, subscription_id: 'subAAAAAAAAAAAAAAAAAAA', water_id: 'test-tailrace-a',
  kind: 'source-outage', metric: 'cfs', threshold: null, threshold_op: null, arm_state: null,
  cooldown_minutes: 15, quiet_hours_start: null, quiet_hours_end: null, quiet_time_zone: 'America/Chicago',
  hysteresis: 0, created_at: new Date(now).toISOString(), last_notified_at: null };
const evidence = (status: 'healthy' | 'outage' | 'unknown'): EvidenceView => ({
  condition: () => null, stocking: () => null, report: () => null, source: () => status,
});
let env: TestEnv | undefined;
afterEach(() => { if (env) { env.db.close(); rmSync(env.dir, { recursive: true, force: true, maxRetries: 3 }); env = undefined; } });

it('baselines silently, separates unknowns and condition rules, deduplicates and announces recovery', () => {
  expect(evaluateRules([rule], evidence('healthy'), { now })[0]).toMatchObject({ fired: false, feedKey: 'source:healthy' });
  expect(evaluateRules([rule], evidence('unknown'), { now })[0]).toMatchObject({ fired: false, reason: 'no-evidence' });
  const baseline = { ...rule, last_feed_key: 'source:healthy' };
  expect(evaluateRules([baseline], evidence('outage'), { now })[0]).toMatchObject({ fired: true, reason: 'source-unavailable', feedKey: 'source:outage' });
  const notified = { ...baseline, last_feed_key: 'source:outage' };
  expect(evaluateRules([notified], evidence('outage'), { now })[0]).toMatchObject({ fired: false, reason: 'no-change' });
  expect(evaluateRules([notified], evidence('healthy'), { now })[0]).toMatchObject({ fired: true, reason: 'source-recovered' });
  expect(evaluateRules([{ ...baseline, kind: 'condition', threshold: 100, threshold_op: 'below' }], evidence('outage'), { now })[0]?.fired).toBe(false);
});

it('keeps pending transitions across cooldown and quiet hours in the selected zone', () => {
  const baseline = { ...rule, last_feed_key: 'source:healthy', last_notified_at: new Date(now - 60_000).toISOString() };
  expect(evaluateRules([baseline], evidence('outage'), { now })[0]).toMatchObject({ fired: false, reason: 'cooldown' });
  const quiet = { ...rule, last_feed_key: 'source:healthy', quiet_hours_start: '08:00', quiet_hours_end: '17:00', quiet_time_zone: 'America/New_York' };
  expect(evaluateRules([quiet], evidence('outage'), { now })[0]).toMatchObject({ fired: false, reason: 'quiet-hours' });
  expect(evaluateRules([quiet], evidence('outage'), { now: now + 8 * 3_600_000 })[0]?.fired).toBe(true);
});

it('requires a metric and retains no threshold in an outage rule', () => {
  const input = { subscriptionId: 'A'.repeat(22), waterId: 'test-tailrace-a', kind: 'source-outage' };
  expect(WatchRuleSchema.safeParse(input).success).toBe(false);
  expect(WatchRuleSchema.parse({ ...input, metric: 'cfs' }).kind).toBe('source-outage');
});

it('uses provider history to distinguish a missing feed from an unsupported metric and retries failed sends', async () => {
  env = makeEnv();
  const waterId = (env.db.prepare('SELECT id FROM streams WHERE archived_at IS NULL LIMIT 1').get() as { id: string }).id;
  const gauge = '03533000';
  env.db.prepare('UPDATE streams SET gauge_ids = ? WHERE id = ?').run(JSON.stringify([gauge]), waterId);
  env.db.prepare('INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, observed_at, cfs) VALUES (?, ?, ?, ?, ?)')
    .run(gauge, new Date(now).toISOString(), '{}', new Date(now).toISOString(), 200);
  const dir = join(env.snapshotsDir, 'v1', 'conditions'); mkdirSync(dir, { recursive: true });
  const file = join(dir, 'latest.json');
  const fresh = () => writeFileSync(file, JSON.stringify([{ streamId: waterId, readings: [{ cfs: 200, timestamp: new Date(now).toISOString() }] }]));
  fresh();
  expect(readEvidenceFromSnapshots(env.db, env.snapshotsDir).source?.(waterId, 'tempC', now)).toBe('unknown');
  const key = createECDH('prime256v1'); key.generateKeys();
  const sub = upsertSubscription(env.db, { endpoint: 'https://fcm.googleapis.com/fcm/send/outage-fixture',
    keys: { p256dh: key.getPublicKey().toString('base64url'), auth: Buffer.alloc(16, 11).toString('base64url') } }, new Date(now));
  const stored = insertWatchRule(env.db, WatchRuleSchema.parse({ subscriptionId: sub.subscription_id, waterId, kind: 'source-outage', metric: 'cfs', cooldownMinutes: 15 }), new Date(now));
  const send = vi.fn(async (_target: unknown, _payload: unknown) => 'sent' as 'sent' | 'failed');
  const deps = { db: env.db, snapshotsDir: env.snapshotsDir, notifier: { canPush: true, send }, now: new Date(now) };
  await runWatchlistsJob(deps); expect(send).not.toHaveBeenCalled();
  writeFileSync(file, 'invalid JSON');
  send.mockResolvedValueOnce('failed');
  await runWatchlistsJob(deps);
  expect(getWatchRule(env.db, stored.id)?.last_feed_key).toBe('source:healthy');
  await runWatchlistsJob(deps);
  expect(getWatchRule(env.db, stored.id)?.last_feed_key).toBe('source:outage');
  await runWatchlistsJob(deps); expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0]?.[1]).toMatchObject({ title: expect.stringContaining('unavailable'), body: expect.stringContaining('not fishing conditions') });
  fresh(); await runWatchlistsJob({ ...deps, now: new Date(now + 16 * 60_000) });
  expect(send).toHaveBeenCalledTimes(3);
  expect(getWatchRule(env.db, stored.id)?.last_feed_key).toBe('source:healthy');
});

it.each([true, false])('upgrades legacy rules without changing identities or reusing deleted IDs (existing row: %s)', (keepRow) => {
  const db = new Database(':memory:'); db.pragma('foreign_keys = ON');
  try {
    db.exec(readFileSync(new URL('../migrations/021_watchlists.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../migrations/022_watch_delivery_state.sql', import.meta.url), 'utf8'));
    db.prepare('INSERT INTO push_subscriptions (subscription_id, endpoint, endpoint_hash, p256dh, auth, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('fixture', 'https://fcm.googleapis.com/fake', Buffer.from('hash'), 'k', 'a', '2026-10-01', '2026-10-01');
    db.exec("INSERT INTO watch_rules (id, subscription_id, water_id, kind, metric, created_at, quiet_time_zone, last_feed_key) VALUES (99, 'fixture', 'water', 'condition', 'cfs', '2026-10-01', 'America/New_York', 'saved')");
    const before = db.prepare('SELECT * FROM watch_rules WHERE id = 99').get();
    if (!keepRow) db.exec('DELETE FROM watch_rules');
    db.exec(readFileSync(new URL('../migrations/023_source_outage_watches.sql', import.meta.url), 'utf8'));
    if (keepRow) expect(db.prepare('SELECT * FROM watch_rules WHERE id = 99').get()).toEqual(before);
    const inserted = db.prepare("INSERT INTO watch_rules (subscription_id, water_id, kind, metric, created_at) VALUES ('fixture', 'water', 'source-outage', 'cfs', '2026-10-01')").run();
    expect(Number(inserted.lastInsertRowid)).toBe(100);
    db.exec("DELETE FROM push_subscriptions WHERE subscription_id = 'fixture'");
    expect(db.prepare('SELECT COUNT(*) AS n FROM watch_rules').get()).toEqual({ n: 0 });
  } finally { db.close(); }
});
