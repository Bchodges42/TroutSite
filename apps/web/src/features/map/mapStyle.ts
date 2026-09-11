import { atlas, atlasLight } from './mapTokens';
import { EMPTY_FLOW_SOURCE, FLOW_ARROW_ICON, FLOW_ARROWS_SOURCE } from './flowArrows';
import type {
  StyleSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
} from 'maplibre-gl';
import type { MapPalette } from '../../theme/themes';

/** Basemap variants. 'topo' layers real local USGS-3DEP derivatives; RiverMapPage only offers it when /atlas/topo/manifest.json resolves. */
export type BasemapVariant = 'paper' | 'ink' | 'topo';

/**
 * Optional first-party road context (BACKEND-ISSUES B12, delivered by the
 * roads session). The UI probes /atlas/roads-manifest.json and only builds
 * road layers when it lists files; roads always render beneath every water
 * layer — context, never competition. Zoom gates come from the entry's
 * `minZoom` when present, else from its LOD class.
 */
export interface RoadsSpec {
  files: Array<{ file: string; lod?: string; minZoom?: number }>;
  attribution?: string;
}

const LOD_MIN_ZOOM: Record<string, number> = { major: 5.6, mid: 8, minor: 9.5 };

// Wide-water safety: line layers must never touch polygon features (a line
// layer on polygon geometry draws ring outlines — including straight
// county-clip edges — instead of a river path). Legacy $type filters.
const LINES_ONLY = ['==', '$type', 'LineString'] as unknown as FilterSpecification;
const POLYS_ONLY = ['==', '$type', 'Polygon'] as unknown as FilterSpecification;
// Point anchors (West TN put-and-take ponds — no NHD linear geometry exists
// for them). In MapLibre $type, 'Point' also covers MultiPoint.
const POINTS_ONLY = ['==', '$type', 'Point'] as unknown as FilterSpecification;

/** Linear mix of two #rrggbb colors — derives presentation tones without new palette entries. */
function mixHex(a: string, b: string, ratio: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a) as [number, number, number];
  const [br, bg, bb] = parse(b) as [number, number, number];
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * ratio)
      .toString(16)
      .padStart(2, '0');
  return '#' + channel(ar, br) + channel(ag, bg) + channel(ab, bb);
}

/**
 * Self-hosted Field Notes Atlas StyleSpec.
 * - No remote tiles, no Mapbox token, no external requests of any kind.
 * - Sources are local GeoJSON under /atlas/*. All data stays on-device / same-origin.
 * - NOTE: no `sprite` and no `glyphs` URLs are declared. The server's SPA fallback
 *   answers unknown paths with index.html (HTTP 200), so pointing MapLibre at a
 *   sprite/glyph path that has no real file makes it parse HTML as JSON/PBF and
 *   fail the whole style load (blank map). Only re-add those keys together with
 *   real local files AND server routes that 404 instead of falling back.
 *   (No layer below needs them: place labels render as HTML markers in
 *   TennesseeMap, not as glyph text, and the one symbol layer — selection flow
 *   arrows — uses an icon registered at runtime via map.addImage.)
 * - Layers bottom→top: background (pine-black), neighbor-state context fill,
 *   TN fill, county hairlines, TN outline, river casing (paper-tone halo),
 *   river water corridor (solid muted water base for EVERY line),
 *   condition centerline (narrower, assessed only), unassessed dashes
 *   (quiet at state zoom, clearer at local zoom), selection highlight,
 *   hatch-mode halo, wide transparent hit line.
 * - `variant` swaps ground/line tones only ('paper' merges atlasLight over the
 *   dark atlas). Condition hues, selection amber, and data fallbacks are
 *   identical in every variant so the legend stays truthful.
 * - The `hidden` feature-state (species filtering) removes a river from every
 *   paint layer; visibility for hit-testing is enforced in TennesseeMap.
 * - 'topo' keeps the dark ground and splices in the local USGS-3DEP
 *   derivatives (hillshade raster + contour band lines) beneath all river
 *   layers. RiverMapPage only selects it after the manifest probe succeeds.
 */
