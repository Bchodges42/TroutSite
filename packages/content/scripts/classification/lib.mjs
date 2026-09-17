#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Shared library for the tiered classification pipeline.
 *
 * Owner ruling (binding): stocking EVENTS are the data; everything on a water
 * page is a computed view. No bare stocked:true. Ambiguous name joins queue,
 * never guess. Output is a decision-box diff — never a direct YAML write.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
export const CATALOG_DIR = join(REPO_ROOT, 'packages', 'content', 'streams', 'tn');
export const STOCKING_GEOJSON = join(REPO_ROOT, 'apps', 'web', 'public', 'atlas', 'twra-stocking.geojson');
export const LEDGER_DIR = join(REPO_ROOT, 'docs', 'research', '2026-09-15-wave-ledgers');
export const DIFF_OUT_DIR = join(REPO_ROOT, 'docs', 'research', '2026-09-17-classification-diff');
export const SOURCE_LABEL = 'TWRA trout stocking sites feed (Tier 1, automatic)';

/** Normalize a water name for matching: lowercase, drop parentheticals,
 * punctuation, and a leading "the ". Type words (creek/river/lake…) are kept —
 * they distinguish Mill Creek from Mill Pond and must not be stripped.
 * Feed segment markers ("#1", "S1") are dropped; single-letter compass
 * abbreviations expand ("W. Prong" → "west prong"). */
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

/** TWRA program label → the months that program implies. Tailwater/Reservoir
 * runs have no fixed statewide window — returned as null (unpinned), which the
 * diff reports as a T2 question, never a guess. */
export function programMonths(program) {
  const p = String(program ?? '').trim().toLowerCase();
  if (p === 'winter') return [12, 1, 2];
  if (p === 'spring') return [3, 4, 5];
  return null; // 'Tailwater', 'Reservoir', unknown
}

const SPECIES_CODES = new Set(['rainbow', 'brown', 'brook', 'cutthroat']);

/** Feed species field ("rainbow_brown", "Rainbow", …) → sorted codes.
 * Unparseable values come back as [] and are counted upstream. */
export function parseFeedSpecies(s) {
  const out = new Set();
  for (const part of String(s ?? '').toLowerCase().split(/[_/,+]+/)) {
    const code = part.trim();
    if (SPECIES_CODES.has(code)) out.add(code);
  }
  return [...out].sort();
}

/** All catalog waters: { slug, doc, path, bounds? }. Bounds come from the
 * committed atlas geometry (rivers.geojson properties.bounds) so resolution
 * can use the feed rows' coordinates. */
export function loadCatalog() {
  const out = [];
  for (const f of readdirSync(CATALOG_DIR).filter((f) => f.endsWith('.yaml')).sort()) {
    const path = join(CATALOG_DIR, f);
    out.push({ slug: f.replace(/\.yaml$/, ''), doc: parse(readFileSync(path, 'utf8')), path, bounds: null });
  }
  const boundsById = atlasBounds();
  for (const w of out) w.bounds = boundsById.get(w.slug) ?? null;
  return out;
}

let boundsCache = null;
/** id → [minLon, minLat, maxLon, maxLat] from the committed atlas geometry. */
export function atlasBounds() {
  if (boundsCache) return boundsCache;
  boundsCache = new Map();
  const fc = JSON.parse(readFileSync(join(REPO_ROOT, 'apps', 'web', 'public', 'atlas', 'rivers.geojson'), 'utf8'));
  for (const f of fc.features ?? []) {
    if (f.properties?.id && f.properties?.bounds) boundsCache.set(f.properties.id, f.properties.bounds);
  }
  return boundsCache;
}

