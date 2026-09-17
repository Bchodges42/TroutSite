# Independent review — Jev water classification (2026-09-17)

Branch: `codex/review-jev-classification-20260917`

Scope: the Jev question design, evidence state, Fishbrain/TWRA/composite data,
evaluation integrity, September 190-water live run, and the secondary hourly
fishability scorer. No catalog YAML or production data was changed.

## Verdict

The classifier is useful as a triage assistant, but the committed evaluation was
not a valid measure of independent classification quality. The composite fed prior
Jev conclusions back into the next Jev state through more than the explicitly named
`jev` column, the prompt contained two incompatible definitions of “year round,” and
the evaluation labeled counts over all 190 effective results as held-out results.

Those defects are fixed on this branch. The corrected run is less flattering and
more credible: 190/190 calls succeeded, but raw accuracy on the eight reviewed waters
is 5/8. All three misses are reviewed tailwaters for which the supplied state does not
contain strong exact-segment evidence of year-round survival after circular signals
are removed. The post-call reviewed-label override still yields 8/8 effective results,
as it must by construction; that number is not model accuracy.

Do not promote raw Jev output to an automatic catalog write. Keep reviewed overrides,
expand blinded ground truth, and add a first-class habitat-survival evidence layer.

## Findings, ranked by user impact

### 1. Critical — prior model answers leaked into model state

`CLASSIFICATION-COMPOSITE-2026-09-17.json` documents that:

- `recommendedClass` for unstocked waters resolves through the prior Jev identity;
- composite `confidence` is downgraded when Jev conflicts with program evidence;
- composite `flags` include prior Jev categories and consistency messages.

The state builder excluded only the literal `jev` object, then passed
`recommendedClass`, `confidence`, and every flag. Eleven waters had an explicit
Jev-derived flag, and the recommendation/confidence fields were model-influenced more
broadly. This is the same answer-recycling failure the hard rule intended to prevent.

Applied fix: the model state now whitelists only direct schedule/feed/warmwater source
facts plus their source-derived program union. `recommendedClass`, `confidence`,
`flags`, `catalog`, and `jev` from the composite are excluded. A test checks every
catalog water for these fields and for the three stable category keys.

### 2. High — the question gave incompatible definitions of year-round

The criteria correctly said trout must survive the whole year. A category instruction
then said year-round was a standing designation “not a promise” of trout in every
month and told the model to keep seasonal stocking windows out of the category. The
schedule source description also treated `Seasonal` as managed trout water and
`Tailwater` as year-round, even though those are program labels, not survival facts.

This made the result depend on which sentence Jev followed. It also caused a large
swing when the composite was added: pre-composite output had 56 year-round waters;
the committed output had 23.

Applied fix: the category question now resolves two explicit facts:

1. `A`: trout remain in the exact segment through the whole year;
2. `B`: a recurring trout stocking program exists.

The mapping is explicit: `A=true` → year-round; `A=false, B=true` → seasonal/winter;
`A=false, B=false` → no trout. Program names and stocking cadence cannot settle `A`.
Separate NouL questions now expose Jev's answer for each axis.

### 3. High — the evidence is rich in stocking facts but thin in survival facts

The fixed category is a habitat-survival classification, but the strongest structured
inputs are stocking schedules, program classes, catalog claims, and catch aggregates.
The optional `species-occurrences.json` file is absent in this checkout. Forty-two of
190 waters lack the audited ledger; 43 Fishbrain records are `not-found`; broad-page or
segment concerns remain common. There is no consistent per-water field for summer
temperature, cold-release provenance, documented holdover, spawning/recruitment, or
exact-segment biological survey.

The result is predictable: once circular “yearRound” hints are demoted, Jev often
interprets a short stocking window as seasonal even when the owner has reviewed the
water as a cold tailwater. That is an evidence deficit, not a reason to leak the label
back into the prompt.

Recommendation: add a sourced `habitatSurvival` record per water with exact reach,
summer temperature evidence, release depth/temperature where relevant, wild or
self-sustaining evidence, holdover evidence, observation period, source URL, and
confidence. “Unknown” must remain distinct from “does not survive.”

