# Reedy Creek (Kingsport / Sullivan County, TN) — Evidence Research Log
Research date: 2026-09-24. Water: Reedy Creek, Sullivan County TN — urban Kingsport stream; rises near Blountville (US-11W mm 13 area), flows NW through Kingsport to the South Fork Holston River (mouth at Industry Dr / Netherland Inn Rd area). HUC-8 06010102 (SF Holston); NHD reachcodes 06010102000280 (mouth) … 06010102000295 (uppermost). Keep separate from: SF Holston main stem, Fort Patrick Henry TW/reservoir, and FIVE identity traps: (1) Reedy Creek, Bristol TN (South Holston tribs), (2) Reedy Creek, Carroll County TN, (3) Reedy Creek(s), NC (Warren Co. etc.), (4) Reedy Creek, WV (Roane Co.), (5) Reedy Creek, Washington County TN (Watauga HUC 06010103, on the 2026 303(d) list).

## PART 1 — In-hand records, re-verified online 2026-09-24

### 1.1 TWRA "Trout Stocking Locations in Tennessee" FeatureServer (LIVE, re-queried 2026-09-24)
- Item: "Trout Stocking Locations in Tennessee", owner TWRA_GIS, ArcGIS Online id 3ec5c58f99de4de5951f32b76b462623; service https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer layer 0 "Trout_MASTER_Project". 730 features total.
- The ONLY Reedy Creek row (OBJECTID 372, GlobalID 37053508-4fcd-4f3e-8868-fcc5c41b71a7):
  Site_Name "Sportsman Club- Reedy Creek- Kid'S Event"; StreamName "Reedy Creek"; Region 4; County SULLIVAN; City "Kingsport"; StockingProgram "Spring"; WaterClass "stream"; Species "rainbow"; NumStocked 1000; Management "Private Land"; no date fields in the schema (program-level site list, not a dated stocking history).
- Stored geometry 36.607826, -81.842692 — THIS POINT IS IN JOHNSON COUNTY ~60 km ENE of Kingsport (near Laurel Bloomery). The lat/long attributes are plainly bad even though the text attributes say Kingsport/Sullivan. DO NOT use this coordinate for reach mapping; the site identity is established by its attributes + corroboration in 2.1 below.
- Source type: agency dataset (program metadata). Confidence: high for site existence/program shape; low for geometry.
- Establishes: a TWRA kids'-event spring rainbow stocking site exists on Reedy Creek (Kingsport), nominal 1,000 fish. Does NOT establish: any particular year's completed stocking, holdover, or the exact reach.

### 1.2 Archived TWRA "recently stocked" JSON (Wayback 2024-06-07) — re-fetched 2026-09-24
- URL archived: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374 (capture 20240607134309). 54 rows, fields Region/Destination/Stocking Date.
- Row: {"Region":"4","Destination":"Reedy Creek","Stocking Date":" 05/10/2024"} — destination-level completed-release record; no species/count/reach.
- Context (this study): 05/10/2024 = the Friday before the 29th Annual Youth Trout Derby (Sat 05/11/2024, see 2.1) — near-certain event stocking. Only JSON capture of this endpoint in Wayback (checked 2026-09-24).
- Source type: agency completed-stocking table (archived). Confidence: high.

### 1.3 TWRA 2026 tentative stocking schedule (LIVE, fetched 2026-09-24)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json — 616 rows, fields REGION/COUNTY/LOCATION/TYPE/day/week/months/SPECIES.
- ZERO rows for "Reedy" or "Kingsport". Sullivan County rows = only the three SF Holston tailwaters (Ft Patrick Henry TW, S. Holston TW, Boone TW). Types present statewide: Winter 95, Seasonal 436, Tailwater 12, Delayed Harvest 34, Reservoir 3, Weekly 36.
- Reading: the kids'-event stockings (RequestFish program) are NOT carried in the tentative public schedule; Reedy Creek is not part of the regular adult-program stocking plan for 2026. Planned ≠ completed; absence from schedule is not absence of event stockings.
- Source type: agency planned schedule. Confidence: high.

