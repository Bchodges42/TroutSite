# Upper Hills Creek — Warren County, TN (Collins River/Caney Fork basin, Irving College community)

Research date: 2026-09-25 (live retrievals dated 2026-09-25; Wayback captures dated individually).
Ledger verdict under test: `seasonal-stocked-trout`, months [12,1,2] — SUSPECT.

## Identity (chase item a) — RESOLVED: Warren County, NOT Van Buren/White
- TWRA's own documents place "Upper Hills Creek" in **Warren County, TWRA Region 3** in every schedule grid 2003–2026 and in the GIS layer (see below). It sits among the other Warren Co. stocked waters (Charles Creek, Mountain Creek, N Barren Fork Creek, Barren Fork River).
- TWRA GIS (TWRA_Trout_Stocking_Locations layer; local dump arcgis_all.json): 2 sites, StreamName "Upper Hills Creek", County **WARREN**, Region 3, City "**Irving College**", StockingProgram "**Spring**", Species rainbow, Management "**Private Land**", HoursOpen "Contact Region 3":
  - S1: 35.56360, -85.65571 (OBJECTID 421)
  - S2: 35.56424, -85.65682 (OBJECTID 568)
- Geography: Irving College is a community in southern Warren Co. (SE of McMinnville); Hills Creek Rd / Hills Creek are local features there (real-estate and historical corroboration). The stream lies in the Collins River drainage → Caney Fork basin, so the ledger's "Caney Fork basin" is right at basin level; counties should read **Warren**, not Van Buren/White. A 1968 mussel record "Hills Creek, Warren, TN" (USFWS little-wing pearlymussel doc) corroborates the stream's historical presence in Warren Co.
- The ledger's months [12,1,2] would fit TWRA's *winter trout program*, but no document ties Upper Hills Creek to that program (winter schedules checked — see below).

## Regulatory status
- Not listed on the TWRA trout regulations page (no DH, no wild-trout designation) — plain put-and-take stocked water. Fetched 2026-09-25: https://www.tn.gov/twra/fishing-regs/trout-regulations.html

## Month-by-month planned stocking (TWRA schedule grids; "week of" Sundays; extraction by positioned-text decode, ±1-column ambiguity noted)
Exactly TWO planned events per year, every documented year: **first week of March + first week of April.**

| Year | Source | Planned stockings | Notes |
|---|---|---|---|
| 2003 | sched03.pdf | Mar 9, Apr 6 | |
| 2004 | sched04.pdf | Mar 7, Apr 4 | |
| 2005 | sched05.pdf | Mar 6, Apr 3 | |
| 2006 | sched06.pdf | Mar 5, Apr 2 | |
| 2007 | sched07.pdf | Mar 4, Apr 1 | |
| 2008 | sched08.pdf | Mar 2, Apr 6 | extraction edge column read "Apr 30" — one-column drift; first Sunday of April |
| 2009 | sched09.pdf | Mar 1, Apr 5 | drift read "Apr 29"; first Sunday of April |
| 2010 | sched10.pdf | Mar 7, Apr 11 | |
| 2011 | sched11.pdf | Mar 6, Apr 10 | |
| 2012 | sched12.pdf | Mar 4, Apr 8 | |
| 2013 | wb/sched13.pdf (Wayback 20130110160747) | Mar 3, Apr 7 | Sunday-validity check 2/2 |
| 2014 | sched14.pdf | Mar 2, Apr 6 | |
| 2015 | sched15.pdf | Mar 1, Apr 5 | |
| 2016–2017 | gap (schedule docs not located) | — | bracketed by 2015/2018 |
| 2018 | wb/sched18.pdf (2018-Trout-Stocking-Schedule.pdf, Wayback 20180717180317) | Mar 4, Apr 8 | |
| 2019-20 | complete_2019-20.pdf | Mar 1, Apr 5 | naive read "Feb 1" invalid — Feb 1, 2020 was a Saturday; column = Mar 1 |
| 2020 | complete_2020.pdf (byte-identical to 2019-20) | same | |
| 2021 | complete_2021a/b | Mar 7, Apr 11 | |
| 2022 | complete_2022a/b | Mar 6, Apr 10 | |
| 2023 | complete_2023a.pdf | Mar 5, Apr 9 | completed 04/12/2023 (see below) |
| 2024 | complete_2024a/b | Mar 3, Apr 7 | |
| 2025 | complete_2025a–d | **Feb 2, Apr 6** | Feb 2, 2025 IS a Sunday — genuine late-winter first event in 2025 only |
| 2026 | LIVE tn.gov JSON (retrieved 2026-09-25) | week of **3/22/2026** (TYPE "Seasonal", Rainbow Trout) | single row; one event listed |

