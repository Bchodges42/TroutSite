import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import {
  applyReviewAction,
  insertCorrection,
  purgeExpiredCorrections,
} from '../src/corrections/service.js';
import {
  RECEIPT_CODE_RE,
  normalizeReceiptCode,
  receiptHash,
  receiptLast4,
} from '../src/corrections/receipts.js';
import { SlidingWindowRateLimiter, type CorrectionsDeps } from '../src/corrections/routes.js';
import { makeEnv, type TestEnv } from './helpers.js';

/**
 * CORR-API lane — public corrections surface (ADR 0015): POST /v1/corrections,
 * GET /v1/corrections/status/:code, rate limits, honeypot, duplicate clustering,
 * and the retention purge. The moderator review surface lives in
 * corrections-review.test.ts.
 */

const PEPPER = 'test-corrections-pepper-0123456789abcdef';
const SITE = 'https://trout.test';

const NOW = Date.parse('2026-09-30T12:00:00Z');

function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    waterId: 'watauga-river',
    category: 'regulations',
    proposedCorrection:
      'The creel limit shown is the old two-fish rule; the 2026 guide says one fish over 18 inches.',
    submittedAt: NOW,
    ...overrides,
  };
}

function makeApp(env: TestEnv, corrections: Partial<Omit<CorrectionsDeps, 'db'>> = {}) {
  return buildApp({
    db: env.db,
    corrections: {
      pepper: PEPPER,
      moderatorToken: 'unused-here',
      siteOrigins: [SITE],
      ...corrections,
    },
  });
}

function post(
  app: ReturnType<typeof buildApp>,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return app.inject({
    method: 'POST',
    url: '/v1/corrections',
    headers: { 'content-type': 'application/json', ...headers },
    payload: body as Record<string, unknown>,
  });
}

