import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { z } from 'zod';
import {
  StreamSchema,
  ConditionSnapshotSchema,
  ShopReportSchema,
  StockingEventSchema,
  HatchChartSchema,
} from '@trout/contracts';
import type { HatchChart } from '@trout/contracts';
import { newestReadingAt } from '@trout/contracts';
import { snapshotUrls } from '../../lib/endpoints';
import { useSnapshotQuery } from '../../lib/useSnapshotQuery';
import { db } from '../../lib/db';
import { fetchSnapshot } from '../../lib/snapshots';
import { matchStocking } from '../../lib/stockingMatch';
import { statusForScore, colorForStatus, dominantHatch, hatchHaloForChart } from './riverMapSelectors';
import { atlas } from './mapTokens';
import type { RiverMapFeature } from './riverMapSelectors';

const StreamsSchema = z.array(StreamSchema);
const ConditionsSchema = z.array(ConditionSnapshotSchema);
const ReportsSchema = z.array(ShopReportSchema);
const StockingSchema = z.array(StockingEventSchema);

const TN_REGIONS = [
  'tn-east-holston',
  'tn-northeast-watauga',
  'tn-east-clinch',
  'tn-east-smokies',
  'tn-east-pigeon-frenchbroad',
  'tn-se-hiwassee',
  'tn-cumberland-plateau',
  'tn-upper-cumberland',
  'tn-middle-caney-fork',
  'tn-middle-duck-elk',
  'tn-middle-nashville',
] as const;

export interface UseRiverMapDataOptions {
  month?: number;
  enabled?: boolean;
}

