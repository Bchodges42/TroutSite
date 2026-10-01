import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from '@trout/ui';
import { ENDPOINTS, StreamSchema, GaugeHistorySchema } from '@trout/contracts';
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
import { fetchPackResource, pin, remove, storageEstimate, verify, type PinProgress, type PinResult } from '../../lib/packCache';
import { listManifests, tripManifestId, waterManifestId } from '../../lib/downloadManifests';
import { db } from '../../lib/db';
import { resolveUrl } from '../../lib/endpoints';
import { currentMonth } from '../../lib/time';
import { estimatePackSize, type PackSizeEstimate } from '../../lib/packSize';

/**
 * The UI boundary over pack pinning (ADR 0012). Resolves the two
 * availability-dependent plan inputs (atlas topo manifest for terrain,
 * network-cluster manifest for map context — both fail open: no section is
 * planned from a manifest that cannot be confirmed), runs pin/verify/remove,
 * and reports honest completion. Everything it mutates lives in
 * 'trout-packs-v1' + the manifest store; personal records
 * (logbook, saved waters, trips, photos) are never touched.
 */

const OFFLINE_MESSAGE = 'Downloading needs a network connection — you are offline right now.';

/** Both atlas manifests are tiny and immutable between deploys — fetch them
 *  lazily at download time (never on render) and fail open: no terrain
 *  section is offered when coverage cannot be confirmed. */
async function resolveTerrain(signal: AbortSignal): Promise<TopoTileInfo | null> {
  try {
    const res = await fetchPackResource(resolveUrl(TOPO_MANIFEST_URL), signal);
    if (!res.ok) return null;
    return parseTopoTileInfo(await res.json());
  } catch {
    return null;
  }
}

async function resolveClusterUrls(anchor: { lat: number; lon: number }, signal: AbortSignal): Promise<string[]> {
  try {
    const res = await fetchPackResource(resolveUrl(NETWORK_MANIFEST_URL), signal);
    if (!res.ok) return [];
    return networkClusterUrlsForPoint(parseNetworkClusters(await res.json()), anchor);
  } catch {
    return [];
  }
}

/** Catalog rows for re-downloading a pack from Settings (no catalog hook
 *  lives there). Schema-validated like every surface. */
