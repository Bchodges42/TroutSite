/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Build the SEEDED evidence ledger: one entry per canonical catalog water
 * (190), carrying identity, catalog-field snapshot, live-TWRA schedule join,
 * forecast mentions, stocking-point candidates, reservoir-list membership,
 * prior research leads, and Fishbrain research leads. Every entry starts
 * headline=unresolved; the adjudication fleet + reviewer fill claims and
 * headlines with claim-specific provenance. Nothing here decides biology.
 *
 *   node packages/content/scripts/opportunity/build-seed.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  REPO_ROOT, ARTIFACT_DIR, loadCatalog, loadScheduleAliases, loadPriorLeads,
  loadFishbrainLeads, scanForecast, buildSchedulePrograms,
} from './lib.mjs';

const catalog = loadCatalog();
// Additional deterministic forecast-scan terms (TWRA's own names for the
// same water). Candidates only — reach applicability is adjudicated by a
// reviewer reading the node in context.
const FORECAST_EXTRA_TERMS = {
  'watauga-lake': ['watauga reservoir', 'watauga lake'],
  'watauga-river': ['watauga river', 'watauga tailwater', 'wilbur'],
  'watauga-river-wilbur-reach': ['wilbur', 'watauga tailwater'],
  'wilbur-lake': ['wilbur'],
  'boone-tailwater': ['boone tailwater', 'boone dam', 'boone'],
  'boone-lake': ['boone lake', 'boone reservoir'],
  'parksville-lake': ['parksville lake', 'parksville reservoir', 'parksville'],
  'parksville-tailwater': ['parksville tailwater', 'ocoee'],
  'duck-river-tailwater': ['normandy', 'duck river tailwater'],
  'normandy-lake': ['normandy lake', 'normandy reservoir', 'normandy'],
  'dale-hollow-lake': ['dale hollow'],
  'obey-river': ['dale hollow tailwater', 'obey river'],
  'cherokee-lake': ['cherokee lake', 'cherokee reservoir'],
  'holston-river': ['holston river', 'cherokee dam', 'cherokee'],
  'fort-patrick-henry-lake': ['fort patrick henry', 'ft patrick henry'],
  'ft-patrick-henry-tailwater': ['patrick henry tailwater', 'patrick henry'],
  'south-holston-lake': ['south holston lake', 'south holston reservoir'],
  'south-holston-river': ['south holston river', 'south holston tailwater', 'south holston'],
  'tellico-lake': ['tellico'],
  'tellico-river': ['tellico river', 'tellico'],
  'chilhowee-lake': ['chilhowee'],
  'calderwood-lake': ['calderwood'],
  'tims-ford-lake': ['tims ford'],
  'elk-river': ['elk river'],
  'elk-river-lower': ['elk river'],
  'caney-fork-river': ['caney fork', 'center hill'],
  'caney-fork-upper': ['caney fork'],
  'center-hill-lake': ['center hill lake', 'center hill reservoir', 'center hill'],
  'hiwassee-river': ['hiwassee', 'appalachia'],
  'clinch-river': ['clinch', 'norris'],
  'melton-hill-lake': ['melton hill'],
  'little-river': ['little river'],
  'buffalo-creek-grainger': ['buffalo creek'],
};


const geo = JSON.parse(readFileSync(join(REPO_ROOT, 'apps', 'web', 'public', 'atlas', 'rivers.geojson'), 'utf8'));
const geoById = new Map(geo.features.map((f) => [f.properties.id, f.properties]));

// Live backbone captures (see captures/source-log.json for URL + retrieval).
const schedule = JSON.parse(readFileSync(join(ARTIFACT_DIR, 'captures', 'twra-schedule.json'), 'utf8')).data;
const recent = JSON.parse(readFileSync(join(ARTIFACT_DIR, 'captures', 'twra-recent-releases.json'), 'utf8')).data ?? [];

const aliases = loadScheduleAliases();
const { bySlug, unmatched } = buildSchedulePrograms(catalog, schedule, aliases);
const priorLeads = loadPriorLeads();
const fishbrain = loadFishbrainLeads();
const forecastMentions = scanForecast(catalog, FORECAST_EXTRA_TERMS);
const forecastBySlug = new Map(forecastMentions.map((f) => [f.slug, f.hits]));

// Reservoir year-round list (TWRA trout page, retrieved 2026-09-22 — see
// captures/twra-trout-page.txt; the page states these are stocked "to provide
// year-round trout fishing opportunities").
const RESERVOIR_YEAR_ROUND = {
  'dale-hollow-lake': 'Rainbow',
  'parksville-lake': 'Rainbow',
  'calderwood-lake': 'Brook, Brown and Rainbow',
  'chilhowee-lake': 'Rainbow',
  'fort-patrick-henry-lake': 'Brown and Rainbow',
  'south-holston-lake': 'Lake and Rainbow',
  'tellico-lake': 'Rainbow (Upper Tellico)',
  'watauga-lake': 'Lake and Rainbow',
};

