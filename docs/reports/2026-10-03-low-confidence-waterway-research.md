# Low-confidence waterway research: eight source expansions, 2026-10-03

This pass found additional primary-source evidence for **eight waters**, including a previously unlocated Crab Orchard Creek fish survey, 2020 West Fork Obey specimens, 2009 Bradley Creek specimens, and dated Reedy Creek specimens. Six museum selections contain **170 occurrence rows**. Those are catalog records, not 170 fish or 170 independent observations. Trout occupancy remains unresolved where the new evidence does not reach it.

Research only: no catalog, ledger, contracts, application, geometry, or production changes. Recommendations are inputs to adjudication, not applied classifications. No outreach was sent.

## Baseline and scope

Fresh independent clone and branch: `codex/low-confidence-waterway-research-20261003`, starting at `origin/main` commit `14a92bc302842050cb1354108b5f16436b765504`. The supplied checkout's untracked `plugins/` directory was left untouched.

The actual committed 190-water ledger contains **137 documented, 20 limited, 2 conflicting, and 31 unresolved** headlines: **53 weak-evidence waters** using `headline.evidenceState != documented`. These are current file counts, not the older 52-water count in September's report. [The complete 53-water baseline](../research/low-confidence-20261003/baseline.json) retains IDs, statements, and unresolved questions. This is a targeted follow-up, not an assertion that all 53 were exhaustively researched again.

Reviewed the September nine-water, 47-water, and individual water logs, owner triage, ADR 0011, current catalog files, the worklist, and the ledger. Chose poorly covered waters where expanded museum coverage or an unlocated primary survey could add something beyond the existing reports. New River was considered but its September log already contains several TWRA surveys; those are existing findings and are not counted as new here.

All new live retrievals were on **2026-10-03 UTC**. The observation/publication dates below stay separate from retrieval dates.

## Findings at a glance

| Catalog water | Additional evidence verified | What improves | What remains unresolved |
| --- | --- | --- | --- |
| **Crab Orchard Creek** | TVA August 1968 survey, published 1970: two creek stations, 12 species at RM 10.8, no fish in the RM 2.5 sample; EPA May 2014 account of 2006–07 recovery | A real creek-specific fish survey and a dated recovery record replace the earlier survey-empty finding | Present-day assemblage, trout occupancy, and current reach-by-reach condition |
| **West Fork Obey River** | Yale vouchers, 2020-03-11, at TN 52/Cowen Branch: 39 rows, 19 distinct taxon names; UA 2002 collection: 14 rows, 13 names | Extends the previous 1975-only evidence into 2020; confirms named native non-trout taxa on the fork | Current sportfish abundance, trout occupancy, summer persistence |
| **Bradley Creek** | UF collection, 2009-06-24, Dean's Shop Rd, Coffee County: 12 taxon names, including largemouth bass and bluegill | Adds a summer fish collection at a location matching the catalog creek, beyond the previous 1968/1984 records | Current assemblage, continuous summer temperature maxima, any trout observation |
| **Reedy Creek, Kingsport** | UA 2000-03-30 and UF 1969-03-22 collections in Sullivan County, each three taxa | Positively documents fish on the actual Kingsport-area creek; earlier search-empty statements are too broad | Present-day lower urban/Greenbelt angling opportunity and trout persistence outside youth events |
| **Little Chuckey Creek** | Five UA collection dates, 1999-12-19 through 2001-05-02: 50 rows; rock bass positively recorded | Expands the previous 1993-only evidence across several dates, including winter/early spring | Modern abundance, exact current angling opportunity, trout occupancy |
| **Dumplin Creek** | Cornell collections on 1952-11-13, 1953-03-05, 1953-05-14: 16 rows | Refutes the earlier claim that no digitized fish lots were located | Records are very old; no current sportfish survey or trout claim established |
| **Roaring River** | Minnesota 2006 community vouchers, Ohio State 2007 bass voucher with sampling method, Cornell 1965/1966 bass vouchers | Adds specimen-backed fish evidence beyond restoration news and undated catches | Current assemblage; old bass names need modern taxonomic review; trout question remains open |
| **Nolichucky River** | USFWS 2025-12-31 account explicitly names local Erwin trophy-trout stocking in the Nolichucky river system | Adds a newer agency description to the older TWRA/2022 release evidence | Exact main-stem release location/date/count and a confirmed post-Helene release history |

