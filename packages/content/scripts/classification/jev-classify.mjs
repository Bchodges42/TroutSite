/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Jev species/fishery classifier for Tennessee waters.
 *
 * This is an advisory classifier. It asks one narrow Choice question for the
 * three-way fishery category and companion Noul/Score questions for month
 * presence and evidence strength. It never writes catalog YAML and never
 * treats a Fishbrain catch count as a biological abundance estimate.
 *
 * Evidence order is made explicit in the state so the model can reconcile:
 *   1. authored catalog + audited sourcing ledger + current TWRA feed;
 *   2. canonical agency-backed species occurrences when present;
 *   3. Fishbrain aggregate discovery, filtered to freshwater species and
 *      marked provisional, especially for broad/segment-review pages.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALIASES,
  LEDGER_DIR,
  REPO_ROOT,
  eventsFromGeojson,
  loadCatalog,
  loadStockingGeojson,
  resolveEvent,
  countiesOf,
} from './lib.mjs';
import { loadSchedule, buildSchedulePrograms, loadScheduleAliases } from './stocking-schedule.mjs';
import { readKey } from './judge.mjs';

export const MODEL = 'jev-latest';
export const STATE_SCHEMA_VERSION = 'trout/jev-classification-state/2';
export const FISHBRAIN_PATH = join(REPO_ROOT, 'packages', 'content', 'research', 'fishbrain-tn-graphql-discovery.json');
export const FISHBRAIN_STANDARD_PATH = join(REPO_ROOT, 'packages', 'content', 'research', 'fishbrain-tn-graphql-standard-discovery.json');
export const COMPOSITE_PATH = join(REPO_ROOT, 'packages', 'content', 'research', 'CLASSIFICATION-COMPOSITE-2026-09-17.json');
export const SPECIES_OCCURRENCES_PATH = join(REPO_ROOT, 'packages', 'content', 'data', 'species-occurrences.json');
export const REVIEW_LABELS_PATH = join(REPO_ROOT, 'packages', 'content', 'research', 'jev-tn-review-labels.json');

/**
 * Three-source composite (official schedule + ArcGIS feed + warmwater
 * workbook, reconciled with documented precedence). STRICT WHITELIST when
 * building state: only direct source facts and their source-derived program
 * union may enter. `recommendedClass`, `confidence`, `flags`, `catalog`, and
 * `jev` are excluded because the composite's own methodology says those fields
 * use the prior Jev answer. Reintroducing any of them would be answer leakage.
 */
