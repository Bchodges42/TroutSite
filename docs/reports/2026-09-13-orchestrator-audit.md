# Trout accuracy campaign — orchestrator audit

**Date:** 2026-09-13  
**Audited revision:** `origin/main` at `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`  
**Scope:** repository and public upstream research only; no production access; no code,
content, configuration, or deployment changes

## Executive verdict

Trout has a strong offline/static delivery architecture and has made real progress on
species-honest presentation. It does not yet have a defensible sitewide “fishability”
system. Three different products are currently being described with the same word:

1. a generic trout-shaped flow/temperature score emitted for every catalog water;
2. a new temperature-only score for seven warmwater species on 39 waters; and
3. an “activity outlook” whose pressure and spawning transformations are not supported by
   the species reference data they claim to operationalize.

The largest risk is false confidence, not lack of data. The pipeline can retain and score
an old reading after a gauge stops, the map can make all 148 catalog objects selectable,
and marketing claims more complete evidence and factor coverage than the code provides.
The next campaign should therefore establish applicability and freshness gates before it
adds sources or adjusts weights.

Owner policy in `docs/KNOWN-ISSUES.md` remains the constraint: per-species scores are to be
built; warmwater anglers remain first-class; the sitewide mode defaults to Trout; the
evidence endpoint remains owner/marketing-facing; recent stocking and public report photos
remain in scope. The audit recommends changing what the score *means*—measured habitat and
access suitability, never predicted catching—not reversing those decisions.

## Audit basis and method

The unversioned `/Users/ben/Downloads/TroutSite-main` directory was not treated as source
truth. The GitHub SSH identity was exercised against the configured repository and a clean
clone was fetched from `git@github.com:Bchodges42/TroutSite.git`; this report branch was cut
from the fetched `origin/main`. All counts below were recomputed from YAML, GeoJSON, source,
and checked-in evidence files. Historical reports were used only as leads.

External calls were limited to public endpoints, with an identifying user agent. They are
point-in-time probes, not implementation evidence; the campaign prompts require their
executors to repeat and record all live verification.

## What is actually in the catalog and map

### Catalog cardinality

| Dimension | Verified count |
|---|---:|
| YAML waters | 148 |
| Rivers | 35 |
| Creeks | 57 |
| Lakes | 38 |
| Tailraces | 12 |
| Ponds | 5 |
| Springs | 1 |
| `species: trout` | 103 |
| `species: warmwater` | 8 |
| `species` absent | 37 |
| `fishery: stocked` / `tailwater` / `wild` / absent | 81 / 13 / 7 / 47 |
| `yearRound: true` / `false` / absent | 19 / 72 / 57 |
| `stockingProgram: true` / `false` | 94 / 54 |
| Nonempty `idealFlow` | 92 |
| Empty `idealFlow` | 56 |

`apps/web/public/atlas/rivers.geojson` and
`apps/web/src/features/map/riverIndex.json` both contain 148 IDs and join one-for-one to
the YAML catalog. Geometry types are 105 `MultiLineString`, 20 `MultiPolygon`, and 23
`Polygon`. There is no orphan or missing catalog geometry at this revision.

### How a water earns a line, hit target, icon, or title today

The catalog itself is the interactive atlas. `RiverMapPage.tsx` computes a `visibleIds`
set, and `TennesseeMap.tsx` accepts any visible feature found in four wide hit layers.
There is no editorial `displayTier` or “destination water” field. Consequently:

- All 148 waters can be selectable in All-fish mode.
- Default Trout mode admits 141: all 103 confirmed trout waters, all 37 unknown-species
  waters, and the stocked Harpeth; seven plain warmwater waters are excluded from hits.
- Still waters are deliberately never visually hidden by the species filter even when
  their hit targets are excluded. That creates visible-but-inert warmwater lakes in Trout
  mode.
- Search and catalog rows are not distinguished from map prominence. A tiny seasonal
  stocking site and a statewide river are both catalog features with hit geometry.

Titles are DOM buttons gated by the largest width/height of the feature bounding box:

