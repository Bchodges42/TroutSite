import type { GaugeReading } from '@trout/contracts';
import { fetchWaterDataReadings } from '../ingest/usgs-waterdata.js';

export interface GaugeNowEntry {
  reading: GaugeReading;
  /** Epoch ms when the reading was fetched from USGS (not when it was observed). */
  fetchedAt: number;
  /** True when the live fetch failed and a previous reading was served instead. */
  stale: boolean;
}

export interface GaugeNowCache {
  /**
   * Latest reading for one USGS gauge, or null when the gauge has no current
   * data. Never throws for "no data" — only fetch-transport failures throw,
   * and even those resolve to the stale cached reading when one exists.
   */
  get(gaugeId: string): Promise<GaugeNowEntry | null>;
}

export interface GaugeNowCacheOptions {
  /** How long a fetched reading is served without refetching (default 10 min). */
  ttlMs?: number;
  /** Per-fetch abort budget (default 8s — this answers a user tap, not a cron). */
  timeoutMs?: number;
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
 *   of a 500 (gauge readings are context, never a hard dependency).
 */
export function createGaugeNowCache(options: GaugeNowCacheOptions = {}): GaugeNowCache {
  const ttlMs = options.ttlMs ?? 10 * 60_000;
  const now = options.now ?? (() => Date.now());
  const fresh = new Map<string, GaugeNowEntry>();
  const emptyUntil = new Map<string, number>();
  const inFlight = new Map<string, Promise<GaugeNowEntry | null>>();

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
        return null;
      }
      const entry: GaugeNowEntry = { reading, fetchedAt, stale: false };
      fresh.set(gaugeId, entry);
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
      const task = fetchEntry(gaugeId).finally(() => {
        inFlight.delete(gaugeId);
      });
      inFlight.set(gaugeId, task);
      return task;
    },
  };
}
