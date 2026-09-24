# CHANGES — evidence-backed fisheries lane (`feat/evidence-backed-fisheries-20260922`)

Everything this lane changed, in reviewable form. Branch cut from
`origin/main` @ `d1e48d1`, pushed at `6f8c42a`, **not merged** (merge = the
owner's call; merging deploys). Full narrative report:
[`docs/reports/2026-09-22-evidence-backed-fisheries.md`](../docs/reports/2026-09-22-evidence-backed-fisheries.md).

## The one-paragraph summary

Implemented evidence-backed fishery opportunities for Tennessee's 190 catalog
waters: a machine-readable **evidence ledger** (one entry per water,
claim-specific provenance, distinct dates, conflicts preserved, honest
unresolved states) built by a 7-lane adjudication fleet that re-verified the
decisive sources live; **ADR 0010** — an additive `opportunity` contract
(contracts 2.3.0) expressing year-round-trout / seasonal-stocked-trout /
warmwater-focus / mixed / unresolved with evidence states
documented/limited/historical/conflicting/unresolved; the decision model now
consumes it, the audited Nov–Mar seasonal fallback is gone, absence-claim
wording is removed, and drawer/detail/list/SEO surfaces publish the same
words. Result: **29 year-round / 58 seasonal-stocked / 55 warmwater-focus /
13 mixed / 35 unresolved — zero "no trout" verdicts anywhere.**

## In this folder

| File | Contents |
|---|---|
| [01-commits.md](01-commits.md) | all 6 commits (messages, per-commit file lists) |
| [02-catalog.md](02-catalog.md) | the catalog: `opportunity:` blocks on all 190 waters, the 13 applied `yearRound` fixes, per-water matrix |
| [03-code.md](03-code.md) | contracts, decision model, UI, SEO, API plumbing, CSS, tests — with before/after |
| [04-ledger.md](04-ledger.md) | the ledger artifacts, source captures, measured counts, hard-case findings |
| [05-owner-boxes.md](05-owner-boxes.md) | the 112 corrections NOT applied + data-holder asks |
| [06-validation.md](06-validation.md) | every gate run + the 5-pass visual acceptance story |

## By the numbers

- **234 files changed**: +138,372 / −1,268 — of which the product code is
  19 files (+822/−36), catalog content is 190 files (+7,474/−1,232, the
  `opportunity` blocks), and the rest is the committed evidence ledger +
  source captures + this documentation.
- **28 new files** (ledger, captures, tooling, ADR, card component,
  migration), **206 modified**.
- **All gates green**: contracts 197 · web 371 · api 237 tests; content
  validate OK; builds pass incl. the 25 MB budget; prerender 598 pages;
  `verify-ledger --final` 0 errors / 0 warnings; visual gate **10/10 pass**
  after 5 judge passes.

## What this lane did NOT do

- Did not merge to `main`, deploy, or touch the production host.
- Did not change any water ID, geometry, name, gauge wiring, or snapshot
  format beyond the additive `opportunity` field.
- Did not auto-apply species/region/season-window corrections — 112 of them
  wait in `05-owner-boxes.md` with their evidence.
- Did not ship Fishbrain data into the product (research leads only; reuse
  rights unresolved).
- Did not contact any agency, shop, or person.
