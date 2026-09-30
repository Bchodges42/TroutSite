import { waterIdentity } from '../../lib/presentation';

/**
 * Offline water-search index (SEARCH lane, 2026-09-30).
 *
 * OFFLINE STORY — there is deliberately NO build-time generated index file:
 * the catalog is fully client-side and precached (live feed → last Dexie
 * snapshot → bundled content pack via useStreamsCatalog; the pack IS the
 * catalog source of truth and ships in the build via the vite precache glob).
 * The bundled catalog already IS the offline index, so this module rebuilds
 * the search structures from it at RUNTIME in a useMemo — a second generated
 * artifact could only drift from the reviewed YAML it duplicated.
 *
 * This module is PURE and deterministic: no React, no network, no clocks.
 * `buildEntries` normalizes the catalog once; `match` ranks a query in tiers:
 *
 *   1  exact normalized name / alias
 *   2  name / alias prefix (string starts with the whole query)
 *   3  word-prefix — every query token prefixes a distinct phrase token,
 *      in order ("fork deer" → Forked Deer River; region and county phrases
 *      only ever match here or fuzzier, so names outrank places)
 *   4  restrained typo tolerance — ONLY when tiers 1-3 found nothing at all,
 *      and only per token (never across the whole query)
 *
 * Every result carries a visitor-facing `reason` ('exact-name' | 'exact-alias'
 * | 'prefix' | 'fuzzy') plus the `field` that matched, so the UI can show WHY
 * a row appeared and never silently commit a fuzzy guess on Enter.
 *
 * Typo-tier shape, reviewed against the acceptance typos: plain Levenshtein
 * "≤1 for tokens ≥5" cannot reach the plan's own examples ('pieny' → 'piney'
 * is distance 2 without transposition support; 'camy' → 'caney' is distance 2
 * outright), so the honest restrained rule is: token ≥4 chars, SAME first
 * letter, distance ≤2. The first-letter anchor is what keeps distance-2 sane
 * in this catalog (it blocks 'cane' → 'pine'); tokens ≤3 chars never fuzzy,
 * and fuzzy only ever runs after exact/prefix/word-prefix found nothing.
 */

export type MatchedField = 'name' | 'alias' | 'region' | 'county';
export type MatchReason = 'exact-name' | 'exact-alias' | 'prefix' | 'fuzzy';

/**
 * Restrained whole-token abbreviation map, reviewed against all 190 catalog
 * waters (packages/content/streams/tn): NONE of these tokens appears as a
 * whole word in any catalog name, alias, county or region label, so expanding
 * a query token cannot redirect a match the unexpanded query would have made.
 * Kept: cr→creek, rvr→river, lk→lake, pd→pond, nf/sf/ef/wf→(north/south/
 * east/west) fork, tw→tailwater (how anglers actually type: "south holston tw").
 * DROPPED on review: 'pn'→'pond' — speculative two-letter shorthand with no
 * demonstrated angler use; restraint beats coverage. 'rvr.' needs no special
 * entry: punctuation is stripped before tokenization, so "rvr." already
 * normalizes to the bare token 'rvr'.
 */
const ABBREVIATIONS: Readonly<Record<string, string>> = {
  cr: 'creek',
  rvr: 'river',
  lk: 'lake',
  pd: 'pond',
  nf: 'north fork',
  sf: 'south fork',
  ef: 'east fork',
  wf: 'west fork',
  tw: 'tailwater',
};

/** Lowercase, strip punctuation, expand a whole token through the map. The
 *  expansion may be multi-word ("nf" → "north fork"). */
export function normalizeToken(raw: string): string {
  const token = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return ABBREVIATIONS[token] ?? token;
}

/** Normalize a whole phrase: tokenize on non-alphanumerics, expand every
 *  whole token through the abbreviation map, rejoin with single spaces. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => ABBREVIATIONS[token] ?? token)
    .join(' ')
    .trim();
}

/** Plain Levenshtein edit distance (two-row DP; hand-rolled, no deps). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length]!;
}

const FUZZY_MIN_TOKEN_LENGTH = 4;
const FUZZY_MAX_DISTANCE = 2;

/** Restrained per-token typo equality (see module doc: ≥4 chars, same first
 *  letter, distance 1-2). Distance 0 is exactness, not fuzz, and is handled
 *  by the word-prefix tier. */
function isTypoOf(queryToken: string, catalogToken: string): boolean {
  if (queryToken.length < FUZZY_MIN_TOKEN_LENGTH) return false;
  if (queryToken[0] !== catalogToken[0]) return false;
  const d = levenshtein(queryToken, catalogToken);
  return d > 0 && d <= FUZZY_MAX_DISTANCE;
}

/** Every query token prefixes a distinct phrase token, in order. */
function wordPrefixAlign(queryTokens: string[], phraseTokens: string[]): boolean {
  let at = 0;
  for (const q of queryTokens) {
    let hit = false;
    while (at < phraseTokens.length) {
      if (phraseTokens[at]!.startsWith(q)) {
        at++;
        hit = true;
        break;
      }
      at++;
    }
    if (!hit) return false;
  }
  return true;
}

/** Every query token exactly or typo-matches a distinct phrase token, in
 *  order. Short query tokens must match exactly (no fuzzy). */
