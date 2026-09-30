import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS, ReleaseScheduleSchema } from '@trout/contracts';
import type { ReleaseSchedule } from '@trout/contracts';
import { fetchSnapshot, type SnapshotResult } from '../../lib/snapshots';

/**
 * Per-water dam release schedule (TVA/USACE context, never a score factor) at
 * GET /v1/release-schedule/<waterId>.json — the same offline-first Dexie
 * snapshot path as every other feed, mirroring useFishabilityForWater.
 *
 * An absent file (404) or an unreachable source throws: the panel renders an
 * explicit "No published release schedule for this water" empty state rather
 * than silence — absence is information, not a loading state.
 */
const RELEASE_SCHEDULE_TTL_MIN = 60;

export function useReleaseSchedule(streamId: string | undefined) {
  return useQuery<SnapshotResult<ReleaseSchedule>>({
    queryKey: ['snapshot', streamId ? ENDPOINTS.releaseSchedule(streamId) : ''],
    queryFn: () =>
      fetchSnapshot(
        ENDPOINTS.releaseSchedule(streamId!),
        ReleaseScheduleSchema,
        RELEASE_SCHEDULE_TTL_MIN,
      ),
    enabled: Boolean(streamId),
    staleTime: RELEASE_SCHEDULE_TTL_MIN * 60_000,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
