import { useQuery } from '@tanstack/react-query';
import { fetchSnapshot, type SnapshotResult } from '../../lib/snapshots';
import { GaugeHistorySchema, gaugeHistoryUrl, type GaugeHistory } from './gaugeHistory';

/**
 * Per-gauge history (ADR 0014) over the same offline-first Dexie snapshot path
 * as every other feed: online fetch → validate → cache; offline / failed → the
 * last stored copy with `live: false` ("last known" wording in the panel).
 *
 * A 404 (or any failure) is a terminal "no history for this gauge" state, not a
 * loading state: the panel renders NOTHING (honest absence — the water detail
 * page looks exactly as it does today until the API lane lands emission).
 * `retry` is therefore false: absence is the expected steady state for most
 * gauges pre-landing, and retrying every 404 doubles one-off traffic for no
 * information.
 */
const GAUGE_HISTORY_TTL_MIN = 60;

export function useGaugeHistory(gaugeId: string | undefined) {
  return useQuery<SnapshotResult<GaugeHistory>>({
    queryKey: ['snapshot', gaugeId ? gaugeHistoryUrl(gaugeId) : ''],
    queryFn: () =>
      fetchSnapshot(gaugeHistoryUrl(gaugeId!), GaugeHistorySchema, GAUGE_HISTORY_TTL_MIN),
    enabled: Boolean(gaugeId),
    staleTime: GAUGE_HISTORY_TTL_MIN * 60_000,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: false,
    refetchOnWindowFocus: false,
  });
}