## Completed (destination-level) row
- Coldwater Trout Stocking Schedule, updated 5/3/2023 (cw_2023may): "Region 3, Upper Hills Creek — **04/12/2023**" (April completion).
- Absent from all other quarterly Coldwater reports (Feb/May/Aug/Nov 2022, Feb/Aug 2023, Feb/May/Aug 2024) and from all winter trout schedules (2017-18, 2019-20, 2024-25 — grep/pymupdf negative).

## Interpretation / verdict
- 22 documented years (2003–2015, 2018–2026) show the same pattern: **two spring events, ~early March and ~early April** (2025's first event fell on Feb 2; 2026 lists one March event). Region 3 GIS labels the program "Spring".
- **No December, January, or February stocking appears in any planned or completed record, 2003–2026.** The winter trout program documents (which DO cover Dec–Feb waters) never list Upper Hills Creek.
- **Verdict: seasonal-stocked-trout is CONFIRMED, but the ledger months [12,1,2] are WRONG. Correct months: [3,4]** (allow 2 as a rare early variant in 2025). Confidence: HIGH (13 consecutive years of identical pattern + 2018–2026 completes + completed row + GIS "Spring" program label).

## Contradictions
- Ledger months [12,1,2] (winter-program signature) contradicted by every schedule grid 2003–2026 and the completed feed (April). Likely confusion with a different water's winter schedule.

## Gaps
- 2016–2017 grids not located (Wayback probe empty/IA outage); no pattern risk.
- Confluence/watershed position (which Collins River tributary) not pinned to a map source; identity rests on TWRA's county/city fields (Warren / Irving College) — considered reliable since it is TWRA's own GIS.

## Searches run (≥8)
1. WebSearch "Hills Creek" Warren County Tennessee Irving College Collins River (Hills Creek Rd, Irving College community)
2. WebSearch "Upper Hills Creek" trout stocking TWRA McMinnville "Irving College"
3. WebSearch "Upper Hills Creek" trout stocking Tennessee TWRA
4. WebSearch Warren County Tennessee trout stocking TWRA Charles Creek Barren Fork (confirms Warren Co. stocked-waters family incl. Hills Creek)
5. WebSearch "Hills Creek" Tennessee Caney Fork tributary Van Buren OR White County
6. WebSearch "Hills Creek" Tennessee stream "Van Buren County"
7. WebSearch Hills Creek Tennessee river Caney Fork GNIS (1968 "Hills Creek, Warren, TN" mussel record)
8. WebSearch TWRA winter trout program "Hills Creek" OR "Upper Hills" Middle Tennessee December January (negative — not in winter program)
Plus: positioned-text extraction across sched03–15/18, complete 2019–2025, winter schedules, CW quarterlies, live 2026 JSON; GIS layer attribute pull.

## Recommendation
- Keep `seasonal-stocked-trout`; replace months [12,1,2] with **[3,4]**; correct county to **Warren** (City: Irving College; Region 3); coordinates 35.5636/-85.6557 and 35.5642/-85.6568 (private land, contact Region 3).
