import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS, FishabilitySnapshotSchema } from '@trout/contracts';
import type {
  ActivityOutlook,
  FishabilityScore,
  FishabilitySnapshot,
  SpeciesKey,
  Stream,
} from '@trout/contracts';
import { fetchSnapshot, type SnapshotResult } from './snapshots';

/**
 * F6 fishability data (ADR 0007): per-water snapshots at
 * /v1/fishability/<id>.json — one comfort + activity pair per cataloged
 * species. Offline-first through the same Dexie snapshot cache as every other
 * feed. Absent file = the water is not scored (the F5 pipeline only emits
 * waters with cataloged targetSpecies); absent species inside a file = not
 * cataloged on that water.
 */
const FISHABILITY_TTL_MIN = 60;

/**
 * F04 (2026-09-29 audit): a snapshot served from the device cache keeps its
 * generation-time `freshness.ageMinutes` forever — a month-old assessed-90
 * comfort would still claim it was scored 30 minutes ago. These hooks are the
 * data boundary where the real clock lives, so every served snapshot is
 * stamped: each comfort's freshness gains `currentAgeMinutes`, the age of the
 * supporting observation NOW. Pure consumers (waterDecision, the contracts
 * scoring) read the stamp instead of acquiring time; absent stamp =
 * generation-time age is the only known age (pre-stamp caches, direct test
 * fixtures).
 */
export type StampedFreshness = {
  observedAt: string;
  ageMinutes: number;
  currentAgeMinutes?: number;
};

export type StampedComfort = Omit<FishabilityScore, 'freshness'> & {
  freshness: StampedFreshness | null;
};

export type StampedFishabilitySnapshot = Omit<FishabilitySnapshot, 'bySpecies'> & {
  bySpecies: Record<SpeciesKey, { comfort: StampedComfort; activity: ActivityOutlook }>;
};

/**
 * Pure (clock injected — same discipline as the contracts scoring): shallow-
 * clone `snapshot` stamping every assessed comfort's freshness with
 * `currentAgeMinutes`, floored to whole minutes and clamped at 0. An
 * unreadable observedAt gets no stamp (an unknown age is never invented).
 * Inputs are never mutated.
 */
export function stampCurrentAges(snapshot: FishabilitySnapshot, nowMs: number): StampedFishabilitySnapshot {
  // Keys are copied verbatim from the (already SpeciesKey-keyed) input record.
  const bySpecies = {} as StampedFishabilitySnapshot['bySpecies'];
  for (const [species, entry] of Object.entries(snapshot.bySpecies)) {
    const freshness = entry.comfort.freshness;
    const observedMs = freshness ? Date.parse(freshness.observedAt) : Number.NaN;
    const stamped: StampedFishabilitySnapshot['bySpecies'][SpeciesKey] = {
      ...entry,
      comfort: {
        ...entry.comfort,
        freshness: freshness
          ? {
              ...freshness,
              ...(Number.isFinite(observedMs)
                ? { currentAgeMinutes: Math.max(0, Math.floor((nowMs - observedMs) / 60_000)) }
                : {}),
            }
          : null,
      },
    };
    bySpecies[species as SpeciesKey] = stamped;
  }
  return { ...snapshot, bySpecies };
}

export function useFishabilityForWater(streamId: string | undefined) {
  return useQuery<SnapshotResult<StampedFishabilitySnapshot>>({
    queryKey: ['snapshot', streamId ? ENDPOINTS.fishabilityForWater(streamId) : ''],
    queryFn: async () => {
      const res = await fetchSnapshot(
        ENDPOINTS.fishabilityForWater(streamId!),
        FishabilitySnapshotSchema,
        FISHABILITY_TTL_MIN,
      );
      // F04: the boundary acquires the clock; the served payload gains the
      // current observation ages the view layer needs.
      return { ...res, data: stampCurrentAges(res.data, Date.now()) };
    },
    enabled: Boolean(streamId),
    staleTime: FISHABILITY_TTL_MIN * 60_000,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
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
  return useQuery<Record<string, StampedFishabilitySnapshot>>({
    queryKey: ['fishability-index', key],
    queryFn: async () => {
      const out: Record<string, StampedFishabilitySnapshot> = {};
      const load = async (id: string): Promise<boolean> => {
        try {
          const res = await fetchSnapshot(
            ENDPOINTS.fishabilityForWater(id),
            FishabilitySnapshotSchema,
            FISHABILITY_TTL_MIN,
          );
          out[id] = stampCurrentAges(res.data, Date.now());
          return true;
        } catch {
          // Absent file = not scored (honest unassessed); a transient failure
          // gets one more pass below (the SW precache can starve first loads).
          return false;
        }
      };
      const runPool = async (pending: string[]) => {
        const pool = 6;
        let cursor = 0;
        const workers = Array.from({ length: Math.min(pool, pending.length) }, async () => {
          while (cursor < pending.length) await load(pending[cursor++]!);
        });
        await Promise.all(workers);
      };
      await runPool(ids);
      const missed = ids.filter((id) => !out[id]);
      if (missed.length) await runPool(missed);
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