async function fetchCatalogRows(signal: AbortSignal): Promise<Stream[]> {
  const res = await fetchPackResource(resolveUrl(ENDPOINTS.streams), signal);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${ENDPOINTS.streams}`);
  return StreamSchema.array().parse(await res.json());
}

async function availableHistory(stream: Stream, signal: AbortSignal): Promise<string[]> {
  const found = await Promise.all((stream.gaugeIds ?? []).filter((id) => /^\d+$/.test(id)).map(async (id) => {
    const url = ENDPOINTS.gaugeHistory(id);
    try {
      const res = await fetchPackResource(resolveUrl(url), signal);
      return res.ok && GaugeHistorySchema.safeParse(await res.json()).success ? url : null;
    } catch { return null; }
  }));
  return found.filter((url): url is string => url !== null);
}

/** Hatch month for a pack: the trip's own month when scheduled, else now. */
function monthFor(date: string | undefined): number {
  const n = date ? Number(date.slice(5, 7)) : Number.NaN;
  return n >= 1 && n <= 12 ? n : currentMonth();
}

/** One honest completion message per pin outcome. */
function reportPinOutcome(plan: PackPlan, result: PinResult): void {
  if (result.cancelled) {
    toast.success('Download canceled. Finished sections remain on this device; verify before relying on the pack.');
    return;
  }
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
    toast.success('Basic information downloaded. Terrain is not included in this pack.');
    return;
  }
  toast.success('Downloaded — this pack now opens offline.');
}

export interface PackManagerApi {
  /** Every manifest, newest first — undefined until the first Dexie read. */
  manifests: DownloadManifestRecord[] | undefined;
  busyId: string | null;
  progress: PinProgress | null;
  downloadWater: (stream: Stream, includeTerrain?: boolean) => Promise<void>;
  downloadTrip: (trip: TripRecord, streams: Stream[], includeTerrain?: boolean) => Promise<void>;
  /** Re-download a pack from Settings (catalog rows are resolved on demand). */
  redownload: (manifest: DownloadManifestRecord, includeTerrain?: boolean) => Promise<void>;
  cancelDownload: () => void;
  estimateWater: (stream: Stream, terrain: boolean, signal?: AbortSignal) => Promise<PackSizeEstimate>;
  estimateTrip: (trip: TripRecord, streams: Stream[], terrain: boolean, signal?: AbortSignal) => Promise<PackSizeEstimate>;
  estimateManifest: (manifest: DownloadManifestRecord, terrain: boolean, signal?: AbortSignal) => Promise<PackSizeEstimate>;
  verifyPack: (manifest: DownloadManifestRecord) => Promise<void>;
  removePack: (manifest: DownloadManifestRecord) => Promise<void>;
}

export function usePackManager(): PackManagerApi {
  const manifests = useLiveQuery(() => listManifests(), [], undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState<PinProgress | null>(null);
  const active = useRef<AbortController | null>(null);
  const cancelDownload = useCallback(() => active.current?.abort(), []);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (!manifests || busyId) return;
    // Readiness is physical cache presence, not an old remembered success.
    void (async () => { for (const manifest of manifests) await verify(manifest); })().catch(() => {});
  }, [manifests, busyId]);

  const run = useCallback(async (id: string, work: (signal: AbortSignal) => Promise<void>) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusyId(id);
    setProgress(null);
    try {
      await work(controller.signal);
    } catch {
      toast.error(controller.signal.aborted ? 'Download canceled.' : 'That pack action failed — check your connection and try again.');
    } finally {
      setBusyId((current) => (current === id ? null : current));
      setProgress(null);
      active.current = null;
    }
  }, []);

  /** Pin one water's plan (connectivity already checked by the caller). */
  const prepareWater = useCallback(async (stream: Stream, month: number, includeTerrain: boolean, signal: AbortSignal) => {
    const topo = includeTerrain ? await resolveTerrain(signal) : null;
    const anchor = waterAnchor(stream.id);
    const clusterUrls = anchor ? await resolveClusterUrls(anchor, signal) : [];
    const historyUrls = await availableHistory(stream, signal);
    return planWaterPack(stream, { month, includeTerrain, topo, clusterUrls, historyUrls });
  }, []);

  const pinWater = useCallback(async (stream: Stream, month: number, includeTerrain: boolean, signal: AbortSignal) => {
    const plan = await prepareWater(stream, month, includeTerrain, signal);
    const result = await pin(plan, setProgress, signal);
    reportPinOutcome(plan, result);
  }, [prepareWater]);

  const prepareTrip = useCallback(async (trip: TripRecord, streams: Stream[], includeTerrain: boolean, signal: AbortSignal) => {
    if (!trip.waterIds.length || trip.waterIds.some((id) => !streams.some((stream) => stream.id === id))) {
      throw new Error('Some trip waters are missing from the catalog. Update the trip before downloading its complete pack.');
    }
    const month = monthFor(trip.date);
    const topo = includeTerrain ? await resolveTerrain(signal) : null;
    const plans: PackPlan[] = [];
    for (const stream of streams) {
      const anchor = waterAnchor(stream.id);
      const clusterUrls = anchor ? await resolveClusterUrls(anchor, signal) : [];
      const historyUrls = await availableHistory(stream, signal);
      plans.push(planWaterPack(stream, { month, includeTerrain, topo, clusterUrls, historyUrls }));
    }
    return planTripPack(trip, plans);
  }, []);

  const pinTrip = useCallback(async (trip: TripRecord, streams: Stream[], includeTerrain: boolean, signal: AbortSignal) => {
    const plan = await prepareTrip(trip, streams, includeTerrain, signal);
    const result = await pin(plan, setProgress, signal);
    reportPinOutcome(plan, result);
  }, [prepareTrip]);

  const estimateWater = useCallback(async (stream: Stream, terrain: boolean, signal = new AbortController().signal) =>
    estimatePackSize(await prepareWater(stream, monthFor(undefined), terrain, signal), signal), [prepareWater]);
  const estimateTrip = useCallback(async (trip: TripRecord, streams: Stream[], terrain: boolean, signal = new AbortController().signal) =>
    estimatePackSize(await prepareTrip(trip, streams, terrain, signal), signal), [prepareTrip]);
  const estimateManifest = useCallback(async (manifest: DownloadManifestRecord, terrain: boolean, signal = new AbortController().signal) => {
    const rows = await fetchCatalogRows(signal);
    if (manifest.kind === 'water') {
      const stream = rows.find((row) => row.id === manifest.id.slice('water:'.length));
      if (!stream) throw new Error('This water is no longer in the catalog.');
      return estimateWater(stream, terrain, signal);
    }
    const trip = await db.trips.get(tripIdFrom(manifest.id));
    if (!trip) throw new Error('This trip no longer exists.');
    return estimateTrip(trip, rows.filter((row) => trip.waterIds.includes(row.id)), terrain, signal);
  }, [estimateWater, estimateTrip]);

  const guardOnline = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.error(OFFLINE_MESSAGE);
      return false;
    }
    return true;
  }, []);

  const downloadWater = useCallback(
    (stream: Stream, includeTerrain = false) =>
      run(waterManifestId(stream.id), async (signal) => {
        if (!(await guardOnline())) return;
        await pinWater(stream, monthFor(undefined), includeTerrain, signal);
      }),
    [run, pinWater, guardOnline],
  );

  const downloadTrip = useCallback(
    (trip: TripRecord, streams: Stream[], includeTerrain = false) =>
      run(tripManifestId(trip.id), async (signal) => {
        if (streams.length === 0) {
          toast.error('None of this trip’s waters are in the catalog yet — try again once it loads.');
          return;
        }
        if (!(await guardOnline())) return;
        await pinTrip(trip, streams, includeTerrain, signal);
      }),
    [run, pinTrip, guardOnline],
  );

  const redownload = useCallback(
    (manifest: DownloadManifestRecord, includeTerrain = manifest.sections.some((section) => section.key === 'terrain')) =>
      run(manifest.id, async (signal) => {
        if (!(await guardOnline())) return;
        const rows = await fetchCatalogRows(signal);
        if (manifest.kind === 'water') {
          const stream = rows.find((s) => s.id === manifest.id.slice('water:'.length));
          if (!stream) {
            toast.error('This water is no longer in the catalog — remove the pack instead.');
            return;
          }
          await pinWater(stream, monthFor(undefined), includeTerrain, signal);
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
        await pinTrip(trip, tripStreams, includeTerrain, signal);
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
    () => ({ manifests, busyId, progress, downloadWater, downloadTrip, redownload, verifyPack, removePack, cancelDownload, estimateWater, estimateTrip, estimateManifest }),
    [manifests, busyId, progress, downloadWater, downloadTrip, redownload, verifyPack, removePack, cancelDownload, estimateWater, estimateTrip, estimateManifest],
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
  useEffect(() => {
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
