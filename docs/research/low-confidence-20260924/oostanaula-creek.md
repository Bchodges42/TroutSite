# Oostanaula Creek (McMinn County, TN) — Trout-Stocking Evidence Research Log

Water: Oostanaula CREEK, McMinn County, TN — substantial Hiwassee River tributary rising NE of Athens (headwater TDEC station 35.4705, -84.5535), flowing through Athens (Athens nodes 35.4310, -84.5909 / 35.4522, -84.5825 per OSM Nominatim), thence SW ~14 mi to the Hiwassee River (Chickamauga Lake arm) near Calhoun (Calhoun 35.2965, -84.7480; lower-most main-stem TDEC station TDECWR_WQX-TNW000004650 at 35.2996, -84.7274). DISTINCT from the Oostanaula RIVER of Georgia (Resaca/Rome) — all GA "Oostanaula" fish records encountered belong to the river and are excluded/flagged.
Research date: 2026-09-24 (all retrieval dates = 2026-09-24).
Ledger state: unresolved — nothing documented either way.
Researcher constraint: research only; no agency/business contact; no writes except this file.

## HEADLINE

No trout evidence exists for the CREEK in any lane checked — and the single trout datapoint in the corridor binds to a stocked POND. TWRA's only McMinn County trout rows (2026 schedule + master site layer) are a winter rainbow program at the Athens park POND (schedule name "Athens City Park Pond"; site layer "Athens Rec. Park Lake", 35.45931, -84.63931 — the Regional Park pond off Decatur Pike; county media name both). The corridor's one iNat trout observation (rainbow, 2026-04-14, research grade) plots ~160 m from that TWRA pond site — i.e., AT the pond, not the creek. The creek itself has dated in-creek warmwater documentation (TDEC fish-tissue collection 2009: rock bass + bluegill at station TNW000004652), an iNat warmwater presence, and zero salmonid trace in TWRA schedules (2003-2026), GBIF/museum records, WQP, or angler content. Recommended call: warmwater-focus, with the adjacent seasonally-stocked pond explicitly excluded from the creek.

## REACH DEFINITION / MOUTH GEOMETRY

- Entirely in McMinn County. Corridor and mouth pinned by TDECWR_WQX stations (WQP station search by bBox, 2026-09-24): 24 creek-named stations spanning 35.4705 N (headwaters NE of Athens) to 35.2996 N at the lower reach; impaired segment "Oostanaula Creek Mile 28.4-31.2" (Athens STP reach) per TDEC 305(b)-derived sources implies a ~30-mi river-mile system.
- Mouth: enters the Hiwassee River near Calhoun (35.2965, -84.7480); corroborated by GBIF mollusc lot locality "Oostanaula Creek To Hiwassee River" (Tennessee; dataset 821cc27a) and station TNW000004650 sitting ~1 km NE of Calhoun. Hiwassee at this point is the Chickamauga Reservoir headwater arm.
- Identity guard: every Georgia record matching "Oostanaula" (Rome, Calhoun GA, Resaca, Gordon/Floyd Co.; incl. GA DNR lake-sturgeon stocking "Fish stocked in Oostanaula River by GA DNR at GA Hwy 140", 2003) is the Oostanaula RIVER — different water, excluded.

## SOURCE-BY-SOURCE LOG

### A. Agency stocking program evidence (highest weight)

A1. TWRA live 2026 Trout Stocking Schedule JSON (616 rows)
- Org: TWRA. Retrieved 2026-09-24. URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- McMinn County rows (2, verbatim): {"REGION":"3","COUNTY":"McMinn","LOCATION":"Athens City Park Pond","TYPE":"Winter","STOCKING DAY":"1/8/2026","SPECIES":"Rainbow Trout"} and {"STOCKING DAY":"2/18/2026", ... same}.
- ZERO "Oostanaula" rows; zero creek rows in McMinn County.
- Type: official current schedule. Confidence: HIGH. Establishes: only a WINTER POND program in McMinn; no creek stocking in 2026.

A2. TWRA ArcGIS TWRA_Trout_Stocking_Locations master layer
- Retrieved 2026-09-24: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query — County='McMinn' returns 1 site: OBJECTID 684, Site_Name "Athens Rec. Park", StreamName "Athens Rec. Park Lake", Winter, POND, rainbow, Athens, 35.45931, -84.63931. Layer-wide Site_Name/StreamName LIKE '%Oostanaula%': ZERO rows (of ~730 sites).
- Coordinate tie-break: 35.45931, -84.63931 is the Athens REGIONAL Park pond (off Decatur Pike), not the downtown City Park pond (City Park is near the creek on the E side of Athens; Regional Park is NE of town). Schedule naming ("Athens City Park Pond") and media naming are inconsistent; the SITE COORDINATE binds the program to the Regional Park pond.
- Type: official site master. Confidence: HIGH. Establishes: the only stocked trout site in the county is the pond; no Oostanaula Creek site exists in the layer.

