import { atlas } from './mapTokens';
import type { StyleSpecification } from 'maplibre-gl';

/**
 * Self-hosted Field Notes Atlas StyleSpec.
 * - No remote tiles, no Mapbox token, no external requests of any kind.
 * - Sources are local GeoJSON under /atlas/*. All data stays on-device / same-origin.
 * - NOTE: no `sprite` and no `glyphs` URLs are declared. The server's SPA fallback
 *   answers unknown paths with index.html (HTTP 200), so pointing MapLibre at a
 *   sprite/glyph path that has no real file makes it parse HTML as JSON/PBF and
 *   fail the whole style load (blank map). Only re-add those keys together with
 *   real local files AND server routes that 404 instead of falling back.
 *   (No layer below needs them: there are no icon or symbol layers yet. Stream
 *   labels are a documented next step — generate local glyphs first.)
 * - Layers bottom→top: background (paper #F2E9D5), TN fill, subtle contour lines,
 *   river casing (ink #24352D), river interior (condition color via feature property `color`),
 *   selection highlight, hatch-mode halo, wide transparent hit line.
 */
export function atlasStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'Field Notes Atlas',
    sources: {
      'tn-boundary': { type: 'geojson', data: '/atlas/tn-boundary.geojson' },
      rivers: { type: 'geojson', data: '/atlas/rivers.geojson', promoteId: 'id' as unknown as string },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': atlas.paper },
      },
      {
        id: 'tn-fill',
        type: 'fill' as const,
        source: 'tn-boundary',
        paint: { 'fill-color': atlas.paperRaised, 'fill-opacity': 1 },
      },
      // subtle contour / state border — hairline on paper
      {
        id: 'tn-contour',
        type: 'line' as const,
        source: 'tn-boundary',
        paint: {
          'line-color': atlas.contour,
          'line-width': 0.85,
          'line-opacity': 0.45,
          'line-dasharray': [3, 3],
        },
      },
      {
        id: 'tn-outline',
        type: 'line' as const,
        source: 'tn-boundary',
        paint: { 'line-color': atlas.hairline, 'line-width': 1.4, 'line-opacity': 1 },
      },
      // Rivers — casing (ink #24352D) renders beneath interior so bends read clearly
      {
        id: 'rivers-casing',
        type: 'line' as const,
        source: 'rivers',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': atlas.ink,
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
            ['boolean', ['feature-state', 'selected'], false],
            1,
            ['boolean', ['feature-state', 'hover'], false],
            0.9,
            0.62,
          ],
        },
      },
      // Rivers — interior (condition color via feature property `color`)
      {
        id: 'rivers-interior',
        type: 'line' as const,
        source: 'rivers',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], atlas.noData],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.4,
            ['boolean', ['feature-state', 'hover'], false],
            2.9,
            2.05,
          ],
          'line-opacity': 1,
        },
      },
      // Selection highlight — warm outline beyond casing when selected
      {
        id: 'rivers-selection',
        type: 'line' as const,
        source: 'rivers',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#F59E0B',
          'line-width': 8.5,
          'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.9, 0],
        },
      },
      // Hatch-mode halo — sulphur glow when hatchActive feature-state is true
      {
        id: 'rivers-hatch-halo',
        type: 'line' as const,
        source: 'rivers',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'hatchColor'], atlas.sulphur],
          'line-width': 9,
          'line-opacity': ['case', ['boolean', ['feature-state', 'hatchActive'], false], 0.42, 0],
          'line-blur': 1.1,
        },
      },
      // Wide transparent hit area — last so it receives pointer events
      {
        id: 'rivers-hit',
        type: 'line' as const,
        source: 'rivers',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 18 },
      },
    ],
  };
}

/** Back-compat alias for older imports. */
export const MAP_STYLE = atlasStyle();
export default atlasStyle;
