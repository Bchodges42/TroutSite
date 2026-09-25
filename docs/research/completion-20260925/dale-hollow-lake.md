# DALE HOLLOW LAKE (reservoir) — year-round trout evidence log

Ledger entry under repair: `year-round-trout`, YR flag, no months pinned.
Water: Dale Hollow Reservoir/Lake — USACE impoundment (Obey River, dam completed 1943), Clay/Pickett/Overton counties TN + Monroe/Cumberland counties KY. TWRA Region 3. DO NOT CONFUSE with sibling row "Dale Hollow TW / Obey River" (tailwater below dam, separate ledger water).
Retrieval date for all sources: 2026-09-25. Research-only pass; no agency/author contact.

---

## VERDICT SUMMARY

- TMP nine-trout-reservoir list: **CONFIRMED MEMBER** (Dale Hollow named first in the list of nine).
- Stocking pattern: **SEASONAL — winter/early-spring window** (agency text: "during the winter"; Goal 4 timing guidance Feb/March). The live 2026 schedule row for the reservoir shows a single month coded "A" (April or August — ambiguous) with species "Brown Trout," which conflicts with the live static list (Rainbow) and with all program narrative (rainbows, winter). See Contradictions.
- Year-round: **YEAR-ROUND SURVIVES as a fishery/opportunity designation, on the Agency's own words** — "TWRA stocks the following reservoirs with trout during the winter to provide year-round trout fishing opportunities" (2020–2022 archived reservoir page; live 2026 page retains the year-round clause). Support: two-story thermal refuge (deep cold hypolimnion), documented holdover/growth (Bergthold & Bettoli 2009 — rainbows >10 in. switch to alewife piscivory in this lake), historical trout state records from the lake, active year-round deep-water fishery in reports. NOT continuous stocking.
- Species: Rainbow Trout (core); Brown Trout (2026 schedule row + KY guide + historical); Lake Trout historical only (1977/1993 records; former state record 12 lb 13 oz; not in current program lists); Brook Trout: no lake evidence (ArcGIS "brook" applies to the TAILWATER row only). Ledger species guess "rainbow + brown + brook" — brook part UNVERIFIED/likely wrong for the lake.
- Recommendation: **Keep `year-round-trout`** (basis: agency year-round opportunity statement + holdover/refuge evidence). Pin stocking-season months as Nov–Apr (winter program) NOT Jan–Dec; do not pin a single month until TWRA resolves the "A" row. Add contradiction note on species (Rainbow static list vs Brown schedule row).

---

## SOURCES

