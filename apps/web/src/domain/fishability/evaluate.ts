// evaluateWater — the pure, month-aware decision engine.
//
// Deterministic: all time derives from input.now (UTC-normalized, see
// time.ts); no Date.now(), no randomness, no I/O, no React. The same
// input always produces the same decision on any machine/timezone.
//
// The trout-applicability classifier is mode-independent background
// truth; `mode` decides presentation (displayMetric, fishability banding,
// visibility). See docs/FISHABILITY-MODEL.md for the decision table.

import {
  BASIS_AUTHORITY,
  CONFIDENCE_RANK,
  FISHABILITY_CONFIG,
  MODEL_VERSION,
} from './config';
import {
  freshestObservation,
  freshnessOf,
  generalFishabilityBand,
  hasUsableFlowEvidence,
  readTemperature,
  troutConditionBand,
  bandConfidence,
  type TemperatureRead,
} from './observations';
import {
  classifySpecies,
  hasAnyTroutEvidence,
  strongestNonTroutEvidence,
  strongestTroutEvidence,
} from './species';
import { elapsedDays, toUtcMs, utcMonth } from './time';
import type {
  DecisionDebug,
  EvidenceConfidence,
  FishabilityInput,
  Observation,
  StockingEvent,
  TroutApplicability,
  WaterDecision,
} from './types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const YEAR_ROUND_BASES = new Set(['wild-population', 'year-round-managed']);

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatTemp(value: number): string {
  return `${round1(value)}°C`;
}

function evidenceId(prefix: string, parts: Array<string | number>): string {
  return [prefix, ...parts.map(String)].join(':');
}

/**
 * Canonical UTC forms for evidence ids, so the same instant written as
 * `2026-02-10`, `2026-02-10T00:00:00Z`, or with an offset yields the same
 * id — a determinism requirement, since evidenceUsed is part of the
 * comparable decision output.
 */
function canonicalDate(iso: string): string {
  return new Date(toUtcMs(iso, 'timestamp')).toISOString().slice(0, 10);
}

function canonicalInstant(iso: string): string {
  return new Date(toUtcMs(iso, 'timestamp')).toISOString();
}

export type StockingProfile = {
  lastCompleted: StockingEvent | null;
  lastCompletedAgeDays: number | null;
  /**
   * Youngest plausible age (nominal − precision grace): generous to
   * presence, and conservative against absence claims.
   */
  youngestPlausibleAgeDays: number | null;
  /** Oldest plausible age (nominal + precision grace): used only to decide high-confidence absence. */
  oldestPlausibleAgeDays: number | null;
  upcomingScheduled: StockingEvent | null;
  hasAnyTroutStockingRecord: boolean;
  retentionDays: number;
};

/**
 * A stocking event counts as trout-relevant evidence when it carries no
 * species list (TWRA put-and-take default) or any entry is not
 * explicitly a non-trout species. Events dated in the future cannot be
 * "reported-complete"; they are demoted with a caution rather than used.
 */
function isTroutStockingEvent(event: StockingEvent): boolean {
  if (!event.species || event.species.length === 0) return true;
  return event.species.some((s) => classifySpecies(s) !== 'non-trout');
}

