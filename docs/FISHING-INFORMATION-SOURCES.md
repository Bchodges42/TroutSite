# Fishing-information sources — Tennessee (data-sources lane)

**Verified:** 2026-09-04 (live page fetches from this lane unless marked otherwise) ·
**Machine-readable twin:** `packages/content/data/fishing-information.json` → served at
`GET /content/fishing.json` (contract `FishingInformationSchema`, additive).

This document records WHERE every piece of fishing information in the app comes from,
what was verified, and what could NOT be verified. The content it describes separates
statewide information from water-specific rules (`appliesTo` lists exact catalog
waterIds; an item without `appliesTo` is statewide). Nothing here is a legal
guarantee — every item carries its official source URL and the content carries a
standing disclaimer directing users to the current official regulation.

## Regulation year and effective dates

- The Tennessee fishing regulation year runs **August 1 – July 31**.
  - TWRA news release (2025-08-01) announcing the 2026-27 cycle: approved regulations
    "go into effect Aug. 1, 2026" — <https://www.tn.gov/twra/news/2025/8/1/twra-requests-public-input-for-2026-27-fishing-regulations.html>
  - TWRA news release (2026-07-15) for the 2027-28 cycle: "Approved regulations will
    take effect August 1, 2027" — <https://www.tn.gov/twra/news/2026/7/15/twra-requests-public-input-for-2027-28-fishing-regulations.html>
- The regs pages themselves carry **no effective-date line**; effective dates must be
  cited from TWRA news releases. The eRegulations mirror ("official" TWRA partner)
  was last updated July 21, 2026 at verification time — <https://www.eregulations.com/tennessee/fishing>

## Verified official pages

| Topic | Source | Verified facts captured |
|---|---|---|
| Regulations hub | <https://www.tn.gov/twra/fishing-regs.html> | statewide limits, exceptions, trout regulations, live-bait and turtle regs as separate pages; "What's New for 2026-27" section (delayed-harvest changes: Piney River, Big Soddy Creek) |
| Trout regulations | <https://www.tn.gov/twra/fishing-regs/trout-regulations.html> | statewide trout: 7/day any combination, no statewide minimum, max 2 lake trout; special-regulation waters (Clinch 14–20″ PLR, Caney Fork 5-trout/PLR/24″ brown, Elk brown 20″/1-day, SF Holston 16–22″ PLR + Nov 1–Jan 31 spawning closures, Watauga QTA 14″/2-day/no bait, Fort Patrick Henry PLR, Hiwassee seasonal, Clear Creek closures, Horse Creek, Slickrock, Dillard Ponds); 8 delayed-harvest waters with C&R windows; wild-trout-stream list (5/day, single-hook artificials, no bait); Gatlinburg city waters; Tellico-Citico permit Mar 1–Aug 15 with Thu/Fri closures |
| Stockings | <https://www.tn.gov/twra/fishing/trout-information-stockings.html> | TWO grids: "2026 Trout Stocking Schedule" (616 rows; REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/STOCKING WEEK/STOCKING MONTHS/SPECIES; "week of" = Sunday, event within 5 days after, postponable) and "Recent Stocking Locations Report" (12-row rolling window; Region/Destination/Stocking Date; "when the water was last stocked"; updated bi-weekly) |
| Licenses | <https://www.tn.gov/twra/fishing/fishing-licenses.html> | resident combo $33 (minimum to fish), annual trout supplemental $21 (65+ residents exempt), 1-day $6/$11, nonresident $49/$98, junior/senior options, under-13 exemption, 365-day validity, GoOutdoorsTennessee.com. **No "Type 22" trout license exists** on the current schedule — that name is obsolete |
| Free fishing | <https://www.tn.gov/twra/fishing.html> + eRegulations mirror | Bobby Wilson Free Fishing Day 2026-06-06 (kids week Jun 6–12), 2027-06-12 (ages 15 & under Jun 12–18); always the Saturday of the first full week in June; Tellico section closure for 17+ until noon |
| GSMNP | <https://www.nps.gov/grsm/planyourvisit/fishing.htm> | TN **or** NC license valid parkwide (16+, no trout stamp); 5 trout/smallmouth combined per day + 20 rock bass; 7″ minimum; single-hook artificials only, bait banned; year-round, ±30 min around sunrise/sunset; separate Gatlinburg/Cherokee permits |
| Cherokee NF | <https://www.fs.usda.gov/r08/cherokee/recreation/opportunities/fishing> | defers seasons/limits/licenses to TWRA; rainbow stocking ~Mar–Sep; top streams Tellico/Citico/Paint/Beaverdam |
| State parks | <https://tnstateparks.com/activities/fishing> | 13+ licensed; licenses sold with/without trout; Free Fishing Day coverage; Bill Dance Signature Lakes |
| TVA safety | <https://www.tva.com/environment/lake-levels/hazardous-waters> | releases can occur any time with little/no warning; check generation schedules before wading |