/** Point-in-bbox test with a small default buffer (~2 km) for edge points. */
export function pointInBounds(bounds, [lon, lat], bufferDeg = 0.02) {
  if (!Array.isArray(bounds) || bounds.length !== 4 || !Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  const [minLon, minLat, maxLon, maxLat] = bounds;
  return lon >= minLon - bufferDeg && lon <= maxLon + bufferDeg && lat >= minLat - bufferDeg && lat <= maxLat + bufferDeg;
}

/** Counties compare space-insensitively: the feed writes "Vanburen", the
 * catalog writes "Van Buren". */
export function normCounty(c) {
  return String(c ?? '').toLowerCase().replace(/\s+/g, '');
}

export function countiesOf(doc) {
  return (doc.hydroIdentity && Array.isArray(doc.hydroIdentity.counties))
    ? doc.hydroIdentity.counties.map((c) => normCounty(c))
    : [];
}

/** Generic type words — stripped only for the county-gated core-name
 * fallback (TWRA writes "South Holston Tailwater" for catalog
 * "South Holston River"), never for the primary exact match. */
const TYPE_WORDS = new Set(['river', 'creek', 'lake', 'pond', 'reservoir', 'tailwater', 'branch']);
export function coreName(s) {
  return normalizeName(s)
    .split(' ')
    .filter((w) => !TYPE_WORDS.has(w))
    .join(' ');
}

/** 725 feed point-rows → deduped events: one per water+county+program+class.
 * The feed's `site` is often an ACCESS POINT ("Pumphouse", "Site # 1"); the
 * water is the `stream` field — resolution keys on it, site kept as evidence.
 * Segments of the same stocked creek repeat rows; collapse them. */
export function eventsFromGeojson(fc) {
  const byKey = new Map();
  let unparsedSpecies = 0;
  for (const f of fc.features ?? []) {
    const p = f.properties ?? {};
    const species = parseFeedSpecies(p.species);
    if (species.length === 0) unparsedSpecies += 1;
    const water = String(p.stream ?? '').trim() || String(p.site ?? '').trim();
    const key = [water, p.county, p.program, p.class].map((v) => String(v ?? '').trim()).join('|');
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: `twra-${byKey.size + 1}`,
        site: String(p.site ?? '').trim(),
        water,
        county: String(p.county ?? '').trim(),
        region: String(p.region ?? '').trim(),
        program: String(p.program ?? '').trim(),
        waterClass: String(p.class ?? '').trim(),
        species,
        windowMonths: programMonths(p.program),
        sampleCoord: Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : null,
        points: 0,
        accessSites: new Set(),
      });
    }
    const ev = byKey.get(key);
    ev.points += 1;
    if (p.site) ev.accessSites.add(String(p.site).trim());
    if (ev.species.length === 0 && species.length > 0) ev.species = species;
  }
  for (const ev of byKey.values()) ev.accessSites = [...ev.accessSites].slice(0, 5);
  return { events: [...byKey.values()], unparsedSpeciesRows: unparsedSpecies };
}

export function loadStockingGeojson() {
  return JSON.parse(readFileSync(STOCKING_GEOJSON, 'utf8'));
}

export function loadLedgerDiff() {
  return JSON.parse(readFileSync(join(LEDGER_DIR, 'ledger', 'diff.json'), 'utf8'));
}

