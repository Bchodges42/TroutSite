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

## Data integrity — 2026-10 (audit 2026-10-14; branch `claude/data-integrity-20261014`)

Owner's #1 complaint: the live data has not been accurate. Full findings, evidence
and fix status: [`reports/2026-10-14-data-integrity-audit.md`](reports/2026-10-14-data-integrity-audit.md).
Every `[x]` below is fixed on the branch with a regression test built from the
2026-10-14 upstream captures; it reaches users only when the owner merges to `main`.

**Fixed on the branch**
- [x] **DI-1 · P0 — TVA "Noon"/"Midnight" release rows silently dropped** (Clinch showed
  "no published schedule" while ~8,050 cfs was releasing). Parsed; end ≤ start rolls to the
  next day; partial parses fail closed + count as job errors. `e782c29`
- [x] **DI-2 · P2 — schedules:** status from the release fetch only; schedules older than
  3 h withheld at build (no stale Now/Next). `e782c29`
- [x] **DI-3 · P1 — TVA/USACE tailwater ELEVATION (≈827 ft MSL) published as "Stage"** beside
  USGS gage heights (~2 ft). No longer stored as `heightFt` (raw kept for audit). `e782c29`
- [x] **DI-4 · P1 — 23 stocking events invented in 2027** from the "2026" schedule. Month
  windows stay inside the schedule year. `ca97c82`
- [x] **DI-5 · P1 — ghost stocking rows** (upsert-only; postponed rows kept at old + new
  dates). Schedule rows replaced per fetch. `ca97c82`
- [x] **DI-6 · P1 — zero-row / collapsed stocking fetch recorded ok.** Now a job error
  (keeps stored rows). One failing grid no longer fails the ingest. `ca97c82`
- [x] **DI-7 · P1 — past schedule rows labelled "Reported completed"; TWRA's completed
  Locations Report never shown.** Report rows published as `status: 'reported'`
  ("Stocked · TWRA report"); past schedule rows read "date passed". ADR 0012. `ca97c82` `97d3f77`
- [x] **DI-8 · P1 — county-blind stocking matches** (Mill Creek/Hickman, Piney/Rhea, Laurel
  Creek/Van Buren, Laurel Fork/Campbell). County agreement required. `97d3f77`
- [x] **DI-9 · P1 — Stocking chip showed download time ("just now" on a dead feed).** Shows
  TWRA fetch time; "TWRA stale" after 2 days; offline chip shows the date. `97d3f77`
- [x] **DI-10 · P2 — "week of" rows flipped to past on the Sunday.** Scheduled until Sunday + 5. `97d3f77`
- [x] **DI-11 · P0 (ops) — refresh-data/backup failure pages never fired** (status written
  before the push compared it). `84acac3`
- [x] **DI-12 · P0 (ops) — stocking only ingested on deploy.** Read daily by refresh-data. `84acac3`
- [x] **DI-13 · P1 — default USGS provider published years-old parameters as live** (Duck
  tailwater 2012 temperature). 3 h per-parameter gate + OGC long-form qualifiers. `3a31883`
- [x] **DI-14 · P2 — "USGS tva:HADT1" labels.** Real agency per gauge. `3800393`
- [x] **DI-15 · P1 — /healthz blind to stale/partial data.** Degraded on ok-with-errors,
  gauges > 6 h, stocking > 48 h (watchdog pages). `e8ab508`
- [x] **DI-16 — Guardrail: daily truth check** (published vs USGS/TVA/TWRA; pages on
  mismatch). `890eb10`
- [x] **T3-50** (below) — `mill-creek-overton` already carries `gaugeIds: []` on `main`.

**Owner decisions / actions**
- [ ] **DI-O1 — DNS:** `trout.tntechclimb.com` is NXDOMAIN (2026-10-14); restore the Cloudflare
  DNS record / Tunnel public hostname (`infra/cloudflared/`, RUNBOOK).
- [ ] **DI-O2 — Approve ADR 0012** (`StockingEvent.status`, contracts 2.5.0) and merge the branch.
- [ ] **DI-O3 — Out-of-range flow can still score "Good"** (Hiwassee 480 vs 500–3500 → 77;
  Daddys 26.3 vs 30 → 81) while the reason says "water is low". Scorer policy: recommend
  capping out-of-range flow at Fair, or a ±10% "slightly below/above" tolerance with matching copy.
- [ ] **DI-O4 — Multi-gauge waters:** newest timestamp wins per metric, so flow and
  temperature can come from different sites (Harpeth: Bellevue 69.3 cfs scored "Good" while
  Franklin, the catalog reach, read 10.6). Choose a primary gauge per water.
- [ ] **DI-O5 — Confirm `USGS_WATERDATA_API_KEY` on the production host** (keyless quota is
  shared with the public gauge-tap route).
- [ ] **DI-O6 — Polish line merge:** apply DI-1 to `releaseTime.ts` (`parseBlockTime`: accept
  Noon/Midnight; roll when `endMs <= startMs`). Expect conflicts in `FreshnessChip`,
  `StockingPage`, `conditionsBridge`, `usgs-waterdata`, `tn.ts`.

**Open (not yet fixed)**
- [ ] **DI-20 · P1 — legacy USGS WaterServices is decommissioned 2027-02-22** (slowdowns
  from Jan 2027); the evidence lane is legacy-only with no OGC path.
- [ ] **DI-21 · P2 — idealFlow ranges vs reality:** obed-river 100–800 (median 33 cfs);
  powell/stones/red/S. Fork Cumberland above range on 52–62% of days; duck-river-tailwater
  range never flags. Recalibrate from flow percentiles, season-aware.
- [ ] **DI-22 · P2 — gauges without usable flow:** Doe 03485500 / Nolichucky 03465500
  (-999999, rating in development since 2024), Stones 03430200 negative; dry N. Chickamauga
  shows "No data" instead of dry. Waters with no idealFlow score a flat 50 "Fair".
- [ ] **DI-23 · P2 — gauge-to-reach mismatches:** wolf-river-fentress (Byrdstown gauge),
  little-river (Maryville), ocoee-river (Copperhill above Ocoee 3), caney (Stonewall incl.
  Smith Fork), pigeon (Newport).
- [ ] **DI-24 · P2 — one shared stocking matcher + alias table** (web and API disagree; API
  `alias-data.ts` maps Cane Creek (Hickman/Perry) to `cane-creek`; evidence job ignores county).
- [ ] **DI-25 · P2 — remaining silent-stale paths:** conditions `fetchedAt` is build time and
  the watchdog's snapshots-only heal says "(fresh data)"; Conditions chip uses the newest
  reading across all waters; open tabs never refetch; shops/reports/hatch chips show download
  time; one bad DB row aborts the build mid-generation; no lock between refresh, watchdog and
  autoupdate; evidence + NWS pressure/rain jobs are not scheduled in production.
- [ ] **DI-26 · P3** — `tva:CEHT1`/`tva:DLHT1` readings nothing reads; observed "Midnight"
  (00:00 vs 24:00) and the Nov 1 DST fall-back unverified; `latestReadings` orders by text;
  `gauges-tn.geojson` wiring/counties stale.

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

- [x] **T3-50 [PRE]** `mill-creek-overton` gauge evidence wrong in catalog (gauge
  03539778 is actually Clear Creek at Lilly Bridge) — re-anchor from NWIS. *(Verified
  2026-10-14: the catalog now carries `gaugeIds: []` for this water.)*
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
