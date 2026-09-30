# WORKLIST — the one consolidated known-issues & to-do document

**Single source of truth** for everything known to be broken, incoherent, undecided, or
accepted. Merged 2026-09-12 from three sources (kept as evidence archives — consult for
repro steps and full reasoning, not for the worklist):

- **[REVIEW]** — full-spectrum review, 2026-09-11:
  [`reports/review-2026-09-11.md`](reports/review-2026-09-11.md) (21 findings, verified
  against `geoqa/statewide-verify` @ `7374636`; verdict: **do not release that revision**)
- **[LOGIC]** — product-logic audit, two passes, 2026-09-12:
  [`LOGIC-AUDIT.md`](LOGIC-AUDIT.md) (28 findings: species/season/context coherence + dead data)
- **[PRE]** — pre-existing known items carried forward.

Legend: `[ ]` open · `[x]` done. Tiers: **T0** release blockers (fix first, in order) ·
**T1** ship with the next release — data honesty & product logic · **T2** hardening &
quality · **T3** owner actions & accepted limitations. Item IDs are stable for
traceability. `[export]` = verified present in this working tree as well as the review branch.
**Execution order and session assignments:
[`EXECUTION-PLAN.md`](EXECUTION-PLAN.md).**

---

## T0 — Release blockers (in fix order)

- [x] **T0-1 [REVIEW PASS1-1] · P0 — Conditional HEAD terminates the API.** A cache-
  revalidation `HEAD` with `If-None-Match` on a static asset reproducibly kills the
  process (`ERR_HTTP_HEADERS_SENT`, Fastify 4.29.1 + @fastify/static 7.0.4;
  `apps/api/src/app.ts:72`). Nothing ships until this is fixed.
  → Fix + regression test: GET/HEAD × with/without conditional headers on every static mount.
- [x] **T0-2 [REVIEW PASS7-3] · P1 — Failed deploy can skip rollback AND block retry.**
  `deploy.sh` pulls before build under `set -e`; early failure exits before the
  verify/rollback block (archive only happens after build), and `autoupdate.sh` treats
  `HEAD == origin` as UP-TO-DATE without checking the last failure.
  → Stage + verify before switching served output; cover all mutation failures with
  rollback; track last-good revision separately from HEAD; report rollback only after
  verifying it.
- [x] **T0-3 [REVIEW PASS7-1] · P1 — Healing verifier rejects the hardened API.**
  `verify-site.sh:45` sends no watchdog token and requires the deliberately blocked
  `/v1/streams.json` file, so a healthy hardened instance fails verification.
  → Send the configured token; check the public `/v1/streams` contract; drop the
  implementation-file requirement.
- [x] **T0-4 [REVIEW PASS4-1] · P1 — Production build fails its own 25 MB size gate**
  (65.36 MB on the review branch; the gate counts more than the actual SW precache set
  of ~10 MB).
  → Slim the assets AND redesign the budget to distinguish install-time/offline bytes
  from on-demand (`apps/web/scripts/size-budget.mjs:8`). Change the limit only with
  measured, intentional acceptance.

## T1a — Data honesty & correctness (user-facing lies; ship with T0)

- [x] **T1-5 [REVIEW PASS2-2] [export] · P1 — POSIX builds silently lose ALL hatch
  charts.** `packages/content/scripts/build.ts:56` writes `name.replaceAll('/', '\\')`
  → literal-backslash filenames on macOS/Linux → `hatchCharts:0` downstream.
  → Join with the platform path API; assert all 144 region/month outputs readable.
- [x] **T1-6 [REVIEW PASS2-1] · P1 — Stale gauge metrics wear a fresh timestamp.**
  Metric aggregation in the ingest/bridge stamps month-old flow/temp with a current
  reading's time; old data scores 90 (`apps/api/src/ingest/usgs.ts:69`,
  `conditionsBridge.ts`).
  → Preserve per-metric observation time, or filter stale metrics before scoring.
- [x] **T1-7 [REVIEW PASS6-1] [export] · P1 — Stocking attaches to the WRONG water.**
  Exact-name matching ignores county: TWRA "Wolf River" (Fentress) →
  `wolf-river-west-tennessee`; "Ft. Patrick Henry TW / S. Fork Holston River" →
  `holston-river` (`apps/web/src/lib/stockingMatch.ts:56,104,125`). Also fix
  `wolf-river-fentress.yaml:16` ("Memphis-bound" conflation).
  → County/reach disambiguation before generic containment; repaired aliases; keep the
  captured rows as permanent regression cases.
- [x] **T1-8 [REVIEW PASS5-2] [export] · P1 — Prerender publishes fixture stocking as
  real releases.** With `public/v1/stocking/TN.json` absent, production prerender
  renders 15 fixture events as "15 reported releases" (`apps/web/scripts/prerender.mjs:93,425`).
  → Disable fixture fallback on factual pages; honest "unavailable" state; carry
  datePrecision + scheduled-vs-released wording into generated copy.
- [x] **T1-9 [LOGIC-22] [export] · P1 — Detail page regresses the B02 assessed-flag
  fix.** `StreamDetailPage.tsx:149` calls `statusForScore(value, hasData)` without
  `assessed` (ConditionsPage passes all three) → a genuine clamped-0 lethal assessment
  shows "Assessment unavailable" on detail while map + list show Poor.
  → Pass `snapshot.score.assessed`; add a test pinning all surfaces to identical status logic.
