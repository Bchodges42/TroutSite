# SOUTH HOLSTON LAKE (reservoir) — year-round trout evidence log

Ledger entry under repair: `year-round-trout`, YR flag, no months pinned.
Water: South Holston Reservoir/Lake — TVA impoundment (South Fork Holston River, dam 1951), ~7,580 ac, Sullivan Co. TN + Washington Co. VA. TWRA Region 4; co-managed with Virginia DWR. DO NOT CONFUSE with sibling row "S. Holston TW / S. Fork Holston River" (tailwater, separate ledger water; resolved Mar–Sep stocking + documented wild reproduction).
Retrieval date for all sources: 2026-09-25. Research-only pass; no agency/author contact.

---

## VERDICT SUMMARY

- TMP nine-trout-reservoir list: **CONFIRMED MEMBER** ("Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico").
- Stocking pattern: **SEASONAL — late fall/winter** (Region 4 report verbatim: "stocked with adult Rainbow Trout during the late fall and winter"; TMP: reservoirs stocked "during the winter"). NO South Holston reservoir row exists in the live 2026 schedule (616 rows) — a dataset gap, not proof of no stocking (the 2020–2022 TWRA reservoir page and ArcGIS layer still list it; TVA funding continues).
- Year-round: **YEAR-ROUND SURVIVES as fishery/opportunity designation** — TWRA's reservoir-stocking statement ("...to provide year-round trout fishing opportunities") names South Holston through at least the 2020–2022 archived pages, and the live 2026 page retains the year-round clause; two-state trout management with a lake-trout creel rule (VA: 7 trout/day, only 2 lake trout) implies resident (holdover) trout; Russell & Bettoli 2011 documented growth to age-4+ of lake trout stocked since ~2006 (multi-year residence); summer deep-water (45–65 ft) fishery documented. NOT continuous stocking.
- Prior-pass winter row "South Holston 1/26/2022": **UNVERIFIED — likely misattribution.** The Feb 2022 coldwater schedule does contain a Region 4 "South Holston" row WITHOUT the TW suffix (consistent with the lake, since the TW season is Mar–Sep), but its date cell is blank/illegible in extraction; the two 1/26/2022 dates legible in that PDF belong to Region 2 waters (Kingston Springs Lake, McCutcheon Creek). The Nov 2022 page DOES show "4 South Holston 11/17/2022" without TW — a legible winter row best read as the RESERVOIR.
- Species: Rainbow (winter adults), Brown (sub-adults; 2017: ~25,000/yr "new fishery" experiment with Watauga; dropped from live 2026 static list but retained in ArcGIS "rainbow_brown"), Lake Trout (~150,000 6-inch statewide program fish 2017; SH program since ~2006; still on live 2026 list "Lake and Rainbow"). VA co-stocks a portion (TMP 2017).
- Recommendation: **Keep `year-round-trout`** (agency year-round statement + holdover/lake-trout age data + thermal refuge + two-state management). Pin stocking season NOV–MAR (late fall/winter); keep Mar–Sep range OUT (that belongs to the TW sibling). Flag the missing 2026 lake schedule row and the unverified 1/26/2022 row.

---

## SOURCES

### S1. TWRA Trout Stocking Schedule (live exceldriven JSON, 616 rows)
- Org: TWRA; page "Report updated as of 9/21/2026". Retrieval: 2026-09-25 (cached sched2026.json + live page verification).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Region 4 Holston rows found: `Cherokee TW / Holston River (J,F,M,A,N,D; Rainbow, Brown)`, `Ft. Patrick Henry TW (M,A,D; Rainbow, Brown)`, `Boone TW (M,A,M,J,J,A,N,D... [M,A,N,D]; Rainbow, Brown)`, and `{"REGION": "4", "COUNTY": "Sullivan", "LOCATION": "S. Holston TW / S. Fork Holston River", "TYPE": "Tailwater", "STOCKING MONTHS": "M, A, M, J, J, A, S", "SPECIES": "Rainbow Trout"}` → TAILWATER sibling (Mar–Sep, Rainbow) — excluded from this lake ledger.
- **NO "South Holston Reservoir/Lake" row of TYPE=Reservoir.** The entire Reservoir-type set in 2026 is: Dale Hollow Reservoir (A, Brown), Calderwood (N,D, Rainbow), Chilhowee (F,N,D, Rainbow).
- Type: planned schedule. Confidence: high (absence verified by two independent reads: JSON + flattened live page).
- Establishes: the lake is NOT on the current published schedule table. Does NOT establish: that stocking ceased (static list, ArcGIS, and program pages still carry it; 2026 table may simply omit reservoir rows other than three).

