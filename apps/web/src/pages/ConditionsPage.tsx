import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Card, Chip, EmptyState } from '@trout/ui';
import { StreamSchema, ConditionSnapshotSchema, newestReadingAt } from '@trout/contracts';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { snapshotUrls, V1_STATES } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useSettingsContext } from '../lib/settings';
import { flowTrend, TREND_LABEL } from '../lib/conditions';
import { formatFlow, formatTemp } from '../lib/units';
import { FreshnessChip } from '../components/FreshnessChip';
import { ScorePill } from '../components/ScorePill';
import { LocationIcon } from '../components/icons';
import { formatMiles, getCurrentPosition, nearestStreams } from '../lib/geo';
import geoJson from '../data/streams-geo.json';
import { statusForScore } from '../features/map/riverMapSelectors';

/** Bundled coordinates (public USGS gauge locations) for the on-device "near me". */
const geoByStreamId = geoJson as unknown as Record<string, { lat: number; lon: number }>;

const CONDITIONS_TTL_MIN = 60; // USGS refreshes hourly (§8)
const StreamListSchema = z.array(StreamSchema);
const ConditionsListSchema = z.array(ConditionSnapshotSchema);

interface Row {
  stream: Stream;
  snapshot: ConditionSnapshot | undefined;
  miles?: number;
}

/** Conditions browser (scope 4): state → stream list with score pills + trend. */
export function ConditionsPage() {
  const { settings } = useSettingsContext();
  const stateId = settings.defaultState;
  const [nearMe, setNearMe] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const streamsQuery = useSnapshotQuery(snapshotUrls.streams, StreamListSchema, 60 * 24, true);
  const conditionsQuery = useSnapshotQuery(
    snapshotUrls.conditionsLatest,
    ConditionsListSchema,
    CONDITIONS_TTL_MIN,
    true,
  );

  const snapshotByStream = useMemo(() => {
    const map = new Map<string, ConditionSnapshot>();
    for (const s of conditionsQuery.data?.data ?? []) map.set(s.streamId, s);
    return map;
  }, [conditionsQuery.data]);

  const streams = useMemo(
    () => (streamsQuery.data?.data ?? []).filter((s) => s.stateId === stateId),
    [streamsQuery.data, stateId],
  );

  const rows: Row[] = useMemo(() => {
    if (nearMe) {
      return nearestStreams(streams, geoByStreamId, nearMe).map(({ stream, miles }) => ({
        stream,
        snapshot: snapshotByStream.get(stream.id),
        miles,
      }));
    }
    return streams
      .map((stream) => ({ stream, snapshot: snapshotByStream.get(stream.id) }))
      .sort(
        (a, b) =>
          (b.snapshot?.score.value ?? -1) - (a.snapshot?.score.value ?? -1) ||
          a.stream.name.localeCompare(b.stream.name),
      );
  }, [streams, snapshotByStream, nearMe]);

  const requestNearMe = async () => {
    setGeoError(null);
    try {
      const coords = await getCurrentPosition();
      setNearMe(coords); // used in-memory only — never stored or sent (§ privacy)
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : 'Location unavailable');
    }
  };

  return (
    <main className="page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Conditions</h1>
        <FreshnessChip
          fetchedAt={conditionsQuery.data?.data[0] ? Date.parse(conditionsQuery.data.data[0].fetchedAt) : null}
          live={conditionsQuery.data?.live ?? false}
          observedAt={newestReadingAt((conditionsQuery.data?.data ?? []).flatMap((s) => s.readings))} />
      </div>
      <p className="page-subtitle mt-1">
        Supplied trout assessments and gauge observations. Check observation times and official
        release schedules before fishing.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Chip tone="good">{stateId}</Chip>
        {V1_STATES.filter((s) => s !== stateId).map((s) => (
          <Chip key={s} tone="neutral" title="More states arrive in v2">
            {s} · v2
          </Chip>
        ))}
        {nearMe ? (
          <button
            type="button"
            className="focus-ring ml-auto underline"
            onClick={() => setNearMe(null)}
          >
            Clear near me
          </button>
        ) : (
          <button
            type="button"
            className="focus-ring ml-auto inline-flex items-center gap-1.5 font-bold underline"
            onClick={() => void requestNearMe()}
          >
            <LocationIcon size={16} /> Near me
          </button>
        )}
      </div>
      {geoError && (
        <p className="mt-2 text-sm" style={{ color: 'var(--trout-color-danger)' }} role="alert">
          {geoError} — your location is only ever used on this device.
        </p>
      )}

      {streamsQuery.isLoading || conditionsQuery.isLoading ? (
        <p className="page-subtitle mt-6" role="status">
          Loading streams…
        </p>
      ) : streamsQuery.isError && rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="📡"
            title="Stream catalog not on this device yet"
            description="Open once while online; the catalog then stays available offline."
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🎣"
            title="No streams here yet"
            description={`No ${stateId} streams in the catalog yet.`}
          />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map(({ stream, snapshot, miles }) => (
            <li key={stream.id}>
              <Link
                to={`/conditions/${stream.id}`}
                className="list-row focus-ring"
                style={{ borderRadius: 'var(--trout-radius-lg)' }}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold">{stream.name}</h3>
                    <Chip tone="neutral">{stream.waterbodyType}</Chip>
                    {miles !== undefined && <Chip tone="accent">{formatMiles(miles)}</Chip>}
                  </span>
                  <span
                    className="mt-1 block text-sm"
                    style={{ color: 'var(--trout-color-text-muted)' }}
                  >
                    {snapshot
                      ? `${latestFlowLabel(snapshot)} · ${latestTempLabel(snapshot, settings.tempUnit)} · trend ${TREND_LABEL[flowTrend(snapshot.readings)] || 'n/a'}`
                      : 'No cached readings yet'}
                  </span>
                </span>
                {snapshot &&
                statusForScore(snapshot.score.value, snapshot.readings.length > 0) !== 'no-data' &&
                stream.species !== 'warmwater' ? (
                  <ScorePill score={snapshot.score.value} />
                ) : (
                  <span className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
                    {stream.species === 'warmwater' ? 'Warmwater' : 'Unassessed'}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-6">
        <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          Scores are a starting point, not a guarantee. Dam releases change conditions fast — always
          verify with the official links on each stream page.
        </p>
      </Card>
    </main>
  );
}

export function latestFlowLabel(snapshot: ConditionSnapshot): string {
  const withCfs = [...snapshot.readings].filter((r) => typeof r.cfs === 'number');
  const newest = withCfs.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  return newest?.cfs != null ? formatFlow(newest.cfs) : 'flow unknown';
}

export function latestTempLabel(snapshot: ConditionSnapshot, unit: 'C' | 'F'): string {
  const withTemp = [...snapshot.readings].filter((r) => typeof r.tempC === 'number');
  const newest = withTemp.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  return newest?.tempC != null ? formatTemp(newest.tempC, unit) : 'temp unknown';
}
