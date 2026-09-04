import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
// Bundle MapLibre's worker through Vite so it is emitted as a same-origin,
// precached asset. Without this the map requests /assets/maplibre-gl-worker.mjs
// (derived from the bundle URL), gets index.html from the SPA fallback, and
// the style never goes idle — blank map. See mapStyle.ts note on fallbacks.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { atlasStyle, type BasemapVariant } from './mapStyle';
import { TN_BOUNDS, TN_MAX_BOUNDS } from './mapTokens';

setWorkerUrl(maplibreWorkerUrl);

export interface TennesseeMapProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Stream id → condition color (e.g. "#5F7E4B"). Missing entries fall back to no-data. */
  featureColors: Map<string, string>;
  /** All river feature ids — used to dim non-selected rivers on selection. */
  allIds?: string[];
  /** Stream ids that should glow in hatch mode. */
  hatchActiveIds?: Set<string>;
  /** Optional per-river hatch halo color override (e.g. sulphur hue). */
  hatchColors?: Map<string, string>;
  /** Padding (px) for fitBounds when centering a selected river, so the line
   * lands in the unobscured map area (clear of nav, top controls, panel). */
  fitPadding?: { top: number; bottom: number; left: number; right: number };
  /** Orientation labels rendered as lightweight HTML markers (no glyph pipeline). */
  places?: Array<{ name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' }>;
  /** Basemap variant — style is swapped in place on change (never remounts the map). */
  basemap?: BasemapVariant;
  /** Called once the MapLibre instance is ready. */
  onMapReady?: (map: maplibregl.Map) => void;
  className?: string;
  /** Accessibility label. */
  ariaLabel?: string;
}

/**
 * TennesseeMap — MapLibre lifecycle wrapper.
 * - Self-hosted style (no remote glyphs beyond /fonts/glyphs/…, no Mapbox token).
 * - Fit to TN bounds on load, bounded pan via maxBounds, resize observer, cleanup.
 * - Feature-state for selected / hover / hatchActive — no React state inside MapLibre.
 * - Efficient source updates: mutates GeoJSON properties in-place then setData once per tick.
 * - Keeps application state outside MapLibre (selection lives in React/URL).
 */
