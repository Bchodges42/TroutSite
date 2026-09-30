// OWNER: ROLE 4. Draft reports live ONLY in the visitor's browser (localStorage), mirroring the
// §1 privacy principle that user content never touches the server until the shop publishes it.
//
// F16 (2026-09-29 audit): drafts are bound to a verified shop identity. Storage is namespaced
// per shop (`trout.admin.drafts.v2.<shopId>`) and every accessor takes the caller's shopId, so
// a shared browser can never leak one shop's unpublished notes to another — logout RETAINS the
// signing shop's drafts, and the next shop to sign in reads only its own namespace.
//
// Legacy unscoped drafts (pre-F16, stored under the old global key `trout.admin.drafts.v1`)
// carry no shopId, so ownership can no longer be established. POLICY (explicit, not inferred):
//   1. They are NEVER auto-claimed, auto-migrated, or shown to whoever logs in next — that
//      would re-create the F16 leak (Shop B reading Shop A's notes).
//   2. They are quarantined: their content is never rendered anywhere in the portal. The only
//      surfacing is an existence/count disclosure in "My reports" with an explicit one-time
//      Discard action (countLegacyDrafts + clearLegacyDrafts) so the browser can be cleaned up
//      deliberately. If the original shop returns, it must re-paste its notes — unverifiable
//      attribution is worth more broken than silently wrong.
import type { HotPattern } from '@trout/contracts';

export interface ReportDraft {
  id: string;
  /** The verified shop this draft belongs to (set by saveDraft, never trusted from storage alone). */
  shopId: string;
  /** null = general report not tied to one stream */
  streamId: string | null;
  date: string;
  body: string;
  hotPatterns: HotPattern[];
  photoUrl: string;
  updatedAt: string;
}

const LEGACY_STORAGE_KEY = 'trout.admin.drafts.v1';

function storageKey(shopId: string): string {
  // Shop ids are contract slugs; sanitize anyway so a hostile id can never craft
  // storage keys outside the drafts namespace (defense in depth — the verified
  // shopId also guards every record, see read()).
  const safe = shopId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `trout.admin.drafts.v2.${safe}`;
}

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDraft(shopId: string): ReportDraft {
  return {
    id: uid(),
    shopId,
    streamId: null,
    date: todayIso(),
    body: '',
    hotPatterns: [],
    photoUrl: '',
    updatedAt: new Date().toISOString(),
  };
}

interface StoredDraft {
  id?: unknown;
  shopId?: unknown;
}

/** Only records that carry this exact shopId are returned — storage contents are never trusted. */
function read(shopId: string): ReportDraft[] {
  try {
    const raw = localStorage.getItem(storageKey(shopId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredDraft[]).filter(
      (d): d is ReportDraft => typeof d === 'object' && d !== null && d.shopId === shopId && typeof d.id === 'string',
    );
  } catch {
    return [];
  }
}

function write(shopId: string, drafts: ReportDraft[]): void {
  localStorage.setItem(storageKey(shopId), JSON.stringify(drafts));
}

export function listDrafts(shopId: string): ReportDraft[] {
  return read(shopId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDraft(shopId: string, id: string): ReportDraft | undefined {
  return read(shopId).find((d) => d.id === id);
}

export function saveDraft(shopId: string, draft: ReportDraft): void {
  // Binding happens here, at the only write path: a draft always belongs to the
  // namespace it is saved under, regardless of what the caller passed in.
  const drafts = read(shopId);
  const next: ReportDraft = { ...draft, shopId, updatedAt: new Date().toISOString() };
  const i = drafts.findIndex((d) => d.id === draft.id);
  if (i >= 0) drafts[i] = next;
  else drafts.push(next);
  write(shopId, drafts);
}

export function deleteDraft(shopId: string, id: string): void {
  write(shopId, read(shopId).filter((d) => d.id !== id));
}

// --- Legacy (pre-F16, unscoped) drafts: quarantine + explicit one-time clear. ---

/** Count of quarantined legacy drafts, for the one-time disclosure in "My reports". */
export function countLegacyDrafts(): number {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/** Explicit one-time removal of quarantined legacy drafts (user-confirmed in the UI). */
export function clearLegacyDrafts(): void {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
