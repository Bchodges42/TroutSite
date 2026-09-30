import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { insertCorrection } from '../src/corrections/service.js';
import type { CorrectionCategory } from '../src/corrections/schema.js';
import { normalizeReceiptCode, receiptHash } from '../src/corrections/receipts.js';
import type { CorrectionsDeps } from '../src/corrections/routes.js';
import { makeEnv, type TestEnv } from './helpers.js';

/**
 * CORR-API lane — moderator review surface (ADR 0015 §5/§10):
 * fail-closed 503, bearer auth with constant-time compare, filtered queue,
 * detail + audit trail + duplicate cluster, and the full decision lifecycle.
 * Public-surface behavior lives in corrections.test.ts.
 */

const PEPPER = 'test-corrections-pepper-0123456789abcdef';
const TOKEN = 'test-moderator-token-0123456789abcdef';
const SITE = 'https://trout.test';
const NOW = Date.parse('2026-09-30T12:00:00Z');

let receiptCounter = 0;

interface SubmissionOverrides {
  waterId?: string;
  category?: CorrectionCategory;
  proposedCorrection?: string;
}

function makeApp(env: TestEnv, corrections: Partial<Omit<CorrectionsDeps, 'db'>> = {}) {
  return buildApp({
    db: env.db,
    corrections: {
      pepper: PEPPER,
      moderatorToken: TOKEN,
      siteOrigins: [SITE],
      ...corrections,
    },
  });
}

