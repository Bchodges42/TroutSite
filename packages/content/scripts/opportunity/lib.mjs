/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Evidence-ledger helpers for the 190-water fishery-opportunity adjudication.
 *
 * The join machinery (name normalization, county gating, core-name fallback,
 * coordinate tie-break veto) mirrors the audited wave/habitat pipelines
 * (packages/content/scripts/wave-ledgers, the habitat-batch classifier) so
 * results stay comparable; nothing here decides a biology verdict — the lib
 * only JOINS sources to catalog waters and distills prior research leads.
 * Every decisive claim is adjudicated by a reviewer against the source
 * itself; see docs/research/2026-09-22-fishery-opportunities/.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
export const ARTIFACT_DIR = join(REPO_ROOT, 'docs', 'research', '2026-09-22-fishery-opportunities');
export const CATALOG_DIR = join(REPO_ROOT, 'packages', 'content', 'streams', 'tn');

/** Space/punctuation-insensitive water-name normalization (mirrors lib in the
 * wave-ledger tooling; TWRA writes "S.F."/"N", catalogs write it out). */
export function normalizeName(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[.']/g, '')
    .replace(/["“”]/g, '')
    .replace(/\s*(#\d+)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '')
    .replace(/\bn\b/g, 'north')
    .replace(/\bs\b/g, 'south')
    .replace(/\be\b/g, 'east')
    .replace(/\bw\b/g, 'west');
}

/** Counties compare space-insensitively: "Vanburen" vs "Van Buren". */
export function normCounty(c) {
  return String(c ?? '').toLowerCase().replace(/\s+/g, '');
}

export function countiesOf(doc) {
  return doc.hydroIdentity && Array.isArray(doc.hydroIdentity.counties)
    ? doc.hydroIdentity.counties.map((c) => normCounty(c))
    : [];
}

/** Generic type words — stripped only for the county-gated core-name
 * fallback ("South Holston Tailwater" = catalog "South Holston River"). */
const TYPE_WORDS = new Set(['river', 'creek', 'lake', 'pond', 'reservoir', 'tailwater', 'tailrace', 'branch']);
export function coreName(s) {
  return normalizeName(s)
    .split(' ')
    .filter((w) => !TYPE_WORDS.has(w))
    .join(' ');
}

/** All catalog waters: { slug, doc, bounds }. Bounds from the committed atlas
 * geometry so a coordinate tie-break can only arbitrate among name hits. */
export function loadCatalog() {
  const out = [];
  for (const f of readdirSync(CATALOG_DIR).filter((f) => f.endsWith('.yaml')).sort()) {
    out.push({ slug: f.replace(/\.yaml$/, ''), doc: parse(readFileSync(join(CATALOG_DIR, f), 'utf8')) });
  }
  const atlasPath = join(REPO_ROOT, 'apps', 'web', 'public', 'atlas', 'rivers.geojson');
  const boundsById = new Map();
  if (existsSync(atlasPath)) {
    const gj = JSON.parse(readFileSync(atlasPath, 'utf8'));
    for (const feat of gj.features) boundsById.set(feat.properties.id, feat.properties.bounds ?? null);
  }
  for (const w of out) w.bounds = boundsById.get(w.slug) ?? null;
  return out;
}

function pointInBounds(bounds, [lon, lat], bufferDeg = 0.02) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  return lon >= minLon - bufferDeg && lon <= maxLon + bufferDeg && lat >= minLat - bufferDeg && lat <= maxLat + bufferDeg;
}

/** A still-water stocking row must not be grabbed by a flowing water and vice versa. */
function stillVsMovingMismatch(event, water) {
  const cls = String(event.waterClass ?? '').toLowerCase();
  const type = String(water.doc.waterbodyType ?? '').toLowerCase();
  const still = new Set(['lake', 'pond', 'reservoir']);
  const moving = new Set(['river', 'stream', 'creek', 'tailrace']);
  if (still.has(cls) && moving.has(type)) return true;
  if (moving.has(cls) && still.has(type)) return true;
  return false;
}

export function eventKey(event) {
  return `${normalizeName(event.water || event.site)}|${String(event.county ?? '').toLowerCase()}`;
}

/** Resolve one source row onto a catalog water. Alias hits win; then exact
 * name (unique, county-checked), county-gated core-name fallback, and — only
 * among name-plausible candidates — a coordinate tie-break. */
export function resolveEvent(event, catalog, aliases = {}) {
  const alias = aliases[eventKey(event)];
  if (alias) {
    const hit = catalog.find((w) => w.slug === alias.slug);
    if (hit) return { slug: hit.slug, confidence: 'high', how: 'alias', reason: alias.reason };
  }
  const want = normalizeName(event.water || event.site);
  const candidates = catalog.filter((w) => [w.doc.name, w.slug.replace(/-/g, ' ')].some((n) => normalizeName(n) === want));
  const countyKnown = Boolean(event.county);
  const evCounty = normCounty(event.county);
  const byCounty = candidates.filter((w) => countiesOf(w.doc).includes(evCounty));
  let nameStageVerdict = null;
  if (candidates.length === 1) {
    const w = candidates[0];
    const counties = countiesOf(w.doc);
    if (countyKnown && counties.length > 0 && !counties.includes(evCounty)) {
      nameStageVerdict = { slug: null, confidence: null, how: 'ambiguous', candidates: [w.slug], reason: `county mismatch: source says ${event.county}, catalog water is in ${counties.join('/')}` };
    } else {
      return { slug: w.slug, confidence: 'high', how: 'name' };
    }
  } else if (candidates.length > 1) {
    if (byCounty.length === 1) {
      return { slug: byCounty[0].slug, confidence: 'high', how: 'name+county' };
    }
    nameStageVerdict = { slug: null, confidence: null, how: 'ambiguous', candidates: candidates.map((c) => c.slug), reason: countyKnown ? `no unique ${event.county} county match` : 'no county on source row' };
  }

  let coreCandidates = [];
  if (countyKnown) {
    const wantCore = coreName(event.water || event.site);
    if (wantCore) {
      coreCandidates = catalog.filter(
        (w) => countiesOf(w.doc).includes(evCounty) && [w.doc.name, w.slug.replace(/-/g, ' ')].some((n) => coreName(n) === wantCore),
      );
      if (coreCandidates.length === 1) return { slug: coreCandidates[0].slug, confidence: 'medium', how: 'core+county' };
    }
  }

  if (Array.isArray(event.sampleCoord)) {
    const coord = event.sampleCoord;
    const namedCandidates = [...candidates, ...coreCandidates];
    const sane = namedCandidates.filter((w) => !stillVsMovingMismatch(event, w));
    const amongNamed = sane.filter((w) => w.bounds && pointInBounds(w.bounds, coord));
    if (amongNamed.length === 1) return { slug: amongNamed[0].slug, confidence: 'high', how: 'name+coord' };
  }
  if (nameStageVerdict) return nameStageVerdict;
  return { slug: null, confidence: null, how: 'unmatched' };
}

const MONTH_INITIALS = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];

/** "M, A, M, J, J, A, S" → [3,4,5,6,7,8,9] (calendar-walk, month-initials). */
export function parseMonthLetters(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const letters = text.toLowerCase().split(/[\s,;/]+/).filter(Boolean);
  if (!letters.length) return null;
  const months = [];
  let pointer = 0;
  for (const letter of letters) {
    let steps = 0;
    while (MONTH_INITIALS[pointer] !== letter && steps < 12) {
      pointer = (pointer + 1) % 12;
      steps += 1;
    }
    if (steps >= 12) return null;
    months.push(pointer + 1);
    pointer = (pointer + 1) % 12;
  }
  return [...new Set(months)].sort((a, b) => a - b);
}

/** '1/14/2026' → '2026-01-14'. 'TBD 12/2026' → { tbd: '2026-12' }. */
export function parseScheduleDate(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const tbd = text.match(/^TBD\s+(\d{1,2})\/(\d{4})$/i);
  if (tbd) return { tbd: `${tbd[2]}-${String(Number(tbd[1])).padStart(2, '0')}` };
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${String(Number(m[1])).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`;
  return null;
}

export function parseScheduleDateMonth(raw) {
  const parsed = parseScheduleDate(raw);
  if (typeof parsed === 'string') return Number(parsed.slice(5, 7));
  if (parsed?.tbd) return Number(parsed.tbd.slice(5, 7));
  return null;
}

/** TWRA schedule program typology → plain meaning. Tailwater/Reservoir/Weekly
 * rows carry no fixed statewide month window — null (never a guess). */
export const TYPE_MEANING = {
  Winter: 'winter put-and-take on a warm water (cold-month recruitment program)',
  Seasonal: 'scheduled trout-season program on managed trout water',
  Tailwater: 'tailwater program (year-round fishery per TWRA assessment; months on rows are stocking events)',
  'Delayed Harvest': 'delayed-harvest window (fall stocking, C&R, spring harvest)',
  Weekly: 'weekly small-water program',
  Reservoir: 'reservoir stocking row',
};
export function programMeaning(type) {
  return TYPE_MEANING[type] ?? null;
}

/**
 * Join the captured live TWRA schedule onto catalog waters. Compound
 * "Normandy TW / Duck River" notation: each '/' segment is tried; a UNIQUE
 * resolution wins; anything else queues for review. Returns
 * { bySlug: Map, unmatched: rows[] }.
 */
export function buildSchedulePrograms(catalog, rows, aliases = {}) {
  const bySlug = new Map();
  const unmatched = [];
  const resolveScheduleLocation = (row) => {
    const counties = String(row['COUNTY'] ?? '').split('/').map((c) => c.trim()).filter(Boolean);
    const locations = [row['LOCATION'], ...String(row['LOCATION'] ?? '')
      .split('/')
      .map((seg) => seg.replace(/\s*(TW|Tailwater|Dam)\s*$/i, '').trim())
      .filter(Boolean)];
    let lastTry = null;
    for (const loc of locations) {
      const tries = [resolveEvent({ water: loc, site: row['LOCATION'], county: counties[0] ?? '', program: row['TYPE'] ?? '', waterClass: row['TYPE'] === 'Reservoir' ? 'reservoir' : undefined }, catalog, aliases)];
      for (const county of counties.slice(1)) {
        tries.push(resolveEvent({ water: loc, site: row['LOCATION'], county, program: row['TYPE'] ?? '' }, catalog, aliases));
      }
      const hit = tries.find((r) => r.slug);
      if (hit) return hit;
      if (tries.length) lastTry = tries[tries.length - 1];
    }
    return lastTry ?? { slug: null, confidence: null, how: 'unmatched' };
  };
  for (const row of rows) {
    const resolution = resolveScheduleLocation(row);
    const slim = {
      location: String(row['LOCATION'] ?? '').trim(),
      county: row['COUNTY'],
      region: row['REGION'],
      type: row['TYPE'],
      meaning: programMeaning(row['TYPE']),
      species: row['SPECIES'],
      stockingDay: row['STOCKING DAY'] || null,
      stockingWeek: row['STOCKING WEEK'] || null,
      stockingMonthsRaw: row['STOCKING MONTHS'] || null,
    };
    if (!resolution.slug) {
      unmatched.push({ ...slim, how: resolution.how, reason: resolution.reason ?? null });
      continue;
    }
    const months = parseMonthLetters(row['STOCKING MONTHS']);
    const day = parseScheduleDate(row['STOCKING DAY']);
    const entry = bySlug.get(resolution.slug) ?? {
      types: [],
      meanings: [],
      declaredMonths: null,
      observedMonths: null,
      unpinnedTypes: [],
      lastScheduledDay: null,
      nextTbd: null,
      rowCount: 0,
      rows: [],
      matchHow: resolution.how,
      matchReason: resolution.reason ?? null,
    };
    entry.rowCount += 1;
    if (!entry.types.includes(row['TYPE'])) entry.types.push(row['TYPE']);
    const meaning = programMeaning(row['TYPE']);
    if (meaning && !entry.meanings.includes(meaning)) entry.meanings.push(meaning);
    if (months) {
      entry.declaredMonths = [...new Set([...(entry.declaredMonths ?? []), ...months])].sort((a, b) => a - b);
    } else if (!entry.declaredMonths && !entry.unpinnedTypes.includes(row['TYPE'] ?? 'Unspecified')) {
      entry.unpinnedTypes.push(row['TYPE'] ?? 'Unspecified');
    }
    const observed = parseScheduleDateMonth(row['STOCKING DAY']) ?? parseScheduleDateMonth(row['STOCKING WEEK']);
    if (observed) entry.observedMonths = [...new Set([...(entry.observedMonths ?? []), observed])].sort((a, b) => a - b);
    if (typeof day === 'string') {
      if (!entry.lastScheduledDay || day > entry.lastScheduledDay) entry.lastScheduledDay = day;
    } else if (day?.tbd && (!entry.nextTbd || day.tbd > entry.nextTbd)) entry.nextTbd = day.tbd;
    if (entry.rows.length < 6) entry.rows.push(slim);
    bySlug.set(resolution.slug, entry);
  }
  return { bySlug, unmatched };
}

/** Researched schedule-location aliases (owner-directed research 2026-09-17,
 * every entry carries relationship + confidence + source). */
export function loadScheduleAliases() {
  const p = join(ARTIFACT_DIR, 'schedule-location-aliases.json');
  if (!existsSync(p)) return {};
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  const out = {};
  for (const [key, value] of Object.entries(doc.aliases ?? {})) {
    const [name, county] = key.split('|');
    out[`${normalizeName(name)}|${normCounty(county)}`] = { slug: value.slug, reason: `${value.relationship} (${value.confidence}): ${value.source}` };
  }
  return out;
}

/**
 * Scan the captured forecast text nodes for catalog-water mentions.
 * Deterministic candidate map only — applicability per reach is decided by
 * the adjudicator who reads the node in context. Match on full name, slug
 * words, and curated aliases; longer names first so "Watauga River" wins
 * over bare "Watauga".
 */
export function scanForecast(catalog, extraTerms = {}) {
  const digestPath = join(ARTIFACT_DIR, 'captures', 'twra-forecast-text.md');
  const md = readFileSync(digestPath, 'utf8');
  const sections = md.split(/^## /m).slice(1);
  const nodes = sections.map((s) => {
    const nl = s.indexOf('\n');
    const header = s.slice(0, nl);
    const id = (header.match(/node (\S+)/) ?? [])[1] ?? header;
    return { id, header, text: s.slice(nl + 1).replace(/\s+/g, ' ').trim() };
  });
  const out = [];
  for (const w of catalog) {
    const terms = new Set();
    terms.add(normalizeName(w.doc.name));
    w.doc.aliases?.forEach((a) => terms.add(normalizeName(a)));
    for (const t of extraTerms[w.slug] ?? []) terms.add(normalizeName(t));
    const slugWords = normalizeName(w.slug.replace(/-/g, ' '));
    if (slugWords.split(' ').length >= 2) terms.add(slugWords);
    const ranked = [...terms].filter((t) => t.length >= 6).sort((a, b) => b.length - a.length);
    const hits = [];
    for (const n of nodes) {
      for (const t of ranked) {
        if (n.text.toLowerCase().includes(t)) {
          const at = n.text.toLowerCase().indexOf(t);
          hits.push({ nodeId: n.id, matchedTerm: t, snippet: n.text.slice(Math.max(0, at - 80), at + 220) });
          break;
        }
      }
    }
    if (hits.length) out.push({ slug: w.slug, hits: hits.slice(0, 12) });
  }
  return out;
}

/** Distill the six habitat-research batch records into per-water prior leads
 * (RESEARCH LEADS ONLY — the audits found unchecked strings and category
 * errors in these records; they carry source URLs and boundaries, not
 * verdicts). */
export function loadPriorLeads() {
  const p = join(ARTIFACT_DIR, 'prior-leads.json');
  if (!existsSync(p)) return {};
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  return doc.waters ?? {};
}

/** Fishbrain aggregate discovery → research leads only (reuse rights
 * unresolved; aggregates carry no catch dates). */
export function loadFishbrainLeads() {
  const files = [
    join(REPO_ROOT, 'packages', 'content', 'research', 'fishbrain-tn-graphql-discovery.json'),
    join(REPO_ROOT, 'packages', 'content', 'research', 'fishbrain-tn-graphql-standard-discovery.json'),
  ];
  const out = {};
  for (const f of files) {
    if (!existsSync(f)) continue;
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    for (const rec of doc.records ?? []) {
      const cur = out[rec.catalogWaterId] ?? { pages: [], segmentReview: false, collectedAt: doc.collectedAt };
      cur.pages.push({
        fishbrainWaterName: rec.fishbrainWaterName,
        pageUrl: rec.fishbrainPageUrl,
        matchStatus: rec.matchStatus,
        mappingNote: rec.mappingNote ?? null,
        loggedCatches: rec.fishbrainLoggedCatches ?? null,
        troutSpecies: (rec.species ?? [])
          .filter((s) => /trout|salmon|char/i.test(s.displayName))
          .map((s) => ({ name: s.displayName, catches: s.catchesCount })),
        topSpecies: (rec.species ?? []).slice(0, 6).map((s) => ({ name: s.displayName, catches: s.catchesCount })),
        totalSpecies: rec.totalSpecies ?? null,
      });
      if (rec.matchStatus === 'segment-review') cur.segmentReview = true;
      out[rec.catalogWaterId] = cur;
    }
  }
  return out;
}
