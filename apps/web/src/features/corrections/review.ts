/**
 * Moderator review client for /v1/corrections/review/* (ADR 0015 §5/§10).
 *
 * Deliberately minimal: plain fetch wrappers typed to the API lane's review
 * shapes. The moderator token lives in MODULE MEMORY only — never
 * localStorage/sessionStorage, never a cookie — so closing the tab forgets it.
 * 401/403 and 503 surface as typed errors so the page can render honest
 * "not authorized" / "review service unavailable" states.
 */

/** Every decision the review surface accepts (ADR 0015 §4/§10). */
export const REVIEW_ACTIONS = [
  'mark-received',
  'needs-more-evidence',
  'duplicate',
  'accept',
  'reject',
  'resolve-source',
] as const;

export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

/** The public status vocabulary (mirrors CorrectionStatus.tsx). */
export const REVIEW_STATUSES = [
  'received',
  'needs-more-evidence',
  'accepted',
  'rejected',
  'resolved',
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** High-impact risk flags the queue can be filtered by (CORR-API). */
export const REVIEW_RISK_FLAGS = ['access', 'regulations', 'identity', 'species', 'gauge'] as const;

export interface ModeratorReviewItem {
  id: number;
  status: ReviewStatus;
  category: string;
  waterId: string;
  waterName?: string;
  field?: string;
  currentValue?: string;
  proposedCorrection: string;
  whatAppearsWrong?: string;
  sourceUrl?: string;
  sourcePubDate?: string;
  riskFlags: string[];
  duplicateOf?: number;
  reviewerNote?: string;
  receiptLast4: string;
  receivedAt: string;
  updatedAt: string;
  terminalAt?: string;
  clusterSize: number;
}

export interface ModeratorAuditEntry {
  id: number;
  correction_id: number;
  actor: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  at: string;
}

export interface ModeratorCluster {
  parent?: { id: number; status: string; category: string; proposedCorrection: string };
  children: { id: number; status: string; createdAt: string }[];
}

export interface ModeratorDetail {
  correction: ModeratorReviewItem;
  audit: ModeratorAuditEntry[];
  cluster: ModeratorCluster;
}

export interface ReviewQueueFilters {
  status?: string;
  category?: string;
  waterId?: string;
  risk?: string;
}

/** The review service answers 503 when the API has no moderator token set. */
export class ModeratorUnavailableError extends Error {
  constructor(message = 'The review service is not available (moderator access not configured on the server).') {
    super(message);
    this.name = 'ModeratorUnavailableError';
  }
}

/** The presented token was rejected (or is missing). */
export class ModeratorAuthError extends Error {
  constructor(message = 'That token was not accepted.') {
    super(message);
    this.name = 'ModeratorAuthError';
  }
}

/** Any other non-ok answer from the review surface. */
export class ModeratorRequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ModeratorRequestError';
    this.status = status;
  }
}

// Module-scope holder: process memory for this page session only. There is no
// persistence path — a refresh or tab close requires re-entering the token.
let moderatorToken: string | null = null;

export function setModeratorToken(token: string | null): void {
  moderatorToken = token && token.trim() ? token.trim() : null;
}

export function hasModeratorToken(): boolean {
  return moderatorToken !== null;
}

/** Test/teardown seam. */
export function clearModeratorToken(): void {
  moderatorToken = null;
}

function authHeaders(): Record<string, string> {
  if (!moderatorToken) throw new ModeratorAuthError('Enter the moderator token first.');
  return { authorization: `Bearer ${moderatorToken}` };
}

async function reviewFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        accept: 'application/json',
        ...authHeaders(),
        ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof ModeratorAuthError) throw err;
    throw new ModeratorUnavailableError('The review service could not be reached.');
  }
  if (res.status === 503) throw new ModeratorUnavailableError();
  if (res.status === 401 || res.status === 403) throw new ModeratorAuthError();
  if (!res.ok) {
    throw new ModeratorRequestError(res.status, `The review service answered HTTP ${res.status}.`);
  }
  return res;
}