describe('POST /v1/corrections — submissions', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    env = makeEnv();
    app = makeApp(env);
  });

  afterEach(async () => {
    await app.close();
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('accepts a valid submission with 202 + a Crockford receipt code, shown once', async () => {
    const res = await post(app, validBody(), { origin: SITE });
    expect(res.statusCode).toBe(202);
    const { receiptCode } = res.json() as { receiptCode: string };
    expect(RECEIPT_CODE_RE.test(receiptCode)).toBe(true);

    // Exactly one queued row; the plaintext code appears NOWHERE in storage —
    // only the keyed HMAC and the support-triage last4.
    const rows = env.db.prepare('SELECT * FROM corrections').all() as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    const stored = JSON.stringify(rows);
    expect(stored).not.toContain(receiptCode);
    expect(stored).not.toContain(receiptCode.replace(/-/g, ''));
    const row = rows[0]!;
    const expectedHash = receiptHash(PEPPER, normalizeReceiptCode(receiptCode));
    expect((row.receipt_hash as Buffer).equals(expectedHash)).toBe(true);
    expect(row.receipt_last4).toBe(receiptLast4(normalizeReceiptCode(receiptCode)));
    expect(row.status).toBe('received');
    expect(row.water_id).toBe('watauga-river');
    expect(row.reviewer_note).toBeNull();
    expect(row.terminal_at).toBeNull();
  });

  it('answers server-to-server posts with no Origin/Referer (curl, monitors)', async () => {
    const res = await post(app, validBody());
    expect(res.statusCode).toBe(202);
  });

  it('rejects cross-site Origin and Referer with 403 and allows the configured origin', async () => {
    const evil = await post(app, validBody(), { origin: 'https://evil.example' });
    expect(evil.statusCode).toBe(403);

    const evilReferer = await post(app, validBody(), { referer: 'https://evil.example/form' });
    expect(evilReferer.statusCode).toBe(403);

    const same = await post(app, validBody(), { origin: SITE });
    expect(same.statusCode).toBe(202);

    // Same-origin Referer (no Origin header — same-site fetch) is accepted.
    const sameReferer = await post(app, validBody(), { referer: `${SITE}/corrections?water=watauga-river` });
    expect(sameReferer.statusCode).toBe(202);
  });

  it('fails closed on browser-style requests when no site origins are configured', async () => {
    const unconfigured = makeApp(env, { siteOrigins: [] });
    const res = await post(unconfigured, validBody(), { origin: SITE });
    expect(res.statusCode).toBe(403);
    // ...while server-to-server still works.
    const noOrigin = await post(unconfigured, validBody());
    expect(noOrigin.statusCode).toBe(202);
    await unconfigured.close();
  });

  it('requires application/json and 415s anything else', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/corrections',
      headers: { 'content-type': 'text/plain', origin: SITE },
      payload: 'not json',
    });
    expect(res.statusCode).toBe(415);
  });

  it('enforces the 16 KiB route body cap with 413 (below the 128 KiB global)', async () => {
    const res = await post(
      app,
      validBody({ proposedCorrection: `A wall of text. ${'x'.repeat(17 * 1024)}` }),
      { origin: SITE },
    );
    expect(res.statusCode).toBe(413);
  });

  it('422s invalid fields with per-field messages mirroring the client', async () => {
    const res = await post(
      app,
      validBody({
        waterId: 'has spaces',
        category: 'colors',
        proposedCorrection: 'short',
        sourceUrl: 'http://insecure.example/page',
        sourcePubDate: '2026-13-45',
        submittedAt: Date.now() + 120_000, // beyond the 60s server-clock skew
      }),
      { origin: SITE },
    );
    expect(res.statusCode).toBe(422);
    const { errors } = res.json() as { errors: Record<string, string> };
    expect(errors.waterId).toMatch(/never contain spaces/i);
    expect(errors.category).toMatch(/choose/i);
    expect(errors.proposedCorrection).toMatch(/at least 10/i);
    expect(errors.sourceUrl).toMatch(/https/i);
    expect(errors.sourcePubDate).toMatch(/YYYY-MM-DD/i);
    expect(errors.submittedAt).toMatch(/future/i);
  });

  it('422s an unknown waterId against the current catalog', async () => {
    const res = await post(app, validBody({ waterId: 'not-in-catalog' }), { origin: SITE });
    expect(res.statusCode).toBe(422);
    const { errors } = res.json() as { errors: Record<string, string> };
    expect(errors.waterId).toBeTruthy();
    expect(env.db.prepare('SELECT COUNT(*) AS n FROM corrections').get()).toMatchObject({ n: 0 });
  });

  it('NEVER persists reporterEmail even when a client sends it (zero-PII floor)', async () => {
    const res = await post(
      app,
      validBody({ reporterEmail: 'pwned@example.com' }),
      { origin: SITE },
    );
    expect(res.statusCode).toBe(202);
    const dump = JSON.stringify(env.db.prepare('SELECT * FROM corrections').all());
    expect(dump).not.toContain('pwned@example.com');
  });

  it('accepts a just-in-time submittedAt (60s skew) and stamps its own received clock', async () => {
    const ok = await post(app, validBody({ submittedAt: Date.now() + 30_000 }), { origin: SITE });
    expect(ok.statusCode).toBe(202);
    const row = env.db.prepare('SELECT created_at FROM corrections').get() as { created_at: string };
    expect(Number.isFinite(Date.parse(row.created_at))).toBe(true);
  });

  it('202s a filled honeypot with a receipt-shaped body and silently discards', async () => {
    const res = await post(
      app,
      validBody({ honeypot: 'http://spam.example/buy-now' }),
      { origin: SITE },
    );
    expect(res.statusCode).toBe(202);
    const { receiptCode } = res.json() as { receiptCode: string };
    expect(RECEIPT_CODE_RE.test(receiptCode)).toBe(true);
    // No row — the code answers "received" for nobody, and nothing distinguishes
    // this 202 from a real one.
    expect(env.db.prepare('SELECT COUNT(*) AS n FROM corrections').get()).toMatchObject({ n: 0 });
  });

  it('stops targeted flooding at the per-water open cap (ADR 0015 §5)', async () => {
    // Raise the IP windows so the WATER cap (10 open) is what trips.
    const capped = makeApp(env, {
      limits: { submissionsPerHour: 100, submissionsPerDay: 100 },
    });
    for (let i = 0; i < 10; i += 1) {
      const res = await post(
        capped,
        validBody({ proposedCorrection: `Flooding attempt number ${i} with plenty of detail text.` }),
        { origin: SITE },
      );
      expect(res.statusCode).toBe(202);
    }
    const eleventh = await post(
      capped,
      validBody({ proposedCorrection: 'One more open correction should trip the water cap.' }),
      { origin: SITE },
    );
    expect(eleventh.statusCode).toBe(429);
    expect(eleventh.headers['retry-after']).toBeDefined();
    await capped.close();
  });
});

