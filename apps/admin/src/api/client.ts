// OWNER: ROLE 4. Portal API client. The portal is the ONLY dynamic surface in the product;
// everything else is snapshot JSON. No cookies, no analytics, no third-party calls — the shop
// token rides in an Authorization header and is stored in localStorage (see TOKENS.md).
import { z } from 'zod';
import { ShopSchema, ShopReportSchema, HotPatternSchema, IsoDateSchema, ENDPOINTS, type Shop, type ShopReport, type HotPattern } from '@trout/contracts';
import { tokenExpired, parseToken } from '../lib/tokenFormat.js';

export const TOKEN_STORAGE_KEY = 'trout.admin.token';

export const MeResponseSchema = z.object({ shop: ShopSchema });
export type MeResponse = z.infer<typeof MeResponseSchema>;

/** What the composer sends. Server assigns id/shopId/shopName/attributionUrl/publishedAt. */
export const ShopReportInputSchema = z.object({
  streamId: z.string().min(1).optional(),
  date: IsoDateSchema,
  body: z.string().min(1),
  hotPatterns: z.array(HotPatternSchema),
  // Role-4 note (docs/ASSUMPTIONS.md): photoUrl is requested by the CHAT-4 brief but absent from
  // the frozen ShopReport contract — sent additively; the server strips it until contracts allow it.
  photoUrl: z.string().url().optional(),
});
export type ShopReportInput = z.infer<typeof ShopReportInputSchema>;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function apiBase(): string {
  // Same-origin by default; override for local dev against a real API (VITE_API_BASE=http://localhost:8787).
  return import.meta.env.VITE_API_BASE ?? '';
}

// GET /v1/portal/me is additive to the frozen §6 endpoint map (CHAT-4 deliverable 3) —
// recorded in docs/ASSUMPTIONS.md under [ROLE 4]; do not add to @trout/contracts without an ADR.
export const PORTAL_ME = '/v1/portal/me';

/** Exchange a shop token for the shop identity (GET /v1/portal/me — additive endpoint, see ASSUMPTIONS).
 * Pass `token` to verify-before-store (login flow); omit to use the stored token (boot flow). */
export async function fetchMe(token?: string): Promise<Shop> {
  const bearer = token ?? localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
  const res = await fetch(`${apiBase()}${PORTAL_ME}`, { headers: { Authorization: `Bearer ${bearer}` } });
  if (res.status === 401) throw new ApiError(401, 'This token is not valid or has expired.');
  if (!res.ok) throw new ApiError(res.status, `Portal sign-in failed (${res.status}).`);
  const parsed = MeResponseSchema.safeParse(await res.json());
  if (!parsed.success) throw new ApiError(502, 'Portal responded with an unexpected shape.');
  return parsed.data.shop;
}

export async function publishReport(input: ShopReportInput, opts?: { idempotencyKey?: string }): Promise<ShopReport> {
  const body = ShopReportInputSchema.parse(input);
  // F02 wave-1 contract (POST /v1/portal/reports): an Idempotency-Key makes the
  // server replay the already-accepted report (200 {report, idempotentReplay:true})
  // instead of inserting a second row when the same publish is retried. 201 and
  // 200 below are BOTH acceptances.
  const headers: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''}`,
    'Content-Type': 'application/json',
  };
  if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  const res = await fetch(`${apiBase()}${ENDPOINTS.portalReports}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new ApiError(401, 'This token is not valid or has expired.');
  if (res.status === 422) throw new ApiError(422, 'The report was rejected as invalid — check the highlighted fields.');
  if (!res.ok) throw new ApiError(res.status, `Publishing failed (${res.status}). Try again.`);
  // Real API wire format (Role 3): 201 { report: ShopReport }. The bare form is
  // accepted for backwards compatibility with the MSW fixtures' earlier shape.
  const wire = (await res.json()) as unknown;
  const report = typeof wire === 'object' && wire !== null && 'report' in wire
    ? (wire as { report: unknown }).report
    : wire;
  const parsed = ShopReportSchema.safeParse(report);
  if (!parsed.success) throw new ApiError(502, 'Portal responded with an unexpected report shape.');
  return parsed.data;
}

/**
 * Stable Idempotency-Key for one publish attempt of a given draft body (F02/F15
 * handoff): derived from the draft id + a hash of the exact published content, so
 * a RETRY of the same publish reuses the SAME key (server replays instead of
 * double-inserting) while a real edit (new content revision) yields a new key.
 * Content-addressed, so it needs no extra storage and survives reloads.
 */
export function idempotencyKeyFor(draftId: string, input: ShopReportInput): string {
  const json = JSON.stringify(input);
  // FNV-1a 32-bit — sync, dependency-free, ample for a handful of revisions per draft.
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${draftId}-${h.toString(16).padStart(8, '0')}`;
}

/** Public snapshot of recent attributed reports; the portal filters it to this shop (read-only). */
export async function fetchRecentReports(): Promise<ShopReport[]> {
  const res = await fetch(`${apiBase()}${ENDPOINTS.reportsRecent}`);
  if (!res.ok) throw new ApiError(res.status, `Could not load published reports (${res.status}).`);
  const data: unknown = await res.json();
  const list = (Array.isArray(data) ? data : (data as { reports?: unknown[] }).reports ?? []) as unknown[];
  return list.map((r) => ShopReportSchema.parse(r));
}

/** Local, offline token sanity check before we even hit the network. */
export function storedTokenState(): { token: string; shopId: string; expiresAtMs: number } | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return null;
  const parsed = parseToken(token);
  if (!parsed || tokenExpired(parsed)) return null;
  return { token, shopId: parsed.shopId, expiresAtMs: parsed.expiresAtMs };
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export type { Shop, ShopReport, HotPattern };
