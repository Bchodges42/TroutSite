import { describe, expect, it } from 'vitest';
import { auditRivers, type QaDefect } from '../src/features/map/qa/audit';

/**
 * Synthetic fixtures for the geometry QA audit. Coordinates sit around
 * (-86, 35.6). 0.001° ≈ 89–111 m, so the helpers below build features with
 * explicit meter-scale intent.
 */

type LngLat = [number, number];

const line = (
  id: string,
  parts: LngLat[][],
  props: Record<string, unknown> = {},
) => ({
  type: 'Feature',
  properties: { id, name: id, waterbodyType: 'creek', ...props },
  geometry: { type: 'MultiLineString', coordinates: parts },
});

/** lng/lat offsets converted to degrees at ~35.6°N. */
const km = (m: number) => m / 111320; // latitude degrees
const kmLon = (m: number) => m / (111320 * Math.cos(35.6 * (Math.PI / 180)));

const defectKinds = (report: { defects: QaDefect[] }) => report.defects.map((d) => d.kind);
const byKind = (report: { defects: QaDefect[] }, kind: QaDefect['kind']) =>
  report.defects.filter((d) => d.kind === kind);

describe('qa audit — dangling ends', () => {
  it('flags a lonely endpoint on a closed-end water', () => {
    // Two parts that DO chain, but the far end stops in the middle of nowhere.
    const river = line('lonely-river', [
      [
        [-86, 35.6],
        [-86 + kmLon(2000), 35.6],
      ],
    ]);
    const report = auditRivers({ features: [river] });
    expect(byKind(report, 'dangling-end')).toHaveLength(2); // both ends dangle
  });

  it('does not flag endpoints of allowOpenEnds waters', () => {
    const river = line('open-river', [
      [
        [-86, 35.6],
        [-86 + kmLon(2000), 35.6],
      ],
    ], { allowOpenEnds: true });
    const report = auditRivers({ features: [river] });
    expect(byKind(report, 'dangling-end')).toHaveLength(0);
  });

  it('does not flag endpoints that touch another water within the snap', () => {
    // open-ended main stem (its own ends are honest open ends) + a tributary
    // whose mouth lands ON the recipient's interior vertex
    const recipient = line('main', [
      [
        [-86, 35.6],
        [-85.9, 35.6],
      ],
    ], { allowOpenEnds: true });
    const tributary = line('trib', [
      [
        [-86.01, 35.61],
        [-86.005, 35.604],
        [-86, 35.6],
      ],
    ]);
    const report = auditRivers({ features: [recipient, tributary] });
    const dangling = byKind(report, 'dangling-end').map((d) => d.point.join());
    // the tributary's mouth end is CONNECTED — never flagged…
    expect(dangling).not.toContain('-86,35.6');
    // …while its headwater end still is (the audit discriminates).
    expect(dangling).toContain('-86.01,35.61');
  });

  it('does not flag endpoints inside a lake polygon', () => {
    const lake = {
      type: 'Feature',
      properties: { id: 'lake', waterbodyType: 'lake' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-86.02, 35.59],
              [-85.98, 35.59],
              [-85.98, 35.62],
              [-86.02, 35.62],
              [-86.02, 35.59],
            ],
          ],
        ],
      },
    };
    // ends mid-lake: dangling in line terms, but the pool provides continuity
    const river = line('inflow', [
      [
        [-86.06, 35.6],
        [-86.0, 35.6],
      ],
    ], { allowOpenEnds: false });
    const report = auditRivers({ features: [lake, river] });
    const dangling = byKind(report, 'dangling-end').map((d) => d.point.join());
    // the in-lake end is not a defect…
    expect(dangling).not.toContain('-86,35.6');
    // …the headwater end still is.
    expect(dangling).toContain('-86.06,35.6');
  });
});

describe('qa audit — isolated fragments', () => {
  it('flags a feature chunk disconnected from its main corridor', () => {
    // main corridor 5 km + an orphan fragment 10 km away
    const river = line('fractured', [
      [
        [-86, 35.6],
        [-86 + kmLon(5000), 35.6],
      ],
      [
        [-86 + kmLon(10000), 35.6],
        [-86 + kmLon(15000), 35.6],
      ],
    ]);
    const report = auditRivers({ features: [river] });
    const fragments = byKind(report, 'isolated-fragment');
    expect(fragments).toHaveLength(1);
    expect(fragments[0]!.featureId).toBe('fractured');
    expect(fragments[0]!.line).toBeDefined();
  });

  it('chains parts joined within the snap and reports only the true ends', () => {
    // 3 parts chaining end-to-end (touching within ~5 m) → ONE component;
    // only the chain's first/last vertices are dangling ends.
    const A: LngLat = [-86, 35.6];
    const B: LngLat = [-86 + kmLon(3000), 35.6];
    const C: LngLat = [-86 + kmLon(6000), 35.6];
    const D: LngLat = [-86 + kmLon(9000), 35.6];
    const river = line('chained', [[A, B], [B, C], [C, D]]);
    const report = auditRivers({ features: [river] });
    expect(byKind(report, 'isolated-fragment')).toHaveLength(0);
    const dangling = byKind(report, 'dangling-end').map((d) => d.point.join());
    expect(dangling).toEqual([A.join(), D.join()]);
  });
});

