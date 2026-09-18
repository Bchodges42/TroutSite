/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Stage-2 deterministic classifier (target architecture, 2026-09-18).
 *
 * Pure function over (evidenceRecord, catalogRow, stockingRow) → typed
 * verdict {label, confidence, confidenceGate, facets, reasons, conflicts}.
 * Code decides; Jev arbitrates the residue (see TARGET-ARCHITECTURE.md).
 * Zero cost per run; every verdict is derivable from the named fields.
 *
 * POLICY PRECEDENCE: implements OWNER-POLICY-year-round.md (owner ruling
 * 2026-09-17/18) — year-round status is multi-faceted: holdover/wild/
 * cold-release evidence is sufficient but NEVER required, and a continuously
 * stocked water (12-month program) is a year-round trout fishery on the
 * stocking facet alone. This SUPERSEDES the one point where the earlier
 * CATEGORY_CRITERIA ruling in jev-classify.mjs (2026-09-17) reads "a long or
 * year-round stocking calendar is program evidence, not survival proof by
 * itself": under the newer ruling the stocking facet stands on its own.
 * Holdover absence (documented:false/null) never by itself downgrades a read.
 *
 * The confidence gate is STRUCTURAL (facet presence, citation, conflicts) —
 * no subjective scoring. Any conflict forces confidenceGate:'low' (escalate);
 * escalation to Jev uses composeJevState(), whose state is whitelist
 * evidence-only: NEVER the tentative label, NEVER prior Jev answers
 * (recommendedClass/confidence/flags) — the documented leakage trap
 * (jev-classify.mjs composite guard; the 2026-09-17 review caught exactly
 * this bug class).
 *
 * Advisory only: verdicts land in decision boxes for owner approval, never
 * in direct catalog writes.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMonthLetters } from './stocking-schedule.mjs';

/** Owner-locked label keys (stable API keys; mirrors jev-classify.mjs CATEGORY_LABELS). */
export const LABELS = {
  YEAR_ROUND: 'trout-stream-year-round',
  SEASONAL: 'warmwater-yearly-stocked-winter-trout',
  NO_TROUT: 'warmwater-no-trout',
};

/** Human labels — keep byte-identical to jev-classify.mjs CATEGORY_LABELS. */
export const LABEL_TEXT = {
  [LABELS.YEAR_ROUND]: 'Year Round - Trout Stream (tailwaters, wild trout waters)',
  [LABELS.SEASONAL]: 'Warm Water - Seasonal/Winter Stocking Program',
  [LABELS.NO_TROUT]: 'Warm Water - No Trout',
};

const COLD_MONTHS = new Set([11, 12, 1, 2, 3]);

/** Stocking months from a workbook row (raw "J, F, M, N, D" initials) or pre-parsed array. */
function stockingMonthsOf(stockingRow) {
  if (!stockingRow) return [];
  if (Array.isArray(stockingRow.months)) return [...new Set(stockingRow.months)].sort((a, b) => a - b);
  if (stockingRow.stockingMonthsRaw) return parseMonthLetters(stockingRow.stockingMonthsRaw);
  return [];
}

/** Program evidence from the live ArcGIS feed / warmwater workbook, even without resolved months. */
function feedProgramsOf(stockingRow) {
  return Array.isArray(stockingRow?.feedPrograms) ? stockingRow.feedPrograms : [];
}

/** Fishbrain trout discovery: provisional angler-catch evidence, never abundance. */
function fishbrainTroutOf(fishbrain) {
  return (fishbrain?.troutCatches ?? []).filter((c) => (c.catches ?? 0) > 0);
}

/**
 * The structural conflict rules. Any hit forces confidenceGate:'low' so the
 * water escalates instead of auto-accepting; conflicts are the owner-box
 * feedstock, not errors.
 */
