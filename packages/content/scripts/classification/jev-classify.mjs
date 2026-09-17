#!/usr/bin/env node
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
import { readKey } from './judge.mjs';

export const MODEL = 'jev-latest';
export const FISHBRAIN_PATH = join(REPO_ROOT, 'packages', 'content', 'research', 'fishbrain-tn-graphql-discovery.json');
export const SPECIES_OCCURRENCES_PATH = join(REPO_ROOT, 'packages', 'content', 'data', 'species-occurrences.json');

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Stable API keys; use CATEGORY_LABELS when presenting them to people. */
export const CATEGORY_LABELS = {
  'trout-stream-year-round': 'Trout Stream - year round',
  'warmwater-yearly-stocked-winter-trout': 'Warm water - Yearly stocked winter trout',
  'warmwater-no-trout': 'warm water(no trout)',
};

export const CATEGORY_CRITERIA = {
  'trout-stream-year-round':
    'A freshwater Tennessee stream or tailwater with credible agency or audited evidence of a self-sustaining/wild trout population or a coldwater management regime that keeps catchable trout present throughout the year. A few trout catches, a trout regulation, or a winter stocking event alone is not enough.',
  'warmwater-yearly-stocked-winter-trout':
    'A warmwater-first Tennessee water with a recurring or clearly documented winter trout stocking program. Trout may be catchable during the stocking window, but the evidence does not establish a year-round trout system. A TWRA winter-program record is stronger than Fishbrain counts; one historic catch is not a stocking program.',
  'warmwater-no-trout':
    'A warmwater Tennessee water with no credible resident trout population and no current/recurring trout stocking program. Fishbrain absence is not proof by itself, but missing evidence should lower confidence rather than manufacture a trout claim.',
};

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

const fishbrainDocument = readJsonIfPresent(FISHBRAIN_PATH, { records: [] });
const FISHBRAIN_BY_SLUG = new Map();
for (const record of fishbrainDocument.records ?? []) {
  if (record.catalogWaterId && !FISHBRAIN_BY_SLUG.has(record.catalogWaterId)) {
    FISHBRAIN_BY_SLUG.set(record.catalogWaterId, record);
  }
}
const FISHBRAIN_REVIEW_BY_SLUG = new Map();
for (const review of fishbrainDocument.rejectedOrNeedsReview ?? []) {
  const list = FISHBRAIN_REVIEW_BY_SLUG.get(review.catalogWaterId) ?? [];
  list.push(review.reason ?? 'Fishbrain water-to-segment mapping needs review.');
  FISHBRAIN_REVIEW_BY_SLUG.set(review.catalogWaterId, list);
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
  const resolution = resolveEvent(event, CATALOG, ALIASES);
  if (resolution.slug) {
    const list = EVENTS_BY_SLUG.get(resolution.slug) ?? [];
    list.push(event);
    EVENTS_BY_SLUG.set(resolution.slug, list);
  }
}

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

function fishbrainEvidence(slug) {
  const record = FISHBRAIN_BY_SLUG.get(slug);
  if (!record) {
    return {
      available: false,
      dataset: {
        schema: fishbrainDocument.schema ?? null,
        stateId: fishbrainDocument.stateId ?? null,
        collectedAt: fishbrainDocument.collectedAt ?? null,
        collectionNote: fishbrainDocument.collectionNote ?? null,
      },
      sourceRole: 'not available for this catalog water',
      caveat: 'No Fishbrain discovery record is not evidence that trout are absent.',
      freshwaterTrout: [],
      excludedMarineOrBrackish: [],
      topFreshwaterSpecies: [],
    };
  }

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
    dataset: {
      schema: fishbrainDocument.schema ?? null,
      stateId: fishbrainDocument.stateId ?? null,
      collectedAt: fishbrainDocument.collectedAt ?? null,
      scope: fishbrainDocument.scope ?? null,
      collectionNote: fishbrainDocument.collectionNote ?? null,
    },
    sourceRole: 'discovery-only aggregate public catches; never biological truth',
    pageUrl: record.fishbrainPageUrl ?? null,
    pageName: record.fishbrainWaterName ?? null,
    loggedCatches: Number(record.fishbrainLoggedCatches ?? 0),
    matchStatus: record.matchStatus ?? 'unknown',
    mappingNote: record.mappingNote ?? null,
    segmentReviewReasons: FISHBRAIN_REVIEW_BY_SLUG.get(slug) ?? [],
    freshwaterTrout,
    freshwaterTroutCatchTotal: freshwaterTrout.reduce((sum, item) => sum + item.catches, 0),
    excludedMarineOrBrackish,
    topFreshwaterSpecies,
    interpretationRule: 'A catch count is a report-volume signal only. It cannot establish abundance, residency, a trout system, or year-round presence; broad/segment-review pages are especially weak evidence.',
  };
}

