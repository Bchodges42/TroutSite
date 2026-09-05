import { describe, expect, it } from 'vitest';
import {
  distM,
  geometryAreaM2,
  geometryDepthMatches,
  lineLengthM,
  mergeFeature,
  pointInGeometry,
  regenerateIndex,
  validateStagedFeature,
  validateTopology,
} from '../scripts/integrate-verified-atlas.mjs';

/** Violations/warnings collector mirroring the script's contract. */
function collector() {
  const v = {
    list: [] as Array<{ id: string; message: string }>,
    warnings: [] as Array<{ id: string; message: string }>,
    add(id: string, message: string) {
      v.list.push({ id, message });
    },
    warn(id: string, message: string) {
      v.warnings.push({ id, message });
    },
  };
  return v;
}

const CATALOG = new Map([
  ['creek-1', { id: 'creek-1', name: 'Test Creek', waterbodyType: 'creek', regionId: 'r1', gaugeIds: [] }],
  ['lake-1', { id: 'lake-1', name: 'Test Lake', waterbodyType: 'lake', regionId: 'r1', gaugeIds: [] }],
]);

function lineFeature(overrides: Record<string, unknown> = {}, coordinates: number[][] = [
  [-86.0, 35.9],
  [-85.99, 35.9],
  [-85.98, 35.9],
]) {
  return {
    type: 'Feature',
    properties: {
      id: 'creek-1',
      name: 'Test Creek',
      waterbodyType: 'creek',
      source: ['nhd-hr'],
      approximate: false,
      labelAnchor: coordinates[Math.floor(coordinates.length / 2)],
      bounds: [-85.98, 35.9, -86.0, 35.9].slice().sort((a, b) => a - b) as number[],
      ...overrides,
    },
    geometry: { type: 'LineString', coordinates },
  };
}