export function loadOwnerVerdicts() {
  const p = join(dirname(fileURLToPath(import.meta.url)), 'owner-verdicts.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { verdicts: {} };
}

/**
 * Alias table: feed water name + county → catalog slug, for identity
 * corrections the wave audits documented. Every entry needs a reason; the
 * diff report prints them so the owner can strike any of them.
 */
export const ALIASES = {
  // wave-3 audit: the stocked Puncheon Camp Creek is the Grainger Co one
  // (EBTJV); catalog hydroIdentity still says Campbell — see decision box.
  'puncheon camp creek|grainger': { slug: 'puncheon-camp-creek', reason: 'wave-3 identity: Grainger Co population (EBTJV); catalog county field itself under review' },
};

/**
 * Deterministic entity resolution: feed event → catalog water.
 *
 * Stage order (each stage must be UNIQUELY satisfied, else fall through):
 *   1. documented alias → 2. exact normalized name (county guard: a unique
 *   name match whose county contradicts the event is QUEUED — the Mill Creek
 *   (Hickman) trap) → 3. name + county → 4. county-gated core name →
 *   5. COORDINATE: the feed row's point against catalog bounds — first among
 *   the earlier name candidates (name+coord), else across the whole catalog
 *   only if exactly ONE water contains it (coord). Ambiguity queues, never
 *   guesses. Alias table only for documented identity corrections.
 */
export function resolveEvent(event, catalog, aliases = {}) {
  const alias = aliases[eventKey(event)];
  if (alias) {
    const hit = catalog.find((w) => w.slug === alias.slug);
    if (hit) return { slug: hit.slug, confidence: 'high', how: 'alias', reason: alias.reason };
  }
  const want = normalizeName(event.water || event.site);
  const candidates = catalog.filter((w) => {
    const names = [w.doc.name, w.slug.replace(/-/g, ' ')];
    return names.some((n) => normalizeName(n) === want);
  });
  const countyKnown = Boolean(event.county);
  const evCounty = normCounty(event.county);
  const byCounty = candidates.filter((w) => countiesOf(w.doc).includes(evCounty));
  let nameStageVerdict = null;
  if (candidates.length === 1) {
    const w = candidates[0];
    const counties = countiesOf(w.doc);
    if (countyKnown && counties.length > 0 && !counties.includes(evCounty)) {
      nameStageVerdict = { slug: null, confidence: null, how: 'ambiguous', candidates: [w.slug], reason: `county mismatch: event says ${event.county}, catalog water is in ${counties.join('/')}` };
    } else {
      return { slug: w.slug, confidence: 'high', how: 'name' };
    }
  } else if (candidates.length > 1) {
    if (byCounty.length === 1) {
      return { slug: byCounty[0].slug, confidence: 'high', how: 'name+county' };
    }
    nameStageVerdict = { slug: null, confidence: null, how: 'ambiguous', candidates: candidates.map((c) => c.slug), reason: countyKnown ? `no unique ${event.county} county match` : 'no county on feed row' };
  }

  // County-gated core-name fallback: TWRA naming conventions put the type
  // word last and vary it ("South Holston Tailwater" = catalog
  // "South Holston River"). Only fires when the county confirms uniquely —
  // bare core names are far too generic to match on alone.
  let coreCandidates = [];
  if (countyKnown) {
    const wantCore = coreName(event.water || event.site);
    if (wantCore) {
      coreCandidates = catalog.filter(
        (w) => countiesOf(w.doc).includes(evCounty) && [w.doc.name, w.slug.replace(/-/g, ' ')].some((n) => coreName(n) === wantCore),
      );
      if (coreCandidates.length === 1) {
        return { slug: coreCandidates[0].slug, confidence: 'medium', how: 'core+county' };
      }
    }
  }

  // Coordinate stage — TIE-BREAKER ONLY. Catalog bboxes are crude: a parent
  // river's bounds swallow its tributaries' access points, and a mega-river
  // bbox (tennessee-river) swallows half the state, so a bare point-in-bbox
  // match across the whole catalog grabs wrong waters (proven 2026-09-17:
  // Pickett Lake → tennessee-river). Coordinates may only arbitrate AMONG
  // name-plausible candidates (exact or core name hits), and a still/moving
  // water class mismatch (stocking a "Lake"/"Reservoir" row into a river)
  // vetoes the grab.
  if (Array.isArray(event.sampleCoord)) {
    const coord = event.sampleCoord;
    const namedCandidates = [...candidates, ...coreCandidates];
    const sane = namedCandidates.filter((w) => !stillVsMovingMismatch(event, w));
    const amongNamed = sane.filter((w) => w.bounds && pointInBounds(w.bounds, coord));
    if (amongNamed.length === 1) {
      return { slug: amongNamed[0].slug, confidence: 'high', how: 'name+coord' };
    }
  }
  if (nameStageVerdict) return nameStageVerdict;
  return { slug: null, confidence: null, how: 'unmatched' };
}

/** A still-water stocking row (lake/pond/reservoir class) must not be grabbed
 * by a flowing water (river) and vice versa. */
function stillVsMovingMismatch(event, water) {
  const cls = String(event.waterClass ?? '').toLowerCase();
  const type = String(water.doc.waterbodyType ?? '').toLowerCase();
  const still = new Set(['lake', 'pond', 'reservoir']);
  const moving = new Set(['river', 'stream', 'creek']);
  if (still.has(cls) && moving.has(type)) return true;
  if (moving.has(cls) && still.has(type)) return true;
  return false;
}

export function eventKey(event) {
  return `${normalizeName(event.water || event.site)}|${event.county.toLowerCase()}`;
}
