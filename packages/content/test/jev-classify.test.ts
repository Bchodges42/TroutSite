import { describe, expect, it } from 'vitest';
import {
  CATEGORY_CRITERIA,
  CATEGORY_LABELS,
  MONTHS,
  categoryMonthConsistency,
  effectiveCategory,
  evidenceState,
  fishbrainCatalogSlugs,
  fishbrainRecordCount,
  normalizeMonth,
  questionsForMonth,
  reviewedCategory,
} from '../scripts/classification/jev-classify.mjs';
import {
  parseMonthLetters,
  parseScheduleDate,
  parseScheduleDateMonth,
  buildSchedulePrograms,
  loadSchedule,
} from '../scripts/classification/stocking-schedule.mjs';
import { loadCatalog, ALIASES, resolveEvent } from '../scripts/classification/lib.mjs';

describe('Jev Tennessee fishery classifier setup', () => {
  it('exposes exactly the requested three category probabilities', () => {
    expect(Object.keys(CATEGORY_CRITERIA)).toEqual([
      'trout-stream-year-round',
      'warmwater-yearly-stocked-winter-trout',
      'warmwater-no-trout',
    ]);
    expect(Object.values(CATEGORY_LABELS)).toEqual([
      'Year Round - Trout Stream (tailwaters, wild trout waters)',
      'Warm Water - Seasonal/Winter Stocking Program',
      'Warm Water - No Trout',
    ]);
    expect(Object.keys(questionsForMonth('July').category.criteria)).toEqual(Object.keys(CATEGORY_CRITERIA));
  });

  it('passes an explicit month to the current and annual questions', () => {
    const questions = questionsForMonth('July');
    expect(questions.current_month_trout.instructions).toContain('July (month 7)');
    expect(questions.month_December.instructions).toContain('December (month 12)');
    expect(questions.year_round_trout_presence.type).toBe('noul');
    expect(questions.recurring_trout_program.type).toBe('noul');
    expect(questions.evidence_quality.type).toBe('score');
    expect(Object.keys(questions).filter((key) => key.startsWith('month_'))).toHaveLength(12);
  });

  it('keeps Fishbrain freshwater trout separate from excluded marine labels', () => {
    const state = evidenceState('boone-tailwater', { month: 'July' });
    const discovery = state.evidence.fishbrainDiscovery;
    expect(state.schema).toBe('trout/jev-classification-state/2');
    expect(state.requestedMonth).toMatchObject({ number: 7, name: 'July' });
    expect(discovery.available).toBe(true);
    expect(discovery.dataset.collectionNote).toContain('Research-only');
    expect(discovery.freshwaterTrout.map((item) => item.name)).toContain('Rainbow trout');
    expect(discovery.excludedMarineOrBrackish.map((item) => item.name)).toContain('Sea trout');
    expect(discovery.segmentReviewReasons.length).toBeGreaterThan(0);
    expect(discovery.interpretationRule).toContain('not establish abundance');
  });

  it('loads both featured and standard-tier Fishbrain GraphQL scrapes (190 unique waters)', () => {
    expect(fishbrainRecordCount()).toBe(190);
    expect(fishbrainCatalogSlugs()).toHaveLength(190);
    expect(fishbrainCatalogSlugs()).toContain('barren-fork-river');
    const notFound = evidenceState('barren-fork-river').evidence.fishbrainDiscovery;
    expect(notFound.available).toBe(true);
    expect(notFound.matchStatus).toBe('not-found');
    expect(notFound.tier).toBe('standard');
    expect(notFound.loggedCatches).toBeNull();
    expect(notFound.sourceRole).toContain('missing discovery evidence');
  });

  it('marks featured-tier and standard-tier evidence distinctly', () => {
    const featured = evidenceState('boone-lake').evidence.fishbrainDiscovery;
    const standard = evidenceState('barren-fork-river').evidence.fishbrainDiscovery;
    expect(featured.tier).toBe('featured');
    expect(standard.tier).toBe('standard');
  });

  it('keeps a warmwater river from becoming trout water due to Fishbrain absence', () => {
    const state = evidenceState('obed-river', { month: 7 });
    expect(state.water.waterbodyType).toBe('river');
    expect(state.evidence.auditedLedger.slots.Species[0].noneFound).toBe(true);
    expect(state.evidence.twraStocking.matchedEvents).toHaveLength(0);
    expect(state.evidence.fishbrainDiscovery.freshwaterTrout).toHaveLength(0);
    expect(state.safeguards.join(' ')).toContain('not year-round without direct year-round evidence');
  });

  it('never places owner-reviewed labels in the model state (no answer-key leakage)', () => {
    for (const { slug } of loadCatalog()) {
      const state = evidenceState(slug, { month: 3 });
      const serialized = JSON.stringify(state);
      expect('ownerReview' in state.evidence).toBe(false);
      expect('jev' in state.evidence.composite).toBe(false);
      expect('recommendedClass' in state.evidence.composite).toBe(false);
      expect('sourceConfidence' in state.evidence.composite).toBe(false);
      expect('flags' in state.evidence.composite).toBe(false);
      for (const category of Object.keys(CATEGORY_LABELS)) expect(serialized).not.toContain(category);
    }
  });

  it('labels authored catalog classifications as claims instead of direct evidence', () => {
    const catalog = evidenceState('doe-river').evidence.catalog;
    expect(catalog.sourceRole).toContain('claims to corroborate');
    expect(catalog.authoredClaims.yearRound).toBe(true);
    expect(catalog.documentedEvidence.notes).toContain('Delayed harvest');
    expect('yearRound' in catalog).toBe(false);
  });

  it('applies reviewed labels as a code-level override, reported separately from raw', () => {
    expect(reviewedCategory('boone-lake')).toBe('warmwater-no-trout');
    expect(reviewedCategory('boone-tailwater')).toBe('trout-stream-year-round');
    // raw model answer (even a wrong one) is overridden post-hoc, never pre-seeded
    expect(effectiveCategory('boone-lake', 'trout-stream-year-round')).toBe('warmwater-no-trout');
    expect(effectiveCategory('barren-fork-river', 'warmwater-no-trout')).toBe('warmwater-no-trout');
  });

  it('keeps a lake and its tailwater as separate classified systems', () => {
    const lake = evidenceState('boone-lake');
    const tailwater = evidenceState('boone-tailwater');
    expect(lake.water.id).not.toBe(tailwater.water.id);
    expect(lake.water.waterbodyType).toBe('lake');
    expect(tailwater.water.waterbodyType).toBe('tailrace');
    expect(reviewedCategory('boone-lake')).not.toBe(reviewedCategory('boone-tailwater'));
  });

  it('treats South Holston Lake trout species as evidence, not trout-stream status', () => {
    const state = evidenceState('south-holston-lake');
    const discovery = state.evidence.fishbrainDiscovery;
    // Fishbrain documents rainbow/brown trout catches; the owner review adds
    // that lake trout are present. Neither makes the reservoir a trout stream.
    expect(discovery.freshwaterTrout.map((item) => item.name.toLowerCase())).toContain('rainbow trout');
    expect(state.safeguards.join(' ')).toContain('does not automatically make that reservoir a trout stream');
    expect(reviewedCategory('south-holston-lake')).toBe('warmwater-yearly-stocked-winter-trout');
    expect(effectiveCategory('south-holston-lake', 'trout-stream-year-round')).toBe('warmwater-yearly-stocked-winter-trout');
  });

  it('classifies the Parksville / Ocoee No. 1 tailwater as a designated trout-stream segment', () => {
    const state = evidenceState('parksville-tailwater');
    expect(state.water.waterbodyType).toBe('tailrace');
    expect(reviewedCategory('parksville-tailwater')).toBe('trout-stream-year-round');
    // OWNER RULING 2026-09-17: 'year round' now means trout PRESENT year-round
    // (cold controlled water). The Parksville seasonal-stocking question is
    // flagged for owner decision — the reviewed label still rules overrides.
    expect(CATEGORY_CRITERIA['trout-stream-year-round']).toContain('through the entire year');
  });

  it('uses the habitat-survival mapping and keeps month presence separate', () => {
    const questions = questionsForMonth('August');
    const instructions = questions.category.instructions.join(' ');
    expect(instructions).toContain('A=true means trout-stream-year-round');
    expect(instructions).toContain('must not flip merely because the requested month is outside a stocking window');
    expect(instructions).toContain('program identity or timing only');
    expect(questions.month_August.instructions).toContain('presence, not catchability');
    expect(questions.month_August.criteria.false).not.toContain('insufficient');
  });

  it('refuses to let catch counts establish a trout system', () => {
    const state = evidenceState('boone-tailwater');
    expect(state.evidence.fishbrainDiscovery.interpretationRule).toContain('cannot establish abundance');
    expect(CATEGORY_CRITERIA['trout-stream-year-round']).toContain('A few catches, a trout regulation, or a schedule label alone is not enough');
    expect(CATEGORY_CRITERIA['warmwater-yearly-stocked-winter-trout']).toContain('year-round population presence is not supported');
  });

  it('flags category/month contradictions instead of silently trusting independent questions', () => {
    const ok = categoryMonthConsistency('warmwater-no-trout', { January: 0.1, August: 0.2 });
    expect(ok.flags).toHaveLength(0);
    const leak = categoryMonthConsistency('warmwater-no-trout', Object.fromEntries(MONTHS.map((m) => [m, 0.9])));
    expect(leak.monthsTrue).toBe(12);
    expect(leak.flags[0]).toContain('need review');
    const dryStream = categoryMonthConsistency('trout-stream-year-round', Object.fromEntries(MONTHS.map((m) => [m, 0.1])));
    expect(dryStream.flags.length).toBeGreaterThan(0);
    const partialYearRound = categoryMonthConsistency('trout-stream-year-round', Object.fromEntries(MONTHS.map((m, i) => [m, i < 9 ? 0.9 : 0.2])));
    expect(partialYearRound.monthsTrue).toBe(9);
    expect(partialYearRound.flags[0]).toContain('only 9/12');
  });

  it('flags contradictions between category, decision axes, and duplicate month answers', () => {
    const months = Object.fromEntries(MONTHS.map((m) => [m, 0.2]));
    const result = categoryMonthConsistency('warmwater-no-trout', months, {
      yearRoundPresence: 0.8,
      recurringProgram: 0.9,
      currentMonthTrout: 0.9,
      requestedMonth: 1,
    });
    expect(result.flags.join(' ')).toContain('year_round_trout_presence');
    expect(result.flags.join(' ')).toContain('recurring_trout_program');
    expect(result.flags.join(' ')).toContain('duplicate month answers disagree');
  });

  it('normalizes only valid one-based months', () => {
    expect(normalizeMonth(1)).toBe(1);
    expect(normalizeMonth('December')).toBe(12);
    expect(() => normalizeMonth(0)).toThrow(RangeError);
    expect(MONTHS).toHaveLength(12);
  });
});

