#!/usr/bin/env node
/* eslint-disable no-undef -- Node infra script (portable shell hosts) */
/**
 * Jev fishability scorer — HOURLY (owner direction 2026-09-17).
 *
 * For every catalog water with live gauge coverage, gather:
 *   month · stocking recency (official schedule + /v1/stocking events) ·
 *   gauge flow + trend (cfs) · recent rain (gauge precipitation) ·
 *   water temperature · species/classification · authored season window
 * …and ask Jev (TypeSafe System One, /v1/systemone) for one 0–100 fishability
 * score in the owner's fixed 10-point bands (91-100 … 0-10).
 *
 * Cost/freshness balance (the owner asked for pushback): the JOB runs hourly,
 * but Jev is only consulted when a water's input fingerprint CHANGED or its
 * last score is older than 6 h — conditions drift slowly and judgment does
 * not need to be re-bought hourly. Hard cap of 60 Jev calls per run; the rest
 * carry forward their previous score or fall back to the deterministic
 * condition score, always labeled with its source ('jev' | 'carryforward' |
 * 'fallback') so nothing pretends to be a live judgment.
 *
 * Output: $TROUT_SNAPSHOTS_DIR/v1/fishability-jev/latest.json (+ per-run cache
 * in backups/). Read-path only — never touches catalog YAML or the DB.
 *
 * Env: TYPESAFE_API_KEY (gitignored .env at repo root), TROUT_SNAPSHOTS_DIR
 * (default apps/web/public), TROUT_JEV_MAX_CALLS (default 60),
 * TROUT_JEV_STALE_HOURS (default 6).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd().endsWith('infra') ? join(process.cwd(), '..') : process.cwd();
const SNAPSHOTS = process.env.TROUT_SNAPSHOTS_DIR
  ? process.env.TROUT_SNAPSHOTS_DIR
  : join(ROOT, 'apps', 'web', 'public');
const V1 = join(SNAPSHOTS, 'v1');
const OUT_PATH = join(V1, 'fishability-jev', 'latest.json');
const CACHE_PATH = join(ROOT, 'backups', 'jev-fishability-cache.json');
const CALENDAR_PATH = join(ROOT, 'packages', 'content', 'data', 'trout-calendar.json');

export const BANDS = [
  { min: 91, max: 100, label: '91-100', word: 'prime' },
  { min: 81, max: 90, label: '81-90', word: 'excellent' },
  { min: 71, max: 80, label: '71-80', word: 'good' },
  { min: 61, max: 70, label: '61-70', word: 'decent' },
  { min: 51, max: 60, label: '51-60', word: 'fair' },
  { min: 41, max: 50, label: '41-50', word: 'marginal' },
  { min: 31, max: 40, label: '31-40', word: 'poor' },
  { min: 21, max: 30, label: '21-30', word: 'very-poor' },
  { min: 11, max: 20, label: '11-20', word: 'dead' },
  { min: 0, max: 10, label: '0-10', word: 'skip-it' },
];

export function bandFor(score) {
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const band = BANDS.find((b) => s >= b.min && s <= b.max) ?? BANDS[BANDS.length - 1];
  return { band: band.label, word: band.word };
}

/** TypeSafe `score` answers are a LEVEL INDEX across the criteria list
 *  (0-9 for ten bands; fractional = between bands, per the docs' "can fall
 *  between levels"). Convert to the owner's 0-100 presentation scale. */
export function levelIndexTo100(levelScore) {
  const n = Number(levelScore);
  if (!Number.isFinite(n)) return null;
  return Math.max(5, Math.min(100, Math.round(((n + 0.5) / BANDS.length) * 100)));
}

export function inputHash(inputs) {
  // key-order-insensitive: the fingerprint must not change because callers
  // built the object in a different order
  const stable = (v) => (v && typeof v === 'object' && !Array.isArray(v)
    ? Object.keys(v).sort().reduce((o, k) => ({ ...o, [k]: stable(v[k]) }), {})
    : v);
  return createHash('sha1').update(JSON.stringify(stable(inputs))).digest('hex').slice(0, 16);
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function readKey() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return process.env.TYPESAFE_API_KEY ?? null;
  const line = readFileSync(envPath, 'utf8').split('\n').find((l) => l.startsWith('TYPESAFE_API_KEY='));
  return line ? line.slice('TYPESAFE_API_KEY='.length).trim() : process.env.TYPESAFE_API_KEY ?? null;
}

