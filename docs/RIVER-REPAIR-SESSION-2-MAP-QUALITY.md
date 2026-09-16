# Session 2 prompt — map quality, interaction, and performance

Give this entire file to a second GPT-5.6 Luna session after Session 1 is reviewed and available remotely.

## Mission

Consume Session 1’s exact NHD reach identity and make the map smooth and trustworthy: PID-based context deduplication, style-driven zoom tiers, bounded latest-only network loading, stable line appearance, and deterministic selection. Do not repair geometry in this session.

## Prerequisite

Session 1 must be merged to `origin/main`, or the owner must explicitly provide its pushed ending commit as this session’s base. Confirm that commit is an ancestor of `HEAD`. If it is missing, stop; do not guess the new data contract or recreate Session 1.

## Required reading and rules

Read completely before editing:

1. `AGENTS.md`
2. `docs/ENGINEERING-GUIDE.md`
3. `docs/INDEX.md`
4. `docs/KNOWN-ISSUES.md`
5. `docs/RIVER-REPAIR-IMPLEMENTATION-PLAN.md`
6. Session 1’s final report
7. `docs/DESIGN.md`
8. `e2e/README.md`

Binding task rules:

- Work in a new clone and branch; never reuse Session 1’s clone.
- Record starting SHA and prove Session 1 ancestry.
- Use exact `nhdPermanentIds` for duplicate suppression. Never dedupe by name.
- Do not hide bad geometry with wider strokes, casing, or opacity.
- Do not reintroduce per-feature work on animation events.
- Keep performance instrumentation development-only.
- Push after meaningful commits. Do not merge or deploy.

If blocked, one GPT-5.6 Sol subagent at a time may review a MapLibre expression or write an isolated test under an exact interface. You own integration and verification.

## Fresh-clone setup

```powershell
Set-Location C:\Users\Benjamin\Projects
git clone git@github.com:Bchodges42/TroutSite.git trout-luna-map-quality
Set-Location C:\Users\Benjamin\Projects\trout-luna-map-quality
git fetch origin
git switch -c luna/river-map-quality origin/main
git config --global user.name "Bhodges42"
git status --short --branch
git rev-parse HEAD
pnpm install --frozen-lockfile
```

If using an owner-supplied Session 1 commit rather than merged main, create the branch from that exact remote commit and record the deviation.

## Baseline

Run and record:

```powershell
pnpm docs:check
pnpm validate:content
pnpm --filter @trout/web test
node apps/web/scripts/audit-water-identities.mjs
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
pnpm --filter @trout/web build
```

Confirm both Cane Creek records and `nhdPermanentIds` exist before proceeding.

## Deliverable A — exact context-network deduplication

Remove `setCatalogWaterNames` and all lowercased-name deletion from `networkClusters.ts` and its caller.

- Build the exclusion set from catalog `nhdPermanentIds`.
- Drop a context feature only when its `pid` exactly matches an excluded permanent ID.
- Remove unnamed/artificial context reaches too when their PID belongs to a catalog line.
- Same name plus different PID remains visible.
- Different name plus same PID is excluded.
- Missing PID fails open and remains visible.

Unit-test all four cases. Keep the dedupe helper pure and exported for tests.

## Deliverable B — one display-tier authority

Every catalog atlas feature should receive generated `displayTier` from the catalog’s `display` field. `labelMinZoom` may control labels only; it must not be a second water-visibility policy.

Use one exported threshold object:

- `featured`: statewide;
- `standard`: fade in from z7.2 to z7.8;
- `reference`: fade in from z9.0 to z9.6;
- detailed context network: load just before z9.4 and fade in from z9.6 to z10.2.

Adjust slightly only if browser evidence shows a better result. Do not scatter numbers across files.

## Deliverable C — style-driven reveal

Remove the all-catalog presentation call from `zoomend`. Zooming must not rewrite feature state for every water.

Implement tier opacity with a legal top-level MapLibre `step` or `interpolate` expression whose outputs inspect `displayTier`. Test the exact expression with the repository’s MapLibre version. A zoom expression nested inside `case` previously invalidated the whole style.

Keep concerns separate:

- species/filter hiding may use feature state;
- hover/selection may use feature state;
- tier visibility comes from `displayTier` plus zoom;
- selection layers ignore tier visibility so a searched/deep-linked water always renders;
- hit-layer eligibility updates only when a tier boundary is crossed, using a small constant number of `setFilter` calls.

Use approximately 180–250 ms opacity transition. Honor reduced motion with no transition.

Expose a development counter for style/filter mutations caused by zoom. One tier crossing must use at most 10 mutations, independent of catalog size.

## Deliverable D — latest-only detailed-network loading