function boundsFor(coords: number[][]): number[] {
  const lons = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

describe('staging geometry contract validation', () => {
  it('accepts a well-formed staged line whose metadata is complete', () => {
    const v = collector();
    const f = lineFeature({ bounds: boundsFor([[-86.0, 35.9], [-85.98, 35.9]]) });
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list).toEqual([]);
  });

  it('rejects missing required properties', () => {
    const v = collector();
    const f = lineFeature();
    delete (f.properties as Record<string, unknown>).approximate;
    delete (f.properties as Record<string, unknown>).labelAnchor;
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    const messages = v.list.map((x) => x.message);
    expect(messages.some((m) => m.includes('"approximate"'))).toBe(true);
    expect(messages.some((m) => m.includes('"labelAnchor"'))).toBe(true);
  });

  it('rejects geometry without a matching catalog record', () => {
    const v = collector();
    const f = lineFeature({ id: 'not-in-catalog' });
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('no matching catalog record'))).toBe(true);
  });

  it('rejects a waterbodyType that contradicts the catalog record', () => {
    const v = collector();
    const f = lineFeature({ waterbodyType: 'lake' });
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('does not match catalog'))).toBe(true);
  });

  it('detects swapped lon/lat order from Tennessee magnitudes alone', () => {
    const v = collector();
    const coords = [
      [35.9, -86.0],
      [35.895, -85.99],
    ];
    const f = lineFeature({ bounds: boundsFor(coords), labelAnchor: coords[0] }, coords);
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('SWAPPED'))).toBe(true);
  });

  it('rejects bounds that do not cover every coordinate', () => {
    const v = collector();
    const f = lineFeature({ bounds: [-86.0, 35.9, -85.995, 35.9] }); // excludes the last vertex
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('bounds do not cover'))).toBe(true);
  });

  it('rejects a label anchor outside its own polygon', () => {
    const v = collector();
    const ring = [
      [-86.1, 35.8],
      [-86.0, 35.8],
      [-86.0, 35.9],
      [-86.1, 35.9],
      [-86.1, 35.8],
    ];
    const f = {
      type: 'Feature',
      properties: {
        id: 'lake-1',
        name: 'Test Lake',
        waterbodyType: 'lake',
        source: ['nhd-hr'],
        approximate: false,
        labelAnchor: [-85.5, 36.3], // far outside the polygon
        bounds: [-86.1, 35.8, -86.0, 35.9],
      },
      geometry: { type: 'Polygon', coordinates: [ring] },
    };
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('labelAnchor'))).toBe(true);
  });

  it('flags an area far below the declared source area (unexpected loss)', () => {
    const v = collector();
    const ring = [
      [-86.1, 35.8],
      [-86.0, 35.8],
      [-86.0, 35.9],
      [-86.1, 35.9],
      [-86.1, 35.8],
    ];
    const realArea = geometryAreaM2({ type: 'Polygon', coordinates: [ring] });
    const f = {
      type: 'Feature',
      properties: {
        id: 'lake-1',
        name: 'Test Lake',
        waterbodyType: 'lake',
        source: ['nhd-hr'],
        approximate: false,
        labelAnchor: [-86.05, 35.85],
        bounds: [-86.1, 35.8, -86.0, 35.9],
        sourceAreaM2: realArea * 4, // staged claims 4x more area than delivered
      },
      geometry: { type: 'Polygon', coordinates: [ring] },
    };
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('sourceAreaM2'))).toBe(true);
  });

  it('rejects an NHD-sourced feature whose Permanent_Identifier is malformed', () => {
    const v = collector();
    const f = lineFeature({ permanentId: 'not-a-guid' });
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('Permanent_Identifier'))).toBe(true);
  });

  it('warns when an NHD source carries no authoritative identifier at all', () => {
    const v = collector();
    validateStagedFeature(lineFeature(), CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.warnings.some((x) => x.message.includes('no permanentId'))).toBe(true);
  });

  it('rejects coordinates whose nesting does not match the declared geometry type', () => {
    // Seen in real staging output: a Polygon-shaped coordinate array labeled
    // MultiPolygon. The validator must reject it, never read rings as positions.
    const v = collector();
    const f = {
      type: 'Feature',
      properties: {
        id: 'lake-1',
        name: 'Test Lake',
        waterbodyType: 'lake',
        source: ['nhd-hr'],
        approximate: false,
        labelAnchor: [-86.05, 35.85],
        bounds: [-86.1, 35.8, -86.0, 35.9],
      },
      geometry: {
        // Polygon SHAPE, MultiPolygon LABEL.
        type: 'MultiPolygon',
        coordinates: [[
          [-86.1, 35.8],
          [-86.0, 35.8],
          [-86.0, 35.9],
          [-86.1, 35.9],
          [-86.1, 35.8],
        ]],
      },
    };
    expect(geometryDepthMatches('MultiPolygon', f.geometry.coordinates)).toBe(false);
    validateStagedFeature(f, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('nesting depth'))).toBe(true);
    // And a correctly nested MultiPolygon passes the depth gate.
    const wellFormed = {
      ...f,
      geometry: { type: 'MultiPolygon', coordinates: [f.geometry.coordinates as unknown as number[][]] },
    };
    const v2 = collector();
    validateStagedFeature(wellFormed, CATALOG, { index: 0, canonicalById: new Map() }, v2);
    expect(v2.list.filter((x) => x.message.includes('nesting depth'))).toEqual([]);
  });

  it('rejects sub-floor geometry (a sliver polygon / fragment line)', () => {
    const v = collector();
    const tiny = {
      type: 'Feature',
      properties: {
        id: 'lake-1',
        name: 'Test Lake',
        waterbodyType: 'lake',
        source: ['nhd-hr'],
        approximate: false,
        labelAnchor: [-86.0, 35.8],
        bounds: [-86.0, 35.8, -85.9999, 35.8001],
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-86.0, 35.8],
          [-85.9999, 35.8],
          [-85.9999, 35.8001],
          [-86.0, 35.8001],
          [-86.0, 35.8],
        ]],
      },
    };
    validateStagedFeature(tiny, CATALOG, { index: 0, canonicalById: new Map() }, v);
    expect(v.list.some((x) => x.message.includes('waterbody floor'))).toBe(true);
  });
});

