import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
// Bundle MapLibre's worker through Vite so it is emitted as a same-origin,
// precached asset. Without this the map requests /assets/maplibre-gl-worker.mjs
// (derived from the bundle URL), gets index.html from the SPA fallback, and
// the style never goes idle — blank map. See mapStyle.ts note on fallbacks.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { atlasStyle } from './mapStyle';
import { TN_BOUNDS, TN_MAX_BOUNDS } from './mapTokens';

setWorkerUrl(maplibreWorkerUrl);

export interface TennesseeMapProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Stream id → condition color (e.g. "#5F7E4B"). Missing entries fall back to no-data. */
  featureColors: Map<string, string>;
  /** Stream ids that should glow in hatch mode. */
  hatchActiveIds?: Set<string>;
  /** Optional per-river hatch halo color override (e.g. sulphur hue). */
  hatchColors?: Map<string, string>;
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
  hatchActiveIds,
  hatchColors,
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

  // Applies condition/hatch colors onto the loaded GeoJSON source data.
  // Guards: style may be loaded while the source fetch is still in flight
  // (src._data is not a FeatureCollection yet). The mount effect re-runs this
  // on idle so colors land as soon as data arrives.
  const applyRef = useRef(() => {});

  // mount once (plus explicit retries from the failure fallback)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setMapFailed(false);
    let idle = false;
    let disposed = false;

    const map = new maplibregl.Map({
      container,
      style: atlasStyle() as unknown as maplibregl.StyleSpecification,
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
      if (!disposed && !idle) setMapFailed(true);
    }, 12000);

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const feats = (map as unknown as { queryRenderedFeatures: (pt: unknown, opts: unknown) => Array<{ properties?: Record<string, unknown> }> }).queryRenderedFeatures(
        e.point,
        { layers: ['rivers-hit', 'rivers-interior', 'rivers-casing'] },
      );
      const f = feats.find((x) => typeof x.properties?.['id'] === 'string');
      const id = f?.properties?.['id'] as string | undefined;
      onSelectRef.current(id ?? null);
    };
    map.on('click', handleClick);

    let hoverId: string | null = null;
    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ['rivers-hit'] }) as Array<{ properties?: Record<string, unknown> }>;
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
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // wait for style before touching feature-state
    const apply = () => {
      if (prevSel.current && prevSel.current !== selectedId) {
        try {
          map.setFeatureState({ source: 'rivers', id: prevSel.current }, { selected: false });
        } catch {
          // ignore missing promoteId until data loaded
        }
      }
      if (selectedId) {
        try {
          map.setFeatureState({ source: 'rivers', id: selectedId }, { selected: true });
        } catch {
          // ignore
        }
        // ease to river bounds if feature is in rendered source
        try {
          const feats = map.querySourceFeatures('rivers', {
            filter: ['==', ['get', 'id'], selectedId],
          }) as Array<{ geometry: { type: string; coordinates: [number, number][] } }>;
          const feat = feats[0];
          if (feat?.geometry?.coordinates?.length) {
            const coords = feat.geometry.coordinates as [number, number][];
            let minLon = Infinity,
              minLat = Infinity,
              maxLon = -Infinity,
              maxLat = -Infinity;
            for (const c of coords) {
              if (!Array.isArray(c) || c.length < 2) continue;
              const [lon, lat] = c as [number, number];
              minLon = Math.min(minLon, lon);
              minLat = Math.min(minLat, lat);
              maxLon = Math.max(maxLon, lon);
              maxLat = Math.max(maxLat, lat);
            }
            if (Number.isFinite(minLon)) {
              const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              map.fitBounds(
                [
                  [minLon, minLat],
                  [maxLon, maxLat],
                ],
                {
                  padding: { top: 80, bottom: 220, left: 20, right: 20 },
                  duration: reduced ? 0 : 420,
                  maxZoom: 10,
                },
              );
            }
          }
        } catch {
          // ignore
        }
      }
      prevSel.current = selectedId;
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [selectedId]);

  // efficient source property updates (condition colors + hatch halo)
  applyRef.current = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('rivers') as unknown as { _data?: { features?: Array<{ properties: Record<string, unknown>; id?: string }> }; setData?: (d: unknown) => void } | null;
    const feats = src?._data?.features;
    if (!src || !src.setData || !Array.isArray(feats)) return;

    let colorChanged = false;
    for (const f of feats) {
      const id = (f.properties['id'] as string | undefined) ?? (f.id as string | undefined);
      if (!id) continue;
      const nextColor = featureColors.get(id);
      if (nextColor !== undefined && f.properties['color'] !== nextColor) {
        f.properties['color'] = nextColor;
        colorChanged = true;
      }
      const hc = hatchColors?.get(id);
      if (hc !== undefined && f.properties['hatchColor'] !== hc) {
        f.properties['hatchColor'] = hc;
        colorChanged = true;
      }
      const active = hatchActiveIds?.has(id) ?? false;
      try {
        map.setFeatureState({ source: 'rivers', id }, { hatchActive: active });
      } catch {
        // promoteId not ready yet
      }
    }

    if (colorChanged) {
      // one setData per tick — cheap for ~92 features
      requestAnimationFrame(() => {
        try {
          (src.setData as (d: unknown) => void)(src._data);
        } catch {
          // ignore
        }
      });
    }
  };
  useEffect(() => {
    try { applyRef.current(); } catch { /* map not ready yet; idle handler retries */ }
  }, [featureColors, hatchActiveIds, hatchColors]);

  return (
    <div className={className ?? 'absolute inset-0'}>
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