- [x] **T1-10 [REVIEW PASS2-3] · P2 — Feed-health detector accepts malformed rows.**
  `[{}]` and invalid timestamps → `healthy:true` (`apps/api/src/snapshots/health.ts:39`).
  → Validate rows against the contract; malformed-feed detection tests.
- [x] **T1-11 [REVIEW PASS2-4] · P2 — Shipped atlas/topo metadata fails its own
  validators.** Vertex-count drift (Duck tailwater 268 vs 267, +2 more); topo manifest
  531 tiles vs 1,021 files, 2 byte-total mismatches, 5 fully transparent tiles.
  → Regenerate manifests from final artifacts; omit empty tiles; gate the validators.
- [x] **T1-12 [REVIEW PASS7-2] · P2 — DB-copy backup fallback drops committed WAL
  data.** `infra/backup.sh:18` no-sqlite3 fallback copies the main file with the
  connection open (verified: committed insert lost).
  → Always use a supported online backup; fail loudly if unavailable; validate restores
  incl. recent writes.

## T1b — Product-logic coherence (the site must react to its own data)

Working agreement: the map's decision model (`apps/web/src/features/map/waterDecision.ts`)
is the single classification authority — plug everything into it; never bypass it.
Full reasoning per item: [LOGIC-AUDIT.md](LOGIC-AUDIT.md).

**The trout model leaks onto non-trout waters**

