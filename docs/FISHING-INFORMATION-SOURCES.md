# Fishing-information sources — Tennessee (data-sources lane)

**Verified:** 2026-09-08 (full special-regulations re-verification against live TWRA pages; initial verification 2026-09-04) ·
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

## 2026-09-08 special-regulations re-verification log

One row per item touched in `fishing-information.json` on 2026-09-08. All rows verified
by direct live fetch of the TWRA trout regulations page and regs hub unless noted.

| Water / subject | What changed | Source URL | Checked |
|---|---|---|---|
| Clinch River (clinch-river) | Verified unchanged (Norris Dam→Hwy 61, 14-20″ PLR, 7/day, 1 over 20); added reach boundary + reg-year effectiveFrom | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Caney Fork (caney-fork-river) | Verified; added reach boundary (Center Hill Dam→Cumberland R) and species split (rainbow/brook/cutthroat PLR, brown 24″/1-day) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Elk R / Tims Ford (elk-river) | Verified; added reach boundary (Tims Ford Dam→I-65) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Hiwassee (hiwassee-river) | Verified unchanged (Mar 1-Sep 30 7/day max 2 browns; Oct 1-Feb 28 C&R/DH) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| SF Holston (south-holston-river) | Verified; added spawning-closure boundaries (Hickory Tree Br→Bottom Cr; Boy's Island→first island above Webb Rd Br) and Boone Reservoir arm extent (to Hwy 11E) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Watauga QTA (watauga-river) | Verified unchanged (Smallings Br→CSX bridges, 14″ min, 2/day, no bait, undersized may not be possessed) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Fort Patrick Henry (ft-patrick-henry-tailwater) | Verified; added creel detail (7/day, 1 over 22) + reach (Boone Dam→Louis Milhorn Br) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Tellico R (tellico-river) | Verified; added DH reach (North River mouth→state line), permit reach (Turkey Cr confluence up), one-rod rule, Free-Fishing-Day Sourwood→dam closure to 17+ until noon | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Citico Cr (citico-creek) | Verified; added reach (Little Citico confluence→N/S Fork confluence), one-rod rule, Aug 16-Feb 28 open daily no permit | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Doe R (doe-river) | Verified unchanged (DH Oct 1-Feb 28 within Roan Mountain SP boundaries) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Buffalo Cr (buffalo-creek-grainger) | Expanded: mill-dam→Buffalo Springs WMA boundary DH Oct 1-Jan 31; ABOVE mill dam closed year-round to all fishing; below dam rod-and-reel only year-round, bait-harvest gear banned | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Piney R (piney-river-rhea) | **CORRECTED — old item had this backwards.** 2026-27 change REMOVES Piney River DH (eff. 2026-08-01) per regs hub "What's New" + TWRA 2025-12-16 proposals release; TWRA's trout page still listed Nov 1-Feb 28 C&R on 2026-09-08 (internal TWRA inconsistency, flagged in item; C&R stated as safe default) | [regs hub](https://www.tn.gov/twra/fishing-regs.html) · [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) · [proposals news](https://www.tn.gov/twra/news/2025/12/16/comment-period-open-for-fishing-regulations-proposals.html) | 2026-09-08 |
| Clear Creek (clear-creek-obed) | **CORRECTED — name collision.** The Nov 1-Mar 31 closure "Clear Creek" on TWRA's trout page is the ANDERSON COUNTY Clinch tributary (Hwy 441 up to second dam near Norris), not the Obed-system creek; Obed-system creek now states "no special regulation — statewide rules" | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Horse Cr (horse-creek-greene) | **Filled in the actual rule** (was a vague placeholder): USFS boundary→Squibb Cr junction, 7/day except 2/day May 1-Sep 30 | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| GSMNP park streams (little-river, leconte-creek, middle-prong-little-pigeon, west-prong-little-pigeon, cosby-creek) | Unchanged; verified 2026-09-04 against NPS page (see table below) | [NPS GSMNP fishing](https://www.nps.gov/grsm/planyourvisit/fishing.htm) | 2026-09-04 |
| Gatlinburg city waters (west-prong-little-pigeon, leconte-creek, roaring-fork) | **appliesTo fixed**: added Roaring Fork + Leconte Creek (real city-permit streams), REMOVED little-pigeon-river (catalog entry is the Sevierville reach — not a city water; Dudley Creek and its children-only reaches have no catalog entries); added Dec 1-Mar 31 C&R, Apr 1-Nov 30 5/day general + 2/day children's, Free-Fishing-Day River Rd closure to 16+ until 11 a.m. | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Wild trout streams (laurel-fork-carter, beaverdam-creek) | **NEW item**: 5/day no length limit, single-hook artificials only (one dropper fly); listed reaches Laurel Fork (Carter Co., cable crossing above Dennis Cove→USFS boundary) and Beaverdam Creek (Johnson Co., Birch Branch confluence→Tank Hollow Rd) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Fort Campbell streams (little-west-fork-creek, fletchers-fork) | **NEW item**: post fishing permit required on top of TN license + trout authorization (Dry Creek also listed by TWRA — no catalog entry) | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |
| Statewide winter put-and-take program | **NEW statewide item**: cold-month rainbow stocking into small lakes/ponds (concentrated in West TN; the 13 catalog winter ponds); stockings-page schedule grid is the authority for each water's window | [stockings](https://www.tn.gov/twra/fishing/trout-information-stockings.html) | see flag below |
| Statewide trout creel/size | Re-verified unchanged: 7/day any combination, no minimum, max 2 lake trout | [trout regs](https://www.tn.gov/twra/fishing-regs/trout-regulations.html) | 2026-09-08 |

### TWRA special-reg waters with NO catalog entry (not applied to any waterId; do not invent ids)

- **Big Soddy Creek** (upstream of Back Valley Rd) — delayed harvest, C&R **Nov 1 - Feb 28** (2026-27 change moved the start from Oct 1 to Nov 1; confirmed on trout page + regs hub "What's New").
- **Paint Creek** (Greene Co.; campground downstream to French Broad mouth) — DH Oct 1 - Feb 28; its upstream reach is also a wild-trout stream (5/day, single-hook artificials).
- **Slickrock Creek** (TN/NC boundary section) — 4 trout/day combined, 7″ min, single-hook artificials; TN or NC license valid.
- **Montgomery Bell State Park — Acorn Lake** — trout C&R Dec 1 - Mar 31.
- **Dillards Ponds** — 4 trout/day, one rod, sunrise-to-sunset-hours rule.
- **Green Cove Pond** (Tellico area) — no permit; 7 trout/day + 5 catfish/day, one rod.
- Gatlinburg **Dudley Creek** (incl. two children-only reaches) — city permit stream.
- Wild-trout list streams not in catalog: **North River, Bald River, Sycamore Creek, Rough Ridge Creek** (Monroe Co.), **Rocky Fork** (Greene/Unicoi), **Left Prong of Hampton Creek** (Carter Co.), **Little Stony Creek** (not the same water as catalog `stoney-creek-carter`, "Stony Creek" — different name/stream).
- Fort Campbell **Dry Creek** — stocked trout stream, no catalog entry.
- **North Chickamauga Creek** — carries NO special trout regulation on TWRA's current trout page (checked 2026-09-08; statewide rules apply).

### Reach/coverage mismatches resolved

- The SF Holston special regulation extends into **Boone Reservoir** up to the Hwy 11E bridge on the Watauga arm, but only that arm segment is covered — `boone-lake`/`boone-tailwater` catalog entries deliberately NOT added to appliesTo (the rule does not cover the whole catalog water; `boone-tailwater` is below Boone Dam, outside the listed reach entirely).
- Watauga Dam→Wilbur Lake reach (`watauga-river-wilbur-reach`) carries no special regulation; the QTA begins below Wilbur Dam.

### 2026-09-08 fetch failures / not re-verified

- **TWRA stockings page** (`https://www.tn.gov/twra/fishing/trout-information-stockings.html`): connection reset on every fetch attempt on 2026-09-08 (page was fetched in full 2026-09-04 and its structure is captured in the table below + lane fixtures). The new winter put-and-take item therefore cites the page without hard program dates — TWRA publishes no single official start/end date line for the program; the schedule grid is the authority. Do not add invented dates.
- **eRegulations trout page** (`https://www.eregulations.com/tennessee/fishing/trout-regulations`): fetched 2026-09-08; still showed pre-Aug-1 values (Big Soddy Oct 1 start, Piney River DH present) — mirror last updated 2026-07-21, i.e. BEFORE the effective date. Treat tn.gov as authoritative over the mirror. (The bare `/tennessee/fishing/trout` path 404s.)
- Licenses page, GSMNP NPS page, Cherokee NF, TVA safety: not re-fetched 2026-09-08; verified 2026-09-04 (rows below unchanged).

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
