import { db, type LogbookEntry } from './db';

/**
 * Logbook store (scope 7): entries live ONLY in the visitor's IndexedDB.
 * These helpers are UI-independent so Vitest can exercise them with
 * fake-indexeddb — same code path the page uses.
 */

export const LOGBOOK_NOTE = 'Stored only on this device — never uploaded, never synced.';

export async function listEntries(): Promise<LogbookEntry[]> {
  const all = await db.logbook.toArray();
  return all.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function addEntry(input: {
  streamId?: string;
  streamName: string;
  date: string;
  notes?: string;
  flies?: string[];
}): Promise<number> {
  const now = Date.now();
  const id = await db.logbook.add({
    streamId: input.streamId,
    streamName: input.streamName,
    date: input.date,
    notes: input.notes ?? '',
    flies: input.flies ?? [],
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export function deleteEntry(id: number): Promise<void> {
  return db.logbook.delete(id);
}

const EXPORT_FORMAT = 'trout-logbook';

export interface LogbookExport {
  format: typeof EXPORT_FORMAT;
  version: 1;
  exportedAt: string;
  entries: LogbookEntry[];
}

export async function buildExport(): Promise<LogbookExport> {
  return {
    format: EXPORT_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: await db.logbook.toArray(),
  };
}

/** Strict-ish import: refuses foreign payloads, sanitizes every row, keeps ids out. */
export async function importFromExport(raw: unknown): Promise<number> {
  const payload = raw as { format?: string; version?: number; entries?: unknown };
  if (payload?.format !== EXPORT_FORMAT || !Array.isArray(payload.entries)) {
    throw new Error('Not a trout logbook export');
  }
  const now = Date.now();
  const rows: LogbookEntry[] = [];
  for (const e of payload.entries) {
    const entry = e as Partial<LogbookEntry>;
    if (typeof entry.streamName !== 'string' || entry.streamName.trim() === '') continue;
    if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) continue;
    rows.push({
      streamId: typeof entry.streamId === 'string' ? entry.streamId : undefined,
      streamName: entry.streamName,
      date: entry.date,
      notes: typeof entry.notes === 'string' ? entry.notes : '',
      flies: Array.isArray(entry.flies) ? entry.flies.filter((f): f is string => typeof f === 'string') : [],
      createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : now,
      updatedAt: now,
    });
  }
  await db.logbook.bulkAdd(rows);
  return rows.length;
}

/** Download helper kept out of components so tests only exercise pure data. */
export function downloadExport(exported: LogbookExport): void {
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trout-logbook-${exported.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