export function buildStockingProfile(
  input: FishabilityInput,
  nowMs: number,
): { profile: StockingProfile; cautions: string[]; usedEvents: StockingEvent[] } {
  const cautions: string[] = [];
  const usedEvents: StockingEvent[] = [];
  const cfg = FISHABILITY_CONFIG.stocking;
  const retentionDays =
    input.seasonalPolicy?.expectedRetentionDays ?? cfg.defaultRetentionDays;

  const troutEvents = input.stockingEvents.filter(isTroutStockingEvent);

  let lastCompleted: StockingEvent | null = null;
  let lastCompletedMs = Number.NEGATIVE_INFINITY;
  let upcomingScheduled: StockingEvent | null = null;
  let upcomingMs = Number.POSITIVE_INFINITY;

  for (const event of troutEvents) {
    const eventMs = toUtcMs(event.date, 'stocking date');
    if (event.status === 'reported-complete') {
      if (eventMs > nowMs) {
        cautions.push(
          `Completed stocking record dated ${canonicalDate(event.date)} is in the future relative to the evaluation time; it was ignored as probable bad data.`,
        );
        continue;
      }
      if (eventMs > lastCompletedMs) {
        lastCompleted = event;
        lastCompletedMs = eventMs;
      }
    } else if (event.status === 'scheduled') {
      const daysAhead = (eventMs - nowMs) / 86_400_000;
      if (daysAhead >= 0 && daysAhead <= cfg.scheduleUpcomingDays && eventMs < upcomingMs) {
        upcomingScheduled = event;
        upcomingMs = eventMs;
      }
    }
  }

  if (lastCompleted !== null) {
    usedEvents.push(lastCompleted);
    if (lastCompleted.datePrecision !== 'day') {
      cautions.push(
        `Last completed stocking date has "${lastCompleted.datePrecision}" precision; elapsed-time comparisons are approximate.`,
      );
    }
  }
  if (upcomingScheduled !== null) usedEvents.push(upcomingScheduled);

  const graceDays =
    lastCompleted === null
      ? 0
      : cfg.precisionGraceDays[lastCompleted.datePrecision];
  const lastCompletedAgeDays =
    lastCompleted === null ? null : elapsedDays(lastCompleted.date, input.now);

  return {
    profile: {
      lastCompleted,
      lastCompletedAgeDays,
      youngestPlausibleAgeDays:
        lastCompletedAgeDays === null ? null : lastCompletedAgeDays - graceDays,
      oldestPlausibleAgeDays:
        lastCompletedAgeDays === null ? null : lastCompletedAgeDays + graceDays,
      upcomingScheduled,
      hasAnyTroutStockingRecord: troutEvents.length > 0,
      retentionDays,
    },
    cautions,
    usedEvents,
  };
}

type ApplicabilityResult = {
  applicability: TroutApplicability;
  confidence: EvidenceConfidence;
  reasons: string[];
  cautions: string[];
  /**
   * True when presence rests on low-confidence year-round evidence: the
   * water stays visible but is de-emphasized rather than fully included.
   */
  weakPresence: boolean;
};

