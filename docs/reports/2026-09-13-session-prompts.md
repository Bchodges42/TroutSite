# Trout accuracy campaign — three fresh-session prompts

## Usage note

Run these sessions serially: Session 1, then Session 2, then Session 3. The parent sessions
must not run in parallel because the later sessions consume deterministic report files from the
earlier ones. Each prompt uses three bounded Luna X-High subagents in parallel; none calls for Sol.

Each session uses its own fresh clone and branch. After each session, make its one report file
available at the stated path in the next fresh checkout—normally by reviewing and merging or
cherry-picking its docs-only commit, or by explicitly fetching its report branch. Files, not chat
memory, are the handoff:

1. `docs/reports/2026-09-13-campaign-01-code-audit.md`
2. `docs/reports/2026-09-13-campaign-02-evidence-coverage.md`
3. `docs/reports/2026-09-13-campaign-03-implementation-plan.md`

The third file is the final artifact. Give that file in full, plus access to the repository, as
the implementation model's entire brief. Do not supplement it with the orchestrator audit or the
first two campaign reports; the final plan must have absorbed every necessary fact and citation.

---

## Session 1 prompt — code and product ground truth

~~~text
You are Session 1 of a three-session accuracy campaign for Trout. Your sole deliverable is a
verified code/product ground-truth report. You are investigating and planning, not implementing.

# FULL STARTING CONTEXT — BEGIN

Trout is the offline-first, privacy-first Tennessee fishing-conditions product whose public site
is `trout.tntechclimb.com`. The canonical repository is
`git@github.com:Bchodges42/TroutSite.git`, authenticated with the user's SSH key. Never treat an
unzipped folder, old clone, historical report, or deployed site as source truth. Create your own
fresh clone, fetch/prune `origin`, and prove that your base commit equals the current remote
`refs/heads/main` returned by `git ls-remote`. Record the hash and UTC verification time.

The campaign baseline date is 2026-09-13. Live data and `origin/main` may have moved, so date every
probe and recompute every count. Documentation is orientation; current code, YAML, generated data,
and reproducible primary-source evidence are truth. Record every disagreement.

Read these repository entry points completely before substantive work:

- `AGENTS.md` — binding session, clone, branch, identity, push, collision, and production rules.
- `README.md` — product purpose and architecture invariants.
- `docs/INDEX.md` — documentation map.
- `docs/KNOWN-ISSUES.md` — consolidated worklist, owner decisions, and F1–F12 program.
- `docs/reports/2026-09-13-orchestrator-audit.md` if present — dated leads to verify, never an
  authority.

The owner's five 2026-09-12 `DECIDED` items are policy:

1. Build fishability as per-species scores; warmwater anglers are first-class users.
2. Species mode is site-wide, persists, defaults to Trout, and changes filtering and wording on
   every surface—not only the map.
3. Keep the evidence endpoint for owner use and a low-key marketing methodology page; do not add
   the evidence feed to the main-app UI.
4. Consume the rolling recent-stocking feed by default and fetch full history only on demand.
5. Render public fishing-report photos under ADR 0002.

Build on those decisions and existing worklist IDs. If evidence requires a policy change, label it
`OWNER DECISION REQUIRED`, give the conflict and options, and do not silently override the owner.

The campaign must make this end-state implementable:

- deterministic, offline-capable, per-species conditions with Trout as the default lens;
- separate honest semantics for applicability, access/safety, present habitat suitability,
  contextual activity, and coverage/confidence—never an unsupported catch/bite promise;
- fewer defensible selectable/titled map waters without deleting useful catalog/deep-link data;
- a decision for every catalog water, including species and season behavior;
- parameter-specific source assignments for important rivers, tailwaters, and lakes, with
  documented scrape recipes when a permitted official source has no clean API;
- field-level evidence for species, seasons, numeric bands, and score inputs; unknown stays
  visibly unknown;
- consistent map, Browse, Conditions, Stocking, detail/drawer, settings, offline snapshots,
  admin/evidence, and static marketing behavior and claims;
- tests for stale observations, inapplicable scores, source drift, UI parity, misleading copy,
  and regression of the complete per-water decisions.

High-value code/data entry points include, but are not limited to:

- `packages/content/streams/tn/*.yaml`, `packages/content/species/species-reference.yaml`,
  `packages/content/research/f3-species-mapping.yaml`, and `packages/content/scripts/`;
- `apps/web/public/atlas/rivers.geojson`,
  `apps/web/src/features/map/riverIndex.json`, `RiverMapPage.tsx`, `TennesseeMap.tsx`,
  `waterDecision.ts`, `BrowsePage.tsx`, Conditions/Stocking/detail pages, settings, and tests;
- `packages/contracts/src/scoreConditions.ts`,
  `packages/contracts/src/schemas/fishability.ts`, gauge/conditions/evidence contracts, and tests;
