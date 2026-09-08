import { USACE_TAILWATER_SERIES } from './usace-provider.js';

/**
 * Static water → TVA monitor mapping (data-sources lane, hand-audited against the
 * TVA /RestApi/locations list captured 2026-09-04 — 43 locations, fixture
 * apps/api/fixtures/TVA/locations-2026-09-04.json).
 *
 * Only waters where ONE dam's operations govern the water the catalog describes.
 * Main-stem rivers with multiple dams (tennessee-river, cumberland-river, holston-river,
 * french-broad-river below Douglas) deliberately have NO single monitor — mapping one
 * dam would misrepresent which segment is observed (ambiguity rejection applies to
 * monitors too, not just names).
 *
 * Lake waters get ReservoirElevation (reservoir-level-ft) + AverageHourlyDischarge.
 * Tailwaters get TailwaterElevation (stage-ft) + AverageHourlyDischarge from the dam
 * that releases into them.
 */
export const TVA_MONITORS: Record<string, { locationId: string; role: 'reservoir' | 'tailwater'; note?: string }> = {
  // Lakes (reservoir elevation).
  'norris-lake': { locationId: 'NRST1', role: 'reservoir' },
  'cherokee-lake': { locationId: 'CRKT1', role: 'reservoir' },
  'douglas-lake': { locationId: 'DUGT1', role: 'reservoir' },
  'watts-bar-lake': { locationId: 'WBOT1', role: 'reservoir' },
  'fort-loudoun-lake': { locationId: 'FLDT1', role: 'reservoir' },
  'chickamauga-lake': { locationId: 'CKDT1', role: 'reservoir' },
  'old-hickory-lake': { locationId: 'OHHT1', role: 'reservoir' },
  'j-percy-priest-lake': { locationId: 'JPHT1', role: 'reservoir' },
  'tims-ford-lake': { locationId: 'TMFT1', role: 'reservoir' },
  'center-hill-lake': { locationId: 'CEHT1', role: 'reservoir' },
  'dale-hollow-lake': { locationId: 'DLHT1', role: 'reservoir' },
  'kentucky-lake': { locationId: 'KYDK2', role: 'reservoir' },
  'lake-barkley': { locationId: 'BARK2', role: 'reservoir' },
  'south-holston-lake': { locationId: 'SHDT1', role: 'reservoir' },
  'pickwick-lake': { locationId: 'PICT1', role: 'reservoir' },
  // Tailwaters (the releasing dam's tailwater elevation + discharge).
  'watauga-river': { locationId: 'WL', role: 'tailwater', note: 'Wilbur Dam releases the Watauga tailwater' },
  'boone-tailwater': { locationId: 'BOOT1', role: 'tailwater' },
  'ft-patrick-henry-tailwater': { locationId: 'FPHT1', role: 'tailwater' },
  'south-holston-river': { locationId: 'SHDT1', role: 'tailwater', note: 'same dam as south-holston-lake; different metric' },
  'clinch-river': { locationId: 'NRST1', role: 'tailwater', note: 'USGS 03533000 below Norris has no current IV data — TVA backfills stage/discharge' },
  'hiwassee-river': { locationId: 'HADT1', role: 'tailwater', note: 'Apalachia Dam releases the Hiwassee tailwater' },
  'ocoee-river': { locationId: 'OCBT1', role: 'tailwater', note: 'Ocoee No. 2 dam governs the famous reach' },
  'parksville-tailwater': { locationId: 'OCAT1', role: 'tailwater', note: 'Ocoee No. 1 dam / Parksville Lake' },
  'caney-fork-river': { locationId: 'CEHT1', role: 'tailwater', note: 'USGS 03424010 at the dam has no current IV data — TVA backfills' },
  'elk-river': { locationId: 'TMFT1', role: 'tailwater' },
  'duck-river-tailwater': { locationId: 'NRMT1', role: 'tailwater' },
  'obey-river': { locationId: 'DLHT1', role: 'tailwater' },
};

/**
 * USGS gauge health from the 2026-09-04 site-service audit (all 51 catalog gauge ids,
 * seriesCatalogOutput + hasDataTypeCd=iv; fixture docs/.tmp derived from the live
 * RDB capture). 'live' = had an IV series ending 2026-09-04 (or within ~5 weeks).
 * Used for coverage confidence only — the fetcher still asks for every gauge and
 * reports whatever comes back.
 */
