import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import { atlasStyle, type BasemapVariant, type RoadsSpec } from './mapStyle';
import { NETWORK_LAYER_PREFIX, initNetworkClusters } from './networkClusters';
import { TN_BOUNDS, TN_MAX_BOUNDS, statewideCamera } from './mapTokens';
import { useTheme } from '../../theme/ThemeProvider';
import { waterIdentity } from '../../lib/presentation';
import { labelSpeciesNote, shouldShowLabel } from './labelPolicy';
import {
  buildFlowArrowSource,
  EMPTY_FLOW_SOURCE,
  FLOW_ARROW_ICON,
  FLOW_ARROWS_SOURCE,
  makeFlowArrowImage,
  orientationFor,
} from './flowArrows';
import index from './riverIndex.json';
// Preserve the existing same-origin Vite worker bundle and offline caching.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const stillWaterIds = new Set(
  index
    .filter((water) => water.bounds[0] === water.bounds[2] && water.bounds[1] === water.bounds[3])
    .map((water) => water.id),
);
export const isStillWaterId = (id: string) => stillWaterIds.has(id);

/**
 * rivers.geojson read through the live style source (same-origin asset the
 * map already loaded — never a second fetch). Cached once per session; the
 * atlas geometry is static. Consumers: flow-arrow source building and the QA
 * audit.
 */
