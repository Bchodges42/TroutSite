# Sale Creek — Trout Evidence Research Log
Water: Sale Creek (Hamilton County lower reach, rises in Rhea County; Chickamauga Reservoir tributary; HUC 06020001). NAME TRAP handled throughout: **Sale Creek the water** (USGS/TDEC stations "SALE CREEK"/"SALE CK") vs **Sale Creek the town/community** (Hamilton Co., on the embayment; station names like "SALE CREEK NEAR SALE CREEK", "SALE CREEK AT SALE CREEK", "ROCK CREEK AT SALE CREEK" embed the town name; "SALE C AT GRAYSVILLE" is the upper water in Rhea). Also distinct: **Sale Creek Utility District** (USGS-94706500007, a water-utility org record, NOT a stream station) — do not count as monitoring. Unrelated namesake: Sale Creek in other states does not exist in TN datasets; no Sale River/Sale Branch confusion found.
Research date: 2026-09-24. Internal classification research only; no agency/business/author contact.

## Reach definition
- **Flow path**: heads in Rhea County near Graysville (USGS 03566287 "near Graysville", 35.4767, -85.0727, 8.1 sq mi; USGS 03566290 "at Graysville", 13.2 sq mi; TDEC SALE010.4RH / SALE011.3HM at 35.45–35.51, -85.05..-85.07), flows southeast into Hamilton County (USGS 03566292 "near Sale Creek", 35.4265, -85.0900, 57.2 sq mi; TDEC SALE003.3HM / SALE007.7RH at 35.4266, -85.0899). TDEC river miles run 001.2 (mouth) to 011.3 (upper).
- **Tributary**: Rock Creek (38.1 sq mi, USGS 03566300 "at Sale Creek", 35.3862, -85.1083) joins in the lower reach at/near the community.
- **Mouth**: Sale Creek embayment of Chickamauga Reservoir (Chickamauga Lake) at the community of Sale Creek — TDECWPC-SALE001.2HM = TDECWR_WQX-TNW000005381 at 35.3659–35.3667, -85.0672..-85.0678 (35.373, -85.062 approx. town). Fly-fishing/kayak coverage (saltwateronthefly.com; Kayak Angler, surfaced via search 2026-09-24) describes the Sale Creek arm as an upper-Chickamauga "creek arm" with stump fields/shallow flats — classic bass/panfish water.

## Sources

### S1. TWRA Trout Stocking Locations — ArcGIS FeatureServer (live 2026 layer)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq, layer TWRA_Trout_Stocking_Locations (730 rows).
- Retrieval: 2026-09-24. Query `UPPER(StreamName) LIKE '%SALE%'` → **0 features**. Hamilton cross-check: only North Chickamauga Creek, Big Soddy Creek, Lake Junior (pond, Winter), Jack Dickert Pond (Winter, East Ridge). No embayment or creek-arm stocking site.
- Type + confidence: Programmatic absence, high.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query

### S2. TWRA 2026 live stocking schedule JSON
- Org: TWRA. Retrieval: 2026-09-24. Full dump, 616 data rows (REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/WEEK/SPECIES); regex `sewe|\bsale\b` over all rows → **0 hits**; no Hamilton County creek-arm or embayment row (Hamilton winter program rows are city ponds; nearest stream rows are Piney River, Rhea).
- Type + confidence: Programmatic absence, high.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

### S3. Archived TWRA schedule PDFs — complete sweep (same documents as big-sewee-creek.md S3/S6)
- Grepped for `\bsale\b` in: sched03–sched15 (2003–2015, 13 annual "Tentative Trout Stocking Schedule" PDFs, captures listed in the Sewee log), wintertrout.pdf 2013/14, stockedtrout 2012-13 HTML, Trout Management Plan 2006 (32 pp), 2018/2019 schedules, and the 2020 Trout-Stocking-Schedule-Complete.pdf (all seven 2021–2025 "captures" byte-identical replays of 2020, md5 a9f34ad75f89…). All fetched 2026-09-24.
- Result: **zero "Sale" stream rows in every document** (sole "Sale" string in the corpus is citation author "M.J. Sale" in Trout_Plan_06). Hamilton is represented (N Chickamauga Creek) wherever the region appears, so the negative is meaningful.
- 2016/2017 schedules: not archived under any tested name — 2-year archive gap.
- Example URLs: https://web.archive.org/web/20150319003402/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched15.pdf ; https://web.archive.org/web/20200424033427id_/https://www.tn.gov/content/dam/tn/twra/documents/Trout-Stocking-Schedule-Complete.pdf
- Type + confidence: Programmatic absence across all archived program years, high (2016–2017 gap noted).

