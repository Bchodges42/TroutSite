# Owner triage — 112 catalog-correction items, evidence-backed dispositions

**Date:** 2026-09-24 · **Session:** evidence-triage lead (research-only; no catalog, application, UI, or geometry changes; no merge; no deploy; no outreach)
**Input (unchanged):** `owner-corrections-report.json` — 112 entries, every ID preserved exactly once below
**State of record reviewed:** branch `codex/evidence-backed-fisheries-repair-20260922` @ `3c773d6` (the later repair/review), which itself contains the evidence lane @ `6f8c42a`. Current reviewed headline counts on this checkout: **29 year-round trout / 61 seasonal-stocked / 55 warmwater-focus / 10 mixed / 35 unresolved** (evidence states unchanged: 138 documented / 18 limited / 3 conflicting / 31 unresolved). Verified directly from `ledger.json` in this checkout — these supersede the original README's 29/58/55/13/35.
**Machine companion:** `owner-triage.json` (same 112 rows, full fields).
**Method:** three research lanes re-verified every potentially factual correction — R1 against the committed captures + catalog internals (offline), R2 against live tn.gov/TWRA surfaces + the 13 captured fishery pages, R3 against NPS/EPA/TDEC/conservation primaries. Prior adjudication-lane verdicts (`evidence-work/adj/lane-*`) were used as dated verification records, never as proof. Failed fetches are recorded, never treated as absence.

## Disposition summary

| Disposition | Count | Meaning |
|---|---:|---|
| research-resolved | 17 | Verified against primary/captured evidence; the recommended action is apply-ready for the owner |
| owner-answered | 1 | The 2026-09-24 owner interview supplies the answer |
| owner-decision | 16 | A genuine judgment call: legacy-tag policy, fishery-field convention, or presentation |
| data-holder | 5 | Blocked on TWRA/another holder; precise question attached |
| no-change | 73 | "None required" confirmed (13), already repaired (22+4), superseded by the repair's no-programmatic-windows design (6), residue already clean (2+…), qualifier already carried (2), or optional enrichment with fields legitimately unset (16+) |
| **Total** | **112** | |

**Actual actionable discrepancies after review: 39 of 112** (17 apply-ready + 1 owner-answered apply + 16 owner-judgment + 5 agency-blocked). The other 73 require no change — including two "repair-gaps" found by this triage that ARE actionable and sit inside the 17 (see priorities).

## Owner-provided answers carried forward (2026-09-24 interview)

- **Fishbrain:** temporary internal research for the owner and AI only; will never appear in the live site or product; will be archived after the general waterway review. **Internal retention terms have NOT been assessed — no such claim is made.** No triage row relies on Fishbrain evidence.
- **Paris City Park:** owner identifies TWRA's "Paris City Park" site as **Eiffel Tower Pond at Eiffel Tower Park** (the City of Paris project page corroborates the pond/park identity); the owner could not identify the catalog's former Green Acres/Williams Lake mapping. No alias or geometry match is forced. Catalog geometry follow-up is an owner action. *(Context — no 112-row item; the Paris water is not among the 112.)*
- **Trail Fork 2025 survey:** owner reports the planned survey **happened**; the result could not be found. Completion is recorded as owner-reported; this sheet never describes the survey as uncompleted and never infers findings or persistence. Separately, the archived TWRA 2024-06-07 response records **one completed stocking at destination "Trail Fork Big Creek" dated 2024-05-20** — a stocking event only (not the survey, not persistence, not species/quantity/reach).
- **Catch-evidence threshold:** a single trout catch report never classifies a water trout-positive (could be stocked, misidentified, or mislocated). Single reports are leads/dated observations — verify species, date, exact reach, provenance, stocking context; seek independent corroboration. No numeric threshold exists; none is invented.
- **Recent-stock report:** TWRA's live report is a rolling last-stocked summary (10 rows at the 2026-09-24 read), not an event log; the 2024 archive (54 destinations) is partial. Neither absence proves anything.

## Stale statements in the original CHANGES/ folder (superseded — read before reusing)

`CHANGES/` lives on `feat/evidence-backed-fisheries-20260922` (fa81f10) and predates the repair review. Stale points:

1. **`CHANGES/README.md` counts "29/58/55/13/35"** — superseded: the repair demoted McCutcheon Creek, Shelby Farms Lake (Jones Pond), and Stones River from `mixed` to `seasonal-stocked-trout` (no water-specific warmwater evidence), giving **29/61/55/10/35**. The three demoted waters are NOT among the 112.
2. **`README.md` "All gates green … verify-ledger 0 errors / visual gate 10/10"** — the gates ran, but the repair proved them insufficient: the zero-absence check was ineffective (a ternary returning true either way), the source-log paths pointed at uncommitted files, 16 waters carried USGS hydrology-station pages as species citations, and the old trout calendar shipped fabricated "freshly stocked" presence. Do not cite the original green-gates line without this qualification.
3. **Prerender claim** — the original report said prerendered water pages publish opportunity lines. That change was validated in the working tree but **never committed** (confirmed this session: the file sat uncommitted in the clone; now stashed on the feat branch with a descriptive message). The repair branch's prerender output does NOT include opportunity lines.
4. **`CHANGES/05-owner-boxes.md` "112 corrections NOT applied"** — partially stale: the repair has since applied the 22 wrong-season-window removals (marked `repair` in the JSON) and re-pointed the Boone Lake + Nickajack citations; several yearRound flips it lists are verified applied. After this triage: **73 of the 112 need no change at all**.
5. **`05-owner-boxes.md` Trail Fork line** ("2025 monitoring was planned, not completed") — contradicted by the owner-reported completion above.
6. **`05-owner-boxes.md` Paris + Fishbrain asks** — both now owner-answered as stated above; the Fishbrain *rights* question is closed (never shipped), replaced by an **unassessed internal-retention-terms** note.

## Prioritized owner decisions

1. **Apply the 17 research-resolved items** (evidence-backed, apply-ready) — includes **two repair-gaps** the repair's 22-item sweep missed: `north-prong-barren-fork` and `tellico-lake` still carry stale programmatic windows contradicted by the committed schedule, and `doe-river` should be re-authored as the documented regulatory DH window (Oct 1–Feb 28). Also includes 4 identity/region fixes (puncheon county, johnson-park city note, mill-creek + standing-rock regionIds vs their own HUCs), 3 citation repairs (lake-graham + the two yearRound nulls on dale-hollow/south-holston lakes, parksville-lake stocking/yearRound), the wilbur-reach mirroring null-out, and 4 note/text corrections (elk-river gauge text, melton-hill phrase, nolichucky relabel, caney-fork-upper fishery).
2. **Set the legacy-tag policy (9 waters, one decision):** strip or hold tagged-unverified species/fishery claims on unresolved and warmwater-focus waters — trout-side: east-fork-stones-river, elk-river-lower, little-pigeon-river, pigeon-river, powell-river, south-fork-cumberland; warmwater-side: new-river, reedy-creek; plus harpeth-river's smallmouth tag. Presentation already honors the adjudicated verdicts; this is catalog-metadata hygiene. (For elk-river-lower, the false "winter stocking in Lincoln County reaches" note sentence should be fixed regardless.)
3. **Adopt the reach-split fishery convention (3 waters) + GSMNP park-reach wording (5 waters):** little-river, tellico-river, middle-prong-little-pigeon need a convention for wild+stocked reach splits (new first-hand TDEC 2024 WQS support for Little River's RM 33.0 structure); cosby, leconte, roaring-fork (and middle-prong) notes should state the park-reach/below-park split once, uniformly.
4. **Parksville tailwater display tier** — keep or demote `display: featured` on a limited-evidence water (pure prominence policy).
5. **Trail Fork monitoring line** — add the owner-fact wording (survey occurred per owner; result not located) to notes/opportunity; the 2024-05-20 stocking row is recorded as a stocking event only.

## Data-holder questions (TWRA unless noted)

1. **Operative stocking calendars** — Boone TW (schedule M,A,N,D vs static Mar/Apr/Dec vs forecast Mar/Apr/Jun/Dec), Fort Patrick Henry TW (schedule adds Dec; a completed 09/03/2026 release sits outside every calendar), Clinch TW (Mar–Aug vs Mar–Sep), Watauga TW (Mar–Sep vs Mar–Dec). Include Dale Hollow's species composition (April schedule row "Brown Trout" vs the list/page "Rainbow").
2. **Completed-release history** — an agency-maintained archive with event date, water/reach, species, quantity, completed-vs-cancelled status. Shoal Creek (Lawrence County main stem) is the standing 112-item case: zero rows anywhere public, a Davy Crockett SP GIS point as a lead, and a paywalled 2005 press account — none of which establish absence or presence.
3. **Trail Fork 2025 survey result** (Region 4) — owner-reported complete; result unpublished. Optional follow-up, not blocking.
4. **(Optional) Harpeth River species source** — if the owner wants the smallmouth tag kept rather than dropped, a Region 2 species question is the route; no public page exists (404/absent index recorded).

## Bonus residues found beyond the 112 (recorded, not triaged)

- `tims-ford-lake` and `center-hill-lake` speciesEvidence also cite the trout stocking page for warmwater species (same mis-citation pattern as lake-graham).
- `duck-river-tailwater` notes still carry a stale "year-round" sentence before its reversing correction paragraph.
- The archived-page CDX pattern yields only one `.exceldriven.json` snapshot; more archived responses may exist under other endpoint names (discovery note, not a request).

---

## Research-resolved — verified against primary/captured evidence; owner can apply the recommended action (17)

### caney-fork-upper

- **Original correction:** catalogFields.fishery is null - evidence supports 'warmwater' for this reach (TWRA Great Falls Reservoir page, verified 2026-09-22). stockingProgram=false is correct; species=null is correct.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-caney-fork · ledger=warmwater-focus/documented
- **Disposition:** research-resolved · affects: classification
- **Evidence:** evidence-work/adj/lane-2/caney-fork-upper.json — "webCheck verified 2026-09-22: TWRA Great Falls Reservoir page - warmwater species list (bass/crappie/catfish/musky, winter walleye run); 'no trout in fishery description'; zero upp" (retrieved 2026-09-22, obs current page content) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "grep: zero Caney Fork rows above Center Hill Dam (only 'Center Hill TW / Caney Fork River' tailwater row exists)" (retrieved 2026-09-22) ; packages/content/streams/tn/caney-fork-upper.yaml — "species and fishery keys absent (both null); stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Great Falls Reservoir page (this reach's impoundment) documents warmwater bass/crappie/catfish/musky water with a winter walleye run and no trout content, supporting fishery='warmwater' for the upper Caney Fork reach. stockingProgram=false and species=null are correct.
- **Does not support:** The capture evidence documents the Great Falls Reservoir pool fishery; it does not describe every free-flowing riffle of the upper reach, and it does not prove trout are absent.
- **Recommended action:** Populate fishery: 'warmwater' — TWRA Great Falls Reservoir page documents this reach's warmwater fishery (verified 2026-09-22 capture + 2026-09-24 re-check); species=null and stockingProgram=false stay as-is.
- **Confidence:** high — TWRA water-specific page captured and re-checked; lane-2 verified the same page live.
- **Notes:** The celebrated trout water begins below Center Hill Dam (caney-fork-river) - a separate catalog water.

### dale-hollow-lake

- **Original correction:** Catalog yearRound:null should be true (TWRA live year-round reservoir list + documented multi-season fishery). Catalog note 'TWRA stocks brown trout here each spring' presents one side of a live conflict (page/list say wintertime rainbow) — present as conflict. seasonMonths: none published coherently; keep null with conflict note rather than [4].
- **Current catalog:** species=trout · fishery=stocked · yearRound=— · seasonMonths=null · region=tn-upper-cumberland · ledger=year-round-trout/documented
- **Disposition:** research-resolved · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "list line 'Region II, Dale Hollow, - Rainbow' under the year-round reservoir stocking header" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 3, Clay, 'Dale Hollow Reservoir', Reservoir, months A, 'Brown Trout' (the spring-brown conflict side)" (retrieved 2026-09-22, obs 2026 stocking schedule) ; evidence-work/adj/lane-1/dale-hollow-lake.json — "webCheck verified 2026-09-22: live reservoir page - wintertime rainbow stocking; May/June deep trolling 30-50 ft; summer night fishing; Rainbow Trout in species list; 7/day no leng" (retrieved 2026-09-22) ; packages/content/streams/tn/dale-hollow-lake.yaml — "yearRound key ABSENT (null) as of 2026-09-24 - correction not yet applied; notes DO present the conflict: 'Live TWRA stocking composition lists rainbow trout; the repository snapsh" (retrieved 2026-09-24)
- **Supports:** yearRound=true is supported by TWRA's live year-round reservoir list ('Dale Hollow - Rainbow') plus the documented multi-season fishery (wintertime rainbow stocking + deep summer fishery per the reservoir page). Both stocking-species sides are quoted: reservoir page/list = wintertime rainbow; schedule row = April Brown Trout. Notes already present the conflict; yearRound is still null and should be set.
- **Does not support:** Neither side of the stocking-species conflict is 'the answer' - present as a live conflict. No coherent month window is published for the lake fishery; seasonMonths [4] would cherry-pick the brown row - keep null.
- **Recommended action:** Set yearRound: true (TWRA year-round reservoir list, live 2026-09-22/24). Separately preserve the species-conflict note: April schedule row says Brown Trout, the reservoir list + Dale Hollow page say Rainbow — do not silently resolve; fold into the TWRA species question.
- **Confidence:** high — Reservoir list captured + page captured; conflict preserved per date-discipline rules.
- **Notes:** Separate catalog waters: Dale Hollow TW / Obey River (tailwater) and Hatchery Creek.

### doe-river

- **Original correction:** seasonMonths [12,1,2] (programmatic) understates the stated DH window: TWRA states the catch-and-release season as Oct 1 - Feb 28, so correct to [10,11,12,1,2] (or tie the field to the DH window explicitly).
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=[12,1,2] · region=tn-northeast-watauga · ledger=year-round-trout/documented
- **Disposition:** research-resolved · affects: season
- **Evidence:** evidence-work/adj/lane-3/doe-river.json — "webCheck [verified] https://www.tn.gov/twra/fishing-regs/trout-regulations.html - 'Live page: Doe River DH entry (C&R Oct 1 - Feb 28, RMSP boundaries) quoted verbatim.'; publisher " (retrieved prior lane-3 verification, retrieved 2026-09-22) ; captures/twra-schedule.json — "rows: REGION 4 / Carter / "Doe River" / Seasonal / STOCKING WEEK 3/1, 3/15, 3/29, 4/12, 4/26, 5/10, 5/24, 6/7/2026 (8 rows) + "Doe River" / Delayed Harvest / week 10/4/2026 / Rainb" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/doe-river.yaml — "seasonMonths [12,1,2] seasonKind programmatic (still present); notes quote: 'Catch-and-release season is Oct. 1- Feb 28.'" (retrieved catalog read 2026-09-24)
- **Supports:** The Oct 1-Feb 28 delayed-harvest C&R window is a documented REGULATORY window (lane-3 verified the TWRA trout-regulations page live 2026-09-22, publisher copy agreeing), and the schedule's own DH row (week of 10/4/2026) aligns with the October opening. The catalog's [12,1,2] labeled 'programmatic' understates and mislabels that window: under the repair design a documented regulatory window is exactly the case that may stay as an authored window.
- **Does not support:** Does not establish a programmatic (stocking-driven) Dec-Feb window - the 2026 stocking rows are Mar-Jun + one Oct DH week; nor does it prove trout presence in the window's warm tail (catalog's own caveat on the warm lower Elizabethton reach).
- **Recommended action:** Replace seasonMonths [12,1,2]/programmatic with the documented REGULATORY delayed-harvest C&R window Oct 1–Feb 28 → [10,11,12,1,2] with seasonKind: regulatory (verified live 2026-09-22 by lane-3 and re-checked from its dated record). The Mar–Jun stocking rows stay stocking-calendar facts, not a season window.
- **Confidence:** high — Regulatory window quoted verbatim from the live regs page with dated record; repair design keeps regulatory windows meaningful.
- **Notes:** Window part is NOT superseded here: unlike the 22 removed programmatic windows, this one is regulatory and the repair design explicitly keeps documented regulatory windows meaningful.

### edmund-orgill-lake

- **Original correction:** species and fishery fields are empty while the stocked-rainbow program is documented by TWRA's schedule and GIS layer for this water; populate species='trout', fishery='stocked'.
- **Current catalog:** species=trout · fishery=— · yearRound=— · seasonMonths=[11,12,1,2,3] · region=tn-west · ledger=seasonal-stocked-trout/documented
- **Disposition:** research-resolved · affects: classification
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "rows: Region 1, Shelby, 'Edmund-Orgill Park', Winter, Rainbow Trout, days 1/13/2026 and TBD 12/2026" (retrieved 2026-09-22, obs 2026 stocking schedule) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-stock-locations.json — "GIS point OBJECTID 676: Site_Name 'Edmund-Orgill Park', StreamName 'Edmund-Orgill Park Pond', Region 1, County SHELBY, City Millington" (retrieved 2026-09-22) ; packages/content/streams/tn/edmund-orgill-lake.yaml — "species: trout already set; fishery key ABSENT (null) as of 2026-09-24; seasonMonths [11,12,1,2,3] programmatic" (retrieved 2026-09-24)
- **Supports:** The stocked-rainbow program is documented by both the 2026 schedule (two winter rows) and the GIS stocking-point layer for this exact water - populating species='trout' is done, and fishery='stocked' is supported.
- **Does not support:** Schedule rows are planned winter events (put-and-take), not proof of current fish presence or a year-round fishery; the catalog correctly keeps a cold-months programmatic window.
- **Recommended action:** Populate species: 'trout' and fishery: 'stocked' — schedule rows + GIS stocking point document the stocked-rainbow program (captures re-quoted by R1/R2).
- **Confidence:** high — Two independent committed captures (schedule + GIS) name the water.
- **Notes:** Notes correctly say the fish do not hold over summer - keep the winter-window framing.

### elk-river

