# River hydrography, identity, and map-quality implementation plan

Date: 2026-09-16  
Executor: GPT-5.6 Luna  
Execution model: two sequential sessions, each in its own clone and branch  
Purpose: replace the unsafe September river repair with source-traceable NHD geometry, distinguish same-name waters, and make zoom reveal and detailed-water loading smooth.

This is an implementation brief, not proof that the work is already complete. The executor must inspect the current `origin/main`, implement the changes, run the listed checks, and provide the evidence requested below.

## Outcome required

When both sessions are complete:

1. Selectable river and creek lines follow real USGS NHD/NHDPlus HR reaches. A missing named reach may be continued through an unnamed or differently named NHD reach only when the directed NHD topology proves that it is the same path. No long straight connector may be invented.
2. The Forked Deer and Obion systems no longer contain artificial jumps, out-and-back lines, incorrect branches, missing selectable sections, or context-layer twins.
3. Same-name waters are separate identities. The two stocked Tennessee Cane Creeks are separate records, geometries, search results, deep links, and stocking destinations.
4. Statewide view shows only featured waters. Standard waters fade in at regional zoom and reference/local waters fade in near local zoom. A selected deep-linked water remains visible at every zoom.
5. Zooming and panning do not loop over every catalog water, repeatedly add/remove the same network data, or visibly create river “shadows.”
6. The detailed NHD creek network remains a context layer, not a selectable duplicate of catalog waters.

## Important facts already verified

Do not rediscover or reinterpret these as optional:

- `packages/content/scripts/wave-ledgers/stitch-geometry.mjs` contains `bridgeChains(..., maxBridgeKm = 30)`. It joins disconnected chains with a direct straight line. Those connectors are not NHD geometry.
- The same script selects network segments by lowercased name plus a broad envelope. That is not a water identity and can combine unrelated same-name reaches or side branches.
- It replaces geometry without replacing the old `sourceIds`, so the committed provenance can describe different reaches than the coordinates actually displayed.
- `middle-fork-forked-deer-river` and `north-fork-forked-deer-river` currently carry `bridgedSegments: 1`. These are not acceptable final features.
- The current context-network deduplication in `networkClusters.ts` is by lowercased water name. This hides unrelated same-name creeks statewide and is the wrong fix for doubled lines.
- `cane-creek.yaml` claims one record covers Bledsoe/Van Buren and Hickman/Perry. The current atlas geometry covers only the eastern Cane Creek in the Caney Fork system.
- The eastern Cane Creek is GNIS `01279516`, HUC8 `05130108`.
- The Hickman/Perry Cane Creek is GNIS `01307376`, HUC8 `06040004`. Verify its directed receiving water from NHD before writing the final label; the expected basin is the Buffalo River system.
- Current zoom reveal calls `applyRef.current()` on every `zoomend`, rewriting feature state for the entire catalog. The detailed-network loader serializes every `moveend` through an ever-growing promise queue. Both contribute to clunky interaction.

## Terms Luna must use consistently

- **Catalog water**: one selectable product record and deep-link ID.
- **Named feature identity**: GNIS identity. A name alone is not an identity.
- **NHD reach**: one source flowline identified by `permanent_identifier`; keep this distinct from an NHDPlus ID if both exist.
- **Water path**: the directed, hydrologically connected reaches intentionally represented by one catalog water.
- **Context network**: non-selectable detailed NHD lines loaded near local zoom.
- **Display tier**: `featured`, `standard`, or `reference`; it controls when a catalog water becomes visible, not whether it is selectable through search or a deep link.
- **Weld**: joining source reach endpoints that already meet within a small coordinate tolerance. A weld is not permission to draw across a gap.
- **Synthetic bridge**: a segment with no source flowline. Synthetic bridges are prohibited.

## Global rules for both sessions

1. Read `AGENTS.md`, `README.md`, `docs/INDEX.md`, `docs/KNOWN-ISSUES.md`, `docs/atlas-sources.md`, `docs/atlas-validation.md`, and `docs/flow-orientation.md` before editing.
2. Never work in `C:\Users\Benjamin\Projects\trout`; it is a shared checkout. Make the session-specific clone described below.
3. Start from freshly fetched `origin/main`. Record the starting SHA in the final handoff.
4. Before every edit, run `git status --short` and re-read the file. If unexplained changes appear, stop and report them.
5. Do not deploy, run production scripts, or commit secrets.
6. Do not use Census TIGER to silently replace NHD. TIGER may be a comparison source. A final line may use it only as a documented exception after proving NHD has no adequate reach.
7. Do not “fix” a gap by drawing a straight coordinate pair, increasing a distance tolerance, or concatenating the nearest endpoints.
8. Do not use stream name, bounding-box overlap, or nearest geometry as the sole identity rule.
9. All generated files must be reproducible. Run the generator twice and require a clean `git status` after the second run.
10. Update `docs/KNOWN-ISSUES.md` with the new hydrography issues if they are not already recorded. Mark an item complete only after its acceptance checks pass.

