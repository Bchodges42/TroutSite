# Mouse Creek vouchers and Hiwassee tributary identity checks

Research date: 2026-10-03 (America/Chicago; some retrieval timestamps are 2026-10-04 UTC). This continues the [museum/TVA pass](2026-10-03-low-confidence-waterway-research.md) and [EPA survey pass](2026-10-03-nrsa-waterway-findings.md). Findings remain research recommendations; the catalog and fishery ledger were not modified.

**South Mouse Creek has a precisely described 2018 redbreast-sunfish collecting event, and North Mouse Creek has a 1936 collection with bass and sunfish.** These replace earlier museum-coverage gaps with positive observations. Candies has a much weaker historical sucker-family lead. Chestuee and Oostanaula search hits mostly belong to the receiving Hiwassee River; they must not strengthen the creeks' fishery classifications.

## Findings

### South Mouse Creek: one 2018 collecting event, six preserved fish and separate tissues

Yale Peabody Museum records **2018-08-30**, collectors **S. A. Baltimore and D. S. Stamey**, exact locality:

> South Mouse Creek, Hiwassee-Tennessee Drainage, NorthWest Lauderdale Memorial Hwy (Rd. 308) Crossing

The records identify Bradley County and coordinate **35.283977, -84.800803**, approximately 10 m from the committed South Mouse trace. The highway-crossing locality agrees with the September log's Hwy 308 station near 35.2842, -84.8008. This is South Mouse, not North Mouse, Little South Mouse, or the Missouri Mouse Creek.

