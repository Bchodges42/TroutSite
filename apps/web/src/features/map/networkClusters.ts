import type { Map as MlMap } from 'maplibre-gl';
import { MAP_ZOOM_TIERS } from './mapStyle';

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
 *  - On moveend at zoom >= NETWORK_LOAD_ZOOM, only the latest retained
 *    viewport request can install cluster sources. Cluster bytes are cached
 *    once per page session, even when a result becomes stale while panning.
 *  - Loaded clusters use 25% viewport padding to enter and 75% padding to
 *    leave. The recent renderer set is bounded so short pans do not churn
 *    every source in the state.
 *  - The creeks stay NON-SELECTABLE by construction: cluster layers are never
 *    added to the selection hit layers (TennesseeMap) — hover tooltip only.
 *  - A missing/invalid manifest disables the feature entirely — fail closed,
 *    never half-render.
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
export const NETWORK_LOAD_ZOOM = MAP_ZOOM_TIERS.context.load;
/** Below this zoom the statewide context layer is not retained in the renderer. */
export const NETWORK_RELEASE_ZOOM = NETWORK_LOAD_ZOOM;
/** Visual gate for the detailed context network. */
export const NETWORK_MINZOOM = MAP_ZOOM_TIERS.context.start;
/** Viewport padding used to load a new cluster. */
export const NETWORK_LOAD_PAD_RATIO = 0.25;
/** Wider hysteresis padding used to retain a loaded cluster. */
export const NETWORK_RELEASE_PAD_RATIO = 0.75;
/** A recent renderer set is enough for a short pan without unbounded growth. */
export const NETWORK_MAX_LOADED_CLUSTERS = 6;
/** Small bounded concurrency keeps a wide viewport from starting 20 fetches. */
export const NETWORK_FETCH_CONCURRENCY = 3;

/**
 * Drop a context feature only when its exact NHD permanent reach identifier is
 * owned by a catalog water. Names are labels, not identities: same-name
 * waters with different PIDs remain visible, unnamed reaches are handled too,
 * and a missing PID fails open.
 */
export function dedupeAgainstCatalog(
  fc: NetworkFeatureCollection,
  excludedPermanentIds: Iterable<string>,
): NetworkFeatureCollection {
  const excluded = new Set([...excludedPermanentIds].map(String));
  if (excluded.size === 0) return { type: 'FeatureCollection', features: [...fc.features] };
  const features = (fc.features as Array<{ properties?: { pid?: unknown } }>).filter((feature) => {
    const pid = feature.properties?.pid;
    return typeof pid !== 'string' || !excluded.has(pid);
  });
  return { type: 'FeatureCollection', features };
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
  padRatio = NETWORK_LOAD_PAD_RATIO,
): string[] {
  const padded = paddedBBox(viewport, padRatio);
  return clusters.filter((c) => bboxesIntersect(padded, c.bounds)).map((c) => c.id);
}

/** Loaded clusters that have moved out of the padded viewport (release set). */
export function clustersToRelease(
  clusters: NetworkManifestCluster[],
  loadedIds: Iterable<string>,
  viewport: BBox,
  padRatio = NETWORK_RELEASE_PAD_RATIO,
): string[] {
  const padded = paddedBBox(viewport, padRatio);
  const byId = new Map(clusters.map((c) => [c.id, c]));
  return [...loadedIds].filter((id) => {
    const cluster = byId.get(id);
    return cluster ? !bboxesIntersect(padded, cluster.bounds) : true;
  });
}

// Per-page-session caches. The manifest and every cluster file are fetched at
// most once per session while they SUCCEED; removal only drops the MapLibre
// source, never the cached bytes. F41: a settled FAILURE (fetch threw, non-200
// answered, bytes unparseable — always a null result) is never cached for the
// session; its entry evicts itself so a later viewport request retries. The
// manifest additionally cools down after repeated consecutive failures so a
// permanently missing manifest cannot refetch on every pan.
let manifestCache: Promise<NetworkManifest | null> | null = null;
/** Consecutive manifest failures; resets on the first valid manifest. */
let manifestFailures = 0;
/** Earliest Date.now() at which a new manifest attempt may start. */
let manifestRetryNotBefore = 0;
/** Consecutive failures before the bounded manifest retry cooldown engages. */
export const NETWORK_MANIFEST_MAX_FREE_RETRIES = 3;
/** Cooldown window for manifest retries once repeated failures exhaust the free ones. */
export const NETWORK_MANIFEST_RETRY_MS = 30_000;
/** Shared byte cache: remounting the map cannot refetch a cluster this page already has. */
const clusterDataCache = new Map<string, Promise<NetworkFeatureCollection | null>>();
/** Actual cluster URL fetches, in order; exposed only through the DEV seam. */
const fetchLog: string[] = [];