- extent at least `0.3` degrees: title at statewide zoom;
- extent at least `0.05`: title from zoom 8.5;
- smaller: title from zoom 9.5;
- selected or “assessed” confirmed-trout waters can bypass prominence.

The current data produce 54 statewide, 72 approach, and only 22 local-only candidates.
That is not a useful reduction: long geometry makes small named creeks such as Reedy,
Sulfur Fork, Little West Fork, and White Oak qualify as statewide titles. Bounding-box
extent measures the extraction, not fishing importance, navigability, public access,
fishery status, or seasonal relevance. The “assessed anytime” bypass also couples title
clutter to feed availability.

This is adjacent to completed map work, but not tracked by existing IDs. T1-18/T1-19 and
T2-20/T2-21 cover season semantics; T2-28 covers species-appropriate scoring; T3-52 covers
new candidates. None defines editorial selectability or title prominence.

### Required display model

Do not delete waters to declutter the map. Preserve all evidence-worthy entries for search,
offline detail, and stocking reconciliation, but add an authored, reviewable map policy:

- **Primary destination:** selectable and title-eligible at statewide/approach zoom in the
  applicable species mode.
- **Local destination:** selectable only at local zoom; no statewide title.
- **Catalog/background:** geometry may provide geographic context, but no ordinary hit
  target or title. Search can still open its detail page.
- **Seasonal gate:** a verified season controls ordinary visibility/selectability; a direct
  search/deep link remains available with an out-of-season label.
- **Species gate:** Trout mode ordinarily exposes verified trout fisheries; All-fish with a
  focus exposes waters verified for that species. Unknown is never promoted by extent.

The values must be authored per water from fishery importance, verified species/season,
public access, geometry, and available decision data. They must not be inferred from
`waterbodyType`, bounding box, stocking alone, or whether a snapshot happened to assess.
The final planning session is required to deliver the 148-row decision matrix.

## What scoring actually does

### Legacy `scoreConditions`

`packages/contracts/src/scoreConditions.ts` is deterministic but not per-species:

- flow inside any authored `idealFlow` starts at 80;
- outside the closest range it loses up to 70 points, with a floor of 10;
- measured flow with no range, or stage without flow, starts at 50;
- temperature adds 10 at 6–20 °C, adds 0 at 2–6 or 20–24 °C, subtracts 15 below
  2 °C, and subtracts 30 above 24 °C;
- the result is clamped to 0–100.

Those temperature words explicitly say “trout,” but the snapshot builder invokes the
function for all 148 waters. UI adapters now suppress many inapplicable presentations, yet
the value still exists, affects some ordering and static pages, and is presented wholesale
by the marketing site. The 92 `idealFlow` ranges have no field-level citation or method in
the schema: a water's generic official links do not prove a particular numeric range. An
arbitrary range and an arbitrary universal curve therefore dominate the score.

### Fishability v2

`SpeciesKeySchema` contains only largemouth bass, smallmouth bass, spotted bass, crappie,
bluegill, channel catfish, and striped bass. It contains no rainbow, brown, brook, cutbow,
or lake trout keys. That directly collides with “per-species” plus a default Trout lens:
the new model cannot produce a trout-species score.

Only 39 waters have `targetSpecies`; 109 cannot emit a fishability file. Distribution:

| Target species | Waters |
|---|---:|
| Smallmouth bass | 36 |
| Bluegill | 30 |
| Crappie | 29 |
| Largemouth bass | 29 |
| Channel catfish | 28 |
| Spotted bass | 27 |
| Striped bass | 17 |

The 39 consist of 24 waters whose broad `species` remains absent, nine broad trout waters
with a warmwater target too, and six broad warmwater waters. Two broad warmwater rivers have
no `targetSpecies`. The Stage 5 Session B report says “50 waters authored”; code and the
current worklist say 39.

Only largemouth, smallmouth, and striped bass have complete optimal/avoidance/lethal
high-side entries that `bandsFromReference` can convert. The other four of seven emit
`assessed:false` even if temperature exists. No species has sourced cold-side thresholds.
`scoreFishability` returns only 90 inside optimal, 40 anywhere outside optimal but below
lethal, and 0 at lethal. Although the contract carries `avoidanceHigh`, the scorer does not
assign a distinct avoidance zone; values just above optimum and just below lethal are both
40. Flow is deliberately excluded.