## Conservative Sol delegation rule

Luna owns the implementation, review, integration, testing, and Git history. If Luna becomes stuck on one bounded question, it may create one GPT-5.6 Sol subagent at a time.

Good delegated tasks:

- Read-only: identify the directed NHD reach chain, GNIS ID, HUC, and receiving water for one named water. Return source IDs and reasoning; make no edits.
- Read-only: inspect a MapLibre expression or loader algorithm for style-spec legality and likely performance problems.
- Isolated test work: add tests in a file Luna is not editing, after Luna gives an exact contract.

Do not delegate broad “fix the rivers” work, final validation, Git operations, or two agents editing the same file. Luna must inspect every subagent result and rerun the checks itself.

---

# Session 1 — authoritative water identity and NHD geometry

## Session 1 branch and boundary

Create a new clone such as:

```powershell
Set-Location C:\Users\Benjamin\Projects
git clone git@github.com:Bchodges42/TroutSite.git trout-luna-hydro-identity
Set-Location C:\Users\Benjamin\Projects\trout-luna-hydro-identity
git fetch origin
git switch -c luna/river-hydro-identity origin/main
git config --global user.name "Bhodges42"
git status --short --branch
```

This session owns source identity, catalog splitting, geometry generation, provenance, and static validation. It must not redesign map rendering or tune interaction performance; that belongs to Session 2.

## Step 1. Establish and save the baseline

Run the following before changing code. Save the output summary in the eventual handoff.

```powershell
pnpm install --frozen-lockfile
pnpm validate:content
pnpm --filter @trout/web test
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
pnpm --filter @trout/web build
```

Inspect these files before designing the replacement:

- `packages/content/scripts/wave-ledgers/stitch-geometry.mjs`
- `apps/web/scripts/build-selectable-river-additions.mjs`
- `scripts/nhd_trace_catalog.mjs`
- `apps/web/scripts/trace-west/lib.mjs`
- `apps/web/scripts/trace-west/trace-west.mjs`
- `data/nhd/hu8/*.jsonl`
- `data/nhd/hu8/*.vaa.jsonl`
- `apps/web/atlas-sources/selectable-river-additions.json`
- `apps/web/public/atlas/rivers.geojson`
- `apps/web/atlas-sources/verified/west-middle.topology.json`

Reuse the existing topology helpers where they are sound. Do not add another unrelated stitching algorithm.

## Step 2. Define one small, explicit identity record

Add one optional contract field to `StreamSchema`, named `hydroIdentity`, with this shape:

```ts
{
  gnisIds: string[];        // eight-character strings; usually exactly one
  huc8s: string[];          // eight-character strings
  counties: string[];       // display names without the word "County"
  receivingWater?: string;  // verified downstream named water, when known
}
```

Rules:

- Arrays must be non-empty when `hydroIdentity` exists and must reject duplicates.
- Preserve leading zeroes in GNIS and HUC values by storing strings.
- Do not put thousands of reach IDs in YAML. Reach IDs belong to atlas provenance.
- Do not require this field for ponds or records that genuinely lack a GNIS identity.
- Persist the field through the content pack, SQLite seed/migration, `/v1/streams`, and generated fallback snapshots. Follow the existing `aliases`/`display` path rather than inventing a second API.
- Add contract, content-validation, database seed, migration, and snapshot tests.

Add one unified reviewed source file, `apps/web/atlas-sources/selectable-water-identities.json`. For every selectable line water it must record:

```json
{
  "id": "example-id",
  "gnisIds": ["01234567"],
  "huc8s": ["05130108"],
  "seedPermanentIdentifiers": ["..."],
  "allowedNameChanges": [],
  "upstreamBoundary": null,
  "downstreamBoundary": "mouth",
  "receivingWater": "Example River",
  "counties": ["Example"],
  "reviewNote": "why this is one water path"
}
```

