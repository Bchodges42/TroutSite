import type { ZodType } from 'zod';
import { db, type SnapshotRecord } from './db';
import { resolveUrl } from './endpoints';

/**
 * Offline-first fetch for same-origin snapshot JSON (non-negotiable #3).
 *
 * Online: fetch → schema-validate → store in Dexie → serve as live data.
 * Offline / failed / invalid: serve the last stored snapshot (even if past its
 * TTL), else recover the service worker's cached copy (T2-42/F03), and report
 * `live: false` so the UI can render "Offline · last known …".
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
   * cache). Null only for the bundled catalog fallback (useStreamsCatalog) or
   * a service-worker cache recovery: those rows were never fetched from any
   * host by THIS device.
   */
  fetchedAt: number | null;
  /** True when this value came from a successful network fetch while online. */
  live: boolean;
  /**
   * F32: whether this call's successful network fetch was persisted to Dexie.
   * False (alongside `live: true`) means the visitor got current data but it
   * could not be stored for offline reuse (e.g. storage quota). Absent when no
   * network fetch was attempted or the served value came from a cache.
   */
  persisted?: boolean;
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
  // snapshot immediately and report it honestly as not-live. F03: the
  // recovery tier is the SAME one the failed-network path uses below (Dexie,
  // then the service worker's caches) — an installed shell in airplane mode
  // with an empty Dexie store must still find its precached content.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = await readCached<T>(url, schema);
    if (cached) return cached;
    const swCached = await readServiceWorkerCache<T>(url, schema);
    if (swCached) return swCached;
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
    // F32: persistence is best-effort and must never outrank the response —
    // a quota/IndexedDB write failure keeps the current data flowing (live)
    // and only reports that offline reuse was lost. Falling back to the old
    // cached copy here would present stale data as the answer.
    let persisted = true;
    try {
      await db.snapshots.put(record);
    } catch (cacheError) {
      persisted = false;
      console.warn(
        `snapshot not persisted (offline reuse lost) for ${requestUrl}:`,
        cacheError,
      );
    }
    // A 200 can come from the service-worker/HTTP cache while offline; the
    // freshness chip must then read "Offline · last known", not "Live".
    return { data, fetchedAt, live: navigator.onLine, persisted };
  } catch (networkError) {
    const cached = await readCached<T>(url, schema);
    if (cached) return cached;
    // T2-42/F03 recovery tier: the service worker's caches are independent
    // of Dexie — a device whose indexed database was cleared (or whose Dexie
    // write never landed) can still have the SW-cached copy. Serve it with
    // live:false rather than "not on this device".
    const swCached = await readServiceWorkerCache<T>(url, schema);
    if (swCached) return swCached;
    throw networkError;
  }
}

/**
 * T2-42/F03 recovery tier: look the URL up in the service worker's caches.
 * Workbox precache entries for unhashed assets (the content pack, hatch
 * charts — see the precache globs in vite.shared.ts) are stored under
 * `<url>?__WB_REVISION__=<hash>`, so an exact-key match misses them in a real
 * installed browser; retry matching with the search string ignored. The
 * result reports `live: false` — provenance stays honest.
 */
async function readServiceWorkerCache<T>(
  url: string,
  schema: ZodType<T>,
): Promise<SnapshotResult<T> | null> {
  try {
    const requestUrl = resolveUrl(url);
    const exact = await caches?.match(requestUrl);
    const hit = exact && exact.ok ? exact : await caches?.match(requestUrl, { ignoreSearch: true });
    if (hit && hit.ok) {
      const data = schema.parse(await hit.json());
      return { data, fetchedAt: null, live: false };
    }
  } catch {
    /* no Cache Storage, no match, or a stale entry — fall through */
  }
  return null;
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
