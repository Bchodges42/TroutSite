import type { GaugeReading } from '@trout/contracts';
import { fetchWaterDataReadings } from '../ingest/usgs-waterdata.js';

export interface GaugeNowEntry {
  reading: GaugeReading;
  /** Epoch ms when the reading was fetched from USGS (not when it was observed). */
  fetchedAt: number;
  /** True when the live fetch failed and a previous reading was served instead. */
  stale: boolean;
}

/** Thrown when the bounded wait queue is full (F14): fail fast, retry shortly. */
export class GaugeNowBusyError extends Error {
  constructor() {
    super('gauge-now: too many concurrent gauge lookups');
    this.name = 'GaugeNowBusyError';
  }
}

export interface GaugeNowCache {
  /**
   * Latest reading for one USGS gauge, or null when the gauge has no current
   * data. Never throws for "no data" — fetch-transport failures throw (the
   * caller degrades to stale), and a full bounded queue throws
   * GaugeNowBusyError (the caller answers 503).
   */
  get(gaugeId: string): Promise<GaugeNowEntry | null>;
}

export interface GaugeNowCacheOptions {
  /** How long a fetched reading is served without refetching (default 10 min). */
  ttlMs?: number;
  /** Per-fetch abort budget (default 8s — this answers a user tap, not a cron). */
  timeoutMs?: number;
  /**
   * F14: maximum simultaneous upstream fetches across ALL distinct gauge ids
   * (default 4). The public route accepts any 8-digit id, so a burst of
   * distinct ids must not become N simultaneous USGS requests.
   */
  maxConcurrentFetches?: number;
  /**
   * F14: maximum get() calls waiting for a fetch slot (default 32). Past this
   * the call fails fast with GaugeNowBusyError — a bounded queue beats an
   * unbounded promise pileup.
   */
  maxQueueDepth?: number;
  /**
   * F14: maximum entries per cache map — fresh readings and negative (no-data)
   * entries share the budget (default 2000). Eviction is oldest-inserted, and
   * already-expired entries are swept first; an arbitrary-id burst cannot grow
   * the maps without bound.
   */
  maxCacheEntries?: number;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  apiKey?: string;
  userAgent?: string;
  now?: () => number;
}

/**
 * Per-gauge on-demand readings behind the map's gauge layer. The whole USGS
 * catalog is far too large to poll on a schedule (the wired-waters pipeline
 * already does that for catalog gauges); this answers ONE gauge when a visitor
 * taps it, with:
 * - a fresh TTL so panning a gauge-dense river doesn't refetch per tap,
 * - in-flight dedupe so double-taps share one request,
 * - a negative cache so dead/no-data gauges can't hammer USGS per tap,
 * - stale-on-error so an upstream blip degrades to slightly-old data instead
 *   of a 500 (gauge readings are context, never a hard dependency),
 * - F14 bounds: a global upstream concurrency cap with a bounded wait queue
 *   (overflow fails fast), and size-capped, expired-entry-evicting caches.
 *
 * LIMITS (documented, in-memory only): this cache lives in ONE server process.
 * Bounds apply per process, evicted state is forgotten, and a restart starts
 * cold. It is abuse mitigation for the public route, not a distributed guard.
 */
export function createGaugeNowCache(options: GaugeNowCacheOptions = {}): GaugeNowCache {
  const ttlMs = options.ttlMs ?? 10 * 60_000;
  const maxConcurrent = options.maxConcurrentFetches ?? 4;
  const maxQueueDepth = options.maxQueueDepth ?? 32;
  const maxCacheEntries = options.maxCacheEntries ?? 2000;
  const now = options.now ?? (() => Date.now());
  const fresh = new Map<string, GaugeNowEntry>();
  const emptyUntil = new Map<string, number>();
  const inFlight = new Map<string, Promise<GaugeNowEntry | null>>();

  let active = 0;
  const waiters: Array<() => void> = [];

  /** F14: run `task` under the global concurrency cap; overflow waits (bounded). */
  async function runWithSlot<T>(task: () => Promise<T>): Promise<T> {
    if (active >= maxConcurrent) {
      if (waiters.length >= maxQueueDepth) throw new GaugeNowBusyError();
      await new Promise<void>((resolve) => waiters.push(resolve));
      // Slot ownership was handed over by the finisher — active stays counted.
    } else {
      active += 1;
    }
    try {
      return await task();
    } finally {
      const next = waiters.shift();
      if (next) next(); // hand the slot straight to the longest-waiting caller
      else active -= 1;
    }
  }

  /** F14: keep a cache map within maxCacheEntries — sweep expired first, then
   *  drop the oldest-inserted entries. */
  function prune(map: Map<string, unknown>, expiredAt: (v: unknown) => number | null): void {
    if (map.size <= maxCacheEntries) return;
    for (const [k, v] of map) {
      if (map.size <= maxCacheEntries) break;
      const at = expiredAt(v);
      if (at !== null && now() >= at) map.delete(k);
    }
    while (map.size > maxCacheEntries) {
      const oldest = map.keys().next();
      if (oldest.done) break;
      map.delete(oldest.value);
    }
  }

  async function fetchEntry(gaugeId: string): Promise<GaugeNowEntry | null> {
    const fetchedAt = now();
    try {
      const result = await fetchWaterDataReadings([gaugeId], {
        userAgent: options.userAgent ?? 'TroutSite/1.0 (gauge-now)',
        timeoutMs: options.timeoutMs ?? 8_000,
        ...(options.apiKey ? { apiKey: options.apiKey } : {}),
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });
      const reading = result.readings.find((r) => r.gaugeId === gaugeId);
      if (!reading) {
        emptyUntil.set(gaugeId, fetchedAt + ttlMs / 2);
        prune(emptyUntil, (until) => (typeof until === 'number' ? until : null));
        return null;
      }
      const entry: GaugeNowEntry = { reading, fetchedAt, stale: false };
      fresh.set(gaugeId, entry);
      prune(fresh, (e) => {
        const at = e as GaugeNowEntry;
        return at?.fetchedAt !== undefined ? at.fetchedAt + ttlMs : null;
      });
      return entry;
    } catch (err) {
      const previous = fresh.get(gaugeId);
      if (previous) return { ...previous, stale: true };
      throw err;
    }
  }

  return {
    get(gaugeId: string): Promise<GaugeNowEntry | null> {
      const cached = fresh.get(gaugeId);
      if (cached && now() - cached.fetchedAt < ttlMs) return Promise.resolve(cached);
      const emptyAt = emptyUntil.get(gaugeId);
      if (emptyAt !== undefined && now() < emptyAt) return Promise.resolve(null);
      const pending = inFlight.get(gaugeId);
      if (pending) return pending;
      const task = runWithSlot(() => fetchEntry(gaugeId)).finally(() => {
        inFlight.delete(gaugeId);
      });
      inFlight.set(gaugeId, task);
      return task;
    },
  };
}
