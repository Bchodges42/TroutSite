# OBED RIVER (Cumberland/Morgan counties, TN) — Obed Wild & Scenic River (NPS OBRI)
Research log — internal classification research only. Retrieval date for all sources: 2026-09-25.
Prior-context being chased: "Obed contradiction CONFIRMED (warmwater, zero salmonids)" — re-verified and strengthened.

## REACH DEFINED
- NPS WSR designated reach (all segments, Pub. L. 94-486, Oct 12 1976; 45.3 mi total): Obed River from the western edge of Catoosa WMA to the Emory River confluence. Source: https://www.fws.gov/rivers/river/obed (FWS Wild & Scenic Rivers page, retrieved 2026-09-25). Statutory: 16 U.S.C. 1274(a).
- This log covers the Obed main-stem segment only. Daddys Creek, Clear Creek, and the Emory segment are separate logs (other files in this folder).

## SOURCES

### S1. NPS, "Fish — Obed Wild & Scenic River" (nps.gov/obed/learn/nature/fish.htm)
- Org/author: National Park Service, Obed WSR. Publication date: page footer "Last updated: April 14, 2015". Observation basis: NPS park natural-history page. Retrieved 2026-09-25 via curl.
- URL: https://www.nps.gov/obed/learn/nature/fish.htm
- Fields: full-text species coverage — Smallmouth Bass ("The most common game fish caught at the Obed WSR is the Smallmouth Bass"; "Most of the people who go fishing on Clear Creek, Daddy's Creek, and the Obed River will successfully reel in a smallmouth bass during the peak fishing seasons"), Muskellunge ("Several are caught at the Obed each year"), Carp, Shad, Flathead Catfish, Channel Catfish, Freshwater Drum, Crappie (black & white), Bluegill, Darters. Text search: "trout" = 0 hits, "salmon" = 0 hits.
- Method/count: interpretive page, no counts. Reach: Obed main stem + named tributaries.
- Type: agency interpretive species page. Confidence: moderate-weight (descriptive, not a survey).
- Establishes: warmwater gamefish identity of the river (smallmouth-centric), zero trout in NPS's own fish page. Does NOT establish: absence by survey (see S2/S3).

### S2. NPSpecies fish checklist for OBRI (IRMA API)
- Org: National Park Service IRMA / NPSpecies, unit OBRI. Observation dates: aggregated park list (through Scott 2010a surveys per NRCA). Retrieved 2026-09-25.
- URL: https://irmaservices.nps.gov/v3/rest/npspecies/checklist/OBRI/Fish
- Fields: 55 fish taxa. Families: Leuciscidae 17, Percidae 11, Centrarchidae 10, Catostomidae 6, Ictaluridae 5, Cyprinidae 2, Clupeidae 1, Esocidae 1, Lepisosteidae 1, Sciaenidae 1. Salmonidae: ZERO taxa (no Salmo, Salvelinus, or Oncorhynchus in list). Gamefish Present: muskellunge (Esox masquinongy ohioensis), rock bass, redbreast/green/bluegill/longear/redear sunfish, redeye bass (non-native), smallmouth bass, spotted bass, largemouth bass, freshwater drum, channel catfish, flathead catfish.
- Method/count: official NPSpecies park list (survey-supported, 49 of 55 native per NRCA). Reach: entire OBRI (all four segments).
- Type: broad method-supported agency species list. Confidence: high (weighted negative evidence).
- Establishes: no salmonid on the NPS official species list for the park. Strongest single negative.