- `apps/api/src/ingest/usgs.ts`, `apps/api/src/pipeline.ts`, `apps/api/src/evidence/`,
  `apps/api/src/snapshots/build.ts`, `apps/api/src/snapshots/fishability.ts`, migrations, fixtures,
  and provider/pipeline tests;
- `docs/data-source-coverage.json`, `packages/content/data/verified-gauges.json`, and the scripts
  that produce or validate them;
- `apps/marketing/src/data/load.ts`, `ConditionsEmbed.astro`, `data-sources.astro`, all generated
  state/stream/stocking/regulation pages, fixtures, SEO copy, and tests.

The orchestrator audit reported these leads at 2026-09-13 `origin/main`
`b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`; reverify them against the current tree:

- 148 waters: 35 river, 57 creek, 38 lake, 12 tailrace, 5 pond, 1 spring.
- Broad species was 103 trout, 8 warmwater, 37 absent; only 39 had `targetSpecies`.
- YAML, atlas GeoJSON, and river index had the same 148 IDs.
- All 148 could be selected in All-fish mode; default Trout admitted 141; excluded stillwaters
  could remain visible but inert. There was no authored display tier.
- Bounding-box title logic yielded 54 statewide, 72 approach, and 22 local candidates, promoting
  some long small creeks by extent rather than fishery importance.
- Legacy `scoreConditions` was a trout-shaped flow/temperature calculation invoked for all 148;
  92 ideal-flow ranges lacked field-level provenance.
- Fishability v2 had seven warmwater keys and no trout keys. Only largemouth, smallmouth, and
  striped bass had complete current bands; scoring was thermal-only.
- Activity used temperature and optional spawn/pressure, omitted flow trend, appeared to use
  unsupported generic transformations, and inferred rain from pressure rather than NWS precip.
- 48 waters had gauge IDs and 50 unique numeric USGS IDs were assigned, but parameter health and
  temperature recency were much weaker than ID-level `realTimeIV:true` suggested.
- `latestReadings()` plus 90-day retention appeared able to score stopped/stale sensors because
  there was no whole-reading absolute-age gate.
- The generated coverage artifact described 147 waters while the catalog had 148.
- Species validation could accept a word in notes/regulation text instead of a typed
  water/reach/species evidence assertion.
- Species mode did not consistently filter Browse, Conditions, Stocking, detail focus, snapshots,
  and static marketing. Marketing made trout/fly/source/method claims stronger than the code.
- Provisional new labels were OA-01 absolute freshness, OA-02 score validity, OA-03 trout omission,
  OA-04 map tiers, OA-05 F6 parity, OA-06 marketing overclaims, OA-07 coverage drift, OA-08 USGS
  migration, OA-09 field provenance, and OA-10 snapshot fan-out. Reverify and deduplicate them.

Binding guardrails:

- Preserve offline-first static snapshots and last-known-good behavior. The browser must not
  depend on third-party live APIs or user location.
- Never read, print, or quote secrets, including `backups/push-url.txt`; do not inspect ignored
  credential files.
- Never interact with the production host, service, schedulers, or deploy/restart/heal commands.
  Do not deploy or probe `trout.tntechclimb.com`.
- Read-only investigation is allowed. The only repository path you may create or modify is your
  one assigned report under `docs/reports/`. Do not edit code, content, config, fixtures,
  generated artifacts, lockfiles, the worklist, or another report.
- Follow `AGENTS.md`: one session/clone/branch/push target; branch from fetched `origin/main`; use
  the required identity if committing; stop on unattributed changes; never commit to `main`.
- You may commit/push only your report on your branch. Use the SSH-derived remote. The report is
  not finished until pushed and its commit/hash is stated in your final response.

Use exactly three bounded subagents. If model selection is available, run each on `gpt-5.6-luna`
with `xhigh` reasoning. Do not intentionally use Sol. Give each a narrow domain; forbid edits,
secrets, production, and nested delegation. Their output is only a lead: the parent must inspect
the code/data or primary source independently before asserting it. Only the parent writes.

File-only handoffs:

- Session 1 writes `docs/reports/2026-09-13-campaign-01-code-audit.md`.
- Session 2 reads it if present and writes
  `docs/reports/2026-09-13-campaign-02-evidence-coverage.md`.
- Session 3 reads both if present and writes
  `docs/reports/2026-09-13-campaign-03-implementation-plan.md`.

If a predecessor file is missing, do not ask for chat memory or fabricate it. Record the missing
handoff, reconstruct the minimum from the current repo and primary sources, and continue. Every
important claim needs a path/line or reproducible command, or a direct primary-source URL plus
observed/published/retrieved date. Separate fact, inference, recommendation, and unknown.

# FULL STARTING CONTEXT — END

Create a fresh clone and branch `campaign/2026-09-13-ground-truth` from verified current
`origin/main`. Then dispatch these three read-only Luna X-High subagents:

1. **Catalog/map:** enumerate YAML/index/GeoJSON identity, visibility, hit targets, labels,
   search/deep links, season/species gates, geometry heuristics, and tests. Return reproducible
   counts and exact paths/lines.
2. **Scoring/pipeline:** trace old/v2 contracts and scorers, ingestion, retention, freshness,
   snapshots, providers, evidence artifacts, errors, and tests end-to-end. Return a call graph and
   precise failure conditions.
3. **Surfaces/claims:** trace species state through map, Browse, Conditions, Stocking, detail,
   settings, offline, admin/evidence, and marketing/SEO. Inventory misleading/divergent claims.

While they work, independently inspect all critical paths, reproduce counts with small read-only
commands, and verify every accepted lead. Leave the external data-source hunt to Session 2.

Write only `docs/reports/2026-09-13-campaign-01-code-audit.md`, containing:

1. audited revision, remote-main proof, UTC, commands/tests run, and limitations;
2. verified counts and a complete 148-row technical inventory: ID/name/type/region, broad and
   detailed species, fishery/season, geometry/current prominence, visibility/selectability/title
   by mode, gauges by provider, ideal-flow presence, snapshot/fishability eligibility, and static
   page applicability;
3. code-path traces for map admission/titles, old/v2 scoring, ingestion/freshness/retention,
   snapshots/offline, mode propagation, and marketing generation;
4. exact assessed/unassessed/wrongly-assessed causes, covering timestamps, parameters, spatial
   representation, season, species, and evidence gates;
5. repository-wiring source coverage and generated-artifact drift, without claiming it is live;
6. every UI/content/SEO mismatch and affected file/surface;
7. current tests, missing regressions, and exact repo-discovered test commands;
8. worklist reconciliation: reuse IDs; validate/revise OA-01…OA-10 only for untracked findings;
9. `Facts Session 2 must externally verify`, keyed to waters, provider IDs/parameters, disputed
   fields, and scientific claims.

Do not select final tiers or coefficients by intuition. Inspect the report, run `git diff --check`,
commit/push only it, and state its path, commit, push status, and limitations in your final response.
~~~

---

## Session 2 prompt — external evidence and source coverage

~~~text
You are Session 2 of a three-session accuracy campaign for Trout. Your sole deliverable is a
current, cited external-evidence and data-source coverage report. You are investigating and
planning, not implementing.

# FULL STARTING CONTEXT — BEGIN

Trout is the offline-first, privacy-first Tennessee fishing-conditions product whose public site
is `trout.tntechclimb.com`. The canonical repository is
`git@github.com:Bchodges42/TroutSite.git`, authenticated with the user's SSH key. Never treat an
unzipped folder, old clone, historical report, or deployed site as source truth. Create your own
fresh clone, fetch/prune `origin`, and prove that your base commit equals the current remote
`refs/heads/main` returned by `git ls-remote`. Record the hash and UTC verification time.

The campaign baseline date is 2026-09-13. Live data and `origin/main` may have moved, so date every
probe and recompute every count. Documentation is orientation; current code, YAML, generated data,
and reproducible primary-source evidence are truth. Record every disagreement.

Read these repository entry points completely before substantive work:

- `AGENTS.md` — binding session, clone, branch, identity, push, collision, and production rules.
- `README.md` — product purpose and architecture invariants.
- `docs/INDEX.md` — documentation map.
- `docs/KNOWN-ISSUES.md` — consolidated worklist, owner decisions, and F1–F12 program.
- `docs/reports/2026-09-13-orchestrator-audit.md` if present — dated leads to verify, never an
  authority.

The owner's five 2026-09-12 `DECIDED` items are policy:

1. Build fishability as per-species scores; warmwater anglers are first-class users.
2. Species mode is site-wide, persists, defaults to Trout, and changes filtering and wording on
   every surface—not only the map.
3. Keep the evidence endpoint for owner use and a low-key marketing methodology page; do not add
   the evidence feed to the main-app UI.
4. Consume the rolling recent-stocking feed by default and fetch full history only on demand.
5. Render public fishing-report photos under ADR 0002.

Build on those decisions and existing worklist IDs. If evidence requires a policy change, label it
`OWNER DECISION REQUIRED`, give the conflict and options, and do not silently override the owner.

The campaign must make this end-state implementable:

- deterministic, offline-capable, per-species conditions with Trout as the default lens;
- separate honest semantics for applicability, access/safety, present habitat suitability,
  contextual activity, and coverage/confidence—never an unsupported catch/bite promise;
- fewer defensible selectable/titled map waters without deleting useful catalog/deep-link data;
- a decision for every catalog water, including species and season behavior;
- parameter-specific source assignments for important rivers, tailwaters, and lakes, with
  documented scrape recipes when a permitted official source has no clean API;
