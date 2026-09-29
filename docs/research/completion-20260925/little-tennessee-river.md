# Little Tennessee River (Blount/Monroe, TN — Chilhowee Dam to Tellico) — Trout Stocking Research Log

Research date: 2026-09-25 (all retrievals this date). Scope: internal classification research ONLY; no agency/business/author/angler contacted; only the named notes file written; no git writes.

Water under test: the Little Tennessee River segment from Chilhowee Dam down to Tellico Reservoir (ledger calls it an 11-mile river; seasonal months [2,3,4]).

**Headline geographic finding:** TWRA's own Tellico Reservoir page (retrieved 2026-09-25) states "At full pool, the reservoir extends 33 miles up the Little Tennessee River to Chilhowee Dam and 20 miles up the Tellico River." The segment in question IS the upper arm of Tellico Reservoir — there is no free-flowing river reach between Chilhowee Dam and "Tellico Reservoir"; Tellico's pool reaches Chilhowee Dam. Correspondingly, NO TWRA dataset contains a destination named "Little Tennessee" (river): zero rows in every annual schedule 2003–2026, zero rows in the 616-row 2026 JSON, zero sites in the 730-feature ArcGIS layer, zero completed-feed rows ever. What the segment receives is the **Tellico Reservoir (upper / "Little Tennessee Arm below Chilhowee Dam") reservoir-program stocking** plus the **Chilhowee Reservoir** program just upstream — the nine-reservoir winter-program family.

---

## SOURCES

### 1. TWRA Tellico Reservoir page (Bank & Boat Fishing Guide) — direct retrieval
- Org: TWRA. Publication: live agency page (page stamp 2026-09-23). Observation dates: current program description. Retrieved 2026-09-25 via reader proxy (cache lt_tellico_page.md; tn.gov blocks plain curl).
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/tellico-reservoir.html
- Fields/verbatim: "At full pool, the reservoir extends 33 miles up the Little Tennessee River to Chilhowee Dam and 20 miles up the Tellico River."; "The upper reaches of Tellico Reservoir in the Little Tennessee Arm below Chilhowee Dam can support trout due to the cold, well-oxygenated releases from the Chilhowee Reservoir. Rainbow Trout are stocked in the upper reaches of the reservoir below Dam. **About 4,500 catchable Rainbow Trout are released there in the late winter and early spring annually.**"; trout regs 7/day no length limit; Rainbow Trout listed among common game fish.
- Type/confidence: agency-primary current; HIGH.
- Establishes: the stocked destination for the Little Tennessee arm is the RESERVOIR program; season = "late winter and early spring" (≈Feb–Apr); ~4,500 rainbows/yr; stocked reach = upper reaches below Chilhowee Dam — i.e., the downstream end of the segment under test. Does NOT create a separate "Little Tennessee River" destination.

### 2. TWRA Chilhowee Reservoir page — direct retrieval
- Org: TWRA. Retrieved 2026-09-25 via reader proxy (cache lt_chilhowee_page.md).
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/chilhowee-reservoir.html
- Verbatim: "Trout are stocked on an annual basis and thrive in the cool, clear water."; "The TWRA stocks trout on a regular basis. Lake Trout have been stocked in the past, but not recently…"; 7/day creel (2 lake trout clause legacy).
- Type/confidence: agency-primary; HIGH (upstream end of the segment; sibling log chilhowee-lake.md carries the same quotes).

### 3. TWRA 2026 Trout Stocking Schedule JSON (live, 616 rows)
- Retrieved 2026-09-25 (trout_2026_live.json).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: zero rows with LOCATION "Little Tennessee" (any spelling/case). Reservoir-program rows that bracket the segment: REGION 4 | Blount/Monroe | "Calderwood Reservoir" | TYPE Reservoir | STOCKING MONTHS "N, D" | Rainbow; REGION 4 | Blount/Monroe | "Chilhowee Reservoir" | TYPE Reservoir | STOCKING MONTHS "F, N, D" | Rainbow. Tellico Reservoir itself has NO 2026 JSON row (32 Tellico rows are all "Tellico River", the Region 3 stream — a different water; tellico-river.md is the sibling log).
- Type/confidence: agency-primary; HIGH for the negative (no Little Tennessee destination) and for Chilhowee months Feb/Nov/Dec.
- Establishes: current winter-reservoir program months for the impoundments at both ends: Chilhowee F/N/D; Calderwood N/D. No Feb/Mar/Apr "river" rows.

