# Codebase audit & cleanup — 2026-09-27

Ruthless audit of the TroutSite repo at `main` (`d1e48d1`), plus the cleanup executed on this branch (`chore/ruthless-cleanup-20260927`). Method: git-state survey, full import-reference graph over all 278 workspace source files, string-reference cross-checks, lint/typecheck baselines, branch merge-status sweep, and on-disk size accounting.

## What was cleaned (this branch)

1. **Dead source files deleted (5):**
   - `apps/web/src/features/map/MapControls.tsx` — the known zombie, deleted twice before (`e2f4b23`, `31f09f0`), resurrected a **third** time by a lane merge. Zero importers confirmed by graph + string grep.
   - `apps/web/src/features/map/useMapState.ts` — zero importers; state moved to RiverMapPage long ago.
   - `apps/web/src/lib/provenance.ts` — zero importers in web (api has its own separate provenance usage).
   - `apps/web/scripts/audit-selectable-rivers.mjs` + `build-selectable-river-additions.mjs` — completed selectable-rivers campaign scripts, zero references anywhere, and the source of **all 16 lint errors** (`no-undef console` × 16). Deleting them takes web lint from 16 errors/32 warnings to **0 errors**/32 warnings (the warnings are pre-existing react-hooks items in live files).
2. **Session sprawl archived:** root `notes/` (16 files: map-prominence lane scratch, screenshots, candidate JSONs) and `FANOUT-REPORT.md` (2026-09-11 geofanout session report) moved to `docs/research/archive-2026-09-11-geofanout/` — preserved for history (git mv, blame intact), out of the repo root. No doc (INDEX/README/RUNBOOK/AGENTS) referenced them.
3. **`.gitignore`:** `tmp/` added — it was untracked-but-not-ignored, which is how 875 MB of session scratch (research PDFs, WQP CSV pulls, staging helpers) accumulated on disk in the research clone without any gate.

## Audit findings — what remains (owner decisions)

**A. Branch sprawl (68 remote branches).** 42 are fully merged into main → deleted from the remote during this cleanup (zero commit loss; all content lives in main; recoverable from any local ref). 26 remain unmerged:

| Group | Branches | Recommendation |
| --- | --- | --- |
| Active line | `codex/evidence-backed-fisheries-repair-20260922` (evidence sweep + review page), `fix/apply-owner-triage-20260924`, `research/owner-triage-20260924` | **Keep** — this is the merge chain awaiting owner adjudication (review page → apply → merge) |
| Superseded | `feat/evidence-backed-fisheries-20260922` (superseded by the repair branch), `evidence/habitat-batch1..6` (evidence corpus lives in `packages/content/research/habitat-survival/`, merged via other lines), `codex/evidence-methods-audit-20260921`, `codex/review-jev-classification-20260917` | Delete **after** the active line merges — their valuable content is either already in main or distilled into the repair branch |
| Older pending stacks | `feat/tiered-classification`, `feat/stage2-code-classifier`, `feat/jev-system-classification`, `codex/jev-trout-classifier`, `chore/purge-2026-09` | Decide explicitly: merge, rebase-onto-the-new-line, or close in DECISIONS.md — these are the "decision debt" the retrospective named |
| Historical research | `codex/trout-fieldwork-20260904`, `codex/species-catalog-20260916`, `codex/verify-map-claims`, `research/2026-09-14-tennessee-waters-prompt`, `docs/campaign-prompts`, `audit/2026-09-13-orchestrator`, `fishability/model`, `proto/prerender`, `session-c-hotfix` | Almost certainly safe to delete (findings live in `docs/`); spot-check `fishability/model` and `proto/prerender` for unmerged experiments first |

**B. Clone hygiene.** The research clone carried 875 MB of `tmp/` scratch — cleared locally during this cleanup (canonical logs are committed under `docs/research/`; PDFs/CSVs are re-fetchable from the URLs in the logs). Each session should keep its clone lean; `tmp/` is now gitignored.

**C. Kept deliberately (looked dead, verified alive):**
- `scripts/nhd_validate.mjs` vs `scripts/nhd-validate.mjs` — not duplicates: underscore = per-reach B13 gate (invoked by `nhd_trace_catalog.mjs`), hyphen = catalog-wide regression suite.
- The 14 `apps/web/scripts/fix-*.mjs` one-shot data patches — referenced by the trace pipeline docs/tooling; they document how each geometry fix was applied (reproducibility archive).
- `apps/api/src/ingest/stocking/adapter-TEMPLATE.ts` — explicitly a template.
- ~80 build/fetch/validate scripts with zero inbound imports — they're CLI entry points wired through package.json scripts, docs, or the pipeline; the reference graph can't see shell invocation.

**D. Size picture.** `.git` = 185 MB (healthy); `data/` = ~700 MB on disk (NHD source + derived geojson, compresses ~4:1 in git). Not urgent, but if clone times start hurting, the derived `data/nhd/derived/*` class is the LFS-or-regenerate candidate. `apps/web/dist` builds are untracked (correct).

**E. Known nits (not touched):** 32 react-hooks warnings in live map files (`TennesseeMap.tsx` ×5, `QaPanel.tsx` ×2, `useRiverMapData.ts` ×4, `HatchKeyPage.tsx` ×1) — real hygiene debt but each needs individual judgment; bundle with the UI-overhaul lane rather than a risky drive-by.

## Verification (this branch)

- Web lint: **0 errors** (was 16), 32 pre-existing warnings.
- Web typecheck: clean (deletions were zero-import files).
- (Full suites re-run at merge time per usual gates: `test:infra`, content validation, web/api tests.)

## Next moves (recommended order)

1. **Owner adjudicates the evidence review page** (`docs/research/2026-09-27-evidence-review/EVIDENCE-REVIEW-190.html` on the repair branch) → export `evidence-final-decisions.json` → apply to the final truth set → stage-3 golden tests → **merge the active chain to main** (repair → triage-apply). This ships 12 year-round downgrades, ~41 corrected month windows, and the identity fixes.
2. **Merge this cleanup branch** (before or with #1 — no conflicts expected; it touches disjoint files).
3. **Then delete the superseded/historical branch groups** (table above) and close the older stacks in `DECISIONS.md`.
4. **UI-overhaul lane starts on solid ground** — one design pass, four reference renders, owner picks; fix the react-hooks warnings as part of touching those files.
5. Live-conditions layer (gauges/temps wiring) stays last — biggest scope, deserves settled labels.