### S2. TWRA "Reservoir Trout Stocking" page (archived, 5 identical Wayback snapshots 2020-10 → 2022-05)
- Org: TWRA. Retrieval: 2026-09-25 (Wayback).
- URL: https://web.archive.org/web/20200724025913/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/reservoir-stocking-schedule.pdf
- Verbatim: "TWRA stocks the following reservoirs with trout during the winter to provide year-round trout fishing opportunities." List: REGION IV — Fort Patrick Henry (Brown and Rainbow), **South Holston (Brown, Lake, and Rainbow)**, Tellico upper (Rainbow), Watauga (Brown, Lake, and Rainbow). "Statewide Regulations — Daily Limit: 7 trout... (no more than 2 of which may be Lake Trout)."
- Type: agency program page. Confidence: high.
- Establishes: lake on the program (three species) with the year-round statement; winter season. Discipline note: the "no more than 2 Lake Trout" creel rule is shared by tailwater+reservoir statewide regs.

### S3. TWRA live trout stocking page — static reservoir list (2026)
- Org: TWRA; "Report updated as of 9/21/2026". Retrieval: 2026-09-25 (WebFetch; tn.gov blocks curl).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html
- Verbatim intro: "TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities." (No "during the winter" in the live intro — dropped vs archived version.)
- List: "Region IV, South Holston — Lake and Rainbow" (Brown dropped vs 2020–2022 "Brown, Lake, and Rainbow"; matches the 2017 experiment being scaled back — see S4/S10). Tailwater bullets on same page: "South Holston Dam, South Fork Holston River — Rainbow; stocked March through September" (sibling — separate water).
- Type: agency program page (live). Confidence: high.
- Establishes: lake still on the program per live page (Lake Trout + Rainbow), year-round clause current.

### S4. Tennessee Trout Management Plan 2017–2027 (TWRA Fisheries Report 17-10, ed. Habera, October 2017)
- Retrieval: 2026-09-25 (cached text; PDF: https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Tennessee-Trout-Management-Plan-2017-2027.pdf).
- Reservoirs section verbatim (p.10–11): nine reservoirs list incl. **South Holston**; "Additionally, **South Holston and Watauga reservoirs now have excellent lake trout fisheries**... Lake Trout (S. namaycush) are stocked in Watauga, **South Holston**, and Chilhowee reservoirs (about 150,000 6-inch fish annually)... Russell and Bettoli (2011) found that annual Lake Trout growth rates in Watauga and South Holston were high enough to suggest that neither system was being overstocked. Brown Trout are currently stocked in Watauga and **South Holston** reservoirs (25,000 trout/reservoir) to create new fisheries... **South Holston** and Calderwood lakes border Virginia and North Carolina, respectively, thus the Virginia Department of Game and Inland Fisheries (VDGIF)... partner[s] with TWRA to cooperatively manage these waters by stocking a portion of the trout each receives annually." (Photo caption: "VDGIF stocking trout in South Holston Reservoir.") "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries... Trout are stocked during the winter..." Also: alewife/piscivory work included South Holston (Bergthold & Bettoli 2009, FR 09-04).
- Type: agency management plan. Confidence: high.
- Establishes: list membership; lake trout fishery + stocking; brown trout experiment (~25k/yr); VDGIF co-stocking; winter season; year-round enabling condition.