function classifyTroutApplicability(
  input: FishabilityInput,
  month: number,
  warm: TemperatureRead,
  stocking: StockingProfile,
  minSustainedWarm: number,
): ApplicabilityResult {
  const cfgStocking = FISHABILITY_CONFIG.stocking;
  const cfgTrout = FISHABILITY_CONFIG.trout;
  const monthName = MONTH_NAMES[month - 1] ?? `month ${month}`;
  const troutStrong = strongestTroutEvidence(input.speciesEvidence);
  const nonTrout = strongestNonTroutEvidence(input.speciesEvidence);
  const anyTrout = hasAnyTroutEvidence(input.speciesEvidence);
  const warmCutoff =
    input.seasonalPolicy?.warmWaterCutoffC ??
    FISHABILITY_CONFIG.trout.defaultWarmWaterCutoffC;

  // 1. Authoritative counter-evidence: a high-confidence, year-round-basis
  // non-trout classification wins unless trout year-round evidence is at
  // least as strong. Ties prefer trout presence (conservative for a trout
  // product) and surface the conflict as a caution.
  if (nonTrout !== null) {
    const nonTroutScore =
      BASIS_AUTHORITY[nonTrout.basis] * 10 + CONFIDENCE_RANK[nonTrout.confidence];
    const troutScore =
      troutStrong !== null && YEAR_ROUND_BASES.has(troutStrong.basis)
        ? BASIS_AUTHORITY[troutStrong.basis] * 10 + CONFIDENCE_RANK[troutStrong.confidence]
        : Number.NEGATIVE_INFINITY;
    if (nonTroutScore > troutScore) {
      const cautions: string[] = [];
      if (troutStrong !== null) {
        cautions.push(
          `Conflicting species evidence: ${troutStrong.species} (${troutStrong.basis}, ${troutStrong.confidence}) was also reported for this water.`,
        );
      }
      return {
        applicability: 'not-trout',
        confidence: nonTrout.confidence,
        reasons: [
          `Authoritative evidence classifies this water as a ${nonTrout.species} fishery (${nonTrout.basis}, ${nonTrout.confidence} confidence), not a trout water.`,
        ],
        cautions,
        weakPresence: false,
      };
    }
    // Otherwise year-round trout evidence is at least as strong: fall
    // through to presence logic; the conflict is surfaced as a caution.
  }

  // 2. Year-round trout evidence (wild population or verified managed
  // fishery) stays eligible in every month. Temperature affects condition,
  // never presence by itself.
  if (troutStrong !== null && YEAR_ROUND_BASES.has(troutStrong.basis)) {
    const cautions: string[] = [
      ...(nonTrout !== null
        ? [
            `Conflicting species evidence: ${nonTrout.species} (${nonTrout.basis}, ${nonTrout.confidence}) was also reported for this water; trout presence was retained conservatively.`,
          ]
        : []),
    ];
    if (warm.kind === 'current-warm') {
      cautions.push(
        `Water is currently at or above the ${warmCutoff}°C trout cutoff (freshest reading ${formatTemp(warm.freshest?.value ?? Number.NaN)}); trout are thermally stressed and conditions may be lethal.`,
      );
    }
    const basisReason =
      troutStrong.basis === 'wild-population'
        ? 'Wild trout population documented year-round'
        : 'Verified year-round trout management (e.g. tailwater) on record';
    if (troutStrong.confidence === 'high') {
      return {
        applicability: 'confirmed-current',
        confidence: 'high',
        reasons: [
          `${basisReason} (high confidence); eligible in ${monthName} regardless of season.`,
        ],
        cautions,
        weakPresence: false,
      };
    }
    if (troutStrong.confidence === 'medium') {
      return {
        applicability: 'probable-current',
        confidence: 'medium',
        reasons: [
          `${basisReason} (medium confidence); eligible in ${monthName} regardless of season.`,
        ],
        cautions,
        weakPresence: false,
      };
    }
    return {
      applicability: 'probable-current',
      confidence: 'low',
      reasons: [
        `Reported year-round trout population (unverified, low confidence); presence is plausible but should not be relied on.`,
      ],
      cautions,
      weakPresence: true,
    };
  }

  // 3. Put-and-take presence: a completed stocking inside the retention
  // window asserts probable (never confirmed) presence. The youngest
  // plausible age is used, so date-precision grace is generous to presence.
  if (
    stocking.lastCompleted !== null &&
    stocking.youngestPlausibleAgeDays !== null &&
    stocking.youngestPlausibleAgeDays <= stocking.retentionDays
  ) {
    const stockedMonths = input.seasonalPolicy?.stockedMonths;
    if (stockedMonths !== undefined && !stockedMonths.includes(month)) {
      return {
        applicability: 'seasonal-uncertain',
        confidence: 'medium',
        reasons: [
          `A completed stocking ${Math.round(stocking.lastCompletedAgeDays ?? 0)} days ago is within the ${stocking.retentionDays}-day retention window, but ${monthName} is outside the configured stocking months [${stockedMonths.join(', ')}]; the record may be misattributed to this water.`,
        ],
        cautions: [
          'Stocking recorded outside the configured stocking months; verify the water matching before treating this as trout evidence.',
        ],
        weakPresence: false,
      };
    }
    return {
      applicability: 'probable-current',
      confidence: stocking.lastCompleted.datePrecision === 'day' ? 'high' : 'medium',
      reasons: [
        `Completed stocking on ${canonicalDate(stocking.lastCompleted.date)} (${Math.round(stocking.lastCompletedAgeDays ?? 0)} days ago) is within the ${stocking.retentionDays}-day retention window.`,
      ],
      cautions: [
        'Put-and-take water: trout presence decays after the retention window; this is not a year-round trout fishery.',
      ],
      weakPresence: false,
    };
  }

  // 4. Seasonal absence: only current warmth plus an aged-out completed
  // stocking supports likely-absent. The youngest plausible age gates the
  // claim (conservative against absence); month alone, or stale warmth,
  // never claims fish are gone (no fixed-date absence claims). High
  // confidence additionally requires sustained warm readings.
  if (
    stocking.lastCompleted !== null &&
    stocking.youngestPlausibleAgeDays !== null &&
    stocking.youngestPlausibleAgeDays > stocking.retentionDays &&
    warm.kind === 'current-warm'
  ) {
    const stockedMonths = input.seasonalPolicy?.stockedMonths;
    const explicitOffSeason =
      stockedMonths !== undefined && !stockedMonths.includes(month);
    const agedOutDecisively =
      stocking.oldestPlausibleAgeDays !== null &&
      stocking.oldestPlausibleAgeDays >
        stocking.retentionDays * cfgStocking.highConfidenceAbsenceRetentionMultiple;
    const sustainedWarm = warm.warmCountCurrent >= minSustainedWarm;
    const highConfidence = explicitOffSeason && agedOutDecisively && sustainedWarm;
    const cautions = [
      'Absence is an inference from warm current water and an aged-out stocking, not a certainty: cold headwater refugia or unreported late stockings can still hold trout.',
    ];
    if (!sustainedWarm) {
      cautions.push(
        `Only ${warm.warmCountCurrent} fresh warm reading(s) are available; corroborating warm readings would be needed for high-confidence absence.`,
      );
    }
    return {
      applicability: 'seasonal-likely-absent',
      confidence: highConfidence ? 'high' : 'medium',
      reasons: [
        `Freshest water temperature ${formatTemp(warm.freshest?.value ?? Number.NaN)} observed ${Math.round(warm.ageDays ?? 0)} days ago is at or above the ${warmCutoff}°C cutoff, and the last completed stocking (${canonicalDate(stocking.lastCompleted.date)}, ${Math.round(stocking.lastCompletedAgeDays ?? 0)} days ago) is past the ${stocking.retentionDays}-day retention window; recently stocked trout are unlikely to remain.`,
        explicitOffSeason
          ? `${monthName} is outside the configured stocking months [${stockedMonths.join(', ')}] and no new stocking is on record.`
          : `Current conditions are warm and no newer stocking is on record for ${monthName}.`,
      ],
      cautions,
      weakPresence: false,
    };
  }

  // 5. Seasonal uncertainty: aging stocked evidence without current warmth.
  // When the freshest reading is cool but close to the cutoff, say so
  // explicitly instead of implying there is no temperature evidence.
  if (
    stocking.lastCompleted !== null &&
    stocking.youngestPlausibleAgeDays !== null &&
    stocking.youngestPlausibleAgeDays > stocking.retentionDays
  ) {
    const nearWarm =
      warm.kind === 'current-cool' &&
      warm.freshest !== null &&
      warmCutoff - warm.freshest.value <= cfgTrout.nearWarmCutoffDeltaC;
    return {
      applicability: 'seasonal-uncertain',
      confidence: 'medium',
      reasons: [
        `The last completed stocking (${canonicalDate(stocking.lastCompleted.date)}, ${Math.round(stocking.lastCompletedAgeDays ?? 0)} days ago) is past the ${stocking.retentionDays}-day retention window and ${
          nearWarm
            ? `the freshest water temperature (${formatTemp(warm.freshest?.value ?? Number.NaN)}) sits near, but below, the ${warmCutoff}°C cutoff`
            : 'no current temperature evidence shows sustained warmth'
        }; trout presence is possible but unsupported.`,
      ],
      cautions: [],
      weakPresence: false,
    };
  }

  // 6. Schedules are weaker evidence than completed reports.
  if (stocking.upcomingScheduled !== null) {
    return {
      applicability: 'seasonal-uncertain',
      confidence: 'low',
      reasons: [
        `Only a scheduled stocking (${canonicalDate(stocking.upcomingScheduled.date)}) is on record; a schedule is weaker evidence than a completed stocking report, so presence is not asserted.`,
      ],
      cautions: [],
      weakPresence: false,
    };
  }

  // 7. Unverified (status unknown) stocking records or seasonal/reported
  // species evidence without completed events.
  if (
    stocking.hasAnyTroutStockingRecord ||
    input.speciesEvidence.some(
      (e) => classifySpecies(e.species) === 'trout' && e.basis !== 'unknown',
    )
  ) {
    return {
      applicability: 'seasonal-uncertain',
      confidence: 'low',
      reasons: [
        'Seasonal or reported trout evidence exists but no completed stocking is on record; missing history is treated as uncertainty, not absence.',
      ],
      cautions: [],
      weakPresence: false,
    };
  }

  if (anyTrout) {
    return {
      applicability: 'unknown',
      confidence: 'low',
      reasons: [
        'Trout species evidence exists but its basis is unknown; the water cannot be classified.',
      ],
      cautions: [],
      weakPresence: false,
    };
  }

  return {
    applicability: 'unknown',
    confidence: 'low',
    reasons: [
      'No trout species evidence and no stocking history; absence cannot be inferred from missing data.',
    ],
    cautions: hasUsableFlowEvidence(input.observations, input.now)
      ? ['Discharge observations alone do not indicate trout presence.']
      : [],
    weakPresence: false,
  };
}

