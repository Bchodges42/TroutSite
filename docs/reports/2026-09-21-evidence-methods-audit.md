# Tennessee trout classification: evidence and methods audit

Started and completed 2026-09-21 (America/Chicago; source captures extend into 2026-09-22 UTC). Scope: audit prior research and propose alternative methods; no implementation, deployment, or final water classifications performed. Checkpoints preserve findings as they were established; the synthesis below is the audit conclusion.

## Executive finding

**The bottleneck is not simply missing data. The current method loses evidence, conflates different questions, and forces unknowns into overly definite labels.** More searches or another classifier pass will not fix those problems by themselves.

There is useful work to retain: 190 structured records, source leads, reach descriptions, county-aware aliases, real temperature pulls, conflict notes, and a separation between long-term fishery information and today's conditions. But the present three-label output is not ready to be treated as a verified truth set. Reproduced counterexamples include a documented year-round tailwater labeled seasonal, a reservoir inheriting its downstream tailwater's cold-release evidence, and an unresolved lake labeled high-confidence no-trout.

**Recommended direction for the later planning discussion:** a documented fishery map organized by reach, with a simple trout-opportunity headline, an explicit unresolved state, a separate stocking calendar, and a separate current-conditions warning. Use direct, dated evidence to support the headline; use models to find omissions and conflicts, not to turn missing evidence into biological certainty. Government authorship is one provenance attribute, never a substitute for recency, scope, and methods.

## Audit trail and checkpoints

### Checkpoint 1 — orientation

- Read the owner-provided `EVIDENCE-METHODS-AUDIT-BRIEF.md` dated 2026-09-18. Treat its claims as leads, not established facts.
- Read repository `README.md`, `docs/INDEX.md`, `docs/KNOWN-ISSUES.md`, and `AGENTS.md`.
- Created a separate clone and branch `codex/evidence-methods-audit-20260921` from `origin/main` at `d1e48d1`. The existing `C:/Users/Benjamin/Projects/trout` checkout has an untracked `plugins/` directory and was left untouched.
- Remote research branches exist for all six habitat batches and the classifier. The supplied brief is not an exhaustive description of the latest repository; compare actual branch contents and preserve commit identifiers.
- Preliminary hypotheses to test: (1) evidence absence becomes an unsupported negative; (2) stocking, habitat, fish presence, and regulations are conflated; (3) reach identity is more limiting than search volume; (4) agreement between classifiers is being mistaken for independent evidence; (5) agency GIS and surveys may offer better coverage than repeated name-based web searches.

## Evidence standard for this audit

Distinguish reproduced repository behavior, primary-source statements read in full context, inference, and unresolved questions. Record source URLs, dates, spatial scope, and limits. A stocking schedule does not by itself establish a release, summer survival, wild reproduction, legal access, or absence of trout elsewhere. An owner product decision does not supply biological evidence. Unknown remains unknown.

### Checkpoint 2 — reproduced classifier behavior and first primary sources

Research snapshot: `origin/evidence/habitat-batch6` at `27acc5b`. Extracted the branch's scripts and JSON into a separate research directory and ran the unchanged pure classifier locally, without calling Jev or reading credentials. All six files contain 190 distinct water records (13 + 24 + 35 + 35 + 37 + 46). Code-only output: **29 year-round / 76 seasonal / 85 no-trout**, with 95 high gates and 95 escalations. These are not the brief's final combined/override counts and must not be compared as if they were the same stage.

Confirmed defects in `packages/content/scripts/classification/code-classify.mjs` at that revision:

1. **Three unchecked source strings can turn unknown into high-confidence no-trout.** Reproduced `classify({evidenceRecord:{sourcesChecked:['a','b','c']}})` -> `warmwater-no-trout`, high gate, no escalation. The reason paradoxically still says it is defaulting at low confidence. The gate counts entries; it does not inspect their meaning, independence, relevance, dates, or source tier. Across actual records, 69 no-trout verdicts bypass escalation with a high gate. This does not prove those 69 are wrong; it proves the gate cannot certify them.
2. **Positive booleans and dam type outrank evidence without checking it.** `wildPopulation.documented:true` alone produces high-gate year-round, even without a citation. A bottom-draw field plus March stocking produces high-gate year-round even when a July 30 C observation is provided. Temperature, source age, oxygen, and spatial applicability are not evaluated by the classifier.
3. **Actual lake/tailwater category error:** `center-hill-lake` becomes year-round because the record puts the dam's bottom discharge in `coldSource.damTailwater`. Its prose explicitly explains that this supplies the *tailwater*, not a demonstrated lake trout fishery. `watauga-lake` becomes seasonal despite its record quoting TWRA's explicit year-round reservoir program. `boone-lake` becomes high-gate no-trout despite the record itself calling persistence unknown.
4. **Agreement accepts even zero-confidence model output.** Reproduced `resolveEscalation({decision:'jev-rated',choice:'warmwater-no-trout',choiceConfidence:0,evidenceStrength:0},'warmwater-no-trout')` -> accept. Stored ratings contain 95 results, 88 accepts and 7 owner boxes; `south-fork-cumberland` is accepted at model confidence 0.24. The brief's assurance that all low-confidence decisions require owner action is not implemented by this function. This is an advisory research pipeline, not a claim that these labels were deployed.
5. **The escalation text loses decisive evidence.** `composeJevState` includes some record fields but omits `coldSource.notes`, `overallSurvivalRead`, and `sourcesChecked`. For Watauga, the direct summer-habitat statement and explicit year-round quote live in those omitted fields. Avoiding leakage is worthwhile, but it must preserve source facts separately from previous conclusions.

