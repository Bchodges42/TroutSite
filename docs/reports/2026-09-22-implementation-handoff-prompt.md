# Paste-ready implementation handoff: evidence-backed Tennessee fishery opportunities

September 22, 2026. This is a prompt for a **separate implementation AI session**. It is not an implementation, approval to merge, or instruction to deploy. Paste the text from **“BEGIN PROMPT” through “END PROMPT”** into that session. The implementation engineer should work on its own clone and branch, then return a pushed, reviewable result to the owner.

---

## BEGIN PROMPT

You are the implementation engineer for **Trout**, the Tennessee, offline-first fishing website in `Bchodges42/TroutSite`. Work independently and thoroughly. The owner wants a visitor to learn whether a mapped water has a **documented year-round trout opportunity**, a **seasonal stocked trout opportunity**, a **warmwater fishing focus**, a combination of these, or **insufficient/conflicting evidence**. The owner has already approved moving toward an evidence-backed method; do the work on a review branch. Do not manufacture certainty to fill all 190 rows. When evidence cannot support a claim, preserve the gap visibly and route a specific question to the owner or data holder in your report.

Your job is both **evidence adjudication and product implementation**. Do not stop after drafting a plan, making a classifier, changing map colors, or processing a sample. Account for the entire 190-water catalog; implement an honest, usable experience; run appropriate tests; document remaining unknowns; push the branch and provide a PR or branch link for review. Do not merge into `main` or deploy production. Do not contact agencies, shop owners, anglers or other people without the owner's explicit instruction. Public read-only research is authorized. Keep the owner updated during long work and save interim findings in Markdown as you go.

### 1. Session discipline and mandatory context

1. Read `AGENTS.md`, `README.md`, `docs/INDEX.md`, `docs/KNOWN-ISSUES.md`, relevant ADRs, `docs/WATERBODY-GEOMETRY-CONTRACT.md`, `docs/DATA-SOURCE-COVERAGE.md`, and the existing map/content architecture **before editing**. Follow `AGENTS.md` exactly: **one session, one new clone, one branch, one push target**; branch from `origin/main`; inspect `git status` and recent commits before edits; do not touch another session's clone; re-read each file before editing; stop and report unattributed foreign changes; use the prescribed commit identity and push meaningful checkpoints. No direct commits to `main`.
2. Fetch the **read-only research branch** `origin/codex/evidence-methods-audit-20260921` and read these point-in-time reports with `git show` or equivalent. **Do not branch from, merge, or cherry-pick the research branch** into your implementation branch; start from current `origin/main` and cite/port conclusions you independently validate:
   - `docs/reports/2026-09-21-evidence-methods-audit.md`
   - `docs/reports/2026-09-22-source-acceptance-and-coverage-audit.md`
   - `docs/reports/2026-09-22-unconventional-source-discovery.md`
   - `docs/reports/2026-09-22-local-observers-and-monitoring-followup.md`
   - `docs/reports/2026-09-22-190-water-classification-feasibility.md`
3. Treat those reports, old research batches, proposed classification files, current YAML, owner overrides, model outputs, and this prompt as **leads or design constraints**, not proof that a particular fishery claim is true today. Reopen decisive primary sources. Record where the old audit is dated or wrong. The date of a web page, upload, extraction or report is not the date of an observation.
4. Before changing product semantics, inspect `docs/KNOWN-ISSUES.md` and avoid duplicating or regressing resolved issues. If an applicable `AGENTS.md` instruction or current owner decision conflicts with a suggestion here, follow the higher-priority instruction and explain the deviation in your final report.

### 2. Inventory and baseline to reproduce

At the research baseline `origin/main` commit `d1e48d1`, there are **190** files under `packages/content/streams/tn/` and **190** selectable features in `apps/web/public/atlas/rivers.geojson`; all 190 IDs matched one-to-one. The GeoJSON has 147 `MultiLineString`, 21 `MultiPolygon`, and 22 `Polygon` features. Recompute this on **your own current `origin/main`**. `README.md` still said “~148 Tennessee waters” at that baseline and is stale. Do not confuse the 147 line geometries with the unrelated figure that 147 catalog rows had Fishbrain candidate pages.

The six earlier habitat-research batch files also contain 190 records. The prior pipeline produced a tentative final display split of **30 year-round / 78 seasonal / 82 no-trout**. This is **not** a verified accuracy or coverage count. The audit reproduced, among other issues, a high-confidence no-trout result from three unchecked strings, a lake inheriting its dam's downstream cold-release evidence, and low-confidence model agreement accepted as corroboration. Existing `species`, `stockingProgram`, `fishery`, `yearRound`, `seasonMonths`, `seasonKind`, `targetSpecies`, and research `trout-calendar` fields have different meanings and at least some contradictory combinations; inspect all consumers before changing them.