All seven occurrence rows identify **Lepomis auritus**, redbreast sunfish. The [physical lot YPM ICH 033135.001](https://www.gbif.org/occurrence/2269134127) has `individualCount=6` and preparation **10% form.->70% alc.** Six other records, suffixes .002–.007, each have `individualCount=1` and preparation **tissue (undetermined)**. Full GBIF responses for all seven are preserved, allowing preparation-level review rather than relying on the discovery projection.

**Count interpretation:** report one event and one observed species, with a six-fish preserved lot and associated tissue entries. Do not sum the seven rows into 12 independently captured fish or seven separate surveys; the preparations do not establish those independent counts. None provides a sampling protocol or full assemblage list.

Although the coordinate lies close to the catalog line, the provider's uncertainty is **1,851 m**, with a georeference remark that the radius was inferred in 2024 from supplied coordinates. Retain the named crossing as the locality; do not present the encoded decimal coordinate as a precise capture point or a public access authorization.

**Recommendation:** replace “no digitized museum fish collection” with a dated, locality-specific redbreast-sunfish observation. This provides affirmative fish presence at the lower Hwy 308 reach in 2018. It does not establish bass, trout absence, current catch quality, public access, or the assemblage along the Cleveland Greenway upstream. Yale's published data license is **CC0**.

### North Mouse Creek: a 1936 main-stem collection distinct from nearby tributary lots

University of Michigan Museum of Zoology records **1936-09-25**, collector **AR Cahn (TVA)**, locality:

> North Mouse Creek, trib to lower Hiwassee River

The county is **McMinn**, coordinate **35.444563, -84.661895**, approximately 1 m from the catalog's North Mouse trace. The phrase “trib to lower Hiwassee River” describes North Mouse itself; it does not name a subordinate branch. Other records explicitly say **Spring Branch, N Mouse Creek** and **Arnwine Spring Creek, branch of N Mouse Creek** and are excluded from main-stem evidence.

The accepted group has **13 occurrence rows / 13 taxon names**. It includes [spotted bass, UMMZ 112516](https://www.gbif.org/occurrence/1889016820), [longear sunfish, UMMZ 112517](https://www.gbif.org/occurrence/1889016836), bluegill, golden redhorse, northern hog sucker, river chub, spotfin shiner, emerald shiner, striped shiner, warpaint shiner, bullhead minnow, bigeye chub, and central stoneroller under their source names. The spotted-bass full record reports preparation `EtOH - 1`; discovery rows generally lack individual counts, so 13 records is not a count of 13 fish.

The source flags **GEODETIC_DATUM_ASSUMED_WGS84** and provides no explicit coordinate uncertainty for this group. Its near-line coordinate supports identity alongside the county and locality; it does not justify modern reach precision. Historical names such as `Notropis amblops` are preserved rather than silently rewritten; GBIF also carries accepted species fields, including `Hybopsis amblops`.

**Recommendation:** add a positive historical bass/sunfish assemblage at this main-stem locality, with observation date 1936 and museum source. This closes the museum gap in the [September North Mouse log](../research/low-confidence-20260924/north-mouse-creek.md). It does not establish today's populations, a complete 1936 community, or trout nondetection. The museum data license is **CC BY 4.0**; attribution must accompany reuse.

### Candies Creek: a family-level historical lead with 19 km georeference uncertainty

[Academy of Natural Sciences lot ANSP 54480](https://www.gbif.org/occurrence/4521289664), collected by **H. W. Fowler on 1930-10-20**, has locality:

> Candes Creek, tributary of Hiwasse River near Cleveland.

The record is identified only to **Catostomidae**, the sucker family. It reports three individuals and preparation `3 alc; 0 sk; 0 c&s`. It is a fish voucher, not the queen-snake record that appears in the same search.

The encoded coordinate **35.173479, -84.90508** lies approximately 5 m from Candies' catalog trace, but the georeference explicitly says **Assumed at Candies Creek**, with **19,401 m uncertainty**. That five-metre apparent map match is a consequence of the assumption, not independent verification of a sampled reach. The original spelling and Cleveland/Hiwassee context make this a plausible historical Candies record, while the wide uncertainty and assumed name match keep it below the two Mouse Creek findings in confidence.

**Recommendation:** retain it in [qualified-leads.json](../research/low-confidence-20261003-hiwassee/qualified-leads.json) as a historical sucker-family lead. Do not infer a species, a full assemblage, trout absence, an exact bridge, or a current fishery. Its **CC BY-NC 4.0** license supports this attributed research capture; production reuse would require considering the noncommercial restriction.

### Chestuee Creek: correct the mouth location before assigning receiving-river observations

Fifteen fish search hits mentioning Chestuee explicitly identify **Hiwassee River** shoals “just above mouth of Chestuee Creek,” including [ANSP 148803](https://www.gbif.org/occurrence/4521239048), dated 1978-07-18. These are receiving-river observations, not Chestuee fish records. Several museums hold related lots from the same 1978 collections, so repeated holdings do not establish independent creek surveys.

They also exposed a location problem in the [September Chestuee log](../research/low-confidence-20260924/chestuee-creek.md), whose mouth discussion used Calhoun and the Dentville gauge rather than a verified confluence. The repository's raw USGS NHD named flowlines establish the junction at **35.225172, -84.685047**: Chestuee GNIS **01327906**, permanent identifier **133007352**, ends at the exact shared endpoint of Hiwassee GNIS **01328447**, identifiers **133007590** and **133007589**. This is roughly 10 km southeast of the Calhoun point used in the prior log.

The relevant raw flowlines and source metadata are preserved in [chestuee-mouth-identity.json](../research/low-confidence-20261003-hiwassee/chestuee-mouth-identity.json). The source is USGS NHD Best Resolution HU8 06020002, publication stamp **20231216**, converted into the repository in September 2026; this is hydrographic identity evidence, not a new fish survey. The source's shared junction is stronger evidence than using a downstream town or a gauge as a mouth proxy.

**Recommendation:** use this verified mouth when evaluating downstream influence and separating creek/Hiwassee records. Keep the 1978 fish lots excluded from Chestuee occupancy. No new main-stem Chestuee fish assemblage was located in this pass; that remaining gap must stay explicit.

### Oostanaula Creek: a 2019 collecting event below the confluence belongs to the Hiwassee

Yale's 2019-08-01 locality reads **Hiwassee River, Tennessee-Ohio Drainage, downstream of confluence of Oostanaula Creek. (TVA)**. It includes [river darter](https://www.gbif.org/occurrence/2446389267) and [bigeye chub](https://www.gbif.org/occurrence/2446389207), plus a second river-darter occurrence row. The wording binds the fish to the Hiwassee main stem; creek adjacency cannot transfer them to Oostanaula. Three other discovery results name the Conasauga River and carry a suspicious reused Middle Tennessee coordinate; those are excluded too.

**Recommendation:** retain these as receiving-river context only. They add no new Oostanaula Creek occupancy evidence beyond the earlier creek-specific TDEC tissue records. The 2019 date does not repair the wrong-water assignment.

## Processing and preserved evidence

Five fully paginated, Tennessee preserved-specimen Chordata searches returned **2,031 discovery rows**: Chestuee 16, Chestua 0, Candies 2, Oostanaula 6, Mouse 2,007. The Mouse term retrieves many mammals and unrelated collections; **2,007 results is not 2,007 creek fish**. Each locality, county, taxon, date, and coordinate was checked before admission. The [capture script](../research/low-confidence-20261003-hiwassee/collect-museum.py) reuses the first pass's explicit API controls and stores query URLs, original response hashes, page counts, and end-of-records flags. Projected discovery JSON is normalized; it is not the original full HTTP body. Selected full occurrence and dataset-metadata responses are additionally captured byte-for-byte with [supplemental-manifest.json](../research/low-confidence-20261003-hiwassee/supplemental-manifest.json).

The [reviewed record selection](../research/low-confidence-20261003-hiwassee/reviewed-records.json) contains **20 rows from two water-specific collecting events**. Candies is a separate qualified lead. [excluded-records.json](../research/low-confidence-20261003-hiwassee/excluded-records.json) preserves explicit receiving-river, tributary, different-river, and non-fish exclusions. These decisions can be inspected without repeating the broad search.

The older museum-coverage gaps in the September Candies/Mouse/Chestuee logs used `taxonKey=204`; the [first October pass](2026-10-03-low-confidence-waterway-research.md) demonstrated that this filter returns zero even where known fish vouchers exist. Empty results from that query cannot establish either an empty museum corpus or absence of fish. The corrected Chordata discovery query avoids that failure, while including non-fish that require explicit screening. Zero results for an alternate spelling such as Chestua do not establish absence under other names or outside the query's indexed state field.

Rebuild selections and capture hashes offline with `docs/research/low-confidence-20261003-hiwassee/assemble-evidence.py`. Source taxonomic names, georeference issues, licenses, and specimen/tissue distinctions remain in the bundle. Verification covered pagination completion, unique occurrence keys, exact full-response hashes, named NHD junction agreement, independent count interpretation, and report links. None of these records alone proves a present-day trout fishery or trout absence.