### 4. High — future ground-truth collection is visually biased

The review page prefills each decision with Jev's raw answer and shows the composite
recommendation, Jev confidence, Fishbrain counts, and catalog claims before the owner
chooses. That is appropriate for adjudication but not for creating an independent
test set. Labels made this way are calibration decisions, not blinded ground truth.

Recommendation: add a blind-label mode that shows direct evidence but hides Jev's
answer, probabilities, composite recommendation, and current catalog classification
until the owner commits a label. Use a separate adjudication pass for disagreements.

### 5. High — the month question treated missing evidence as absence

The old NouL false criterion said a month was false when evidence was absent or
insufficient, and the question asked about “catchable” trout even though the stored
fact is presence. This systematically pushed sparse waters toward false and mixed an
angler-outcome concept into a biological presence field.

Applied fix: all month questions now ask presence, not catchability. False requires
positive absence/window evidence; unresolved evidence should remain near 0.5. All 12
probabilities are now retained in the evaluation artifact instead of being collapsed
to only a count.

Important interpretation: a probability near 0.5 is unknown, not present. The report
therefore tracks both `monthsTrue` (at least 0.5, retained for continuity) and strong
presence/absence at 0.67/0.33. Consistency flags use strong evidence.

### 6. Medium — evaluation accounting overstated what was held out

The old `heldOut.categoryCounts` actually counted all 190 effective categories,
including the eight reviewed waters and their overrides. The roster was also sourced
from Fishbrain records, which would silently omit a future catalog water lacking a
Fishbrain row.

Applied fix: the catalog is the roster authority; Fishbrain is optional evidence.
All-water raw, all-water effective, and 182-water held-out raw counts are reported
separately. The artifact now records a state schema, question-definition hash,
requested model, and actual response model.

### 7. Medium — the benchmark is too small and effective accuracy is tautological

Eight reviewed waters cannot support a general accuracy claim. They cover four
year-round tailwaters, two seasonal reservoirs, and two no-trout reservoirs, with no
stratification across the many creek/river ambiguity patterns. Effective accuracy is
always 100% because the code replaces the raw answer with the reviewed label.

Recommendation: build a blinded, stratified set of at least 30–50 waters spanning all
three categories, waterbody types, evidence gaps, sibling lake/tailwater pairs, and
segment disputes. Report per-class precision/recall, abstention/review rate, calibration
of choice probabilities, month Brier score, and repeated-run stability. Never headline
effective accuracy.

### 8. Medium — documented validation commands do not exist

The handoff asks for `validate-known-answers.mjs`; that file is absent. `judge.mjs`
also refers to `validate-jev.mjs`, which is absent. The deterministic seam may still
be sound, but the claimed known-answer gate cannot be reproduced from this branch.

Recommendation: restore the versioned corpus and one canonical command, or remove the
claims until the suite exists. CI should execute it.

### 9. Medium — schedule and source semantics need sharper boundaries

- `parseMonthLetters('A')` resolves to April even though a bare `A` is ambiguous
  between April and August. The current Dale Hollow row may indeed mean April, but
  the generic parser should not pretend the token is unambiguous.
- Schedule program names describe management activity. They are authoritative for
  program/timing facts, not for warm-season survival.
- The composite mixes direct program reconciliation, catalog comparison, and prior
  model cross-checking in one artifact. Human review can use the whole document, but
  machine state must continue using a strict direct-source projection.

Recommendation: preserve ambiguous month tokens or resolve them from a cited source
cell/date, and split the composite into `directProgramEvidence` and `analysis` objects.

### 10. High (secondary job) — hourly fishability can publish misleading scores

`infra/jev-fishability.mjs` is not ready to be a user-facing authority:

- it says it targets waters with live gauge coverage but iterates every stream, even
  when that stream has no condition snapshot/readings;
- it labels a null fallback score with the `0-10 / skip-it` band;
- it passes metric values without their observation timestamps, so stale temperature
  or flow can look current;
- it prefers `stream.species` over the calendar classification and applies a
  trout-specific scoring question to all targets;
