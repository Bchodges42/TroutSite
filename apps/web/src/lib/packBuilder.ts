import type { Stream } from '@trout/contracts';
import { ENDPOINTS } from '@trout/contracts';
import { CONTENT_URLS } from './endpoints';
import { currentMonth } from './time';
import { monthName } from '../data/regions';
import { tileForCoordinate } from './atlasAvailability';
import { waterManifestId, tripManifestId } from './downloadManifests';
import type { DownloadManifestRecord, DownloadSectionState } from './db';
import anchors from '../data/streams-geo.json';

/**
 * Pure pack planning (ADR 0012 decision 3): given a catalog water (or a trip
 * plus its waters' plans), produce the manifest a pack must pin — which URLs,
 * grouped into sections, which sections gate "ready". No I/O happens here:
 * the caller resolves availability-dependent inputs (the atlas topo manifest,
 * the network-cluster manifest) and passes them in, so this module stays
 * trivially testable and the pack shape is reviewable in one place.
 *
 * Honesty rules encoded below:
 *  - bytes are never invented (unknown sizes stay unknown — packCache fills
 *    them from real Content-Length headers when a response carries one);
 *  - a section the app cannot honestly require for this water (fishability
 *    for a water with no cataloged species, releases for a non-tailrace,
 *    terrain with no anchor or no coverage) is omitted, never stubbed;
 *  - terrain is the only OPTIONAL section: a pack without it may still be
 *    "ready" (partialOptional), everything else gates readiness.
 */

/** The pack cache this app pins into. The service worker's fetch fallback
 *  serves it offline (see the SW wiring note in lib/packCache.ts). */
export const PACK_CACHE_NAME = 'trout-packs-v1';

/**
 * Terrain tiles are pinned into the EXISTING `topo-cache` instead: the service
 * worker already routes /atlas/topo/ through a CacheFirst runtime handler
 * (vite.shared.ts), so tiles stored there are served offline today — no SW
 * change needed. Everything else lands in PACK_CACHE_NAME.
 */
export const TOPO_CACHE_NAME = 'topo-cache';

/** Which Cache-Storage cache owns a pinned URL (mirrors the comment above). */
export function cacheNameForUrl(url: string): string {
  return url.includes('/atlas/topo/') ? TOPO_CACHE_NAME : PACK_CACHE_NAME;
}

// ── Frozen pack inputs (same URLs the app's own surfaces read) ──────────────

/** The statewide fishing-information pack file — keep in sync with
 *  lib/fishingInfo.ts (FISHING_INFO_URL), which owns the only real reader. */
const FISHING_INFO_URL = '/content/fishing.json';

/** The map's reach-geometry source for catalog waters. Production builds also
 *  precache it (vite.shared.ts `atlas/*` glob); pinning it here keeps a pack
 *  self-sufficient regardless of precache revisioning. */
const RIVERS_GEO_URL = '/atlas/rivers.geojson';

/** The named-creek context layer (features/map/networkClusters.ts): fetched
 *  on demand at map zoom, never precached — packs pin the cluster files that
 *  cover a water so its map context survives offline. */
export const NETWORK_MANIFEST_URL = '/atlas/network/manifest.json';
/** Resolved by the caller (usePackManager) for the optional terrain section. */
export const TOPO_MANIFEST_URL = '/atlas/topo/manifest.json';

/** The water's on-device anchor ("near me" coordinates, src/data/streams-geo.json).
 *  West-TN put-and-take ponds keep their point anchors in rivers.geojson
 *  instead — for those this returns null and terrain is honestly not offered. */
export function waterAnchor(streamId: string): { lat: number; lon: number } | null {
  const entry = (anchors as Record<string, { lat?: number; lon?: number }>)[streamId];
  if (!entry || typeof entry.lat !== 'number' || typeof entry.lon !== 'number') return null;
  return { lat: entry.lat, lon: entry.lon };
}

// ── Terrain coverage (optional section) ─────────────────────────────────────

/** Terrain tile coverage as declared by /atlas/topo/manifest.json
 *  (hillshade.pattern + zoom range). Resolved by the caller and passed in. */
export interface TopoTileInfo {
  /** e.g. "hillshade/{z}/{x}/{y}.webp", relative to /atlas/topo/. */
  pattern: string;
  minZoom: number;
  maxZoom: number;
}

/** Tolerant parse of the topo manifest's tile facts (atlasAvailability.ts owns
 *  the availability probing; this only extracts the URL plan). */
export function parseTopoTileInfo(json: unknown): TopoTileInfo | null {
  if (!json || typeof json !== 'object') return null;
  const hillshade = (json as { hillshade?: unknown }).hillshade;
  if (!hillshade || typeof hillshade !== 'object') return null;
  const h = hillshade as { pattern?: unknown; minZoom?: unknown; maxZoom?: unknown };
  if (typeof h.pattern !== 'string' || !/\{z\}.*\{x\}.*\{y\}/.test(h.pattern)) return null;
  if (typeof h.minZoom !== 'number' || typeof h.maxZoom !== 'number') return null;
  const minZoom = Math.max(0, Math.min(22, Math.floor(h.minZoom)));
  const maxZoom = Math.max(minZoom, Math.min(22, Math.floor(h.maxZoom)));
  return { pattern: h.pattern, minZoom, maxZoom };
}

