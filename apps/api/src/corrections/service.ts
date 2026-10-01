import type { Db } from '../db.js';
import {
  dedupKeyOf,
  riskFlagsFor,
  type CorrectionCategory,
  type CorrectionSubmission,
} from './schema.js';

/**
 * SQLite service for the corrections moderation queue (ADR 0015 §3/§4/§7/§10).
 * Pure data access — no Fastify types here, so the cron worker can import the
 * retention purge without dragging the HTTP surface in.
 */

export const OPEN_STATUSES = ['received', 'needs-more-evidence'] as const;
export const TERMINAL_STATUSES = ['accepted', 'rejected', 'resolved'] as const;
export type CorrectionStatus =
  | (typeof OPEN_STATUSES)[number]
  | (typeof TERMINAL_STATUSES)[number];

/** Cluster-matching horizon: open twins older than this stop collecting duplicates. */
export const CLUSTER_WINDOW_DAYS = 180;

/** Content retention: rows are purged this long after going terminal. */
export const RETENTION_DAYS_AFTER_TERMINAL = 90;

/** Request-metadata retention bound (rate-limit map) — the cron hook's argument. */
export const REQUEST_METADATA_MAX_DAYS = 30;

export interface CorrectionRow {
  id: number;
  receipt_last4: string;
  created_at: string;
  water_id: string;
  water_name: string | null;
  category: CorrectionCategory;
  field: string | null;
  current_value: string | null;
  proposed_correction: string;
  what_appears_wrong: string | null;
  source_url: string | null;
  source_pub_date: string | null;
  status: CorrectionStatus;
  duplicate_of: number | null;
  reviewer_note: string | null;
  risk_flags: string;
  terminal_at: string | null;
  updated_at: string;
}

export interface AuditRow {
  id: number;
  correction_id: number;
  actor: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  at: string;
}

function rowMapper(row: Record<string, unknown>): CorrectionRow {
  return row as unknown as CorrectionRow;
}

/**
 * Insert a validated submission with its receipt hash. Duplicate clustering is
 * advisory: when an OPEN twin (same dedup fingerprint, created within the last
 * 180 days) exists, the new row links to the OLDEST open parent — walked
 * transitively to the cluster root — and nothing else happens. Clustering never
 * auto-closes; 3+ identical reports about one water is itself a signal.
 */
export function insertCorrection(
  db: Db,
  input: {
    submission: CorrectionSubmission;
    receiptHash: Buffer;
    receiptLast4: string;
    now?: Date;
  },
): CorrectionRow {
  const now = (input.now ?? new Date()).toISOString();
  const s = input.submission;
  const dedupKey = dedupKeyOf(s.waterId, s.category, s.proposedCorrection);
  const riskFlags = riskFlagsFor(s.category);

  const insert = db.prepare(
    `INSERT INTO corrections (
       receipt_hash, receipt_last4, created_at, water_id, water_name, category,
       field, current_value, proposed_correction, what_appears_wrong,
       source_url, source_pub_date, status, duplicate_of, risk_flags, dedup_key,
       terminal_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, NULL, ?)`,
  );

  const created = db.transaction((): CorrectionRow => {
    // Cluster BEFORE the row exists, so a new submission can never match itself.
    const parent = findClusterParent(db, dedupKey, now);
    const info = insert.run(
      input.receiptHash,      // receipt_hash
      input.receiptLast4,     // receipt_last4
      now,                    // created_at
      s.waterId,              // water_id
      s.waterName ?? null,    // water_name
      s.category,             // category
      s.field ?? null,        // field
      s.currentValue ?? null, // current_value
      s.proposedCorrection,   // proposed_correction
      s.whatAppearsWrong ?? null, // what_appears_wrong
      s.sourceUrl ?? null,    // source_url
      s.sourcePubDate ?? null,    // source_pub_date
      parent,                 // duplicate_of (cluster parent, or NULL)
      riskFlags,              // risk_flags
      dedupKey,               // dedup_key
      now,                    // updated_at
    );
    const id = Number(info.lastInsertRowid);
    // Creation is audited too, so the moderator's trail always starts at the
    // queue-entry event.
    appendAudit(db, { correctionId: id, action: 'submitted', toStatus: 'received', at: now });
    if (parent !== null) {
      appendAudit(db, {
        correctionId: parent,
        action: 'duplicate-clustered',
        note: `correction #${id} clustered as a duplicate`,
        at: now,
      });
    }
    return getCorrectionById(db, id)!;
  })();
  return created;
}

