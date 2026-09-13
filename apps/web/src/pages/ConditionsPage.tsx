import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Card, EmptyState } from '@trout/ui';
import { ConditionSnapshotSchema, newestReadingAt } from '@trout/contracts';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useStreamsCatalog } from '../lib/useStreamsCatalog';
import { useContentPack } from '../lib/content';
import { useSettingsContext } from '../lib/settings';
import { formatFlow, formatTemp } from '../lib/units';
import { FreshnessChip } from '../components/FreshnessChip';
import { ScorePill } from '../components/ScorePill';
import { CloseIcon, LocationIcon, SearchIcon } from '../components/icons';
import { formatMiles, getCurrentPosition, nearestStreams } from '../lib/geo';
import { ageMinutes } from '../lib/time';
import geoJson from '../data/streams-geo.json';
import { statusForScore } from '../features/map/riverMapSelectors';
import { useFishabilityIndex } from '../lib/fishability';
import type { FishabilityFocus } from '../features/map/waterDecision';
import { decisionStatusText, toWaterDecisionView } from '../features/map/waterDecision';

/** Bundled coordinates (public USGS gauge locations) for the on-device "near me". */
const geoByStreamId = geoJson as unknown as Record<string, { lat: number; lon: number }>;

const CONDITIONS_TTL_MIN = 60; // USGS refreshes hourly (§8)
const ConditionsListSchema = z.array(ConditionSnapshotSchema);

/**
 * Search-first progressive disclosure (UI redesign): the page opens with a
 * search field, a near-me activation, and a handful of relevant/recent
 * waters — never the whole catalog. The full list only appears through an
 * explicit search, and every selection deep-links to /conditions/:streamId
 * so browser history and shareable URLs keep working.
 */
interface Row {
  stream: Stream;
  snapshot: ConditionSnapshot | undefined;
  miles?: number;
}

/** Match + rank a search query against names/regions (name hits first). */
function matchRows(
  streams: Stream[],
  snapshotByStream: Map<string, ConditionSnapshot>,
  query: string,
): Row[] {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const q = normalize(query);
  return streams
    .map((stream) => ({ stream, snapshot: snapshotByStream.get(stream.id) }))
    .filter(
      ({ stream }) =>
        !q ||
        normalize(stream.name + ' ' + (stream.notes ?? '')).includes(q) ||
        normalize(stream.id).includes(q),
    )
    .sort(
      (a, b) =>
        Number(normalize(b.stream.name).includes(q)) -
          Number(normalize(a.stream.name).includes(q)) ||
        a.stream.name.localeCompare(b.stream.name),
    );
}

const SEARCH_RESULT_CAP = 24;
const NEAR_ME_COUNT = 8;