Known coverage limits, to **reproduce before quoting**: the existing Fishbrain extracts have candidate mappings for 147/190 catalog rows, with 39 segment-review flags and 43 unmatched; they hold aggregate species/catch totals, **no individual catch dates**. Stored temperature entries appear in 105/190 research records; 85 of those 105 have no entry from 2024 onward, and the stored entry shape loses station/time/depth/statistic. A separate USGS national archive through 2022 has only 20 Tennessee-point IDs with continuous-source rows from 2018 onward, and 14 IDs with at least 60 distinct June–August days in 2021. None of these counts is a classification count. An earlier `docs/DATA-SOURCE-COVERAGE.md` finding of 91 waters with a stocking source applied to a **147-water snapshot**, not automatically 91/190.

### 3. Non-negotiable truth model

Define the headline as **angling opportunity at a stated reach**, not a claim that every trout survives summer or that every part of a lake is thermally suitable. Preserve separate answers to:

- What trout fishery/opportunity is documented, for which species and reach, in which season?
- Is a stocking **scheduled**, **reported completed**, or merely a mapped stocking location?
- Is a wild/reproducing or holdover population actually supported by a fishery assessment, cohort/survey evidence, or other relevant method?
- What warmwater species/fishery is positively documented? A water may have **both** a warmwater focus and seasonal trout stocking.
- What do current conditions say at a **properly matched** site and time? Today's reading is not a permanent class.
- What is unknown, disputed, historical, or geographically ambiguous?

Accept **“unresolved/insufficient evidence” as a first-class result**. “No trout” is a much stronger biological exclusion claim than “warmwater fishing focus”; do not infer it from silence in TWRA tables, no Fishbrain match, one negative survey, high water temperature at a remote station, or a model's confidence. Do not use `warmwater` as a hidden synonym for trout absence. Do not force mutually exclusive facts when warmwater fish and seasonal trout coexist. A reservoir is a **trout fishery**, not a “trout stream.” A single river name can span different opportunities above/below a dam, barrier, confluence, spring refuge or state line.

An explicit, current, reach-specific accountable TWRA assessment **can be enough** to support a year-round angling opportunity; do not impose a new-logger/new-electrofishing requirement on every established fishery. Conversely, government ownership alone is not enough: check observation date, effective period, reach, species, method and contradictions. Dated guide/shop and reviewed community accounts can support precisely attributed observations, especially where agency pages are incomplete; they do not automatically become population surveys or temperature measurements. If an article says monitoring **was planned**, do not turn it into results.

Use evidence statuses such as `documented`, `limited`, `historical`, `conflicting`, and `unresolved`, or an equivalent plain-language set. Avoid scientific-looking confidence percentages without calibration. Distinguish evidence quality from **production reuse rights**. Do not expose unlicensed Fishbrain aggregates/photos or scrape a runtime third-party service into the app just because public pages can be read for research. iNaturalist/GBIF may duplicate the same observation; track underlying observer/dataset lineage.

### 4. Perform a full 190-water evidence adjudication before sweeping label changes

Create and maintain a **machine-readable, reviewable per-water adjudication ledger** plus a concise human-readable summary under an appropriate new dated report. Every canonical catalog ID must appear exactly once in the top-level inventory; source claims may be multiple per water/reach. Do not collapse disagreements into one score. For each row or claim, record enough to reproduce the conclusion:

- canonical ID, waterbody type, county/HUC/GNIS where applicable, current mapped geometry ID, exact relevant reach/arm/boundaries, and any geometry/identity issue;
- candidate year-round trout opportunity, seasonal trout opportunity/window, warmwater focus, and explicit unresolved or mixed state as separate concepts;
- every decisive source's URL or stable identifier, original publisher/observer/dataset, method (forecast, electrofishing, stocking event, temperature logger, field grab, guide observation, specimen, etc.), observation/sample period, publication date, retrieval date, and, when possible, a pinpoint page/table/record/quote;
- source geographic fit and reason for applying or rejecting it; independent provenance versus repost/index; data quality/effort/detection caveats;
- contradiction, staleness/change event, user-facing qualification, unresolved claim, and the exact next source or owner/data-holder question.

Resolve **all 190 inventory rows** in the ledger, even if the honest result is unresolved. Report counts of documented, limited, conflicting, historical-only, and unresolved by claim and waterbody type. Do not present the number of file rows as the number of verified verdicts. Verify primary sources yourself where feasible; create a reproducible capture or source log with fetch time/hash for critical pages/files, but keep giant raw datasets and unnecessary copies out of the app/offline bundle. Do not commit credentials or personally identifying information. Use bounded, targeted research rather than endlessly repeating water-name searches. Ask for owner input only when a policy/rights decision truly blocks you; otherwise proceed with safe unresolved handling and record the question.