/**
 * A bounded tile plan around one anchor: the two highest supported zooms,
 * 3×3 tiles each (the anchor tile plus its neighbors — enough for a
 * water-centered offline map pan without statewide weight).
 */
export function terrainTileUrls(anchor: { lat: number; lon: number }, topo: TopoTileInfo): string[] {
  const zooms: number[] = [];
  for (let z = Math.min(topo.maxZoom, 11); z >= topo.minZoom && zooms.length < 2; z--) zooms.push(z);
  const urls: string[] = [];
  for (const z of zooms) {
    const { x, y } = tileForCoordinate(anchor.lon, anchor.lat, z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        urls.push(
          '/atlas/topo/' +
            topo.pattern
              .replace('{z}', String(z))
              .replace('{x}', String(x + dx))
              .replace('{y}', String(y + dy)),
        );
      }
    }
  }
  return urls;
}

// ── Network-cluster geometry resolution ─────────────────────────────────────

/** Minimal view of /atlas/network/manifest.json (features/map/networkClusters.ts
 *  owns the strict, fail-closed parse for the live map layer; packs only need
 *  id/file/bounds to pick covering files). Accepts `bounds` or `bbox`. */
export interface PackNetworkCluster {
  id: string;
  file: string;
  bounds: [number, number, number, number];
}

export function parseNetworkClusters(json: unknown): PackNetworkCluster[] {
  if (!json || typeof json !== 'object') return [];
  const clusters = (json as { clusters?: unknown }).clusters;
  if (!Array.isArray(clusters)) return [];
  const out: PackNetworkCluster[] = [];
  for (const entry of clusters) {
    if (!entry || typeof entry !== 'object') continue;
    const c = entry as { id?: unknown; file?: unknown; bounds?: unknown; bbox?: unknown };
    if (typeof c.id !== 'string' || !c.id || typeof c.file !== 'string' || !c.file) continue;
    const raw = Array.isArray(c.bounds) ? c.bounds : Array.isArray(c.bbox) ? c.bbox : null;
    if (!raw || raw.length !== 4 || raw.some((n) => typeof n !== 'number' || !Number.isFinite(n))) continue;
    out.push({ id: c.id, file: c.file, bounds: [raw[0]!, raw[1]!, raw[2]!, raw[3]!] });
  }
  return out;
}

/** Cluster files whose extent contains the point, plus the manifest that
 *  lists them (the map's on-demand loader needs the manifest to find files). */
export function networkClusterUrlsForPoint(
  clusters: PackNetworkCluster[],
  point: { lat: number; lon: number },
): string[] {
  const covering = clusters
    .filter((c) => {
      const [w, s, e, n] = c.bounds;
      return point.lon >= w && point.lon <= e && point.lat >= s && point.lat <= n;
    })
    .map((c) => `/atlas/network/${c.file}`);
  return covering.length > 0 ? [NETWORK_MANIFEST_URL, ...covering] : [];
}

// ── Section planning ────────────────────────────────────────────────────────

export interface PackSectionPlan {
  key: string;
  label: string;
  required: boolean;
  urls: string[];
}

export interface PackPlan {
  id: string;
  kind: 'water' | 'trip';
  label: string;
  sections: PackSectionPlan[];
  /** Deduped union of every section's URLs — the pin/removal working set. */
  assetUrls: string[];
}

/**
 * Dam-release waters are the ones a published generation schedule can serve —
 * mirrors lib/waterOverview.ts releasesApplicable (kept in step by comment;
 * the overview model is the authority the ReleasesPanel renders from).
 */
export function releasesApplicableForPack(stream: Pick<Stream, 'waterbodyType' | 'fishery'>): boolean {
  return stream.waterbodyType === 'tailrace' || stream.fishery === 'tailwater';
}

export interface WaterPackOptions {
  /** Hatch-chart month (1–12). Defaults to the current month. */
  month?: number;
  /** Offer the optional terrain section when coverage inputs resolve. */
  includeTerrain?: boolean;
  /** Resolved from /atlas/topo/manifest.json; null/absent → no terrain section. */
  topo?: TopoTileInfo | null;
  /** Cluster files covering the water (resolved from the network manifest). */
  clusterUrls?: string[];
}