/** Normalized TWRA name → catalog stream, reusing the same tiered idea as the
 *  web matcher (exact normalized, then unambiguous containment). */
function normalizeName(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\btw\b/g, 'tailwater')
    .replace(/\br\.(?=\s|$)/g, 'river')
    .replace(/[.']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMatcher(streams) {
  const byName = new Map();
  for (const s of streams) {
    const names = [s.name, s.id.replace(/-/g, ' ')];
    for (const n of names) {
      const key = normalizeName(n);
      if (!byName.has(key)) byName.set(key, s);
    }
  }
  return function match(twraName) {
    const want = normalizeName(twraName);
    const exact = byName.get(want);
    if (exact) return exact;
    const contains = streams.filter((s) => {
      const n = normalizeName(s.name);
      return n.includes(want) || want.includes(n);
    });
    return contains.length === 1 ? contains[0] : null;
  };
}

/** Gather the per-water input objects the scorer judges from. */
export function collectInputs({ streams, conditions, stockingEvents, calendar, now = new Date() }) {
  const match = buildMatcher(streams);
  const month = now.getMonth() + 1;
  const eventsByStream = new Map();
  for (const ev of stockingEvents ?? []) {
    const s = match(ev.stream_name ?? ev.streamName ?? '');
    if (!s) continue;
    const list = eventsByStream.get(s.id) ?? [];
    list.push(ev);
    eventsByStream.set(s.id, list);
  }
  const condById = new Map((conditions ?? []).map((c) => [c.streamId, c]));
  const out = [];
  for (const stream of streams) {
    const cond = condById.get(stream.id);
    const readings = (cond?.readings ?? []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestCfs = readings.find((r) => typeof r.cfs === 'number')?.cfs ?? null;
    const prevCfs = readings.filter((r) => typeof r.cfs === 'number')[1]?.cfs ?? null;
    const tempC = readings.find((r) => typeof r.tempC === 'number')?.tempC ?? null;
    const rainMm = readings.find((r) => typeof r.precipitationMm === 'number')?.precipitationMm ?? null;
    const events = eventsByStream.get(stream.id) ?? [];
    const days = events
      .map((e) => (now.getTime() - new Date(e.date).getTime()) / 86_400_000)
      .filter((d) => Number.isFinite(d) && d >= 0).map((d) => Math.floor(d));
    const daysSinceStock = days.length ? Math.round(Math.min(...days)) : null;
    const calClass = calendar?.waters?.[stream.id]?.classification ?? null;
    out.push({
      slug: stream.id,
      name: stream.name,
      inputs: {
        month,
        classification: stream.species ?? calClass ?? 'unknown',
        windowMonths: stream.seasonMonths ?? null,
        stockedRecently: daysSinceStock,
        flowCfs: latestCfs,
        flowTrend: latestCfs != null && prevCfs ? (latestCfs > prevCfs ? 'rising' : latestCfs < prevCfs ? 'falling' : 'stable') : null,
        idealFlow: stream.idealFlow ?? null,
        rainMmLastReading: rainMm,
        waterTempC: tempC,
      },
    });
  }
  return out;
}

const BAND_LEGEND = BANDS.map((b) => `${b.label} = ${b.word}`).join('; ');

async function jevScore(state, key, attempt = 1) {
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state,
      model: 'jev-latest',
      questions: {
        fishability: {
          type: 'score',
          instructions:
            'Score how good the trout fishing will be on this water for the next few days, 0-100. Weigh stocking recency (a fresh stocking makes normally-warm waters worth fishing), whether the month is inside the water\'s trout window, flow level and trend vs its ideal range, recent rain (rising muddy water is poor), and water temperature for TROUT activity. Judge the water as described — do not invent gauge values.',
          criteria: [
            '0-10 unfishable: no water, dangerous flow, lethally hot, or nothing in the water',
            '11-20 effectively unfishable',
            '21-30 very poor: fish present but conditions shut them down',
            '31-40 poor',
            '41-50 marginal: a few fish may respond',
            '51-60 fair: fishable, no more',
            '61-70 decent: active fish in places',
            '71-80 good: good catch odds for a competent angler',
            '81-90 excellent: fish active, conditions aligned',
            '91-100 prime: peak conditions on every factor',
          ],
        },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if ((res.status === 429 || res.status === 529) && attempt <= 3) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return jevScore(state, key, attempt + 1);
  }
  if (!res.ok) throw new Error(`typesafe ${res.status}`);
  return res.json();
}

async function main() {
  const now = new Date();
  // streams.json at v1 root, or the per-state file the fixture tree uses
  const streams = readJson(join(V1, 'streams.json'), readJson(join(V1, 'streams', 'TN.json'), readJson(join(V1, 'streams'), [])));
  const conditions = readJson(join(V1, 'conditions', 'latest.json'), []);
  const stockingEvents = readJson(join(V1, 'stocking', 'TN.json'), []);
  const calendar = readJson(CALENDAR_PATH, null);
  if (!streams.length || !conditions.length) {
    console.error('jev-fishability: no snapshots yet — run refresh-data first');
    process.exit(1);
  }

  const targets = collectInputs({ streams, conditions, stockingEvents, calendar, now });
  const previous = readJson(OUT_PATH, { scores: {} });
  const prevBySlug = previous.scores ?? {};
  const cache = readJson(CACHE_PATH, {});

  const key = readKey();
  const maxCalls = Number(process.env.TROUT_JEV_MAX_CALLS ?? 60);
  const staleHours = Number(process.env.TROUT_JEV_STALE_HOURS ?? 6);
  const scores = {};
  let called = 0;
  let fallbacks = 0;

  for (const { slug, inputs } of targets) {
    const hash = inputHash(inputs);
    const prev = prevBySlug[slug];
    const cached = cache[slug];
    const fresh = cached && cached.hash === hash
      && (now.getTime() - new Date(cached.scoredAt).getTime()) < staleHours * 3_600_000;
    if (fresh && prev && cached.scoredAt === prev.judgedAt) {
      scores[slug] = { ...prev, source: prev.source === 'jev' ? 'carryforward' : prev.source };
      continue;
    }
    const deterministic = (() => {
      const cond = conditions.find((c) => c.streamId === slug);
      return cond?.score?.assessed ? cond.score.value : null;
    })();
    if (!key || called >= maxCalls) {
      scores[slug] = {
        slug,
        score: deterministic ?? prev?.score ?? null,
        ...bandFor(deterministic ?? prev?.score ?? 0),
        source: 'fallback',
        judgedAt: prev?.judgedAt ?? null,
        inputs,
      };
      fallbacks += 1;
      continue;
    }
    try {
      const state = {
        water: { name: inputs.name, id: slug, classification: inputs.classification, windowMonths: inputs.windowMonths },
        now: { month: inputs.month },
        stocking: { daysSinceLastStocking: inputs.stockedRecently },
        gauge: { flowCfs: inputs.flowCfs, flowTrend: inputs.flowTrend, idealFlow: inputs.idealFlow, rainMmLastReading: inputs.rainMmLastReading },
        waterTempC: inputs.waterTempC,
        note: 'All values are measured readings from this water\'s gauges or the official stocking calendar. Score the TROUT fishing outlook.',
      };
      const json = await jevScore(state, key);
      const answer = json.answers?.fishability;
      const level = answer?.score;
      const score = levelIndexTo100(level) ?? 0;
      scores[slug] = {
        slug,
        score,
        ...bandFor(score),
        confidence: answer?.confidence ?? null,
        source: 'jev',
        model: json.model ?? 'jev-latest',
        judgedAt: now.toISOString(),
        inputs,
      };
      cache[slug] = { hash, scoredAt: now.toISOString() };
      called += 1;
    } catch (e) {
      scores[slug] = {
        slug, score: deterministic ?? prev?.score ?? null,
        ...bandFor(deterministic ?? prev?.score ?? 0),
        source: 'fallback', error: String(e.message ?? e).slice(0, 120), inputs,
      };
      fallbacks += 1;
    }
  }

  mkdirSync(join(V1, 'fishability-jev'), { recursive: true });
  mkdirSync(join(ROOT, 'backups'), { recursive: true });
  const output = {
    generated: now.toISOString(),
    model: 'jev-latest',
    bands: BANDS.map((b) => b.label),
    counts: {
      waters: targets.length,
      jevScored: Object.values(scores).filter((s) => s.source === 'jev').length,
      carryforward: Object.values(scores).filter((s) => s.source === 'carryforward').length,
      fallback: fallbacks,
    },
    scores,
  };
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 1));
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
  console.log(`jev-fishability: ${targets.length} waters — ${called} Jev calls, ${fallbacks} fallbacks → ${OUT_PATH}`);
}

// Run when executed directly; tests import the pure helpers instead.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main().catch((e) => {
    console.error('jev-fishability failed:', e.message);
    process.exit(1);
  });
}
