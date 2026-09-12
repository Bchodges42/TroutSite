# Stage 1 — Session C report

Base SHA: 80cd2cad916608c9dddcfcef0f98be3b10591c46 (origin/main)
Branch: session-c · Head at close: ce3bcb7 · All commits pushed to origin.

## Status

**DONE.** All five assigned items (T1-9, T1-13, T1-14, T1-15, T1-7 web half)
implemented with regression tests, on branch `session-c`, pushed. Every check
below is agent-run and green except the two known-red baselines owned by
Session B (noted, not touched).

## Per-item evidence

### T1-9 — assessed flag on detail page (commit 46b42f5)

- `StreamDetailPage.tsx` now calls `statusForScore(value, hasData, assessed)`
  with `snapshot.score.assessed`; a real clamped-0 lethal assessment renders
  the Poor pill + "Trout condition assessment" instead of "Assessment
  unavailable."
- Parity test (`apps/web/test/stream-detail.test.tsx`, "assessed flag parity
  across map, conditions list, and detail"): the three real callsite
  expressions — `useRiverMapData.ts` map path, `ConditionsPage.tsx` list path,
  and the detail page — are evaluated against four snapshot shapes (assessed
  0, unassessed 0, fair score, legacy no-flag 0) and must agree on every one.
  All three surfaces already passed the correct `assessed` through
  `statusForScore`; no selector-side fixes were needed.

### T1-13 — reasons/trend gated on displayMetric (commit 46b42f5)

- The score-trend label and the `snapshot.score.reasons` list now render ONLY
  when `displayMetric === 'trout-condition'`, derived via
  `toWaterDecisionView(...)` (the single classification authority) — no ad-hoc
  `feature.species` re-testing in the page.
- Warmwater/unverified-species waters show the neutral headline "Warmwater —
  raw readings shown; the trout model does not apply" / "Species unverified —
  … raw readings shown"; raw readings remain in the gauge table.

### T1-14 — badge physiology scoped to trout (commit 46b42f5)

- `statusForTemp` / `statusForFlow` badge coloring now applies only when
  `stream.species === 'trout'`; non-trout waters get the neutral `unknown`
  styling. Trout thresholds unchanged for trout waters.
- Tests pin both directions: 26 °C / 900 cfs warmwater fixture renders zero
  `trout-badge--{good,fair,poor}` classes; a 12 °C / 200 cfs trout fixture
  renders exactly two `--good` badges.

### T1-15 — empty idealFlow badge (commit 46b42f5)

- `idealFlow: []` renders "Not listed" instead of a bare `" cfs"` join.
  Asserted in the warmwater fixture test (beech-lake shape).

### Warmwater no-trout-language test (final verification gate)

`stream-detail.test.tsx` "renders no trout-model strings anywhere on the
detail output": renders a warmwater water carrying a snapshot whose
reasons/trend/score are pure trout model ("Dangerously warm — avoid stressing
trout", value 0, rising trend) and asserts NONE of: score pill
(`Condition score …`), "Trout condition assessment", trend labels
(rising/falling/steady), reason strings, or ideal-range language appear in the
output — while the raw readings still do.

### T1-7 (web half) — stocking matcher county disambiguation (commit ce3bcb7)

- New **tier 0** in `stockingMatch.ts`: curated `COUNTY_RESOLVES` table keyed
  by normalized event name + the TWRA row's `county`, checked BEFORE exact-name
  and containment tiers. Seeded with `'wolf river' + fentress →
  wolf-river-fentress` (provenance-commented, "add rows, never guess").
- Alias-normalization repair: bare-letter directionals in alias-table entries
  ("s fork", "s holston") now expand the same way live TWRA rows do, so
  "Ft. Patrick Henry TW / S. Fork Holston River" hits its
  `ft-patrick-henry-tailwater` alias instead of falling through containment to
  `holston-river`. (Also quietly fixes the "S. Holston TW" alias variant.)
- **Permanent regression fixture**: the review's captured 623-event
  2026-09-12 TWRA pull is committed at
  `apps/web/test/fixtures/stocking-tn-2026-09-12.json` (87 KB compact; shared
  per-row fields restored by the test loader).
- Tests (in `stockingMatch.test.ts`): 623 rows present; "Wolf River"@Fentress
  → `wolf-river-fentress` (and `wolf-river-west-tennessee` receives nothing);
  Ft. Patrick Henry rows → `ft-patrick-henry-tailwater` (and `holston-river`
  receives no tailwater rows); controls hold — Center Hill → `caney-fork-river`,
  Normandy → `duck-river-tailwater`, `duck-river-lower` receives nothing.

## Verification summary (all agent-run, this branch)

- `pnpm --filter @trout/web typecheck` — **PASS**
- `pnpm --filter @trout/web test` — **PASS** (26 files, 264 tests; base was 221)
- `pnpm --filter @trout/web exec vite build` — **PASS** (≈3.3 s)
- `pnpm -r build` full-build — **known red at web size-budget 67 MB (T0-4,
  Session B)**; not run as a gate per brief. The fixture-flavor dist builds;
  only `scripts/size-budget.mjs` exits red.
- e2e `--project=web` offline + privacy vs built dist — **16/16 PASS**
  (offline-cold-start ×2, offline-hatch ×2, privacy ×12). Ran via a temporary
  untracked config with `globalSetup` skipped, because globalSetup's
  `build:fixtures` exits at the size-budget red (T0-4) AFTER producing the
  dist; the dist itself was built by the same command. Scratch config deleted.
  Playwright chromium binary was missing on this machine and was installed.

## Blockers

None. Notes for other sessions / later stages:

- **Session A (T2-46):** this clone's `node_modules` is a git-TRACKED symlink
  into `~/Downloads/TroutSite-main/node_modules` — it broke workspace-package
  resolution (typecheck/tests) until I replaced it with a real install. The
  symlink deletion is left UNCOMMITTED in this clone's worktree; the untracking
  commit belongs to Session A.
- **Session B:** `wolf-river-fentress.yaml` description still says
  "Memphis-bound" (T1-7 content half — yours).
- The matcher's county tier is intentionally minimal (one entry). The ingest
  log's 264 unresolved aliases include more county-ambiguous names (Mill Creek
  Hickman/Overton, Laurel Fork Campbell/Carter) — T2 material, not guessed here.
- Stage-1 overflow items T2-36/37 were not started: assigned items completed
  late in the sitting; they remain for Stage 2/5 assignment.
- Out-of-scope T2 polish noticed but not touched (Stage 2/5 list already
  covers): detail page "Match this water" CTA shows on warmwater water
  (T1-17 family), `statusForTemp`/`statusForFlow` for trout waters with no
  idealFlow still color flow via the `[0]?.min ?? 100` fallback.