function validateSeasonalPolicy(input: FishabilityInput): void {
  const stockedMonths = input.seasonalPolicy?.stockedMonths;
  if (stockedMonths === undefined) return;
  for (const m of stockedMonths) {
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      throw new Error(
        `fishability model: seasonalPolicy.stockedMonths must contain integers 1–12 (January = 1); got ${m} for ${input.waterId}`,
      );
    }
  }
  const retention = input.seasonalPolicy?.expectedRetentionDays;
  if (retention !== undefined && (!Number.isFinite(retention) || retention <= 0)) {
    throw new Error(
      `fishability model: seasonalPolicy.expectedRetentionDays must be a positive number; got ${retention} for ${input.waterId}`,
    );
  }
}

/**
 * Options for evaluateWater. `overrides` provides named, narrow
 * configuration overrides of FISHABILITY_CONFIG (unlisted keys fall back
 * to the shipped config) so hosts can demand stricter evidence without
 * forking the model.
 */
export type EvaluateOptions = {
  debug?: boolean;
  overrides?: {
    trout?: {
      /** Fresh warm readings required to call warmth sustained (default 1). */
      minSustainedWarmObservations?: number;
    };
  };
};

/**
 * Evaluate one water. Pure and deterministic. Pass `{ debug: true }` to
 * append versioned debug metadata to the decision.
 */
