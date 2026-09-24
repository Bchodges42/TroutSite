# New research artifacts — the evidence ledger and its sources

16 new files under `docs/research/2026-09-22-fishery-opportunities/` plus two
Fishbrain research files restored under `packages/content/research/`
(258 KB + 342 KB — they live on the habitat research branches; restored here
so the ledger's leads are reproducible from one checkout). All are research
artifacts — none ship in the product bundle.

## The ledger

| File | What it is |
|---|---|
| `ledger.json` | **THE deliverable.** 190 entries, one per canonical catalog ID, each with identity block (type, counties, GNIS/HUC, map-feature match), catalog-field snapshot, backbone data (schedule join, reservoir list, forecast mentions, stocking points), the adjudicated `headline` (troutOpportunity × evidenceState × reachScope × statement × asOf), `claims[]` (kind, state, species, reach, full source provenance with observationPeriod/publicationDate/retrieved/pinpoint, applicability qualification, next question), `unresolvedQuestion`, `qualifications`, `flags`, schedule-join verdicts, and per-verdict `webChecks`. Also carries the seed's `unmatchedScheduleRows` (180 TWRA schedule rows that target non-catalog waters — park ponds etc. — i.e. the documented catalog-gap list). |
| `ledger.seed.json` | the deterministic pre-adjudication state (all 190 unresolved) — kept so the merge is auditable |
| `ADJUDICATION-BRIEF.md` | the binding truth model the adjudicator fleet worked under: headline vocabulary, hard rules ("no trout" is almost never provable; reach discipline; stocking ≠ presence ≠ year-round; five distinct dates; source lineage; Fishbrain = leads only), the sufficiency ladder per claim kind, verified source entry points, and the audit's case table |
| `prior-leads.json` | the six habitat-research batches (190 records) distilled to leads: segment boundaries, cold-source notes, temperature entries, the record's own verdict + every source URL they checked |
| `owner-corrections-report.json` | **112 catalog corrections that were NOT auto-applied** — see `05-owner-boxes.md` |
| `schedule-location-aliases.json` | the researched TWRA schedule-location → catalog-slug aliases (owner-directed research 2026-09-17, provenance per entry) |

## Captures — the live TWRA backbone, retrieved 2026-09-22

Every capture has a `source-log.json` entry: URL, HTTP status, byte size,
SHA-256, retrieval UTC — and a note stating what the source can and cannot
prove.

| Capture | Contents |
|---|---|
| `twra-schedule.json` | the published stocking **SCHEDULE** — 616 rows (a plan, not completed releases) |
| `twra-recent-releases.json` | the rolling recently-stocked report — 10 rows, Aug–Sep 2026 (not a complete event history) |
| `twra-forecast-itemdata.json` | the TWRA annual trout forecast StoryMap, full item data (206 nodes) |
| `twra-forecast-text.md` | the forecast's 136 text nodes extracted verbatim with node IDs (`n-Q2FuhI` = Boone year-round/holdover quote, `n-I7NFwN` = Normandy ~8 months, `n-0Qzf3q` = Tims Ford first-11-miles) — node-ID-quotable pinpoints |
| `twra-trout-page.html` / `.txt` | the TWRA trout page, including the reservoir year-round list (8 reservoirs) |
| `twra-stock-locations-meta.json` | the stocking GIS layer schema (730 points; NO event-date field — points are neither releases nor stocked reaches) |

## Measured counts (the headline numbers)

Headlines across all 190 waters:

| Headline | Waters |
|---|---:|
| Year-round trout opportunity | 29 |
| Seasonal stocked trout opportunity | 58 |
| Warmwater fishing focus | 55 |
| Mixed fishery (warmwater + stocked trout) | 13 |
| Trout status unresolved | 35 |

Evidence states: 138 documented · 18 limited · 3 conflicting · 31 unresolved.
**Zero "no trout" verdicts exist anywhere in the ledger** — that label is no
longer representable; the honest vocabulary is `unresolved` with the missing
proposition stated.

By waterbody type:

| Type | Year-round | Seasonal | Warmwater | Mixed | Unresolved |
|---|---:|---:|---:|---:|---:|
| river (56) | 2 | 8 | 32 | 2 | 12 |
| creek (78) | 10 | 41 | 2 | 4 | 21 |
| lake (38) | 8 | 5 | 20 | 3 | 2 |
| tailrace (12) | 9 | 2 | 1 | 0 | 0 |
| pond (5) | 0 | 1 | 0 | 4 | 0 |
| spring (1) | 0 | 1 | 0 | 0 | 0 |

(No water is typed `reservoir` or `stream` in this catalog — still waters are `lake`/`pond`; the one `spring` is `spring-creek-polk`. The unresolved tail sits mainly in unprogramed creeks and rivers; lakes/ponds resolved almost entirely because TWRA documents those programs explicitly.)

## What the adjudication found on the audit's hard cases

Every verdict re-opened primary sources live; none copies the audit:

- **Boone Tailwater** — year-round documented (forecast node `n-Q2FuhI`,
  March 2026 electrofishing). The THREE-WAY stocking-calendar conflict is
  preserved as a `conflicting` claim: schedule Mar/Apr/Nov+Dec · static page
  Mar/Apr/Dec · forecast Mar/Apr/Jun+Dec.
- **Boone Lake ≠ Boone Tailwater** — lake reads warmwater-focus on positive
  evidence; lake-wide trout persistence stays unresolved; the Watauga-arm
  trout regulation is recorded as a regulation claim, never a population one.
- **Watauga Lake** — year-round documented (reservoir list + lake page);
  summer deep-water guidance (90–120 ft) carried as a caveat, no shore-wide
  promise. Wilbur reach separate (Mar–Jul program; 2026 sampling cancelled —
  low flow — so population claims are as-of March 2025).
- **Center Hill Lake vs Caney Fork** — the lake resolved warmwater-focus on
  its own positive evidence; the bottom-release mechanism stays attached to
  the tailwater below the dam (year-round + 2025 water-quality caveat).
- **Normandy/Duck tailwater** — seasonal documented (~8 suitable months,
  first ~9 mi); stocking months (workbook J,F,M,N,D) vs suitability window
  (Nov–Jun) preserved as a conflict; catalog `yearRound:true` corrected false.
- **Cherokee + Hiwassee** — year-round documented WITH the "limited
  year-round" summer limitation as the first qualification.
- **Tims Ford/Elk** — year-round reach-scoped to the first ~11 miles; brown
  (multi-year classes) vs rainbow (little multi-year holdover) split kept;
  `elk-river-lower` unresolved (Fayetteville gauge = upstream context only).
- **Little River / Buffalo Creek** — NRTS boundary recorded at RM 33.0→origin
  from the EPA-hosted 2024 TDEC tables; Buffalo Creek seasonal documented
  (DH Oct 1–Jan 31 verified live; WQP 29 obs 2010–2025; discrete grabs ≠ a
  continuous summer envelope).
- **Trail Fork Big Creek** — TWRA's separate SPRING program on the lower
  stocked reach documented (5 weeks Feb–May 2026 + GIS points); the 2021 brook
  transfer above the waterfall stays historical; 2025 monitoring was planned,
  not completed — no 2026 persistence claim.
- **Obed-area** — warmwater-focus documented on positive assemblage evidence
  (NPS fish page, NRSA 2023-24, 29–30 °C gauges). Absence of trout records
  never became a trout-absence claim.
- **Gatlinburg pair** (Leconte Creek, Roaring Fork) — year-round documented
  via forecast node `n-4U71UT` ("stocked … to the national park boundary",
  "Stocking: Year-Round") + a completed Sept 1 2026 Leconte release.
- **Winter ponds / mixed rivers** — mixed documented; out-of-season
  presentation says the window is closed, never that the fish are gone.