const pointJoin = JSON.parse(readFileSync(join(REPO_ROOT, 'evidence-work', 'point-join.json'), 'utf8'));

const waters = [];
for (const w of catalog) {
  const d = w.doc;
  const entry = {
    id: w.slug,
    name: d.name,
    waterbodyType: d.waterbodyType,
    regionId: d.regionId ?? null,
    counties: d.hydroIdentity?.counties ?? null,
    hydroIdentity: d.hydroIdentity
      ? { gnisIds: d.hydroIdentity.gnisIds, huc8s: d.hydroIdentity.huc8s }
      : null,
    mapFeature: (() => {
      const p = geoById.get(w.slug);
      if (!p) return { status: 'missing', note: 'no rivers.geojson feature with this id' };
      return {
        status: 'exact',
        geometryType: null, // filled by verify pass
        approximate: p.approximate,
        source: p.source,
        note: null,
      };
    })(),
    catalogFields: {
      species: d.species ?? null,
      fishery: d.fishery ?? null,
      yearRound: d.yearRound ?? null,
      seasonMonths: d.seasonMonths ?? null,
      seasonKind: d.seasonKind ?? null,
      stockingProgram: d.stockingProgram ?? null,
      display: d.display ?? null,
      speciesEvidence: d.speciesEvidence ?? null,
      notes: d.notes ?? null,
    },
    headline: {
      troutOpportunity: 'unresolved',
      warmwaterFocus: null,
      evidenceState: 'unresolved',
      reachScope: null,
      statement: null,
      asOf: null,
    },
    claims: [],
    unresolvedQuestion: null,
    qualifications: [],
    backbone: {
      scheduleProgram: bySlug.get(w.slug)
        ? (({ rows, ...rest }) => ({ ...rest }))(bySlug.get(w.slug))
        : null,
      reservoirYearRoundList: RESERVOIR_YEAR_ROUND[w.slug]
        ? { species: RESERVOIR_YEAR_ROUND[w.slug], source: 'TWRA trout page reservoir section (captures/twra-trout-page.txt), retrieved 2026-09-22' }
        : null,
      forecastMentions: forecastBySlug.get(w.slug) ?? null,
      stockingPointCandidates: pointJoin[w.slug]
        ? { pointCount: pointJoin[w.slug].count, sites: pointJoin[w.slug].sites.slice(0, 5), note: 'GIS points are neither release events nor complete stocked reaches' }
        : null,
      recentReleaseRows: null, // rolling 10-row window kept in meta.recentReleases, not per water
    },
    priorLeads: priorLeads[w.slug] ?? null,
    fishbrainLeads: fishbrain[w.slug] ?? null,
  };
  waters.push(entry);
}

mkdirSync(ARTIFACT_DIR, { recursive: true });
const out = {
  meta: {
    generatedAt: new Date().toISOString(),
    baseCommit: 'd1e48d1670a348ffc3b68d543596265f92d484b2',
    branch: 'feat/evidence-backed-fisheries-20260922',
    questionModel: 'angling opportunity at a stated water/reach (audit recommendation B: reach fishery + stocking calendar + conditions)',
    recentReleases: recent,
    truthModel: {
      headlines: ['year-round-trout', 'seasonal-stocked-trout', 'warmwater-focus', 'mixed', 'unresolved'],
      evidenceStates: ['documented', 'limited', 'historical', 'conflicting', 'unresolved'],
      rules: [
        'Unresolved is a first-class result; "no trout" is a strong exclusion claim requiring scoped positive evidence.',
        'Warmwater focus is a positive claim and may coexist with seasonal trout.',
        'A reservoir is a trout fishery, not a trout stream; lake arms/depth never inherit tailwater evidence.',
        'A stocking schedule is a plan; the recent-release report is a rolling window; a GIS point is neither.',
        'Designations (TS/NRTS) are legal boundaries, never a fish census.',
      ],
    },
    sourceLog: 'captures/source-log.json',
  },
  scheduleJoinStats: { matchedWaters: bySlug.size, unmatchedRows: unmatched.length },
  unmatchedScheduleRows: unmatched,
  waters,
};
writeFileSync(join(ARTIFACT_DIR, 'ledger.seed.json'), JSON.stringify(out, null, 2));
console.log('seeded ledger written:', waters.length, 'waters');
console.log('schedule join: matched waters =', bySlug.size, '| unmatched rows =', unmatched.length);
console.log('forecast mentions:', forecastMentions.length, 'waters');
console.log('prior leads present:', Object.keys(priorLeads).length, '| fishbrain leads:', Object.keys(fishbrain).length);
if (unmatched.length) console.log('top unmatched:', unmatched.slice(0, 10).map((u) => `${u.location}|${u.county} (${u.type}: ${u.how})`).join(' ;; '));
