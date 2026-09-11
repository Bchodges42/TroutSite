import { describe, expect, it } from 'vitest';
import {
  bboxesIntersect,
  clustersForViewport,
  clustersToRelease,
  paddedBBox,
  parseNetworkManifest,
  type NetworkManifestCluster,
} from '../src/features/map/networkClusters';

/**
 * Statewide named-creek network loader (geomap/statewide-network): the pure
 * half of the on-demand cluster machinery — manifest parsing and viewport
 * intersection. The map-facing half is verified in-browser (cluster loads are
 * moveend-driven and fetch-gated).
 */

const cluster = (id: string, bounds: [number, number, number, number]): NetworkManifestCluster => ({
  id,
  file: `${id}.geojson`,
  bounds,
});

describe('parseNetworkManifest (trout/nhd-network/1)', () => {
  const valid = {
    schema: 'trout/nhd-network/1',
    attribution: 'Geometry: USGS NHD',
    clusters: [
      { id: '0513', file: '0513.geojson', bounds: [-86.12, 35.54, -85.49, 36.31], features: 2871 },
      { id: '0601', file: '0601.geojson', bounds: [-85.51, 35.53, -84.98, 36.33] },
    ],
  };

  it('accepts a contract-shaped manifest', () => {
    const manifest = parseNetworkManifest(valid);
    expect(manifest).not.toBeNull();
    expect(manifest?.clusters.map((c) => c.id)).toEqual(['0513', '0601']);
    expect(manifest?.clusters[0]?.features).toBe(2871);
    expect(manifest?.attribution).toBe('Geometry: USGS NHD');
  });

  it('accepts the shipped GEONET manifest shape (bbox field, extra keys)', () => {
    // The statewide manifest ships { id, file, units, bbox, bytes, lines, km } —
    // GEOQA caught the parser rejecting it because the mock used `bounds`.
    const shipped = {
      schema: 'trout/nhd-network/1',
      simplifyM: 20,
      clusters: [
        {
          id: '0505',
          file: 'network/0505.geojson',
          units: ['05050001'],
          bbox: [-81.73768, 36.12577, -80.12403, 37.29861],
          bytes: 1894036,
          lines: 6166,
          km: 4517.8,
        },
      ],
    };
    const manifest = parseNetworkManifest(shipped);
    expect(manifest).not.toBeNull();
    expect(manifest?.clusters[0]?.bounds).toEqual([-81.73768, 36.12577, -80.12403, 37.29861]);
  });

  it('rejects wrong or missing schema wholesale', () => {
    expect(parseNetworkManifest({ ...valid, schema: 'trout/nhd-network/2' })).toBeNull();
    const { schema: _schema, ...noSchema } = valid;
    expect(parseNetworkManifest(noSchema)).toBeNull();
  });

  it('rejects malformed clusters instead of silently dropping them', () => {
    expect(parseNetworkManifest({ ...valid, clusters: [] })).toBeNull();
    expect(parseNetworkManifest({ ...valid, clusters: 'nope' })).toBeNull();
    expect(
      parseNetworkManifest({ ...valid, clusters: [{ id: '0513', file: '0513.geojson' }] }),
    ).toBeNull();
    expect(
      parseNetworkManifest({
        ...valid,
        clusters: [{ id: '', file: '0513.geojson', bounds: [1, 2, 3, 4] }],
      }),
    ).toBeNull();
    expect(
      parseNetworkManifest({
        ...valid,
        clusters: [{ id: '0513', file: '', bounds: [1, 2, 3, 4] }],
      }),
    ).toBeNull();
    expect(
      parseNetworkManifest({
        ...valid,
        clusters: [{ id: '0513', file: '0513.geojson', bounds: [1, 2, 3, '4'] }],
      }),
    ).toBeNull();
  });

  it('rejects non-objects and null', () => {
    expect(parseNetworkManifest(null)).toBeNull();
    expect(parseNetworkManifest('manifest')).toBeNull();
    expect(parseNetworkManifest(42)).toBeNull();
  });
});

describe('viewport intersection (padded)', () => {
  const west = cluster('0513', [-86.11735, 35.54173, -85.48761, 36.31289]);
  const east = cluster('0601', [-85.50963, 35.53279, -84.98409, 36.33041]);
  const clusters = [west, east];

  it('grows each edge by a fraction of its own span', () => {
    const padded = paddedBBox([0, 0, 1, 2], 0.25);
    expect(padded).toEqual([-0.25, -0.5, 1.25, 2.5]);
  });

  it('loads only the cluster under the viewport', () => {
    // Caney Fork deep link lands in the west cluster.
    expect(clustersForViewport(clusters, [-86.05, 35.85, -85.85, 36.0])).toEqual(['0513']);
    // Upper Cumberland to the east loads its own cluster.
    expect(clustersForViewport(clusters, [-85.15, 36.2, -85.0, 36.3])).toEqual(['0601']);
  });

  it('padding pulls in the neighboring cluster at a shared border', () => {
    // East edge -85.55 stops short of 0601 (west edge -85.50963) unpadded;
    // a 0.25 pad (0.05° here) reaches past it.
    const midway = [-85.75, 35.9, -85.55, 36.1];
    expect(clustersForViewport(clusters, midway, 0)).toEqual(['0513']);
    expect(clustersForViewport(clusters, midway, 0.25)).toEqual(['0513', '0601']);
  });

  it('releases loaded clusters that left the padded viewport', () => {
    const released = clustersToRelease(clusters, ['0513', '0601'], [-85.15, 36.2, -85.0, 36.3]);
    expect(released).toEqual(['0513']);
    // A loaded id missing from the manifest is always releasable (stale bookkeeping).
    expect(clustersToRelease(clusters, ['ghost'], [-86.05, 35.85, -85.85, 36.0])).toEqual([
      'ghost',
    ]);
    // At statewide zooms the padded viewport spans both clusters: nothing releases.
    expect(clustersToRelease(clusters, ['0513', '0601'], [-90.3, 34.7, -81.6, 37.0])).toEqual([]);
  });

  it('treats touching edges as intersecting', () => {
    expect(bboxesIntersect([0, 0, 1, 1], [1, 0, 2, 1])).toBe(true);
    expect(bboxesIntersect([0, 0, 1, 1], [1.00001, 0, 2, 1])).toBe(false);
  });
});