- field-level evidence for species, seasons, numeric bands, and score inputs; unknown stays
  visibly unknown;
- consistent map, Browse, Conditions, Stocking, detail/drawer, settings, offline snapshots,
  admin/evidence, and static marketing behavior and claims;
- tests for stale observations, inapplicable scores, source drift, UI parity, misleading copy,
  and regression of the complete per-water decisions.

High-value code/data entry points include, but are not limited to:

- `packages/content/streams/tn/*.yaml`, `packages/content/species/species-reference.yaml`,
  `packages/content/research/f3-species-mapping.yaml`, and `packages/content/scripts/`;
- `apps/web/public/atlas/rivers.geojson`,
  `apps/web/src/features/map/riverIndex.json`, `RiverMapPage.tsx`, `TennesseeMap.tsx`,
  `waterDecision.ts`, `BrowsePage.tsx`, Conditions/Stocking/detail pages, settings, and tests;
- `packages/contracts/src/scoreConditions.ts`,
  `packages/contracts/src/schemas/fishability.ts`, gauge/conditions/evidence contracts, and tests;
- `apps/api/src/ingest/usgs.ts`, `apps/api/src/pipeline.ts`, `apps/api/src/evidence/`,
  `apps/api/src/snapshots/build.ts`, `apps/api/src/snapshots/fishability.ts`, migrations, fixtures,
  and provider/pipeline tests;
- `docs/data-source-coverage.json`, `packages/content/data/verified-gauges.json`, and the scripts
  that produce or validate them;
- `apps/marketing/src/data/load.ts`, `ConditionsEmbed.astro`, `data-sources.astro`, all generated
  state/stream/stocking/regulation pages, fixtures, SEO copy, and tests.

The orchestrator audit reported these leads at 2026-09-13 `origin/main`
`b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`; reverify them against the current tree:

- 148 waters: 35 river, 57 creek, 38 lake, 12 tailrace, 5 pond, 1 spring.
- Broad species was 103 trout, 8 warmwater, 37 absent; only 39 had `targetSpecies`.
- YAML, atlas GeoJSON, and river index had the same 148 IDs.
- All 148 could be selected in All-fish mode; default Trout admitted 141; excluded stillwaters
  could remain visible but inert. There was no authored display tier.
- Bounding-box title logic yielded 54 statewide, 72 approach, and 22 local candidates, promoting
  some long small creeks by extent rather than fishery importance.
- Legacy `scoreConditions` was a trout-shaped flow/temperature calculation invoked for all 148;
  92 ideal-flow ranges lacked field-level provenance.
- Fishability v2 had seven warmwater keys and no trout keys. Only largemouth, smallmouth, and
  striped bass had complete current bands; scoring was thermal-only.
- Activity used temperature and optional spawn/pressure, omitted flow trend, appeared to use
  unsupported generic transformations, and inferred rain from pressure rather than NWS precip.
- 48 waters had gauge IDs and 50 unique numeric USGS IDs were assigned, but parameter health and
  temperature recency were much weaker than ID-level `realTimeIV:true` suggested.
- `latestReadings()` plus 90-day retention appeared able to score stopped/stale sensors because
  there was no whole-reading absolute-age gate.
- The generated coverage artifact described 147 waters while the catalog had 148.
- Species validation could accept a word in notes/regulation text instead of a typed
  water/reach/species evidence assertion.
- Species mode did not consistently filter Browse, Conditions, Stocking, detail focus, snapshots,
  and static marketing. Marketing made trout/fly/source/method claims stronger than the code.
- Provisional new labels were OA-01 absolute freshness, OA-02 score validity, OA-03 trout omission,
  OA-04 map tiers, OA-05 F6 parity, OA-06 marketing overclaims, OA-07 coverage drift, OA-08 USGS
  migration, OA-09 field provenance, and OA-10 snapshot fan-out. Reverify and deduplicate them.

Binding guardrails:

- Preserve offline-first static snapshots and last-known-good behavior. The browser must not
  depend on third-party live APIs or user location.
- Never read, print, or quote secrets, including `backups/push-url.txt`; do not inspect ignored
  credential files.
- Never interact with the production host, service, schedulers, or deploy/restart/heal commands.
  Do not deploy or probe `trout.tntechclimb.com`.
- Read-only investigation is allowed. The only repository path you may create or modify is your
  one assigned report under `docs/reports/`. Do not edit code, content, config, fixtures,
  generated artifacts, lockfiles, the worklist, or another report.
- Follow `AGENTS.md`: one session/clone/branch/push target; branch from fetched `origin/main`; use
  the required identity if committing; stop on unattributed changes; never commit to `main`.
- You may commit/push only your report on your branch. Use the SSH-derived remote. The report is
  not finished until pushed and its commit/hash is stated in your final response.