### 1.4 TDEC Water Quality Portal (in-hand, unchanged)
- Station TDECWR_WQX-TNW000005066 (36.5539, -82.55; lower Reedy Creek near mouth): 35 benthic macroinvertebrate records (2004, 2008 kick-net) + 56 habitat records; NO fish.
- Re-verified 2026-09-24 via waterqualitydata.us: station has ZERO results under characteristicType=Fish; a bbox query (-82.62,36.50,-82.48,36.62) finds NO Fish-Tissue stations; HUC-8 06010102 has exactly ONE Biological-Tissue station (USGS-03474000, Middle Fork Holston, VA — upstream, different state). WQP holds no fish-community or fish-tissue data anywhere in the TN portion of the HUC.
- Source type: agency monitoring index (negative evidence, narrow). Confidence: high.

## PART 2 — NEW findings (this session)

### 2.1 TWRA "Youth Fishing Events" FeatureServer — the derby record (LIVE, queried 2026-09-24)  [KEY]
- Service: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/FreeFishingDay_UpdatedApril8/FeatureServer/0 (referenced by TWRA_GIS web map 351c2c41c22f4eb9979452653d7a079c "Youth Fishing Events for web app" and app 062a39301cb24f9390b75d675d017cef). 265 events. Fields include EventName, EventDate, Waterbody, Address, City, County, YouthNumber, AgeFrom/AgeTo, RequestFish ("yes" = TWRA asked to supply fish), Partners, ContactHost, CommentAll.
- ALL events with Waterbody = "Reedy Creek" (3):
  - 2021-05-08 "Outdoorsmen Inc Annual Trout Derby" — 26TH annual; 4535 Highway 11W, Blountville, Sullivan; 36.56978,-82.396386; 150 kids ages 4-12; RequestFish yes; host OutDoorsmen Inc. (contact William D Sampson); partners "TWRA, Mel-Bro's Tackle Box, Modern Woodment"; 9:00-11:30, bank fishing only, no wading, limit 4, adults can bait hooks but not fish; trophies for largest trout; free lunch, door prizes; clubhouse location; RemoveDate set (event is archived in service after occurrence).
  - 2023-05-13 "28th Annual Trout Derby sponsored by The Outdoorsmen Inc." — same venue, 36.570103,-82.395552; host contact David Bays; partners "Mel Bros Wholesale Bait"; RequestFish yes.
  - 2024-05-11 "29th Annual Youth Trout Derby" — same venue 4535 Hwy 11 W; County misspelled "Sullican"; host David Bays jr.; partners "TWRA, Bass Pro Shops, Melbros Wholesale Bait"; RequestFish yes; after-event water opens to licensed anglers at 2:00 pm.
  - NO 2022, 2025, or 2026 Reedy Creek entry is in the service (2022 gap unexplained; 2025-26 possibly purged after RemoveDate or event lapsed).
- Program context answer: TWRA (Region 4/Region5Fisheries staff curate the dataset) supplies trout on request (RequestFish=yes) for an ANNUAL club-run kids' derby on Reedy Creek; counted anniversaries put the first derby in 1996 (29th annual in 2024, 28th in 2023, 26th in 2021, 20th in 2015 per 2.2). This matches the FeatureServer kids'-event site (1.1) — nominal 1,000 spring rainbow — and the 05/10/2024 destination-level completed record (1.2), stocked the day before the 29th derby.
- NHD corroboration of venue: Reedy Creek (GNIS 01299165) large-scale flowlines sit within ~2 km of 36.570,-82.396 (reachcodes 06010102000291/-292/-293) — the clubhouse is on the UPPER reach of the SAME stream that flows through Kingsport (see 2.6). The "Blountville" address vs TWRA's "Kingsport" city attribute is reconciled by Kingsport city limits extending along US-11W toward Bristol (Blountville postal address); the TWRA site-coordinate error (1.1) is a data-quality artifact.
- Source type: agency event dataset + agency-curated club event. Confidence: high. Establishes: who runs it (Outdoorsmen Inc., TWRA partner/supplier), how long (since 1996 by anniversary count), annual cadence (with a 2022 gap in the record), scale (≤150 kids, 4-fish limit), reach (upper Reedy Creek at clubhouse). Does NOT establish: surviving fish after events, fish in the Kingsport (lower/middle) reach.

### 2.2 TWRA 2015 derby flyer (Wayback capture 2015-04-12 of http://www.tn.gov/twra/events/troutderby15.pdf)  [KEY]
- "20th Annual Trout Derby — Sponsored by Outdoorsmen Inc. — Saturday, May 9th 2015 … at the Outdoorsmen Inc. Clubhouse located on the right at mile marker 13 going toward Bristol from Kingsport at 4535 Highway 11W." Free, ages 4-12, first 150 kids, trophies heaviest + longest trout, Mel-Bro's bait, bank fishing only, no wading, limit four, no over-12 fishing until 2:00 pm (license + trout stamp 13+).
- Anniversary math: 2015=20th, 2021=26th, 2023=28th, 2024=29th → FIRST DERBY 1996. Same venue/rules across a decade of flyers.
- Source type: agency-posted club event flyer (archived). Confidence: high.