- [x] **T1-13 [LOGIC-1]** Detail page renders trout-score reasons ("dangerously warm —
  avoid stressing trout") and the hidden score's trend on warmwater/unverified water —
  the pill is gated, the reasons list isn't (`StreamDetailPage.tsx:167-171`).
- [x] **T1-14 [LOGIC-3]** Trout physiology baked into shared badges: `statusForTemp`
  (6–20 good, >24 poor) colors every water; 26°C summer pond reads "poor" (`:408-412`).
  Interim: color only when a trout score applies, neutral otherwise. Final: color by
  the water's applicable species score once the fishability program lands (F6).
- [x] **T1-15 [LOGIC-4]** Winter ponds render a nonsense `" cfs"` ideal-flow badge —
  guard the empty `idealFlow: []` array (`:193-199`; verified in `beech-lake.yaml`).
- [x] **T1-16 [LOGIC-5]** Map legend titled "Fishability" (`MapLegend.tsx:87`) with no
  real metric behind it. Interim: title from species mode ("Trout conditions" /
  "Water guide"). Final: "Fishability" becomes an honest title once the per-species
  metric ships (F6).
- [x] **T1-17 [LOGIC-6]** HatchTab shows "{{month}} hatch outlook" + "Match this water"
  bug-key CTA on warmwater ponds (`RiverDrawer.tsx:398-457`). Suppress or reframe for
  `not-trout` waters; for seasonal waters gate on `yearRound` (T1-19).

**Seasonal applicability: the data exists, no UI reads it**

- [x] **T1-18 [LOGIC-7]** `yearRound` is dead data — authored honestly
  (`beech-lake.yaml`: winter-only program) and consumed by ZERO UI code. Highest-value
  fix in the audit.
- [x] **T1-19 [LOGIC-8]** The decision model defines `seasonal-uncertain` /
  `seasonal-likely-absent` applicability that the adapter can never produce
  (`waterDecision.ts:14-20,66-72`). Combine `species` + `yearRound` + selected month →
  first-class "Winter program — out of season" chip on map, drawer, detail, lists.
- [x] **T2-20 [LOGIC-9]** Stocking presentation ignores season — drawer shows matched
  winter event on a July visit with no seasonal frame.
- [x] **T2-21 [LOGIC-17]** Seasonal facts live in bottom-of-page prose notes; surface
  the structured fact near the title instead.

**Species mode is half a concept**

- [x] **T1-22 [LOGIC-10]** Species mode is a map-only URL param (`?species=`,
  `RiverMapPage.tsx:36`); no other page honors it and Settings has no such preference.
  DECIDED 2026-09-12: site-wide setting — Dexie-persisted, default **Trout**, filters
  and re-words data on every surface. Implementation rides the fishability program (F6).
- [x] **T2-23 [LOGIC-11]** The "Trout waters" chip conflates species and assessed-only
  into one toggle (`RiverMapPage.tsx:356`). Rework the filter row as independent dims.
- [x] **T2-24 [LOGIC-12]** Conditions list sorts by a score it hides — non-trout rows
  reorder by an invisible number (`ConditionsPage.tsx:130`). Sort by displayed state.

**Dead data — served/authored, zero consumers (all DECIDED 2026-09-12 — see items)**

- [ ] **T2-25 [LOGIC-18]** The entire `/v1/evidence/waters.json` evidence layer
  (WaterEvidence contract, observedAt-vs-retrievedAt, source qualifiers) has ZERO
  consumers in web/admin/marketing. DECIDED 2026-09-12: keep serving the endpoint for
  owner use; no main-app UI (redundant in-app, scrape-exposure concern); add a
  low-key marketing "our data & sources" page (methodology summary, raw evidence one
  click deeper) → new item T2-54 below.
- [x] **T2-26 [LOGIC-19]** `stockingRecent` endpoint mapped but never fetched;
  StockingPage downloads full history (623+ rows, grows forever) and re-filters
  client-side (`StockingPage.tsx:150,165-171`). DECIDED 2026-09-12: consume it —
  default view reads the rolling file; full history fetch only on "show all history."
- [x] **T2-27 [LOGIC-20]** Shop report `photoUrl` renders only in the admin composer —
  no public surface shows photos (ShopsPage, drawer ReportsTab). DECIDED 2026-09-12:
  render them publicly alongside the attribution block, per ADR 0002.
- [x] **T2-28 [LOGIC-2]** TRANSITION RULE — keep the trout score fully suppressed on
  warmwater water until the fishability program (below) ships; after that, suppression
  converts to "right score for the right species." The interim leak fixes (T1-13..17)
  are built neutral either way, so nothing here blocks them.

**Copy & removals**

- [x] **T2-29 [LOGIC-24 + PRE halo follow-up]** Three stories about hatch halos:
  legend says "dominant hatch" (`MapLegend.tsx:116`), code draws one amber halo for ANY
  charted guidance ≥1 (`RiverMapPage.tsx:337-341`), map help says "regional hatch
  guidance" (`:789`). Rewrite copy to match behavior — or implement the
  intensity-by-abundance ramp (the long-standing follow-up) and keep dominance copy.
- [x] **T2-30 [LOGIC-13]** "Live · observed" freshness chip implies live fishability on
  gauge-only warmwater water. Reword ("Gauge live · observed").
- [x] **T2-31 [LOGIC-25]** Conditions subtitle "Gauge-fed trout assessments" overclaims
  — rows include warmwater/unverified water with honest per-row status.
- [x] **T2-32 [LOGIC-26]** Drawer stocking "· 1,500 fish" → "· 1,500 fish scheduled"
  when `datePrecision != 'day'`.
- [x] **T2-33 [LOGIC-15 + 27]** REMOVE the "Default state" setting and pin TN. NOT
  vestigial: it actively filters Conditions/Stocking/other state-scoped pages
  (`ConditionsPage.tsx:75,111`) — set to anything else, pages silently empty.
- [x] **T2-34 [LOGIC-16]** REMOVE `?all=1` full-state toggle (`useMapState.ts:16`,
  `RiverMapPage.tsx:39,664`, `TennesseeMap.tsx:64-66,159,351`) — owner decision: it
  bypasses the decision model, a leftover from blank-region days. Keep `?qa=1`
  (different thing); consider a dev flag for it.
- [ ] **T3-35 [LOGIC-28]** Per-water fishing info is only ever queried for
  'special-regulations'; the `appliesTo` mechanism supports any section. Fine today —
  don't author stranded per-water content elsewhere until a surface asks for it.

## T2 — UX, accessibility, offline, security hardening

- [x] **T2-36 [REVIEW PASS3-1] · P2** Global `/` search shortcut focuses a hidden input
  at desktop width (`AppShell.tsx:141` vs hidden map search, 0 px vs 325 px). Visible
  search owns the shortcut; hidden instances drop listeners.
- [x] **T2-37 [REVIEW PASS3-2] · P2** Mobile water detail buries the decision: long
  assessment card, split badges, clipped empty gauge table before the useful source.
  → Compact status header (state, age, flow, temp, one action); gauge history in a
  disclosure; purposeful empty states.
- [x] **T2-38 [REVIEW PASS3-3] · P2** Browse/detail spend space on low-value repetition
  (large low-info cards, repeated unavailable states). → Denser comparable rows; first
  viewport = the answer; one expandable caveat block.
- [x] **T2-39 [REVIEW PASS3-4] · P2** Hatch key opens with expert hook-size jargon, no
  uncertainty path (`HatchKeyPage.tsx:203`). → "Not sure" option, visual size
  reference, plain-language sizes, preserve unknowns in the matcher, "Step 1 of 6".
- [x] **T2-40 [REVIEW PASS3-5] · P2** App/portal/marketing read as three products.
  → Share the token system, type, radii, button states; replace emoji empty states.
- [x] **T2-41 [REVIEW PASS3-6] · P3** Shared dialog/close controls 36–38 px — raise hit
  areas to ≥44 px while keeping glyphs compact (`packages/ui/tokens.css:288,346`).
- [x] **T2-42 [REVIEW PASS4-2] · P2** Offline hatch key ignores SW-cached content —
  Dexie cleared + offline → "not on this device" while the SW serves the pack 200.
  → Try cache-backed fetch / bundled pack before declaring unavailable; test
  SW-present/Dexie-absent separately.
- [x] **T2-43 [LOGIC-23]** matchHatch silently drops the +2 chart signal when the
  region-month chart isn't cached (`HatchKeyPage.tsx:133-135`) — results re-rank with
  no notice. Show "chart not cached — matching by key features and season only."
- [ ] **T2-44 [REVIEW PASS4-3] · P2 (branch-only)** Creek-network clusters lack
  persistent offline caching (`networkClusters.ts:191`). → Bounded persistent cache for
  visited clusters or label the layer "requires connectivity."
- [x] **T2-45 [REVIEW PASS1-2] · P1 — Portal proxy buffers unauthenticated bodies
  before auth** (`infra/static-server.mjs:85`): 1 MiB accepted before the API's 401/
  128 KiB limit. → Early streaming byte limit + bounded duration, incl. missing
  Content-Length.
- [x] **T2-46 [REVIEW PASS7-4] · P2** Dependency symlinks with absolute machine-local
  targets are TRACKED in git — clones follow them into the original machine's
  node_modules (already bit the review session). → Untrack; add a tracked-artifact
  check for absolute links.
- [x] **T2-47 [REVIEW audit]** Dependency advisories: 1 critical / 9 high / 19 moderate
  / 5 low — complete the reachability triage; schedule recurring audit.

- [x] **T2-55 [NEW 2026-09-12]** Statewide network builder (`scripts/nhd-network-build.mjs`) lacks the catalog-pid exclusion that d51f307 added to `nhd-network-proof.mjs` — raw NHD linework can draw gray shadows over catalog rivers statewide. Apply the same sourceIds exclusion and regenerate.

- [x] **T2-56 [CHECKPOINT 2026-09-12] — duplicate visible dialog on water select (ASSIGNED: Session C, Stage 2).** After selecting a water via search, `[role="dialog"]:visible` containing the water's heading resolves to TWO elements (`web/atlas-verify.spec.ts` strict-mode failure at desktop AND mobile 390px). Three role="dialog" sites: AppShell.tsx:197 (nav menu — not the culprit), RiverDrawer.tsx:51/:81. RiverDrawer is rendered twice and both instances are :visible — find the render condition/CSS regression (likely from the search-themes integration) and fix.
- [x] **T2-57 [CHECKPOINT 2026-09-12] — fieldwork e2e suite is stale (ASSIGNED: Session C, Stage 2).** 23 of 25 checkpoint e2e failures are `e2e/fieldwork/ui.spec.ts` specs written against the pre-evolution UI (e.g. expecting the hatch key's "2 tails" step before the current first step). For each: fix the spec if the app is right, fix the app if the spec is right. The other 2 failures are T2-56. Note: `pnpm e2e` (and qa.yml) stay red on these until Session C lands the fixes — expected.

- [x] **T2-58 [NEW 2026-09-16] — Failed auto-deploy alert has no diagnostic context.** The ntfy body only said to inspect a host-local log, and a first high-priority failure with no prior status did not page at all. → `alert-context.mjs` now sends a bounded, secret-redacted updater tail plus WinSW state/log tails; updater/watchdog page first high-priority failures; regression coverage includes the actual alert body.

## T3 — Owner actions, backlog, accepted limitations

**Owner actions**

- [ ] **T3-48 [PRE]** Create the Cloudflare Web Analytics token; set
  `VITE_CF_ANALYTICS_TOKEN` at build time (until then production ships zero analytics —
  by design, but the disclosure page is ready).
- [ ] **T3-49 [PRE]** WAF kill-switch documented (`docs/OPERATIONS-ANALYTICS.md`), NOT
  applied — apply only in an emergency.

**Data/content backlog**

- [ ] **T3-50 [PRE]** `mill-creek-overton` gauge evidence wrong in catalog (gauge
  03539778 is actually Clear Creek at Lilly Bridge) — re-anchor from NWIS.
- [ ] **T3-51 [PRE]** Elk River ~6 km uncataloged NHD arm (Bradley Creek junction →
  Tims Ford pool) — deliberate content decision.
- [x] **T3-52 [PRE]** ~35 candidate waters from the 2026-09-08 TWRA scan (Cherokee TW,
  paint-creek, ...) needed geometry before entering the catalog. Resolved 2026-09-16:
  the 40 approved additions now have deterministic raw-NHD trace recipes and the
  Conasauga TIGER exception is documented; unresolved candidate identities remain
  outside the selectable catalog.
- [ ] **T3-53 [PRE]** Stocking → map highlight remains the stretch goal.

**Accepted limitations (documented, do not file as bugs)**

- `?qa=1` client audit thresholds are looser than build-time detectors — expect more
  rows; not a bug. [PRE]
- `stockingMatch.test.ts` needs generated `public/v1` artifacts on fresh clones (seed +
  snapshots) — skips honestly. [PRE]
- Service-worker responses should preserve original fetch age (recommendation from the
  B03 freshness work). [PRE]
- Review PASS6-1 scope note: uncataloged candidate ponds are an accepted limitation;
  the broader "tailwater rows unmatched" claim was retracted by the review itself.

## ACCURACY CAMPAIGN CLOSEOUT — 2026-09-13/14

- [x] **NEW-1 / OA-01** — Conditions now use an absolute observation-age gate; a fresh
  fetch cannot make a stopped sensor look current.
- [x] **NEW-2** — The unconsumed CORT1 fetch was removed; Cordell Hull remains a
  coverage-only candidate until the Cumberland reach decision changes.
- [x] **NEW-3** — The retired empty `lakes.geojson` layer was removed and guarded by an
  atlas-artifact regression test.
- [x] **NEW-4** — Snapshot/fishability comments now describe the actual multi-factor
  and context-only behavior.
- [x] **NEW-5** — Latest-value selection parses timestamps before ordering mixed offsets.
- [x] **NEW-6 / T1-22** — Persisted Trout/All-fish mode now propagates through map,
  browse, conditions, stocking, detail, drawer, and fishability wording.
- [x] **OA-04** — Authored display tiers are applied to all 148 waters; reference waters
  remain searchable/selectable without automatic map titles.
- [x] **OA-06** — Marketing titles and descriptions are species- and artifact-aware;
  unavailable fishability/flow claims are omitted.
- [x] **OA-07** — Coverage JSON was regenerated with Bradley Creek and the current
  50-site accounting.
- [x] **OA-09** — `idealFlowSource` is now an additive authored field; existing ranges
  are explicitly editorial and displayed as typical ranges.
- [x] **OA-10** — The 39-water fishability file set is intentional; all other waters
  remain honestly absent rather than receiving empty promises.
- [x] **T2-20 / T2-21 / T2-28** — Seasonal stocking state is surfaced near the water
  title and the fishability program replaces the old warmwater suppression transition.

Campaign owner actions and accepted limits: obtain and configure the server-only USGS
Water Data API key before the Q1 2027 WaterServices retirement; ask USACE Nashville
District for release schedules; obtain TWRA Region 3/4 confirmation for Obed/Powell
wild-trout claims; and re-pin Gatlinburg creel counts before displaying them. Pressure
is context-only (never a score factor), lake temperature, satellite SST, CWMS,
rivergages, and weather.gov legacy endpoints remain unwired. TDEC advisory and DWR
attainment feeds are documented safety/context sources; they require a future
server-side text/mapping pass before affected-water badges can be emitted.

## DECIDED (owner, 2026-09-12)

1. **Fishability: BUILD it — per-species scores.** Warmwater anglers are first-class
   users; nothing is "discriminated" out. (Owner Q&A: granularity = per-species.)
2. **Species mode: site-wide setting, default Trout.** The selection changes the data
   you receive — filtering and re-wording on every surface, not just the map.
3. **Evidence pipeline: keep serving for owner use + low-key marketing page.** No
   main-app UI (redundant with in-app citations; scrape-exposure concern noted).
4. **stockingRecent: consume it** (default view = rolling file; full file on demand).
5. **Report photos: render publicly** per ADR 0002.

## NEW WORKSTREAM — Fishability program v2: comfort + ACTIVITY, per-species

Decisions 1 + 2 (2026-09-12) plus the owner's expansion: the metric must capture not
just *comfort/safety* (is the water livable — the current trout model's whole world)
but **activity** — will fish actually feed? Owner-called factors: barometric pressure,
spawning state, water temp, rain, "etc." Design below keeps every existing principle:
deterministic, offline-capable, every factor measured-with-source or explicitly
labeled, no factor without citable provenance.

**Two-axis model.** Every scored water carries (a) the comfort score (existing
semantics: temp/flow livability) and (b) an **activity outlook** — a transparent
breakdown of feeding-activity factors. The breakdown IS the product (reasons-culture):
each factor shows its value, its contribution, and its source. Ranked catch-all
"solunar" folklore is EXCLUDED (see F12).

Sequencing: T0/T1 ship FIRST with neutral non-trout presentation; this program lands
after; then neutral swaps to species-colored comfort + activity.

- [x] **F1 · Contract v2 (ADR + tag bump).** `FishabilityScore` (species-keyed comfort,
  value 0–100 + reasons + assessed) PLUS `ActivityOutlook` schema: total 0–100 +
  ordered `ActivityComponent[]` — `{ factor, value, contribution, weight, evidenceUrl,
  confidence: measured|derived|heuristic, label }`. Deterministic; additive
  `ENDPOINTS`; contracts coverage gate applies.
- [x] **F2 · Per-species reference data (content pack).** For each species: comfort
  bands (lower/upper active, optimal range, avoidance, lethal) AND activity profile —
  pre-spawn/spawn/post-spawn water-temp thresholds, flow-trend preference (stable/
  falling favorable; hard-rising unfavorable), pressure-trend sensitivity. Every band
  cites TWRA + primary literature; `validate:content` extended to enforce citations.
- [x] **F3 · (39 waters authored across two evidence-gated passes; remaining unset waters listed with reasons — research continues) Catalog data.** `species` enum extension: warmwater waters record WHICH
  species they hold, authored from TWRA evidence (2026-09-08 capture already has
  species-adjacent notes). Unknown stays unknown — never guessed. Pair with T3-52
  (candidate waters enter with species data from day one).
- [x] **F4 · Scorer.** `scoreFishability(readings, species, bands)` for comfort
  (mirrors `scoreConditions`: clamped-0 lethal vs cannot-assess, per-metric
  observation age) and `scoreActivity(components)` — deterministic, client-side,
  total = weighted components, never mutates inputs. Property tests + coverage gate.
- [x] **F5 · Pipeline.** Snapshot build emits comfort + activity per water for its
  cataloged species; `conditionsFeedHealth` + the malformation detector (T1-10)
  cover the new rows; fixtures regenerated.
- [x] **F8 · NEW SOURCE — barometric pressure via NWS.** `api.weather.gov` (public
  domain, no key — fits the USGS-etiquette model): station/gridpoint pressure +
  3-hour trend mapped to each region (area-level, NOT per-water — the label must say
  "area pressure"). New provider follows the evidence/monitors registry pattern;
  `observedAt` vs `retrievedAt` discipline; freshness + staleness rules.
- [x] **F9 · Spawn-state model.** Computed, not calendared: water temp crossing
  species thresholds (F2) drives PRE_SPAWN (+activity, "aggressive"), SPAWNING
  (neutral score + conservation note — "on beds, handle and release quickly"),
  POST_SPAWN (−, "recovering"). Wide uncertainty windows; labeled `derived`.
- [x] **F10 · Activity presentation.** Detail/drawer: breakdown rows (one per factor:
  temp position, flow trend, pressure trend, spawn state) each with contribution +
  source link + confidence label; total with honest wording ("activity outlook",
  never "fish will bite"). Map/legend: all-fish mode colors by focused-species
  comfort; activity shown as the per-water detail, not map color (avoid
  color-carrying-two-meanings).
- [x] **F11 · Time-of-day windows (client-side, deterministic).** Dawn/dusk feeding
  windows computed from the water's coordinates + date (solar tables — no API, no
  location permission needed). Presented as "today's windows," labeled heuristic.
- [x] **F12 · EXCLUDED factors — documented, revisit only with owner push.**
  (a) **Rain/stain as a scored factor**: the gauge side is already captured by flow
  trend; the bite side depends on water clarity, which cannot be measured remotely —
  scoring it would violate measured-not-guessed. Compromise shipped instead: a
  context note ("recent rain — expect stain/rise," from NWS precip, F8's source).
  (b) **Solunar/lunar tables**: evidence too weak for the citation culture; excluded
  outright. (c) **Turbidity/clarity**: no gauged source; same reasoning as rain.
- [x] **F6 · UI (decision 2).** Site-wide Trout/All-fish setting (Dexie-persisted,
  default Trout, Settings page entry + header affordance). All-fish mode gains a
  species focus picker. Map colors/legend, temp/flow badges, detail page, drawer,
  conditions/stocking/browse lists, search and near-me all consume fishability for
  the focused species. `WaterDecisionView` grows species-keyed comfort + activity;
  the interim neutral presentations from T1-13..17 convert here.
- [ ] **F7 · e2e.** Privacy spec unchanged (zero third-party still holds — NWS is a
  FIRST-PARTY server-side fetch, ingested like USGS, never a browser call); offline
  flows cover the new snapshots; marketing evidence page (T2-54) in the marketing suite.
- [x] **T2-54 · Marketing "our data & sources" page** (decision 3): methodology
  summary on the marketing site — now including the activity model's factor list and
  evidence-strength labels; raw per-water evidence (`/v1/evidence/waters.json`) one
  click deeper; no tracking, no main-app changes.

## NEW WORKSTREAM — Evidence-backed fishery opportunities (ADR 0010, 2026-09-22)

The 2026-09-21/22 evidence audits (branch `codex/evidence-methods-audit-20260921`)
reproduced that prior classification layers could not certify their labels
(synthetic Nov–Mar seasons, unchecked-string no-trout gates, lake/tailwater
inheritance). ADR 0010 adds the authored `opportunity` block (headline
year-round-trout / seasonal-stocked-trout / warmwater-focus / mixed /
unresolved + claim-specific sources), removes the seasonal fallback, and makes
unresolved a first-class visitor-facing state. The 190-water evidence ledger
lives at `docs/research/2026-09-22-fishery-opportunities/` with its seed,
captures + source log, adjudication brief, and verify checks
(`packages/content/scripts/opportunity/verify-ledger.mjs --final`). The follow-up
repair audit is `docs/reports/2026-09-22-evidence-branch-repair.md`.

- [x] **OPP-1** — Contract, decision model, UI card, prerender wording, fallback removal.
  The follow-up removed the old trout-calendar presence card and generated asset,
  and prevents scheduled stocking months from earning a current trout-condition score.
- [ ] **OPP-2 (owner)** — Review the adjudication verdicts, especially the owner boxes in
  `docs/research/2026-09-22-fishery-opportunities/owner-corrections-report.json`
  (22 demonstrably wrong programmatic month windows have been removed; other
  yearRound/season fields, species claims, and region tags still need owner review).
  Current opportunity counts after the repair audit: 29 year-round, 61 seasonal,
  55 warmwater focus, 10 mixed, 35 unresolved. Do not use the superseded counts
  in the first implementation report.
- [ ] **OPP-3 (owner/data holders)** — Unresolved waters' next sources: TWRA completed-release
  history beyond the 10-row rolling window; TVA stream station export; the
  2025 planned Coldwater-Summit survey results; Paris City Park pond identity;
  Fishbrain production-reuse permission.
- [ ] **OPP-4** — Opportunistic follow-ups: wire the ledger's unresolvedQuestion into the
  marketing "our data & sources" page (T2-54 extension); consider a
  ledger-diff review surface for future re-adjudications.

## SENIOR CODE AUDIT 2026-09-29 — REMEDIATION WORKLIST (F01–F48)

Full report: [`reports/2026-09-29-senior-code-audit.md`](reports/2026-09-29-senior-code-audit.md)
(2 P1, 41 P2, 5 P3 @ canon 14a92bc). Remediation runs in waves on
`codex/audit-remediation-20260929`; this list is updated as findings land.
Wave 1 integrated @ 31437a6 (gates: build/content/test 893/infra 12/lint all green).

### Wave 1 — urgent integrity and test foundation (MERGED)

- [x] **F01 P1** — Water Data parser merged every parameter under the newest metric's
  timestamp, so a working flow sensor kept a stopped temperature sensor fresh
  (`usgs-waterdata.ts:80`). Fixed: additive `metricTimes` per-metric map
  (contracts gauge schema), parser preserves per-metric observation times, T1-6
  freshness gate ported to the default parser, `scoreFishability` freshness keys off
  `metricTimes.tempC`. Branch w1a `cdb4421`.
- [x] **F02 P1** — POST /v1/portal/reports ran the whole snapshot builder without the
  content pack, wiping species assessments catalog-wide; INSERT preceded snapshot I/O
  so a failed feed write double-inserted on retry. Fixed: route publishes only
  `v1/reports/recent.json` via `publishReportFeed` (same bytes as scheduled builds);
  acceptance separated from feed publication (201 + `feed.published` truth);
  optional `Idempotency-Key` header replays the stored report (migration 018 partial
  UNIQUE index). Admin client adoption of the header tracked in F15. Branch w1b `d92d119`.
- [x] **F03 P2** — known-offline branch skipped the Dexie/SW recovery tier (installed
  SW content unused with empty Dexie). Fixed: offline path shares the recovery tier;
  Workbox `__WB_REVISION__` keys recovered with `ignoreSearch` fallback. Branch w1d `06b16a5`.
- [x] **F10 P2** — browser e2e gate red (ignored-data leakage, no fishability fixtures,
  obsolete 148-water/month-policy expectations). Fixed: deterministic fixture tree
  (explicit clock, fishability + stocking-recent emission, isolated from gitignored
  snapshots), specs updated to current policy, touch-polygon failure diagnosed as
  harness (reference-tier hit-layer mismatch). Suite: 105 passed / 0 failed / 1
  documented fixme pending F25. Branch w1e `b7ef57e`.
- [x] **F19 P2** — recursive lint gate red (27 errors/33 warnings). Fixed: script
  runtime globals configured, real dead symbols removed; `pnpm -r lint` exits 0.
  Branch w1e `1a1bb89`.
- [x] **F29 P3** — terrain cache invalidation recorded the new generation before
  `caches.delete` succeeded. Fixed: delete first, marker advances only on success,
  retryable. Branch w1d `06b16a5`.
- [x] **F32 P2** — a failed Dexie cache write discarded the successful fresh fetch and
  served stale data. Fixed: persistence is best-effort; validated current response
  always returned (`live:true`) with `persisted` surfaced. Branch w1d `06b16a5`.
- [x] **F34 P2** — latest-value selection ordered ISO timestamps as text in SQL and
  evidence providers (DST repeated hour hid newer readings). Fixed:
  `latestReadings` orders by `julianday(observed_at)`, evidence providers compare
  parsed instants. TVA-provider instance of the same bug fixed in the F05 wave. Branch w1a `cdb4421`.
- [x] **F41 P2** — transient cluster fetch failure cached for the whole map session.
  Fixed: failed/null promises evicted, bounded retry with cooldown, valid-empty kept
  distinct from error. Branch w1d `06b16a5`.
- [x] **F46 P2** — failure status writes preceded transition checks, suppressing
  backup/refresh failure pages. Fixed: `trout_alert_init` owns prior-state capture;
  dispatch order can no longer erase a transition. Branch w1c `3b8d9a4`.
- [x] **F47 P2** — watchdog announced recovery on every persistently-degraded check.
  Fixed: health read once, final state decided, recovery only on true degraded→OK.
  Branch w1c `3b8d9a4`.

### Wave 2 — data publication and source integrity (MERGED @ 6e47601 + lint follow-up; api 323 / admin 32 / web 387 / contracts 200 / content 19, infra 12, lint green)


- [x] **F05 P2** — production WinSW refresh omits stocking/evidence feeds; NWS pressure
  job has no application caller; missing/never-run expected jobs escape health.
  → Fixed (lane C): refresh-data ingests pressure hourly; new daily `trout-refresh-feeds` schtasks task runs stocking+evidence under the deploy-stamp guard; pressure wired as dispatcher job (`--job=pressure`); EXPECTED_JOBS health reports stale/never-run jobs.
- [x] **F06 P2** — portal-origin "My reports" fetches `/v1/reports/recent.json` which
  the portal proxy does not forward (404).
  → Fixed (lane E): static-server forwards the allowlisted public read GET/HEAD `/v1/reports/recent.json`; e2e validates "My reports" from the portal origin.
- [x] **F14 P2** — public gauge route: unbounded distinct-key upstream fan-out, no
  cache eviction/concurrency cap.
  → Fixed (lane C): upstream concurrency cap (4) + bounded queue (503 GaugeNowBusy on overflow) + 2000-entry cache with expired-then-oldest eviction; unwired gauges stay fetchable.
- [x] **F15 P2** — accepted publication leaves a reusable draft; local-save failure
  reported as publish failure.
  → Fixed (lane E): server acceptance is final — draft removed on 2xx, local-save failures surface separately; admin sends a stable per-draft `Idempotency-Key` (F02 replay contract).
- [x] **F16 P2** — unpublished drafts shared across shop identities.
  → Fixed (lane E): drafts namespaced/ownership-bound per shopId and re-validated on read; legacy v1 drafts quarantined with count-only disclosure + explicit two-step clear.
- [x] **F21 P2** — failed snapshot build publishes part of the new generation
  (per-file atomicity, no generation atomicity).
  → Fixed (lane A): staged-generation build → backup-then-promote with sha256 verification and verified rollback; interrupted promotions recover on the next build.
- [x] **F22 P2** — catalog seeding retains deleted waters and partly applies failed runs.
  → Fixed (lane A): seed validates every file before one transaction; removals soft-archive (`archived_at`, migration 019); returning YAML reactivates.
- [x] **F23 P2** — rollback rebuilds with new dependencies and different publication
  steps; announces success on partial restoration.
  → Fixed (lane B): rollback reinstalls from the restored lockfile and reuses the ordinary real-data/SEO pipeline (shared prerender_and_marketing); success announced only when every rollback step verifies.
- [x] **F24 P2** — archive/restore deletes the good tree before promotion succeeds.
  → Fixed (lane B): retain-until-promoted — old generation renamed aside, staged swap verified, only then aside deleted; every failure undoes into place; batch restore undoes atomically.
- [x] **F33 P2** — complete upstream ingestion failure recorded as a healthy run;
  last-good evidence observations discarded.
  → Fixed (lane C): evidence job outcome ok/degraded/failed from expected sources; failed → jobs_log error → healthz degraded; last-good observations carried forward with stale-last-good provenance; gauges dispatcher propagates failure.
- [x] **F35 P2** — month-only stocking schedules ignore remaining months this year.
  → Fixed (lane D): nearestListedMonthDate picks the nearest listed current/future month, rolling the year only after all listed months pass; precision stays month.
- [x] **F36 P2** — TWRA raw captures collide on one filename (schedule vs completed grid).
  → Fixed (lane D): captures named {runStamp}.{seq}.{gridKind}.{source}.{suffix} + URL/sha256 manifest written last as the commit record; grids never collide.
- [x] **F37 P2** — NWS rainfall parsing rejects the real quantitative-value shape.
  → Fixed (lane C): quantitative-value object parsed (value/unitCode; null = no-data; documented unit conversion); authentic KBNA fixture replaces the invented scalar.
- [x] **F38 P2** — KMOR/KMRN weather-station mappings point at the wrong localities.
  → Fixed (lane C): Pigeon/French Broad → KMOR (verified Morristown TN); Caney Fork → KCSV (Crossville, verified); out-of-state KMRN removed; official provenance recorded.
- [x] **F48 P2** — fresh snapshots carry expired pressure trend indefinitely.
  → Fixed (lane A): pressure context age-gated at build (6 h window, matching the rain gate); expired rows omitted with a warning; payload keeps observedAt for Wave-3 client display.

### Wave 3 — freshness, maps, accessibility, user-facing truth (IN PROGRESS — 7 fixed by the coordinator lane, remainder in flight)

- [ ] **F04 P2** — cached species assessments keep current confidence indefinitely.
- [ ] **F07 P2** — marketing embed reverses assessed semantics; different score bands.
- [ ] **F08 P2** — stocking plans acquire exact dates and completion labels across
  React/prerender/Astro.
- [x] **F09 P2** — repeated prerender nests homepage body inside other routes.
  → Fixed (coordinator lane): pristine-shell normalization — stripPrerenderedRoot restores the empty #root and head whitespace is collapsed; three consecutive prerender runs are byte-identical with per-route bodies (apps/web/scripts/prerender-shell.mjs + pinned unit tests).
- [x] **F11 P2** — solar equation-of-time missing radians→degrees (9.67 min drift).
  → Fixed (coordinator lane): equation of time now 4·radToDeg(E) (apps/web/src/lib/solar.ts); EOT pinned across the annual range against the standard independent approximation and NOAA crossing references corrected (the old Memphis reference encoded the bug).
- [x] **F12 P2** — UTC calendar days become local draft dates / "today's" windows.
  → Fixed (coordinator lane): civilDate() + solarWindowsForCivilDate() drive the "Today's windows" card; draft todayIso() uses the local civil calendar; time acquisition stays in callers.
- [x] **F13 P2** — rapid preference patches overwrite each other.
  → Fixed (coordinator lane): preference updates merge the LATEST stored record inside a serialized Dexie readwrite transaction; rapid patches can no longer overwrite each other.
- [ ] **F17 P2** — header overflows a 320px viewport (nav off-screen).
- [ ] **F18 P2** — blocked storage read blanks the map entry page.
- [ ] **F20 P2** — light-theme legend text near-white-on-white (1.13:1).
- [ ] **F25 P2** — invisible oversized legend wrapper blocks the desktop zoom button.
- [x] **F26 P3** — regional geometry validator dereferences retired lakes.geojson.
  → Fixed (coordinator lane): the retired passive-lakes check was removed; the validator completes (48 features / 18 lakes / 30 reaches / 0 errors) with all remaining geometry checks intact.
- [ ] **F27 P2** — marketing footer targets below minimum size/spacing (9 templates).
- [ ] **F28 P2** — terrain readiness probes a missing tile; SPA 200 shell masquerades
  as a tile.
- [x] **F30 P3** — "All fish" accessible name mismatch.
  → Fixed (coordinator lane): accessible name is "All fish mode", containing the exact visible text.
- [ ] **F31 P2** — non-map routes eagerly load the entire map/route bundle.
- [x] **F39 P3** — inert newsletter form reports success on 405/500.
  → Fixed (coordinator lane): only verified 2xx claims subscription success; 405/5xx disclose failure; 404/501 stay the documented v1 demo stub.
- [ ] **F40 P2** — map never requests West Tennessee hatch charts.
- [ ] **F42 P3** — QA crossing overlay computed on the wrong segment parameter.
- [ ] **F43 P2** — map Trout controls cannot override a saved All-fish preference.
- [ ] **F44 P2** — fishability/focus/palette changes do not invalidate memoized map colors.
- [ ] **F45 P2** — touch taps select a river before an overlapping gauge/stocking overlay.

## REGRESSION TESTS TO ADD ALONGSIDE THE FIXES

Conditional HEAD on every static mount (T0-1) · deploy-failure → rollback path (T0-2) ·
verifier against hardened routes (T0-3) · POSIX content build reads all 144 charts
(T1-5) · county-ambiguous stocking names (T1-7) · prerender without snapshots renders
honest unavailability (T1-8) · statusForScore parity across map/list/detail incl.
`assessed` (T1-9) · malformed conditions feed → unhealthy (T1-10) · WAL-mode backup
restore includes recent commits (T1-12) · seasonal decision states (T1-19) ·
chartless matchHatch notice (T2-43) · SW-present/Dexie-absent content recovery (T2-42) ·
scoreFishability boundaries + per-species bands + clamped-0 vs cannot-assess (F4) ·
scoreActivity component weights + trend direction (F4/F8) · spawn-state temp
thresholds (F9) · site-wide mode filters every surface (F6).
