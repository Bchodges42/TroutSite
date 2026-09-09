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
  /**
   * Epoch millis the payload was fetched from the network (not when read from
   * cache). Null only for the bundled catalog fallback (useStreamsCatalog):
   * those rows were never fetched from any host.
   */
  fetchedAt: number | null;
  /** True when this value came from a successful network fetch while online. */
  live: boolean;
}

/** Network attempts must never hang the snapshot path (B10): cap at 8 s. */
function fetchTimeoutSignal(): AbortSignal | undefined {
  try {
    return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(8_000)
      : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchSnapshot<T>(
  url: string,
  schema: ZodType<T>,
  ttlMinutes: number,
): Promise<SnapshotResult<T>> {
  const requestUrl = resolveUrl(url);
  // Known-offline: don't wait for the radio to fail — serve the stored
  // snapshot immediately and report it honestly as not-live.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = await readCached<T>(url, schema);
    if (cached) return cached;
    throw new Error(`offline and no cached snapshot for ${requestUrl}`);
  }
  try {
    const res = await fetch(requestUrl, {
      headers: { accept: 'application/json' },
      signal: fetchTimeoutSignal(),
    });
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
    const cached = await readCached<T>(url, schema);
    if (cached) return cached;
    throw networkError;
  }
}

/** Validate-and-serve the stored snapshot, or null (B10 fetch-order helper). */
async function readCached<T>(url: string, schema: ZodType<T>): Promise<SnapshotResult<T> | null> {
  const stored = await db.snapshots.get(url);
  if (!stored) return null;
  const parsed = schema.safeParse(stored.data);
  return parsed.success ? { data: parsed.data, fetchedAt: stored.fetchedAt, live: false } : null;
}

/** Read-only peek at a stored snapshot, for pre-render displays ("last known"). */
export async function readCachedSnapshot<T>(url: string, schema: ZodType<T>): Promise<SnapshotResult<T> | null> {
  const cached = await db.snapshots.get(url);
  if (!cached) return null;
  const parsed = schema.safeParse(cached.data);
  return parsed.success ? { data: parsed.data, fetchedAt: cached.fetchedAt, live: false } : null;
}
