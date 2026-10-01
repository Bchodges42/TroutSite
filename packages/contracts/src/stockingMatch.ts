import type { StockingEvent } from './schemas/stocking.js';
import type { Stream } from './schemas/stream.js';

/**
 * Deterministic association of TWRA stocking-schedule rows to canonical
 * catalog streams (BACKEND-ISSUES B05).
 *
 * The schedule speaks TWRA water names ("Center Hill TW / Caney Fork River");
 * the catalog speaks reach ids ("caney-fork-river"). Substring matching on the
 * stream's first word cross-matches distinct reaches (Shoal Creek vs East Fork
 * Shoal Creek; Sequatchie vs Little Sequatchie; both Duck reaches; both Elk
 * reaches), so resolution runs in strict tiers:
 *
 *   0. county disambiguation — names claimed by multiple catalog waters,
 *      where the TWRA row's county is the identity signal (T1-7)
 *   1. exact normalized name equality
 *   2. the curated alias table below (TWRA names ↔ catalog ids, from the real
 *      published schedule — add rows, never guess)
 *   3. containment between normalized names — only when exactly one stream
 *      claims the event; ties stay UNMATCHED rather than guessed
 *
 * An event maps to at most one stream. Unmatched events are simply not shown
 * as a water's stocking; they remain in the schedule feed itself.
 */

/** Abbreviations TWRA uses in schedule names, expanded before comparing. */
const ABBREV: Array<[RegExp, string]> = [
  [/\btw\b/g, 'tailwater'],
  [/\br\.(?=\s|$)/g, 'river'],
  [/\brvr\b/g, 'river'],
  [/\bfk\b/g, 'fork'],
  [/\bs\.(?=\s)/g, 'south '],
  [/\bn\.(?=\s)/g, 'north '],
  [/\bw\.(?=\s)/g, 'west '],
  [/\be\.(?=\s)/g, 'east '],
  // The alias table below also uses the bare-letter spellings ("S Fork");
  // expand them the same way so table entries and live rows normalize alike
  // (T1-7: "Ft. Patrick Henry TW / S. Fork Holston River" missed its alias
  // because the alias said "s fork" and the row normalized to "south fork").
  [/\bs fork\b/g, 'south fork'],
  [/\bn fork\b/g, 'north fork'],
  [/\bw fork\b/g, 'west fork'],
  [/\be fork\b/g, 'east fork'],
  [/\bs holston\b/g, 'south holston'],
  [/\bmtn\b/g, 'mountain'],
  [/\(new\)/g, ''],
  [/\*/g, ''],
];

