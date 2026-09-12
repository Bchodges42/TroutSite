import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS, FishabilitySnapshotSchema } from '@trout/contracts';
import type { FishabilitySnapshot, SpeciesKey, Stream } from '@trout/contracts';
import { fetchSnapshot, type SnapshotResult } from './snapshots';
import { resolveUrl } from './endpoints';

/**
 * F6 fishability data (ADR 0007): per-water snapshots at
 * /v1/fishability/<id>.json — one comfort + activity pair per cataloged
 * species. Offline-first through the same Dexie snapshot cache as every other
 * feed. Absent file = the water is not scored (the F5 pipeline only emits
 * waters with cataloged targetSpecies); absent species inside a file = not
 * cataloged on that water.
 */
const FISHABILITY_TTL_MIN = 60;

export function useFishabilityForWater(streamId: string | undefined) {
  return useQuery<SnapshotResult<FishabilitySnapshot>>({
    queryKey: ['snapshot', streamId ? ENDPOINTS.fishabilityForWater(streamId) : ''],
    queryFn: () => fetchSnapshot(ENDPOINTS.fishabilityForWater(streamId!), FishabilitySnapshotSchema, FISHABILITY_TTL_MIN),
    enabled: Boolean(streamId),
    staleTime: FISHABILITY_TTL_MIN * 60_000,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

/** Waters whose catalog lists the focus species (the only ones with files). */
export function watersForSpecies(streams: Stream[], species: SpeciesKey): string[] {
  return streams.filter((s) => s.targetSpecies?.includes(species)).map((s) => s.id);
}

/**
 * The map/list surface's all-fish index: fetch the focus species' snapshots
 * for every cataloged water (small files, Dexie-cached, bounded pool so a
 * 148-water catalog doesn't stampede). A water whose file is absent simply
 * has no fishability — the decision model renders it unassessed.
 */
export function useFishabilityIndex(
  streams: Stream[] | undefined,
  focus: SpeciesKey | null,
  enabled: boolean,
) {
  const ids = streams && focus ? watersForSpecies(streams, focus) : [];
  const key = focus ? focus + ':' + ids.join(',') : '';
  return useQuery<Record<string, FishabilitySnapshot>>({
    queryKey: ['fishability-index', key],
    queryFn: async () => {
      const out: Record<string, FishabilitySnapshot> = {};
      const pool = 6;
      let cursor = 0;
      const workers = Array.from({ length: Math.min(pool, ids.length) }, async () => {
        while (cursor < ids.length) {
          const id = ids[cursor++]!;
          try {
            const res = await fetchSnapshot(
              resolveUrl(ENDPOINTS.fishabilityForWater(id)),
              FishabilitySnapshotSchema,
              FISHABILITY_TTL_MIN,
            );
            out[id] = res.data;
          } catch {
            /* absent file = not scored; the decision model renders unassessed */
          }
        }
      });
      await Promise.all(workers);
      return out;
    },
    enabled: enabled && Boolean(focus) && ids.length > 0,
    staleTime: FISHABILITY_TTL_MIN * 60_000,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

/** Plain-language names for the seven game species (picker, pills, drawer). */
export const SPECIES_LABELS: Record<SpeciesKey, string> = {
  'largemouth-bass': 'Largemouth bass',
  'smallmouth-bass': 'Smallmouth bass',
  'spotted-bass': 'Spotted bass',
  crappie: 'Crappie',
  bluegill: 'Bluegill',
  'channel-catfish': 'Channel catfish',
  'striped-bass': 'Striped bass',
};

/** The union of species any catalog water targets — the focus picker's options. */
export function catalogFocusSpecies(streams: Stream[]): SpeciesKey[] {
  const set = new Set<SpeciesKey>();
  for (const s of streams) for (const sp of s.targetSpecies ?? []) set.add(sp);
  return [...set].sort();
}
