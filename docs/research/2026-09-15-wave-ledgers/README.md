# 2026-09-15 Wave Ledgers — primary sourcing corpus

Provenance: three parallel deep-research orchestration sessions (lanes
`wave1-sources-orchestrator`, `wave2-sources-orchestrator`,
`wave3-sources-orchestrator`), each executing the corresponding
`trout-project-plan/PROMPT-{1,2,3}-SOURCES-*.md` mission with research →
gauge-probe → 30% QC re-fetch passes. Every cited URL was fetched live
2026-09-14 (QC re-fetches 2026-09-14/15).

- `SOURCES-LEDGER-WAVE1-TAILWATERS-LAKES.md` — 51 blocks (50 roster tailwaters/lakes + `watauga-river-wilbur-reach` bonus)
- `SOURCES-LEDGER-WAVE2-RIVERS-PONDS.md` — 41 blocks (35 rivers/springs + 5 TWRA community ponds + wilbur-reach roster entry)
- `SOURCES-LEDGER-WAVE3-CREEKS.md` — 57 blocks (creeks; each carries a `Class:` verdict line)

Coverage: 149 blocks, 148 unique slugs — the original 148-water catalog roster
in full. NOT covered: the 40 selectable-river-expansion additions or
`duck-river-mouth` (catalog now 189) — a follow-up sourcing pass would be
needed for those.

Shared block format: one `### <slug>` block per water with six slot lines —
Species / Stocking / Regulations / Gauges / Access / Identity — each carrying
`| Source: <URL>`, `Proves:`/`Obs:`/`Accessed:` annotations, and an explicit
`none found — tried:` convention for honest negatives. Wave 3 adds a
`Class:` line (wild-self-sustaining / mixed / stocked-winter / warmwater /
none-found). Appendices per ledger: gauge-probe tables, QC re-fetch reports,
corrections logs.

This directory is REPORT-ONLY evidence for the import plan
(`trout-project-plan/IMPORT-PLAN-2026-09-14-RESEARCH-AUDIT.md`, phases 0–2).
The parser lives at `packages/content/scripts/wave-ledgers/parse-ledgers.mjs`;
it emits machine-readable ledgers + a field-by-field diff vs the catalog into
`ledger/` here. No catalog YAML changes happen before the owner clears the
decision boxes in `DIFF-REPORT.md`.