function noteManifestFailure(): void {
  manifestFailures += 1;
  if (manifestFailures >= NETWORK_MANIFEST_MAX_FREE_RETRIES) {
    manifestRetryNotBefore = Date.now() + NETWORK_MANIFEST_RETRY_MS;
  }
}

function loadManifest(): Promise<NetworkManifest | null> {
  if (manifestCache) return manifestCache;
  if (
    manifestFailures >= NETWORK_MANIFEST_MAX_FREE_RETRIES &&
    Date.now() < manifestRetryNotBefore
  ) {
    // Bounded retry: inside the cooldown window a request neither fetches nor
    // queues — the next request after it expires retries (F41).
    return Promise.resolve(null);
  }
  const attempt: Promise<NetworkManifest | null> = fetch(NETWORK_MANIFEST_URL)
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => parseNetworkManifest(json))
    .then((manifest) => {
      if (manifest) {
        manifestFailures = 0;
        manifestRetryNotBefore = 0;
      } else {
        noteManifestFailure();
      }
      return manifest;
    })
    .catch(() => {
      noteManifestFailure();
      return null;
    });
  manifestCache = attempt;
  // A settled failure evicts itself: the next viewport request retries (F41).
  void attempt.then((manifest) => {
    if (!manifest && manifestCache === attempt) manifestCache = null;
  });
  return attempt;
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

export interface NetworkSchedulerCounters {
  fetches: number;
  additions: number;
  removals: number;
  staleResultsIgnored: number;
  loadedIds: string[];
}

export interface NetworkSchedulerAdapter {
  isAlive(): boolean;
  /** Returns true when a source/layer was actually installed. */
  addCluster(cluster: NetworkManifestCluster, data: NetworkFeatureCollection): boolean;
  removeCluster(id: string): void;
}

export interface NetworkViewportRequest {
  zoom: number;
  bbox: BBox;
  generation: number;
  sequence: number;
}

export interface NetworkSchedulerOptions {
  clusters: NetworkManifestCluster[];
  adapter: NetworkSchedulerAdapter;
  fetchCluster: (cluster: NetworkManifestCluster) => Promise<NetworkFeatureCollection | null>;
  /** Optional page-session byte cache shared by map remounts. */
  byteCache?: Map<string, Promise<NetworkFeatureCollection | null>>;
  onChange?: (counters: NetworkSchedulerCounters) => void;
}

/**
 * Latest-only viewport scheduler. It deliberately owns the byte cache and
 * renderer bookkeeping separately: a stale request may populate the byte
 * cache, but it can never mutate the current MapLibre style.
 */
export class LatestOnlyNetworkScheduler {
  private readonly clusters: NetworkManifestCluster[];
  private readonly adapter: NetworkSchedulerAdapter;
  private readonly fetchCluster: NetworkSchedulerOptions['fetchCluster'];
  private readonly onChange?: NetworkSchedulerOptions['onChange'];
  private readonly bytes: Map<string, Promise<NetworkFeatureCollection | null>>;
  private readonly loaded = new Set<string>();
  private readonly loadOrder = new Map<string, number>();
  private latest: NetworkViewportRequest | null = null;
  private running = false;
  private disposed = false;
  private generation = 0;
  private sequence = 0;
  private order = 0;
  private readonly stats = { fetches: 0, additions: 0, removals: 0, staleResultsIgnored: 0 };

  constructor(options: NetworkSchedulerOptions) {
    this.clusters = options.clusters;
    this.adapter = options.adapter;
    this.fetchCluster = options.fetchCluster;
    this.bytes = options.byteCache ?? new Map();
    this.onChange = options.onChange;
  }

  request(zoom: number, bbox: BBox): void {
    if (this.disposed) return;
    this.latest = { zoom, bbox, generation: this.generation, sequence: ++this.sequence };
    if (!this.running) {
      this.running = true;
      void this.drain();
    }
  }

  /** MapLibre style reload: clear source bookkeeping, retain byte promises. */
  styleReload(zoom: number, bbox: BBox): void {
    if (this.disposed) return;
    this.generation += 1;
    this.loaded.clear();
    this.loadOrder.clear();
    this.request(zoom, bbox);
    this.publish();
  }

  dispose(): void {
    this.disposed = true;
    this.latest = null;
    this.loaded.clear();
    this.loadOrder.clear();
  }

  getCounters(): NetworkSchedulerCounters {
    return {
      ...this.stats,
      loadedIds: [...this.loaded].sort((a, b) => a.localeCompare(b)),
    };
  }

