import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import {
  atlasStyle,
  MAP_ZOOM_TIERS,
  catalogTierFilter,
  TIER_HIT_LAYERS,
  type BasemapVariant,
  type RoadsSpec,
} from './mapStyle';
import { NETWORK_LAYER_PREFIX, initNetworkClusters } from './networkClusters';
import { TN_BOUNDS, TN_MAX_BOUNDS, statewideCamera } from './mapTokens';
import type { MapPalette } from '../../theme/themes';
import { useTheme } from '../../theme/ThemeProvider';
import { waterIdentity } from '../../lib/presentation';
import { labelDecision, labelSpeciesNote } from './labelPolicy';
import {
  buildFlowArrowSource,
  EMPTY_FLOW_SOURCE,
  FLOW_ARROWS_SOURCE,
  makeFlowArrowImage,
  orientationFor,
  registerFlowArrowIcon,
} from './flowArrows';
import index from './riverIndex.json';
import { chooseWaterCandidate, type ScreenGeometry, type SelectionCandidate } from './selection';
// Preserve the existing same-origin Vite worker bundle and offline caching.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const stillWaterIds = new Set(
  index
    .filter((water) => water.bounds[0] === water.bounds[2] && water.bounds[1] === water.bounds[3])
    .map((water) => water.id),
);
const catalogPermanentIds = new Set(index.flatMap((water) => water.nhdPermanentIds.map(String)));
export const isStillWaterId = (id: string) => stillWaterIds.has(id);

/**
 * Style-swap identity. F44: the RESOLVED map palette is part of the key —
 * custom map colors (mapWater/mapLake/mapSelection/...) change theme.map
 * WITHOUT changing theme.id, and a key of theme.id + basemap + roads left
 * the style swap untriggered and the paint stale.
 */
export function mapStyleKey(
  themeId: string,
  map: MapPalette,
  basemap: BasemapVariant | undefined,
  hasRoads: boolean,
): string {
  return themeId + ':' + String(basemap) + ':' + String(hasRoads) + ':' + JSON.stringify(map);
}

/**
 * One overlay-first tap routine for BOTH mouse clicks and touch taps (F45):
 * a gauge/stocking/attractor dot on a river dispatches the overlay popup and
 * never selects the water beneath it; without an overlay hit the tap selects
 * the river. Returns what dispatched, so the caller can suppress the
 * synthetic duplicate click only AFTER the intended action ran — the old
 * touch path selected the river first and set the suppression timer, so an
 * overlapping gauge never opened on touchscreens.
 */
export type MapTapKind = 'gauge' | 'stocking' | 'attractor' | 'river' | null;
export interface MapTapSurface<PointT, LngLatT> {
  /** Overlay-dot hit test (enabled overlays only). */
  overlayAt(point: PointT): { kind: 'gauge' | 'stocking' | 'attractor' } | null;
  /** The overlay feature to popup at this point (a tighter query than the hit test). */
  overlayFeatureAt(kind: 'gauge' | 'stocking' | 'attractor', point: PointT): unknown | undefined;
  /** The visible river (or still water) to select at this point, if any. */
  riverAt(point: PointT): string | null;
  openOverlay(kind: 'gauge' | 'stocking' | 'attractor', feature: unknown, lngLat: LngLatT): void;
  selectRiver(id: string): void;
}
export function dispatchMapTap<PointT extends { x: number; y: number }, LngLatT extends { lng: number; lat: number }>(
  surface: MapTapSurface<PointT, LngLatT>,
  point: PointT,
  lngLat: LngLatT,
): MapTapKind {
  const overlay = surface.overlayAt(point);
  if (overlay) {
    const feature = surface.overlayFeatureAt(overlay.kind, point);
    if (feature !== undefined) {
      surface.openOverlay(overlay.kind, feature, lngLat);
      return overlay.kind;
    }
  }
  const id = surface.riverAt(point);
  if (id) {
    surface.selectRiver(id);
    return 'river';
  }
  return null;
}