This is a thermal-screening indicator, not a general fishability score. Federal Habitat
Suitability Index literature treats temperature, dissolved oxygen, flow/velocity, cover,
turbidity, drawdown, and life stage as different variables and warns that models vary by
habitat and geography. Useful starting points include the official models for
[smallmouth bass](https://pubs.usgs.gov/publication/fwsobs82_10_36),
[largemouth bass](https://pubs.usgs.gov/publication/fwsobs82_10_16),
[spotted bass](https://pubs.usgs.gov/publication/fwsobs82_10_72),
[bluegill](https://pubs.usgs.gov/publication/fwsobs82_10_8),
[channel catfish](https://pubs.usgs.gov/publication/fwsobs82_10_2),
[inland striped bass](https://pubs.usgs.gov/publication/fwsobs82_10_85),
[brook trout](https://pubs.usgs.gov/publication/fwsobs82_10_24), and
[rainbow trout](https://pubs.usgs.gov/publication/fwsobs82_10_60). These are research
leads, not permission to copy coefficients without Tennessee validation.

### Activity outlook

The emitted components are water temperature, optional spawn state, and optional area
pressure. No `flow-trend` component is constructed even though the contract, worklist, and
marketing page say it is a factor.

- Temperature simply reuses the 0/40/90 comfort value.
- Spawn state applies the same unsourced 4 °C shoulder to every species and maps pre-spawn
  to 80, spawning to 50, and post-spawn to 30. Several spawn citations are retailer or
  outfitter pages, not primary studies or fisheries agencies.
- Pressure maps `deltaHpa` to `50 - 10 × deltaHpa`, regardless of species. The canonical
  species reference marks every pressure preference `needs-source`, but the emitted row is
  labeled `derived`, not heuristic. An available freshwater feeding experiment found no
  significant pressure effect in its yellow-perch trials; it does not support this generic
  transformation ([VanderWeyst 2014](https://pines.bemidjistate.edu/j-earth-life-sci/50/)).
- `RainContextNote` interprets materially low pressure as likely rain even though no NWS
  precipitation is ingested. The worklist and marketing copy say the note comes from NWS
  precipitation. Code uses pressure only.

This is the sharpest collision with the attribution culture. An official NWS pressure
reading proves pressure, not the biological sign, magnitude, or species response applied to
it.

### Recommended score semantics

Honor the owner's per-species decision, but stop treating 0–100 as a bite forecast. The
campaign should design these separate results:

1. **Applicability:** species presence and current season are verified for this water/reach.
2. **Access/safety:** release, stage, flow, rate of change, and source warnings; this must
   never be averaged away by a pleasant temperature.
3. **Species habitat suitability now:** habitat-specific, source-backed suitability curves
   over metrics actually measured at a representative point.
4. **Context:** spawn, weather, recent rain, fishing reports, and dawn/dusk may be shown as
   sourced context until a species-specific validated relationship exists.
5. **Coverage/confidence:** metric freshness, spatial representativeness, model evidence,
   and source status displayed independently from the score.

Streams/tailwaters and stratified lakes require different models. A single surface or
tailwater temperature cannot describe a reservoir's vertical habitat. In particular,
temperature and dissolved oxygen jointly constrain coldwater reservoir habitat; one
published lake-trout evaluation found combined temperature/DO criteria matched observed use
better than temperature alone ([USGS publication record](https://www.usgs.gov/publications/performance-temperature-and-dissolved-oxygen-criteria-predict-habitat-use-lake-trout)).
Where the necessary inputs do not exist, “not assessed” is the correct result.

## Why waters become unassessed—or incorrectly assessed

The current causes are cumulative:

1. **No configured gauge:** 100 of 148 waters have no `gaugeIds`.
2. **Configured ID without a current series:** a configured ID proves neither a current
   instrument nor the requested parameter.
3. **Temperature scarcity:** the new comfort score requires a fresh temperature; flow and
   stage cannot substitute.
4. **No `targetSpecies`:** 109 waters emit no fishability file.
5. **Incomplete bands:** four of seven warmwater keys cannot be scored even when a water and
   temperature are present.
6. **No focus species:** All-fish mode without a chosen focus has no fishability metric.
7. **Focus propagation defect:** `FishabilityCard.tsx` reads only the `?focus=` query value,
   while the map, Conditions, and Browse fall back to persisted `settings.speciesFocus`.
   A detail page opened without that query can therefore hide a valid card.
8. **Season policy:** 72 waters are `yearRound:false`, but no authored month windows exist;
   `waterDecision.ts` assumes November–March for all of them.

Conversely, some waters can look assessed when they should not. `scoreConditions` performs
no absolute-age check. `latestReadings()` selects the newest stored row per gauge;
`runGaugesJob()` keeps raw rows for 90 days and does not invalidate the previous row when a
site returns no current value. A stopped sensor can therefore retain a score for weeks while
the overall gauges job remains healthy and the snapshot receives a new `fetchedAt` and
future `nextExpectedUpdate`. The freshness chip may say stale while map/list status still
uses the score. T1-6 fixed cross-parameter timestamp laundering; it did not fix this
whole-reading freshness gate.

## Gauge and source coverage at this revision

### Authored monitor wiring

| Layer | Verified wiring |
|---|---:|
| Waters with any `gaugeIds` | 48 |
| Numeric USGS IDs | 50 unique, on all 48 gauged waters |
| TVA namespaced IDs in YAML | 10 waters |
| USACE namespaced IDs in YAML | 3 waters |
| Total assignments / unique identifiers | 72 / 63 |
| Trout waters with / without a configured gauge | 35 / 68 |
| Unknown-species waters with a gauge | 10 |
| `targetSpecies` waters with a gauge | 11 |

The evidence registry separately defines 15 TVA reservoir monitors and 12 TVA tailwater
monitors. Reservoir observations are evidence only—level and discharge do not enter lake
fishability. The conditions bridge fetches all 12 TVA tailwaters, although only ten TVA IDs
are consumed by YAML; Caney Fork and Obey use the better USACE rows instead.

USACE has four hardcoded Nashville District tailwater sets with flow, stage, and temperature:
Center Hill, Dale Hollow, J. Percy Priest, and Cordell Hull. Only the first three are wired
to a catalog water; Cordell Hull is kept as coverage-only because one upstream dam cannot
represent the catalog's full Cumberland River geometry.

### Point-in-time USGS probe

A single official batch request for the 50 configured numeric IDs and parameter codes 00010,
00060, and 00065 returned 84 series on 2026-09-13:

- 38 of 50 sites returned any requested series;
- 37 returned discharge, 36 stage, and 11 a temperature series;
- only seven temperature series had an observation within roughly three hours;
- temperature series for Harpeth at Franklin and two Duck River gauges ended in 2014,
  2012, and 2009; Clear Creek's temperature was roughly three days old;
- Parksville and lower Hiwassee returned historical flow ending in 1994 and 2018;
  Obed's last series value was from July 2026 and currently carried a missing sentinel;
- Nolichucky and Doe returned missing discharge sentinels while stage remained present.

This is why `verified-gauges.json` is not a coverage result: it says `realTimeIV:true` for
all 50 IDs but records no parameter or latest-observation health. The partial
`USGS_GAUGE_HEALTH` map contains only 16 exceptions/examples and is already stale relative
to the live query.

USGS now directs clients to its modernized APIs. The repo still calls legacy
`waterservices.usgs.gov`; USGS says that family will be decommissioned in early 2027 and
announced the V1 modernized API on 2026-09-04. Migration belongs in this campaign
([official API overview](https://www.usgs.gov/tools/usgs-water-data-apis),
[migration guide](https://api.waterdata.usgs.gov/docs/ogcapi/migration/),
[V1 announcement](https://waterdata.usgs.gov/blog/api-v1-release/)).

### Point-in-time TVA/USACE probes and source opportunities

The TVA observed-data endpoint still returned current South Holston reservoir elevation,
tailwater elevation, and hourly discharge. It returns no water temperature. The official
TVA page warns that release schedules can change without notice and states that levels and
schedules update periodically ([TVA Cherokee example](https://www.tva.com/Environment/Lake-Levels/Cherokee)).

All four hardcoded USACE tailwater temperature series returned current values in a
2026-09-13 probe. The public A2W detail page also exposes dissolved oxygen for Cordell Hull,
which the current contract/provider ignores
([official Cordell Hull page](https://water.usace.army.mil/overview/lrn/locations/cort1)).
The campaign should enumerate A2W's Tennessee/LRN station catalog instead of assuming the
four hardcoded IDs are exhaustive.

Periodic—not live—temperature, DO, turbidity, and other samples are available through
TDEC monitoring and the EPA/USGS Water Quality Portal. They can support baselines and model
validation, not masquerade as “now”
([TDEC monitoring](https://www.tn.gov/environment/program-areas/wr-water-resources/watershed-stewardship/tennessee-watersheds/water-quality-monitoring.html),
[EPA WQP overview](https://www.epa.gov/waterdata/water-quality-data-download)).

The checked-in `docs/data-source-coverage.json` was generated 2026-09-08 and contains 147
waters, while the catalog has 148. Its headline counts are therefore historical evidence,
not current coverage: 54 with a live monitor, 48 with a USGS assignment, 27 TVA monitor
mappings, 4 USACE mappings, 81 resolved stocking aliases, and 55 distinct unresolved TWRA
names. Regeneration and drift tests are needed.

## Species honesty

The broad `species` field is a product-program label, while `targetSpecies` is the seven-key
warmwater list. Their overlapping names but different semantics make contradictory-looking
records inevitable: 24 waters have detailed targets but still display “Unverified” because
the broad field is absent; nine trout waters also have warmwater targets; and two warmwater
rivers have no detailed targets.

The F3 validation gate is weaker than its name. For each target key, it accepts the species
word in free-form notes or in applied regulation text. It does not require an evidence
record binding species, water/reach, source URL, retrieval date, evidence type, and reviewer.
Generic official links also cannot prove `species`, `fishery`, `yearRound`, `idealFlow`, or
each target independently.

The official TWRA 2026 warmwater stocking report is a high-value missing pipeline input: it
names water body, species, quantity, and date for numerous catalog reservoirs
([TWRA warmwater stockings](https://www.tn.gov/twra/fishing/warmwater-stockings.html)).
Regulations and “where to fish” pages can corroborate established fisheries, while stocking
proves only the stocked species/event, not the complete assemblage. Trout stocking evidence
likewise proves a species and scheduled/reported event, not year-round viability or exact
reach without matching details.

The fix is a typed evidence ledger, not another round of notes. Each asserted species must
resolve to a water/reach and carry source, observed/published/retrieved dates, evidence kind,
and confidence. UI should say “Species not yet verified” only when no applicable assertion
exists; it should not ignore a more specific verified assertion because a legacy broad field
is blank.

## Sitewide UI and content-claim gaps

The F6 implementation is partial despite the completed checkbox, and T1-22 remains open:

- the header and Settings persist a sitewide mode;
- map, Conditions, and Browse change metric wording, but Conditions and Browse do not
  actually filter their rows by mode;
- Stocking reads settings into an unused variable and remains trout-only;
- detail/drawer `FishabilityCard` ignores persisted focus unless `?focus=` is present;
- detail links do not establish a canonical focus context;
- the all-fish map fetches one per-water JSON file for every water that lists the focus,
  with a pool of six and a second pass on misses. That is up to 36 independent files per
  focus and conflates “404 by design” with transient failure.

Marketing is materially ahead of reality:

- every one of the 148 stream pages is titled “fly fishing” and includes a regional hatch
  section, even for warmwater lakes and unverified waters;
- the state index calls all 148 “trout streams” and displays any snapshot's generic score;
- per-water pages say ideal-flow ranges are “verified per source,” but the schema has no
  field-level provenance;
- the methodology page says all authored numbers are cited, `flow-trend` is scored, and the
  rain note comes from NWS precipitation; none is true in the current implementation;
- it says the evidence feed is “the same feed the app reads,” while T2-25 accurately notes
  that no web/admin/marketing consumer reads it;
- `ConditionsEmbed` builds a USGS URL from the first arbitrary gauge ID, including dead
  numeric IDs or namespaced TVA/USACE IDs.

These are not cosmetic. Search engines and first-time visitors receive the static pages as
the product's factual claims.

## Reconciliation with the worklist

| Existing ID | Audit conclusion |
|---|---|
| T1-6 | Cross-metric freshness was fixed; absolute whole-reading expiry remains untracked. |
| T1-18/T1-19 | Season is consumed, but a universal Nov–Mar assumption replaces missing per-water windows. |
| T1-22 | Correctly remains open; F6 did not complete sitewide filtering or focus propagation. |
| T2-20/T2-21 | Still required for season-aware stocking and prominent structured season copy. |
| T2-25/T2-54 | The endpoint policy is decided, but marketing falsely calls it an app-consumed feed. |
| T2-28 | The transition is incomplete: only 39 target waters and three scoreable species. |
| T3-50 | The Mill Creek/03539778 mis-anchor remains relevant; the live probe confirms that ID is Clear Creek. |
| T3-51/T3-52/T3-53 | Retain as catalog/geometry/stocking-map backlog; do not mix candidate additions with display cleanup. |
| F1–F6/F8–F12 | “Done” records shipped structure, not scientific/data completeness; several acceptance claims are contradicted above. |
| F7 | Must expand beyond privacy/offline to parity, freshness, applicability, and marketing-truth tests. |

Proposed new stable findings for the campaign to add to `KNOWN-ISSUES.md` only after
reverification:

- **OA-01 — Absolute reading freshness:** stale stored readings can keep an assessed score.
- **OA-02 — Score validity:** universal ideal-flow and activity transformations lack
  field/species evidence.
- **OA-03 — Trout species omission:** the v2 species contract cannot satisfy its default
  trout lens.
- **OA-04 — Map display tiers:** all catalog geometry doubles as interactive product
  inventory; bbox extent is not editorial prominence.
- **OA-05 — F6 parity:** row filtering, focus propagation, stocking, detail, and static
  surfaces disagree.
- **OA-06 — Marketing overclaims:** static pages publish trout/fly/score/source claims on
  inapplicable waters.
- **OA-07 — Coverage drift:** generated evidence artifacts and gauge-health assertions are
  stale/incomplete.
- **OA-08 — USGS migration:** legacy WaterServices has a near-term retirement path.
- **OA-09 — Field-level provenance:** numbers and species assertions are not tied to typed
  evidence.
- **OA-10 — Fishability snapshot fan-out:** the per-water fetch/index design needs an
  offline/performance/error-semantics review.

## Campaign rationale

The work is split into three fresh sessions because the failure modes are different and a
single less-capable executor is likely to collapse them into one “add more gauges” task.

**Session 1 — code and product ground truth** must reproduce every count, trace every
applicability/freshness path, and build the 148-water technical inventory. Its primary
failure mode is trusting completed checkboxes or historical reports over current code.

**Session 2 — external evidence and coverage** must verify official live/periodic sources,
species assertions, and scientific models, then assign evidence and acquisition recipes per
water. Its primary failure modes are using search snippets as evidence, treating a station
as representative without reach/depth analysis, and turning episodic samples or modeled
values into live observations.

**Session 3 — synthesis and implementation plan** must reconcile both reports into the one
self-contained brief an implementing model receives. It must decide display behavior for
all 148 waters, assign sources and score eligibility per water/species, redesign the model
around data reality, list file-level phases, and give executable tests and acceptance
criteria. Its failure modes are leaving decisions as prose, silently changing owner policy,
or planning a score that most displayed waters cannot honestly compute.

Sessions chain only through deterministic report files. Each uses multiple bounded
subagents for coverage, but the parent session must verify every included claim. Research
and planning sessions remain report-only; implementation starts only after the final plan
is accepted.
