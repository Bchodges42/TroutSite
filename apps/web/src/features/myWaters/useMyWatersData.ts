import { useLiveQuery } from 'dexie-react-hooks';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { ConditionSnapshotSchema } from '@trout/contracts';
import { z } from 'zod';
import type { SavedWaterRecord, WaterGroupRecord } from '../../lib/db';
import { snapshotUrls } from '../../lib/endpoints';
import { listGroups, listSaved } from '../../lib/savedWaters';
import { useSnapshotQuery } from '../../lib/useSnapshotQuery';
import { useStreamsCatalog } from '../../lib/useStreamsCatalog';

/** Same TTLs as ConditionsPage: USGS refreshes hourly; the catalog is daily. */
export const CATALOG_TTL_MIN = 60 * 24;
const CONDITIONS_TTL_MIN = 60;
const ConditionsListSchema = z.array(ConditionSnapshotSchema);

/** Saved waters, newest first — undefined until the first Dexie read lands. */
export function useSavedWaters(): SavedWaterRecord[] | undefined {
  return useLiveQuery(() => listSaved(), [], undefined);
}

/** Private groups in display order — undefined until the first Dexie read lands. */
export function useWaterGroups(): WaterGroupRecord[] | undefined {
  return useLiveQuery(() => listGroups(), [], undefined);
}

/**
 * ONE statewide conditions fetch feeds every card (the plan's bounded-data
 * rule): /v1/conditions/latest.json is a single same-origin snapshot, so a
 * page of saved waters costs one request total — never one per card. Cards
 * read their water's entry out of the shared result and work offline from the
 * Dexie-cached copy (offlineFirst + infinite gcTime, same as every surface).
 */
export function useSharedConditions() {
  return useSnapshotQuery(
    snapshotUrls.conditionsLatest,
    ConditionsListSchema,
    CONDITIONS_TTL_MIN,
    true,
  );
}

export interface MyWatersSharedData {
  streamsById: Map<string, Stream>;
  /** snapshotById can stay empty offline — absence is never a data claim. */
  snapshotById: Map<string, ConditionSnapshot>;
  /**
   * Catalog resolution per saved row. 'loading' = not known yet; 'found' =
   * catalog row exists; 'missing' = the catalog RESOLVED and the id is absent
   * (the only case where "no longer in the catalog" may be said); 'unavailable'
   * = the catalog itself could not load, which proves nothing about a save.
   */
  catalogState: (waterId: string) => 'loading' | 'found' | 'missing' | 'unavailable';
  conditionsLoading: boolean;
  /** True when the shared snapshot in hand came from the network, not the cache. */
  conditionsLive: boolean;
}

/** Catalog + shared-conditions resolution over one saved-waters page. */
export function useMyWatersSharedData(): MyWatersSharedData {
  const catalogQ = useStreamsCatalog(CATALOG_TTL_MIN, true);
  const conditionsQ = useSharedConditions();

  const streamsById = new Map<string, Stream>();
  for (const s of catalogQ.data?.data ?? []) streamsById.set(s.id, s);

  const snapshotById = new Map<string, ConditionSnapshot>();
  for (const snap of conditionsQ.data?.data ?? []) snapshotById.set(snap.streamId, snap);

  const catalogState: MyWatersSharedData['catalogState'] = (waterId) => {
    if (streamsById.has(waterId)) return 'found';
    if (catalogQ.data !== undefined) return 'missing';
    if (catalogQ.isError) return 'unavailable';
    return 'loading';
  };

  return {
    streamsById,
    snapshotById,
    catalogState,
    conditionsLoading: conditionsQ.isLoading,
    conditionsLive: conditionsQ.data?.live ?? false,
  };
}
