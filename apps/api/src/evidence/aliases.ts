import { TWRA_ALIAS_OVERRIDES, TWRA_COUNTY_ALIASES, type AliasEntry } from './alias-data.js';

/**
 * TWRA water-name → catalog waterId resolution (data-sources lane).
 *
 * ONLY two paths resolve a name:
 *   1. an explicit override keyed by the normalized FULL TWRA string, or a
 *      county-keyed alias for names that collide across catalog waters;
 *   2. an exact normalized match against a catalog water's full name or its
 *      base name (name minus any parenthetical) — with a county guard: when the
 *      catalog name names a county and the TWRA row supplies a different county,
 *      the match is REFUSED (TWRA "Mill Creek" is Hickman County; the catalog's
 *      Mill Creek is Overton County).
 *
 * There is deliberately NO first-word matching and NO substring matching:
 * "East Fork Shoal Creek" must never match "Shoal Creek", "W. Fork Stones River"
 * must never match "East Fork Stones River", and a name colliding with 2+ waters
 * (bare "Duck River"/"Elk River"/"Wolf River") resolves only through an explicit
 * county alias — otherwise it is reported ambiguous and left unresolved.
 */

export interface CatalogWaterName {
  waterId: string;
  name: string;
}

export type AliasResolution =
  | { kind: 'resolved'; waterId: string; via: 'explicit-alias' | 'explicit-county-alias' | 'exact-name' }
  | { kind: 'ambiguous'; candidates: string[] }
  | { kind: 'unmatched' }
  | { kind: 'county-mismatch'; waterId: string; rowCounty: string; catalogCounties: string[] }
  | { kind: 'county-required'; waterId: string; catalogCounties: string[] };

/** Lowercase, strip diacritics/punctuation to spaces, collapse whitespace. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Brush Creek (Cocke County)" → base "Brush Creek". */
export function baseName(name: string): string {
  const cut = name.indexOf('(');
  return (cut === -1 ? name : name.slice(0, cut)).replace(/\s+/g, ' ').trim();
}

/** Counties the catalog name itself claims, e.g. "(Grainger County)" → ['grainger']. */
export function catalogCounties(name: string): string[] {
  const qualifier = /\(([^)]*)\)/.exec(name)?.[1] ?? '';
  const out: string[] = [];
  for (const m of qualifier.matchAll(/([A-Za-z]+)\s+County/gi)) {
    if (m[1]) out.push(m[1].toLowerCase());
  }
  return out;
}

export function normalizeCounty(county: string | undefined): string | undefined {
  if (!county) return undefined;
  const n = county.replace(/\s+/g, ' ').trim().replace(/\s+county$/i, '').toLowerCase();
  return n.length > 0 ? n : undefined;
}

/**
 * Resolve one TWRA name (+ optional row county) against the catalog.
 * `waters` needs only id+name; pass the full catalog list as-is.
 */
export function resolveWaterAlias(
  twraName: string,
  rowCounty: string | undefined,
  waters: CatalogWaterName[],
): AliasResolution {
  const norm = normalizeName(twraName);
  if (norm.length === 0) return { kind: 'unmatched' };

  // 1. Explicit full-string override — always wins.
  const override: AliasEntry | undefined = TWRA_ALIAS_OVERRIDES[norm];
  if (override) return { kind: 'resolved', waterId: override.waterId, via: 'explicit-alias' };

  // 2. County-keyed alias for colliding bare names.
  const county = normalizeCounty(rowCounty);
  if (county) {
    const countyAlias = TWRA_COUNTY_ALIASES.find((a) => a.nameKey === norm && a.county === county);
    if (countyAlias) return { kind: 'resolved', waterId: countyAlias.waterId, via: 'explicit-county-alias' };
  }

  // 3. Exact normalized match (full name, then base name). Collisions reject.
  const matches = new Map<string, string>(); // waterId -> name
  for (const w of waters) {
    if (normalizeName(w.name) === norm || normalizeName(baseName(w.name)) === norm) {
      matches.set(w.waterId, w.name);
    }
  }
  if (matches.size > 1) return { kind: 'ambiguous', candidates: [...matches.keys()].sort() };
  if (matches.size === 0) return { kind: 'unmatched' };

  const entry = [...matches.entries()][0];
  if (!entry) return { kind: 'unmatched' };
  const [waterId, name] = entry;
  const counties = catalogCounties(name);
  if (counties.length > 0) {
    if (!county) return { kind: 'county-required', waterId, catalogCounties: counties };
    if (!counties.includes(county)) {
      return { kind: 'county-mismatch', waterId, rowCounty: county, catalogCounties: counties };
    }
  }
  return { kind: 'resolved', waterId, via: 'exact-name' };
}

/** convenience: resolved-or-null for mapping loops. */
export function resolveWaterIdOrNull(
  twraName: string,
  rowCounty: string | undefined,
  waters: CatalogWaterName[],
): string | null {
  const r = resolveWaterAlias(twraName, rowCounty, waters);
  return r.kind === 'resolved' ? r.waterId : null;
}