describe('staging topology validation', () => {
  it('reports an unexplained line endpoint that touches nothing', () => {
    const v = collector();
    // Both endpoints float in open ground: no other reaches, no lakes, no TN boundary nearby.
    const staged = [{ feature: lineFeature({ allowOpenEnds: false }) }];
    validateTopology(staged, [], [], null, v);
    expect(v.list.filter((x) => x.message.includes('unexplained line endpoint')).length).toBe(2);
  });

  it('accepts an open endpoint when the feature documents allowOpenEnds', () => {
    const v = collector();
    const staged = [{ feature: lineFeature({ allowOpenEnds: true }) }];
    validateTopology(staged, [], [], null, v);
    expect(v.list.filter((x) => x.message.includes('unexplained line endpoint')).length).toBe(0);
  });

  it('explains an endpoint that meets another reach or a lake edge', () => {
    const v = collector();
    // The lake's north edge runs along y=35.905 between x=-86.001 and -86.0005.
    const lakeEdge: number[] = [-86.00075, 35.905]; // ~22 m from a ring vertex
    const lake = {
      type: 'Feature',
      properties: { id: 'lake-1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-86.001, 35.895],
          [-86.0005, 35.895],
          [-86.0005, 35.905],
          [-86.001, 35.905],
          [-86.001, 35.895],
        ]],
      },
    };
    // Two reaches leaving the lake's dam corner: their starts coincide (junction)
    // and sit on the lake edge; their far ends are documented open ends.
    const a = lineFeature(
      { allowOpenEnds: true, bounds: boundsFor([lakeEdge, [-85.99, 35.9]]) },
      [lakeEdge, [-85.99, 35.9]],
    );
    const b = lineFeature(
      { id: 'tributary', name: 'Trib', allowOpenEnds: true, bounds: boundsFor([lakeEdge, [-86.0, 35.8]]) },
      [lakeEdge, [-86.0, 35.8]],
    );
    validateTopology([{ feature: a }, { feature: b }], [], [lake], null, v);
    expect(v.list.filter((x) => x.message.includes('unexplained line endpoint')).length).toBe(0);
    expect(v.warnings.filter((x) => x.message.includes('allowOpenEnds')).length).toBe(2);
  });

  it('fails a reach that crosses a lake interior instead of ending at its edge', () => {
    const v = collector();
    const lake = {
      type: 'Feature',
      properties: { id: 'lake-1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-86.0, 35.895],
          [-85.98, 35.895],
          [-85.98, 35.905],
          [-86.0, 35.905],
          [-86.0, 35.895],
        ]],
      },
    };
    // This line starts well before the lake and ends well after it — a crossing.
    const through: number[][] = [
      [-86.01, 35.9],
      [-86.005, 35.9],
      [-85.99, 35.9],
      [-85.975, 35.9],
      [-85.97, 35.9],
    ];
    const staged = [{ feature: lineFeature({ bounds: boundsFor(through) }, through) }];
    validateTopology(staged, [], [lake], null, v);
    expect(v.list.some((x) => x.message.includes('crosses the interior'))).toBe(true);
  });

  it('allows a reach that terminates at the lake edge (tailwater headwater)', () => {
    const v = collector();
    const lake = {
      type: 'Feature',
      properties: { id: 'lake-1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-86.0, 35.895],
          [-85.99, 35.895],
          [-85.99, 35.905],
          [-86.0, 35.905],
          [-86.0, 35.895],
        ]],
      },
    };
    // Starts inside the lake dam pool and flows out — a tailwater reach.
    const tailwater: number[][] = [
      [-85.995, 35.9],
      [-85.98, 35.9],
      [-85.97, 35.9],
    ];
    const staged = [{ feature: lineFeature({ bounds: boundsFor(tailwater) }, tailwater) }];
    validateTopology(staged, [], [lake], null, v);
    expect(v.list.some((x) => x.message.includes('crosses the interior'))).toBe(false);
  });

  it('enforces dam-to-tailwater alignment when upstreamLakeId and damAnchor are declared', () => {
    const v = collector();
    const lake = {
      type: 'Feature',
      properties: { id: 'lake-1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-86.0, 35.895],
          [-85.99, 35.895],
          [-85.99, 35.905],
          [-86.0, 35.905],
          [-86.0, 35.895],
        ]],
      },
    };
    const tailwater: number[][] = [
      [-85.9, 35.5], // starts far from the declared dam anchor
      [-85.89, 35.5],
    ];
    const staged = [{
      feature: lineFeature(
        { bounds: boundsFor(tailwater), upstreamLakeId: 'lake-1', damAnchor: [-85.99, 35.9], allowOpenEnds: true },
        tailwater,
      ),
    }];
    validateTopology(staged, [], [lake], null, v);
    expect(v.list.some((x) => x.message.includes('dam-to-tailwater alignment failed'))).toBe(true);
  });

  it('rejects an upstreamLakeId that resolves to nothing', () => {
    const v = collector();
    const staged = [{
      feature: lineFeature({ upstreamLakeId: 'ghost-lake', damAnchor: [-86.0, 35.9], allowOpenEnds: true }),
    }];
    validateTopology(staged, [], [], null, v);
    expect(v.list.some((x) => x.message.includes('does not resolve'))).toBe(true);
  });
});