Prioritize the most decisive material:

1. Live [TWRA trout page, program and stocking tables](https://www.tn.gov/twra/fishing/trout-information-stockings.html), its responsible-source completed-release report, applicable current regulations, and the [TWRA trout forecast](https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747) including underlying item data. A scheduled release is not a completed release; the recent-release feed is a rolling window, not a full annual history. Public stocking GIS points are **locations**, not release events or full stocked reach geometry.
2. Reach-specific TWRA/land-manager plans and surveys, TDEC/EPA [use-classification PDF](https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf) for legal reach boundaries (TS/NRTS is not a fish census), and actual dated fish assemblage/IBI records from TVA, TDEC, NPS, ORNL/DOE, universities, collections and conservation partners where they fit. TVA says it samples a broad stream network, but the full station/species/effort export was **not acquired** in the audit. Do not count it as data in hand. Record narrowly scoped data-holder requests rather than inventing rows.
3. USGS/NWIS and WQP observations for **targeted physical context**, properly joined to a reach; preserve station, time, depth, statistic, unit, coverage, provisional flags, and operating regime. Summer oxygen matters in tailwaters/reservoirs. The national 1894–2022 compilation is historical/index data, not a current statewide trout classifier.
4. Dated, first-hand local guide/shop, personal journal, iNaturalist and other community observations where identity and locality are defensible. Current Fishbrain aggregate species counts are leads only; dates, coordinates, observer evidence and production rights are missing in the existing extract. Avoid copying images or report text beyond permitted quotation.

### 5. Implement the smallest honest data and product model that serves all 190

After the adjudication establishes what can be said, implement a deterministic, offline-compatible representation of **documented opportunity with explicit unknowns**. Fit it to the existing architecture rather than building a parallel hidden classifier. Inspect `packages/contracts/src/schemas/stream.ts`, content validation/build, the snapshot and bundled content flows, `apps/web/src/features/map/waterDecision.ts`, `fisheryType.ts`, the map/legend/drawer/detail/list/SEO surfaces, and the existing `trout-calendar.json` semantics. Use an ADR and compatible, additive contract changes if shared schema needs to change. Keep static snapshot read paths and the privacy/offline guarantees: no browser-time third-party data dependency, accounts, tracking or remote AI classification.

The data model must let a single water express **year-round trout opportunity, seasonal stocked opportunity, warmwater focus, and unknown or disputed extent** without pretending these are mutually exclusive biological classes. It must carry claim-specific source references and dates/periods and support reach-level scope. Design the exact schema yourself, but expose enough structure for validation and for a visitor to see why the headline applies. Make dynamic stocking events and current conditions **separate** from the durable fishery headline. If a mapped feature covers more than one fishery reach, either accurately constrain the highlight/text to supported subreaches or present the whole feature as mixed/partially assessed; never paint a whole river as year-round trout based on a short tailwater. Follow `docs/WATERBODY-GEOMETRY-CONTRACT.md`; do not hand-edit generated snapshots or silently change canonical IDs.

Pay particular attention to existing implementation hazards:

- `waterDecision.ts` currently has a generic November–March fallback for `yearRound:false`; that is not a sourced season for every water. Out-of-season wording must not state **“there are no fish”** unless that is actually known. Stocking months, regulatory season, likely angling window, biological occupancy, and a current release must remain distinct.
- At the audited baseline, `boone-tailwater.yaml` has `yearRound:true` **and** `seasonMonths: [12,3,4]`; verify current state and fix the contradiction according to the primary fishery assessment, without pretending schedule disagreement vanished.
- `species: warmwater`, `stockingProgram:false`, and `fisheryType() => other` currently drive some map copy and scoring. Audit every consumer so an unverified or mixed water does not read as “no trout,” and a seasonal stocked warmwater water can display both facts.
- Some `speciesEvidence` entries cite a monitoring-location page for a species claim. Recheck whether the cited page actually supports each species; a URL's existence is not claim verification.
- Unknown waters must remain discoverable on the map and in search, with honest neutral styling and copy. The app must not show a trout fishability score or trout heat-stress warning on an unsupported warmwater/unverified water. Do not let a fresh fetch time make an old observation fresh.
- Preserve existing per-species fishability work and other resolved `KNOWN-ISSUES` behavior. The new opportunity taxonomy is not a replacement for the live conditions model.

For visitors, show a concise water/reach headline, the **kind of evidence and its observation year**, any summer or extent caveat, a separate stocking section with scheduled versus completed status, and a link to primary source(s). Use explicit `Unverified`/`Mixed`/`Limited` wording where appropriate. The map legend, filters, drawing styles, drawer, detail page, browse/search and SEO copy must agree; assess mobile, keyboard/screen-reader, contrast, color blindness and offline behavior. Keep payload/build size within existing budgets. Do not promise fish are catchable on a particular day because a page says year-round.

### 6. Hard cases that must be individually resolved or explicitly abstained from

Use these as regression fixtures and evidence-review cases; do **not** copy the audit's conclusion without reopening the underlying source and matching the current catalog reach:

| Case | Failure mode to prevent |
| --- | --- |
| Boone **tailwater** versus Boone **Lake** | TWRA explicitly describes the tailwater as year-round with holdover and 2026 sampling; published stocking months disagree. Lake arms have separate species/extent questions. Never borrow one water's evidence for the other. |
| Watauga, Parksville and other managed reservoirs | TWRA's year-round reservoir opportunity is real, but lake depth/arm and tailwater conditions differ; no blanket bank-fishing claim. |
| Center Hill Lake versus Caney Fork tailwater | Dam bottom-release evidence applies downstream, not automatically to the reservoir. |
| Normandy/Duck tailwater | TWRA describes roughly eight suitable months; stocking calendars conflict. Distinguish opportunity window from release month and occasional out-of-window catch. |
| Cherokee and Hiwassee tailwaters | TWRA says **limited** year-round; retain the summer constraint/refuge caveat in the headline/detail. |
| Tims Ford/Elk | TWRA's year-round reach is the first approximately 11 miles; do not paint the entire Elk or apply a Fayetteville gauge to that upper reach. |
| Little River and Buffalo Creek | TDEC TS/NRTS designations have **specific river-mile/spring boundaries**; do not promote a legal designation to present trout abundance. |
| Whiteoak/White Oak, Wolf River, Buffalo Creek and other repeated names | County/drainage/dam side and source page must match; reject a convenient wrong-name join. Shared Fishbrain pages require segment review. |
| Trail Fork of Big Creek | TU reports 2021 rainbow removal above a waterfall, brook trout transfer, bridge replacement and volunteer temperature monitoring. A 2025 TWRA slide **plans** a survey; acquired sources do not give its result. No unsupported 2026 persistence claim. |
| Obed/clear creeks and other purported “no-trout” waters | Positive warmwater evidence may justify a warmwater focus; negative lists or no catch report do not prove absence. |
| Winter ponds and mixed stocked rivers | Seasonally stocked trout can coexist with bass/panfish. July map copy must not state trout certainly vanished merely because the winter program ended. |

### 7. Validation and release standard

Create meaningful automated checks for: exactly one top-level ledger row per current catalog ID; geometry/catalog IDs matching; citation presence and **claim-specific provenance** for every published positive headline; valid date/period distinctions; no automatic negative from missing records; no category inheritance across lake/tailwater or same-name creeks; no contradictory `yearRound`/season representation; separated scheduled/completed stocking; and consistent map/drawer/detail/list/SEO/offline output. Verify critical source URLs and their actual supporting passages during research; keep routine unit tests deterministic rather than dependent on live websites. Use captured fixtures for specific primary-source structures and a few difficult waters. Tests should exercise behavior and failure modes, not mirror an implementation function. Validate unknown, mixed, historical and conflicting cases, not only happy-path trout waters.

Run the repo's relevant content validation, typecheck/lint, tests, builds, map/identity checks and selected mobile/offline E2E checks (`pnpm` scripts in `README.md` and root `package.json`; adapt to current branch). If a full suite is too expensive or blocked by environment, report exactly what ran and what did not, with failures and why. Inspect the resulting app visually on desktop and phone-sized viewport, including an unverified water, a mixed seasonal water, a limited year-round tailwater and a reservoir. Do not silently weaken build/size/coverage gates. Check for stale source URLs, unsafe copy, accessibility regressions and accidental third-party requests.

Write a final dated implementation report with:

- current branch/base commit, commits pushed, PR/branch URL, files and architecture changed;
- the reproducible **190-water ledger counts** and a link to its machine-readable source;
- documented examples, contested examples, unresolved waters, and exactly what evidence each still needs;
- source acquisition status and reuse-rights constraints, including Fishbrain and any unpublished TVA/TWRA records;
- validation commands/results, visual/offline checks, and material limitations;
- any bounded owner decision or source-holder request that remains. Never replace a missing result with a polished-sounding guess.

Commit and push each meaningful checkpoint to your own branch. If you can create a draft PR, do so and leave it unmerged for owner review; otherwise provide the pushed branch URL and exact commit. The owner will bring your result back for an independent review and next decisions. Complete the authorized work without stopping for routine implementation choices. If a true source or policy gap cannot be resolved, implement an honest unresolved state and continue all independent work.

## END PROMPT
