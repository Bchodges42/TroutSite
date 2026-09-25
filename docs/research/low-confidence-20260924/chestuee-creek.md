# Chestuee Creek — Trout Evidence Research Log
Water: Chestuee Creek (spelling variants "Chestua" historical; datasets checked — TWRA schedule/locations, USGS NAS, WQP, USGS NWIS — uniformly use "Chestuee"; no separate "Chestua Creek" water found; variants collapse onto one stream), McMinn County TN (lower course), Hiwassee River basin (HUC 06020002), one of the region's principal stream systems (TDEC river miles run to 45.2). Named tributaries: South Chestuee Creek (mostly Bradley Co) and Little Chestuee Creek (McMinn).
Research date: 2026-09-24. Internal classification research only; no agency/business/author contact.

## Reach definition
- **Flow path**: heads NE of Englewood (TDECWPC-CHEST045.2MM, 35.4335, -84.4616), flows SW ~45 river miles past Englewood, Zion Hill, and south of Athens (USGS gages 03565040 "Above Englewood", 03565120 "At Zion Hill", 03565200 "nr Athens (TVA)"), lower course at Dentville (USGS 03565250 "At Dentville (TVA)", 35.2827, -84.6088; TDECWPC-CHEST020.4MM / TDECWR_WQX-TNW000001138 at 35.2964, -84.6075).
- **Mouth**: Hiwassee River (Chickamauga-arm backwater) a few miles below the Dentville gage, in the Calhoun reach (Hiwassee RM ~20; NAS 1998 record anchors "Hiwassee River [Chickamauga] Reservoir at Calhoun boat ramp, 1 river km upstream"). Context queries ("near Calhoun") consistent; the exact confluence point (Calhoun vs. Conasauga/Riceville side) not pinned to coordinates — minor gap.
- **Key separation**: the stocked Hiwassee trout tailwater terminates at the Hwy 411 Bridge site (TWRA ArcGIS, Polk Co., Delano reach), ~10 river miles UPSTREAM of the Chestuee mouth. Chestuee Creek is entirely below the trout water, in warm reservoir-influenced Hiwassee/Chickamauga backwater.

## Sources

