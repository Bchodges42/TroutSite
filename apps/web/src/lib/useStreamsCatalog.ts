import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { StreamSchema } from '@trout/contracts';
import type { Stream } from '@trout/contracts';
import type { SnapshotResult } from './snapshots';
import { snapshotUrls } from './endpoints';
import { useSnapshotQuery } from './useSnapshotQuery';

/**
 * Bundled catalog fallback (live-catalog resilience, 2026-09-09 incident):
 * when the host's generated snapshot tree is gone (GET /v1/streams → 503
 * "streams snapshot not generated yet"), a visitor with an empty Dexie cache —
 * every fresh phone, or any browser after clearing site data — had no catalog
 * at all and every streams surface hard-errored "Catalog unavailable".
 * scripts/copy-pack-fallback.mjs ships the reviewed content pack in the build
 * (precache glob in vite.shared.ts); this is the LAST-resort catalog source
 * after live feed → last Dexie snapshot (handled inside fetchSnapshot). It
 * renders honestly: live:false, fetchedAt null (never fetched), no conditions —
 * every water unassessed until the feed returns.
 */
const PACK_CATALOG_URL = '/content-pack/streams.json';
const PackCatalogSchema = z.object({ streams: z.array(StreamSchema) });

/**
 * The /v1/streams catalog for every surface (map, browse, search, detail,
 * logbook). Same query cache as useSnapshotQuery (['snapshot', url]) — the
 * pack query only fires after the live feed has actually failed, then is kept
 * forever (static between content deploys).
 */
export function useStreamsCatalog(ttlMinutes: number, enabled = true) {
  const streamsQ = useSnapshotQuery(snapshotUrls.streams, StreamSchema.array(), ttlMinutes, enabled);

  const packCatalogQ = useQuery<Stream[]>({
    queryKey: ['pack-catalog', PACK_CATALOG_URL],
    queryFn: async () => {
      const res = await fetch(PACK_CATALOG_URL, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${PACK_CATALOG_URL}`);
      return PackCatalogSchema.parse(await res.json()).streams;
    },
    enabled: enabled && streamsQ.isError,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Effective catalog rows: live feed → bundled pack (same StreamSchema the
  // feed serves — the pack IS the catalog source of truth). fetchedAt stays
  // null: pack rows were never fetched from any host, and the freshness chip
  // must not invent an age for them.
  const packResult: SnapshotResult<Stream[]> | undefined = packCatalogQ.data
    ? { data: packCatalogQ.data, fetchedAt: null, live: false }
    : undefined;
  const data = streamsQ.data ?? packResult;

  return {
    ...streamsQ,
    data,
    cachedOnly: data !== undefined && !data.live,
    // A hard catalog error needs BOTH the feed and the pack to fail. While the
    // pack fetch is in flight the page keeps its loading state (no error flash).
    isLoading: streamsQ.isLoading || (streamsQ.isError && packCatalogQ.isLoading),
    isError: streamsQ.isError && !packCatalogQ.data && !packCatalogQ.isLoading,
  };
}