### 4. Annual schedules 2003–2025 (all years examined)
- Org: TWRA. Position-aware extraction of sched03–sched09b (Wayback), sched10–15b, sched2018/2019, cp-2020…cp-2025 (tn.gov captures; MD5 replay trap documented in salt-lick-creek.md §3).
- Fields: zero rows named "Little Tennessee" in any year. (Search string checked in all extracted text: only Region 4 report mention is a monitoring footnote, below.)
- Type/confidence: agency-primary; HIGH negative.
- Establishes: no scheduled "Little Tennessee River" stocking in 23 years.

### 5. TWRA ArcGIS Trout Stocking Locations layer (730 features)
- Retrieved 2026-09-25 (arcgis_all.json).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Fields: zero StreamName "Little Tennessee". The segment's banks carry only Reservoir-class rows: "Chilhowee Reservoir" ×4 (35.55672/-84.01139, 35.50859/-84.00522, 35.52452/-83.99363, 35.55551/-83.99862), "Tellico Reservoir" ×2 (35.54713/-84.06598, 35.55204/-84.09194, City Tallassee), "Calderwood Reservoir" ×2 — all StockingProgram "Reservoir", Species "rainbow". (Sibling tellico-lake.md also records the Region 3 "Tellico (upper)" 35.55635/-84.10990 master row.)
- Type/confidence: agency site master; HIGH.
- Establishes: no stocked site exists on the segment as a stream; nearest sites are the Tellico Reservoir "Tallassee" rows immediately below Chilhowee Dam and the Chilhowee Reservoir rows above it. The "same winter program's outflow" hypothesis is CONFIRMED as adjacency: the reservoir program stocks essentially at both ends of the segment.

### 6. Trout Management Plan 2017–2027 (Habera et al., TWRA Fisheries Report 17-10, Oct 2017) — via sibling log
- Cache: sibling log tellico-lake.md §3 (retrieved 2026-09-25; eregulations mirror of the 2023 Tentative Schedule also on disk).
- Verbatim (as quoted there): nine reservoirs "…Calderwood, Chilhowee, and Tellico…"; "Trout are stocked during the winter to assure that surface water temperatures are cold enough for their survival. Stocking later in winter (March vs. January) can help decrease mortality due to predation…"; 2023 schedule box: "The following reservoirs are stocked with trout during the winter to provide year-round trout fishing opportunities" incl. "Chilhowee (Rainbow)" and "Tellico (upper) — Rainbow Trout".
- Type/confidence: agency management plan + schedule box; HIGH.
- Establishes: program family and winter season framing for both impoundments bracketing the segment.

### 7. Completed feeds — negative
- 2024-06-07 archive (54 rows), 12/3/2024 report, 3/21/2025 report, 8/29/2025 report, live 2026-09-24 completed feed (10-row window): zero "Little Tennessee" rows (also zero Tellico Reservoir rows; sibling tellico-lake.md logs the one ambiguous bare-"Tellico" 04/22/2022 Region 3 completed row = reservoir destination, UNRESOLVED).
- Type: negative; HIGH confidence in the negative for the river name.

### 8. Independent occurrence checks (supporting only)
- GBIF (O. mykiss box 35.50–35.60 / -84.15–-83.95; retrieved 2026-09-25): 1978 "Little Tennessee River below Chilhowee Dam (prior to Tellico Dam)" (TVA/UT collection, 35.5464/-84.0527); 1974 Jones Island record; 1957 Tabcat Creek (Surber/Lennon); 2026 community obs. Historic cold-tailwater trout presence below Chilhowee Dam — predates/corresponds to reservoir program, not a river stocking voucher.
- iNaturalist (API, retrieved 2026-09-25): 4 rainbow obs in 10 km, incl. 2026-06-11 — summer catch consistent with a put-and-take reservoir arm fishery; not month evidence for stocking.
- Search corroboration (WATE via sibling + search): "Chilhowee Lake, Calderwood Lake, and upper part of Tellico Lake are among the state reservoirs TWRA stocks to provide year-round trout fishing opportunities"; Region IV reservoir rainbow stocking "late winter" (Johnson City Press Feb 2026 context).

---

## MONTHS-BY-YEAR TABLE (for the segment, via the reservoir programs at its ends)