describe('qa audit — self-crossings', () => {
  it('flags a bowtie (figure-eight) part', () => {
    // classic crossing polyline: segment 3 crosses segment 1 mid-segment
    const bowtie = line('bowtie', [
      [
        [-86, 35.6],
        [-86 + kmLon(10000), 35.6 + km(10000)],
        [-86 + kmLon(10000), 35.6],
        [-86, 35.6 + km(10000)],
      ],
    ]);
    const report = auditRivers({ features: [bowtie] });
    expect(byKind(report, 'self-crossing')).toHaveLength(1);
  });

  it('does not flag a clean river or legit junctions', () => {
    const clean = line('clean', [
      [
        [-86, 35.6],
        [-86 + kmLon(2000), 35.6],
      ],
    ]);
    // a Y fork: two parts sharing an endpoint
    const fork = line('fork', [
      [
        [-86, 35.6],
        [-86 + kmLon(1000), 35.6],
      ],
      [
        [-86 + kmLon(1000), 35.6],
        [-86 + kmLon(1000), 35.6 + km(1000)],
      ],
    ]);
    const report = auditRivers({ features: [clean, fork] });
    expect(byKind(report, 'self-crossing')).toHaveLength(0);
  });
});

describe('qa audit — duplicate corridors', () => {
  it('flags a ≥2 km sustained overlap at ≤150 m offset', () => {
    const a = line('river-a', [
      [
        [-86, 35.6],
        [-86 + kmLon(3000), 35.6],
      ],
    ]);
    // ~100 m north of river-a, same 3 km span
    const b = line('river-b', [
      [
        [-86, 35.6 + km(100)],
        [-86 + kmLon(3000), 35.6 + km(100)],
      ],
    ]);
    const report = auditRivers({ features: [a, b] });
    const dups = byKind(report, 'duplicate-corridor');
    expect(dups).toHaveLength(1);
    expect(dups[0]!.second).toBeDefined();
    expect(dups[0]!.detail).toContain('km sustained');
  });

  it('reports a clean open-ended river with 0 defects', () => {
    // open ends are honest (river continues beyond the catalog), geometry is
    // simple — nothing to report.
    const clean = line('clean-river', [
      [
        [-86, 35.6],
        [-86 + kmLon(3000), 35.6],
      ],
    ], { allowOpenEnds: true });
    const report = auditRivers({ features: [clean] });
    expect(report.defects).toHaveLength(0);
  });

  it('does not flag corridors separated by more than the offset', () => {
    const a = line('river-a', [
      [
        [-86, 35.6],
        [-86 + kmLon(3000), 35.6],
      ],
    ]);
    const b = line('river-b', [
      [
        [-86, 35.6 + km(500)],
        [-86 + kmLon(3000), 35.6 + km(500)],
      ],
    ]);
    const report = auditRivers({ features: [a, b] });
    expect(byKind(report, 'duplicate-corridor')).toHaveLength(0);
  });

  it('does not flag a short parallel overlap below the 2 km threshold', () => {
    const a = line('river-a', [
      [
        [-86, 35.6],
        [-86 + kmLon(3000), 35.6],
      ],
    ]);
    const b = line('river-b', [
      [
        [-86, 35.6 + km(100)],
        [-86 + kmLon(1000), 35.6 + km(100)],
      ],
    ]);
    const report = auditRivers({ features: [a, b] });
    expect(byKind(report, 'duplicate-corridor')).toHaveLength(0);
  });
});

describe('qa audit — report shape', () => {
  it('carries regionId grouping data and deterministic ordering', () => {
    const a = line('alpha', [
      [
        [-86, 35.6],
        [-86 + kmLon(2000), 35.6],
      ],
    ], { regionId: 'tn-middle-duck-elk' });
    const b = line('beta', [
      [
        [-85.8, 35.6],
        [-85.8 + kmLon(2000), 35.6],
      ],
    ], { regionId: 'tn-middle-duck-elk' });
    const report = auditRivers({ features: [a, b] });
    expect(report.defects.length).toBeGreaterThan(0);
    for (const d of report.defects) {
      expect(d.regionId).toBe('tn-middle-duck-elk');
      expect(d.featureName).toBeTruthy();
    }
    const ids = report.defects.map((d) => d.featureId);
    expect([...ids].sort()).toEqual(ids);
    expect(report.stats.lineFeatureCount).toBe(2);
    expect(report.stats.truncated).toBe(false);
  });

  it('handles a completely empty collection', () => {
    const report = auditRivers({ features: [] });
    expect(report.defects).toHaveLength(0);
    expect(defectKinds(report)).toHaveLength(0);
    expect(report.stats.featureCount).toBe(0);
  });
});
