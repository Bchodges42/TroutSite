# Tennessee trout classification: evidence and methods audit

Started 2026-09-21 (America/Chicago). Research in progress; conclusions below are provisional until marked verified. Scope: audit prior research and propose alternative methods; no implementation, deployment, or final water classifications authorized or performed.

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

The reproduced evidence supports changing the method before expanding the label campaign. Detailed synthesis and product alternatives follow below.

## Alternatives and owner decisions

Pending evidence review. Recommendations will be design options for a later plan, not implementation commitments.