Use exactly three bounded subagents. If model selection is available, run each on `gpt-5.6-luna`
with `xhigh` reasoning. Do not intentionally use Sol. Give each a narrow domain; forbid edits,
secrets, production, and nested delegation. Their output is only a lead: the parent must inspect
the code/data or primary source independently before asserting it. Only the parent writes.

File-only handoffs:

- Session 1 writes `docs/reports/2026-09-13-campaign-01-code-audit.md`.
- Session 2 reads it if present and writes
  `docs/reports/2026-09-13-campaign-02-evidence-coverage.md`.
- Session 3 reads both if present and writes
  `docs/reports/2026-09-13-campaign-03-implementation-plan.md`.

If a predecessor file is missing, do not ask for chat memory or fabricate it. Record the missing
handoff, reconstruct the minimum from the current repo and primary sources, and continue. Every
important claim needs a path/line or reproducible command, or a direct primary-source URL plus
observed/published/retrieved date. Separate fact, inference, recommendation, and unknown.

# FULL STARTING CONTEXT — END

Create a fresh clone and branch `campaign/2026-09-13-evidence` from verified current
`origin/main`. Read `docs/reports/2026-09-13-campaign-01-code-audit.md` if it exists, treating it as
a dated handoff and rechecking every fact you use. If missing, follow the rule above and rebuild
the repository-derived request list yourself.

Dispatch exactly these three read-only Luna X-High subagents:

1. **Hydrology/source:** find and live-verify official flow, stage, water temperature, release,
   level, precipitation, dissolved oxygen, and relevant water-quality sources for the catalog.
   Cover USGS, TVA, USACE A2W/CWMS, NWS, TDEC/EPA Water Quality Portal, and any other primary
   public authorities. Focus on main rivers, reservoir-connected reaches, tailwaters, and lakes.
2. **Species/season/access:** find direct official evidence for species presence, stocking events,
   fishery type, seasons/regulations, reach, public access, and destination significance for each
   water. Start with TWRA, public land managers, and authoritative datasets; never infer a full
   assemblage from one stocking event or copy claims from aggregators.
3. **Scientific model:** research primary studies and agency models for habitat suitability,
   access/safety, life-stage/spawn context, lake stratification, temperature/DO, flow/rate of
   change, turbidity/rain, and pressure. Cover trout and all seven current warmwater keys. Decide
   what evidence permits scoring, context only, or `unassessed`; do not transplant generic HSI
   coefficients into Tennessee without support.

The parent owns a relentless independent verification pass. Use web search and live public
endpoints, prioritizing agencies, primary studies, formal datasets, and machine-readable metadata.
For each source capture exact URL/endpoint, owner, retrieval UTC, publication/update/observation
time, parameters/codes/units/time zone, coordinates and reach representativeness, cadence,
missing/sentinel behavior, license/terms/robots constraints, and enough response metadata to
reproduce the finding. Respect rate limits and source terms; use an identifying user agent where
required. Do not bypass access controls. An inaccessible clean API may become a documented
server-side scrape recipe only when permitted; browser-side scraping is unacceptable.

Repeat live checks instead of inheriting the orchestrator's probes. Test every configured USGS ID
for each required parameter and latest valid observation—not just site existence. Verify the
current USGS modern-API migration schedule from official USGS material. Enumerate TVA and USACE
station catalogs rather than stopping at hardcoded IDs. Separate live conditions from periodic
samples useful only for baselines. For reservoirs, investigate depth and dissolved oxygen; never
assume surface or tailwater temperature represents the whole lake.

Write only `docs/reports/2026-09-13-campaign-02-evidence-coverage.md`. Make it sufficient for a
fresh synthesis session with no memory. Include:

1. current repo revision, predecessor status, research window, exact methods, limitations, and a
   source-quality rubric;
2. a source registry with stable IDs and operational recipes: endpoint discovery, request/parse
   mapping, units/time zones, freshness/SLA, validation, sentinel/error behavior, rate/terms,
   attribution, fixtures, monitoring, and fallback;
3. a complete 148-row evidence/source matrix stating water/reach, proposed primary/local/catalog
   tier evidence, species mode/season, verified species citations, access/significance evidence,
   candidate sources by metric, spatial qualification, current availability, and honest score
   status;
4. a station inventory keyed by provider/ID, including every configured ID and credible candidate,
   with coordinates, parameters, latest valid timestamps, gaps, and exact water/reach mapping;
5. a populated typed species/season evidence ledger: water, reach, species, assertion, evidence
   kind, direct source, dates, confidence, and what that source does not prove;
6. model evidence by species and habitat class, separating safety/access, habitat suitability, and
   context. Supply a formula/curve only when provenance and transfer are defensible; otherwise
   specify validation work and `unassessed` behavior;
7. a `Do not implement as fact` register for weak, contradictory, stale, inaccessible, overly
   broad, or nontransferable claims, including unsupported ideal-flow/activity values;
