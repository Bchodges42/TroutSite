import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { z } from 'zod';
import {
  ConditionSnapshotSchema,
  ShopReportSchema,
  StockingEventSchema,
  HatchChartSchema,
} from '@trout/contracts';
import type { HatchChart, Stream } from '@trout/contracts';
import { newestReadingAt } from '@trout/contracts';
import { useStreamsCatalog } from '../../lib/useStreamsCatalog';
import { useSnapshotQuery } from '../../lib/useSnapshotQuery';
import { snapshotUrls } from '../../lib/endpoints';
import { db } from '../../lib/db';
import { fetchSnapshot } from '../../lib/snapshots';
import { matchStocking } from '../../lib/stockingMatch';
import { REGIONS } from '../../data/regions';
import { statusForScore, colorForStatus, dominantHatch, hatchHaloForChart } from './riverMapSelectors';
import { atlas } from './mapTokens';

type ConditionRow = {
  streamId: string;
  score?: { value: number; assessed?: boolean; reasons?: string[] };
  readings?: Array<{
    gaugeId: string;
    timestamp: string;
    cfs?: number;
    heightFt?: number;
    tempC?: number;
    reservoirLevelFt?: number;
    dissolvedOxygenMgL?: number;
  }>;
  fetchedAt?: string;
  nextExpectedUpdate?: string;
} & Record<string, unknown>;
type ReportRow = { streamId?: string } & Record<string, unknown>;
type StockingRow = Record<string, unknown>;
import type { RiverMapFeature } from './riverMapSelectors';
import type { FishabilityFocus } from './waterDecision';
import type { SpeciesKey } from '@trout/contracts';
import { useFishabilityIndex } from '../../lib/fishability';

const ConditionsSchema = z.array(ConditionSnapshotSchema);
const ReportsSchema = z.array(ShopReportSchema);
const StockingSchema = z.array(StockingEventSchema);

// F40: requested chart regions ARE the registry (data/regions.ts — the same
// table the hatch calendar pages use, sourced from packages/content). The old
// separately maintained 11-entry array omitted tn-west, so West-TN waters
// never received chart entries or hatch halos even though
// /v1/hatch/tn-west/<month>.json ships. A region added to the registry is now
// requested automatically; a region whose chart is absent simply stays
// uncharted (honest "no chart yet").
const HATCH_REGIONS: readonly string[] = REGIONS.map((r) => r.id);

export interface UseRiverMapDataOptions {
  month?: number;
  enabled?: boolean;
  /** F6 all-fish focus species — fetches that species' per-water snapshots. */
  focusSpecies?: SpeciesKey | null;
}

