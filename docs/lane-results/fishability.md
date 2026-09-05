# Lane results — FISHABILITY (pure decision model)

**Repo:** `C:\Users\Benjamin\Projects\trout-fishability` (branch `fishability/model`)
**Base SHA:** `4e54c36` — `fix(api): datePrecision survives the DB round-trip; live snapshots regenerated` (integrated branch HEAD used by the current lane wave; no other SHA was supplied with the brief)
**Lane commits:** three on top of base — model `373fccb`, review fixes `9b4a16d`, docs + this handoff (tip of `fishability/model`; see `git log`)
**Model version:** `1.0.0`

## Scope kept (verified)

Only these paths were created/modified (plus this file and `PROGRESS.md`,
the lane-convention status file):

- `apps/web/src/domain/fishability/**` (new: `types.ts`, `config.ts`,
  `time.ts`, `species.ts`, `observations.ts`, `evaluate.ts`, `filter.ts`,
  `index.ts`)
- `apps/web/test/fishability-model.test.ts` (new)
- `apps/web/test/trout-applicability.test.ts` (new)
- `docs/FISHABILITY-MODEL.md` (new — decision table, config, validation list)

Untouched, per brief: `packages/contracts/**`, `apps/api/**`,
`packages/content/**`, `apps/web/public/**` (the copied `v1/`+`content/`
snapshot data is gitignored runtime data, byte-identical to the integrated
checkout), `apps/web/scripts/**`, `apps/web/src/features/**`,
`apps/web/src/components/**`, `apps/web/src/pages/**`,
`apps/web/src/index.css`, `e2e/**`, package manifests,
`pnpm-lock.yaml`, `BACKEND-ISSUES.md`.

## What shipped

1. **`evaluateWater`** — deterministic, pure, month-aware trout
   applicability + all-fish fishability. No network/storage/React; all time
   from `input.now` with UTC normalization of date-only and zone-free
   strings (machine/timezone-independent, tested from both hemispheres).
2. **`selectVisibleWaters`** — pure partitioning: `included` (includes
   first, then de-emphasized), `excluded` (every exclusion carries a named
   rule + reasons), `selected` (a selected water stays inspectable even
   when excluded from the list). Uncertain waters are de-emphasized, never
   silently discarded.
3. **Named, versioned configuration** — every threshold in
   `FISHABILITY_CONFIG` (`config.ts`), flagged `[REQUIRES VALIDATION]`
   where biological; per-water `seasonalPolicy` overrides and a narrow
   `EvaluateOptions.overrides` hook; `MODEL_VERSION` in debug metadata.
4. **All-fish mode** — generic freshness/usable-range banding, never
   returns `trout-condition`, never reuses the trout bands (asserted:
   22 °C water is good all-fish / fair trout).
5. **Trout-mode honesty rules** — no fixed-date absence claims (absence
   needs current warm water + aged-out completed stocking); schedules are
   weaker evidence than completed reports; CFS alone never proves trout;
   missing history → unknown/uncertain; zero CFS is a real value;
   year-round wild/managed evidence survives supplemental-stocking history
   and summer heat (condition degrades, presence doesn't).

## Decision table

See `docs/FISHABILITY-MODEL.md` for the full ordered table (9 branches),
display-metric matrix, visibility rules, config listing, and the
**biological assumptions requiring validation** (10 items, e.g. 24 °C
default warm cutoff, 60-day default retention, lexical species tables).

## Tests

`pnpm --filter @trout/web test`: **133 passed** (88 pre-existing + 45 in
the two new files). Required scenarios covered: September seasonal stream
with only old winter stocking (uncertain without warmth; likely-absent +
excludable with current warmth); recently stocked winter water
(probable-current, never confirmed); wild trout stream in September
(confirmed-current); tailwater with verified year-round management
(confirmed-current through a brutal summer, poor conditions); warm stale
vs warm current observation; missing stocking history (uncertainty, not
absence); scheduled vs completed stocking; zero CFS as a real value (both
modes); all-fish never returns trout-condition (5-water sweep);
selected-but-filtered inspectability; determinism around date/time zones
(Z vs offset, date-only vs UTC vs zone-free, UTC-month vectors, input
non-mutation). Also: 2×-retention boundary flip, sustained-warmth override,
month-precision grace, future-dated stocking caution, near-cutoff wording,
low-confidence wild-evidence wording, conflicting species evidence.

`pnpm --filter @trout/web typecheck` green · `pnpm --filter @trout/web build`
green (size budget OK) · eslint clean on the new files.

## Process

- Read-only audit subagent mapped existing scoring/species conventions
  before implementation (vitest style, strict TS flags, B08 status,
  contracts vocabulary).
- Adversarial biology subagent (throwaway harness outside the repo, no
  repo edits) produced 10 findings; all actionable ones fixed: wired the
  dead `minSustainedWarmObservations` knob, date-precision grace ages,
  near-zero-flow banding, near-cutoff phrasing, low-confidence
  wild-evidence wording/visibility.
- Test-overclaiming subagent produced 10 findings; the one blocker
  (hemisphere-blind timezone determinism vector) was fixed via exact
  fractional-day debug assertions + a UTC-east month vector; boundary-style
  confidence assertions replaced constant-blessing where flagged.
- Only the lane lead edited owned files throughout.

## Judgment calls for review

1. No BASE_SHA was supplied with the brief; adopted the wave base
   `4e54c36` from the sibling-lane convention (PROGRESS.md files in
   trout-lines / trout-catalog / trout-stillwater all record it).
2. `PROGRESS.md` at the repo root is created per the SESSIONS.md lane
   convention (not in the ownership list, but mandated for every lane; no
   other lane owns it in this clone).
3. `troutApplicability` is computed identically in both modes (background
   truth); `mode` decides presentation. The brief's "stop displaying trout
   conditions" is enforced at the display layer and tested as an
   absolute invariant.
4. Stocking events without a `species` list are treated as trout-stocking
   evidence (TWRA put-and-take default); events whose species are
   explicitly non-trout are not.
5. Ties between conflicting year-round trout and non-trout evidence
   prefer trout presence (product conservatism), with a surfaced caution.
6. CI recommendation (not actionable in this lane — no CI files owned):
   run the model tests once under `TZ=Pacific/Auckland`.