8. strict coverage totals, highest-value gaps, and displayed waters that cannot honestly score;
9. source-drift tests and fixture-refresh rules the implementation plan must require;
10. an `Inputs Session 3 may treat as verified` section with compact stable IDs, tables,
    citations, timestamps, and unresolved conflicts—not references to chat context.

Do not complete any matrix cell by guessing. `No defensible source found as of <UTC>` is useful.
Inspect the report, confirm direct links and dated live claims, run `git diff --check`, commit only
that report, push your branch, and state path, commit, push status, and limitations in your final
response.
~~~

---

## Session 3 prompt — self-contained implementation plan

~~~text
You are Session 3 of a three-session accuracy campaign for Trout. Your sole deliverable is the
complete, self-contained implementation brief another model will execute. You are planning, not
implementing.

# FULL STARTING CONTEXT — BEGIN

Trout is the offline-first, privacy-first Tennessee fishing-conditions product whose public site
is `trout.tntechclimb.com`. The canonical repository is
`git@github.com:Bchodges42/TroutSite.git`, authenticated with the user's SSH key. Never treat an
unzipped folder, old clone, historical report, or deployed site as source truth. Create your own
fresh clone, fetch/prune `origin`, and prove that your base commit equals the current remote
`refs/heads/main` returned by `git ls-remote`. Record the hash and UTC verification time.

The campaign baseline date is 2026-09-13. Live data and `origin/main` may have moved, so date every
probe and recompute every count. Documentation is orientation; current code, YAML, generated data,
and reproducible primary-source evidence are truth. Record every disagreement.

Read these repository entry points completely before substantive work:

- `AGENTS.md` — binding session, clone, branch, identity, push, collision, and production rules.
- `README.md` — product purpose and architecture invariants.
- `docs/INDEX.md` — documentation map.
- `docs/KNOWN-ISSUES.md` — consolidated worklist, owner decisions, and F1–F12 program.
- `docs/reports/2026-09-13-orchestrator-audit.md` if present — dated leads to verify, never an
  authority.

The owner's five 2026-09-12 `DECIDED` items are policy:

1. Build fishability as per-species scores; warmwater anglers are first-class users.
2. Species mode is site-wide, persists, defaults to Trout, and changes filtering and wording on
   every surface—not only the map.
3. Keep the evidence endpoint for owner use and a low-key marketing methodology page; do not add
   the evidence feed to the main-app UI.
4. Consume the rolling recent-stocking feed by default and fetch full history only on demand.
5. Render public fishing-report photos under ADR 0002.

Build on those decisions and existing worklist IDs. If evidence requires a policy change, label it
`OWNER DECISION REQUIRED`, give the conflict and options, and do not silently override the owner.

The campaign must make this end-state implementable:

- deterministic, offline-capable, per-species conditions with Trout as the default lens;
- separate honest semantics for applicability, access/safety, present habitat suitability,
  contextual activity, and coverage/confidence—never an unsupported catch/bite promise;
- fewer defensible selectable/titled map waters without deleting useful catalog/deep-link data;
- a decision for every catalog water, including species and season behavior;
- parameter-specific source assignments for important rivers, tailwaters, and lakes, with
  documented scrape recipes when a permitted official source has no clean API;
- field-level evidence for species, seasons, numeric bands, and score inputs; unknown stays
  visibly unknown;
- consistent map, Browse, Conditions, Stocking, detail/drawer, settings, offline snapshots,
  admin/evidence, and static marketing behavior and claims;
- tests for stale observations, inapplicable scores, source drift, UI parity, misleading copy,
  and regression of the complete per-water decisions.

High-value code/data entry points include, but are not limited to:

- `packages/content/streams/tn/*.yaml`, `packages/content/species/species-reference.yaml`,
  `packages/content/research/f3-species-mapping.yaml`, and `packages/content/scripts/`;
- `apps/web/public/atlas/rivers.geojson`,
  `apps/web/src/features/map/riverIndex.json`, `RiverMapPage.tsx`, `TennesseeMap.tsx`,
  `waterDecision.ts`, `BrowsePage.tsx`, Conditions/Stocking/detail pages, settings, and tests;
- `packages/contracts/src/scoreConditions.ts`,
  `packages/contracts/src/schemas/fishability.ts`, gauge/conditions/evidence contracts, and tests;
- `apps/api/src/ingest/usgs.ts`, `apps/api/src/pipeline.ts`, `apps/api/src/evidence/`,
  `apps/api/src/snapshots/build.ts`, `apps/api/src/snapshots/fishability.ts`, migrations, fixtures,
  and provider/pipeline tests;
- `docs/data-source-coverage.json`, `packages/content/data/verified-gauges.json`, and the scripts
  that produce or validate them;
- `apps/marketing/src/data/load.ts`, `ConditionsEmbed.astro`, `data-sources.astro`, all generated
  state/stream/stocking/regulation pages, fixtures, SEO copy, and tests.