The file is the reviewed selection recipe, not a dump of every NHD field. Generate obvious values where possible, then review all ambiguous and repeated-name records manually.

## Step 3. Add a statewide identity audit

Create `apps/web/scripts/audit-water-identities.mjs`. It must read the catalog, the reviewed identity file, the atlas, and raw NHD files and fail when any of these are true:

- one catalog line water lacks a reviewed identity record;
- a declared GNIS or HUC is not present in the emitted source reaches;
- two catalog waters claim the same NHD permanent reach, unless a reviewed handoff exception explicitly permits it;
- a catalog water contains multiple disconnected GNIS identities without an explicit reviewed reason;
- a repeated human name is being treated as unique without GNIS/HUC/topology qualification;
- emitted `nhdPermanentIds` do not exactly equal the reaches used to build the geometry;
- `bridgedSegments`, a synthetic connector flag, or the September `nhd-network-stitch` source string remains;
- a coordinate is non-finite or outside the atlas bounds.

The audit may report additional same-name NHD features, but it must not demand that every same-name creek become selectable. Its purpose is to prevent identity collisions among catalog waters.

Add this audit to a normal test or validation command so it cannot be skipped accidentally.

## Step 4. Replace the unsafe repair with a topology-driven builder

Retire the behavior in `stitch-geometry.mjs`. Either delete the script after moving needed sanitization into the canonical builder, or make it exit with a clear deprecation message. No production path may call `bridgeChains`.

Implement one deterministic builder for selectable line geometry. It must:

1. Load raw NHD flowlines by `permanent_identifier` and join VAA rows by that exact identifier.
2. Start from reviewed seed reaches in `selectable-water-identities.json`.
3. Traverse directed topology using `hydroseq`/downstream relationships when populated.
4. If VAA is absent, use exact or small-tolerance shared endpoints only. The maximum weld tolerance is 15 metres. If a larger gap remains, fail and require review.
5. Follow an unnamed/artificial-path or differently named reach only when it is the directed continuation between reviewed source reaches. Record that reach’s ID and name status in provenance.
6. Prefer the reviewed main level path/main path for a main-stem catalog water. Do not concatenate side branches end-to-end. Legitimate attached braids may remain separate `MultiLineString` parts.
7. Preserve source reach orientation, then simplify only after the directed chain is correct. Preserve endpoints during simplification.
8. Emit `nhdPermanentIds`, any available `nhdPlusIds`, `gnisIds`, `huc8s`, source retrieval date, part count, vertex count, bounds, length, and a short trace summary.
9. Never copy old provenance onto replacement coordinates.
10. Produce byte-for-byte stable output on a second run.

NHD is the canonical source for selectable river/creek lines and the detailed context network. NHD waterbody polygons remain canonical for lakes/reservoirs. Point ponds remain points. Existing verified non-NHD line exceptions may remain only in a small explicit exception list containing the reason NHD is insufficient; do not describe those exceptions as NHD.

Do not blindly rebuild verified features that already have correct NHD lineage. Inventory all line features, then rebuild:

- every feature created by the 40-water selectable expansion;
- the Forked Deer and Obion systems;
- every feature carrying `bridgedSegments` or `nhd-network-stitch`;
- every line lacking exact NHD permanent-reach provenance;
- every line that fails continuity, self-crossing, duplicate-reach, or source-conformance gates;
- any remaining TIGER-derived selectable line for which NHD geometry is available.

## Step 5. Repair the named West Tennessee systems

Review these as a group, not as isolated names:

- `forked-deer-river`
- `north-fork-forked-deer-river`
- `middle-fork-forked-deer-river`
- `south-fork-forked-deer-river`
- `obion-river`
- `north-fork-obion-river`
- `middle-fork-obion-river`
- `south-fork-obion-river`
- `rutherford-fork-obion-river`

For every feature, pin the GNIS identity and outlet/main-path seed. Trace from the graph. Do not collect every segment with the same name inside an envelope. Specifically verify that the North Fork Forked Deer has no backward segment, straight cross-country connector, side-branch concatenation, or duplicated reach. Specifically verify that the Middle Fork no longer relies on the 12.4 km synthetic bridge.

If NHD itself has separate legitimate components, leave them separate and document the source limitation. Do not turn a truthful source gap into a false continuous line.

## Step 6. Split the two stocked Cane Creeks

Keep the existing ID `cane-creek` for backward compatibility, but narrow it to the current eastern identity:

