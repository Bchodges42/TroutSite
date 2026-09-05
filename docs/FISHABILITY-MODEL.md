# Fishability Decision Model

**Model version: `1.0.0`** (exposed as `MODEL_VERSION` and in `evaluateWater(input, { debug: true })` debug metadata).
**Lane:** fishability (pure decision model). Base commit: `4e54c36`.
**Location:** `apps/web/src/domain/fishability/` · **Tests:** `apps/web/test/trout-applicability.test.ts`, `apps/web/test/fishability-model.test.ts`

A deterministic, pure decision model: no network, no storage, no React, no
`Date.now()`. All time derives from `input.now`. The same input produces the
same decision on any machine, in any timezone.

## Public API (`index.ts`)

| Export | Purpose |
|---|---|
| `evaluateWater(input, options?)` | Full decision for one water. `options: { debug?: boolean; overrides?: { trout?: { minSustainedWarmObservations?: number } } }`. |
| `selectVisibleWaters(decisions, options?)` | Pure list partitioning with explained exclusions and selected-water inspectability. |
| `MODEL_VERSION`, `FISHABILITY_CONFIG` | Versioned named configuration — every threshold lives here. |
| Types | `FishabilityInput`, `WaterDecision`, `FilteredWaters`, `DecisionDebug`, … |

## Inputs and outputs

Input and output shapes are exactly the lane brief's `FishabilityInput` and
`WaterDecision`. Notes:

- `now` and all dates are ISO-8601. **Model rule:** date-only strings
  (`2026-02-10`) and zone-free date-times (`2026-02-10T00:00:00`) are
  interpreted as UTC; zone-explicit values are used as given. `Date`'s
  local-time parsing of zone-free strings is deliberately bypassed — this is
  what makes results machine-independent (`time.ts`).
- The model month is the **UTC month** of `now` (1–12). Documented
  limitation: it is not the water's local month; the difference can matter
  only within ~14 hours of a month boundary.
- `waterbodyType` is accepted but **never used to assert trout presence**
  (a `tailrace` label alone is not evidence); it exists for callers/UI.
- `speciesEvidence.species` is free-form. Trout vs non-trout is decided
  lexically (`species.ts`): explicit trout markers (`trout`, `cutbow`,
  `cutthroat`, `steelhead` substrings), whole-string TWRA stocking codes
  (`rainbow`, `brown`, `brook`, `golden`, …), and non-trout markers
  (`bass`, `warmwater`, `crappie`, …). Ambiguous strings never drive a
  decision and surface a caution.
- Waterbody-level flow *reference ranges* (e.g. `idealFlow`) are **not part
  of the input**; the model can therefore only judge flow extremes, not
  flow quality. See "Known limitations".

## Trout applicability — decision table

Evaluated in order (trout and all-fish modes alike; applicability is
background truth, `mode` decides presentation):

| # | Condition | Result | Confidence |
|---|---|---|---|
| 1 | Authoritative non-trout evidence (year-round basis, high confidence) outscoring any year-round trout evidence | `not-trout` | evidence confidence |
| 2 | Year-round trout evidence (`wild-population` / `year-round-managed`) — high / medium / low | `confirmed-current` / `probable-current` / `probable-current` (weak, de-emphasized) | high / medium / low |
| 3 | Completed stocking within retention window (youngest plausible age), month not contradicted by `stockedMonths` | `probable-current` | high (day precision) / medium (week/month) |
| 3b | Completed stocking within retention but month outside configured `stockedMonths` | `seasonal-uncertain` + misattribution caution | medium |
| 4 | Aged-out stocking (youngest plausible age > retention) **and current warm water** (freshest temp ≥ cutoff, within freshness window) | `seasonal-likely-absent` | high iff explicit off-season `stockedMonths` AND oldest plausible age > 2× retention AND warmth sustained (`minSustainedWarmObservations` fresh warm readings, default 1); else medium |
| 5 | Aged-out stocking, no current warmth (or warmth only near the cutoff — said explicitly in the reason) | `seasonal-uncertain` | medium |
| 6 | Only a scheduled stocking (upcoming ≤ 45 days) | `seasonal-uncertain` | low |
| 7 | Seasonal/reported species evidence or stocking records but no completed event | `seasonal-uncertain` | low |
| 8 | Trout evidence with `unknown` basis | `unknown` | low |
| 9 | No trout evidence at all | `unknown` | low |

