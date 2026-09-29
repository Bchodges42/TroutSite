# Norris Lake (Norris Reservoir, Clinch + Powell rivers) — Evidence Completion Log

- Ledger verdict at start: `warmwater-focus` (verify/strengthen). CAREFUL items: the famous Norris Dam TAILWATER trout is the separate clinch-river row; verify the LAKE's own fishery is warmwater and that the lake is NOT on the nine-reservoir trout list; check whether Clinch-TW washdown trout enter the lake.
- Research date: 2026-09-25 | Mode: internal classification research, read-only (no docs/ edits, no git writes, no parties contacted)

## Identity

- TVA's first reservoir (dam completed 1936), impounding the Clinch and Powell rivers; 34,200 acres (TWRA; TVA cites ~33,850), ~800 miles of shoreline; Anderson/Campbell/Union/Grainger counties. Norris Dam at 36.2243,-84.0919 (OSM Nominatim, retrieved 2026-09-25) — the dam is at the DOWNSTREAM (south) end; the Clinch tailwater flows south past Clinton toward Melton Hill. TWRA Region 4.

## Sources

### S1. TWRA Norris Reservoir "Where to Fish" page (committed capture)
- Title: "Norris Reservoir" | Org: TWRA (no byline)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/norris-reservoir.html (capture: docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-norris-lake.html)
- Publication: undated agency page; retrieved 2026-09-25.
- Fields: "What you can catch" = Black Bass ("Norris is noted for its Smallmouth Bass fishing. The best fishing is from November to April"; SMB regs: June 1–Oct 15 one fish 18-in MLL, Oct 16–May 31 five fish 15-in), Striped Bass ("Norris yielded a 49.5 lb state record striped bass in April 1978. Norris receives about 103,000 Striped Bass fingerlings every year"), Crappie ("natural reproduction... typically low... hatchery supported by stocking about 103,000 crappies... every year"), Walleye ("one of the better Walleye populations in the region... hatchery supported... stocked... annually. About 240,000 fish... Lake Erie strain... a river strain (Rockcastle)... introduced"). Regulations also list sauger (walleye/sauger 5/day combined upstream to Grissom Island), white/yellow bass, muskellunge 1/day 36-in MLL, paddlefish, catfish, sunfish.
- TROUT: zero trout mentions in page content — the only "trout" strings are site-navigation chrome. No trout species section, no trout regulation line for the reservoir.
- Type: agency reservoir profile. Confidence: high.
- Establishes: the lake's own fishery is a stocked warmwater program (stripers ~103k/yr, walleye ~240k/yr, crappie ~103k/yr, noted smallmouth) with NO trout component.

### S2. Trout Management Plan 2017–2027 — Norris is NOT on the nine-reservoir trout list
- Title: "Trout Management Plan for Tennessee 2017–2027" | Authors: Habera et al. | Org: TWRA Fisheries Report No. 17-10, Oct 2017 | Local cache: tmp/research/data/reports/Tennessee-Trout-Management-Plan-2017-2027.pdf (+.txt); retrieved 2026-09-25.
- Fields: "Tennessee has nine reservoirs that currently support trout fisheries: Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (~62,400 acres total)." NORRIS (the reservoir) appears NOWHERE in that list. All 11 "Norris" mentions in the plan refer to the NORRIS TAILWATER: managed tailwater plans ("Wilbur, South Holston, Norris, Center Hill, and Apalachia tailwaters"), brown trout capability ("most successful in the Norris... tailwaters"), stocked adult Brook Trout tailwater list (Norris among them), heavily-fished tailwater creel data ("Wilbur, Norris, South Holston... 20,000 to 25,000 trips per year"), Norris tailwater slot PLR (14–20 in), Didymo in "Norris... tailwaters," ADA access at "the Norris tailwater (Clear Creek and Miller's Island)."
- Type: agency management plan. Confidence: high.
- Establishes: program-level exclusion of Norris LAKE from Tennessee's reservoir trout fisheries; the trout identity belongs to the tailwater (separate clinch-river row).

### S3. 2026 trout schedule JSON + TWRA ArcGIS layer — lake excluded, tailwater present
- 2026 TWRA trout stocking schedule JSON (616 rows; https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json; retrieved 2026-09-25 live + full local snapshot `trout_2026_live.json`): the ONLY Norris/Clinch row is "Norris Tailwater / Clinch River," Anderson Co., TYPE "Tailwater," Rainbow + Brown, months M,A,M,J,J,A,S — zero rows for the reservoir proper (no "Norris Lake" destination).
- TWRA ArcGIS TWRA_Trout_Stocking_Locations (services3.arcgis.com/PWXNAH2YKmZY7lBq, REST, retrieved 2026-09-25): 4 "Norris" features — Massengill Bridge, Miller's Island, Peach Orchard access, Clear Creek — ALL StreamName "Norris Tailwater," WaterClass "stream," StockingProgram "Tailwater." Nothing inside the lake.
- Type: planned schedule + agency site master. Confidence: high.
- Establishes: every trout stocking unit in the Norris system is below the dam.

