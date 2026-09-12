# Stage 2 — Session A report (fishability contract, F1 + F4)

Base SHA: `3c329601e22facb755fdbbe0fd786d07579c3617` (origin/main, contains all Stage 1 work; clean tree; branch `session-a-stage2`)

## Status

- [x] SETUP: branch `session-a-stage2` off origin/main @ 3c32960, pushed
- [x] TASK 1 — F1 contract v2 — PUSHED @ `054949f` (B and C can pull now)
- [x] TASK 2 — F4 scorer — PUSHED @ `e193ea1`
- [x] TASK 3 — unblock broadcast (this section)

**UNBLOCK BROADCAST — F1 + F4 are settled and pushed on `session-a-stage2` (`e193ea1`).**
Session B: author F2 bands against `SpeciesComfortBandsSchema` + fill F3 `targetSpecies`
(all types exported from `@trout/contracts@2.0.0`). Session C: build F6 against
`FishabilityScoreSchema` / `ActivityOutlookSchema` and `ENDPOINTS.fishabilityForWater`.

## Schema (settled, ADR 0007 — docs/adr/0007-fishability-contract.md)

- **Species keys (frozen v2):** `largemouth-bass`, `smallmouth-bass`, `spotted-bass`,
  `crappie`, `bluegill`, `channel-catfish`, `striped-bass`.
- **`SpeciesComfortBands`** (F2 authors, cited): one species' thermal ladder in °C —
  `lethalLow < avoidanceLow < optimalLow <= optimalHigh < avoidanceHigh < lethalHigh`
  (schema-enforced ordering). The avoidance boundaries ARE the lower/upper active limits.
- **`FishabilityScore`**: `{ species, value 0–100 int, reasons[], assessed, freshness }`;
  `freshness = { observedAt, ageMinutes } | null`. Honesty: clamped-0 lethal = REAL Poor
  (`assessed: true`); `assessed: false` = No data; freshness is the scoring observation's
  OWN age (T1-6 discipline), >180 min → cannot-assess.
- **`ActivityOutlook`**: `{ total 0–100 int, components: ActivityComponent[] }`;
  component = `{ factor, value 0–100, contribution −50…+50, weight 0–1, evidenceUrl,
  confidence 'measured'|'derived'|'heuristic', label }`. Weights sum to 1 (±0.01,
  schema-enforced); `contribution = weight × (value − 50)` (±1.5 tolerance,
  schema-enforced); components ordered desc by |contribution|, stable ties.
  `total = clamp(0,100, round(50 + Σ contribution))` — 50 is neutral.
  Factors (closed enum v2): `water-temperature`, `flow-trend`, `pressure-trend`,
  `spawn-state` (the latter three are Stage 3: F5/F8/F9 fill them).
- **`StreamSchema.targetSpecies?: SpeciesKey[]`** — additive, optional; the program-type
  `species: 'trout'|'warmwater'` is unchanged.
- **`ENDPOINTS.fishabilityForWater(streamId) = /v1/fishability/<streamId>.json`** — F5
  emits `FishabilitySnapshot = { streamId, fetchedAt, bySpecies: { [species]:
  { comfort: FishabilityScore, activity: ActivityOutlook } } }`.
- **Version:** `@trout/contracts` 1.0.1 → **2.0.0** (additive; no v1 shape changed).
- **Scorers (pure, deterministic, client-side):** `scoreFishability(readings, species,
  bands, nowMs)` (required `nowMs` — freshness is part of the emitted shape, and
  contracts already own the caller-passed-clock pattern from `readingFreshness`);
  `scoreActivity(components)`. Neither mutates inputs; both fully covered by boundary +
  seeded property tests.

### Plain-language explainer (for the owner)