export function findConflicts({ catalogRow, fishbrain }, facets) {
  const conflicts = [];
  const catalog = catalogRow ?? {};
  const hasProgram = facets.stockingMonths.length > 0;

  if (catalog.yearRound === true && hasProgram && !facets.continuousStocking && !facets.survivalFacet
      && facets.stockingMonths.every((m) => COLD_MONTHS.has(m))) {
    conflicts.push('catalog claims year-round but the documented stocking program is cold-season only (Duck-tailwater pattern) — decisive fact unresolved');
  }
  if (catalog.yearRound === true && hasProgram && !facets.continuousStocking && !facets.survivalFacet
      && facets.stockingMonths.length <= 8) {
    conflicts.push('catalog claims year-round but the documented stocking program is seasonal with no survival facet (Boone-tailwater pattern)');
  }
  if (catalog.stockingProgram === false && hasProgram) {
    conflicts.push('catalog says no stocking program but a stocking row/program evidence exists');
  }
  if (catalog.stockingProgram === true && !hasProgram
      && !facets.wild && !facets.holdover && !facets.coldRelease) {
    conflicts.push('catalog claims a stocking program but no program row resolved and no survival facet documented (holston-river / little-tennessee-river owner-box pattern)');
  }
  if ((catalog.species === 'trout' || catalog.fishery === 'wild') && catalog.stockingProgram !== true
      && !hasProgram && !facets.survivalFacet) {
    conflicts.push('catalog documents a trout/wild fishery but no program row or survival facet resolves it — internally unresolved catalog (east-fork-stones-river owner-box pattern)');
  }
  if (facets.fishbrainTrout && !hasProgram && !facets.survivalFacet && catalog.species !== 'warmwater') {
    conflicts.push('angler-catch discovery of trout (Fishbrain, provisional) with no stocking program and no survival facet — who put the trout there?');
  }
  return conflicts;
}

/**
 * Extract the policy facets. "documented" means the field is strictly true —
 * absent/null/false evidence never creates a facet, and per the owner policy
 * holdover/wild absence never subtracts either.
 */
export function extractFacets({ evidenceRecord, stockingRow, fishbrain }) {
  const wild = evidenceRecord?.wildPopulation?.documented === true;
  const holdover = evidenceRecord?.holdover?.documented === true;
  const coldRelease = evidenceRecord?.coldSource?.damTailwater?.releaseType === 'bottom-draw';
  const stockingMonths = stockingMonthsOf(stockingRow);
  const feedPrograms = feedProgramsOf(stockingRow);
  const continuousStocking = stockingMonths.length === 12;
  const survivalFacet = wild || holdover || coldRelease;
  const fishbrainTrout = fishbrainTroutOf(fishbrain).length > 0;
  const noProgramSignal = stockingMonths.length === 0 && feedPrograms.length === 0
    && !(evidenceRecord?.troutSpecies?.length > 0)
    && evidenceRecord?.wildPopulation?.documented !== true;
  return { wild, holdover, coldRelease, stockingMonths, feedPrograms, continuousStocking, survivalFacet, fishbrainTrout, noProgramSignal };
}

/**
 * The decision. Label follows from facets with owner-policy precedence:
 * survival facet OR continuous stocking → year-round; else any stocking
 * program → seasonal; else no-trout (with low gate when the evidence base
 * is thin — missing data is not proof of absence).
 */
export function classify(input) {
  const { evidenceRecord, catalogRow } = input;
  const catalog = catalogRow ?? {};
  const facets = extractFacets(input);
  const conflicts = findConflicts(input, facets);
  const reasons = [];
  let label;

  if (facets.survivalFacet || facets.continuousStocking) {
    label = LABELS.YEAR_ROUND;
    if (facets.wild) reasons.push('wildPopulation.documented=true — wild/self-sustaining facet');
    if (facets.holdover) reasons.push('holdover.documented=true — holdover facet (sufficient, not required)');
    if (facets.coldRelease) reasons.push('coldSource.damTailwater.releaseType=bottom-draw — cold-release facet');
    if (facets.continuousStocking) reasons.push('stocking program covers all 12 months — continuous-stocking facet qualifies on its own (owner policy 2026-09-17/18)');
  } else if (facets.stockingMonths.length > 0 || facets.feedPrograms.length > 0) {
    label = LABELS.SEASONAL;
    reasons.push(facets.stockingMonths.length > 0
      ? `stocking program runs ${facets.stockingMonths.length} month(s)/year without a survival facet — seasonal program`
      : `stocking feed documents a program (${facets.feedPrograms.join(', ')}) without resolved months — seasonal program, timing unresolved`);
  } else if (facets.noProgramSignal && (catalog.species === 'warmwater' || catalog.stockingProgram === false)) {
    label = LABELS.NO_TROUT;
    reasons.push('no stocking row and no trout facet; catalog documents a warmwater fishery');
  } else {
    label = LABELS.NO_TROUT;
    reasons.push('insufficient evidence either way — defaulting to no-trout at low confidence (missing data is not proof of absence)');
  }

  const noTroutSourced = label === LABELS.NO_TROUT
    && facets.noProgramSignal
    && !facets.fishbrainTrout
    && (catalog.species === 'warmwater'
      || (evidenceRecord ? (evidenceRecord.sourcesChecked?.length ?? 0) >= 3 : false));
  const gateHigh = conflicts.length === 0 && (
    facets.wild
    || facets.holdover
    || (facets.coldRelease && facets.stockingMonths.length > 0)
    || facets.continuousStocking
    || (noTroutSourced && (evidenceRecord ? (evidenceRecord.sourcesChecked?.length ?? 0) >= 3 : true))
  );

  let confidence = 0.4;
  if (facets.wild) confidence += 0.2;
  if (facets.holdover) confidence += 0.2;
  if (facets.coldRelease) confidence += 0.1;
  if (facets.continuousStocking) confidence += 0.2;
  if (label === LABELS.SEASONAL) confidence += 0.1;
  if (noTroutSourced) confidence += 0.2;
  if (conflicts.length > 0) confidence = Math.min(confidence, 0.49);
  confidence = Math.round(Math.min(confidence, 0.99) * 100) / 100;

  return {
    label,
    labelText: LABEL_TEXT[label],
    confidence,
    confidenceGate: gateHigh ? 'high' : 'low',
    escalate: !gateHigh,
    facets,
    reasons,
    conflicts,
  };
}