export function evaluateWater(
  input: FishabilityInput,
  options: EvaluateOptions = {},
): WaterDecision & { debug?: DecisionDebug } {
  validateSeasonalPolicy(input);
  const minSustainedWarm =
    options.overrides?.trout?.minSustainedWarmObservations ??
    FISHABILITY_CONFIG.trout.minSustainedWarmObservations;
  validateSeasonalPolicy(input);
  const nowMs = toUtcMs(input.now, 'now');
  const month = utcMonth(input.now);

  const warmCutoff =
    input.seasonalPolicy?.warmWaterCutoffC ?? FISHABILITY_CONFIG.trout.defaultWarmWaterCutoffC;
  const warm = readTemperature(input.observations, input.now, warmCutoff);
  const { profile: stocking, cautions: stockingCautions, usedEvents } =
    buildStockingProfile(input, nowMs);

  const applicabilityResult = classifyTroutApplicability(
    input,
    month,
    warm,
    stocking,
    minSustainedWarm,
  );

  const cautions: string[] = [...stockingCautions, ...applicabilityResult.cautions];
  const evidenceUsed: string[] = [];

  // Species evidence actually used by the classifier.
  const troutStrong = strongestTroutEvidence(input.speciesEvidence);
  const nonTrout = strongestNonTroutEvidence(input.speciesEvidence);
  for (const entry of input.speciesEvidence) {
    if (entry === troutStrong || entry === nonTrout) {
      evidenceUsed.push(
        evidenceId('species', [
          entry.species,
          entry.basis,
          entry.confidence,
          ...(entry.sourceDate ? [`@${entry.sourceDate}`] : []),
        ]),
      );
    } else if (classifySpecies(entry.species) === 'ambiguous') {
      cautions.push(
        `Species "${entry.species}" could not be classified as trout or non-trout; it did not drive this decision.`,
      );
    }
  }
  for (const event of usedEvents) {
    evidenceUsed.push(
      evidenceId('stocking', [event.status, canonicalDate(event.date), event.datePrecision]),
    );
  }
  if (input.seasonalPolicy?.stockedMonths !== undefined) {
    evidenceUsed.push(
      evidenceId('policy', ['stockedMonths', input.seasonalPolicy.stockedMonths.join('+')]),
    );
  }
  if (input.seasonalPolicy?.expectedRetentionDays !== undefined) {
    evidenceUsed.push(
      evidenceId('policy', ['expectedRetentionDays', input.seasonalPolicy.expectedRetentionDays]),
    );
  }
  if (input.seasonalPolicy?.warmWaterCutoffC !== undefined) {
    evidenceUsed.push(
      evidenceId('policy', ['warmWaterCutoffC', input.seasonalPolicy.warmWaterCutoffC]),
    );
  }

  // Fishability banding is mode-dependent: trout mode uses trout comfort
  // bands only for waters whose trout applicability is current; everything
  // else (and all of all-fish mode) uses the generic band.
  const troutCurrent =
    applicabilityResult.applicability === 'confirmed-current' ||
    applicabilityResult.applicability === 'probable-current';
  const band =
    input.mode === 'trout' && troutCurrent
      ? troutConditionBand(input.observations, input.now)
      : generalFishabilityBand(input.observations, input.now);

  let fishability: WaterDecision['fishability'];
  if (band !== 'unknown') {
    fishability = band;
  } else if (input.observations.length > 0) {
    // Observations existed but none were usable: assessed-but-indeterminate.
    fishability = 'unknown';
  }
  // No observations at all → fishability omitted entirely.

  let displayMetric: WaterDecision['displayMetric'];
  if (fishability === 'good' || fishability === 'fair' || fishability === 'poor') {
    displayMetric = input.mode === 'trout' && troutCurrent ? 'trout-condition' : 'fishability';
  } else {
    displayMetric = 'unassessed';
  }

  // Observation evidence ids for whatever the band actually consumed.
  const observedMetrics: Observation[] = [];
  const temp = freshestObservation(input.observations, 'temperature-c', input.now);
  const flow = freshestObservation(input.observations, 'discharge-cfs', input.now);
  const stage = freshestObservation(input.observations, 'stage-ft', input.now);
  const reservoir = freshestObservation(input.observations, 'reservoir-level-ft', input.now);
  for (const obs of [temp, flow, stage, reservoir]) {
    if (obs !== null) {
      observedMetrics.push(obs);
      evidenceUsed.push(
        evidenceId('obs', [obs.metric, obs.value, `@${canonicalInstant(obs.observedAt)}`]),
      );
      if (obs === flow && obs.value === 0 && freshnessOf(obs.observedAt, input.now) !== 'stale') {
        cautions.push('Zero discharge is a real reading (no flow), not missing data.');
      }
      if (
        obs === flow &&
        obs.value > 0 &&
        obs.value < FISHABILITY_CONFIG.general.lowFlowSuspicionCfs &&
        freshnessOf(obs.observedAt, input.now) !== 'stale'
      ) {
        cautions.push(
          `Discharge ${obs.value} cfs is near zero; no per-water reference flow range is available, so flow-based quality is not assessed.`,
        );
      }
      if (obs === temp && warm.kind === 'stale-warm') {
        cautions.push(
          `Freshest temperature ${formatTemp(obs.value)} is ${Math.round(warm.ageDays ?? 0)} days old (stale); it is not evidence of current warmth.`,
        );
      }
    }
  }

  if (input.mode === 'all-fish') {
    cautions.push(
      'All-fish fishability is a generic water-condition estimate from flow/stage/temperature freshness; it is not species-specific quality and does not reuse the trout score.',
    );
  }

  // Visibility rules (named; see FISHABILITY_CONFIG.filter).
  let visibility: WaterDecision['visibility'];
  if (input.mode === 'trout') {
    switch (applicabilityResult.applicability) {
      case 'not-trout':
        visibility = 'exclude';
        break;
      case 'seasonal-likely-absent':
        visibility = applicabilityResult.confidence === 'high' ? 'exclude' : 'deemphasize';
        break;
      case 'seasonal-uncertain':
        visibility = 'deemphasize';
        break;
      case 'probable-current':
        visibility = applicabilityResult.weakPresence ? 'deemphasize' : 'include';
        break;
      case 'unknown':
        visibility =
          hasAnyTroutEvidence(input.speciesEvidence) || stocking.hasAnyTroutStockingRecord
            ? 'include'
            : 'deemphasize';
        break;
      default:
        visibility = 'include';
    }
  } else {
    // All-fish mode never excludes; it only de-emphasizes waters with
    // neither usable observations nor any evidence at all.
    visibility =
      input.observations.length === 0 &&
      input.speciesEvidence.length === 0 &&
      input.stockingEvents.length === 0
        ? 'deemphasize'
        : 'include';
  }

  const confidence: EvidenceConfidence =
    input.mode === 'trout'
      ? applicabilityResult.confidence
      : fishability === 'good' || fishability === 'fair' || fishability === 'poor'
        ? bandConfidence(input.observations, input.now)
        : 'low';

  const decision: WaterDecision = {
    waterId: input.waterId,
    visibility,
    troutApplicability: applicabilityResult.applicability,
    displayMetric,
    ...(fishability !== undefined ? { fishability } : {}),
    confidence,
    reasons: applicabilityResult.reasons,
    evidenceUsed,
    cautions,
  };

  if (options.debug !== true) return decision;

  const debug: DecisionDebug = {
    modelVersion: MODEL_VERSION,
    monthUtc: month,
    retentionDays: stocking.retentionDays,
    elapsedDaysSinceLastCompletedStocking:
      stocking.lastCompletedAgeDays === null ? null : round1(stocking.lastCompletedAgeDays),
    warmEvidence: warm.kind,
    strongestTroutEvidence: troutStrong,
    freshestObservations: observedMetrics,
  };
  return { ...decision, debug };
}