/** Conditions browser (scope 4) — search-first, disclosed progressively. */
export function ConditionsPage() {
  const { settings } = useSettingsContext();
  // T2-33: the Default-state setting is gone — Tennessee is the only served
  // state; other stateIds silently emptied every scoped page.
  const stateId = 'TN' as const;
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [nearMe, setNearMe] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const streamsQuery = useStreamsCatalog(60 * 24, true);
  // Warm the content pack while online: this page is the app's "open once
  // while online" surface, and the match-the-hatch key needs the pack in the
  // on-device cache to rank matches offline on a brand-new install.
  useContentPack();
  const conditionsQuery = useSnapshotQuery(
    snapshotUrls.conditionsLatest,
    ConditionsListSchema,
    CONDITIONS_TTL_MIN,
    true,
  );

  const setQuery = (value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );

  const snapshotByStream = useMemo(() => {
    const map = new Map<string, ConditionSnapshot>();
    for (const s of conditionsQuery.data?.data ?? []) map.set(s.streamId, s);
    return map;
  }, [conditionsQuery.data]);

  // F6 all-fish mode: the persisted focus species' comfort snapshots feed the
  // rows that wear the fishability metric.
  const allFish = settings.speciesMode === 'all';
  const focus = (settings.speciesFocus || null) as import('@trout/contracts').SpeciesKey | null;
  const fishabilityIndexQ = useFishabilityIndex(streamsQuery.data?.data, focus, allFish);
  const fishabilityByWater = fishabilityIndexQ.data ?? {};

  const streams = useMemo(
    () => (streamsQuery.data?.data ?? []).filter((s) => s.stateId === stateId),
    [streamsQuery.data, stateId],
  );

  const searching = query.trim().length > 0;

  const searchRows = useMemo(
    () => (searching ? matchRows(streams, snapshotByStream, query).slice(0, SEARCH_RESULT_CAP) : []),
    [searching, streams, snapshotByStream, query],
  );

  // Relevance strip — the major tailwaters, best score first. A small,
  // editorial answer to "where do I go" that never grows into the catalog.
  // T2-24: rows sort by the score they DISPLAY — a non-trout row never wears
  // the trout pill, so it can't be ordered by that hidden number.
  const tailwaterRows = useMemo(() => {
    const visibleScore = (s: Stream): number => {
      if (s.species !== 'trout') return -1;
      const snap = snapshotByStream.get(s.id);
      if (!snap) return -1;
      const hasData = (snap.readings.length ?? 0) > 0;
      const status = statusForScore(snap.score.value, hasData, snap.score.assessed);
      return status !== 'no-data' ? snap.score.value : -1;
    };
    return streams
      .filter((s) => s.waterbodyType === 'tailrace' && snapshotByStream.has(s.id))
      .map((stream) => ({ stream, snapshot: snapshotByStream.get(stream.id)! }))
      .sort(
        (a, b) =>
          visibleScore(b.stream) - visibleScore(a.stream) ||
          a.stream.name.localeCompare(b.stream.name),
      )
      .slice(0, 4);
  }, [streams, snapshotByStream]);

  // Recency strip — the waters whose newest gauge observation is freshest.
  const recentRows = useMemo(() => {
    const observed = (s: Stream): number => {
      const snap = snapshotByStream.get(s.id);
      const reading = newestReadingAt(snap?.readings ?? []);
      if (reading != null) return reading;
      const fetched = snap ? Date.parse(snap.fetchedAt) : NaN;
      return Number.isFinite(fetched) ? fetched : 0;
    };
    return streams
      .filter((s) => snapshotByStream.has(s.id))
      .sort((a, b) => observed(b) - observed(a) || a.name.localeCompare(b.name))
      .slice(0, 4)
      .map((stream) => ({ stream, snapshot: snapshotByStream.get(stream.id)! }));
  }, [streams, snapshotByStream]);

  const nearRows = useMemo(() => {
    if (!nearMe) return [];
    return nearestStreams(streams, geoByStreamId, nearMe)
      .slice(0, NEAR_ME_COUNT)
      .map(({ stream, miles }) => ({ stream, snapshot: snapshotByStream.get(stream.id), miles }));
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

  const totalCount = streams.length;
  const searchingState = streamsQuery.isLoading || conditionsQuery.isLoading;

  useEffect(() => {
    document.title = 'Conditions — Trout field atlas';
    return () => {
      document.title = 'Trout — The Field Atlas';
    };
  }, []);

  return (
    <main className="page conditions-discovery">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Conditions</h1>
        <FreshnessChip
          fetchedAt={
            conditionsQuery.data?.data[0] ? Date.parse(conditionsQuery.data.data[0].fetchedAt) : null
          }
          live={conditionsQuery.data?.live ?? false}
          observedAt={newestReadingAt((conditionsQuery.data?.data ?? []).flatMap((s) => s.readings))}
        />
      </div>
      <p className="page-subtitle mt-1">
        Gauge readings with honest status for every water we track. Search a water, or start from
        the waters below — the full catalog never opens on its own.
      </p>

      <div className="discovery-search mt-4">
        <div className="search-field">
          <SearchIcon size={18} className="search-icon" />
          <input
            className="search-input"
            type="search"
            aria-label="Search waters by name"
            placeholder="Search a named water — try “Clinch”…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching && (
            <button
              type="button"
              className="discovery-clear"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>
        <div className="discovery-actions">
          {nearMe ? (
            <button
              type="button"
              className="text-action"
              onClick={() => setNearMe(null)}
            >
              Clear near me
            </button>
          ) : (
            <button
              type="button"
              className="secondary-action discovery-near"
              onClick={() => void requestNearMe()}
            >
              <LocationIcon size={16} /> Near me
            </button>
          )}
        </div>
      </div>
      {geoError && (
        <p className="mt-2 text-sm" style={{ color: 'var(--trout-color-danger)' }} role="alert">
          {geoError} — your location is only ever used on this device.
        </p>
      )}

      {searchingState ? (
        <p className="page-subtitle mt-6" role="status">
          Loading waters…
        </p>
      ) : streamsQuery.isError && totalCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="📡"
            title="Stream catalog not on this device yet"
            description="Open once while online; the catalog then stays available offline."
          />
        </div>
      ) : searching ? (
        <section className="mt-6" aria-label="Search results">
          <p className="muted text-sm" role="status">
            {searchRows.length === 0
              ? `No waters match “${query}”.`
              : `${searchRows.length} of ${totalCount} waters${searchRows.length === SEARCH_RESULT_CAP ? ' — keep typing to narrow it' : ''}`}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {searchRows.map((row) => (
              <ConditionRow
                key={row.stream.id}
                {...row}
                tempUnit={settings.tempUnit}
                speciesMode={settings.speciesMode}
                fishabilityByWater={fishabilityByWater}
                focus={focus}
              />
            ))}
          </ul>
        </section>
      ) : nearMe ? (
        <section className="mt-6" aria-label="Waters near you">
          <p className="muted text-sm" role="status">
            Closest {nearRows.length} waters with gauges — distances stay on this device.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {nearRows.map((row) => (
              <ConditionRow
                key={row.stream.id}
                {...row}
                tempUnit={settings.tempUnit}
                speciesMode={settings.speciesMode}
                fishabilityByWater={fishabilityByWater}
                focus={focus}
              />
            ))}
          </ul>
        </section>
      ) : (
        <>
          <WaterSection
            title="Tailwaters now"
            note="Big water, gauged around the clock — best scores first."
            rows={tailwaterRows}
            tempUnit={settings.tempUnit}
            speciesMode={settings.speciesMode}
            fishabilityByWater={fishabilityByWater}
            focus={focus}
          />
          <WaterSection
            title="Recently observed"
            note="Newest gauge observations across the state."
            rows={recentRows}
            tempUnit={settings.tempUnit}
            speciesMode={settings.speciesMode}
            fishabilityByWater={fishabilityByWater}
            focus={focus}
          />
          <p className="muted text-sm mt-6">
            Looking for a specific creek? Search above — {totalCount} waters are in the catalog and
            none of them load until you ask.
          </p>
        </>
      )}

      <Card className="mt-6">
        <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          Scores are a starting point, not a guarantee. Dam releases change conditions fast — always
          verify with the official links on each water page.
        </p>
      </Card>
    </main>
  );
}

function WaterSection({
  title,
  note,
  rows,
  tempUnit,
  speciesMode,
  fishabilityByWater,
  focus,
}: {
  title: string;
  note: string;
  rows: Row[];
  tempUnit: 'C' | 'F';
  speciesMode: 'trout' | 'all';
  fishabilityByWater: Record<string, import('@trout/contracts').FishabilitySnapshot>;
  focus: string | null;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mt-6" aria-label={title}>
      <h2 className="section-title !mt-0">{title}</h2>
      <p className="muted text-sm">{note}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <ConditionRow
            key={row.stream.id}
            {...row}
            tempUnit={tempUnit}
            speciesMode={speciesMode}
            fishabilityByWater={fishabilityByWater}
            focus={focus}
          />
        ))}
      </ul>
    </section>
  );
}

