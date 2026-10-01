// OWNER: DASHBOARD lane (ADR 0017). Owner-dashboard API client.
//
// CREDENTIAL BOUNDARY: the owner token is its OWN credential — it NEVER reads,
// reuses, or touches the shop-token path (localStorage `trout.admin.token`,
// TOKENS.md HMAC scheme). The owner token lives IN MEMORY ONLY (a module
// variable): a page refresh deliberately signs the owner out again. It is
// never written to localStorage, sessionStorage, cookies, or any store.
import { z } from 'zod';

/** Deep-link that opens the owner area (never part of the shop-token boot). */
export const OWNER_MODE_HASH = '#/owner';

export const OWNER_DASHBOARD = '/v1/owner/dashboard';
export const OWNER_CORRECTIONS = '/v1/owner/corrections';
export const OWNER_RESEARCH_QUEUE = '/v1/owner/research-queue';
export const OWNER_PUBLICATION_PREVIEW = '/v1/owner/publication-preview';

export class OwnerApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Wire shapes (tolerant: the API is additive; unknown keys pass through)
// ---------------------------------------------------------------------------

const NullableIso = z.string().nullable();

export const OwnerJobSchema = z.object({
  name: z.string(),
  expected: z.boolean(),
  lastAttemptAt: NullableIso,
  lastSuccessAt: NullableIso,
  lastOutcome: z.enum(['ok', 'error', 'running', 'unknown']),
  runsLast24h: z.number(),
  nextExpectedRun: NullableIso,
  neverRun: z.boolean(),
});

export const OwnerFeedSchema = z.object({
  area: z.string(),
  present: z.boolean(),
  healthy: z.boolean(),
  reason: z.string().nullable(),
  fileMtime: NullableIso,
  ageMinutes: z.number().nullable(),
  extra: z.record(z.unknown()).default({}),
});

export const OwnerDashboardSchema = z.object({
  generatedAt: z.string(),
  jobs: z.array(OwnerJobSchema),
  omittedJobNames: z.number().default(0),
  feeds: z.array(OwnerFeedSchema),
  operations: z.array(z.object({ area: z.string(), state: z.string(), recordedAt: NullableIso, revision: NullableIso })).default([]),
  snapshotFreshness: z.object({ latestFileTimes: z.record(z.string()) }).default({ latestFileTimes: {} }),
  counts: z.object({
    correctionsByStatus: z.record(z.number()).default({}),
    correctionsOpen: z.number().default(0),
    watchRules: z.number().nullable().default(null),
    pushSubscriptions: z.number().nullable().default(null),
  }),
  unresolvedEvidence: z
    .object({
      byState: z.record(z.number()),
      researchCount: z.number(),
      waters: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          regionId: z.string(),
          evidenceState: z.string(),
          headline: z.string().nullable(),
          asOf: z.string().nullable(),
        }),
      ),
    })
    .optional(),
});
export type OwnerDashboard = z.infer<typeof OwnerDashboardSchema>;
export type OwnerJob = z.infer<typeof OwnerJobSchema>;
export type OwnerFeed = z.infer<typeof OwnerFeedSchema>;

export const OwnerCorrectionSummarySchema = z.object({
  id: z.number(),
  status: z.string(),
  category: z.string(),
  waterId: z.string(),
  waterName: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  proposedCorrection: z.string(),
  riskFlags: z.array(z.string()).default([]),
  receivedAt: z.string(),
  updatedAt: z.string(),
});
export type OwnerCorrectionSummary = z.infer<typeof OwnerCorrectionSummarySchema>;

export const OwnerResearchQueueSchema = z.object({
  total: z.number(),
  truncated: z.boolean(),
  queue: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      regionId: z.string(),
      evidenceState: z.string(),
      headline: z.string().nullable(),
      asOf: z.string().nullable(),
      unresolvedQuestion: z.string().nullable(),
      claimsNeedingEvidence: z.array(z.string()).default([]),
    }),
  ),
});
export type OwnerResearchQueue = z.infer<typeof OwnerResearchQueueSchema>;
export type OwnerResearchItem = OwnerResearchQueue['queue'][number];

const PublicationSchema = z.object({
  id: z.string(), preparedAt: z.string(), publishedAt: NullableIso,
  baseHash: z.string(), candidateHash: z.string(), fileChanges: z.number(), affectedWaters: z.number(), omittedWaters: z.number(),
  waters: z.array(z.object({ id: z.string(), name: z.string(), beforeWording: z.array(z.string()), afterWording: z.array(z.string()),
    changes: z.array(z.object({ field: z.string(), before: NullableIso, after: NullableIso, truncated: z.boolean() })) })),
});
const PublicationPreviewSchema = z.object({ state: z.enum(['not-prepared', 'invalid', 'ready', 'base-changed', 'expired', 'published']),
  publication: PublicationSchema.nullable() });
export type PublicationPreview = z.infer<typeof PublicationPreviewSchema>;

// ---------------------------------------------------------------------------
// In-memory token holder — the ONLY owner credential storage
// ---------------------------------------------------------------------------

let ownerToken: string | null = null;

/** Store the owner token for this page load (memory only). */
export function setOwnerToken(token: string): void {
  ownerToken = token.trim();
}

export function hasOwnerToken(): boolean {
  return ownerToken !== null && ownerToken.length > 0;
}

/** Drop the owner token (Lock button, 401s, unmount). */
export function clearOwnerToken(): void {
  ownerToken = null;
}

/** Test seam: whether any owner credential material touched browser storage. */
export function assertNoOwnerTokenInStorage(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null && /owner/i.test(key)) return false;
  }
  return true;
}

function ownerHeaders(): Record<string, string> {
  if (!hasOwnerToken()) throw new OwnerApiError(401, 'Owner sign-in required.');
  return { Authorization: `Bearer ${ownerToken}` };
}

async function ownerFetchJson<T extends z.ZodTypeAny>(url: string, schema: T): Promise<z.infer<T>> {
  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    res = await fetch(url, { headers: ownerHeaders(), cache: 'no-store', signal: controller.signal });
  } catch {
    throw new OwnerApiError(0, 'Could not reach the dashboard API.');
  } finally {
    clearTimeout(timeout);
  }
  if (res.status === 401) {
    clearOwnerToken(); // a rejected token is dead — forget it immediately
    throw new OwnerApiError(401, 'That owner token is not valid.');
  }
  if (res.status === 429) throw new OwnerApiError(429, 'Too many requests — wait a minute and refresh.');
  if (!res.ok) throw new OwnerApiError(res.status, `Dashboard request failed (${res.status}).`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new OwnerApiError(502, 'The dashboard answered with an unexpected shape.');
  return parsed.data;
}

export function fetchOwnerDashboard(): Promise<OwnerDashboard> {
  return ownerFetchJson(OWNER_DASHBOARD, OwnerDashboardSchema);
}

export function fetchOwnerCorrections(status?: string): Promise<{ corrections: OwnerCorrectionSummary[] }> {
  const q = status && status.length > 0 ? `?status=${encodeURIComponent(status)}` : '';
  return ownerFetchJson(`${OWNER_CORRECTIONS}${q}`, z.object({ corrections: z.array(OwnerCorrectionSummarySchema) }));
}

export function fetchOwnerResearchQueue(): Promise<OwnerResearchQueue> {
  return ownerFetchJson(OWNER_RESEARCH_QUEUE, OwnerResearchQueueSchema);
}

export function fetchPublicationPreview(): Promise<PublicationPreview> {
  return ownerFetchJson(OWNER_PUBLICATION_PREVIEW, PublicationPreviewSchema);
}