- catalog name: `Cane Creek (Caney Fork system · Bledsoe–Van Buren)`;
- GNIS `01279516`;
- HUC8 `05130108`;
- notes and aliases must describe only this water;
- preserve its current eastern geometry only after rebuilding/validating it from NHD.

Add `cane-creek-hickman-perry`:

- catalog name: `Cane Creek (Buffalo River system · Hickman–Perry)` only after the NHD downstream trace confirms Buffalo River; otherwise use the verified receiver;
- GNIS `01307376`;
- HUC8 `06040004`;
- region `tn-middle-duck-elk` unless the existing region registry provides a more accurate current region;
- separate NHD geometry, deep link, river-index entry, search result, and map feature.

Update all dependent content:

- Point Hickman and Perry TWRA aliases to `cane-creek-hickman-perry`.
- Point Bledsoe and Van Buren Cane Creek rows to `cane-creek`.
- A county-less `Cane Creek` row must remain ambiguous; never guess.
- Split any stocking calendar or evidence data that currently assumes one `cane-creek` record.
- Search should find both results and show their qualifiers. Map labels may show only `Cane Creek` when collision-free on screen, but drawer/detail/search accessibility text must retain the complete identity.

Expected catalog/atlas/index count after this split is the baseline count plus one. At the 189-water baseline this is 190. Do not force the number 190 if `origin/main` has legitimately changed; instead assert the one-to-one joins and record the resulting count.

## Step 7. Geometry and identity regression tests

Add tests that prove behavior, not just file presence:

- East and west Cane Creek have distinct IDs, GNIS IDs, HUCs, bounds, source reaches, and county-based stocking matches.
- Both search results are visible for `Cane Creek`.
- County-less Cane Creek stocking stays unresolved.
- No output feature contains a non-finite vertex.
- No selectable line contains a synthetic connector or a weld over 15 m.
- Every emitted reach ID exists in raw NHD data.
- No reach is owned by two catalog lines without an explicit handoff exception.
- Source geometry and delivered geometry stay within the documented simplification tolerance.
- Forked Deer/Obion target features use directed paths and have no unexplained component gap.
- Regenerating the atlas and river index twice produces no diff.

Run at minimum:

```powershell
pnpm validate:content
pnpm --filter @trout/contracts test
pnpm --filter @trout/api test
pnpm --filter @trout/web test
node apps/web/scripts/audit-water-identities.mjs
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
node apps/web/scripts/integrate-verified-atlas.mjs --dry-run
pnpm --filter @trout/web build
git status --short
```

## Session 1 completion and handoff

Make focused commits; a reasonable split is:

1. contract/persistence and identity audit;
2. topology builder and geometry regeneration;
3. Cane Creek split and stocking/search corrections;
4. tests and documentation.

Push after each meaningful commit. In the final handoff report:

- starting SHA and ending SHA;
- branch name and push confirmation;
- exact waters rebuilt;
- any explicit non-NHD exceptions;
- before/after part count, length, and largest unexplained gap for each West Tennessee target;
- the two Cane Creek identities and their verified receiving waters;
- full commands and pass/fail results;
- `git status --short` output;
- anything still uncertain.

Do not claim “all rivers are correct” from green tests alone. Session 1 is complete only after the owner merges it or explicitly supplies its remote commit as Session 2’s base.

---

# Session 2 — smooth zoom reveal, exact deduplication, and interaction QA

## Session 2 branch and boundary

Start only after Session 1 is merged to `origin/main`. Create a different clone:

```powershell
Set-Location C:\Users\Benjamin\Projects
git clone git@github.com:Bchodges42/TroutSite.git trout-luna-map-quality
Set-Location C:\Users\Benjamin\Projects\trout-luna-map-quality
git fetch origin
git switch -c luna/river-map-quality origin/main
git config --global user.name "Bhodges42"
git status --short --branch
```

Confirm the Session 1 ending commit is an ancestor of `HEAD`. If it is not, stop. Do not silently reimplement Session 1 or cherry-pick it without owner direction.

This session owns map style, visibility, hit testing, detailed-network loading, performance, browser verification, and screenshots. It must not change river geometry except to report a newly observed Session 1 defect.

## Step 1. Use reach IDs for context deduplication

Delete name-based catalog deduplication:

- remove `setCatalogWaterNames` and the lowercased-name filter;
- collect catalog `nhdPermanentIds` from the loaded atlas/index;
- remove a context-network feature only when its `pid` is one of those exact catalog reach IDs;
- an unrelated feature with the same name must remain visible;
- unnamed/artificial reaches used by a catalog line must also be removed from context by PID.