Key invariants (all under test):

- **No fixed-date absence claims.** Month alone never removes trout; only
  current warm water + an aged-out completed stocking yields
  `seasonal-likely-absent`. The absence caution says so explicitly.
- **Schedules < completed reports.** A schedule never asserts presence.
- **CFS alone is never proof of trout presence** (caution on flow-only
  waters; applicability stays `unknown`).
- **Wild/managed year-round evidence outranks supplemental stocking
  history** and is never downgraded by it.
- **Temperature never changes presence for year-round waters** — only
  condition (a hot tailwater stays `confirmed-current` with a thermal-stress
  caution and poor conditions).
- **Date precision grace** (day 0 / week 7 / month 15): presence uses the
  youngest plausible age; decisive absence aging uses the oldest, so the
  nominal-day convention of a week/month-precision record cannot flip the
  branch.
- **Zero CFS is a real reading** (poor conditions, explicit caution), not
  missing data.

## Display metric and fishability banding

| Mode | Applicability | Band source | `displayMetric` |
|---|---|---|---|
| trout | `confirmed-current` / `probable-current` | trout comfort bands | `trout-condition` (or `unassessed` without fresh data) |
| trout | everything else | generic bands | `fishability` (or `unassessed`) |
| all-fish | any | generic bands | `fishability` (or `unassessed`) — **never** `trout-condition` |

- **Trout bands** (`troutConditionBand`): temperature-driven; ideal
  6–20 °C → good; 2–6 / 20–24 °C → fair; <2 / >24 °C → poor; zero/near-zero
  flow → poor; flow-only (no fresh temp) → fair; nothing fresh → unknown.
  Mirrors `packages/contracts` `scoreConditions` temperature semantics.
- **Generic bands** (`generalFishabilityBand`): fresh water presence
  (flow/stage/reservoir) → good; survivable temperature only → fair;
  ≥32 °C caps at fair; ≥35 °C or ≤0 °C → poor; near-zero discharge
  (< 1 cfs) → poor; nothing fresh → unknown.
- `fishability: 'unknown'` appears only when observations existed but none
  were usable (stale); with no observations the field is omitted.
- Stale observations (default: > 14 days) never score and never drive
  conclusions; a stale warm reading gets an explicit caution.

## Visibility and filtering

`visibility` on each decision (trout mode): `not-trout` → exclude;
high-confidence `seasonal-likely-absent` → exclude; `seasonal-uncertain`,
medium-confidence absence, and weak presence → deemphasize; `unknown` →
include if any trout evidence exists, else deemphasize; current presence →
include. All-fish mode never excludes — only empty-evidence waters are
de-emphasized.

`selectVisibleWaters` returns `{ included, deemphasized, excluded, selected }`:

- `included` = the general list: `include` decisions first, then
  `deemphasize` ones (stable order) — **uncertainty stays visible**.
- `excluded` entries carry the named rule
  (`not-trout` | `seasonal-likely-absent-high-confidence` |
  `visibility-exclude`) and the decision's reasons.
- `selected` echoes the decision whose `waterId` matches
  `options.selectedWaterId` **even when excluded** — a selected water
  remains inspectable from the inspector while filtered from the list.

## Configuration (all named, `config.ts`)

