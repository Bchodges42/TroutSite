# Older EPA survey files close a Big Sandy fish-data gap

Research date: 2026-10-03. Branch: `codex/low-confidence-waterway-research-20261003`. This continues the [first October evidence pass](2026-10-03-low-confidence-waterway-research.md). Findings are research recommendations; catalog classifications and the fishery ledger were not changed.

EPA's separate fish-count and sampling-information downloads contain a **method-documented fish sample from the free-flowing Big Sandy River in 2019**, where the September research had located only benthic data. They also provide repeat lower-Nolichucky samples, a 2019 Clear Fork assemblage, and a precise correction to the previously cited Richland counts. Two tempting Memphis samples were rejected for the Nonconnah main stem after checking their upstream drainage.

## Findings and their limits

| Water | Verified evidence | Effect on the research question |
|---|---|---|
| Big Sandy River | 2019-06-12; 182 individuals, 26 positive taxon labels; 576 m of river sampled with barge electrofishing | Closes the missing upstream fish-list gap. Documents bass, catfish, and sunfish in the free-flowing river, beyond the previously supported reservoir embayment. |
| Nolichucky River, lower Cocke County reach | Comparable site coordinates sampled in 2008, 2014, and 2018; smallmouth and spotted bass recorded in all three visits | Supports an explicitly dated warmwater assemblage on this lower reach. Does not settle the seasonal trout opportunity near Erwin. |
| Clear Fork, Scott County | 2019-06-27; 262 fish across eight taxon labels, including 11 smallmouth bass | Adds a later main-stem assemblage to the older TVA/NPS material. The sampling record lacks primary-gear details. |
| Richland Creek, Elk tributary | Published 2008 count file has 40 positive labels and 1,065 individuals | Corrects the earlier approximate totals. Conflicting field-date columns are retained. This is corroboration, not a new trout discovery. |
| Nonconnah candidate | 2014/2018 fish visits on unnamed COMID 14199409, only about 64 m from the catalog line | Rejected for main-stem classification: connected upstream TDEC stations name an **unnamed Nonconnah tributary**. Proximity alone would have assigned the evidence incorrectly. |

### 1. Big Sandy: fish data exist for the exact visit previously thought benthic-only

The [September Big Sandy log](../research/low-confidence-20260924/big-sandy-river.md), section B1, located `NARS_WQX-NRS_TN-10149` at approximately 35.97202, -88.26059 and correctly recognized its WQP kick-net counts as invertebrates. It then stated that no fish file had been located and that NRSA fish files were restricted to boatable sites. The separate EPA downloads invalidate that restriction and close the fish-data gap.

The 2018–19 site table identifies the same visit as `NRS18_TN_10340`, stable `UNIQUE_ID=NRS_TN-10149`, collected **2019-06-12**. It names **Big Sandy River**, Carroll County, GNIS 1277382, HUC 06040005, COMID 10583469. The GNIS matches the catalog's 01277382. Its design coordinate is 35.97201929, -88.26058993, approximately 25 m from the committed river trace. This is the riverine reach, well upstream of the Kentucky Reservoir embayment, rather than the Virginia/Kentucky Big Sandy system.

The complete published fish table for the visit has 26 positive taxon rows totaling **182 individuals**. Sportfish counts include spotted bass 4, channel catfish 8, bluegill 14, longear sunfish 32, green sunfish 8, redear sunfish 1, warmouth 1, and freshwater drum 2. Other labels include northern hog sucker, longnose gar, grass pickerel, pirate perch, madtoms, shiners, darters, and least brook lamprey. No trout label occurs in this visit's fish-count rows.

The sampling file reports `LG_WADEABLE`, primary electrofishing gear `BARGE`, a final reach length and length fished of **576 m**, **4,064 seconds** of shock-button time, and `YES-SUFFICIENT` / sufficiency `Y`. The metadata explicitly defines the gear, distance, time, and temperature units. Field temperature was **17.6 °C**. That single June measurement describes this visit; it cannot establish annual thermal suitability or exclude trout elsewhere or in another season.

**Recommendation:** add an affirmative, reach-specific historical warmwater assemblage to the Big Sandy evidence. The ledger's supporting reach can extend beyond the embayment **at this sampled upstream reach**, with observation year 2019. Do not convert this one sample into a river-wide trout-absence claim or a present-day catch guarantee.