### S3. Benck et al. 2017 — Natural Resource Condition Assessment, Obed WSR (NPS NRR-2017/1554, Nov 2017)
- Authors: Benck, S., et al. Org: NPS Water Resources Division. Retrieved 2026-09-25 via npshistory.com mirror.
- URL: https://npshistory.com/publications/obed/nrr-2017-1554.pdf
- Fields (fish chapter, pp. ~144-147): as of 2005 only 28 species documented (Riddle 1975, Emmott et al. 2005); after Scott (2010a, 2010b) surveys, 55 known species (Appendix G), 49 native. Obed River watershed: Russ 2006 sampled 5 sites on the Obed during 2004-2005, 32 species (incl. longnose gar, freshwater drum, largemouth bass; non-native redear sunfish); Scott 2010b sampled 10 Obed River sites 2004-2006, 40 species, 672+... (adds smallmouth buffalo; non-natives redeye bass, striped shiner). "trout" = 0 hits in 719k-char text; "salmonid" = 0; "coldwater" = 0.
- Underlying surveys (method-documented, dated): Russ, W.T. III. 2006. Current distribution and seasonal habitat use of the threatened spotfin chub in the Emory River watershed. MS Thesis, Tennessee Tech Univ. — ~4,000 fish, 13 sites, 2004-2005, all segments. Scott, E.M. Jr. 2010a. Fish survey of Obed Wild and Scenic River. NPS Appalachian Highlands Network unpublished report, Asheville NC. Scott 2010b = NPS fish surveys by site — OBRI (unpublished data).
- Also: muskellunge — "small population of the rare Cumberland Plateau strain..., maintained through annual stocking by the TWRA (Scott 2010a, NPS 2015b)" — TWRA manages the river for muskie, a warmwater/coolwater species. Federally threatened spotfin chub (Obed-Emory population one of four remaining) — a clear, warm upland-river species.
- Type: peer-reviewed NPS condition assessment citing method-documented agency/academic surveys with full species lists omitting trout. Confidence: high (weighted).
- Establishes: warmwater-fish fauna with survey-level negative evidence for trout.

### S4. TWRA 2026 trout stocking schedule (JSON) — zero Obed rows
- Org: Tennessee Wildlife Resources Agency. Data: current 2026 stocking datatable (616 rows per prior pass; retrieved in browser context 2026-09-25).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: Morgan County trout rows = Flat Fork Creek only (2/15, 3/8, 3/22, 4/12/2026, rainbow, Region 3); Cumberland County rows = Cumberland Mountain State Park (1/8, 2/18/2026, rainbow) and Sequatchie River. ZERO rows for the Obed, Emory, Clear Creek, Daddys Creek, or Rock Creek.
- Type: primary agency stocking dataset. Confidence: high.
- Establishes: no trout stocking program on the Obed main stem in 2026.

### S5. TWRA ArcGIS stocking layers (AGOL; StockedTrout2016 + Tailwater_Trout)
- Retrieved 2026-09-25 via ArcGIS REST query (796 rows StockedTrout2016; 13 rows Tailwater_Trout).
- URLs: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0 ; .../Tailwater_Trout/FeatureServer/0
- Fields: Only Obed-area trout sites = Flat Fork Creek (Morgan Co, Wartburg; 3 sites S1-S3; rainbow; "Spring Streams"; Managed by TDEC; phone (423) 346-3318 = Obed WSR HQ number) — Emory-drainage creek outside the Obed reach (see emory-river.md). NAME COLLISIONS: (a) Tailwater_Trout row "Obey River" (rainbow/brown/brook, Dale Hollow Dam tailwater, Region 3-ish east) is the Obey R., a different river; any "Obed trout" claim plausibly confused with the Obey tailwater. (b) StockedTrout2016 "Clear Creek" site = Norris Tailwater access, Anderson Co (Clinch R.), not the Morgan Co Clear Creek.
- Type: primary agency GIS data. Confidence: high.
- Establishes: no trout-stocking locations on the Obed in TWRA's point inventory.