Add unit tests:

1. matching PID is removed;
2. same name with a different PID remains;
3. different name with a matching PID is removed;
4. missing PID fails open and remains visible rather than deleting by name.

This removes true catalog/context twins without erasing every other Cane Creek, Mill Creek, or Indian Creek.

## Step 2. Unify display-tier data

Generate a `displayTier` property for every catalog atlas feature from the catalog `display` field. Keep `labelMinZoom` only for label placement if it is still useful; do not let it be a second visibility authority.

Use these reveal bands:

- `featured`: visible at statewide zoom;
- `standard`: fade from hidden to visible between zoom 7.2 and 7.8;
- `reference`: fade from hidden to visible between zoom 9.0 and 9.6;
- detailed context network: begin loading just before 9.4 and fade in from 9.6 to 10.2.

Small threshold adjustments are allowed after browser review, but keep one exported constants object and test it. Do not scatter magic zoom numbers.

## Step 3. Remove the per-zoom feature-state rewrite

`TennesseeMap` must not call the all-feature presentation loop on `zoomend`.

Implement zoom visibility in the style using one legal, top-level zoom `step` or `interpolate` expression whose outputs inspect `displayTier`. Validate the expression with the real MapLibre version in the repository. Do not nest a zoom expression inside `case`, because that previously blanked the entire style.

Separate concerns:

- species/filter visibility may remain feature state;
- selection/hover may remain feature state;
- display-tier visibility must come from the static feature property plus zoom expression;
- dedicated selection layers must ignore the tier threshold so a searched or deep-linked water is always shown;
- hit layers must use the same currently allowed tiers, updated with one cheap layer-filter change when a threshold is crossed—not 190 feature-state writes.

Use a short opacity transition, approximately 180–250 ms. With reduced motion enabled, use no transition. Waters should fade once, not flash, double, or momentarily acquire a shadow.

Add a development metric under the existing dev inspection seam. It should count style/filter mutations caused by one zoom transition. A zoom crossing one tier threshold must perform a small constant number of mutations, not one per catalog water.

## Step 4. Make network cluster loading latest-only

Replace the unbounded promise queue in `networkClusters.ts` with a latest-request-wins scheduler:

- while one sync is running, retain only one dirty/latest viewport request;
- fetch all newly needed clusters for the latest viewport in parallel with a small bound if necessary;
- before adding a fetched source, confirm the map is alive, style generation is current, and the cluster still belongs to the latest padded viewport;
- keep each cluster response cached once per page session;
- use hysteresis: load against roughly 25% viewport padding, but do not release until outside roughly 75% padding;
- keep a small bounded number of recently used loaded clusters (for example 6) so a short pan back does not churn MapLibre sources;
- style changes must invalidate MapLibre source/layer bookkeeping without refetching cached bytes.

Expose dev-only counters for fetches, additions, removals, stale results ignored, and currently loaded cluster IDs. Do not add analytics or production logging.

Unit-test rapid move sequences, style reload during fetch, disposal during fetch, cache reuse, same-cluster fetch-once behavior, and the loaded-cluster bound.

## Step 5. Stabilize river appearance

Audit the line stack in `mapStyle.ts` at zooms 5.6, 7.5, 9.5, 10.5, and 12.

Required behavior:

- an ordinary unselected river has one water corridor and, when applicable, one interior status treatment;
- casing is visible only for hover or selection;
- no-data dashes do not change phase or appear to slide during zoom;
- fishery-class outline does not resemble a second displaced river; suppress it at statewide zoom if needed;
- a catalog river and its context copy never draw together for the same NHD reach;
- selection remains clear but does not obscure parallel forks;
- no layer gains or loses opacity because of stale feature state after a style swap.

Do not hide a geometry defect with a wider stroke or an opaque casing. If a line is wrong, report it back to Session 1’s geometry work.

## Step 6. Make overlapping-water selection deterministic

Extract the line-distance and tie-breaking logic from `TennesseeMap` into a pure tested helper.

Rules:

- hidden-by-species or hidden-by-tier features cannot win;
- nearest visible centerline wins normally;
- at an actual confluence/overlap, a near tie may prefer the longer/main-stem water, but only inside a small documented pixel tolerance;
- points and polygons keep their own hit behavior;
- do not use vertex count as importance;
- selecting Obion at ordinary non-confluence points must always open Obion, not one of its forks.