function parseItem(raw: Record<string, unknown>): ModeratorReviewItem {
  return {
    id: raw.id as number,
    status: raw.status as ReviewStatus,
    category: String(raw.category ?? ''),
    waterId: String(raw.waterId ?? ''),
    proposedCorrection: String(raw.proposedCorrection ?? ''),
    riskFlags: Array.isArray(raw.riskFlags) ? (raw.riskFlags as string[]) : [],
    receiptLast4: String(raw.receiptLast4 ?? ''),
    receivedAt: String(raw.receivedAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
    clusterSize: typeof raw.clusterSize === 'number' ? raw.clusterSize : 1,
    ...(typeof raw.waterName === 'string' ? { waterName: raw.waterName } : {}),
    ...(typeof raw.field === 'string' ? { field: raw.field } : {}),
    ...(typeof raw.currentValue === 'string' ? { currentValue: raw.currentValue } : {}),
    ...(typeof raw.whatAppearsWrong === 'string' ? { whatAppearsWrong: raw.whatAppearsWrong } : {}),
    ...(typeof raw.sourceUrl === 'string' ? { sourceUrl: raw.sourceUrl } : {}),
    ...(typeof raw.sourcePubDate === 'string' ? { sourcePubDate: raw.sourcePubDate } : {}),
    ...(typeof raw.duplicateOf === 'number' ? { duplicateOf: raw.duplicateOf } : {}),
    ...(typeof raw.reviewerNote === 'string' ? { reviewerNote: raw.reviewerNote } : {}),
    ...(typeof raw.terminalAt === 'string' ? { terminalAt: raw.terminalAt } : {}),
  };
}

/** GET /v1/corrections/review?status=&category=&waterId=&risk= — bounded, newest first. */
export async function fetchReviewQueue(
  filters: ReviewQueueFilters = {},
): Promise<ModeratorReviewItem[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.waterId) params.set('waterId', filters.waterId);
  if (filters.risk) params.set('risk', filters.risk);
  const qs = params.toString();
  const res = await reviewFetch(`/v1/corrections/review${qs ? `?${qs}` : ''}`);
  const body = (await res.json()) as { corrections?: unknown };
  if (!Array.isArray(body.corrections)) {
    throw new ModeratorRequestError(res.status, 'The review queue returned an unknown shape.');
  }
  return (body.corrections as Record<string, unknown>[]).map(parseItem);
}

/** GET /v1/corrections/review/:id — full record + audit trail + duplicate cluster. */
export async function fetchCorrectionDetail(id: number): Promise<ModeratorDetail> {
  const res = await reviewFetch(`/v1/corrections/review/${id}`);
  const body = (await res.json()) as Record<string, unknown>;
  const correction = body.correction as Record<string, unknown> | undefined;
  if (!correction) {
    throw new ModeratorRequestError(res.status, 'The review detail returned an unknown shape.');
  }
  return {
    correction: parseItem(correction),
    audit: (Array.isArray(body.audit) ? body.audit : []) as ModeratorAuditEntry[],
    cluster: (body.cluster ?? { children: [] }) as ModeratorCluster,
  };
}

/** POST /v1/corrections/review/:id — one decision; returns the updated record. */
export async function submitReviewAction(
  id: number,
  action: ReviewAction,
  note?: string,
): Promise<ModeratorReviewItem> {
  const res = await reviewFetch(`/v1/corrections/review/${id}`, {
    method: 'POST',
    body: JSON.stringify({ action, ...(note && note.trim() ? { note: note.trim() } : {}) }),
  });
  const body = (await res.json()) as { correction?: unknown };
  if (!body.correction || typeof body.correction !== 'object') {
    throw new ModeratorRequestError(res.status, 'The review action returned an unknown shape.');
  }
  return parseItem(body.correction as Record<string, unknown>);
}