A3. Corroborating media (search snapshots, 2026-09-24; articles not fetched)
- Fox Chattanooga (Dec 2023): TWRA stocked Chattanooga-area waters plus "Athens City Park" in past winter seasons. Daily Post Athenian: TWRA trout stockings at the "Athens Regional Park pond". NewsChannel 9 winter schedule listing: "Athens City Park Pond (McMinn)" 1/8/2026 and 1/20/2026. All name the same POND program (naming flips between City/Regional park across sources).
- Type: media corroboration of the pond program; establishes the pond's stocked status over multiple seasons; no creek claim.

A4. Archived schedules (Wayback, retrieved 2026-09-24; pypdf)
- 2003 (http://web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf), 2018, 2019, 2020 schedules: grep Hamilton|McMinn|Chickamauga|Oostanaula|Athens|Soddy → NO McMinn/Athens/Oostanaula rows in any of the four years.
- Type: archived official schedules. Confidence: HIGH. Establishes: no historic (2003/2018/2019/2020/2026-checked) trout schedule row for anything in McMinn County except the 2026 pond.

### B. The single trout datapoint — attributed to the POND

B1. iNaturalist observation 350092275 — Oncorhynchus mykiss, 35.45896, -84.63761, "Decatur Pike, Athens, TN, US", observed 2026-04-14, research grade, user "beingjeannie". https://www.inaturalist.org/observations/350092275
- Distance to TWRA pond site (35.45931, -84.63931): ~0.0004 deg lat (~40 m) x ~0.0017 deg lon (~150 m) = ~160 m → INSIDE Athens Regional Park, i.e., the TWRA-stocked pond. Observed 2026-04-14, ~8 weeks after the last scheduled 2026 winter plant (2/18/2026) — consistent with a holdover/carryover from the pond stocking (or an angler fish photographed at the pond).
- Type: crowdsourced photo observation; SINGLE record. Weight: LEAD only, and it is a POND record regardless. Establishes: nothing for the creek. It is the only trout observation in the entire wide corridor envelope (35.24-35.55, -84.80 to -84.55; iNat taxon_name=Oncorhynchus mykiss query returned exactly this one).

### C. Fish surveys / species lists (weighted negative evidence)

C1. iNaturalist fish observations, corridor bbox (35.24-35.55, -84.80 to -84.55)
- Retrieved 2026-09-24 via https://api.inaturalist.org/v1/observations?taxon_id=47178 + bbox, quality_grade=any, geo=true. 30 fish observations: Lepomis macrochirus 4, L. macrochirus x cyanellus 2, Percina caprodes 2, Cottus carolinae 2, Ictalurus punctatus 2, Percina uranidea 2 (35.3262, -84.5656 / 2022; 35.3925, -84.5947 / 2019 — lower-corridor coordinates), Etheostoma simoterum 2, E. zonale 1, L. gulosus 1, Campostoma oligolepis 1, Semotilus atromaculatus 1, L. microlophus 1, Gambusia affinis 1, Percina versicolor 1 (probable mis-ID), L. cyanellus 1, Micropterus nigricans 1, Cyprinus carpio 1, Etheostoma sp. 1, Leuciscidae 1 — plus the B1 pond trout.
- Other-waters context: Huso fulvescens (lake sturgeon) casual obs 2008-03-21 at 35.4427, -84.6320 (Athens) — Hiwassee-reservoir stocking species showing up far from the river; casual grade, 2008, no photo reviewed; not trout-relevant, noted only as corridor noise.
- Type: crowdsourced; LOW observation pressure (30 obs) vs S-Chick's 1,148. Confidence: LOW-MEDIUM as negative evidence — thin coverage means non-detection is weak. Salmonids other than B1: zero.

C2. GBIF / museum records
- Retrieved 2026-09-24 via https://api.gbif.org/v1/occurrence/search?q=%22Oostanaula%20Creek%22&country=US (288 locality-matched records reviewed).
- TENNESSEE-side "Oostanaula Creek" records: ALL non-fish — birds at "EG Fisher Library" and "Veterans Memorial Park beside Oostanaula Creek" (Athens; iNat 2016, dataset 4fa7b334), stonefly Allocapnia recta (2009, dataset 68513375), snail Ryloviella pilosa "Oostanaula Creek To Hiwassee River" (dataset 821cc27a). ZERO museum fish records from the creek — the UT/APSU/Tulane fish-collection lane simply never sampled it (gap, not proof).
- GA-side flag: all fish/mussel "Oostanaula" records (Rome, Calhoun GA, Resaca, Shannon, Plainville; 1886-2018) are the GEORGIA Oostanaula RIVER — excluded. Includes GA DNR's 2003 lake-sturgeon stocking in the river.
- Salmonids: ZERO for the creek in any collection.

C3. WQP / TDEC (TDECWR_WQX)
- Stations: 24 creek-named stations (see Reach Definition). Retrieved 2026-09-24 via https://www.waterqualitydata.us/data/Station/search?organization=TDECWR_WQX&bBox=-84.80,35.24,-84.55,35.55&mimeType=csv.
- DATED IN-CREEK FISH DOCUMENTATION: station TDECWR_WQX-TNW000004652 "Oostanaula Creek" (35.35089, -84.67217) — fish-TISSUE results, 2009: Ambloplites rupestris (rock bass, 10 rows) and Lepomis macrochirus (bluegill, 10 rows). TDEC's tissue-contaminant program collected these warmwater fish FROM the creek in 2009. No salmonid taxa anywhere in the creek's WQP record.
- Benthic-biorecon context: TDEC biorecon/single-habitat reaches on the creek documented in 305(b)-derived sources — "Oostanaula Creek Mile 28.4" (2010 305(b) Report) and Denton 2004 (TDEC Division of Water Pollution Control) listing Mile 28.4-31.2 (2.8 mi, Athens STP reach; fecal-coliform TMDL per EPA NEPIS source). Biorecon protocol is benthic-focused; no fish list surfaced.
- Type: agency monitoring data. Confidence: HIGH for the 2009 warmwater fish collection; the creek lacks a full method-documented species-list survey in accessible records.

### D. Contradictions / traps (resolved)

- "Athens City Park Pond" vs "Athens Rec. Park Lake": same winter program, naming inconsistent across TWRA schedule, site layer, and media; coordinates bind it to the REGIONAL Park pond. Either way it is a POND — any "Athens trout" claim is the pond program, not the creek.
- Georgia Oostanaula RIVER: distinct water; all GA records flagged and excluded (see B2/C2).
- Fishbrain lists an "Oostanaula Creek near Athens, TN" page (generic angler reports; no species list or trout claim retrieved).

## SEARCHES RUN (Oostanaula; unproductive ones marked)

1. TWRA 2026 JSON McMinn/name grep — productive (A1).
2. ArcGIS layer County='McMinn' + layer-wide LIKE '%Oostanaula%' — productive (A2).
3. Wayback schedules 2003/2018/2019/2020 grep (McMinn/Athens/Oostanaula) — productive-negative (A4).
4. WebSearch 'Chattanooga trout stocking park pond TWRA winter' — productive (pond attribution; Athens pond media trail).
5. WebSearch '"Athens City Park" trout stocking Tennessee' — productive (A3; Daily Post Athenian "Athens Regional Park pond", NewsChannel9 schedule).
6. WebSearch '"Oostanaula Creek" trout' — UNPRODUCTIVE for trout (only Fishbrain page + GA river content; search backend rate-limited twice, retried).
7. GBIF q="Oostanaula Creek" country=US — productive (C2; zero TN fish; GA-river records flagged).
8. GBIF polygon/taxonKey fish query — UNPRODUCTIVE (API taxon-key resolution broken this pass; see S-Chick log item 7).
9. USGS NAS API v2 county query (McMinn) — UNPRODUCTIVE: endpoint 404s (site redesign); NAS lane not covered.
10. iNat corridor bbox fish scan + targeted Oncorhynchus/Huso/Percina uranidea queries — productive (B1, C1).
11. WQP station bbox search — productive (reach definition; 24 stations).
12. WQP creek-station result/tissue queries — productive (2009 rock bass/bluegill tissue at TNW000004652).
13. WebSearch '"Oostanaula Creek" McMinn fish biorecon/electrofishing' — productive-negative (benthic biorecon reaches only; no fish survey or trout claim).
14. Nominatim geocode (creek nodes, Calhoun) — productive (reach definition). GNIS/National Map service — UNPRODUCTIVE (504s).
15. TVA lane: no Oostanaula-specific TVA fish monitoring located (Chickamauga embayment study 1990 is reservoir-scoped).

## RECOMMENDATION: warmwater-focus (creek); the Athens park pond is a separate, seasonally-stocked water

Reasoning: No trout row or site exists for the creek in any TWRA year checked (2003-2026 schedule lane + master site layer); the county's only trout program is a WINTER POND plant at the Athens park pond, and the corridor's single trout observation sits ~160 m from that pond's TWRA site point (attributed to the pond; carryover timing consistent with the 2/18/2026 plant). The creek's only dated in-creek fish record is TDEC's 2009 warmwater tissue collection (rock bass, bluegill); museum coverage is absent (a gap, not a positive); iNat and angler content show warmwater only. Confidence in "no trout program on the creek" is HIGH; the ecological-absence call is capped at warmwater-focus (rather than stronger) because no method-documented full species-list survey of the creek was located — the negative rests on program absence plus thin observational coverage. If a catalog cites trout for "Athens," re-attribute to the pond (seasonal-stocked pond), not the creek.