export function useRiverMapData(options: UseRiverMapDataOptions = {}) {
  const month = options.month ?? new Date().getMonth() + 1;
  const enabled = options.enabled ?? true;
  const focusSpecies = options.focusSpecies ?? null;

  // Catalog with last-resort pack fallback (see useStreamsCatalog): live feed
  // → last Dexie snapshot → bundled content-pack catalog. A hard catalog error
  // needs BOTH the feed and the pack to fail; a conditions outage alone
  // degrades to unassessed waters instead of taking the catalog down.
  const streamsQ = useStreamsCatalog(60 * 24, enabled);
  const streamsData = streamsQ.data?.data;
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
    const m = new Map<string, ConditionRow>();
    const data = (conditionsQ.data?.data ?? []) as unknown[];
    for (const s of data as Array<{ streamId: string } & Record<string, unknown>>) m.set(s.streamId, s);
    return m;
  }, [conditionsQ.data]);

  const reports = (reportsQ.data?.data ?? []) as unknown as ReportRow[];
  const stockings = (stockingQ.data?.data ?? []) as unknown as StockingRow[];

  // Canonical stocking association (B05): TWRA water names resolve through
  // normalization → curated aliases → unambiguous containment only.
  const streamsForMatch = (streamsData ?? []) as unknown as Array<{
    id: string;
    name: string;
    aliases?: string[];
  }>;
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

  // F6 all-fish mode: the focus species' per-water comfort snapshots (absent
  // files = waters simply not scored — honest unassessed downstream).
  const streamsForFishability = streamsData as unknown as Stream[] | undefined;
  const fishabilityIndexQ = useFishabilityIndex(streamsForFishability, focusSpecies, enabled);
  const fishabilityByWater = fishabilityIndexQ.data ?? {};

  const features: RiverMapFeature[] = useMemo(() => {
    const streams = (streamsData ?? []) as unknown[];
    return (streams as Array<{ id: string; name: string; regionId: string; species?: 'trout' | 'warmwater' } & Record<string, unknown>>).map((stream) => {
      const snap = snapshotById.get((stream as { id: string }).id);
      const hasData = !!snap;
      const score = snap?.score?.value ?? null;
      const status = statusForScore(score, hasData, snap?.score?.assessed);
      // Freshness is the age of this stream's newest gauge reading — not when
      // the snapshot file happened to be fetched (they diverge for hours).
      const freshness = snap ? newestReadingAt(snap.readings ?? []) : null;
      // Warmwater rivers are listed but never trout-scored — bronze, honest.
      // Waters with NO catalog species stay unclassified here; waterDecision
      // owns what that means downstream. Never default unknowns to trout.
      const color =
        stream.species === 'warmwater'
          ? atlas.warmwater
          : stream.species === 'trout'
            ? colorForStatus(status)
            : atlas.noData;
      const chart = hatchMap.get((stream as { regionId: string }).regionId) as HatchChart | undefined ?? null;
      const dominant = dominantHatch(chart);
      const halo = hatchHaloForChart(chart);
      const fish: FishabilityFocus | undefined = (() => {
        if (!focusSpecies) return undefined;
        const snap = fishabilityByWater[(stream as { id: string }).id];
        const scored = snap?.bySpecies[focusSpecies];
        if (!scored) return undefined;
        return { species: focusSpecies, comfort: scored.comfort };
      })();
      return {
        stream: stream as unknown as RiverMapFeature['stream'],
        snapshot: snap as unknown as RiverMapFeature['snapshot'],
        status,
        color,
        score,
        species: stream.species,
        freshness: (freshness ?? (conditionsQ.data?.fetchedAt ?? null)) as number | null,
        hatchChart: chart,
        hatchDominant: dominant,
        hatchHalo: halo,
        stocking: stockingByStream.get((stream as { id: string }).id)?.[0] as RiverMapFeature['stocking'] | null,
        stockingCount: stockingByStream.get((stream as { id: string }).id)?.length ?? 0,
        report: reports.find((r) => r.streamId === (stream as { id: string }).id) as RiverMapFeature['report'] | null,
        reportCount: reportCountByStream.get((stream as { id: string }).id) ?? 0,
        logCount: logCountByStream.get((stream as { id: string }).id) ?? 0,
        fishability: fish,
      };
    });
  }, [streamsData, snapshotById, hatchMap, stockings, reports, logCountByStream, conditionsQ.data, stockingByStream, reportCountByStream, fishabilityByWater, focusSpecies]);

  // C1: feed-level health for the conditions snapshot, distinct from
  // per-water assessment. The builder stamps nextExpectedUpdate <= fetchedAt
  // when the gauges job was unhealthy at build time; zero assessed records
  // with that stamp is the "coverage unavailable" state (the 2026-09-06
  // production incident), never a genuine empty filter.
  const conditionsFeed = useMemo(() => {
    const rows = (conditionsQ.data?.data ?? []) as unknown as Array<{
      score?: { assessed?: boolean };
      fetchedAt?: string;
      nextExpectedUpdate?: string;
    }>;
    const firstFetch = rows.find((r) => r.fetchedAt)?.fetchedAt ?? null;
    const firstNext = rows.find((r) => r.nextExpectedUpdate)?.nextExpectedUpdate ?? null;
    return {
      records: rows.length,
      assessedCount: rows.filter((r) => r.score?.assessed === true).length,
      buildStale:
        firstFetch != null &&
        firstNext != null &&
        Date.parse(firstNext) <= Date.parse(firstFetch),
      lastFetchedAt: firstFetch ? Date.parse(firstFetch) : null,
    };
  }, [conditionsQ.data]);

  return {
    features,
    fishabilityIndex: fishabilityByWater,
    isLoading: streamsQ.isLoading || conditionsQ.isLoading,
    // Only a failure of BOTH the live feed and the bundled pack is a hard
    // catalog error (useStreamsCatalog). A conditions outage alone degrades:
    // waters render unassessed and the freshness chip reports offline
    // (live:false) instead of taking the whole catalog down (the 2026-09-06+
    // host incident).
    isError: streamsQ.isError,
    fetchedAt: (conditionsQ.data?.fetchedAt ?? streamsQ.data?.fetchedAt ?? null) as number | null,
    live: (conditionsQ.data?.live ?? false) as boolean,
    conditionsFeed,
    // Surfaced for UI/tests: the conditions feed failed (or is absent) while
    // the catalog itself still renders.
    conditionsUnavailable: conditionsQ.isError,
    streams: (streamsData ?? []) as unknown as RiverMapFeature['stream'][],
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
  // One concurrent, month-keyed query per registry region (B07): the old effect fetched
  // regions strictly sequentially and only published after the whole batch,
  // so a month switch kept showing the PREVIOUS month's charts until every
  // request finished. useQueries shares the ['snapshot', url] cache with
  // useSnapshotQuery and lets charts land as each resolves; regions still
  // loading are simply absent from the map (honest "no chart yet"), never
  // substituted with the prior month.
  const queries = useQueries({
    queries: HATCH_REGIONS.map((regionId) => {
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
  HATCH_REGIONS.forEach((regionId, i) => {
    const q = queries[i];
    if (q?.data) charts.set(regionId, q.data.data);
  });
  return charts;
}
