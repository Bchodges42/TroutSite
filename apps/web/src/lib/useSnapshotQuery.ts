import { useQuery } from '@tanstack/react-query';
import type { ZodType } from 'zod';
import { fetchSnapshot, type SnapshotResult } from './snapshots';

/**
 * TanStack Query hook over the offline-first snapshot fetcher.
 * `networkMode: 'offlineFirst'` + infinite `gcTime` means cached data renders
 * instantly and the network is only an enhancement (guiding principle #1).
 */
export function useSnapshotQuery<T>(
  url: string,
  schema: ZodType<T>,
  ttlMinutes: number,
  enabled = true,
) {
  const query = useQuery<SnapshotResult<T>>({
    queryKey: ['snapshot', url],
    queryFn: () => fetchSnapshot(url, schema, ttlMinutes),
    enabled,
    staleTime: ttlMinutes * 60_000,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { ...query, cachedOnly: query.data !== undefined && !query.data.live };
}