/** Oldest OPEN twin within the cluster window, walked to its cluster root. */
function findClusterParent(
  db: Db,
  dedupKey: string,
  nowIso: string,
  excludeId?: number,
): number | null {
  const cutoff = new Date(
    Date.parse(nowIso) - CLUSTER_WINDOW_DAYS * 24 * 60 * 60_000,
  ).toISOString();
  const oldest = db
    .prepare(
      `SELECT id, duplicate_of FROM corrections
       WHERE dedup_key = ? AND status IN ('received','needs-more-evidence')
         AND created_at >= ? AND id != COALESCE(?, -1)
       ORDER BY created_at ASC, id ASC LIMIT 1`,
    )
    .get(dedupKey, cutoff, excludeId ?? null) as
    | { id: number; duplicate_of: number | null }
    | undefined;
  if (!oldest) return null;
  // Transitive to the cluster root: follow duplicate_of links upward while the
  // parent row still exists and stays open (a terminal or missing parent stops
  // the walk — its subtree closed with it). Guarded against link cycles.
  let root = oldest.id;
  let parentId = oldest.duplicate_of;
  for (let guard = 0; parentId !== null && guard < 100; guard += 1) {
    const parent = db
      .prepare(`SELECT id, duplicate_of, status FROM corrections WHERE id = ?`)
      .get(parentId) as { id: number; duplicate_of: number | null; status: string } | undefined;
    if (!parent || !['received', 'needs-more-evidence'].includes(parent.status)) break;
    root = parent.id;
    parentId = parent.duplicate_of;
  }
  return root;
}

export function appendAudit(
  db: Db,
  input: {
    correctionId: number;
    actor?: string;
    action: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    at?: string;
  },
): void {
  db.prepare(
    `INSERT INTO corrections_audit (correction_id, actor, action, from_status, to_status, note, at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.correctionId,
    input.actor ?? 'moderator',
    input.action,
    input.fromStatus ?? null,
    input.toStatus ?? null,
    input.note ?? null,
    input.at ?? new Date().toISOString(),
  );
}

export function getCorrectionById(db: Db, id: number): CorrectionRow | undefined {
  const row = db.prepare('SELECT * FROM corrections WHERE id = ?').get(id);
  return row ? rowMapper(row as Record<string, unknown>) : undefined;
}

/**
 * Receipt status lookup: the caller has already hashed the presented code; the
 * index equality finds the row and the constant-time compare confirms it, so
 * the answer never depends on byte-prefix timing. Returns the row or nothing —
 * nothing is indistinguishable from "never existed" (expunged = 404 forever).
 */
export function findCorrectionByReceiptHash(db: Db, hash: Buffer): CorrectionRow | undefined {
  const row = db
    .prepare('SELECT * FROM corrections WHERE receipt_hash = ?')
    .get(hash) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  const mapped = rowMapper(row);
  const stored = row.receipt_hash as Buffer;
  const equal =
    stored.length === hash.length && stored.equals(hash);
  return equal ? mapped : undefined;
}

/** Moderator list with the working filters; newest first, bounded. */
export interface ReviewFilters {
  status?: string;
  category?: string;
  waterId?: string;
  risk?: string;
  limit?: number;
}

export function listCorrectionsForReview(db: Db, filters: ReviewFilters = {}): CorrectionRow[] {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.status && /^[a-z-]+$/.test(filters.status)) {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  if (filters.category && /^[a-z-]+$/.test(filters.category)) {
    clauses.push('category = ?');
    params.push(filters.category);
  }
  if (filters.waterId && filters.waterId.length <= 128) {
    clauses.push('water_id = ?');
    params.push(filters.waterId);
  }
  if (filters.risk && /^[a-z-]+$/.test(filters.risk)) {
    clauses.push("(',' || risk_flags || ',') LIKE ?");
    params.push(`%,${filters.risk},%`);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Number.isFinite(filters.limit) ? Math.max(1, Math.min(Math.floor(filters.limit!), 200)) : 100;
  const rows = db
    .prepare(`SELECT * FROM corrections ${where} ORDER BY id DESC LIMIT ${limit}`)
    .all(...params);
  return (rows as Record<string, unknown>[]).map(rowMapper);
}

export function listAuditFor(db: Db, correctionId: number): AuditRow[] {
  return db
    .prepare('SELECT * FROM corrections_audit WHERE correction_id = ? ORDER BY at ASC, id ASC')
    .all(correctionId) as unknown as AuditRow[];
}

export interface DuplicateCluster {
  parent?: { id: number; status: string; category: string; proposedCorrection: string };
  children: { id: number; status: string; createdAt: string }[];
}

export function duplicateClusterOf(db: Db, row: CorrectionRow): DuplicateCluster {
  const cluster: DuplicateCluster = { children: [] };
  if (row.duplicate_of !== null) {
    const parent = getCorrectionById(db, row.duplicate_of);
    if (parent) {
      cluster.parent = {
        id: parent.id,
        status: parent.status,
        category: parent.category,
        proposedCorrection: parent.proposed_correction,
      };
    }
  }
  const children = db
    .prepare(
      `SELECT id, status, created_at FROM corrections WHERE duplicate_of = ? ORDER BY created_at ASC`,
    )
    .all(row.id) as { id: number; status: string; created_at: string }[];
  cluster.children = children.map((c) => ({ id: c.id, status: c.status, createdAt: c.created_at }));
  return cluster;
}

export type ReviewAction =
  | 'mark-received'
  | 'needs-more-evidence'
  | 'duplicate'
  | 'accept'
  | 'reject'
  | 'resolve-source';

export const REVIEW_ACTIONS: readonly ReviewAction[] = [
  'mark-received',
  'needs-more-evidence',
  'duplicate',
  'accept',
  'reject',
  'resolve-source',
];

const ACTION_TO_STATUS: Record<ReviewAction, CorrectionStatus> = {
  'mark-received': 'received',
  'needs-more-evidence': 'needs-more-evidence',
  duplicate: 'resolved',
  accept: 'accepted',
  reject: 'rejected',
  'resolve-source': 'resolved',
};

export class ReviewActionError extends Error {
  constructor(
    readonly code: 'not-found' | 'invalid-action' | 'note-required' | 'no-duplicate-parent',
    message: string,
  ) {
    super(message);
    this.name = 'ReviewActionError';
  }
}

/**
 * Apply one moderator decision: writes the new status (+ duplicate link, +
 * terminal clock) and appends the immutable audit row. Accept deliberately
 * touches NO public data — content changes flow through the YAML/PR pipeline
 * (ADR 0015 §8); the record just becomes 'accepted'.
 */
export function applyReviewAction(
  db: Db,
  id: number,
  action: ReviewAction,
  note: string | undefined,
  now: Date = new Date(),
): CorrectionRow {
  if (!REVIEW_ACTIONS.includes(action)) {
    throw new ReviewActionError('invalid-action', `unknown review action: ${action}`);
  }
  const trimmedNote = note?.trim() || undefined;
  if (action === 'reject' && !trimmedNote) {
    throw new ReviewActionError('note-required', 'a rejection requires a reviewer note');
  }

  const update = db.transaction((): CorrectionRow => {
    const row = getCorrectionById(db, id);
    if (!row) throw new ReviewActionError('not-found', `no correction #${id}`);
    const toStatus = ACTION_TO_STATUS[action];

    let duplicateOf = row.duplicate_of;
    if (action === 'duplicate') {
      // Keep the clustered parent; otherwise link the oldest open twin now
      // (excluding the row itself — it matches its own fingerprint).
      if (duplicateOf === null) {
        duplicateOf = findClusterParent(
          db,
          dedupKeyOf(row.water_id, row.category, row.proposed_correction),
          now.toISOString(),
          id,
        );
      }
      if (duplicateOf === null) {
        throw new ReviewActionError('no-duplicate-parent', 'no duplicate parent found for this correction');
      }
    }

    const terminal = (TERMINAL_STATUSES as readonly string[]).includes(toStatus);
    const terminalAt = terminal ? (row.terminal_at ?? now.toISOString()) : null;
    const reviewerNote =
      trimmedNote ??
      // Resolved-as-duplicate carries the parent reference in its note (ADR 0015 §7)
      // so the reporter's status lookup explains the closure.
      (action === 'duplicate' ? 'Closed as a duplicate — see the parent correction in this cluster.' : row.reviewer_note);

    db.prepare(
      `UPDATE corrections
       SET status = ?, duplicate_of = ?, reviewer_note = ?, terminal_at = ?, updated_at = ?
       WHERE id = ?`,
    ).run(toStatus, duplicateOf, reviewerNote ?? null, terminalAt, now.toISOString(), id);

    appendAudit(db, {
      correctionId: id,
      action,
      fromStatus: row.status,
      toStatus,
      note: trimmedNote ?? null,
      at: now.toISOString(),
    });
    return getCorrectionById(db, id)!;
  });
  return update();
}

