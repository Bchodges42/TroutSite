# Sinking Creek, Wilson County (`sinking-creek-wilson`) — completion research log

Water: Sinking Creek through Don Fox Community Park, Lebanon, Wilson County, TN (TWRA Region 2). Catalog months were [12,1,2]; ledger waterbodyType "spring". Research date: 2026-09-25. Research only; no agency contact.

## HEADLINE VERDICT
- **Identity confirmed**: the stocked water is Sinking Creek at **Don Fox (Community) Park, 539 W Baddour Pkwy, Lebanon, TN 37087** — a small stream reach through the city park. TWRA schedules name the destination "**Don Fox Park Community Park**"; the creek itself is named in ArcGIS ("Sinking Creek"), the petition that added it, and the stocking event listing.
- **Program: TWRA Winter (rainbow, put-and-take). Started with the 2021–22 winter season** (2021 petition update; first appearance in TWRA docs = 2022 Coldwater Stocking Schedule). Absent from all 2017–2020 winter programs.
- **Catalog months [12,1,2] are CORRECT in substance**: documented stocking dates fall in January–February (2/9/2022; 2/11/2026), with a December event carried as "TBD 12/2026" for the 2026–27 season (December-specific completions not yet captured in archives).
- Ledger waterbodyType "spring" is wrong as a program type — it is a Winter-program stream reach; the stream occurs in a park setting. Confidence: HIGH on program/months; the season start (2021-22) is HIGH; exact December completions LOW (no captures).

## Sources (retrieval 2026-09-25 unless noted)

1. **TWRA 2026 stocking schedule JSON** (`data\sched2026.json`; URL in hurricane-creek log): "REGION 2, COUNTY Wilson, LOCATION **Don Fox Park Community Park**, TYPE Winter, STOCKING DAY 2/11/2026 and TBD 12/2026, SPECIES Rainbow Trout." Establishes Feb + Dec(TBD) 2026.
2. **"Coldwater Trout Stocking Schedule, Updated 2/18/2022"** — tn.gov (`_work\sched2022cw.pdf.txt`, `raw\cwsched_2022.pdf`): Region 2 "**Don Fox Park** 02/09/2022." Establishes first documented season (winter 2021-22) and a February completion-date entry.
3. **Change.org petition "Ask TWRA to Stock Trout in Lebanon, TN (Winter Fishery)"** — creator/public (petition); surfaced via WebSearch 2026-09-25 (change.org; exact permalink not re-confirmed — 404 on guessed slug). Text names **Sinking Creek, Don Fox, Jimmy Floyd, Sellars Farm (Spring Creek)**; petition update dated **Sep 27, 2021**: "WE DID IT! … Sinking Creek in Don Fox Park in Lebanon, TN has been added to the Winter Trout STOCKING Schedule for this year!" Establishes: community-driven addition effective winter 2021-22.
4. **Facebook event "Don Fox Park Trout Stocking"** — location 539 W Baddour Pkwy, Lebanon, TN 37087 (surfaced via WebSearch 2026-09-25). Establishes site address.
5. **TWRA ArcGIS stocking locations** (`raw\arcgis_troutloc.json`): OBJECTID 697, Site_Name "**Don Fox Community Park**", StreamName "**Sinking Creek**", Region 2, County WILSON, City LEBANON, **StockingProgram "Winter"**, WaterClass "**stream**", Species rainbow, **Management "City"**, parking paved >25. Coordinates **36.218859998, -86.308407287** (Don Fox Park, Lebanon). Establishes identity fields (program/waterclass/city management).
6. **Absence evidence — pre-2022**: (a) Jan-2018 completed table (Wayback 20180112212428): Region 2 list has NO Don Fox/Sinking Creek (note: a "**Sink Creek** 4/27/2017" completion appears under Region 3 — a DIFFERENT stream, a name-variant trap); (b) Winter Trout Stocking 2018-19 and 2019-20 schedule PDFs (Wayback 20181013005431, 20190108232545): no Don Fox; (c) Coldwater completed reports (2018-04, 2019-01, 2020-01 captures): no Don Fox. Establishes: program began after winter 2019-20; combined with (3): winter 2021-22.
7. **2024 completed-feed archive** (`raw\completed_2024.json`, window late Apr–Jun 2024; md5 b8b2072e… exact replay with `completed_20240607b.json`): Don Fox absent — expected (program is Dec–Feb; window mismatch).
8. **Sept-2026 live completed feed** (`raw\completed_live_2026.json`, tn.gov tn_complex_datatable.exceldriven.json): Don Fox absent — expected (last event would be Feb 2026, outside the recent-10 window).
9. **Sinking Creek (Lebanon) ecological identity note** — WebSearch 2026-09-25 surfaced mussel-recovery literature discussing a "Sinking Creek population" (Cumberland Elktoe, Tennessee/Cumberland fauna) — supports that Sinking Creek (Lebanon area) is a distinct named stream; not stocking evidence.
10. **Name-variant trap (record-holding namesakes)**: Tennessee has multiple Sinking Creeks (e.g., Putnam Co. sink plain; Washington Co.). None of those is stocked; the only stocked "Sinking Creek" is the Wilson Co. Don Fox Park reach. Also distinct from Region 3 "Sink Creek" completed 4/27/2017. County + coordinates (36.2189,-86.3084) must anchor identity.

