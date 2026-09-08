/**
 * Frozen endpoint map (00-SHARED-CONTEXT §6).
 * GET routes are snapshot-served JSON cached by Cloudflare;
 * POST /v1/portal/reports is the only live write route.
 */
export interface EndpointMap {
  /** GET /v1/streams — append `?state=TX` (TX|OK|AR) to filter. */
  streams: string;
  /** GET — ConditionSnapshot[] for all monitored streams. */
  conditionsLatest: string;
  /** GET — StockingEvent[] for one state. */
  stocking: (stateId: string) => string;
  /** GET — HatchChart for one region and month (1–12). */
  hatch: (regionId: string, month: number) => string;
  /** GET — Shop[] for one state. */
  shops: (stateId: string) => string;
  /** GET — recent attributed ShopReport[]. */
  reportsRecent: string;
  /** GET — WaterEvidence[] (provenance-first per-water evidence; additive contracts-v1.1.0). */
  evidenceWaters: string;
  /** POST — create a ShopReport (shop token header). The only live route. */
  portalReports: string;
  /** GET — liveness probe. */
  healthz: string;
}

export const ENDPOINTS: EndpointMap = {
  streams: '/v1/streams',
  conditionsLatest: '/v1/conditions/latest.json',
  stocking: (stateId) => `/v1/stocking/${stateId}.json`,
  hatch: (regionId, month) => `/v1/hatch/${regionId}/${month}.json`,
  shops: (stateId) => `/v1/shops/${stateId}.json`,
  reportsRecent: '/v1/reports/recent.json',
  evidenceWaters: '/v1/evidence/waters.json',
  portalReports: '/v1/portal/reports',
  healthz: '/healthz',
};
