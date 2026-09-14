/* global console, process */
/**
 * f3-species-mapping.mjs — F3 PREP (gated). Produces the draft species mapping
 * for every catalog water from TWRA evidence; it does NOT edit stream YAML.
 *
 * Inputs:
 *   packages/content/streams/tn/*.yaml   — catalog waters (id, name, fishery,
 *                                          waterbodyType, regionId, species, notes)
 *   apps/web/public/v1/evidence/waters.json — per-water TWRA stocking events
 *                                          (species arrays + source URLs)
 *   an ingest log fragment with unresolvedAliasRows (candidate waters), passed
 *   as --unresolved <json-file> (array of {name, county, reason})
 *
 * Output: packages/content/research/f3-species-mapping.yaml — per water:
 * proposed species with an explicit basis (twra-stocking-evidence,
 * tailwater-program, warmwater-default needs review, …) or needs-evidence.
 * Unknown stays unknown: nothing is proposed without either direct TWRA
 * stocking evidence or a documented program inference that review can reject.
 *
 *   node packages/content/scripts/f3-species-mapping.mjs \
 *     [--unresolved /tmp/unresolved.json]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const contentRoot = resolve(here, '..');
const repoRoot = resolve(contentRoot, '..', '..');
const args = process.argv.slice(2);
const argOf = (flag, def) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : def);

// --- catalog waters ---------------------------------------------------------
const streamsDir = join(contentRoot, 'streams', 'tn');
const waters = [];
for (const f of readdirSync(streamsDir).filter((n) => n.endsWith('.yaml')).sort()) {
  const doc = parse(readFileSync(join(streamsDir, f), 'utf8'));
  waters.push({
    file: `streams/tn/${f}`,
    id: doc.id,
    name: doc.name,
    waterbodyType: doc.waterbodyType ?? null,
    fishery: doc.fishery ?? null,
    regionId: doc.regionId ?? null,
    species: doc.species ?? null,
    county: doc.county ?? null,
    notes: String(doc.notes ?? ''),
  });
}

// --- TWRA stocking evidence per water --------------------------------------
const evidencePath = join(repoRoot, 'apps/web/public/v1/evidence/waters.json');
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
const evByWater = new Map((evidence.waters ?? evidence).map((w) => [w.waterId, w]));

const TWRA_STOCKINGS_URL = 'https://www.tn.gov/twra/fishing/trout-information-stockings.html';
const normSpecies = (s) => {
  const t = String(s).toLowerCase();
  // Cherokee bass is hybrid striped bass, not either the spotted-bass or pure
  // striped-bass contract key. Keep it out of typed species authoring.
  if (t.includes('cherokee bass')) return 'hybrid-striped-bass';
  if (t.includes('rainbow')) return 'rainbow-trout';
  if (t.includes('brown')) return 'brown-trout';
  if (t.includes('brook')) return 'brook-trout';
  if (t.includes('cutbow') || t.includes('cutthroat')) return 'cutthroat-trout';
  if (t.includes('laketrout') || t.includes('lake trout')) return 'lake-trout';
  if (t.includes(' largemouth') || t === 'largemouth' || t.includes('largemouth')) return 'largemouth-bass';
  if (t.includes('smallmouth')) return 'smallmouth-bass';
  if (t.includes('crappie')) return 'crappie';
  if (t.includes('bluegill') || t.includes('bream')) return 'bluegill';
  if (t.includes('catfish')) return 'channel-catfish';
  if (t.includes('striped') || t.includes('striper')) return 'striped-bass';
  if (t.includes('walleye')) return 'walleye';
  if (t.includes('sauger')) return 'sauger';
  return t.replace(/\s+/g, '-');
};

const out = [];
const stats = { evidenced: 0, inferred: 0, needsEvidence: 0 };
for (const w of waters) {
  const ev = evByWater.get(w.id);
  const stocked = new Map(); // normalized species -> {events, sourceUrl}
  for (const e of ev?.stockingEvents ?? []) {
    for (const s of e.species ?? []) {
      const key = normSpecies(s);
      const cur = stocked.get(key) ?? { events: 0, sourceUrl: e.sourceUrl ?? TWRA_STOCKINGS_URL };
      cur.events++;
      stocked.set(key, cur);
    }
  }
  const evidencedTrout = [...stocked.keys()].filter((s) => s.endsWith('-trout'));
  let proposed = [];
  let basis = 'needs-evidence';
  let note = '';

  if (evidencedTrout.length > 0) {
    proposed = evidencedTrout.sort();
    basis = 'twra-stocking-evidence';
    stats.evidenced++;
  } else if (w.fishery === 'tailwater') {
    // TWRA tailwater programs are rainbow+brown staples; this is a documented
    // program inference (reviewable, carries the TWRA tailwaters source), not a
    // silent guess — waters with direct evidence took the branch above.
    proposed = ['rainbow-trout', 'brown-trout'];
    basis = 'tailwater-program-inference';
    note = 'No resolved TWRA stocking rows yet — program inference pending evidence (see T1-7 matcher workstream).';
    stats.inferred++;
  } else if (w.species === 'warmwater' || /warmwater|largemouth|bluegill|bass\b/i.test(w.notes)) {
    proposed = ['largemouth-bass', 'bluegill'];
    basis = 'warmwater-review-needed';
    note = 'Typed from warmwater catalog marker/notes — confirm the assemblage per TWRA lake page before shipping.';
    stats.inferred++;
  } else {
    stats.needsEvidence++;
    note = 'No TWRA evidence in the capture — species stays unknown (F3: unknown stays unknown).';
  }

  out.push({
    id: w.id,
    name: w.name,
    catalogSpecies: w.species,
    fishery: w.fishery,
    waterbodyType: w.waterbodyType,
    regionId: w.regionId,
    proposed,
    basis,
    ...(note ? { note } : {}),
    stockingEvidence: [...stocked.entries()]
      .map(([s, v]) => ({ species: s, events: v.events, sourceUrl: v.sourceUrl }))
      .sort((a, b) => b.events - a.events),
  });
}

// --- unresolved TWRA rows → candidate-water list ----------------------------
const unresolvedPath = argOf('--unresolved', null);
let candidates = [];
if (unresolvedPath && existsSync(unresolvedPath)) {
  const rows = JSON.parse(readFileSync(unresolvedPath, 'utf8'));
  const byKey = new Map();
  for (const r of rows) {
    const key = `${String(r.name).trim().toLowerCase()}|${String(r.county ?? '').trim().toLowerCase()}`;
    const cur = byKey.get(key) ?? { name: r.name, county: r.county ?? null, reason: r.reason, rows: 0 };
    cur.rows++;
    byKey.set(key, cur);
  }
  candidates = [...byKey.values()].sort((a, b) => b.rows - a.rows);
}

const doc = {
  schema: 'draft/f3-species-mapping/0',
  updatedAt: new Date().toISOString(),
  gated: 'DRAFT — do not author stream YAML species fields from this until Session A lands the F1 species enum (contracts).',
  stats: { waters: waters.length, ...stats, candidateWaters: candidates.length },
  waters: out,
  candidateWatersFromUnresolvedAliases: candidates,
};
const outPath = join(contentRoot, 'research', 'f3-species-mapping.yaml');
writeFileSync(outPath, stringify(doc, { lineWidth: 120 }));

console.log(`f3-species-mapping: ${waters.length} waters — evidenced ${stats.evidenced}, inferred (review) ${stats.inferred}, needs-evidence ${stats.needsEvidence}; ${candidates.length} candidate waters from unresolved aliases`);
console.log(`wrote ${outPath}`);