export function TennesseeMap({
  selectedId,
  onSelect,
  featureColors,
  allIds,
  hatchActiveIds,
  hatchColors,
  fitPadding,
  places,
  basemap = 'paper',
  onMapReady,
  className,
  ariaLabel = 'Tennessee trout waters map',
}: TennesseeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // Map-failure fallback: if the style/sources never go idle, say so plainly
  // and keep the stream list reachable (spec: map failure recovery action).
  const [attempt, setAttempt] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  // Applies condition/hatch colors via feature-state (the style reads
  // `feature-state color` / `hatchColor`, with static property fallbacks).
  // No private MapLibre fields: URL-loaded GeoJSON sources don't expose
  // `_data.features`, so the old mutation path silently no-opped.
  const applyRef = useRef(() => {});

  // mount once (plus explicit retries from the failure fallback)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setMapFailed(false);
    delete container.dataset.mapReady;
    delete container.dataset.mapFailed;
    let idle = false;
    let disposed = false;

    const map = new maplibregl.Map({
      container,
      // Mount with the current variant so deep links (?basemap=ink) and
      // failure retries start on the right ground; later changes swap in place
      // via the basemap effect below (this effect only re-runs on retries).
      style: atlasStyle(basemap) as unknown as maplibregl.StyleSpecification,
      center: [-86.35, 35.75],
      zoom: 6.45,
      minZoom: 5.6,
      maxZoom: 11,
      maxBounds: TN_MAX_BOUNDS,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      // Style + sources are same-origin only; no transform needed. NOTE: do not
      // add remote glyph/sprite URLs without shipping real local files — the
      // server's SPA fallback answers unknown paths with index.html (HTTP 200),
      // which MapLibre then fails to parse, blanking the whole style.
    } as unknown as maplibregl.MapOptions);
    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');

    const fitTN = () => {
      try {
        map.fitBounds(TN_BOUNDS, { padding: 28, duration: 0 });
      } catch {
        // ignore before style load
      }
    };

    map.on('load', () => {
      fitTN();
      onMapReady?.(map);
    });
    map.on('idle', () => {
      idle = true;
      container.dataset.mapReady = '1';
      try { applyRef.current(); } catch { /* colors apply on next tick */ }
    });
    if (typeof window !== 'undefined' && import.meta.env?.DEV) {
      map.on('error', (e) => {
        // Local diagnostics only — never shipped anywhere (privacy principle).
        console.warn('[trout map]', (e as { error?: { message?: string } }).error?.message ?? e);
      });
    }
    // Watchdog: the paper atlas must never sit blank without explanation.
    const watchdog = window.setTimeout(() => {
      if (!disposed && !idle) {
        container.dataset.mapFailed = '1';
        setMapFailed(true);
      }
    }, 12000);

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const feats = (map as unknown as { queryRenderedFeatures: (pt: unknown, opts: unknown) => Array<{ properties?: Record<string, unknown> }> }).queryRenderedFeatures(
        e.point,
        { layers: ['rivers-hit', 'rivers-water', 'rivers-interior', 'rivers-casing'] },
      );
      const f = feats.find((x) => typeof x.properties?.['id'] === 'string');
      const id = f?.properties?.['id'] as string | undefined;
      onSelectRef.current(id ?? null);
    };
    map.on('click', handleClick);

    let hoverId: string | null = null;
    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ['rivers-hit', 'rivers-water'] }) as Array<{ properties?: Record<string, unknown> }>;
      const id = (feats[0]?.properties?.['id'] as string | undefined) ?? null;
      if (id !== hoverId) {
        if (hoverId) {
          try {
            map.setFeatureState({ source: 'rivers', id: hoverId }, { hover: false });
          } catch {
            // feature not yet promoted
          }
        }
        if (id) {
          try {
            map.setFeatureState({ source: 'rivers', id }, { hover: true });
          } catch {
            // ignore
          }
        }
        hoverId = id;
        const canvas = map.getCanvas();
        if (canvas) canvas.style.cursor = id ? 'pointer' : '';
      }
    };
    map.on('mousemove', onMouseMove);

    const onMouseLeaveHit = () => {
      if (hoverId) {
        try {
          map.setFeatureState({ source: 'rivers', id: hoverId }, { hover: false });
        } catch {
          // ignore
        }
        hoverId = null;
      }
      const canvas = map.getCanvas();
      if (canvas) canvas.style.cursor = '';
    };
    map.on('mouseleave', 'rivers-hit', onMouseLeaveHit);
    map.on('mouseleave', 'rivers-water', onMouseLeaveHit);

    // resize observer — keeps map crisp on container changes
    const ro = new ResizeObserver(() => {
      try {
        map.resize();
      } catch {
        // ignore
      }
    });
    ro.observe(container);

    const onResizeWindow = () => {
      try {
        map.resize();
      } catch {
        // ignore
      }
    };
    window.addEventListener('resize', onResizeWindow);

    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      ro.disconnect();
      window.removeEventListener('resize', onResizeWindow);
      try {
        map.off('click', handleClick);
        map.off('mousemove', onMouseMove);
        map.off('mouseleave', 'rivers-hit', onMouseLeaveHit);
        map.off('mouseleave', 'rivers-water', onMouseLeaveHit);
      } catch {
        // ignore
      }
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    };
  }, [onMapReady, attempt]);

  // selection feature-state
  const prevSel = useRef<string | null>(null);
  const fitPaddingRef = useRef(fitPadding);
  fitPaddingRef.current = fitPadding;
  const allIdsRef = useRef(allIds);
  allIdsRef.current = allIds;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let disposed = false;

    // Returns false only when a selected feature is not in the loaded source yet.
    const applySelection = (): boolean => {
      if (disposed) return true;
      if (prevSel.current && prevSel.current !== selectedId) {
        try {
          map.setFeatureState({ source: 'rivers', id: prevSel.current }, { selected: false });
        } catch {
          // source is not ready yet; sourcedata retries below
        }
      }
      const ids = allIdsRef.current;
      if (ids) {
        for (const id of ids) {
          try {
            map.setFeatureState({ source: 'rivers', id }, { dimmed: selectedId ? id !== selectedId : false });
          } catch {
            // source is not ready yet; sourcedata retries below
          }
        }
      }
      if (!selectedId) {
        prevSel.current = null;
        return true;
      }
      try {
        map.setFeatureState({ source: 'rivers', id: selectedId }, { selected: true });
      } catch {
        // source is not ready yet; sourcedata retries below
      }

      try {
        const feats = map.querySourceFeatures('rivers', {
          filter: ['==', ['get', 'id'], selectedId],
        }) as Array<{ geometry: { type: string; coordinates?: unknown; geometries?: Array<{ coordinates?: unknown }> } }>;
        if (!feats.length) return false;

        const flat: Array<[number, number]> = [];
        const walk = (node: unknown) => {
          if (Array.isArray(node) && typeof node[0] === 'number' && typeof node[1] === 'number') {
            flat.push([node[0], node[1]]);
            return;
          }
          if (Array.isArray(node)) for (const child of node) walk(child);
        };
        // Aggregate every returned part/feature; never join parts into a path.
        for (const feat of feats) {
          const g = feat.geometry;
          walk(g.type === 'GeometryCollection' ? (g.geometries ?? []).map((x) => x.coordinates) : g.coordinates);
        }
        if (!flat.length) return false;

        let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
        for (const [lon, lat] of flat) {
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
          minLon = Math.min(minLon, lon); minLat = Math.min(minLat, lat);
          maxLon = Math.max(maxLon, lon); maxLat = Math.max(maxLat, lat);
        }
        if (!Number.isFinite(minLon)) return false;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        map.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
          padding: fitPaddingRef.current ?? { top: 80, bottom: 220, left: 20, right: 20 },
          duration: reduced ? 0 : 420,
          maxZoom: 10,
        });
        prevSel.current = selectedId;
        return true;
      } catch {
        return false;
      }
    };

    const onSourceData = (event: maplibregl.MapSourceDataEvent) => {
      if (event.sourceId !== 'rivers') return;
      if (applySelection() || event.isSourceLoaded) map.off('sourcedata', onSourceData);
    };
    const start = () => {
      if (!applySelection()) map.on('sourcedata', onSourceData);
    };
    if (map.isStyleLoaded()) start();
    else map.once('load', start);
    return () => {
      disposed = true;
      map.off('load', start);
      map.off('sourcedata', onSourceData);
    };
  }, [selectedId]);

  // Basemap swap (Paper ⇄ Ink) — replaces the style in place; never remounts
  // the map. MapLibre keeps feature-state with the style, so once the swapped
  // style goes idle we re-apply condition colors and selection states.
  // 'topo' availability is RiverMapPage's concern (manifest probe) — by the
  // time it reaches here the local topo sources are guaranteed to exist.
  const appliedBasemapRef = useRef<BasemapVariant>('paper');
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemap === appliedBasemapRef.current) return;
    const swap = () => {
      try {
        map.setStyle(atlasStyle(basemap) as unknown as maplibregl.StyleSpecification);
        appliedBasemapRef.current = basemap;
        map.once('idle', () => {
          // feature-state lives with the style — re-apply colors + selection
          try { applyRef.current(); } catch { /* retry paths cover */ }
          for (const id of allIdsRef.current ?? []) {
            try {
              map.setFeatureState(
                { source: 'rivers', id },
                {
                  dimmed: selectedIdRef.current ? id !== selectedIdRef.current : false,
                  selected: id === selectedIdRef.current,
                },
              );
            } catch { /* sourcedata retries cover */ }
          }
        });
      } catch { /* style not ready; next idle applies */ }
    };
    if (map.isStyleLoaded()) swap();
    else map.once('idle', swap); // style can still be loading on first mount
    return () => {
      map.off('idle', swap);
    };
  }, [basemap]);

  // Condition colors + hatch halo via feature-state only (public API).
  // Retried on `sourcedata` for deep links whose ids aren't loaded yet.
  applyRef.current = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    for (const [id, color] of featureColors) {
      try {
        map.setFeatureState({ source: 'rivers', id }, { color });
      } catch {
        // source not ready yet; idle/sourcedata handlers retry
      }
    }
    if (hatchColors) {
      for (const [id, hatchColor] of hatchColors) {
        try {
          map.setFeatureState({ source: 'rivers', id }, { hatchColor });
        } catch {
          // source not ready yet; idle/sourcedata handlers retry
        }
      }
    }
    const ids = allIdsRef.current ?? [...featureColors.keys()];
    for (const id of ids) {
      const active = hatchActiveIds?.has(id) ?? false;
      try {
        map.setFeatureState({ source: 'rivers', id }, { hatchActive: active });
      } catch {
        // promoteId not ready yet; idle/sourcedata handlers retry
      }
    }
  };
  useEffect(() => {
    try { applyRef.current(); } catch { /* map not ready yet; idle handler retries */ }
    const map = mapRef.current;
    if (!map) return;
    // Deep links can mount before the rivers source finishes fetching —
    // retry colors on sourcedata until the source reports loaded.
    const onSourceData = (event: maplibregl.MapSourceDataEvent) => {
      if (event.sourceId !== 'rivers') return;
      try { applyRef.current(); } catch { /* retry on next event */ }
      if (event.isSourceLoaded) map.off('sourcedata', onSourceData);
    };
    map.on('sourcedata', onSourceData);
    return () => {
      map.off('sourcedata', onSourceData);
    };
  }, [featureColors, hatchActiveIds, hatchColors, allIds]);

  // Orientation labels as lightweight HTML markers (no glyph pipeline, no
  // remote fonts). Pointer-transparent so river taps always land.
  // Zoom-gated to avoid statewide clutter: cities always, towns at z≥7,
  // water labels at z≥7.5.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !places?.length) return;
    let idle = false;
    const markers: Array<{ marker: maplibregl.Marker; el: HTMLDivElement; kind: string }> = [];
    const applyZoomVisibility = () => {
      let z = 6;
      try { z = map.getZoom(); } catch { /* keep default */ }
      for (const { el, kind } of markers) {
        const show = kind === 'city' ? true : kind === 'town' ? z >= 7 : z >= 7.5;
        el.style.display = show ? '' : 'none';
      }
    };
    const add = () => {
      if (idle) return;
      idle = true;
      for (const p of places) {
        const el = document.createElement('div');
        el.className = `atlas-place atlas-place--${p.kind}`;
        el.textContent = p.name;
        el.setAttribute('aria-hidden', 'true');
        try {
          const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(map);
          markers.push({ marker, el, kind: p.kind });
        } catch {
          // ignore marker failures — labels are orientation aids only
        }
      }
      applyZoomVisibility();
    };
    if (map.isStyleLoaded()) add();
    else map.once('load', add);
    map.on('zoom', applyZoomVisibility);
    map.on('moveend', applyZoomVisibility);
    return () => {
      map.off('zoom', applyZoomVisibility);
      map.off('moveend', applyZoomVisibility);
      for (const { marker } of markers) {
        try { marker.remove(); } catch { /* ignore */ }
      }
    };
  }, [places]);

  return (
    <div className={className ?? 'absolute inset-0'} data-basemap={basemap}>
      {/* NOTE: positioning lives on this wrapper. MapLibre sets
          .maplibregl-map{position:relative}, which would override an `absolute`
          class placed directly on its container and collapse it to zero height. */}
      <div ref={containerRef} className="h-full w-full" aria-label={ariaLabel} role="application" />
      {mapFailed && (
        <div className="absolute inset-x-3 top-24 mx-auto max-w-md rounded-2xl border bg-[#F8F2E5] p-4 shadow-[0_8px_32px_rgba(51,45,32,0.16)]" style={{ borderColor: '#D3C6AB' }} role="alert">
          <p className="text-sm font-bold text-[#24352D]">The river map didn&rsquo;t finish loading.</p>
          <p className="mt-1 text-sm text-[#566158]">Your saved logbook and stream list are unaffected.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setAttempt((a) => a + 1)} className="min-h-[44px] flex-1 rounded-xl bg-[#24352D] px-4 text-sm font-bold text-white">Try again</button>
            <a href="/browse" className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border px-4 text-sm font-bold text-[#24352D]" style={{ borderColor: '#D3C6AB' }}>Browse streams as a list</a>
          </div>
        </div>
      )}
    </div>
  );
}
