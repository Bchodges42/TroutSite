#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Judgment seam for the classification pipeline.
 *
 * The pipeline's entity-resolution and evidence-support calls go through this
 * interface. Backends:
 *   - 'deterministic' — alias + county matcher (lib.mjs resolveEvent); already
 *     ABOVE BAR on the known-answer suite.
 *   - 'jev' — TypeSafe Jev (docs.typesafe.ai/api: POST /v1/systemone, Bearer
 *     key, choice questions → {choice, probabilities, confidence}). Key lives
 *     in the gitignored .env (TYPESAFE_API_KEY). Owner verified + supplied
 *     2026-09-17; pricing ~$0.042/M input tokens remains marketing-claimed.
 *
 * EITHER WAY the output is advisory: verdicts land in decision boxes for
 * owner approval, never in direct catalog writes. The known-answer suite
 * (validate-jev.mjs) gates any promotion from advisory to load-bearing.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pointInBounds } from './lib.mjs';

const insideLabel = (bounds, coord) => (coord && bounds ? (pointInBounds(bounds, coord) ? "the stocking point IS inside this water's mapped bounds" : 'stocking point outside its bounds') : 'no bounds check');

export const ACTIVE = 'deterministic'; // jev scored 10/12 (83%) < 90% bar on
// validate-jev.mjs 2026-09-17 — both misses were SAFE ABSTENTIONS (it refused
// county-contradicted picks incl. the Mill Creek trap), but it needs the
// wave-3 alias facts to clear puncheon/caney-fork, and that knowledge already
// lives in the deterministic layer. Re-gate before flipping.

function loadKey() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '.env');
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8').split('\n').find((l) => l.startsWith('TYPESAFE_API_KEY='));
  return line ? line.slice('TYPESAFE_API_KEY='.length).trim() : null;
}

/** Key accessor for the validation harnesses (never logged, never committed). */
export function readKey() {
  return loadKey();
}

/**
 * Ask Jev which catalog water a TWRA stocking row refers to.
 * candidates: [{ slug, name, counties, bounds }] — pure data in, typed
 * verdict out. When the event carries a point, each candidate gets a
 * computed containment fact (point inside its mapped bounds?) — evidence,
 * not judgment. Always includes a 'none' escape hatch; returns {choice,
 * confidence, probabilities, model} or throws on non-2xx.
 */
export async function jevResolve(event, candidates) {
  const key = loadKey();
  if (!key) throw new Error('TYPESAFE_API_KEY not set (gitignored .env)');
  const criteria = { none: 'none of these catalog waters — the row refers to a water not in the catalog, or the evidence rules every candidate out' };
  const stateLines = [
    `TWRA trout stocking row: water="${event.water}", access site="${event.site}", county=${event.county || '(none)'}, program=${event.program}.`,
    event.sampleCoord ? `The row's mapped stocking point is [${event.sampleCoord[1]}, ${event.sampleCoord[0]}] (lat, lon).` : null,
    'Candidate waters from the site catalog:',
    ...candidates.map((c, i) => `${i + 1}. ${c.slug} — ${c.name}${c.counties.length ? ` (counties: ${c.counties.join(', ')})` : ''} — ${insideLabel(c.bounds, event.sampleCoord)}`),
  ].filter(Boolean).join('\n');
  for (const c of candidates) criteria[c.slug] = c.name + (c.counties.length ? ` (${c.counties.join(', ')})` : '');
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state: stateLines,
      model: 'jev-latest',
      questions: {
        water: {
          type: 'choice',
          instructions: 'Which catalog water does this TWRA stocking row refer to? Judge by the water name and county; if the county contradicts every candidate or no candidate matches the water, answer none. (Do NOT promote bounds/name above county: the 2026-09-17 gate run proved that weighting recovers two abstentions but makes a confident wrong grab on the Mill Creek (Hickman) county-contradiction trap — abstaining is the failure mode we can live with, grabbing is not.)',
          criteria,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`typesafe ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const a = json.answers?.water;
  return { choice: a?.choice ?? 'none', confidence: a?.confidence ?? 0, probabilities: a?.probabilities ?? {}, model: json.model ?? 'jev-latest', backend: 'jev' };
}

/**
 * Resolve a stocking event against candidate catalog waters (deterministic
 * default; unchanged — see lib.mjs resolveEvent for the canonical rules).
 */
export function resolve(event, candidates) {
  if (!candidates || candidates.length === 0) {
    return { decision: 'unmatched', confidence: 1, rationale: 'no candidates supplied', backend: ACTIVE };
  }
  const wanted = event.normName;
  const county = event.normCounty;
  const exact = candidates.filter((c) => c.normNames.includes(wanted));
  if (exact.length === 1) {
    const c = exact[0];
    if (county && c.counties.length > 0 && !c.counties.includes(county)) {
      return { decision: 'ambiguous', confidence: 1, rationale: `county mismatch: event ${event.county}, candidate ${c.counties.join('/')}`, candidates: [c.slug], backend: ACTIVE };
    }
    return { decision: c.slug, confidence: 0.95, rationale: 'unique normalized-name match', backend: ACTIVE };
  }
  const byCounty = exact.filter((c) => c.counties.includes(county));
  if (byCounty.length === 1) {
    return { decision: byCounty[0].slug, confidence: 0.95, rationale: 'name + county match', backend: ACTIVE };
  }
  const core = candidates.filter((c) => c.counties.includes(county) && c.coreName === event.normCore);
  if (core.length === 1) {
    return { decision: core[0].slug, confidence: 0.8, rationale: 'type-word-stripped core name, county-confirmed', backend: ACTIVE };
  }
  return {
    decision: 'ambiguous',
    confidence: 1,
    rationale: byCounty.length > 1 ? `${byCounty.length} county matches` : 'no unique match',
    candidates: (byCounty.length ? byCounty : exact).map((c) => c.slug),
    backend: ACTIVE,
  };
}