Replace the current promise chain that queues every `moveend`.

Required scheduler behavior:

- only one sync runs at a time;
- while it runs, retain only the latest dirty viewport request;
- load needed clusters for the latest viewport concurrently with a small bound if necessary;
- before adding a resolved fetch, confirm the map is alive, the style generation is current, and the cluster still belongs to the latest retained viewport;
- cache each cluster response once per page session;
- load using about 25% viewport padding and retain until outside about 75% padding;
- keep a bounded recent set, initially 6 loaded clusters, so a short pan back does not churn sources;
- style reload clears MapLibre bookkeeping but reuses byte caches;
- disposal prevents all later map mutations.

Expose development counters: fetches, additions, removals, stale results ignored, and loaded IDs.

Unit-test rapid viewport changes, style reload during fetch, disposal during fetch, cache reuse, fetch-once, hysteresis, and the loaded bound.

## Deliverable E — stable visual stack

Inspect `mapStyle.ts` at z5.6, z7.5, z9.5, z10.5, and z12.

Required result:

- an ordinary unselected line has one water corridor and at most one interior condition treatment;
- casing appears only on hover/selection;
- no-data dash phase does not morph while zooming;
- fishery-class outline cannot read as a displaced duplicate; suppress it at statewide zoom if needed;
- a catalog reach and its context copy never render together;
- selection remains clear without obscuring nearby forks;
- style swaps cannot leave stale opacity or visibility state.

If a source line itself is wrong, stop altering style for that case and report the exact feature/reach to the owner. Geometry belongs to Session 1.

## Deliverable F — deterministic selection

Move line-distance/tie-breaking logic from `TennesseeMap.tsx` into a pure tested helper.

Rules:

- hidden-by-species or hidden-by-tier candidates cannot win;
- nearest visible centerline wins normally;
- at a true overlap/confluence, a near tie may prefer the longer main stem only within a small documented pixel threshold;
- never use vertex count as importance;
- points and polygons preserve their own hit behavior;
- ordinary non-confluence clicks on Obion always select `obion-river`.

Test Obion and its forks, Forked Deer and its forks, parallel lines, a crossing, a line over a polygon, and a hidden reference water.

## Browser acceptance

Add a focused Playwright spec using the fixture build and real MapLibre canvas.

Automate:

1. Statewide: only featured waters render and no context cluster is loaded.
2. West Tennessee regional zoom: standard waters fade in without a style error or blank map.
3. Local zoom: reference waters and context network appear; duplicate PIDs do not.
4. Repeated threshold crossing: no flash/shadow and no per-water feature-state burst.
5. Rapid west → middle → west pan: latest viewport wins, each URL fetches once, loaded sources remain within the bound.
6. `Cane Creek` search returns two qualified records and opens different IDs/geometries.
7. Three non-confluence Obion clicks all select `obion-river`.
8. Representative clicks select North/Middle/South Fork Forked Deer and Rutherford Fork Obion correctly.
9. Desktop 1440×900, tablet 1024×768, and mobile 390×844 remain usable.
10. Reduced motion changes animation only, not visibility.

Capture screenshots for statewide, West Tennessee regional, Forked Deer/Obion local, each selected Cane Creek, and reduced-motion local view. Also query rendered features and development counters; screenshots alone are insufficient.

Budgets:

- zero MapLibre style validation errors;
- one cluster URL fetched at most once per page session;
- at most 6 loaded context clusters after settling unless a documented viewport requires a reviewed higher bound;
- at most 10 visibility/style mutations per threshold crossing;
- settled automated camera changes reach map `idle` within 5 seconds on the fixture build;
- zero duplicate catalog/context PID rendering.

## Final validation

Run:

```powershell
pnpm docs:check
pnpm validate:content
pnpm --filter @trout/contracts test
pnpm --filter @trout/api test
pnpm --filter @trout/web test
node apps/web/scripts/audit-water-identities.mjs
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
pnpm --filter @trout/web build
pnpm e2e:web
```

Rerun identity and geometry audits even though this session should not edit geometry.

## Commit and handoff

Use focused commits: PID dedup; tier reveal; network scheduler; interaction/browser QA. Push after each.

Your final report must include:

- starting/ending SHA and Session 1 ancestry proof;
- pushed branch;
- changed files grouped by rendering, loading, interaction, and tests;
- before/after zoom mutation counts;
- fetch/add/remove/stale-result evidence from rapid pan;
- rendered tier evidence;
- exact selected IDs in Cane Creek, Obion, and Forked Deer tests;
- screenshot paths;
- all commands/results;
- clean `git status --short`;
- residual issues stated plainly.

Do not claim the geometry is authoritative merely because this rendering session passed.
