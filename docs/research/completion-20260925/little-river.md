# Little River (Blount County, TN) — year-round flag audit
Retrieval date for all sources: 2026-09-25. Research only; no agency contacted.

Ledger verdict under test: `year-round-trout`, YR flag, no months.
**Conclusion up front: the year-round verdict does NOT survive. TWRA itself types Little River "Seasonal." Stocking is biweekly late Feb–mid/late Jun + a small fall wave (late Sep–early Nov, varies by year). No TWRA stocking Jul–Sep or Dec–Feb in any retrieved year 2010–2026. No agency holdover documentation for the stocked reach. The in-park reach is a wild NPS fishery (no stocking since 1974/75). Recommend re-class to seasonal (stocked reach) or split into park-wild reach vs. stocked Townsend–Walland reach.**

---

## The water and its reaches
- Little River rises on Clingmans Dome (Sevier Co.), flows ~95 km through GSMNP (Elkmont), then Townsend → Walland → Rockford → Fort Loudoun (Blount/Knox).
- **Park reach (Elkmont→Townsend):** wild rainbow + brown trout, managed by NPS. No stocking since 1975.
- **Stocked reach (Tuckaleechee Valley, Townsend→Walland, OUTSIDE park):** TWRA put-and-take rainbow trout "in spring and fall as water temperatures allow." All 11 TWRA stocking access points sit at 35.670–35.699 N, −83.717 to −83.799 W (Townsend/Walland; west of the park boundary).
- Stocking points: ArcGIS OBJECTIDs 332–341 + 401, `TWRA_Trout_Stocking_Locations/FeatureServer/0`, Region 4, Blount/Townsend, StockingProgram = **Spring**, species = rainbow, management = Private Land (one County).
- Not on TWRA's wild-trout special-regulations list (checked tn.gov trout-regulations page).

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows)
- Org: Tennessee Wildlife Resources Agency (tn.gov). Publication: current 2026 season page. Observation dates = planned weeks.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (browser-context fetch; local capture `tmp/research/completion/schedule2026-jina.txt`, `trout_2026_live.json`)
- Fields: REGION 4 | COUNTY Blount | LOCATION "Little River" | TYPE **"Seasonal"** | SPECIES "Rainbow Trout"; STOCKING MONTHS empty.
- Rows (week-of Sundays): 2/22, 3/8, 3/22, 4/5, 4/19, 5/3, 5/17, 5/31, 10/25, 11/8 — all /2026. 10 rows.
- Establishes: 2026 seasonal plan, Feb 22–May 31 + Oct 25–Nov 8; type Seasonal. Disambiguation: all "Little River" rows in the JSON are COUNTY=Blount (no other Little River rows).

### S2. TWRA archived grid schedules, 2010 and 2018–2021 (pdf, word-coordinate mapping)
- Org: TWRA / state.tn.us & tn.gov; retrieved via prior local captures + Wayback.
- Files + URLs:
  - 2010: `state.tn.us` grid — local `tmp/research/raw/sched10.pdf` (Wayback sched10.pdf, 83 KB)
  - 2018: local `tmp/research/completion/scheds/ts2018.pdf`
  - 2019: `tmp/research/completion/scheds/ts2019b.pdf`
  - 2020: `tmp/research/raw/schedcomplete_2020.pdf`
  - 2021: https://web.archive.org/web/20211009224615if_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf (md5 41e350cc189550dbe358e555e4218d09)
- Method: PyMuPDF word coordinates; ●/X marks mapped to header week columns; verified alignment against computed Sundays.
- Little River rows (week-of Sundays):
  | Year | Spring wave | Fall wave | Total |
  |---|---|---|---|
  | 2010 | Feb 28–Jun 20 biweekly (9) | Oct 3, 17, 31 (3) | 12 |
  | 2018 | Mar 4–Jun 24 biweekly (9) | Sep 30, Oct 14, Oct 28 (3) | 12 |
  | 2019 | Mar 3–Jun 23 biweekly (9) | Sep 29, Oct 13, Oct 27 (3) | 12 |
  | 2020 | Mar 1–Jun 21 biweekly (9) | Oct 11, Oct 25 (2) | 11 |
  | 2021 | Mar 7–Jun 27 biweekly (9) | Oct 10, Oct 24 (2) | 11 |
