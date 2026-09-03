import { useMemo, useEffect, useState } from 'react';
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
import { snapshotUrls } from '../../lib/endpoints';
import { useSnapshotQuery } from '../../lib/useSnapshotQuery';
import { db } from '../../lib/db';
import { fetchSnapshot } from '../../lib/snapshots';
import { statusForScore, colorForStatus, dominantHatch, hatchHaloForChart } from './riverMapSelectors';
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
  const reportsQ = useSnapshotQuery(snapshotUrls.reportsRecent, ReportsSchema, 60 * 24, false);
  const stockingQ = useSnapshotQuery(snapshotUrls.stocking('TN'), StockingSchema, 60 * 24, false);

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

  const features: RiverMapFeature[] = useMemo(() => {
    const streams = (streamsQ.data?.data ?? []) as unknown[];
    return (streams as Array<{ id: string; name: string; regionId: string } & Record<string, unknown>>).map((stream) => {
      const snap = snapshotById.get((stream as { id: string }).id) as any;
      const hasData = !!snap;
      const score = snap?.score?.value ?? null;
      const status = statusForScore(score, hasData);
      const color = colorForStatus(status);
      const chart = hatchMap.get((stream as { regionId: string }).regionId) as HatchChart | undefined ?? null;
      const dominant = dominantHatch(chart);
      const halo = hatchHaloForChart(chart);
      return {
        stream: stream as unknown as RiverMapFeature['stream'],
        snapshot: snap as unknown as RiverMapFeature['snapshot'],
        status,
        color,
        score,
        freshness: (conditionsQ.data?.fetchedAt ?? null) as number | null,
        hatchChart: chart,
        hatchDominant: dominant,
        hatchHalo: halo,
        stocking: stockings.find((e) => ((e as any).streamName?.toLowerCase() ?? '').includes((stream as any).name.split(' ')[0].toLowerCase())) as any ?? null,
        stockingCount: 0,
        report: reports.find((r) => (r as any).streamId === (stream as any).id) as any ?? null,
        reportCount: 0,
        logCount: logCountByStream.get((stream as { id: string }).id) ?? 0,
      };
    });
  }, [streamsQ.data, snapshotById, hatchMap, stockings, reports, logCountByStream, conditionsQ.data]);

  return {
    features,
    isLoading: streamsQ.isLoading || conditionsQ.isLoading,
    isError: streamsQ.isError || conditionsQ.isError,
    fetchedAt: (conditionsQ.data?.fetchedAt ?? streamsQ.data?.fetchedAt ?? null) as number | null,
    live: (conditionsQ.data?.live ?? false) as boolean,
    streams: (streamsQ.data?.data ?? []) as unknown as RiverMapFeature['stream'][],
    hatchMap,
  };
}

function useHatchCache(month: number): Map<string, HatchChart> {
  const [map, setMap] = useState<Map<string, HatchChart>>(new Map());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries: Array<[string, HatchChart]> = [];
      for (const regionId of TN_REGIONS) {
        const url = `/v1/hatch/${regionId}/${month}.json`;
        try {
          const res = await fetchSnapshot(url, HatchChartSchema, 60 * 24 * 30);
          entries.push([regionId, res.data]);
        } catch {}
      }
      if (!cancelled) setMap(new Map(entries));
    })();
    return () => { cancelled = true; };
  }, [month]);
  return map;
}
