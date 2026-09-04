import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import { atlasStyle, type BasemapVariant } from './mapStyle';
import { TN_BOUNDS, TN_MAX_BOUNDS } from './mapTokens';
import { useTheme } from '../../theme/ThemeProvider';
import { waterIdentity } from '../../lib/presentation';
import index from './riverIndex.json';
// Preserve the existing same-origin Vite worker bundle and offline caching.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const stillWaterIds = new Set(
  index
    .filter((water) => water.bounds[0] === water.bounds[2] && water.bounds[1] === water.bounds[3])
    .map((water) => water.id),
);
export const isStillWaterId = (id: string) => stillWaterIds.has(id);

interface Camera {
  center: [number, number];
  zoom: number;
  padding: maplibregl.PaddingOptions;
}
// UI-only, in-memory camera continuity, including live design refreshes.
const cameras: Map<string, Camera> = import.meta.hot?.data.fieldworkCameras ?? new Map();
if (import.meta.hot) import.meta.hot.data.fieldworkCameras = cameras;
type Place = { name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' };
interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  featureColors: Map<string, string>;
  allIds?: string[];
  visibleIds?: Set<string>;
  assessedIds?: Set<string>;
  hatchActiveIds?: Set<string>;
  hatchColors?: Map<string, string>;
  fitPadding?: { top: number; bottom: number; left: number; right: number };
  basemap?: BasemapVariant;
  places?: Place[];
  intro?: boolean;
  className?: string;
  ariaLabel?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  viewKey?: string;
  viewRoute?: string;
  layout?: 'desktop' | 'mobile';
  mobileSheet?: 'compact' | 'expanded';
}
function savedCamera(props: Props) {
  return (
    cameras.get((props.viewKey ?? 'default') + ':' + props.layout) ??
    cameras.get('route:' + props.viewRoute + ':' + props.layout)
  );
}
export function TennesseeMap(props: Props) {
  const { theme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const palette = useRef(theme.map);
  palette.current = theme.map;
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const previousSelection = useRef<string | null | undefined>(undefined);
  const previousLayout = useRef(props.layout);
  const firstView = useRef(true);
  const appliedStyle = useRef('');
  const labelsRef = useRef<() => void>(() => {});
  const placesRef = useRef<() => void>(() => {});
  const applyRef = useRef<() => void>(() => {});
  const reduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion');
  applyRef.current = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    for (const river of index) {
      const p = latest.current;
      map.setFeatureState(
        { source: 'rivers', id: river.id },
        {
          selected: p.selectedId === river.id,
          hidden: p.visibleIds ? !p.visibleIds.has(river.id) : false,
          color: p.featureColors.get(river.id) ?? palette.current.noData,
          assessed: p.assessedIds?.has(river.id) ?? false,
          hatchActive: p.hatchActiveIds?.has(river.id) ?? false,
          hatchColor: palette.current.sulphur,
        },
      );
    }
    labelsRef.current();
    const renderedStyle = appliedStyle.current;
    map.once('render', () => {
      if (container.current && appliedStyle.current === renderedStyle)
        container.current.dataset.mapTheme = renderedStyle.split(':')[0] ?? '';
    });
  };
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    setFailed(false);
    setReady(false);
    delete el.dataset.mapReady;
    previousSelection.current = undefined;
    firstView.current = true;
    let map: maplibregl.Map;
    try {
      const saved = savedCamera(latest.current);
      map = new maplibregl.Map({
        container: el,
        style: atlasStyle(latest.current.basemap, palette.current),
        ...(saved
          ? { center: saved.center, zoom: saved.zoom }
          : {
              bounds: TN_BOUNDS,
              fitBoundsOptions: {
                padding: el.clientWidth < 650 ? 24 : 46,
                maxZoom: 7,
              },
            }),
        minZoom: 5.3,
        maxZoom: 13,
        maxBounds: TN_MAX_BOUNDS,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      setFailed(true);
      el.dataset.mapFailed = '1';
      return;
    }
    mapRef.current = map;
    appliedStyle.current = theme.id + ':' + latest.current.basemap;
    // Custom zoom buttons respect both OS and in-app reduced-motion preferences.
    const zoomGroup = document.createElement('div');
    zoomGroup.className = 'maplibregl-ctrl maplibregl-ctrl-group field-zoom';
    const zoomIn = document.createElement('button'),
      zoomOut = document.createElement('button');
    zoomIn.type = zoomOut.type = 'button';
    zoomIn.textContent = '+';
    zoomOut.textContent = '−';
    zoomIn.setAttribute('aria-label', 'Zoom in');
    zoomOut.setAttribute('aria-label', 'Zoom out');
    zoomIn.onclick = () => map.zoomIn({ duration: reduced() ? 0 : 200 });
    zoomOut.onclick = () => map.zoomOut({ duration: reduced() ? 0 : 200 });
    zoomGroup.append(zoomIn, zoomOut);
    const updateZoom = () => {
      zoomIn.disabled = map.getZoom() >= map.getMaxZoom();
      zoomOut.disabled = map.getZoom() <= map.getMinZoom();
    };
    map.on('zoomend', updateZoom);
    updateZoom();
    map.addControl(
      {
        onAdd: () => zoomGroup,
        onRemove: () => {
          map.off('zoomend', updateZoom);
          zoomGroup.remove();
        },
      },
      'bottom-right',
    );
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          'Geometry: <a href="https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html" target="_blank" rel="noreferrer">US Census TIGER</a> · Relief: USGS 3DEP',
      }),
      'bottom-right',
    );
    let loaded = false;
    const attribution = el.querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib');
    let wideAttribution = el.clientWidth > 900;
    if (attribution) attribution.open = wideAttribution;
    const watchdog = window.setTimeout(() => {
      if (!loaded) {
        setFailed(true);
        el.dataset.mapFailed = '1';
      }
    }, 15000);
    const syncCamera = () => {
      const c = map.getCenter();
      el.dataset.center = c.lng.toFixed(5) + ',' + c.lat.toFixed(5);
      el.dataset.zoom = String(map.getZoom());
      const camera = {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        padding: map.getPadding(),
      } as Camera;
      cameras.set((latest.current.viewKey ?? 'default') + ':' + latest.current.layout, camera);
      cameras.set('route:' + latest.current.viewRoute + ':' + latest.current.layout, camera);
      while (cameras.size > 100) cameras.delete(cameras.keys().next().value!);
      labelsRef.current();
    };
    map.on('load', () => {
      loaded = true;
      window.clearTimeout(watchdog);
      setReady(true);
      setFailed(false);
      el.dataset.mapReady = '1';
      delete el.dataset.mapFailed;
      applyRef.current();
      latest.current.onMapReady?.(map);
      syncCamera();
    });
    // Reapply feature presentation once after a style swap, never on every idle.
    map.on('style.load', () => map.once('idle', () => applyRef.current()));
    map.on('moveend', syncCamera);
    const hit = (point: maplibregl.Point) => {
      if (!map.getLayer('rivers-hit')) return null;
      const candidates = map
        .queryRenderedFeatures(
          [
            [point.x - 5, point.y - 5],
            [point.x + 5, point.y + 5],
          ],
          { layers: ['rivers-point-hit', 'rivers-hit', 'rivers-water'] },
        )
        .filter((f) => {
          const id = String(f.properties.id ?? '');
          return id && (!latest.current.visibleIds || latest.current.visibleIds.has(id));
        });
      // Broad touch targets may overlap. Choose the nearest visible centerline,
      // not the arbitrary source/tile order (which can pick a neighboring creek).
      const distance = (feature: maplibregl.MapGeoJSONFeature) => {
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
          return 0;
        if (feature.geometry.type === 'Point') {
          const projected = map.project(feature.geometry.coordinates as [number, number]);
          return Math.hypot(point.x - projected.x, point.y - projected.y);
        }
        if (feature.geometry.type === 'MultiPoint')
          return Math.min(
            ...feature.geometry.coordinates.map((coordinates: number[]) => {
              const projected = map.project(coordinates as [number, number]);
              return Math.hypot(point.x - projected.x, point.y - projected.y);
            }),
          );
        const lines =
          feature.geometry.type === 'LineString'
            ? [feature.geometry.coordinates]
            : feature.geometry.type === 'MultiLineString'
              ? feature.geometry.coordinates
              : [];
        let nearest = Infinity;
        for (const line of lines)
          for (let i = 1; i < line.length; i++) {
            const a = map.project([line[i - 1]![0]!, line[i - 1]![1]!]),
              b = map.project([line[i]![0]!, line[i]![1]!]);
            const dx = b.x - a.x,
              dy = b.y - a.y,
              length = dx * dx + dy * dy;
            const t = length
              ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length))
              : 0;
            nearest = Math.min(nearest, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
          }
        return nearest;
      };
      const found = candidates
        .map((feature) => ({ feature, distance: distance(feature) }))
        .sort((a, b) => a.distance - b.distance)[0]?.feature;
      return found ? String(found.properties.id) : null;
    };
    let hovered: string | null = null;
    map.on('mousemove', (e) => {
      const id = hit(e.point);
      if (hovered && hovered !== id)
        map.setFeatureState({ source: 'rivers', id: hovered }, { hover: false });
      if (id) map.setFeatureState({ source: 'rivers', id }, { hover: true });
      hovered = id;
      map.getCanvas().style.cursor = id ? 'pointer' : '';
    });
    map.on('click', (e) => {
      const id = hit(e.point);
      if (id) latest.current.onSelect(id);
    });
    map.on('mouseout', () => {
      if (hovered) map.setFeatureState({ source: 'rivers', id: hovered }, { hover: false });
      hovered = null;
      map.getCanvas().style.cursor = '';
    });
    const ro = new ResizeObserver(() => {
      map.resize();
      labelsRef.current();
      const wide = el.clientWidth > 900;
      if (attribution && wide !== wideAttribution) attribution.open = wide;
      wideAttribution = wide;
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(watchdog);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const styleKey = theme.id + ':' + props.basemap;
    if (appliedStyle.current === styleKey) return;
    const swap = () => {
      appliedStyle.current = styleKey;
      if (container.current) delete container.current.dataset.mapTheme;
      map.setStyle(atlasStyle(props.basemap, theme.map));
      // Diffed styles can skip style.load; still reapply feature colors once ready.
      map.once('idle', () => applyRef.current());
    };
    if (map.isStyleLoaded()) swap();
    // A theme can change while a previous diffed style or resize is loading.
    // `load` fires only once per map; `idle` also covers subsequent style work.
    else map.once('idle', swap);
    return () => {
      map.off('idle', swap);
    };
  }, [props.basemap, theme.id, attempt]);
  useEffect(() => {
    applyRef.current();
  }, [
    props.featureColors,
    props.visibleIds,
    props.assessedIds,
    props.selectedId,
    props.hatchActiveIds,
    props.mobileSheet,
    props.layout,
    ready,
  ]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const saved = firstView.current
      ? savedCamera(props)
      : cameras.get((props.viewKey ?? 'default') + ':' + props.layout);
    firstView.current = false;
    const river = index.find((r) => r.id === props.selectedId);
    const layoutChanged = previousLayout.current !== props.layout;
    // Fit against the committed layout before ResizeObserver can interrupt the
    // camera animation with a stale desktop-sized transform on mobile.
    map.resize();
    if (saved && !layoutChanged) map.jumpTo(saved);
    else if (river && (previousSelection.current !== props.selectedId || layoutChanged)) {
      const b = river.bounds;
      map.fitBounds(
        [
          [b[0]!, b[1]!],
          [b[2]!, b[3]!],
        ],
        {
          padding: props.fitPadding ?? { top: 120, bottom: 100, left: 75, right: 75 },
          duration: reduced() ? 0 : 300,
          maxZoom: 10.5,
        },
      );
    }
    previousSelection.current = props.selectedId;
    previousLayout.current = props.layout;
  }, [props.selectedId, props.viewKey, props.layout, attempt]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers = index.map((river) => {
      const el = document.createElement('button');
      el.type = 'button';
      const stillWater = isStillWaterId(river.id);
      el.className = 'river-map-label' + (stillWater ? ' still-water-label' : '');
      el.textContent = waterIdentity(river.name).name;
      el.dataset.riverId = river.id;
      el.dataset.waterKind = stillWater ? 'still-water' : 'river';
      el.setAttribute(
        'aria-label',
        'Select ' + river.name + (stillWater ? ', small still water, Unassessed' : ''),
      );
      if (stillWater) el.title = 'Small still water · Unassessed';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        latest.current.onSelect(river.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom-left', offset: [7, -7] })
        .setLngLat(river.anchor as [number, number])
        .addTo(map);
      return { river, el, marker, width: el.offsetWidth, stillWater };
    });
    labelsRef.current = () => {
      const z = map.getZoom(),
        p = latest.current;
      const height = map.getContainer().clientHeight;
      const coveredBottom =
        p.mobileSheet === 'expanded'
          ? height * 0.82
          : p.mobileSheet === 'compact'
            ? height * 0.49
            : 65;
      const occupied: Array<{ x: number; y: number; stillWater: boolean }> = [];
      const sorted = [...markers].sort(
        (a, b) =>
          Number(b.river.id === p.selectedId) - Number(a.river.id === p.selectedId) ||
          Number(b.stillWater) - Number(a.stillWater) ||
          Number(p.assessedIds?.has(b.river.id)) - Number(p.assessedIds?.has(a.river.id)),
      );
      for (const { river, el, width, stillWater } of sorted) {
        const selected = river.id === p.selectedId;
        const point = map.project(river.anchor as [number, number]);
        const visible =
          (!p.visibleIds || p.visibleIds.has(river.id)) &&
          (selected || stillWater || p.assessedIds?.has(river.id) || z >= 8.5);
        const overlaps = occupied.some(
          (o) =>
            Math.abs(o.x - point.x) < (stillWater && o.stillWater ? 126 : 180) &&
            Math.abs(o.y - point.y) < (stillWater && o.stillWater ? 38 : 60),
        );
        const show =
          visible &&
          (selected || !overlaps) &&
          point.x > 0 &&
          point.y > (p.layout === 'mobile' ? 192 : 80) &&
          point.x < map.getContainer().clientWidth - width - 15 &&
          point.y < height - coveredBottom - 8;
        el.setAttribute('aria-pressed', String(selected));
        el.style.display = show ? 'flex' : 'none';
        el.classList.toggle('selected', selected);
        el.style.setProperty(
          '--marker-color',
          p.featureColors.get(river.id) ?? palette.current.noData,
        );
        if (show) occupied.push({ ...point, stillWater });
      }
      placesRef.current();
    };
    labelsRef.current();
    map.on('move', labelsRef.current);
    const update = labelsRef.current;
    return () => {
      map.off('move', update);
      markers.forEach((m) => m.marker.remove());
      labelsRef.current = () => {};
    };
  }, [ready, attempt]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !props.places) return;
    const markers = props.places.map((place) => {
      const el = document.createElement('div');
      el.className = 'atlas-place atlas-place--' + place.kind;
      el.textContent = place.name;
      el.setAttribute('aria-hidden', 'true');
      return {
        place,
        el,
        marker: new maplibregl.Marker({ element: el }).setLngLat([place.lon, place.lat]).addTo(map),
        width: el.offsetWidth,
      };
    });
    const update = () => {
      const origin = map.getContainer().getBoundingClientRect();
      const occupied = [...map.getContainer().querySelectorAll<HTMLElement>('.river-map-label')]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => el.getBoundingClientRect());
      for (const { place, el, width } of [...markers].sort(
        (a, b) => Number(b.place.kind === 'city') - Number(a.place.kind === 'city'),
      )) {
        const point = map.project([place.lon, place.lat]);
        const rect = {
          left: origin.left + point.x - width / 2 - 4,
          right: origin.left + point.x + width / 2 + 4,
          top: origin.top + point.y - 11,
          bottom: origin.top + point.y + 11,
        };
        const show =
          (place.kind === 'city' || map.getZoom() >= (place.kind === 'town' ? 8 : 7.5)) &&
          point.x > width / 2 &&
          point.x < origin.width - width / 2 &&
          point.y > 60 &&
          point.y < origin.height - 50 &&
          !occupied.some(
            (other) =>
              rect.left < other.right &&
              rect.right > other.left &&
              rect.top < other.bottom &&
              rect.bottom > other.top,
          );
        el.style.display = show ? '' : 'none';
        if (show) occupied.push(rect as DOMRect);
      }
    };
    placesRef.current = update;
    update();
    map.on('zoom', update);
    return () => {
      map.off('zoom', update);
      markers.forEach((m) => m.marker.remove());
      placesRef.current = () => {};
    };
  }, [props.places, ready, attempt]);
  return (
    <div className={props.className ?? 'absolute inset-0'} data-basemap={props.basemap}>
      <div
        ref={container}
        className="h-full w-full"
        aria-label={props.ariaLabel ?? 'Tennessee trout waters map'}
        role="region"
        data-testid="river-map"
      />
      {failed && (
        <div className="map-fallback" role="alert">
          <h2>Explore without the map.</h2>
          <p>
            Your browser could not display the map. Every water is still available in search and the
            accessible list.
          </p>
          <button
            type="button"
            className="primary-action w-full"
            onClick={() => setAttempt((a) => a + 1)}
          >
            Try loading the map again
          </button>
          <Link className="text-action" to="/browse">
            Browse all waters →
          </Link>
        </div>
      )}
    </div>
  );
}
export { TN_BOUNDS };