- Establishes: 5 fully-parsed years, all seasonal; no Jul–Sep, no Dec–Feb marks. Confidence high.
- Note (lower confidence): 2011–2013 grids (`sched11/12/13.pdf`) show 12 marks for Little River each year (same count as verified years) but text-layer column mapping was unreliable; counts consistent with the same spring+fall pattern.

### S3. TWRA Complete schedules 2023, 2024, 2025 (Wayback PDF captures, same method)
- URLs:
  - 2023: https://web.archive.org/web/20230220040610if_/.../Trout-Stocking-Schedule-Complete.pdf (md5 3a748e6be6b707661cfc2ac1e5c78cf4)
  - 2024: https://web.archive.org/web/20240222194223if_/... (md5 c3cfa00d91882b0562f41e2d29479838)
  - 2025: https://web.archive.org/web/20250320072447if_/... (md5 fecd884cb771df2ac65646b153f4aac5)
- Little River rows: 2023 Feb 26–Jun 18 (9) + Oct 8, Oct 22; 2024 Feb 25–Jun 16 (9) + Oct 6, Oct 20; 2025 Feb 23–Jun 1 (8) + Oct 12, Oct 26.
- Establishes: identical seasonal pattern 2023–2025. Confidence high.

### S4. Cabins on Little River (lodge website reprint of TWRA schedule)
- Org/author: cabinsonlittleriver.com (Townsend lodge; unaffiliated reprint). Retrieved 2026-09-25.
- URL: https://www.cabinsonlittleriver.com/area-info/
- Text: "2025 TWRA TENTATIVE TROUT STOCKING SCHEDULE FOR LITTLE RIVER in TOWNSEND, TN": Feb 23, Mar 9 & 23, Apr 6 & 20, May 4 & 18, Jun 1, Oct 12 & 26.
- Establishes: independent 2025 confirmation of the S3 grid (and disambiguates one column in S3's 2025 row). Confidence medium-high (secondary source, matches primary).

### S5. Completed-stocking feeds (destination-level)
- (a) TWRA completed JSON, Wayback capture 20240607: https://web.archive.org/web/20240607134309if_/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json — "Little River", Region 4, Stocking Date 06/03/2024 (executed June week, matching the Jun 2 week-of row).
- (b) Same feed, live Sept 2026 capture (`completed2026-jina.txt`, published 9/24/2026): rolling ~30-day window; Little River not in window (fall wave had not started).
- (c) Live tn.gov page text (9/21/2026 report header; local `stockings-live.html.txt`): jumbled datatable includes "Little River 6/11/2026" — lead for a June 11, 2026 execution of the late-spring wave; treat as single-catch lead (column jumble).
- (d) 2022 "Coldwater Trout Stocking Schedule" monthly snapshots (Wayback): Feb 18 2022 winter list — Little River ABSENT; May 19 2022 list — "4 Little River 05/10/2022"; Jun 29 2022 list — "4 Little River 06/06/2022"; Aug 19 2022 list — ABSENT (summer gap).
- Establishes: destination-level executed stockings in late spring/early June; absence from winter and midsummer lists. Confidence high.

### S6. TWRA 2010 Warmwater Streams Report — Little River chapter
- Org/author: TWRA Region IV (report by TWRA biologists). Publication: 2010. Observation/survey dates: July 6–9, 2010 (IBI sites at Coulters Bridge RM 20 and Townsend).
- URL: https://web.archive.org/web/20200126014817if_/https://www.tn.gov/content/dam/tn/twra/documents/region-iv-reports/Warmwater-Streams-Report-2010.pdf (local `raw/ww2010.pdf/.txt`)
- Key quotes (pinned): "Little River's gradient becomes moderate as it leaves the National Park and flows through the Tuckaleechee Valley from Townsend to Walland. Excellent populations of smallmouth bass and rock bass exist there, and **rainbow trout are stocked in spring and fall as water temperatures allow**." And: "The Little River fishery within the National Park boundary is primarily wild rainbow and brown trout... An excellent trout fishery exists, and is managed by the National Park Service." Also: "...even stocked rainbow trout **when water temperatures allow**."
- Establishes: agency statement that stocking = spring + fall, temperature-limited (i.e., off in summer; nothing in winter); the stocked reach is Townsend–Walland; the park reach is wild NPS water. This is the causal explanation of the schedule gaps. Confidence high.

### S7. NPS GSMNP fishing page
- Org: National Park Service. URL: https://www.nps.gov/grsm/planyourvisit/fishing.htm (fetched 2026-09-25)
- Quotes: "The National Park historically stocked non-native trout for recreation until 1975, when it was deemed inconsistent with NPS policies." "Fishing is permitted year-round in open waters..." Mentions "East Prong of Little River from Townsend to the Sinks" (smallmouth context).
- Establishes: park reach unstocked since 1975; park fishing season is year-round (but that is NPS, wild fish — not a TWRA stocking program). Confidence high.

### S8. TWRA trout regulations page (wild trout / special regs)
- URL: https://www.tn.gov/twra/fishing-regs/trout-regulations.html (fetched 2026-09-25)
- Little River NOT listed among wild-trout special-regulation streams. Establishes: no TWRA wild-trout designation carrying the lower river; classification rests on stocking + NPS park fishery. Confidence high.

### S9. GBIF/iNaturalist occurrences (context only)
- GBIF API bbox 35.60–35.78 N, −83.95–−83.60 W: Oncorhynchus mykiss and Salmo trutta observations (iNaturalist research-grade, 2026) in/around the park reach and Townsend area. Establishes presence of wild rainbow/brown in the corridor (supports "trout present year-round" in park reach; does not establish year-round fishery in the stocked reach). Confidence low-medium (coarse coordinates).

### S10. eRegulations tentative schedule PDF (secondary)
- URL: https://www.eregulations.com/assets/docs/resources/TN/Trout_Stocking.pdf (fetched 2026-09-25). Little River row present with seasonal ● marks; layout extraction garbled county alignment. Establishes presence in the current tentative schedule only. Confidence low (rendering).

## Months supported, by year (planned weeks unless noted)
| Year | Months with rows | Evidence |
|---|---|---|
| 2010 | Feb(late), Mar, Apr, May, Jun, Oct | sched10 grid (high) |
| 2011–2013 | Mar–Jun + Oct pattern (12 marks/yr; column mapping degraded) | sched11–13 (medium) |
| 2014–2017 | not retrieved (dead Wayback PDFs) | gap |
| 2018 | Mar–Jun + Sep(late), Oct | ts2018 (high) |
| 2019 | Mar–Jun + Sep(late), Oct | ts2019 (high) |
| 2020 | Mar–Jun + Oct | sched2020 (high) |
| 2021 | Mar–Jun + Oct | Complete.pdf 2021 (high) |
| 2022 | May, Jun (executed: 5/10, 6/6); absent Feb & Aug | coldwater snapshots (high) |
| 2023 | Feb(late)–Jun + Oct | Complete 2023 (high) |
| 2024 | Feb(late)–Jun + Oct; executed 6/3 | Complete 2024 + completed feed (high) |
| 2025 | Feb–Jun + Oct | Complete 2025 + cabins page (high) |
| 2026 | Feb(late)–May + Oct(late), Nov | 2026 JSON (high, TYPE=Seasonal) |

Never stocked: Jul, Aug, Sep (except 5-day execution spill into Sep 30/early Oct weeks in 2018–19), Dec, Jan, Feb (except late-Feb starts 2010/2023–26).

## Contradictions and gaps
- The live page's jumbled datatable shows "Little River 6/11/2026" — possible extra June 2026 execution; unverified (S5c).
- A 2019 "winter trout stocking in the Townsend area" lead resolved to Maryville's Pistol Creek/Greenbelt Lake (Daily Times, Nov 23, 2019) — NOT Little River. No evidence of any winter Little River stocking 2010–2026.
- 2014–2017 schedules not recovered (Wayback captures empty). 2011–2013 columns only count-verified. Neither gap plausibly hides a year-round program given 9 fully-parsed years + the 2010 agency statement + 2026 "Seasonal" type.
- Species: rainbow only in every retrieved row (2010–2026); browns in the park reach are wild NPS fish.

## Searches run (Little River)
1. WebSearch: TWRA trout stocking "Little River" Townsend Blount County rainbow trout — schedule/program confirmations.
2. WebSearch: GSMNP stopped stocking trout 1974 Little River wild rainbow brown — NPS history; park wild fishery.
3. WebSearch: TWRA wild trout streams list class I II III "Little River"/"Cosby Creek" — no list entry found.
4. WebSearch: TWRA fishing forecast Little River Townsend — no dedicated forecast; Fishbrain "season open year-round" (regulation, not stocking).
5. WebSearch: Little River Outfitters Townsend fishing report winter TWRA stocking lower river — reports exist; no winter stocking claims for the lower river.
6. WebSearch: Daily Times Townsend winter rainbow trout stocking 2019 — resolved to Pistol Creek/Maryville (contradiction removed).
7. WebSearch: TWRA trout stocking schedule 2025 "Little River" Blount "Cosby Creek" Cocke — tn.gov + Jefferson County Post lead.
8. WebSearch: Little River Tuckaleechee Townsend Walland TWRA "spring and fall" stocked — surfaced cabins page + Complete.pdf path.
9. WebSearch: "Little River" Blount/Cosby 2022 OR 2023 schedule news — mywaterlevel.com listing (LR Blount, Cosby Cocke); nothing new.
10. WebFetch: NPS GSMNP fishing page (S7). 11. WebFetch: tn.gov trout-regulations (S8). 12. WebFetch: eregulations.com/tennessee/fishing (no rows). 13. WebFetch: eregulations Trout_Stocking.pdf (S10). 14. WebFetch: cabinsonlittleriver.com/area-info (S4). 15. GBIF API bbox Townsend (S9). 16. Unproductive: "winter holdover Little River stocked reach" (no agency source); yelp/social noise; iNat via GBIF only.

## Recommendation
- **Do not keep `year-round-trout` for the stocked Blount water.** TWRA's own 2026 TYPE is "Seasonal"; 9 fully-parsed years (2010, 2018–2021, 2023–2026) show Mar–Jun (+late Feb in some years) and a 2–3-event fall wave (late Sep–early Nov); zero Jul–Sep and zero Dec–Jan events in any year; 2010 Region IV report explains it ("spring and fall as water temperatures allow").
- Re-class: **seasonal-trout (stocked)** with months **Mar, Apr, May, Jun + Oct (and Nov where 2026 applies; late Feb rows in 2010/2023–26)**; species rainbow.
- If the ledger's subject is the whole river including the park reach, split it: **park reach = wild rainbow/brown, year-round open season (NPS), no stocking since 1975**; **Townsend–Walland reach = TWRA seasonal put-and-take rainbow (spring + fall)**. A "year-round-trout" label is defensible only for the NPS wild reach, not for the TWRA stocking program the ledger row appears to describe.
- Confidence: high for the seasonal verdict; the exact fall-month wording should say "Oct (Sep 30 in 2018–19; extends into Nov 8 in 2026)".