## What was verified by direct fetch vs. search-only

- **Fetched in full:** TWRA regs hub, trout regulations, licenses page, TWRA fishing
  hub, GSMNP fishing, TN State Parks fishing, Cherokee NF fishing page, the TWRA
  stockings page + both exceldriven grids (captured as lane fixtures), eRegulations mirror.
- **Search-verified only (page body blocked/CDN):** TVA hazardous-waters page body,
  TWRA 2025-08-01 news release body (URL + snippet confirmed), USACE Nashville pages
  (unreachable from this environment — `lrn.usace.army.mil` TLS-blocked). USACE facts
  cite the national water-safety program page instead.

## Corrections to common assumptions (verified negatives)

1. There is **no statewide 14-inch trout minimum** — 14″ minimums are water-specific.
2. There is **no "Type 22 trout conservation license"** — the current trout
   requirement is the annual Trout Supplemental ($21).
3. The regulation year starts **August 1**, not April 1 or March 1.
4. No explicit official "trout season open year-round statewide" sentence exists on
   the trout regs page; the app phrases this as "no statewide closed season is listed;
   restrictions are water-specific."

## Stocking terminology (encoded in the evidence layer)

- `scheduled` — TWRA published a plan. A passed date is NOT a completed stocking.
- `reported-complete` — the Recent Stocking Locations Report says the water was last
  stocked on that date (bi-weekly rolling window; no counts, no archive).
- `datePrecision` — `day` (exact date published), `week` ("week of" Sunday + 5 days),
  `month` ("TBD <month>" or month initials). Never upgraded downstream.
- "put-and-take" — waters stocked to be harvested in-season (most West TN ponds are
  winter put-and-take only).
- "delayed harvest" — fall stocking followed by a mandatory catch-and-release,
  artificials-only window, then normal harvest rules.

## Licensing and rate constraints

| Source | Licensing | Credentials | Rate/freshness constraints |
|---|---|---|---|
| USGS NWIS | Public domain | none | Etiquette: identify your client (User-Agent with contact); batch ≤50 sites; 15-min IV cadence |
| TVA RestApi | Public information; **undocumented** | none (browser User-Agent required — Cloudflare 403 otherwise) | Hourly data; endpoint may change without notice; ~300 ms gap between requests in the lane's fetcher |
| tn.gov (TWRA) | Public information | none | robots.txt allows all; CDN caches ~10.7 h; datatable path ids change on CMS redeploys |
| NPS / USFS / USACE pages | Public information | none | Static content |

## Official verification links (bundled in `/content/fishing.json`)

- TWRA fishing hub: <https://www.tn.gov/twra/fishing.html>
- TWRA regulations: <https://www.tn.gov/twra/fishing-regs.html>
- TWRA trout regulations: <https://www.tn.gov/twra/fishing-regs/trout-regulations.html>
- TWRA stocking information: <https://www.tn.gov/twra/fishing/trout-information-stockings.html>
- TWRA licenses: <https://www.tn.gov/twra/fishing/fishing-licenses.html>
- Buy licenses: <https://gooutdoorstennessee.com/>
- eRegulations Tennessee: <https://www.eregulations.com/tennessee/fishing>
- TVA lake levels: <https://www.tva.com/environment/lake-levels>
- TVA release schedules: <https://www.tva.com/environment/recreation/recreation-release-schedules>
- GSMNP fishing: <https://www.nps.gov/grsm/planyourvisit/fishing.htm>
- Cherokee NF fishing: <https://www.fs.usda.gov/r08/cherokee/recreation/opportunities/fishing>
- TN State Parks fishing: <https://tnstateparks.com/activities/fishing>
- USACE water safety program: <https://www.usace.army.mil/Missions/Civil-Works/Recreation/National-Water-Safety_Program/>
