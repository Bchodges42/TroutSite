/**
 * Availability probes for the optional atlas layers (terrain, roads).
 *
 * The Layers panel must reflect what the CURRENT deployment can actually
 * serve — not just whether a manifest file happens to exist. Each probe:
 *  1. fetches the manifest and checks its shape,
 *  2. HEAD-probes the resources the manifest references (one hillshade tile;
 *     every road file), so a manifest that lists assets the server cannot
 *     serve disables the control instead of shipping a broken layer.
 *
 * Also owns terrain service-worker cache freshness: the topo runtime cache is
 * CacheFirst with a 90-day TTL, so hillshade tiles rebuilt at the SAME URLs
 * (the {z}/{x}/{y}.webp scheme is content-blind) would keep serving the stale
 * opaque pre-alpha tiles forever — the original Nightfall "white rectangle".
 * The manifest's `generated` stamp is the invalidation key: when it changes,
 * the runtime cache is dropped once and repopulated from the new assets.
 */

export interface TopoManifest {
  bands: unknown[];
  hillshade: { pattern: string; minZoom: number; maxZoom: number };
  generated?: string;
}

export interface RoadsManifest {
  files: Array<{ file: string; lod?: string; minZoom?: number }>;
  attribution?: string;
}

const PROBE_TIMEOUT_MS = 6_000;

async function probeOnce(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Up to three attempts with backoff: on a cold start the service worker
 * precache saturates the same connection pool the probe uses, and aborted
 * HEADs would disable terrain/roads for the whole session even though the
 * deployment serves them fine.
 */
async function probe(url: string): Promise<boolean> {
  const backoffs = [0, 1_200, 2_400];
  for (const wait of backoffs) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    if (await probeOnce(url)) return true;
  }
  return false;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Web-mercator tile covering a coordinate at zoom z (used to probe one real hillshade tile). */
export function tileForCoordinate(lon: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const clampedLat = Math.max(-85.05, Math.min(85.05, lat));
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (clampedLat * Math.PI) / 180;
  const merc = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad));
  const y = Math.floor(((1 - merc / Math.PI) / 2) * n);
  return { x, y };
}

export function parseTopoManifest(json: unknown): TopoManifest | null {
  if (!json || typeof json !== 'object') return null;
  const m = json as TopoManifest;
  if (!Array.isArray(m.bands) || m.bands.length === 0) return null;
  if (!m.hillshade || typeof m.hillshade.pattern !== 'string') return null;
  if (typeof m.hillshade.minZoom !== 'number' || typeof m.hillshade.maxZoom !== 'number') return null;
  return m;
}

/**
 * True when the deployment offers terrain: a well-formed manifest AND at least
 * one servable hillshade tile. `cacheName` is invalidated when the manifest's
 * `generated` stamp differs from the one this browser last saw.
 */
export async function probeTerrainAvailability(
  cacheName = 'topo-cache',
): Promise<boolean> {
  let manifest: TopoManifest | null = null;
  try {
    manifest = parseTopoManifest(await fetchJson('/atlas/topo/manifest.json'));
  } catch {
    return false;
  }
  if (!manifest) return false;

  // Probe the tile that covers central Tennessee at the source's minimum zoom.
  const zoom = Math.max(0, Math.min(22, Math.floor(manifest.hillshade.minZoom)));
  const { x, y } = tileForCoordinate(-86.5, 35.8, zoom);
  const tileUrl = manifest.hillshade.pattern
    .replace('{z}', String(zoom))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
  if (!(await probe('/atlas/topo/' + tileUrl))) return false;

  await invalidateStaleTopoCache(manifest, cacheName);
  return true;
}

export function parseRoadsManifest(json: unknown): RoadsManifest | null {
  if (!json || typeof json !== 'object') return null;
  const m = json as RoadsManifest;
  if (!Array.isArray(m.files) || m.files.length === 0) return null;
  if (m.files.some((f) => !f || typeof f.file !== 'string')) return null;
  return m;
}

/** True when the manifest is well-formed AND every referenced road file is servable. */
export async function probeRoadsAvailability(): Promise<RoadsManifest | null> {
  let manifest: RoadsManifest | null = null;
  try {
    manifest = parseRoadsManifest(await fetchJson('/atlas/roads-manifest.json'));
  } catch {
    return null;
  }
  if (!manifest) return null;
  const results = await Promise.all(
    manifest.files.map((f) => probe('/atlas/' + f.file)),
  );
  return results.every(Boolean) ? manifest : null;
}

const TOPO_GENERATED_KEY = 'trout:topo-generated';

/**
 * Drop the CacheFirst terrain runtime cache when the manifest's `generated`
 * stamp differs from the stored one (or the stored one is missing). Runs once
 * per changed deployment; SW cache access is a progressive enhancement, so
 * every failure path resolves quietly. F29: the marker may only advance once
 * the deletion actually succeeded — recording it first let a transient
 * caches.delete failure pin the stale terrain cache until the NEXT generation
 * change. A failed delete leaves the marker untouched so the very next probe
 * retries the purge.
 */
export async function invalidateStaleTopoCache(
  manifest: TopoManifest,
  cacheName = 'topo-cache',
): Promise<boolean> {
  const generated = manifest.generated ?? '';
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(TOPO_GENERATED_KEY);
  } catch {
    return false;
  }
  if (stored === generated) return false;
  try {
    if (typeof caches !== 'undefined' && generated) await caches.delete(cacheName);
  } catch {
    return false;
  }
  try {
    localStorage.setItem(TOPO_GENERATED_KEY, generated);
  } catch {
    /* private mode: nothing durable to record; the next probe purges again */
  }
  return true;
}
