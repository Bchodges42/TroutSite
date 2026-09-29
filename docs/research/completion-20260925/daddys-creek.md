# DADDYS CREEK (Cumberland County, TN — Obed headwaters; NPS segment above Obed confluence)
Research log — internal classification research only. Retrieval date for all sources: 2026-09-25.
Reach: two reaches must be kept distinct — (1) the NPS Wild & Scenic segment: Daddys Creek from the Morgan County line down to the Obed confluence (inside OBRI); (2) the Cumberland County headwaters upstream (Hebbertsburg/Antioch Bridge gauge area, US-70 corridor, Lake Tansi outlet country) which are OUTSIDE the park. Claims are tested per reach.

## SOURCES

### S1. Benck et al. 2017 — NPS Natural Resource Condition Assessment, Obed WSR (NRR-2017/1554)
- Retrieved 2026-09-25: https://npshistory.com/publications/obed/nrr-2017-1554.pdf
- Daddy's Creek fish passages (p. 145): (a) "Russ (2006) sampled two locations along Daddy's Creek within OBRI during 2004, and identified a total of 19 species. The general species composition was similar to Clear Creek [darters, sunfish, bass, shiners], and the redbreast sunfish was again the only non-native species found." (b) "Thirteen fish species were documented by Scott (2010b) during 2004 sampling at one Daddy's Creek location... Fewer species were observed, particularly shiners... Scott sampled only one upstream location."
- Underlying surveys: Russ, W.T. III 2006 (TTU thesis; spotfin chub in the Emory watershed; ~4,000 fish/13 sites 2004-2005); Scott, E.M. Jr. 2010a/b (NPS Appalachian Highlands Network fish survey 2004-2006).
- Whole-document text-mining: "trout" = 0; "salmonid" = 0; "coldwater" = 0 (719,360 characters).
- Type: NPS assessment citing method-documented dated surveys (2 + 1 sites, 19 + 13 species) omitting trout. Confidence: high (weighted).
- Establishes: warmwater fauna (similar to Clear Creek's minnow-darter-sunfish assemblage) on the park segment in 2004.

### S2. NPSpecies fish checklist OBRI
- Retrieved 2026-09-25: https://irmaservices.nps.gov/v3/rest/npspecies/checklist/OBRI/Fish — 55 taxa; no Salmonidae family; covers the Daddys Creek NPS segment. Confidence: high.

### S3. NPS fish page (nps.gov/obed/learn/nature/fish.htm, updated 2015-04-14)
- Quote names the creek directly: "...go fishing on Clear Creek, Daddy's Creek, and the Obed River will successfully reel in a smallmouth bass during the peak fishing seasons." Species roster (smallmouth, muskie, carp, shad, catfishes, drum, crappie, bluegill, darters) contains no trout. Retrieved 2026-09-25.

### S4. USGS NAS — the single salmonid line-item, tested and rejected for this reach
- NAS API HUC8 06010208 (36 records): https://nas.er.usgs.gov/api/v2/occurrence/search?huc8=06010208 — Oncorhynchus mykiss, year 1999, status "stocked," recordType "Literature," locality "Obed Wild and Scenic River," county Morgan, coordinates 36.079239,-84.765223, comment "No data on abundance or residency within park," source Tilmant, J.T. 1999 (NPS Water Resources Division general management paper, AFS 129th meeting).
- Critically: NAS's HUC10 label for this record is "Daddys Creek" (0601020802) / HUC12 "Lower Daddys Creek" — but the coordinates are the reuse of the OBRI park-wide centroid (identical coordinates on the 1999 carp, redbreast sunfish, redeye bass, yellow perch records). So this is NOT a Daddys Creek collection; it is a centroid-georeferenced literature line with no residency data. Test result: does NOT establish trout (or any occurrence) on Daddys Creek. Confidence: low; negative-evidence context (NAS's only salmonid item in the whole HUC8 is this non-survey line).
- Also in NAS HUC10 Daddys Creek: freshwater jellyfish (Lake Tansi, Seven Springs Lake — headwater impoundments), Hydrilla, Oreochromis sp. — no salmonid collections.

