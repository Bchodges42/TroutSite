# Evidence-backed fishery opportunities for the 190 Tennessee waters — implementation report

**Date:** 2026-09-22 · **Lane:** evidence-backed-fisheries (single session, one clone,
one branch) · **Base commit:** `d1e48d1` (origin/main at the audit baseline)
**Branch:** `feat/evidence-backed-fisheries-20260922` (pushed; draft PR opened)
**Clone:** `trout-project-plan/trout-evidence-impl`

## What was built, in one paragraph

The work order asked for the missing 190-water reach-and-claim adjudication
(the feasibility audit's "census") and the smallest honest product model built
on it. This lane delivers both: a machine-readable **evidence ledger** with
exactly one entry per canonical catalog water — every entry carrying
claim-specific provenance, distinct dates, conflicts, and (where evidence does
not reach) a precise unresolved question — plus **ADR 0010**, an additive
contract (`opportunity` block, contracts 2.3.0), a deterministic decision-model
integration that removes the audited Nov–Mar seasonal fallback, a shared
opportunity card in drawer and detail page, prerender/SEO wording that refuses
to publish unresolved waters as anything, and honest out-of-season wording
across the map. No certainty was manufactured: waters without sufficient
evidence say exactly what is missing.

## Reproduced baseline (work order §2)

Against this branch's base `d1e48d1`, all audited facts reproduce exactly:

| Fact | Audit | This tree |
|---|---|---|
| `packages/content/streams/tn/` YAMLs | 190 | **190** |
| `rivers.geojson` selectable features | 190 | **190** |
| Canonical ID match 1:1 | yes | **yes (0 orphans either way)** |
| MultiLineString / MultiPolygon / Polygon | 147 / 21 / 22 | **147 / 21 / 22** |
| Fishbrain extracts: mapped / segment flags / unmatched | 147 / 39 / 43 | **147 / 39 / 43** (recalculated from both files) |
| Habitat records | 190 | **190** (batches 1–6: 13+24+35+35+37+46) |
| Temperature entries in records | 105; 85 stale pre-2024 | **105 / 85** (from the distilled prior-leads set) |
| USGS national temperature compilation TN continuous 2018+ / ≥60 JJA-2021 days | 20 / 14 | accepted from the follow-up audit's reproduction (2.44 GB source; not re-downloaded) |
| `DATA-SOURCE-COVERAGE` "91 waters with stocking source" | stale 147-snapshot | not cited as 91/190 anywhere |
| README "~148 waters" | stale | **fixed on this branch** (190) |

The habitat batches' 30/78/82 split is reproduced in the audit only; it is NOT
treated here as a coverage count. This lane's counts are measured from the
adjudicated ledger (below).

## The ledger (work order §4)

- **Path:** `docs/research/2026-09-22-fishery-opportunities/ledger.json`
  (seed: `ledger.seed.json`; per-lane verdicts: `evidence-work/adj/lane-*/`)
- **Construction:** deterministic seed (catalog snapshot, live TWRA backbone
  captures, researched schedule aliases, forecast text-node scan, 730-point
  stocking GIS join, distilled prior-research leads, Fishbrain leads) →
  6-lane adjudication fleet (each lane re-verified decisive sources live) →
  merged and machine-checked.
- **Checks:** `node packages/content/scripts/opportunity/verify-ledger.mjs --final`
  — one entry per catalog ID, geometry match, positive-headline provenance,
  date shapes, no absolute "no-trout" verdict anywhere, sibling lake/tailwater
  pairs must not share one decisive pinpoint, scheduled-vs-completed stocking
  kinds distinct, catalog↔ledger agreement, year-round/season consistency.
- **Source log:** `captures/source-log.json` (URL, status, SHA-256, retrieval
  UTC for every backbone capture; raw captures committed alongside).

### Measured counts (headlines × evidence states, 190 waters)

| Headline | Waters |
|---|---:|
| Year-round trout (year-round-trout) | 29 |
| Seasonal stocked trout (seasonal-stocked-trout) | 58 |
| Warmwater focus (warmwater-focus) | 55 |
| Mixed fishery (mixed) | 13 |
| Unresolved (unresolved) | 35 |
| **Total** | **190** |


Counts by waterbody type:

| Waterbody type | Year-round trout | Seasonal stocked trout | Warmwater focus | Mixed fishery | Unresolved |
|---|---:|---:|---:|---:|---:|
| creek | 10 | 41 | 2 | 4 | 21 |
| lake | 8 | 5 | 20 | 3 | 2 |
| pond | 0 | 1 | 0 | 4 | 0 |
| river | 2 | 8 | 32 | 2 | 12 |
| spring | 0 | 1 | 0 | 0 | 0 |
| tailrace | 9 | 2 | 1 | 0 | 0 |

Evidence states across all 190: {"documented": 138, "unresolved": 31, "limited": 18, "conflicting": 3}

"190 entries" ≠ "190 verified classifications": every `unresolved` entry is an
honest gap with a named next source, and `limited`/`historical` entries carry
their shortfall in `qualifications`.

## What the fleet found on the hard cases (work order §6)

All verdicts were produced by re-opening primary sources live (TWRA forecast
item data, region pages, stocking endpoints, EPA-hosted TDEC PDF, WQP, NPS,
NRSA 2023-24 CSVs), not by copying the audit:

- **Boone Tailwater** — year-round-trout, documented (forecast node `n-Q2FuhI`,
  March 2026 electrofishing). The THREE-WAY stocking-calendar conflict is
  preserved as a `conflicting` claim: schedule Mar/Apr/Nov/Dec · static page
  Mar/Apr/Dec · forecast Mar/Apr/Jun/Dec. Catalog keeps `yearRound: true`
  with the stocking window separate — the ADR-0010 consistency rule.
- **Boone Lake** — warmwater-focus, documented (positive region evidence);
  lake-wide trout persistence unresolved; the Watauga-arm trout regulation is
  recorded as a regulation claim, never as a population claim. NOT merged
  with the tailwater.
- **Watauga Lake** — year-round-trout documented (reservoir list + lake page,
  summer deep-water 90–120 ft guidance carried as caveat). Wilbur reach kept
  separate (seasonal program Mar–Jul; SH/Wilbur 2026 sampling cancelled —
  low flow — so population claims are as-of March 2025).
- **Center Hill Lake vs Caney Fork** — the lake reads warmwater-focus on
  positive evidence; the bottom-release mechanism stays attached to the
  tailwater below the dam (year-round documented + 2025 water-quality caveat).
  The sibling-pair check forbids sharing one decisive pinpoint.
- **Normandy/Duck tailwater** — seasonal-stocked-trout documented (~8 suitable
  months; first ~9 mi). The catalog's `yearRound: true` is flagged wrong and
  normalized false by the apply pass. Stocking months (workbook J,F,M,N,D) vs
  suitability window (forecast Nov–Jun) preserved as a conflict.
- **Cherokee/Hiwassee** — year-round-trout documented with the "limited
  year-round" summer limitation as the FIRST qualification.
- **Tims Ford/Elk** — year-round reach-scoped to the first ~11 miles; brown
  (multi-year classes) vs rainbow (little multi-year holdover) species split
  preserved; `elk-river-lower` unresolved (the Fayetteville gauge is upstream
  context only); whole-Elk claim refused.
- **Little River / Buffalo Creek** — NRTS boundary recorded at RM 33.0→origin
  from the EPA-hosted 2024 TDEC tables (mechanically column-mapped);
  Buffalo Creek seasonal-stocked documented (DH Oct 1–Jan 31 verified live;
  WQP 29 obs 2010–2025; discrete grabs are not a continuous summer envelope)
  with catalog `yearRound`/`seasonMonths` flagged wrong.
- **Trail Fork Big Creek** — the TWRA SPRING program on the lower stocked
  reach (5 weeks Feb–May 2026 + GIS points) is real and documented; the 2021
  brook transfer above the waterfall keeps historical state only; 2025
  monitoring was planned, not completed — no 2026 persistence claim.
- **Obed-area** — warmwater-focus documented on positive assemblage evidence
  (NPS fish page naming smallmouth for Clear Creek/Daddy's Creek/Obed; NRSA
  2023-24; 29–30 °C gauge records). No "no trout" claims anywhere.
- **Winter ponds/mixed rivers** — mixed documented (winter program + warmwater
  fishery); out-of-season presentation says the window is closed, never that
  the fish are gone.

## Product implementation (work order §5)

| File | Change |
|---|---|
| `packages/contracts/src/schemas/stream.ts` | additive `OpportunitySchema` (2.3.0): headline vocabulary, evidence states, sources with observationPeriod/publicationDate/retrieved/pinpoint; unresolved REQUIRES the missing proposition; positive headlines REQUIRE sources |
| `apps/web/src/features/map/waterDecision.ts` | consumes the block; **Nov–Mar fallback removed**; warmwater-focus keeps positive wording and warmwater-mode rules; documented headlines earn the class outline for unauthored-species waters; list status prefers the adjudicated label |
| `apps/web/src/features/map/OpportunityCard.tsx` | shared card (drawer + detail): headline, evidence chip + year, reach scope, statement, caveats, unresolved question, ≤3 source links; renders nothing for unadjudicated waters |
| `apps/web/src/features/map/{TennesseeMap,RiverMapPage,RiverDrawer}.tsx` | out-of-season wording never claims trout absence ('no trout now' → 'out of season'; 'Not a trout water' → 'No trout program documented') |
| `apps/web/scripts/prerender.mjs` | water pages publish the same opportunity words; unresolved publishes no claim |
| `packages/content/scripts/opportunity/*` | ledger tooling: seed/verify/merge/apply + point-join + prior-leads distiller |
| `docs/adr/0010-documented-fishery-opportunity.md` | the decision record |
| `README.md`, `docs/KNOWN-ISSUES.md` | 190-waters fix; OPP workstream entries |

Design notes: durable opportunity stays separate from live conditions and from
stocking events (the card never implies today's safety; conditions never
upgrade a headline). Map styling keeps unknown waters neutral and
discoverable; no trout fishability or heat-stress language attaches where
trout applicability is unsupported (pre-existing F6 gates, re-tested).

## Validation (work order §7)

- `verify-ledger` — see counts above; final ledger: `verify-ledger --final`: **0 errors, 0 warnings** (190/190 entries, provenance + consistency checks green)..
- `pnpm --filter @trout/content validate` — OK, 190 streams (warnings are the
  pre-existing documented-ungauged notices).
- `pnpm -r test` — contracts 197 ✓ (incl. 7 new Opportunity schema tests);
  web 371 (1 pre-existing flaky timing test passes in isolation; 13 new/updated
  decision-model tests incl. fallback-removal and lake-vs-tailwater
  non-inheritance); api/e2e-unit per suite output.
- `pnpm -r build` — all packages build; no gates weakened.
- Pre-existing failures NOT introduced here (verified identical on clean
  `main`): contracts `typecheck` 3 strict-null lines in
  `scoreFishability.test.ts`; content lint 8 problems; e2e lint 4 problems.
- Typecheck of web + contracts clean on this branch.
- Visual check: **PASS — all 10 captures** (4 water states × desktop 1280 + phone 390, plus the map drawer): documented year-round tailwater (Boone TW, with the stocking-calendar conflict caveat), unresolved water (Beech River: status + missing proposition), mixed fishery (Lake Graham), year-round reservoir (Watauga Lake). Five judge passes were run; the intermediate failures were real catches (card missing pre-snapshot-plumbing, a drawer self-contradiction on year-round waters — fixed by treating the authored window on yearRound:true rows as the stocking calendar, chip/label collisions, header squeeze at 390px) and were repaired before the final all-green pass..

## Acquired vs identified; rights limits (work order §8)

- **Acquired & committed:** TWRA trout page + schedule (616 rows) + recent
  releases (10-row rolling window) + reservoir year-round list; forecast
  StoryMap full item data (136 text nodes extracted, node-ID pinpoints);
  stocking-location GIS layer (730 points, no event dates — schema captured).
  Live on 2026-09-22 (source log with hashes).
- **Identified, not acquired:** TVA stream-station species/effort export (528
  sites claim), USACE reservoir profiles, NEON fish counts (403), 2024
  Chilhowee FERC P-2169 report, 2025 Coldwater-Summit survey RESULTS (plans
  only), NPS post-2020 certified exports.
- **Rights limits:** Fishbrain aggregates stay research leads (terms forbid
  scraping; no production reuse without owner-established permission). Guide/
  shop reports are linked, not reproduced. iNaturalist/GBIF deduplicated;
  record-level licences vary.

## Owner decisions still open

1. `docs/research/2026-09-22-fishery-opportunities/owner-corrections-report.json`
   — catalog corrections NOT auto-applied: species strips/claims, region tags
   (standing-rock, mill-creek-overton), wrong season windows on ~9 spring
   creeks (winter-template errors), Fort Campbell waters' winter-vs-spring
   windows, puncheon-camp-creek county mismatch (Campbell vs Grainger).
2. Fishbrain production-reuse permission (or keep leads-only).
3. TWRA asks: operative Boone/FPH stocking calendar; Dale Hollow composition
   (April/Brown row vs wintertime/Rainbow list); Big Soddy DH start (Oct vs
   Nov); Piney River DH start (Nov vs Oct); completed-release history beyond
   the 10-row window; Paris City Park pond identity; whether the 2025 planned
   surveys produced results.
4. The four lane-flagged "reviewer may downgrade" verdicts (beaverdam-creek,
   laurel-fork-carter year-round basis; little-pigeon-river stocking claim;
   Gatlinburg group-string joins) — independent review can flip these in the
   ledger; the checks re-run in seconds.
