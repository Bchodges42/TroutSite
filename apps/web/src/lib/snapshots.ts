import type { ZodType } from 'zod';
import { db, type SnapshotRecord } from './db';
import { resolveUrl } from './endpoints';

/**
 * Offline-first fetch for same-origin snapshot JSON (non-negotiable #3).
 *
 * Online: fetch → schema-validate → store in Dexie → serve as live data.
 * Offline / failed / invalid: serve the last stored snapshot (even if past its
 * TTL) and report `live: false` so the UI can render "Offline · last known …".
 * A response served by the service-worker/HTTP cache while `navigator.onLine`
 * is false also reports `live: false` — the visitor is offline and the chip
 * should say so. No spinner ever blocks this path: the TanStack Query hooks in
 * useSnapshotQuery use `networkMode: 'offlineFirst'` so cached data renders
 * immediately.
 */
export interface SnapshotResult<T> {
  data: T;
  /** Epoch millis the payload was fetched from the network (not when read from cache). */
  fetchedAt: number;
  /** True when this value came from a successful network fetch while online. */
  live: boolean;
}

export async function fetchSnapshot<T>(
  url: string,
  schema: ZodType<T>,
  ttlMinutes: number,
): Promise<SnapshotResult<T>> {
  const requestUrl = resolveUrl(url);
  try {
    const res = await fetch(requestUrl, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${requestUrl}`);
    const data = schema.parse(await res.json());
    const fetchedAt = Date.now();
    const record: SnapshotRecord = {
      url,
      data,
      fetchedAt,
      expiresAt: fetchedAt + ttlMinutes * 60_000,
    };
    await db.snapshots.put(record);
    // A 200 can come from the service-worker/HTTP cache while offline; the
    // freshness chip must then read "Offline · last known", not "Live".
    return { data, fetchedAt, live: navigator.onLine };
  } catch (networkError) {
    const cached = await db.snapshots.get(url);
    if (cached) {
      const parsed = schema.safeParse(cached.data);
      if (parsed.success) {
        return { data: parsed.data, fetchedAt: cached.fetchedAt, live: false };
      }
    }
    throw networkError;
  }
}

/** Read-only peek at a stored snapshot, for pre-render displays ("last known"). */
export async function readCachedSnapshot<T>(url: string, schema: ZodType<T>): Promise<SnapshotResult<T> | null> {
  const cached = await db.snapshots.get(url);
  if (!cached) return null;
  const parsed = schema.safeParse(cached.data);
  return parsed.success ? { data: parsed.data, fetchedAt: cached.fetchedAt, live: false } : null;
}