Add cases for Obion/forks, Forked Deer/forks, two parallel lines, a crossing, a polygon plus line, and a hidden local water.

## Step 7. Browser and performance verification

Extend `e2e/web/atlas-verify.spec.ts` or add a focused map spec. Use the real fixture build and MapLibre canvas.

Automated scenarios:

1. Statewide zoom: only featured catalog tiers render; no context-network source is loaded.
2. Regional zoom near West Tennessee: standard waters fade in; no style-spec error or blank map.
3. Local zoom: reference waters and the detailed network appear; catalog/context duplicate PIDs do not.
4. Zoom repeatedly across 7.2–7.8 and 9.0–9.6: no shadow flash, no console error, no per-water feature-state burst.
5. Pan west-to-middle-to-west rapidly at local zoom: only latest viewport clusters are installed, every file is fetched once, and loaded sources stay within the declared bound.
6. Search `Cane Creek`: two qualified results appear and open different deep links/geometries.
7. Click three non-confluence points on Obion; all open `obion-river`.
8. Click representative points on North, Middle, and South Fork Forked Deer and Rutherford Fork Obion; each opens the correct drawer and selected line.
9. Desktop 1440×900, tablet 1024×768, and mobile 390×844 still work.
10. Reduced-motion mode removes the reveal animation without changing which waters appear.

Capture screenshots at:

- statewide Tennessee;
- West Tennessee regional zoom;
- Forked Deer/Obion local zoom with the network visible;
- each Cane Creek selected;
- one reduced-motion local view.

Use browser inspection to query rendered features and dev counters. A screenshot alone does not prove selectability or performance.

Suggested automated budgets, chosen to catch regressions without depending on machine speed:

- zero MapLibre style validation errors;
- zero non-finite coordinates;
- one cluster URL fetched at most once per page session;
- at most the configured loaded-cluster bound after settling;
- one zoom threshold crossing performs at most 10 visibility/style mutations;
- the map reaches `idle` after each settled automated camera change within 5 seconds on the fixture build.

## Step 8. Final checks

Run at minimum:

```powershell
pnpm validate:content
pnpm --filter @trout/contracts test
pnpm --filter @trout/api test
pnpm --filter @trout/web test
node apps/web/scripts/audit-water-identities.mjs
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
pnpm --filter @trout/web build
pnpm e2e:web
git status --short
```

Run the geometry/identity audits again even though Session 2 should not edit geometry. That catches generated-file or merge drift.

## Session 2 completion and final report

Make focused commits for:

1. PID-based dedup and its tests;
2. style-driven tier reveal and interaction helper tests;
3. latest-only network loading and performance counters;
4. browser QA, screenshots, and documentation.

Push after every meaningful commit. Final reporting must include:

- starting/ending SHA, branch, and push confirmation;
- files changed grouped by data, rendering, loading, and tests;
- before/after zoom mutation counts;
- cluster fetch/add/remove evidence from the rapid-pan test;
- rendered-feature evidence for each zoom tier;
- exact IDs selected in the Obion/Forked Deer and Cane Creek tests;
- screenshot paths;
- all commands and results;
- any residual issue stated plainly.

Do not say “everything is fixed” unless every acceptance item below has direct evidence.

---

# Final acceptance checklist for the owner

- [ ] Session 1 and Session 2 used separate clones and branches.
- [ ] Session 2 contains Session 1 through a reviewed merge/base.
- [ ] No `bridgedSegments` properties or 30 km connector code remain.
- [ ] Every selectable line has exact NHD reach provenance or one explicit documented exception.
- [ ] The Forked Deer and Obion target waters pass topology and source-conformance checks.
- [ ] The two Cane Creeks are different records, geometries, GNIS identities, HUCs, and stocking destinations.
- [ ] County-less ambiguous stocking names are not guessed.
- [ ] Context dedup uses exact reach IDs, never name-only deletion.
- [ ] Statewide/regional/local reveal is smooth and selected waters remain visible.
- [ ] Zooming does not rewrite state for the entire catalog.
- [ ] Rapid panning does not build a stale network-load queue or refetch clusters.
- [ ] No blank-map/style-expression regression.
- [ ] No non-finite geometry and no duplicate catalog/context reach rendering.
- [ ] Unit, content, atlas, build, and focused browser suites pass.
- [ ] Final work is pushed and the working tree is clean.

