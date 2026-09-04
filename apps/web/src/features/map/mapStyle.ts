import { atlas, atlasLight } from './mapTokens';
import type { StyleSpecification, FilterSpecification } from 'maplibre-gl';

/** Basemap variants. 'topo' layers real local USGS-3DEP derivatives; RiverMapPage only offers it when /atlas/topo/manifest.json resolves. */
export type BasemapVariant = 'paper' | 'ink' | 'topo';

// Wide-water safety: line layers must never touch polygon features (a line
// layer on polygon geometry draws ring outlines — including straight
// county-clip edges — instead of a river path). Legacy $type filters.
const LINES_ONLY = ['==', '$type', 'LineString'] as unknown as FilterSpecification;
const POLYS_ONLY = ['==', '$type', 'Polygon'] as unknown as FilterSpecification;
// Point anchors (West TN put-and-take ponds — no NHD linear geometry exists
// for them). In MapLibre $type, 'Point' also covers MultiPoint.
const POINTS_ONLY = ['==', '$type', 'Point'] as unknown as FilterSpecification;

/**
 * Self-hosted Field Notes Atlas StyleSpec.
 * - No remote tiles, no Mapbox token, no external requests of any kind.
 * - Sources are local GeoJSON under /atlas/*. All data stays on-device / same-origin.
 * - NOTE: no `sprite` and no `glyphs` URLs are declared. The server's SPA fallback
 *   answers unknown paths with index.html (HTTP 200), so pointing MapLibre at a
 *   sprite/glyph path that has no real file makes it parse HTML as JSON/PBF and
 *   fail the whole style load (blank map). Only re-add those keys together with
 *   real local files AND server routes that 404 instead of falling back.
 *   (No layer below needs them: there are no icon or symbol layers — place
 *   labels render as HTML markers in TennesseeMap, not as glyph text.)
 * - Layers bottom→top: background (pine-black), neighbor-state context fill,
 *   TN fill, county hairlines, TN outline, river casing (near-black shadow),
 *   river interior (condition color via feature property `color`),
 *   selection highlight, hatch-mode halo, wide transparent hit line.
 * - `variant` swaps ground/line tones only ('paper' merges atlasLight over the
 *   dark atlas). Condition hues, selection amber, and data fallbacks are
 *   identical in every variant so the legend stays truthful.
 * - The `hidden` feature-state (species filtering) removes a river from every
 *   paint layer; visibility for hit-testing is enforced in TennesseeMap.
 * - 'topo' keeps the dark ground and splices in the local USGS-3DEP
 *   derivatives (hillshade raster + contour band lines) beneath all river
 *   layers. RiverMapPage only selects it after the manifest probe succeeds.
 */