function compositeEvidenceFor(slug) {
  const entry = COMPOSITE_BY_SLUG.get(slug);
  if (!entry) {
    return { available: false, sourceRole: 'no composite row for this water' };
  }
  const sources = entry.sources ?? {};
  return {
    available: true,
    sourceRole: 'direct facts from the official schedule, live stocking feed, and warmwater workbook, reconciled for water identity; authoritative for stocking-program identity and timing only, not habitat survival. All prior-model-derived composite fields are excluded.',
    programClasses: entry.programClasses ?? [],
    modifiers: entry.modifiers ?? [],
    seasonMonths: entry.seasonMonths ?? null,
    directSources: {
      officialSchedule: sources.schedule_xlsx ? {
        types: sources.schedule_xlsx.types ?? [],
        months: sources.schedule_xlsx.months ?? null,
        rows: sources.schedule_xlsx.rows ?? null,
        lastStockedDay: sources.schedule_xlsx.lastStockedDay ?? null,
        nextTbd: sources.schedule_xlsx.nextTbd ?? null,
      } : null,
      liveStockingFeed: sources.arcgis_feed ? {
        programs: sources.arcgis_feed.programs ?? [],
        programPoints: sources.arcgis_feed.programPoints ?? {},
        waterClasses: sources.arcgis_feed.waterClasses ?? [],
        stockingPoints: sources.arcgis_feed.stockingPoints ?? null,
      } : null,
      warmwaterStocking: sources.warmwater_xlsx ? {
        species: sources.warmwater_xlsx.species ?? [],
        eventCount: sources.warmwater_xlsx.eventCount ?? null,
      } : null,
    },
  };
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Stable API keys; use CATEGORY_LABELS when presenting them to people. */
export const CATEGORY_LABELS = {
  'trout-stream-year-round': 'Year Round - Trout Stream (tailwaters, wild trout waters)',
  'warmwater-yearly-stocked-winter-trout': 'Warm Water - Seasonal/Winter Stocking Program',
  'warmwater-no-trout': 'Warm Water - No Trout',
};

/**
 * Category semantics — OWNER RULING 2026-09-17 (supersedes the earlier
 * "system identity" reading): "year round" means TROUT PRESENT YEAR-ROUND —
 * a year-round cold controlled water (tailwater releases, wild population).
 * A water stocked only in some season is a Warmwater with Winter/Seasonal
 * trout stocking, whether the program runs in winter (put-and-take lakes) or
 * in spring/fall (seasonal creeks, Delayed Harvest). The UI shows stockings
 * and schedules on top, so lumping seasonal programs is fine.
 */
export const CATEGORY_CRITERIA = {
  'trout-stream-year-round':
    'Evidence supports freshwater trout remaining in this exact catalog segment through the entire year because habitat supports survival: for example a wild/self-sustaining population, documented holdover, a cold headwater, or a cold controlled release. Regular stocking does not disqualify the water and can strengthen the case when trout hold over between stockings. A long or year-round stocking calendar is program evidence, not survival proof by itself. A few catches, a trout regulation, or a schedule label alone is not enough.',
  'warmwater-yearly-stocked-winter-trout':
    'Evidence supports a recurring trout stocking program, but does not support trout persisting in this exact segment through the whole year. This includes winter or spring put-and-take programs and Delayed Harvest windows on habitat that becomes unsuitable or loses trout seasonally. Some fish may hold over beyond a stocking date; the distinction is that year-round population presence is not supported. A schedule called Seasonal or Spring proves a program, not warm habitat by itself.',
  'warmwater-no-trout':
    'Evidence supports neither a recurring trout stocking program nor year-round trout presence in this exact segment. This is a fishery classification, not a claim that no individual trout species can occur: a reservoir with incidental or non-program lake trout can still belong here. Missing Fishbrain data is not negative evidence; when official and audited evidence are also thin, reduce confidence instead of treating missing data as proof.',
};



/** Stable API keys; use CATEGORY_LABELS when presenting them to people. */


export const FRESHWATER_TROUT_NAMES = new Set([
  'rainbow trout',
  'brown trout',
  'brook trout',
  'tiger trout',
  'cutthroat trout',
  'lake trout',
  'golden trout',
]);

// These are excluded from trout evidence in a Tennessee-only product. Keep
// the exclusion conservative: freshwater drum, freshwater eel, and other
// non-trout Tennessee species are not marine trout evidence and remain in the
// warmwater context instead of being silently discarded.
export const MARINE_OR_BRACKISH_NAMES = new Set([
  'sea trout',
  'spotted seatrout',
  'steelhead',
  'steelhead trout',
  'red drum',
  'black drum',
  'bluefish',
  'gafftopsail sea catfish',
]);

const CATALOG = loadCatalog();
const CATALOG_BY_SLUG = new Map(CATALOG.map((water) => [water.slug, water]));

const ledgerDocument = JSON.parse(readFileSync(join(LEDGER_DIR, 'ledger', 'waters.json'), 'utf8'));
const ledgerWaters = Array.isArray(ledgerDocument) ? ledgerDocument : (ledgerDocument.waters ?? []);
const LEDGER_BY_SLUG = new Map(ledgerWaters.map((water) => [water.slug, water]));

const fishbrainDocuments = [
  { path: FISHBRAIN_PATH, document: readJsonIfPresent(FISHBRAIN_PATH, { records: [] }) },
  { path: FISHBRAIN_STANDARD_PATH, document: readJsonIfPresent(FISHBRAIN_STANDARD_PATH, { records: [] }) },
].filter(({ document }) => Array.isArray(document.records));
const fishbrainDocument = fishbrainDocuments[0]?.document ?? { records: [] };
const reviewLabelsDocument = readJsonIfPresent(REVIEW_LABELS_PATH, { labels: {} });
const REVIEW_LABELS_BY_SLUG = new Map(Object.entries(reviewLabelsDocument.labels ?? {}));
const FISHBRAIN_BY_SLUG = new Map();
for (const [index, dataset] of fishbrainDocuments.entries()) {
  const tier = index === 0 ? 'featured' : 'standard';
  for (const record of dataset.document.records ?? []) {
    if (record.catalogWaterId && !FISHBRAIN_BY_SLUG.has(record.catalogWaterId)) {
      FISHBRAIN_BY_SLUG.set(record.catalogWaterId, { record, dataset: dataset.document, tier });
    }
  }
}
const FISHBRAIN_REVIEW_BY_SLUG = new Map();
for (const dataset of fishbrainDocuments) {
  for (const review of dataset.document.rejectedOrNeedsReview ?? []) {
    const list = FISHBRAIN_REVIEW_BY_SLUG.get(review.catalogWaterId) ?? [];
    list.push(review.reason ?? 'Fishbrain water-to-segment mapping needs review.');
    FISHBRAIN_REVIEW_BY_SLUG.set(review.catalogWaterId, list);
  }
}

const occurrencesDocument = readJsonIfPresent(SPECIES_OCCURRENCES_PATH, null);
const OCCURRENCES_BY_SLUG = new Map();
const SPECIES_BY_ID = new Map((occurrencesDocument?.species ?? []).map((species) => [species.id, species]));
const SOURCES_BY_ID = new Map((occurrencesDocument?.sources ?? []).map((source) => [source.id, source]));
for (const occurrence of occurrencesDocument?.occurrences ?? []) {
  for (const slug of occurrence.waterIds ?? []) {
    const list = OCCURRENCES_BY_SLUG.get(slug) ?? [];
    list.push(occurrence);
    OCCURRENCES_BY_SLUG.set(slug, list);
  }
}

const stockingFeed = eventsFromGeojson(loadStockingGeojson());
const EVENTS_BY_SLUG = new Map();
for (const event of stockingFeed.events) {
  const resolution = resolveEvent(event, CATALOG, { ...ALIASES, ...loadScheduleAliases() });
  if (resolution.slug) {
    const list = EVENTS_BY_SLUG.get(resolution.slug) ?? [];
    list.push(event);
    EVENTS_BY_SLUG.set(resolution.slug, list);
  }
}

const COMPOSITE_DOCUMENT = readJsonIfPresent(COMPOSITE_PATH, { waters: {} });
const COMPOSITE_BY_SLUG = new Map(Object.entries(COMPOSITE_DOCUMENT.waters ?? {}));
const scheduleDocument = loadSchedule();
const SCHEDULE_BY_SLUG = buildSchedulePrograms(CATALOG, scheduleDocument.rows ?? [], resolveEvent, { ...ALIASES, ...loadScheduleAliases() }).bySlug;

function readJsonIfPresent(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

function normalizedSpeciesName(name) {
  return String(name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function fishbrainSpeciesRole(name) {
  const normalized = normalizedSpeciesName(name);
  if (FRESHWATER_TROUT_NAMES.has(normalized)) return 'freshwater-trout';
  if (MARINE_OR_BRACKISH_NAMES.has(normalized)) return 'marine-or-brackish-excluded';
  return 'freshwater-context-or-unclassified';
}

function fishbrainDatasetSummary(document) {
  return {
    schema: document.schema ?? null,
    stateId: document.stateId ?? null,
    collectedAt: document.collectedAt ?? null,
    scope: document.scope ?? null,
    collectionNote: document.collectionNote ?? null,
  };
}

function fishbrainEvidence(slug) {
  const entry = FISHBRAIN_BY_SLUG.get(slug);
  if (!entry) {
    return {
      available: false,
      tier: 'absent',
      dataset: fishbrainDatasetSummary(fishbrainDocument),
      datasets: fishbrainDocuments.map(({ document }) => fishbrainDatasetSummary(document)),
      sourceRole: 'not available for this catalog water',
      caveat: 'No Fishbrain discovery record is not evidence that trout are absent.',
      freshwaterTrout: [],
      excludedMarineOrBrackish: [],
      topFreshwaterSpecies: [],
    };
  }

  const { record, dataset, tier } = entry;
  const freshwaterTrout = [];
  const excludedMarineOrBrackish = [];
  const topFreshwaterSpecies = [];
  for (const species of [...(record.species ?? [])].sort((a, b) => (b.catchesCount ?? 0) - (a.catchesCount ?? 0))) {
    const item = {
      name: String(species.displayName ?? ''),
      catches: Number(species.catchesCount ?? 0),
    };
    const role = fishbrainSpeciesRole(item.name);
    if (role === 'freshwater-trout') freshwaterTrout.push(item);
    else if (role === 'marine-or-brackish-excluded') excludedMarineOrBrackish.push(item);
    else if (topFreshwaterSpecies.length < 30) topFreshwaterSpecies.push(item);
  }

  return {
    available: true,
    tier,
    dataset: fishbrainDatasetSummary(dataset),
    datasets: fishbrainDocuments.map(({ document }) => fishbrainDatasetSummary(document)),
    datasetClassification: dataset.scope?.classification ?? null,
    sourceRole: record.matchStatus === 'not-found'
      ? 'no matching public Fishbrain page found; this is missing discovery evidence, not a biological negative'
      : 'discovery-only aggregate public catches; never biological truth',
    pageUrl: record.fishbrainPageUrl ?? null,
    pageName: record.fishbrainWaterName ?? null,
    loggedCatches: record.fishbrainLoggedCatches == null ? null : Number(record.fishbrainLoggedCatches),
    matchStatus: record.matchStatus ?? 'unknown',
    mappingNote: record.mappingNote ?? null,
    segmentReviewReasons: FISHBRAIN_REVIEW_BY_SLUG.get(slug) ?? [],
    freshwaterTrout,
    freshwaterTroutCatchTotal: freshwaterTrout.reduce((sum, item) => sum + item.catches, 0),
    excludedMarineOrBrackish,
    topFreshwaterSpecies,
    interpretationRule: record.matchStatus === 'not-found'
      ? 'No matching Fishbrain page is a discovery gap only; it cannot establish that trout are absent.'
      : 'A catch count is a report-volume signal only. It cannot establish abundance, residency, a trout system, or year-round presence; broad/segment-review pages are especially weak evidence.',
  };
}

/**
 * The owner-reviewed category for a slug, or null. CALIBRATION/OVERRIDE DATA:
 * never placed in the model state (that would leak the answer key — the
 * 2026-09-17 audit found exactly that in the prior implementation). Applied
 * in code AFTER the call; validators must report raw and effective separately.
 */
export function reviewedCategory(slug) {
  return REVIEW_LABELS_BY_SLUG.get(slug)?.category ?? null;
}

/** Production override: the reviewed label wins when one exists; otherwise
 * the model's raw choice stands. */
export function effectiveCategory(slug, rawChoice) {
  return reviewedCategory(slug) ?? rawChoice ?? null;
}

function catalogEvidence(slug) {
  const water = CATALOG_BY_SLUG.get(slug);
  if (!water) return { available: false };
  const doc = water.doc ?? {};
  return {
    available: true,
    sourceRole: 'existing authored product metadata. Classification-like fields are claims to corroborate, not calibration truth or direct biological evidence; notes and cited sources may be stronger when they contain specific facts.',
    id: slug,
    name: doc.name ?? slug,
    stateId: doc.stateId ?? null,
    waterbodyType: doc.waterbodyType ?? null,
    counties: countiesOf(doc),
    authoredClaims: {
      fishery: doc.fishery ?? null,
      species: doc.species ?? null,
      targetSpecies: doc.targetSpecies ?? [],
      stockingProgram: doc.stockingProgram ?? null,
      yearRound: doc.yearRound ?? null,
      seasonMonths: doc.seasonMonths ?? null,
      seasonKind: doc.seasonKind ?? null,
    },
    documentedEvidence: {
      speciesEvidence: (doc.speciesEvidence ?? []).slice(0, 10),
      notes: String(doc.notes ?? '').slice(0, 1800),
      officialSources: (doc.officialSources ?? []).slice(0, 10),
    },
  };
}

function ledgerEvidence(slug) {
  const water = LEDGER_BY_SLUG.get(slug);
  if (!water) return { available: false };
  const slots = {};
  for (const label of ['Class', 'Species', 'Stocking', 'Regulations', 'FLAG', 'Note']) {
    const rows = (water.slots?.[label] ?? []).slice(0, 4);
    if (rows.length) {
      slots[label] = rows.map((row) => ({
        value: String(row.value ?? '').slice(0, 1200),
        noneFound: Boolean(row.noneFound),
        annotation: row.annotation ?? null,
        urls: row.urls ?? [],
      }));
    }
  }
  return {
    available: true,
    researchVerdict: water.class ?? null,
    completeness: water.completeness ?? {},
    gaugeActive: Boolean(water.gaugeActive),
    identity: water.identity ?? null,
    slots,
    sourceRole: 'human-audited research ledger. Attributed slot records and explicit searches with no finding are evidence; researchVerdict is an analyst synthesis to verify, not calibration truth.',
  };
}

function canonicalSpeciesEvidence(slug) {
  const rows = OCCURRENCES_BY_SLUG.get(slug) ?? [];
  return {
    available: Boolean(occurrencesDocument),
    sourceRole: occurrencesDocument ? 'canonical agency-backed occurrence catalog' : 'optional canonical occurrence catalog not present in this checkout',
    records: rows.map((row) => ({
      species: (row.speciesIds ?? []).map((id) => SPECIES_BY_ID.get(id)?.displayName ?? id),
      evidenceType: row.evidenceType ?? null,
      confidence: row.confidence ?? null,
      seasonMonths: row.seasonMonths ?? null,
      source: SOURCES_BY_ID.get(row.sourceId)?.url ?? row.sourceId ?? null,
    })),
  };
}

function stockingEvidence(slug) {
  const events = EVENTS_BY_SLUG.get(slug) ?? [];
  const schedule = SCHEDULE_BY_SLUG.get(slug);
  return {
    sourceRole: 'current TWRA trout stocking feed; deduplicated access-point events resolved to this catalog water',
    feedRows: stockingFeed.events.length,
    unparsedSpeciesRows: stockingFeed.unparsedSpeciesRows,
    matchedEvents: events.map((event) => ({
      water: event.water,
      county: event.county,
      program: event.program,
      waterClass: event.waterClass,
      species: event.species,
      impliedMonths: event.windowMonths,
      accessSites: event.accessSites,
      points: event.points,
    })),
    officialSchedule: schedule
      ? {
          available: true,
          sourceRole: 'official TWRA stocking schedule workbook: program types, month windows, exact stocking dates — authoritative over the feed\'s coarse season labels',
          programs: schedule.types,
          programMeaning: schedule.meaning,
          months: schedule.months,
          windowPinned: schedule.months !== null,
          lastStockedDay: schedule.lastStockedDay,
          nextScheduledDay: schedule.nextTbd,
          scheduleRows: schedule.rowCount,
        }
      : { available: false, sourceRole: 'this water has no resolvable row in the official schedule workbook (the schedule often names access points, not waters); absence is not a program negative' },
    absenceMeaning: 'No matching current feed event is only a feed-level negative; it does not prove no trout have ever occurred.',
  };
}

export function normalizeMonth(month = new Date().getMonth() + 1) {
  if (month instanceof Date) return month.getMonth() + 1;
  if (typeof month === 'string') {
    const asNumber = Number(month);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 12) return asNumber;
    const index = MONTHS.findIndex((name) => name.toLowerCase() === month.trim().toLowerCase());
    if (index >= 0) return index + 1;
  }
  if (Number.isInteger(month) && month >= 1 && month <= 12) return month;
  throw new RangeError(`month must be 1-12 or a month name; got ${String(month)}`);
}

export function questionsForMonth(month = new Date().getMonth() + 1) {
  const monthNumber = normalizeMonth(month);
  const monthName = MONTHS[monthNumber - 1];
  return {
    category: {
      type: 'choice',
      instructions: [
        'Classify this one Tennessee water into exactly one fishery category by resolving two facts: (A) whether trout remain in this exact segment through the whole year, and (B) whether a recurring trout stocking program exists.',
        'Mapping: A=true means trout-stream-year-round regardless of stocking cadence; A=false and B=true means warmwater-yearly-stocked-winter-trout; A=false and B=false means warmwater-no-trout. If A or B is genuinely uncertain, spread probability across the affected categories and reduce confidence.',
        'The category is annual and must not flip merely because the requested month is outside a stocking window. Use current_month_trout and the annual month questions for month-level presence.',
        'Use direct agency/audited facts first. Existing catalog fields and analyst researchVerdict values are claims to corroborate, not answer keys. Fishbrain is aggregate user catch volume, not abundance, residency, or absence evidence.',
        'TWRA program names such as Spring, Seasonal, Tailwater, Reservoir, Winter, Weekly, and Delayed Harvest establish program identity or timing only. They do not by themselves prove or disprove year-round habitat survival. A long stocking season is not automatic year-round habitat; a short stocking season does not refute documented wild fish or holdover.',
        'A river with trout catches is not automatically a year-round trout stream. Do not call it year-round without biological, habitat, coldwater-management, or holdover evidence that applies to the exact segment.',
        'Judge the exact segment named in water.name/id: a reservoir, its tailwater, and an upstream river reach are different systems. Do not transfer a lake label to its tailwater or a tailwater label to its lake. A lake trout in a reservoir is freshwater species evidence, but it does not by itself make the reservoir a trout stream.',
        'On "year round": apply the owner\'s habitat-survival test. The evidence must support trout presence through every season, including the warmest months; a management designation alone is not enough.',
        'Ignore marine/brackish species explicitly marked excluded. In particular, Sea trout, Spotted seatrout, Red drum, Black drum, Bluefish, Gafftopsail sea catfish, and Steelhead are not Tennessee freshwater-trout evidence.',
        'When state.evidence.composite is available, its reconciled direct-source facts may settle program identity and timing. The composite intentionally excludes its prior Jev answer and cannot settle habitat survival.',
        'If sources conflict or are too thin, spread probability across the plausible categories and reduce confidence. Do not turn missing evidence into certainty.',
      ],
      criteria: CATEGORY_CRITERIA,
    },
    year_round_trout_presence: {
      type: 'noul',
      instructions: 'Does credible evidence support freshwater trout remaining in this exact catalog segment through the entire year, including the warmest season? Stocking cadence alone is not proof. When survival evidence is missing or conflicted, stay uncertain rather than treating missing evidence as false.',
      criteria: {
        true: 'Direct biological, habitat, coldwater-management, or holdover evidence supports trout presence through all seasons in the exact segment.',
        false: 'Direct evidence supports seasonal loss or unsuitable warm-season habitat, or strong exact-segment evidence supports no year-round trout presence.',
      },
    },
    recurring_trout_program: {
      type: 'noul',
      instructions: 'Does credible evidence support a recurring trout stocking program for this exact catalog segment? A single historical event or a sibling-water row is insufficient. Missing discovery data is uncertainty, not false.',
      criteria: {
        true: 'An official recurring schedule/program or multiple attributable stocking records resolve to the exact segment.',
        false: 'Authoritative or audited evidence supports no recurring trout program for the exact segment.',
      },
    },
    current_month_trout: {
      type: 'noul',
      instructions: `Are freshwater trout normally present in this exact segment during the requested month, ${monthName} (month ${monthNumber})? This is presence, not catchability. Use the requested month in state.requestedMonth. A year-round wild/coldwater system can be true in every month; a seasonal program is true only during supported stocking/holdover months. Fishbrain-only catch counts do not prove the month. If evidence cannot resolve the month, stay uncertain rather than treating missing evidence as absence.`,
      criteria: {
        true: 'Credible evidence supports freshwater trout being present during this specific month in a normal year.',
        false: 'Credible evidence supports trout being absent during this month or places the month outside a documented presence/holdover window.',
      },
    },
    ...Object.fromEntries(MONTHS.map((name, index) => [`month_${name}`, {
      type: 'noul',
      instructions: `Are freshwater trout normally present in this exact segment during ${name} (month ${index + 1})? This is presence, not catchability. Apply the same year-round-survival versus seasonal-program distinction; do not infer presence from Fishbrain catch volume alone, and do not turn missing month evidence into absence.`,
      criteria: {
        true: 'Credible evidence supports freshwater trout being present during this month.',
        false: 'Credible evidence supports absence during this month or places it outside a documented presence/holdover window.',
      },
    }])),
    evidence_quality: {
      type: 'score',
      instructions: 'How strong and decision-ready is the evidence for the category and month judgments, considering source authority, water-segment identity, and whether the evidence distinguishes resident trout from seasonal stocking?',
      criteria: [
        'No usable direct evidence; only absence, vague labels, or unverified claims.',
        'Weak/provisional evidence, such as Fishbrain discovery or a broad page whose segment does not match exactly.',
        'Useful evidence: a current stocking record or one attributable agency record, with some remaining uncertainty.',
        'Strong evidence: multiple attributable agency/audited records that agree on the water identity, fishery type, and season/year-round status.',
      ],
    },
  };
}

// Kept as an export for callers that only inspect the request definition. The
// live call path always regenerates questions for its explicit/requested month.
export const QUESTIONS = questionsForMonth(1);

/**
 * Build one structured TypeSafe state. `month` is explicit so callers can
 * replay a historical/current-month decision deterministically.
 */
export function evidenceState(slug, { month = new Date().getMonth() + 1 } = {}) {
  const monthNumber = normalizeMonth(month);
  const catalog = catalogEvidence(slug);
  return {
    schema: STATE_SCHEMA_VERSION,
    task: 'Tennessee-only freshwater fishery classification for Trout; return advisory probabilities, not a catalog write.',
    requestedMonth: {
      number: monthNumber,
      name: MONTHS[monthNumber - 1],
      meaning: 'Use this month for current_month_trout. Annual month questions may use all twelve months.',
    },
    water: {
      id: slug,
      name: catalog.name ?? slug,
      stateId: catalog.stateId ?? 'TN',
      waterbodyType: catalog.waterbodyType ?? null,
      counties: catalog.counties ?? [],
    },
    evidence: {
      catalog,
      auditedLedger: ledgerEvidence(slug),
      twraStocking: stockingEvidence(slug),
      canonicalSpecies: canonicalSpeciesEvidence(slug),
      composite: compositeEvidenceFor(slug),
      fishbrainDiscovery: fishbrainEvidence(slug),
    },
    safeguards: [
      'Only Tennessee freshwater fishery evidence counts for trout classification.',
      'A trout species name in a public catch aggregate is not proof of a trout system.',
      'A river with a small or moderate trout catch count may be winter-stocked or a broad-page artifact; it is not year-round without direct year-round evidence.',
      'Do not confuse a reservoir with its tailwater or a broad Fishbrain page with the catalog segment.',
      'A lake trout in a reservoir does not automatically make that reservoir a trout stream.',
      'Catalog fishery, species, stockingProgram, and yearRound fields are authored claims to corroborate, not answer keys.',
      'Stocking-program names and months prove program activity, not year-round habitat survival.',
      'The composite state contains direct source facts only; its prior Jev answer, model-influenced recommendation, confidence, and flags are excluded.',
      'No answer is a direct catalog change; low confidence or source conflict requires review.',
    ],
  };
}

/**
 * Post-hoc consistency check across the independent category, two decision
 * axes, current-month answer, and twelve annual month Nouls. The answers never
 * silently override one another; contradictions are made visible for review.
 */
export function categoryMonthConsistency(category, monthNouls, {
  yearRoundPresence = null,
  recurringProgram = null,
  currentMonthTrout = null,
  requestedMonth = null,
} = {}) {
  const monthValues = Object.values(monthNouls ?? {}).filter((v) => Number.isFinite(v));
  const monthsTrue = monthValues.filter((v) => v >= 0.5).length;
  const monthsStrongTrue = monthValues.filter((v) => v >= 0.67).length;
  const monthsStrongFalse = monthValues.filter((v) => v <= 0.33).length;
  const flags = [];
  if (category === 'warmwater-no-trout' && monthsStrongTrue > 0) {
    flags.push(`warmwater-no-trout but ${monthsTrue}/12 months are at least 0.5 (${monthsStrongTrue} strongly present) — category or month answers need review`);
  }
  if (category === 'warmwater-yearly-stocked-winter-trout' && monthsStrongTrue >= 10) {
    flags.push(`seasonal/winter-stocked but ${monthsTrue}/12 months are at least 0.5 (${monthsStrongTrue} strongly present) — confirm this is not actually year-round`);
  }
  if (category === 'trout-stream-year-round' && monthValues.length === 12 && monthsStrongFalse > 0) {
    flags.push(`trout-stream-year-round but only ${monthsTrue}/12 months are at least 0.5 (${monthsStrongFalse} strongly absent) — category or month answers need review`);
  }
  if (Number.isFinite(yearRoundPresence)) {
    if (category === 'trout-stream-year-round' && yearRoundPresence <= 0.33) {
      flags.push(`trout-stream-year-round but year_round_trout_presence=${yearRoundPresence} — decision-axis contradiction`);
    } else if (category !== 'trout-stream-year-round' && yearRoundPresence >= 0.67) {
      flags.push(`${category} but year_round_trout_presence=${yearRoundPresence} — decision-axis contradiction`);
    }
  }
  if (Number.isFinite(recurringProgram)) {
    if (category === 'warmwater-yearly-stocked-winter-trout' && recurringProgram <= 0.33) {
      flags.push(`seasonal/winter-stocked but recurring_trout_program=${recurringProgram} — decision-axis contradiction`);
    } else if (category === 'warmwater-no-trout' && recurringProgram >= 0.67) {
      flags.push(`warmwater-no-trout but recurring_trout_program=${recurringProgram} — decision-axis contradiction`);
    }
  }
  if (Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 && Number.isFinite(currentMonthTrout)) {
    const annual = monthNouls?.[MONTHS[requestedMonth - 1]];
    if (Number.isFinite(annual) && Math.abs(currentMonthTrout - annual) >= 0.34) {
      flags.push(`current_month_trout=${currentMonthTrout} but month_${MONTHS[requestedMonth - 1]}=${annual} — duplicate month answers disagree`);
    }
  }
  return { monthsTrue, monthsStrongTrue, monthsStrongFalse, monthsAnswered: monthValues.length, flags };
}

export async function callJev(state, { month, attempt = 1 } = {}) {
  const key = readKey();
  if (!key) throw new Error('TYPESAFE_API_KEY not set (gitignored .env)');
  const requestedMonth = month ?? state?.requestedMonth?.number ?? new Date().getMonth() + 1;
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state,
      model: MODEL,
      questions: questionsForMonth(requestedMonth),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if ((response.status === 429 || response.status === 529) && attempt <= 4) {
    const retryHeader = Number(response.headers.get('retry-after'));
    const retryMs = Number.isFinite(retryHeader) && retryHeader > 0
      ? Math.min(retryHeader * 1000, 30_000)
      : Math.min(1000 * 2 ** (attempt - 1), 30_000);
    await new Promise((resolve) => setTimeout(resolve, retryMs));
    return callJev(state, { month: requestedMonth, attempt: attempt + 1 });
  }
  if (!response.ok) throw new Error(`typesafe ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

export function categoryAnswer(response) {
  const answer = response?.answers?.category;
  return {
    choice: answer?.choice ?? null,
    probabilities: answer?.probabilities ?? {},
    confidence: answer?.confidence ?? 0,
    label: answer?.choice ? CATEGORY_LABELS[answer.choice] ?? answer.choice : null,
    yearRoundPresence: response?.answers?.year_round_trout_presence?.noul ?? null,
    recurringProgram: response?.answers?.recurring_trout_program?.noul ?? null,
    currentMonthTrout: response?.answers?.current_month_trout?.noul ?? null,
    evidenceQuality: response?.answers?.evidence_quality?.score ?? null,
    model: response?.model ?? MODEL,
  };
}

export function fishbrainRecordCount() {
  return fishbrainDocuments.reduce((total, { document }) => total + (document.records?.length ?? 0), 0);
}

export function fishbrainCatalogSlugs() {
  return [...FISHBRAIN_BY_SLUG.keys()];
}
