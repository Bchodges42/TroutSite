# Coordination — two-lane rebuild of the Trout app

**Date:** 2026-09-04 · **Base for both lanes:** `51f8803` ("Redesign: dark Tailwater identity, species toggle, full river atlas data") on `C:\Users\Benjamin\Projects\trout` (frozen reference — do not touch).

## The lanes

| Lane | Repo | Owner | Scope |
|---|---|---|---|
| UI / UX design | `C:\Users\Benjamin\Projects\trout-fieldwork-20260904` (branch `codex/trout-fieldwork-20260904`) | Codex (ChatGPT desktop) | Everything the user sees: layout, chrome, themes, interaction, motion, visual states |
| Backend / data / infra | `C:\Users\Benjamin\Projects\trout-backend` (this repo, branch `main`) | ZCode | Scoring engine, contracts, fixtures pipeline, freshness semantics, offline/cache machinery, api, infra |

**Rule (relayed to Codex, in its chat as a Steer message):** when the UI needs a non-UI change, Codex does NOT implement it — it appends the issue to `BACKEND-ISSUES.md` in its repo root (what's wrong, file/line evidence, what the UI needs, suggested fix, severity) and keeps designing. This lane (trout-backend) implements from that file.

## Merge plan

Both lanes fork from `51f8803`. Backend changes deliberately keep a **minimal footprint inside `apps/web/src` UI files** (only wiring data semantics into current surfaces, which Codex's rebuild replaces anyway). Durable backend changes live in:

- `packages/contracts/src/schemas/conditions.ts` — `ConditionScore.assessed?: boolean`
- `packages/contracts/src/scoreConditions.ts` — sets `assessed` on every return path
- `packages/contracts/src/readingFreshness.ts` — `newestReadingAt`, `readingAgeMinutes`, `readingsAreStale`, `READING_STALE_MINUTES`
- `apps/web/scripts/generate-fixtures.mjs` output — fixtures now carry `assessed`
- Minimal web wiring: `riverMapSelectors.ts`, `useRiverMapData.ts`, `FreshnessChip.tsx`, `RiverDrawer.tsx`, `HomePage/ConditionsPage/StreamDetailPage/BrowsePage` chip props

To merge: rebase Codex's UI branch onto this main (expected conflicts only in the wiring files listed above — take Codex's UI, re-attach the data hooks it needs), or cherry-pick the contracts/fixtures commits into its branch.

## What the backend lane has fixed (2026-09-04)

1. **"No data" vs "Poor" conflation (found by Codex's data audit).** A real assessment can clamp to 0 (floored flow score 10 − 30 dangerous-heat penalty). `statusForScore` used to infer "no data" from `value === 0`, hiding scorching-hot trout waters as unassessed. Now `scoreConditions` returns an explicit `assessed` flag; consumers key off it. Legacy snapshots without the flag keep the old inference.
2. **"Live" lied about data age.** Freshness labels keyed off fetch success ("Live · now" on a 6-hour-old reading). Now freshness is computed from the newest gauge reading's own timestamp: `Live · observed 15 min ago` / `Stale · observed 4 hr ago` / `Offline · last known …`. `READING_STALE_MINUTES = 180`.
3. **Fixtures regenerated** (139 files) so baked snapshot JSON carries `assessed`. Tests: 60 passing (10 new: clamp case, assessed paths, reading-age helpers, chip labels).

## Known follow-ups for this lane

- Refresh the **served** `public/v1` snapshots (deploy artifact) after this lands — dev servers still serve 51f8803-era data.
- `apps/web/fixtures` currently generates no clamped-zero (hot water) stream; add a deterministic heat-wave case so the UI lane always has a true "Poor" example to design against.
- Shop reports: fixtures have none (Codex noted it); decide whether to synthesize sample reports for dev fixtures.
- Intake and implement whatever lands in `trout-fieldwork-20260904/BACKEND-ISSUES.md`.