### S4. Dated warmwater source #1 — current species report (July 2026)
- "Norris Lake, TN Fishing Report" | Org: aa-fishing.com | "Last updated on July 13, 2026"; https://www.aa-fishing.com/tn/norris-lake-fishing-report.html ; retrieved 2026-09-25.
- Fields: striped bass — "holds a multitude of stripers exceeding 50 pounds. Summer is famous for trophy striped bass" (report Good / outlook Very Good-Excellent); smallmouth — "widely-known a great smallmouth bass fishery, with the best fishing from early November to late April" (1-fish 18-in June 1–Oct 15 rule echoed); walleye — "stocked annually with Lake Erie strain walleye and Rockcastle Walleye... quite good as a result, for the last decade"; crappie spring brushpattern. Rainbow/brown trout appear ONLY in a generic species list with NO trout report, tips, or statements.
- Type: dated current guide (Jul 13, 2026). Confidence: medium (agency-consistent).
- Establishes: the lake's celebrated fisheries, as of 2026, are striper/smallmouth/walleye/crappie — warmwater.

### S5. Dated warmwater source #2 — striper fishery profile + smallmouth management news
- BestFishingInAmerica TN striper profile (https://www.bestfishinginamerica.com/tennessee-striper-fishing.html; site © 2026; retrieved 2026-09-25): Norris Lake — TWRA stocks "over 100,000 striper fingerlings here annually"; "It's not unusual to catch 20 to 30 stripers per day," many 10–15 lb; winter creek-mouth fishery (Lost Creek "a sure bet in winter"; TN-33 bridge to Hickory Star Marina); summer thermocline pattern. Consistent with S1's 103,000/yr.
- WebSearch surfaced: "Norris Lake Committee Sticks With 17-22 Smallmouth Slot Limit" (Chattanoogan.com headline; Norris Lake Fisheries Advisory Committee keeping a smallmouth protected-length range — echo of the slot/PLR management history also cited in the TMP for the Norris tailwater) and Game & Fish "36 Great Fishing Trips in Tennessee" (best nighttime smallmouth on Norris "in the lower half of the lake, over humps, points"). Outlets' article-level dates not retrievable during rate-limit windows — treated as lead-level corroboration.
- Type: dated/current media. Confidence: medium (BestFishing), low (headline-level items).
- Establishes: sustained, intensively followed warmwater fisheries (striper numbers fishery; smallmouth with its own stakeholder management process).

### S6. Washdown check — GBIF/iNaturalist
- api.gbif.org box 36.02–36.50 N, 84.35–83.70 W, retrieved 2026-09-25: Oncorhynchus mykiss total 9; Salmo trutta total 95; Salvelinus fontinalis 0. The records cluster at 36.21–36.22,-84.07/-84.09 and 36.13,-84.12 — i.e., AT and immediately below Norris Dam (36.2243,-84.0919) along the tailwater corridor toward Clinton — matching the Tailwater stocking program, not the lake.
- Type: occurrence database. Confidence: medium (cluster interpretation rests on OSM georeferencing of the dam).
- Establishes: trout presence in the Norris system is concentrated on the tailwater; washdown of tailwater trout into the reservoir's upper Clinch/Powell arms is plausible during high flow but is documented only as scattered presence records — presence ≠ fishery; no source documents a lake trout fishery or stocking.

## Contradictions
- C1: Common conflation of "Norris trout fishing" with the lake — every trout asset (TMP, 2026 schedule, ArcGIS, GBIF clusters) resolves to the tailwater below the dam. Ledger must keep the clinch-river row strictly separate from the lake row.
- C2: aa-fishing's generic species list includes rainbow/brown trout for Norris Lake with zero supporting report content — boilerplate noise, not evidence.

## Searches run (7)
1. DDG: Norris Lake striped bass fishing Tennessee record (bot-blocked)
2. DDG: Norris Lake smallmouth bass fishing winter (bot-blocked)
3. WebSearch: Norris Lake smallmouth bass fishing winter float and fly Tennessee (partial hit: forum-level smallmouth fishery evidence)
4. DDG: Norris Lake trout fishing lake stocked rainbow (bot-blocked)
5. DDG: Norris Reservoir TWRA fisheries report black bass crappie PDF (bot-blocked)
6. WebSearch/Bing-via-WebFetch: "Norris Lake" fishing news striped bass OR smallmouth 2026 (hit: Chattanoogan slot-limit headline, eRegulations date stamp, Game & Fish trips piece; TVA Norris page 403)
7. WebSearch: chattanoogan.com Norris Lake committee smallmouth slot limit (rate-limited; headline retained as lead). Direct fetches: aa-fishing Norris (Jul 2026); BestFishingInAmerica striper profile; TVA Norris page (403); GBIF API; ArcGIS REST; 2026 schedule JSON; TMP 2017–2027 local cache.

## Recommendation
CONFIRM `warmwater-focus` for Norris Lake, confidence high. The lake's own fishery is a stocked warmwater program — striped bass (~103,000 fingerlings/yr; 49.5-lb state record Apr 1978; 50-lb-class fish still taken), walleye (~240,000/yr; Lake Erie + Rockcastle strains), crappie (~103,000/yr hatchery support), and its noted Nov–Apr smallmouth fishery — with zero trout content in the agency profile. The lake is NOT on the TMP nine-reservoir trout list, has no trout row in the 2026 schedule or TWRA GIS, and every trout asset in the system belongs to the Norris Dam tailwater (separate clinch-river row). Tailwater washdown into the lake is a presence-level nuance only; it does not support any trout-fishery classification for the reservoir.