Primary sources retrieved in this checkpoint (2026-09-21 local / 2026-09-22 UTC):

- [TWRA trout information and stocking](https://www.tn.gov/twra/fishing/trout-information-stockings.html), HTTP 200. Its reservoir section explicitly says: "TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities." Lists Dale Hollow, Parksville, Calderwood, Chilhowee, Fort Patrick Henry, South Holston, Tellico (Upper), Watauga. Schedule warning explicitly permits cancellation or postponement; a schedule is not a completed release. Its stocking report was updated 9/21/2026.
- [TWRA Watauga Reservoir](https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/watauga-reservoir.html), HTTP 200. Lake trout selected for "cold, well-oxygenated, habitat"; summer fishing guidance is at 90-120 ft. This is direct evidence of a managed summer trout opportunity, without needing to infer it from surface temperature or monthly stocking frequency.
- [TWRA Trout Management Plan 2017-2027](https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf), 2,757,977 bytes, downloaded and extracted. Printed p. 10/PDF p. 14 explains that reservoir fisheries need cold, oxygenated water and are stocked in winter. Printed p. 5/PDF p. 9 explicitly says some streams with wild trout are also stocked. Thus stocking and wild populations are not mutually exclusive. This is historical management evidence, not a 2026 population survey.
- [TWRA Trout Fishing Forecasts](https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747), linked directly by the official TWRA trout page. Read full [public item data](https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json), not snippets. Item owner `Region5Fisheries`, organization `PWXNAH2YKmZY7lBq`; capture includes 2026 sampling reports and explicitly distinguishes stocking months from year-round fishing.

**High-value discovery:** the official forecast calls Boone Tailwater "Tennessee's smallest year round trout fishing tailwater," documents holdover rainbow trout and large browns, and includes March 2026 electrofishing results. This directly addresses the supposedly unresolved *tailwater* ticket. It does **not** settle Boone Lake. It also calls Normandy suitable for trout only eight months of the year, labels Cherokee and Hiwassee "limited year-round fishing," and describes trout "24-7-365" in the first 11 miles below Tims Ford. Reach and species qualifications must be retained.

These findings are saved before proceeding to source inventory, spatial methods, and product alternatives. Local raw responses and reproduction output: `C:/Users/Benjamin/Projects/trout-evidence-audit-materials-20260921/` (not product files).

### Checkpoint 3 — freshness, independent source shapes, and limits

Owner clarification during the audit: government pages can be outdated or incomplete; current TWRA information is useful, but government authorship alone must not settle a claim. This audit agrees and treats publication/refresh date, observation date, effective date, and retrieval date as separate facts.

**Reproduced final-review counts:** applying the five labels in `habitat-review-labels.json` and the stored accept decisions using `final-review.mjs` precedence produces **30 year-round / 78 seasonal / 82 no-trout**, exactly as the brief says. These totals include unresolved owner boxes displaying the code's tentative answer. They are not 190 settled decisions. The final review still displays Boone tailwater and Parksville Lake as seasonal, Boone Lake as no-trout, Watauga Lake as seasonal pending review, and Center Hill Lake as year-round pending review. No live Jev call was made; model accuracy or stability is not established by this reproduction.

**Source conflicts reproduced against live responses:**

| Water | Live schedule JSON | TWRA prose/forecast | What is actually established |
|---|---|---|---|
| Boone tailwater | Mar, Apr, Nov, Dec; rainbow/brown | Main page: Mar, Apr, Dec; forecast: Mar, Apr, Jun, Dec and explicit year-round fishing | The publication surfaces disagree about schedule; the forecast supplies direct year-round/holdover evidence that the prior record missed. Do not silently select a stocking calendar. |
| Normandy tailwater | Jan, Feb, Mar, Nov, Dec | Main page: November-June; forecast: suitable for trout eight months, not a year-round habitat claim | Treat stocking dates, expected fishing window, and thermal persistence separately. |
| Watauga Reservoir | No reservoir row; only Wilbur tailwater/Watauga River | Reservoir list says year-round; Watauga page describes summer lake trout fishing | Schedule omission is not evidence of no program or no summer fishery. |
| Dale Hollow Reservoir | April Brown Trout row | Reservoir list says Rainbow | Preserve species conflict. Do not “resolve” through model confidence. |
| Whiteoak/White Oak Creek, Houston | Three February-March weekly entries | GIS point says Spring program; county and water class match | An alias plus county join can recover the program. A point does not define the full stocked reach. |

The current [schedule endpoint](https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json) returned 616 rows. The [recent-release endpoint](https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json) returned only 10 rows, dated August-September 2026. TWRA describes this as a recently-stocked list; it is not a complete annual event history. Its absence of a water cannot establish that the water was never stocked. The new public [stocking GIS service](https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0?f=pjson) contains 730 *location records*, with no stocking-event date field in its published schema. Those are not 730 releases. `NumStocked` is null in the Houston examples; do not use it as volume evidence without a defined time period.

**Temperature evidence:** 105/190 habitat records contain temperature entries. Of those 105, 31 have no entry from 2000 onward, 70 none from 2010 onward, 77 none from 2020 onward, and 85 none from 2024 onward. These are counts of the research records, not claims about all available source measurements. Every one of the 447 stored entries has only `celsius`, month, year, source type, and URL: no observation day/time, station ID field, depth, statistic, sample count, duration, qualifier, or completeness. The same shape mixes grab samples and monthly means.

- Re-pulled USGS 03582000 for July 2025: 2,976 quarter-hour values, mean 24.9467405914 C, max 27.8 C; all returned with `P` (provisional) qualifiers. This reproduces the lower-Elk record's ~24.95 C figure. The response explicitly identifies **Elk River above Fayetteville**, which is not the Prospect-to-state-line catalog reach. This is useful upstream context, not a measurement throughout the lower reach.
- Re-pulled [TDEC Buffalo Creek station TNW000000754](https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000000754&characteristicName=Temperature%2C%20water&mimeType=csv): 29 field observations, 2010-2025, explicit degrees C and time of day. The July 2024 observation of 19.16 C is real; it occurred at 11:10. A collection of cool morning/midday visits is not a continuous summer maximum or evidence of fish abundance. Exact daily metadata is available at the source but was discarded by the research schema.

**Additional source routes verified:**

1. Public ArcGIS organization search returned 35 trout-related items within TWRA's organization. Unlike broad web searches, it exposes dataset owners, service URLs, vintage, and schema. Mere item existence does not establish quality, publication intent, or completeness.
2. [Brook Trout Temperature Data](https://www.arcgis.com/home/item.html?id=265e1770c9a44b419fbc356627f8b3c0): public service returns **2,284 records across 12 distinct stream-name strings**, not statewide coverage. Sample rows have 2022 dates, `AveTemp` and `MaxTemp`; the item was uploaded March 2025. Streams include Doe River, North Fork Citico, Little Paint, Little Stony, Sinking Creek, and seven others. Units, logger methods, aggregation definitions, completeness, and reuse terms are not supplied in the inspected metadata. These must be obtained before interpretation or product use.
3. [Brook Trout Genetics_ArcFormat_2025](https://www.arcgis.com/home/item.html?id=4dfe0b468a7a4748b8c2132270f4cf4d): **110 collection records**, with waterbody, county, collection date and sample count. The inspected five samples are from 2016, despite the 2025 dataset title. This is historical biological occurrence evidence and a route to the underlying USGS analysis, not a 2025/26 census. Public access is verified; license/usage metadata is blank.
4. [Seasonal Trout Creel Interview service](https://www.arcgis.com/home/item.html?id=1433e0f544734714a1023c2addd97fbb): schema includes fishing effort, day-of-stocking, trout caught/released/harvested, date, and stream. This identifies a direct route to the owner's **catchability** question. Only service/schema metadata was inspected; no respondent records were requested. A methodologically documented, aggregated release from TWRA is the appropriate next source, not raw questionnaire scraping.
5. [EPA's Tennessee water-quality standards index](https://www.epa.gov/wqs-tech/water-quality-standards-regulations-tennessee) links the March 2024 revised [TDEC use classifications](https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf). The state-hosted PDF returned 403; the EPA copy returned 200. Downloaded, extracted, and visually checked table columns. Printed p. 23/PDF p. 24 marks Little River **mile 33.0 to origin** as NRTS, while its mile 0-33 row does not have that mark. Printed p. 36/PDF p. 37 marks Buffalo Creek **below Buffalo Springs** as TS, not NRTS. Basin context prevents confusion with other Buffalo Creeks. This is valuable reach-specific designation evidence, not a new biological survey.
6. [TDEC general water-quality criteria, EPA copy](https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0011_062024.pdf), rule .06(4), includes naturally reproducing trout as one of several reasons for Exceptional Tennessee Waters status. **ETW alone does not mean trout.** Rule .03 also applies protective assumptions to tributaries and GSMNP waters. Do not reinterpret those legal protections as sampled occupancy everywhere. The 2017 TWRA plan itself warns some wild trout waters lacked the designation (printed pp. 22-23).

No occurrences of the new temperature/genetics service names, `NRTS`, or `0400-40-04` were found in the searched `docs` and `packages/content/research` trees of main or habitat-batch6. This is a bounded repository search, not proof nobody explored them elsewhere. Archived raw responses include URLs, retrieval timestamps and SHA-256 hashes in the local research directory.

## Findings

### 1. The search campaign was answering several different questions as though they were one

These propositions are not interchangeable:

| Question | Evidence that can answer it | What it does not establish |
|---|---|---|
| Does a trout stocking program cover this location? | Schedule, program description, mapped stocking site | Completed delivery; fish survival; all-year opportunity |
| Were trout actually released? | Dated completed stocking report/log | They remain today; they reproduce |
| Have trout been found here? | Identified catch, fish survey, biological collection | Year-round population, catch rate, whole-river presence |
| Do trout reproduce here? | Recruitment/reproduction evidence, appropriately documented population survey | Every species reproduces; every reach is occupied |
| Can anglers reasonably target trout year-round? | Reach-specific management assessment and/or seasonal catch/creel evidence | Guaranteed catches or safe conditions every day |
| Can the habitat support trout through summer? | Representative continuous temperature, oxygen, refuge/connectivity and flow evidence | Trout were introduced or currently occur there |
| Is it legally designated or regulated for trout? | Effective rules with precise boundaries | Current abundance, public access, universal occupancy |
| Is it suitable to fish today? | Current relevant conditions, access and closure information | A new long-term fishery classification |

The owner's underlying question is reasonable: **where is trout fishing a year-round opportunity, where is it a seasonal stocked opportunity, and where should I primarily think about warmwater fishing?** It does not require proving every trout's summer survival. It also cannot be answered by counting stocking months alone.

Coldwater and warmwater species can coexist. A mixed reservoir is not logically forced to be either a trout water or a bass water. A whole named river may include all three types of opportunity at different reaches. “Warm Water - No Trout” is a much stronger claim than “warmwater fishery; no trout opportunity verified.”

### 2. Search quantity and record completeness were poor stopping criteria

The supplied `HABITAT-EVIDENCE-PROMPT.md` prescribed 3-6 searches per water, a fixed schema, and reading catalog narratives first. It also later permitted StoryMap facts verified through search snippets. That procedure makes an output file easy to finish while leaving decisive evidence unexamined. This is a process issue, not a verdict about the model that performed it.

Boone tailwater is the clearest counterexample: the publicly accessible, TWRA-linked forecast supplies the year-round and holdover claims directly, yet the evidence record says those facts were not found. The ArcGIS data endpoint removes the supposed JavaScript barrier. The forecast was already a known lead in the prompt; recovering it is an improved extraction method, not discovery of an entirely unknown source.

Catalog prose should seed identity checks, not anchor the result. First establish the water/reach, then search source collections capable of answering the missing proposition. Stop when the proposition is supported at the required scope, or when a recorded coverage gap genuinely remains. “190 files written” measures task completion; it does not measure factual accuracy.

### 3. The schema throws away information needed to decide responsibly

The June-September-only temperature field excludes other potentially important periods by construction. TWRA's forecast discusses late-summer/fall limitations, including Cherokee and the Caney Fork's 2025 water-quality problems. Preserve the complete observation period rather than declaring only four months relevant everywhere.

The schema also conflates `false` with “not documented.” For example, several wild-population fields are false because a trout entry or survey was not found. A future consumer cannot distinguish an actual negative survey from a search miss. The data should distinguish **observed, explicitly assessed as absent/unsuitable within a defined scope, not investigated, not found in this source, and conflicting**.

Species and life stage matter. The 2026 Tims Ford forecast reports multiple brown-trout size/age classes but little significant multi-year rainbow holdover. Collapsing that to one “holdover” boolean loses what a trout angler needs. A release type also needs a relationship: is this water the reservoir storing cold water, the receiving tailwater, or a remote reach downstream?

The existing statistical confidence is an additive heuristic, not a calibrated probability of truth. The synthetic function-level checks in checkpoint 2 test the decision boundary; they are **not** a claim that malformed fixtures passed the research validators. The actual water cases demonstrate the same substantive weaknesses with existing records.

### 4. Official information needs a freshness and contradiction policy

Record four dates when available: observation, publication/revision, legal/program effective period, and our retrieval. Never promote the retrieval date into the observation date. The 2025-titled genetics layer's 2016 sample records are a concrete warning. The official forecast's South Holston and Wilbur sections explicitly say no 2026 sampling was possible because of low flows and report 2025 findings instead.

Do not apply a single age cutoff to every claim. An old dam-construction fact may remain valid; an old summer temperature profile may not survive operational changes. The current forecast attributes Tims Ford improvements to the release-improvement program begun in 2005 and discusses Caney Fork changes following the orifice's June 2024 return. Older studies should be attached to their operating regime, not automatically averaged with current conditions.

“Latest wins” is also too simple. A recent schedule and an older fish survey address different propositions. When two agency surfaces disagree about the same proposition, preserve both and mark the calendar or species claim unresolved. Prefer evidence with identifiable sampling methods and dates over undated promotional prose, whether either comes from a government, university, outfitter, or conservation organization.

Primary non-government evidence can be useful: a research team's dated sampling results, a guide's own contemporaneous catch logs, or an angler's verifiable observation. It needs exact place/date/species, a distinction between observation and opinion, and awareness of sampling bias. Five websites repeating one TWRA sentence are one source, not five independent confirmations. A large trout may be a recently stocked brood fish; size alone is not proof of multi-year holdover (the Tims Ford forecast itself discusses this possibility).

### 5. Important safeguards in the brief are weaker than described

- Policy drift is real in the inspected artifacts: the original prompt centers habitat survival, while the later owner policy adds continuous stocking and sustained angling opportunity. Facet 3 appears in the model prompt but has no corresponding structured facet in `extractFacets`. Its “sufficient volume” criterion has no operational threshold. Future conclusions should identify the exact policy edition separately from the source evidence; rewording a policy does not discover new fish.
- The gate does not inspect source tiers or recency, although the architecture says it should. It checks booleans, month counts, select catalog conflicts, and source-list length.
- Model agreement is not independent corroboration when both see the same incomplete facts. Boone tailwater and Parksville Lake have stored code/model agreement on seasonal labels; direct TWRA material supports year-round opportunity for the stated fishery.
- Owner rulings are product decisions. Preserve them, their reason, and date, but do not count them as independently measured biological truth or classifier accuracy.
- Regression fixtures demonstrate that code follows a policy. They cannot establish the policy is biologically sound or the sources were correctly interpreted.
- Existing main-source UI logic at `d1e48d1`, `apps/web/src/features/map/waterDecision.ts`, calls a trout-feature assessment `confirmed-current` and can give high confidence based on gauge readings. Gauge assessment is not current fish detection. This was source inspection, not a runtime/live-site test.
- The research branch is not an ancestor of the audited main revision. This supports keeping research and main state separate; it does not by itself prove the deployment's exact version. No production audit or deployment was performed.

### 6. A short, decision-focused case set

These are evidence findings for discussion, **not edits to production classifications**.

| Case | Supported conclusion at this audit | What remains unknown or qualified |
|---|---|---|
| Boone Tailwater | Current TWRA forecast explicitly describes year-round fishing and holdover; includes 2026 sampling | Conflicting stocking months; no claim every day fishes well |
| Boone Lake | TWRA lake page lists a trout rule extending upstream to the 11E bridge on its Watauga arm | Persistence and opportunity across the lake/arms; regulation is not a population census. Do not move lake and tailwater “together.” |
| Watauga Reservoir | Explicit managed year-round trout opportunity plus summer deep-water fishing guidance | No fresh depth/oxygen profile or reservoir creel study verified here; no shore-wide summer promise |
| Parksville Lake | Included in TWRA's explicit year-round reservoir list | Current extent/abundance and operating conditions not independently established; never borrow the tailwater's seasonal classification |
| Center Hill Lake | Bottom discharge explains the Caney Fork below the dam, not a lake-wide trout fishery | Trout occurrence in the reservoir is unresolved by that mechanism alone |
| Normandy/Duck tailwater | TWRA forecast states only eight suitable months and names the first nine miles for catches | Exact calendar conflict; occasional fish outside the period would not prove a consistent year-round fishery |
| Cherokee and Hiwassee tailwaters | TWRA says limited year-round fishing and describes summer constraints/refuges/limited holdover | A simple blue all-year line would hide a material seasonal caveat |
| Tims Ford/Elk | TWRA describes year-round trout in the first 11 miles; current report distinguishes brown and rainbow persistence | Do not extend this to the entire Elk or use the Fayetteville gauge as direct evidence at the dam |
| Buffalo Creek, Grainger | Stocking, cool discrete summer observations, and a TS designation below Buffalo Springs | Continuous summer envelope, wild reproduction and reliable all-month catchability are not established by those facts |
| Little River | TDEC distinguishes the upper NRTS reach from lower reaches | Legal river-mile boundaries must be spatially reconciled; no claim all water inside the designation has equal trout abundance |

## Better ways to obtain and assess evidence

### Source-first inventory and discrepancy audit

Build a research inventory from agency services and reports **before** launching hundreds of water-name searches. Reconcile the schedule, recently stocked list, stocking-location GIS, trout forecast, reservoir program table, NRTS/TS designations, survey reports, and catalog as separate datasets. The unit of work becomes an unmatched water/reach or a contradictory claim, rather than another search for a water already known to be stocked.

The proof of value is already present: Whiteoak/White Oak plus Houston resolves a program; Watauga reveals a schedule-coverage gap; Boone reveals conflicting calendar claims; the 10-row recent list reveals its limited temporal scope. Report each source's scope and missing coverage, not just its row count. Distinguish locations, events, collections, daily aggregates and waterbodies.

### Reach identity before joining facts

Use the agency's water ID where available, county/basin, dam relation, coordinates and the hydrographic network together. Store evidence as a point, bounded reach, whole reservoir, reservoir arm/depth zone, or basin-wide statement. Accept a fact only at that scope. A HUC match is not enough; a HUC contains many different reaches. Nearest gauge by straight-line distance can be upstream, in another tributary, above a dam, or inside the lake.

For mapping, attach evidence to an explicitly bounded reach and retain the original textual boundary. Avoid automatically coloring the whole named river. Where the source provides only a stocking point, show a point until reach limits are substantiated. Do not replace uncertain limits with a precise-looking buffer or invented trout-mile cutoff. TDEC river-mile references also require a verified reference system before converting them to modern map lines.

### Read the source behind the presentation

The official TWRA forecast can be captured from the public ArcGIS item-data endpoint, with node IDs and verbatim text. Verified all 206 captured nodes are reachable from the published story root, including the quoted case-study nodes; the findings are not taken from detached draft nodes. Tables expose structured JSON. PDF tables require column-aware extraction plus visual checks, as done for TS/NRTS. Retain the source extract, its location, date and content hash so reviewers can see the evidence rather than trusting a generated summary.

For an inaccessible source, use a legitimate institutional mirror and identify the edition, as with EPA's 2024 TDEC copy. A blocked URL or search snippet is a lead or recorded access failure, not a verified source read. Never infer “no data” from a failed request.

### Search for effort and persistence, not merely more catch anecdotes

The owner's “consistent catching opportunities” criterion is best approached through seasonal creel rates, survey abundance/size classes, stocking records, and reach-specific management assessments. Stocking volume alone has no meaning without reach size, harvest, survival, emigration, timing and fishing effort. There is no defensible universal fish-count threshold in the evidence reviewed here.

The verified seasonal creel schema is a promising route to catch per unit effort and time since stocking. Ask for aggregated estimates and methodology. Distinguish agency electrofishing catch rate from recreational angler catch rate. Do not translate one directly into the other.

For hard unresolved reaches, a future collaboration with fisheries researchers, managers or local observers could pair summer temperature loggers with documented fish sampling/standardized observation. That is a proposed method, not work performed. A temperature logger cannot establish fish presence; environmental DNA can indicate species material but does not by itself prove a resident breeding population or catchability. Positive reports need verification; non-detection requires an explicit sampling/detection model before suggesting absence.

### Assess evidence quality by claim, not publisher alone

For each proposed headline, record spatial fit, observation age/operating regime, directness of the evidence, sampling coverage, source independence, and contradictions. Use plain statuses such as **documented, limited, historical, conflicting, unknown**. Do not show an apparently scientific percentage without calibration against an independent adjudicated set.

For a later evaluation, include known difficult pairs (lake/tailwater, upper/lower river, same-name creeks, stocked/wild overlap), hide the current product label from reviewers, and score false “no trout” results separately from false year-round results. Count abstentions/unknowns as coverage limits, not mistakes that must be eliminated by guessing. This is an evaluation recommendation; no new classifier or benchmark was implemented.

## Alternatives and owner decisions

### Four viable product approaches

| Approach | What the visitor sees | Advantages | Limits / burden |
|---|---|---|---|
| **A. Documented trout-opportunity overlay** | Highlight only supported year-round/seasonal trout reaches and stocking sites; other waters retain warmwater information or an unassessed state | Small factual burden; useful without inventing a statewide negative inventory | Unhighlighted must never mean “no trout”; incomplete geographic coverage is visible |
| **B. Reach fishery + stocking calendar + conditions** | One fishery headline, independently displayed stocking months, plus current conditions | Answers the original question while correctly handling reservoirs, mixed waters and seasonal risk | Requires explicit reach identities and evidence maintenance; recommended direction |
| **C. Date-specific opportunity map** | “Trout opportunity for your visit,” supported by documented fishery seasons and actual recent releases | Strong trip-planning value; makes seasonal ponds understandable | No arbitrary “stocked N days ago = trout still here” countdown; unsupported months remain uncertain |
| **D. Thermal habitat/suitability layer** | Measured or modeled coldwater suitability, with coverage and uncertainty | Helps locate gaps and prioritize field research; useful conservation context | Not fish occurrence; sparse sensors, lake depth/oxygen, dam operations and model transferability make this a research layer, not the main classifier |

**Recommendation: B, initially supported by A's disciplined positive evidence.** C is a useful presentation option where the evidence supports a season. D should not decide whether trout exist. This is a direction for the next planning discussion, not an implementation sequence or authorization to build.

The headline vocabulary should answer the fishing question without claiming absolute biological exclusion:

- **Year-round trout opportunity** — wild or stocked, with the supporting reach and any summer limitations stated.
- **Seasonal stocked trout opportunity** — the fishery is seasonally maintained; show documented fishing windows separately from release months.
- **Warmwater fishing focus** — supported warmwater fishery information; avoid asserting there are zero trout.
- **Trout status unresolved** — source coverage is insufficient or contradictory. This must be a legitimate result, not a low-confidence “No Trout” hidden behind a tooltip.

Mixed waters can retain warmwater species information alongside a trout headline. Reservoirs should say **trout fishery/opportunity**, not “trout stream.” Year-round does not mean every part of the water is suitable all summer, or that fishing is productive/safe every day.

Illustrative copy grounded in this audit:

> **Boone Tailwater — Year-round trout opportunity.** TWRA's current forecast documents holdover and March 2026 sampling. Published stocking calendars disagree; check the latest stocking report for completed releases.

> **Normandy Tailwater — Seasonal trout opportunity.** TWRA describes approximately eight suitable months. This is separate from the stocking dates shown below.

> **Watauga Reservoir — Year-round trout fishery.** Summer lake-trout fishing uses deep water. This label does not describe summer bank-fishing conditions across the lake.

> **Boone Lake — Trout status varies or remains unresolved.** TWRA publishes a trout regulation for the Watauga arm; the year-round extent has not been established in this audit.

For the map, an unassessed neutral line and a precise supported highlight are more honest than coloring the entire network as trout/no-trout. Put the evidence date and scope within one tap. Keep condition warnings visible even on a documented year-round fishery; never let the permanent label imply today's water is safe for trout angling. No UI or visual mockup was implemented.

### Decisions to carry into the planning conversation

1. Accept **unknown/unresolved** as a first-class result and retire the absolute “No Trout” claim unless there is unusually strong, scoped evidence.
2. Decide whether the headline is about **angling opportunity**, biological habitat, or management program. My recommendation is angling opportunity, with the other facts separately available.
3. Permit reach splits and mixed waters; a single name or catalog slug is not necessarily a homogeneous fishery.
4. Define how a manual owner decision is displayed when it exceeds available evidence. Keep an editorial decision distinguishable from a verified factual conclusion.
5. Decide the acceptable coverage of the initial documented map. A smaller, traceable set can be useful; statewide certainty is not a necessary launch condition.

### Unresolved evidence routed to the owner

These are specific requests the owner can decide to pursue. **No emails, contact forms, or messages were sent.**

| Owner/source route | Concrete unresolved question | Interim handling |
|---|---|---|
| TWRA fisheries staff responsible for Boone Reservoir and its tributary arms | Which bounded lake/arm reaches provide persistent trout fishing, in which seasons, and what recent survey/creel evidence supports that? | Keep Boone Lake separate from its tailwater; no whole-lake yes/no claim |
| TWRA stocking program/data maintainers | Which published calendar supersedes the conflicting Boone/Normandy entries? Does the reservoir schedule omit programs or species? Are dated completed releases available beyond the recent list? | Preserve conflict and source scope; do not infer no program from a missing row |
| TWRA owner of the temperature/genetics services (`Region5Fisheries`) | What are the units, logger aggregation periods, QA, coverage, sampling dates, stable IDs, refresh plans, and permitted reuse/publication scope? | Treat these as verified accessible research leads; do not label them live feeds or verified statewide datasets |
| TWRA seasonal creel survey staff | Can they release aggregated reach-by-month effort, catches, uncertainty and survey design, plus time-since-stocking analyses? | Use the schema as evidence a suitable research route exists, not as a measured catchability result |
| TDEC/TWRA mapping staff | Are more recent TS/NRTS amendments or an authoritative spatial crosswalk available? Which known wild-trout reaches lack designation? | Use the inspected 2024 edition as dated designation evidence, preserving legal-vs-biological distinctions |
| Owner and appropriate fisheries expert | How should “limited year-round” waters such as Cherokee and Hiwassee be presented? | Preserve the limitation prominently; do not force unrestricted all-year wording |

## Verification scope and reproducibility

- Repository method audit: all six record files and all 190 deterministic outputs inspected programmatically; final-review counts reproduced using stored ratings and overrides. Inspected decision functions, enriched-input builder, policy, original research prompt, final-review precedence, and relevant main UI source. Did not re-run a paid/remote model or assess its internals.
- Primary-source audit: targeted difficult-case checks and source-method discovery, **not** a citation-by-citation recertification of all 190 waters. The report cannot supply an overall accuracy percentage, a complete trout inventory, or a universal warmwater/no-trout map.
- Newly verified data routes: official StoryMap full content; TWRA ArcGIS metadata/counts/small samples; live schedule and recent-release data; WQP observations; USGS time series; visually checked portions of TWRA and TDEC PDFs. Did not infer dataset contents from search snippets.
- Search failures: initial transient connection resets to several tn.gov URLs succeeded on ordinary retry; the state-hosted TDEC PDF returned 403 and was replaced by the identified EPA edition. Failure was not treated as absence.
- Branch baselines: main `d1e48d1670a348ffc3b68d543596265f92d484b2`; habitat research `27acc5b18be04a082197c53b7ba93a72c3e45931`; separately identified stage-2 branch `c0cbbd73c3a172cc01c0b83ef32918477d825e18`. Reproductions use the habitat branch's actual assembled pipeline, not an assumed mix of branch versions.
- Audit output is this report only. No catalog, source-record, classifier, UI, test, contract, service, or deployment changes. `docs/KNOWN-ISSUES.md` remains untouched because this is a review, not a fix session.

Local research archive: `C:/Users/Benjamin/Projects/trout-evidence-audit-materials-20260921/`. `sources/*.meta.json` records request URL, final URL, HTTP status, retrieval UTC and SHA-256; raw responses and readable extracts accompany them. `snapshot/` contains branch extracts; `reproduce.mjs` and `reproduction.json` preserve the local read-only classifier experiment. These research helpers are outside the product repository and are not an implementation. This Markdown report is the portable, pushed finding record.

Representative capture hashes (identify the edition actually read; mutable URLs may change):

| Capture | SHA-256 |
|---|---|
| TWRA trout information HTML | `5a2a2fcc4665202c48a45fbc417cd0b891d0daeebc66d6f192d94647349aa90e` |
| TWRA forecast item data | `86d4c1ea5cbf21a5c7c5b26963aa0a95314ad2511b9f46da69e6b1e99941ba30` |
| 2017-2027 trout plan PDF | `c1ef80607575d7c818a249d66dab50b65ce87c1deb31a54ce0401cdd2f9150a7` |
| 2024 use-classification PDF, EPA copy | `5191cca17e1e69beeb39af769642b0c3872350e71cf3e02dc631a3b22fbda509` |
| Live 616-row schedule JSON | `278c1b51420fb1571d4e88b62e9af22ff97c535ea86c800f476cbc0366c96669` |
| Live 10-row recent-release JSON | `87cd13a2f5626f869e04639a5efc7d77dfa84869a039853b7f44b1d49d584146` |

Useful exact reproduction requests:

```text
# Full official forecast, with text nodes and report years:
https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json
# Metadata for agency ownership and modification date:
https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747?f=pjson
# Temperature count (records, not waters):
https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Brook_Trout_Temperature_Data/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json
# Distinct stream-name strings (not a spatial inventory):
https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Brook_Trout_Temperature_Data/FeatureServer/0/query?where=1%3D1&outFields=Stream&returnDistinctValues=true&returnGeometry=false&f=json
# Genetics collection count:
https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Brook_Trout_Genetics_ArcFormat_2025/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json
# Elk record arithmetic (station attribution is a separate check):
https://waterservices.usgs.gov/nwis/iv/?sites=03582000&parameterCd=00010&startDT=2025-07-01&endDT=2025-07-31&format=json
```

The minimal classifier checks can be repeated by importing `classify` and `resolveEscalation` from the audited revision's `code-classify.mjs` and supplying the exact inputs in checkpoint 2. Boone forecast quote is at StoryMap node `n-Q2FuhI`; Normandy suitability at `n-I7NFwN`; Tims Ford first-11-mile statement at `n-0Qzf3q`; South Holston's 2025/2026 distinction at `n-28fSZv`. Node IDs locate this captured edition, not a promised permanent interface.

**Stopping point:** the audit has enough reproduced failures, source evidence and viable alternatives to support the owner's next planning discussion. Remaining uncertainty is explicitly routed above; it has not been converted into final classifications.
