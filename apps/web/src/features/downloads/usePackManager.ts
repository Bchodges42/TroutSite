import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from '@trout/ui';
import { ENDPOINTS, StreamSchema } from '@trout/contracts';
import type { Stream } from '@trout/contracts';
import type { DownloadManifestRecord, TripRecord } from '../../lib/db';
import {
  NETWORK_MANIFEST_URL,
  TOPO_MANIFEST_URL,
  parseNetworkClusters,
  parseTopoTileInfo,
  planTripPack,
  planWaterPack,
  networkClusterUrlsForPoint,
  waterAnchor,
} from '../../lib/packBuilder';
import type { PackPlan, TopoTileInfo } from '../../lib/packBuilder';
import { pin, remove, storageEstimate, verify, type PinProgress, type PinResult } from '../../lib/packCache';
import { listManifests, tripManifestId, waterManifestId } from '../../lib/downloadManifests';
import { db } from '../../lib/db';
import { resolveUrl } from '../../lib/endpoints';
import { currentMonth } from '../../lib/time';

/**
 * The UI boundary over pack pinning (ADR 0012). Resolves the two
 * availability-dependent plan inputs (atlas topo manifest for terrain,
 * network-cluster manifest for map context — both fail open: no section is
 * planned from a manifest that cannot be confirmed), runs pin/verify/remove,
 * and reports honest completion. Everything it mutates lives in
 * 'trout-packs-v1'/'topo-cache' + the manifest store; personal records
 * (logbook, saved waters, trips, photos) are never touched.
 */

const OFFLINE_MESSAGE = 'Downloading needs a network connection — you are offline right now.';

/** Both atlas manifests are tiny and immutable between deploys — fetch them
 *  lazily at download time (never on render) and fail open: no terrain
 *  section is offered when coverage cannot be confirmed. */
