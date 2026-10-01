import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createECDH } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { runWatchlistsJob } from '../src/push/job.js';
import { StubNotifier, type PushTarget } from '../src/push/notifier.js';
import { insertWatchRule } from '../src/push/service.js';
import { SUBSCRIPTION_ID_RE } from '../src/push/schema.js';
import type { WatchDeps } from '../src/push/routes.js';
import { makeEnv, type TestEnv } from './helpers.js';

/**
 * ALERTS lane — the watchlist HTTP surface + cron job (ADR 0016). Covers the
 * subscribe/rule CRUD lifecycle, the fail-closed VAPID posture, same-origin +
 * JSON + body-cap hardening, per-IP sliding windows, and the evaluation run
 * (jobs_log row, arm/cool persistence, digest bundling, dead-endpoint pruning,
 * retention). The pure decision matrix lives in watchlists-evaluate.test.ts.
 */

const VAPID = {
  publicKey: 'BTestPublicKeyTestPublicKeyTestPublicKeyTestPublicKeyTest',
  privateKey: 'TestPrivateKeyTestPrivateKeyTestPrivate',
  subject: 'mailto:watchlists@test',
};
const SITE = 'https://trout.test';

const SUB_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/test-endpoint-1';
const clientKey = createECDH('prime256v1');
clientKey.generateKeys();
const SUB_BODY = {
  endpoint: SUB_ENDPOINT,
  keys: { p256dh: clientKey.getPublicKey().toString('base64url'), auth: Buffer.alloc(16, 1).toString('base64url') },
  userAgent: 'vitest',
};

/** Fixed clock for rule baselines (feed rules compare against created_at). */
const NOW = Date.parse('2026-09-30T15:00:00Z'); // 10:00 America/Chicago

function makeApp(env: TestEnv, watchlists: Partial<Omit<WatchDeps, 'db'>> = {}) {
  return buildApp({
    db: env.db,
    watchlists: {
      vapid: VAPID,
      siteOrigins: [SITE],
      ...watchlists,
    },
  });
}

function subscribe(app: ReturnType<typeof buildApp>, body: unknown = SUB_BODY) {
  return app.inject({
    method: 'POST',
    url: '/v1/watches/subscribe',
    headers: { 'content-type': 'application/json' },
    payload: body as Record<string, unknown>,
  });
}

let subId = '';

async function subscribeAndSetId(app: ReturnType<typeof buildApp>): Promise<string> {
  const res = await subscribe(app);
  expect(res.statusCode).toBe(201);
  subId = (res.json() as { subscriptionId: string }).subscriptionId;
  return subId;
}

function postRule(app: ReturnType<typeof buildApp>, overrides: Record<string, unknown> = {}) {
  return app.inject({
    method: 'POST',
    url: '/v1/watches/rules',
    headers: { 'content-type': 'application/json' },
    payload: {
      subscriptionId: subId,
      waterId: 'watauga-river',
      kind: 'condition',
      metric: 'tempC',
      thresholdOp: 'above',
      threshold: 20,
      ...overrides,
    },
  });
}

/** A Notifier that behaves like the stub but can script per-call statuses. */
function jobNotifier(statuses?: Array<'sent' | 'gone' | 'failed'>) {
  const stub = new StubNotifier();
  let call = 0;
  return {
    canPush: true as const, // simulated successful delivery, not a production dry run
    recent: () => stub.recent(),
    async send(target: PushTarget, payload: unknown) {
      if (!statuses) return stub.send(target, payload);
      const scripted = statuses[Math.min(call++, statuses.length - 1)]!;
      if (scripted === 'sent') {
        await stub.send(target, payload);
        return 'sent' as const;
      }
      return scripted;
    },
  };
}

