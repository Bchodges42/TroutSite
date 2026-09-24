# Commits on this branch (oldest → newest)

Branch `feat/evidence-backed-fisheries-20260922`, cut from `origin/main` @ `d1e48d1`. Pushed to GitHub; **not merged** — merging is the owner's call (merge = deploy on this repo).

## `caf9d90` — feat(opportunity): evidence-ledger seed — 190-water inventory, live TWRA backbone captures, prior-research leads distilled

**Author:** Bhodges42 · **Date:** Tue Sep 22 16:44:39 2026 -0500 (2 days ago)

```
- docs/research/2026-09-22-fishery-opportunities/: seeded ledger (one entry per
  canonical ID), adjudication brief, captures with source log (schedule 616
  rows, recent releases, forecast StoryMap text nodes, trout page + reservoir
  year-round list), researched schedule-location aliases
- packages/content/scripts/opportunity/: catalog+capture join tooling
  (schedule/point joins, forecast scan, prior-leads distiller)
- Headline model: year-round-trout / seasonal-stocked-trout / warmwater-focus /
  mixed / unresolved; evidence states documented/limited/historical/conflicting/unresolved
- All 190 entries seed as unresolved; adjudication fleet fills claims with
  claim-specific provenance next
```

Files: `git show --stat caf9d90 --` →  18 files changed, 75599 insertions(+)

<details><summary>files touched</summary>

```
 .../ADJUDICATION-BRIEF.md                          |   203 +
 .../captures/source-log.json                       |    64 +
 .../captures/twra-forecast-itemdata.json           |     1 +
 .../captures/twra-forecast-text.md                 |   548 +
 .../captures/twra-recent-releases.json             |     1 +
 .../captures/twra-schedule.json                    |     1 +
 .../captures/twra-stock-locations-meta.json        |   850 +
 .../captures/twra-trout-page.html                  |  1916 +
 .../captures/twra-trout-page.txt                   |  1750 +
 .../ledger.seed.json                               | 37437 +++++++++++++++++++
 .../prior-leads.json                               | 11683 ++++++
 .../schedule-location-aliases.json                 |    69 +
 .../research/fishbrain-tn-graphql-discovery.json   |  8772 +++++
 .../fishbrain-tn-graphql-standard-discovery.json   | 11615 ++++++
 .../content/scripts/opportunity/build-seed.mjs     |   184 +
 .../scripts/opportunity/distill-prior-leads.mjs    |    80 +
 .../scripts/opportunity/join-stock-points.mjs      |    45 +
 packages/content/scripts/opportunity/lib.mjs       |   380 +
 18 files changed, 75599 insertions(+)
```

</details>

## `165c98b` — feat(web): ADR 0010 — documented fishery opportunity in the decision model

**Author:** Bhodges42 · **Date:** Tue Sep 22 17:17:01 2026 -0500 (2 days ago)

```
- contracts 2.3.0: additive OpportunitySchema (headline vocabulary
  year-round-trout/seasonal-stocked-trout/warmwater-focus/mixed/unresolved;
  evidence states documented/limited/historical/conflicting/unresolved;
  claim-specific sources with distinct observation/publication/retrieval dates;
  unresolved requires the missing proposition, positive headlines require sources)
- waterDecision.ts: consume the authored opportunity block; REMOVE the generic
  Nov-Mar fallback for yearRound:false rows (audited hazard — an unevidenced
  window must not read as a documented season); warmwater-focus keeps positive
  wording and warmwater visibility rules; documented headlines earn the class
  outline for unauthored-species waters; list status prefers the adjudicated label
- OpportunityCard shared by drawer + detail page: headline, evidence chip,
  reach scope, caveats, unresolved question, source links; renders nothing for
  unadjudicated waters
- prerender water pages publish the same opportunity words; unresolved publishes
  no claim
- tests: schema round-trips + refinements, fallback-removal regressions,
  lake-vs-tailwater non-inheritance, warmwater-focus copy neutrality
```

Files: `git show --stat 165c98b --` →  11 files changed, 736 insertions(+), 21 deletions(-)

<details><summary>files touched</summary>