function projectGeometry(
  map: maplibregl.Map,
  geometry: maplibregl.MapGeoJSONFeature['geometry'],
): ScreenGeometry {
  const project = (coordinate: number[]): [number, number] => {
    const point = map.project([coordinate[0]!, coordinate[1]!]);
    return [point.x, point.y];
  };
  switch (geometry.type) {
    case 'Point':
      return { type: 'Point', coordinates: project(geometry.coordinates as number[]) };
    case 'MultiPoint':
      return {
        type: 'MultiPoint',
        coordinates: geometry.coordinates.map((coordinate: number[]) => project(coordinate)),
      };
    case 'LineString':
      return {
        type: 'LineString',
        coordinates: geometry.coordinates.map((coordinate: number[]) => project(coordinate)),
      };
    case 'MultiLineString':
      return {
        type: 'MultiLineString',
        coordinates: geometry.coordinates.map((line: number[][]) =>
          line.map((coordinate: number[]) => project(coordinate)),
        ),
      };
    case 'Polygon':
      return {
        type: 'Polygon',
        coordinates: geometry.coordinates.map((ring: number[][]) =>
          ring.map((coordinate: number[]) => project(coordinate)),
        ),
      };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: geometry.coordinates.map((polygon: number[][][]) =>
          polygon.map((ring: number[][]) => ring.map((coordinate: number[]) => project(coordinate))),
        ),
      };
    default:
      return { type: 'Point', coordinates: [Number.NaN, Number.NaN] };
  }
}

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
// (?.data — vitest's vite-node defines import.meta.hot without .data.)
const cameras: Map<string, Camera> = import.meta.hot?.data?.fieldworkCameras ?? new Map();
if (import.meta.hot?.data) import.meta.hot.data.fieldworkCameras = cameras;
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
  /** Fishery-class outline per water id ('trout' | 'warmwater' | null) —
   * drives the rivers-class-outline halo (2026-09-10). Absent = unclassified. */
  classOutlines?: Map<string, 'trout' | 'warmwater' | null>;
  /** Waters whose trout season is OFF (calendar): dimmed + dash-rendered on
   * the map and suffixed on labels — visible but unmistakably not-now. */
  offseasonIds?: Set<string>;
  stillWaterIds?: Set<string>;
  /** Catalog waterbodyType label per water id (M2) — accessible names use it. */
  waterTypes?: Map<string, string>;
  hatchActiveIds?: Set<string>;
  hatchColors?: Map<string, string>;
  /** Persisted USGS gauge overlay (feat/tn-gauge-layer): flips the
   *  visibility:none style layers visible; a gauge tap opens a live-reading
   *  popup instead of selecting the water beneath it. */
  showGauges?: boolean;
  /** Persisted TWRA trout-stocking-site overlay (same pattern as showGauges). */
  showStockingSites?: boolean;
  /** Persisted TWRA fish-attractor overlay (lake detail; zoom-gated). */
  showAttractors?: boolean;
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
  // F44: resolved-palette identity — changes when custom map colors change
  // inside the same theme, driving both the style swap and the flow-arrow
  // glyph rebuild below.
  const paletteSignature = JSON.stringify(theme.map);
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
  const mapMetrics = useRef({ zoomTierCrossings: 0, zoomFilterMutations: 0, featureStateWrites: 0 });
  const gaugePopupRef = useRef<maplibregl.Popup | null>(null);
  const reduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion');
  const qaDiagnostics = () =>
    import.meta.env.DEV || new URLSearchParams(window.location.search).get('qa') === '1';
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
        const speciesHidden =
          river.waterbodyType === 'lake' ||
          river.waterbodyType === 'pond' ||
          river.waterbodyType === 'reservoir'
            ? false
            : p.visibleIds
              ? !p.visibleIds.has(river.id)
              : false;
        map.setFeatureState(
          { source: 'rivers', id: river.id },
          {
            selected: p.selectedId === river.id,
            // hover is producer state (the pointer handlers below) with no
            // prop to restore it from — after a swap the honest value is off,
            // and the next mousemove re-derives it.
            hover: false,
            dimmed: false,
            hidden: speciesHidden,
            color: p.featureColors.get(river.id) ?? palette.current.noData,
            assessed: p.assessedIds?.has(river.id) ?? false,
            outlineClass: p.classOutlines?.get(river.id) ?? '',
            offseason: p.offseasonIds?.has(river.id) ?? false,
            hatchActive: p.hatchActiveIds?.has(river.id) ?? false,
            hatchColor: palette.current.sulphur,
          },
        );
        mapMetrics.current.featureStateWrites += 1;
      }
      if (qaDiagnostics())
        (window as unknown as Record<string, unknown>).__troutMapMetrics = {
          ...mapMetrics.current,
        };
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
        style: atlasStyle(latest.current.basemap, palette.current, {
          roads: latest.current.roads,
          reducedMotion: reduced(),
        }),
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
    appliedStyle.current = mapStyleKey(theme.id, palette.current, latest.current.basemap, Boolean(latest.current.roads));
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
    let lastHitTier: 0 | 1 | 2 | null = null;
    const updateTierHitFilters = (fromZoom = false) => {
      const z = map.getZoom();
      const tier: 0 | 1 | 2 =
        z >= MAP_ZOOM_TIERS.reference.start ? 2 : z >= MAP_ZOOM_TIERS.standard.start ? 1 : 0;
      if (lastHitTier === tier) return;
      lastHitTier = tier;
      const tierFilter = catalogTierFilter(z);
      for (const [layer, baseFilter] of TIER_HIT_LAYERS) {
        if (map.getLayer(layer)) map.setFilter(layer, ['all', baseFilter, tierFilter] as never);
      }
      if (fromZoom) {
        mapMetrics.current.zoomTierCrossings += 1;
        mapMetrics.current.zoomFilterMutations += TIER_HIT_LAYERS.filter(([layer]) =>
          Boolean(map.getLayer(layer)),
        ).length;
      }
      if (qaDiagnostics())
        (window as unknown as Record<string, unknown>).__troutMapMetrics = {
          ...mapMetrics.current,
        };
    };
    map.on('load', () => {
      loaded = true;
      window.clearTimeout(watchdog);
      setReady(true);
      setFailed(false);
      el.dataset.mapReady = '1';
      delete el.dataset.mapFailed;
      applyRef.current();
      updateTierHitFilters();
      latest.current.onMapReady?.(map);
      // Dev-only inspection handle for map-verification tooling.
      if (qaDiagnostics()) (window as unknown as Record<string, unknown>).__troutMap = map;
      // Do not snapshot the full-state bootstrap over a deep-linked water's
      // intended camera. The selection effect fits it once `ready` commits.
      const initialRiver = index.find((river) => river.id === latest.current.selectedId);
      if (initialSaved || !initialRiver) syncCamera();
    });
    // Reapply presentation and the current hit filters once after a style
    // swap, never on every idle. setStyle rebuilds filters from the style JSON.
    map.on('style.load', () => {
      lastHitTier = null;
      updateTierHitFilters();
      map.once('idle', () => applyRef.current());
    });
    map.on('moveend', syncCamera);
    map.on('zoomend', () => updateTierHitFilters(true));
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
          if (!id) return false;
          if (latest.current.visibleIds && !latest.current.visibleIds.has(id)) return false;
          return true;
        });
      // Broad touch targets may overlap. Choose the nearest visible centerline,
      // not the arbitrary source/tile order (which can pick a neighboring creek).
      const selectionCandidates: SelectionCandidate[] = candidates.map((feature) => ({
        id: String(feature.properties.id),
        layerId: feature.layer.id,
        geometry: projectGeometry(map, feature.geometry),
        lengthKm: Number(feature.properties.lengthKm ?? 0),
      }));
      return chooseWaterCandidate([point.x, point.y], selectionCandidates);
    };
    // Gauge popup (feat/tn-gauge-layer) — one reusable popup whose content is
    // built imperatively (same pattern as the creek tooltip: it lives outside
    // React's tree). The reading fetches from /v1/gauges/:id/now on open; in
    // DEV_FIXTURES dev mode that endpoint is absent and the card says so —
    // never a console-breaking or map-breaking surface.
    const gaugePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' });
    gaugePopupRef.current = gaugePopup;
    const openGaugePopup = (feature: maplibregl.MapGeoJSONFeature, lngLat: maplibregl.LngLat) => {
      const p = feature.properties ?? {};
      const gaugeId = String(p.id ?? '');
      const el = document.createElement('div');
      el.setAttribute('data-proof', 'gauge-popup');
      el.style.cssText =
        'font:12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#1c2430;min-width:180px;';
      const title = document.createElement('strong');
      title.style.cssText = 'display:block;font-size:13px;margin-bottom:2px;';
      title.textContent = String(p.name ?? `USGS ${gaugeId}`);
      el.appendChild(title);
      const meta = document.createElement('div');
      meta.style.cssText = 'color:#5b6673;margin-bottom:6px;';
      meta.textContent =
        'USGS ' +
        gaugeId +
        (p.county ? ' · ' + p.county + ' Co' : '') +
        (p.drainSqMi ? ' · ' + p.drainSqMi + ' sq mi' : '');
      el.appendChild(meta);
      const wiredTo = String(p.wiredTo ?? '');
      if (wiredTo) {
        const chips = document.createElement('div');
        chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;';
        for (const slug of wiredTo.split(',')) {
          const chip = document.createElement('a');
          chip.href = '/conditions/' + slug;
          chip.style.cssText =
            'font-size:11px;padding:1px 7px;border:1px solid #c8d2cc;border-radius:999px;color:#2c5a4b;text-decoration:none;';
          chip.textContent = slug.replace(/-/g, ' ');
          chips.appendChild(chip);
        }
        el.appendChild(chips);
      }
      const reading = document.createElement('div');
      reading.setAttribute('data-gauge-reading', '');
      reading.style.cssText = 'color:#5b6673;';
      reading.textContent = 'Loading reading…';
      el.appendChild(reading);
      void (async () => {
        try {
          const res = await fetch(`/v1/gauges/${gaugeId}/now`);
          if (!reading.isConnected) return; // popup dismissed before the reply landed
          if (res.status === 404) reading.textContent = 'No current reading';
          else if (!res.ok) reading.textContent = 'Reading unavailable';
          else {
            const data = (await res.json()) as {
              cfs?: number;
              heightFt?: number;
              tempC?: number;
              timestamp: string;
              stale?: boolean;
            };
            const ageMin = Math.max(
              0,
              Math.round((Date.now() - Date.parse(data.timestamp)) / 60000),
            );
            const age =
              ageMin >= 90
                ? `${Math.round(ageMin / 60)} h ago`
                : ageMin >= 2
                  ? `${ageMin} min ago`
                  : 'just now';
            const parts: string[] = [];
            if (typeof data.cfs === 'number')
              parts.push(`${Math.round(data.cfs).toLocaleString()} cfs`);
            if (typeof data.heightFt === 'number') parts.push(`${data.heightFt.toFixed(2)} ft`);
            if (typeof data.tempC === 'number')
              parts.push(`${Math.round((data.tempC * 9) / 5 + 32)}°F water`);
            reading.textContent = parts.length
              ? `${parts.join(' · ')} · ${age}${data.stale ? ' (cached)' : ''}`
              : 'No current reading';
          }
        } catch {
          if (reading.isConnected) reading.textContent = 'Reading unavailable';
        }
      })();
      gaugePopup.setDOMContent(el).setLngLat(lngLat).addTo(map);
    };
    // TWRA overlay popups (feat/tn-gauge-layer) — attractor structures and
    // trout stocking sites, same imperative pattern; the data is static TWRA
    // registry context, never a live call.
    const overlayPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' });
    const popupCard = (titleText: string, metaText: string) => {
      const el = document.createElement('div');
      el.style.cssText =
        'font:12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#1c2430;min-width:170px;';
      const title = document.createElement('strong');
      title.style.cssText = 'display:block;font-size:13px;margin-bottom:2px;';
      title.textContent = titleText;
      el.appendChild(title);
      const meta = document.createElement('div');
      meta.style.cssText = 'color:#5b6673;';
      meta.textContent = metaText;
      el.appendChild(meta);
      return el;
    };
    const openStockingPopup = (
      feature: maplibregl.MapGeoJSONFeature,
      lngLat: maplibregl.LngLat,
    ) => {
      const p = feature.properties ?? {};
      const bits = [
        p.county ? String(p.county) + ' Co' : '',
        p.region ? 'Region ' + p.region : '',
        String(p.program ?? ''),
        String(p.species ?? ''),
      ].filter(Boolean);
      const el = popupCard(
        String(p.site ?? p.stream ?? 'TWRA trout stocking site'),
        bits.join(' · ') || 'TWRA trout stocking site',
      );
      const lines = [
        p.dh ? 'Delayed harvest: ' + p.dh : '',
        p.permit === 'Yes' ? 'Daily permit required' : '',
        p.hours ? String(p.hours) : '',
      ].filter(Boolean);
      if (lines.length) {
        const extra = document.createElement('div');
        extra.style.cssText = 'color:#5b6673;margin-top:2px;';
        extra.textContent = lines.join(' · ');
        el.appendChild(extra);
      }
      overlayPopup.setDOMContent(el).setLngLat(lngLat).addTo(map);
    };
    const openAttractorPopup = (
      feature: maplibregl.MapGeoJSONFeature,
      lngLat: maplibregl.LngLat,
    ) => {
      const p = feature.properties ?? {};
      const el = popupCard(
        String(p.water ?? p.site ?? 'Fish attractor'),
        [
          p.types ? String(p.types) : '',
          p.depth ? 'depth ' + p.depth : '',
          p.access ? String(p.access) : '',
        ]
          .filter(Boolean)
          .join(' · ') || 'TWRA fish attractor structure',
      );
      if (p.marker) {
        const marker = document.createElement('div');
        marker.style.cssText = 'color:#5b6673;margin-top:2px;';
        marker.textContent = 'Marker: ' + p.marker;
        el.appendChild(marker);
      }
      if (p.note) {
        const note = document.createElement('div');
        note.style.cssText = 'color:#5b6673;margin-top:2px;';
        note.textContent = String(p.note);
        el.appendChild(note);
      }
      overlayPopup.setDOMContent(el).setLngLat(lngLat).addTo(map);
    };
    let hovered: string | null = null;
    // A visible overlay dot (gauge / stocking site / attractor) wins the
    // pointer over the water beneath it. Priority: gauges, stocking, attractors.
    type OverlayHit = {
      kind: 'gauge' | 'stocking' | 'attractor';
      feature: maplibregl.MapGeoJSONFeature;
    };
    const OVERLAY_GROUPS: Array<{
      kind: OverlayHit['kind'];
      layer: string;
      on: 'showGauges' | 'showStockingSites' | 'showAttractors';
    }> = [
      { kind: 'gauge', layer: 'gauges-hit', on: 'showGauges' },
      { kind: 'stocking', layer: 'stocking-hit', on: 'showStockingSites' },
      { kind: 'attractor', layer: 'attractors-hit', on: 'showAttractors' },
    ];
    const overlayAt = (point: maplibregl.Point): OverlayHit | null => {
      for (const group of OVERLAY_GROUPS) {
        if (!latest.current[group.on] || !map.getLayer(group.layer)) continue;
        try {
          const found = map.queryRenderedFeatures(
            [
              [point.x - 5, point.y - 5],
              [point.x + 5, point.y + 5],
            ],
            { layers: [group.layer] },
          )[0];
          if (found) return { kind: group.kind, feature: found };
        } catch {
          /* layer mid-style-swap; overlay hits are never load-bearing */
        }
      }
      return null;
    };
    map.on('mousemove', (e) => {
      if (overlayAt(e.point)) {
        if (hovered) {
          map.setFeatureState({ source: 'rivers', id: hovered }, { hover: false });
          hovered = null;
        }
        map.getCanvas().style.cursor = 'pointer';
        return;
      }
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
    // F45: the tap surface — ONE overlay-first dispatch routine shared by the
    // touch and click handlers below. Priority: gauges, stocking, attractors.
    const tapSurface: MapTapSurface<maplibregl.Point, maplibregl.LngLat> = {
      overlayAt: (point) => overlayAt(point),
      overlayFeatureAt: (kind, point) => {
        const group = OVERLAY_GROUPS.find((g) => g.kind === kind)!;
        try {
          return map.queryRenderedFeatures(
            [
              [point.x - 8, point.y - 8],
              [point.x + 8, point.y + 8],
            ],
            { layers: [group.layer] },
          )[0];
        } catch {
          return undefined; // layer mid-style-swap; fall through to the river
        }
      },
      riverAt: (point) => hit(point),
      openOverlay: (kind, feature, lngLat) => {
        if (kind === 'gauge') openGaugePopup(feature as maplibregl.MapGeoJSONFeature, lngLat);
        else if (kind === 'stocking') openStockingPopup(feature as maplibregl.MapGeoJSONFeature, lngLat);
        else openAttractorPopup(feature as maplibregl.MapGeoJSONFeature, lngLat);
      },
      selectRiver: (id) => latest.current.onSelect(id),
    };
    map.on('touchend', (e) => {
      const start = touchStart;
      touchStart = null;
      if (!start || Math.hypot(e.point.x - start.x, e.point.y - start.y) > 10) return;
      // F45: overlay-first dispatch for touch too — the old touch path
      // selected the river straight from the hit test and armed the
      // suppression timer, so a gauge/stocking/attractor dot on a river could
      // never open its popup on a touchscreen. The synthetic click that
      // follows is suppressed only AFTER the intended action dispatched.
      const dispatched = dispatchMapTap(tapSurface, e.point, e.lngLat);
      if (dispatched) lastTouchSelection = Date.now();
    });
    map.on('touchcancel', () => {
      touchStart = null;
    });
    map.on('click', (e) => {
      // A touch tap already dispatched through the SAME routine above; this
      // synthetic duplicate is suppressed, never re-dispatched.
      if (Date.now() - lastTouchSelection < 500) return;
      dispatchMapTap(tapSurface, e.point, e.lngLat);
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
    const disposeNetworkClusters = initNetworkClusters(
      map,
      catalogPermanentIds,
      { reducedMotion: reduced() },
    );
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
      gaugePopupRef.current?.remove();
      gaugePopupRef.current = null;
      disposeNetworkClusters();
      map.remove();
      mapRef.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const styleKey = mapStyleKey(theme.id, theme.map, props.basemap, Boolean(props.roads));
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
      map.setStyle(
        atlasStyle(props.basemap, theme.map, {
          roads: props.roads,
          reducedMotion: reduced(),
        }),
      );
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
  }, [props.basemap, props.roads, ready, theme.id, paletteSignature, attempt]);
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
        const unassessedWord = note === 'Unverified' ? 'Needs data' : 'Unassessed';
        // Season suffix (2026-09-10, wording ADR 0010): an out-of-season trout
        // water never reads as fishable-now — and never claims the FISH are
        // gone; the window is what is closed.
        const offseason = p.offseasonIds?.has(river.id) ?? false;
        const seasonWord = offseason ? ', out of season' : '';
        el.setAttribute(
          'aria-label',
          'Select ' +
            river.name +
            ', ' +
            kindWord +
            (note ? ', ' + note : '') +
            (assessed ? '' : ', ' + unassessedWord) +
            seasonWord,
        );
        el.title =
          kindWord +
          (note ? ' · ' + note : '') +
          (assessed ? '' : ' · ' + unassessedWord) +
          (offseason ? ' · out of season' : '');
        const point = map.project(river.anchor as [number, number]);
        // Visibility + prominence: the waterDecision filter pass (visibleIds)
        // plus the pure mode-aware gate. Selected/assessed trout compete at
        // full title; major trout waters keep their statewide name; featured
        // anchors the catalog can't verify as trout wear a SUBORDINATE name
        // (dim — never a trout claim); everything else waits for zoom gates.
        const verdict = labelDecision(
          { id: river.id, species, display },
          {
            mode: p.speciesMode ?? 'all',
            troutIds,
            extent,
            zoom: z,
            labelMinZoom: river.labelMinZoom,
            selected,
            assessed,
            seasonalAbsent: p.seasonalAbsentIds?.has(river.id),
          },
        );
        const visible = (!p.visibleIds || p.visibleIds.has(river.id)) && verdict !== 'hidden';
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
        el.classList.toggle('subordinate', verdict === 'subordinate' && !selected);
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
      // maplibre's addImage does NOT replace an existing image name — it
      // fires an ErrorEvent and keeps the old pixels — so theme swaps must
      // re-register via registerFlowArrowIcon (hasImage → updateImage). The
      // glyph is PAPER on an ink halo — light-on-dark reads on the rust
      // selected corridor and on every theme's water color alike.
      // Theme-specific glyph (2026-09-10): dark core on white rim in light
      // mode, near-white core on near-black rim in dark mode — each chosen to
      // read against that theme's water colors.
      const icon = makeFlowArrowImage(
        theme.map.flowArrow,
        theme.map.flowArrowHalo,
        theme.map.flowArrowTip,
      );
      if (icon) registerFlowArrowIcon(map, icon);
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
  }, [ready, props.selectedId, theme.id, paletteSignature, props.basemap, props.roads, attempt]);
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
  // Overlay visibility (feat/tn-gauge-layer): the style ships the overlay
  // layers visibility:none; this applies the persisted settings and re-applies
  // after every style rebuild (theme/basemap/roads swaps reset layout
  // visibility). Turning every overlay off also dismisses an open popup.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    const overlayLayers: Array<[string, boolean]> = [
      ['gauges-dot', Boolean(props.showGauges)],
      ['gauges-hit', Boolean(props.showGauges)],
      ['stocking-dot', Boolean(props.showStockingSites)],
      ['stocking-hit', Boolean(props.showStockingSites)],
      ['attractors-dot', Boolean(props.showAttractors)],
      ['attractors-hit', Boolean(props.showAttractors)],
    ];
    const apply = () => {
      if (cancelled || mapRef.current !== map) return;
      for (const [layer, visible] of overlayLayers) {
        if (map.getLayer(layer)) {
          map.setLayoutProperty(layer, 'visibility', visible ? 'visible' : 'none');
        }
      }
    };
    if (!props.showGauges && !props.showStockingSites && !props.showAttractors) {
      gaugePopupRef.current?.remove();
    }
    apply();
    map.on('idle', apply);
    return () => {
      cancelled = true;
      map.off('idle', apply);
    };
  }, [
    props.showGauges,
    props.showStockingSites,
    props.showAttractors,
    ready,
    theme.id,
    props.basemap,
    props.roads,
    attempt,
  ]);
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