### S5. TWRA Region IV Trout Fisheries Report 2018 (Fisheries Report 18-01 / printed 19-08; Habera, Petre, Carter, Williams)
- Retrieval: 2026-09-25 (Wayback: https://web.archive.org/web/20220804000418/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2018.pdf).
- Verbatim: "Cold, hypolimnetic releases from five TVA dams in Region IV (Norris, Ft. Patrick Henry, **South Holston**, Wilbur, and Boone) also support year-round trout fisheries in the tailwaters downstream... Reservoirs that stratify during summer months but have habitat suitable for trout below depths normally occupied by warmwater species are termed 'two-story' fisheries... Seven two-story reservoirs in Region IV (Calderwood, Chilhowee, Tellico, Ft. Patrick Henry, **South Holston**, Wilbur, and Watauga) have such zones... **These reservoirs are stocked with adult Rainbow Trout during the late fall and winter** when reservoir temperatures are uniformly cold and piscivorous warmwater predators are less active. **Watauga and South Holston reservoirs are also annually stocked with sub-adult Brown Trout and Lake Trout Salvelinus namaycush, and excellent Lake Trout fisheries have developed in these two reservoirs.**"
- Also: brook trout restoration in Little Jacob Creek, "a **South Holston Lake** tributary" (CNF, Sullivan Co.) — watershed context.
- Type: agency annual report — THE Region 4 coldwater program document. Confidence: high.
- Establishes: two-story thermal refuge + late-fall/winter stocking season + annual brown & lake trout stocking in THIS reservoir. Does NOT establish: continuous/year-round stocking.

### S6. Russell & Bettoli 2011 — lake trout age/growth (TWRA FR 11-02; published as "Population Attributes of Lake Trout in Tennessee Reservoirs")
- Citation (TMP refs): Russell, D., and P. W. Bettoli. 2011. "Age, growth and sampling of Lake Trout in two eastern Tennessee Reservoirs." TWRA Fisheries Report 11-02. Published version on JSTOR ("Population Attributes of Lake Trout in Tennessee Reservoirs").
- Search-verified content (2026-09-25): sampling early spring in both reservoirs; **South Holston Lake fish stocked since ~2006; oldest sampled fish age 4**; high growth; neither system overstocked (TMP paraphrase).
- Type: agency report / peer-review-track study. Confidence: high (existence + findings via TMP + JSTOR snippet; full PDF not pulled).
- Establishes: MULTI-YEAR survival and growth of stocked lake trout IN South Holston Lake (age-4 fish from a program begun ~2006) — direct holdover evidence for a year-round fishery.

### S7. TWRA ArcGIS layer TWRA_Trout_Stocking_Locations
- Retrieval: 2026-09-25 (REST query, 730 features).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
- LAKE rows (StockingProgram "Reservoir", WaterClass "reservoir", Species "rainbow_brown", Region 4):
  - OBJECTID 770 — "Hwy. 421 boat ramp", Sullivan, Bristol — 36.55915, -82.04216
  - OBJECTID 772 — "Lakeview Marina", Sullivan, Bristol — 36.53012, -82.08089
  - OBJECTID 773 — (unnamed), WASHINGTON Co., Bristol — 36.59932, -82.01498
- Sibling rows (excluded): 10+ "South Holston Tailwater" access points (South Holston Dam 36.52307/-82.09061; Emmett Bridge; Hickory Tree Bridge; Osceola Island weir; Webb Bridge; etc.), StockingProgram "Tailwater", Species "rainbow".
- Type: agency GIS layer. Confidence: medium-high.
- Establishes: reservoir-class destinations with coordinates; species rainbow_brown (vs live static list "Lake and Rainbow" — see Contradictions).

### S8. Virginia DWR — South Holston Reservoir waterbody page + cross-border license
- Org: Virginia Department of Wildlife Resources. Retrieval: 2026-09-25 (curl, live).
- URL: https://dwr.virginia.gov/waterbody/south-holston-reservoir
- Content: Trout listed as "★ best bet"; regs table: "Trout — No minimum size — 7 fish/day — ONLY 2 Lake trout per day"; "A valid resident Tennessee trout fishing license or a valid resident Virginia trout fishing license is required to fish for trout and to possess trout on South Holston Reservoir." TN sells a "South Holston Reservoir License (Type 063)" (~$20) for the VA portion (eregulations.com/tn.gov; the license is NOT valid for trout possession).
- VA stocking status: VA DWR catchable program runs Oct 1–May 31 statewide; the VA monthly stocking schedule fetched (Oct 2026 window) shows NO South Holston rows (only VA South Fork Holston River streams) — current VA lake stocking unverified (gap). TMP 2017 documents VDGIF co-stocking.
- Type: state agency page. Confidence: high (management/regulation), low (current VA stocking of the lake).
- Establishes: two-state trout management with a lake-trout-specific creel rule (implying resident lake trout), and the reservoir's distinct trout-fishery status. Does NOT establish: current VA stocking dates.

### S9. Winter "South Holston" (no TW suffix) rows in TWRA coldwater completed-schedule pages
- Cached files data/cw/cw_2022feb.txt and cw_2022nov.txt (TWRA "Coldwater Trout Stocking Schedule," updated 2/18/2022 and 11/18/2022). Retrieval: 2026-09-25.
- Nov 2022 (legible): `4 South Holston 11/17/2022` — no TW suffix; winter date.
- Feb 2022: `4 South Holston` — date cell blank in extraction; the legible 1/26/2022 dates on that page belong to Region 2 rows (Kingston Springs lake; McCutcheon Creek). The prior-pass "South Holston 1/26/2022" row therefore CANNOT be confirmed and is likely a column-alignment misread.
- Interpretation: TW's published season is Mar–Sep (S1/S3), so a Nov 17 or mid-winter "South Holston" row cannot be the tailwater; it is best read as the RESERVOIR winter stocking. Region 4 rows on these pages mix suffixed ("South Holston TW" in the Aug 2022/May 2023 pages) and unsuffixed forms — TWRA suffix use is inconsistent, so suffix alone is not diagnostic; the MONTH is.
- Type: destination-level completed/scheduled releases (agency pages). Confidence: medium-high for "winter SH stockings = the lake"; low for the specific 1/26/2022 date.
- Establishes: winter-window stockings at a destination TWRA calls "South Holston" in Region 4 (consistent with the reservoir program). Does NOT establish: the 1/26/2022 date.

### S10. TWRA blog "What can Browns (Trout) Do for You?" (2019-10-15, tn.gov TWRA Outdoors Blog)
- Retrieval: 2026-09-25 (WebFetch).
- URL: https://www.tn.gov/twra/twra-outdoors-blog/2019/10/15/what-can-browns--trout--do-for-you-.html
- Quotes: browns are "only 11 percent of the trout stocked by TWRA"; "Browns are stocked in locations where we expect them to survive multiple years"; biologist pick for big browns: "Right now I'd go to South Holston for size and numbers." Only DHNFH produces browns (egg-timing constraint).
- Type: agency blog. Confidence: medium.
- Establishes: TWRA's stated intent that brown stockings become multi-year residents (holdover by design); South Holston named for brown trout size/numbers.

### S11. Completed stockings feeds
- Archived 2024-06-07 completed JSON (54 rows): `{"Region": "4", "Destination": "South Holston TW", "Stocking Date": "05/30/2024"}` — TAILWATER (TW suffix). Live feed 2026-09-25: no South Holston row (recent window only).
- Stream "complete" schedules 2019-20…2025 (cached complete_*.pdf/txt): no South Holston rows (streams only; reservoirs not covered).
- Type: destination-level completed evidence. Confidence: high.
- Establishes: the sibling tailwater's completed releases. Does NOT establish: lake releases in captured windows (winter-window completed feeds not captured — gap).

### S12. GBIF / iNaturalist occurrences
- GBIF (36.44–36.62 N, -82.30 to -81.95; retrieval 2026-09-25): O. mykiss 2023–2025 and S. trutta 2024–2025 records at -82.10 to -82.18 — these coordinates fall in the TAILWATER reach below the dam (e.g., 36.5249/-82.1100 ≈ Osceola Island/weir; 36.4992/-82.1601 ≈ Riverside Rd), NOT the lake. No Salvelinus namaycush records in the box. No S. fontinalis in-lake (1 record at Cherokee NF, Bristol — stream context; Little Jacob Creek watershed).
- iNaturalist: O. mykiss 23 and S. trutta 27 in box, clustered at Holston View Dam Rd / Bluff City (tailwater); no lake trout observations.
- Type: occurrence aggregators. Confidence: low-medium (leads only; do NOT use tailwater-reach coordinates as lake evidence).

### S13. Fishery/press reports (seasonal-use evidence; leads)
- Chattanoogan.com "Fishing Reports & Moon Phases," Aug 25, 2011: "Rainbows are being caught from the 421 Bridge to Riddle Creek in 30-50 ft. of water trolling with spoons. Lake trout have been caught anywhere..." / "A few trout... near the dam, while trolling with downriggers in 45-to-65 feet of water."
- TVA/partners funding: TVA funds trout production/stocking for reservoirs including South Holston (WVLT Oct 2018 report; TVA-USFWS-GA/TN partnership since 2013).
- Type: anecdotal/press. Confidence: low-medium. Establishes: mid-summer (August) trout angling in the lake — use outside the stocking season.

### S14. TMP Goal 4 (reservoir program mechanics; applies to SH)
- Same document as S4: 464 reservoir rainbow events 2011–2016, two-thirds by DHNFH; stocking later in winter (Feb/March) recommended where Walleye present; rotating reservoir population assessments "in Region 3 or 4."
- Establishes: program-level winter timing; SH lake trout stock assessed 2011 (S6).

---

## MONTHS / SEASON TABLE (lake only)

| Source | Season/months | Species | Evidence type |
|---|---|---|---|
| S2 archived page (2020–2022) | "during the winter" | Brown, Lake, Rainbow | agency statement |
| S4 TMP (2017) | "during the winter" | Rainbow (215k statewide 9-in) + Lake (~150k 6-in) + Brown (~25k/reservoir) | agency plan |
| S5 R4 2018 report | "late fall and winter" | adult Rainbow + annual sub-adult Brown & Lake | agency report (Region 4 — the lake's own region) |
| S1 2026 schedule JSON | NO LAKE ROW (gap) | — | planned schedule (absence) |
| S9 coldwater pages | winter rows: 11/17/2022 legible; Feb 2022 row undated; "1/26/2022" unverified | unspecified | completed/scheduled (ambiguous suffix, winter month diagnostic) |
| S3 live page (2026) | no months given for reservoirs | Lake and Rainbow | agency list |
| Tailwater sibling (excluded) | Mar–Sep | Rainbow (wild browns documented) | schedule |

## CONTRADICTIONS
1. Species mix drifts by source/year: 2017 TMP = Rainbow + Brown (25k) + Lake; 2020–2022 page = Brown, Lake, Rainbow; live 2026 page = "Lake and Rainbow" (Brown dropped); ArcGIS = "rainbow_brown" (Lake dropped). No single source lists all three currently; the lake trout fishery is the stable element (2011 assessment; VA 2-lake-trout creel rule).
2. 2026 schedule table has NO lake row while the live static list still stocks it — schedule omission vs program persistence.
3. Prior-pass "South Holston 1/26/2022" winter row: date unverified; likely belongs to Region 2 waters per the PDF's aligned cells. The ROW (winter, no TW suffix) is real in Feb 2022 page; the DATE is not recoverable.
4. Sibling discipline: "South Holston" unsuffixed rows in winter pages = lake; "South Holston TW" Mar–Sep rows + the wild-reproduction tailwater file = river. Do not merge.

## SEARCHES RUN (South Holston; 2026-09-25)
Productive: (1) Virginia VDGIF South Holston Lake trout stocking Bristol; (2) Russell Bettoli lake trout age growth Watauga "South Holston" reservoir; (3) South Holston Lake Tennessee lake trout fishing trolling downriggers rainbow; (4) "South Holston" Reservoir brown trout stocked TWRA lake trout program evaluation creel; (5) "South Holston Lake/Reservoir" trout stocking winter January February; (6) "South Holston" lake trout "since 2006"/TVA partnership; (7) "South Holston Reservoir" license Virginia portion trout fishing Tennessee regulations; (8) Virginia DWR "South Holston Reservoir" trout stocking fishing; (9) Tennessee state record lake trout Dale Hollow OR South Holston (shared); (10) SEAFWA trophy brown/rainbow Tennessee reservoirs (shared, cites SH work); (11) TVA "South Fork Holston stocked ~47,000 rainbow March–September" result (tva.com — tailwater figure, discipline check).
Unproductive/rate-limited (429): multiple repeats of (5)/(6); "TWRA South Holston reservoir rainbow trout stockings cold weather put-grow-take."
Dataset pulls (non-search): sched2026.json; archived 2024 completed JSON; live completed feed; cw_2022feb/2022nov (winter "South Holston" rows); R4 2018/2023 report PDFs; TMP text; ArcGIS layer; GBIF 4-species box query; iNaturalist 4-species box query; VA DWR waterbody page + monthly stocking schedule; USFWS DHNFH page; TN records page; Wayback CDX probes (no archived winter completed feeds for 2022 found).

## GAPS
- No 2026 schedule row for the lake (absence verified; reason unknown — could be administrative omission rather than program end; static list + ArcGIS + VA regs all still active).
- No captured completed-release row naming "South Holston" (lake) with a date; a Jan–Mar completed feed capture would settle the winter-row dates, incl. the disputed 1/26/2022.
- Current (2025–2026) VDGIF stocking of the VA portion not confirmed (VA monthly schedule window showed none; TMP 2017 documents the partnership historically).
- Russell & Bettoli 2011 full PDF not retrieved (findings via TMP + JSTOR snippet).

## RECOMMENDATION
Keep verdict `year-round-trout` for South Holston LAKE. Basis: (a) TWRA's own reservoir-program statement — winter stocking "to provide year-round trout fishing opportunities" — with South Holston named on the list through the archived 2020–2022 pages and the year-round clause still live (2026 page); (b) the Region 4 two-story doctrine (hypolimnetic refuge) with the lake explicitly in the seven-reservoir program; (c) documented multi-year holdover — lake trout stocked since ~2006 sampled to age 4 with high growth (Russell & Bettoli 2011), plus a two-state creel rule capping lake trout at 2/day; (d) year-round angling use (August deep-water trolling reports). Pin stocking season as NOV–MAR (late fall/winter), NOT Mar–Sep (that is the tailwater sibling, a separate ledger water). Correct/annotate the prior-pass "South Holston 1/26/2022" row as unverified (date likely misaligned; the winter no-TW rows are best read as the lake). Flag the missing 2026 schedule row and the Brown-species rollback as open contradictions.