describe('deterministic merge', () => {
  it('replaces by stable id and never appends a second feature with the same id', () => {
    const canonical = [lineFeature({ name: 'Catalog Name' })];
    const merged = new Map(canonical.filter((f) => f.properties?.id).map((f) => [f.properties.id, f]));
    const stagedFeature = lineFeature({ name: 'Staged Name' });
    const replaced = mergeFeature(stagedFeature, CATALOG);
    merged.set(replaced.properties.id, replaced);
    const out = [...merged.values()];
    expect(out.length).toBe(1);
    expect(out[0].properties.name).toBe('Test Creek'); // catalog identity wins
    expect(out[0].properties.coordinateOrder).toBe('longitude,latitude');
  });

  it('regenerates the map index with stable sort and anchor/bounds derivation', () => {
    const features = [
      lineFeature({ id: 'creek-1' }),
      lineFeature({ id: 'another-creek', name: 'Another' }),
    ];
    features[0].properties.id = 'creek-1';
    features[1].properties.id = 'another-creek';
    const index = regenerateIndex(features);
    expect(index.map((r) => r.id)).toEqual(['another-creek', 'creek-1']);
    for (const entry of index) {
      expect(entry.anchor.length).toBe(2);
      expect(entry.bounds.length).toBe(4);
    }
  });
});

describe('geometry primitives', () => {
  it('measures distance and area at Tennessee scales', () => {
    // One degree of longitude at 36°N ≈ 90 km.
    expect(distM([-86.0, 35.9], [-85.0, 35.9])).toBeGreaterThan(85_000);
    expect(distM([-86.0, 35.9], [-86.0, 35.9])).toBe(0);
    const ring = [
      [-86.1, 35.8],
      [-86.0, 35.8],
      [-86.0, 35.9],
      [-86.1, 35.9],
      [-86.1, 35.8],
    ];
    const area = geometryAreaM2({ type: 'Polygon', coordinates: [ring] });
    // ~0.01° × 0.1° box ≈ 90 km².
    expect(area).toBeGreaterThan(70_000_000);
    expect(area).toBeLessThan(110_000_000);
    expect(lineLengthM([[[-86.0, 35.9], [-85.99, 35.9]]])).toBeGreaterThan(800);
    expect(pointInGeometry([-86.05, 35.85], { type: 'Polygon', coordinates: [ring] })).toBe(true);
    expect(pointInGeometry([-85.5, 36.3], { type: 'Polygon', coordinates: [ring] })).toBe(false);
  });
});