### S1. TWRA Trout Stocking Locations (ArcGIS FeatureServer layer, current full dump)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq.
- Retrieval: 2026-09-24 (730-row full dump + county queries).
- Findings: County='McMinn' returns exactly ONE feature: **"Athens Rec. Park / Athens Rec. Park Lake" — WaterClass=pond, Winter, rainbow, City management**. No "Chestuee"/"Chestua"/"Little Chestuee"/"South Chestuee" anywhere in the layer. Hiwassee River tailwater sites are all Polk County (different water from this creek's mouth reach).
- Type + confidence: Programmatic absence, high.
- Establishes: No TWRA trout stocking site on Chestuee Creek. The only McMinn stocked water is a city pond (attribute any "McMinn trout" hits to that pond).

### S2. TWRA 2026 Trout Stocking Schedule JSON
- Org: TWRA. Retrieval: 2026-09-24 (browser-context).
- Findings: McMinn rows only "Athens City Park Pond" (Winter, Rainbow Trout, 1/8/2026, 2/18/2026). **No Chestuee/Chestua rows; no Bradley rows.**
- Type + confidence: Programmatic absence, high.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

### S3. USGS NAS — McMinn County occurrence export
- Org: USGS/MARIS. Retrieval: 2026-09-24, https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=McMinn
- Findings: 9 records, **no Salmonidae**. Area records: Corbicula at Big Sewee Creek (1995), Conasauga Creek nr Mecca (1991), Hiwassee Reservoir at Calhoun ramp (1998), Rogers Creek (1965), Spring Creek (1969); American Shad 1876 "Eastanalbee [Eastanallee] River at Athens" (historical); no Chestuee Creek record at all.
- Type + confidence: Coverage gap + weak negative, moderate.
- Establishes: No salmonid record in county datasets spanning 1876–2022; Chestuee itself has no NAS record (museum sampling went to neighboring tributaries).

### S4. WQP — TDEC/USGS monitoring on Chestuee Creek (the strongest lane for this water)
- Org: TDEC (TDECWPC + TDECWR_WQX), USGS, TVA-cooperative gages. Retrieval: 2026-09-24 (County US:47:107 Station list, 363 stations; Result searches at 7 stations).
- Findings:
  - **TDECWR_WQX-TNW000001139** (Chestuee Creek): 553 results, years 2007, 2008, 2017, 2018, 2022, 2023 — chemistry + metals + RBP2 habitat + **benthic macroinvertebrate Counts**. Bio dates: 2007-10-11, 2008-06-18, 2017-12-11, 2022-09-15. **74 distinct benthic taxa** (Baetidae, Chironomidae, Heptageniidae, Hydropsychidae, Elmidae, Pleuroceridae/Elimia, Isonychia, Caenis...). No fish taxa; mercury hits are water-column chemistry, not tissue.
  - TDECWR_WQX-TNW000001140: 119 results, 2007/2013/2018/2024 — benthic + RBP2 habitat.
  - TDECWR_WQX-TNW000007903: 322 results, 2017/2018/2022/2023 — benthic + habitat + chemistry + E. coli.
  - TDECWPC-CHEST042.5MM: 471 results, 1999–2008 legacy chemistry/BOD/coliform; TDECWPC-CHEST020.4MM: 2006 chemistry; TDECWPC-CHEST045.2MM: 2003 field params.
  - USGS/TVA gage network 03565040–03565250 (TVA cooperation on lower Chestuee — monitoring interest, not fish surveys).
- Method/count: method-documented TDEC biorecon-style benthic + habitat surveys repeated across 17 years (2007–2024) at multiple mainstem stations, plus 25 years of chemistry; **no fish assemblage data in the portal**.
- Type + confidence: Method-documented survey (benthic) omitting fish = limited negative evidence for trout management; moderate weight. Official monitoring consistently treats Chestuee as a warm wadeable stream.
- URLs: https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000001139&mimeType=csv ; https://www.waterqualitydata.us/data/Station/search?countrycode=US&statecode=US%3A47&countycode=US%3A47%3A107&mimeType=csv

### S5. GBIF — Actinopterygii in bounding box (35.25–35.48 N, 84.80–84.45 W)
- Retrieval: 2026-09-24, https://api.gbif.org/v1/occurrence/search?taxonKey=204&decimalLatitude=35.25,35.48&decimalLongitude=-84.80,-84.45&limit=100 → **total = 0**. Coverage gap: no digitized museum fish specimens from the Chestuee drainage.

### S6. iNaturalist
- Salmonidae in bbox: **0** (retrieval 2026-09-24). Text queries q="Chestuee Creek", "Chestua Creek", "South Chestuee", "Little Chestuee" with taxon Actinopterygii: **0**.
- Type + confidence: Weighted negative, moderate.

### S7. Dated warmwater angler documentation
- Fishbrain "Chestuee Creek, Tennessee, United States": **6 logged catches; top species Channel Catfish and Common Carp** (surfaced via search 2026-09-24 on a Fishbrain page near Little North Mouse Creek, Athens TN, https://fishbrain.com). Type: LEAD (small count, single platform) but dated, user-reported warmwater species; consistent with TDEC warmwater program. No trout in any angler log surfaced.

### S8. TVA / reservoir context
- TVA Chickamaula Ecological Health monitoring assesses the reservoir inflow (fish assemblage at inflow location, tva.com — retrieved via search 2026-09-24); a search-engine summary claiming "Chestuee Creek has historically been included in TVA's tributary monitoring program" was NOT substantiated by any source in that result set (AI filler — treat as unverified). TVA's actual footprint on Chestuee is the cooperative USGS gages (S4).

## Searches run (incl. unproductive)
1. TWRA ArcGIS county + full-dump — productive (absence; only Athens pond in McMinn).
2. TWRA 2026 schedule JSON — productive (absence).
3. USGS NAS McMinn — productive (no Salmonidae; no Chestuee record).
4. WQP Station search (name substring "Chestu" 0 rows; county fallback 363 stations) — productive.
5. WQP Result searches at 7 Chestuee stations — productive (benthic taxa, dates, legacy chemistry).
6. WQP bio endpoint — 404 (unproductive path).
7. GBIF Actinopterygii bbox — 0 (coverage gap).
8. iNat Salmonidae bbox + 5 name queries — 0.
9. WebSearch TVA "Chestuee Creek" fish — no direct source; summary claim unverified (discarded).
10. WebSearch fishbrain "chestuee" fishing — productive (6 catches, Channel Catfish/Common Carp).
11. WebSearch "Chestuee Creek" mouth Hiwassee Calhoun — mouth consistent with Calhoun reach (exact confluence coords not pinned).
12. Wayback CDX for TDEC Hiwassee watershed plan / biorecon PDFs — rate-limited/empty repeatedly; tn.gov WebFetch ECONNRESET. Lane exhausted (noted for both waters).
13. USGS NWIS site metadata for 7 gages — productive (reach anchors).
14. TWRA Region 3 stream files — not publicly online; gap.
15. WebSearch "Chestua" spelling — no distinct water; variants collapse (context's both-appear note refers to historical usage).

## Contradictions
- Search-engine AI summary asserted historical TVA tributary fish monitoring on Chestuee; no primary corroboration found — discarded (only TVA-gage cooperation is documented).
- Search-engine AI summary asserted "Candies Creek is periodically stocked by TWRA" (adjacent-water check) — disproven by primary TWRA data (see candies-creek.md).

## Recommendation: WARMWATER-FOCUS
Reasoning: (a) No TWRA trout stocking site or schedule row for Chestuee Creek in either authoritative dataset; the only McMinn stocked water is Athens City Park Pond (a pond — attribute pond hits there); (b) the creek lies entirely BELOW the stocked Hiwassee tailwater terminus (Hwy 411/Delano), discharging into warm reservoir backwater near Calhoun — thermally incompatible with any trout program; (c) TDEC has run method-documented benthic/habitat monitoring on the mainstem at 4+ stations across 2007–2024 plus chemistry back to 1999, all under warm wadeable-stream program with no trout involvement; (d) zero salmonid records in NAS (1876–2022 county coverage), GBIF, or iNat. Residual uncertainty: no fish-community survey of the creek itself located (WQP carries no fish assemblage data; GBIF digitization absent; TWRA Region 3 stream files offline; TVA tributary monitoring claim unverified), so warmwater species composition rests on the small Fishbrain lead (Channel Catfish, Common Carp, 6 catches) rather than an agency species list. Not "seasonal-stocked" — TWRA's winter program stocks ponds (e.g., Athens City Park Pond), not this stream; not "trout" — no positive evidence of any kind.