- its stocking matcher accepts the first exact normalized name and does not use county,
  creating sibling/same-name attachment risk;
- `flowTrend` treats a previous value of zero as missing.

Recommendation: keep this output advisory/non-consumed until it filters to fresh
assessed condition snapshots, carries per-metric timestamps, emits null band/word for
null scores, uses the reviewed category/month applicability layer, and reuses the
county-aware canonical stocking resolver.

## Applied criteria and state changes

The exact criteria are in
`packages/content/scripts/classification/jev-classify.mjs`. In summary:

- **Year Round - Trout Stream (tailwaters, wild trout waters):** direct evidence
  supports trout persisting through every season in the exact segment. Stocking can
  strengthen the case but its schedule does not prove survival.
- **Warm Water - Seasonal/Winter Stocking Program:** a recurring trout program is
  supported, but year-round persistence is not. Some holdover beyond a stocking date
  is allowed; `Seasonal`/`Spring` labels alone do not prove warm habitat.
- **Warm Water - No Trout:** neither a recurring trout program nor year-round presence
  is supported. Incidental trout species do not automatically change fishery identity,
  and missing Fishbrain data is not negative evidence.

The state now distinguishes authored catalog claims from documented evidence and
labels the audited ledger's class as an analyst `researchVerdict`. The composite state
contains only direct source signals. The runner stores decision axes, all 12 month
probabilities, strong month counts, and cross-question consistency flags.

## Live run: before and after

Both rows use September and 190 waters. “Before reviewed” below is recalculated against
the current eight-label file because the committed JSON embedded two now-stale label
values.

| Metric | Committed run | Reviewed run |
|---|---:|---:|
| Evaluated / errors | 190 / 0 | 190 / 0 |
| Raw year-round | 23 | 13 |
| Raw seasonal/winter | 86 | 93 |
| Raw no-trout | 81 | 84 |
| Reviewed raw matches (current labels) | 8/8 | 5/8 |
| Effective matches after overrides | 8/8 | 8/8 |
| Confidence at least 0.8 | 161 | 160 |
| Held-out count reported correctly | no (counted 190 effective) | yes (182 raw) |
| Individual month probabilities retained | no | yes |

Twelve raw categories changed: Boone Tailwater, Citico Creek, Duck River Tailwater,
East Fork Stones River, Little River, Parksville Lake, Parksville Tailwater, Roaring
Fork, South Fork Cumberland, Tellico River, Trail Fork/Big Creek, and West Prong Little
Pigeon. These are decision boxes, not approved catalog changes.

The lower reviewed score should not be “fixed” by restoring contaminated fields. The
old 8/8 was partly the product of circular state and leading system-identity wording.
The three current reviewed misses are Boone, Duck, and Parksville tailwaters. Their
overrides keep production-effective output correct while their evidence deficits are
addressed.

Repeatability check: two identical full calls 32 seconds apart changed zero category
choices, but maximum per-water confidence drift was 0.28 and maximum decision-axis
drift was 0.08. Pin a model version if TypeSafe supports it and run repeated trials for
formal evaluation. The final artifact requested `jev-latest` and received
`jev-1.13.0`; question hash is `dd3dae4d106426b1`.

## Owner questions

### Fort Patrick Henry Lake

Current result: seasonal/winter, confidence 0.88; year-round-presence axis 0.27;
recurring-program axis 0.73. All 12 month values exceed or equal 0.5, but only one is
strongly positive; the rest are uncertainty clustered near 0.5. The old “12/12” was
therefore partly a threshold artifact, not twelve strong presence conclusions.

The ledger does contain a valuable agency phrase: the stocked reservoir program is
intended to provide “year-round trout fishing opportunities.” What is still missing is
whether this satisfies the owner's habitat-survival test rather than merely continuous
management. Treat this as genuinely ambiguous. Add reservoir summer temperature/
oxygen-refuge and holdover evidence before promoting it to year-round.

### Doe River and Buffalo Creek (Grainger)