function seedSnapshots(env: TestEnv, tempC: number, observedAtMs: number, stockingDate?: string): string {
  const v1 = join(env.snapshotsDir, 'v1');
  mkdirSync(join(v1, 'conditions'), { recursive: true });
  mkdirSync(join(v1, 'stocking'), { recursive: true });
  mkdirSync(join(v1, 'reports'), { recursive: true });
  const iso = new Date(observedAtMs).toISOString();
  writeFileSync(
    join(v1, 'conditions', 'latest.json'),
    JSON.stringify([
      {
        streamId: 'watauga-river',
        readings: [{ gaugeId: '03466000', tempC, timestamp: iso, metricTimes: { tempC: iso } }],
        score: { value: 70, reasons: [] },
        fetchedAt: iso,
        nextExpectedUpdate: iso,
      },
    ]),
  );
  if (stockingDate) {
    writeFileSync(
      join(v1, 'stocking', 'TN-recent.json'),
      JSON.stringify([{ id: 'stock-1', stateId: 'TN', species: 'rainbow', sourceUrl: 'https://example.test/schedule', fetchedAt: '2026-09-28T12:00:00Z', streamName: 'Watauga River (Tailwater)', date: stockingDate }]),
    );
  }
  writeFileSync(
    join(v1, 'reports', 'recent.json'),
    JSON.stringify([
      {
        id: 'rep-1',
        shopId: 'test-fly-shop',
        shopName: 'Test',
        streamId: 'test-tailrace-b',
        date: '2026-09-29',
        body: 'They are eating everything.',
        hotPatterns: [],
        attributionUrl: 'https://example.com',
        publishedAt: '2026-09-29T12:00:00.000Z',
      },
    ]),
  );
  return env.snapshotsDir;
}

function cleanup(env: TestEnv, app: ReturnType<typeof buildApp>): Promise<void> {
  return app.close().then(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
    subId = '';
  });
}

describe('POST /v1/watches/subscribe — pseudonymous upsert lifecycle', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    env = makeEnv();
    app = makeApp(env);
  });

  afterEach(() => cleanup(env, app));

  it('returns 201 with a RANDOM 22-char base64url id (never derived from the endpoint)', async () => {
    const id = await subscribeAndSetId(app);
    expect(SUBSCRIPTION_ID_RE.test(id)).toBe(true);
    expect(id.includes('test-endpoint-1')).toBe(false);
    const row = env.db
      .prepare('SELECT endpoint, user_agent FROM push_subscriptions WHERE subscription_id = ?')
      .get(id) as { endpoint: string; user_agent: string };
    expect(row.endpoint).toBe(SUB_ENDPOINT);
    expect(row.user_agent).toBe('vitest');
  });

  it('upserts by endpoint hash: re-subscribing keeps the SAME id (and its rules)', async () => {
    const first = await subscribeAndSetId(app);
    expect((await postRule(app)).statusCode).toBe(201);
    const second = await subscribe(app, {
      ...SUB_BODY,
      userAgent: 'vitest-refresh',
    });
    expect(second.statusCode).toBe(201);
    expect((second.json() as { subscriptionId: string }).subscriptionId).toBe(first);
    // The rule survived the re-subscribe (never a silent watchlist wipe).
    const rules = env.db
      .prepare('SELECT COUNT(*) AS n FROM watch_rules WHERE subscription_id = ?')
      .get(first) as { n: number };
    expect(rules.n).toBe(1);
    const keys = env.db
      .prepare('SELECT p256dh FROM push_subscriptions WHERE subscription_id = ?')
      .get(first) as { p256dh: string };
    expect(keys.p256dh).toBe(SUB_BODY.keys.p256dh);
  });

  it('fails closed WITHOUT VAPID: 503 and no row collected (refuses data it cannot honor)', async () => {
    const closed = makeApp(env, { vapid: null });
    const res = await subscribe(closed);
    expect(res.statusCode).toBe(503);
    const count = env.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get() as { n: number };
    expect(count.n).toBe(0);
    await closed.close();
  });

  it('rejects malformed bodies (422 per-field), wrong content type (415), oversized bodies (413)', async () => {
    const bad = await subscribe(app, { endpoint: 'not a url', keys: {} });
    expect(bad.statusCode).toBe(422);
    expect((bad.json() as { errors: Record<string, string> }).errors.endpoint).toBeTruthy();

    const form = await app.inject({
      method: 'POST',
      url: '/v1/watches/subscribe',
      headers: { 'content-type': 'text/plain' },
      payload: 'x',
    });
    expect(form.statusCode).toBe(415);

    const huge = await subscribe(app, {
      ...SUB_BODY,
      endpoint: `https://fcm.example/${'x'.repeat(5000)}`,
    });
    expect(huge.statusCode).toBe(413);
  });

  it('rate-limits subscribes per IP with Retry-After (429), and recovers after the window', async () => {
    let now = Date.now();
    const ticking = makeApp(env, { limits: { subscribePerHour: 2 }, now: () => now });
    expect((await subscribe(ticking)).statusCode).toBe(201);
    expect(
      (await subscribe(ticking, { ...SUB_BODY, endpoint: SUB_ENDPOINT + '2' })).statusCode,
    ).toBe(201);
    const third = await subscribe(ticking, { ...SUB_BODY, endpoint: SUB_ENDPOINT + '3' });
    expect(third.statusCode).toBe(429);
    expect(Number(third.headers['retry-after'])).toBeGreaterThan(0);
    now += 3_600_000;
    expect(
      (await subscribe(ticking, { ...SUB_BODY, endpoint: SUB_ENDPOINT + '4' })).statusCode,
    ).toBe(201);
    await ticking.close();
  });

  it('rejects cross-origin browser-style requests (403) but allows server-to-server (no Origin)', async () => {
    const cross = await app.inject({
      method: 'POST',
      url: '/v1/watches/subscribe',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      payload: SUB_BODY as Record<string, unknown>,
    });
    expect(cross.statusCode).toBe(403);
    const direct = await subscribe(app); // no Origin/Referer — curl-shaped
    expect(direct.statusCode).toBe(201);
  });
});