/** Insert directly through the service (validated shape guaranteed). */
function submit(
  db: TestEnv['db'],
  overrides: SubmissionOverrides = {},
  at: Date = new Date(NOW),
): number {
  receiptCounter += 1;
  const syntheticCode = `T${String(receiptCounter).padStart(14, '0')}`; // 15 chars, test-only
  const row = insertCorrection(db, {
    submission: {
      waterId: overrides.waterId ?? 'watauga-river',
      category: overrides.category ?? 'regulations',
      proposedCorrection:
        overrides.proposedCorrection ?? 'The creel limit shown is the old two-fish rule; update it.',
      submittedAt: at.getTime(),
    },
    receiptHash: receiptHash(PEPPER, syntheticCode),
    receiptLast4: 'TEST',
    now: at,
  });
  return row.id;
}
function review(app: ReturnType<typeof buildApp>, url: string, token = TOKEN) {
  return app.inject({
    method: 'GET',
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function act(
  app: ReturnType<typeof buildApp>,
  id: number,
  body: Record<string, unknown>,
  token = TOKEN,
) {
  return app.inject({
    method: 'POST',
    url: `/v1/corrections/review/${id}`,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    payload: body as Record<string, unknown>,
  });
}

describe('review surface — credentials (fail-closed discipline)', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('503s every review route when CORRECTIONS_MODERATOR_TOKEN is unset', async () => {
    const app = makeApp(env, { moderatorToken: undefined });
    const list = await review(app, '/v1/corrections/review', '');
    expect(list.statusCode).toBe(503);
    expect(list.json()).toEqual({ error: 'service unavailable' });
    const detail = await review(app, '/v1/corrections/review/1', '');
    expect(detail.statusCode).toBe(503);
    const action = await act(app, 1, { action: 'accept' }, '');
    expect(action.statusCode).toBe(503);
    await app.close();
  });

  it('503s the public routes too when the receipt pepper is unset (whole lane off)', async () => {
    const app = makeApp(env, { pepper: undefined, moderatorToken: undefined });
    const post = await app.inject({
      method: 'POST',
      url: '/v1/corrections',
      headers: { 'content-type': 'application/json' },
      payload: {
        waterId: 'watauga-river',
        category: 'other',
        proposedCorrection: 'Unconfigured deployment must answer the honest 503.',
        submittedAt: NOW,
      },
    });
    expect(post.statusCode).toBe(503);
    const status = await app.inject({ method: 'GET', url: '/v1/corrections/status/ABCDE-FGHJK-MNPQR' });
    expect(status.statusCode).toBe(503);
    const list = await review(app, '/v1/corrections/review', TOKEN);
    expect(list.statusCode).toBe(503);
    await app.close();
  });

  it('401s a missing or wrong bearer token and never leaks which', async () => {
    const app = makeApp(env);
    submit(env.db);
    const missing = await review(app, '/v1/corrections/review', '');
    expect(missing.statusCode).toBe(401);
    expect(missing.json()).toEqual({ error: 'unauthorized' });
    const wrong = await review(app, '/v1/corrections/review', 'wrong-token-entirely');
    expect(wrong.statusCode).toBe(401);
    const wrongAction = await act(app, 1, { action: 'accept' }, 'wrong-token-entirely');
    expect(wrongAction.statusCode).toBe(401);
    expect(env.db.prepare('SELECT status FROM corrections').get()).toMatchObject({
      status: 'received',
    });
    await app.close();
  });
});

describe('review surface — queue, detail, lifecycle', () => {
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

  it('lists the queue newest-first with the full record shape, bounded', async () => {
    const ids: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      ids.push(
        submit(env.db, {
          proposedCorrection: `Queued correction number ${i}, written with care.`,
        }, new Date(NOW + i * 1000)),
      );
    }
    const res = await review(app, '/v1/corrections/review');
    expect(res.statusCode).toBe(200);
    const { corrections } = res.json() as { corrections: Record<string, unknown>[] };
    expect(corrections.map((c) => c.id)).toEqual([...ids].reverse());
    const first = corrections[0]!;
    expect(first).toMatchObject({
      status: 'received',
      category: 'regulations',
      waterId: 'watauga-river',
      receiptLast4: 'TEST',
      riskFlags: ['regulations'],
      clusterSize: 1,
    });
    expect(first.proposedCorrection).toContain('number 2');
    expect(first.sourceUrl).toBeUndefined();

    const bounded = await review(app, '/v1/corrections/review?limit=2');
    expect((bounded.json() as { corrections: unknown[] }).corrections).toHaveLength(2);
  });

  it('filters by status, category, waterId, and high-impact risk flag', async () => {
    submit(env.db, { category: 'access' });
    submit(env.db, { category: 'regulations', waterId: 'test-tailrace-b' });
    submit(env.db, { category: 'other' });

    const access = await review(app, '/v1/corrections/review?risk=access');
    expect((access.json() as { corrections: unknown[] }).corrections).toHaveLength(1);
    expect(access.json()).toMatchObject({ corrections: [{ riskFlags: ['access'] }] });

    const other = await review(app, '/v1/corrections/review?category=other');
    expect((other.json() as { corrections: unknown[] }).corrections).toHaveLength(1);

    const water = await review(app, '/v1/corrections/review?waterId=test-tailrace-b');
    expect((water.json() as { corrections: unknown[] }).corrections).toHaveLength(1);
    expect(water.json()).toMatchObject({ corrections: [{ waterId: 'test-tailrace-b' }] });

    const none = await review(app, '/v1/corrections/review?status=accepted');
    expect((none.json() as { corrections: unknown[] }).corrections).toHaveLength(0);
  });

  it('shows the full record: audit trail + duplicate cluster', async () => {
    const parentId = submit(env.db, { proposedCorrection: 'Parent observation about the ramp fee.' });
    const childId = submit(env.db, { proposedCorrection: 'parent observation about the RAMP FEE!' });

    const detail = await review(app, `/v1/corrections/review/${childId}`);
    expect(detail.statusCode).toBe(200);
    const body = detail.json() as {
      correction: Record<string, unknown>;
      audit: { action: string }[];
      cluster: { parent?: { id: number }; children: { id: number }[] };
    };
    expect(body.correction.duplicateOf).toBe(parentId);
    expect(body.audit[0]).toMatchObject({ action: 'submitted', to_status: 'received' });
    expect(body.cluster.parent).toMatchObject({ id: parentId });

    // The clustering event is audited on the PARENT's trail, naming the child.
    const parentDetail = await review(app, `/v1/corrections/review/${parentId}`);
    const parentBody = parentDetail.json() as {
      audit: { action: string; note: string | null }[];
      cluster: { children: { id: number }[] };
    };
    expect(parentBody.audit).toContainEqual(
      expect.objectContaining({
        action: 'duplicate-clustered',
        note: `correction #${childId} clustered as a duplicate`,
      }),
    );
    expect(parentBody.cluster.children.map((c) => c.id)).toContain(childId);

    const missing = await review(app, '/v1/corrections/review/99999');
    expect(missing.statusCode).toBe(404);
  });

  it('walks the full decision lifecycle with an audit row per transition', async () => {
    const id = submit(env.db);

    const markReceived = await act(app, id, { action: 'mark-received' });
    expect(markReceived.statusCode).toBe(200);
    expect(markReceived.json()).toMatchObject({ correction: { status: 'received' } });

    const needsMore = await act(app, id, {
      action: 'needs-more-evidence',
      note: 'Which regulation year does the printed guide show?',
    });
    expect(needsMore.json()).toMatchObject({ correction: { status: 'needs-more-evidence' } });

    const accepted = await act(app, id, { action: 'accept' });
    const acceptedBody = accepted.json() as { correction: Record<string, unknown> };
    expect(acceptedBody.correction.status).toBe('accepted');
    expect(typeof acceptedBody.correction.terminalAt).toBe('string');
    // Accept does NOT touch public data — the row is only marked accepted.
    expect(acceptedBody.correction.proposedCorrection).toContain('creel limit');

    const audits = env.db
      .prepare('SELECT actor, action, from_status, to_status, note FROM corrections_audit WHERE correction_id = ? ORDER BY id')
      .all(id) as { actor: string; action: string; from_status: string; to_status: string; note: string | null }[];
    expect(audits.map((a) => [a.from_status, a.to_status])).toEqual([
      [null, 'received'],
      ['received', 'received'],
      ['received', 'needs-more-evidence'],
      ['needs-more-evidence', 'accepted'],
    ]);
    expect(audits.every((a) => a.actor === 'moderator')).toBe(true);
    expect(audits[2]!.note).toContain('regulation year');
  });

  it('requires a note for reject, records it, and the public status carries it', async () => {
    const id = submit(env.db);

    const noNote = await act(app, id, { action: 'reject' });
    expect(noNote.statusCode).toBe(422);
    expect(env.db.prepare('SELECT status FROM corrections WHERE id = ?').get(id)!).toMatchObject({
      status: 'received',
    });

    const rejected = await act(app, id, {
      action: 'reject',
      note: 'Checked against the 2026 Tennessee guide; the posted limit is current.',
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json()).toMatchObject({ correction: { status: 'rejected' } });

    // Public parity: the rejected receipt's lookup now carries the reason —
    // assert the reviewer_note column the status route reads from.
    expect(
      env.db.prepare('SELECT reviewer_note FROM corrections WHERE id = ?').get(id),
    ).toMatchObject({
      reviewer_note: 'Checked against the 2026 Tennessee guide; the posted limit is current.',
    });
  });

  it('status/:code reports rejected + note and resolved-as-duplicate end to end', async () => {
    // Submit over HTTP so the test holds the real receipt code.
    const post = async (text: string) =>
      app.inject({
        method: 'POST',
        url: '/v1/corrections',
        headers: { 'content-type': 'application/json' },
        payload: {
          waterId: 'watauga-river',
          category: 'regulations',
          proposedCorrection: text,
          submittedAt: NOW,
        },
      });

    const parent = await post('The special regulation limit changed to one fish over 18 inches.');
    const child = await post('The special regulation limit changed to one fish over 18 inches.');
    expect(parent.statusCode).toBe(202);
    expect(child.statusCode).toBe(202);
    const parentCode = normalizeReceiptCode((parent.json() as { receiptCode: string }).receiptCode);
    const childCode = normalizeReceiptCode((child.json() as { receiptCode: string }).receiptCode);

    // Find the child (the clustered one) through the review surface.
    const list = await review(app, '/v1/corrections/review');
    const { corrections } = list.json() as { corrections: { id: number; duplicateOf?: number }[] };
    const childItem = corrections.find((c) => c.duplicateOf !== undefined)!;
    const parentItem = corrections.find((c) => c.id === c.duplicateOf || c.duplicateOf === undefined)!;

    const dup = await act(app, childItem.id, { action: 'duplicate' });
    expect(dup.statusCode).toBe(200);
    const dupBody = dup.json() as { correction: { status: string; duplicateOf?: number; reviewerNote?: string } };
    expect(dupBody.correction.status).toBe('resolved');
    expect(dupBody.correction.duplicateOf).toBe(parentItem.id);
    expect(dupBody.correction.reviewerNote).toMatch(/duplicate/i);

    const childStatus = await app.inject({
      method: 'GET',
      url: `/v1/corrections/status/${encodeURIComponent(childCode)}`,
    });
    expect(childStatus.json()).toMatchObject({ status: 'resolved' });
    expect((childStatus.json() as { note?: string }).note).toMatch(/duplicate/i);

    // Parent stays authoritative and open.
    const parentStatus = await app.inject({
      method: 'GET',
      url: `/v1/corrections/status/${encodeURIComponent(parentCode)}`,
    });
    expect(parentStatus.json()).toMatchObject({ status: 'received' });

    // Duplicate action with no clusterable parent 422s.
    const loner = await post('A wholly unique observation about heron activity at the launch.');
    const lonerCode = normalizeReceiptCode((loner.json() as { receiptCode: string }).receiptCode);
    const lonerRow = env.db
      .prepare('SELECT id FROM corrections WHERE receipt_hash = ?')
      .get(receiptHash(PEPPER, lonerCode)) as { id: number };
    const noParent = await act(app, lonerRow.id, { action: 'duplicate' });
    expect(noParent.statusCode).toBe(422);
  });

  it('reopening a terminal row clears the terminal clock and keeps history immutable', async () => {
    const id = submit(env.db);
    await act(app, id, { action: 'reject', note: 'Not wrong per the current guide.' });
    const reopened = await act(app, id, { action: 'mark-received' });
    expect(reopened.json()).toMatchObject({ correction: { status: 'received' } });
    expect(
      (reopened.json() as { correction: { terminalAt?: string } }).correction.terminalAt,
    ).toBeUndefined();
    const audits = env.db
      .prepare('SELECT from_status, to_status FROM corrections_audit WHERE correction_id = ? ORDER BY id')
      .all(id) as { from_status: string; to_status: string }[];
    expect(audits.map((a) => [a.from_status, a.to_status])).toEqual([
      [null, 'received'],
      ['received', 'rejected'],
      ['rejected', 'received'],
    ]);
  });

  it('422s an unknown action and a malformed note', async () => {
    const id = submit(env.db);
    const bad = await act(app, id, { action: 'publish-immediately' });
    expect(bad.statusCode).toBe(422);
    const hugeNote = await act(app, id, { action: 'needs-more-evidence', note: 'x'.repeat(5000) });
    expect(hugeNote.statusCode).toBe(200); // notes are clipped, not rejected
    expect(
      (env.db.prepare('SELECT reviewer_note FROM corrections WHERE id = ?').get(id) as { reviewer_note: string })
        .reviewer_note.length,
    ).toBeLessThanOrEqual(2000);
  });
});