  private neededFor(request: NetworkViewportRequest): string[] {
    if (request.zoom < NETWORK_LOAD_ZOOM) return [];
    return clustersForViewport(this.clusters, request.bbox, NETWORK_LOAD_PAD_RATIO);
  }

  private current(request: NetworkViewportRequest, clusterId?: string): boolean {
    if (this.disposed || !this.adapter.isAlive() || this.latest !== request) return false;
    if (request.generation !== this.generation) return false;
    return clusterId == null || this.neededFor(request).includes(clusterId);
  }

  private async load(cluster: NetworkManifestCluster): Promise<NetworkFeatureCollection | null> {
    let promise = this.bytes.get(cluster.id);
    if (!promise) {
      this.stats.fetches += 1;
      promise = Promise.resolve()
        .then(() => this.fetchCluster(cluster))
        .catch(() => null);
      this.bytes.set(cluster.id, promise);
      // F41: a settled failure (null — the fetch threw, a non-200 answered, or
      // the bytes failed to parse) must not masquerade as cached data for the
      // rest of the session. Evict it so the next request retries; a
      // successfully fetched FeatureCollection — a valid EMPTY one included —
      // stays cached exactly as before.
      void promise.then((result) => {
        if (result === null && this.bytes.get(cluster.id) === promise) {
          this.bytes.delete(cluster.id);
        }
      });
      this.publish();
    }
    return promise;
  }

  private async drain(): Promise<void> {
    try {
      while (this.latest && !this.disposed) {
        const request = this.latest;
        await this.sync(request);
        if (this.latest === request) this.latest = null;
      }
    } finally {
      this.running = false;
      if (this.latest && !this.disposed) {
        this.running = true;
        void this.drain();
      }
    }
  }

  private async sync(request: NetworkViewportRequest): Promise<void> {
    if (!this.current(request)) return;
    const needed = this.neededFor(request);
    const retained = new Set(
      request.zoom < NETWORK_RELEASE_ZOOM
        ? []
        : clustersForViewport(this.clusters, request.bbox, NETWORK_RELEASE_PAD_RATIO),
    );
    for (const id of [...this.loaded]) {
      if (!retained.has(id)) this.remove(id);
    }

    // Never start more than the bounded recent set in one viewport. The
    // manifest order is deterministic, so unusually wide views degrade
    // predictably instead of creating an unbounded source burst.
    const candidates = needed
      .filter((id) => !this.loaded.has(id))
      .slice(0, NETWORK_MAX_LOADED_CLUSTERS);
    let cursor = 0;
    const worker = async () => {
      while (cursor < candidates.length && !this.disposed) {
        const id = candidates[cursor++]!;
        const cluster = this.clusters.find((entry) => entry.id === id);
        if (!cluster) continue;
        const data = await this.load(cluster);
        if (!data) continue;
        if (!this.current(request, id)) {
          this.stats.staleResultsIgnored += 1;
          this.publish();
          continue;
        }
        try {
          if (!this.loaded.has(id)) {
            if (this.adapter.addCluster(cluster, data)) this.stats.additions += 1;
            this.loaded.add(id);
            this.loadOrder.set(id, ++this.order);
            this.publish();
          }
        } catch {
          // A style can tear down between the alive check and addSource.
          // The next style.load request will retry from the byte cache.
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(NETWORK_FETCH_CONCURRENCY, candidates.length) }, () =>
        worker(),
      ),
    );
    this.enforceBound(new Set(needed.slice(0, NETWORK_MAX_LOADED_CLUSTERS)));
  }

  private remove(id: string): void {
    try {
      if (this.adapter.isAlive()) this.adapter.removeCluster(id);
    } catch {
      /* style teardown already removed it */
    }
    this.loaded.delete(id);
    this.loadOrder.delete(id);
    this.stats.removals += 1;
    this.publish();
  }

  private enforceBound(protectedIds: Set<string>): void {
    while (this.loaded.size > NETWORK_MAX_LOADED_CLUSTERS) {
      const removable = [...this.loaded]
        .filter((id) => !protectedIds.has(id))
        .sort((a, b) => (this.loadOrder.get(a) ?? 0) - (this.loadOrder.get(b) ?? 0))[0];
      const oldest = removable ?? [...this.loaded].sort(
        (a, b) => (this.loadOrder.get(a) ?? 0) - (this.loadOrder.get(b) ?? 0),
      )[0];
      if (!oldest) break;
      this.remove(oldest);
    }
  }

  private publish(): void {
    this.onChange?.(this.getCounters());
  }
}