### S1. TWRA Trout Stocking Schedule (live exceldriven JSON, 616 rows)
- Org: Tennessee Wildlife Resources Agency (tn.gov). Page "Report updated as of 9/21/2026".
- Observation dates: 2026 schedule year. Retrieval: 2026-09-25 (cached by prior pass as data/sched2026.json; re-verified against live page HTML same date).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (via https://www.tn.gov/twra/fishing/trout-information-stockings.html)
- Rows relevant:
  - `{"REGION": "3", "COUNTY": "Clay", "LOCATION": "Dale Hollow TW / Obey River", "TYPE": "Tailwater", "STOCKING MONTHS": "J, F, M, A, M, J, J, A, S, O, N, D", "SPECIES": "Rainbow, Brown Trout"}` → TAILWATER sibling (all 12 months) — excluded from this lake ledger.
  - `{"REGION": "3", "COUNTY": "Clay", "LOCATION": "Dale Hollow Reservoir", "TYPE": "Reservoir", "STOCKING DAY": "", "STOCKING WEEK": "", "STOCKING MONTHS": "A", "SPECIES": "Brown Trout"}` → THE LAKE ROW.
- Months/season table (lake): one scheduled month, coded "A". In this dataset month letters are initial letters (Calderwood = "N, D"; Chilhowee = "F, N, D"; S. Holston TW = "M, A, M, J, J, A, S"), so a lone "A" is ambiguous: April OR August. Program narrative (S2, S4) stocks reservoirs "during the winter" (Oct–Apr window; Feb/March preferred), favoring April; August would contradict all narrative. Not resolvable from data alone.
- Species: Brown Trout (row) — contradicts static list (S3) and historical program (S4: rainbows; browns were Watauga+SH only as of 2017).
- Type: planned schedule (dataset shortcut, verified). Confidence: high for existence of the row; low for month interpretation.
- Establishes: the reservoir IS a stocked destination in the 2026 program (Type=Reservoir row present). Does NOT establish: year-round stocking, exact month, species stability.

### S2. TWRA "Reservoir Trout Stocking" page (archived, 5 identical Wayback snapshots 2020-10 → 2022-05)
- Org: TWRA. Undated page; snapshots 20201003084733, 20210119124344, 20210820055916, 20220308055855, 20220519195036.
- Retrieval: 2026-09-25 (Wayback).
- URL: https://web.archive.org/web/20200724025913/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/reservoir-stocking-schedule.pdf (PDF snapshot 2020; text identical across all fetched snapshots)
- Verbatim: "TWRA stocks the following reservoirs with trout during the winter to provide year-round trout fishing opportunities."
- Reservoir list (2020–2022, stable): REGION III — Dale Hollow (Rainbow Trout), Parksville (Rainbow), Calderwood (Brook/Brown/Rainbow), Chilhowee (Rainbow). REGION IV — Fort Patrick Henry (Brown/Rainbow), South Holston (Brown/Lake/Rainbow), Tellico upper (Rainbow), Watauga (Brown/Lake/Rainbow). Regulations: 7 trout/day, no more than 2 lake trout.
- Months/season: winter (page-level statement; no month grid).
- Type: agency program page. Confidence: high.
- Establishes: (a) THE year-round statement — winter stocking expressly to provide year-round fishing; (b) Dale Hollow membership in the reservoir trout program with Rainbow Trout as of 2020–2022; (c) seasonality of stocking (winter). Does NOT establish: continuous stocking.

### S3. TWRA live trout stocking page — static reservoir list (2026)
- Org: TWRA; "Report updated as of 9/21/2026". Retrieval: 2026-09-25 via WebFetch (tn.gov blocks curl).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html
- Verbatim intro: "TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities." (WebFetch confirms the words "during the winter" are NOT in the live sentence — they were present in the 2020–2022 archived version; the year-round clause is retained.)
- List: Region "II" label per fetch for Dale Hollow (Rainbow) — almost certainly a fetch/reg rendering artifact; Dale Hollow is Region 3 in every structured source (schedule JSON, ArcGIS). South Holston listed "Lake and Rainbow" (see south-holston-lake.md).
- Also on page: "Tailwater and Reservoir stocking dates are variable throughout the months indicated."
- Type: agency program page (live). Confidence: high for the year-round sentence + Dale Hollow membership; medium for species attribution (minor fetch garbling).
- Establishes: year-round opportunity sentence survives on the CURRENT page and Dale Hollow is still on the reservoir list. Contradiction: Dale Hollow species listed Rainbow vs 2026 schedule row Brown Trout (see S1).

### S4. Tennessee Trout Management Plan 2017–2027 (TWRA Fisheries Report 17-10, ed. James W. Habera, October 2017)
- Retrieval: 2026-09-25 (cached by prior pass at data/reports/Tennessee-Trout-Management-Plan-2017-2027.txt; live PDF: https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Tennessee-Trout-Management-Plan-2017-2027.pdf, archived 20200724025945).
- Reservoirs section (p.10–11) verbatim: "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries. Tennessee has nine reservoirs that currently support trout fisheries: **Dale Hollow**, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (~62,400 acres total)... Trout are stocked during the winter to assure that surface water temperatures are cold enough for their survival. Stocking later in winter (March vs. January) can help decrease mortality due to predation, especially by Walleye... Approximately 215,000 9-inch Rainbow Trout are stocked into Tennessee reservoirs annually."
- Dale Hollow-specific: "Bergthold and Bettoli (2009) found that Rainbow Trout switched to piscivory at about 10 inches in length and fed almost exclusively on alewives Alosa pseudoharengus in **Dale Hollow**, South Holston, and Watauga reservoirs. Therefore, stocking Rainbow Trout at larger sizes each winter (>10 inches) would enable them to begin feeding on alewives immediately..." Also: "further improvements there [Center Hill] and at **Dale Hollow (Obed River)** would help improve these fisheries." Also: "Include nighttime angler surveys where appropriate (e.g., **Dale Hollow**)" (Goal 4, Strategy 5).
- Goal 4 (Enhance reservoir trout fisheries): "During 2011-2016, 75% of the 464 reservoir stocking events involving Rainbow Trout (two-thirds of which were conducted by DHNFH) consisted of fish <10 inches and in reservoirs where Walleye are present, 38% occurred outside the February/March timeframe." Strategies: schedule reservoir rainbow stockings later in winter (after January) where Walleye present; stock >10-inch rainbows; most reservoir rainbows provided by DHNFH.
- Key citations (from reference list): Bergthold, C.L., & P.W. Bettoli. 2009. "Growth, diet, and sampling of Rainbow Trout in three Tennessee reservoirs." TWRA Fisheries Report 09-04. | Bettoli, P.W. 1996b. "Survey of nighttime trout angling in **Dale Hollow Lake** — final report." TWRA FR 96-17. | Ivasauskas, T., & P.W. Bettoli. 2010. "Movements and mortality of recently-stocked Rainbow Trout in Tennessee reservoirs." TWRA FR 10-07. | Malvestuto, S., & W.P. Black. 2003. "Tennessee reservoir creel report 2002." TWRA.
- Type: agency management plan. Confidence: high.
- Establishes: (a) NINE-RESERVOIR LIST MEMBERSHIP — Dale Hollow is on it; (b) stocking is winter, lake keeps year-round cold well-oxygenated water (the enabling condition); (c) DHNFH (at Dale Hollow Dam) supplies most reservoir rainbows; (d) multi-month holdover and growth of stocked rainbows IN Dale Hollow Lake (piscivory at ~10 in. implies months-scale residence on alewives). Does NOT establish: year-round stocking.

### S5. TWRA Region IV Trout Fisheries Report 2018 (Fisheries Report 18-01 / 19-08; Habera, Petre, Carter, Williams)
- Retrieval: 2026-09-25 (Wayback: https://web.archive.org/web/20220804000418/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2018.pdf).
- Two-story program text (verbatim): "Reservoirs that stratify during summer months but have habitat suitable for trout below depths normally occupied by warmwater species are termed 'two-story' fisheries. These reservoirs must have a zone with water below 21° C and a minimum dissolved oxygen concentration of 3.0 mg/L (Wilkins et al. 1967). Seven two-story reservoirs in Region IV (Calderwood, Chilhowee, Tellico, Ft. Patrick Henry, South Holston, Wilbur, and Watauga) have such zones... These reservoirs are stocked with adult Rainbow Trout during the late fall and winter when reservoir temperatures are uniformly cold and piscivorous warmwater predators are less active."
- Relevance to Dale Hollow: this is REGION 4 text; no Region 3 equivalent report was located (see Searches — unproductive). It defines the statewide two-story doctrine that the TMP applies to Dale Hollow. NOTE: Dale Hollow is a USACE reservoir in Region 3, not on the Region 4 seven-lake list.
- Type: agency annual report. Confidence: high (for program mechanics; indirect for Dale Hollow).
- Establishes: the thermal-refuge ("two-story") doctrine and late-fall/winter stocking season used for TN reservoir trout. Does NOT establish: a Region 3 reservoir program document for Dale Hollow (gap).

### S6. USFWS Dale Hollow National Fish Hatchery (official hatchery page)
- Org: U.S. Fish & Wildlife Service. Retrieval: 2026-09-25 (curl, live).
- URL: https://www.fws.gov/fish-hatchery/dale-hollow (145 Fish Hatchery Rd, Celina TN — below Dale Hollow Dam).
- Text: mitigation hatchery "stocking rainbow, brown, lake, and brook trout in waters impacted by federal dams." Fish production: Rainbow 700,000–800,000 @ 9–10 in. + 300,000–400,000 @ 3–4 in.; Brown 250,000–300,000 @ 8 in.; Brook 30,000–50,000 @ 9 in.; Lake trout 125,000–150,000 @ 8 in.; Cutthroat 10,000–20,000; 2025 total 1,244,824 fish. TVA funding since 2013 (with Erwin NFH) supports the program (~256,000+ trout anglers figure appears in the 2021 TVA/USFWS/GA-DNR announcement).
- Type: federal agency page. Confidence: high.
- Establishes: the on-site hatchery that supplies TWRA's reservoir stockings (TMP: two-thirds of reservoir rainbow events 2011–16). Does NOT itself date or locate individual lake stockings.

### S7. TWRA ArcGIS layer TWRA_Trout_Stocking_Locations (services3.arcgis.com/PWXNAH2YKmZY7lBq)
- Retrieval: 2026-09-25 (REST query, 730 features).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
- Lake rows: `OBJECTID 784: Site_Name "Dale Hollow Dam Rd.", StreamName "Dale Hollow Reservoir", Region 3, County CLAY, City Celina, StockingProgram "Reservoir", WaterClass "reservoir", Species "rainbow", Management USACE, geometry (-85.44985, 36.54097)`. 
- Sibling (excluded): `OBJECTID 754: "Dale Hollow Dam Recreation Area", StreamName "Obey River", StockingProgram "Tailwater", Species "brook_brown_rainbow", (-85.45734, 36.53681)`.
- Type: agency GIS layer. Confidence: medium-high (layer freshness unverified).
- Establishes: reservoir-class stocking destination with coordinates (36.54097, -85.44985 — at the dam/Obey arm, Clay Co.); species "rainbow" in this layer. Contradiction: species differs from 2026 schedule row ("Brown Trout").

### S8. GBIF occurrence records
- Retrieval: 2026-09-25 (api.gbif.org bounding box 36.40–36.66 N, -85.90 to -85.20).
- Salmo trutta (brown): 5+ records 2006–2008 at 36.53–36.55, -85.45 to -85.49 = INSIDE the lake (dataset d6cc311c — natural-history/atlas records). Salvelinus namaycush (lake trout): records 1977 (36.5386, -85.4460; 36.6337, -85.2738; 36.6266, -85.3233) and 1993 (36.5392, -85.4504) — near dam / main lake. Oncorhynchus mykiss (rainbow): 2025–2026 records at box edge (36.471, -85.418 — off-lake; 36.6498, -85.2211 — off-lake). Salvelinus fontinalis (brook): ZERO.
- Type: occurrence aggregator. Confidence: medium (georeference quality varies; historical records).
- Establishes: browns and lake trout have existed IN the lake (historical); no brook trout signal. Single catches = leads.

### S9. iNaturalist observations
- Retrieval: 2026-09-25 (api.inaturalist.org, same bounding box).
- O. mykiss: 15 total; nearest lake-relevant leads: Allons TN 2023-03-24; Celina TN 2025-12-07 (tailwater town). S. trutta: 0 in box. S. namaycush: 0. S. fontinalis: 0.
- Type: citizen science. Confidence: low (leads only; coordinate privacy often coarsened).

### S10. Tennessee state fishing records (official TWRA page) + historical-record leads
- Org: TWRA. Retrieval: 2026-09-25 via WebFetch.
- URL: https://www.tn.gov/twra/fishing/awards-fish-records-photos.html
- Current records: Brown 28 lb 12 oz Clinch River (1988); Rainbow 18 lb 8 oz Polk Co. pond (2016); Lake trout 22 lb 2 oz Watauga Reservoir (2008); Brook 4 lb 12 oz Caney Fork (2016). Dale Hollow appears ONLY as the smallmouth bass record water (11 lb 15 oz, 1955).
- Leads (secondary source, not verified by TWRA page): dalehollow-lake.net claims Dale Hollow formerly held TN records for rainbow 14 lb 8 oz, brown 26 lb 2 oz, and lake trout 12 lb 13 oz. Treat as unverified leads. The long-standing "world-record brown trout from Dale Hollow, 1952" claim is **BUSTED** — Dale Hollow's world-record fish is David Hayes' 11 lb 15 oz smallmouth bass, 1955 (IGFA all-tackle smallmouth record, still standing; kentuckytourism.com 2023-07-25 and multiple sources). No credible source ties a world-record brown to Dale Hollow 1952.

### S11. Completed stockings feeds (TWRA)
- data/committed2024.json (54 rows, archived 2024-06-07 JSON): `{"Region": "3", "Destination": "Dale Hollow TW", "Stocking Date": "05/31/2024"}` — TAILWATER (has TW suffix). Live completed feed 2026-09-25: `{"Region": "3", "Destination": "Dale Hollow TW", "Stocking Date": "09/18/2026"}` — TAILWATER.
- Coldwater completed schedule pages (cached cw_2022feb/may/aug/nov, 2023feb/may/aug/nov, 2024feb/may/aug): every Dale Hollow row is "Dale Hollow TW" (e.g., 02/11/2022, 05/17/2022, 08/05/2022, 11/10/2022, 04/21/2023, 08/11/2023, 10/27/2023, 05/03/2024, 08/09/2024). NO "Dale Hollow Reservoir" completed row appears in any captured window (the stream "complete" schedules don't cover reservoirs; reservoir completions would surface in winter coldwater schedule pages — none captured shows one).
- Type: destination-level completed evidence. Confidence: high.
- Establishes: tailwater stockings are frequent and dated. Does NOT establish: recent dated reservoir (lake) releases (gap — winter-window completed feeds for the lake not captured).

### S12. Kentucky-side stocking (KDFWR)
- Search-derived: Kentucky fishing & boating guide lists Dale Hollow Lake among waters stocked with rainbow AND brown trout (WATE summary of KDFWR guide; fw.ky.gov 2013 Kentucky Trout Angler Survey includes Dale Hollow). Retrieval 2026-09-25.
- Establishes (medium confidence): the KY portion of the lake receives KDFWR rainbow+brown stockings — corroborates a lake-proper two-state fishery. Direct KDFWR schedule rows not pulled (gap).

### S13. Fishery/press reports (seasonal-use evidence; leads)
- Chattanoogan.com "Fishing Reports & Moon Phases," Aug 25, 2011: "DALE HOLLOW... A few trout are being caught near the dam, while trolling with downriggers in 45-to-65 feet of water." (Summer deep-water trout use = thermal refuge.)
- TWRA-related fishing report summary (search): June cited as prime trout month, downriggers/spoons 30–50 ft (tn.gov).
- TNDeer forum thread (2008-12-24): summer fish 18–20 in. above the dam; 5–7 lb rainbows reported (forum lead).
- Type: anecdotal/report. Confidence: low-medium. Establishes: angling use outside the stocking season (summer) — holdover use, not stocking.

---

## MONTHS / SEASON TABLE (lake only)

| Source | Season/months | Species | Evidence type |
|---|---|---|---|
| S2 archived page (2020–2022) | "during the winter" | Rainbow | agency statement |
| S4 TMP (2017) | "during the winter"; (Feb/Mar preferred where Walleye) | Rainbow (statewide reservoir program) | agency plan |
| S5 R4 2018 report | "late fall and winter" | Rainbow (+Brown+Lake in Watauga/SH only) | agency report (Region 4 doctrine) |
| S1 2026 schedule JSON | single month "A" (April or August — ambiguous) | Brown Trout | planned schedule row |
| S11 completed feeds (captured windows) | TW rows only; no dated lake rows | — | completed (gap for lake) |
| Tailwater sibling (excluded) | J F M A M J J A S O N D | Rainbow, Brown | schedule |

## CONTRADICTIONS
1. Species: 2026 schedule row = Brown Trout vs static reservoir list + ArcGIS + TMP program = Rainbow. Possibly a new/replacement stocking (TWRA static list may be stale, or the row is a special brown planting). Unresolved.
2. Month "A": April fits the winter/early-spring program doctrine; August would contradict all agency narrative. Unresolved — flag, do not pin.
3. Static list sentence changed: "during the winter to provide year-round..." (2020–2022) → "to provide year-round..." (live 2026; "during the winter" dropped from the intro sentence, though program narrative elsewhere still says winter).
4. "World-record brown 1952" (ledger note) is false; 1955 world-record smallmouth is the lake's world record. Historical TN trout records from the lake are leads only.

## SEARCHES RUN (Dale Hollow; 2026-09-25)
Productive: (1) TWRA Dale Hollow Reservoir trout stocking program brown trout August; (2) Tennessee coldwater fisheries report Region 3 Dale Hollow reservoir trout; (3) Dale Hollow Lake world record brown trout 1952; (4) Bergthold Bettoli 2009 rainbow trout piscivory alewife Dale Hollow; (5) TWRA "Region 3"/III trout fisheries report PDF tn.gov; (6) SEAFWA "Suitability of Stocked Brown Trout and Rainbow Trout for Trophy Management" Tennessee reservoirs; (7) Tennessee state record lake trout Dale Hollow OR South Holston; (8) Dale Hollow Lake trout fishing deep water summer thermocline year-round; (9) Dale Hollow National Fish Hatchery trout stocked annual rainbow brown; (10) "Dale Hollow" brown trout state record 26 pounds 1952/1953; (11) Kentucky KDFWR Dale Hollow Lake trout stocking; (12) TWRA fishing forecast Dale Hollow Reservoir trout downriggers 30-50 feet; (13) Dale Hollow Reservoir "two-story"/cold water trout habitat TWRA region 3.
Unproductive/rate-limited (429): Bettoli "Dale Hollow" night angling survey 1996/97 (3 attempts); several repeats of (2)/(5).
Dataset pulls (non-search): sched2026.json; completed feeds 2024+live; cw_ 2022–2024 coldwater schedule pages; complete_2019-20…2025 stream schedules (streams-only — no reservoirs); TMP 2017–2027 text; R4 2018 report PDF; 5 reservoir-stocking-schedule Wayback snapshots; USFWS hatchery page; ArcGIS layer (730 features); GBIF (4 species × box); iNat (4 species × box); TN records page; FWS/CDX Wayback probes for a "Coldwater-Trout-Report-R3-*" series (ALL 404 — no Region 3 report series exists at the R4-style URL).

## GAPS
- No located TWRA "Region 3 coldwater report" (R3 series absent from tn.gov and Wayback; only statewide 2016/2017 [which are actually Region-4 reports] and R4/R6 series exist).
- No dated completed-release row for the lake itself in captured windows (need a Jan–Mar completed feed capture to see "Dale Hollow Reservoir" completions, if reported).
- Month-"A" ambiguity and species contradiction unresolved.
- KDFWR stocking rows for the KY half not pulled from fw.ky.gov.

## RECOMMENDATION
Keep verdict `year-round-trout` for Dale Hollow LAKE — the year-round designation rests on TWRA's own reservoir-program statement (winter stocking expressly "to provide year-round trout fishing opportunities," live page 9/21/2026 + archived 2020–2022), the two-story thermal-refuge doctrine (TMP: "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water..."), documented in-lake holdover/growth (Bergthold & Bettoli 2009), and year-round angling use (summer deep-water reports). Pin stocking season as NOV–APR (winter program; Feb/March preferred), NOT Jan–Dec (that range belongs to the tailwater sibling). Do not pin a single month from the ambiguous "A" row until TWRA clarifies; log the Rainbow-vs-Brown species contradiction. Keep lake and TW rows strictly separate.