`FISHABILITY_CONFIG`: freshness windows (`currentHours: 72`,
`maxUsableDays: 14`), trout temperature bands (6/20/2/24 °C), default warm
cutoff (24 °C), `minSustainedWarmObservations` (1),
`nearWarmCutoffDeltaC` (3), stocking (`defaultRetentionDays: 60`,
`highConfidenceAbsenceRetentionMultiple: 2`, `scheduleUpcomingDays: 45`,
`precisionGraceDays: day 0 / week 7 / month 15`), general survivability
bands (35/32/0 °C, `lowFlowSuspicionCfs: 1`), and filter rule names.
Per-water `seasonalPolicy` overrides the warm cutoff, retention window, and
stocked months; `evaluateWater` `overrides` narrows the corroboration knob.

## Biological assumptions requiring validation

Every threshold marked `[REQUIRES VALIDATION]` in `config.ts` is a working
assumption inherited from `packages/contracts/src/scoreConditions.ts` or
general fisheries common sense. Specifically:

1. **Trout temperature comfort bands** (6–20 ideal; 2–24 marginal; >24
   stressful) — reasonable for TN trout but not validated against TWRA
   research for these specific waters.
2. **Default warm-water cutoff 24 °C** — the single most consequential
   knob: it gates `seasonal-likely-absent`. West TN put-and-take ponds
   likely need a lower per-water cutoff (≈22 °C); East TN tailwaters a
   higher one.
3. **Default retention window 60 days** — how long stocked trout remain
   catchable-present is highly water- and harvest-dependent. Per-water
   `expectedRetentionDays` is the intended mechanism for real values; the
   default must not be read as a biological claim.
4. **High-confidence absence at > 2× retention + explicit off-season** —
   an evidence-strength convention, not biology.
5. **Freshness windows (72 h "current", 14 d usable)** — gauge-data
   conventions, not biology.
6. **Generic survivability bands (32/35/0 °C) and `lowFlowSuspicionCfs`
   (1 cfs)** — coarse warmwater bounds; the low-flow threshold in
   particular is water-size-dependent and a single global value is
   admittedly crude.
7. **Date-precision grace (7/15 days)** — a publishing-convention guess.
8. **Lexical species classification tables** (`TROUT_BARE_SPECIES`,
   `NON_TROUT_SPECIES_MARKERS`) — must be reviewed against the real
   catalog vocabulary (`species: 'trout' | 'warmwater'`, TWRA stocking
   codes) when B08 lands; ambiguous strings are deliberately inert.
9. **Tie-break preferring trout presence** on conflicting year-round
   evidence — a product conservatism decision, not biology.
10. **Data-contract requirement:** the "year-round waters stay eligible"
    guarantee holds only when the authoritative basis
    (`wild-population` / `year-round-managed`) is present in
    `speciesEvidence`. An integrator that feeds only stocking records will
    get seasonal classification even for real tailwaters — upstream data
    (B08 species catalog) must supply the basis.

## Known limitations

- No per-water flow reference ranges in the input → flow quality is not
  assessed (only extremes); extending `FishabilityInput` with an optional
  reference-range field is the natural v2.
- The model month is UTC, not water-local.
- Ambiguous species strings are inert by design (caution surfaced).
- `stockingEvents` have no confidence field; record status
  (`reported-complete` vs `scheduled` vs `unknown`) is the only quality
  signal.

## Verification

- `pnpm --filter @trout/web typecheck` — green.
- `pnpm --filter @trout/web test` — 133 tests green (38 model tests in the
  two lane files; every scenario in the lane brief's required list is
  covered, plus timezone-hemisphere determinism vectors).
- `pnpm --filter @trout/web lint` (domain files) — clean.
- `pnpm --filter @trout/web build` — green, size budget OK.
- Recommendation for CI: run the model tests once under a non-UTC `TZ`
  (e.g. `TZ=Pacific/Auckland`) to make the timezone determinism guarantee
  machine-independent in CI as well; the test vectors are constructed to
  detect regressions on either hemisphere.
