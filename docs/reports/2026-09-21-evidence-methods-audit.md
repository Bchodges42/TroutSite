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

## Findings

Checkpoint 2 establishes substantive faults in the evidence-to-label method. Detailed synthesis follows after the remaining primary-source checks.

## Alternatives and owner decisions

Pending evidence review. Recommendations will be design options for a later plan, not implementation commitments.