/**
 * Retention purge (ADR 0015 §3) — the function the cron worker calls later
 * (deliberately NOT wired into cron.ts this pass: jobs are infra-leased).
 *
 * Deletes correction content 90 days after it went terminal, together with its
 * audit rows (the audit trail expires with the content-retention clock). An
 * expunged receipt answers 404 forever after — a closed suggestion leaves no
 * trace. Request metadata (rate-limit map) never touches this table; the
 * in-process limiter exposes its own prune() (≤30d bound) in routes.ts.
 */
export function purgeExpiredCorrections(db: Db, now: Date = new Date()): { contentPurged: number } {
  const cutoff = new Date(
    now.getTime() - RETENTION_DAYS_AFTER_TERMINAL * 24 * 60 * 60_000,
  ).toISOString();
  const purge = db.transaction((): number => {
    const expired = db
      .prepare(
        `SELECT id FROM corrections WHERE terminal_at IS NOT NULL AND terminal_at <= ?`,
      )
      .all(cutoff) as { id: number }[];
    for (const { id } of expired) {
      db.prepare('DELETE FROM corrections_audit WHERE correction_id = ?').run(id);
      db.prepare('DELETE FROM corrections WHERE id = ?').run(id);
    }
    return expired.length;
  });
  return { contentPurged: purge() };
}
