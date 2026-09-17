import { ENDPOINTS } from '@trout/contracts';

export { ENDPOINTS };

/** The only state with v1 content; others stay selectable-but-empty until v2 (§2). */
export const V1_STATES = ['TN'] as const;

/** URL conventions for the bundled content pack (§7 "compact bundled JSON content pack for PWA precache"). */
export const CONTENT_URLS = {
  taxa: '/content/taxa.json',
  patterns: '/content/patterns.json',
  speciesOccurrences: '/content/species-occurrences.json',
} as const;

export const snapshotUrls = {
  streams: ENDPOINTS.streams,
  conditionsLatest: ENDPOINTS.conditionsLatest,
  stocking: (stateId: string) => ENDPOINTS.stocking(stateId),
  stockingRecent: (stateId: string) => ENDPOINTS.stockingRecent(stateId),
  hatch: (regionId: string, month: number) => ENDPOINTS.hatch(regionId, month),
  shops: (stateId: string) => ENDPOINTS.shops(stateId),
  reportsRecent: ENDPOINTS.reportsRecent,
} as const;

/**
 * Fixture mode (`DEV_FIXTURES=1 vite dev`): rewrite snapshot URLs to the static files
 * under /fixtures/data. Production and fixture *builds* fetch the real /v1/* URLs —
 * in a fixture build those files are copied into dist verbatim, so the app always
 * speaks the frozen ENDPOINTS surface.
 */
export function resolveUrl(url: string): string {
  if (import.meta.env.DEV_FIXTURES === true) {
    return `/fixtures/data${url}`;
  }
  return url;
}
