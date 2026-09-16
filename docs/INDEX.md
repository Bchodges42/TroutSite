# Documentation index

This file identifies current authority. A document not listed here may still contain useful dated evidence, but it is not current guidance.

## Start here

| Document                                       | Authority                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| [`../README.md`](../README.md)                 | Product status, repository layout, quickstart, architecture summary          |
| [`../AGENTS.md`](../AGENTS.md)                 | Binding session, Git, production, and safety rules                           |
| [`ENGINEERING-GUIDE.md`](ENGINEERING-GUIDE.md) | Durable engineering principles, evidence standards, and documentation policy |
| [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md)           | Current worklist and accepted limitations                                    |
| [`CODEBASE-GUIDE.md`](CODEBASE-GUIDE.md)       | Maintainer-oriented architecture and data-flow guide                         |

## Active work

The river program is sequential: Session 1 must establish identity and geometry before Session 2 changes map behavior.

| Document                                                                         | Purpose                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`RIVER-REPAIR-IMPLEMENTATION-PLAN.md`](RIVER-REPAIR-IMPLEMENTATION-PLAN.md)     | Two-session overview, dependency, shared outcomes, and retirement condition                |
| [`RIVER-REPAIR-SESSION-1-HYDROGRAPHY.md`](RIVER-REPAIR-SESSION-1-HYDROGRAPHY.md) | Standalone Luna prompt for NHD identity, geometry, West Tennessee, and Cane Creek work     |
| [`RIVER-REPAIR-SESSION-2-MAP-QUALITY.md`](RIVER-REPAIR-SESSION-2-MAP-QUALITY.md) | Standalone Luna prompt for zoom tiers, deduplication, loading, interaction, and browser QA |

Remove active-plan links after the work is merged and summarized in one dated report. Git history is the plan archive.

## Architecture and operations

| Document                                                           | Scope                                                                       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [`DESIGN.md`](DESIGN.md)                                           | Fieldwork design system and map interaction principles                      |
| [`../infra/RUNBOOK.md`](../infra/RUNBOOK.md)                       | Production service, deployment, backup, watchdog, and recovery procedures   |
| [`OPERATIONS-ANALYTICS.md`](OPERATIONS-ANALYTICS.md)               | Analytics opt-in and emergency controls                                     |
| [`adr/`](adr/)                                                     | Accepted architecture decisions; use a new ADR for durable contract changes |
| [`REVIEW-PROMPT.md`](REVIEW-PROMPT.md)                             | Read-only full-spectrum review prompt                                       |
| [`DATA-SOURCE-RESEARCH-PROMPT.md`](DATA-SOURCE-RESEARCH-PROMPT.md) | Research-only prompt for missing factual sources                            |

## Hydrography and map reference

| Document                                                           | Scope                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [`NHD-CONVENTIONS.md`](NHD-CONVENTIONS.md)                         | NHD trace-engine formats and graph conventions                       |
| [`atlas-sources.md`](atlas-sources.md)                             | Current atlas source policy, generation paths, and known limitations |
| [`atlas-validation.md`](atlas-validation.md)                       | Current validation contract and command set                          |
| [`flow-orientation.md`](flow-orientation.md)                       | Flow-direction derivation and arrow rules                            |
| [`WATERBODY-GEOMETRY-CONTRACT.md`](WATERBODY-GEOMETRY-CONTRACT.md) | Geometry property and verification-state contract                    |
| [`roads-sources.md`](roads-sources.md)                             | Road-source provenance and LOD rules                                 |
| [`topo-sources.md`](topo-sources.md)                               | Terrain-source provenance and budgets                                |

## Fishing data reference

| Document                                                                                                          | Scope                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`TN-DATA-SOURCES.md`](TN-DATA-SOURCES.md)                                                                        | Tennessee provider inventory; mutable coverage totals belong in generated reports |
| [`DATA-SOURCE-COVERAGE.md`](DATA-SOURCE-COVERAGE.md) and [`data-source-coverage.json`](data-source-coverage.json) | Generated per-water gauge/feed coverage                                           |
| [`FISHING-INFORMATION-SOURCES.md`](FISHING-INFORMATION-SOURCES.md)                                                | Regulations-pack provenance and review dates                                      |
| [`STATEWIDE-RIVER-COVERAGE.md`](STATEWIDE-RIVER-COVERAGE.md)                                                      | Generated statewide coverage report                                               |
| [`GAUGE-CATALOG-GAPS.md`](GAUGE-CATALOG-GAPS.md)                                                                  | Generated gauge/catalog gap report                                                |
| [`waterbody-inventory.json`](waterbody-inventory.json)                                                            | Machine-readable historical reference-waterbody inventory used by legacy builders |

## Historical evidence

These files are point-in-time evidence. They may explain a decision or provide a regression case. They do not override current code, contracts, the worklist, or active plans.

- `docs/audits/` — geometry, connectivity, duplicate, self-intersection, and UI audit captures.
- `docs/reports/` — dated reviews and research reports that remain relevant as evidence.
- `docs/research/` — source captures, ledgers, and classification research.
- `GEO-AUDIT.md`, `CONTINUITY-AUDIT.md`, `GEO-CONTINUITY-AUDIT-lane.md`, `SPECIES-REVIEW.md`, `LOGIC-AUDIT.md`, and `HARDEN-AUDIT.md` — dated findings.
- `REFERENCE-WATERBODY-INVENTORY.md` — judgment record for an earlier visual-reference inventory; use `waterbody-inventory.json` only where a current builder still consumes it.

Historical statements such as “PASS,” “complete,” or a catalog count apply only to the revision named in that document.

## Package and app documentation

| Document                                                                                                                                                                                       | Scope                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [`../apps/admin/TOKENS.md`](../apps/admin/TOKENS.md)                                                                                                                                           | Shop-portal token format and operations |
| [`../apps/marketing/README.md`](../apps/marketing/README.md), [`../apps/marketing/GROWTH.md`](../apps/marketing/GROWTH.md), [`../apps/marketing/ANALYTICS.md`](../apps/marketing/ANALYTICS.md) | Marketing application                   |
| [`../e2e/README.md`](../e2e/README.md)                                                                                                                                                         | Playwright projects and harness         |
| [`../packages/contracts/README.md`](../packages/contracts/README.md)                                                                                                                           | Shared contracts and endpoint semantics |
| Package-level `README.md` files                                                                                                                                                                | Package-specific setup and ownership    |

## Maintenance policy

- Put durable decisions in an ADR or current reference document.
- Put defects and unfinished work in `KNOWN-ISSUES.md`.
- Put a time-bounded execution prompt in an active plan with a retirement condition.
- Put experimental results in a dated report.
- Remove completed session briefs, handoffs, duplicate checklists, and obsolete screenshots instead of leaving competing instructions.
- Avoid manually repeated counts. Derive them from source artifacts when reporting.
- Run `pnpm docs:check` after documentation changes.
