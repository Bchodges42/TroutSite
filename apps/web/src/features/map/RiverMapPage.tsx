import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import { Drawer } from 'vaul';
import { TennesseeMap, TN_BOUNDS } from './TennesseeMap';
import { statewideCamera } from './mapTokens';
import { RiverDrawer } from './RiverDrawer';
import { RiverSearch } from './RiverSearch';
import { MapControlGroup } from './MapControlGroup';
import { useRiverMapData } from './useRiverMapData';
import { useOnline } from '../../hooks/useOnline';
import { useTheme } from '../../theme/ThemeProvider';
import { validMonth } from '../../lib/riverContext';
import { waterTypeLabel } from '../../lib/presentation';
import type { RoadsSpec } from './mapStyle';
import { monthName, regionName } from '../../data/regions';
import { decisionStatusText, decisionColorToken, toWaterDecisionView } from './waterDecision';
import { probeRoadsAvailability, probeTerrainAvailability } from '../../lib/atlasAvailability';
import { useSettingsContext } from '../../lib/settings';
import { catalogFocusSpecies } from '../../lib/fishability';
import type { SpeciesKey } from '@trout/contracts';
import { QaPanel } from './qa/QaPanel';
import { MapLegend } from './MapLegend';
import { fisheryTypeCounts } from './fisheryType';
import { SPECIES_LABELS } from '../../lib/fishability';
import type { RiverMapFeature } from './riverMapSelectors';
import { CloseIcon, WavesIcon, BugIcon } from '../../components/icons';
const tabs = ['Water', 'Hatch', 'Stocking', 'Reports', 'Your Log'] as const;
type Place = { name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' };
export function RiverMapPage() {
  const [params, setParams] = useSearchParams();
  const { settings, update: updateSettings } = useSettingsContext();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const online = useOnline();
  const selectedId = params.get('river');
  const tab = tabs.find((t) => t === params.get('tab')) ?? 'Water';
  const month = validMonth(params.get('month'));
  const mode = params.get('mode') === 'hatches' ? 'hatches' : 'conditions';
  // F6: species mode is a site-wide setting; the shareable ?species= URL
  // override wins when present. ?focus= (TASK 2) picks the species whose
  // fishability all-fish mode surfaces.
  const urlSpecies = params.get('species');
  const species: 'trout' | 'all' =
    urlSpecies === 'all' || urlSpecies === 'trout'
      ? urlSpecies
      : (settings.speciesMode ?? 'trout');
  // Focus species: the map's shareable ?focus= override wins; otherwise the
  // persisted picker choice drives every all-fish surface.
  const focusSpecies =
    (params.get('focus') as SpeciesKey | null) ?? (settings.speciesFocus || null);
  const assessedOnly = params.get('assessed') === '1';
  const roadsOn = params.get('roads') === '1';
  // ?qa=1 — INTERNAL geometry QA overlay (not advertised; chip shows only
  // while the param is present).
  const qaOn = params.get('qa') === '1';
  const [qaOpen, setQaOpen] = useState(true);
  const data = useRiverMapData({ month, focusSpecies: species === 'all' ? focusSpecies : null });
  const selected = data.features.find((f) => f.stream.id === selectedId) ?? null;
  const indexOpen = !selectedId && params.get('atlas') === '1';
  const [expanded, setExpanded] = useState(false);
  const [layers, setLayers] = useState(false);
  const [topoAvailable, setTopoAvailable] = useState(false);
  const [roadsManifest, setRoadsManifest] = useState<RoadsSpec | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [locationNote, setLocationNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [mapAvailable, setMapAvailable] = useState(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width:901px)').matches);
  // Explicit mobile states (H2): exactly one primary surface per state.
  // map → floating search + mode tools; atlas → the field-atlas panel's own
  // search; inspector → the drawer (no floating chrome over its controls).
  const mobileView: 'map' | 'atlas' | 'inspector' = desktop
    ? 'map'
    : selectedId
      ? 'inspector'
      : indexOpen
        ? 'atlas'
        : 'map';
  // Mobile inspector renders as a vaul bottom sheet (drag, snap, velocity)
  // instead of the old CSS-only panel. The desktop side panel is unchanged.
  const mobileInspector = !desktop && Boolean(selectedId);
  // Keep the last non-null feature rendered while the sheet plays its
  // dismiss animation — selectedId is already cleared at that point.
  const lastFeature = useRef<RiverMapFeature | null>(null);
  if (selected) lastFeature.current = selected;
  const onMapReady = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    setMapAvailable(true);
  }, []);
  const update = (values: Record<string, string | null>, replace = true) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(values).forEach(([key, value]) =>
          value === null ? next.delete(key) : next.set(key, value),
        );
        return next;
      },
      { replace },
    );
  const setRiver = (id: string | null) => {
    setExpanded(false);
    update({ river: id, tab: id ? 'Water' : null, atlas: null }, false);
  };
  const focusExploreControl = () =>
    requestAnimationFrame(() => {
      const visibleSearch = [...document.querySelectorAll<HTMLInputElement>('.search-input')].find(
        (el) => el.getClientRects().length > 0,
      );
      (visibleSearch ?? document.querySelector<HTMLElement>('.map-fab-search'))?.focus();
    });
  // The atlas has ONE path per surface: the search control (group icon on
  // desktop, the always-visible field's list on mobile). No second chrome
  // entry opens it.
  const openIndex = () => {
    setExpanded(false);
    update({ river: null, tab: null, atlas: '1' });
  };
  const closeIndex = () => {
    update({ atlas: null });
    focusExploreControl();
  };
  const close = () => {
    setRiver(null);
    focusExploreControl();
  };
  const recenterTennessee = () => {
    const map = mapRef.current;
    if (!map) return;
    // H1: same shared camera as the initial load — one statewide fit.
    const el = map.getContainer();
    const overview = statewideCamera(
      el.clientWidth || window.innerWidth,
      el.clientHeight || window.innerHeight,
    );
    map.fitBounds(TN_BOUNDS, { padding: overview.padding, maxZoom: overview.maxZoom, duration: 0 });
    setLayers(false);
  };
  useEffect(() => {
    const media = window.matchMedia('(min-width:901px)');
    const change = () => setDesktop(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  // The mobile sheet is NON-modal by design: the map and the header above it
  // stay visible and operable. vaul mounts on Radix Dialog, whose modal
  // side-effect sets aria-hidden on everything outside the sheet — hiding
  // the header (search, theme, menu) from assistive tech while the sheet is
  // open. Undo that attribute for as long as the sheet exists.
  useEffect(() => {
    if (desktop || !selectedId) return;
    const header = document.querySelector('.app-header');
    if (!header) return;
    const undo = () => {
      if (header.getAttribute('aria-hidden') === 'true') header.removeAttribute('aria-hidden');
    };
    undo();
    const observer = new MutationObserver(undo);
    observer.observe(header, { attributes: true, attributeFilter: ['aria-hidden'] });
    return () => observer.disconnect();
  }, [desktop, selectedId]);
  useEffect(() => {
    if (selectedId)
      requestAnimationFrame(() =>
        document.getElementById('river-inspector')?.focus({ preventScroll: true }),
      );
  }, [selectedId]);
  useEffect(() => {
    if (indexOpen)
      requestAnimationFrame(() =>
        [...document.querySelectorAll<HTMLInputElement>('.search-input')]
          .find((el) => el.getClientRects().length > 0)
          ?.focus(),
      );
  }, [indexOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.getElementById('app-menu')) {
        if (selectedId) close();
        else if (indexOpen) closeIndex();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    const b = params.get('basemap');
    if (b === 'paper' && theme.id !== 'daybreak') setTheme('daybreak');
    if (b === 'ink' && theme.id !== 'nightfall') setTheme('nightfall');
  }, [params.get('basemap')]);
  useEffect(() => {
    let cancelled = false;
    fetch('/atlas/places.json')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && Array.isArray(j.places)) setPlaces(j.places);
      })
      .catch(() => {});
    // Terrain/Roads availability is PROBED, not assumed: the manifest must be
    // well-formed AND the assets it references must actually be servable
    // (probed: one real hillshade tile; every road file). A manifest that
    // lists files the deployment cannot serve disables the control instead of
    // shipping a broken layer. The terrain probe also purges the service
    // worker's CacheFirst topo cache when the asset build has changed — stale
    // pre-alpha hillshade tiles under unchanged URLs were the Nightfall
    // rectangle. A failed probe (SPA fallback answering HTML for a missing
    // manifest, offline, partial deploy) degrades to the control being
    // disabled — never to a broken map.
    probeTerrainAvailability().then((available) => {
      if (!cancelled) setTopoAvailable(available);
    });
    probeRoadsAvailability().then((manifest) => {
      if (!cancelled) setRoadsManifest(manifest as RoadsSpec | null);
    });
    return () => {
      cancelled = true;
      markerRef.current?.remove();
    };
  }, []);
  useEffect(() => {
    if (!mapAvailable || !userPosition || !mapRef.current) return;
    const map = mapRef.current;
    map.easeTo({
      center: userPosition,
      zoom: 9,
      duration:
        document.documentElement.classList.contains('reduce-motion') ||
        window.matchMedia('(prefers-reduced-motion:reduce)').matches
          ? 0
          : 300,
      padding: { top: 140, bottom: desktop ? 80 : 320, left: 30, right: 30 },
    });
    markerRef.current?.remove();
    const el = document.createElement('div');
    el.className = 'user-location';
    el.setAttribute('aria-label', 'Your approximate location');
    markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(userPosition).addTo(map);
  }, [userPosition, mapAvailable, desktop]);
  const locate = () => {
    if (!navigator.geolocation) {
      setLocationNote('Location is not available in this browser. Search for a water instead.');
      return;
    }
    setLocating(true);
    setLocationNote('Finding your location… Coordinates stay on this device.');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { longitude: lon, latitude: lat } = position.coords;
        if (lon < -90.4 || lon > -81.5 || lat < 34.9 || lat > 36.8) {
          setLocationNote(
            'You are outside Tennessee. Explore the map or search for a Tennessee water.',
          );
          return;
        }
        setUserPosition([lon, lat]);
        setLocationNote('Map centered near you. Location is used only in this session.');
      },
      (error) => {
        setLocating(false);
        setLocationNote(
          error.code === 1
            ? 'Location permission was declined. You can still search every water.'
            : 'Could not find your location. Try again or search a river.',
        );
      },
      { maximumAge: 300000, timeout: 8000 },
    );
  };
  const filtered = data.features.filter((f) => {
    // Visibility is the decision model's call (H3): unknown-species waters
    // stay discoverable in trout mode but never read as confirmed trout;
    // plain warmwater is excluded there; the stocked Harpeth is deemphasized.
    // The selected month rides along: seasonal waters keep their row but the
    // decision drops the trout metric out of season (T1-18/19).
    const decision = toWaterDecisionView(f, species, month, f.fishability);
    return (
      (species === 'all' || decision.visibility !== 'exclude' || f.stream.id === selectedId) &&
      (!assessedOnly || f.status !== 'no-data' || f.stream.id === selectedId)
    );
  });
  const sorted = [...filtered].sort(
    (a, b) =>
      Number(b.status !== 'no-data') - Number(a.status !== 'no-data') ||
      a.stream.name.localeCompare(b.stream.name),
  );
  const visibleIds = useMemo(
    () => new Set(filtered.map((f) => f.stream.id)),
    [filtered.map((f) => f.stream.id).join(',')],
  );
  const assessedIds = useMemo(
    () =>
      new Set(
        data.features
          .filter((f) => toWaterDecisionView(f, 'trout').troutApplicability === 'confirmed-current')
          .map((f) => f.stream.id),
      ),
    [data.features.map((f) => f.stream.id + f.status + f.species).join(',')],
  );
  const stillWaterIds = useMemo(
    () =>
      new Set(
        data.streams
          .filter((stream) => ['lake', 'pond', 'reservoir'].includes(stream.waterbodyType))
          .map((stream) => stream.id),
      ),
    [data.streams.map((stream) => stream.id + stream.waterbodyType).join(',')],
  );
  // M2: one water-type vocabulary shared by map labels and the inspector.
  const waterTypes = useMemo(
    () => new Map(data.streams.map((s) => [s.id, waterTypeLabel(s.waterbodyType)] as const)),
    [data.streams.map((s) => s.id + s.waterbodyType).join(',')],
  );
  // H5 mode-aware labels: catalog species per water, from the same streams
  // snapshot the corridors already join — the label policy never re-fetches
  // and never guesses a species the catalog leaves unset.
  const labelSpecies = useMemo(
    () => new Map(data.streams.flatMap((s) => (s.species ? [[s.id, s.species] as const] : []))),
    [data.streams.map((s) => s.id + (s.species ?? '')).join(',')],
  );
  const labelDisplay = useMemo(
    () => new Map(data.streams.map((s) => [s.id, s.display ?? 'standard'] as const)),
    [data.streams.map((s) => s.id + (s.display ?? '')).join(',')],
  );
  const seasonalAbsentIds = useMemo(
    () =>
      new Set(
        data.features
          .filter((f) => toWaterDecisionView(f, 'trout', month).troutApplicability === 'seasonal-likely-absent')
          .map((f) => f.stream.id),
      ),
    [data.features.map((f) => f.stream.id + (f.stream.seasonMonths ?? []).join('.')).join(','), month],
  );
  // C1: "no assessed waters" has two different truths — the filter genuinely
  // matched nothing, or the condition feed itself has no coverage (every
  // record unassessed with the builder's stale stamp, or an empty feed). Only
  // the feed-level state earns the coverage explainer; scores are never
  // manufactured to fill the gap. live-fix: a conditions fetch that FAILED
  // outright (host outage) is also feed-level unavailability — the catalog
  // (pack fallback) still renders, the footer says why there are no scores.
  const coverageUnavailable =
    !data.isLoading &&
    !data.isError &&
    ((data.live &&
      (data.conditionsFeed.records === 0 ||
        (data.conditionsFeed.assessedCount === 0 && data.conditionsFeed.buildStale))) ||
      data.conditionsUnavailable);
  const colors = useMemo(
    () =>
      new Map(
        data.features.map((f) => {
          const token = decisionColorToken(toWaterDecisionView(f, species, month, f.fishability), f, f.fishability);
          return [
            f.stream.id,
            token === 'warmwater'
              ? theme.map.warmwater
              : token === 'no-data'
                ? theme.map.noData
                : theme.map[token],
          ] as const;
        }),
      ),
    [data.features.map((f) => f.stream.id + f.status + f.species).join(','), species, month, theme.id],
  );
  const hatchActive = useMemo(
    () =>
      new Set(
        mode === 'hatches'
          ? filtered
              .filter(
                (f) =>
                  // T1-17/19: the halo advertises TROUT hatch guidance — only
                  // waters wearing the trout metric light one (the fishability
                  // metric has no hatch model; that lands with Stage 4).
                  toWaterDecisionView(f, species, month, f.fishability).displayMetric ===
                    'trout-condition' &&
                  // Expected-activity rework: any charted guidance lights the
                  // halo (abundance >= 1). The old >= 2 cut produced dead
                  // "nothing is hatching" months; something hatches year-round.
                  f.hatchChart?.entries.some((e) => e.abundance >= 1),
              )
              .map((f) => f.stream.id)
          : [],
      ),
    [mode, month, data.hatchMap.size, visibleIds, species],
  );
  const basemap =
    topoAvailable && (params.get('terrain') === '1' || params.get('basemap') === 'topo')
      ? 'topo'
      : theme.id === 'daybreak'
        ? 'paper'
        : 'ink';
  const filters = (
    <div className="filter-row" aria-label="Filter waters">
      {/* T2-23: species and assessed are INDEPENDENT dimensions — each chip
      toggles only its own URL param, so "assessed-only warmwater" is
      expressible and no chip silently resets the other. */}
      <button
        className="filter-chip"
        aria-pressed={species === 'trout'}
        onClick={() => update({ species: null })}
      >
        Trout
      </button>
      <button
        className="filter-chip"
        aria-pressed={species === 'all'}
        onClick={() => update({ species: 'all' })}
      >
        All fish
      </button>
      <button
        className="filter-chip"
        aria-pressed={assessedOnly}
        onClick={() => update({ assessed: assessedOnly ? null : '1' })}
      >
        Assessed
      </button>
      {species === 'all' && (
        <select
          className="filter-select"
          aria-label="Fishability species"
          value={focusSpecies ?? ''}
          onChange={(e) => {
            update({ focus: e.target.value || null });
            updateSettings({ speciesFocus: (e.target.value || '') as never });
          }}
          data-testid="focus-picker"
        >
          <option value="">All species</option>
          {catalogFocusSpecies(data.streams).map((sp) => (
            <option key={sp} value={sp}>
              {SPECIES_LABELS[sp]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
  const layerPanel = (
    <>
      <label>
        <input
          type="radio"
          name="map-mode"
          checked={mode === 'conditions'}
          onChange={() => update({ mode: 'conditions' })}
        />
        Water conditions
      </label>
      <label>
        <input
          type="radio"
          name="map-mode"
          checked={mode === 'hatches'}
          onChange={() => update({ mode: 'hatches' })}
        />
        Seasonal hatches
      </label>
      {mode === 'hatches' && (
        <select
          aria-label="Hatch month"
          value={month}
          onChange={(e) => update({ month: e.target.value })}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {monthName(i + 1)}
            </option>
          ))}
        </select>
      )}
      <label>
        <input
          type="checkbox"
          checked={basemap === 'topo'}
          disabled={!topoAvailable}
          onChange={(e) => update({ terrain: e.target.checked ? '1' : null, basemap: null })}
        />
        Terrain relief
      </label>
      <p className="muted text-xs">
        {topoAvailable
          ? theme.id === 'nightfall'
            ? 'USGS terrain contours · clearer as you zoom in'
            : 'USGS shaded relief · clearer as you zoom in'
          : 'Terrain is not available on this device.'}
      </p>
      <label>
        <input
          type="checkbox"
          checked={roadsOn}
          disabled={!roadsManifest}
          onChange={(e) => update({ roads: e.target.checked ? '1' : null })}
        />
        Roads
      </label>
      <p className="muted text-xs">
        {roadsManifest
          ? 'Context road network (US Census TIGER) · off by default'
          : 'Road context is not available on this device.'}
      </p>
    </>
  );
  return (
    <div className="field-map">
      <aside
        className={
          'water-sidebar' +
          (selectedId && !mobileInspector ? ' is-inspecting' : '') +
          (indexOpen ? ' is-index-open' : '') +
          (expanded && !mobileInspector ? ' is-expanded' : '')
        }
        aria-label={selectedId && !mobileInspector ? 'River inspector' : 'Explore waters'}
      >
        {selectedId && !mobileInspector ? (
          <>
            {desktop && (
              <div className="px-6 pt-5">
                <RiverSearch streams={data.streams} onSelect={setRiver} />
              </div>
            )}
            <button
              className="sheet-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show map' : 'Expand details'}
            </button>
            <RiverDrawer
              feature={selected}
              tab={tab}
              onTab={(t) => {
                update({ tab: t });
                if (!desktop) setExpanded(true);
              }}
              onClose={close}
              onBack={openIndex}
              modeMonth={month}
              live={data.live}
              fetchedAt={data.fetchedAt}
              layout="panel"
              loading={data.isLoading}
            />
          </>
        ) : !selectedId ? (
          <>
            <div className="explore-heading">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Tennessee / Field atlas</span>
                {indexOpen && (
                  <button
                    className="icon-button"
                    aria-label="Close water list"
                    onClick={closeIndex}
                  >
                    <CloseIcon size={18} />
                  </button>
                )}
              </div>
              <h1>Find your water.</h1>
              <p>Follow the rivers. Read the conditions.</p>
            </div>
            <div className="explore-tools">
              <RiverSearch streams={data.streams} onSelect={setRiver} shortcut={desktop} />
              {filters}
            </div>
            <div className="index-heading">
              <strong>{filtered.length} waters</strong>
              <span>Assessed first</span>
            </div>
            <div className="water-index" aria-label="Tennessee water index">
              {data.isLoading && (
                <p className="search-note" role="status">
                  Loading the water catalog… The map controls are ready.
                </p>
              )}
              {data.isError && (
                <div className="empty-note">
                  <strong>Catalog unavailable</strong>
                  <p>
                    Reconnect to download the water list. Previously saved waters stay available
                    offline.
                  </p>
                  <button className="text-action" onClick={() => window.location.reload()}>
                    Try again →
                  </button>
                </div>
              )}
              {!data.isLoading && !data.isError && sorted.length === 0 && coverageUnavailable && (
                <div className="empty-note">
                  <strong>Condition coverage is unavailable</strong>
                  <p>
                    The gauge feed has no observations right now
                    {data.conditionsFeed.lastFetchedAt
                      ? ` — the feed was last checked ${new Date(data.conditionsFeed.lastFetchedAt).toLocaleString()}`
                      : ''}
                    , so no water can show an assessment. The full catalog is still below.
                  </p>
                  <button className="text-action" onClick={() => update({ assessed: null })}>
                    Show every water →
                  </button>
                </div>
              )}
              {!data.isLoading && !data.isError && sorted.length === 0 && !coverageUnavailable && (
                <p className="search-note">
                  No waters match this filter. Choose All fish to browse the catalog.
                </p>
              )}
              {sorted.map((f) => {
                const decision = toWaterDecisionView(f, species, month, f.fishability);
                return (
                  <button
                    key={f.stream.id}
                    className="water-row"
                    onClick={() => setRiver(f.stream.id)}
                    aria-label={
                      'Select ' + f.stream.name + ' — ' + decisionStatusText(decision, f, f.fishability)
                    }
                    data-status={f.status}
                  >
                    <span className="water-symbol">
                      <WavesIcon size={17} />
                    </span>
                    <span className="water-row-copy">
                      <strong>{f.stream.name}</strong>
                      <small>{regionName(f.stream.regionId).split(' — ')[0]}</small>
                    </span>
                    <span className="water-row-meta">
                      <span className="status-text">
                        {decisionStatusText(decision, f, f.fishability)}
                      </span>
                      <small>
                        {decision.displayMetric === 'trout-condition' && f.score !== null
                          ? f.score + ' / 100'
                          : decision.displayMetric === 'fishability' && f.fishability
                            ? f.fishability.comfort.value + ' / 100'
                            : 'No score'}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
            <footer className="index-footer">
              <span>
                {online
                  ? coverageUnavailable
                    ? 'Condition feed unavailable · no observations right now'
                    : 'Snapshot data · check observation times'
                  : 'Offline · saved information'}
              </span>
              <Link to="/browse">Full list ↗</Link>
            </footer>
          </>
        ) : null}
      </aside>
      {!desktop && (
        // Non-modal bottom sheet: the map above stays pannable/zoomable,
        // matching the old CSS panel; vaul adds drag-to-dismiss, velocity,
        // and the 49% / 82% snap points.
        <Drawer.Root
          open={mobileInspector}
          modal={false}
          snapPoints={[0.49, 0.82]}
          activeSnapPoint={expanded ? 0.82 : 0.49}
          setActiveSnapPoint={(snapPoint) => setExpanded(snapPoint === 0.82)}
          onOpenChange={(open) => {
            if (!open) close();
          }}
        >
          <Drawer.Portal>
            <Drawer.Content className="river-sheet" aria-label="River inspector">
              {/* The sheet's accessible name. NOT an h2: the drawer body has the
              visible water heading, and a second heading inside the same
              dialog made locator("[role=dialog]").getByRole("heading")
              resolve twice (stage-2 atlas-verify strict-mode fix). */}
              <Drawer.Title asChild>
                <span className="trout-sr-only">
                  {(selected ?? lastFeature.current)?.stream.name ?? 'River details'}
                </span>
              </Drawer.Title>
              <div className="river-sheet-grab" aria-hidden="true" />
              <button
                className="sheet-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show map' : 'Expand details'}
              </button>
              <RiverDrawer
                feature={selected ?? lastFeature.current}
                tab={tab}
                onTab={(t) => {
                  update({ tab: t });
                  setExpanded(true);
                }}
                onClose={close}
                onBack={openIndex}
                modeMonth={month}
                live={data.live}
                fetchedAt={data.fetchedAt}
                // Inside the vaul sheet the Drawer.Content is already the
                // dialog; a second role="dialog" here duplicated the surface.
                layout="sheet"
                loading={data.isLoading}
              />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
      <div
        className={
          'map-canvas-area' +
          (mobileInspector ? ' has-sheet' : '') +
          (mobileInspector && expanded ? ' sheet-expanded' : '')
        }
      >
        <TennesseeMap
          selectedId={selectedId}
          onSelect={setRiver}
          featureColors={colors}
          visibleIds={visibleIds}
          assessedIds={assessedIds}
          labelSpecies={labelSpecies}
          labelDisplay={labelDisplay}
          seasonalAbsentIds={seasonalAbsentIds}
          speciesMode={species}
          stillWaterIds={stillWaterIds}
          waterTypes={waterTypes}
          hatchActiveIds={hatchActive}
          basemap={basemap}
          roads={roadsOn && roadsManifest ? roadsManifest : undefined}
          places={places}
          onMapReady={onMapReady}
          viewKey={location.key}
          viewRoute={location.pathname + location.search}
          layout={desktop ? 'desktop' : 'mobile'}
          mobileSheet={!desktop && selectedId ? (expanded ? 'expanded' : 'compact') : undefined}
          fitPadding={
            desktop
              ? { top: 100, bottom: 100, left: 80, right: 100 }
              : { top: 185, bottom: Math.round(window.innerHeight * 0.49), left: 35, right: 55 }
          }
        />
        {/* The mode row belongs to the map state only. In atlas/inspector states
        the panel owns navigation and search, keeping the map surface calm.
        Desktop surfaces the same tools (they were previously unreachable at
        full width — the species/mode chips lived only in the narrow layout). */}
        {(desktop || mobileView === 'map') && (
          <div className={desktop ? 'desktop-explore' : 'mobile-explore'}>
            <div className={desktop ? 'desktop-map-tools' : 'mobile-map-tools'}>
              <button
                className="map-tool"
                aria-pressed={mode === 'conditions'}
                onClick={() => update({ mode: 'conditions' })}
              >
                <WavesIcon size={16} />
                Conditions
              </button>
              <button
                className="map-tool"
                aria-pressed={mode === 'hatches'}
                onClick={() => update({ mode: 'hatches' })}
              >
                <BugIcon size={16} />
                Hatches
              </button>
              <button
                className="map-tool"
                onClick={() => {
                  update({ species: species === 'all' ? null : 'all' });
                }}
              >
                {species === 'all' ? 'All fish' : 'Trout'} ▾
              </button>
            </div>
          </div>
        )}
        <div className="map-topbar">
          <span className="map-view-label">
            Tennessee waters <span aria-hidden="true"> / </span>{' '}
            {mode === 'hatches' ? monthName(month) + ' hatches' : 'Conditions atlas'}
          </span>
          <div className="map-topbar-right">
            {/* Dev-only affordance: reachable only while ?qa=1 is in the URL. */}
            {qaOn && (
              <button
                type="button"
                className="qa-chip"
                aria-pressed={qaOpen}
                aria-label="Toggle geometry QA panel"
                onClick={() => setQaOpen(!qaOpen)}
              >
                QA
              </button>
            )}
            <MapControlGroup
              onRecenter={recenterTennessee}
              layersOpen={layers}
              onLayersToggle={() => setLayers(!layers)}
              onLocate={locate}
              locating={locating}
              layersPanel={layerPanel}
            />
          </div>
        </div>
        {qaOn && qaOpen && (
          <QaPanel map={mapRef.current} onSelect={setRiver} onClose={() => setQaOpen(false)} />
        )}
        {locationNote && (
          <div className="map-location-note" role="status">
            {locationNote}
            <button
              className="ml-2 font-bold"
              aria-label="Dismiss location message"
              onClick={() => setLocationNote('')}
            >
              ×
            </button>
          </div>
        )}
        {data.isError && !indexOpen && !selectedId && (
          <div className="map-catalog-alert" role="alert">
            <div>
              <strong>Catalog unavailable</strong>
              <span>Map controls remain available.</span>
            </div>
            <button className="text-action" onClick={openIndex}>
              Open details
            </button>
          </div>
        )}
        <div className="map-bottom">
          <MapLegend
            mode={mode}
            species={species}
            hasAssessedConditions={assessedIds.size > 0}
            fisheryCounts={fisheryTypeCounts(data.streams ?? [])}
          />
          <p className="map-help">
            {mode === 'hatches'
              ? 'Amber halos mark waters with regional hatch guidance for the selected month — something hatches year-round; open a water for what is expected and how strong.'
              : species === 'all' && focusSpecies
                ? `Colors show ${SPECIES_LABELS[focusSpecies]} fishability from the latest snapshots — pick the species in the filter row.`
                : coverageUnavailable
                ? 'The conditions feed has no observations right now — every water reads Unassessed until the gauge feed recovers.'
                : species === 'all'
                  ? 'Good, Fair, and Poor describe trout waters only. Warmwater waters are shown but not scored.'
                  : 'Select a river line or named water to explore.'}{' '}
            <Link to="/about">Sources & privacy ↗</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
