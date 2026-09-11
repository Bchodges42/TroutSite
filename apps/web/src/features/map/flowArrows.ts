import flowData from './flowOrientation.json';

/**
 * Flow-direction arrows (selection overlay) — renderer-side helpers.
 *
 * The DIRECTION data itself is generated offline by
 * `apps/web/scripts/build-flow-orientation.mjs` from verified topology
 * records + a confluence graph (never from vertex order, never by hand) and
 * committed as `flowOrientation.json`. This module is the only consumer:
 * it flips parts flagged `-1` so every arrow-carrier line's stored vertex
 * order runs downstream, drops parts flagged `0` (UNORIENTED — unknown-safe,
 * no arrows are drawn), and skips polygon/point waters entirely (lakes get
 * no flow arrows this iteration).
 *
 * The map renders these carrier lines with a `symbol-placement: line` layer
 * (see mapStyle.ts); TennesseeMap builds the source when the selection
 * changes and registers the runtime arrow icon (no sprite/glyphs — the style
 * deliberately ships without them).
 */

export interface FlowWaterOrientation {
  /** Per geometry part: 1 = stored order flows downstream, -1 = reversed, 0 = unoriented. */
  parts: number[];
  confidence: 'high' | 'medium' | 'low';
}

export interface FlowOrientationStats {
  lineFeatures: number;
  parts: number;
  orientedParts: number;
  high: number;
  medium: number;
  low: number;
  byMethod: Record<string, number>;
}

export interface FlowOrientationFile {
  generated: string;
  source: string;
  derivation: string;
  inputs: Record<string, unknown>;
  stats: FlowOrientationStats;
  waters: Record<string, FlowWaterOrientation>;
}

export const flowOrientation = flowData as FlowOrientationFile;

export const FLOW_ARROW_ICON = 'flow-arrow';
export const FLOW_ARROWS_SOURCE = 'flow-arrows';
export const FLOW_ARROWS_LAYER = 'rivers-flow-arrows';

/** Minimal GeoJSON typing — avoids a standalone @types/geojson dependency. */
export interface FlowLineGeometry {
  type: 'MultiLineString' | 'LineString';
  coordinates: number[][][];
}
export interface FlowFeature {
  geometry: { type: string; coordinates: unknown };
}
export interface FlowSourceFeature {
  type: 'Feature';
  geometry: { type: 'LineString'; coordinates: number[][] };
  properties: Record<string, unknown>;
}
export interface FlowSourceCollection {
  type: 'FeatureCollection';
  features: FlowSourceFeature[];
}

export const EMPTY_FLOW_SOURCE: FlowSourceCollection = { type: 'FeatureCollection', features: [] };

/** Orientation record for a water id, or null when absent/unoriented. */
export function orientationFor(id: string | null | undefined): FlowWaterOrientation | null {
  if (!id) return null;
  return flowOrientation.waters[id] ?? null;
}

/**
 * Build the arrow-carrier GeoJSON for one selected feature.
 * Returns an empty collection for unselected/unoriented/polygon waters.
 */
export function buildFlowArrowSource(
  feature: FlowFeature | null | undefined,
  orientation: FlowWaterOrientation | null | undefined,
): FlowSourceCollection {
  if (!feature || !orientation || !feature.geometry) return EMPTY_FLOW_SOURCE;
  const type = feature.geometry.type;
  if (type !== 'MultiLineString' && type !== 'LineString') return EMPTY_FLOW_SOURCE;
  const parts: number[][][] =
    type === 'MultiLineString'
      ? (feature.geometry.coordinates as number[][][])
      : [feature.geometry.coordinates as number[][]];
  const carriers: FlowSourceFeature[] = [];
  parts.forEach((part, i) => {
    const flag = orientation.parts[i] ?? 0;
    // 0 = UNORIENTED: skip — missing evidence never renders as direction.
    if (flag === 0 || !Array.isArray(part) || part.length < 2) return;
    carriers.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: flag === -1 ? [...part].reverse() : part },
      properties: { part: i, flip: flag },
    });
  });
  return { type: 'FeatureCollection', features: carriers };
}

/**
 * Runtime arrow icon (solid triangle pointing +x, the direction line-placed
 * symbols align to). A filled glyph with a heavy halo reads at corridor
 * scale far better than a stroked chevron; the halo keeps it separable from
 * any water color in both themes. Returns the payload map.addImage accepts.
 * Null when no DOM is available (tests/SSR).
 */
export function makeFlowArrowImage(
  ink: string,
  halo: string,
): { width: number; height: number; data: Uint8ClampedArray } | null {
  if (typeof document === 'undefined') return null;
  const size = 44;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Slim arrowhead sized to sit INSIDE the selected river band, not on top of
  // it: at icon-size ~0.25 the glyph renders ~8 px on a ~9 px selected
  // corridor, reading as flow inside the channel rather than a break in it.
  const triangle = () => {
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(36, 22);
    ctx.lineTo(8, 32);
    ctx.closePath();
  };
  // halo first: a thin dark rim around the paper core reads as a crisp
  // arrow at corridor scale — a fat halo just renders as a blob
  ctx.strokeStyle = halo;
  ctx.lineWidth = 5;
  triangle();
  ctx.stroke();
  ctx.fillStyle = halo;
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(11, 14.5);
  ctx.lineTo(32, 22);
  ctx.lineTo(11, 29.5);
  ctx.closePath();
  ctx.fill();
  const image = ctx.getImageData(0, 0, size, size);
  return { width: image.width, height: image.height, data: image.data };
}
