# INDEX — map of every document

Read this before creating or consulting docs. Four tiers: **Canon** (living, read
routinely) · **Reference** (data provenance, consult when touching that data) ·
**Evidence** (point-in-time audit results — historical record, not guidance) ·
**App docs** (scoped to one package). Older session logs, old session briefs, and handoff
prompts were retired in the 2026-09-11 cleanup — they live in git history, not the
working tree. Don't resurrect them; write a new dated report under `docs/reports/`
instead.

## Canon

| Doc | What it's for |
|---|---|
| [`../README.md`](../README.md) | Product, layout, quickstart, architecture invariants |
| [`../AGENTS.md`](../AGENTS.md) | Binding session/branch/production rules for AI sessions |
| [`../infra/RUNBOOK.md`](../infra/RUNBOOK.md) | Ops bible — §9 is the self-healing production stack |
| [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) | **THE WORKLIST** — every known issue/deficit consolidated, deduplicated, prioritized T0–T3 with decisions needed |
| [`EXECUTION-PLAN.md`](EXECUTION-PLAN.md) | How to run the worklist: three sessions (A/B/C), file ownership, five stages, push cadence, verification |
| [`SETUP.md`](SETUP.md) | One-time setup: SSH, get doc changes into git, cut the three session clones, baselines |
| [`SESSION-BRIEFS-STAGE-1.md`](SESSION-BRIEFS-STAGE-1.md) | Stage 1 paste-ready session briefs (A server/ops · B build/content · C web app) |
| [`LOGIC-AUDIT.md`](LOGIC-AUDIT.md) | Evidence appendix: two-pass product-logic audit behind the worklist's LOGIC items |
| [`DESIGN.md`](DESIGN.md) | The Fieldwork design system: identity, themes, map adapter, judgment calls |
| [`REVIEW-PROMPT.md`](REVIEW-PROMPT.md) | Paste-ready single-session prompt for a full-spectrum review |
| [`DATA-SOURCE-RESEARCH-PROMPT.md`](DATA-SOURCE-RESEARCH-PROMPT.md) | Paste-ready exhaustive research brief for missing water data sources |
| [`BACKLOG.md`](BACKLOG.md) | Out-of-scope parking lot + post-v1 roadmap (do not build in v1) |
| [`ASSUMPTIONS.md`](ASSUMPTIONS.md) | Living log of decisions/deviations — append, don't rewrite |
| [`adr/`](adr/) | Architecture Decision Records (read-path, tokens, snapshot layout, ...) |
| [`OPERATIONS-ANALYTICS.md`](OPERATIONS-ANALYTICS.md) | Analytics opt-in design, WAF kill-switch, ads-readiness checklist |
| [`CODEBASE-GUIDE.md`](CODEBASE-GUIDE.md) | Guided tour of the code: packages, data flow, where things live |
| [`AUDIT-PROMPT.md`](AUDIT-PROMPT.md) | Paste-ready prompt for an accuracy audit/planning session |
| [`GAUGE-CATALOG-GAPS.md`](GAUGE-CATALOG-GAPS.md) | Gauged rivers missing from / under-wired in the catalog (2026-09-15 worklist) |

## Reference — data provenance & contracts (consult before touching that data)

| Doc | Covers |
|---|---|
| [`atlas-sources.md`](atlas-sources.md) / [`atlas-validation.md`](atlas-validation.md) | River/lake atlas sources, hydro identities, selectable trace recipes + validation rules |
| [`topo-sources.md`](topo-sources.md) | Hillshade/contour tiles (USGS 3DEP), budgets, provenance |
| [`roads-sources.md`](roads-sources.md) | TIGER 2024 roads build (license verdict, LOD ladder, weld guards) |
| [`flow-orientation.md`](flow-orientation.md) | How flow-direction arrows are derived from topology |
| [`TN-DATA-SOURCES.md`](TN-DATA-SOURCES.md) | Tennessee source inventory |
| [`DATA-SOURCE-COVERAGE.md`](DATA-SOURCE-COVERAGE.md) (+ `data-source-coverage.json`) | Gauge/feed coverage per water |
| [`FISHING-INFORMATION-SOURCES.md`](FISHING-INFORMATION-SOURCES.md) | Regulations pack provenance & review dates |
| [`STILLWATER-COVERAGE.md`](STILLWATER-COVERAGE.md) | Lake/pond coverage decisions |
| [`WATERBODY-GEOMETRY-CONTRACT.md`](WATERBODY-GEOMETRY-CONTRACT.md) · [`REFERENCE-WATERBODY-INVENTORY.md`](REFERENCE-WATERBODY-INVENTORY.md) (+ `waterbody-inventory.json`) | Geometry property contract + per-waterbody inventory |
| [`NHD-CONVENTIONS.md`](NHD-CONVENTIONS.md) | Frozen NHD trace-engine conventions (GEOCONV-0 contract) |
| [`STATEWIDE-RIVER-COVERAGE.md`](STATEWIDE-RIVER-COVERAGE.md) | Displayed vs selectable NHD network coverage (2026-09-15) |
| [`imagery-provenance.csv`](imagery-provenance.csv) | Imagery/relief layer provenance table |

## Evidence — point-in-time audits (historical; superseded by newer data wins)

`GEO-AUDIT.md`, `CONTINUITY-AUDIT.md`, `GEO-CONTINUITY-AUDIT-lane.md`,
`SPECIES-REVIEW.md`, `WATERBODY-IMPLEMENTATION-CHECKLIST.md`, `HARDEN-AUDIT.md`,
`NETWORK-ROLLOUT.md`, `NHD-BEFORE-AFTER.md` (+ `nhd-before-after/`),
`audits/*`
(hydrography, connectivity, duplicates, self-intersection, UI-conditions),
`lane-results/*`, and `reports/*` — role handoffs plus
[`reports/review-2026-09-11.md`](reports/review-2026-09-11.md), the latest full-spectrum
review (its confirmed defects are summarized in [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md)).

Every tracked doc is classified above (completed 2026-09-17 audit — no unindexed
strays remain; superseded pre-2026-09-12 session material stays retired in git
history per the note at the top, so there is no `docs/archive/`).

## App docs

| Doc | Scope |
|---|---|
| [`../apps/admin/TOKENS.md`](../apps/admin/TOKENS.md) | Shop-portal token format, minting, verification, rotation |
| [`../apps/marketing/README.md`](../apps/marketing/README.md) · [`GROWTH.md`](../apps/marketing/GROWTH.md) · [`ANALYTICS.md`](../apps/marketing/ANALYTICS.md) | Marketing site |
| [`../e2e/README.md`](../e2e/README.md) | Playwright suites + how the harness boots real servers |
| [`../packages/contracts/README.md`](../packages/contracts/README.md) | Exact contract export list & semantics |
