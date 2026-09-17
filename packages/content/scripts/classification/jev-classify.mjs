#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Jev species-classification call — the owner-directed use: after data is
 * obtained, judge whether a water is trout (wild / seasonal / year-round),
 * mixed (warmwater base + seasonal trout), or warmwater. Evidence pack in
 * (wave-ledger sourcing lines with citations + TWRA feed events), one class
 * choice + twelve month judgments out. Shared by the known-answer validator
 * (validate-jev-classification.mjs) and the pipeline's --jev-advisory mode.
 * Output is advisory: decision boxes only, never direct catalog writes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCatalog, loadLedgerDiff, loadStockingGeojson, eventsFromGeojson, resolveEvent, ALIASES, LEDGER_DIR } from './lib.mjs';
import { readKey } from './judge.mjs';

export const MODEL = 'jev-latest';

const catalog = loadCatalog();
const { waters: ledgerWaters } = JSON.parse(readFileSync(join(LEDGER_DIR, 'ledger', 'waters.json'), 'utf8'));
const ledgerBySlug = new Map();
for (const w of ledgerWaters) if (!ledgerBySlug.has(w.slug)) ledgerBySlug.set(w.slug, w);
const { events } = eventsFromGeojson(loadStockingGeojson());
const eventsBySlug = new Map();
for (const ev of events) {
  const r = resolveEvent(ev, catalog, ALIASES);
  if (r.slug) (eventsBySlug.get(r.slug) ?? eventsBySlug.set(r.slug, []).get(r.slug)).push(ev);
}

export const CLASSES = {
  'trout-wild': 'a wild/self-sustaining trout population (may still get supplemental stocking at access points)',
  'trout-stocked-seasonal': 'trout present only in a stocking season/window (put-and-take)',
  'trout-stocked-year-round': 'trout maintained essentially year-round via repeated stocking or cold tailwater releases',
  mixed: 'primarily a warmwater fishery that ALSO receives a seasonal trout stocking',
  warmwater: 'a warmwater fishery with no trout program and no meaningful trout presence',
  unknown: 'the evidence genuinely does not say',
};
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Pack ALL the classification-relevant evidence for one water. */
export function evidenceState(slug) {
  const w = ledgerBySlug.get(slug);
  const parts = [];
  if (w?.slots) {
    for (const label of ['Class', 'Species', 'Stocking', 'Regulations', 'FLAG', 'Note']) {
      for (const l of (w.slots[label] ?? []).slice(0, 2)) {
        const text = String(l.value ?? '').slice(0, 700);
        if (text) parts.push(`[${label}] ${text}`);
      }
    }
  }
  const evs = eventsBySlug.get(slug) ?? [];
  if (evs.length) {
    parts.push(`[TWRA stocking feed] ${evs.length} event(s): ${evs.map((e) => `${e.water} (${e.county} Co), ${e.program} program, species ${e.species.join('/') || 'unparsed'}`).join('; ')}`);
  } else {
    parts.push('[TWRA stocking feed] no stocking events match this water.');
  }
  return parts.join('\n');
}

export const QUESTIONS = {
  trout_class: {
    type: 'choice',
    instructions: 'Classify this water\'s fishery for a Tennessee fishing site. Judge ONLY on the evidence lines; cite nothing, decide. "mixed" is for warmwater-first fisheries with a real seasonal trout program.',
    criteria: CLASSES,
  },
  ...Object.fromEntries(MONTHS.map((m) => [`month_${m}`, {
    type: 'noul',
    instructions: `True if this water holds catchable trout during ${m} in a normal year (stocking window, year-round fishery, or cold tailwater). False if not, or evidence is absent.`,
  }])),
};

export async function callJev(state, attempt = 1) {
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${readKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, model: MODEL, questions: QUESTIONS }),
  });
  if ((res.status === 429 || res.status === 529) && attempt <= 4) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return callJev(state, attempt + 1);
  }
  if (!res.ok) throw new Error(`typesafe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export function watersWithLedger() {
  return loadLedgerDiff().rows;
}
