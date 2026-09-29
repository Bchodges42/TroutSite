# Tellico Lake (Tellico Reservoir, Tellico Dam impoundment, Little Tennessee River), Blount/Loudon/Monroe Counties, TN — Year-Round Trout Classification Research Log

Research date: 2026-09-25 (single session). Scope: internal classification research ONLY; no agencies/businesses/authors/anglers contacted; no files outside the named notes files were written; no git writes.

Water: Tellico Lake / Tellico Reservoir — TWRA reservoir impounded by TVA's Tellico Dam (Little Tennessee River, completed 1979); trout fishery is confined to the cold upper arm near Tallassee below Chilhowee Dam. Ledger: `year-round-trout`, months [2,3,4], YR flag set. Sibling discipline: the TELlico RIVER main stem (Monroe County, Cherokee NF) is covered in tellico-river.md; its ArcGIS rows (95 × "Tellico River", StockingProgram "Spring", lat 35.26–35.34) are kept strictly separate from the lake rows below (lat 35.547–35.556). The Little Tennessee tailwater BELOW Tellico Dam (Loudon) is a different water and carries NO TWRA Tailwater_Trout GIS row (verified: local `tailwater_trout_all.json` has zero Tellico entries).

---

## 1. TWRA ArcGIS (services3.arcgis.com/PWXNAH2YKmZY7lBq) — retrieved 2026-09-25 via REST query
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)%20LIKE%20%27%25TELLICO%25%27&outFields=*&outSR=4326&f=json (cache `_tellico_arcgis.json`)
- Lake rows (3 of 98 features; the other 95 are river rows):
  1. OBJECTID 779 — StreamName "**Tellico Reservoir**", Region "4", County "BLOUNT", City "Tallassee", StockingProgram "**Reservoir**", WaterClass "reservoir", Species "**rainbow**", DayClosure "None", DelayedHarvestSeason "None", DailyPermitRequired "No", 35.54712,-84.06598.
  2. OBJECTID 782 — same fields, 35.55204,-84.09194.
  3. OBJECTID 783 — Site_Name "**Tellico (upper)**", StreamName "Tellico", Region "3", StockingProgram "Reservoir", WaterClass "reservoir", Species "rainbow", 35.55635,-84.10990.
- Type: agency site master. Confidence: high. Establishes: a distinct Reservoir-class rainbow-trout program at the reservoir's upper (Tallassee/Chilhowee) end, no DH season, no day closure, no special permit. Region field is inconsistent (two rows Region 4, one Region 3). Does NOT establish months.