```
 apps/web/src/features/map/OpportunityCard.tsx   |  75 ++++++++++
 apps/web/src/features/map/RiverDrawer.tsx       |   2 +
 apps/web/src/features/map/waterDecision.ts      | 158 +++++++++++++++++++--
 apps/web/src/index.css                          |  42 ++++++
 apps/web/src/pages/StreamDetailPage.tsx         |   5 +-
 apps/web/test/river-drawer-seasonal.test.tsx    |   6 +
 apps/web/test/water-decision.test.tsx           | 177 +++++++++++++++++++++++-
 docs/adr/0010-documented-fishery-opportunity.md |  93 +++++++++++++
 packages/contracts/package.json                 |   2 +-
 packages/contracts/src/schemas/stream.ts        | 111 +++++++++++++++
 packages/contracts/test/schemas.test.ts         |  86 ++++++++++++
 11 files changed, 736 insertions(+), 21 deletions(-)
```

</details>

## `2898346` — fix(web): out-of-season wording never claims trout absence (work order §5)

**Author:** Bhodges42 · **Date:** Tue Sep 22 17:25:55 2026 -0500 (2 days ago)

```
- map labels/help: 'no trout now'/'hold no trout right now' -> 'out of season'
  (a closed window is what is known; the fish are not)
- drawer calendar-'none' chip: 'Not a trout water' -> 'No trout program documented'
  (the research calendar's absence classification is not a biological census)
- decisionStatusText presence-'absent' label -> 'Out of season'
```

Files: `git show --stat 2898346 --` →  4 files changed, 8 insertions(+), 7 deletions(-)

<details><summary>files touched</summary>

```
 apps/web/src/features/map/RiverDrawer.tsx  | 2 +-
 apps/web/src/features/map/RiverMapPage.tsx | 2 +-
 apps/web/src/features/map/TennesseeMap.tsx | 9 +++++----
 apps/web/src/features/map/waterDecision.ts | 2 +-
 4 files changed, 8 insertions(+), 7 deletions(-)
```

</details>

## `718ec06` — docs(opportunity): KNOWN-ISSUES OPP workstream + ledger tooling (verify/merge/apply) + README 190-waters fix

**Author:** Bhodges42 · **Date:** Tue Sep 22 17:27:03 2026 -0500 (2 days ago)

```
```

Files: `git show --stat 718ec06 --` →  5 files changed, 443 insertions(+), 1 deletion(-)

<details><summary>files touched</summary>

```
 README.md                                          |   2 +-
 docs/KNOWN-ISSUES.md                               |  27 ++++
 .../scripts/opportunity/apply-opportunity.mjs      | 116 ++++++++++++++
 .../content/scripts/opportunity/merge-verdicts.mjs | 124 +++++++++++++++
 .../content/scripts/opportunity/verify-ledger.mjs  | 175 +++++++++++++++++++++
 5 files changed, 443 insertions(+), 1 deletion(-)
```

</details>

## `d372639` — feat(opportunity): 190-water evidence ledger final + authored opportunity blocks (ADR 0010 complete)

**Author:** Bhodges42 · **Date:** Tue Sep 22 18:40:24 2026 -0500 (2 days ago)

```
- docs/research/2026-09-22-fishery-opportunities/ledger.json: final merged
  ledger, 190/190 waters adjudicated by a 7-lane fleet with live source
  verification — headlines: 29 year-round-trout / 58 seasonal-stocked-trout /
  55 warmwater-focus / 13 mixed / 35 unresolved; evidence states: 138
  documented / 18 limited / 3 conflicting / 31 unresolved; ZERO no-trout
  verdicts anywhere
- catalog: opportunity blocks authored on all 190 waters; 13 yearRound
  consistency corrections with in-file reason lines (reservoir-list lakes to
  true; Normandy/Buffalo/Piney to false); species/region/window-template
  corrections NOT auto-applied — owner-corrections-report.json (112 items)
- api: migration 017 (streams.opportunity) + seed + snapshot plumbing so the
  field reaches /v1/streams and the bundled pack
- decision model: a yearRound:true water's authored window is its STOCKING
  calendar — September no longer reads 'out of season' on a year-round
  tailwater (visual-judge-caught contradiction)
- css: opportunity-card header gap, fish-mode toggle nowrap, header flex
  (privacy tagline <1440px hidden; header search yields at <=640px so the
  toggle labels are never overlapped at 390px)
- visual gate: 10/10 pass (4 water states x desktop+phone + map drawer)
- verify-ledger --final: 0 errors, 0 warnings
```

