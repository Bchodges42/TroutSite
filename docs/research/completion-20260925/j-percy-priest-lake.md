# j-percy-priest-lake.md — J. Percy Priest Lake (Davidson/Rutherford counties)

Ledger verdict under test: `warmwater-focus`.
Research pass: 2026-09-25 (retrieval dates 2026-09-25 unless noted). Internal classification research only.

## 1. Identity / coordinates
- J. Percy Priest Reservoir: 14,200-acre USACE impoundment near east Nashville (dam completed 1969); downstream section in Davidson County, upstream in Rutherford County; full pool 490 ft MSL. Reservoir boundary for regs = full-pool elevation (TWRA).
- The stocked trout entity on this reservoir is NOT the lake: the trout water is the **tailwater below the dam (Stones River)** — covered by a sibling ledger water (`stones-river.md`, OBJECTID 660, "J. Percy Priest Tailwater", Stones River, Winter, 14,000 rainbow).

## 2. Source-by-source evidence

### 2.1 TWRA "J. Percy Priest Reservoir" where-to-fish page — agency, HIGH
- URL: https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/percy-priest-reservoir.html ; retrieved 2026-09-25 via Wayback capture 20260421054609 (local `completion/r2lake/percy-priest-reservoir.html`; page body text internally references 2019 electrofishing / "excellent catches… in 2021", i.e., content last refreshed ~2020-21).
- Species statement: "The best fishing opportunities are for **Largemouth Bass, Crappie, Hybrid Striped Bass (Cherokee Bass), White Bass, Yellow Bass, and Channel Catfish**." "What you can catch" sections: Black Bass (35% of effort), Crappie (20%; strong 2018 black-crappie year class), Hybrid Striped Bass ("Don't miss a summertime fishing trip for hybrid striped bass…"; TWRA-hatchery-produced Cherokee bass). Regulations list (black bass 5 combo/15" LMB/18" SMB; crappie 30 @10"; striper-hybrid 2 @15"; white bass 15; catfish; sunfish) contains **no trout row**. The only "trout" strings on the page are site-navigation links (Trout Fishing & Stockings / Trout Fishing Forecast).
- Establishes: reservoir-wide warmwater identity per the managing agency; zero trout fishery on the lake itself.

### 2.2 TWRA trout stocking program — negative, agency, HIGH
- 2026 schedule JSON (616 rows; local `completion/trout_2026_live.json`; URL https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json, retrieved 2026-09-25): NO row for "Percy Priest" as a lake — only "J. Percy Priest TW / Stones River" (sibling water).
- Winter schedules 2018-19 through 2024-25 (local PDFs/PNG renders: `winter_trout_2018.pdf`, `_work/winter-trout-stocking-report.pdf`, `~/wtr_20211220040958.pdf`, `~/wtr_20221217132301.pdf`, `~/wtr_20231214082920.pdf`, `~/wtr_2025_26.pdf`) list "J. Percy Priest Tailwater (Nashville, Davidson)" only — never the reservoir. Annual spring grids 2010–2025: no Percy Priest row.
- TWRA Trout Stocking Locations GIS layer (730 features; local `completion/arcgis_all.json`): exactly one trout site on this reservoir — OBJECTID 660, the tailwater. No open-lake trout site.
- Establishes: zero trout program in the reservoir proper; all trout effort = the tailwater sibling.

### 2.3 Records / dated corroboration
- Tennessee state record striped bass: 65 lb 6 oz, Cordell Hull Reservoir (Ralph Dallas, 2000) — TWRA records (tn.gov "Tennessee Fishing Records & Awards", surfaced via search 2026-09-25). Percy Priest's **lake-record** striper ≈ 47.7 lb (guide/aggregator sources, e.g., The Reel Deal Guide Service; LakeBrowser repeats it as 1998) — MEDIUM/LOW confidence, use only as color.
- Completed warmwater stocking: aggregator "Fishable Waters" (https://fishablewaters.com, retrieved via search 2026-09-25) lists "Jun 23, 2026 — J Percy Priest Reservoir, TN" hybrid striped bass stocking (fresh TWRA-derived data; MEDIUM confidence).
- eRegulations Tennessee 2026-27 Region 2 (retrieved 2026-09-25, https://www.eregulations.com/tennessee/fishing/region-2; sibling log cross-check): no trout waters in Region 2 reservoir regs; Percy Priest special regs only (crappie 30/10", striper-hybrid 2/15").
- TWRA Trout Management Plan 2017-2027 photo captions: "Winter trout anglers, J. **Percy Priest tailwater**, Nashville" — agency itself ties the trout opportunity to the tailwater, not the lake.

## 3. Contradictions / caveats
- None material. Naive text-mining of "Percy Priest" in trout documents will hit the TAILWATER rows; reach discipline (lake vs below-dam tailwater) resolves all of them.

## 4. Searches run (5)
(1) TWRA "J. Percy Priest" Lake fishing striped bass crappie tn.gov; (2) Tennessee state record striped bass "Percy Priest" 47.7; (3) "Percy Priest" OR "Old Hickory" lake trout stocking Tennessee; (4) TWRA "Percy Priest" crappie black bass fishing report 2025; (5) Percy Priest hybrid striped bass "Cherokee bass" fishing summer TWRA. Plus direct fetch: TWRA reservoir page (Wayback), TWRA records page attempt.

## 5. Recommendation
- Keep `warmwater-focus`. Lake proper: largemouth/crappie/hybrid-striper/white/yellow bass/catfish; TWRA hybrid stocking; no trout program, no trout regs, no trout schedule rows. Any trout classification belongs solely to the sibling Stones River tailwater water.