export type GaugeHealth = 'live' | 'no-current-iv' | 'historical-only';

export const USGS_GAUGE_HEALTH: Record<string, { health: GaugeHealth; ivEnd?: string; params?: string[]; note?: string }> = {
  '03486810': { health: 'no-current-iv', note: 'boone-tailwater gauge: absent from the site service IV catalog' },
  '03424010': { health: 'no-current-iv', note: 'Caney Fork at Center Hill Dam: IV series ended 1976 (qw-only site)' },
  '03533000': { health: 'no-current-iv', note: 'Clinch River below Norris Dam: absent from the IV catalog (old series only)' },
  '03487010': { health: 'no-current-iv' },
  '03468510': { health: 'no-current-iv' },
  '03483980': { health: 'no-current-iv' },
  '03484000': { health: 'no-current-iv' },
  '03487602': { health: 'no-current-iv' },
  '03580750': { health: 'no-current-iv' },
  '03539800': { health: 'historical-only', ivEnd: '2026-07-26', note: 'IV series stopped ~5 weeks before the audit' },
  '03564500': { health: 'historical-only', ivEnd: '1994-12-31' },
  '03566000': { health: 'historical-only', ivEnd: '2018-06-05' },
  '03432350': { health: 'live', ivEnd: '2026-09-04', params: ['00060', '00065'], note: 'temperature series ended 2014; flow/stage live' },
  '03556590': { health: 'live', ivEnd: '2026-09-04', params: ['00010'], note: 'temperature only' },
  '03419530': { health: 'live', ivEnd: '2026-09-04', params: ['00060', '00065'] },
  '03421000': { health: 'live', ivEnd: '2026-09-04', params: ['00060', '00065'] },
};

/**
 * Static water → USACE monitor mapping (verified live 2026-09-08 against the
 * Nashville District "Access to Water" reporting API, provider "lrn"; fixtures
 * apps/api/fixtures/USACE/ + .session1-research/usace/fixtures). Mirrors
 * TVA_MONITORS; the hardcoded TSIDs live in usace-provider.ts
 * (USACE_TAILWATER_SERIES) and are referenced here so coverage tooling sees the
 * exact series per monitor. Non-USGS gauge ids are namespaced `usace:{STATION}`
 * in the catalog so they can never collide with (or reach) USGS NWIS.
 *
 * rivergages.mvr.usace.army.mil does NOT carry Nashville District — the A2W
 * reporting API (water.usace.army.mil) is the working source. Old Hickory (OHIT1)
 * and Cheatham (ASHT1) have dead water-temp series and map to no trout catalog
 * water, and Barkley (BARK2) has no temp series and is already covered via TVA —
 * so none of them are registered.
 */
export const USACE_MONITORS: Record<
  string,
  { station: string; series: (typeof USACE_TAILWATER_SERIES)[string]; role: 'tailwater'; note?: string }
> = {
  'caney-fork-river': {
    station: 'CETT1',
    series: USACE_TAILWATER_SERIES.CETT1!,
    role: 'tailwater',
    note: 'Center Hill Dam tailwater at the dam — nearer than USGS 03424860 (Stonewall), which stays wired',
  },
  'obey-river': {
    station: 'DHTT1',
    series: USACE_TAILWATER_SERIES.DHTT1!,
    role: 'tailwater',
    note: 'Dale Hollow Dam tailwater: flow + tail elevation + water temp, all live',
  },
  'stones-river': {
    station: 'JPPT1',
    series: USACE_TAILWATER_SERIES.JPPT1!,
    role: 'tailwater',
    note: 'J. Percy Priest Dam tailwater above the Donelson reach (medium-high confidence mapping)',
  },
  'cumberland-river': {
    station: 'CORT1',
    series: USACE_TAILWATER_SERIES.CORT1!,
    role: 'tailwater',
    note: 'Cordell Hull tailwater — recorded for coverage only; NOT wired into cumberland-river gaugeIds (multi-dam main stem: one upstream dam would misrepresent the segment, same rejection as the TVA main-stem monitors)',
  },
};