/**
 * The pack a water needs, from what the app actually reads for that water:
 *  - catalog:      /v1/streams (the catalog row), /content/fishing.json
 *                  (special regulations), /content/taxa.json + patterns.json
 *                  (match-the-hatch), /v1/stocking/TN.json (stocking history);
 *  - conditions:   /v1/conditions/latest.json (the shared statewide snapshot)
 *                  plus /v1/fishability/<id>.json when the catalog lists
 *                  targetSpecies (the F5 pipeline only emits files for those);
 *  - releases:     /v1/release-schedule/<id>.json — only for tailrace/tailwater;
 *  - hatch:        /v1/hatch/<regionId>/<month>.json;
 *  - geometry:     /atlas/rivers.geojson + the water's network-cluster context;
 *  - terrain:      OPTIONAL hillshade tiles around the anchor (never required).
 */
export function planWaterPack(stream: Stream, opts: WaterPackOptions = {}): PackPlan {
  const month = opts.month ?? currentMonth();

  const sections: PackSectionPlan[] = [
    {
      key: 'catalog',
      label: 'Water guide — catalog, regulations & hatch key',
      required: true,
      urls: [
        ENDPOINTS.streams,
        FISHING_INFO_URL,
        CONTENT_URLS.taxa,
        CONTENT_URLS.patterns,
        ENDPOINTS.stocking(stream.stateId),
      ],
    },
    {
      key: 'conditions',
      label: 'Latest conditions & fishability',
      required: true,
      urls: [
        ENDPOINTS.conditionsLatest,
        ...(stream.targetSpecies?.length ? [ENDPOINTS.fishabilityForWater(stream.id)] : []),
      ],
    },
    ...(releasesApplicableForPack(stream)
      ? [
          {
            key: 'releases',
            label: 'Dam release schedule',
            required: true,
            urls: [ENDPOINTS.releaseSchedule(stream.id)],
          },
        ]
      : []),
    {
      key: 'hatch',
      label: `Hatch chart — ${monthName(month)}`,
      required: true,
      urls: [ENDPOINTS.hatch(stream.regionId, month)],
    },
    {
      key: 'geometry',
      label: 'Map geometry',
      required: true,
      urls: [RIVERS_GEO_URL, ...(opts.clusterUrls ?? [])],
    },
  ];

  const anchor = waterAnchor(stream.id);
  const topo = opts.includeTerrain ? (opts.topo ?? null) : null;
  if (anchor && topo) {
    const tiles = terrainTileUrls(anchor, topo);
    if (tiles.length > 0) {
      sections.push({
        key: 'terrain',
        label: 'Terrain (optional hillshade)',
        required: false,
        urls: tiles,
      });
    }
  }

  return {
    id: waterManifestId(stream.id),
    kind: 'water',
    label: stream.name,
    sections,
    assetUrls: dedupeUrls(sections.flatMap((s) => s.urls)),
  };
}

export interface TripPackInput {
  id: string;
  title: string;
}

/**
 * Merge the waters' plans into ONE trip manifest: sections merge by key
 * (required = union — a section required by any water gates the trip pack),
 * URLs dedupe across overlapping waters, section order follows first sight.
 */
export function planTripPack(trip: TripPackInput, waterPlans: PackPlan[]): PackPlan {
  const byKey = new Map<string, PackSectionPlan>();
  for (const plan of waterPlans) {
    for (const section of plan.sections) {
      const existing = byKey.get(section.key);
      if (!existing) {
        byKey.set(section.key, { ...section, urls: [...section.urls] });
        continue;
      }
      existing.required = existing.required || section.required;
      for (const url of section.urls) if (!existing.urls.includes(url)) existing.urls.push(url);
    }
  }
  const sections = [...byKey.values()];
  return {
    id: tripManifestId(trip.id),
    kind: 'trip',
    label: `Trip: ${trip.title}`,
    sections,
    assetUrls: dedupeUrls(sections.flatMap((s) => s.urls)),
  };
}

// ── Plan → Dexie manifest input ─────────────────────────────────────────────

/** The putManifest input for a plan: sections start not-ready — pinning (and
 *  only verified pinning) flips them. Bytes stay unknown until real responses
 *  report their size. */
export function toManifestInput(plan: PackPlan): Omit<DownloadManifestRecord, 'createdAt' | 'updatedAt'> {
  const sections: DownloadSectionState[] = plan.sections.map((s) => ({
    key: s.key,
    label: s.label,
    required: s.required,
    ready: false,
  }));
  return {
    id: plan.id,
    kind: plan.kind,
    label: plan.label,
    sections,
    assetUrls: plan.assetUrls,
    manifestVersion: 1,
  };
}

function dedupeUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}

/**
 * Per-section URL attribution for later Verify/Remove passes. The Dexie
 * manifest record (ROLE 2's schema) carries readiness per section but not the
 * URLs behind each one, so packCache persists this small index beside the
 * caches (localStorage — same origin, same eviction profile, best-effort) and
 * treats a lost index as "attribution unknown" rather than guessing.
 */
export interface PackPlanIndexEntry {
  id: string;
  sections: Array<{ key: string; urls: string[] }>;
}

export function toPlanIndexEntry(plan: PackPlan): PackPlanIndexEntry {
  return { id: plan.id, sections: plan.sections.map((s) => ({ key: s.key, urls: [...s.urls] })) };
}