## 1. Crab Orchard Creek: historical survey located and reach split demonstrated

**Source:** Tennessee Valley Authority, *Tennessee Valley Streams: Their Fish, Bottom Fauna, and Aquatic Habitat; the Emory River, 1968*, published 1970. [Google Books source](https://books.google.com/books?id=6IBcXkMu-R4C). Google identifies Cornell as the scan source and August 15, 2026 as the digitization date; neither is the observation date.

This is the **Morgan/Cumberland creek flowing to the Emory River**, not Illinois's Crab Orchard Lake and not Daddys Creek near the town of Crab Orchard. Table 1 explicitly places the two stations at:

- RM 2.5, just above the bridge near White Oak Church.
- RM 10.8, just above a bridge approximately 0.25 mile below the Morgan/Cumberland county line.

Procedures, printed pages 2–3, identify **16 sampling locations across the Emory and five major tributaries**, approximately half-mile study sections, representative riffle/pool fish collections isolated by block nets and treated with cresol or rotenone, with recovered fish identified/count-weighed-measured. Population figures were then expanded to stream-mile estimates. This was a fish survey, not a benthic-only sample. It describes low-flow sampling and acknowledges some unsampled large pools.

Printed page 4 explicitly says **Crab Orchard Creek had 12 species**. Table 5's RM 10.8 column positively lists rock bass, green and longear sunfish, smallmouth bass, northern hog sucker, black redhorse, silver/warpaint/whitetail/mimic shiners, creek chub, and blueside darter. The RM 2.5 column says **NO FISH**. The basin-wide Table 7 lists 42 fish species and contains no salmonids. This is meaningful historical summer non-detection at the sampled sites, not proof of present-day or creek-wide trout absence.

Table 4 reports **0 fish/acre** at RM 2.5 versus an estimated **3,287 fish/acre** at RM 10.8; these are expanded density estimates, not raw catches. The conclusions link the lower-creek condition to mine drainage and note water 10–20 °F warmer than other stations. The upstream warmwater fish community and downstream fishless sample must not be collapsed into a single creek-wide statement.

**Independent later source:** EPA, *Installing Best Management Practices Abates Acid Mine Drainage in Crab Orchard Creek*, **May 2014**, EPA 841-F-14-001DD. [Original PDF](https://www.epa.gov/sites/default/files/2015-10/documents/tn_craborchard-2.pdf). The `/2015-10/` URL path is not its publication date.

Both PDF pages were extracted and visually checked. EPA describes a **2.3-mile segment** delisted in 2010, a 2006 SQSH assessment at RM 3.1, and a 2007 biorecon score of **15**, with **17 EPT families, 11 intolerant families, and 31 total families**. These are **macroinvertebrate** metrics, not 31 fish families or a trout survey. EPA also says an upstream section remained impaired for manganese/pH when the report was written. Neither the 2010 delisting nor the old impairment statement is a current 2026 status claim.

**Delta from September:** `crab-orchard-creek.md` said no creek-specific fish survey was found. That research gap now has a direct primary source. The source strengthens a **historical warmwater assemblage** claim, but a current opportunity should remain qualified pending modern sampling.

Evidence: [14 unchanged TVA page scans and page links](../research/low-confidence-20261003/captures/tva-emory-1968.source.json), especially PP8/PP9 methods, PP10 summary, PP14 stations, PP17/PP18 density and species tables, PP20 full names; [EPA capture](../research/low-confidence-20261003/captures/epa-crab-orchard-restoration-2014.pdf).

## 2. West Fork Obey: 2020 vouchers replace the one-old-collection picture

**Provider:** Yale Peabody Ichthyology, [dataset](https://www.gbif.org/dataset/96419bea-f762-11e1-a439-00145eb45e9a), CC0.

On **2020-03-11**, records name: “West Fork Obey River, sampled ca. 300 m downstream of TN Hwy 52, upstream to confluence of Cowen Branch,” Overton County. The encoded point (36.396939, -85.174386) is about **6 m** from the project's trace. The records carry **1,851 m coordinate uncertainty**, so the locality is stronger than an exact point assertion.

The reviewed group has **39 rows and 19 distinct taxon names**, including bluegill, longear and green sunfish, warmouth, least brook lamprey, stonecat, logperch, Obey darter and several minnows/darters. Repeated tissue/specimen entries from the same event do **not** add independent survey events or fish counts. Sampling protocol is missing in these indexed records: use them as vouchers, not as a complete-method abundance survey.

Examples: [YPM ICH 034449, warmouth](https://www.gbif.org/occurrence/2859793344), [bluegill](https://www.gbif.org/occurrence/2859793306), [least brook lamprey](https://www.gbif.org/occurrence/2859793301). A **2002-04-19 UA** collection at the same TN 52 corridor adds 14 rows/13 names, including [rock bass](https://www.gbif.org/occurrence/925770617).

**Delta:** September's log had a 1975 collection. The present ledger still describes the evidence as effectively empty. This is additional 2002/2020 fork-specific evidence; Dale Hollow reservoir/tailwater records were excluded. Recommend a dated non-trout-community claim, with limited currency; do not infer that trout are absent or that sportfishing is good today.

## 3. Bradley Creek: a correctly located 2009 summer collection

**Provider:** UF Florida Museum Ichthyology, [dataset](https://www.gbif.org/dataset/eccf4b09-f0c8-462d-a48c-41a7ce36815a), **CC BY-NC 4.0**. Research evidence only; this pass does not authorize commercial production reuse.

The **2009-06-24** group says “Bradley Creek at Dean's Shop Rd,” **Coffee County**, at 35.335169, -85.990364, about **5 m** from the catalog trace. It contains 12 distinct names: largemouth bass, bluegill, longear sunfish, creek chub, striped shiner, white sucker, logperch, rainbow and snubnose darters, banded sculpin, flame chub, and central stoneroller. Examples: [largemouth bass, UF 184264](https://www.gbif.org/occurrence/735969297), [bluegill](https://www.gbif.org/occurrence/735969299).

This adds positive non-trout fish evidence from June, beyond the September report's 1968/1984 vouchers. It does not determine survival through the hottest weeks or change the earlier distinction between cold-water capacity and trout occupancy. The indexed protocol is missing; selective preservation prevents interpreting missing trout as a complete-survey negative.

**Quarantine:** two other 2009 groups are named Bradley Creek but their coordinates are approximately **11.53 km** (station SP4) and **2.62 km** (BD1) from the catalog trace. They are not used for point-level occupancy. Rutherford County and Hawkins County Bradley Creeks were excluded entirely. The Dean's Shop group supplies the strongest unambiguous new locality evidence.

## 4. Reedy Creek: dated fish evidence on the Sullivan County creek

**UA, 2000-03-30:** “Reedy Creek at Ollis Bowers Hill Rd., 8 km E of Kingsport,” Sullivan County, 36.572778/-82.4125, approximately **31 m** from the trace. Three names: central stoneroller, redtail darter, snubnose darter. [Central stoneroller, UAIC 12732.01](https://www.gbif.org/occurrence/925768053). UA data are CC0. Datum/rounding issues are retained in the capture.

**UF, 1969-03-22:** “Reedy Creek at US Hwy 11 bridge, ca 5 mi E of Kingsport,” Sullivan County, approximately **2 m** from the trace. Snubnose, redline and greenside darters. [UF 43763](https://www.gbif.org/occurrence/624096273). UF data are CC BY-NC and are research-only here.

**Delta:** these are direct dated museum records on the correct creek. They narrow the older “no positive evidence of any kind”/empty-museum statements. They do not demonstrate bass fishing, a current Greenbelt fishery, trout holdover, or a complete fish assemblage. The September youth-derby evidence remains a separate, already located source and is not claimed as a new discovery.

Exclude Carroll County's Obion-drainage Reedy Creek. Also quarantine [OSUM 1973 greenside darter](https://www.gbif.org/occurrence/868410348): its Sullivan/locality text conflicts with coordinates **35.7504/-86.2503**, far from Kingsport. Never map it at that encoded point.

## 5. Little Chuckey: five additional collection dates, including winter

**Provider:** UA Ichthyological Collection, [dataset](https://www.gbif.org/dataset/e90a588b-0eed-4077-8a4f-7e61da35b3f8), CC0. All selected records name **Little Chucky Creek**, Greene County, Nolichucky drainage. “Chucky” and “Chuckey” were both searched.

| Collection date | Locality group | Rows / distinct taxon names |
| --- | --- | --- |
| 1999-12-19 | Bible Branch Road, upstream approximately 300 m | 6 / 6 |
| 2000-03-24 | Bible Branch Road, east of Warrensburg | 14 / 14 |
| 2001-02-28 | Denver Bible/Bible Branch Road | 17 / 17 |
| 2001-03-01 | Mouth of Jackson Branch | 3 / 3 |
| 2001-05-02 | Denver Bible/Bible Branch Road | 10 / 10 |

Examples: [rock bass on 2001-03-01, UAIC 13065.02](https://www.gbif.org/occurrence/925768667), [large-eye chub on 1999-12-19](https://www.gbif.org/occurrence/925765894). This expands September's single highlighted 1993 collection. The locality descriptions vary around Bible Branch Road; five dates do not necessarily mean five independent sites. Missing trout from selectively preserved museum material is not a survey-backed absence result. Upstream/nearby Clark Creek and Nolichucky main-stem trout records are not assigned to this tributary.

## 6. Dumplin: digitized fish lots exist

**Provider:** Cornell University Museum of Vertebrates Fish Collection, [dataset](https://www.gbif.org/dataset/3633e0e7-8c25-4c3d-b9c7-078c0be25665), CC0.

Three dated collections from **1952-11-13, 1953-03-05 and 1953-05-14** name Dumplin Creek on TN 92/Dandridge Highway roughly six miles from Jefferson City/Carson-Newman, Jefferson County. The 16 selected rows include northern hog sucker, white sucker, banded sculpin, snubnose darter, blacknose dace, stoneroller, creek chub. [Northern hog sucker, CUMV 44742](https://www.gbif.org/occurrence/3698475359) has a 90 m uncertainty radius.

September's “no fish lots digitized” result is superseded by these exact catalog references. Two November locality strings refer to the same date/near-identical point, so treat them as one collection date. All three dates are more than 70 years old and near one crossing. This supplies historical native-fish context; it cannot alone settle today's angling opportunity or a trout question. No contemporary smallmouth claim is promoted from these records.

## 7. Roaring River: vouchers add to restoration evidence

- **Minnesota/JFBM, 2006-08-11:** nine taxa at “Roaring River at Overton Road, 21 km due N of Cookeville,” Jackson County. Examples: [redline darter](https://www.gbif.org/occurrence/2266117493), [logperch](https://www.gbif.org/occurrence/2266149931).
- **Ohio State, 2007-04-27:** [OSUM 108987](https://www.gbif.org/occurrence/1212461263), named Roaring River off SR 136 in Overton County, records *Micropterus coosae*, collector/identifier and **8-foot seine/backpack electrofishing** protocol. OSUM data are CC BY 4.0. Preserve the historic determination; do not automatically make a modern Coosa-bass distribution claim from it.
- **Cornell, 1966-09-11 and 1965-06-11:** TN 136 and TN 135 Roaring River collections, including [smallmouth bass](https://www.gbif.org/occurrence/3698520487), add direct historic sportfish vouchers.

Together, the selected groups have 33 rows on four dates. These add positive fish evidence to September's restoration/undated-report account. Roaring Fork at Gatlinburg, Blackburn Fork, Spring Creek and other tributaries were excluded from the main-stem selection; geographically inconsistent county-only records were not used. Recommend retaining warmwater focus with dated evidence and limited currency, not upgrading to a fully current documented assemblage.

## 8. Nolichucky: newer program account, exact releases still missing

**USFWS, Rebekah Ewing, December 31, 2025:** [*Catching the Big One: Stocking Trophy Trout from Erwin National Fish Hatchery*](https://www.fws.gov/story/2025-12/catching-big-one).

The agency says: “Some of the fish are stocked locally by Erwin National Fish Hatchery staff in the Watauga and Nolichucky river systems.” It describes broodstock trophy trout and stocking after spawning; the story's Wilbur Lake photo is explicitly a Watauga reservoir example, not a Nolichucky release.

This is an additional, relatively recent program description beyond the September report's 2011/2017 TWRA accounts and 2022 release photo. **“River systems” is broader than a named main-stem reach.** The 2025 publication does not supply a dated Nolichucky release, exact location/count, a winter calendar, or a verified post-Helene resumption. Do not derive those from it. A search-engine AI overview asserted resumption and river-specific timing; the actual linked agency story does not establish those assertions, so they were rejected.

Keep the older exact main-stem release evidence and its dates; add this as a qualified program/currency corroboration. No year-round upgrade follows. [Original HTML, text and retrieval hash](../research/low-confidence-20261003/captures/usfws-erwin-trophy-trout-2025.source.json) are captured.

## Search quality, evidence limits and remaining work

**GBIF false-empty hazard reproduced:** on this retrieval, `taxonKey=204` in Tennessee returned **0**, and name matching `Actinopterygii` returned `NONE`, while the same-state centrarchid-family query returned **13,039** and the UA fish collection returned **8,910**. [Captured controls](../research/low-confidence-20261003/captures/gbif-search-controls.json). The failing class filter is not evidence of absent fish. The controls do not prove every September researcher used that filter or identify why it fails; individual old zeros require query-level audit before being corrected.

For discovery, eight single-word museum searches (Orchard, Reedy, Obey, Bradley, Chucky, Chuckey, Dumplin, Roaring) were fully paginated, filtering US/Tennessee, preserved specimens and Chordata. They returned **3,135 rows** including non-fish and wrong waters; exact locality/date/county selections produced the 170 reviewed rows. Broad keyword hits were never assigned merely because the name appeared somewhere in metadata. Captures retain taxonomy, museum lot IDs, coordinates/uncertainty, issues, provider licenses, query URLs and retrieval dates. Historical names were not silently updated.

For spatial checks, approximate point-to-segment distances were calculated against the committed simplified atlas trace. These are identity sanity checks, not independent survey locations, access determinations, or validation of every vertex. In particular, museum point precision does not override coordinate uncertainty.

**Negative evidence discipline:** the TVA survey has a documented method and species tables, supporting a scoped historical non-detection. Museum holdings are selective, so absent salmonid vouchers are only an absence of records in the selected holdings. No new fish-free or warmwater-only classification is recommended.

**Reach and currency gaps:** modern TWRA Region 3 Emory/Obey sampling would settle Crab Orchard and West Fork Obey; TWRA Region 2/Arnold AFB sampling would update Bradley; TWRA Region 4 Sullivan/Greene/Jefferson stream files would update Reedy, Little Chuckey and Dumplin; Region 3/Cordell Hull tributary surveys would update Roaring. Erwin NFH completed-release logs with location/date/count are the remaining source for the precise Nolichucky program. These are records-request targets only; no requests were sent.

**Failed/limited lanes:** direct tn.gov HTTP retrieval reset TLS from this host; no new TWRA schedule result is claimed. Direct Yale catalog retrieval failed certificate validation; preserved GBIF provider records were read instead without disabling certificate checks. General Crab Orchard web results were dominated by wrong-state waters and aggregators; none were used as fish-presence evidence. No new contemporary survey was located for the six museum-only waters. Fishbrain was not used for published evidence.

**Reuse:** UF's BY-NC rows remain research material; open UA/Yale/Cornell rows carry CC0; OSUM carries BY 4.0. Provider licenses are preserved per row and in dataset metadata. Attribution/reuse review remains necessary before any downstream production ingestion.

## Reproduction and checks

Evidence bundle: [`docs/research/low-confidence-20261003/`](../research/low-confidence-20261003/). The selections, quarantine and full weak-water baseline are machine-readable; [capture-manifest.json](../research/low-confidence-20261003/capture-manifest.json) hashes every capture. Original HTML is exempt from Git EOL normalization; normalized GBIF captures explicitly retain original response hashes and are not represented as raw response bodies.

From the repository root, with Python 3.12 and the standard library:

```text
python docs/research/low-confidence-20261003/collect-museum.py
python docs/research/low-confidence-20261003/assemble-evidence.py
```

The first command re-fetches live data and will change retrieval timestamps/hashes. The second rebuilds reviewed selections and manifest offline from committed captures. It asserts every reviewed locality/date group exists and that occurrence IDs are unique within each selected water. Curated row counts: **53 + 12 + 6 + 50 + 16 + 33 = 170**. All 8 discovery queries reached `endOfRecords`; the complete 53-water baseline was derived from the current 190-water ledger. The Crab Orchard PDF and material TVA methods/tables were visually checked. Final verification checks JSON parsing, capture hashes, curated group counts, and unchanged catalog/ledger/application files; no runtime tests are needed for this research-only addition.