export function atlasStyle(
  variant: BasemapVariant = 'ink',
  palette?: MapPalette,
  options?: { roads?: RoadsSpec },
): StyleSpecification {
  const t = palette ?? (variant === 'paper' ? { ...atlas, ...atlasLight } : atlas);
  // The continuous water corridor every river line sits on: a muted water tone
  // halfway between the still-water polygon fill and the deep water accent, so
  // lines and polygons read as one hydrography system in both themes.
  const waterCorridor = mixHex(t.lakeFill, t.water, 0.5);
  const style: StyleSpecification = {
    version: 8,
    name: 'Trout · Fieldwork',
    sources: {
      'tn-boundary': { type: 'geojson', data: '/atlas/tn-boundary.geojson' },
      'states-context': { type: 'geojson', data: '/atlas/states-context.geojson' },
      'tn-counties': { type: 'geojson', data: '/atlas/tn-counties.geojson' },
      lakes: { type: 'geojson', data: '/atlas/lakes.geojson' },
      rivers: {
        type: 'geojson',
        data: '/atlas/rivers.geojson',
        promoteId: 'id' as unknown as string,
      },
      // Flow-direction arrow carriers — built CLIENT-SIDE from the selected
      // feature's coordinates + flowOrientation.json flip flags (see
      // flowArrows.ts). Starts empty; TennesseeMap fills it on selection.
      [FLOW_ARROWS_SOURCE]: {
        type: 'geojson',
        data: EMPTY_FLOW_SOURCE,
      } as GeoJSONSourceSpecification,
      // PROOF (GEOVALID-2): full NHD named network for the Caney Fork region —
      // zoom-gated minor-water layer under evaluation. Temporary, proof-only.
      network: { type: 'geojson', data: '/atlas/network-caneyfork.geojson' },
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
        paint: {
          'line-color': t.softInk,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5.5, 1.2, 8.5, 2],
          'line-opacity': 1,
        },
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
      // First-class catalog water polygons. Keep a quiet water-colored base so
      // an unassessed polygon is still legible as water; condition and
      // interaction state are layered above it. Never drawn by line layers.
      {
        id: 'rivers-water-base',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'fill-color': t.lakeFill,
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.5,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'dimmed'], false],
              0.18,
              0.72,
            ],
            9,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'dimmed'], false],
              0.18,
              0.94,
            ],
          ],
        },
      },
      // Condition wash — the polygon equivalent of the river interior.
      {
        id: 'rivers-water',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            ['coalesce', ['feature-state', 'color'], t.noData],
            ['coalesce', ['feature-state', 'color'], t.noData],
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            0.55,
            ['boolean', ['feature-state', 'hover'], false],
            0.46,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.08,
            0.3,
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
            ['boolean', ['feature-state', 'hover'], false],
            t.hover,
            t.ink,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.5,
            ['boolean', ['feature-state', 'hover'], false],
            2,
            0.8,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            1,
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
          'fill-color': [
            'coalesce',
            ['feature-state', 'hatchColor'],
            ['get', 'hatchColor'],
            t.sulphur,
          ],
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
      // PROOF (GEOVALID-2): zoom-gated named-creek network (Caney Fork region).
      // Invisible below zoom 9.6 and fades in — the state view stays clean.
      {
        id: 'network-minor',
        type: 'line' as const,
        source: 'network',
        minzoom: 9.6,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#5f8fb8',
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 9.6, 0, 10.8, 0.95],
          'line-width': ['interpolate', ['linear'], ['zoom'], 9.6, 0.8, 13.5, 1.8],
        },
      },
      // Rivers — casing (paper-tone halo) renders beneath the water corridor so
      // bends read clearly against the ground. LINESTRING ONLY — see note above.
      {
        id: 'rivers-casing',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            t.selection,
            ['boolean', ['feature-state', 'hover'], false],
            t.hover,
            t.ink,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            6.4,
            ['boolean', ['feature-state', 'hover'], false],
            6.4,
            ['boolean', ['feature-state', 'dimmed'], false],
            2.6,
            4.2,
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
      // Continuous water corridor — a solid, muted water-colored base under
      // EVERY river line, assessed or not. Unassessed water still reads as
      // water at state zoom; forks and multipart segments stay visually
      // connected because dash gaps land on this corridor, never on bare
      // ground. Selection hides it so the amber casing + condition color read
      // exactly like the pre-corridor selection pop.
      {
        id: 'rivers-base',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': waterCorridor,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            4.4,
            ['boolean', ['feature-state', 'hover'], false],
            3.9,
            ['boolean', ['feature-state', 'dimmed'], false],
            1.8,
            3.2,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            0,
            ['boolean', ['feature-state', 'dimmed'], false],
            0.4,
            0.9,
          ],
        },
      },
      // Rivers — condition centerline (feature-state `color` set live by
      // TennesseeMap, static `get color` property as fallback). Rendered as a
      // NARROWER line down the center of the corridor, and only for assessed
      // waters — unavailable data never renders as a solid condition.
      // LINES ONLY.
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
            2.6,
            ['boolean', ['feature-state', 'dimmed'], false],
            1.2,
            1.9,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'assessed'], false],
            ['case', ['boolean', ['feature-state', 'dimmed'], false], 0.4, 1],
            0,
          ],
        },
      },
      // Unassessed dashes — dashed semantics for waters without an applicable
      // assessment, layered OVER the solid corridor (never converting missing
      // data into a condition). Two treatments crossfade with zoom:
      //   • state/low zoom — a tight, quiet dash so the whole river system
      //     reads as one cohesive water corridor from the statewide view;
      //   • regional/local zoom — a clearer dash that honestly communicates
      //     "no condition available here" once the user is choosing waters.
      {
        id: 'rivers-unassessed-quiet',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.noData,
          'line-width': 1.9,
          'line-dasharray': [1.5, 3.2],
          // zoom must stay top-level (MapLibre), so the state gates live in
          // the stop values.
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.5,
            ],
            7.4,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.22,
            ],
            8.6,
            0,
          ],
        },
      },
      {
        id: 'rivers-unassessed',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.noData,
          'line-width': 2.3,
          'line-dasharray': [3, 2.4],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7.4,
            0,
            8.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              0.75,
            ],
            9.4,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'assessed'], false],
              0,
              1,
            ],
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
          'line-width': 1.2,
          'line-gap-width': 6.4,
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
      // M1: width and opacity scale with zoom — at statewide zooms the halo
      // stays a narrow hint so the waterway and its condition color remain
      // legible under it, instead of a fixed 9px amber wash dominating.
      {
        id: 'rivers-hatch-halo',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'coalesce',
            ['feature-state', 'hatchColor'],
            ['get', 'hatchColor'],
            t.sulphur,
          ],
          'line-width': ['interpolate', ['exponential', 2], ['zoom'], 5.6, 3.5, 9, 9, 13, 13],
          // Zoom must be the TOP-LEVEL interpolate input (style-spec), so the
          // per-feature case lives in each stop's output instead.
          'line-opacity': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            5.6,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'hatchActive'], false],
              0.3,
              0,
            ],
            9,
            [
              'case',
              ['boolean', ['feature-state', 'hidden'], false],
              0,
              ['boolean', ['feature-state', 'hatchActive'], false],
              0.5,
              0,
            ],
          ],
          'line-blur': 1.4,
        },
      },
      // Flow-direction arrows on the SELECTED water only. The source data is
      // built client-side by TennesseeMap from flowOrientation.json flip
      // flags (downstream-oriented carrier lines); an UNORIENTED water stays
      // empty, so missing evidence never renders as a direction. The icon is
      // registered at runtime (map.addImage) — still no sprite/glyph URLs.
      // Positioned above every water render but below the transparent hit
      // layers; labels are DOM markers and always sit above the canvas.
      {
        id: 'rivers-flow-arrows',
        type: 'symbol' as const,
        source: FLOW_ARROWS_SOURCE,
        minzoom: 6.5,
        layout: {
          'symbol-placement': 'line',
          // ~1 arrow every 130 screen px — readable cadence without clutter.
          'symbol-spacing': 130,
          'icon-image': FLOW_ARROW_ICON,
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': ['interpolate', ['linear'], ['zoom'], 6.5, 0.55, 11, 1.0],
        },
        paint: { 'icon-opacity': 1 },
      },
      // Wide transparent hit area — last so it receives pointer events. LINES ONLY.
      {
        id: 'rivers-hit',
        type: 'line' as const,
        source: 'rivers',
        filter: LINES_ONLY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.ink, 'line-opacity': 0, 'line-width': 28 },
      },
      // Catalog polygon hit target. The fill makes the complete visible water
      // surface tappable; the transparent outline gives narrow coves and tiny
      // polygons a forgiving edge without changing their appearance.
      {
        id: 'rivers-water-hit',
        type: 'fill',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: { 'fill-color': t.water, 'fill-opacity': 0 },
      },
      {
        id: 'rivers-water-hit-outline',
        type: 'line',
        source: 'rivers',
        filter: POLYS_ONLY,
        paint: { 'line-color': t.water, 'line-opacity': 0, 'line-width': 18 },
      },
      // Point anchors — put-and-take ponds use a water-centered ring, distinct
      // from river lines. The outer halo scales with zoom while the ring keeps
      // their Unassessed condition status honest.
      {
        id: 'rivers-point-halo',
        type: 'circle',
        source: 'rivers',
        filter: POINTS_ONLY,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5.3, 9, 8, 13, 11, 17],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            t.selection,
            t.water,
          ],
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'hidden'], false],
            0,
            ['boolean', ['feature-state', 'selected'], false],
            0.28,
            ['boolean', ['feature-state', 'hover'], false],
            0.24,
            0.14,
          ],
          'circle-blur': 0.45,
        },
      },
      {
        id: 'rivers-point',
        type: 'circle',
        source: 'rivers',
        filter: POINTS_ONLY,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.3,
            [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              8,
              ['boolean', ['feature-state', 'hover'], false],
              7,
              4.5,
            ],
            8,
            [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              8,
              ['boolean', ['feature-state', 'hover'], false],
              7,
              6,
            ],
            11,
            8,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            t.selection,
            t.paperRaised,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            t.selection,
            ['boolean', ['feature-state', 'hover'], false],
            t.hover,
            ['coalesce', ['feature-state', 'color'], t.noData],
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            ['boolean', ['feature-state', 'hover'], false],
            2.5,
            2,
          ],
          'circle-opacity': ['case', ['boolean', ['feature-state', 'hidden'], false], 0, 0.95],
          'circle-stroke-opacity': ['case', ['boolean', ['feature-state', 'hidden'], false], 0, 1],
        },
      },
      {
        id: 'rivers-point-center',
        type: 'circle',
        source: 'rivers',
        filter: POINTS_ONLY,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5.3, 1.8, 9, 2.7],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            t.paperRaised,
            t.water,
          ],
          'circle-opacity': ['case', ['boolean', ['feature-state', 'hidden'], false], 0, 1],
        },
      },
      {
        id: 'rivers-point-hit',
        type: 'circle',
        source: 'rivers',
        filter: POINTS_ONLY,
        paint: {
          'circle-color': t.ink,
          'circle-opacity': 0,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5.3, 22, 10, 28],
        },
      },
    ],
  };

  // Optional first-party road context (B12) — present only when Session C's
  // manifest resolved. Roads sit above the ground layers and beneath ALL
  // water: context, never competition with the condition story.
  const roads = options?.roads;
  if (roads?.files?.length) {
    roads.files.forEach((entry, i) => {
      const minZoom = entry.minZoom ?? (entry.lod ? LOD_MIN_ZOOM[entry.lod] : undefined);
      style.sources[`roads-${i}`] = {
        type: 'geojson',
        data: '/atlas/' + entry.file,
        attribution: roads.attribution ?? 'Roads: US Census TIGER',
      } as GeoJSONSourceSpecification;
      // minzoom/maxzoom are TOP-LEVEL layer properties in MapLibre, never
      // layout properties (an invalid spec fails the whole style load).
      style.layers.splice(
        style.layers.findIndex((l) => l.id === 'lakes-fill'),
        0,
        {
          id: `roads-${i}`,
          type: 'line' as const,
          source: `roads-${i}`,
          ...(minZoom ? { minzoom: minZoom } : {}),
          layout: {
            'line-cap': 'round' as const,
            'line-join': 'round' as const,
          },
          paint: {
            'line-color': t.road,
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 11, 1.6],
            'line-opacity': 0.85,
          },
        },
      );
    });
  }

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
    layout: { visibility: t.reliefOpacity === 0 ? 'none' : 'visible' },
    paint: { 'raster-opacity': t.reliefOpacity, 'raster-brightness-max': t.reliefBrightness },
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
  // The topo assets themselves are clipped to the Tennessee boundary (+3 km
  // buffer) since the TOPO lane's rebuild, so the former acquisition-extent
  // mask layers are gone: what you see outside the state is simply ground.
  return style;
}

/** Back-compat alias for older imports. */
export const MAP_STYLE = atlasStyle();
export default atlasStyle;