export function useRiverMapData(options: UseRiverMapDataOptions = {}) {
  const month = options.month ?? new Date().getMonth() + 1;
  const enabled = options.enabled ?? true;

  const streamsQ = useSnapshotQuery(snapshotUrls.streams, StreamsSchema, 60 * 24, enabled);
  const conditionsQ = useSnapshotQuery(snapshotUrls.conditionsLatest, ConditionsSchema, 60, enabled);
  // Reports + stocking were permanently disabled (B06): counts hardcoded to 0
  // and "never fetched" was indistinguishable from "no reports". Both feeds are
  // small cached snapshots — fetch them with the rest and report their state.
  const reportsQ = useSnapshotQuery(snapshotUrls.reportsRecent, ReportsSchema, 60 * 24, enabled);
  const stockingQ = useSnapshotQuery(snapshotUrls.stocking('TN'), StockingSchema, 60 * 24, enabled);

  const hatchMap = useHatchCache(month);

  const logbookRows = useLiveQuery(() => db.logbook.toArray(), []);
  const logCountByStream = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of logbookRows ?? []) if (e.streamId) m.set(e.streamId, (m.get(e.streamId) ?? 0) + 1);
    return m;
  }, [logbookRows]);

  const snapshotById = useMemo(() => {
    const m = new Map<string, any>();
    const data = (conditionsQ.data?.data ?? []) as unknown[];
    for (const s of data as Array<{ streamId: string } & Record<string, unknown>>) m.set(s.streamId, s as any);
    return m as Map<string, any>;
  }, [conditionsQ.data]);

  const reports = (reportsQ.data?.data ?? []) as unknown as Array<Record<string, unknown>>;
  const stockings = (stockingQ.data?.data ?? []) as unknown as Array<Record<string, unknown>>;

  // Canonical stocking association (B05): TWRA water names resolve through
  // normalization → curated aliases → unambiguous containment only.
  const streamsForMatch = (streamsQ.data?.data ?? []) as unknown as Array<{ id: string; name: string }>;
  const stockingByStream = useMemo(() => {
    const { byStream } = matchStocking(streamsForMatch, stockings as never);
    return byStream as Map<string, Array<Record<string, unknown>>>;
  }, [streamsForMatch, stockings]);
  const reportCountByStream = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of reports) {
      const id = (r as { streamId?: string }).streamId;
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [reports]);

  const features: RiverMapFeature[] = useMemo(() => {
    const streams = (streamsQ.data?.data ?? []) as unknown[];
    return (streams as Array<{ id: string; name: string; regionId: string; species?: 'trout' | 'warmwater' } & Record<string, unknown>>).map((stream) => {
      const snap = snapshotById.get((stream as { id: string }).id) as any;
      const hasData = !!snap;
      const score = snap?.score?.value ?? null;
      const status = statusForScore(score, hasData, snap?.score?.assessed);
      // Freshness is the age of this stream's newest gauge reading — not when
      // the snapshot file happened to be fetched (they diverge for hours).
      const freshness = snap ? newestReadingAt(snap.readings ?? []) : null;
      // Warmwater rivers are listed but never trout-scored — bronze, honest.
      const color = stream.species === 'warmwater' ? atlas.warmwater : colorForStatus(status);
      const chart = hatchMap.get((stream as { regionId: string }).regionId) as HatchChart | undefined ?? null;
      const dominant = dominantHatch(chart);
      const halo = hatchHaloForChart(chart);
      return {
        stream: stream as unknown as RiverMapFeature['stream'],
        snapshot: snap as unknown as RiverMapFeature['snapshot'],
        status,
        color,
        score,
        species: stream.species ?? 'trout',
        freshness: (freshness ?? (conditionsQ.data?.fetchedAt ?? null)) as number | null,
        hatchChart: chart,
        hatchDominant: dominant,
        hatchHalo: halo,
        stocking: stockingByStream.get((stream as { id: string }).id)?.[0] as any ?? null,
        stockingCount: stockingByStream.get((stream as { id: string }).id)?.length ?? 0,
        report: reports.find((r) => (r as any).streamId === (stream as any).id) as any ?? null,
        reportCount: reportCountByStream.get((stream as { id: string }).id) ?? 0,
        logCount: logCountByStream.get((stream as { id: string }).id) ?? 0,
      };
    });
  }, [streamsQ.data, snapshotById, hatchMap, stockings, reports, logCountByStream, conditionsQ.data, stockingByStream, reportCountByStream]);

  return {
    features,
    isLoading: streamsQ.isLoading || conditionsQ.isLoading,
    isError: streamsQ.isError || conditionsQ.isError,
    fetchedAt: (conditionsQ.data?.fetchedAt ?? streamsQ.data?.fetchedAt ?? null) as number | null,
    live: (conditionsQ.data?.live ?? false) as boolean,
    streams: (streamsQ.data?.data ?? []) as unknown as RiverMapFeature['stream'][],
    hatchMap,
    // Per-feed state (B06): a feed with zero rows must be distinguishable
    // from one that was never fetched or failed.
    feeds: {
      stocking: {
        isLoading: stockingQ.isLoading,
        isError: stockingQ.isError,
        empty: !stockingQ.isLoading && !stockingQ.isError && stockings.length === 0,
      },
      reports: {
        isLoading: reportsQ.isLoading,
        isError: reportsQ.isError,
        empty: !reportsQ.isLoading && !reportsQ.isError && reports.length === 0,
      },
    },
  };
}

function useHatchCache(month: number): Map<string, HatchChart> {
  // One concurrent, month-keyed query per region (B07): the old effect fetched
  // 11 regions strictly sequentially and only published after the whole batch,
  // so a month switch kept showing the PREVIOUS month's charts until every
  // request finished. useQueries shares the ['snapshot', url] cache with
  // useSnapshotQuery and lets charts land as each resolves; regions still
  // loading are simply absent from the map (honest "no chart yet"), never
  // substituted with the prior month.
  const queries = useQueries({
    queries: TN_REGIONS.map((regionId) => {
      const url = `/v1/hatch/${regionId}/${month}.json`;
      return {
        queryKey: ['snapshot', url],
        queryFn: () => fetchSnapshot(url, HatchChartSchema, 60 * 24 * 30),
        staleTime: 60 * 24 * 30 * 60_000,
        gcTime: Number.POSITIVE_INFINITY,
        networkMode: 'offlineFirst' as const,
        retry: 1,
        refetchOnWindowFocus: false,
      };
    }),
  });

  const charts = new Map<string, HatchChart>();
  TN_REGIONS.forEach((regionId, i) => {
    const q = queries[i];
    if (q?.data) charts.set(regionId, q.data.data);
  });
  return charts;
}