Both seasonal/winter categories are well supported by the audited ledger and recurring
program evidence. Doe: confidence 0.98, year-round axis 0.19, eight months at least 0.5
but five strong. Buffalo: confidence 0.97, year-round axis 0.19, ten months at least
0.5 but only four strong. The category is not the main problem; fuzzy month inference
is. Prefer schedule-backed months plus an explicit, sourced holdover rule.

### Middle Prong Little Pigeon

Current result: seasonal/winter, confidence 0.56; year-round axis 0.31. This is both a
segment-identity and evidence problem. The catalog note asserts wild rainbow/brook
trout; the ledger has park-wide trout occurrence, tributary restoration history, and
main-stem smallmouth captures, but no exact-stream trout survey. The stocking program
is exact and therefore dominates. Split upper park trout water from warmer lower
reaches or obtain exact-reach survey/temperature evidence; do not tune the question to
force the desired label.

### Tellico River

Current result: seasonal/winter, confidence 0.55; all 12 month answers are strongly
positive (0.71–0.83), so the new consistency guard flags it. This is still ambiguous
under the owner's habitat test: year-round presence maintained by an 11-month stocking
program is not automatically year-round survival. The main-stem ledger explicitly says
the wild designations attach to tributaries, not the Tellico main stem. Add main-stem
summer survival/holdover evidence. Until then, keep the flag; do not silently coerce
either the category or months.

### Wilbur Lake

Current result: seasonal/winter, confidence 0.85; year-round axis 0.16; five strong
months (March–July) and four strongly absent months. The water is physically a small
regulating reservoir between dams, but the direct program evidence is March–July and
no exact holdover evidence is supplied. Seasonal/winter is the more defensible current
answer. Summer/fall temperature and holdover data could reverse it.

### South Fork Cumberland

Current result: no-trout, confidence 0.65; year-round axis 0.24; program axis 0.08;
evidence quality is low. The park-wide checklist contains trout, but it does not prove
the exact river segment or a trout fishery; no program and no current temperature
record were found. The twelve month values are all weak/uncertain, not strongly
positive. Keep this as a manual research box and do not restore the old wild claim
without exact-segment evidence.

### Red River at Clarksville

Current result: seasonal/winter, confidence 0.78; year-round axis 0.07; December–
February are the only likely months. The live feed's Red River / Montgomery / Billy
Dunlop Park row is newer positive evidence than the ledger's earlier “none found.”
However the recurring-program axis is only 0.42 because one feed location does not by
itself establish recurrence. Resolve the access point to the exact catalog reach and
confirm it in a recurring schedule before treating the category as settled.

## Questions only the owner can answer

1. Can a water be in the seasonal/winter category while trout are present all 12
   months because of near-continuous stocking, or must 12-month presence always force
   year-round? The current habitat-survival definition permits the former; the phrase
   “must stay consistent” may imply the latter.
2. Does TWRA's “year-round trout fishing opportunities” language for a stocked
   reservoir count as sufficient year-round-presence evidence, or is direct holdover/
   habitat evidence required?
3. Should the three reviewed tailwater labels remain immutable calibration truth when
   the state lacks direct survival evidence, or should they be accompanied by owner-
   supplied evidence notes that explain the ruling without revealing the label?

## Verification

- `pnpm --filter @trout/content test` — 42/42 passed.
- `validate-jev-classification.mjs --dry-run` — 190 targets; no owner-label or prior-
  model composite leak detected.
- Full live run — 190/190 evaluated, zero errors.
- Review HTML rebuilt and verified — all payload checks passed.
- `node --test infra/jev-fishability.test.mjs` — 4/4 passed (these tests do not cover
  the secondary-job risks listed above).

## Handoff

Changed: leak-free composite projection, two-axis category question, presence-based
month questions, stronger consistency reporting, complete catalog roster, correct
held-out accounting, reproducibility metadata, retained month probabilities, tests,
fresh eval JSON, and rebuilt review page.

Not changed: catalog YAML, reviewed labels, source datasets, schedule aliases, and the
secondary fishability scorer. Recommended next work is blinded label expansion plus
exact-segment habitat-survival evidence, followed by a repeated-run evaluation.