let riversDataCache: Promise<unknown> | null = null;
export function getRiversData(map: maplibregl.Map): Promise<unknown> {
  if (!riversDataCache) {
    const source = map.getSource('rivers') as maplibregl.GeoJSONSource | undefined;
    if (!source) return Promise.reject(new Error('rivers source missing'));
    riversDataCache = source.getData().catch((error) => {
      riversDataCache = null; // allow a retry on the next selection
      throw error;
    });
  }
  return riversDataCache;
}

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
  /** Catalog species per water id, from the same streams snapshot the
   * corridors join (H5 mode-aware labels) — absent means the catalog does
   * not say, and the label policy never guesses. */
  labelSpecies?: Map<string, 'trout' | 'warmwater'>;
  /** Authored map prominence tier per catalog water. */
  labelDisplay?: Map<string, 'featured' | 'standard' | 'reference'>;
  /** Waters whose seasonal decision suppresses automatic labels this month. */
  seasonalAbsentIds?: Set<string>;
  /** Species filter mode ('trout' | 'all', from ?species=). Defaults to
   * 'all' — the pre-mode-aware behavior — so callers that don't plumb it
   * keep today's labels. */
  speciesMode?: 'trout' | 'all';
  stillWaterIds?: Set<string>;
  /** Catalog waterbodyType label per water id (M2) — accessible names use it. */
  waterTypes?: Map<string, string>;
  hatchActiveIds?: Set<string>;
  hatchColors?: Map<string, string>;
  fitPadding?: { top: number; bottom: number; left: number; right: number };
  basemap?: BasemapVariant;
  roads?: RoadsSpec;
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
  // Presentation scheduling. Every style swap, theme change, and props update
  // funnels through one tokenized scheduler: only the MOST RECENT scheduled
  // apply runs, it re-arms until the style is genuinely loaded (a diffed
  // setStyle can skip style.load, and `idle` alone can fire early), and every
  // feature state — selected, hover, dimmed, hidden, assessed, hatch — is
  // rewritten from `latest.current` so a swap never leaves stale presentation
  // behind. Without the token, rapid Terrain/Roads/theme toggles queue
  // out-of-order swaps and the map ends up styled for a state the URL left
  // behind generations ago.
  const applyToken = useRef(0);
  const swapToken = useRef(0);
  applyRef.current = () => {
    const map = mapRef.current;
    if (!map) return;
    const token = ++applyToken.current;
    const el = container.current;
    let retries = 0;
    const run = () => {
      if (mapRef.current !== map) return;
      if (token !== applyToken.current) return;
      if (!map.isStyleLoaded()) {
        // Style still loading (initial load or a diffed swap in progress).
        // Re-arm on idle; capped so a permanently failed style stops here.
        if (++retries > 30) return;
        map.once('idle', run);
        return;
      }
      const p = latest.current;
      for (const river of index) {
        map.setFeatureState(
          { source: 'rivers', id: river.id },
          {
            selected: p.selectedId === river.id,
            // hover is producer state (the pointer handlers below) with no
            // prop to restore it from — after a swap the honest value is off,
            // and the next mousemove re-derives it.
            hover: false,
            dimmed: false,
            // Stillwaters (lakes/reservoirs) are orientation landmarks — the
            // species filter never hides them, only flowing waters.
            hidden:
              river.waterbodyType === 'lake' ||
              river.waterbodyType === 'pond' ||
              river.waterbodyType === 'reservoir'
                ? false
                : p.visibleIds
                  ? !p.visibleIds.has(river.id)
                  : false,
            color: p.featureColors.get(river.id) ?? palette.current.noData,
            assessed: p.assessedIds?.has(river.id) ?? false,
            hatchActive: p.hatchActiveIds?.has(river.id) ?? false,
            hatchColor: palette.current.sulphur,
          },
        );
      }
      if (el) el.dataset.mapSelected = p.selectedId ?? '';
      // Test/verification seam FIRST: the live style inventory (which sources
      // and layers exist right now) so Terrain/Roads activation is observable
      // from outside the canvas. Refreshing it before the label pass means a
      // label-pass exception can never leave a stale inventory behind.
      if (el) {
        try {
          el.dataset.mapSources = Object.keys(map.getStyle().sources).join(' ');
          el.dataset.mapLayers = map
            .getStyle()
            .layers.map((l) => l.id)
            .join(' ');
        } catch {
          /* a torn-down style can throw here; the next apply refreshes it */
        }
      }
      try {
        labelsRef.current();
      } catch {
        /* label collision passes are best-effort presentation */
      }
      const renderedStyle = appliedStyle.current;
      map.once('render', () => {
        if (container.current && appliedStyle.current === renderedStyle)
          container.current.dataset.mapTheme = renderedStyle.split(':')[0] ?? '';
      });
    };
    if (map.isStyleLoaded()) run();
    // Same static-map deadlock as the style swap: a pending `idle` never
    // arrives without a render — nudge one so the inventory refresh lands.
    else {
      map.once('idle', run);
      map.triggerRepaint();
    }
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
    const initialSaved = savedCamera(latest.current);
    const bootstrapSelection =
      !initialSaved && index.some((river) => river.id === latest.current.selectedId);
    try {
      // H1: one shared overview camera for the initial fit — and the zoom
      // floor derived from it, so narrow viewports are never clamped above
      // the framing the state actually needs.
      const overview = statewideCamera(
        el.clientWidth || window.innerWidth,
        el.clientHeight || window.innerHeight,
      );
      map = new maplibregl.Map({
        container: el,
        style: atlasStyle(latest.current.basemap, palette.current, { roads: latest.current.roads }),
        ...(initialSaved
          ? { center: initialSaved.center, zoom: initialSaved.zoom }
          : {
              bounds: TN_BOUNDS,
              fitBoundsOptions: {
                padding: overview.padding,
                maxZoom: overview.maxZoom,
              },
            }),
        minZoom: overview.minZoom,
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
    // Debug/test handle: e2e suites use it for deterministic camera and
    // hit-test assertions. Read-only in practice; no app code depends on it.
    (window as unknown as Record<string, unknown>).__troutMap = map;
    // Style-inventory seam: keep the live sources/layers inventory on the
    // container, independent of the presentation apply — a diffed setStyle
    // with no visual change otherwise never re-renders and the inventory
    // goes stale. `styledata` fires exactly when style data changes; `idle`
    // covers the initial load.
    const syncStyleInventory = () => {
      try {
        container.current!.dataset.mapSources = Object.keys(map.getStyle().sources).join(' ');
        container.current!.dataset.mapLayers = map
          .getStyle()
          .layers.map((l) => l.id)
          .join(' ');
      } catch {
        /* style mid-teardown; the next styledata refreshes it */
      }
    };
    map.on('styledata', syncStyleInventory);
    map.on('idle', syncStyleInventory);
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
      // Camera diagnostics (H1): the zoom floor in effect and the viewport the
      // map believes it occupies, for reviewable camera assertions.
      el.dataset.minzoom = String(map.getMinZoom());
      el.dataset.viewport = el.clientWidth + 'x' + el.clientHeight;
      const camera = {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        padding: map.getPadding(),
      } as Camera;
      // Initial fitBounds can emit moveend before the deep-linked selection
      // effect runs. Do not persist that bootstrap camera over the water.
      if (!bootstrapSelection || previousSelection.current !== undefined) {
        cameras.set((latest.current.viewKey ?? 'default') + ':' + latest.current.layout, camera);
        cameras.set('route:' + latest.current.viewRoute + ':' + latest.current.layout, camera);
        while (cameras.size > 100) cameras.delete(cameras.keys().next().value!);
      }
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
      // Dev-only inspection handle for map-verification tooling.
      if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__troutMap = map;
      // Do not snapshot the full-state bootstrap over a deep-linked water's
      // intended camera. The selection effect fits it once `ready` commits.
      const initialRiver = index.find((river) => river.id === latest.current.selectedId);
      if (initialSaved || !initialRiver) syncCamera();
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
          {
            layers: [
              'rivers-point-hit',
              'rivers-water-hit',
              'rivers-water-hit-outline',
              'rivers-hit',
            ],
          },
        )
        .filter((f) => {
          const id = String(f.properties.id ?? '');
          return (
            id &&
            (!latest.current.visibleIds || latest.current.visibleIds.has(id))
          );
        });
      // Broad touch targets may overlap. Choose the nearest visible centerline,
      // not the arbitrary source/tile order (which can pick a neighboring creek).
      const distance = (feature: maplibregl.MapGeoJSONFeature) => {
        // A line drawn across a lake should remain directly selectable. Give
        // polygon interiors a small deterministic distance so a centerline
        // within the same pointer box wins, while open water still selects.
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
          return feature.layer.id === 'rivers-water-hit' ? 6 : 9;
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
    let touchStart: maplibregl.Point | null = null;
    let lastTouchSelection = 0;
    map.on('touchstart', (e) => {
      touchStart = e.originalEvent.touches.length === 1 ? e.point : null;
    });
    map.on('touchend', (e) => {
      const start = touchStart;
      touchStart = null;
      if (!start || Math.hypot(e.point.x - start.x, e.point.y - start.y) > 10) return;
      const id = hit(e.point);
      if (id) {
        lastTouchSelection = Date.now();
        latest.current.onSelect(id);
      }
    });
    map.on('touchcancel', () => {
      touchStart = null;
    });
    map.on('click', (e) => {
      if (Date.now() - lastTouchSelection < 500) return;
      const id = hit(e.point);
      if (id) latest.current.onSelect(id);
    });
    map.on('mouseout', () => {
      if (hovered) map.setFeatureState({ source: 'rivers', id: hovered }, { hover: false });
      hovered = null;
      map.getCanvas().style.cursor = '';
    });
    // PROOF (GEOVALID-2) replacement: statewide named-creek network, loaded
    // per-cluster on demand (see networkClusters.ts). The creeks stay
    // NON-SELECTABLE — cluster layers are never in the selection hit layers;
    // the tooltip below is hover-only.
    const disposeNetworkClusters = initNetworkClusters(map);
    // Name tooltip for the zoom-gated minor-water network. Iterates every
    // active cluster layer (network-minor-*) so hover works statewide.
    const creekTip = document.createElement('div');
    creekTip.setAttribute('data-proof', 'network-hover');
    creekTip.style.cssText =
      'position:absolute;pointer-events:none;z-index:10;display:none;' +
      'background:#0b111c;color:#dfe8f2;font:12px/1.35 ui-monospace,monospace;' +
      'padding:3px 7px;border-radius:5px;white-space:nowrap;transform:translate(10px,-50%)';
    el.appendChild(creekTip);
    map.on('mousemove', (e) => {
      const layers = (map.getStyle()?.layers ?? [])
        .map((l) => l.id)
        .filter((id): id is string => Boolean(id) && id.startsWith(NETWORK_LAYER_PREFIX));
      if (!layers.length) {
        creekTip.style.display = 'none';
        return;
      }
      // A style swap can drop a cluster layer between the enumeration above
      // and this query; maplibre throws on missing layers, and hover must
      // never be the thing that breaks the map.
      let hitNetwork: maplibregl.MapGeoJSONFeature | undefined;
      try {
        hitNetwork = map.queryRenderedFeatures(
          [
            [e.point.x - 4, e.point.y - 4],
            [e.point.x + 4, e.point.y + 4],
          ],
          { layers },
        )[0];
      } catch {
        creekTip.style.display = 'none';
        return;
      }
      const name = hitNetwork?.properties?.name;
      if (!name) {
        creekTip.style.display = 'none';
        return;
      }
      creekTip.textContent = String(name);
      creekTip.style.left = `${e.point.x}px`;
      creekTip.style.top = `${e.point.y}px`;
      creekTip.style.display = 'block';
    });
    map.on('mouseout', () => {
      creekTip.style.display = 'none';
    });
    const ro = new ResizeObserver(() => {
      map.resize();
      // H1: keep the overview floor in step with the viewport so a rotate or
      // panel change never leaves the state unfittable.
      const overview = statewideCamera(el.clientWidth, el.clientHeight);
      if (overview.minZoom !== map.getMinZoom()) map.setMinZoom(overview.minZoom);
      labelsRef.current();
      const wide = el.clientWidth > 900;
      if (attribution && wide !== wideAttribution) attribution.open = wide;
      wideAttribution = wide;
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(watchdog);
      ro.disconnect();
      creekTip.remove();
      disposeNetworkClusters();
      map.remove();
      mapRef.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const styleKey = theme.id + ':' + props.basemap + ':' + String(Boolean(props.roads));
    if (container.current) container.current.dataset.mapStyleKey = styleKey;
    if (appliedStyle.current === styleKey) return;
    // Swap token: rapid toggles (Terrain ⇄ Roads ⇄ theme) must never apply an
    // older swap after a newer one — only the latest scheduled swap runs, and
    // this effect's cleanup cancels its own pending swap. Separate from the
    // apply token on purpose: a props update in the same commit schedules a
    // fresh presentation apply WITHOUT cancelling the still-pending swap.
    const token = ++swapToken.current;
    const swap = () => {
      if (token !== swapToken.current || mapRef.current !== map) return;
      appliedStyle.current = styleKey;
      if (container.current) delete container.current.dataset.mapTheme;
      map.setStyle(atlasStyle(props.basemap, theme.map, { roads: props.roads }));
      // Diffed styles can skip style.load; reapply feature presentation once
      // the (possibly diffed) style is ready. applyRef re-arms internally
      // until the style is genuinely loaded. A diffed swap with no visual
      // change never renders again on its own — nudge the render.
      map.once('idle', () => {
        if (token !== swapToken.current) return;
        applyRef.current();
      });
      map.triggerRepaint();
    };
    if (map.isStyleLoaded()) swap();
    // A theme can change while a previous diffed style or resize is loading.
    // `load` fires only once per map; `idle` also covers subsequent style work.
    // A STATIC map never fires `idle` on its own, so nudge one render —
    // otherwise the pending swap waits forever (intermittent dead Terrain/
    // Roads toggle on first load).
    else {
      map.once('idle', swap);
      map.triggerRepaint();
    }
    return () => {
      map.off('idle', swap);
    };
  }, [props.basemap, props.roads, ready, theme.id, attempt]);
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
  }, [props.selectedId, props.viewKey, props.layout, attempt, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // H5 label prominence: geographic extent is the available signal (the
    // index carries id/name/anchor/bounds). Mode-awareness (H5 finish): the
    // visibility rule lives in labelPolicy.ts — trout mode titles ONLY
    // catalog-trout waters (warmwater and unknown-species waters render
    // corridor/dot only, never a name that could read as a trout claim);
    // all-fish mode additionally titles large waters of any species. Major
    // trout waters keep their statewide titles; pocket waters wait for local
    // zooms. Selection, collision, and priority mechanics are unchanged.
    const extentOf = (b: readonly number[] | undefined) =>
      b ? Math.max(b[2]! - b[0]!, b[3]! - b[1]!) : 0;
    const markers = index.map((river) => {
      const el = document.createElement('button');
      el.type = 'button';
      const stillWater = isStillWaterId(river.id) || Boolean(props.stillWaterIds?.has(river.id));
      el.className = 'river-map-label' + (stillWater ? ' still-water-label' : '');
      el.textContent = waterIdentity(river.name).name;
      el.dataset.riverId = river.id;
      el.dataset.waterKind = stillWater ? 'still-water' : 'river';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        latest.current.onSelect(river.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom-left', offset: [7, -7] })
        .setLngLat(river.anchor as [number, number])
        .addTo(map);
      return {
        river,
        el,
        marker,
        width: el.offsetWidth,
        height: el.offsetHeight,
        stillWater,
        extent: extentOf(river.bounds),
      };
    });
    labelsRef.current = () => {
      const z = map.getZoom(),
        p = latest.current;
      // NOTE: named containerH — the per-label `height` in the loop below
      // must not shadow this (that collision hid every label at once).
      const containerH = map.getContainer().clientHeight;
      const coveredBottom =
        p.mobileSheet === 'expanded'
          ? containerH * 0.82
          : p.mobileSheet === 'compact'
            ? containerH * 0.49
            : 65;
      // H2/H5: usable map rectangle — the floating chrome sits on top of the
      // first rows on mobile, so labels must clear it to stay operable.
      const topCover = p.layout === 'mobile' ? 192 : 80;
      const occupied: Array<{ left: number; right: number; top: number; bottom: number }> = [];
      // Catalog-trout waters — the authoritative set the label policy gates
      // on. Rebuilt from latest props so a species-filter change lands on the
      // next frame without rebuilding markers.
      const troutIds = new Set<string>();
      if (p.labelSpecies) for (const [id, s] of p.labelSpecies) if (s === 'trout') troutIds.add(id);
      // Priority: selection first, then prominence (extent), then assessment
      // availability, then name for determinism. Big lakes and major rivers
      // now compete on extent instead of every still water outranking every
      // river.
      const sorted = [...markers].sort(
        (a, b) =>
          Number(b.river.id === p.selectedId) - Number(a.river.id === p.selectedId) ||
          b.extent - a.extent ||
          Number(p.assessedIds?.has(b.river.id)) - Number(p.assessedIds?.has(a.river.id)) ||
          a.river.id.localeCompare(b.river.id),
      );
      for (const { river, el, width, height, stillWater, extent } of sorted) {
        // Catalog truth arrives asynchronously (the streams snapshot) —
        // re-derive the still-water classification each pass so a water
        // classified 'river' at marker creation (catalog not loaded yet, and
        // non-degenerate index bounds) corrects itself. The static index set
        // never downgrades: point-bounds waters are point waters.
        const isStill = stillWater || Boolean(p.stillWaterIds?.has(river.id));
        if (isStill !== stillWater) {
          el.classList.add('still-water-label');
          el.dataset.waterKind = 'still-water';
        }
        const selected = river.id === p.selectedId;
        const assessed = p.assessedIds?.has(river.id) ?? false;
        const species = p.labelSpecies?.get(river.id);
        const display = p.labelDisplay?.get(river.id);
        const typeWord = p.waterTypes?.get(river.id);
        const kindWord = typeWord ?? (isStill ? 'Still water' : 'River');
        // Mode-honest naming: confirmed trout takes no species word (it is
        // the app's default vocabulary); warmwater says so; a water whose
        // species the catalog leaves unset reads "Unverified" in place of the
        // assessment suffix — never an implied trout or condition claim.
        const note = labelSpeciesNote({ id: river.id, species }, { troutIds });
        const unassessedWord = note === 'Unverified' ? 'Unverified' : 'Unassessed';
        el.setAttribute(
          'aria-label',
          'Select ' +
            river.name +
            ', ' +
            kindWord +
            (note ? ', ' + note : '') +
            (assessed ? '' : ', ' + unassessedWord),
        );
        el.title = kindWord + (note ? ' · ' + note : '') + (assessed ? '' : ' · ' + unassessedWord);
        const point = map.project(river.anchor as [number, number]);
        // Visibility: the waterDecision filter pass (visibleIds) plus the
        // pure mode-aware prominence gate. Selected/assessed trout always
        // compete; major trout waters keep their statewide name; everything
        // else waits for the zoom gates.
        const visible =
          (!p.visibleIds || p.visibleIds.has(river.id)) &&
          shouldShowLabel(
            { id: river.id, species, display },
            {
              mode: p.speciesMode ?? 'all',
              troutIds,
              extent,
              zoom: z,
              selected,
              assessed,
              seasonalAbsent: p.seasonalAbsentIds?.has(river.id),
            },
          );
        // Rectangle collision on the actual label box — the same AABB test the
        // places pass below already runs against these labels, not a fixed
        // point box.
        const rect = {
          left: point.x + 4,
          right: point.x + 12 + width,
          top: point.y - 12 - height,
          bottom: point.y - 2,
        };
        const overlaps = occupied.some(
          (o) =>
            rect.left < o.right &&
            rect.right > o.left &&
            rect.top < o.bottom &&
            rect.bottom > o.top,
        );
        const show =
          visible &&
          (selected || !overlaps) &&
          point.x > 0 &&
          point.y > topCover &&
          point.x < map.getContainer().clientWidth - width - 15 &&
          point.y < containerH - coveredBottom - 8;
        el.setAttribute('aria-pressed', String(selected));
        el.style.display = show ? 'flex' : 'none';
        el.classList.toggle('selected', selected);
        el.style.setProperty(
          '--marker-color',
          p.featureColors.get(river.id) ?? palette.current.noData,
        );
        if (show) occupied.push(rect);
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
  // Flow-direction arrows (selection overlay): register the runtime arrow icon
  // with the CURRENT theme's ink/halo tones, then rebuild the carrier source
  // from the selected feature + committed flowOrientation.json flip flags.
  // No selection, an unoriented water, or a polygon water → empty source, so
  // arrows appear ONLY on oriented selections and never over labels (the
  // arrow layer sits below the DOM label markers by construction). Deps mirror
  // the style-swap effect: every style rebuild drops the runtime image and the
  // source data, so both are restored for the new style.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    const rebuild = async () => {
      // addImage replaces an existing image of the same name cleanly. The
      // glyph is PAPER on an ink halo — light-on-dark reads on the rust
      // selected corridor and on every theme's water color alike.
      const icon = makeFlowArrowImage(theme.map.paper, theme.map.ink);
      if (icon) map.addImage(FLOW_ARROW_ICON, icon);
      const id = latest.current.selectedId;
      const source = map.getSource(FLOW_ARROWS_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      const orientation = orientationFor(id);
      if (!id || !orientation) {
        source.setData(EMPTY_FLOW_SOURCE as never);
        return;
      }
      try {
        const data = (await getRiversData(map)) as { features?: Array<unknown> };
        if (cancelled || latest.current.selectedId !== id) return;
        const feature = (data.features ?? []).find(
          (f) => (f as { properties?: { id?: string } }).properties?.id === id,
        );
        source.setData(buildFlowArrowSource(feature as never, orientation) as never);
      } catch {
        /* source data unavailable (offline before first load): retry on the
           next selection change — never break the map for arrows. */
      }
    };
    rebuild();
    return () => {
      cancelled = true;
    };
  }, [ready, props.selectedId, theme.id, props.basemap, props.roads, attempt]);
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
