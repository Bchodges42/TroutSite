import { db, type DownloadManifestRecord, type DownloadSectionState } from './db';

/**
 * Offline download manifests (ADR 0012): the Dexie-side bookkeeping for
 * user-managed packs. This store records what a pack must contain and what
 * has been verified present; pinning/unpinning shared assets inside
 * Cache-Storage is the service-worker layer's job (separate lease). Removing
 * a manifest here never deletes personal data, and shared assets pinned by
 * another pack are not removed until its manifest says so.
 */

export function waterManifestId(waterId: string): string {
  return `water:${waterId}`;
}

export function tripManifestId(tripId: string): string {
  return `trip:${tripId}`;
}

export async function putManifest(
  input: Omit<DownloadManifestRecord, 'createdAt' | 'updatedAt'>,
): Promise<DownloadManifestRecord> {
  const existing = await db.downloadManifests.get(input.id);
  const now = Date.now();
  const record: DownloadManifestRecord = { ...input, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await db.downloadManifests.put(record);
  return record;
}

export async function getManifest(id: string): Promise<DownloadManifestRecord | undefined> {
  return db.downloadManifests.get(id);
}

export async function listManifests(): Promise<DownloadManifestRecord[]> {
  const all = await db.downloadManifests.toArray();
  return all.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
}

/** Removing a pack record only removes bookkeeping — assets are the SW layer's call. */
export async function deleteManifest(id: string): Promise<void> {
  await db.downloadManifests.delete(id);
}

export async function markSectionReady(id: string, sectionKey: string, ready: boolean, bytes?: number): Promise<void> {
  return db.transaction('rw', db.downloadManifests, async () => {
  const manifest = await db.downloadManifests.get(id);
  if (!manifest) return;
  const sections = manifest.sections.map((s) =>
    s.key === sectionKey ? { ...s, ready, bytes: bytes ?? s.bytes } : s,
  );
  if (JSON.stringify(sections) === JSON.stringify(manifest.sections)) return;
  await db.downloadManifests.put({ ...manifest, sections, updatedAt: Date.now() });
  });
}

export interface PackReadiness {
  /** Every required section verified present — only then may the pack report ready. */
  requiredReady: boolean;
  /** At least one section (required or optional) is present. */
  anyReady: boolean;
  /** Required sections all present AND at least one optional section missing. */
  partialOptional: boolean;
  missingRequired: string[];
  missingOptional: string[];
}

/** Pure readiness math: readiness is verified per section, never assumed. */
export function computePackReadiness(sections: DownloadSectionState[]): PackReadiness {
  const missingRequired = sections.filter((s) => s.required && !s.ready).map((s) => s.key);
  const missingOptional = sections.filter((s) => !s.required && !s.ready).map((s) => s.key);
  const anyReady = sections.some((s) => s.ready);
  return {
    requiredReady: sections.length > 0 && missingRequired.length === 0,
    anyReady,
    partialOptional: missingRequired.length === 0 && missingOptional.length > 0,
    missingRequired,
    missingOptional,
  };
}

/**
 * Shared assets still pinned by another manifest. Pure so the SW layer can
 * reuse it when a pack is removed without evicting assets another pack needs.
 */
export function assetsStillPinnedElsewhere(removing: DownloadManifestRecord, others: DownloadManifestRecord[]): string[] {
  const kept = new Set<string>();
  for (const other of others) {
    if (other.id === removing.id) continue;
    for (const url of other.assetUrls) kept.add(url);
  }
  return removing.assetUrls.filter((url) => !kept.has(url));
}
