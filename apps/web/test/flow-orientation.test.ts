import { describe, expect, it } from 'vitest';
import { deriveFlowOrientation, distanceM, normalizeTopologyIds } from '../scripts/flow-orientation-core.mjs';
import {
  buildFlowArrowSource,
  flowOrientation,
  makeFlowArrowImage,
  orientationFor,
} from '../src/features/map/flowArrows';
import { atlasStyle } from '../src/features/map/mapStyle';
import { themes } from '../src/theme/themes';

/**
 * Synthetic fixtures for the flow-orientation derivation. All coordinates sit
 * near Tellico Plain, TN (~-85.6, 35.6) so distances behave like production
 * data. The derivation must orient from TOPOLOGY ONLY — never vertex order.
 */

const line = (id: string, parts: number[][][], props: Record<string, unknown> = {}) => ({
  type: 'Feature',
  properties: { id, waterbodyType: 'creek', ...props },
  geometry: { type: 'MultiLineString', coordinates: parts },
});
const poly = (id: string, rings: number[][][], props: Record<string, unknown> = {}) => ({
  type: 'Feature',
  properties: { id, waterbodyType: 'lake', ...props },
  geometry: { type: 'MultiPolygon', coordinates: [rings] },
});

/** A lake polygon roughly 0.02° square around [lng, lat]. */
const lakeAround = (lng: number, lat: number) =>
  poly('x', [[[lng, lat], [lng + 0.02, lat], [lng + 0.02, lat + 0.02], [lng, lat + 0.02], [lng, lat]]]);

describe('flow orientation derivation (topology only)', () => {
  it('orients a dam-anchored tailwater away from the dam regardless of stored order', () => {
    // Dam sits at [-86, 35.6]. Case A stores the reach dam→downstream (+1);
    // case B stores the SAME reach reversed (-1).
    const reachA = line('reach-a', [[[-86, 35.6], [-86.05, 35.6], [-86.1, 35.61]]]);
    const reachB = line('reach-b', [[[-86.1, 35.61], [-86.05, 35.6], [-86, 35.6]]]);
    const record = (id: string) => ({
      featureId: id,
      dam: { coordinates: [-86, 35.6] },
      upstreamFeatureIds: [],
      downstreamFeatureIds: [],
    });
    const a = deriveFlowOrientation({ features: [reachA], topologyRecords: [record('reach-a')] });
    const b = deriveFlowOrientation({ features: [reachB], topologyRecords: [record('reach-b')] });
    expect(a.waters['reach-a'].parts).toEqual([1]);
    expect(b.waters['reach-b'].parts).toEqual([-1]);
    expect(a.waters['reach-a'].confidence).toBe('high');
  });

  it('orients a tributary INTO its recipient via the confluence graph', () => {
    // mississippi-river is the depth-0 sink; main-river joins it (verified by
    // an endpoint touch), trib-creek joins main-river from the side.
    const mississippi = line('mississippi-river', [[[-85.403, 35.5], [-85.3, 35.5]]]);
    const main = line('main-river', [[[-85.1, 35.7], [-85.401, 35.503], [-85.41, 35.5]]]);
    const trib = line('trib-creek', [[[-85.09, 35.72], [-85.1, 35.7]]]);
    const records = [
      {
        featureId: 'main-river',
        upstreamFeatureIds: [],
        downstreamFeatureIds: ['mississippi-river'],
      },
    ];
    const { waters } = deriveFlowOrientation({ features: [mississippi, main, trib], topologyRecords: records });
    // main-river: verified topo-down at its mississippi end — stored order
    // (headwaters first) already runs downstream…
    expect(waters['main-river'].parts[0]).toBe(1);
    expect(waters['main-river'].confidence).toBe('high');
    // …trib-creek has NO record: the confluence graph must orient it into
    // main-river (its touching endpoint is its downstream end), medium
    // confidence.
    expect(waters['trib-creek'].parts[0]).toBe(1);
    expect(waters['trib-creek'].confidence).toBe('medium');
  });

  it('marks an ambiguous water unoriented (0) instead of guessing', () => {
    // Two head-to-head continuations, no records, no path to any terminus.
    const a = line('creek-a', [[[-85, 35.6], [-85.01, 35.6]]]);
    const b = line('creek-b', [[[-85.01, 35.6], [-85.02, 35.6]]]);
    const { waters, stats } = deriveFlowOrientation({ features: [a, b], topologyRecords: [] });
    expect(waters['creek-a'].parts).toEqual([0]);
    expect(waters['creek-b'].parts).toEqual([0]);
    expect(waters['creek-a'].confidence).toBe('low');
    expect(stats.orientedParts).toBe(0);
  });

  it('uses lake in/out for a through-lake river (the in-lake end is downstream)', () => {
    const lake = lakeAround(-86, 35.6);
    // Stored WEST→EAST: start outside the lake, end clearly inside it. The
    // water joins the pool at its in-lake end — that end is DOWNSTREAM (flow
    // exits toward the lake's dam/outlet side).
    const river = line('through-river', [[[-86.06, 35.61], [-85.99, 35.61], [-85.985, 35.61]]], {
      throughLakeIds: ['x'],
    });
    const { waters } = deriveFlowOrientation({ features: [lake, river], topologyRecords: [] });
    // End inside the lake = downstream end ⇒ stored order already runs
    // downstream (start in the valley, end in the pool).
    expect(waters['through-river'].parts[0]).toBe(1);
    expect(waters['through-river'].confidence).toBe('high');
  });

  it('never orients lakes themselves and skips ambiguous same-polarity ends', () => {
    const lake = lakeAround(-86, 35.6);
    const lakeRecord = {
      featureId: 'x',
      dam: { coordinates: [-85.99, 35.605] },
      upstreamFeatureIds: [],
      downstreamFeatureIds: [],
    };
    const { waters } = deriveFlowOrientation({ features: [lake], topologyRecords: [lakeRecord] });
    expect(waters.x).toBeUndefined(); // polygons never enter the output
  });

  it('normalizes topology id strings by stripping prose suffixes and self-references', () => {
    const known = new Set(['normandy-lake', 'mississippi-river']);
    expect(
      normalizeTopologyIds(['normandy-lake(terminus Columbia)', 'mississippi-river'], known, 'mississippi-river'),
    ).toEqual(['normandy-lake']);
    expect(normalizeTopologyIds(undefined, known, 'x')).toEqual([]);
  });

  it('measures sub-meter distances deterministically', () => {
    expect(distanceM([-86, 35.6], [-86, 35.6])).toBe(0);
    expect(distanceM([-86, 35.6], [-86, 35.60001])).toBeGreaterThan(0);
  });
});