### S4. Winter trout program context (Hamilton County)
- Live layer (S1) + news (Chattanoogan.com 12/3/2024 & 12/31/2025; WTVC/Local3News/Fox Chattanooga 12/2021–11/2025, via search 2026-09-24): Hamilton County winter trout sites are **Lake Junior (TVA pond) and Camp Jordan pond (East Ridge)** — urban ponds only. No winter stocking of Sale Creek or its embayment in any year surfaced.
- Type + confidence: Programmatic absence, high.

### S5. USGS NAS county export (Hamilton)
- Retrieval: 2026-09-24, https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Hamilton — 79 records, **zero Salmonidae** (reservoir plankton/clams, carp etc.).
- Type + confidence: Weak negative + coverage gap, moderate.

### S6. GBIF museum fish survey (the strongest biological record)
- Retrieval: 2026-09-24, https://api.gbif.org/v1/occurrence/search?q=Sale%20Creek&country=US&limit=300 and lot-level query "Rock Creek on Leggett Road".
- **University of Alabama Ichthyology Collection, collected 2000-06-06, "Rock Creek on Leggett Road, downstream of mouth of canyon, 1.5 mi W of Sale Creek"** (Rock Creek = Sale Creek tributary, NWIS 03566300): vouchered lots of **Cyprinella galactura, Etheostoma simoterum, Etheostoma rufilineatum** — method-documented stream fish survey, complete returned list, **no Salmonidae**. Exact-phrase GBIF query `"Sale Creek"` with class filter returned 0 (fuzzy q required); classKey=204 query returned 0 (wrong key — both unproductive attempts noted).
- Non-fish GBIF context: terrestrial snail lots (FMNH, 1961–1968) "3 mi NE/S/S of Sale Creek" — town-referenced collecting history, not fish.
- Type + confidence: Meaningful negative evidence (vouchered survey omitting trout), moderate-high for Rock Creek; indirect for Sale Creek mainstem.