### 2.3 Other TWRA archived items checked 2026-09-24 (Wayback)
- TWRA calendar page "Outdoorsmen Annual Trout Derby" 2021-05-08 (capture 20210506220218): page body not text-recoverable from capture wrapper (JS), but existence of a TWRA calendar listing corroborates 2.1's 2021 row.
- Stocked-trout season schedules sched10.pdf (2010-05-29 capture), sched11.pdf, sched12.pdf, sched13.pdf, stockedtrout.html (2010-05-29), stockedtrout 2012-13.html (2013-01-10): pdftotext/grep — ZERO "Reedy" matches in any. Sullivan-area stockings in those seasons were tailwater programs. Reedy Creek was NOT on the published regular stocking lists 2010-2013.
- TWRA "childrens-trout-rodeo" and "outdoorsmen-trout-derby" event URLs (2016 captures, redirects) — not text-recovered.
- TWRA "Region 4 2010 Trout Fisheries Report" PDF (capture 20110711182552, 9.3 MB): zero "Reedy" mentions (tailwater-focused).
- Source type: agency historical docs. Confidence: high for the negative schedule finding 2010-2013.

### 2.4 USGS / NAS (Sullivan County) — queried 2026-09-24
- USGS NWIS station USGS-03487601 "REEDY CREEK BL ROACH BR NEAR KINGSPORT, TN" (36.5562, -82.5654; HUC 06010102; drainage 57.4 sq mi; site type ST). No current daily-values series online (0 time series via waterservices 2026-09-24) — a physical/hydrologic reference point on the LOWER reach; no fish relevance. Confirms "Reedy Creek" as the official USGS name at Kingsport (distinct from Bristol's Reedy Creek).
- USGS NAS API (county=Sullivan, state=TN): 169 records; 130 Salmonidae — ALL in SF Holston River/Fort Patrick Henry Reservoir/Boone Lake/South Holston (incl. Rainbow Trout at Fort Patrick Henry Reservoir 36.4984,-82.5077; Brown Trout MARIS centroid records 36.49-36.50,-82.51-52). ZERO records with "Reedy" in locality. NAS holds no fish records for Reedy Creek at all (not even warmwater).
- Source type: federal datasets (negative/narrow). Confidence: high.

### 2.5 iNaturalist (queried 2026-09-24)
- Fish (Actinopterygii, taxon 47178) in bbox 36.53-36.62 / -82.58 to -82.38: 18 research-grade observations, ZERO trout. Locally relevant:
  - Rock Bass Ambloplites rupestris, 2026-06-01, 36.56904,-82.39641 (obs 386879189, research grade) — EXACTLY at the Outdoorsmen clubhouse pool on upper Reedy Creek, 2.5 weeks after the (2026) derby season; suggests warmwater resident or survivor in the clubhouse pool. https://www.inaturalist.org/observations/386879189
  - Creek Chub Semotilus atromaculatus, 2023-08-31, 36.55252,-82.49675, "Suffolk St, Kingsport" (obs 181058119) — on the middle/lower Reedy Creek corridor.
  - Western Mosquitofish x5 in Kingsport 2020-2025 (incl. "Kingsport Greenbelt Trail Head" 2022-05-15, 36.54346,-82.48656).
  - American Gizzard Shad (Eastman area 2022), Eastern Shiners (Long Island 2023), Flathead Catfish (Forest View Rd 2020, 36.5896,-82.5306 — possibly off-stream pond/SF Holston).
  - Darters/Smallmouth Bass obs in bbox are in Virginia reaches (Weber City / NF Holston) — NOT Reedy Creek.
- Rainbow trout (taxon 47516) in the wider Sullivan-area bbox (36.40-36.75 / -82.75 to -82.2): only 3 obs — NF Holston Hiltons VA 2026-05-02; Bristol TN 36.5926,-82.2536 2023-12-28 (east of Bristol, not Reedy); Natural Tunnel VA 2016. NONE on Reedy Creek despite ~1,000/yr event plants — consistent with full post-event harvest (kids' 4-fish limit) rather than absence of stocking.
- GBIF (queried 2026-09-24): 0 ray-finned fish occurrences in the tight Reedy Creek bbox; GBIF full-text "Reedy Creek" hits are the NC/Carroll-TN/WV identity traps.
- Source type: citizen-science occurrence data. Confidence: medium (effort-biased). Supports: warmwater community present; no observed trout. Does NOT establish absence of trout.

### 2.6 Stream course / reach anchoring (NHD large scale, queried 2026-09-24)
- National Map NHD MapServer layer 6: gnis_id 01299165 "Reedy Creek" — reachcodes 06010102000280/281/282/283 (lower, Kingsport, mouth at SF Holston), 284-289 (middle), 290-295 (upper, Blountville/US-11W clubhouse area). One continuous named stream from clubhouse to mouth.
- Mouth anchoring: Facebook comment on Kingsport Times-News post (retrieved via search 2026-09-24): "Reedy Creek enters the Holston River at Industry Drive and Netherland Inn Road" — matches NHD lower reach + TDEC station location + USGS gage location.
- Source type: federal hydrography + local media comment. Confidence: high (NHD), medium (comment).

### 2.7 Water quality / regulatory status (not fish presence, but context)
- City of Kingsport MS4 Annual Report (2017; surfaced via search 2026-09-24, not yet opened directly): Reedy Creek assessment unit TN06010102046_1000, 5.42 mi, Sullivan County, impaired — cause "Loss of biological integrity" (consistent with TDEC benthic-only monitoring and urban channelization).
- TDEC South Fork Holston Watershed Water Quality Management Plan (2006) (https://www.tn.gov/content/dam/tn/environment/water/archive/wr-ws_watershed-plan-sfholston-gp3-2006.pdf; fetched 2026-09-24, pdftotext): ZERO "Reedy" mentions in extracted text — unproductive for fish lists.
- A second TDEC station TDECWR_WQX-TNW000005061 on Reedy Creek exists in WQP (surfaced 2026-09-24; not yet profiled in detail).
- Source type: regulatory labels. Confidence: medium (MS4 quote via search summary). NOT evidence of species presence.

### 2.8 Local/industry touches
- OnWater fishing app listing "Reedy Creek Fishing in Tennessee" (surfaced 2026-09-24; not opened in detail) — generic app page, no dated evidence retrieved.
- Yelp/boat-tour noise: "1034 Reedy Creek Rd, Bristol, TN" — IDENTITY TRAP (Bristol's Reedy Creek), do not conflate.

### 2.9 Outdoorsmen Inc. club website (LIVE, fetched 2026-09-24) — derby continues through 2026  [KEY]
- https://outdoorsmeninc.com/ — announces the club "will host it's 31st Annual Youth Trout Derby, May 9th 2026" at "4535 Highway 11w Blountville, Tn 37617"; "This event is FREE!!"; "Every registered child gets a new prize at our Trout Derby"; club "FOUNDED IN 1952"; the derby is "AN ANNUAL TROUT DERBY, WHICH IS OUR FLAGSHIP YOUTH PROGRAM". Contact for youth activities: Daniel Lawson (423) 408-0753; club Facebook https://www.facebook.com/outdoorsmeninc. No TWRA mention on the landing page (TWRA role documented in TWRA's own dataset, 2.1).
- Anniversary chain now: 20th=2015, 26th=2021, 28th=2023, 29th=2024, (30th=2025), 31st=2026-05-09 → FIRST DERBY 1996, run continuously ~29-31 years. This post-dates the youth-events service purge (no 2025/2026 rows there), showing the service retains only past events with RemoveDates.

### 2.10 TDEC 2026 Final 303(d) List (xlsx fetched 2026-09-24)
- File: https://www.tn.gov/content/dam/tn/environment/water/watershed-planning/wr_wq_303d-2026-final.xlsx (EPA approval 2026-07-23). Sheet "06010102 (SF Holston) - G3":
  - TN06010102046_1000 "Reedy Creek", Sullivan, 5.42 mi: Sedimentation/Siltation, Other Anthropogenic Substrate Alterations, E. coli — MUNICIPAL (URBANIZED HIGH DENSITY AREA).
  - TN06010102046_2000 "Reedy Creek", 7.99 mi: Alteration in stream-side vegetative covers, Sedimentation/Siltation, E. coli — urbanized + grazing in riparian zones.
  - TN06010102046_3000 "Reedy Creek", 6.00 mi: Vegetative covers, E. coli — grazing.
  - Tributaries _0500/_0600 (unnamed tribs to Reedy Creek, 1.8/3.88 mi) similar; _1200 flow-regime modification (dam/impoundment).
  - Total mainstem impaired ≈ 19.4 mi ≈ the whole stream. No fish-consumption or thermal cause listed.
- IDENTITY TRAP found in the same file: TN06010103061_1000 "Reedy Creek", Washington County (Watauga HUC 06010103), 10.7 mi — a THIRD Tennessee Reedy Creek; do not conflate.
- Regulatory-history note: the impairment line dates back at least to the 2002 303(d) list (surfaced in search; not fetched), cause "loss of biological integrity" in the 2017-era MS4 citation — benthic-based, consistent with TDEC's benthic-only sampling.

### 2.11 Local color / greenbelt reach (searched 2026-09-24)
- Kingsport Greenbelt (~10.6-mi paved trail) runs along Reedy Creek and the Holston River (Komoot/TrailLink descriptions; kingsporttn.gov Regional Bicycle and Pedestrian Plan references a nine-mile trail along Reedy Creek). The urban lower/middle reach = the greenbelt corridor.
- Blue Ridge Country Magazine Jan/Feb 2026 photo caption: belted kingfisher scanning Reedy Creek along the Kingsport Greenbelt for fish (fliphtml5.com) — evidence of the corridor's public identity, not of species.

## PART 3 — Synthesis
- What is SOLID: Reedy Creek (Kingsport) has hosted a TWRA-supplied kids' trout event annually since 1996 (by anniversary count), run by Outdoorsmen Inc. with TWRA as fish supplier/partner, ~150 kids, bank fishing at the clubhouse on the UPPER reach; nominal 1,000 spring rainbow in the TWRA site table; a completed destination-level stocking 05/10/2024 (day before the 29th derby); and the 31st annual confirmed for 2026-05-09 on the club site. No regular adult stocking program appears in the 2026 tentative schedule; none appeared in the 2010-2013 published schedules.
- What is SOLID negative: no fish data at all in WQP for the TN side of the HUC; TDEC's Reedy Creek monitoring is benthic/habitat only; NAS/GBIF/iNat contain zero trout records for Reedy Creek; iNat's 18 warmwater research-grade fish obs span 2019-2026 and none are trout (survey evidence OUTSIDE stocked windows/reach supports warmwater-dominant community; the single Rock Bass at the clubhouse pool 2026-06-01 suggests warmwater residency at the event site between derbies).
- What is MISSING: any full community fish survey (TDEC fish bioclassification, TVA tributary monitoring, academic) of the Kingsport reach; any dated catch report of a trout (or warmwater fish) from the Kingsport greenbelt reach; 2025/2026 derby continuation records; TWRA event-stocking completion sheets (Region 4 fisheries office would hold per-event receipts).
- Identity traps kept separate: Bristol TN Reedy Creek; Carroll Co TN Reedy Creek; NC Reedy Creeks; WV Reedy Creek. TWRA's own point coordinate (-81.84) is wrong; use attributes + NHD.

## Searches / queries run 2026-09-24 (incl. unproductive)
1. TWRA 2026 tentative schedule JSON fetch+parse (616 rows; no Reedy/Kingsport) — productive (negative).
2. Wayback CDX tn.gov/twra trout URLs — productive (sched PDFs, derby flyer, reports).
3. WebSearch "TWRA Reedy Creek kids fishing event Kingsport trout" — productive (derby lead).
4. WebSearch ""Outdoorsmen" "Youth Trout Derby" Kingsport Reedy Creek 2024" — productive (gooutdoorstennessee listing).
5. WebSearch "Kingsport Times-News "Reedy Creek" trout derby OR fishing rodeo kids" — partial (Church Hill rodeo noise; Creek Life Lure FB 2023 hatchery-pond derby note).
6. WebSearch ""Reedy Creek" Kingsport fishing trout "Times-News"" — productive (mouth-at-Industry-Dr comment; Holston park story).
7. Wayback 2024 recently-stocked JSON re-fetch — re-verification.
8. GBIF occurrence search q="Reedy Creek" US — ID-trap noise only.
9. WQP Result/Station queries (station 05066 fish; bbox fish tissue; HUC fish; BIODATA) — JSON 406 blocked, CSV works; productive negatives. Unproductive lanes: characteristicType=Fish (invalid type → 0 rows), providers=BIODATA endpoint (error).
10. iNaturalist taxa + observations (Actinopterygii, O. mykiss) — productive.
11. ArcGIS Online search TWRA trout stocking / owner:TWRA_GIS — productive (found both services).
12. Youth Fishing Events FeatureServer queries (full dump; Waterbody LIKE %REEDY%; Sullivan recent) — productive [KEY].
13. TWRA Trout Stocking FeatureServer live query — re-verification [KEY].
14. NHD large-scale flowline queries (name-based bbox — first attempt failed with 0; gnis_id-based bbox succeeded) — productive.
15. USGS NAS API county=Sullivan — productive negative.
16. TDEC 2006 SF Holston watershed plan fetch + grep "Reedy" — unproductive (0 mentions).
17. USGS NWIS 03487601 site/dv/stat — productive metadata, no series.
18. WebSearch TDEC "Reedy Creek" TMDL/watershed — productive (MS4 2017 impairment line; 2006 plan).
19. WebSearch Tennessee 303(d) 2024 Reedy Creek — productive (TDEC reports page; WQP station 05061; USGS 03487601; status StoryMap).
20. WebSearch timesnews.net Outdoorsmen trout derby 30th/31st — unproductive (rate limits, no hits).
21. Fishbrain explore page fetch — unproductive (JS-rendered).
22. WebSearch "Kingsport" "Sportsman" club "Reedy Creek" trout — unproductive (Yelp noise).
23. WebSearch site:license.gooutdoorstennessee.com Outdoorsmen — re-confirm 2024 listing.
24. pdftotext greps of archived sched10-13, stockedtrout html 2010 & 2012-13, Region 4 2010 report — productive negatives.
25. WQP Sullivan countycode station list — unproductive (0 rows; param quirk).
26. TNM/NHD layer listing + sanity checks (Holston) — productive (method validation).
27. WebFetch outdoorsmeninc.com — productive [KEY] (31st annual 2026-05-09; club founded 1952; flagship youth program).
28. WebFetch TDEC water-quality publications page — productive (2026 303(d) xlsx URL; 2024 305(b) PDF; status StoryMap).
29. TDEC 2026 303(d) xlsx fetch + openpyxl row extraction — productive [impairment detail; Washington Co. ID trap].
30. WebSearch "Reedy Creek" Kingsport fishing youtube/fishbrain/forum — unproductive (no dedicated pages).
31. WebSearch Kingsport Reedy Creek greenbelt/history — partial (greenbelt corridor confirmed; no channelization detail).
32. WebSearch TVA/eDNA Reedy Creek monitoring — unproductive (no Reedy-specific TVA/eDNA product).
33. WebSearch "Reedy Creek" Kingsport trout catch 2023-2025 — unproductive (no dated catch reports; other states' Reedy Creeks dominate).
34. DuckDuckGo HTML search attempts (derby coverage, Fishbrain) — blocked by CAPTCHA/redirect; unproductive.
35. VertNet/FishNet2 direct — not separately queried; GBIF (aggregates most museum-network data) returned 0 fish occurrences in the Reedy bbox; treated as covered by lane 8.

## Recommendation
SEASONAL-STOCKED (event-stocked rainbow trout, spring, upper reach near the Outdoorsmen clubhouse) with a warmwater-dominant community the rest of the year and downstream — not a resident/wild trout water, not a regularly stocked adult fishery. Rationale: 28+ years of documented annual TWRA-supplied kids' derby stockings (since 1996), a TWRA site table entry (1,000 spring rainbow, kids' event), a completed 05/10/2024 stocking matching derby eve; against that, zero trout records in any occurrence dataset (NAS/iNat/GBIF), zero fish monitoring in WQP, TDEC benthic-only monitoring with loss-of-biological-integrity impairment, and no regular-schedule presence 2010-2013 or in 2026 — i.e., trout presence is event-scale, post-harvest fleeting, and reach-limited. Confidence: medium-high for the stocking program; medium for "not holdover-grade" (no winter holdover study exists publicly).
Key remaining gap: a TWRA Region 4 event-stocking record/completion sheet or dated photos of derby catches from 1996-2025 (settled record holders: TWRA Region 4 fisheries office, Russell Young/ region 4 trout biologist; Outdoorsmen Inc. club archives; Times-News photo archives). Secondary: any TDEC fish-community sample of lower Reedy Creek (TDEC Field Office monitoring planner).
