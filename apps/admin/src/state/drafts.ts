// OWNER: ROLE 4. Draft reports live ONLY in the visitor's browser (localStorage), mirroring the
// §1 privacy principle that user content never touches the server until the shop publishes it.
import type { HotPattern } from '@trout/contracts';

export interface ReportDraft {
  id: string;
  /** null = general report not tied to one stream */
  streamId: string | null;
  date: string;
  body: string;
  hotPatterns: HotPattern[];
  photoUrl: string;
  updatedAt: string;
}

const STORAGE_KEY = 'trout.admin.drafts.v1';

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDraft(): ReportDraft {
  return { id: uid(), streamId: null, date: todayIso(), body: '', hotPatterns: [], photoUrl: '', updatedAt: new Date().toISOString() };
}

function read(): ReportDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ReportDraft[]) : [];
  } catch {
    return [];
  }
}

function write(drafts: ReportDraft[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function listDrafts(): ReportDraft[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDraft(id: string): ReportDraft | undefined {
  return read().find((d) => d.id === id);
}

export function saveDraft(draft: ReportDraft): void {
  const drafts = read();
  const next = { ...draft, updatedAt: new Date().toISOString() };
  const i = drafts.findIndex((d) => d.id === draft.id);
  if (i >= 0) drafts[i] = next;
  else drafts.push(next);
  write(drafts);
}

export function deleteDraft(id: string): void {
  write(read().filter((d) => d.id !== id));
}