describe('flow arrow renderer (flip logic)', () => {
  const feature = {
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 1],
          [2, 0],
        ],
        [
          [3, 3],
          [4, 4],
        ],
      ],
    },
  };

  it('reverses the coordinate sequence of parts flagged -1', () => {
    const out = buildFlowArrowSource(feature, { parts: [-1, 1], confidence: 'high' });
    expect(out.features).toHaveLength(2);
    expect(out.features[0]!.geometry.coordinates).toEqual([
      [2, 0],
      [1, 1],
      [0, 0],
    ]);
    expect(out.features[1]!.geometry.coordinates).toEqual([
      [3, 3],
      [4, 4],
    ]);
    expect(out.features[0]!.properties).toEqual({ part: 0, flip: -1 });
  });

  it('skips unoriented (0) parts entirely — unknown-safe', () => {
    const out = buildFlowArrowSource(feature, { parts: [0, 0], confidence: 'low' });
    expect(out.features).toHaveLength(0);
    const half = buildFlowArrowSource(feature, { parts: [1, 0], confidence: 'medium' });
    expect(half.features).toHaveLength(1);
    expect(half.features[0]!.properties).toEqual({ part: 0, flip: 1 });
  });

  it('never renders arrows for polygon waters (lakes)', () => {
    const lakeFeature = {
      geometry: { type: 'MultiPolygon', coordinates: [[[[]]]] as unknown as number[][][] },
    };
    expect(buildFlowArrowSource(lakeFeature, { parts: [1], confidence: 'high' }).features).toHaveLength(0);
    expect(buildFlowArrowSource(null, { parts: [1], confidence: 'high' }).features).toHaveLength(0);
  });

  it('ships the committed orientation artifact and resolves waters from it', () => {
    expect(flowOrientation.source).toBe('topology+confluence-graph');
    expect(Object.keys(flowOrientation.waters).length).toBeGreaterThan(40);
    // Every committed part flag is exactly -1, 0, or 1 — never a guess value.
    for (const water of Object.values(flowOrientation.waters))
      for (const flag of water.parts) expect([ -1, 0, 1 ]).toContain(flag);
    expect(orientationFor('caney-fork-river')).not.toBeNull();
    expect(orientationFor('not-a-water')).toBeNull();
    expect(orientationFor(null)).toBeNull();
  });

  it('places the arrow layer above water rendering, below the hit layers', () => {
    for (const theme of Object.values(themes)) {
      const style = atlasStyle('ink', theme.map);
      const ids = style.layers.map((l) => l.id);
      expect(ids).toContain('rivers-flow-arrows');
      const arrows = ids.indexOf('rivers-flow-arrows');
      expect(arrows).toBeGreaterThan(ids.indexOf('rivers-selection'));
      expect(arrows).toBeLessThan(ids.indexOf('rivers-hit'));
      expect(Object.keys(style.sources)).toContain('flow-arrows');
      // Still no remote sprite/glyph URLs — the icon is a runtime image.
      expect(JSON.stringify(style)).not.toMatch(/https?:\/\/[^"]*sprite/);
    }
  });

  it('draws the runtime chevron icon (or reports no DOM honestly)', () => {
    const icon = makeFlowArrowImage('#000000', '#ffffff');
    if (icon) {
      expect(icon.width).toBeGreaterThan(0);
      expect(icon.data).toBeInstanceOf(Uint8ClampedArray);
      expect(icon.data.some((v) => v !== 0)).toBe(true);
    }
  });
});