## Months-by-year stocking table
| Season | Evidence | Months stocked |
|---|---|---|
| through 2019-20 | absent from all winter docs | none (not in program) |
| 2020-21 | no document either way (gap) | unknown/likely none |
| 2021-22 | petition win 9/27/2021; Coldwater schedule | **Feb 9, 2022** (+ any Dec/Jan date not archived) |
| 2022-23, 2023-24, 2024-25 | no archived captures (winter docs stop being captured after 2020; completed feeds not captured in winter windows) | presumed Dec–Feb (LOW-MED) |
| 2025-26 | 2026 schedule JSON | **Feb 11, 2026** (+ preceding Dec 2025 TBD not archived) |
| 2026-27 | 2026 schedule JSON | **TBD 12/2026** |

## Species
Rainbow Trout only.

## Contradictions / caveats
- Catalog months [12,1,2]: no contradiction — but documented months are only Jan/Feb so far; December appears as "TBD 12/2026" (planned). Keep [12,1,2] with note that Dec dates are TBD-style in TWRA tables.
- Ledger waterbodyType "spring": unsupported — TWRA GIS WaterClass is "stream"; StockingProgram "Winter". Correct the type.
- A WebSearch result (Wanderlog scraper) showed "1/21/2026 and 2/5/2026" for Don Fox — conflicts with the official 2026 JSON (2/11/2026 + TBD 12/2026); treat scraper value as unreliable.
- 2022 coldwater layout extraction mis-pairs dates across rows in one rendering (`cwsched_2022.txt`); the stream-order rendering (`sched2022cw.pdf.txt`) pairs Don Fox Park = 02/09/2022. Either way: February 2022.
- Program start "2021-22" rests on the petition update (secondary). First TWRA primary doc naming it is Feb 2022. If strictness required: "first evidenced stocking Feb 9, 2022."

## Searches / lookups run (≥8)
1. WebSearch `"Don Fox Park" Lebanon Tennessee trout stocking Sinking Creek` (tn.gov listing + petition + FB event) 2. WebSearch `change.org petition trout fishing Lebanon TN Sinking Creek Don Fox winter stocking` (title) 3. WebSearch `"Ask TWRA to Stock Trout in Lebanon" change.org` (mussel note; petition not re-located) 4. WebFetch guessed change.org permalink (404) 5. Coldwater Stocking Schedule 2/18/2022 (Don Fox row) 6. Winter 2018-19/2019-20 program PDFs (absence) 7. Completed feeds 2017/2024/2026 (absence windows) 8. 2026 exceldriven JSON (2/11 + TBD 12) 9. ArcGIS row (Winter/stream/City/coords) 10. Name-variant checks (Sink Creek Region 3 completion; other TN Sinking Creeks).

## Recommendation
Keep as **Winter** program water, months **[12,1,2]** (documented events Jan–Feb; December planned as TBD). Species rainbow. Type: stream reach in Don Fox Community Park (City of Lebanon management of access; TWRA stocking; Region 2). Coordinates 36.21886,-86.30841. Identity notes: began winter 2021-22 after public petition; distinct from all other TN Sinking/Sink Creeks; not "spring" type.