/** Same paint/layout as the replaced proof layer, per cluster. */
function clusterLayerSpec(cluster: NetworkManifestCluster, reducedMotion: boolean): {
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
      'line-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        MAP_ZOOM_TIERS.context.start,
        0,
        MAP_ZOOM_TIERS.context.end,
        0.95,
      ],
      'line-opacity-transition': { duration: reducedMotion ? 0 : 200 },
      'line-width': ['interpolate', ['linear'], ['zoom'], NETWORK_MINZOOM, 0.8, 13.5, 1.8],
    },
  };
}

/**
 * Subscribes one map to the on-demand cluster loader. Returns a disposer;
 * TennesseeMap calls it from its map effect cleanup.
 */
export function initNetworkClusters(
  map: MlMap,
  excludedPermanentIds: Iterable<string> = [],
  options: { reducedMotion?: boolean } = {},
): () => void {
  let disposed = false;
  let scheduler: LatestOnlyNetworkScheduler | null = null;
  const catalogPids = new Set([...excludedPermanentIds].map(String));
  const readViewport = (): { zoom: number; bbox: BBox } | null => {
    try {
      const b = map.getBounds();
      return { zoom: map.getZoom(), bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] };
    } catch {
      return null;
    }
  };
  const publish = (manifest: NetworkManifest, counters: NetworkSchedulerCounters) => {
    const diagnostics =
      import.meta.env.DEV || new URLSearchParams(window.location.search).get('qa') === '1';
    if (!diagnostics) return;
    (window as unknown as Record<string, unknown>).__troutNetwork = {
      manifestClusters: manifest.clusters.map((c) => c.id),
      ...counters,
      // This is a page-session diagnostic, not a per-map scheduler count.
      fetches: fetchLog.length,
      fetchedFiles: [...fetchLog],
      fetchedOnce: new Set(fetchLog).size === fetchLog.length,
    };
  };
  const ensureScheduler = (manifest: NetworkManifest) => {
    if (scheduler) return scheduler;
    scheduler = new LatestOnlyNetworkScheduler({
      clusters: manifest.clusters,
      adapter: {
        isAlive: () => !disposed,
        addCluster: (cluster, data) => {
          const deduped = dedupeAgainstCatalog(data, catalogPids);
          if (deduped.features.length === 0) return false;
          const sourceId = NETWORK_SOURCE_PREFIX + cluster.id;
          if (map.getSource(sourceId)) return false;
          map.addSource(sourceId, {
            type: 'geojson',
            data: deduped,
            ...(manifest.attribution ? { attribution: manifest.attribution } : {}),
          });
          map.addLayer(
            clusterLayerSpec(cluster, Boolean(options.reducedMotion)) as never,
            map.getLayer(NETWORK_BEFORE_LAYER) ? NETWORK_BEFORE_LAYER : undefined,
          );
          return true;
        },
        removeCluster: (id) => {
          if (map.getLayer(NETWORK_LAYER_PREFIX + id)) map.removeLayer(NETWORK_LAYER_PREFIX + id);
          if (map.getSource(NETWORK_SOURCE_PREFIX + id)) map.removeSource(NETWORK_SOURCE_PREFIX + id);
        },
      },
      fetchCluster: (cluster) => {
        const url = clusterFileUrl(cluster.file);
        fetchLog.push(url);
        return fetch(url).then((res) => (res.ok ? res.json() : null));
      },
      byteCache: clusterDataCache,
      onChange: (counters) => publish(manifest, counters),
    });
    return scheduler;
  };
  const schedule = () => {
    if (disposed) return;
    const viewport = readViewport();
    if (!viewport) return;
    void loadManifest().then((manifest) => {
      if (!manifest || disposed) return;
      ensureScheduler(manifest)?.request(viewport.zoom, viewport.bbox);
    });
  };
  const onMoveend = () => schedule();
  map.on('moveend', onMoveend);
  const onStyleLoad = () => {
    const viewport = readViewport();
    if (!viewport) return;
    void loadManifest().then((manifest) => {
      if (!manifest || disposed) return;
      const current = ensureScheduler(manifest);
      current?.styleReload(viewport.zoom, viewport.bbox);
    });
  };
  map.on('style.load', onStyleLoad);
  if (map.isStyleLoaded()) schedule();
  else map.once('load', schedule);
  return () => {
    disposed = true;
    scheduler?.dispose();
    map.off('moveend', onMoveend);
    map.off('style.load', onStyleLoad);
  };
}

/** Test seam: reset the per-session caches (module state, not map state). */
export function resetNetworkSessionCaches(): void {
  manifestCache = null;
  manifestFailures = 0;
  manifestRetryNotBefore = 0;
  clusterDataCache.clear();
  fetchLog.length = 0;
}