### S5. TWRA stocking datasets — zero Daddys Creek trout
- (a) 2026 stocking JSON (retrieved 2026-09-25 in browser context): https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json — Cumberland County trout rows = Cumberland Mountain State Park (rainbow, Jan/Feb) and Sequatchie River (rainbow, Mar/May). No Daddys Creek rows.
- (b) TWRA ArcGIS StockedTrout2016 (796 pts) + Tailwater_Trout (13 rows): no Daddys Creek sites. (Tailwater "Obey River" trout row = Dale Hollow tailwater, different river.) Confidence: high.
- Establishes: no trout stocking on Daddys Creek in current TWRA data; the web-chat claim "rainbow trout stocking occurs... notably tributaries like Daddys Creek" is directly contradicted by the agency's own datasets.

### S6. Trout chatter tested
- WebSearch '"Daddys Creek" OR "Daddy's Creek" Tennessee trout fishing whitewater' (retrieved 2026-09-25): surfaced whitewater identity (Class II-IV; "Daddys Creek Canyon" run; USGS gauge near Hebbertsburg/Antioch Bridge; NPS river-gauge page https://www.nps.gov/obed/planyourvisit/river-gauge-readings.htm) and the FWS segment description. The AI-generated search summary asserted "strong trout populations" and "cold, clear water favorable to trout" with NO underlying source; the underlying results contain no trout documentation. Contradicted by S1-S5. Not established.
- Searches/sources run (distinct): that WebSearch; NRCA text-mining; NPSpecies API; NPS fish page; NAS HUC8 API + record inspection; TWRA JSON; TWRA ArcGIS; FWS rivers page; GBIF Cumberland-box salmonid query (rainbow iNat pins at 35.895,-85.010 [2026-05-10, Fairfield Glade side, not the creek] and 35.7425,-84.6052 [2024-12-28, box edge near Watts Bar — outside the Daddys reach]); 16 U.S.C. 1274 reach text. Total >= 10.

### S7. Reach/legal
- FWS Wild & Scenic page https://www.fws.gov/rivers/river/obed: Daddys Creek "from the Morgan County line to its confluence with the Obed River" — i.e., the park segment is the LOWER, Morgan-line-to-mouth portion; the Cumberland County headwaters are outside. 45.3 mi total; 52 native fish; no trout in species narrative.
- Headwater-impoundment context in Cumberland Co (Lake Tansi, Seven Springs Lake NAS records) = pond/lake country, not trout river habitat; no Daddys Creek trout sources found for the headwaters either.

## SPECIES FOUND vs OMITTED
- Found (park segment, 2004): 19 spp. (Russ 2006, 2 sites) and 13 spp. (Scott 2010b, 1 upstream site) — same warmwater guild as Clear Creek (shiners, darters, sunfish; single non-native = redbreast sunfish). NPS frames the creek as smallmouth water.
- Omitted: all Salmonidae on every dated list.

## VERDICT
Warmwater-focus CONFIRMED. Dated method-documented NPS/TTU surveys (2004) enumerate 13-19 species on the creek with zero salmonids; TWRA's own stocking records contain no Daddys Creek trout rows (current or 2016 point inventory); the only salmonid line-item in the entire HUC8 is a centroid-georeferenced literature mention explicitly lacking residency data; the "Daddys Creek is a trout stream" chatter traces to no citable source and is contradicted by all agency data. The creek's documented recreational identity is whitewater paddling and smallmouth fishing.
Gaps: no survey of the Cumberland County headwaters reach located (park surveys stop at the NPS boundary); TDEC 303(d) profile not pulled (would likely corroborate warmwater habitat classification but was not needed for the verdict).