- **Original correction:** catalog yearRound=true is correct but must be reach-scoped to the first ~11 miles. seasonMonths [3-12] matches stocking months. Gauge note: the tailwater has NO temperature gauge; catalog's 03578000 is Elk River near Pelham, an upstream headwater gauge (prior lead) - do not use it for tailwater conditions.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[3,4,5,6,7,8,9,10,11,12] · region=tn-middle-duck-elk · ledger=year-round-trout/documented
- **Disposition:** research-resolved · affects: gauge|notes
- **Evidence:** captures/twra-schedule.json — "rows: REGION 2 / Franklin/Moore / "Tims Ford TW / Elk River" / Tailwater / STOCKING MONTHS "M, A, M, J, J, A, S, O, N, D" / "Rainbow, Brown Trout"" (retrieved 2026-09-22 (capture)) ; captures/twra-forecast-text.md — "node n-zcBY2G: "Stocking: March through December (year-round fishing)" (Tims Ford/Elk section); catalog-pinned nodes n-0Qzf3q/n-yxFIZJ: trout "24-7-365" in the first 11 miles; Old " (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-recent-releases.json — "row: {Region 2, Destination 'Tims Ford TW', Stocking Date 09/10/2026}" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/elk-river.yaml — "opportunity.reachScope: 'First ~11 miles of Elk River below Tims Ford Dam ... Does NOT extend to the whole Elk River.'; gaugeIds: [tva:TMFT1] only; notes STILL say 'Two gauges (bel" (retrieved catalog read 2026-09-24) ; evidence-work/adj/lane-2/elk-river.json — "catalogFieldCorrections: 'the tailwater has NO temperature gauge; catalog's 03578000 is Elk River near Pelham, an upstream headwater gauge (prior lead) - do not use it for tailwate" (retrieved prior lane-2 verification, retrieved 2026-09-22)
- **Supports:** yearRound=true with the first-~11-miles reachScope is correctly carried in the catalog (matches lane-2's verified headline and the forecast '24-7-365' text), and seasonMonths [3..12] matches the schedule's M,A,M,J,J,A,S,O,N,D as stocking months. The gauge correction is partially applied: gaugeIds is now tva:TMFT1 only, but residual Pelham claims persist in notes ('Two gauges ... near Pelham') and in officialSources (USGS 03578000 with no upstream-context caveat).
- **Does not support:** The Pelham gauge identity rests on a prior research lead (lane-2, not re-verified offline); no temperature gauge for the tailwater is established - only that 03578000 should not be used as one. The 11-mile boundary is TWRA prose ('first 11 miles'), not a surveyed fish boundary.
- **Recommended action:** Keep the 11-mile reachScope (already carried in the opportunity block). Fix the residual gauge text: notes still say "Two gauges … near Pelham" and officialSources still cite USGS 03578000 without the upstream-headwater caveat — relabel 03578000 as upstream context (Elk River above Fayetteville), noting the tailwater has no temperature gauge (current gaugeIds already tva:TMFT1 only).
- **Confidence:** high — R1 confirmed the half-done gauge fix against the current YAML and lane-2 records.
- **Notes:** seasonMonths [3..12] remains as programmatic - tolerable while TWRA's own forecast says 'March through December', but it should present as stocking months, not a fishing window.

### johnson-park-lake

- **Original correction:** catalog note locates the lake 'in Memphis (Shelby County)': TWRA's stocking layer records City = Collierville (W.C. Johnson Park, 419 W.C. Johnson Park Dr per prior research on TWRA's license-event page); correct the city attribution to Collierville, Shelby County.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[11,12,1,2,3] · region=tn-west · ledger=seasonal-stocked-trout/documented
- **Disposition:** research-resolved · affects: notes|identity
- **Evidence:** evidence-work/captures/twra-stock-locations.json — "'Wc Johnson Park' / 'Wc Johnson Park Lake', Reg 1, Cnty SHELBY, City COLLIERVILLE, Prog Winter, Species rainbow, Class pond (only Johnson Park point; other Shelby points are German" (retrieved 2026-09-22 (capture)) ; captures/twra-schedule.json — "rows: REGION 1 / Shelby / "Johnson Park Lake" / Winter / STOCKING DAY 1/15/2026 and "TBD 12/2026" / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/johnson-park-lake.yaml — "notes STILL say 'TWRA winter put-and-take lake in Memphis (Shelby County)'; opportunity.statement says 'at the W.C. Johnson Park lake in Collierville' (inconsistent within the same" (retrieved catalog read 2026-09-24) ; evidence-work/adj/lane-3/johnson-park-lake.json — "webCheck [verified] GIS point 'Wc Johnson Park Lake', City Collierville, SHELBY re-checked; catalogFieldCorrections: correct the city attribution to Collierville, Shelby County" (retrieved prior lane-3 verification, retrieved 2026-09-22)
- **Supports:** TWRA's stocking layer records City = Collierville for the W.C. Johnson Park lake point, so the catalog note's 'in Memphis' is wrong at city level (both are Shelby County - the note is county-correct, city-wrong). The file is internally inconsistent: statement says Collierville, notes say Memphis.
- **Does not support:** The GIS point proves the mapped stocking site's city, not a mailing address; '419 W.C. Johnson Park Dr' remains a prior-research lead (lane-3), not a capture.
- **Recommended action:** Correct the note "in Memphis (Shelby County)" — TWRA GIS City field is Collierville (Shelby County); the opportunity statement already says Collierville. Fix the note to match (both are Shelby County; the city is wrong, not the county).
- **Confidence:** high — GIS attribute quoted from the committed 730-point capture.
- **Notes:** Catalog seasonMonths [11,12,1,2,3] is broader than the two Winter rows (1/15 + TBD 12) - not this item's ask, but worth a look when the window design is settled.

### lake-graham

- **Original correction:** speciesEvidence entries for largemouth-bass/crappie/bluegill cite TWRA's trout stocking page (trout-information-stockings.html), which documents trout programs, not this lake's warmwater species; the correct citation is TWRA's Lake Graham page (verified live 2026-09-22: 'Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish').
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[11,12,1,2,3] · region=tn-west · ledger=mixed/documented
- **Disposition:** research-resolved · affects: identity
- **Evidence:** https://www.tn.gov/twra/fishing/where-to-fish/west-tennessee-r1/lake-graham.html (live fetch 2026-09-24) — "species line verbatim: 'Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish'; ~500 acres, nine miles east of Jackson on Cotton Grove Road; trout appears " (retrieved 2026-09-24, obs current page content) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "rows: Region 1, Madison, 'Lake Graham', Winter, Rainbow Trout, days 1/8/2026 and TBD 12/2026" (retrieved 2026-09-22, obs 2026 stocking schedule) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-stock-locations.json — "GIS point OBJECTID 668: 'Lake Graham', Region 1, MADISON, Jackson, StockingPr(ogram) Winter" (retrieved 2026-09-22) ; packages/content/streams/tn/lake-graham.yaml — "speciesEvidence STILL cites https://www.tn.gov/twra/fishing/trout-information-stockings.html (retrieved 2026-09-13) for largemouth-bass, crappie, bluegill, channel-catfish - the mi" (retrieved 2026-09-24)
- **Supports:** Confirmed: the correct positive citation is TWRA's Lake Graham page, whose species line was re-verified verbatim live (2026-09-24): 'Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish'. The trout stocking page documents trout programs, not this lake's warmwater species - the critique stands, and the four speciesEvidence URLs still point at the wrong page.
- **Does not support:** The Lake Graham page documents the warmwater fishery; it does not document trout absence (the lake carries a real winter rainbow program - 2 schedule rows + GIS point).
- **Recommended action:** Re-point the four warmwater speciesEvidence URLs (currently the trout stocking page) to the TWRA Lake Graham page whose species line reads verbatim 'Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish' (live-verified 2026-09-24).
- **Confidence:** high — Live fetch 2026-09-24 with verbatim quote; mis-citation pattern confirmed in current YAML.
- **Notes:** Optional: add redear sunfish to targetSpecies - it is on the TWRA species line but missing from the current list.

### melton-hill-lake

- **Original correction:** Catalog speciesEvidence (bass/crappie/bluegill/catfish/striped bass) plus the live page's musky documentation are consistent; consider adding musky to the species picture. Catalog notes' phrase 'giving year-round cold-water fishing' is unverified agency-wise — remove or qualify it. Catalog species:null and stockingProgram:false are correct for trout.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-clinch · ledger=warmwater-focus/documented
- **Disposition:** research-resolved · affects: notes
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-melton-hill-lake.html — "'Melton Hill is a cool water reservoir with relatively low productivity.'; 'The cold water released through Norris Dam negatively impacts warm water fish species like Largemouth Ba" (retrieved 2026-09-22) ; evidence-work/adj/lane-1/melton-hill-lake.json — "webChecks verified 2026-09-22: cool-water text, musky documentation, Melton Hill absent from year-round reservoir list and from all 616 schedule rows" (retrieved 2026-09-22) ; packages/content/streams/tn/melton-hill-lake.yaml — "notes STILL read: 'The Norris tailwater (clinch-river) runs the length of this pool, giving year-round cold-water fishing' - the phrase the correction wants removed/qualified is pr" (retrieved 2026-09-24)
- **Supports:** Species evidence and the live page are consistent, and musky is a documented TWRA-stocked species here (since 1998) - adding musky to the species picture is supported. species=null and stockingProgram=false are correct for trout. The 'year-round cold-water fishing' phrase is confirmed unverified agency-wise: the TWRA page never says it (its only year-round mention is camping).
- **Does not support:** The phrase is editorial, and the correction is NOT yet applied - it remains in catalog notes as of 2026-09-24. The page frames cold inflow as negative for the lake's documented fishery; it nowhere documents a year-round cold-water FISHING claim for this pool.
- **Recommended action:** Remove or qualify the notes phrase 'year-round cold-water fishing' — TWRA's page's only 'year-round' reference is camping. Musky (documented since 1998 on the same page) is an optional species addition the owner may adopt.
- **Confidence:** high — Captured + live page wording checked; phrase contradicts the source.
- **Notes:** The Clinch Norris tailwater (clinch-river) ends at Hwy 61 at Clinton upstream of this pool - the cold-inflow fact belongs to the lake's ecology, not to a scored trout fishery.

### mill-creek-overton

- **Original correction:** seasonMonths null should carry the observed stocking months Mar/Apr. Separately, regionId tn-middle-caney-fork mismatches the creek's HUC 05130106 (Obey/Cordell Hull) - owner-visible catalog geography item.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-caney-fork · ledger=seasonal-stocked-trout/documented
- **Disposition:** research-resolved · affects: season|region
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Overton / "Mill Creek (Standing Stone State Park)" / Seasonal / STOCKING WEEK 3/22/2026 and 4/26/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "3 points 'Mill Creek (Standing Stone State Park)', Reg 3, Cnty OVERTON, City Allons, Prog Spring, rainbow, stream" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/mill-creek-overton.yaml — "regionId tn-middle-caney-fork; hydroIdentity.huc8s ['05130106']; seasonMonths absent (null); caveat already concedes: 'the catalog's Caney Fork region tag also mismatches the creek" (retrieved catalog read 2026-09-24) ; docs/STATEWIDE-RIVER-COVERAGE.md — "HUC 05130106 grouped with Obey/Cordell Hull tributaries (Roaring River = 05130106 only; Blackburn Fork = 05130106), while Caney Fork waters in this catalog carry 05130107/05130108" (retrieved catalog read 2026-09-24)
- **Supports:** Observed stocking months Mar/Apr are confirmed (weeks 3/22 + 4/26) - but that is now presentation data, not a seasonMonths value. The geography item is confirmed: HUC 05130106 is the Obey/Cordell Hull drainage, not the Caney Fork, so regionId tn-middle-caney-fork contradicts the catalog's own huc8s; the catalog caveat admits it and the fix is an owner-approved regionId/region-tag edit.
- **Does not support:** Mar/Apr rows do not establish any fishing window, and do not resolve which internal region id SHOULD replace tn-middle-caney-fork (no Obey-region mapping was verified offline).
- **Recommended action:** Fix regionId: tn-middle-caney-fork contradicts the catalog's own huc8s 05130106 (Obey/Cordell Hull drainage) — reassign to the matching upper-Cumberland region. The Mar/Apr stocking-months part is superseded (no authored programmatic windows by repair design; rows 3/22 + 4/26 confirmed).
- **Confidence:** high — HUC contradiction is internal to the catalog; schedule rows quoted from capture.
- **Notes:** Two-part item: window part verdict is 'superseded' by the repair design; region part verdict is 'confirmed' - hence overall partial.

### nolichucky-river

- **Original correction:** catalog note 'upstream reaches hold scattered wild fish' is agency-unverified and should not be presented as documented; species is UNSET — the TWRA smallmouth PLR supports listing smallmouth bass.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-pigeon-frenchbroad · ledger=warmwater-focus/limited
- **Disposition:** research-resolved · affects: notes
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "'Nolichucky River | ENKA Dam upstream to the state line includes Davy Crockett Lake. | Black Bass: Five (5) per day in combination; 13-17 inch PLR for Smallmouth bass, only one (1)" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/nolichucky-river.json — "webChecks verified 2026-09-22: PLR quoted verbatim; trout-lead web follow-up found ONLY guide-marketing pages (ashevilleflyfishingco etc.) for trout claims - 'no agency ma[terial]'" (retrieved 2026-09-22) ; packages/content/streams/tn/nolichucky-river.yaml — "notes STILL read 'upstream reaches hold scattered wild fish' with no unverified label as of 2026-09-24; species key absent (UNSET); caveat correctly notes zero stocking rows and th" (retrieved 2026-09-24)
- **Supports:** The smallmouth PLR is confirmed (re-verified live 2026-09-24; lane-6b verbatim 2026-09-22) and supports listing smallmouth bass as the managed species. No agency source for 'upstream reaches hold scattered wild fish' is visible in any capture or lane check - the claim is agency-unverified.
- **Does not support:** The note remains in the YAML presented as fact (no 'unverified' label), so the correction is NOT yet applied. Guide-marketing pages are not agency sources and were correctly rejected by lane-6b; absence of agency evidence is not evidence of absence.
- **Recommended action:** Relabel the note 'upstream reaches hold scattered wild fish' as unverified/angler-reported (no agency source exists on any surface checked 2026-09-22/24). The smallmouth 13–17 in PLR is regs-verified and supports listing smallmouth if the owner populates species (optional).
- **Confidence:** high — PLR quoted verbatim from the live exceptions page; absence of an agency source for the wild-fish note was re-checked.
- **Notes:** Regulation reach: 'ENKA Dam upstream to the state line includes Davy Crockett Lake'; lower reach under Douglas Reservoir rules.

### north-prong-barren-fork

- **Original correction:** seasonMonths [12,1,2] is contradicted by the schedule capture (spring weeks 3/22 + 4/26) - correct the catalog to spring seasonal.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[12,1,2] · region=tn-middle-caney-fork · ledger=seasonal-stocked-trout/limited
- **Disposition:** research-resolved · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Warren / "N Barren Fork Creek" / Seasonal / STOCKING WEEK 3/22/2026 and 4/26/2026 / Rainbow Trout (separate "Barren Fork River" mainstem rows 3/15, 3/22, 5/10 are " (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/north-prong-barren-fork.yaml — "seasonMonths [12,1,2] seasonKind programmatic STILL PRESENT; statement/caveat already say the Dec/Jan/Feb claim 'is contradicted by the schedule'" (retrieved catalog read 2026-09-24) ; evidence-work/adj/lane-5/north-prong-barren-fork.json — "claim stocking-program [documented]: exactly two spring 'N Barren Fork Creek' weeks in the 616-row schedule" (retrieved prior lane-5 verification, retrieved 2026-09-22)
- **Supports:** REPAIR GAP: the catalog still carries the contradicted winter window while the 22-item sweep removed identical blocks elsewhere. The schedule's only N-Barren-Fork rows are spring weeks 3/22 + 4/26 - the [12,1,2] programmatic claim is contradicted by the capture, exactly as the correction says.
- **Does not support:** The two spring weeks do not establish how long fish persist after each event (lane-5 unresolvedQuestion) - only that the winter claim is wrong.
- **Recommended action:** REPAIR GAP: remove the stale seasonMonths [12,1,2]/programmatic block — the committed schedule has only spring weeks (3/22 + 4/26, "N Barren Fork Creek"). The repair's 22-item sweep missed this one; same removal applies.
- **Confidence:** high — Schedule rows quoted verbatim; current YAML still carries the contradicted block.
- **Notes:** Counts as a repair-gap finding for the SUMMARY: north-prong-barren-fork is in the corrections report WITHOUT a 'repair' marker and its block was never removed.

### parksville-lake

- **Original correction:** catalogFields.stockingProgram=false is WRONG (TWRA stocks the lake with trout: year-round list + reservoir page) - set stockingProgram=true. yearRound null should be true (list-scoped). species null should include rainbow trout (stocked).
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-se-hiwassee · ledger=year-round-trout/documented
- **Disposition:** research-resolved · affects: species|notes|season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "'TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities.' - list line: 'Region II, Parksville - Rainbow'" (retrieved 2026-09-22 (capture)) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-parksville-lake.html — "'Parksville has been stocked by TWRA with bluegill, redear sunfish, black crappie, muskie, walleye, and trout.'" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "'Parksville Reservoir (Ocoee Lake #1)' + one unnamed point, Stream 'Parksville Reservoir', Reg 3, POLK, Prog Spring, Species rainbow, Class reservoir (separate 'Parksville Dam' poi" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/parksville-lake.yaml — "stockingProgram: false (still present, contradicted); no species/yearRound fields; opportunity.statement already asserts the year-round program citing the year-round list" (retrieved catalog read 2026-09-24)
- **Supports:** stockingProgram=true is supported three ways: the year-round reservoir list ('Region II, Parksville - Rainbow'), the TWRA reservoir page (stocked with ... trout), and two reservoir-class GIS points with Spring/rainbow attributes. yearRound=true is supported list-scoped ('to provide year-round trout fishing opportunities'), and rainbow is the stocked species.
- **Does not support:** The tailwater row 'Parksville(Ocoee #1) TW / Ocoee River' (months M, A, M) is the Ocoee River below the dam - wrong-water for the lake; it neither adds nor subtracts from the lake claim. No lake rows exist in the 616-row schedule; summer catchability/holdover in the lake is undocumented (lane-2 unresolvedQuestion).
- **Recommended action:** Set stockingProgram: true and yearRound: true (list-scoped) — TWRA year-round reservoir list "Region II, Parksville - Rainbow" + captured fishery page + 2 reservoir GIS points; species rainbow stocked. Never transfer to parksville-tailwater.
- **Confidence:** high — Three independent committed captures agree.
- **Notes:** The opportunity block was already corrected; the residual defect is the stale stockingProgram=false flag and missing species/yearRound fields.

### puncheon-camp-creek

- **Original correction:** seasonMonths [12,1,2] is WRONG vs the schedule (spring weeks 2/8-4/12/2026); correct to spring seasonal. The catalog note 'TWRA spring-stocked Grainger County creek' is right; the counties:[Campbell] field likely wrong.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-clinch · ledger=seasonal-stocked-trout/documented
- **Disposition:** research-resolved · affects: identity|geometry
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Grainger / "Puncheon Camp Creek" / Seasonal / STOCKING WEEK 2/8, 3/1, 3/22 and 4/12/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "7 points 'Puncheon Camp Creek #1-#7', Reg 4, Cnty GRAINGER, City Washburn, Prog Spring, Species rainbow, Class stream" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/puncheon-camp-creek.yaml — "counties: [Campbell] still present; hydroIdentity.huc8s ['06010205']; statement already says 'this tiny Grainger County creek'" (retrieved catalog read 2026-09-24) ; evidence-work/adj/lane-5/puncheon-camp-creek.json — "flags include 'identity-issue'; claim stocking-program documented via name+county (Grainger) match" (retrieved prior lane-5 verification, retrieved 2026-09-22)
- **Supports:** Both TWRA datasets place this creek in GRAINGER County (schedule COUNTY field; all 7 GIS points County=GRAINGER, City=Washburn), so the catalog's counties:[Campbell] is wrong and the catalog's own statement ('Grainger County creek') already says so. The window part of the correction was repaired (programmatic block removed); the observed 2026 program is spring weeks 2/8-4/12.
- **Does not support:** Sources do not establish the correct internal regionId or HUC8 - huc8s 06010205 (Powell River drainage, Campbell side) likely also needs review; no geometry fix is proven offline.
- **Recommended action:** Correct counties: [Campbell] → [Grainger] — schedule COUNTY=Grainger on all rows and all 7 GIS points are GRAINGER/Washburn. Geometry follow-up (huc8s 06010205 vs mapped location) is a separate owner/geometry-team action; window part already repaired.
- **Confidence:** high — Two committed captures agree on the county; only the catalog field disagrees.
- **Notes:** Geometry follow-up: verify the mapped linework sits on the Grainger/Washburn creek, not a Campbell County same-name feature.

### south-holston-lake

- **Original correction:** Catalog yearRound:null should be true (TWRA live year-round reservoir list). Catalog species 'trout' should specify rainbow, brown, lake. seasonMonths null is correct (no published window; program-level year-round).
- **Current catalog:** species=trout · fishery=stocked · yearRound=— · seasonMonths=null · region=tn-east-holston · ledger=year-round-trout/documented
- **Disposition:** research-resolved · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "list line 'Region IV, South Holston - Lake and Rainbow' under the year-round reservoir stocking header" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-south-holston-lake.html — "'South Holston's water is cool enough and has adequate dissolved oxygen to support trout. However, dissolved oxygen can sometimes fall below optimum levels during the summer, limit" (retrieved 2026-09-22) ; packages/content/streams/tn/south-holston-lake.yaml — "yearRound key ABSENT (null) as of 2026-09-24 - correction not yet applied; notes say 'lake + lake trout named; stocking months unpinned'" (retrieved 2026-09-24)
- **Supports:** yearRound=true is supported by the year-round reservoir list; species detail rainbow, brown, lake is supported by the reservoir page (rainbows AND browns at 30-50 ft, lake trout at 90 ft, 2-lake-trout creel). seasonMonths null is correct (no published window; program-level year-round).
- **Does not support:** The list/page document the program and a deep-water summer fishery; summer DO can fall below optimum 'especially Lake Trout' - carry that caveat; do not present as easy year-round catching. No lake schedule row exists (lane-1 curl check).
- **Recommended action:** Set yearRound: true — named in TWRA's live year-round reservoir list (captured + re-checked 2026-09-24). Optional species enrichment (rainbow, brown, lake) is documented on the captured reservoir page whenever the owner authors it.
- **Confidence:** high — Reservoir list captured and re-verified live.
- **Notes:** The lake crosses into Virginia; mapped water covers the full reservoir - TN program evidence only.

### standing-rock-creek

- **Original correction:** seasonMonths [12,1,2] is wrong (rows are Feb/Mar); regionId tn-upper-cumberland is wrong - the creek is in the Tennessee River/Kentucky Lake drainage (HUC 06040005).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-upper-cumberland · ledger=seasonal-stocked-trout/documented
- **Disposition:** research-resolved · affects: season|region
- **Evidence:** captures/twra-schedule.json — "rows: REGION 1 / Stewart / "Standing Rock Creek" / Seasonal / STOCKING WEEK 2/22, 3/22 and 3/29/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "1 point 'Standing Rock Creek Spring Trout Site', Reg 1, Cnty STEWART, Prog Spring, rainbow, stream" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/standing-rock-creek.yaml — "regionId tn-upper-cumberland; hydroIdentity.huc8s ['06040005']; seasonMonths absent (repaired)" (retrieved catalog read 2026-09-24) ; docs/STATEWIDE-RIVER-COVERAGE.md — "HUC 06040005 rows are Lower-Tennessee/Kentucky-Lake-drainage waters (e.g. Big Sandy River = 06040005; Birdsong, Cypress, Bear creeks), consistent with 0604 = Tennessee River basin" (retrieved catalog read 2026-09-24)
- **Supports:** Rows are Feb/Mar as the correction says (weeks 2/22, 3/22, 3/29) - window part repaired, facts confirmed. The geography inconsistency is confirmed: the catalog's own HUC 06040005 sits in the 0604 Lower Tennessee accounting unit (Tennessee River/Kentucky Lake drainage), while regionId tn-upper-cumberland belongs to the 051301 Upper Cumberland basin; TWRA Region 1 + Stewart County corroborate the west-TN location. One of regionId or huc8s is wrong and the owner must pick.
- **Does not support:** Offline sources cannot establish the creek's CORRECT HUC (Stewart County creeks can drain to Kentucky Lake or the Cumberland/Barkley side) - only that the current region/HUC pair is self-contradictory.
- **Recommended action:** Fix regionId: tn-upper-cumberland contradicts the catalog's own huc8s 06040005 (Lower Tennessee/Kentucky Lake drainage) — reassign to the West-Tennessee/Tennessee-River region that matches the HUC. Window part already repaired (rows 2/22, 3/22, 3/29 confirmed).
- **Confidence:** high — HUC contradiction internal to the catalog; R1 could not resolve the exact target regionId offline — the mismatch itself is certain, the correct value is mechanical once confirmed against the region map.
- **Notes:** Rows are Feb/Mar exactly. Caution: 'Standing Rock Creek' (Stewart) is not the Standing Stone park creek (Overton) - different waters.

### tellico-lake

- **Original correction:** catalogFields.yearRound=false is contradicted by TWRA's year-round reservoir list ('Tellico (Upper) - Rainbow') - set yearRound=true reach-scoped to the upper arm. species 'trout' ok; seasonMonths [2,3,4] should be labeled stocking months, not the fishing window.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=[2,3,4] · region=tn-east-clinch · ledger=year-round-trout/documented
- **Disposition:** research-resolved · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "'TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities.' - list line: 'Region IV, Tellico (Upper) - Rainbow'" (retrieved 2026-09-22 (capture)) ; captures/twra-schedule.json — "zero Tellico Reservoir rows; all 32 Tellico-token rows are REGION 3 / Monroe / 'Tellico River' (stream program: Seasonal Mar-Aug + Delayed Harvest weeks 2/8-12/6)" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/tellico-lake.yaml — "yearRound: true with ledger note 'Correction (2026-09-22, evidence ledger): yearRound false -> true'; seasonMonths [2,3,4] seasonKind programmatic STILL PRESENT with caveat 'the ca" (retrieved catalog read 2026-09-24) ; evidence-work/adj/lane-2/tellico-lake.json — "webChecks: reservoir page '~4,500 late-winter/early-spring rainbows, upper-arm stocking' + year-round list verified; scheduleJoin 'no-join' (all Tellico rows are the stream)" (retrieved prior lane-2 verification, retrieved 2026-09-22)
- **Supports:** yearRound=true is now applied and supported by the year-round list ('Tellico (Upper) - Rainbow') and lane-2's live reservoir-page check (~4,500 rainbows, upper arm below Chilhowee Dam). The [2,3,4] months are stocking months (late-winter/early-spring window), not a fishing window - and under the repair design should not sit in seasonMonths/seasonKind at all. The block is still present, so the catalog is mid-way between the old and new design.
- **Does not support:** The 32 Tellico River schedule rows are wrong-water for the lake (do not derive any lake window from them); year-round list membership does not document summer catchability in the arm (lane-2 unresolvedQuestion).
- **Recommended action:** REPAIR GAP: remove the stale seasonMonths [2,3,4]/programmatic block (a caveat currently relabels it, but the block contradicts the no-programmatic-windows design like the repaired 22). yearRound: true already applied.
- **Confidence:** high — Current YAML inspected by R1; list + reservoir page captured by lane-2.
- **Notes:** Residual repair gap: the caveat correctly relabels the months, but the stale programmatic block remains in the data.

### watauga-river-wilbur-reach

- **Original correction:** Catalog fishery 'tailwater' and seasonMonths [3,4,5,6,7] are unsupported for THIS reach — the Mar-Jul months mirror the Wilbur Reservoir row and the 'tailwater' label mirrors the below-Wilbur-Dam water. Recommend fishery null / seasonMonths null until reach-specific evidence exists; keep the water in the catalog as a connector reach.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=— · seasonMonths=[3,4,5,6,7] · region=tn-northeast-watauga · ledger=unresolved/unresolved
- **Disposition:** research-resolved · affects: classification|season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Carter/Washington / "Wilbur Tailwater / Watauga River" / Tailwater / STOCKING MONTHS "M, A, M, J, J, A, S" / "Rainbow Trout" (single Wilbur-token row; no separate " (retrieved 2026-09-22 (capture)) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "static page links list includes 'Wilbur Dam, Watauga River' and 'Watauga Dam, Wilbur Reservoir' as separate entries" (retrieved 2026-09-22 (capture)) ; evidence-work/adj/lane-1/watauga-river-wilbur-reach.json — "webCheck [verified] live static table 2026-09-22: 'Watauga Dam, Wilbur Reservoir - Rainbow - March through July - Statewide Regulations' (names the RESERVOIR); scheduleJoinVerdict " (retrieved prior lane-1 verification, retrieved 2026-09-22) ; packages/content/streams/tn/watauga-river-wilbur-reach.yaml — "fishery tailwater + seasonMonths [3,4,5,6,7] seasonKind programmatic still present; caveat concedes they 'match no' source; stockingProgram false; opportunity unresolved/unresolved" (retrieved catalog read 2026-09-24)
- **Supports:** The correction is verified: the catalog's Mar-Jul months mirror the static WILBUR RESERVOIR row (Rainbow, March through July - verified live by lane-1 on 2026-09-22), and the weekly 'Wilbur Tailwater / Watauga River' row (Mar-Sep) belongs to watauga-river below the dam, not to this riverine dam-to-dam reach (lane-1's explicit no-join). So this reach carries fishery 'tailwater' and seasonMonths [3,4,5,6,7] borrowed from sibling waters with no reach-specific evidence.
- **Does not support:** Nothing documents trout IN the reach itself (no row, survey, or access description names the ~1.5-mile segment); stocked-fish transit between reservoirs is inference.
- **Recommended action:** Null the mirroring fields for this reach: seasonMonths [3,4,5,6,7] mirrors the static "Watauga Dam, Wilbur Reservoir — Rainbow — March through July" row (Wilbur LAKE), and fishery: tailwater mirrors the below-Wilbur-Dam water. The weekly "Wilbur Tailwater / Watauga River" row belongs to watauga-river (lane-1 join). Keep this reach's own opportunity block as the truth layer.
- **Confidence:** high — Row provenance traced verbatim in the capture + lane-1 dated join record.
- **Notes:** Catalog caveat already flags the borrowed values; only the owner edit remains.

## Owner-answered — the 2026-09-24 owner interview supplies the answer (1)

### trail-fork-big-creek

- **Original correction:** catalog fishery 'stocked' is acceptable for the stocked reach but understates the documented wild-rainbow upper reach and overstates nothing else; stockingProgram=true correct; yearRound=false correct. Recommend notes carry the waterfall-barrier boundary and the planned-2025-monitoring status.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-pigeon-frenchbroad · ledger=seasonal-stocked-trout/documented
- **Disposition:** owner-answered · affects: notes
- **Evidence:** Owner interview, 2026-09-24 (binding owner facts) — "The planned 2025 TWRA survey on Trail Fork Big Creek HAPPENED but its result could not be found. Recorded as owner-reported; no findings or persistence may be inferred, and the sur" (retrieved 2026-09-24, obs 2026-09-24 interview) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-recent-releases-2024-06-07-wayback.json — "{"Region": "4", "Destination": "Trail Fork Big Creek", "Stocking Date": " 05/20/2024"} - ONE completed stocking event at the destination; not the survey, not persistence, not speci" (retrieved 2026-09-24, obs 2024-05-20 event (archived response captured 2024-06-07)) ; packages/content/streams/tn/trail-fork-big-creek.yaml (read first-hand) — "opportunity.statement: "...Trout Unlimited reports rainbow removal above the waterfall before a 2021 brook trout transfer; current upper-reach brook trout persistence is unverified" (retrieved 2026-09-24, obs current catalog) ; evidence-work/adj/lane-2/trail-fork-big-creek.json (webChecks) — "live 2026-09-22: 5 Cocke 'Trail Fork Big Creek' Seasonal rainbow rows (2/22-5/17/2026); TWRA 2025 Coldwater Summit slide 17 lists 'Trail Fork Big Creek (French Broad)' under PLANNE" (retrieved 2026-09-22, obs 2026 schedule; 2025 summit deck)
- **Supports:** The boundary/history half of the correction is already satisfied: the current YAML separates the 2017 wild-rainbow plan text and the 2021 rainbow-removal/brook-transfer history from current occupancy ('current upper-reach brook trout persistence is unverified'), carries the waterfall-barrier boundary in statement, reachScope and caveats, and fishery=stocked for the lower stocked reach is acceptable (lane-2; 5 spring 2026 rows; corroborating completed 2024-05-20 stocking row in the archived TWRA response). stockingProgram=true and yearRound=false stand.
- **Does not support:** The monitoring-status half of the repair is stale AND missing: the YAML carries no monitoring line at all, and the correction's 'planned-2025-monitoring status' framing is superseded by the owner interview - the survey is owner-reported COMPLETED with its result not located. Lane-2's 'planned-not-completed-monitoring' flag must not be carried forward. No persistence claim either way.
- **Recommended action:** Add the owner-fact monitoring line to notes/opportunity: the planned 2025 TWRA survey OCCURRED (owner-reported; result not located — do not infer findings or persistence). The 2024-05-20 archived TWRA row records one completed stocking at the destination, not the survey. Current YAML already separates the 2017/2021 history and the waterfall boundary from 2026 occupancy (repair wording) — only the monitoring line is missing.
- **Open question:** Owner may later obtain the 2025 survey result from TWRA Region 4 (data-holder follow-up; not blocking).
- **Confidence:** high — Binding owner fact + archived TWRA row + current YAML inspected by R3.
- **Notes:** Name and reach discipline per lane-2 carry forward: 'Trail Fork Big Creek' is the stocking group; the brook story sits above the waterfall, the stocking story below it.

## Owner decision — a judgment call (display wording, enrichment adoption, interim handling of unverified tags) (16)

### cosby-creek

- **Original correction:** yearRound=false understates the park reach: NPS permits year-round fishing on all park streams and documents a wild (brook) trout population in Cosby Creek; set yearRound=true with the stocked/private-land lower segments kept seasonal, or scope the field to the park reach.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** owner-decision · affects: season,classification
- **Evidence:** https://www.nps.gov/grsm/planyourvisit/fishing.htm — ""Fishing is permitted year-round in open waters from 30 minutes before official sunrise to 30 minutes after official sunset. The park allows fishing in all streams." ... "safeguard" (retrieved 2026-09-24, obs current park guidance (live fetch)) ; evidence-work/adj/lane-3/cosby-creek.json (webChecks) — "live 2026-09-22: NPS brook-trout page names Cosby Creek; TWRA Trout Management Plan names Cosby Creek as potential brook donor source; 9 Cocke 'Cosby Creek' Seasonal rainbow rows 3" (retrieved 2026-09-22, obs 2026 stocking program) ; evidence-work/captures/twra-schedule.json — "re-checked 2026-09-24: all 20 'Pigeon'-name schedule rows are Mid./W. Prong Little Pigeon (Sevier) - the separate Cocke 'Cosby Creek' Seasonal rows stand as the lower-reach private" (retrieved 2026-09-24, obs 2026 stocking schedule)
- **Supports:** Correction is confirmed: NPS permits year-round fishing on all park streams and documents wild trout park-wide (no stocking since 1975), and lane-3's dated records add Cosby-specific wild brook documentation (NPS brook-trout page + TWRA donor-source text). yearRound=true scoped to the park reach is supported; the TWRA Seasonal rows/GIS sites are lower private-land segments outside the park and stay seasonal. The 'wild+stocked (reach-split)' fishery value is an owner adoption consistent with this evidence.
- **Does not support:** The stocked lower segments are not refuted (schedule rows + private-land GIS sites are documented); no park-reach stocking claim is made; which mapped sites lie below the boundary remains lane-3's open question.
- **Recommended action:** Adopt park-reach wording: NPS year-round wild-trout park reach (live-verified) + stocked private-land lower segments (TWRA plan) — the yearRound: true flip is already applied. Fold into the GSMNP reach-wording batch (leconte, roaring-fork, middle-prong, little-river).
- **Open question:** Adopt the standard park-reach wording/fishery convention for the five GSMNP waters?
- **Confidence:** high — NPS page live-verified by R3; only the wording convention is a choice.
- **Notes:** Owner adoption: fishery value 'wild+stocked (reach-split)' is a naming choice on top of verified reach facts; catalog notes should scope yearRound=true to the park reach.

### east-fork-stones-river

- **Original correction:** Catalog species=trout / fishery=wild for this water is unsupported by any agency source found - recommend reclassifying to unresolved or warmwater pending a real survey; the seasonMonths 12/1/2-3 'programmatic wild' claim has no program behind it.
- **Current catalog:** species=trout · fishery=wild · yearRound=false · seasonMonths=[12,1,2,3] · region=tn-middle-nashville · ledger=unresolved/conflicting
- **Disposition:** owner-decision · affects: classification|season
- **Evidence:** evidence-work/adj/lane-5/east-fork-stones-river.json — "claims: warmwater-fishery [documented] 'EPA NRSA 2023-24 electrofishing sampled the LOWER East Fork Stones River on 7/31/2023... zero salmonids' (siteinfo GNIS_NAME 'East Fork Ston" (retrieved prior lane-5 verification, retrieved 2026-09-22) ; captures/twra-schedule.json — "zero rows for East Fork Stones River; Stones-token rows in the drainage are 'W. Fork Stones River - Manson Pike Trailhead' (Rutherford, Winter) and 'J. Percy Priest TW / Stones Riv" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/east-fork-stones-river.yaml — "species trout / fishery wild / stockingProgram false / seasonMonths [12,1,2,3] seasonKind programmatic / opportunity unresolved+conflicting; statement itself says the wild claim 'c" (retrieved catalog read 2026-09-24)
- **Supports:** The evidence boundary is exactly: ONE agency sample (EPA NRSA site NRS23_TN_10069), ONE date (2023-07-31), LOWER reach (boatable, 147 m elevation), zero salmonids - a single lower-reach sample cannot prove trout absence on the unsampled upper reach, so the catalog's wild claim is unsupported-but-not-contradicted. The [12,1,2,3] 'programmatic' window has no program behind it (stockingProgram=false; no schedule row) and no authored regulatory window exists either. Classification is already opportunity unresolved/conflicting in the ledger, but legacy species/fishery/seasonMonths fields persist.
- **Does not support:** Does not establish that the upper East Fork lacks wild trout (no upper-reach survey exists), nor that it holds them (no agency source). Both directions unproven; single sample != trout absence.
- **Recommended action:** Decide the interim handling of legacy species: trout / fishery: wild / winter window on an UNRESOLVED water: evidence boundary is one NRSA site visit (2023-07-31, lower reach, zero salmonids) — a single sample, NOT trout absence; no agency survey found. Options: strip to unresolved-neutral now, or keep tagged-unverified until a TWRA Region 2 survey lands.
- **Open question:** Strip the unsupported trout/wild tags on unresolved waters now, or hold them as tagged-unverified pending a survey ask?
- **Confidence:** medium — Evidence boundary verified precisely; the strip-vs-hold policy is the owner's (same class as 5 other waters).
- **Notes:** The catalog statement is already honest (both sides preserved); the residual problem is purely the legacy fields (species=trout, fishery=wild, seasonMonths programmatic) that the repair design says should not drive presentation.

### elk-river-lower

- **Original correction:** catalog species 'trout', fishery 'stocked', and stockingProgram=true are NOT supported for this reach: the 2026 schedule's only Lincoln County rows are Fayetteville pond events, and no assessment documents trout here. Recommend species=null (trout question unresolved), stockingProgram=false for this reach, and a note that the catalog's 'winter stocking in lower county reaches' claim traced only to the Fayetteville pond event.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-duck-elk · ledger=unresolved/unresolved
- **Disposition:** owner-decision · affects: classification|species|notes
- **Evidence:** captures/twra-schedule.json — "rows: the only Lincoln County rows are REGION 2 / Lincoln / "Stone Bridge Park" / Winter / STOCKING DAY 2/5/2026 and "TBD 12/2026" / Rainbow Trout (a Fayetteville community pond ev" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "Elk River / Lincoln points: "Old Dam Ford" Prog=Winter rainbow (tailwater reach, ~12 mi below the dam, well upstream of Prospect), "HWY 50" and "Farris Creek" Prog=Tailwater - all " (retrieved 2026-09-22 (capture)) ; evidence-work/adj/lane-2/elk-river-lower.json — "scheduleJoinVerdict 'no-join': "'Stone Bridge Park' (Lincoln, Winter) is a Fayetteville community pond event, not the Prospect-to-state-line mainstem"; recommends species=null, sto" (retrieved prior lane-2 verification, retrieved 2026-09-22) ; packages/content/streams/tn/elk-river-lower.yaml — "species trout / fishery stocked / stockingProgram true still present; notes still say 'TWRA winter rainbow stocking in Lincoln County reaches'; opportunity unresolved/unresolved" (retrieved catalog read 2026-09-24)
- **Supports:** The correction is verified: the 2026 schedule's only Lincoln County rows are the Stone Bridge Park (Fayetteville) winter pond events; the only TWRA-mapped winter point on the Elk in Lincoln County is Old Dam Ford, which lane-2 places ~12 miles below Tims Ford Dam - part of the tailwater story, not the Prospect-to-state-line reach. The catalog's species/stockingProgram and the notes' 'winter rainbow stocking in Lincoln County reaches' line are therefore unsupported for this reach.
- **Does not support:** Absence of trout on the reach is not provable (no negative survey); warmwater-focus remains unasserted by design (tourism/Fishbrain leads only).
- **Recommended action:** Same legacy-tag class: species trout / fishery stocked / stockingProgram true are unsupported for this reach (only Lincoln County rows are Stone Bridge Park pond events; the GIS winter point is the tailwater's Old Dam Ford). Strip or hold as tagged-unverified; the note "winter stocking in Lincoln County reaches" is factually wrong for this water and should be corrected either way.
- **Open question:** Same strip-vs-hold decision; the false note sentence should be fixed regardless.
- **Confidence:** high — R1 confirmed row/point provenance from committed captures.
- **Notes:** Ledger headline (unresolved) already correct; only the legacy catalog fields and the notes sentence need the owner edit.

### harpeth-river

- **Original correction:** speciesEvidence for smallmouth-bass cites the USGS monitoring-location page 03432350, which contains no fish data (verified live 2026-09-22) - a monitoring-location page does not document a fishery; replace with a positive dated warmwater source or drop the citation.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[12,1,2] · region=tn-middle-nashville · ledger=seasonal-stocked-trout/documented
- **Disposition:** owner-decision · affects: species
- **Evidence:** evidence-work/adj/lane-3/harpeth-river.json — "webCheck verified 2026-09-22: USGS 03432350 live page is station 'HARPETH RIVER AT FRANKLIN, TN' with data categories only - NO fish species or fishery content; citation critique c" (retrieved 2026-09-22) ; packages/content/streams/tn/harpeth-river.yaml — "speciesEvidence block REMOVED entirely; notes state: 'A prior smallmouth claim lacked species-specific primary evidence and was removed from the typed species list.'; USGS 03432350" (retrieved 2026-09-24) ; https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/harpeth-river.html (live fetch 2026-09-24) — "HTTP 404 - no TWRA where-to-fish page for the Harpeth River (fetch recorded)" (retrieved 2026-09-24) ; https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2.html (live fetch 2026-09-24, saved _fetch/twra-r2-index-2026-09-24.html) — "Region 2 index contains zero 'Harpeth' mentions and links only lakes/reservoirs plus duck-river - no Harpeth river page exists to cite" (retrieved 2026-09-24)
- **Supports:** The correction is right that a monitoring-location page documents no fishery; that citation is ALREADY dropped in the current catalog, and the smallmouth tag is correctly absent from the typed species list. The trout program itself (Eastern Flank Battle Park winter rainbows: 1/23, 2/20, TBD 12/2026 + GIS point 'Eastern Flank') is capture-verified.
- **Does not support:** No positive warmwater/smallmouth source exists on TWRA to replace the citation with: the direct page URL 404s and the Region 2 where-to-fish index lists no Harpeth entry (both fetched and recorded 2026-09-24). The replacement branch of the correction is therefore not verifiable this pass; the smallmouth tag stays unsupported.
- **Recommended action:** The smallmouth targetSpecies tag remains unsupported: the USGS-station citation is already gone, and no positive fish source was found (where-to-fish URL 404s; Region 2 index has no Harpeth entry — recorded, not treated as absence). Decide: drop the smallmouth tag, or keep hunting a source (TWRA Region 2 question optional).
- **Open question:** Drop the unsupported smallmouth tag now, or route a Region 2 species question to TWRA?
- **Confidence:** medium — Negative search is thorough but a suitable TWRA page may simply not exist publicly.
- **Notes:** Keep the two USGS entries as gauge references only - they are legitimate hydrology citations, just never species citations.

### leconte-creek

- **Original correction:** Catalog note 'TWRA spring stocking listed' understates the program: the documented program is year-round (DH + weekly rainbow stocking). yearRound=true is supported; fishery=stocked is half right - the park reach is wild water.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** owner-decision · affects: season,classification
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md (node n-4U71UT) — ""Roaring Fork, Leconte Creek, Dudley Creek: These three smaller streams in Gatlinburg all originate in the Great Smoky Mountain National Park before flowing into Gatlinburg... Thes" (retrieved 2026-09-24, obs 2026 forecast edition (captured)) ; https://www.nps.gov/grsm/planyourvisit/fishing.htm — ""Fishing is permitted year-round in open waters... The park allows fishing in all streams." Wild trout park-wide, no non-native stocking since 1975, densities 2,000-4,000 fish/mile" (retrieved 2026-09-24, obs current park guidance (live fetch)) ; evidence-work/adj/lane-5/leconte-creek.json (webChecks) — "live 2026-09-22: 'Gatlinburg Streams' DH/weekly rainbow rows Jan 1-Dec 24 2026; completed 'Leconte Creek' release 09/01/2026; NPS brook-trout page names LeConte Creek restoration" (retrieved 2026-09-22, obs Aug-Sep 2026 (releases)) ; https://www.tn.gov/twra/fishing/trout-information-stockings.html — "Live recent-releases window includes "Leconte Creek 09/11/2026" - second 2026 completed release at this named water (page 'Report updated as of 9/21/2026')." (retrieved 2026-09-24, obs rolling releases window)
- **Supports:** Correction is confirmed: the documented program is year-round (Gatlinburg DH + every-Thursday stocking to the park boundary), so yearRound=true stands and the 'TWRA spring stocking listed' note understates it; fishery=stocked is half right - the park reach above the boundary is wild water under NPS policy. The 'wild+stocked (reach-split)' fishery value is an owner adoption consistent with this evidence.
- **Does not support:** No contradiction: the stocked reach is city water only (confluence to boundary); the completed 09/01/2026 and 09/11/2026 releases corroborate execution but are not park-reach stockings.
- **Recommended action:** GSMNP batch: note understates the program (DH + weekly year-round stocking to the park boundary — forecast node n-4U71UT + completed 09/01/2026 Leconte release); park reach wild, stocking below/outside the park. Adopt the reach-wording + fishery convention once for all five waters.
- **Open question:** Same GSMNP batch adoption.
- **Confidence:** high — Forecast node read verbatim; NPS policy live-verified.
- **Notes:** Kids'-stream section: Glenstone Lodge upstream through Mynatt Park to the park boundary (forecast node).

### little-pigeon-river

- **Original correction:** species=trout + stockingProgram=true for the Sevierville main stem is unverified by any agency dataset; recommend carrying warmwater-focus as documented and the stocking claim as unresolved until a row or agency statement appears.
- **Current catalog:** species=trout · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-smokies · ledger=warmwater-focus/documented
- **Disposition:** owner-decision · affects: classification|species
- **Evidence:** captures/twra-schedule.json — "grep 'pigeon': only 'Mid. Prong Little Pigeon River' (10 Seasonal weeks) and 'W. Prong Little Pigeon R. (Pigeon Forge)' (11 weeks incl. 1/4/2026), all Sevier County - ZERO rows nam" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "36 pigeon points; StreamNames present are only 'Middle Prong Little Pigeon River' (Pittman Center; one point City=Sevierville) and 'W. Prong Little Pigeon (River)' (Pigeon Forge/Ga" (retrieved 2026-09-22 (capture)) ; evidence-work/adj/lane-5/little-pigeon-river.json — "scheduleJoinVerdict 'no-join': 'No main-stem join; existing rows belong to the prongs (different catalog waters)'; claim stocking-program [conflicting]: owner-confirmed local-knowl" (retrieved prior lane-5 verification, retrieved 2026-09-22) ; packages/content/streams/tn/little-pigeon-river.yaml — "species trout + stockingProgram true still present; reachScope 'Main stem, GSMNP boundary downstream through Pigeon Forge/Sevierville to the Douglas Lake head'; caveats flag the pr" (retrieved catalog read 2026-09-24)
- **Supports:** The stocking claim for the Sevierville main stem is unverified: zero schedule rows name it and the GIS layer contains only prong points (one prong point sits in Sevierville city limits - not a main-stem row). TWRA's documented management of the main stem is the smallmouth 20-in rule (warmwater), matching the ledger's warmwater-focus verdict.
- **Does not support:** Does not prove TWRA never stocks the main stem (absence in current datasets is not absence of a program; owner reports local knowledge of stockings - unconfirmed).
- **Recommended action:** Legacy-tag class: species trout + stockingProgram true on the Sevierville main stem are unverified — zero schedule rows name it; the only GIS points are Middle/West Prong (one prong point has City=Sevierville — a join trap). Warmwater-focus verdict already governs display. Strip or hold as tagged-unverified; if the owner believes a stocking exists, that becomes a TWRA data-holder question.
- **Open question:** Strip-vs-hold; and does the owner have any basis (e.g. a TWRA statement) for the main-stem stocking claim?
- **Confidence:** high — Zero-row fact confirmed from the committed schedule + GIS; claim status is exactly "unverified, not contradicted".
- **Notes:** One GIS Middle Prong point with City=Sevierville could mislead an automated city-based join - flagged for point-join tooling.

### little-river

- **Original correction:** catalog fishery 'stocked' is wrong/incomplete: the feature is predominantly year-round wild-trout water in the park reach with a seasonal stocked lower reach - recommend fishery 'wild+stocked (reach-split)' and yearRound=true scoped to the upper/park reach. seasonMonths null is fine; stocking months are Feb-May + Oct-Nov if populated.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** owner-decision · affects: season,classification
- **Evidence:** https://www.nps.gov/grsm/planyourvisit/fishing.htm — ""Fishing is permitted year-round in open waters... The park allows fishing in all streams." Wild trout park-wide, no non-native stocking since 1975, densities 2,000-4,000 fish/mile" (retrieved 2026-09-24, obs current park guidance (live fetch)) ; https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf (p.24, French Broad basin table; coordinates parsed) — ""Little River | Mile 0.0 to 33.0" marks DOM, IWS, FAL, REC, LWW, IRR - NO TS, NO NRTS; "Little River | Mile 33.0 to Origin" marks DOM, FAL, REC, LWW, IRR, NRTS (header cols: TS x 5" (retrieved 2026-09-24, obs March 2024 (revised) rule text) ; evidence-work/adj/lane-2/little-river.json (webChecks) — "live 2026-09-22: 10 Blount 'Little River' Seasonal rainbow rows weekly 2/22-5/31/2026 plus 10/25 and 11/8/2026" (retrieved 2026-09-22, obs 2026 stocking schedule)
- **Supports:** Correction is confirmed with first-hand 2026-09-24 re-verification of both legs: the park/upper reach is year-round wild-trout water (NPS live; TDEC NRTS only from RM 33.0 to origin) and the lower out-of-park river carries only seasonal TWRA rainbow stocking (Feb-May + late Oct-Nov rows). fishery 'wild+stocked (reach-split)' with yearRound=true scoped to the upper/park reach is exactly what the evidence supports; seasonMonths null fine.
- **Does not support:** Nothing contradicts; the NRTS mark is a designation, not a census, and the mile 0-33 row's lack of trout designation is not a fish absence.
- **Recommended action:** Adopt the reach-split fishery value (wild park reach + stocked lower reach) — NEW first-hand support: TDEC 2024 WQS marks "M. Pr. Little River Mile 0.0 to Origin" NRTS and main-stem Little River NRTS only from RM 33.0 to origin, confirming the reach structure. The single fishery field needs a convention (e.g. wild+stocked with reach note) — owner choice.
- **Open question:** Adopt the reach-split fishery convention (this water + tellico-river + middle-prong)?
- **Confidence:** high — TDEC WQS coordinate-mapped by R3; NPS page live-verified.
- **Notes:** Stocking months for notes if populated: Feb-May + Oct-Nov (lane-2 rows).

### middle-prong-little-pigeon

- **Original correction:** catalog yearRound=false is wrong for the park reach: NPS documents wild trout and year-round fishing there (set yearRound true with reach scope). fishery='stocked' misdescribes the park reach, which is wild; stocking applies only below the park.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** owner-decision · affects: season,classification
- **Evidence:** https://www.nps.gov/grsm/planyourvisit/fishing.htm — ""Fishing is permitted year-round in open waters... The park allows fishing in all streams." Wild trout park-wide (brook/brown/rainbow), no non-native stocking since 1975, densities" (retrieved 2026-09-24, obs current park guidance (live fetch)) ; https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf (p.24, French Broad basin table; coordinates parsed) — ""M. Pr. Little River | Mile 0.0 to Origin" marks FAL, REC, LWW, IRR, NRTS (naturally reproducing trout stream) - verified by X-mark-to-column mapping (NRTS col x 595.6-621.8 on thi" (retrieved 2026-09-24, obs March 2024 (revised) rule text) ; evidence-work/adj/lane-4/middle-prong-little-pigeon.json (webChecks) — "live 2026-09-22: 10 Sevier 'Mid. Prong Little Pigeon River' Seasonal rainbow rows, months Feb-May and Oct-Nov 2026; Lynn Camp Prong brook restoration record" (retrieved 2026-09-22, obs 2026 stocking schedule)
- **Supports:** Correction is confirmed and strengthened: NPS documents wild trout and year-round fishing park-wide (first-hand today), so yearRound=true scoped to the park reach stands and fishery='stocked' misdescribes the park reach; the stocking rows apply below/outside the park. NEW first-hand corroboration: TDEC's 2024 use classifications mark 'M. Pr. Little River Mile 0.0 to Origin' NRTS - a naturally-reproducing trout-stream designation on the whole TN main stem of the park's Tremont drainage.
- **Does not support:** The NRTS row is a legal designation, not an abundance census; same-name caution ('M. Pr. Little River' vs the 'Mid. Prong Little Pigeon River' schedule rows are different waters) - identity rests on French Broad basin table context (row adjacent to Little River), high but noted.
- **Recommended action:** yearRound: true already applied. fishery: stocked misdescribes the park reach (wild; NPS stopped stocking in 1975 — live-verified); TWRA rows stock OUTSIDE the park. Adopt the reach-split fishery convention with the GSMNP batch.
- **Open question:** Same convention adoption.
- **Confidence:** high — NPS + forecast node verified; convention is the only open choice.
- **Notes:** The 'wild+stocked (reach-split)' fishery value is an owner adoption on top of verified reach facts.

### new-river

- **Original correction:** species=warmwater is plausible but not positively documented in this pass - the catalog should carry the warmwater claim as unverified until a real source lands.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-cumberland-plateau · ledger=unresolved/unresolved
- **Disposition:** owner-decision · affects: species
- **Evidence:** https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_siteinfo.csv — "Full-column scan of all 34 NRS23_TN sites (downloaded and parsed): no site has GNIS_NAME 'New River' - the Scott County New River was not sampled in NRSA 2023-24." (retrieved 2026-09-24, obs 2023-24 NRSA field season) ; https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf (p.50, Upper Cumberland basin table; coordinates parsed) — ""New River | Mile 0.0 to 15.0" marks FAL, REC, LWW, IRR; "New River | Mile 15.0 to Origin" marks DOM, FAL, REC, LWW, IRR - NO TS and NO NRTS on either reach (Clear Fork and the Big" (retrieved 2026-09-24, obs March 2024 (revised) rule text) ; evidence-work/adj/lane-5/new-river.json (webChecks) — "USGS 03408500 max 29.9 C July 2025; iNat bbox 0 trout observations; smallmouth reputation carried only from tourism/app leads" (retrieved 2026-09-22, obs July 2025 (gauge))
- **Supports:** The correction's handling is preserved: species=warmwater stays plausible-but-unverified and the catalog carries it unresolved/unverified. Two new dated non-positive records now exist (no NRSA site; no trout designation on either WQS reach), but neither documents the fishery positively.
- **Does not support:** No positive agency documentation of warmwater OR trout was found in the targeted checks. The WQS no-TS rows are legal designations, not fish absence; the NRSA site-list gap is not sampling absence; nothing converts to 'no trout'.
- **Recommended action:** Legacy-tag class (warmwater side): species warmwater carried with an UNRESOLVED opportunity — no NRSA site, no TS/NRTS designation on either 2024-WQS reach (non-positives, NOT trout absence). Keep as-is (unverified claim, honest display) or strip the unverified tag; batch with the unresolved-waters tag policy.
- **Open question:** Batch strip-vs-hold policy for unverified species tags on unresolved waters (new-river, reedy-creek, and the four cold-side cases above).
- **Confidence:** medium — Non-positives verified; policy is the owner's.
- **Notes:** Same-name discipline maintained: the WQS rows are the Scott County New River in the Upper Cumberland/Big South Fork basin table (the WV New River dominates web search and was not used).

### parksville-tailwater

- **Original correction:** catalog seasonMonths [3,4,5] describes stocking months; keep but label as stocking months. yearRound=false is supported by the documented program. The catalog's 'display: featured' weight is unsupported by evidence depth (limited evidenceState) - reviewer may consider.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=false · seasonMonths=[3,4,5] · region=tn-se-hiwassee · ledger=seasonal-stocked-trout/limited
- **Disposition:** owner-decision · affects: classification
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "static tailwater row: 'Ocoee Dam #1 - Parksville, Ocoee River - Rainbow - March through May - Statewide Regulations'" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 3, Polk, 'Parksville(Ocoee #1) TW / Ocoee River', Tailwater, months M,A,M, Rainbow Trout" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/parksville-tailwater.yaml — "display: featured with evidenceState 'limited'; seasonMonths [3,4,5] programmatic; notes/statement describe Mar-May stocking ('TWRA lists the Parksville Lake Tailwater in its Tailw" (retrieved 2026-09-24)
- **Supports:** seasonMonths [3,4,5] are stocking months and are already labeled as stocking in both notes and opportunity statement; yearRound=false is supported by the documented program (no persistence evidence; Parksville is a shallow warmwater pool per the caveat).
- **Does not support:** The 'display: featured' weight is an owner presentation call, not an evidence question: evidenceState is 'limited' (schedule + static row only), which sits awkwardly under a featured flag. Evidence cannot settle a presentation choice.
- **Recommended action:** display: featured is a presentation choice the evidence (evidenceState limited, no TWRA fishing-window statement) does not itself earn or forbid — keep or demote per the owner's prominence policy. Fields and separation from the lake are otherwise correct.
- **Open question:** Demote display tier for limited-evidence tailwaters, or keep featured?
- **Confidence:** high — Verified limited state; purely a prominence policy call.
- **Notes:** Never transfer between the TAILWATER and the LAKE: Parksville Lake carries the year-round reservoir-list entry ('Region II, Parksville - Rainbow'); this reach does not.

### pigeon-river

- **Original correction:** catalog species=trout is unsupported by agency evidence on the Tennessee reach; recommend carrying warmwater-focus (documented) with the cool-month trout claim as unresolved.
- **Current catalog:** species=trout · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-pigeon-frenchbroad · ledger=warmwater-focus/documented
- **Disposition:** owner-decision · affects: species,classification
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html — ""Pigeon River - From the Highway 321 bridge at Newport upstream to NC state line. Smallmouth Bass: One (1) per day, 20-inch minimum length limit. Walleye/Sauger or Walleye/Sauger H" (retrieved 2026-09-24, obs current rulebook page (live fetch)) ; https://www.tn.gov/twra/fishing/trout-information-stockings.html — "Live page ('Report updated as of 9/21/2026'): only 'W. Prong Little Pigeon R. (Pigeon Forge)' and 'Mid. Prong Little Pigeon River' appear - no main-stem Pigeon River trout stocking" (retrieved 2026-09-24, obs 2026 schedule + rolling releases) ; evidence-work/captures/twra-schedule.json — "re-checked 2026-09-24: all 20 'Pigeon'-name rows in the 616-row capture are 'Mid. Prong Little Pigeon River' or 'W. Prong Little Pigeon R.' (Sevier) - zero Tennessee main-stem Pige" (retrieved 2026-09-24, obs 2026 stocking schedule) ; evidence-work/adj/lane-5/pigeon-river.json (webChecks + claims) — "TDEC 2026 303(d): 5.03-mi upper segment temperature-impaired, source DAM OR IMPOUNDMENT (warm-release signal, prior lead); cool-month trout claim carried unresolved" (retrieved 2026-09-22, obs 2026 listing cycle)
- **Supports:** Half the correction is now fully evidenced: catalog species=trout has NO agency support on the Tennessee reach (no stocking row, no trout regulation, no wild-trout listing; re-verified live today on three TWRA surfaces), and documented management is warmwater (smallmouth/walleye rules spanning the whole catalog reach).
- **Does not support:** The other half - dropping trout to unresolved - rests on absence of records, which cannot refute the catalog's cool-month trout claim: no agency source documents occupancy OR absence in cool months, and the NC upstream trout waters are a different jurisdiction. Hence partial, with interim handling an owner decision.
- **Recommended action:** Legacy-tag class: species trout on the TN reach has zero agency support on three TWRA surfaces (re-verified live 2026-09-24); warmwater documented; the cool-month trout claim stays unresolvable publicly. Strip or hold as tagged-unverified; the warmwater-focus verdict already governs display.
- **Open question:** Strip-vs-hold for the TN-reach trout tag.
- **Confidence:** high — Three live TWRA surfaces checked; boundary is precise.
- **Notes:** Lane-6b has no pigeon-river verdict (checked 2026-09-24) - lane-5's is the governing prior record. Next source for the cool-month question remains a TWRA Region 4 biologist or NCWRC Waterville-reach data.

### powell-river

- **Original correction:** catalog species=trout / fishery=wild is unsupported by any agency source found (and contradicted at the one sampled site); recommend reclassifying to warmwater with the wild-trout claim as unresolved.
- **Current catalog:** species=trout · fishery=wild · yearRound=— · seasonMonths=null · region=tn-east-clinch · ledger=warmwater-focus/documented
- **Disposition:** owner-decision · affects: species,classification
- **Evidence:** https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_fishcount.csv — "NRS23_TN_10068, DATE_COL 6/16/2024: 14 taxa - Mimic Shiner 42, Spotfin Shiner 13, Northern Hog Sucker 11, Redbreast Sunfish 11, Smallmouth Bass 8, Rock Bass 6, Smallmouth Redhorse " (retrieved 2026-09-24, obs 2024-06-16 (single site visit)) ; https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_siteinfo.csv — "NRS23_TN_10068: GNIS 'Powell River', HUC8 'Powell', Hancock Co., lat 36.5584 lon -83.3821, watershed 1,385 km2, boatable (RV)." (retrieved 2026-09-24, obs 2023-24 NRSA field season) ; evidence-work/adj/lane-5/powell-river.json (webChecks) — "TWRA smallmouth PLR 13-17 in from Gap Creek confluence to state line (live 2026-09-22); single research-grade rainbow 2025-10-21 near the corridor, attribution unresolved (lead onl" (retrieved 2026-09-22, obs 2025-10-21 (iNat))
- **Supports:** The correction's evidence boundary is exact and now re-verified first-hand: catalog species=trout / fishery=wild is unsupported by any agency source at main-stem resolution, and the ONE dated assemblage sample on the river (EPA NRSA, upper reach, 6/16/2024) found a smallmouth/panfish community with zero salmonids. No additional Powell NRSA sites exist - the boundary is one sample, one site, one date.
- **Does not support:** One sample at one site does NOT definitively contradict trout presence watershed-wide (no 'no trout' conversion), and the single 2025 iNat rainbow is an unresolved-attribution lead, not occupancy. The catalog claim is unsupported-but-not-refuted; reclassification is an owner decision.
- **Recommended action:** Legacy-tag class: species trout / fishery wild unsupported at main-stem resolution — exactly ONE NRSA site on the Powell in TN (NRS23_TN_10068, 6/16/2024, 14 taxa, zero salmonids); one site ≠ trout absence. Strip or hold as tagged-unverified; a TWRA survey ask is the data-holder path if the owner wants certainty.
- **Open question:** Strip-vs-hold; optionally add a Region survey question to the TWRA list.
- **Confidence:** high — Full NRSA re-scan by R3 pinned the site inventory exactly.
- **Notes:** If the owner wants the trout question answered, the next source is a TWRA Region 3 main-stem assemblage record; none was found in this pass.

### reedy-creek

- **Original correction:** catalog species=warmwater is carried without positive evidence - keep as unverified; do not display any trout program for this creek.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-holston · ledger=unresolved/unresolved
- **Disposition:** owner-decision · affects: species
- **Evidence:** https://www.waterqualitydata.us/data/Station/search?siteid=TDECWPC-REEDY000.1SU&mimeType=csv — "Station TDECWPC-REEDY000.1SU 'REEDY CREEK', River/Stream, description 'INDUSTRIAL DRIVE', HUC 06010102, lat 36.5514 lon -82.5772, Sullivan County (TN:163) - the Kingsport Reedy Cre" (retrieved 2026-09-24, obs station registry (current)) ; https://www.waterqualitydata.us/data/Result/search?siteid=TDECWPC-REEDY000.1SU&mimeType=csv — "235 records, ALL water chemistry (Temperature, water 19; DO 18; pH 19; Specific conductance 19; metals; E. coli), activity dates 1999-02-17 through 2009-03-04 - ZERO biological/fis" (retrieved 2026-09-24, obs 1999-02-17 to 2009-03-04) ; https://www.waterqualitydata.us/data/Biological/search?siteid=TDECWPC-REEDY000.1SU&mimeType=csv — "Failed fetch: endpoint returned empty - AND empty for control station TDECWPC-SFORK000.1RN (known to have WQP results), so the Biological profile call is broken/param-incompatible;" (retrieved 2026-09-24) ; evidence-work/adj/lane-5/reedy-creek.json (webChecks) — "zero Reedy Creek rows in the 616-row schedule capture; 'Sportsman Club- Reedy Creek- Kid'S Event' GIS point (event, not program); Fishbrain single brown trout on a shared segment p" (retrieved 2026-09-22)
- **Supports:** The correction's handling stands: species=warmwater is carried without positive evidence; keep unverified and display no trout program. The targeted attempt (WQP station records) produced a dated, first-hand record that the only agency data at this station is 1999-2009 water chemistry with zero fish/assemblage data.
- **Does not support:** No fish data exists in either direction: chemistry-only records are not a fish survey, the broken Biological endpoint is a failed fetch (not absence), and nothing converts to 'no trout' or to documented warmwater.
- **Recommended action:** Legacy-tag class (warmwater side): WQP station holds only 1999–2009 chemistry, zero fish data (biological endpoint failed — recorded); no positive source found. Keep as tagged-unverified or strip; batch with the unresolved-waters policy.
- **Open question:** Same batch strip-vs-hold policy.
- **Confidence:** medium — Source vacuum verified; policy is the owner's.
- **Notes:** All 235 station records predate 2010 - no recent agency data at all at this station.

### roaring-fork

- **Original correction:** catalog note 'TWRA listing spring stocking for the Roaring Fork area' understates the program - the documented program is year-round (DH + weekly). yearRound=true is supported; fishery=stocked is half right - the park reach is wild water.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** owner-decision · affects: season,classification
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md (node n-4U71UT) — ""Roaring Fork, Leconte Creek, Dudley Creek: These three smaller streams in Gatlinburg all originate in the Great Smoky Mountain National Park... These three streams are all stocked" (retrieved 2026-09-24, obs 2026 forecast edition (captured)) ; https://www.nps.gov/grsm/planyourvisit/fishing.htm — ""Fishing is permitted year-round in open waters... The park allows fishing in all streams." Wild trout park-wide, no non-native stocking since 1975, densities 2,000-4,000 fish/mile" (retrieved 2026-09-24, obs current park guidance (live fetch)) ; evidence-work/adj/lane-5/roaring-fork.json (webChecks) — "live 2026-09-22: 'Gatlinburg Streams' DH/weekly rainbow rows Jan-Dec 2026; zero stream-level Roaring Fork rows; stocking-GIS layer carries a Roaring Fork point (Sevier)" (retrieved 2026-09-22, obs 2026 stocking program)
- **Supports:** Correction is confirmed: the documented program is year-round (DH + weekly to the park boundary), yearRound=true stands, and the 'spring stocking' note understates it; the park reach (Motor Nature Trail drainage) is wild water under NPS no-stocking-since-1975 policy. 'wild+stocked (reach-split)' fishery value is an owner adoption consistent with this evidence.
- **Does not support:** No contradiction; no stream-level completed release for Roaring Fork appeared in the Aug-Sep 2026 window (Leconte's did) - noted, not disqualifying, per lane-5.
- **Recommended action:** GSMNP batch: same as leconte-creek (note understates the year-round program; park reach wild).
- **Open question:** Same batch adoption.
- **Confidence:** high — Same verified facts as leconte-creek.
- **Notes:** Reach wording in catalog notes should keep 'stocked to the national park boundary' as the program scope.

### south-fork-cumberland

- **Original correction:** catalog species=trout / fishery=wild is unverified at main-stem resolution - the documented trout evidence is watershed/tributary level; recommend unresolved with the catalog claim preserved.
- **Current catalog:** species=trout · fishery=wild · yearRound=— · seasonMonths=null · region=tn-cumberland-plateau · ledger=unresolved/conflicting
- **Disposition:** owner-decision · affects: classification
- **Evidence:** https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf (p.50, Upper Cumberland basin table; coordinates parsed) — ""Big South Fork Cumberland River | Mile 55.5 (Ky-Tenn Line) to Origin (Mile 77.0)" marks DOM, IWS, FAL, REC, LWW, IRR - NO TS, NO NRTS. "Laurel Fork Creek | Upper 4.9 miles" marks " (retrieved 2026-09-24, obs March 2024 (revised) rule text) ; https://www.nps.gov/biso/planyourvisit/fishing.htm — ""Big South Fork NRRA follows the same rules and regulations set forth by the Tennessee Wildlife Resources Agency and the Kentucky Department of Fish and Wildlife Resources." Recipr" (retrieved 2026-09-24, obs current park page (live fetch)) ; evidence-work/adj/lane-5/south-fork-cumberland.json (webChecks) — "BSF watershed trout lists (Scott 2010; Comiskey & Etnier 1972) with NPS text placing browns in tributaries not the main stem (prior lead); iNat 2014 upper-valley rainbows at one am" (retrieved 2026-09-22, obs 1972-2010 surveys)
- **Supports:** The correction is confirmed and strengthened: documented trout evidence is watershed/tributary level (NPS fish lists are prior leads; NPS's own text places browns in tributaries), and the legal-designation leg is now first-hand - TDEC's 2024 WQS carries NO trout-stream designation on the TN main stem while Laurel Fork Creek (upper 4.9 miles) carries TS. The NPS NRRA fishing page names no species at all. Main-stem species=trout/fishery=wild remains unverified.
- **Does not support:** This does not prove main-stem trout absence: a designation row is not a census, the watershed fish lists were not re-verified to site-level, and no main-stem electrofishing dataset was located. No 'no trout' conversion.
- **Recommended action:** Legacy-tag class — STRENGTHENED: the 2024 WQS carries NO trout-stream designation on the Big South Fork main stem (Mile 55.5 Ky line to origin); TS sits only on Laurel Fork Creek (upper 4.9 mi); NPS NRRA page names no species. species trout / fishery wild at main-stem resolution remain unverified-not-contradicted: strip or hold; watershed/tributary trout facts stay recorded.
- **Open question:** Strip-vs-hold for the main-stem tag (tributary facts preserved either way).
- **Confidence:** high — First-hand TDEC WQS rows read by R3; supersedes the prior lead carried from lane-5.
- **Notes:** Lane-5's claim-2 nextQuestion ('Confirm the TS designation and its river-mile bounds in the 2024 WQS PDF') is now answered: no TS on the main-stem row; TS on Laurel Fork Creek upper 4.9 miles only.

### tellico-river

- **Original correction:** catalog yearRound=true is supported but reach-limited to the upper/higher-elevation water; fishery 'stocked' understates the documented wild reproduction above North River - recommend 'stocked+wild' with reach qualifier.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-se-hiwassee · ledger=year-round-trout/documented
- **Disposition:** owner-decision · affects: species,classification
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md (node n-nYvqix, Tellico Fishing Information) — ""The water is cold enough to support trout year-round at higher elevations. There is natural reproduction of wild Rainbow Trout and Brown Trout above the confluence of North River." (retrieved 2026-09-24, obs 2026 forecast edition (captured)) ; evidence-work/adj/lane-2/tellico-river.json (webChecks) — "live 2026-09-22: forecast nodes n-o3jBKs/n-IqahXN verbatim ('Stocking: October through July (excellent year-round fishing depending on elevation)'); 32 Monroe 'Tellico River' rows;" (retrieved 2026-09-22, obs 2026 season)
- **Supports:** The correction is confirmed: yearRound=true is supported but reach-limited to the upper/higher-elevation water (TWRA's own wording: 'at higher elevations'), and fishery 'stocked' understates the documented wild rainbow/brown reproduction above the North River confluence. The 'stocked+wild' enrichment with reach qualifier matches the agency text verbatim.
- **Does not support:** The wild reproduction is NOT whole-river: it applies above North River; the lower mainstem remains seasonal put-and-take whose permit season ends Aug 15. No year-round scope beyond the reach qualifier is supported.
- **Recommended action:** Adopt stocked+wild with reach qualifier (wild reproduction above North River is documented in the forecast text) — part of the reach-split fishery convention batch.
- **Open question:** Same convention adoption (little-river, tellico-river, middle-prong).
- **Confidence:** high — Forecast node captured verbatim.
- **Notes:** Schedule species column (Rainbow only) is narrower than the forecast's Rainbow/Albino Rainbow/Brown - carried documentation gap from lane-2.

## Data-holder — needs TWRA/another holder; precise question below (5)

### boone-tailwater

- **Original correction:** Catalog seasonMonths [12,3,4] matches only the static trout-page calendar (Mar/Apr/Dec); the live schedule adds Nov and the 2026 forecast swaps in Jun — surface the conflict rather than a single month set. Catalog yearRound:true is supported by the 2026 forecast ('smallest year round trout fishing tailwater'). Prior lead's 'unknown' summer-survival read is superseded by TWRA's explicit year-round label plus documented holdover rainbows.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[12,3,4] · region=tn-east-holston · ledger=year-round-trout/documented
- **Disposition:** data-holder · affects: season|notes
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Sullivan/Washington / "Boone TW / S. Fork Holston River" / Tailwater / STOCKING MONTHS "M, A, N, D" / "Rainbow, Brown Trout"" (retrieved 2026-09-22 (capture)) ; captures/twra-forecast-text.md — "node n-x4LgAU: "Stocking: March, April, June, December  (year-round fishing)"; node n-Q2FuhI: "The South Holston River below Boone Dam is Tennessee's smallest year round trout fish" (retrieved 2026-09-22 (capture)) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.html — "static row per lane-1 webCheck: "Boone Dam, South Fork Holston River - ... - March, April, December - Special Trout Regulations" (committed static capture is a flattened datatable;" (retrieved prior lane-1 verification, retrieved 2026-09-22) ; evidence-work/captures/twra-recent-releases.json — "10-row rolling window (2026-08-25..2026-09-18): no Boone TW row" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/boone-tailwater.yaml — "seasonMonths [12,3,4] seasonKind programmatic; yearRound true; caveat: 'Stocking months shown anywhere on the site are a documented three-way conflict between current TWRA sources " (retrieved catalog read 2026-09-24)
- **Supports:** The three published TWRA calendars genuinely disagree for this tailwater: schedule Mar/Apr/Nov/Dec vs static Mar/Apr/Dec vs forecast Mar/Apr/Jun/Dec, plus a completed-release window with no Boone row. The conflict is real and already surfaced in the catalog caveat (presentation fix carried). yearRound:true is directly supported by the forecast 'smallest year round trout fishing tailwater' + holdover-rainbow text; the prior 'unknown summer survival' read is superseded by TWRA's own year-round label.
- **Does not support:** Does not establish WHICH calendar is operative (schedule vs static vs forecast) - that is a TWRA question; and does not quantify holdover through unstocked months (TWRA prose asserts holdover but publishes no metric).
- **Recommended action:** None to apply: the three-way calendar conflict (schedule M,A,N,D · static Mar/Apr/Dec · forecast Mar/Apr/Jun/Dec) is already preserved as a conflicting claim + catalog caveat; yearRound: true stands on the primary assessment.
- **Open question:** TWRA Region 4: which published Boone TW stocking calendar is operative for 2026, and are the divergent surfaces (schedule datatable vs static table vs forecast) meant to differ?
- **Confidence:** high — Conflict re-verified against all three committed captures by R1.
- **Notes:** Catalog seasonMonths [12,3,4] mirrors the static-calendar side of the conflict; with the repair design (programmatic windows withdrawn from season logic), leaving the months with the conflict caveat is consistent.

### clinch-river

- **Original correction:** Catalog seasonMonths [3,4,5,6,7,8] matches the static table (Mar-Aug); schedule/forecast say Mar-Sep — recommend Mar-Sep with conflict note. yearRound:true supported. Catalog notes describing the tailwater running 'through Melton Hill Lake down to the Clinch mouth' overstate the trout reach; TWRA's documented trout water ends at Hwy 61 (Clinton).
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[3,4,5,6,7,8] · region=tn-east-clinch · ledger=year-round-trout/documented
- **Disposition:** data-holder · affects: season|notes
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Anderson / "Norris Tailwater / Clinch River" / Tailwater / STOCKING MONTHS "M, A, M, J, J, A, S" / "Rainbow, Brown Trout"" (retrieved 2026-09-22 (capture)) ; captures/twra-forecast-text.md — "node n-XN6S6h: "Stocking: March through September (year-round fishing)"; node n-uhmiDO: "...the Norris Tailwater provides approximately 14 miles of trout water from the dam down to" (retrieved 2026-09-22 (capture)) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.html — "static row per lane-1 webCheck: "Norris Dam, Clinch River - Brook, Brown, Rainbow - March through August- Special Trout Regulations"" (retrieved prior lane-1 verification, retrieved 2026-09-22) ; evidence-work/captures/twra-recent-releases.json — "row: {Region 4, Destination 'Norris TW', Stocking Date 08/25/2026}" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/clinch-river.yaml — "seasonMonths [3,4,5,6,7,8] seasonKind programmatic; notes: 'The tailwater runs from Norris Dam through Melton Hill Lake down to the Clinch mouth at Kingston / Watts Bar Lake.'; cav" (retrieved catalog read 2026-09-24)
- **Supports:** Schedule and forecast agree Mar-Sep; the static table says Mar-Aug, so the catalog's [3,4,5,6,7,8] carries the minority/static side and the one-month conflict is real (already carried as a caveat). yearRound:true supported by the forecast '(year-round fishing)'. The trout reach ends at Hwy 61/Clinton: reachScope + caveats already pin this, but the free-text notes still describe the tailwater running through Melton Hill Lake to the Clinch mouth - the overstatement residue is real.
- **Does not support:** Does not resolve which month set governs (TWRA question); does not license extending the trout claim below Hwy 61 into Melton Hill Lake.
- **Recommended action:** Apply-ready residue: notes still describe the tailwater reach running past Hwy 61 into Melton Hill — trim to the documented reach. The Mar–Aug (static) vs Mar–Sep (schedule+forecast) stocking-season conflict is carried as a caveat; which governs is the TWRA question.
- **Open question:** TWRA: operative Clinch TW stocking season (Mar–Aug vs Mar–Sep surfaces)?
- **Confidence:** high — R1 quoted both sides from captures; note overstatement read from current YAML.
- **Notes:** Completed release 08/25/2026 corroborates late-August stocking activity, consistent with the Mar-Sep side.

### ft-patrick-henry-tailwater

- **Original correction:** Catalog seasonMonths [3,4] matches the static table/forecast but not the weekly schedule (adds Dec) or the observed Sep 2026 release — present as conflict. yearRound:true is supported by the forecast '(year-round fishing)'.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[3,4] · region=tn-east-holston · ledger=year-round-trout/documented
- **Disposition:** data-holder · affects: season|notes
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Sullivan / "Ft. Patrick Henry TW / S. Fork Holston River" / Tailwater / STOCKING MONTHS "M, A, D" / "Rainbow, Brown Trout"" (retrieved 2026-09-22 (capture)) ; captures/twra-forecast-text.md — "node n-91m9Ou: "Stocking: March and April (year-round fishing)"; node n-UZZmg7 holdover-rainbow description" (retrieved 2026-09-22 (capture)) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.html — "static row per lane-1 webCheck: "Fort Patrick Henry Dam, South Fork Holston River - Brown, Rainbow - March and April - Statewide Regulations"" (retrieved prior lane-1 verification, retrieved 2026-09-22) ; evidence-work/captures/twra-recent-releases.json — "row: {Region 4, Destination 'Ft. Patrick Henry TW', Stocking Date 09/03/2026}" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/ft-patrick-henry-tailwater.yaml — "seasonMonths [3,4] seasonKind programmatic; caveat: 'Stocking months are a documented conflict between current TWRA sources (Mar/Apr vs Mar/Apr/Dec, with a September 2026 completed" (retrieved catalog read 2026-09-24)
- **Supports:** The conflict is confirmed: forecast and static table say Mar/Apr while the weekly schedule adds Dec, and a completed release on 09/03/2026 falls outside every published calendar. yearRound:true is supported by the forecast '(year-round fishing)' annotation. The catalog already carries the conflict caveat (presentation fix done).
- **Does not support:** Does not determine which calendar governs or why the Sep release occurred (TWRA question); does not quantify holdover.
- **Recommended action:** None to apply: conflict (schedule adds Dec; a completed 09/03/2026 release sits outside every calendar) is preserved as caveat; yearRound: true stands on the forecast.
- **Open question:** TWRA Region 4: operative FPH TW calendar, and is the early-September completed release part of the year-round program?
- **Confidence:** high — Calendar sides + completed-release row quoted from captures.
- **Notes:** Catalog [3,4] mirrors the static/forecast side; the completed-release observation is the strongest sign the published calendars lag reality.

### shoal-creek

- **Original correction:** catalog species=trout / fishery=stocked / stockingProgram=true is NOT supported for 2026 (zero schedule rows) - recommend unresolved or seasonal-stocked only if a completed-release record or agency statement surfaces; seasonMonths has no documented window.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-duck-elk · ledger=unresolved/conflicting
- **Disposition:** data-holder · affects: classification|species
- **Evidence:** captures/twra-schedule.json — "grep 'shoal creek': zero rows for a location/stream named 'Shoal Creek'; only 'East Fork Shoal Creek' (REGION 2 / Lawrence, weeks 2/15, 3/8, 3/22, 5/10, 5/31/2026) - a different wa" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "1 point: Site 'Davy Crockett State Park', Stream 'Shoal Creek', Reg 2, Cnty LAWRENCE, City Lawrenceburg, Prog Spring, Species rainbow, Class stream - the GIS layer still carries a " (retrieved 2026-09-22 (capture)) ; evidence-work/adj/lane-5/shoal-creek.json — "webCheck [failed] tuscaloosanews.com: '2005 stocking item behind archive/paywall; lead only, not cited as evidence'; headline: current schedule zero rows vs historical winter plant" (retrieved prior lane-5 verification, retrieved 2026-09-22) ; packages/content/streams/tn/shoal-creek.yaml — "species trout / fishery stocked / stockingProgram true still present; opportunity unresolved/conflicting; caveat 'Do not confuse with East Fork Shoal Creek'" (retrieved catalog read 2026-09-24)
- **Supports:** Zero 2026 schedule rows for the Shoal Creek main stem is confirmed, so the catalog's stockingProgram=true has no current program behind it; the only historical lead (2005 newspaper item) is paywalled and carried as a lead only, per lane-5.
- **Does not support:** Does not prove TWRA never stocked or will not stock the main stem: the GIS layer still lists a Davy Crockett State Park stocking point (program infrastructure, not a dated event), and historical reporting describes winter plants - so 'unresolved' (not 'no-trout') stays the right call.
- **Recommended action:** Keep unresolved (zero 2026 schedule rows; the GIS Davy Crockett State Park Shoal Creek point is a LEAD, not this main stem; the 2005 press account is paywalled). The blocking item is a completed-release history TWRA holds but does not publish.
- **Open question:** TWRA: completed-release history (any year) for Shoal Creek (Lawrence County main stem) — the rolling report and 2024 archive show none, which is not absence.
- **Confidence:** medium — Negative search bounded and recorded; the missing class of record is identified precisely.
- **Notes:** Residual nuance beyond lane-5's webChecks: the committed GIS capture's Shoal Creek access point is the one agency artifact keeping a program lead alive.

### watauga-river

- **Original correction:** Catalog seasonMonths [3,4,5,6,7,8,9,10] matches no single source: schedule/forecast say Mar-Sep, static table says Mar-Dec. Recommend Mar-Sep (two of three sources) with the conflict noted, or an explicit conflict marker. yearRound:true is supported (forecast 'year-round angling opportunities' + '(year-round fishing)').
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[3,4,5,6,7,8,9,10,11,12] · region=tn-northeast-watauga · ledger=year-round-trout/documented
- **Disposition:** data-holder · affects: season|notes
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Carter/Washington / "Wilbur Tailwater / Watauga River" / Tailwater / STOCKING MONTHS "M, A, M, J, J, A, S" / "Rainbow Trout"" (retrieved 2026-09-22 (capture)) ; captures/twra-forecast-text.md — "node n-J4Uw4L: "Stocking: March through September (year-round fishing)"; node n-agReBt: "The coldwater releases from the Wilbur Dam provide the perfect environment for year-round a" (retrieved 2026-09-22 (capture)) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.html — "static row per lane-1 webCheck: "Wilbur Dam, Watauga River - Rainbow - March through December - Special Trout Regulations"" (retrieved prior lane-1 verification, retrieved 2026-09-22) ; evidence-work/captures/twra-recent-releases.json — "row: {Region 4, Destination 'Wilbur TW', Stocking Date 09/03/2026}" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/watauga-river.yaml — "seasonMonths [3,4,5,6,7,8,9,10,11,12] seasonKind programmatic (the static Mar-Dec side); caveat says 'rainbow fishing is substantially put-and-take/put-grow-take on March-September" (retrieved catalog read 2026-09-24)
- **Supports:** The conflict is real and three-source: schedule row Mar-Sep, forecast node Mar-Sep ('year-round fishing'), static row Mar-Dec. The catalog's current [3..12] equals the static side; its own caveat asserts March-September stocking - so the record currently contradicts itself. yearRound:true is supported by the forecast text. The schedule row itself is unambiguously this water (lane-1 join 'correct').
- **Does not support:** Does not determine which calendar governs (TWRA question); no holdover metric beyond TWRA prose; 2025 is the last sampled year (2026 survey cancelled for low flows).
- **Recommended action:** Apply-ready residue: current seasonMonths [3..12] equals the static-table side while the water's own caveat says "March–September stocking" — align the field to the conflict presentation (or null it per the no-programmatic-windows design). The Mar–Sep vs Mar–Dec conflict itself is the TWRA question.
- **Open question:** TWRA: operative Watauga TW stocking season (schedule/forecast Mar–Sep vs static table Mar–Dec)?
- **Confidence:** high — Internal inconsistency read from the YAML by R1; both calendar sides captured.
- **Notes:** Sep 3 2026 completed release is consistent with the Mar-Sep side though no calendar lists September - same pattern as Fort Patrick Henry.

## No change — "None required" confirmed, already repaired, or superseded by the repair design (73)

### big-rock-creek

- **Original correction:** None required: species trout/stocked with winter seasonMonths (12,1,2) is consistent with the Winter-type schedule rows.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[12,1,2] · region=tn-middle-duck-elk · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** evidence-work/captures/twra-schedule.json — "Re-verified row-by-row 2026-09-24: {"REGION":"2","COUNTY":"Marshall","LOCATION":"Big Rock Greenway","TYPE":"Winter","STOCKING DAY":"1/15/2026","SPECIES":"Rainbow Trout"}; same for " (retrieved 2026-09-24, obs 2026 stocking schedule) ; evidence-work/adj/lane-5/big-rock-creek.json (webChecks) — "WQP historical summer grabs 25.3-32.0 C at USGS-03599000 (prior lead, context only)" (retrieved 2026-09-22, obs 1966-2025)
- **Supports:** Correction ('None required') is confirmed: species trout / fishery stocked with winter seasonMonths [12,1,2] is consistent with the Winter-type schedule rows (Jan 15, Feb 27, TBD Dec 2026, Marshall County).
- **Does not support:** Nothing contradicts; the December date is TBD in the schedule and no summer carryover is documented.
- **Recommended action:** none
- **Confidence:** high — Winter-type rows re-quoted from the schedule; fields consistent.
- **Notes:** Site string is 'Big Rock Greenway' (the greenway reach at Lewisburg) - lane-5's candidate-join note carries forward.

### boiling-fork-creek

- **Original correction:** None required: species trout/stocked, seasonMonths 12/1/2 consistent with Winter-type rows.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[12,1,2] · region=tn-middle-duck-elk · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** evidence-work/captures/twra-schedule.json — "Re-verified row-by-row 2026-09-24: {"REGION":"2","COUNTY":"Franklin","LOCATION":"Cowan City Park","TYPE":"Winter","STOCKING DAY":"1/20/2026","SPECIES":"Rainbow Trout"}; same for 2/" (retrieved 2026-09-24, obs 2026 stocking schedule) ; evidence-work/adj/lane-5/boiling-fork-creek.json (webChecks) — "TDEC grabs 27.7-31 C Jun-Sep 2017/2022/2023 (prior lead, context only)" (retrieved 2026-09-22, obs 2012-2023)
- **Supports:** Correction ('None required') is confirmed: species trout / fishery stocked with seasonMonths [12,1,2] is consistent with the Winter-type rows (Jan 20, Feb 19, TBD Dec 2026, Franklin County).
- **Does not support:** Nothing contradicts; the schedule site string names the park (Cowan City Park), not the creek - the park-to-creek attribution remains the geography lead lane-5 recorded.
- **Recommended action:** none
- **Confidence:** high — Winter-type rows re-quoted; consistent.
- **Notes:** Lane-5's 'correct candidate join worth adding with an explicit reach statement' note carries forward.

### boone-lake

- **Original correction:** Catalog speciesEvidence (bass/crappie/bluegill/catfish/striped bass, agency-kind) is consistent with TWRA's live page; no species additions warranted. Catalog stockingProgram:false is correct (no trout program; the page documents non-trout stocking). Do not add yearRound or trout species to this lake.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-holston · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: identity
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-boone-lake.html — "'Largemouth and Smallmouth Bass, Striped Bass, Hybrid Striped Bass, and catfish are the predominant game fish.'; 'the TWRA has stocked Blue Catfish, Striped Bass, Hybrid Striped Ba" (retrieved 2026-09-22) ; packages/content/streams/tn/boone-lake.yaml — "all five speciesEvidence entries cite https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/boone-lake.html (kind: agency, retrieved 2026-09-22); USGS 03486810 appears NO" (retrieved 2026-09-24)
- **Supports:** The repair is verified complete: speciesEvidence no longer cites USGS 03486810 - every entry points at TWRA's Boone page, which documents the warmwater fishery and NON-trout stocking (blue catfish, stripers, hybrids, black crappie). stockingProgram:false is correct. Nothing remains of the correction.
- **Does not support:** The capture documents warmwater + non-trout stocking; it does not prove trout absence (the Watauga-arm regs line shows TWRA expects tailwater-origin trout in that arm).
- **Recommended action:** none
- **Confidence:** high — Repair already re-pointed all species citations to TWRA (USGS 03486810 fully gone from current YAML — R2 verified clean); speciesEvidence consistent with the live page; stockingProgram:false correct.
- **Notes:** Boone TAILWATER is a separate catalog water with its own year-round verdict - its findings do not transfer to the lake.

### brush-creek-cocke

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: TWRA's 2026 schedule stocks this water only in March-May Seasonal weeks and has no winter rows; correct to [3,4,5] (or null) - the Dec-Feb window contradicts the schedule.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-pigeon-frenchbroad · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed by the repair; schedule rows (Mar–May Seasonal) confirm the removal was right.

### buffalo-creek-grainger

- **Original correction:** catalogFields.yearRound=true is WRONG - set yearRound=false. seasonMonths [12,1,2] is WRONG: the documented program is weekly stocking Feb-Aug plus the Oct 1-Jan 31 DH window (seasonMonths [2,3,4,5,6,7,8] + [10,11,12,1] as program months). Stocking program=true is correct.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-clinch · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Grainger / "Buffalo Creek" / Seasonal weekly STOCKING WEEK 2/8 through 8/23/2026 (30 rows) + "Buffalo Creek" / Delayed Harvest / week 10/4/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/buffalo-creek-grainger.yaml — "yearRound false with ledger note 'Correction (2026-09-22, evidence ledger): yearRound true -> false'; seasonMonths/seasonKind absent (repaired)" (retrieved catalog read 2026-09-24) ; evidence-work/adj/lane-2/buffalo-creek-grainger.json — "webCheck [verified] live exceptions page: 'Buffalo Creek DH Oct 1-Jan 31, statewide Feb 1-Sep 30, mill-dam closure confirmed live'; completed release 08/27/2026" (retrieved prior lane-2 verification, retrieved 2026-09-22)
- **Supports:** Window part is repaired: yearRound=false applied, programmatic [12,1,2] removed. The correction's program description matches the capture: weekly Seasonal stocking Feb-Aug (2/8-8/23) plus a Delayed Harvest row from Oct, and lane-2 verified the Oct 1-Jan 31 DH regulatory window live. stockingProgram=true correct (30 rows + 7 GIS Rutledge points + completed release).
- **Does not support:** Neither the weekly plan nor the DH window establishes year-round presence (September program gap; no holdover documentation - lane-2 unresolvedQuestion).
- **Recommended action:** none (no residual catalog edit identified; the DH window remains a regulatory presentation fact already reflected in the ledger)
- **Confidence:** high — Already repaired by the repair branch — Window removed; yearRound flip applied; weekly 2/8–8/23 + DH Oct 1–Jan 31 verified against schedule + lane-2 live record.

### calderwood-lake

- **Original correction:** catalogFields.yearRound=false is contradicted by TWRA's year-round reservoir list and reservoir page - set yearRound=true. Species should note Brook, Brown and Rainbow per the list (schedule row names only Rainbow).
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "'TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities.' + list line 'Region IV, Calderwood - Brook, Brown and Rainbow'" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 4, Blount/Monroe, 'Calderwood Reservoir', Reservoir, months N,D, Rainbow Trout" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/calderwood-lake.yaml — "yearRound: true already set; species: trout; fishery: stocked" (retrieved 2026-09-24) ; evidence-work/adj/lane-2/calderwood-lake.json — "webCheck verified 2026-09-22: reservoir page 'do well all year in the cold, oxygenated water', 541 ac, NC-only boat access" (retrieved 2026-09-22)
- **Supports:** The year-round reservoir list names Calderwood with Brook, Brown and Rainbow - both the yearRound=true fix and the Brook/Brown/Rainbow species detail are capture-supported. yearRound is already true in the current catalog (repair applied). The schedule row's narrower 'Rainbow only' is stocking-event detail, not the program's species list.
- **Does not support:** The list documents the stocking program; it is not an observation that all three species persist in catchable numbers year-round - present species detail as program-level.
- **Recommended action:** optional enrichment: note Brook, Brown and Rainbow per the year-round list alongside the Rainbow-only schedule row; otherwise none
- **Confidence:** high — yearRound flip already applied (year-round reservoir list); the species note (Brook, Brown and Rainbow per the list vs Rainbow-only schedule row) is optional enrichment with the conflict preserved in the ledger.
- **Notes:** Same-name risk with Cheoah Reservoir upstream and Chilhowee downstream; do not conflate.

### center-hill-lake

- **Original correction:** catalog species 'warmwater' and stockingProgram=false are correct. Recommend the notes explicitly carry the unresolved lake-trout question so the tailwater's cold-water facts are never quoted against this water.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-caney-fork · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: notes
- **Evidence:** evidence-work/adj/lane-2/center-hill-lake.json — "webCheck verified 2026-09-22: TWRA Center Hill Reservoir page - warmwater fishery list (bass, crappie, bluegill, walleye, catfish, muskellunge), USACE authority, 18,220 ac; 'trout " (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/center-hill-lake.yaml — "species: warmwater; stockingProgram: false; unresolved lake-trout question already carried in statement ('whether any trout fishery exists in the reservoir itself is unresolved - t" (retrieved 2026-09-24)
- **Supports:** species 'warmwater' and stockingProgram=false are correct; the notes/opportunity already carry the unresolved lake-trout question and the reach-discipline wall, so the tailwater's cold-water facts are never quoted against the reservoir - the correction's recommendation is already satisfied.
- **Does not support:** Residue outside this correction: speciesEvidence entries still cite the trout stocking page (retrieved 2026-09-13) - the TWRA Center Hill Reservoir page is the proper citation and is already in officialSources.
- **Recommended action:** none required; optional cleanup: re-point the six speciesEvidence URLs to the TWRA Center Hill Reservoir page
- **Confidence:** high — Lake-vs-tailwater boundary already carried in the opportunity block; BONUS residue outside this item: speciesEvidence also cites the trout stocking page (same pattern as lake-graham) — listed in follow-ups.
- **Notes:** Caney Fork tailwater is caney-fork-river; upper Caney Fork is caney-fork-upper - three separate catalog waters.

### cherokee-lake

- **Original correction:** Catalog species 'warmwater' and stockingProgram:false are CORRECT and now live-verified. No changes.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-holston · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-cherokee-lake.html — "'Largemouth Bass, Smallmouth Bass, Striped Bass, Cherokee bass, Crappie, Walleye, and Saugeye as the primary gamefish species. People also target Paddlefish, White Bass, Bluegill, " (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "year-round reservoir list names 8 reservoirs - Cherokee absent; only 'Cherokee TW / Holston River' tailwater rows in the schedule" (retrieved 2026-09-22) ; packages/content/streams/tn/cherokee-lake.yaml — "species: warmwater; stockingProgram: false; speciesEvidence cites the TWRA cherokee-reservoir.html page (retrieved 2026-09-22)" (retrieved 2026-09-24)
- **Supports:** species 'warmwater' and stockingProgram:false are CORRECT and live-verified (capture + lane-1 checks). No changes required - the correction's 'None required' lands.
- **Does not support:** Striped bass is a regulatory/hybrid-evidence tag, not proof of a self-sustaining fishery (page itself calls striper put-grow-take marginal here).
- **Recommended action:** none
- **Confidence:** high — Captured TWRA page confirms species/stockingProgram; nothing to change.
- **Notes:** Cherokee LAKE (this entry) vs Cherokee TW / Holston River (holston-river) are separate catalog waters.

### chilhowee-lake

- **Original correction:** catalogFields.yearRound=false is contradicted by TWRA's year-round reservoir list and the live reservoir page - set yearRound=true. Stocking months Feb/Nov/Dec are schedule events, not the fishing window.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-smokies · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "list line 'Region IV, Chilhowee - Rainbow' under 'TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities.'" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 4, Blount/Monroe, 'Chilhowee Reservoir', Reservoir, months F,N,D, Rainbow Trout (stocking events, not the fishing window)" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/chilhowee-lake.yaml — "yearRound: true already set; species: trout; fishery: stocked" (retrieved 2026-09-24) ; evidence-work/adj/lane-2/chilhowee-lake.json — "webCheck verified 2026-09-22: reservoir page 'Thrive in the cool, clear water', species list incl. trout, lake-trout-past note" (retrieved 2026-09-22)
- **Supports:** TWRA's year-round reservoir list names Chilhowee (Rainbow) - yearRound=true is capture-supported and already applied. The Feb/Nov/Dec schedule months are stocking events within the standing program, not the fishing window.
- **Does not support:** The list documents the program; species list for the reservoir is Rainbow only (no brook/brown claim available).
- **Recommended action:** none (optional: carry species detail 'Rainbow' per the list)
- **Confidence:** high — yearRound flip applied; the Feb/Nov/Dec rows are stocking events and stay unlabeled windows by design.

### clear-creek-obed

- **Original correction:** None: catalog species=warmwater is confirmed; headline upgraded from unresolved to warmwater-focus on the verified NPS page.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-cumberland-plateau · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: classification
- **Evidence:** https://www.nps.gov/obed/learn/nature/fish.htm — ""The most common game fish caught at the Obed WSR is the Smallmouth Bass." ... "Most of the people who go fishing on Clear Creek, Daddy's Creek, and the Obed River will successfull" (retrieved 2026-09-24, obs current page (live fetch)) ; https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm — ""The Obed River System typically has several species of fish which can grow over one foot in length. They are the Smallmouth Bass, Long-nose Garr, Catfish, and the Muskellunge (als" (retrieved 2026-09-24, obs current page (live fetch)) ; evidence-work/adj/lane-5/clear-creek-obed.json (webChecks) — "live 2026-09-22: NPS fish page smallmouth named for Clear Creek, zero salmonids; USGS 03539778 max 29.0 C Jul-Aug 2026" (retrieved 2026-09-22, obs Jul 1 - Aug 31, 2026 (gauge))
- **Supports:** Correction ('None required') is confirmed: NPS documents a warmwater smallmouth fishery and names Clear Creek explicitly (learn/nature/fish.htm); the Obed fishing page names smallmouth for the Obed River System with zero trout mentions. Catalog species=warmwater and the warmwater-focus/documented headline stand.
- **Does not support:** Nothing contradicts. The planyourvisit fishing page names the Obed River System generally (not Clear Creek by name) and its footer dates to 2015 - the creek-naming quote lives on the nature/fish.htm page (undated on-page, live-checked twice).
- **Recommended action:** none
- **Confidence:** high — NPS Obed pages live-verified by R3 (smallmouth named for this creek); species=warmwater stands.
- **Notes:** Keep the lane-5 qualification: the 'Clear Creek' on TWRA trout pages (Anderson Co., Clinch tributary) is a different water; absence of trout mentions on NPS pages is not biological absence.

### daddys-creek

- **Original correction:** None: catalog species=warmwater confirmed; headline upgraded from unresolved to warmwater-focus on the verified NPS page.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-cumberland-plateau · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: classification
- **Evidence:** https://www.nps.gov/obed/learn/nature/fish.htm — ""The most common game fish caught at the Obed WSR is the Smallmouth Bass." ... "Most of the people who go fishing on Clear Creek, Daddy's Creek, and the Obed River will successfull" (retrieved 2026-09-24, obs current page (live fetch)) ; https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm — ""The Obed River System typically has several species of fish which can grow over one foot in length. They are the Smallmouth Bass, Long-nose Garr, Catfish, and the Muskellunge" - z" (retrieved 2026-09-24, obs current page (live fetch)) ; evidence-work/adj/lane-5/daddys-creek.json (webChecks) — "live 2026-09-22: NPS fish page names Daddy's Creek for smallmouth; USGS 03539600 max 30.0 C Jul-Aug 2026" (retrieved 2026-09-22, obs Jul 1 - Aug 31, 2026 (gauge))
- **Supports:** Correction ('None required') is confirmed: NPS names Daddy's Creek directly in the smallmouth statement; catalog species=warmwater and the warmwater-focus/documented headline stand.
- **Does not support:** Nothing contradicts. No trout program or trout record exists for this creek, and that absence is not converted into a biological claim.
- **Recommended action:** none
- **Confidence:** high — Same NPS verification; stands.
- **Notes:** Lane-5 open lead retained: the catalog note about TWRA muskellunge stocking on Daddy's Creek remains an unverified lead (irrelevant to the warmwater headline).

### doe-creek-johnson

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the 2026 schedule stocks this creek only in March-May Seasonal weeks with no winter rows; correct to [3,4,5] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-northeast-watauga · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar–May Seasonal rows confirm.

### duck-river-tailwater

- **Original correction:** catalogFields.yearRound=true is WRONG: TWRA's current assessment says the river is suitable ~8 months with a Nov-Jun seasonal stocking program ('Seasonal Trout Fishing') - set yearRound=false. seasonMonths [11,12,1,2,3,4,5,6] matches the forecast summary; note the schedule-workbook months (J,F,M,N,D) conflict.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=false · seasonMonths=[11,12,1,2,3,4,5,6] · region=tn-middle-duck-elk · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md — "node n-I7NFwN: 'the river is only suitable for trout 8 months out of the year. During the stocking season, you can find good catches of 10"-14" Rainbow Trout in the first 9 miles o" (retrieved 2026-09-22, obs 2026 forecast edition) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 2, Coffee/Bedford, 'Normandy TW / Duck River', Tailwater, months J,F,M,N,D, Rainbow Trout (schedule-workbook months conflict with the forecast Nov-Jun window - conflict" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/duck-river-tailwater.yaml — "yearRound: false already set (correction applied); seasonMonths [11,12,1,2,3,4,5,6] programmatic; correction paragraph in notes; caveats separate the ~8-month suitability window fr" (retrieved 2026-09-24)
- **Supports:** The correction's landing is already applied: yearRound=false (a year-round flag contradicts TWRA's 'only suitable for trout 8 months' assessment and the 'Seasonal Trout Fishing' label), and seasonMonths [11..6] matches the forecast summary while the schedule-workbook months (J,F,M,N,D) conflict is carried as a documented discrepancy.
- **Does not support:** Residue: the notes opening sentence still reads 'TWRA stocks this tailwater with rainbow trout year-round (owner confirmation, September 2026)' immediately before the correction paragraph that reverses it - a stale contradiction inside one notes block.
- **Recommended action:** optional cleanup: delete or rewrite the stale 'stocks ... year-round' opening sentence in notes so the block is self-consistent (fields themselves are already correct)
- **Confidence:** high — yearRound flip applied and verified; BONUS residue: a stale "year-round" sentence survives in notes before the correction paragraph — listed in follow-ups.
- **Notes:** Window vs schedule discipline already in caveats: ~8 suitable months is a suitability window; Nov-Jun is the stocking season - never merge into year-round.

### east-fork-shoal-creek

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the 2026 schedule stocks this water only in Feb-May Seasonal weeks with no winter rows; correct to [2,3,5] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-duck-elk · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 2 / Lawrence / "East Fork Shoal Creek" / Seasonal / STOCKING WEEK 2/15, 3/8, 3/22, 5/10 and 5/31/2026 / Rainbow Trout (no winter rows)" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/east-fork-shoal-creek.yaml — "seasonMonths/seasonKind absent (repaired)" (retrieved catalog read 2026-09-24) ; evidence-work/captures/twra-stock-locations.json — "2 points 'East Fork Shoal Creek' (Park; Water Plant), Reg 2, LAWRENCE, City Lawrenceburg, Prog Spring, rainbow" (retrieved 2026-09-22 (capture))
- **Supports:** 2026 rows are Feb-May Seasonal only (2/15, 3/8, 3/22, 5/10, 5/31 = months Feb, Mar, May) with no winter rows - matching the correction's [2,3,5]; the [12,1,2] window was removed by the repair.
- **Does not support:** Does not establish presence between events; April has no 2026 event (the correction's [2,3,5] correctly omits it).
- **Recommended action:** none
- **Confidence:** high — Already repaired by the repair branch — Window removed; Feb–May rows (no winter) confirm.
- **Notes:** Distinct from shoal-creek (main stem) - keep the wrong-water guard.

### fletchers-fork

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the documented 2026 program runs Feb-Aug (schedule weeks 2/15-8/23; iSportsman events Feb 12, Apr 7, Jun 25, Jul 22, Aug 26); correct to [2,4,5,6,7,8] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-nashville · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season|notes
- **Evidence:** captures/twra-schedule.json — "ZERO rows naming Fletchers Fork in the 616-row schedule; the correction's 'weeks 2/15-8/23' match REGION 2 / Montgomery / 'Fort Campbell Streams' Seasonal rows (2/15, 4/19, 5/17, 6" (retrieved 2026-09-22 (capture)) ; evidence-work/captures/twra-stock-locations.json — "1 point 'Fletchers Fork', Reg 2, Cnty MONTGOMERY, Prog Spring, rainbow, stream" (retrieved 2026-09-22 (capture)) ; evidence-work/adj/lane-3/fletchers-fork.json — "scheduleJoinVerdict 'correct' via alias: webCheck [verified] ftcampbell.isportsman.net 2026 events (Feb 12, Apr 7 'incl. Fletchers Fork 750 brown + 240 rainbow', Jun 25, Jul 22, Au" (retrieved prior lane-3 verification, retrieved 2026-09-22) ; packages/content/streams/tn/fletchers-fork.yaml — "seasonMonths/seasonKind absent (repaired); regionId tn-middle-nashville" (retrieved catalog read 2026-09-24)
- **Supports:** Window part repaired (programmatic [12,1,2] removed). The Feb-Aug program is documented, but note its evidence shape: the 616-row schedule contains NO Fletchers Fork row - the Feb-Aug weeks come from the 'Fort Campbell Streams' alias rows, joined by lane-3 via the regulations entry + Fort Campbell's own iSportsman event naming Fletchers Fork (Apr 7, brown+rainbow). The GIS point (Montgomery Co.) corroborates identity.
- **Does not support:** No direct TWRA schedule row names this water; access requires a Fort Campbell post permit; species beyond rainbow/brown unverified.
- **Recommended action:** none for seasonMonths (superseded); owner may optionally record the alias 'Fort Campbell Streams (post program)' + the iSportsman Apr 7 brown/rainbow event in notes so future joins neither double-count nor miss the water.
- **Confidence:** high — Already repaired by the repair branch — Window removed. Nuance recorded: the schedule has NO Fletchers Fork row — the Feb–Aug program arrives via "Fort Campbell Streams" alias rows (regs entry + iSportsman event, lane-3 dated record); GIS point is Montgomery Co. The alias join is documented, not silent.
- **Notes:** GIS county (Montgomery) matches the schedule rows' county; catalog regionId tn-middle-nashville is consistent with Montgomery Co.

### forge-creek-johnson

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the 2026 schedule stocks this creek only in March-May Seasonal weeks with no winter rows; correct to [3,4,5] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-northeast-watauga · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar–May rows confirm.

### fort-patrick-henry-lake

- **Original correction:** Catalog yearRound:false is WRONG per TWRA's live year-round reservoir list — set yearRound:true (program-level) with the thin-evidence caveat. Catalog fishery 'stocked' is right; species 'trout' should specify brown and rainbow. seasonMonths null stays (none published).
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-holston · ledger=year-round-trout/limited
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "list line 'Region IV, Fort Patrick Henry - Brown and Rainbow' under the year-round reservoir stocking header" (retrieved 2026-09-22) ; evidence-work/adj/lane-1/fort-patrick-henry-lake.json — "webChecks verified 2026-09-22: reservoir page has NO fishery narrative and no summer depth guidance (its trout line is the Boone Dam-Louis Milhorn Bridge PLR rule for the upstream " (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-fort-patrick-henry-lake.html — "regs line: 'Trout (all species): Seven (7) per day; 16-22 inch PLR for Rainbow and Brown Trout... from Boone Dam downstream to Louis Milhorn Bridge on Beulah Church Drive' (tailwat" (retrieved 2026-09-22) ; packages/content/streams/tn/fort-patrick-henry-lake.yaml — "yearRound: true already set; species: trout; fishery: stocked; seasonMonths null" (retrieved 2026-09-24)
- **Supports:** yearRound=true is supported by the year-round reservoir list ('Brown and Rainbow') - already applied - and stays program-level with the thin-evidence caveat (the reservoir's own page carries no fishery description). Species detail brown and rainbow comes from the list.
- **Does not support:** The ONLY reservoir-level evidence is the list line; the schedule row (M,A,D) and the PLR rule describe the TAILWATER, not the lake. Do not let tailwater facts populate the lake.
- **Recommended action:** optional enrichment: species detail brown+rainbow per the list, carrying the thin-evidence caveat; otherwise none
- **Confidence:** high — yearRound flip already applied (year-round reservoir list, program-level, thin-evidence caveat carried); species-specify (brown and rainbow) is optional enrichment from the captured list. Repair withdrew unsupported warmwater target species — correct.
- **Notes:** Separate catalog water: ft-patrick-henry-tailwater.

### french-broad-river

- **Original correction:** None: catalog species=warmwater confirmed; headline upgraded from unresolved to warmwater-focus.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-pigeon-frenchbroad · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: classification
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html — ""French Broad River Hwy. 168 to Douglas Dam. - Smallmouth bass: Five (5) fish limit, 18-inch minimum length limit." (re-extracted verbatim from the live page)" (retrieved 2026-09-24, obs current rulebook page (live fetch)) ; evidence-work/adj/lane-5/french-broad-river.json (webChecks) — "live 2026-09-22: TWRA Douglas Reservoir page - 'Largemouth bass, crappie, bluegill, and catfish are the most popular game fish', zero trout mention; NRSA site NRS23_TN_10021 (Frenc" (retrieved 2026-09-22, obs 2024-06-13 (NRSA sample))
- **Supports:** Correction ('None required') is confirmed per the lane-5 dated verdict: TWRA sets a quality smallmouth rule on exactly the catalog reach (Hwy 168 to Douglas Dam, re-verified live 2026-09-24) and documents an entirely warmwater Douglas fishery; catalog species=warmwater and warmwater-focus/documented stand.
- **Does not support:** No trout program or trout record exists for the TN tailwater reach; the NC-line NRSA sample is a different (upstream) reach and does not transfer; no 'no trout' conversion is made for the tailwater.
- **Recommended action:** none
- **Confidence:** high — Smallmouth rule re-extracted verbatim from the live exceptions page (R3); species=warmwater stands.
- **Notes:** Unresolved tailwater question unchanged: whether trout ever occur below Douglas Dam is unknown, not proven absent.

### goforth-creek

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the 2026 schedule stocks this creek only in March-April Seasonal weeks with no winter rows; correct to [3,4] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-se-hiwassee · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar–Apr rows confirm.

### greasy-creek-polk

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the 2026 schedule stocks this creek only in March-April Seasonal weeks with no winter rows; correct to [3,4] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-se-hiwassee · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar–Apr rows confirm.

### hiwassee-river

- **Original correction:** catalog yearRound=true is supported but ONLY with TWRA's 'limited year-round fishing' qualifier carried prominently; seasonMonths [10,11,12,1,2,3,4,5,6,7] approximates the stocking footprint (schedule rows Feb-Aug + Feb/Oct/Nov vs forecast Jan-Jul + Oct-Dec).
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[10,11,12,1,2,3,4,5,6,7] · region=tn-se-hiwassee · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md — "stocking node (n-yvZdyL): 'Stocking: January-July and October- December (limited year-round fishing)'; description node (n-xvoeOU): 'The Hiwassee River provides 17 miles of trout w" (retrieved 2026-09-22, obs 2026 forecast edition) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "rows: Region 3, Polk, 'Apalachia TW / Hiwassee River*': Tailwater M,A,M,J,J,A Rainbow+Brown; Delayed Harvest F,O,N Rainbow (footprint Feb-Aug + Feb/Oct/Nov)" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/hiwassee-river.yaml — "yearRound: true; seasonMonths [10,11,12,1,2,3,4,5,6,7]; opportunity caveats carry 'SUMMER LIMITATION (prominent, per TWRA's own label): limited year-round fishing'" (retrieved 2026-09-24)
- **Supports:** yearRound=true is supported ONLY with TWRA's 'limited year-round fishing' qualifier - which the current YAML carries prominently (statement + first caveat). seasonMonths [10..7] approximates the stocking footprint: forecast Jan-Jul + Oct-Dec vs schedule Feb-Aug + Feb/Oct/Nov; the field is labeled programmatic.
- **Does not support:** The month list is a stocking footprint, not a promise of summer catching - the summer thermal limitation is documented agency-side and must stay prominent (it does).
- **Recommended action:** none
- **Confidence:** high — "Limited year-round" qualifier is carried in the current opportunity caveats (R2 verified the forecast wording); stocking-footprint months stay unlabeled windows by design.
- **Notes:** Reach discipline: trout water begins at Apalachia POWERHOUSE (8 dam-to-powerhouse miles bypassed); best 5 miles Powerhouse-Reliance.

### holston-river

- **Original correction:** Catalog seasonMonths [11,12,1,2,3,4] matches the documented Nov-Apr stocking window — correct as stocking months. Catalog yearRound:false is defensible for the stocking program but TWRA labels the fishery 'limited year-round fishing'; recommend yearRound=true with the summer-thermal qualification, or an explicit 'limited year-round' marker. Catalog fishery 'stocked' should note the reach scope (Cherokee Dam tailwater only).
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=[11,12,1,2,3,4] · region=tn-east-pigeon-frenchbroad · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md — "node n-e8bCkZ: 'Stocking: November through April (limited year-round fishing)'; node n-CTnirE: 'the Holston River below Cherokee Dam provides trout fishing opportunities for approx" (retrieved 2026-09-22, obs 2026 forecast edition) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 4, Jefferson/Grainger, 'Cherokee TW / Holston River', Tailwater, months J,F,M,A,N,D, 'Rainbow, Brown Trout'" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/holston-river.yaml — "yearRound: true with 'limited year-round fishing' carried in statement + 'SUMMER LIMITATION (mandatory)' caveat; reachScope pins Cherokee Dam tailwater ~20 mi (Jefferson/Grainger);" (retrieved 2026-09-24)
- **Supports:** seasonMonths [11,12,1,2,3,4] matches the documented Nov-Apr stocking window and is correctly framed as stocking months; yearRound=true is applied WITH the 'limited year-round fishing' qualifier TWRA itself uses; fishery 'stocked' is scoped to the Cherokee Dam tailwater reach in reachScope and notes, as the correction asks.
- **Does not support:** The year-round flag is TWRA's own 'limited' label - late-summer too-warm water is documented; the flag must never travel beyond the ~20-mile reach (notes say exactly this).
- **Recommended action:** none
- **Confidence:** high — yearRound flip applied; "limited year-round" qualifier carried; Nov–Apr stocking months consistent.
- **Notes:** Correction note (2026-09-22 ledger) already in YAML; ADR 0010 consistency cited there.

### indian-creek-claiborne

- **Original correction:** seasonMonths [12,1,2] (programmatic) is wrong: the 2026 schedule stocks this creek only in Feb-Apr Seasonal weeks with no winter rows; correct to [2,3,4] (or null).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-clinch · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Feb–Apr rows confirm.

### little-buffalo-river

- **Original correction:** seasonMonths [12,1,2] (programmatic winter) is wrong: the 2026 schedule and the GIS 'Spring' program label put the events in March-May; set stocking months to Mar/May. Catalog note ('spring-stocked') is correct.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-duck-elk · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar–May rows + GIS Spring label confirm; "spring-stocked" note correct.

### little-sequatchie-river

- **Original correction:** seasonMonths [12,1,2] is wrong: 2026 rows fall in March and May; set stocking months to Mar/May.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-se-hiwassee · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Marion / "Little Sequatchie River" / Seasonal / STOCKING WEEK 3/15, 3/22 and 5/10/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/little-sequatchie-river.yaml — "seasonMonths/seasonKind absent (repaired)" (retrieved catalog read 2026-09-24)
- **Supports:** 2026 rows fall in March and May exactly as the correction says (3/15, 3/22, 5/10); the [12,1,2] window was removed by the repair.
- **Does not support:** No persistence documentation between the March and May events.
- **Recommended action:** none
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar + May rows confirm.

### little-tennessee-river

- **Original correction:** Catalog species=trout/stocked with seasonMonths 2/3/4 is directionally right (late winter/early spring documented); keep the seasonal claim tied to the Chilhowee-tailwater arm, not the whole main stem.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[2,3,4] · region=tn-east-smokies · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** evidence-work/adj/lane-5/little-tennessee-river.json — "webCheck verified 2026-09-22: TWRA Tellico Reservoir page - 'The upper reaches of Tellico Reservoir in the Little Tennessee Arm below Chilhowee Dam can support trout'; 'About 4,500" (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/little-tennessee-river.yaml — "species: trout; fishery: stocked; yearRound: false; seasonMonths [2,3,4] programmatic; reachScope/statement/caveat all pin the claim to 'Little Tennessee Arm of Tellico Reservoir b" (retrieved 2026-09-24)
- **Supports:** Current fields already match the correction's landing: species=trout/stocked with seasonMonths 2/3/4 (late winter/early spring documented), and the seasonal claim is tied to the Chilhowee-tailwater arm, not the whole main stem (reachScope + caveats say so explicitly).
- **Does not support:** The 2/3/4 window is the documented stocking pattern narrative ('late winter and early spring'), not a published month table - programmatic labeling is the right framing.
- **Recommended action:** none
- **Confidence:** high — Fields already tie the claim to the Chilhowee-tailwater arm (late-winter/early-spring); consistent.
- **Notes:** Distinct from tellico-river (a different tributary) and from the Calderwood/Chilhowee pools carried by lake entries.

### little-west-fork-creek

- **Original correction:** seasonMonths [12,1,2] is WRONG vs documented Feb-Aug 2026 stocking months (TWRA schedule + post program page); correct to the Feb-Aug program window. species trout/stocked stands (rainbow, plus brown in the April event).
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-nashville · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Feb–Aug program (schedule + post page) confirms; species stands.

### loosahatchie-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie as a managed species. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/loosahatchie-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; Region 1 where-to-fish index is lake-only - no TWRA river fishery page exists to cite" (retrieved 2026-09-22) ; packages/content/streams/tn/loosahatchie-river.yaml — "species key absent (UNSET); targetSpecies absent" (retrieved 2026-09-24)
- **Supports:** The West Tennessee crappie rule names the Loosahatchie (30/day, no length limit, tributaries included), supporting crappie as a managed species. 'No trout field supported' = the regulation documents a managed warmwater fishery, not trout absence.
- **Does not support:** A creel rule is management evidence, not a species census; it alone does not document bass/catfish assemblage detail.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie (rule-backed); no trout field
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule live-verified verbatim (exceptions page, one fetch covers the river set); species stays legitimately unset — optional enrichment whenever the owner authors managed-species lists.
- **Notes:** One regs-page verification covers all 8 crappie-rule rivers in this lane.

### middle-fork-forked-deer-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/middle-fork-forked-deer-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; Middle Fork Bottoms state-park page verified via reader render (403 on direct fetch, recorded)" (retrieved 2026-09-22) ; packages/content/streams/tn/middle-fork-forked-deer-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Forked Deer rivers (30/day, no length limit), supporting crappie as a managed species on the Middle Fork. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence, not a full species census.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### middle-fork-obion-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/middle-fork-obion-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; schedule capture grep: only Obion match is the Union City Reelfoot Packing Site pond row (diffe" (retrieved 2026-09-22) ; packages/content/streams/tn/middle-fork-obion-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Obion River 'includes tributaries', covering the Middle Fork; supports crappie as managed. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence, not a full species census; no trout program rows exist for any Obion fork.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### mississippi-river

- **Original correction:** species is UNSET; the TWRA regulation block supports a warmwater/striped bass species set. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Mississippi River block: 'Includes adjacent sloughs, bayous, and all river runs and chutes that are accessible by boat from the river proper' - Black Bass: 10 per day, no length li" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/mississippi-river.json — "webCheck verified 2026-09-22: Mississippi River regulation block quoted verbatim; trout-lead web follow-up found no source placing trout in the Tennessee reach" (retrieved 2026-09-22)
- **Supports:** TWRA carries a dedicated warmwater regulation block for the Mississippi River (black bass, sunfish, catfish, striped/hybrid, sauger, white bass), documenting a managed warmwater fishery on the Tennessee reach. 'No trout field supported' = warmwater regulation documented, not trout absence.
- **Does not support:** A regulation block documents management, not a biological species census; no trout program exists per TWRA documents checked.
- **Recommended action:** none (optional enrichment: populate warmwater/striped-bass species set from the regulation block)
- **Confidence:** high — Optional enrichment, fields legitimately unset — Mississippi warmwater regs block verified; species legitimately unset.
- **Notes:** Shelby County reach.

### nickajack-lake

- **Original correction:** catalog speciesEvidence cites the USGS monitoring-location page 03570525 as 'agency' evidence for fish species; the actual agency source is TWRA's Nickajack Reservoir page (species list verified there 2026-09-22). species field itself is UNSET and could be populated with the TWRA warmwater list.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-se-hiwassee · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: identity
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-nickajack-lake.html — "'What you can catch' sections: Largemouth Bass ('high catch rates ... when compared to other Tennessee reservoirs') and further bass/crappie/sunfish/catfish/striped-bass sections; " (retrieved 2026-09-22) ; evidence-work/adj/lane-6b/nickajack-lake.json — "webCheck verified 2026-09-22: TWRA Nickajack Reservoir page - warmwater species list, 10,370 ac / 192 mi shoreline, no trout mention" (retrieved 2026-09-22) ; packages/content/streams/tn/nickajack-lake.yaml — "speciesEvidence now cites https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/nickajack-reservoir.html (kind: agency, retrieved 2026-09-22) for all six target speci" (retrieved 2026-09-24)
- **Supports:** The TWRA Nickajack Reservoir page is confirmed as the real agency species source (capture read directly). The correction's citation complaint is already remediated in the current catalog: speciesEvidence points at the TWRA page; USGS 03570525 survives only as the tailwater gauge reference, which is a legitimate gauge use.
- **Does not support:** The capture documents the warmwater fishery; it does not document trout absence. species field remains UNSET - the TWRA list supports optional enrichment, nothing more.
- **Recommended action:** none required (citation already re-pointed); optional owner enrichment: populate species from the TWRA warmwater list
- **Confidence:** high — Repair already re-pointed speciesEvidence to the TWRA Nickajack page (USGS 03570525 correctly remains as a gauge only) — R2 verified the current YAML clean.
- **Notes:** Gauge-based temperature context (USGS 03570525) remains valid evidence for tailwater thermal character - do not delete the gauge reference, only species citations.

### normandy-lake

- **Original correction:** catalog species=null with warmwater speciesEvidence tags is consistent with TWRA's page. Recommend fishery field 'warmwater' if populated. stockingProgram=false is correct.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-duck-elk · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-2/normandy-lake.json — "webCheck verified 2026-09-22: TWRA Normandy Reservoir page - warmwater fishery, TVA authority, 3,048 ac, crappie/walleye hatchery programs; 'no trout in fishery description'" (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/normandy-lake.yaml — "species key absent (UNSET); warmwater targetSpecies list present; stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Normandy Reservoir page documents a warmwater black-bass/crappie/walleye/catfish fishery; the region's trout program is the Duck River below the dam (separate catalog water duck-river-tailwater). fishery field 'warmwater' is supported if the owner populates it.
- **Does not support:** No trout content for the reservoir itself; no support for trout fields on the lake.
- **Recommended action:** none (optional: populate fishery='warmwater' and warmwater species)
- **Confidence:** high — Optional enrichment, fields legitimately unset — Page consistent with null species + warmwater evidence tags; optional fishery populate noted, not required.
- **Notes:** Reservoir wording: keep all trout facts pinned to the tailwater below Normandy Dam.

### norris-lake

- **Original correction:** Catalog species 'warmwater' and stockingProgram:false are CORRECT and now live-verified. No changes.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-clinch · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-norris-lake.html — "hatchery-supported warmwater stocking: ~103,000 crappie per year, ~240,000 walleye per year (Lake Erie strain); warmwater species sections; zero trout in the fishery body" (retrieved 2026-09-22) ; evidence-work/adj/lane-1/norris-lake.json — "webChecks verified 2026-09-22: live reservoir page warmwater species + stocking numbers; Norris absent from the 8-reservoir year-round list; only 'Norris Tailwater / Clinch River' " (retrieved 2026-09-22)
- **Supports:** species 'warmwater' and stockingProgram:false are CORRECT and live-verified. 'None required' lands.
- **Does not support:** The heavy non-trout hatchery program documents management emphasis, not species absence.
- **Recommended action:** none
- **Confidence:** high — Captured page confirms; nothing to change.
- **Notes:** Norris tailwater is catalog clinch-river - separate water.

### north-chickamauga-creek

- **Original correction:** seasonMonths null should carry the observed stocking months Feb/Mar/Apr/Nov.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-se-hiwassee · ledger=mixed/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Hamilton / "N. Chickamauga Creek" / Seasonal / STOCKING WEEK 2/22, 3/22, 4/19 and 11/1/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/north-chickamauga-creek.yaml — "seasonMonths/seasonKind absent (null); statement already carries: 'TWRA's 2026 weeks run Feb-Apr plus November'" (retrieved catalog read 2026-09-24)
- **Supports:** The observed stocking months Feb/Mar/Apr/Nov are confirmed verbatim (weeks 2/22, 3/22, 4/19, 11/1). The requested action - carry them in seasonMonths - is superseded by the repair design: programmatic windows were removed catalog-wide and programmatic waters show the stocking schedule instead; the catalog statement already quotes the weeks.
- **Does not support:** The weeks do not establish a fishing season or any persistence beyond the stocking weeks (catalog caveats: lower-creek summer grabs ran 23-26 C).
- **Recommended action:** none (keep presenting the four 2026 weeks in the stocking tab; no seasonMonths restoration)
- **Confidence:** high — Superseded by the repair design (no authored programmatic windows) — Stocking weeks 2/22, 3/22, 4/19, 11/1 confirmed in the schedule; the opportunity statement already quotes them; no authored window by design.
- **Notes:** GIS: single point 'Thrasher Pike Bridge Crossing (S1)', Hamilton, Soddy Daisy - access-site evidence only, not an event calendar.

### north-fork-forked-deer-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/north-fork-forked-deer-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; trout-lead web follow-up: only content-farm/app pages restating the Fishbrain aggregate; no age" (retrieved 2026-09-22) ; packages/content/streams/tn/north-fork-forked-deer-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Forked Deer rivers, supporting crappie as managed on the North Fork. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence; the single community-app trout entry remains an uncorroborated research lead.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### north-fork-holston-river

- **Original correction:** None: catalog species=warmwater confirmed; headline upgraded from unresolved to warmwater-focus on the verified exceptions entry.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-holston · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "'North Fork Holston River | Confluence with the South Fork Holston River upstream to the state line. | Black Bass: Five (5) per day in combination; 13-17 inch PLR for Smallmouth ba" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-5/north-fork-holston-river.json — "webCheck verified 2026-09-22: 'NF Holston smallmouth PLR rule verified verbatim; reach = state line to SF Holston confluence'; correction 'None: catalog species=warmwater confirmed" (retrieved 2026-09-22) ; packages/content/streams/tn/north-fork-holston-river.yaml — "species: warmwater present; stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** Lane-5's exceptions-entry verification is confirmed by an independent live re-fetch: the smallmouth PLR documents a managed warmwater fishery on the short Tennessee reach (state line to SF Holston confluence). Verdict 'None required' lands - no action.
- **Does not support:** A creel rule documents management, not a species census; no trout program exists for this reach (program absence, not biological absence).
- **Recommended action:** none
- **Confidence:** high — Exceptions-entry verification stands (lane-5 + capture); nothing to change.
- **Notes:** Separate from the Holston main-stem Cherokee tailwater entry (holston-river).

### north-fork-obion-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/north-fork-obion-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; shared Region 1 rivers check on the exceptions page" (retrieved 2026-09-22) ; packages/content/streams/tn/north-fork-obion-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Obion River 'includes tributaries', covering the North Fork; supports crappie as managed. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence, not a full species census.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### obed-river

- **Original correction:** None: catalog species=warmwater confirmed; headline upgraded from unresolved to warmwater-focus on the verified NPS page.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-cumberland-plateau · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-5/obed-river.json — "webChecks verified 2026-09-22: NPS Obed Wild & Scenic River fish page live - smallmouth most common game fish, muskie named, zero salmonids; USGS 03538830 max 29.7 C Jul-Aug 2026 r" (retrieved 2026-09-22, obs page current at check) ; packages/content/streams/tn/obed-river.yaml — "species: warmwater present; stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** The correction is 'None': species=warmwater confirmed on the verified NPS page (a federal agency source), headline warmwater-focus stands. No action.
- **Does not support:** NPS fish-page content documents the park's fish community emphasis; summer temps to 29.7 C document thermal character - neither proves salmonid absence park-wide (Clear Creek/Obed tributaries are separate catalog waters).
- **Recommended action:** none
- **Confidence:** high — NPS page names the Obed for smallmouth; stands.
- **Notes:** Clear Creek (clear-creek-obed), Daddys Creek etc. are separate trout/tributary entries - do not transfer.

### obey-river

- **Original correction:** Catalog yearRound:true and 12-month stocking match TWRA's schedule and forecast. Catalog species 'trout' should read rainbow+brown (per schedule and 2026 forecast); the static table's brook entry is the conflicting side of a preserved dispute. Catalog 'stocked by TWRA every month of the year' is supported.
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[1,2,3,4,5,6,7,8,9,10,11,12] · region=tn-upper-cumberland · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md — "'The Obey River, located below the Dale Hollow Dam offers fantastic year round trout fishing... The water is cold enough to support trout year round... TWRA partners with Dale Holl" (retrieved 2026-09-22, obs 2026 forecast edition) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 3, Clay, 'Dale Hollow TW / Obey River', Tailwater, months J,F,M,A,M,J,J,A,S,O,N,D, 'Rainbow, Brown Trout'" (retrieved 2026-09-22, obs 2026 stocking schedule) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "static tailwater row: 'Dale Hollow Dam, Obey River - Brook, Rainbow - January through December - Statewide Regulations' (the conflicting brook side)" (retrieved 2026-09-22) ; packages/content/streams/tn/obey-river.yaml — "yearRound: true; seasonMonths 1-12; notes still read 'put-grow-take rainbow, brown, and brook fishery stocked by TWRA every month of the year' (brook retained = dispute preserved)" (retrieved 2026-09-24)
- **Supports:** yearRound=true and 12-month stocking match schedule (12 months, Rainbow+Brown) and forecast (year-round, 65,000 Brown and Rainbow). Species rainbow+brown is the schedule/forecast pair; the static table's 'Brook, Rainbow' line is the conflicting side, and the current notes retain brook - the dispute is preserved as the correction asks.
- **Does not support:** The forecast's 'year round' is program/suitability language; 'natural reproduction has not been documented in the river' per the same node - no wild claim.
- **Recommended action:** none (species presentation as rainbow+brown with preserved brook conflict is the owner's editorial call; both sides now quoted)
- **Confidence:** high — Fields consistent; species-specify (rainbow+brown vs static-table brook conflict) is optional enrichment with the conflict already preserved in the ledger.
- **Notes:** Separate catalog waters: Dale Hollow Reservoir (April Brown Trout row belongs to the LAKE) and Hatchery Creek (weekly federal-hatchery stockings).

### obion-river

- **Original correction:** None: catalog species=warmwater confirmed; headline upgraded from unresolved to warmwater-focus on the verified crappie-rule entry.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-5/obion-river.json — "webCheck verified 2026-09-22: 'Obion crappie 30/day rule verified verbatim'; verdict upgraded headline to warmwater-focus on the crappie-rule entry" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "only Obion match is the Union City Reelfoot Packing Site pond row - no river trout rows" (retrieved 2026-09-22)
- **Supports:** Correction is 'None': catalog species=warmwater confirmed by the verified crappie-rule entry; headline warmwater-focus stands. The rule text '(includes tributaries)' also covers the forks carried as separate catalog entries.
- **Does not support:** A creel rule documents management, not a species census; no trout program exists for the river (absence of rows is program absence, not biological absence).
- **Recommended action:** none
- **Confidence:** high — Crappie-rule verification stands; species=warmwater stands.

### old-hickory-lake

- **Original correction:** species is UNSET; evidence supports TWRA's warmwater species list (verified 2026-09-22). No trout or year-round-trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-nashville · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-6b/old-hickory-lake.json — "webCheck verified 2026-09-22: TWRA Old Hickory Reservoir where-to-fish page - warmwater species list (black bass, crappie, catfish, striped/hybrid, white/yellow bass, walleye, saug" (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/old-hickory-lake.yaml — "species key absent (UNSET); targetSpecies list of 7 warmwater species present; stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Old Hickory Reservoir page documents a warmwater, hatchery-supported fishery (striped bass, walleye, sauger programs). 'No trout field supported' means the page documents a warmwater fishery and TWRA documents no trout program here - it never means trout are biologically absent. The 4 Fishbrain rainbow entries are research leads only (lane-6b).
- **Does not support:** Nothing on the page supports a trout, year-round-trout, or stockingProgram:true field for this reservoir.
- **Recommended action:** none (species field may optionally be populated from the TWRA warmwater list - owner enrichment decision)
- **Confidence:** high — Optional enrichment, fields legitimately unset — TWRA warmwater species list captured + re-checked; species legitimately unset.
- **Notes:** Schedule capture has zero Old Hickory rows; nearby Davidson County winter sites (Shelby Bottoms, Cedar Hill, Marrowbone) are separate waters.

### paint-creek-greene

- **Original correction:** catalog yearRound=false understates the documented case: the wild-trout reach is a year-round opportunity and the DH corridor is documented Oct-Jun. If the catalog keeps a single season field, tie year-round to the wild reach.
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-east-pigeon-frenchbroad · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** https://www.tn.gov/twra/fishing-regs/trout-regulations.html (live fetch 2026-09-24, saved _fetch/twra-trout-regulations-2026-09-24.html) — "Wild Trout Streams list: 'Paint Creek and tributaries from the USFS campground upstream to the USFS Boundary line south of Highway 70 near Munday Gap (Greene County)'; Delayed Harv" (retrieved 2026-09-24, obs current regulation year) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "rows: Region 4, Greene, 'Paint Creek': Seasonal weekly-ish 3/8/2026-6/28/2026 Rainbow Trout + Delayed Harvest 10/4/2026 Rainbow Trout (corridor documented Oct-Jun: DH Oct 1-Feb 28 " (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/paint-creek-greene.yaml — "yearRound: true already set with correction note: 'wild-trout reach: USFS campground upstream to USFS boundary near Munday Gap; lower corridor (campground to French Broad mouth) do" (retrieved 2026-09-24)
- **Supports:** The live trout-regulations page verifies BOTH legs: the wild-trout reach (USFS campground upstream to Munday Gap - fishable under statewide trout regs with no closed season) and the DH corridor (campground to French Broad mouth, catch-and-release Oct 1-Feb 28) which combines with the Mar-Jun seasonal schedule rows into the documented Oct-Jun corridor cycle. yearRound=true tied to the wild reach is supported and already applied.
- **Does not support:** The wild-trout listing documents the water's status, not abundance; 'year-round' is carried by the wild reach specifically - the correction's tie-to-wild-reach instruction is what the YAML note implements.
- **Recommended action:** none
- **Confidence:** high — yearRound flip applied; DH corridor Oct 1–Feb 28 + Mar–Jun schedule rows live-verified (the documented Oct–Jun cycle); reach wording carried.
- **Notes:** County qualifier distinguishes this from other Tennessee Paint Creeks.

### pickwick-lake

- **Original correction:** species is UNSET; evidence supports TWRA's warmwater species list (verified 2026-09-22). No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-6b/pickwick-lake.json — "webCheck verified 2026-09-22 (first fetch timed out; retry verified): TWRA Pickwick Reservoir page - warmwater species list, famous trophy smallmouth fishery, 43,100 ac; 'no trout " (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/pickwick-lake.yaml — "species key absent (UNSET); warmwater targetSpecies list present; stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Pickwick Reservoir page documents a warmwater fishery famous for trophy smallmouth. 'No trout field supported' = the page documents warmwater; it is not evidence trout are absent.
- **Does not support:** No trout program or trout fishery documentation; no support for trout or year-round-trout fields.
- **Recommended action:** none (optional enrichment: populate species/targetSpecies from the TWRA list)
- **Confidence:** high — Optional enrichment, fields legitimately unset — TWRA warmwater species list captured + re-checked 2026-09-24.

### pine-creek-dekalb

- **Original correction:** seasonMonths null should carry the observed stocking months Feb/Mar.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-caney-fork · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / DeKalb / "Pine Creek" / Seasonal / STOCKING WEEK 2/22, 3/22 and 3/29/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/pine-creek-dekalb.yaml — "seasonMonths/seasonKind absent (null); statement already says 'three late-winter/early-spring stocking weeks (February-March 2026)'" (retrieved catalog read 2026-09-24)
- **Supports:** Observed stocking months Feb/Mar confirmed verbatim (weeks 2/22, 3/22, 3/29). The requested seasonMonths update is superseded by the repair design: programmatic windows stay out of the catalog and the schedule presentation carries the weeks (statement already quotes them).
- **Does not support:** Feb/Mar weeks do not establish any fishing window or persistence past the last March event.
- **Recommended action:** none
- **Confidence:** high — Superseded by the repair design (no authored programmatic windows) — Feb/Mar weeks confirmed; statement already carries them.

### piney-river-rhea

- **Original correction:** catalog yearRound=true is wrong: documented program is Oct/Nov-Feb DH plus Feb-Apr seasonal stockings; set yearRound false.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-cumberland-plateau · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change
- **Confidence:** high — yearRound flip applied; window removed. The DH-start discrepancy (regs Nov 1 vs an Oct 1 read) is preserved in the ledger and folds into the TWRA regs question — not actionable from public sources alone.

### red-river-clarksville

- **Original correction:** catalog species=warmwater for the RIVER is plausible but not positively documented in this pass; the DOCUMENTED trout opportunity is the winter stocked reach at Billy Dunlop Park. Recommend display/season follow the winter program (Dec-Feb), not a year-round trout flag.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-nashville · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "rows: Region 2, Montgomery, 'Billy Dunlop Park', Winter, Rainbow Trout, 02/18/2026 and TBD 12/2026" (retrieved 2026-09-22, obs 2026 stocking schedule) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-stock-locations.json — "GIS point OBJECTID 666: 'Billy Dunlop Park', StreamName 'Red River', Region 2, MONTGOMERY, Clarksville" (retrieved 2026-09-22) ; packages/content/streams/tn/red-river-clarksville.yaml — "stockingProgram: true; notes carry the 2026-09-22 correction paragraph naming Billy Dunlop Park and retracting the earlier no-trout-program note; opportunity = seasonal-stocked-tro" (retrieved 2026-09-24) ; https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "zero 'Red River' entries in the live exceptions page text (no special rule; statewide rules govern)" (retrieved 2026-09-24)
- **Supports:** The repair is verified: notes and stockingProgram now reflect the documented winter rainbow program at Billy Dunlop Park (schedule rows + GIS point). Display/season follow the winter program (opportunity seasonal-stocked-trout; no year-round trout flag) as recommended.
- **Does not support:** Residue per the correction: species='warmwater' for the RIVER remains plausible-but-unverified - the YAML itself says the river 'is documented nowhere as more than a warmwater bass/catfish stream in this pass' and the notes' 'bass and catfish water' phrasing has no positive citation. That label is honest but unsupported; it is not evidence of trout absence either.
- **Recommended action:** none required (fixed parts verified). Optional: keep the warmwater river label explicitly tagged unverified, or source it from a positive TWRA/Montgomery publication if one surfaces
- **Confidence:** high — Repair already fixed the note + stockingProgram for the Billy Dunlop Park winter reach; species=warmwater for the broad river is carried as plausible-unverified with the reach-scoped seasonal card governing display; zero Red River entries on the live exceptions page (verified, not absence).
- **Notes:** The iNat corroboration (Nov 2023-Mar 2024, one observer, obscured coordinates) is correctly held at corroborate-only weight.

### reelfoot-lake

- **Original correction:** species is UNSET; evidence supports TWRA's warmwater species list (verified 2026-09-22). No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-6b/reelfoot-lake.json — "webCheck verified 2026-09-22 (first fetch timed out; retry verified): TWRA Reelfoot Lake page - 'famous for its bluegill and crappie fishery, both of which rank among the best in t" (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/reelfoot-lake.yaml — "species key absent (UNSET); stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Reelfoot Lake page documents one of Tennessee's premier warmwater (crappie/bluegill) fisheries. 'No trout field supported' = the page documents warmwater, not trout absence.
- **Does not support:** No trout content on the page; no support for trout fields.
- **Recommended action:** none (optional enrichment: populate warmwater species from the TWRA page)
- **Confidence:** high — Optional enrichment, fields legitimately unset — TWRA species list captured + re-checked; species legitimately unset.

### richardson-byrd-creek

- **Original correction:** seasonMonths [12,1,2] (winter) is wrong: all 2026 rows are Seasonal Feb-Apr; set stocking months to Feb/Mar/Apr.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-clinch · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Feb–Apr rows confirm.

### rocky-river

- **Original correction:** seasonMonths null should carry the observed stocking months Mar/Apr/May.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-caney-fork · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Van Buren / "Rocky River" / Seasonal / STOCKING WEEK 3/8, 4/12 and 5/17/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/rocky-river.yaml — "seasonMonths/seasonKind absent (null); statement already says 'three spring stocking weeks (March-May 2026)'" (retrieved catalog read 2026-09-24)
- **Supports:** Observed stocking months Mar/Apr/May confirmed verbatim. The seasonMonths request is superseded by the repair design; the statement already carries the months.
- **Does not support:** Weeks do not establish persistence past mid-May (statement notes summer grabs 24.5-26.5 C).
- **Recommended action:** none
- **Confidence:** high — Superseded by the repair design (no authored programmatic windows) — Mar/Apr/May weeks confirmed; statement already carries them.

### rutherford-fork-obion-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/rutherford-fork-obion-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; schedule capture grep: 'Rutherford' matches are Rutherford County Nice Mill winter-rainbow rows" (retrieved 2026-09-22) ; packages/content/streams/tn/rutherford-fork-obion-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Obion River 'includes tributaries', covering the Rutherford Fork; supports crappie as managed. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence; same-name noise (Rutherford County Nice Mill) must not be read as trout rows for this fork.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### salt-lick-creek

- **Original correction:** seasonMonths [12,1,2] (winter) is wrong: schedule rows are March (with a possible January event in the prior live read); set stocking months to Mar (Jan unconfirmed). Catalog note 'spring-stocked' is correct.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-upper-cumberland · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; March rows (prior-January read unconfirmed) noted; "spring-stocked" note correct.

### sequatchie-river

- **Original correction:** seasonMonths null should carry the observed stocking months Mar/May.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-cumberland-plateau · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Cumberland / "Sequatchie River" / Seasonal / STOCKING WEEK 3/22, 3/29 and 5/17/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/sequatchie-river.yaml — "seasonMonths/seasonKind absent (null); statement already says 'three stocking weeks (March-May 2026)'" (retrieved catalog read 2026-09-24)
- **Supports:** Observed stocking months Mar/May confirmed verbatim (no April event: two March weeks + one May week). Superseded as to seasonMonths by the repair design.
- **Does not support:** Does not establish any fishing window beyond the stocked weeks.
- **Recommended action:** none
- **Confidence:** high — Superseded by the repair design (no authored programmatic windows) — Mar/May rows (no April) confirmed; statement already carries them.
- **Notes:** Counties field is null in the catalog while the rows say Cumberland - harmless, but an owner could add ['Cumberland'] to hydroIdentity.

### sinking-creek-wilson

- **Original correction:** None required on species/fishery (trout/stocked winter program documented); seasonMonths has no documented window beyond the winter program design (catalog carries none).
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-nashville · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** evidence-work/captures/twra-schedule.json — "Re-verified row-by-row 2026-09-24: {"REGION":"2","COUNTY":"Wilson","LOCATION":"Don Fox Park Community Park","TYPE":"Winter","STOCKING DAY":"2/11/2026","SPECIES":"Rainbow Trout"} an" (retrieved 2026-09-24, obs 2026 stocking schedule) ; evidence-work/adj/lane-5/sinking-creek-wilson.json (webChecks) — "'Don Fox Park Community Park' Winter rows verified 2026-09-22; creek-through-park attribution from local reporting (lead tier)" (retrieved 2026-09-22)
- **Supports:** Correction ('None required' on species/fishery; seasonMonths has no documented window beyond the winter program design) is confirmed: trout/stocked winter program documented (Feb 11 + TBD Dec 2026, Wilson County), and the catalog correctly carries seasonMonths null - the schedule publishes event days, not a month window.
- **Does not support:** Nothing contradicts; an agency sentence naming Sinking Creek as the stocked water remains lane-5's open join-sealing question.
- **Recommended action:** none
- **Confidence:** high — Winter rows re-quoted; consistent.
- **Notes:** Site string names the park; cite carefully per lane-5.

### south-fork-forked-deer-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/south-fork-forked-deer-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; shared Region 1 rivers check on the exceptions page" (retrieved 2026-09-22) ; packages/content/streams/tn/south-fork-forked-deer-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Forked Deer rivers, supporting crappie as managed on the South Fork. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence, not a full species census.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### south-fork-obion-river

- **Original correction:** species is UNSET; the crappie rule supports listing crappie. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/limited
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit."" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/south-fork-obion-river.json — "webCheck verified 2026-09-22: crappie rule naming this river on the exceptions page; shared Region 1 rivers check on the exceptions page" (retrieved 2026-09-22) ; packages/content/streams/tn/south-fork-obion-river.yaml — "species key absent (UNSET)" (retrieved 2026-09-24)
- **Supports:** The crappie rule names the Obion River 'includes tributaries', covering the South Fork; supports crappie as managed. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** Creel rule is management evidence, not a full species census.
- **Recommended action:** optional owner enrichment: populate targetSpecies crappie
- **Confidence:** high — Optional enrichment, fields legitimately unset — Crappie rule verified; species legitimately unset.

### south-holston-river

- **Original correction:** Catalog seasonMonths [3,4,5,6,7,8,9] matches the schedule/forecast/static Mar-Sep stocking season — correct. yearRound:true supported. Catalog 'species: trout' should specify rainbow (stocked) and brown (wild, not stocked).
- **Current catalog:** species=trout · fishery=tailwater · yearRound=true · seasonMonths=[3,4,5,6,7,8,9] · region=tn-east-holston · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md — "'It supports a very abundant wild Brown Trout population and is also stocked with Rainbow Trout annually.' (South Holston Tailwater section); 2025 biologist report details brown/ra" (retrieved 2026-09-22, obs 2026 forecast edition) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "row: Region 4, Sullivan, 'S. Holston TW / S. Fork Holston River', Tailwater, months M,A,M,J,J,A,S, Rainbow Trout" (retrieved 2026-09-22, obs 2026 stocking schedule) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "static tailwater row: 'South Holston Dam, South Fork Holston River - Rainbow - March through September - Special Trout Regulations'" (retrieved 2026-09-22) ; packages/content/streams/tn/south-holston-river.yaml — "yearRound: true; seasonMonths [3,4,5,6,7,8,9] programmatic; species: trout; fishery: tailwater" (retrieved 2026-09-24)
- **Supports:** seasonMonths [3..9] matches schedule + static Mar-Sep rainbow stocking; yearRound=true is supported (the tailwater fishes year-round; special regs and a Nov 1-Jan 31 closed section apply). Species detail rainbow (stocked) and brown (abundant wild population, NOT stocked) is directly quoted from the 2026 forecast.
- **Does not support:** The forecast documents wild browns via agency sampling narrative, not a census; browns are not in the stocking program for this tailwater.
- **Recommended action:** optional enrichment: species detail 'rainbow (stocked Mar-Sep), brown (wild, not stocked)'; otherwise none
- **Confidence:** high — Mar–Sep stocking months consistent across surfaces; species-specify (rainbow stocked / brown wild) is optional enrichment already supported by the forecast text.
- **Notes:** Regs: 7/day combined Rainbow+Brown, 16-22 in protected slot, 1 over 22 in; two closed sections Nov 1-Jan 31.

### spring-creek-polk

- **Original correction:** seasonMonths [12,1,2] is wrong: 2026 rows fall in Feb/Mar/Apr and Nov; set stocking months accordingly.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-se-hiwassee · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Polk / "Spring Creek" / Seasonal / STOCKING WEEK 2/1, 3/1, 3/29, 4/26, 11/1 and 11/29/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/spring-creek-polk.yaml — "seasonMonths/seasonKind absent (repaired)" (retrieved catalog read 2026-09-24)
- **Supports:** 2026 rows fall in Feb, Mar, Apr and Nov exactly as the correction says; the [12,1,2] window was removed by the repair.
- **Does not support:** Weeks do not establish persistence between events or any fishing window.
- **Recommended action:** none (stocking-schedule presentation carries the weeks)
- **Confidence:** high — Already repaired by the repair branch — Window removed; Feb/Mar/Apr + Nov rows confirm.

### station-creek

- **Original correction:** seasonMonths [12,1,2] is wrong: 2026 rows fall in Feb-Apr; set stocking months accordingly.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-east-clinch · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Feb–Apr rows confirm.

### stoney-creek-carter

- **Original correction:** seasonMonths null should carry the observed stocking months Mar/May.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-northeast-watauga · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 4 / Carter / "Stony Creek" / Seasonal / STOCKING WEEK 3/8, 4/5, 5/3 and 5/31/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/stoney-creek-carter.yaml — "seasonMonths/seasonKind absent (null); statement already says 'four March-May stocking weeks in 2026'" (retrieved catalog read 2026-09-24) ; evidence-work/captures/twra-stock-locations.json — "24 Carter County points: 1 'Stony Creek' + 23 'Stoney Creek' sites S1-S24, Prog Spring, rainbow" (retrieved 2026-09-22 (capture))
- **Supports:** The schedule rows exist and run 3/8-5/31/2026. Note the correction's 'Mar/May' understates the observed months: events fall in March, April AND May (3/8, 4/5, 5/3, 5/31) - the catalog statement's 'March-May' is the accurate reading. Superseded as to seasonMonths by the repair design.
- **Does not support:** No persistence past the last May event is documented.
- **Recommended action:** none
- **Confidence:** high — Superseded by the repair design (no authored programmatic windows) — Mar/Apr/May weeks confirmed (correction's "Mar/May" omitted April); statement already says March–May; schedule spells "Stony Creek".
- **Notes:** Schedule spelling 'Stony Creek' vs catalog id stoney-creek-carter - a join alias worth remembering for automated joins.

### sulfur-fork-creek

- **Original correction:** None required: species trout/stocked with winter seasonMonths (12,1,2) is consistent with the Winter-type rows.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[12,1,2] · region=tn-middle-nashville · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** evidence-work/captures/twra-schedule.json — "Re-verified row-by-row 2026-09-24: {"REGION":"2","COUNTY":"Robertson","LOCATION":"Sulphur Fork Creek","TYPE":"Winter","STOCKING DAY":"02/04/2026","SPECIES":"Rainbow Trout"}; same f" (retrieved 2026-09-24, obs 2026 stocking schedule) ; evidence-work/adj/lane-5/sulfur-fork-creek.json (webChecks) — "Historical summer grabs 25-28.4 C, 1980-2009 (prior lead, context only); USGS/TDEC spelling 'Sulphur Fork'" (retrieved 2026-09-22, obs 1980-2009)
- **Supports:** Correction ('None required') is confirmed: species trout / fishery stocked with winter seasonMonths [12,1,2] is consistent with the Winter-type rows (Feb 4, Feb 26, TBD Dec 2026, Robertson County) - a direct name+county match (spelling variant 'Sulphur' vs catalog 'Sulfur', same water).
- **Does not support:** Nothing contradicts; no summer carryover is documented.
- **Recommended action:** none
- **Confidence:** high — Winter-type rows re-quoted; consistent.
- **Notes:** Lane-5 rates this the strongest site-string join of its lane; carrying that forward.

### tennessee-river

- **Original correction:** species is UNSET; evidence supports TWRA's warmwater list for the Kentucky Lake pool (verified 2026-09-22). No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-6b/tennessee-river.json — "webCheck verified 2026-09-22: TWRA Kentucky Reservoir page - mainstream-reservoir description, warmwater species list, December-March sauger run below TVA dams; no trout program on" (retrieved 2026-09-22, obs current page content) ; evidence-work/adj/lane-6b/tennessee-river.json — "capture cross-check: the forecast-text 'tennessee river' string match was inside a Tellico River passage (noise), not a main-stem trout claim" (retrieved 2026-09-22) ; packages/content/streams/tn/tennessee-river.yaml — "species key absent (UNSET); stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Kentucky Reservoir (Kentucky Lake pool) page documents a warmwater main-stem fishery whose signature cold-season fishery is the Dec-Mar sauger run. 'No trout field supported' = warmwater documented, not trout absence.
- **Does not support:** No trout program anywhere on the main stem per TWRA documents checked; no support for trout fields.
- **Recommended action:** none (optional enrichment: populate warmwater species)
- **Confidence:** high — Optional enrichment, fields legitimately unset — Kentucky-Lake-pool warmwater list captured + re-checked; species legitimately unset.
- **Notes:** The item's Hardin County framing places this entry on the Kentucky Lake pool reach.

### tims-ford-lake

- **Original correction:** catalog species 'warmwater' and stockingProgram=false are correct. Recommend the notes carry the lake-vs-tailwater boundary explicitly so the tailwater's year-round trout claims are never quoted against the reservoir.
- **Current catalog:** species=warmwater · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-duck-elk · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: notes
- **Evidence:** evidence-work/adj/lane-2/tims-ford-lake.json — "webCheck verified 2026-09-22: TWRA Tims Ford Reservoir page - warmwater-only species list (black bass, crappie, hybrid/striped bass, walleye), TVA authority, 10,600 ac; 'trout appe" (retrieved 2026-09-22, obs current page content) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "single Tims Ford row is the TAILWATER row ('Tims Ford TW / Elk River') - no lake row" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/tims-ford-lake.yaml — "species: warmwater; stockingProgram: false; boundary already carried: statement ('the documented year-round trout water is the Elk River below Tims Ford Dam - a separate catalog wa" (retrieved 2026-09-24)
- **Supports:** species 'warmwater' and stockingProgram=false are correct per the verified page; the lake-vs-tailwater boundary the correction asks for is ALREADY carried explicitly in the opportunity statement, reachScope, and first caveat - no action needed. Forecast nodes for 'Tims Ford' are tailwater sections (Elk River '24-7-365'), correctly walled off.
- **Does not support:** Residue outside this correction: speciesEvidence entries still cite the trout stocking page (retrieved 2026-09-13) rather than the TWRA Tims Ford Reservoir page - same mis-citation pattern as lake-graham; the proper page is verified and already in officialSources.
- **Recommended action:** none required (boundary already carried); optional cleanup: re-point the seven speciesEvidence URLs from trout-information-stockings.html to the TWRA Tims Ford Reservoir page
- **Confidence:** high — Lake-vs-tailwater boundary already carried; BONUS residue: speciesEvidence also cites the trout stocking page — listed in follow-ups.
- **Notes:** Elk River tailwater is catalog elk-river; never quote its year-round trout facts against the reservoir.

### tumbling-creek

- **Original correction:** seasonMonths [12,1,2] is wrong: 2026 rows fall in Mar/Apr; set stocking months accordingly.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-se-hiwassee · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — window removed; March/April rows confirm.

### upper-hills-creek

- **Original correction:** seasonMonths [12,1,2] is wrong: the 2026 row is a single March week; set stocking months to Mar.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-middle-caney-fork · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; single March row confirms.

### upper-roan-creek

- **Original correction:** seasonMonths [12,1,2] (winter) is wrong: the 2026 schedule shows March-June stockings; set stocking months to Mar-Jun.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-northeast-watauga · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; Mar–Jun rows confirm.

### watauga-lake

- **Original correction:** Catalog yearRound:false is WRONG — TWRA's live list names Watauga for year-round reservoir trout fishing; set yearRound:true with the deep-water summer qualification. Catalog species 'trout' should specify rainbow, brown, lake (lake trout is the signature fishery). seasonMonths should be null (no seasonal window — the fishery is year-round with a deep-water summer pattern).
- **Current catalog:** species=trout · fishery=stocked · yearRound=true · seasonMonths=null · region=tn-northeast-watauga · ledger=year-round-trout/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt — "list line 'Region IV, Watauga - Lake and Rainbow' under the year-round reservoir stocking header" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-watauga-lake.html — "Fishing tips: 'Rainbow and Brown Trout - Spring: Bank fish with corn or salmon eggs. Summer: Troll spoons in 30 to 50 feet of water. Lake Trout - Summer: Troll spoons in 90 to 120 " (retrieved 2026-09-22) ; evidence-work/adj/lane-1/watauga-lake.json — "webCheck verified 2026-09-22: live reservoir page (rainbow/brown/lake, 90-120 ft lake-trout summer guidance, 7/day 2-lake-trout regs, 44-ft drawdown); no Watauga Reservoir row in t" (retrieved 2026-09-22) ; packages/content/streams/tn/watauga-lake.yaml — "yearRound: true already set; species: trout; fishery: stocked; seasonMonths null" (retrieved 2026-09-24)
- **Supports:** TWRA's live list names Watauga for year-round reservoir trout fishing - yearRound=true (already applied) is capture-supported. Species detail rainbow, brown, lake is supported by the reservoir page (fishing tips name all three; lake trout is the signature deep-summer fishery). seasonMonths null is correct: the fishery is year-round with a deep-water summer pattern, no seasonal window.
- **Does not support:** Deep-water summer (90-120 ft) is a pattern qualification, not an easy-access claim; no lake schedule row exists - program documentation is list + reservoir page only.
- **Recommended action:** optional enrichment: species detail rainbow/brown/lake with the deep-water summer note; otherwise none
- **Confidence:** high — yearRound flip applied; species-specify (rainbow, brown, lake) optional with the captured page; deep-water summer caveat carried.
- **Notes:** 44-ft seasonal drawdown per the reservoir page; Wilbur tailwater (watauga-river) is a separate catalog water.

### watts-bar-lake

- **Original correction:** species is UNSET; evidence supports TWRA's warmwater species list plus the four stocked warmwater programs (verified 2026-09-22). No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-east-clinch · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-watts-bar-lake.html — "'The Tennessee Wildlife Resources Agency (TWRA) also stocks several gamefish in Watts Bar on an annual basis, including striped bass, black crappie, walleye, and Florida largemouth" (retrieved 2026-09-22) ; evidence-work/adj/lane-6b/watts-bar-lake.json — "webCheck verified 2026-09-22: TWRA Watts Bar Reservoir page - warmwater species list + the four stocked warmwater programs; 'no trout mention'; tva.com fetch failed 403 (recorded, " (retrieved 2026-09-22)
- **Supports:** The committed capture documents the warmwater species list AND the four stocked warmwater programs (striped bass, black crappie, walleye, Florida largemouth bass). 'No trout field supported' = warmwater documented, not trout absence.
- **Does not support:** No trout program documented; no support for trout fields.
- **Recommended action:** none (optional enrichment: populate warmwater species incl. the four stocked programs)
- **Confidence:** high — Optional enrichment, fields legitimately unset — Warmwater list + four stocked warmwater programs captured; species legitimately unset.

### white-oak-creek

- **Original correction:** seasonMonths [12,1,2] is WRONG vs the schedule (spring weeks 2/22-3/29/2026); correct to spring seasonal. species trout/stocked stands.
- **Repair note (already applied):** Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-upper-cumberland · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Confidence:** high — Already repaired by the repair branch — Window removed; spring weeks 2/22–3/29 confirm.

### wilbur-lake

- **Original correction:** Catalog fields are correct as set: species trout (rainbow), fishery stocked, yearRound:false, seasonMonths [3,4,5,6,7] matches the documented March-July window, stockingProgram:true. Keep the Wilbur-Tailwater row out of this water's data.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=[3,4,5,6,7] · region=tn-northeast-watauga · ledger=seasonal-stocked-trout/documented
- **Disposition:** no-change · affects: season
- **Evidence:** https://www.tn.gov/twra/fishing/trout-information-stockings.html — "Re-verified live: "Watauga Dam, Wilbur Reservoir - Rainbow - March through July - Statewide Regulations" (the reservoir's own program row); separately "Wilbur Dam, Watauga River - " (retrieved 2026-09-24, obs 2026 program (live page)) ; evidence-work/captures/twra-schedule.json — "Re-verified 2026-09-24: the 616-row weekly schedule contains only {"LOCATION":"Wilbur Tailwater / Watauga River","TYPE":"Tailwater","STOCKING MONTHS":"M, A, M, J, J, A, S","SPECIES" (retrieved 2026-09-24, obs 2026 stocking schedule) ; evidence-work/adj/lane-1/wilbur-lake.json (webChecks) — "live 2026-09-22: static row verbatim; Wilbur absent from the live year-round reservoir trout list; sibling-water trap documented (lake vs tailwater vs riverine reach)" (retrieved 2026-09-22)
- **Supports:** Correction ('fields correct as set') is confirmed with a fresh live check: species trout (rainbow), fishery stocked, yearRound:false, seasonMonths [3,4,5,6,7] matches TWRA's 'March through July' window, stockingProgram true - all as set. The Wilbur-Tailwater/Watauga River row and 'Wilbur TW' releases are the river below the dam and stay out of this water's data.
- **Does not support:** Nothing contradicts; the weekly JSON's silence on the reservoir remains the documented documentation-structure gap (not evidence against the program), and no holdover data exists for the pool.
- **Recommended action:** none
- **Confidence:** high — All fields verified against the static row ("Watauga Dam, Wilbur Reservoir — Rainbow — March through July", re-verified live 2026-09-24) and the weekly tailwater rows stay separate (they belong to watauga-river).
- **Notes:** Sibling-water discipline per lane-1: reservoir pool only; tailwater and riverine reach are separate waters.

### wolf-river-fentress

- **Original correction:** seasonMonths null should carry the observed stocking months Mar-May.
- **Current catalog:** species=trout · fishery=stocked · yearRound=false · seasonMonths=null · region=tn-cumberland-plateau · ledger=mixed/documented
- **Disposition:** no-change · affects: season
- **Evidence:** captures/twra-schedule.json — "rows: REGION 3 / Fentress / "Wolf River" / Seasonal / STOCKING WEEK 3/8, 4/12 and 5/10/2026 / Rainbow Trout" (retrieved 2026-09-22 (capture)) ; packages/content/streams/tn/wolf-river-fentress.yaml — "seasonMonths/seasonKind absent (null); statement already says 'spring rainbow stockings on the headwaters (March-May 2026 weeks)'" (retrieved catalog read 2026-09-24)
- **Supports:** Observed stocking months Mar-May confirmed verbatim (3/8, 4/12, 5/10). Superseded as to seasonMonths by the repair design; the statement already carries the months.
- **Does not support:** Does not establish any window beyond the stocking weeks; the warmwater bass fishery claim is separate and documented.
- **Recommended action:** none
- **Confidence:** high — Superseded by the repair design (no authored programmatic windows) — Mar–May weeks confirmed; statement already carries them; mixed headline intact.
- **Notes:** GIS: 3 Fentress points at Pall Mall (Wolf River Loop, York Farm/Mill, Delk Creek Rd).

### wolf-river-west-tennessee

- **Original correction:** species is UNSET; evidence supports a warmwater assemblage (bass, crappie, catfish, sunfish) per the 2022 Conservancy summary and TWRA crappie rule. No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-west · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (live fetch 2026-09-24, saved _fetch/twra-exceptions-2026-09-24.html) — "Exceptions row: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" -> "Crappie: 30 per day, no length limit." - the rule names the Wolf River (incl" (retrieved 2026-09-24, obs current regulation year) ; evidence-work/adj/lane-6b/wolf-river-west-tennessee.json — "webChecks verified 2026-09-22: Wolf River Conservancy 2022 fish summary ('about 67 species in 13 families', no trout) verified with 2022-03-28 publication date - that account is la" (retrieved 2026-09-22) ; docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json — "grep 'Wolf River': only Region 3 FENTRESS County rows exist (Seasonal rainbow, Mar/Apr/May 2026) - a different, same-named water (wolf-river-fentress); zero trout rows for the West" (retrieved 2026-09-22, obs 2026 stocking schedule) ; packages/content/streams/tn/wolf-river-west-tennessee.yaml — "species key absent (UNSET); no trout fields; opportunity warmwater-focus/documented" (retrieved 2026-09-24)
- **Supports:** TWRA side confirmed: the crappie rule names the Wolf River (30/day, no length limit, tributaries included), and no trout program exists for the WEST TENNESSEE Wolf River in the schedule capture - the only trout 'Wolf River' rows are the Fentress County water. 'No trout field supported' = managed warmwater documented, not trout absence.
- **Does not support:** The Conservancy 67-species account is a non-agency source owned by lane R3; the TWRA-side evidence here supports the crappie rule and program absence only.
- **Recommended action:** none on the TWRA side (species enrichment from the Conservancy account is R3's call)
- **Confidence:** high — Optional enrichment, fields legitimately unset — Warmwater assemblage (2022 Conservancy account + crappie rule) recorded; species legitimately unset; Fentress County "Wolf River" trout rows never merge here.
- **Notes:** Same-name risk: wolf-river-fentress (trout water) vs wolf-river-west-tennessee (this entry) - never merge their rows.

### woods-reservoir

- **Original correction:** species is UNSET; evidence supports TWRA's warmwater species list (verified 2026-09-22). No trout field is supported.
- **Current catalog:** species=— · fishery=— · yearRound=— · seasonMonths=null · region=tn-middle-duck-elk · ledger=warmwater-focus/documented
- **Disposition:** no-change · affects: species
- **Evidence:** evidence-work/adj/lane-6b/woods-reservoir.json — "webCheck verified 2026-09-22: TWRA Woods Reservoir page - 'the best fishing opportunities are for Largemouth Bass, Crappie, White Bass, Yellow Bass, and Channel Catfish'; 3,660-ac " (retrieved 2026-09-22, obs current page content) ; packages/content/streams/tn/woods-reservoir.yaml — "species key absent (UNSET); warmwater targetSpecies list present; stockingProgram: false" (retrieved 2026-09-24)
- **Supports:** TWRA's Woods Reservoir page documents a warmwater fishery in TWRA's own words. 'No trout field supported' = warmwater documented, not trout absence.
- **Does not support:** No trout content; no support for trout fields.
- **Recommended action:** none (optional enrichment: populate warmwater species)
- **Confidence:** high — Optional enrichment, fields legitimately unset — TWRA species list captured + re-checked; species legitimately unset.