export function normalizeWaterName(name: string): string {
  let out = name.toLowerCase().replace(/[’']/g, '');
  for (const [re, to] of ABBREV) out = out.replace(re, to);
  return out.replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * TWRA schedule names that unambiguously denote one catalog reach, including
 * all the "dam TW / river" compounds. Provenance: TWRA published trout
 * stocking schedule (see StockingEvent.sourceUrl) cross-checked against the
 * launch catalog — not inferred from names at runtime.
 */
export const TWRA_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'caney-fork-river': ['center hill tailwater caney fork river', 'caney fork river center hill'],
  'duck-river-tailwater': ['normandy tailwater duck river', 'duck river normandy tailwater'],
  'clinch-river': ['norris tailwater clinch river', 'clinch river norris tailwater'],
  'south-holston-river': [
    's holston tailwater s fork holston river',
    'south holston tailwater south fork holston river',
  ],
  'boone-tailwater': [
    'boone tailwater s fork holston river',
    'boone tailwater south fork holston river',
  ],
  'ft-patrick-henry-tailwater': [
    'ft patrick henry tailwater s fork holston river',
    'fort patrick henry tailwater south fork holston river',
  ],
  'elk-river': ['tims ford tailwater elk river', 'elk river tims ford tailwater'],
  'watauga-river': ['wilbur tailwater watauga river', 'watauga river wilbur tailwater'],
  'obey-river': ['dale hollow tailwater obey river', 'obey river dale hollow tailwater'],
  'hiwassee-river': ['apalachia tailwater hiwassee river', 'hiwassee river apalachia tailwater'],
  'parksville-tailwater': [
    'parksville ocoee 1 tailwater ocoee river',
    'parksville lake tailwater ocoee no 1 reach',
  ],
  'stones-river': ['j percy priest tailwater stones river', 'percy priest tailwater stones river'],
};

const byId = new Map(
  Object.entries(TWRA_ALIASES).map(([id, names]) => [id, names.map(normalizeWaterName)]),
);

/**
 * County disambiguation (T1-7): TWRA rows whose bare name exact-matches or
 * contains MULTIPLE distinct catalog waters. The row's county is the identity
 * signal — it outranks exact-name matching and containment, both of which
 * ignored it and mis-assigned (TWRA "Wolf River" (Fentress) used to land on
 * the Memphis-bound wolf-river-west-tennessee). Provenance: the published TWRA
 * schedule's county column cross-checked against the catalog water's county —
 * add rows, never guess.
 */
const COUNTY_RESOLVES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'wolf river': { fentress: 'wolf-river-fentress' },
  'cane creek': {
    hickman: 'cane-creek-hickman-perry',
    perry: 'cane-creek-hickman-perry',
    bledsoe: 'cane-creek',
    'van buren': 'cane-creek',
  },
};

function aliasTierFor(eventNorm: string): string[] {
  const hits: string[] = [];
  for (const [id, names] of byId) {
    if (names.includes(eventNorm)) hits.push(id);
  }
  return hits;
}

function wordBoundaryContains(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const idx = haystack.indexOf(needle);
  if (idx === -1) return false;
  const beforeOk = idx === 0 || haystack[idx - 1] === ' ';
  const end = idx + needle.length;
  const afterOk = end === haystack.length || haystack[end] === ' ';
  return beforeOk && afterOk;
}

/**
 * Maps every event to at most one stream id. Returns per-stream event lists
 * (sorted newest-first by date) and the count of events left unmatched.
 */
export function matchStocking(
  streams: Array<Pick<Stream, 'id' | 'name' | 'aliases'>>,
  events: StockingEvent[],
): { byStream: Map<string, StockingEvent[]>; unmatched: number } {
  const streamNorm = new Map(
    streams.map((s) => [
      s.id,
      {
        norms: [s.name, ...(s.aliases ?? [])].map(normalizeWaterName),
        raw: s.name.toLowerCase(),
      },
    ]),
  );

  const byStream = new Map<string, StockingEvent[]>();
  let unmatched = 0;

  for (const event of events) {
    const eventNorm = normalizeWaterName(event.streamName);
    let resolved: string | null = null;

    // Tier 0 — county disambiguation for names claimed by more than one
    // catalog water. Runs BEFORE exact/containment so a same-named water in
    // the wrong county can never win (T1-7).
    if (event.county) {
      const countyKey = Object.keys(COUNTY_RESOLVES).find(
        (key) => eventNorm === key || eventNorm.startsWith(`${key} `),
      );
      const byCounty = countyKey ? COUNTY_RESOLVES[countyKey] : undefined;
      const hit = byCounty?.[event.county.toLowerCase()];
      if (hit) resolved = hit;
    }

    // Tier 1 — exact normalized equality against a catalog name or alias;
    // more than one candidate is a same-name ambiguity — stay unresolved.
    if (!resolved) {
      const exact = [...streamNorm]
        .filter(([, meta]) => meta.norms.includes(eventNorm))
        .map(([id]) => id);
      if (exact.length === 1) resolved = exact[0] ?? null;
    }

    // Tier 2 — curated TWRA-name aliases (more than one alias hit would be a
    // table bug; leave it unresolved rather than guess).
    if (!resolved) {
      const aliasHits = aliasTierFor(eventNorm);
      if (aliasHits.length === 1) resolved = aliasHits[0] ?? null;
    }

    // Tier 3 — containment, but only when exactly one stream claims it.
    // Name length can't break ties ("sequatchie river" is contained in BOTH
    // "sequatchie river headwaters" and "little sequatchie river", which are
    // different waters) — a tie stays unmatched rather than guessed.
    if (!resolved) {
      const contain: string[] = [];
      for (const [id, meta] of streamNorm) {
        if (
          meta.norms.some(
            (norm) =>
              wordBoundaryContains(norm, eventNorm) || wordBoundaryContains(eventNorm, norm),
          )
        ) {
          contain.push(id);
        }
      }
      if (contain.length === 1) resolved = contain[0] ?? null;
    }

    if (!resolved) {
      unmatched += 1;
      continue;
    }
    const list = byStream.get(resolved) ?? [];
    list.push(event);
    byStream.set(resolved, list);
  }

  for (const list of byStream.values()) {
    list.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }
  return { byStream, unmatched };
}
