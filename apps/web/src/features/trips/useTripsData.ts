import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { DownloadManifestRecord, TripRecord } from '../../lib/db';
import { listManifests } from '../../lib/downloadManifests';
import { listTrips } from '../../lib/trips';
import { summarizeTripPacks, tripIdFromManifestId, type TripPackSummary } from './tripPlan';

/**
 * Live Dexie reads for the trips page (ADR 0012). Same discipline as the
 * My Waters hooks: undefined until the first read lands (honest loading),
 * then the store helpers' own ordering — planned-first for trips, and one
 * manifests read that every pack chip shares.
 */

/** Trips in the store's own order: planned first (soonest date), completed last. */
export function useTrips(): TripRecord[] | undefined {
  return useLiveQuery(() => listTrips(), [], undefined);
}

/**
 * Pack readiness per trip id, computed from ONE live manifests read. Only the
 * trip's own manifests (`trip:<tripId>`) count — water packs belong to My
 * Waters, and a trip without any reads "no offline pack yet", honestly.
 */
export function useTripPacks(): Map<string, TripPackSummary> {
  const manifests = useLiveQuery(() => listManifests(), [], [] as DownloadManifestRecord[]);
  return useMemo(() => {
    const byTrip = new Map<string, DownloadManifestRecord[]>();
    for (const m of manifests) {
      const tripId = tripIdFromManifestId(m.id);
      if (!tripId) continue;
      const list = byTrip.get(tripId);
      if (list) list.push(m);
      else byTrip.set(tripId, [m]);
    }
    const map = new Map<string, TripPackSummary>();
    for (const [tripId, own] of byTrip) map.set(tripId, summarizeTripPacks(own));
    return map;
  }, [manifests]);
}