function fuzzyAlign(queryTokens: string[], phraseTokens: string[]): boolean {
  let at = 0;
  for (const q of queryTokens) {
    let hit = false;
    while (at < phraseTokens.length) {
      const token = phraseTokens[at]!;
      at++;
      if (token === q || isTypoOf(q, token)) {
        hit = true;
        break;
      }
    }
    if (!hit) return false;
  }
  return true;
}

/** What the UI needs to index one catalog water. Plain data in — the caller
 *  derives region labels (regionName) and counties (hydroIdentity.counties). */
export interface SearchEntryInput {
  id: string;
  name: string;
  aliases?: string[];
  regionId?: string;
  /** Human region label (regionName(regionId)) — the id itself is indexed too. */
  regionLabel?: string;
  counties?: string[];
  waterbodyType?: string;
  /** True ONLY when the catalog positively marks the water warmwater
   *  (species: 'warmwater'). Catalog silence is never a negative: waters with
   *  no species stay in the trout scope. */
  allFishOnly?: boolean;
}

export interface SearchPhrase {
  field: MatchedField;
  text: string;
  norm: string;
  tokens: string[];
}

export interface SearchEntry {
  id: string;
  name: string;
  /** waterIdentity(name).name — the base identity without the reach parens;
   *  repeated base names drive the UI's disambiguation line. */
  baseName: string;
  /** waterIdentity(name).reach — the parenthesized reach, kept for callers. */
  reach?: string;
  regionId?: string;
  regionLabel?: string;
  counties: string[];
  waterbodyType?: string;
  allFishOnly: boolean;
  /** Name first, then aliases, then region label/id, then counties — phrase
   *  order is the tiebreak below tier ranks, so name reasons win. */
  phrases: SearchPhrase[];
}

function phrase(field: MatchedField, text: string): SearchPhrase {
  const norm = normalizeText(text);
  return { field, text, norm, tokens: norm ? norm.split(' ') : [] };
}

export function buildEntries(inputs: Iterable<SearchEntryInput>): SearchEntry[] {
  return Array.from(inputs, (input) => {
    const identity = waterIdentity(input.name);
    const phrases: SearchPhrase[] = [phrase('name', input.name)];
    for (const alias of input.aliases ?? []) phrases.push(phrase('alias', alias));
    if (input.regionLabel) phrases.push(phrase('region', input.regionLabel));
    if (input.regionId) phrases.push(phrase('region', input.regionId));
    for (const county of input.counties ?? []) phrases.push(phrase('county', county));
    return {
      id: input.id,
      name: input.name,
      baseName: identity.name,
      reach: identity.reach,
      regionId: input.regionId,
      regionLabel: input.regionLabel,
      counties: input.counties ?? [],
      waterbodyType: input.waterbodyType,
      allFishOnly: input.allFishOnly === true,
      phrases,
    };
  });
}

export interface SearchMatch {
  entry: SearchEntry;
  /** 1 exact · 2 prefix · 3 word-prefix · 4 fuzzy (module doc). */
  tier: 1 | 2 | 3 | 4;
  reason: MatchReason;
  field: MatchedField;
}

const FIELD_WEIGHT: Record<MatchedField, number> = { name: 0, alias: 1, region: 2, county: 3 };

function rankOf(m: SearchMatch): number {
  return m.tier * 10 + FIELD_WEIGHT[m.field];
}

/**
 * Rank catalog entries against a query. Empty/blank query → []. One match per
 * entry (its best phrase). Fuzzy (tier 4) runs ONLY when tiers 1-3 produced
 * no match for ANY entry, and never compares the whole query string — token
 * by token only, so a typo'd word cannot invent a different water.
 */
export function match(query: string, entries: SearchEntry[]): SearchMatch[] {
  const q = normalizeText(query);
  if (!q) return [];
  const qTokens = q.split(' ');

  const best = new Map<string, SearchMatch>();
  for (const entry of entries) {
    let top: SearchMatch | undefined;
    for (const p of entry.phrases) {
      let candidate: SearchMatch | undefined;
      if (p.norm === q && (p.field === 'name' || p.field === 'alias')) {
        candidate = {
          entry,
          tier: 1,
          reason: p.field === 'alias' ? 'exact-alias' : 'exact-name',
          field: p.field,
        };
      } else if (
        (p.field === 'name' || p.field === 'alias') &&
        p.norm.startsWith(q) &&
        p.norm !== q
      ) {
        candidate = { entry, tier: 2, reason: 'prefix', field: p.field };
      } else if (wordPrefixAlign(qTokens, p.tokens)) {
        candidate = { entry, tier: 3, reason: 'prefix', field: p.field };
      }
      if (candidate && (!top || rankOf(candidate) < rankOf(top))) top = candidate;
    }
    if (top) best.set(entry.id, top);
  }

  if (best.size === 0) {
    for (const entry of entries) {
      // Phrases are ordered name → alias → region → county, so the first
      // fuzzy phrase is the most identity-bearing one.
      for (const p of entry.phrases) {
        if (fuzzyAlign(qTokens, p.tokens)) {
          best.set(entry.id, { entry, tier: 4, reason: 'fuzzy', field: p.field });
          break;
        }
      }
    }
  }

  return [...best.values()].sort(
    (a, b) =>
      rankOf(a) - rankOf(b) ||
      a.entry.name.localeCompare(b.entry.name) ||
      a.entry.id.localeCompare(b.entry.id),
  );
}