export function atlasStyle(variant: BasemapVariant = 'ink'): StyleSpecification {
  const t = variant === 'paper' ? { ...atlas, ...atlasLight } : atlas;
  const style: StyleSpecification = {
    version: 8,
    name: 'Tailwater Atlas',
    sources: {
      'tn-boundary': { type: 'geojson', data: '/atlas/tn-boundary.geojson' },
      'states-context': { type: 'geojson', data: '/atlas/states-context.geojson' },
      'tn-counties': { type: 'geojson', data: '/atlas/tn-counties.geojson' },
      lakes: { type: 'geojson', data: '/atlas/lakes.geojson' },
      rivers: { type: 'geojson', data: '/atlas/rivers.geojson', promoteId: 'id' as unknown as string },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': t.paper },
      },
      // Neighboring states — faint context so TN reads as a place, not a void
      {
        id: 'states-context-fill',
        type: 'fill' as const,
        source: 'states-context',
        paint: { 'fill-color': t.paper, 'fill-opacity': 1 },
      },
      {
        id: 'states-context-outline',
        type: 'line' as const,
        source: 'states-context',
        paint: {
          'line-color': t.hairline,
          'line-width': 1,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2.5],
        },
      },
      {
        id: 'tn-fill',
        type: 'fill' as const,
        source: 'tn-boundary',
        paint: { 'fill-color': t.paperRaised, 'fill-opacity': 1 },
      },
      // County hairlines — orientation grid at mid zooms, faded at state view
      {
        id: 'tn-counties',
        type: 'line' as const,
        source: 'tn-counties',
        paint: {
          'line-color': t.contour,
          'line-width': 0.7,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5.6, 0.25, 7.5, 0.55],
        },
      },
      // subtle contour / state border — hairline on paper
      {
        id: 'tn-contour',
        type: 'line' as const,
        source: 'tn-boundary',
        paint: {
          'line-color': t.contour,
          'line-width': 0.85,
          'line-opacity': 0.45,
          'line-dasharray': [3, 3],
        },
      },
      {
        id: 'tn-outline',
        type: 'line' as const,
        source: 'tn-boundary',
        paint: { 'line-color': t.hairline, 'line-width': 1.4, 'line-opacity': 1 },
      },
      // Lakes & reservoirs (Census AREAWATER; see scripts/build-lakes.mjs) —
      // the still waters the mapped rivers drain from / tailrace out of.
      // Rendered beneath every river layer so tailwaters visibly connect.
      {
        id: 'lakes-fill',
        type: 'fill' as const,
        source: 'lakes',
        paint: {
          'fill-color': t.lakeFill,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5.6, 0.75, 8, 1],
        },
      },
      {
        id: 'lakes-shore',
        type: 'line' as const,
        source: 'lakes',
        paint: {
          'line-color': t.lakeShore,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5.6, 0.5, 8, 1],
          'line-opacity': 0.9,
        },
      },
      // Wide water — AREAWATER polygons (Hiwassee, French Broad, Obed; TIGER
      // has no centerlines for these). Rendered as watercolor washes: soft
      // condition tint + hairline shore. Never drawn by line layers.
      {
        id: 'rivers-water',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#D98232',
            ['coalesce', ['feature-state', 'color'], ['get', 'color'], '#8B8A82'],
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            0.55,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.08,
            0.34,
          ],
        },
      },
      // Shore hairline for wide water — 1px ink so the county-clip edges that
      // exist in the source polygons stay subtle; selection turns it sulphur.
      {
        id: 'rivers-water-shore',
        type: 'line' as const,
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            t.selection,
            t.ink,
          ],
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0.8],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.25,
            0.7,
          ],
        },
      },
      // Hatch glow for wide water — soft interior wash, never a ring outline.
      {
        id: 'rivers-hatch-wash',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'fill-color': ['coalesce', ['feature-state', 'hatchColor'], ['get', 'hatchColor'], t.sulphur],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'hatchActive'], false],
            0.24,
            0,
          ],
        },
      },
      // Rivers — casing (ink) renders beneath interior so bends read clearly.
      // LINESTRING ONLY — see LINES_ONLY note above.
      {
        id: 'rivers-casing',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.ink,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            7,
            ['boolean', ['feature-state', 'hover'], false],
            5,
            3.4,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            1,
            ['boolean', ['feature-state', 'hover'], false],
            0.9,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.18,
            0.62,
          ],
        },
      },
      // Rivers — interior (condition color: feature-state `color` set live by
      // TennesseeMap, static `get color` property as fallback). LINES ONLY.
      {
        id: 'rivers-interior',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['feature-state', 'color'], ['get', 'color'], t.noData],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.4,
            ['boolean', ['feature-state', 'hover'], false],
            2.9,
            ['boolean', ['feature-state', 'dimmed'], false],
            1.4,
            2.05,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.35,
            1,
          ],
        },
      },
      // Selection highlight — warm outline beyond casing when selected. LINES ONLY.
      {
        id: 'rivers-selection',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.selection,
          'line-width': 8.5,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            0.95,
            0,
          ],
        },
      },
      // Hatch-mode halo — sulphur glow when hatchActive. LINES ONLY.
      {
        id: 'rivers-hatch-halo',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['feature-state', 'hatchColor'], ['get', 'hatchColor'], t.sulphur],
          'line-width': 9,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'hatchActive'], false],
            0.5,
            0,
          ],
          'line-blur': 1.4,
        },
      },
      // Wide transparent hit area — last so it receives pointer events. LINES ONLY.
      {
        id: 'rivers-hit',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 18 },
      },
      // Point anchors — put-and-take ponds rendered as circled markers keyed
      // to the same condition feature-state colors as the river lines.
      {
        id: 'rivers-point',
        type: 'circle',
        source: 'rivers',
        filter: POINTS_ONLY,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5.6, 3.5, 8, 5.5],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#D98232',
            ['coalesce', ['feature-state', 'color'], ['get', 'color'], '#8B8A82'],
          ],
          'circle-stroke-color': '#000',
          'circle-stroke-width': 1.2,
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            0.95,
          ],
          'circle-stroke-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            0.7,
          ],
        },
      },
      {
        id: 'rivers-point-hit',
        type: 'circle',
        source: 'rivers',
        filter: POINTS_ONLY,
        paint: { 'circle-color': '#000', 'circle-opacity': 0, 'circle-radius': 16 },
      },
    ],
  };

  if (variant !== 'topo') return style;

  // Task 6e Phase B — Topo: real USGS-3DEP derivatives, fully local, layered
  // beneath every river layer. RiverMapPage only requests this style after
  // /atlas/topo/manifest.json resolves, so missing build output can't 404 here.
  // Ground stays paper tones; the hillshade and contour lines carry the relief.
  style.sources = {
    ...style.sources,
    hillshade: {
      type: 'raster',
      tiles: ['/atlas/topo/hillshade/{z}/{x}/{y}.webp'],
      tileSize: 256,
      minzoom: 7,
      maxzoom: 11,
      // The build clips output to the TN box — bounds keeps MapLibre from
      // requesting (and 404ing) tiles outside it.
      bounds: [-90.6, 34.98, -81.45, 36.75],
    },
    'contours-band0': { type: 'geojson', data: '/atlas/topo/contours-band0.geojson' },
    'contours-band1': { type: 'geojson', data: '/atlas/topo/contours-band1.geojson' },
    'contours-band2': { type: 'geojson', data: '/atlas/topo/contours-band2.geojson' },
  };
  const afterLayer = (id: string) => {
    const i = style.layers.findIndex((l) => l.id === id);
    return i < 0 ? style.layers.length : i + 1;
  };
  // Hillshade sits just above the TN fill (under the county hairlines) so the
  // relief reads as ground, not as a data layer. 0.35 keeps rivers the lead.
  style.layers.splice(afterLayer('tn-fill'), 0, {
    id: 'topo-hillshade',
    type: 'raster',
    source: 'hillshade',
    paint: { 'raster-opacity': 0.35 },
  });
  // Contour bands — above the county hairlines, below the state border and
  // every river layer. Same hairline tone in three descending weights, each
  // fading in with zoom; the 20 m band only appears at high zoom (≥ z10).
  style.layers.splice(
    afterLayer('tn-counties'),
    0,
    {
      id: 'topo-contours-major',
      type: 'line' as const,
      source: 'contours-band0',
      paint: {
        'line-color': t.contour,
        'line-width': 1.1,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.55],
      },
    },
    {
      id: 'topo-contours-mid',
      type: 'line' as const,
      source: 'contours-band1',
      paint: {
        'line-color': t.contour,
        'line-width': 0.7,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 9, 0.4],
      },
    },
    {
      id: 'topo-contours-minor',
      type: 'line' as const,
      source: 'contours-band2',
      paint: {
        'line-color': t.contour,
        'line-width': 0.55,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 10.5, 0.3],
      },
    },
  );
  return style;
}

/** Back-compat alias for older imports. */
export const MAP_STYLE = atlasStyle();
export default atlasStyle;