describe('TWRA stocking-schedule ingest (official program calendar)', () => {
  const catalog = loadCatalog();

  it('reconstructs month windows from TWRA ordered month initials', () => {
    expect(parseMonthLetters('M, A, M, J, J, A, S')).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(parseMonthLetters('J, F, M, N, D')).toEqual([1, 2, 3, 11, 12]);
    expect(parseMonthLetters('J, F, M, D')).toEqual([1, 2, 3, 12]);
    expect(parseMonthLetters('A')).toEqual([4]);
    expect(parseMonthLetters('')).toBeNull();
    expect(parseMonthLetters('X, Q')).toBeNull();
  });

  it('parses exact stocking dates and TBD windows', () => {
    expect(parseScheduleDate('1/14/2026')).toBe('2026-01-14');
    expect(parseScheduleDate('TBD 12/2026')).toEqual({ tbd: '2026-12' });
    expect(parseScheduleDate('')).toBeNull();
    expect(parseScheduleDateMonth('2/22/2026')).toBe(2);
    expect(parseScheduleDateMonth('TBD 12/2026')).toBe(12);
  });

  it('derives per-water programs: declared windows, else observed from scheduled dates', () => {
    const { bySlug } = buildSchedulePrograms(catalog, loadSchedule().rows, resolveEvent, ALIASES);
    const obey = bySlug.get('obey-river');
    expect(obey.types).toContain('Tailwater');
    expect(obey.months).toHaveLength(12); // year-round tailwater program
    const beaverdam = bySlug.get('beaverdam-creek');
    expect(beaverdam.types).toContain('Seasonal');
    expect(beaverdam.months).toEqual([3, 4, 5, 6]); // observed from its scheduled dates
  });

  it('resolves compound "TW / river" schedule names without merging lake and tailwater', () => {
    const { bySlug } = buildSchedulePrograms(catalog, loadSchedule().rows, resolveEvent, ALIASES);
    expect(bySlug.get('parksville-tailwater').types).toContain('Tailwater');
    expect(bySlug.get('parksville-tailwater').months).toEqual([3, 4, 5]);
  });

  it('queues schedule locations with no catalog water instead of guessing', () => {
    const { unmatched } = buildSchedulePrograms(catalog, loadSchedule().rows, resolveEvent, ALIASES);
    expect(unmatched.length).toBeGreaterThan(0);
    expect(unmatched.some((u) => /McKenzie City Park/i.test(u.location))).toBe(true);
  });

  it('exposes the official schedule to the Jev evidence state', () => {
    const state = evidenceState('obey-river', { month: 3 });
    const sched = state.evidence.twraStocking.officialSchedule;
    expect(sched.available).toBe(true);
    expect(sched.programs).toContain('Tailwater');
    expect(sched.months).toHaveLength(12);
    expect(sched.sourceRole).toContain('authoritative');
    const absent = evidenceState('chickamauga-lake', { month: 3 }).evidence.twraStocking.officialSchedule;
    expect(absent.available).toBe(false);
    expect(absent.sourceRole).toContain('not a program negative');
  });
});