describe('watch rules CRUD — pseudonymous access', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    env = makeEnv();
    app = makeApp(env);
    await subscribeAndSetId(app);
  });

  afterEach(() => cleanup(env, app));

  it('creates a rule (201, canonical shape) and lists only that subscription’s rules', async () => {
    const res = await postRule(app, { quietHoursStart: '21:00', quietHoursEnd: '07:00' });
    expect(res.statusCode).toBe(201);
    const rule = (res.json() as { rule: Record<string, unknown> }).rule;
    expect(rule.subscriptionId).toBe(subId);
    expect(rule.kind).toBe('condition');
    expect(rule.quietHoursStart).toBe('21:00');
    expect(rule.lastNotifiedAt).toBeUndefined(); // never fired

    const list = await app.inject({ method: 'GET', url: `/v1/watches/rules?subscriptionId=${subId}` });
    expect(list.statusCode).toBe(200);
    expect((list.json() as { rules: unknown[] }).rules).toHaveLength(1);
    // Another (unknown) subscription id sees an empty list, same 200.
    const other = await app.inject({
      method: 'GET',
      url: '/v1/watches/rules?subscriptionId=zzzzzzzzzzzzzzzzzzzzzz',
    });
    expect(other.statusCode).toBe(200);
    expect((other.json() as { rules: unknown[] }).rules).toHaveLength(0);
  });

  it('strips threshold machinery from stocking/report rules and validates condition completeness', async () => {
    const stocking = await postRule(app, { kind: 'stocking', metric: 'tempC', threshold: 99 });
    expect(stocking.statusCode).toBe(201);
    const rule = (stocking.json() as { rule: Record<string, unknown> }).rule;
    expect(rule.metric).toBeUndefined();
    expect(rule.threshold).toBeUndefined();

    const incomplete = await postRule(app, { threshold: undefined, thresholdOp: undefined });
    expect(incomplete.statusCode).toBe(422);

    const halfQuiet = await postRule(app, { quietHoursStart: '21:00' });
    expect(halfQuiet.statusCode).toBe(422);

    const unknownWater = await postRule(app, { waterId: 'not-a-water' });
    expect(unknownWater.statusCode).toBe(422);

    const unknownSub = await postRule(app, { subscriptionId: 'yyyyyyyyyyyyyyyyyyyyyy' });
    expect(unknownSub.statusCode).toBe(404);
  });

  it('deletes a rule only WITH its subscriptionId (sequential ids are enumerable)', async () => {
    const created = await postRule(app);
    const id = (created.json() as { rule: { id: number } }).rule.id;

    const wrongOwner = await app.inject({
      method: 'DELETE',
      url: `/v1/watches/rules/${id}?subscriptionId=yyyyyyyyyyyyyyyyyyyyyy`,
    });
    expect(wrongOwner.statusCode).toBe(404);

    const rightOwner = await app.inject({
      method: 'DELETE',
      url: `/v1/watches/rules/${id}?subscriptionId=${subId}`,
    });
    expect(rightOwner.statusCode).toBe(204);
    const count = env.db.prepare('SELECT COUNT(*) AS n FROM watch_rules').get() as { n: number };
    expect(count.n).toBe(0);
  });

  it('unsubscribes with a cascade (rules die with the subscription)', async () => {
    await postRule(app);
    const res = await app.inject({ method: 'DELETE', url: `/v1/watches/subscriptions/${subId}` });
    expect(res.statusCode).toBe(204);
    const subs = env.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get() as { n: number };
    const rules = env.db.prepare('SELECT COUNT(*) AS n FROM watch_rules').get() as { n: number };
    expect(subs.n).toBe(0);
    expect(rules.n).toBe(0);
  });

  it('caps rule storage per subscription (50) — bounded rows per pseudonymous id', async () => {
    for (let i = 0; i < 50; i++) {
      const res = await postRule(app, { threshold: 10 + i });
      expect(res.statusCode).toBe(201);
    }
    const overflow = await postRule(app, { threshold: 999 });
    expect(overflow.statusCode).toBe(422);
  });
});

