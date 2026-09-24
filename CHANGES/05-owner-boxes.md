# Owner boxes — 112 catalog corrections NOT applied

Full detail: `docs/research/2026-09-22-fishery-opportunities/owner-corrections-report.json`
(one entry per water, each with the evidence reason from the adjudicating
lane). These are documented discrepancies between the catalog's authored
fields and the verified sources. They were deliberately **not** auto-applied:
species and region fields move waters across map modes and filters, and the
season-window fixes each deserve a human glance against the cited source.

## What's in the box

| Theme | ~Count | Examples |
|---|---:|---|
| Season-window templates wrong | ~30 waters | Nine spring-program creeks carry winter `[12,1,2]` windows (little-buffalo, little-sequatchie, richardson-byrd, salt-lick-creek, spring-creek-polk, standing-rock-creek, station-creek, tumbling-creek, upper-hills-creek): the 2026 schedule + GIS "Spring" label put the events in Mar–May. Fort Campbell waters (puncheon-camp-creek, white-oak-creek, north-prong-barren-fork, little-west-fork-creek) carry winter windows but the documented program runs Feb–Aug. |
| Species strips / claims | ~25 waters | obed-river, new-river, french-broad-river, red-river-clarksville, clear-creek-obed, daddys-creek, reedy-creek (warmwater evidence, catalog still says trout) · powell-river (NRSA 2024 smallmouth/panfish assemblage vs unverified wild-trout claim) · little-pigeon-river (owner stocking claim with zero dataset rows — kept conflicting inside warmwater-focus) |
| yearRound corrections (beyond the 13 applied) | 9 waters | middle-prong-little-pigeon (park reach wild year-round; `fishery:'stocked'` misdescribes it), paint-creek-greene, cosby-creek — flagged in the ledger, applied only where the headline-consistency rule required it |
| Region tags wrong | 2 waters | standing-rock-creek, mill-creek-overton |
| County / identity | 1+ | puncheon-camp-creek: catalog says Campbell, every fact source says Grainger (geometry team) |
| Identity/geometry flags | — | same-name-risk ×12, shared Fishbrain pages ×11, identity issues ×3, geometry issues ×2 (see each lane's SUMMARY in the ledger) |

## The 13 field corrections that WERE applied (with in-file reason lines)

Deterministic ADR-0010 consistency normalizations — a seasonal-stocked or
warmwater-focus headline cannot sit next to `yearRound: true`, and a
documented year-round headline cannot sit on `yearRound: false`:

| Water | Correction | Why |
|---|---|---|
| buffalo-creek-grainger | `yearRound true → false` | DH Oct 1–Jan 31 verified live; discrete cool grabs ≠ a year-round envelope |
| duck-river-tailwater | `yearRound true → false` | TWRA: ~8 suitable months |
| piney-river-rhea | `yearRound true → false` | DH + Feb–Apr program, not year-round |
| calderwood-lake | `yearRound false → true` | TWRA reservoir year-round list (Brook, Brown, Rainbow) |
| chilhowee-lake | `yearRound false → true` | reservoir year-round list |
| tellico-lake | `yearRound false → true` | reservoir year-round list (Upper Tellico) |
| watauga-lake | `yearRound false → true` | reservoir year-round list + lake page |
| fort-patrick-henry-lake | `yearRound false → true` | reservoir year-round list |
| holston-river | `yearRound false → true` | Cherokee TW "limited year-round" (limitation kept as first caveat) |
| little-river | `yearRound false → true` | NPS year-round park reach |
| middle-prong-little-pigeon | `yearRound false → true` | NPS wild year-round park reach |
| paint-creek-greene | `yearRound false → true` | wild reach + DH corridor documented |
| cosby-creek | `yearRound false → true` | NPS year-round fishing + brook documentation |

## Data-holder asks that came out of the adjudication

- **TWRA:** operative Boone / Fort Patrick Henry stocking calendar (three
  published surfaces disagree); Dale Hollow composition (April Brown row vs
  wintertime Rainbow list+page); Obey species (brook vs brown); Big Soddy DH
  start (forecast says Oct 1, regs say Nov 1); Piney River DH start (Nov 1
  vs Oct 1 reads); completed-release history beyond the 10-row rolling
  window; whether the 2025 planned Coldwater-Summit surveys produced results;
  Paris City Park pond identity (schedule says "Paris City Park", catalog
  maps Green Acres/Williams Lake, the dated local report puts the 12/10/2025
  event at Eiffel Tower Park Extended).
- **Rights:** Fishbrain production reuse (terms forbid scraping; the
  extracts stay research leads until the owner establishes permission).
- **Sewee Creek:** the recurring "winter trout water" rumor has no citable
  row — one dated row would flip it from unresolved to seasonal-stocked.