### S6. USGS NAS — single legacy salmonid "record," literature-only
- Org: USGS Nonindigenous Aquatic Species. Retrieved 2026-09-25 (NAS API HUC8 06010208 query; 36 records).
- URL: https://nas.er.usgs.gov/api/v2/occurrence/search?huc8=06010208 (record key 158279; GBIF mirror https://www.gbif.org/occurrence/1896909861)
- Fields: Oncorhynchus mykiss (rainbow trout), Morgan Co, locality "Obed Wild and Scenic River," 1999, status "stocked," recordType "Literature," comment: "No data on abundance or residency within park." Reference: Tilmant, J.T. 1999. Management of nonindigenous aquatic fish in the U.S. National Park System (NPS Water Resources Div.; AFS 129th meeting paper — general management review, no Obed survey). Georef = "Map derived" park centroid (36.079239, -84.765223; same point reused for the 1999 carp/redbreast/redeye-bass/yellow-perch records), landing in the Daddys Creek HUC10.
- Type: single literature-derived lead, no specimen, no survey, centroid coordinates. Confidence: low. NOT counted as presence evidence; tested and not established.
- Establishes: the only salmonid line-item anywhere in the Emory HUC8 NAS data is this legacy literature mention — which itself asserts no residency data.

### S7. FWS Wild & Scenic Rivers page, Obed (rivers.gov content, now fws.gov)
- URL: https://www.fws.gov/rivers/river/obed — retrieved 2026-09-25.
- Fields: designated segments + 45.3 mi; "52 native fish species"; species of note: spotfin chub (federally threatened), tangerine darter, olive darter, ashy darter, native muskellunge, endemic Obed/Emory crayfish, eastern hellbender, "some of the most extensive and contiguous remnant habitat for the Cumberlandian aquatic species assemblage." No trout mentioned anywhere on the page.
- Type: federal agency river description. Confidence: moderate.
- Establishes: federal characterization as a Cumberlandian warmwater-native-fauna river.

### S8. Trout claims tested (chatter)
- AI search-summary claims encountered (untrusted, no underlying source found): (a) a "historic NPS Wild and Scenic River Study" allegedly says "smallmouth bass, trout, and catfish are occasionally taken" in the gorge — primary text (1970s Obed WSR study/FES) NOT located on npshistory, archive.org, or Wikimedia Commons; unverified legacy claim, likely copy-verbatim from other waters or a pre-designation generic statement. (b) "rainbow trout stocking occurs in the system, notably Daddys Creek" — directly contradicted by S4/S5 datasets. (c) "Obed/Emory watershed is known for stocked and wild trout water" — boilerplate, contradicted by S4/S5.
- Searches/sources: WebSearch "Obed Wild and Scenic River fish species list NPS inventory"; "Obed River Tennessee trout stocking"; '"Obed River" OR "Obed" Tennessee trout fishing smallmouth gorge'; 'npshistory Obed wild scenic river study 1975 trout "occasionally taken"'; "Obed River smallmouth bass fishing Wartburg whitewater trout forum" (rate-limited); Wikimedia Commons API + Internet Archive advancedsearch for the 1975 study; plus direct opens S1-S7.

## SPECIES FOUND vs OMITTED
- Found (S1-S3, S7): smallmouth bass (flagship), spotted/largemouth/redeye bass, rock bass, 5 sunfish spp., muskellunge (TWRA-stocked Cumberland strain), 2 catfish, freshwater drum, longnose gar, ~17 minnow spp. incl. spotfin chub, ~11 darters (tangerine, olive, ashy, gilt, logperch), suckers, gizzard shad. 55 taxa park-wide.
- Omitted: all Salmonidae — no trout/char/salmon in the NPSpecies list, the NPS fish page, the NRCA, the FWS page, or TWRA stocking data.

## VERDICT
Warmwater confirmed and strengthened. Method-documented surveys (Russ 2006: ~4,000 fish/13 sites; Scott 2010a/b: all segments 2004-2006; 55 spp. NPSpecies) omit trout entirely; TWRA stocks muskie, not trout; the single NAS rainbow line is literature-only, centroid-georeferenced, with "no data on residency." Prior "contradiction confirmed" verdict is re-verified. Residual contradiction risk = Obey River (Dale Hollow tailwater) name confusion.
Gaps: Scott 2010a full report not independently opened (NRCA citation + NPSpecies proxy); 1970s WSR study primary text unlocated.