describe('GET /v1/watches/config — honest capability probe', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    env = makeEnv();
    app = makeApp(env);
  });

  afterEach(() => cleanup(env, app));

  it('reports pushSupported with the public key when VAPID is configured', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/watches/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ pushSupported: true, publicKey: VAPID.publicKey });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('stays 200 and HONEST (pushSupported:false, null key) when VAPID is unset', async () => {
    const closed = makeApp(env, { vapid: null });
    const res = await closed.inject({ method: 'GET', url: '/v1/watches/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ pushSupported: false, publicKey: null });
    await closed.close();
  });
});

describe('runWatchlistsJob — evaluation, persistence, digests, pruning, jobs_log', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    env = makeEnv();
    app = makeApp(env);
    await subscribeAndSetId(app);
  });

  afterEach(() => cleanup(env, app));

  /** Insert a rule with a FIXED baseline clock (feed rules compare created_at). */
  function serviceRule(overrides: Record<string, unknown> = {}, createdAtMs = NOW - 7 * 86_400_000) {
    insertWatchRule(
      env.db,
      {
        subscriptionId: subId,
        waterId: 'watauga-river',
        kind: 'condition',
        metric: 'tempC',
        thresholdOp: 'above',
        threshold: 20,
        cooldownMinutes: 240,
        hysteresis: 1,
        ...overrides,
      } as Parameters<typeof insertWatchRule>[1],
      new Date(createdAtMs),
    );
  }

  it('arms on the first run (no fire), then fires on a real crossing and records jobs_log', async () => {
    const v1 = seedSnapshots(env, 25, NOW - 5 * 60_000);
    serviceRule();
    const notifier = jobNotifier();

    // Run 1: fresh 25 °C over a 20 °C threshold — ARMS, never fires.
    const first = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(NOW) });
    expect(first).toMatchObject({ fired: 0, sent: 0 });
    expect(notifier.recent()).toHaveLength(0);
    const afterFirst = env.db.prepare('SELECT arm_state FROM watch_rules').get() as { arm_state: string };
    expect(afterFirst.arm_state).toBe('above');

    // Run 2: same value, now armed above → no-change, no notice.
    const second = await runWatchlistsJob({
      db: env.db,
      snapshotsDir: v1,
      notifier,
      now: new Date(NOW + 900_000),
    });
    expect(second).toMatchObject({ fired: 0 });

    // Simulate a below-armed rule (the river cooled first), then the crossing
    // to 25 °C is a real upward transition → fires once.
    env.db.prepare('UPDATE watch_rules SET arm_state = ?').run('below');
    const firedAt = NOW + 1_800_000;
    const third = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(firedAt) });
    expect(third).toMatchObject({ fired: 1, singles: 1, sent: 1 });
    expect(notifier.recent()).toHaveLength(1);
    const payload = notifier.recent()[0]!.payload as { kind: string; title: string; url: string };
    expect(payload.kind).toBe('watch');
    expect(payload.title).toContain('Watauga');
    expect(payload.url).toBe('/conditions/watauga-river');
    const stored = env.db.prepare('SELECT arm_state, last_notified_at FROM watch_rules').get() as {
      arm_state: string;
      last_notified_at: string;
    };
    expect(stored.arm_state).toBe('above');
    expect(stored.last_notified_at).toBe(new Date(firedAt).toISOString());

    // Run 4, 4 minutes later: cooldown blocks the repeat.
    const fourth = await runWatchlistsJob({
      db: env.db,
      snapshotsDir: v1,
      notifier,
      now: new Date(firedAt + 4 * 60_000),
    });
    expect(fourth).toMatchObject({ fired: 0 });

    // jobs_log: one ok row per run, detail blob carrying the counts (#5).
    const jobs = env.db
      .prepare("SELECT status, detail FROM jobs_log WHERE job = 'watchlists' ORDER BY id")
      .all() as Array<{ status: string; detail: string }>;
    expect(jobs).toHaveLength(4);
    expect(jobs.every((j) => j.status === 'ok')).toBe(true);
    expect(JSON.parse(jobs[2]!.detail)).toMatchObject({ fired: 1, sent: 1 });
    expect(JSON.parse(jobs[3]!.detail)).toMatchObject({ fired: 0 });
  });

  it('never fires on stale evidence (4 h old) — the outage stays silent, and arms nothing', async () => {
    const v1 = seedSnapshots(env, 30, NOW - 4 * 3_600_000);
    serviceRule({ hysteresis: 0 });
    const notifier = jobNotifier();
    const outcome = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(NOW) });
    expect(outcome).toMatchObject({ fired: 0 });
    expect(notifier.recent()).toHaveLength(0);
    const row = env.db.prepare('SELECT arm_state FROM watch_rules').get() as { arm_state: null };
    expect(row.arm_state).toBeNull();
  });

  it('bundles >3 fired rules for one subscription into a single digest payload', async () => {
    const v1 = seedSnapshots(env, 25, NOW - 5 * 60_000);
    for (let i = 0; i < 4; i++) {
      serviceRule({ threshold: 20 - i, hysteresis: 0 });
    }
    env.db.prepare('UPDATE watch_rules SET arm_state = ?').run('below');
    const notifier = jobNotifier();
    const outcome = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(NOW) });
    expect(outcome).toMatchObject({ fired: 4, digests: 1, singles: 0, sent: 1 });
    expect(notifier.recent()).toHaveLength(1);
    const payload = notifier.recent()[0]!.payload as { kind: string; waters: unknown[] };
    expect(payload.kind).toBe('watch-digest');
    expect(payload.waters).toHaveLength(4);
  });

  it('fires stocking and report rules off the snapshot feeds (name-matched, id-matched)', async () => {
    const v1 = seedSnapshots(env, 15, NOW - 5 * 60_000, '2026-09-28');
    serviceRule({ kind: 'stocking', metric: undefined, thresholdOp: undefined, threshold: undefined });
    serviceRule(
      { kind: 'report', waterId: 'test-tailrace-b', metric: undefined, thresholdOp: undefined, threshold: undefined },
      NOW - 3 * 86_400_000,
    );
    const notifier = jobNotifier();
    const outcome = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(NOW) });
    expect(outcome).toMatchObject({ fired: 2, sent: 2 });
    const titles = notifier.recent().map((r) => (r.payload as { title: string }).title);
    expect(titles.some((t) => t.includes('Stocking'))).toBe(true);
    expect(titles.some((t) => t.includes('shop report'))).toBe(true);
  });

  it('prunes subscriptions the push service marked gone (410) immediately', async () => {
    const v1 = seedSnapshots(env, 25, NOW - 5 * 60_000);
    serviceRule({ hysteresis: 0 });
    env.db.prepare('UPDATE watch_rules SET arm_state = ?').run('below');
    const notifier = jobNotifier(['gone']);
    const outcome = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(NOW) });
    expect(outcome).toMatchObject({ fired: 1, gone: 1 });
    const subs = env.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get() as { n: number };
    expect(subs.n).toBe(0);
  });

  it('forgets stale subscriptions (180-day retention) with their rules', async () => {
    const v1 = seedSnapshots(env, 25, NOW - 5 * 60_000);
    serviceRule({ hysteresis: 0 });
    env.db
      .prepare('UPDATE push_subscriptions SET last_seen_at = ?')
      .run(new Date(NOW - 200 * 86_400_000).toISOString());
    const notifier = jobNotifier();
    const outcome = await runWatchlistsJob({ db: env.db, snapshotsDir: v1, notifier, now: new Date(NOW) });
    // `rules` counts what THIS run evaluated (read before the prune pass).
    expect(outcome).toMatchObject({ pruned: 1, rules: 1, evaluated: 1 });
    const rules = env.db.prepare('SELECT COUNT(*) AS n FROM watch_rules').get() as { n: number };
    expect(rules.n).toBe(0);
  });
});
