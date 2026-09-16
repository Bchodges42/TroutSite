import type { Map as MlMap } from 'maplibre-gl';

/**
 * Statewide named-creek network — on-demand per-cluster loading.
 *
 * Replaces the single-region PROOF (GEOVALID-2) file with the zoom-gated,
 * viewport-driven loader SESSION A's data contract calls for: a manifest at
 * /atlas/network/manifest.json listing clusters (schema trout/nhd-network/1;
 * cluster ids are 4-digit HU8 prefixes, possibly suffixed a/b when split),
 * each pointing at a network/<clusterId>.geojson FeatureCollection.
 *
 * Rules (reviewable constants below):
 *  - On moveend at zoom >= NETWORK_LOAD_ZOOM, every manifest cluster whose
 *    (padded) bbox intersects the viewport is fetched ONCE per page session
 *    and added as source `network-<id>` + layer `network-minor-<id>` with the
 *    proof layer's exact paint, inserted before 'rivers-casing' so catalog
 *    rivers keep painting on top.
 *  - At zoom >= NETWORK_RELEASE_ZOOM, loaded clusters whose padded bbox no
 *    longer intersects the viewport are removed (source + layer) to bound
 *    renderer memory. Below that zoom the viewport spans most of the state,
 *    so nothing ever qualifies for removal; layers stay visually gated by
 *    minzoom anyway.
 *  - The creeks stay NON-SELECTABLE by construction: cluster layers are never
 *    added to the selection hit layers (TennesseeMap) — hover tooltip only.
 *  - A missing/invalid manifest (404 before SESSION A lands, schema drift)
 *    disables the feature entirely — fail closed, never half-render.
 */

export interface NetworkManifestCluster {
  id: string;
  /** File name relative to /atlas/network/ (contract: `<clusterId>.geojson`). */
  file: string;
  /** [west, south, east, north] in degrees. */
  bounds: [number, number, number, number];
  features?: number;
}

export interface NetworkManifest {
  schema: string;
  attribution?: string;
  clusters: NetworkManifestCluster[];
}

export const NETWORK_MANIFEST_URL = '/atlas/network/manifest.json';
export const NETWORK_SCHEMA = 'trout/nhd-network/1';
export const NETWORK_SOURCE_PREFIX = 'network-';
export const NETWORK_LAYER_PREFIX = 'network-minor-';
/** Cluster layers insert before this catalog layer: rivers paint above creeks. */
export const NETWORK_BEFORE_LAYER = 'rivers-casing';
/** moveend zoom gate for loading intersecting clusters. */
export const NETWORK_LOAD_ZOOM = 9.4;
/** Below-padded-viewport release only counts at this zoom or higher. */
export const NETWORK_RELEASE_ZOOM = 8.5;
/** Visual gate — matches the proof layer exactly (fade completes at 10.8). */
export const NETWORK_MINZOOM = 9.6;
/** Viewport padding for intersection tests: fraction of each axis span. */
export const NETWORK_PAD_RATIO = 0.25;

/**
 * Catalog-water names (lowercase) the network must NOT render: the catalog
 * already draws those exact waters, and the near-twin lines read as doubled
 * rivers (the Tennessee corridor, the Obion forks). TennesseeMap seeds this
 * from the river index at module load — before any cluster can load — so the
 * first addSource is already deduped.
 */
let catalogWaterNames: Set<string> = new Set();
export function setCatalogWaterNames(names: Iterable<string>): void {
  catalogWaterNames = new Set([...names].filter((n) => n.length > 0));
}

/** Drop catalog-water features from a fetched cluster (dedup, see above). */
function dedupeAgainstCatalog(fc: NetworkFeatureCollection): NetworkFeatureCollection {
  if (catalogWaterNames.size === 0) return fc;
  const features = (fc.features as Array<{ properties?: { name?: string } }>).filter((f) => {
    const name = String(f.properties?.name ?? '').toLowerCase();
    return name.length > 0 && !catalogWaterNames.has(name);
  });
  return { type: 'FeatureCollection', features } as NetworkFeatureCollection;
}

/** Minimal GeoJSON typing — avoids a standalone @types/geojson dependency. */
export interface NetworkFeatureCollection {
  type: 'FeatureCollection';
  features: unknown[];
}

/**
 * Tolerant-but-strict manifest parse: anything that does not match the
 * contract (right schema string, at least one fully-formed cluster) returns
 * null and the caller treats the network layer as absent. A half-valid
 * manifest would silently drop clusters, so it is rejected wholesale.
 */
