# ADR 0013. Water Overview presentation model

- **Status:** accepted
- **Date:** 2026-09-30
- **Decider:** owner-directed site-improvement plan 2026-09-30 (implementation lane)

## Context

The map inspector and the water-detail page both summarize a water, but each
assembles its own summary from catalog, conditions, fishability, stocking,
and provenance inputs. Duplicated composition drifts (different freshness
labels, different availability semantics) and every new surface — saved-water
cards, comparison, trip preparation — would multiply the drift. The plan
requires one summary model consumed everywhere, while keeping the existing
authorities authoritative.

## Decision

1. `apps/web/src/lib/waterOverview.ts` exposes a pure `buildWaterOverview()`
   composing, **without re-computing**, the existing authorities: catalog
   `Stream` (identity, ADR 0010 opportunity), `waterDecision.ts`
   (classification — passed in as the already-built `WaterDecisionView`),
   contracts `readingFreshness` (age), and the conditions/fishability/stocking
   snapshots. No scoring logic lives here.
2. **Per-metric observation age is invariant.** Each metric (flow,
   temperature, stage, reservoir) carries its own `observedAt`/`ageMinutes`;
   a fresh flow reading never refreshes an old temperature. Availability is
   three-state — `live | stale | unavailable` — and `unavailable` never
   implies a negative claim about fish or events.
3. Contextual actions are declared by the model (`matchHatch` only on
   trout-opportunity waters; save/compare/prepare-trip/log always available),
   so every surface shows the same action set for the same water.
4. Source notices ride with the summary: stale readings carry a rounded age
   and a "verify with the agency" warning; missing data says the water is not
   assessed, never that nothing is there. Restriction text extraction awaits
   the catalog notes/provenance split (audit M3) — the `notices` array is the
   composition point.
5. Consumers: inspector drawer, StreamDetailPage, My Waters cards, comparison
   columns, and future trip-preparation views. Compact card variants render
   the same model, not a second summary path.

## Consequences

- Presentation drift across surfaces becomes a test failure, not a review
  catch (`test/water-overview.test.ts` pins the invariants).
- The model is presentation-only: contracts stay frozen, and
  `waterDecision.ts` / `fishability.ts` remain the scoring/classification
  authorities (remediation-leased files are consumed, not edited).
