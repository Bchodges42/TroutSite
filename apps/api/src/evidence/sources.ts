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
    label: 'USGS Waterservices NWIS instant values',
    authority: 'U.S. Geological Survey',
    infoUrl: 'https://waterdata.usgs.gov/tn/nwis/uv',
    endpoint: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites={sites}&parameterCd=00060,00065,00010',
    license: 'Public domain (USGS)',
    provides: ['temperature-c', 'discharge-cfs', 'stage-ft'],
    freshness: '15–60 min per gauge',
    notes:
      'Parameter codes: 00060 discharge (cfs), 00065 gage height (ft), 00010 water temperature (C). ' +
      'Values ship with per-point qualifiers ("P" = provisional, subject to revision) which are ' +
      'preserved verbatim in evidence. No API key; batches capped at 50 sites per request. ' +
      'NOT a source for Tennessee reservoir elevations (no TN IV sites publish 62614/63158).',
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
  'nws-api': {
    sourceId: 'nws-api',
    label: 'NWS station observations (barometric pressure)',
    authority: 'National Weather Service (NOAA)',
    infoUrl: 'https://www.weather.gov/documentation/services-web-api',
    endpoint: 'https://api.weather.gov/stations/{station}/observations?limit=12',
    license: 'Public domain (US Government; NWS API policy requires a declared User-Agent)',
    provides: ['pressure-hpa'],
    freshness: 'Hourly METAR observations (some stations more often)',
    notes:
      'AREA-LEVEL signal: one representative ASOS station per catalog region ' +
      '(mapping in evidence/nws-provider.ts) — never presented as per-water data, ' +
      'and never fetched by the browser. barometricPressure arrives in Pa, stored ' +
      'as hPa. 3-hour trend is DERIVED (latest minus the observation closest to ' +
      '3 h earlier inside a 2-4 h window); observations older than 180 min are ' +
      'stale and yield no row.',
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
};

export function sourceLabel(sourceId: string): string {
  return SOURCES[sourceId]?.label ?? sourceId;
}