export function parseNetworkManifest(json: unknown): NetworkManifest | null {
  if (typeof json !== 'object' || json === null) return null;
  const record = json as Record<string, unknown>;
  if (record.schema !== NETWORK_SCHEMA) return null;
  if (!Array.isArray(record.clusters) || record.clusters.length === 0) return null;
  const clusters: NetworkManifestCluster[] = [];
  for (const entry of record.clusters) {
    if (typeof entry !== 'object' || entry === null) return null;
    const c = entry as Record<string, unknown>;
    const { id, file } = c;
    if (typeof id !== 'string' || !id) return null;
    if (typeof file !== 'string' || !file) return null;
    // The shipped GEONET contract (schema trout/nhd-network/1) carries the
    // cluster extent as `bbox`; the pre-integration mock used `bounds`.
    // Accept both — parsing, not the field name, is what the fail-closed
    // feature depends on (GEOQA: statewide sweep found the mismatch).
    const rawBounds = Array.isArray(c.bounds) ? c.bounds : c.bbox;
    if (
      !Array.isArray(rawBounds) ||
      rawBounds.length !== 4 ||
      rawBounds.some((n) => typeof n !== 'number' || !Number.isFinite(n))
    )
      return null;
    const features = typeof c.features === 'number' ? c.features : undefined;
    clusters.push({
      id,
      file,
      bounds: [rawBounds[0]!, rawBounds[1]!, rawBounds[2]!, rawBounds[3]!],
      features,
    });
  }
  const manifest: NetworkManifest = { schema: String(record.schema), clusters };
  if (typeof record.attribution === 'string') manifest.attribution = record.attribution;
  return manifest;
}

export type BBox = [number, number, number, number];

/** Grows each bbox edge by `ratio` of that axis's span (scale-free padding). */
export function paddedBBox(box: BBox, ratio: number): BBox {
  const padX = (box[2] - box[0]) * ratio;
  const padY = (box[3] - box[1]) * ratio;
  return [box[0] - padX, box[1] - padY, box[2] + padX, box[3] + padY];
}

export function bboxesIntersect(a: BBox, b: BBox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/** Manifest clusters whose (padded) bounds intersect the viewport bbox. */
export function clustersForViewport(
  clusters: NetworkManifestCluster[],
  viewport: BBox,
  padRatio = NETWORK_PAD_RATIO,
): string[] {
  const padded = paddedBBox(viewport, padRatio);
  return clusters.filter((c) => bboxesIntersect(padded, c.bounds)).map((c) => c.id);
}

/** Loaded clusters that have moved out of the padded viewport (release set). */
export function clustersToRelease(
  clusters: NetworkManifestCluster[],
  loadedIds: Iterable<string>,
  viewport: BBox,
  padRatio = NETWORK_PAD_RATIO,
): string[] {
  const padded = paddedBBox(viewport, padRatio);
  const byId = new Map(clusters.map((c) => [c.id, c]));
  return [...loadedIds].filter((id) => {
    const cluster = byId.get(id);
    return cluster ? !bboxesIntersect(padded, cluster.bounds) : true;
  });
}

interface MapNetworkState {
  added: Set<string>;
  queue: Promise<void>;
  disposed: boolean;
}

const stateFor = (map: MlMap): MapNetworkState => {
  const states = networkStates as WeakMap<MlMap, MapNetworkState | undefined>;
  let state = states.get(map);
  if (!state) {
    state = { added: new Set(), queue: Promise.resolve(), disposed: false };
    states.set(map, state);
  }
  return state;
};
const networkStates = new WeakMap<MlMap, MapNetworkState | undefined>();

// Per-page-session caches. The manifest and every cluster file are fetched at
// most once per session regardless of viewport churn; removal only drops the
// MapLibre source, never the cached bytes.
let manifestCache: Promise<NetworkManifest | null> | null = null;
const dataCache = new Map<string, Promise<NetworkFeatureCollection | null>>();
/** Actual network fetches, in order (dev-only seam for load-once evidence). */
const fetchLog: string[] = [];

function loadManifest(): Promise<NetworkManifest | null> {
  if (!manifestCache) {
    manifestCache = fetch(NETWORK_MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => parseNetworkManifest(json))
      .catch(() => null);
  }
  return manifestCache;
}

/**
 * Cluster file URL. All cluster files ship flat at /atlas/network/<id>.geojson.
 * The shipped GEONET manifest writes `file` as `network/<id>.geojson` (atlas-root
 * relative), the mock wrote `<id>.geojson` — resolve the basename so both load
 * (GEOQA: the literal path 404'd and the feature failed closed statewide).
 */
export function clusterFileUrl(file: string): string {
  const base = file.replace(/^.*\//, '');
  return `/atlas/network/${base}`;
}

function loadCluster(cluster: NetworkManifestCluster) {
  let promise = dataCache.get(cluster.id);
  if (!promise) {
    const url = clusterFileUrl(cluster.file);
    fetchLog.push(url);
    promise = fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    dataCache.set(cluster.id, promise);
  }
  return promise;
}

/** Same paint/layout as the replaced proof layer, per cluster. */
function clusterLayerSpec(cluster: NetworkManifestCluster): {
  id: string;
  type: 'line';
  source: string;
  minzoom: number;
  layout: { 'line-cap': 'round'; 'line-join': 'round' };
  paint: Record<string, unknown>;
} {
  return {
    id: NETWORK_LAYER_PREFIX + cluster.id,
    type: 'line',
    source: NETWORK_SOURCE_PREFIX + cluster.id,
    minzoom: NETWORK_MINZOOM,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#5f8fb8',
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9.6, 0, 10.8, 0.95],
      'line-width': ['interpolate', ['linear'], ['zoom'], 9.6, 0.8, 13.5, 1.8],
    },
  };
}