/**
 * Whitelist Jev state — evidence only. Deliberately EXCLUDES: the code
 * classifier's label/confidence/gate, any prior Jev answer
 * (recommendedClass/confidence/flags/jev fields), and every key those names
 * could hide behind. This is the leakage guard; do not loosen it.
 */
export function composeJevState({ evidenceRecord, catalogRow, stockingRow, fishbrain }) {
  const facets = extractFacets({ evidenceRecord, stockingRow, fishbrain });
  const catalog = catalogRow ?? {};
  const yn = (b) => (b === true ? 'yes' : b === false ? 'no' : 'unknown');
  const lines = [];
  lines.push('Classify this Tennessee water into one of three owner-fixed fishery categories using only the evidence below. The three categories: "Year Round - Trout Stream (tailwaters, wild trout waters)" / "Warm Water - Seasonal/Winter Stocking Program" / "Warm Water - No Trout".');
  lines.push('--- facet summary (derived from the cited evidence below) ---');
  lines.push(`wild/self-sustaining trout population documented: ${yn(evidenceRecord?.wildPopulation?.documented)}`);
  lines.push(`holdover documented: ${yn(evidenceRecord?.holdover?.documented)}`);
  lines.push(`cold controlled release (bottom-draw dam tailwater): ${yn(facets.coldRelease ? true : (evidenceRecord?.coldSource?.damTailwater?.releaseType === 'epilimnion' ? false : null))}`);
  lines.push(`stocking program: months ${facets.stockingMonths.length ? facets.stockingMonths.join(', ') + ` (${facets.stockingMonths.length} of 12)` : 'none resolved'}; live-feed/warmwater program signals: ${facets.feedPrograms.length ? facets.feedPrograms.join(', ') : 'none'}`);
  if (fishbrain) {
    lines.push(`Fishbrain angler-catch discovery (PROVISIONAL — discovery evidence, NOT a biological abundance estimate): ${fishbrain.troutCatches?.length ? 'trout caught — ' + fishbrain.troutCatches.map((c) => `${c.name} (${c.catches} catches)`).join(', ') : 'no trout in the recorded catch list'}. Top species: ${fishbrain.topSpecies?.join(', ') || 'none recorded'}.`);
  }
  if (evidenceRecord?.segment?.description) lines.push(`Catalog segment: ${evidenceRecord.segment.description} (boundaries: ${evidenceRecord.segment.boundaries ?? 'n/a'}).`);
  if (evidenceRecord?.coldSource?.damTailwater?.dam) lines.push(`Dam tailwater: ${evidenceRecord.coldSource.damTailwater.dam} (${evidenceRecord.coldSource.damTailwater.operator ?? 'operator unknown'}), release type ${evidenceRecord.coldSource.damTailwater.releaseType ?? 'unknown'} — ${evidenceRecord.coldSource.damTailwater.evidenceUrl ?? 'no url'}.`);
  if (evidenceRecord?.holdover) lines.push(`Holdover detail: ${evidenceRecord.holdover.documented === null ? 'unknown' : evidenceRecord.holdover.documented ? 'documented' : 'not documented'} — ${evidenceRecord.holdover.detail ?? ''} (${evidenceRecord.holdover.evidenceUrl ?? ''}).`);
  if (evidenceRecord?.wildPopulation) lines.push(`Wild population detail: ${evidenceRecord.wildPopulation.documented === null ? 'unknown' : evidenceRecord.wildPopulation.documented ? 'documented' : 'not documented'} — ${evidenceRecord.wildPopulation.detail ?? ''} (${evidenceRecord.wildPopulation.evidenceUrl ?? ''}).`);
  if (evidenceRecord?.troutSpecies?.length) lines.push(`Documented trout species: ${evidenceRecord.troutSpecies.map((s) => `${s.species} (${s.basis})`).join('; ')}.`);
  for (const t of evidenceRecord?.summerTemperature ?? []) lines.push(`Summer water temperature: ${t.celsius} C in month ${t.monthObserved} ${t.year} (${t.sourceType}) — ${t.evidenceUrl}.`);
  lines.push(`Catalog flags (may be stale or wrong — evidence outranks them): stockingProgram=${catalog.stockingProgram ?? 'unknown'}, yearRound=${catalog.yearRound ?? 'unknown'}, species=${catalog.species ?? 'unknown'}.`);
  lines.push('--- policy rules (owner-fixed) ---');
  lines.push('(1) A wild/self-sustaining population, documented holdover, or a cold controlled release supports "Year Round - Trout Stream" on its own. (2) A 12-month continuous stocking program qualifies a water as "Year Round - Trout Stream" by itself. (3) Holdover absence never by itself rules out year-round. (4) A seasonal stocking program without any year-round facet is "Warm Water - Seasonal/Winter Stocking Program". (5) No trout program and no trout evidence is "Warm Water - No Trout".');
  lines.push('Weigh ALL the cited evidence and pick the best-supported category. Catalog flags conflicting with program data are a reason to weigh evidence carefully, NOT a reason to abstain. Reserve "none" ONLY for the case where no cited source speaks to trout in this segment at all.');
  return lines;
}

function loadKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY.trim();
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '.env');
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8').split('\n').find((l) => l.startsWith('TYPESAFE_API_KEY='));
  return line ? line.slice('TYPESAFE_API_KEY='.length).trim() : null;
}

/**
 * Ask Jev to rate one escalated water. One cheap call: Choice over the three
 * canonical labels plus a Noul year-round truth test and a Score for evidence
 * strength, all against the same whitelist state. Returns the typed answers —
 * the CALLER compares them with the code verdict via resolveEscalation().
 * Never fabricates answers: no key → {decision:'escalate-pending'}.
 */
export async function escalateJev(input) {
  const key = loadKey();
  if (!key) return { decision: 'escalate-pending', reason: 'TYPESAFE_API_KEY not set (gitignored .env)' };
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state: composeJevState(input).join('\n'),
      model: 'jev-latest',
      questions: {
        classification: {
          type: 'choice',
          instructions: 'Which category does the cited evidence best support for this exact catalog segment? Weigh the facet summary and the detailed evidence; catalog flags may be stale. Answer none ONLY if no cited source speaks to trout in this segment at all.',
          criteria: {
            [LABELS.YEAR_ROUND]: LABEL_TEXT[LABELS.YEAR_ROUND],
            [LABELS.SEASONAL]: LABEL_TEXT[LABELS.SEASONAL],
            [LABELS.NO_TROUT]: LABEL_TEXT[LABELS.NO_TROUT],
            none: 'no cited source speaks to trout in this segment at all',
          },
        },
        yearRoundSurvival: {
          type: 'noul',
          instructions: 'True or false: the cited evidence supports trout remaining in this exact segment through the entire year (via survival, self-sustaining population, cold release, or continuous stocking).',
        },
        evidenceStrength: {
          type: 'score',
          instructions: 'Rate the strength of the cited evidence (0-1) for deciding this water at all.',
          criteria: [
            '1.0 = multiple agency documents directly address trout presence/survival in this exact segment',
            '0.5 = agency documents address the water or its program but leave the category unresolved',
            '0.0 = no cited source speaks to trout in this segment',
          ],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`typesafe ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const a = json.answers ?? {};
  const strength = a.evidenceStrength?.score;
  return {
    decision: 'jev-rated',
    backend: 'jev',
    model: json.model ?? 'jev-latest',
    choice: a.classification?.choice ?? 'none',
    choiceConfidence: a.classification?.confidence ?? 0,
    probabilities: a.classification?.probabilities ?? {},
    yearRoundSurvival: typeof a.yearRoundSurvival?.noul === 'number' ? a.yearRoundSurvival.noul : null,
    evidenceStrength: typeof strength === 'number' ? Math.max(0, Math.min(1, strength)) : null,
  };
}

/**
 * Branch on the typed answers: agreement → accept; disagreement or Jev
 * abstaining → owner box. Disagreement is itself a thin-evidence signal.
 */
export function resolveEscalation(jevAnswer, codeLabel) {
  if (!jevAnswer || jevAnswer.decision === 'escalate-pending') return { resolution: 'escalate-pending' };
  if (jevAnswer.choice === 'none') return { resolution: 'owner-box', reason: 'Jev abstained — evidence too thin or conflicting' };
  if (jevAnswer.choice === codeLabel) return { resolution: 'accept' };
  return { resolution: 'owner-box', reason: `code and Jev disagree: code=${codeLabel}, jev=${jevAnswer.choice}` };
}