## 2. Planned schedules — the lake's program is published as a BOX, not grid rows
- 2026 live schedule JSON (616 rows, retrieved 2026-09-25; `sched2026.json`): **ZERO Tellico lake rows** — all 32 Tellico rows are "Tellico River" (river). The Feb–Apr ledger months cannot be coming from current schedule rows.
- Tentative Trout Stocking Schedule for 2023 (TWRA PDF mirrored at https://www.eregulations.com/assets/docs/resources/TN/Trout_Stocking.pdf, retrieved 2026-09-25; cache `_work/ereg_trout_stocking.pdf`), "Reservoir Trout Stocking" box, verbatim: "**The following reservoirs are stocked with trout during the winter to provide year-round trout fishing opportunities.**" — table: Calderwood (Rainbow, Brown, Brook), Chilhowee (Rainbow), Dale Hollow (Rainbow and Brown), Fort Patrick Henry (Rainbow and Brown), Parksville (Rainbow), South Holston (Rainbow and Lake), "**Tellico (upper) — Rainbow Trout**", Watauga (Rainbow and Lake).
- Live TWRA stockings page (rendered Sept 2026, cache `stockings_page.html`): program list includes "**Region IV, Tellico (Upper) - Rainbow**" alongside Dale Hollow, Parksville, Calderwood, Chilhowee, Fort Patrick Henry, South Holston, Watauga.
- Type: planned/curated. Confidence: high. Establishes: active program, winter-stocking framing, rainbow only, same management family as Fort Patrick Henry's reservoir program.

## 3. Trout Management Plan 2017–2027 (Habera et al., TWRA Fisheries Report 17-10, Oct 2017; cache `reports/Tennessee-Trout-Management-Plan-2017-2027.pdf`, retrieved 2026-09-25)
- Nine-reservoir list (verbatim): "**Tennessee has nine reservoirs that currently support trout fisheries: Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (~62,400 acres total).**"
- Physics and season (verbatim): "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries… Some reservoir trout attempt to spawn in tributaries, but these attempts are largely unsuccessful and stocking is required to maintain reservoir fisheries. **Trout are stocked during the winter** to assure that surface water temperatures are cold enough for their survival. Stocking later in winter (March vs. January) can help decrease mortality due to predation, especially by Walleye." ~215,000 9-inch Rainbow Trout stocked into TN reservoirs annually.
- Type: management plan (agency). Confidence: high. Establishes: Tellico is on the nine-reservoir trout list; the program is WINTER stocking; spawning in tributaries "largely unsuccessful" → no reproduction basis for year-round.

## 4. TWRA Tellico Reservoir water page (Bank & Boat Fishing Guide)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/tellico-reservoir.html (retrieved 2026-09-25): Rainbow Trout among common game fish; the upper reservoir "can support trout due to the cold, well-oxygenated releases from the Chilhowee Reservoir"; "**About 4,500 catchable Rainbow Trout are released there in the late winter and early spring annually**"; location: upper reaches below Chilhowee Dam (Little Tennessee arm, Tallassee); "General trout regulations apply at Tellico with a seven-fish daily creel limit and no minimum size limit."
- Corroboration: WATE (Knoxville ABC affiliate, retrieved 2026-09-25): "Chilhowee Lake, Calderwood Lake, and upper part of Tellico Lake are among the state reservoirs TWRA stocks to provide year-round trout fishing opportunities"; Region IV rainbow stocking begins the week of Feb 15 (Johnson City Press, Feb 2026, via search). Region IV Trout Fisheries Report (Habera) hosted on ResearchGate was 403-blocked; the 2020 Region IV Coldwater Trout Report (Wayback 20210820060301, retrieved 2026-09-25) contains NO Tellico Reservoir trout section (only tailwaters Wilbur/Ft. Patrick Henry + brook restoration; Tellico hit = brook-trout propagation facility only).
- Type: agency page + news. Confidence: high (agency page), medium (news).

## 5. Completed (destination-level) evidence
- `cw_2022may.txt` (TWRA "Coldwater Trout Stocking Schedule", updated 5/17/2022): Region 3 destination "**Tellico** — 04/22/2022", listed separately from "Tellico River — 04/19/2022". The bare "Tellico" row matches the Region 3 "Tellico (upper)" Reservoir site → **completed reservoir stocking, April 2022** (fits "early spring").
- Aug/Sep 2025 Trout_Stocking-Report (Wayback 20250902003641, quoted in sibling hiwassee log): "**Tellico 7/31**" — bare name; if this is the reservoir destination it would imply a July stocking (outside the winter/spring window); more likely it is the river (adjacent Citico Creek 7/31 row). UNRESOLVED — flagged as anomaly.
- 2024-06-07 archive (54 rows, 5/6–6/4/2024) and live 9/21/2026 feed: **no Tellico (river or lake) rows**. 2026 schedule JSON: no lake rows.
- Type: completed, destination-level. Confidence: medium-high for 4/22/2022; low for 7/31/2025 attribution.

## 6. Physical/thermal basis
- Cold source is Chilhowee Dam's releases (Alcoa/TRANSmission hydro, not TVA Tellico Dam) into the Little Tennessee arm at Tallassee — TWRA page (§4); OnWater app summary (search): Tellico's cool-water character comes from Chilhowee releases + Tellico River inflow "in an otherwise warm reservoir."
- TMP (§3): only reservoirs with year-round cold, well-oxygenated WATER can support trout; Tellico's trout persist by winter stocking of the cold upper arm, and tributary spawning is "largely unsuccessful."
- Tellico Dam itself (downstream end, Loudon Co.) creates a long, warm, shallow mainstream reservoir; its own tailwater (Little Tennessee below Tellico Dam) is a separate cold release but carries no TWRA trout-stocking program row in any dataset examined.

## 7. Month-by-month verdict table (Tellico Lake)

| Evidence | Date/type | Months supported |
|---|---|---|
| TMP 2017–2027 nine-reservoir list + "stocked during the winter… (March vs. January)" | 2017, agency plan | winter → Mar |
| 2023 Tentative Schedule "Reservoir Trout Stocking" box: "stocked during the winter" | 2023, planned | winter |
| TWRA Tellico Reservoir page: "~4,500 catchable Rainbow Trout… late winter and early spring annually" | live 2026, agency | Feb–Apr (late winter + early spring) |
| Completed "Tellico" 04/22/2022 | completed | Apr |
| Region IV rainbow stocking begins week of Feb 15 | Feb 2026 news (program-wide) | Feb |
| 2026 schedule JSON / 2024 & 2026 completed feeds | current | no lake rows at all (program runs outside the published grid) |
| Ledger months [2,3,4] | catalog | Feb–Apr — consistent with every agency statement |

**No agency source documents stocking in May–November for Tellico Lake. The only "year-round" language in any source ("to provide year-round trout fishing opportunities", 2023 schedule PDF; WATE) describes the PURPOSE of winter stocking — an angling-opportunity phrase, identical to the Fort Patrick Henry phrasing the catalog already resolved to late-fall/winter adult stocking — not continuous stocking.**

## 8. Contradictions
- C1: "Year-round trout fishing opportunities" (2023 schedule PDF box, WATE) vs the operative stocking statements ("during the winter", "late winter and early spring"). The phrase is about opportunity, not stocking cadence; a YR flag built on it is an over-read.
- C2: Region field inconsistency in the GIS (two "Tellico Reservoir" rows Region 4/Blount vs one "Tellico (upper)" row Region 3) — same program, upstream site recorded under Region 3.
- C3: Ledger county Monroe vs GIS county Blount (Tallassee sites): the stocked upper arm sits at the Blount/Loudon line ~10 km north of the Monroe line; Monroe is the nearest ledger county but the stocked sites are not inside Monroe.
- C4: "Tellico 7/31/2025" bare-named completion (if reservoir) would imply summer stocking — contradicts all program statements; attribution unresolved.
- C5: Ledger months [2,3,4] are supported ("late winter and early spring") — no contradiction; the YR flag is the only unsupported element.

## 9. Searches run (Tellico Lake)
Productive: (1) Tellico Reservoir/"Tellico Lake" trout stocking TWRA rainbow winter; (2) "Tellico Reservoir" trout fishing rainbow TWRA stocked (found TWRA Bank & Boat page + 4,500/late-winter-early-spring); (3) TWRA reservoir trout program "late winter" Chilhowee Calderwood Tellico "year-round" (found Region IV Trout Fisheries Report 2017 + Calderwood angler reports); (5) "Region IV Trout Fisheries Report" Tellico reservoir (partial; 429 noise; Johnson City Press Feb-2026 hit); (6) "Tellico Lake" trout stocked where when (found eregulations schedule PDF incl. "Tellico (upper)" reservoir table); (8) Chilhowee Dam cold-water releases Tallassee trout temperature; (9) Tellico Dam Little Tennessee tailwater trout (separate-water check — no program row); (10) Tellico Reservoir trout 1990s program history (no digitized source found — GAP); (11) Fort Patrick Henry reservoir trout winter adult two-story (analog program: winter Dec–Feb adults + Mar–Apr tailwater stockings).
Unproductive/rate-limited: (4) Tellico Lake fishing report trout Tallassee winter (429); (7) [merged into (8)].
Sources opened: TWRA Tellico Reservoir page; WATE article; TWRA 2025-26 winter-program news (no Tellico); 2023 Tentative Schedule PDF (eregulations mirror); live stockings page cache; TMP 2017–2027; 2020 Region IV Coldwater Trout Report (Wayback); 2026 schedule JSON; ArcGIS REST; cw_2022may; Region IV report search (ResearchGate 403).

## 10. Recommendation (Tellico Lake)
**REFUTE `year-round-trout`; reclassify as SEASONAL put-and-take with months [2,3,4] (Feb, Mar, Apr).** The ledger's pinned months survive; the YR flag does not:
- TWRA states the program is "stocked during the winter" (2023 schedule box, TMP) — "~4,500 catchable Rainbow Trout… late winter and early spring annually" at the Tallassee upper arm (agency water page); only rainbow trout; completed evidence: Apr 22, 2022.
- The only "year-round" wording in any source is the program PURPOSE phrase ("to provide year-round trout fishing opportunities") — the same phrasing family as Fort Patrick Henry, which the catalog already resolved to a winter/early-spring window, not year-round.
- No reproduction basis: TMP says reservoir trout spawning attempts are "largely unsuccessful"; stocking "is required to maintain reservoir fisheries"; no holdover documentation for Tellico's warm mainstream body.
- Gaps: no month-resolved agency record of the reservoir stocking beyond the 4/22/2022 completed row (Dec/Jan stockings are plausible under the "winter" framing but UNDOCUMENTED in sources retrieved); "Tellico 7/31/2025" attribution unresolved; program history pre-2017 not digitized. If the December–January portion must be represented, a widened [12,1,2,3,4] could be argued from the "winter" framing — but the only dated, agency-verifiable window remains Feb–Apr, so [2,3,4] at medium-high confidence is the defensible pin.