function ConditionRow({
  stream,
  snapshot,
  miles,
  tempUnit,
  speciesMode,
  fishabilityByWater,
  focus,
}: Row & {
  tempUnit: 'C' | 'F';
  speciesMode: 'trout' | 'all';
  fishabilityByWater: Record<string, import('@trout/contracts').FishabilitySnapshot>;
  focus: string | null;
}) {
  const hasData = (snapshot?.readings.length ?? 0) > 0;
  const status = statusForScore(snapshot?.score.value ?? null, hasData, snapshot?.score?.assessed);
  // Catalog species verbatim — unknown stays unknown (H3); the decision model
  // classifies it and it never wears a trout score pill.
  const species = stream.species;
  // The selected-month signal rides the decision: seasonal waters read
  // "Out of season"/"Seasonal" instead of a trout band (T1-18/19).
  // F6: the site-wide species mode drives the decision everywhere (the
  // fishability metric itself lands with the data layer).
  const focusScore = focus
    ? fishabilityByWater[stream.id]?.bySpecies[focus as import('@trout/contracts').SpeciesKey]
    : undefined;
  const fishability: FishabilityFocus | undefined = focusScore
    ? { species: focus as never, comfort: focusScore.comfort }
    : undefined;
  const decision = toWaterDecisionView(
    { stream, status, score: snapshot?.score?.value ?? null, snapshot, species },
    speciesMode,
    new Date().getMonth() + 1,
    fishability,
  );
  const observedAt = newestReadingAt(snapshot?.readings ?? []);
  const stateText = decisionStatusText(decision, { species, status }, fishability);
  return (
    <li key={stream.id}>
      <Link
        to={`/conditions/${stream.id}`}
        className="list-row focus-ring water-card"
        style={{ borderRadius: 'var(--trout-radius-lg)' }}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold">{stream.name}</h3>
            {miles !== undefined && <span className="distance-chip">{formatMiles(miles)}</span>}
          </span>
          <span
            className="mt-1 block text-sm"
            style={{ color: 'var(--trout-color-text-muted)' }}
          >
            {snapshot
              ? observedAt
                ? `Observed ${ageMinutes(observedAt)} · ${latestFlowLabel(snapshot)} · ${latestTempLabel(snapshot, tempUnit)}`
                : `${latestFlowLabel(snapshot)} · ${latestTempLabel(snapshot, tempUnit)}`
              : 'No cached readings yet'}
          </span>
        </span>
        {decision.displayMetric === 'trout-condition' && snapshot ? (
          <ScorePill score={snapshot.score.value} />
        ) : decision.displayMetric === 'fishability' && fishability ? (
          <ScorePill score={fishability.comfort.value} />
        ) : (
          <span className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
            {stateText}
          </span>
        )}
      </Link>
    </li>
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
