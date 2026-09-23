# ADR 0010. Documented fishery opportunity: the `opportunity` block, an explicit unresolved state, and the end of the seasonal fallback

- **Status:** accepted
- **Date:** 2026-09-22
- **Decider:** evidence-backed-fisheries implementation lane (work order
  2026-09-22), implementing the direction set by the 2026-09-21/22 evidence
  audits (research branch `codex/evidence-methods-audit-20260921`) and the
  owner's target architecture

## Context

The 2026-09-21 evidence-methods audit (plus its source-acceptance,
unconventional-source, and monitoring follow-ups) reproduced that the site's
classification layers could not certify what they claimed: a generic Nov–Mar
fallback synthesized a "documented" season for every `yearRound:false` row;
three unchecked source strings could produce a high-confidence no-trout
verdict; a reservoir inherited its dam's downstream cold-release evidence;
low-confidence model agreement was accepted as corroboration. It concluded:
the sources can support a map of **documented angling opportunities** with an
explicit unresolved state — not 190 verified three-way biological labels.

The product question is the visitor's question: *does this water, at this
reach, offer a documented year-round trout opportunity, a seasonal stocked
trout opportunity, a warmwater focus, a combination, or is the evidence
insufficient?* The answer must apply to the correct reach or lake area, carry
claim-specific provenance, and never manufacture certainty.

## Decision

1. **Additive contract (tag bump 2.3.0).** `Stream` gains an optional
   `opportunity` block (`OpportunitySchema`):
   - `trout`: `year-round-trout | seasonal-stocked-trout | warmwater-focus |
     mixed | unresolved` — the angling-opportunity HEADLINE, not a biological
     census. `warmwater-focus` is a positive claim that never means trout are
     absent; `mixed` lets warmwater and a documented trout program coexist;
     `unresolved` is a first-class result.
   - `evidenceState`: `documented | limited | historical | conflicting |
     unresolved` — evidence quality, kept separate from the headline and from
     any production-reuse question. No confidence percentages.
   - `statement`, `reachScope`, `asOf`, `caveats`, `unresolvedQuestion`,
     `sources[]` (label/url/kind/observationPeriod/publicationDate/retrieved/
     pinpoint). A non-unresolved headline REQUIRES sources; an unresolved
     headline REQUIRES the missing proposition. Retrieval dates never
     freshen observations.
2. **Authored, not derived.** Opportunity blocks are authored from the
   evidence ledger (`docs/research/2026-09-22-fishery-opportunities/`), where
   each claim cites its source. Absent block = not yet adjudicated, which
   every consumer treats exactly like unresolved — never as a negative.
3. **The Nov–Mar fallback is removed.** `waterDecision.ts` no longer
   synthesizes a season window for `yearRound:false` rows. Seasonal
   applicability comes only from authored `seasonMonths` + `seasonKind`.
   `yearRound:true` + a stocking window (Boone Tailwater) is coherent: the
   fishery is year-round per the primary assessment; the window stays the
   stocking calendar; the disagreement between published calendars is carried
   as a caveat, not silently resolved.
4. **Decision-model consumption.** `WaterDecisionView` carries the
   adjudicated view; `warmwater-focus` behaves like plain warmwater in trout
   mode (excluded unless a documented trout program keeps it visible, then
   de-emphasized); documented headlines earn the class outline for waters
   whose `species` field is absent; unresolved earns nothing (no outline = not
   assessed). List status text prefers the adjudicated label.
5. **Presentation.** A shared `OpportunityCard` (drawer + detail) renders the
   headline, evidence type + year, reach scope, caveats, unresolved question,
   and up to three source links. Prerendered water pages publish the same
   words; an unresolved verdict publishes NO claim (silence, never a label).
   Unadjudicated waters keep today's neutral styling.

## Consequences

- Warmwater/seasonal coexistence is expressible (`mixed`), removing the
  pressure to force waters into one exclusive biological category.
- "No trout" is no longer representable at all — the honest vocabulary is
  `unresolved` with the missing proposition stated.
- The model is deterministic and offline-safe: a static catalog block read at
  render time; no runtime AI, no third-party fetches, no bundle growth beyond
  authored content.
- Catalog fields (`species`, `fishery`, `yearRound`, `seasonMonths`) stay as
  they are; where the ledger proves them wrong they are corrected through the
  normal content-validation path, not by the decision model guessing.
- Live conditions, stocking events, and opportunity remain separate layers:
  the card never implies today's water is safe, and the conditions feed never
  upgrades a documented headline.

## Alternatives considered

- Keep the three-label habitat classifier and fix its gate — rejected: the
  audit showed the gate cannot certify what it counts, and policy-tuning does
  not discover evidence.
- A thermal-habitat suitability layer as the classifier — rejected: sensors
  are sparse (20 TN sites with recent continuous records in the national
  archive) and temperature is not occupancy; it stays research context.
- Ship nothing until every water is verified — rejected: unadjudicated waters
  honestly read "unresolved" today while adjudication proceeds water by water.