The orchestrator audit reported these leads at 2026-09-13 `origin/main`
`b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`; reverify them against the current tree:

- 148 waters: 35 river, 57 creek, 38 lake, 12 tailrace, 5 pond, 1 spring.
- Broad species was 103 trout, 8 warmwater, 37 absent; only 39 had `targetSpecies`.
- YAML, atlas GeoJSON, and river index had the same 148 IDs.
- All 148 could be selected in All-fish mode; default Trout admitted 141; excluded stillwaters
  could remain visible but inert. There was no authored display tier.
- Bounding-box title logic yielded 54 statewide, 72 approach, and 22 local candidates, promoting
  some long small creeks by extent rather than fishery importance.
- Legacy `scoreConditions` was a trout-shaped flow/temperature calculation invoked for all 148;
  92 ideal-flow ranges lacked field-level provenance.
- Fishability v2 had seven warmwater keys and no trout keys. Only largemouth, smallmouth, and
  striped bass had complete current bands; scoring was thermal-only.
- Activity used temperature and optional spawn/pressure, omitted flow trend, appeared to use
  unsupported generic transformations, and inferred rain from pressure rather than NWS precip.
- 48 waters had gauge IDs and 50 unique numeric USGS IDs were assigned, but parameter health and
  temperature recency were much weaker than ID-level `realTimeIV:true` suggested.
- `latestReadings()` plus 90-day retention appeared able to score stopped/stale sensors because
  there was no whole-reading absolute-age gate.
- The generated coverage artifact described 147 waters while the catalog had 148.
- Species validation could accept a word in notes/regulation text instead of a typed
  water/reach/species evidence assertion.
- Species mode did not consistently filter Browse, Conditions, Stocking, detail focus, snapshots,
  and static marketing. Marketing made trout/fly/source/method claims stronger than the code.
- Provisional new labels were OA-01 absolute freshness, OA-02 score validity, OA-03 trout omission,
  OA-04 map tiers, OA-05 F6 parity, OA-06 marketing overclaims, OA-07 coverage drift, OA-08 USGS
  migration, OA-09 field provenance, and OA-10 snapshot fan-out. Reverify and deduplicate them.

Binding guardrails:

- Preserve offline-first static snapshots and last-known-good behavior. The browser must not
  depend on third-party live APIs or user location.
- Never read, print, or quote secrets, including `backups/push-url.txt`; do not inspect ignored
  credential files.
- Never interact with the production host, service, schedulers, or deploy/restart/heal commands.
  Do not deploy or probe `trout.tntechclimb.com`.
- Read-only investigation is allowed. The only repository path you may create or modify is your
  one assigned report under `docs/reports/`. Do not edit code, content, config, fixtures,
  generated artifacts, lockfiles, the worklist, or another report.
- Follow `AGENTS.md`: one session/clone/branch/push target; branch from fetched `origin/main`; use
  the required identity if committing; stop on unattributed changes; never commit to `main`.
- You may commit/push only your report on your branch. Use the SSH-derived remote. The report is
  not finished until pushed and its commit/hash is stated in your final response.

Use exactly three bounded subagents. If model selection is available, run each on `gpt-5.6-luna`
with `xhigh` reasoning. Do not intentionally use Sol. Give each a narrow domain; forbid edits,
secrets, production, and nested delegation. Their output is only a lead: the parent must inspect
the code/data or primary source independently before asserting it. Only the parent writes.

File-only handoffs:

- Session 1 writes `docs/reports/2026-09-13-campaign-01-code-audit.md`.
- Session 2 reads it if present and writes
  `docs/reports/2026-09-13-campaign-02-evidence-coverage.md`.
- Session 3 reads both if present and writes
  `docs/reports/2026-09-13-campaign-03-implementation-plan.md`.

If a predecessor file is missing, do not ask for chat memory or fabricate it. Record the missing
handoff, reconstruct the minimum from the current repo and primary sources, and continue. Every
important claim needs a path/line or reproducible command, or a direct primary-source URL plus
observed/published/retrieved date. Separate fact, inference, recommendation, and unknown.

# FULL STARTING CONTEXT — END

Create a fresh clone and branch `campaign/2026-09-13-plan` from verified current `origin/main`.
Read both predecessor reports if present. Reverify every repo fact used and repeat only the live
checks whose volatility or consequence warrants it. If either file is missing, follow the rule
above and document the reconstruction.

Dispatch exactly these three read-only Luna X-High subagents:

1. **Data/model critic:** reconcile source availability with score semantics, freshness, schemas,
   providers, migrations, snapshots, offline fallback, monitoring, and tests. Return unsafe
   assumptions and an ordered file-level proposal.
2. **Catalog/map/species critic:** review all 148 display decisions, species/season assertions,
   evidence-ledger design, search/deep links, title/hit policy, and state propagation. Return
   missing rows, unsupported promotions, and acceptance cases.
