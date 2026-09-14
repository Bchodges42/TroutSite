/**
 * Data-source registry (data-sources lane). One entry per upstream source the
 * evidence layer reads. sourceId values are stable contract identifiers —
 * they appear inside WaterEvidence payloads and must never be renamed.
 *
 * Facts recorded here were verified 2026-09-04 (see docs/FISHING-INFORMATION-SOURCES.md
 * and docs/DATA-SOURCE-COVERAGE.md for the full audit).
 */
export interface EvidenceSource {
  sourceId: string;
  label: string;
  authority: string;
  /** Human-auditable landing page for the data (not the query endpoint). */
  infoUrl: string;
  /** The endpoint actually queried (documented for operators, not embedded in payloads). */
  endpoint?: string;
  license: string;
  /** What the source is authoritative for. */
  provides: string[];
  /** Update cadence of the upstream data. */
  freshness: string;
  notes: string;
}

export const SOURCES: Record<string, EvidenceSource> = {
  'usgs-nwis-iv': {
    sourceId: 'usgs-nwis-iv',
    label: 'USGS Water Data continuous observations',
    authority: 'U.S. Geological Survey',
    infoUrl: 'https://waterdata.usgs.gov/tn/nwis/uv',
    endpoint: 'https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items',
    license: 'Public domain (USGS)',
    provides: ['temperature-c', 'discharge-cfs', 'stage-ft', 'dissolved-oxygen-mg-l', 'precipitation-mm'],
    freshness: '15–60 min per gauge',
    notes:
      'Parameter codes: 00060 discharge (cfs), 00065 gage height (ft), 00010 water temperature (C), ' +
      '00300 dissolved oxygen (mg/L), and 00045 precipitation (inches converted to mm). ' +
      'Values ship with per-point qualifiers ("P" = provisional, subject to revision) which are ' +
      'preserved verbatim in evidence. The current Water Data OGC API uses a server-only API key ' +
      'when available; batches are capped at 50 sites per request. ' +
      'NOT a source for Tennessee reservoir elevations (no TN IV sites publish 62614/63158).',
  },
  'usace-a2w': {
    sourceId: 'usace-a2w',
    label: 'USACE Access to Water (Nashville District)',
    authority: 'U.S. Army Corps of Engineers',
    infoUrl: 'https://water.usace.army.mil/',
    endpoint: 'https://water.usace.army.mil/cda/reporting/providers/lrn/timeseries',
    license: 'Public information (U.S. Government)',
    provides: ['discharge-cfs', 'stage-ft', 'temperature-c', 'dissolved-oxygen-mg-l'],
    freshness: '15–60 min where the configured series publishes',
    notes:
      'A2W series are hardcoded from verified Nashville District TSIDs because the locations catalog ' +
      'under-reports live series. Empty bodies and empty value arrays are honest no-data states; ' +
      'the browser never queries this service.',
  },
  'tva-restapi': {
    sourceId: 'tva-restapi',
    label: 'TVA lake info REST API (observed data)',
    authority: 'Tennessee Valley Authority',
    infoUrl: 'https://www.tva.com/environment/lake-levels',
    endpoint: 'https://www.tva.com/RestApi/observed-data/{LocationID}',
    license: 'Public information; undocumented endpoint — verify before relying on shape',
    provides: ['reservoir-level-ft', 'stage-ft', 'discharge-cfs'],
    freshness: 'Hourly',
    notes:
      'ReservoirElevation → reservoir-level-ft; TailwaterElevation → stage-ft; ' +
      'AverageHourlyDischarge → discharge-cfs. Requires a browser User-Agent (Cloudflare). ' +
      'No water temperature. Generation-release schedules: /RestApi/generation-releases/{id}. ' +
      'Covers TVA dams and the USACE Cumberland projects (Ownership "Cumberland").',
  },
  'tva-release-schedules': {
    sourceId: 'tva-release-schedules',
    label: 'TVA generator release schedules and predicted dam data',
    authority: 'Tennessee Valley Authority',
    infoUrl: 'https://www.tva.com/environment/lake-levels',
    endpoint: 'https://www.tva.com/RestApi/generation-releases/{LocationID}',
    license: 'Public information; undocumented endpoint — verify before relying on shape',
    provides: ['release-schedule', 'dam-forecast-context'],
    freshness: 'Daily schedule; approximately 3-day forecast',
    notes:
      'JSON generation blocks preserve TVA date and timezone labels. Predicted inflow, midnight ' +
      'elevation, and outflow are context only and never enter condition scoring. Empty arrays are valid.',
  },
  'nws-api': {
    sourceId: 'nws-api',
    label: 'NWS station observations (barometric pressure)',
    authority: 'National Weather Service (NOAA)',
    infoUrl: 'https://www.weather.gov/documentation/services-web-api',
    endpoint: 'https://api.weather.gov/stations/{station}/observations?limit=12',
    license: 'Public domain (US Government; NWS API policy requires a declared User-Agent)',
    provides: ['pressure-hpa', 'precipitation-mm'],
    freshness: 'Hourly METAR observations (some stations more often)',
    notes:
      'AREA-LEVEL signal: one representative ASOS station per catalog region ' +
      '(mapping in evidence/nws-provider.ts) — never presented as per-water data, ' +
      'and never fetched by the browser. barometricPressure arrives in Pa, stored ' +
      'as hPa. 3-hour trend is DERIVED (latest minus the observation closest to ' +
      '3 h earlier inside a 2-4 h window); observations older than 180 min are ' +
      'stale and yield no pressure row. precipitationLast3Hours is retained as ' +
      'region-level measured rain context when present.',
  },
  'twra-stockings': {
    sourceId: 'twra-stockings',
    label: 'TWRA trout stocking schedule',
    authority: 'Tennessee Wildlife Resources Agency',
    infoUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
    license: 'Public information (state of Tennessee)',
    provides: ['stocking-schedule'],
    freshness: 'Seasonal grid, revised through the season',
    notes:
      'The "Trout Stocking Schedule" exceldriven.json grid on the TWRA stockings page. ' +
      'Rows are SCHEDULES: "week of" dates mean within 5 days after that Sunday, and TWRA ' +
      'caveats postponement/cancellation (weather, warm water). A scheduled row is never ' +
      'evidence that a stocking occurred.',
  },
  'twra-recent-stockings': {
    sourceId: 'twra-recent-stockings',
    label: 'TWRA recent stocking locations report',
    authority: 'Tennessee Wildlife Resources Agency',
    infoUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
    license: 'Public information (state of Tennessee)',
    provides: ['stocking-reported-complete'],
    freshness: 'Updated bi-weekly through the stocking season; rolling window (~12 rows)',
    notes:
      'The "Recent Stocking Locations Report" grid on the same page: where adult trout were ' +
      'recently stocked ("dates ... representative of when the water was last stocked"). The ' +
      'ONLY official completed-stocking signal; no counts, no archive — history must be ' +
      'self-collected from successive captures.',
  },
  'twra-regulations': {
    sourceId: 'twra-regulations',
    label: 'TWRA fishing regulations',
    authority: 'Tennessee Wildlife Resources Agency',
    infoUrl: 'https://www.tn.gov/twra/fishing-regs.html',
    license: 'Public information (state of Tennessee)',
    provides: ['regulations'],
    freshness: 'Annual; the regulation year runs August 1 – July 31',
    notes:
      'Statewide rules and special-regulation waters. Effective dates are published via TWRA ' +
      'news releases (e.g. 2026-27 regulations effective 2026-08-01), not on the regs pages.',
  },
  'nps-gsmnp': {
    sourceId: 'nps-gsmnp',
    label: 'Great Smoky Mountains National Park fishing',
    authority: 'National Park Service',
    infoUrl: 'https://www.nps.gov/grsm/planyourvisit/fishing.htm',
    license: 'Public information (US Government)',
    provides: ['regulations'],
    freshness: 'Current park compendium',
    notes: 'Parkwide rules for the TN/NC park waters (either state license valid, age 16+).',
  },
  'tva-safety': {
    sourceId: 'tva-safety',
    label: 'TVA dam release / hazardous waters safety',
    authority: 'Tennessee Valley Authority',
    infoUrl: 'https://www.tva.com/environment/lake-levels/hazardous-waters',
    license: 'Public information',
    provides: ['safety'],
    freshness: 'Static guidance',
    notes: 'Generator releases can occur any time without warning on TVA tailwaters.',
  },
  'tdec-advisories': {
    sourceId: 'tdec-advisories',
    label: 'TDEC fish-consumption advisories',
    authority: 'Tennessee Department of Environment and Conservation',
    infoUrl: 'https://www.tn.gov/environment/program-areas/wr-water-resources/water-quality/fish-advisories.html',
    endpoint: 'https://www.tn.gov/content/dam/tn/environment/water/watershed-planning/wr_wq_fish-advisories.pdf',
    license: 'Public information (state of Tennessee)',
    provides: ['safety'],
    freshness: 'Weekly watch; advisory document changes are less frequent',
    notes:
      'The HTML page links the current PDF. The server-side watcher should HEAD the PDF for ' +
      'ETag/Last-Modified, then download, text-extract, and diff it. Any extracted do-not-eat ' +
      'or precautionary advisory is a safety overlay only; it never changes a fishability score.',
  },
  'tdec-dwr-arcgis': {
    sourceId: 'tdec-dwr-arcgis',
    label: 'TDEC DWR water-quality attainment',
    authority: 'Tennessee Department of Environment and Conservation',
    infoUrl: 'https://tdeconline.tn.gov/dwr/',
    endpoint: 'https://tdeconline.tn.gov/arcgis/rest/services/DWR_Public/MapServer',
    license: 'Public government data with attribution; access conditions apply',
    provides: ['water-quality-status'],
    freshness: 'Assessment-cycle publication; verify the cycle on each response',
    notes:
      'ArcGIS attainment and impairment layers are optional water-quality context, not live ' +
      'flow/temperature evidence. Requests require a browser User-Agent and Referer ' +
      'https://tdeconline.tn.gov/dwr/; the browser never calls this service directly.',
  },
};

export function sourceLabel(sourceId: string): string {
  return SOURCES[sourceId]?.label ?? sourceId;
}