Files: `git show --stat d372639 --` →  203 files changed, 61599 insertions(+), 1255 deletions(-)

<details><summary>files touched</summary>

```
 apps/api/migrations/017_stream_opportunity.sql     |     2 +
 apps/api/src/lib/seed.ts                           |     7 +-
 apps/api/src/snapshots/build.ts                    |     2 +
 apps/web/src/features/map/RiverDrawer.tsx          |     2 +-
 apps/web/src/features/map/waterDecision.ts         |     8 +-
 apps/web/src/index.css                             |    33 +-
 .../2026-09-22-evidence-backed-fisheries.md        |   206 +
 .../2026-09-22-fishery-opportunities/ledger.json   | 53311 +++++++++++++++++++
 .../owner-corrections-report.json                  |   450 +
 .../scripts/opportunity/apply-opportunity.mjs      |    84 +-
 .../content/scripts/opportunity/merge-verdicts.mjs |    10 +-
 .../content/scripts/opportunity/report-counts.mjs  |    23 +
 .../content/scripts/opportunity/verify-ledger.mjs  |    10 +
 packages/content/streams/tn/barren-fork-river.yaml |    40 +-
 packages/content/streams/tn/beaverdam-creek.yaml   |    55 +-
 packages/content/streams/tn/beech-lake.yaml        |    44 +-
 packages/content/streams/tn/beech-river.yaml       |    24 +-
 packages/content/streams/tn/big-bigby-creek.yaml   |    23 +-
 packages/content/streams/tn/big-rock-creek.yaml    |    33 +-
 packages/content/streams/tn/big-sandy-river.yaml   |    37 +-
 packages/content/streams/tn/big-sewee-creek.yaml   |    22 +-
 packages/content/streams/tn/big-soddy-creek.yaml   |    40 +-
 packages/content/streams/tn/big-swan-creek.yaml    |    20 +-
 packages/content/streams/tn/blackburn-fork.yaml    |    27 +-
 .../content/streams/tn/boiling-fork-creek.yaml     |    31 +-
 packages/content/streams/tn/boone-lake.yaml        |    58 +-
 packages/content/streams/tn/boone-tailwater.yaml   |    57 +-
 packages/content/streams/tn/bradley-creek.yaml     |    23 +-
 packages/content/streams/tn/brimstone-creek.yaml   |    22 +-
 packages/content/streams/tn/brush-creek-cocke.yaml |    40 +-
 .../content/streams/tn/buffalo-creek-grainger.yaml |    71 +-
 packages/content/streams/tn/buffalo-river.yaml     |    50 +-
 packages/content/streams/tn/bullrun-creek.yaml     |    23 +-
 packages/content/streams/tn/calderwood-lake.yaml   |    68 +-
 packages/content/streams/tn/calfkiller-river.yaml  |    39 +-
 .../content/streams/tn/cameron-brown-lake.yaml     |    46 +-
 packages/content/streams/tn/candies-creek.yaml     |    19 +-
 .../streams/tn/cane-creek-hickman-perry.yaml       |    40 +-
 packages/content/streams/tn/cane-creek.yaml        |    38 +-
 packages/content/streams/tn/caney-fork-river.yaml  |    60 +-
```

</details>

## `6f8c42a` — fix(api): StreamRow opportunity type + migration-count test for 017

**Author:** Bhodges42 · **Date:** Tue Sep 22 18:50:51 2026 -0500 (2 days ago)

```
```

Files: `git show --stat 6f8c42a --` →  2 files changed, 4 insertions(+), 1 deletion(-)

<details><summary>files touched</summary>

```
 apps/api/src/lib/seed.ts         | 1 +
 apps/api/test/migrations.test.ts | 4 +++-
 2 files changed, 4 insertions(+), 1 deletion(-)
```

</details>