3. **Surface/delivery critic:** trace the plan through web, marketing, admin, accessibility, SEO,
   performance, fixtures, CI, rollout, and docs. Return missing file impacts, tests, compatibility
   risks, and factual-copy corrections.

The parent owns synthesis. Resolve conflict by returning to code and primary evidence; do not
average incompatible recommendations. Insufficient evidence produces explicit `unassessed` or
`unknown`, never a guessed value. Isolate real policy choices as `OWNER DECISION REQUIRED` boxes
with options, evidence, safe default, and downstream impact; decide ordinary engineering details.

Write only `docs/reports/2026-09-13-campaign-03-implementation-plan.md`. Its contents—not this
prompt or prior reports—will be the implementation model's entire brief. Make it self-contained
and executable. It must include:

1. **Mission, opening directive, non-goals, and baseline:** tell the implementer to verify current
   `origin/main` over SSH, obey `AGENTS.md`, use an own clone/branch, stop on foreign changes, keep
   production off-limits absent explicit authorization, use Luna X-High rather than Sol for any
   subagents, test, commit meaningfully, and push after each meaningful commit. Include the owner
   policy, invariants, revision/date, exact counts, verified gaps, and worklist mappings directly.
2. **Target semantics:** exact meanings and precedence for applicability, season, access/safety,
   habitat suitability, contextual activity, freshness, source health, confidence, and unknown.
   Define what a number may and may not claim.
3. **Complete 148-row decision matrix:** one row per current water ID with name/type/region;
   primary/local/catalog-background tier; title/hit/selectability thresholds; Trout and
   All-fish/focused-species behavior; season/deep-link/search behavior; species state; sources by
   metric; spatial/freshness qualification; score eligibility; and required data/copy action. No
   “repeat for remaining waters.”
4. **Per-water source/scrape plan:** stable source IDs and exact assignments/recipes for flow,
   stage, temperature, release, lake level, precipitation, DO, and other approved inputs. Include
   discovery, request, parsing, units/time zones, rate/terms, freshness/sentinels, reach validity,
   fallback, fixtures/monitoring, attribution, and API migrations. Scrapes must be permitted,
   server-side, deterministic, fixture-tested, monitored, and never browser-executed.
5. **Scoring specification reconciled to data:** species/habitat inputs and citations; equations
   or lookup curves; validity ranges; missing data; safety vetoes; freshness; confidence/coverage;
   versioning/reasons; and boundary examples. Cover trout and each supported warmwater species.
   Separate streams/tailwaters from stratified lakes. Keep weak factors as context or remove them.
6. **Typed provenance/species pipeline:** concrete schemas and validation for water/reach/species,
   fishery, season, numeric ranges, source and dates, evidence kind, confidence/reviewer, and
   supersession. Specify migration from YAML/F3, generated coverage, and honest unknowns.
7. **Sitewide behavior:** one state model and canonical URL/deep-link rules across map, labels,
   search, Browse, Conditions, Stocking, detail/drawer, settings, snapshots, offline cache,
   admin/evidence, marketing pages, SEO/schema, accessibility, and error/loading/stale states.
   Correct every misleading static claim.
8. **File-level sequence:** dependency-ordered, reviewable phases/commits. For each, list exact
   existing files, new files/artifacts/migrations, transformations, compatibility/rollback,
   generated outputs, and gates. Put absolute freshness, applicability, and source truth before
   source expansion and UI polish.
9. **Tests and acceptance:** exact unit/contract/property/provider/fixture/content/map/UI/offline/
   marketing/SEO/e2e/CI checks and commands. Include frozen-time stopped-sensor, per-parameter
   health, sentinel, spatial mismatch, all 148 decisions, every species/mode/surface, deep links,
   service-worker last-known-good, snapshot fan-out/error semantics, and copy truth.
10. **Rollout/verification:** safe migration/backfill, shadow comparisons, data versioning,
    monitoring/source drift, performance budgets, rollout, rollback, and owner-visible checks.
    Do not authorize the future implementer to touch production or deploy.
11. **Decision/risk register and definition of done:** resolved choices and rationale; only true
    policy blockers as owner decisions; evidence gaps with safe defaults; privacy/licensing/ops
    risks; exact future `KNOWN-ISSUES.md` updates after verified fixes; measurable completion.

Be decisive enough that implementation does not require redesign, but explicitly require the
implementer to re-search and reverify volatile source data immediately before coding. Every source
assignment needs a verification date and revalidation step. Do not hide missing inputs behind a
score and do not leave vague TODOs.

Inspect the plan as if receiving only it and the repo. Remove every “see prior report,” missing
water, hand-waved formula, source without recipe, phase without tests, and non-observable
acceptance criterion. Run `git diff --check`, commit only the plan, push, and state path, commit,
push status, and limitations in your final response.
~~~