function catalogEvidence(slug) {
  const water = CATALOG_BY_SLUG.get(slug);
  if (!water) return { available: false };
  const doc = water.doc ?? {};
  return {
    available: true,
    id: slug,
    name: doc.name ?? slug,
    stateId: doc.stateId ?? null,
    waterbodyType: doc.waterbodyType ?? null,
    counties: countiesOf(doc),
    fishery: doc.fishery ?? null,
    species: doc.species ?? null,
    targetSpecies: doc.targetSpecies ?? [],
    stockingProgram: doc.stockingProgram ?? null,
    yearRound: doc.yearRound ?? null,
    seasonMonths: doc.seasonMonths ?? null,
    seasonKind: doc.seasonKind ?? null,
    speciesEvidence: (doc.speciesEvidence ?? []).slice(0, 10),
    notes: String(doc.notes ?? '').slice(0, 1800),
    officialSources: (doc.officialSources ?? []).slice(0, 10),
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
    class: water.class ?? null,
    completeness: water.completeness ?? {},
    gaugeActive: Boolean(water.gaugeActive),
    identity: water.identity ?? null,
    slots,
    sourceRole: 'audited research ledger; direct evidence and explicit negative findings are both meaningful',
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
        'Classify this one Tennessee water into exactly one fishery category. Judge the fishery/system, not whether anyone has ever logged a trout.',
        'The category describes the water system and should not flip merely because the requested month is outside a stocking window; use current_month_trout and the annual month questions for seasonal presence.',
        'Use the evidence hierarchy in the state: official or audited evidence and the current TWRA program outrank Fishbrain discovery. Fishbrain is aggregate user catch volume, not abundance or residency.',
        'A river with 20 trout catches is not automatically a trout stream. Treat it as seasonal winter stocking when a recurring winter program is documented, and do not call it year-round without year-round biological or coldwater-management evidence.',
        'Ignore marine/brackish species explicitly marked excluded. In particular, Sea trout, Spotted seatrout, Red drum, Black drum, Bluefish, Gafftopsail sea catfish, and Steelhead are not Tennessee freshwater-trout evidence.',
        'If sources conflict or are too thin, spread probability across the plausible categories and reduce confidence. Do not turn missing evidence into certainty.',
      ],
      criteria: CATEGORY_CRITERIA,
    },
    current_month_trout: {
      type: 'noul',
      instructions: `Does this water normally hold catchable freshwater trout during the requested month, ${monthName} (month ${monthNumber})? Use the requested month in state.requestedMonth. A year-round wild/coldwater system can be true in every month; a winter-stocked warmwater water is true only around its documented stocking/holdover window. Fishbrain-only catch counts do not prove the month.`,
      criteria: {
        true: 'Credible evidence supports catchable freshwater trout being present during this specific month in a normal year.',
        false: 'The month is outside the supported window, or the supplied evidence does not support trout presence in this month.',
      },
    },
    ...Object.fromEntries(MONTHS.map((name, index) => [`month_${name}`, {
      type: 'noul',
      instructions: `Does this water normally hold catchable freshwater trout during ${name} (month ${index + 1})? Apply the same wild/year-round versus winter-stocking distinction; do not infer presence from Fishbrain catch volume alone.`,
      criteria: {
        true: 'Credible evidence supports catchable freshwater trout during this month.',
        false: 'The month is outside the supported window, or evidence is absent/insufficient.',
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
      fishbrainDiscovery: fishbrainEvidence(slug),
    },
    safeguards: [
      'Only Tennessee freshwater fishery evidence counts for trout classification.',
      'A trout species name in a public catch aggregate is not proof of a trout system.',
      'A river with a small or moderate trout catch count may be winter-stocked or a broad-page artifact; it is not year-round without direct year-round evidence.',
      'Do not confuse a reservoir with its tailwater or a broad Fishbrain page with the catalog segment.',
      'No answer is a direct catalog change; low confidence or source conflict requires review.',
    ],
  };
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
    currentMonthTrout: response?.answers?.current_month_trout?.noul ?? null,
    evidenceQuality: response?.answers?.evidence_quality?.score ?? null,
    model: response?.model ?? MODEL,
  };
}

export function fishbrainRecordCount() {
  return fishbrainDocument.records?.length ?? 0;
}
