import { createECDH } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebPushNotifier, StubNotifier, type Notifier } from '../src/push/notifier.js';
import { SubscribeSchema } from '../src/push/schema.js';
import { getWatchRule, insertWatchRule, upsertSubscription } from '../src/push/service.js';
import { runWatchlistsJob } from '../src/push/job.js';
import { evaluateRules } from '../src/push/evaluate.js';
import { makeEnv, type TestEnv } from './helpers.js';

const require = createRequire(import.meta.url);
const webpush = require('web-push');
const clientKey = createECDH('prime256v1');
clientKey.generateKeys();
const keys = { p256dh: clientKey.getPublicKey().toString('base64url'), auth: Buffer.alloc(16, 42).toString('base64url') };
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/review-fixture', keys };
const vapid = { ...webpush.generateVAPIDKeys(), subject: 'mailto:review@example.test' };
const now = new Date('2026-09-30T15:00:00Z');

describe('real push adapter and enrollment boundary', () => {
  it('constructs an encrypted web-push request without making a network call', async () => {
    const sendNotification = vi.fn(async (sub, payload, options) => {
      const request = webpush.generateRequestDetails(sub, payload, {
        ...options,
        vapidDetails: vapid,
      });
      expect(request.body.length).toBeGreaterThan(0);
    });
    const notifier = new WebPushNotifier({ setVapidDetails: vi.fn(), sendNotification }, vapid);
    expect(await notifier.send({ subscriptionId: 'fixture', ...subscription }, { title: 'River cooled' })).toBe('sent');
    expect(sendNotification).toHaveBeenCalledWith(subscription, JSON.stringify({ title: 'River cooled' }), expect.objectContaining({ TTL: 3600 }));
  });

  it.each([
    'http://127.0.0.1/admin', 'https://127.0.0.1/admin', 'https://localhost/admin',
    'https://fcm.googleapis.com.attacker.test/push', 'https://fcm.googleapis.com:8443/push',
    'https://user:secret@fcm.googleapis.com/push', 'https://example.test/push',
  ])('rejects an endpoint outside browser push services: %s', (endpoint) => {
    expect(SubscribeSchema.safeParse({ ...subscription, endpoint }).success).toBe(false);
  });
});

describe('persisted watch transitions', () => {
  let env: TestEnv;
  beforeEach(() => { env = makeEnv(); });
  afterEach(() => { env.db.close(); rmSync(env.dir, { recursive: true, force: true }); });

  function setupRule() {
    const sub = upsertSubscription(env.db, subscription, now);
    const rule = insertWatchRule(env.db, {
      subscriptionId: sub.subscription_id, waterId: 'watauga-river', kind: 'condition',
      metric: 'tempC', thresholdOp: 'below', threshold: 21, hysteresis: 1, cooldownMinutes: 240,
    }, now);
    env.db.prepare("UPDATE watch_rules SET arm_state = 'above' WHERE id = ?").run(rule.id);
    mkdirSync(join(env.snapshotsDir, 'v1', 'conditions'), { recursive: true });
    writeFileSync(join(env.snapshotsDir, 'v1', 'conditions', 'latest.json'), JSON.stringify([
      { streamId: 'watauga-river', readings: [{ tempC: 18, timestamp: now.toISOString() }] },
    ]));
    return rule;
  }

  it('does not disclose or replace an existing subscription when only its endpoint is known', () => {
    const sub = upsertSubscription(env.db, subscription, now);
    const changed = { ...subscription, keys: { ...keys, auth: Buffer.alloc(16, 43).toString('base64url') } };
    expect(() => upsertSubscription(env.db, changed, now)).toThrow();
    expect(upsertSubscription(env.db, subscription, now).subscription_id).toBe(sub.subscription_id);
  });

  it('a below watch rearms silently on a rising temperature', () => {
    const rule = { ...setupRule(), arm_state: 'below' as const };
    const d = evaluateRules([rule], {
      condition: () => ({ value: 25, observedAt: now.getTime() }), stocking: () => null, report: () => null,
    }, { now: now.getTime() })[0]!;
    expect(d).toMatchObject({ fired: false, armState: 'above' });
  });

  it('a failed send stays retryable and makes job health fail', async () => {
    const rule = setupRule();
    const send = vi.fn<Notifier['send']>().mockResolvedValueOnce('failed').mockResolvedValueOnce('sent');
    const notifier: Notifier = { canPush: true, recent: () => [], send };
    await runWatchlistsJob({ db: env.db, snapshotsDir: env.snapshotsDir, notifier, now });
    expect(getWatchRule(env.db, rule.id)).toMatchObject({ arm_state: 'above', last_notified_at: null });
    expect(env.db.prepare("SELECT status FROM jobs_log WHERE job = 'watchlists' ORDER BY id DESC LIMIT 1").get()).toEqual({ status: 'error' });
    await runWatchlistsJob({ db: env.db, snapshotsDir: env.snapshotsDir, notifier, now });
    expect(send).toHaveBeenCalledTimes(2);
    expect(getWatchRule(env.db, rule.id)).toMatchObject({ arm_state: 'below', last_notified_at: now.toISOString() });
  });

  it('a dry-run notifier does not consume a real alert', async () => {
    const rule = setupRule();
    await runWatchlistsJob({ db: env.db, snapshotsDir: env.snapshotsDir, notifier: new StubNotifier(), now });
    expect(getWatchRule(env.db, rule.id)).toMatchObject({ arm_state: 'above', last_notified_at: null });
  });

  it('announces a newly published future schedule once, even across refreshes and cooldowns', async () => {
    const sub = upsertSubscription(env.db, subscription, now);
    insertWatchRule(env.db, { subscriptionId: sub.subscription_id, waterId: 'watauga-river', kind: 'stocking', hysteresis: 0, cooldownMinutes: 15 }, new Date(now.getTime() - 86_400_000));
    mkdirSync(join(env.snapshotsDir, 'v1', 'stocking'), { recursive: true });
    const event = { id: 'future-event', stateId: 'TN', species: 'rainbow', streamName: 'Watauga River (Tailwater)', date: '2026-10-15', datePrecision: 'week', sourceUrl: 'https://example.test/schedule', fetchedAt: now.toISOString() };
    const path = join(env.snapshotsDir, 'v1', 'stocking', 'TN-recent.json');
    writeFileSync(path, JSON.stringify([event]));
    const send = vi.fn<Notifier['send']>().mockResolvedValue('sent');
    const notifier: Notifier = { canPush: true, recent: () => [], send };
    await runWatchlistsJob({ db: env.db, snapshotsDir: env.snapshotsDir, notifier, now });
    expect(send).toHaveBeenCalledTimes(1);
    writeFileSync(path, JSON.stringify([{ ...event, fetchedAt: new Date(now.getTime() + 3_600_000).toISOString() }]));
    await runWatchlistsJob({ db: env.db, snapshotsDir: env.snapshotsDir, notifier, now: new Date(now.getTime() + 3_600_000) });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