async function resolveTerrain(): Promise<TopoTileInfo | null> {
  try {
    const res = await fetch(resolveUrl(TOPO_MANIFEST_URL), { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return parseTopoTileInfo(await res.json());
  } catch {
    return null;
  }
}

async function resolveClusterUrls(anchor: { lat: number; lon: number }): Promise<string[]> {
  try {
    const res = await fetch(resolveUrl(NETWORK_MANIFEST_URL), { headers: { accept: 'application/json' } });
    if (!res.ok) return [];
    return networkClusterUrlsForPoint(parseNetworkClusters(await res.json()), anchor);
  } catch {
    return [];
  }
}

/** Catalog rows for re-downloading a pack from Settings (no catalog hook
 *  lives there). Schema-validated like every surface. */
async function fetchCatalogRows(): Promise<Stream[]> {
  const res = await fetch(resolveUrl(ENDPOINTS.streams), { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${ENDPOINTS.streams}`);
  return StreamSchema.array().parse(await res.json());
}

/** Hatch month for a pack: the trip's own month when scheduled, else now. */
function monthFor(date: string | undefined): number {
  const n = date ? Number(date.slice(5, 7)) : Number.NaN;
  return n >= 1 && n <= 12 ? n : currentMonth();
}

/** One honest completion message per pin outcome. */
function reportPinOutcome(plan: PackPlan, result: PinResult): void {
  if (result.offline) {
    toast.error(OFFLINE_MESSAGE);
    return;
  }
  if (result.quota) {
    void storageEstimate().then((estimate) => {
      const left =
        estimate && estimate.quota > estimate.usage
          ? ` About ${Math.max(0, Math.round((estimate.quota - estimate.usage) / 1e6))} MB free.`
          : '';
      toast.error(
        `This device ran out of storage mid-download — the pack is marked partial, never ready. Free up space and download again.${left}`,
      );
    });
    return;
  }
  const requiredFailed = result.failures.filter((f) => {
    const section = plan.sections.find((s) => s.key === f.sectionKey);
    return section?.required ?? f.sectionKey === '*';
  });
  if (requiredFailed.length > 0) {
    toast.error('Some required parts could not be downloaded — this pack is marked partial, not ready.');
    return;
  }
  if (!plan.sections.some((s) => s.key === 'terrain')) {
    toast.success('Downloaded — this water has no terrain coverage here, so no hillshade was pinned.');
    return;
  }
  toast.success('Downloaded — this pack now opens offline.');
}

export interface PackManagerApi {
  /** Every manifest, newest first — undefined until the first Dexie read. */
  manifests: DownloadManifestRecord[] | undefined;
  busyId: string | null;
  progress: PinProgress | null;
  downloadWater: (stream: Stream) => Promise<void>;
  downloadTrip: (trip: TripRecord, streams: Stream[]) => Promise<void>;
  /** Re-download a pack from Settings (catalog rows are resolved on demand). */
  redownload: (manifest: DownloadManifestRecord) => Promise<void>;
  verifyPack: (manifest: DownloadManifestRecord) => Promise<void>;
  removePack: (manifest: DownloadManifestRecord) => Promise<void>;
}

export function usePackManager(): PackManagerApi {
  const manifests = useLiveQuery(() => listManifests(), [], undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState<PinProgress | null>(null);

  const run = useCallback(async (id: string, work: () => Promise<void>) => {
    setBusyId(id);
    setProgress(null);
    try {
      await work();
    } catch {
      toast.error('That pack action failed — check your connection and try again.');
    } finally {
      setBusyId((current) => (current === id ? null : current));
      setProgress(null);
    }
  }, []);

  /** Pin one water's plan (connectivity already checked by the caller). */
  const pinWater = useCallback(async (stream: Stream, month: number) => {
    const topo = await resolveTerrain();
    const anchor = waterAnchor(stream.id);
    const clusterUrls = anchor ? await resolveClusterUrls(anchor) : [];
    const plan = planWaterPack(stream, { month, includeTerrain: true, topo, clusterUrls });
    const result = await pin(plan, setProgress);
    reportPinOutcome(plan, result);
  }, []);

  const pinTrip = useCallback(async (trip: TripRecord, streams: Stream[]) => {
    const month = monthFor(trip.date);
    const topo = await resolveTerrain();
    const plans: PackPlan[] = [];
    for (const stream of streams) {
      const anchor = waterAnchor(stream.id);
      const clusterUrls = anchor ? await resolveClusterUrls(anchor) : [];
      plans.push(planWaterPack(stream, { month, includeTerrain: true, topo, clusterUrls }));
    }
    const plan = planTripPack(trip, plans);
    const result = await pin(plan, setProgress);
    reportPinOutcome(plan, result);
  }, []);

  const guardOnline = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.error(OFFLINE_MESSAGE);
      return false;
    }
    return true;
  }, []);

  const downloadWater = useCallback(
    (stream: Stream) =>
      run(waterManifestId(stream.id), async () => {
        if (!(await guardOnline())) return;
        await pinWater(stream, monthFor(undefined));
      }),
    [run, pinWater, guardOnline],
  );

  const downloadTrip = useCallback(
    (trip: TripRecord, streams: Stream[]) =>
      run(tripManifestId(trip.id), async () => {
        if (streams.length === 0) {
          toast.error('None of this trip’s waters are in the catalog yet — try again once it loads.');
          return;
        }
        if (!(await guardOnline())) return;
        await pinTrip(trip, streams);
      }),
    [run, pinTrip, guardOnline],
  );

  const redownload = useCallback(
    (manifest: DownloadManifestRecord) =>
      run(manifest.id, async () => {
        if (!(await guardOnline())) return;
        const rows = await fetchCatalogRows();
        if (manifest.kind === 'water') {
          const stream = rows.find((s) => s.id === manifest.id.slice('water:'.length));
          if (!stream) {
            toast.error('This water is no longer in the catalog — remove the pack instead.');
            return;
          }
          await pinWater(stream, monthFor(undefined));
          return;
        }
        const trip = await db.trips.get(tripIdFrom(manifest.id));
        if (!trip) {
          toast.error('The trip this pack belonged to was deleted — remove the pack.');
          return;
        }
        const tripStreams = trip.waterIds
          .map((id) => rows.find((s) => s.id === id))
          .filter((s): s is Stream => s !== undefined);
        await pinTrip(trip, tripStreams);
      }),
    [run, pinWater, pinTrip, guardOnline],
  );

  const verifyPack = useCallback(
    (manifest: DownloadManifestRecord) =>
      run(manifest.id, async () => {
        const result = await verify(manifest);
        if (result.attributionLost) {
          toast.error(
            'Readiness could not be checked per section — download the pack again to restore its detail.',
          );
          return;
        }
        if (result.readiness.requiredReady) {
          toast.success(
            result.readiness.partialOptional
              ? 'Verified — required sections are on this device; optional ones are not downloaded.'
              : 'Verified — every section is still on this device.',
          );
        } else {
          toast.error('Some sections were evicted from storage — this pack is no longer ready. Download it again.');
        }
      }),
    [run],
  );

  const removePack = useCallback(
    (manifest: DownloadManifestRecord) =>
      run(manifest.id, async () => {
        await remove(manifest);
        toast.success(
          'Pack removed — files another pack still uses were kept. Your logs, saves, and photos were not touched.',
        );
      }),
    [run],
  );

  return useMemo(
    () => ({ manifests, busyId, progress, downloadWater, downloadTrip, redownload, verifyPack, removePack }),
    [manifests, busyId, progress, downloadWater, downloadTrip, redownload, verifyPack, removePack],
  );
}

/** trip:<id> → id (packBuilder owns water/trip manifest ids; this mirror stays
 *  local so the manager need not import planning for a record lookup). */
function tripIdFrom(manifestId: string): string {
  return manifestId.slice('trip:'.length);
}

/** Trivially-available storage estimate for the Settings footer line. */
export function useStorageEstimate(): { usage: number; quota: number } | null {
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  useMemo(() => {
    // No estimate (jsdom, private mode, old browser) → no state update at all.
    void storageEstimate().then((value) => {
      if (value) setEstimate(value);
    });
  }, []);
  return estimate;
}

/** Convenience for cards: the manifest record for one water, if any. */
export function useWaterManifest(waterId: string): DownloadManifestRecord | undefined {
  const manifests = useLiveQuery(() => listManifests(), [], undefined);
  return manifests?.find((m) => m.id === waterManifestId(waterId));
}
