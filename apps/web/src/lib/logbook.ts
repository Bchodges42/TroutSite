import Dexie from 'dexie';
import { db, type LogbookEntry, type PhotoRecord } from './db';
import { attachPhotoToEntry, deletePhoto, deletePhotosForEntry } from './photos';
import { metricTimestamp, type ConditionSnapshot } from '@trout/contracts';

/**
 * Logbook store (scope 7): entries live ONLY in the visitor's IndexedDB.
 * These helpers are UI-independent so Vitest can exercise them with
 * fake-indexeddb — same code path the page uses.
 *
 * v2 (ADR 0012): full editing, photo attachments, a capture-once conditions
 * snapshot, and a versioned export/import that still reads v1 files. Photos
 * are local-only and leave the device ONLY inside an explicitly labeled full
 * backup. Nothing here ever uploads or syncs.
 */

export const LOGBOOK_NOTE = 'Stored only on this device — never uploaded, never synced.';

export type { LogbookEntry };

export async function listEntries(): Promise<LogbookEntry[]> {
  const all = await db.logbook.toArray();
  return all.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** The conditions snapshot frozen at save time, with its own observation time. */
export interface ConditionsCapture {
  snapshot: unknown;
  observedAt: number;
}

/** Everything the entry form can set — one shape for create and edit. */
export interface EntryDraft {
  streamId?: string;
  streamName: string;
  /** YYYY-MM-DD */
  date: string;
  notes?: string;
  flies?: string[];
  time?: string;
  durationMinutes?: number;
  species?: string[];
  technique?: string;
  caughtCount?: number;
  releasedCount?: number;
  blankTrip?: boolean;
  photoIds?: string[];
  entryKind?: 'trip-log' | 'personal-observation';
  conditions?: ConditionsCapture;
}

/** Newest measured clock. Unknown age stays unknown, never replaced by fetch/save time. */
export function conditionsCaptureFrom(snapshot: ConditionSnapshot): ConditionsCapture {
  let observedAt = Number.NaN;
  for (const r of snapshot.readings ?? []) {
    for (const metric of ['cfs', 'tempC', 'heightFt', 'reservoirLevelFt'] as const) {
      if (typeof r[metric] !== 'number' || !Number.isFinite(r[metric])) continue;
      const ts = Date.parse(metricTimestamp(r, metric));
      if (Number.isFinite(ts) && (!Number.isFinite(observedAt) || ts > observedAt)) observedAt = ts;
    }
  }
  return { snapshot, observedAt };
}

export async function addEntry(input: EntryDraft): Promise<number> {
  return db.transaction('rw', db.logbook, db.photos, async () => {
  const now = Date.now();
  const row = compactSanitized(sanitizeDraft(input));
  const id = await db.logbook.add({
    notes: '',
    flies: [],
    ...row,
    streamName: input.streamName,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  });
  await attachPhotos(id, input.photoIds);
  return id;
  });
}

/**
 * Full edit: `draft` represents the whole new state, so an absent optional
 * field CLEARS it (the edit form always submits every field). The conditions
 * snapshot is capture-once — a capture passed here lands only when the stored
 * entry has none; a later refresh never rewrites what the site showed.
 */
export async function updateEntry(id: number, draft: EntryDraft, capture?: ConditionsCapture): Promise<void> {
  return db.transaction('rw', db.logbook, db.photos, async () => {
  const existing = await db.logbook.get(id);
  if (!existing) throw new Error(`No logbook entry ${id}`);
  const sanitized = sanitizeDraft(draft);
  const next = { ...existing } as Record<string, unknown>;
  for (const [key, value] of Object.entries(sanitized)) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  next.streamName = draft.streamName;
  next.date = draft.date;
  next.createdAt = existing.createdAt;
  next.updatedAt = Date.now();
  // Capture-once: whatever is already stored wins — a live capture lands only
  // on the first save, and a later refresh never rewrites the snapshot.
  if (existing.conditionsSnapshot !== undefined) {
    next.conditionsSnapshot = existing.conditionsSnapshot;
    next.conditionsObservedAt = existing.conditionsObservedAt;
  } else if (capture) {
    next.conditionsSnapshot = capture.snapshot;
    if (Number.isFinite(capture.observedAt)) next.conditionsObservedAt = capture.observedAt;
  }
  await db.logbook.put(next as unknown as LogbookEntry);
  await attachPhotos(id, draft.photoIds);
  for (const photoId of existing.photoIds ?? []) {
    if (!draft.photoIds?.includes(photoId)) {
      const photo = await db.photos.get(photoId);
      if (photo?.logEntryId === id) await db.photos.delete(photoId);
    }
  }
  });
}

export function deleteEntry(id: number): Promise<void> {
  return db.logbook.delete(id);
}

/** Removing an entry removes its photo blobs too — nothing orphans in the photos store. */
export async function deleteEntryAndPhotos(id: number): Promise<void> {
  return db.transaction('rw', db.logbook, db.photos, async () => {
  await deletePhotosForEntry(id);
  await db.logbook.delete(id);
  });
}

/** Delete the photo record and prune the id from the entry's list. */
export async function removePhotoFromEntry(entryId: number, photoId: string): Promise<void> {
  return db.transaction('rw', db.logbook, db.photos, async () => {
  const entry = await db.logbook.get(entryId);
  if (entry?.photoIds?.includes(photoId)) {
    await db.logbook.put({ ...entry, photoIds: entry.photoIds.filter((p) => p !== photoId), updatedAt: Date.now() });
  }
  const photo = await db.photos.get(photoId);
  if (photo?.logEntryId === entryId) await deletePhoto(photoId);
  });
}

/**
 * Staged photos the visitor uploaded but never saved into an entry (form
 * dismissed, tab closed) are swept so the photos store cannot fill with
 * orphans. Committed photos always carry a logEntryId and are never touched.
 */
export async function sweepUnattachedPhotos(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = Date.now() - maxAgeMs;
  const orphans = (await db.photos.toArray()).filter((p) => p.logEntryId === undefined && p.createdAt < cutoff);
  await Promise.all(orphans.map((p) => deletePhoto(p.id)));
  return orphans.length;
}

async function attachPhotos(entryId: number, photoIds?: string[]): Promise<void> {
  for (const photoId of photoIds ?? []) await attachPhotoToEntry(photoId, entryId);
}

// ── sanitizing (shared by add/update/import — the file path is untrusted) ──

function sanitizeDraft(input: EntryDraft): Partial<Record<keyof LogbookEntry, unknown>> {
  return {
    streamId: input.streamId,
    notes: input.notes ?? '',
    flies: sanitizeStringArray(input.flies),
    time: sanitizeTime(input.time),
    durationMinutes: optInt(input.durationMinutes, 1, 10_080),
    species: sanitizeStringArray(input.species),
    technique: optText(input.technique),
    caughtCount: optInt(input.caughtCount, 0, 100_000),
    releasedCount: optInt(input.releasedCount, 0, 100_000),
    blankTrip: typeof input.blankTrip === 'boolean' ? input.blankTrip : undefined,
    photoIds: sanitizeStringArray(input.photoIds),
    entryKind:
      input.entryKind === 'personal-observation' || input.entryKind === 'trip-log' ? input.entryKind : undefined,
    conditionsSnapshot: input.conditions?.snapshot ?? undefined,
    conditionsObservedAt: input.conditions && Number.isFinite(input.conditions.observedAt) ? input.conditions.observedAt : undefined,
  };
}

function compactSanitized(sanitized: Partial<Record<keyof LogbookEntry, unknown>>): Partial<LogbookEntry> {
  const row: Partial<LogbookEntry> = {};
  for (const [key, value] of Object.entries(sanitized)) {
    if (value !== undefined) (row as Record<string, unknown>)[key] = value;
  }
  return row;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

function optText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function optInt(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  return rounded >= min && rounded <= max ? rounded : undefined;
}

function sanitizeTime(value: unknown): string | undefined {
  return typeof value === 'string' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(value) ? value : undefined;
}

// ── search + filters ──

export interface EntryFilter {
  /** Free text: water name, streamId, species, flies, technique, notes. */
  query?: string;
  /** Exact (case-insensitive) species match. */
  species?: string;
  /** YYYY-MM-DD inclusive bounds. */
  from?: string;
  to?: string;
}

export function filterEntries(entries: LogbookEntry[], filter: EntryFilter): LogbookEntry[] {
  const tokens = (filter.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const species = filter.species?.trim().toLowerCase();
  return entries.filter((e) => {
    if (filter.from && e.date < filter.from) return false;
    if (filter.to && e.date > filter.to) return false;
    if (species && !(e.species ?? []).some((s) => s.toLowerCase() === species)) return false;
    if (tokens.length > 0) {
      const haystack = [
        e.streamName,
        e.streamId ?? '',
        e.technique ?? '',
        e.notes ?? '',
        ...(e.species ?? []),
        ...(e.flies ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!tokens.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}

// ── local summaries ──

export interface LogbookSummary {
  totalTrips: number;
  blankTrips: number;
  /** Entries carrying a duration — the basis for hours on the water. */
  effortEntries: number;
  effortHours: number;
  entriesWithRecordedCatch: number;
  /** Effort entries that record no caughtCount and are not blank — absence of a recorded catch is NOT zero catch. */
  entriesWithoutCatchRecorded: number;
  caughtTotal: number;
  releasedTotal: number;
  speciesTally: { species: string; count: number }[];
}

export function summarizeEntries(entries: LogbookEntry[]): LogbookSummary {
  entries = entries.filter((entry) => entry.entryKind !== 'personal-observation');
  const tally = new Map<string, { species: string; count: number }>();
  let blankTrips = 0;
  let effortEntries = 0;
  let effortMinutes = 0;
  let entriesWithRecordedCatch = 0;
  let entriesWithoutCatchRecorded = 0;
  let caughtTotal = 0;
  let releasedTotal = 0;

  for (const e of entries) {
    if (e.blankTrip) blankTrips += 1;
    if (typeof e.durationMinutes === 'number') {
      effortEntries += 1;
      effortMinutes += e.durationMinutes;
    }
    if (typeof e.caughtCount === 'number') {
      entriesWithRecordedCatch += 1;
      caughtTotal += e.caughtCount;
    } else if (!e.blankTrip) {
      entriesWithoutCatchRecorded += 1;
    }
    if (typeof e.releasedCount === 'number') releasedTotal += e.releasedCount;
    for (const raw of e.species ?? []) {
      const key = raw.toLowerCase();
      const hit = tally.get(key);
      if (hit) hit.count += 1;
      else tally.set(key, { species: raw, count: 1 });
    }
  }

  return {
    totalTrips: entries.length,
    blankTrips,
    effortEntries,
    effortHours: Math.round((effortMinutes / 60) * 10) / 10,
    entriesWithRecordedCatch,
    entriesWithoutCatchRecorded,
    caughtTotal,
    releasedTotal,
    speciesTally: [...tally.values()].sort((a, b) => b.count - a.count || a.species.localeCompare(b.species)),
  };
}

// ── export / import (ADR 0012 decision 6: v2 out, v1+v2 in) ──

const EXPORT_FORMAT = 'trout-logbook';
const FULL_BACKUP_FORMAT = 'trout-logbook-full-backup';

export interface LogbookExport {
  format: typeof EXPORT_FORMAT;
  version: 2;
  exportedAt: string;
  entries: LogbookEntry[];
}

/** v2 export is entries-only; photo blobs travel ONLY in the full backup. */
export async function buildExport(): Promise<LogbookExport> {
  return {
    format: EXPORT_FORMAT,
    version: 2,
    exportedAt: new Date().toISOString(),
    entries: await db.logbook.toArray(),
  };
}

interface FullBackupPhoto {
  id: string;
  logEntryId?: number;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: number;
  /** base64 of the (already EXIF-stripped) blob. */
  data: string;
}

export interface LogbookFullBackup {
  format: typeof FULL_BACKUP_FORMAT;
  version: 2;
  includesPhotos: true;
  exportedAt: string;
  entries: LogbookEntry[];
  photos: FullBackupPhoto[];
}

/** Explicitly labeled full backup — the only export that carries photos. */
export async function buildFullBackup(): Promise<LogbookFullBackup> {
  const [entries, photos] = await db.transaction('r', db.logbook, db.photos,
    () => Promise.all([db.logbook.toArray(), db.photos.toArray()]));
  return {
    format: FULL_BACKUP_FORMAT,
    version: 2,
    includesPhotos: true,
    exportedAt: new Date().toISOString(),
    entries,
    photos: await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        logEntryId: p.logEntryId,
        mime: p.mime,
        bytes: p.bytes,
        width: p.width,
        height: p.height,
        createdAt: p.createdAt,
        data: await blobToBase64(p.blob),
      })),
    ),
  };
}

/** Strict-ish import: refuses foreign payloads, sanitizes every row, keeps ids out,
 *  and never duplicates a trip that is already in the book (same water/date/notes/createdAt). */
export async function importFromExport(raw: unknown): Promise<number> {
  const payload = raw as { format?: string; version?: number; entries?: unknown; photos?: unknown };
  if ((payload?.format !== EXPORT_FORMAT && payload?.format !== FULL_BACKUP_FORMAT) || !Array.isArray(payload.entries)) {
    throw new Error('Not a trout logbook export');
  }
  if (payload.version !== undefined && payload.version !== 1 && payload.version !== 2) {
    throw new Error(`Unsupported logbook export version: ${String(payload.version)}`);
  }
  if (payload.format === FULL_BACKUP_FORMAT) return importFullBackup(payload);
  const now = Date.now();
  const rows: LogbookEntry[] = [];
  for (const e of payload.entries) {
    const entry = (e ?? {}) as Partial<LogbookEntry>;
    if (typeof entry.streamName !== 'string' || entry.streamName.trim() === '') continue;
    if (!validEntryDate(entry.date)) continue;
    const sanitized = compactSanitized(
      sanitizeDraft({
        streamId: typeof entry.streamId === 'string' ? entry.streamId : undefined,
        streamName: entry.streamName,
        date: entry.date,
        notes: typeof entry.notes === 'string' ? entry.notes : '',
        flies: Array.isArray(entry.flies) ? entry.flies.filter((f): f is string => typeof f === 'string') : [],
        time: entry.time,
        durationMinutes: entry.durationMinutes,
        species: entry.species,
        technique: entry.technique,
        caughtCount: entry.caughtCount,
        releasedCount: entry.releasedCount,
        blankTrip: entry.blankTrip,
        // Entries-only backups contain no blobs and cannot authorize linking
        // to another entry's existing photo ID on the destination device.
        photoIds: undefined,
        entryKind: entry.entryKind,
        conditions:
          entry.conditionsSnapshot !== undefined && entry.conditionsSnapshot !== null
            ? { snapshot: entry.conditionsSnapshot, observedAt: typeof entry.conditionsObservedAt === 'number' && Number.isFinite(entry.conditionsObservedAt) ? entry.conditionsObservedAt : Number.NaN }
            : undefined,
      }),
    );
    rows.push({
      notes: '',
      flies: [],
      ...sanitized,
      streamName: entry.streamName,
      date: entry.date,
      tripId: typeof entry.tripId === 'string' ? entry.tripId : undefined,
      createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : now,
      updatedAt: now,
    });
  }
  return bulkAddDeduped(rows);
}

async function importFullBackup(payload: { photos?: unknown; entries?: unknown }): Promise<number> {
  const rows: Array<{ originalId?: number; row: LogbookEntry }> = [];
  for (const e of Array.isArray(payload.entries) ? payload.entries : []) {
    const entry = (e ?? {}) as Partial<LogbookEntry>;
    if (typeof entry.streamName !== 'string' || entry.streamName.trim() === '') continue;
    if (!validEntryDate(entry.date)) continue;
    rows.push({ originalId: entry.id, row: {
      tripId: typeof entry.tripId === 'string' ? entry.tripId : undefined,
      streamId: typeof entry.streamId === 'string' ? entry.streamId : undefined,
      streamName: entry.streamName,
      date: entry.date,
      notes: typeof entry.notes === 'string' ? entry.notes : '',
      flies: Array.isArray(entry.flies) ? entry.flies.filter((f): f is string => typeof f === 'string') : [],
      createdAt: typeof entry.createdAt === 'number' && Number.isFinite(entry.createdAt) ? entry.createdAt : Date.now(),
      updatedAt: Date.now(),
      // Keep a captured snapshot even when its observation age was unknown.
      ...(entry.conditionsSnapshot !== undefined && entry.conditionsSnapshot !== null
        ? { conditionsSnapshot: entry.conditionsSnapshot, ...(typeof entry.conditionsObservedAt === 'number' && Number.isFinite(entry.conditionsObservedAt) ? { conditionsObservedAt: entry.conditionsObservedAt } : {}) }
        : {}),
      ...(typeof entry.time === 'string' ? { time: sanitizeTime(entry.time) } : {}),
      ...(typeof entry.durationMinutes === 'number' ? { durationMinutes: optInt(entry.durationMinutes, 1, 10_080) } : {}),
      ...(Array.isArray(entry.species) ? { species: entry.species.filter((s): s is string => typeof s === 'string') } : {}),
      ...(typeof entry.technique === 'string' ? { technique: entry.technique } : {}),
      ...(typeof entry.caughtCount === 'number' ? { caughtCount: optInt(entry.caughtCount, 0, 100_000) } : {}),
      ...(typeof entry.releasedCount === 'number' ? { releasedCount: optInt(entry.releasedCount, 0, 100_000) } : {}),
      ...(typeof entry.blankTrip === 'boolean' ? { blankTrip: entry.blankTrip } : {}),
      ...(Array.isArray(entry.photoIds) ? { photoIds: entry.photoIds.filter((p): p is string => typeof p === 'string') } : {}),
      ...(entry.entryKind === 'personal-observation' || entry.entryKind === 'trip-log' ? { entryKind: entry.entryKind } : {}),
    } });
  }
  const photos = new Map<string, { record: PhotoRecord; data: string }>();
  for (const p of Array.isArray(payload.photos) ? payload.photos : []) {
    const photo = (p ?? {}) as Partial<FullBackupPhoto>;
    if (typeof photo.id !== 'string' || typeof photo.data !== 'string' ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(photo.mime ?? '')) continue;
    try {
      const blob = base64ToBlob(photo.data, photo.mime!);
      photos.set(photo.id, { data: btoa(atob(photo.data)), record: {
        id: photo.id,
        logEntryId: typeof photo.logEntryId === 'number' ? photo.logEntryId : undefined,
        blob,
        mime: photo.mime!,
        bytes: blob.size,
        width: typeof photo.width === 'number' ? photo.width : undefined,
        height: typeof photo.height === 'number' ? photo.height : undefined,
        createdAt: typeof photo.createdAt === 'number' ? photo.createdAt : Date.now(),
      } });
    } catch {
      // A corrupt photo must not block restoring the entries around it.
    }
  }
  // Restore the relationships using the destination's IDs, atomically. A
  // backup's photo ID is a hint, never permission to replace another photo.
  return db.transaction('rw', db.logbook, db.photos, async () => {
    const existing = new Map((await db.logbook.toArray()).map((row) => [rowKey(row), row]));
    let added = 0;
    for (const { originalId, row } of rows) {
      const key = rowKey(row);
      let target = existing.get(key);
      if (!target) {
        const id = await db.logbook.add({ ...row, photoIds: [] });
        target = { ...row, id, photoIds: [] };
        existing.set(key, target);
        added += 1;
      }
      const ids = new Set(target.photoIds ?? []);
      for (const oldId of row.photoIds ?? []) {
        const imported = photos.get(oldId);
        if (!imported || (imported.record.logEntryId !== undefined && imported.record.logEntryId !== originalId)) continue;
        let candidate = oldId;
        let suffix = 0;
        for (;;) {
          const previous = await db.photos.get(candidate);
          if (!previous) {
            await db.photos.add({ ...imported.record, id: candidate, logEntryId: target.id });
            break;
          }
          if (previous.logEntryId === target.id && previous.mime === imported.record.mime &&
            await Dexie.waitFor(blobToBase64(previous.blob)) === imported.data) break;
          candidate = `${oldId}:restore:${target.id}:${suffix++}`;
        }
        ids.add(candidate);
      }
      target = { ...target, photoIds: [...ids] };
      await db.logbook.put(target);
      existing.set(key, target);
    }
    return added;
  });
}

function validEntryDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Same water + date + notes + original createdAt ⇒ the same trip; skip instead of duplicating. */
async function bulkAddDeduped(rows: LogbookEntry[]): Promise<number> {
  return db.transaction('rw', db.logbook, async () => {
  const existing = new Set((await db.logbook.toArray()).map(rowKey));
  const fresh = rows.filter((row) => {
    const key = rowKey(row);
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });
  if (fresh.length > 0) await db.logbook.bulkAdd(fresh);
  return fresh.length;
  });
}

function rowKey(row: LogbookEntry): string {
  return JSON.stringify([row.streamId ?? '', row.streamName, row.date, row.notes, row.createdAt ?? '',
    row.tripId ?? '', row.time ?? '', row.flies ?? [], row.species ?? [], row.durationMinutes ?? null,
    row.technique ?? '', row.caughtCount ?? null, row.releasedCount ?? null, row.blankTrip ?? null, row.entryKind ?? '']);
}

/** Download helper kept out of components so tests only exercise pure data. */
export function downloadExport(exported: LogbookExport): void {
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `trout-logbook-${exported.exportedAt.slice(0, 10)}.json`);
}

export function downloadFullBackup(backup: LogbookFullBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `trout-logbook-full-backup-${backup.exportedAt.slice(0, 10)}.json`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function blobToBase64(blob: Blob): Promise<string> {
  // blob.arrayBuffer() everywhere that has it; FileReader as the jsdom/older-engine
  // path. This must work wherever the logbook does — including tests.
  if (typeof blob.arrayBuffer === 'function') {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read photo blob'));
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
