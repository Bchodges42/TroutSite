import { useSyncExternalStore } from 'react';

export const RECENT_SEARCH_KEY = 'trout-recent-waters-v1';
const LIMIT = 6;
const ID = /^[a-z0-9][a-z0-9-]{0,127}$/i;
const EMPTY: string[] = [];
let snapshot: string[] = EMPTY;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

function parse(raw: string | null): string[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string' && ID.test(id)))].slice(0, LIMIT)
      : [];
  } catch { return []; }
}

/** Device-local IDs only. Blocked storage retains the current session's choices. */
export function recentSelections(): string[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (raw !== lastRaw) { snapshot = parse(raw); lastRaw = raw; }
  } catch { /* use the session snapshot */ }
  return snapshot;
}

function save(ids: string[]): void {
  snapshot = ids;
  try {
    const raw = JSON.stringify(ids);
    window.localStorage.setItem(RECENT_SEARCH_KEY, raw);
    lastRaw = raw;
  } catch { /* blocked/quota storage does not break search */ }
  for (const listener of listeners) listener();
}

export function rememberSelection(id: string): void {
  if (ID.test(id)) save([id, ...recentSelections().filter((value) => value !== id)].slice(0, LIMIT));
}

export function clearRecentSelections(): void { save([]); }

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === RECENT_SEARCH_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', sync);
  return () => { listeners.delete(listener); window.removeEventListener('storage', sync); };
}

export function useRecentSelections(): string[] {
  return useSyncExternalStore(subscribe, recentSelections, () => EMPTY);
}