Primary EPA files: [fish counts](https://www.epa.gov/system/files/other-files/2022-03/nrsa-1819-fish-count-data.csv), [site information](https://www.epa.gov/system/files/other-files/2023-01/NRSA_1819_SiteInfo.csv), [sampling information](https://www.epa.gov/system/files/other-files/2022-03/nrsa-1819-fish-sampling-information-data.csv). Full preserved rows are in [reviewed-visits.json](../research/low-confidence-20261003-nrsa/reviewed-visits.json).

### 2. Nolichucky: the lower river has repeated warmwater samples, distinct from Erwin's stocking evidence

Three source visits identify the Nolichucky at essentially the same design coordinate, approximately **36.12508, -83.18162**, on the lower Cocke County main stem. The 2014/2018 tables explicitly identify GNIS 1326897, COMID 19488822, and HUC 06010108; the 2008 table names Nolichucky River and the same HUC. These are about 10–11 m from the catalog trace.

| Collection date | Site ID | Positive count labels | Individuals | Smallmouth bass | Spotted bass |
|---|---|---:|---:|---:|---:|
| 2008-09-07 | FW08TN015 | 39 | 1,047 | 11 | 9 |
| 2014-08-07 | TNR9-0905 | 24 | 290 | 5 | 2 |
| 2018-09-05 | NRS18_TN_10008 | 35 | 428 | 36 | 6 |

The 2018 source includes separate `LARGEMOUTH BASS` and `LARGEMOUTH BASS (YOY)` rows, both marked `IS_DISTINCT=0`. Therefore **35 labels is not 35 species**. Counts here preserve all individuals while avoiding an invented species-richness figure. The 2008 table includes a generic lamprey-ammocoete label, another reason to distinguish labels from species.

The 2018 sampling information reports large nonwadeable protocol, primary boat electrofishing, **2,600 m** fished, **4,466 seconds** shock time, sufficient sampling, and **26.5 °C** during the visit. The 2008 rows report electrofishing, boat gear, large-wadeable protocol, sufficient sampling, and a `FISHED` value of `5 to 9`; do not assume the entire prescribed reach was covered. No trout count appears in any of these three published visit lists.

**Recommendation:** describe the documented warmwater assemblage for the lower Cocke reach with these three dates. Keep the [2025 USFWS “river systems” stocking statement](2026-10-03-low-confidence-waterway-research.md) and the earlier Erwin winter-release evidence scoped separately. Lower-river summer samples neither contradict an upstream winter plant nor prove post-Helene recovery. These older surveys add no 2026 occupancy or access evidence.

Primary older files: [2008–09 fish collection data](https://www.epa.gov/sites/default/files/2015-09/fishcts.csv), [2008–09 sites](https://www.epa.gov/sites/default/files/2015-09/siteinfo_0.csv), [2013–14 fish counts](https://www.epa.gov/sites/default/files/2019-04/nrsa1314_fishcts_04232019.csv), [2013–14 sites](https://www.epa.gov/sites/default/files/2019-04/nrsa1314_siteinformation_wide_04292019.csv), plus the 2018–19 files above.

### 3. Clear Fork: a 2019 main-stem sample with incomplete gear metadata

`NRS18_TN_RF002` / `NRS_TN-10155`, **2019-06-27**, identifies **Clear Fork**, Scott County, GNIS 1305959, COMID 12153130, HUC 05130104. Design coordinate **36.3888, -84.68364** is approximately 2 m from the committed Clear Fork trace. This is the Tennessee Clear Fork in the Big South Fork drainage, not a same-name creek in another basin, and not the stocked Laurel Fork tributary.

The full count file has **262 individuals**, eight positive taxon labels: central stoneroller 1, river chub 12, rosefin shiner 30, rosyface shiner 6, smallmouth bass 11, striped shiner 7, Tennessee shiner 89, and whitetail shiner 106. No trout label is reported.

The site is **HAND**, a hand-selected/reference site rather than a probability site. The sampling table records large nonwadeable protocol, **1,160 m** final reach length, sufficiency `Y`, and **21.5 °C**. However, primary gear, length actually fished, shock time, and `SAMPLED_FISH` are blank. Thus the fish count is affirmative occurrence evidence, but the available metadata do not support claiming a particular capture tool or fully covered sampling reach.

The site table also gives `HUC8_NM=Lower Saline`, inconsistent with the numeric HUC and Scott County Clear Fork identity. That literal source value is preserved and flagged; it must not move the evidence to a different basin. The county, GNIS, numeric HUC, named stream, and coordinate jointly establish the reach despite this label defect.

**Recommendation:** add this later dated main-stem assemblage beside the [1968–69 and 2003–06 survey material](../research/low-confidence-20260924/clear-fork.md). It supports a historical smallmouth/shiner assemblage at this point. Missing effort metadata and one visit do not settle trout occupancy throughout the remote gorge.

### 4. Richland: correct the count precision and preserve the date discrepancy

The September [Richland Creek log](../research/low-confidence-20260924/richland-creek-maury.md) had already verified an agency smallmouth study and this EPA sample. This pass therefore claims **no new fishery discovery** for Richland.

The captured EPA 2008–09 file for `FW08TN024` contains **40 positive labels totaling 1,065 individuals**, rather than the log's approximately 39 labels / 1,200 fish. It includes smallmouth bass 4, spotted bass 15, largemouth bass 9, rock bass 21, bluegill 60, and longear sunfish 170. The named creek, HUC 06030004, and coordinate **35.06898411, -86.96136076** identify the lower Giles County Elk tributary (the catalog ID is `richland-creek-maury`), not a Richland in another watershed.

The site and fish `DATE_COL` fields give **2008-09-27**, while the fish table's `ACTLDATE` gives **2008-09-26**. Retain both. The table reports electrofishing, `BANK/TOW` gear, `LGWADE`, sufficiency `YES-SUFFICIENT`, and `FISHED=5 to 9`. This is a dated positive assemblage with a one-day source discrepancy, not a basis for silently selecting a more convenient date.

### 5. Nonconnah: a nearby tributary sample must not become main-stem evidence

The 2014 `TNSS-1064` and 2018 `NRS18_TN_10011` visits share design coordinate **35.07118, -89.85614**, unnamed GNIS, COMID **14199409**, and HUC 08010211. They have 93 and 236 individuals respectively, including bass, bullhead, sunfish, and a bluegill × green-sunfish hybrid. Their approximately **64 m** distance from the catalog's simplified Nonconnah line initially made them plausible main-stem leads.

USGS NLDI's [upstream main path](https://api.water.usgs.gov/nldi/linked-data/comid/14199409/navigation/UM/flowlines?distance=3) follows COMIDs 14199409 → 14199415 → 14199407. Its [connected WQP stations](https://api.water.usgs.gov/nldi/linked-data/comid/14199409/navigation/UM/wqp?distance=5) include `TDECWPC-NONCO4T0.5SH`, named **NONCONNAH CK - UT 1**, and `TDECWR_WQX-TNW000004523`, named **Nonconnah Creek Unnamed Tributary**, on that upstream main path. NLDI's [EPA site features](https://api.water.usgs.gov/nldi/linked-data/comid/14199409/navigation/UM/epa_nrsa?distance=5) link both fish visits to COMID 14199409.

**Decision:** preserve the visits as tributary context in [quarantined-visits.json](../research/low-confidence-20261003-nrsa/quarantined-visits.json). Do not use them to upgrade Nonconnah main-stem confidence. A near-channel coordinate, a shared basin, and repeated sampling cannot replace water identity. The raw identity checks and their hashes are saved in [identity-source-manifest.json](../research/low-confidence-20261003-nrsa/identity-source-manifest.json).

## Processing audit and reproducibility

Download links were read from the [EPA data index](https://www.epa.gov/national-aquatic-resource-surveys/data-national-aquatic-resource-surveys), which was labeled updated 2026-09-24 when retrieved. CSV bytes are preserved as deterministic gzip files; decompressing restores the exact original HTTP body. Companion metadata is preserved unchanged. [source-manifest.json](../research/low-confidence-20261003-nrsa/source-manifest.json) records URLs, retrieval times, response hashes, and saved-file hashes.

The published 2018–19 fish and sampling files date to **2022-01-27**, while the site CSV's publication field is **2022-06-02** (its present URL directory is 2023-01). These are separate from observation years 2018–19 and retrieval date 2026-10-03. The 2008–09 fish publication field is 2014-11-12 and site publication field 2015-09-01; the 2013–14 fish file is dated 2019-04-23. URL directory dates alone are not observation or publication evidence.

The 2018–19 fish file's old `UID` values disagree with the later site CSV in **all 30 Tennessee visits with count rows**. Blind UID joins would lose or misassociate valid fish data. The analysis instead joins **SITE_ID + VISIT_NO + normalized DATE_COL**, verifies uniqueness of site keys, and checks that every Tennessee fish row has an exact site/visit/date match. Both original UIDs remain in the output. The 2013–14 site CSV contains non-UTF-8 text elsewhere in the national table and is decoded as Windows-1252; original compressed bytes are preserved.

| Survey cycle | Tennessee site visits | Visits with count rows | Tennessee fish-count rows | Unmatched count rows |
|---|---:|---:|---:|---:|
| 2008–09 | 48 | 48 | 1,158 | 0 |
| 2013–14 | 33 | 32 | 612 | 0 |
| 2018–19 | 32 | 30 | 655 | 0 |

No count rows is not “no fish.” A positive count-label list is not necessarily a species list. A nondetection in a sufficiently sampled published visit is stronger than an empty museum search, but still applies to that visit and its effort, not every reach and season. All 113 Tennessee site visits and their source rows remain in [tennessee-visits.json](../research/low-confidence-20261003-nrsa/tennessee-visits.json); nearest-line results are explicitly **unreviewed discovery leads**. Six visits for four waters have been reviewed, and two visits quarantined. Source design coordinates use NAD83; reported catalog-line distances are approximate and are not access or habitat claims.

Offline reproduction from the repository root: run `docs/research/low-confidence-20261003-nrsa/analyze-nrsa.py` with Python 3.12. `collect-nrsa.py` refreshes live source captures and their manifest; running it later may retrieve revised EPA files. Verification for this pass included exact decompressed-body hashes, preservation of source fields, full Tennessee join coverage, all fish rows for the selected visits, taxon-count distinctions, coordinate/reach checks, and local-link validation. No application files changed.