async function syncNetworkClusters(map: MlMap): Promise<void> {
  const state = stateFor(map);
  const manifest = await loadManifest();
  if (!manifest || state.disposed) return;
  const zoom = map.getZoom();
  const b = map.getBounds();
  const viewport: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  const padded = paddedBBox(viewport, NETWORK_PAD_RATIO);

  // Release first so panning across the state replaces rather than accumulates.
  if (zoom >= NETWORK_RELEASE_ZOOM) {
    for (const id of clustersToRelease(manifest.clusters, state.added, viewport)) {
      if (map.getLayer(NETWORK_LAYER_PREFIX + id)) map.removeLayer(NETWORK_LAYER_PREFIX + id);
      if (map.getSource(NETWORK_SOURCE_PREFIX + id)) map.removeSource(NETWORK_SOURCE_PREFIX + id);
      state.added.delete(id);
    }
  }

  if (zoom >= NETWORK_LOAD_ZOOM) {
    for (const cluster of manifest.clusters) {
      if (state.disposed) return;
      if (state.added.has(cluster.id)) continue;
      if (!bboxesIntersect(padded, cluster.bounds)) continue;
      const data = await loadCluster(cluster);
      if (!data || state.disposed) continue;
      const deduped = dedupeAgainstCatalog(data);
      if (deduped.features.length === 0) {
        // every feature in this cluster is a catalog water — nothing to add
        state.added.add(cluster.id);
        continue;
      }
      // A style swap while awaiting drops both the source and our bookkeeping
      // (see style.load below); re-check before adding.
      const sourceId = NETWORK_SOURCE_PREFIX + cluster.id;
      if (map.getSource(sourceId)) {
        state.added.add(cluster.id);
        continue;
      }
      map.addSource(sourceId, {
        type: 'geojson',
        data: deduped,
        ...(manifest.attribution ? { attribution: manifest.attribution } : {}),
      });
      // If 'rivers-casing' is momentarily absent (style mid-swap), append to
      // the top — the next style.load resync re-inserts in the right order.
      map.addLayer(
        clusterLayerSpec(cluster) as never,
        map.getLayer(NETWORK_BEFORE_LAYER) ? NETWORK_BEFORE_LAYER : undefined,
      );
      state.added.add(cluster.id);
    }
  }

  publishDevSeam(map, manifest, state);
}

function publishDevSeam(map: MlMap, manifest: NetworkManifest, state: MapNetworkState): void {
  if (!import.meta.env.DEV) return;
  (window as unknown as Record<string, unknown>).__troutNetwork = {
    manifestClusters: manifest.clusters.map((c) => c.id),
    added: [...state.added],
    fetchedFiles: [...fetchLog],
    fetchedOnce: new Set(fetchLog).size === fetchLog.length,
  };
}

/**
 * Subscribes one map to the on-demand cluster loader. Returns a disposer;
 * TennesseeMap calls it from its map effect cleanup.
 */
export function initNetworkClusters(map: MlMap): () => void {
  const state = stateFor(map);
  const schedule = () => {
    state.queue = state.queue
      .then(() => syncNetworkClusters(map))
      .catch(() => {
        /* never let a cluster fetch break the map */
      });
  };
  const onMoveend = () => schedule();
  map.on('moveend', onMoveend);
  // A style swap rebuilds sources from atlasStyle() — which carries no network
  // sources — so forget what the old style had and resync for the viewport.
  const onStyleLoad = () => {
    state.added.clear();
    schedule();
  };
  map.on('style.load', onStyleLoad);
  if (map.isStyleLoaded()) schedule();
  else map.once('load', schedule);
  return () => {
    state.disposed = true;
    state.added.clear();
    map.off('moveend', onMoveend);
    map.off('style.load', onStyleLoad);
  };
}

/** Test seam: reset the per-session caches (module state, not map state). */
export function resetNetworkSessionCaches(): void {
  manifestCache = null;
  dataCache.clear();
  fetchLog.length = 0;
}