| Year | "Little Tennessee River" schedule rows | Program evidence at segment | Months supported |
|---|---|---|---|
| 2003–2015 | none | (reservoir program winter framing from TMP family; no per-year lake grids in these files) | winter (weak) |
| 2016–2017 | none | GAP (schedules unarchived) | — |
| 2018–2025 | none | Reservoir program active (nine-reservoir list; "Tellico (upper)" box in 2023 schedule; Chilhowee listed annually) | winter → early spring |
| 2022 | none | Completed "Tellico" 04/22/2022 (Region 3 bare-Tellico row; sibling log) | Apr (reservoir dest., medium confidence) |
| 2026 | none | Chilhowee Reservoir "F, N, D"; Calderwood "N, D"; TWRA page "~4,500 … late winter and early spring annually" (Little Tennessee Arm below Chilhowee Dam) | Feb (+Nov/Dec upstream); late winter–early spring for the arm |

Species: Rainbow Trout only (page, GIS, JSON). Type: Reservoir program (not Seasonal stream rows, not Delayed Harvest).

## Verdict / recommendation
- There is NO TWRA destination called "Little Tennessee River" in any dataset 2003–2026. The segment is, by TWRA's own description, the upper arm of Tellico Reservoir ("extends 33 miles up the Little Tennessee River to Chilhowee Dam"), receiving ~4,500 rainbow trout/yr in the "Little Tennessee Arm below Chilhowee Dam" in the **late winter and early spring**.
- Ledger months [2,3,4] are consistent with "late winter and early spring" and with the winter-program framing (TMP: winter stocking; "March vs. January" note), but they describe the RESERVOIR program, not a river schedule.
- Recommendation: do NOT carry a standalone "Little Tennessee River" stocked-destination entry. Reclassify/merge as **Tellico Reservoir (upper / Little Tennessee Arm)** — the existing tellico-lake.md classification (year-round-trout flag, months [2,3,4] Feb–Apr stocking window) already covers it. If the map must keep a labeled river segment, label months **[2,3,4] with a YR-style flag carried over from the reservoir fishery and confidence MEDIUM-LOW**, explicitly derived from the reservoir program (no independent schedule rows). Completed-level evidence: none for the river name.

## Contradictions
- "11-mile river between Chilhowee and Tellico" framing vs. TWRA "33 miles up the Little Tennessee River to Chilhowee Dam" (reservoir pool) — the reservoir reaches the dam; the segment is impounded.
- Ledger assumption "maybe the same winter program's outflow" — supported in the adjacency sense (stocking sites sit at both ends: Chilhowee Reservoir rows upstream, Tellico Reservoir "Tallassee" rows at the arm just below the dam), but no program stocks "the river" itself.
- 2026 JSON lacks a Tellico Reservoir row entirely (scheduling published as the program box + GIS rows, like sibling tellico-lake.md found) — an internal TWRA publication inconsistency, not evidence against the program.
- Cold tailwater from Chilhowee Dam does support trout through the gorge (GBIF 1978; TVA/USGS tailwater studies via search), so fish are present year-round — presence must not be read as a river stocking schedule.

## Searches run (2026-09-25)
1. "Little Tennessee River" trout stocking Chilhowee dam tailwater TWRA — ORNL DO mitigation study; AFS trout committee; no river program.
2. Little Tennessee River Tellico Reservoir rainbow trout stocked "late winter" Tallassee — TWRA Tellico page (4,500/late winter-early spring), Game & Fish, Hiwassee TU.
3. Chilhowee Dam to Tellico Dam Little Tennessee River fishing gorge "The Narrows" trout — gorge access (TN-129), Chilhowee cold tailwater fishery context; no stocked-destination evidence.
4. TWRA reservoir trout "nine reservoirs" Tennessee winter stocking Tellico Chilhowee Calderwood — winter program 2025-26 (70,000+ trout, 40+ locations); winter schedule PDF path.
5. WATE "when does TWRA start spring trout stocking in east Tennessee" (via searches) — Region IV spring + reservoir list.
6. Underlying opens: TWRA Tellico Reservoir page (full text), TWRA Chilhowee Reservoir page (full text), 2026 JSON reservoir rows, ArcGIS layer reservoir rows (730 features swept), GBIF box query, iNaturalist box query, all 23 annual schedules (name sweep = 0), completed feeds sweep (0), winter_trout_2018.txt sweep (0), sibling logs tellico-lake.md / chilhowee-lake.md (TMP nine-reservoir verbatim, Region IV report negatives).
7. "Little Tennessee River" name sweep across every local schedule text/PDF extraction — 0 hits (only r4-2018.txt monitoring footnote).
