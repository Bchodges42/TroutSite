import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import { TennesseeMap, TN_BOUNDS } from './TennesseeMap';
import { RiverDrawer } from './RiverDrawer';
import { RiverSearch } from './RiverSearch';
import { useRiverMapData } from './useRiverMapData';
import { useOnline } from '../../hooks/useOnline';
import { useTheme } from '../../theme/ThemeProvider';
import { validMonth } from '../../lib/riverContext';
import { monthName, regionName } from '../../data/regions';
import {
  CloseIcon,
  LayersIcon,
  ListIcon,
  LocationIcon,
  WavesIcon,
  BugIcon,
} from '../../components/icons';
const tabs = ['Water', 'Hatch', 'Stocking', 'Reports', 'Your Log'] as const;
type Place = { name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' };
const statusName = { good: 'Good', fair: 'Fair', poor: 'Poor', 'no-data': 'Unassessed' };
export function RiverMapPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const online = useOnline();
  const selectedId = params.get('river');
  const tab = tabs.find((t) => t === params.get('tab')) ?? 'Water';
  const month = validMonth(params.get('month'));
  const mode = params.get('mode') === 'hatches' ? 'hatches' : 'conditions';
  const species = params.get('species') === 'all' ? 'all' : 'trout';
  const assessedOnly = params.get('assessed') === '1';
  const data = useRiverMapData({ month });
  const selected = data.features.find((f) => f.stream.id === selectedId) ?? null;
  const [mobileList, setMobileList] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [layers, setLayers] = useState(false);
  const [topoAvailable, setTopoAvailable] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [locationNote, setLocationNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [mapAvailable, setMapAvailable] = useState(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width:901px)').matches);
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
    setMobileList(false);
    setExpanded(false);
    update({ river: id, tab: 'Water' }, false);
  };
  const close = () => {
    setRiver(null);
    requestAnimationFrame(() =>
      [...document.querySelectorAll<HTMLInputElement>('.search-input')]
        .find((el) => el.getClientRects().length > 0)
        ?.focus(),
    );
  };
  useEffect(() => {
    const media = window.matchMedia('(min-width:901px)');
    const change = () => setDesktop(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (selectedId)
      requestAnimationFrame(() =>
        document.getElementById('river-inspector')?.focus({ preventScroll: true }),
      );
  }, [selectedId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.getElementById('app-menu')) {
        if (layers) setLayers(false);
        else if (selectedId) close();
        else setMobileList(false);
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
    fetch('/atlas/topo/manifest.json')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setTopoAvailable(Array.isArray(j.bands) && Boolean(j.hillshade));
      })
      .catch(() => {});
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
  const filtered = data.features.filter(
    (f) =>
      (species === 'all' || f.species === 'trout' || f.stream.id === selectedId) &&
      (!assessedOnly || f.status !== 'no-data' || f.stream.id === selectedId),
  );
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
    () => new Set(data.features.filter((f) => f.status !== 'no-data').map((f) => f.stream.id)),
    [data.features.map((f) => f.stream.id + f.status).join(',')],
  );
  const colors = useMemo(
    () =>
      new Map(
        data.features.map((f) => [
          f.stream.id,
          f.status === 'no-data' ? theme.map.noData : theme.map[f.status],
        ]),
      ),
    [data.features.map((f) => f.stream.id + f.status).join(','), theme.id],
  );
  const hatchActive = useMemo(
    () =>
      new Set(
        mode === 'hatches'
          ? filtered
              .filter((f) => f.hatchChart?.entries.some((e) => e.abundance >= 2))
              .map((f) => f.stream.id)
          : [],
      ),
    [mode, month, data.hatchMap.size, visibleIds],
  );
  const basemap =
    topoAvailable && (params.get('terrain') === '1' || params.get('basemap') === 'topo')
      ? 'topo'
      : theme.id === 'daybreak'
        ? 'paper'
        : 'ink';
  const filters = (
    <div className="filter-row" aria-label="Filter waters">
      <button
        className="filter-chip"
        aria-pressed={species === 'trout' && !assessedOnly}
        onClick={() => update({ species: null, assessed: null })}
      >
        Trout waters
      </button>
      <button
        className="filter-chip"
        aria-pressed={assessedOnly}
        onClick={() => update({ assessed: assessedOnly ? null : '1' })}
      >
        Assessed
      </button>
      <button
        className="filter-chip"
        aria-pressed={species === 'all' && !assessedOnly}
        onClick={() => update({ species: 'all', assessed: null })}
      >
        All fish
      </button>
    </div>
  );
  return (
    <div className="field-map">
      <aside
        className={
          'water-sidebar' +
          (selectedId ? ' is-inspecting' : '') +
          (mobileList ? ' mobile-list-open' : '') +
          (expanded ? ' is-expanded' : '')
        }
        aria-label={selectedId ? 'River inspector' : 'Explore waters'}
      >
        {selectedId ? (
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
              modeMonth={month}
              live={data.live}
              fetchedAt={data.fetchedAt}
              layout="panel"
              loading={data.isLoading}
            />
          </>
        ) : (
          <>
            <div className="explore-heading">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Tennessee / Field atlas</span>
                {mobileList && (
                  <button
                    className="icon-button"
                    aria-label="Close water list"
                    onClick={() => setMobileList(false)}
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
              {!data.isLoading && !data.isError && sorted.length === 0 && (
                <p className="search-note">
                  No waters match this filter. Choose All fish to browse the catalog.
                </p>
              )}
              {sorted.map((f) => (
                <button
                  key={f.stream.id}
                  className="water-row"
                  onClick={() => setRiver(f.stream.id)}
                  aria-label={'Select ' + f.stream.name + ' — ' + statusName[f.status]}
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
                    <span className="status-text">{statusName[f.status]}</span>
                    <small>
                      {f.status === 'no-data' || f.score === null ? 'No score' : f.score + ' / 100'}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            <footer className="index-footer">
              <span>
                {online ? 'Snapshot data · check observation times' : 'Offline · saved information'}
              </span>
              <Link to="/browse">Full list ↗</Link>
            </footer>
          </>
        )}
      </aside>
      <div className="map-canvas-area">
        <TennesseeMap
          selectedId={selectedId}
          onSelect={setRiver}
          featureColors={colors}
          visibleIds={visibleIds}
          assessedIds={assessedIds}
          hatchActiveIds={hatchActive}
          basemap={basemap}
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
        <div className="mobile-explore">
          <div className="mobile-search-row">
            <RiverSearch streams={data.streams} onSelect={setRiver} shortcut={!desktop} />
            <button
              className="map-tool"
              aria-label="Show water list"
              aria-expanded={mobileList}
              onClick={() => {
                if (selectedId) update({ river: null });
                setMobileList(!mobileList);
              }}
            >
              <ListIcon size={19} />
            </button>
          </div>
          <div className="mobile-map-tools">
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
        <div className="map-topbar">
          <span className="map-view-label">
            Tennessee waters <span aria-hidden="true"> / </span>{' '}
            {mode === 'hatches' ? monthName(month) + ' hatches' : 'Conditions atlas'}
          </span>
          <div className="map-toolbar">
            <button
              className="map-tool map-home"
              onClick={() => {
                mapRef.current?.fitBounds(TN_BOUNDS, { padding: 45, duration: 0 });
              }}
              title="Show all Tennessee"
            >
              Tennessee ↗
            </button>
            <button
              className="map-tool"
              aria-label="Use my location"
              disabled={locating}
              onClick={locate}
            >
              <LocationIcon size={18} />
              <span className="tool-label">{locating ? 'Locating…' : 'Near me'}</span>
            </button>
            <button
              className="map-tool"
              aria-label="Map layers"
              aria-expanded={layers}
              onClick={() => setLayers(!layers)}
            >
              <LayersIcon size={18} />
              <span className="tool-label">Layers</span>
            </button>
            {layers && (
              <div className="layer-picker" role="group" aria-label="Map layers">
                <p className="eyebrow">Explore the map</p>
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
                    onChange={(e) =>
                      update({ terrain: e.target.checked ? '1' : null, basemap: null })
                    }
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
                <button
                  className="text-action"
                  onClick={() => {
                    mapRef.current?.fitBounds(TN_BOUNDS, { padding: 45, duration: 0 });
                    setLayers(false);
                  }}
                >
                  Show all Tennessee ↗
                </button>
              </div>
            )}
          </div>
        </div>
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
        <div className="map-bottom">
          <div className="map-legend" aria-label="Condition legend">
            <span className="legend-title">
              {mode === 'hatches' ? 'Seasonal guidance' : 'Trout conditions'}
            </span>
            {(['good', 'fair', 'poor', 'no-data'] as const).map((s) => (
              <span key={s} data-status={s}>
                <i className={'legend-line' + (s === 'no-data' ? ' unknown' : '')} />
                {s === 'no-data' ? 'Unassessed' : statusName[s]}
              </span>
            ))}
          </div>
          <p className="map-help">
            {mode === 'hatches'
              ? 'Amber halos show regional hatch guidance, not live sightings.'
              : 'Select a river line or named water to explore.'}{' '}
            <Link to="/about">Sources & privacy ↗</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