### S7. iNaturalist
- Retrieval 2026-09-24. Refined valley box 35.33–35.47 N / -85.16..-85.00 W: **31 fish taxa, 0 observations attributable to Sale Creek proper are trout.** Species: Percina caprodes/versicolor/aurantiaca, Etheostoma blennioides/simoterum/zonale, Nothonotus rufilineatus, Micropterus dolomieu/nigricans, Nocomis micropogon, Cyprinella galactura, Cottus carolinae, Hypentelium, Moxostoma carinatum/duquesnei, Ambloplites rupestris, Lepomis spp., plus embayment residents (Lepisosteus oculatus, Aplodinotus, Pylodictis, Ictalurus furcatus). Two apparent trout hits resolved AGAINST Sale Creek: (a) Oncorhynchus mykiss ×3 at 35.304, -85.17/-85.18 = **Big Soddy Creek (Jones Gap Rd, Soddy Daisy)** — the stocked DH stream 6+ mi south, outside the valley; (b) **Salmo trutta, 2012-10-21, geotagged -85.0102, 35.4101, place_guess "Hiwassee River, Tennessee 37308"** — the Hiwassee put-grow-take fishery, not Sale Creek (https://www.inaturalist.org/observations/16536378, casual grade). One Osphronemus goramy (released aquarium fish) — noise.
- Places autocomplete "Sale Creek": no iNat place (unproductive).
- Type + confidence: Weighted negative, moderate.

### S8. WQP / TDEC monitoring (station + result profile; csv mimeType — json returns HTTP 406)
- Stations: Hamilton: TDECWPC-SALE001.2HM = TDECWR_WQX-TNW000005381 (mouth, 35.3667,-85.0678), SALE003.3HM = TNW000005382 (35.4266,-85.0901), SALE007.7RH; USGS 03566292/03566297. Rhea: SALE010.4RH = TNW000005383, SALE011.3HM = TNW000005384, TNW000005385 (UT spring), TNW000005386, TDECWPC-SALE010.4RH/011.3HM.
- Results (2026-09-24): TNW000005381 (mouth) 8 results 2012; **TNW000005382 272 results 2004–2024, 30 benthic taxa (Perlodidae, Leptophlebiidae, Rhyacophilidae, Heptageniidae, Lepidostomatidae, Elmidae, Stenonema…), no fish taxa, no salmonids**; TNW000005383 130 results; TNW000005384 29; TNW000005386 42; TDECWPC-SALE001.2HM 129 legacy results (1999); SALE003.3HM 0.
- Type + confidence: 20 years of method-documented TDEC benthic/chemistry monitoring treating Sale Creek as a warm wadeable stream; no trout-related parameters ever. Moderate-high negative (benthic-only — no fish assemblage program).
- URLs: https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000005382&mimeType=csv ; https://www.waterqualitydata.us/data/Station/search?countrycode=US&statecode=US%3A47&countycode=US%3A47%3A065&mimeType=csv

### S9. USGS NWIS station history
- Retrieval: 2026-09-24 (statewide expanded site dump, grep). Four Sale Creek stream stations (03566287, 03566290, 03566292, 03566297) + Rock Creek 03566300 — long-term gaging/monitoring footprint; no water-quality fish programs implied.
- Type + confidence: Context only.

### S10. Warmwater documentation (the ledger's bass/panfish reports — corroborated)
- Fly/kayak press (saltwateronthefly.com "Chickamauga Lake Fishing"; Kayak Angler Sale Creek piece, via search 2026-09-24): Sale Creek arm characterized as upper-Chickamauga **bass (largemouth/smallmouth) and panfish shallow water**; trout never mentioned as a component. Chickamauga WMA page (tn.gov) references Sale Creek as an area landmark (contact Brian Letner), not a trout water. TVA: Chickamauga Reservoir ecological health monitoring since 1994 (tva.com; page fetch blocked 403 — noted); a 1990 TVA Chickamauga embayment study (UNT Digital Library result) surfaced in search but the specific document was not retrievable (ark link resolved to an unrelated photograph — unproductive follow-up).
- Type: dated warmwater documentation, moderate.

## Contradictions
- None. No source of any kind claims trout stocking or wild trout in Sale Creek; the two trout-adjacent iNat records resolve to other waters (Big Soddy Creek; Hiwassee River). Ledger status "bass/panfish reports near the embayment only" is confirmed and strengthened (museum 2000 survey + TDEC benthic record + live-feed absence).

## Searches run (incl. unproductive)
1. ArcGIS LIKE '%SALE%' — productive (0). 2. Live 2026 JSON — productive (0/616). 3. Archived schedule sweep 2003–2015/2018–2020 + winter + plan — productive (0; sole "Sale" = author surname). 4. 2016/2017 archive probes — unproductive (gap). 5. NAS Hamilton — productive (0 salmonids). 6. GBIF q=Sale Creek unquoted — productive (UA lot). 7. GBIF exact-phrase — unproductive (0). 8. GBIF classKey=204 — unproductive (wrong key). 9. Lot-level GBIF query — productive (3 spp confirmed). 10. iNat places — unproductive. 11. iNat loose box species_counts — productive (41 taxa; trout hits = Soddy/Hiwassee). 12. iNat refined box + obs pull — productive (0 creek trout; Salmo trutta 2012 = Hiwassee). 13. WQP json — failed (406). 14. WQP csv Hamilton/Rhea stations — productive. 15. WQP results at 6 Sale stations — productive (benthic-only). 16. NWIS statewide grep — productive (4+1 stations). 17. WebSearch "Sale Creek trout stocking" — productive (no stocking claims; WMA/fly-fishing context). 18. WebSearch TVA embayment — partial (1990 study named; document not retrievable; tva.com 403). 19. WebSearch winter trout Hamilton — productive (ponds only). 20. eregulations.com link grep — partial (only trout-regulations page; schedule is dynamic).

## Recommendation: WARMWATER-FOCUS
Reasoning: (1) Zero stocking-program evidence in any archived year (2003–2015, 2018–2020), the winter-program documents, the 2006 plan, the live ArcGIS layer, or the 2026 live feed; Hamilton County's winter program is urban ponds only. (2) The only method-documented fish survey in the drainage (UA 2000, Rock Creek) returned an all-warmwater list; iNat's 31 taxa are warmwater/stream + embayment species; TDEC's 20-year benthic record (2004–2024) treats it as a warm wadeable stream. (3) Every trout-adjacent observation in the area resolves to other, stocked waters (Big Soddy DH creek; Hiwassee tailwater fishery; Chickamauga main stem). (4) The mouth reach is a warm Chickamauga embayment (bass/panfish fishery), the opposite of trout habitat. No dated trout record of any kind was found; the classification-supporting evidence is consistent and multi-lane. Residual gap: no fish-assemblage survey of the Sale Creek mainstem itself (Rock Creek is a proxy), and the 2016–2017 schedule years are unarchived.