**What the comfort score means:** for each fish species, scientists describe water
temperatures as "just right", "too cold or too warm to bother", or "deadly". We take the
gauge's latest water temperature reading, check it's recent (under 3 hours old — older
readings are ignored rather than presented as current), and say which of those three
situations the water is in right now: 90 means the fish are comfortable and feeding, 40
means they're stressed and holding tight, and 0 means the water is genuinely lethal — a
real "don't bother", clearly labeled so it can't be confused with "we have no data."
**What the activity number means:** start at 50 — a normal day. Each thing we can
measure (water temperature today; soon: whether the flow is rising or falling, pressure
trend, and whether it's spawning season) adds or subtracts points, and the site will
show exactly which factor moved the number and by how much, with a link to the source
of each measurement. No black box: same readings always produce the same number, and
every component of the total is visible. If the sentence "the water's too warm for
smallmouth right now, but the flow looks good" is more detail than anyone needs, that's
the signal the scale is simple enough.

## Per-item evidence

### TASK 1 — F1 (commit 054949f)
- `docs/adr/0007-fishability-contract.md` — decision, consequences, six rejected
  alternatives (ConditionScore+species reuse, interpolated curve, free-form factor,
  per-metric timestamps on GaugeReading, optional nowMs, and the species-key list).
- `packages/contracts/src/schemas/fishability.ts` — SpeciesKeySchema (7 keys, frozen),
  SpeciesComfortBandsSchema (order-refined), ActivityConfidenceSchema, ActivityFactorSchema,
  ActivityComponentSchema (range-refined), ActivityOutlookSchema (weight-sum + contribution
  consistency refinements), FishabilityScoreSchema, FishabilitySnapshotSchema.
- `StreamSchema.targetSpecies` additive; `ENDPOINTS.fishabilityForWater` additive;
  `index.ts` exports; package version → 2.0.0.
- Tests: `test/fishability.test.ts` (22 tests) — every refine's reject path, frozen key
  list asserted, endpoint stability (existing routes unchanged), targetSpecies accept/
  omit/reject.

### TASK 2 — F4 (commit e193ea1)
- `src/scoreFishability.ts`: zone ladder (lethal 0-assessed / avoidance 40 / optimal 90),
  per-metric freshness (newest reading carrying a temperature; > READING_STALE_MINUTES →
  cannot-assess), species-mismatch → cannot-assess, unreadable timestamp → cannot-assess.
- `src/scoreActivity.ts`: total formula, |contribution|-desc ordering with stable index
  tie-break, empty → honest `{total: 0, components: []}`.
- Tests: `test/scoreFishability.test.ts` (46 tests) — exact band-edge boundaries (all six
  boundaries), clamped-0-lethal vs cannot-assess, the 180-minute freshness boundary
  (exactly 180 = fresh, 181 = stale), per-metric observation-age selection, species
  mismatch, plus seeded-property suites: well-formedness over 300 random temps × random
  bands, determinism, input immutability (frozen inputs), zone ordering over 100 random
  ladders; scoreActivity totals/clamps/ordering/stability/immutability/determinism.

## Verification

- TASK 1: contracts build ✓, test 119/119 ✓ (coverage 99.23% ≥ 90% gate), contracts lint ✓.
- TASK 2: contracts build ✓, test 165/165 ✓ (coverage 99.07% ≥ 90% gate), lint ✓.
- Downstream: `apps/api` build ✓, tests 176/176 ✓ (two consecutive full green runs; one
  earlier single flake in the socket-heavy T0-2 sandbox tests, green on both re-runs).
- `pnpm -r build`: GREEN (size-budget stays fixed, rc=0).
- `pnpm -r lint`: my slice green (contracts, api, e2e/api, e2e/admin). **Discrepancy vs
  the brief's "main fully green":** in this clone, apps/web (≈440 error lines, incl.
  `scripts/*.mjs` and `src/**`) and e2e (48 lines, `fieldwork/*`, `repro-ux.mjs`,
  `verify-ux.mjs`) fail lint IDENTICALLY on a pristine origin/main worktree (442/49) —
  pre-existing, not introduced here (contracts has no type-aware lint coupling). Likely
  the release/integration environment resolves the root flat config differently. Flagged
  in Blockers for the owner/integration session.

## Blockers

- None for F1/F4 (both landed and pushed).
- For the record (not mine to fix): workspace lint is not green on origin/main in this
  environment — `apps/web` (Scripts = Session B slice; `src/` + `test/` = Session C slice)
  and `e2e/fieldwork` + `e2e/repro-ux.mjs` + `e2e/verify-ux.mjs` (no session owns
  `e2e/fieldwork`). Whoever owns the integration step should reconcile before the next
  release checkpoint; file lists are in the Stage 1 report's verification section and
  were re-confirmed identical on main @ 3c32960 today.

