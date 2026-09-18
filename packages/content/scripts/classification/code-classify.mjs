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

/**
 * The structural conflict rules. Any hit forces confidenceGate:'low' so the
 * water escalates instead of auto-accepting; conflicts are the owner-box
 * feedstock, not errors.
 */
export function findConflicts({ catalogRow }, facets) {
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
  return conflicts;
}

/**
 * Extract the policy facets. "documented" means the field is strictly true —
 * absent/null/false evidence never creates a facet, and per the owner policy
 * holdover/wild absence never subtracts either.
 */
export function extractFacets({ evidenceRecord, stockingRow }) {
  const wild = evidenceRecord?.wildPopulation?.documented === true;
  const holdover = evidenceRecord?.holdover?.documented === true;
  const coldRelease = evidenceRecord?.coldSource?.damTailwater?.releaseType === 'bottom-draw';
  const stockingMonths = stockingMonthsOf(stockingRow);
  const continuousStocking = stockingMonths.length === 12;
  const survivalFacet = wild || holdover || coldRelease;
  const noProgramSignal = stockingMonths.length === 0
    && !(evidenceRecord?.troutSpecies?.length > 0)
    && evidenceRecord?.wildPopulation?.documented !== true;
  return { wild, holdover, coldRelease, stockingMonths, continuousStocking, survivalFacet, noProgramSignal };
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
  } else if (facets.stockingMonths.length > 0) {
    label = LABELS.SEASONAL;
    reasons.push(`stocking program runs ${facets.stockingMonths.length} month(s)/year without a survival facet — seasonal program`);
  } else if (facets.noProgramSignal && (catalog.species === 'warmwater' || catalog.stockingProgram === false)) {
    label = LABELS.NO_TROUT;
    reasons.push('no stocking row and no trout facet; catalog documents a warmwater fishery');
  } else {
    label = LABELS.NO_TROUT;
    reasons.push('insufficient evidence either way — defaulting to no-trout at low confidence (missing data is not proof of absence)');
  }

  const noTroutSourced = label === LABELS.NO_TROUT
    && facets.noProgramSignal
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
export function composeJevState({ evidenceRecord, catalogRow, stockingRow }) {
  const facets = extractFacets({ evidenceRecord, stockingRow });
  const catalog = catalogRow ?? {};
  const lines = [];
  lines.push('Classify this Tennessee water into one of three owner-fixed fishery categories using only the evidence below.');
  if (evidenceRecord?.segment?.description) lines.push(`Catalog segment: ${evidenceRecord.segment.description} (boundaries: ${evidenceRecord.segment.boundaries ?? 'n/a'}).`);
  if (evidenceRecord?.coldSource?.damTailwater?.dam) lines.push(`Dam tailwater: ${evidenceRecord.coldSource.damTailwater.dam} (${evidenceRecord.coldSource.damTailwater.operator ?? 'operator unknown'}), release type ${evidenceRecord.coldSource.damTailwater.releaseType ?? 'unknown'} — ${evidenceRecord.coldSource.damTailwater.evidenceUrl ?? 'no url'}.`);
  if (evidenceRecord?.holdover) lines.push(`Holdover: ${JSON.stringify(evidenceRecord.holdover)}.`);
  if (evidenceRecord?.wildPopulation) lines.push(`Wild population: ${JSON.stringify(evidenceRecord.wildPopulation)}.`);
  if (evidenceRecord?.troutSpecies?.length) lines.push(`Documented trout species: ${JSON.stringify(evidenceRecord.troutSpecies)}.`);
  for (const t of evidenceRecord?.summerTemperature ?? []) lines.push(`Summer water temperature: ${t.celsius} C in month ${t.monthObserved} ${t.year} (${t.sourceType}) — ${t.evidenceUrl}.`);
  lines.push(`TWRA stocking program months: ${facets.stockingMonths.length ? facets.stockingMonths.join(', ') : 'none resolved'}${stockingRow?.type ? ` (${stockingRow.type})` : ''}${stockingRow?.species ? `, species: ${stockingRow.species}` : ''}.`);
  lines.push(`Catalog flags: stockingProgram=${catalog.stockingProgram ?? 'unknown'}, yearRound=${catalog.yearRound ?? 'unknown'}, species=${catalog.species ?? 'unknown'}.`);
  lines.push('Policy rules: (1) wild/self-sustaining population, documented holdover, or a cold controlled release supports year-round on its own. (2) A 12-month stocking program qualifies a water as a year-round trout fishery by itself. (3) Holdover absence never by itself rules out year-round. (4) A seasonal stocking program without a survival facet is a seasonal trout program on warm water. (5) When evidence conflicts, abstain rather than guess.');
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
          instructions: 'Which category does the evidence support for this exact catalog segment? When evidence conflicts or is too thin to decide, answer none.',
          criteria: {
            [LABELS.YEAR_ROUND]: LABEL_TEXT[LABELS.YEAR_ROUND],
            [LABELS.SEASONAL]: LABEL_TEXT[LABELS.SEASONAL],
            [LABELS.NO_TROUT]: LABEL_TEXT[LABELS.NO_TROUT],
            none: 'evidence conflicts or is too thin to decide — abstain',
          },
        },
        yearRoundSurvival: {
          type: 'noul',
          instructions: 'True or false: the evidence supports trout remaining in this exact segment through the entire year.',
        },
        evidenceStrength: {
          type: 'score',
          instructions: 'Rate the strength of the cited evidence (0-1) for deciding this water at all.',
          criteria: [
            '1.0 = multiple agency documents directly address trout presence/survival in this exact segment',
            '0.5 = agency documents address the water or its program but leave survival unresolved',
            '0.0 = no cited source speaks to trout in this segment',
          ],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`typesafe ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const a = json.answers ?? {};
  return {
    decision: 'jev-rated',
    backend: 'jev',
    model: json.model ?? 'jev-latest',
    choice: a.classification?.choice ?? 'none',
    choiceConfidence: a.classification?.confidence ?? 0,
    probabilities: a.classification?.probabilities ?? {},
    yearRoundSurvival: a.yearRoundSurvival?.value ?? a.yearRoundSurvival?.confidence ?? null,
    evidenceStrength: a.evidenceStrength?.value ?? a.evidenceStrength?.score ?? null,
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
