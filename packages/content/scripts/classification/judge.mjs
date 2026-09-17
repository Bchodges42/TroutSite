#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Judgment seam for the classification pipeline.
 *
 * The pipeline's entity-resolution and evidence-support calls go through this
 * interface so a structured-judgment backend (TypeSafe Jev, decision-native
 * API) can slot in later WITHOUT touching the pipeline. Today it lands with
 * the deterministic default only: no key exists in this environment, and the
 * owner's bar is that any backend must first beat the known-answer suite —
 * which the deterministic matcher already passes (see
 * validate-known-answers.mjs). Its output is advisory: every verdict still
 * ships as a decision box for owner approval.
 *
 * If the owner later provides a TYPESAFE_API_KEY, implement jevResolve() per
 * typesafe.ai docs (typed decision + confidence per candidate batch) and flip
 * ACTIVE to 'jev'; the known-answer suite gates the flip.
 */
export const ACTIVE = 'deterministic';

/**
 * Resolve a stocking event against candidate catalog waters.
 * deterministic default: documented alias → exact name → name+county →
 * county-gated core name; anything else queues.
 */
export function resolve(event, candidates) {
  // candidates: [{ slug, name, counties }] — pure data in, pure verdict out.
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