describe('GET /v1/corrections/status/:code — receipt lookup', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;
  let receiptCode: string;

  beforeEach(async () => {
    env = makeEnv();
    app = makeApp(env);
    const res = await post(app, validBody());
    expect(res.statusCode).toBe(202);
    receiptCode = (res.json() as { receiptCode: string }).receiptCode;
  });

  afterEach(async () => {
    await app.close();
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('round-trips a fresh code to status received, no-store', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/corrections/status/${receiptCode}` });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.json()).toMatchObject({
      code: receiptCode,
      status: 'received',
      waterId: 'watauga-river',
      category: 'regulations',
    });
    const body = res.json() as Record<string, unknown>;
    expect(body.note).toBeUndefined();
    // No reporter details, ever.
    expect(JSON.stringify(body)).not.toMatch(/email|ip|agent/i);
  });

  it('resolves normalized input: lowercase and spaces hash to the same receipt', async () => {
    const sloppy = encodeURIComponent(receiptCode.toLowerCase().replace(/-/g, ' '));
    const res = await app.inject({ method: 'GET', url: `/v1/corrections/status/${sloppy}` });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { status: string }).status).toBe('received');
  });

  it('404s an unknown or expunged code with the honest unknown shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/corrections/status/ABCDE-FGHJK-MNPQR' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ status: 'unknown' });
  });

  it('400s a malformed code before any hashing', async () => {
    for (const bad of ['no-dashes', 'ABCDE-FGHIK-MNPQR', 'ABC', 'a-b-c']) {
      const res = await app.inject({ method: 'GET', url: `/v1/corrections/status/${bad}` });
      expect(res.statusCode, bad).toBe(400);
      expect(res.json()).toEqual({ error: 'malformed receipt code' });
    }
  });
});

describe('duplicate clustering (ADR 0015 §7)', () => {
  let env: TestEnv;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    env = makeEnv();
    app = makeApp(env);
  });

  afterEach(async () => {
    await app.close();
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  function allRows(): Record<string, unknown>[] {
    // Tests know the hashes because they know the pepper — the service never
    // exposes plaintext.
    return env.db.prepare('SELECT * FROM corrections ORDER BY id').all() as Record<
      string,
      unknown
    >[];
  }

  it('links an identical open twin via duplicate_of and keeps the oldest as root', async () => {
    const first = await post(app, validBody());
    const second = await post(app, validBody());
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(202);
    const rows = allRows();
    expect(rows).toHaveLength(2);
    const parent = rows[0]!;
    const child = rows[1]!;
    expect(parent.duplicate_of).toBeNull();
    expect(child.duplicate_of).toBe(parent.id);
    // Advisory metadata only: the child still enters the queue as its own row.
    expect(child.status).toBe('received');
    // Parent's audit trail records the clustering event.
    const audits = env.db
      .prepare('SELECT action, correction_id FROM corrections_audit')
      .all() as { action: string; correction_id: number }[];
    expect(audits).toContainEqual({ action: 'duplicate-clustered', correction_id: parent.id });
  });

  it('clusters across case/punctuation noise and separates distinct texts', async () => {
    await post(app, validBody({ proposedCorrection: 'The  CREEL limit is wrong: two fish!' }));
    await post(app, validBody({ proposedCorrection: 'the creel LIMIT is wrong: Two fish?' }));
    const third = await post(
      app,
      validBody({ proposedCorrection: 'Completely different observation about the boat ramp.' }),
    );
    expect(third.statusCode).toBe(202);
    const rows = allRows();
    expect(rows).toHaveLength(3);
    const clustered = rows.filter((r) => r.duplicate_of !== null);
    expect(clustered).toHaveLength(1);
    // The distinct text is its own cluster root.
    expect(
      rows.find((r) => String(r.proposed_correction).includes('Completely different'))!
        .duplicate_of,
    ).toBeNull();
  });

  it('stops clustering once the whole family is terminal (closed = no open twin)', async () => {
    await post(app, validBody());
    await post(app, validBody());
    const rows = allRows();
    const parent = rows.find((r) => r.duplicate_of === null)!;
    // Close parent and child.
    applyReviewAction(env.db, parent.id as number, 'resolve-source', undefined);
    applyReviewAction(env.db, rows.find((r) => r.duplicate_of !== null)!.id as number, 'reject', 'out of scope');
    const third = await post(app, validBody());
    expect(third.statusCode).toBe(202);
    const newest = env.db.prepare('SELECT * FROM corrections ORDER BY id DESC').get() as Record<
      string,
      unknown
    >;
    expect(newest.duplicate_of).toBeNull();
  });
});

describe('rate limits (per-IP sliding windows, bounded map)', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('trips the hourly submission window with 429 + Retry-After', async () => {
    const app = makeApp(env, { limits: { submissionsPerHour: 2, submissionsPerDay: 20 } });
    for (let i = 0; i < 2; i += 1) {
      const ok = await post(
        app,
        validBody({ proposedCorrection: `Distinct report ${i} with enough detail to pass validation.` }),
      );
      expect(ok.statusCode).toBe(202);
    }
    const third = await post(
      app,
      validBody({ proposedCorrection: 'One submission too many for this hour, sadly.' }),
    );
    expect(third.statusCode).toBe(429);
    const retryAfter = Number(third.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(3600);
    await app.close();
  });

  it('trips the daily submission window even with hourly headroom', async () => {
    const app = makeApp(env, { limits: { submissionsPerHour: 50, submissionsPerDay: 3 } });
    for (let i = 0; i < 3; i += 1) {
      const ok = await post(
        app,
        validBody({ proposedCorrection: `Daily-window report ${i} with enough detail to pass.` }),
      );
      expect(ok.statusCode).toBe(202);
    }
    const fourth = await post(
      app,
      validBody({ proposedCorrection: 'One submission too many for this day.' }),
    );
    expect(fourth.statusCode).toBe(429);
    expect(Number(fourth.headers['retry-after'])).toBeGreaterThan(3600);
    await app.close();
  });

  it('trips the status-lookup window (30/h default, injectable for tests)', async () => {
    const app = makeApp(env, { limits: { statusPerHour: 1 } });
    const submit = await post(app, validBody());
    const code = (submit.json() as { receiptCode: string }).receiptCode;
    const first = await app.inject({ method: 'GET', url: `/v1/corrections/status/${code}` });
    expect(first.statusCode).toBe(200);
    const second = await app.inject({ method: 'GET', url: `/v1/corrections/status/${code}` });
    expect(second.statusCode).toBe(429);
    expect(second.headers['retry-after']).toBeDefined();
    await app.close();
  });

  it('computes Retry-After from the oldest hit and forgets expired windows', () => {
    let t = 1_000_000;
    const limiter = new SlidingWindowRateLimiter([{ max: 2, windowMs: 1000 }], () => t);
    expect(limiter.check('ip').allowed).toBe(true);
    t += 400;
    expect(limiter.check('ip').allowed).toBe(true);
    t += 100;
    const denied = limiter.check('ip');
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(1); // ceil(500ms/1000)
    t += 1100; // everything aged out
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.prune(t)).toBeGreaterThanOrEqual(0);
  });

  it('keeps the hit map bounded under a flood of distinct keys', () => {
    const t = 0;
    const limiter = new SlidingWindowRateLimiter([{ max: 1, windowMs: 86_400_000 }], () => t);
    for (let i = 0; i < 10_050; i += 1) limiter.check(`ip-${i}`);
    // Hard cap: 10 050 keys collapse to at most MAX_TRACKED_KEYS (10 000).
    const size = (limiter as unknown as { hits: Map<string, number[]> }).hits.size;
    expect(size).toBeLessThanOrEqual(10_000);
  });
});

describe('retention purge (ADR 0015 §3)', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('deletes content + audit 90 days after terminal; young and open rows stay', async () => {
    const app = makeApp(env);
    // Terminal-long-ago row.
    const oldRes = await post(app, validBody({ proposedCorrection: 'An old correction, long since resolved.' }));
    const oldCode = normalizeReceiptCode((oldRes.json() as { receiptCode: string }).receiptCode);
    const oldHash = receiptHash(PEPPER, oldCode);
    const oldRow = env.db
      .prepare('SELECT id FROM corrections WHERE receipt_hash = ?')
      .get(oldHash) as { id: number };
    applyReviewAction(env.db, oldRow.id, 'resolve-source', undefined);
    const stale = new Date(Date.parse('2026-09-30T12:00:00Z') - 91 * 24 * 60 * 60_000).toISOString();
    env.db.prepare('UPDATE corrections SET terminal_at = ? WHERE id = ?').run(stale, oldRow.id);

    // Fresh terminal row (must survive) and an open row (must survive).
    const freshRes = await post(
      app,
      validBody({ proposedCorrection: 'A freshly accepted correction that must survive.' }),
    );
    const freshCode = normalizeReceiptCode((freshRes.json() as { receiptCode: string }).receiptCode);
    const freshRow = env.db
      .prepare('SELECT id FROM corrections WHERE receipt_hash = ?')
      .get(receiptHash(PEPPER, freshCode)) as { id: number };
    applyReviewAction(env.db, freshRow.id, 'accept', undefined);
    await post(app, validBody({ proposedCorrection: 'Still open, still queued for moderators.' }));

    const purged = purgeExpiredCorrections(env.db, new Date('2026-09-30T12:00:00Z'));
    expect(purged.contentPurged).toBe(1);

    const remaining = env.db.prepare('SELECT id FROM corrections ORDER BY id').all() as {
      id: number;
    }[];
    // The purged row is the lowest id; the fresh terminal row and the open row survive.
    expect(new Set(remaining.map((r) => r.id))).toEqual(new Set([freshRow.id, oldRow.id + 2]));
    expect(env.db.prepare('SELECT COUNT(*) AS n FROM corrections_audit WHERE correction_id = ?').get(oldRow.id)).toMatchObject({ n: 0 });

    // The expunged receipt answers 404 forever after.
    const status = await app.inject({ method: 'GET', url: `/v1/corrections/status/${oldCode}` });
    expect(status.statusCode).toBe(404);
    await app.close();
  });

  it('is callable directly by the cron worker with no HTTP surface involved', () => {
    insertCorrection(env.db, {
      submission: {
        waterId: 'watauga-river',
        category: 'other',
        proposedCorrection: 'Direct service insert for the retention test suite.',
        submittedAt: Date.now(),
      },
      receiptHash: Buffer.alloc(32, 7),
      receiptLast4: 'TEST',
      now: new Date('2026-09-30T12:00:00Z'),
    });
    expect(purgeExpiredCorrections(env.db).contentPurged).toBe(0);
  });
});
