# TroutSite senior code audit — expanded, September 29, 2026

**48 verified findings: 2 P1, 41 P2, 5 P3.** P1 = ship stopper; P2 = fix soon; P3 = lower priority. Effort: S = a localized change; M = several modules or a migration; L = a substantial redesign.

Audited revision: **14a92bc302842050cb1354108b5f16436b765504**, verified against origin/main after fetch. Source links below point to that exact revision. Work was confined to the requested QA checkout, C:/Users/Benjamin/Projects/trout-merge-test. This report is the only repository document changed. No fixes, commits, branches, stashes, pushes, production access, deployments or restarts were performed.

## 1. Executive verdict

There are strong foundations: pure scoring functions, explicit uncertainty, meaningful unit tests, content provenance gates and a recovery framework. The boundaries between those systems remain unreliable. Current flow can make a month-old temperature appear fresh; publishing an ordinary shop report can erase otherwise valid species assessments throughout the catalog. Failed data jobs can partly publish, recovery can remove its own last-good data, and the production schedule omits important feeds. The expanded review also reproduced portal privacy/state failures and mobile usability defects. The remaining-file pass found successful responses discarded by failed cache writes, failed upstream runs logged healthy, weather parsing and locality errors, stale map paint, and missing or false phone-alert transitions. **I would reject a release containing F01/F02 and would accept on-call only with an agreed remediation plan.** Passing builds and 849 passing unit tests do not establish that the whole product is healthy.

## 2. How I audited

I mapped the monorepo and traced authored data and provider observations through ingestion, SQLite, snapshot publication, caching, decisions and rendered pages. I read source across the API, PWA, portal, marketing, contracts, content scripts, shared UI, infrastructure and CI. I ran the supplied gates, the complete 105-case browser suite, mobile browser probes, axe, and Lighthouse. Suspect boundaries received controlled reproductions using actual compiled modules, source transpiled into isolated VMs, real local browsers, or copied infrastructure scripts with mocked commands. Fault injection stayed in disposable QA directories; no upstream load test or production write occurred.

Coverage included:

- **API:** routes, authentication, static mounts, migrations, seeding, USGS/TVA/USACE/stocking/NWS adapters, dispatch, snapshots, health, public gauge caching and report publication.
- **PWA:** data/cache recovery, species selection, decisions and cards, map geometry/style/layers/hit testing, navigation, settings, logbook, hatch workflows, detail pages and service-worker configuration.
- **Portal:** login, attribution, composer validation, publication, history, drafts, logout and changes of shop identity.
- **Contracts/content:** assessment/freshness/activity/spawn/hatch logic, schemas, authoring/build scripts, scientific citation and capture integrity, opportunity policy and identity gates.
- **Cartography/marketing:** atlas/road/topo structure, rendered map controls, Astro loaders/templates, metadata, date/score semantics, prerendering and all nine configured key marketing templates.
- **Operations/cross-cutting:** refresh/cron/schedules, deploy/stamp/rollback/watchdog, archive/restore, backup tests, proxy limits, dependency reachability, privacy, accessibility, startup cost and CI.

The validated catalog contains **190 waters, 103 taxa, 155 patterns, 23 shops, seven species references and 144 region/month hatch charts**. These are validated inventory counts, not a claim to have independently re-adjudicated every scientific statement.

The attached audit prompt's QA-only, report-only restrictions controlled this review. I read the mandatory known-issues worklist during orientation, so complete independence from that worklist is impossible. The initial ten findings preceded the earlier-report comparison; this expansion built on that first review. Prior reports were used for comparison, never as proof that today's code works.

### Remaining-file pass and measurable coverage

The follow-up re-read any source whose earlier whole-file coverage was uncertain. The fixed-revision inventory contains **3,039 tracked files, 867,269,724 bytes**, including **520 authored executable/code files (3,874,145 bytes)**. Every tracked file was byte-read and fingerprinted; every file has a specific method in §6's ledger. **This is not a claim that I manually read every file line by line.**

- **Full application program reads:** API, React PWA, portal, Astro marketing, contracts/scorers and shared UI runtime programs, plus selected infrastructure, build scripts and configuration. TypeScript printer output omitted comments; comments were read separately where provenance or behavior depended on them.
- **Authored code-file methods:** 246 complete program reads, 37 direct source reads, 171 program structure reviews and 66 test structure reviews. Structure review parsed the complete source and exposed functions, branch conditions, I/O effects, failure handling and test intent; it does not mean every statement was manually inspected. These categories cover all 520 files without unreviewed code-file entries.
- **Structured corpus:** all JSON/GeoJSON/YAML/JSONL records were parsed. The scan counted **1,036,796 records and 8,543,197 coordinate pairs**, with no parse or basic numeric/range failures. An additional extensionless fixture JSON contained 190 waters. Basic bounds checks are not a topology or factual-content certification.
- **Assets and markup:** all **608 raster images fully decoded** (531 WebP, 62 PNG, 15 JPEG); all **138 SVGs parsed as XML** without script/foreignObject/event-handler/JavaScript-URL content; four WOFF2 files received signature/hash checks; all 25 HTML files received full parsing and structural review or a prior direct read. Captured upstream HTML is evidence material, not proof that those third-party scripts ship in the Trout app.
- **Documentation:** all 320 Markdown files received complete-text outline/link indexing, with document identities reviewed. Current policy, known issues, runbooks and relevant source claims received additional direct or targeted reads. Most historical research prose was indexed rather than re-adjudicated word by word.

This pass added **F32–F48 (17 findings: 15 P2, two P3)** and expanded F08 without double-counting it. The earlier 31 findings and executed gate results remain part of this report.

## 3. Findings by severity

### P1 — ship stoppers

### F01 — P1: Old USGS metrics acquire the newest metric's timestamp

**Source:** [usgs-waterdata.ts:80](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/ingest/usgs-waterdata.ts#L80); [env.ts:30](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/env.ts#L30).

**Evidence:** The default Water Data parser remembers parameter times, then merges all parameters under the newest timestamp. A compiled-module probe combined flow 100 cfs from September 29 at 12:00Z with 22°C from August 29 at 12:00Z. At September 29, 12:05Z, the output gave both metrics the September timestamp and produced **comfort 90, assessed=true, ageMinutes=5**.

**Impact:** A working flow sensor can keep renewing a stopped temperature sensor. The three-hour thermal freshness gate accepts obsolete temperature as current.

**Fix:** Preserve observation time per metric through ingestion/scoring, or separate readings by their actual observation times. Apply absolute age using injected current time; another metric's timestamp cannot establish freshness. **Effort: M.**

### F02 — P1: Publishing a report overwrites species snapshots without their reference pack

**Source:** [portal/routes.ts:197](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/portal/routes.ts#L197); [snapshots/build.ts:468](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/snapshots/build.ts#L468); [server.ts:11](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/server.ts#L11).

**Evidence:** The report route invokes the entire snapshot builder without contentPackDir. Missing species bands become an empty map, and eligible species files are overwritten. An authenticated local POST returned **201**, while an existing smallmouth snapshot changed from **90 / assessed=true** to **0 / assessed=false**, with “No cited temperature comfort bands for this species yet.”

The database INSERT also precedes snapshot I/O. Making the snapshot destination unwritable caused two retries to return **500**, while saved report rows increased **1 → 2**.

**Impact:** An ordinary report publication degrades unrelated assessments across the catalog. A failed response can conceal an accepted write and encourage duplicates.

**Fix:** Publish only the report feed from this route. As immediate containment, pass the same validated reference pack as scheduled builds. Separate durable acceptance from feed publication and make retries idempotent. **Effort: S containment; M complete fix.**

### P2 — fix soon

### F03 — P2: Known-offline recovery skips installed service-worker content

**Source:** [snapshots.ts:48](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/snapshots.ts#L48); [offline-recovery.test.ts:16](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/test/offline-recovery.test.ts#L16).

**Evidence:** With navigator.onLine=false, empty Dexie and a valid Cache Storage response, the actual fetcher threw “offline and no cached snapshot for /content/taxa.json.” **Cache lookups: zero.** Its early offline branch exits before the recovery tier. The existing test fails fetch while leaving the browser logically online.

**Impact:** An installed shell can load in airplane mode while an unvisited hatch workflow fails despite installed content.

**Fix:** Share Dexie/service-worker recovery across offline and failed-network paths, accounting for Workbox revisioned cache keys. Verify the installed-SW/empty-Dexie/actual-offline combination. **Effort: S.**

### F04 — P2: Cached species assessments keep current confidence indefinitely

**Source:** [waterDecision.ts:186](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/waterDecision.ts#L186); [fishability.ts:58](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/fishability.ts#L58); [FishabilityCard.tsx:139](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/components/FishabilityCard.tsx#L139).

**Evidence:** Old cache payloads remain usable, but the species index drops cache provenance. A month-old assessed 90 snapshot with generation-time ageMinutes=0 still produced **displayMetric=fishability, confidence=high**. The card/activity surface lacks the explicit stale framing used for legacy conditions.

**Impact:** Backend freshness limits stop protecting the presentation once an assessment ages in cache.

**Fix:** Carry provenance into the view and calculate current age from observedAt with injected time. Present old scores as clearly labeled historical assessments with reduced confidence, or current unassessed states. **Effort: M.**

### F05 — P2: Production refresh omits feeds; NWS ingestion has no application caller

**Source:** [refresh-data.sh:72](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/refresh-data.sh#L72); [install-schedules.sh:39](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/install-schedules.sh#L39); [cron.ts:35](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/cron.ts#L35); [nws-provider.ts:238](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/nws-provider.ts#L238).

**Evidence:** The canonical WinSW schedule runs seed → gauges → snapshots. Daily stocking/evidence ingestion lives in the dev pm2 cron. Deployment ingests stocking, but an unchanged verified revision makes autoupdate exit. Source search found runPressureJob only in its declaration and tests; the dispatcher offers no NWS job. Missing expected feed runs also escape the seed/snapshot-oriented degradation check.

**Impact:** Successful hourly snapshot builds can coexist with stalled stocking/evidence and absent pressure/rain context.

**Fix:** Wire NWS through dispatch, schedule stocking/evidence on the canonical Windows stack, and report missing/stale expected runs, including never-run jobs. Installed production overrides were not inspected. **Effort: M.**

### F06 — P2: Portal-origin published history is outside the configured proxy

**Source:** [client.ts:79](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/api/client.ts#L79); [ecosystem.config.cjs:52](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/pm2/ecosystem.config.cjs#L52); [static-server.mjs:179](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/static-server.mjs#L179).

**Evidence:** The client requests same-origin /v1/reports/recent.json, but the supported portal server proxies only /v1/portal. The actual local static/proxy server returned **404** for history. The publication e2e checks the API origin directly, bypassing this path.

**Impact:** Login/publication can work while “My reports” cannot load published reports.

**Fix:** Proxy this specific read endpoint, or supply an authenticated portal-history endpoint. Validate history from the portal origin. **Effort: S.**

### F07 — P2: Marketing reverses assessment semantics and uses different score bands

**Source:** [ConditionsEmbed.astro:29](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/components/ConditionsEmbed.astro#L29); [ScoreBadge.astro:13](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/components/ScoreBadge.astro#L13); [format.ts:46](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/lib/format.ts#L46).

**Evidence:** The embed passes only value. A contract/formatter probe rendered **25°C plus flow: value=0, assessed=true → “No data”**; **temperature-only: value=10, assessed=false → “Poor.”** Astro uses 75/50 bands while the PWA uses 70/40.

**Impact:** A real heat warning becomes an unavailable-feed badge, while unassessed data becomes a verdict.

**Fix:** Share assessment-aware labels/bands, honor assessed, and show an assessed zero as Poor. Verify rendered Astro output at these boundaries. **Effort: S.**

### F08 — P2: Stocking plans acquire unsupported exact dates and completion labels

**Source:** [components/StockingTable.astro:43](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/components/StockingTable.astro#L43); [[slug]/index.astro:118](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/pages/streams/%5Bstate%5D/%5Bslug%5D/index.astro#L118); [schemas/stocking.ts:15](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/packages/contracts/src/schemas/stocking.ts#L15); [pages/StockingPage.tsx:73](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/pages/StockingPage.tsx#L73); [scripts/prerender.mjs:184](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/scripts/prerender.mjs#L184); [snapshots/build.ts:281](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/snapshots/build.ts#L281).

**Evidence:** The adapter retains precision when a TBD month becomes its first-day placeholder. Astro ignores it: **date=2026-12-01, datePrecision=month → “Dec 1, 2026”**, including under “Stocking history.” The contract forbids treating placeholders as verified days.

The remaining-file pass reproduced the separate completion inference in the actual PWA function: with today fixed to September 29, a planned exact-day September 28 entry returns **“Reported completed”**, while September 30 returns “Scheduled.” The explanatory note says past-dated and not field-verified, but no completed-release evidence establishes the headline. The snapshot builder explicitly identifies these rows as schedules. PWA prerender respects month/week precision but calls **every exact-day row “reported released”**, including upcoming dates.

**Impact:** A plan's date or passage of time becomes a release record across the app and SEO/marketing surfaces. Visitors cannot distinguish the published plan from TWRA's separate completed-release report.

**Fix:** Preserve both date precision and source status. Keep planned entries scheduled/past-scheduled until a completed-release source establishes completion; use identical evidence-aware wording in React, PWA prerender and Astro. **Effort: S–M.**

### F09 — P2: A repeated prerender keeps the homepage body inside other routes

**Source:** [prerender.mjs:196](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/scripts/prerender.mjs#L196); [prerender.mjs:222](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/scripts/prerender.mjs#L222); [prerender.mjs:580](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/scripts/prerender.mjs#L580).

**Evidence:** The script rereads dist/index.html after replacing it with rendered home content, but body insertion only matches an empty root. A probe using the actual injection logic produced **water-page title=true; homepage body=true; water-page body=false** on the repeated run.

**Impact:** Crawlers/no-JavaScript readers get route metadata wrapped around the wrong body. The usual clean build followed by one prerender avoids this trigger.

**Fix:** Keep an immutable shell or replace a marked body region regardless of existing content. Verify consecutive runs. **Effort: S.**

### F10 — P2: The browser gate depends on ignored data and obsolete fixtures/UI expectations

**Source:** [global-setup.mjs:31](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/e2e/global-setup.mjs#L31); [vite.fixtures.config.ts:16](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/vite.fixtures.config.ts#L16); [generate-fixtures.mjs:778](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/scripts/generate-fixtures.mjs#L778); [ui.spec.ts:361](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/e2e/fieldwork/ui.spec.ts#L361).

**Evidence:** Global setup does not regenerate fixtures; the generator emits no fishability files. Fixture copying overlays the ordinary public tree, letting ignored snapshots fill gaps. This checkout supplied September 16 Harpeth data with only unassessed smallmouth, while tests expected Fair/40, activity and additional species. Other assertions still require a 148-water catalog, old Caney naming, hidden mobile-header search, duplicate unscoped “All fish” controls, and programmatic-month absence contrary to current policy.

The **full run: 85 passed, 20 failed, no retries, all 105 attempted**. The touch-polygon fixture also failed in an isolated rerun. The zoom-overlay failure was independently verified as a product bug, F25.

**Impact:** Passing unit checks coexist with an unusable browser gate. Several failures would encourage undoing correct current behavior; fixture gaps cannot establish a production species-picker regression.

**Fix:** Generate a complete isolated fixture tree with an explicit clock, remove local-data leakage, and align selectors/assertions with current policy and catalog. Investigate the remaining touch-polygon failure without assuming it proves a product defect. **Effort: M.**

### F11 — P2: Solar equation-of-time math omits its radians-to-degrees conversion

**Source:** [solar.ts:35](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/solar.ts#L35); [NOAA reference implementation](https://gml.noaa.gov/grad/solcalc/main.js).

**Evidence:** Trout returns eqTimeMin = 4 × eq, where eq is in radians. NOAA returns radToDeg(Etime) × 4. A controlled Nashville September 30 comparison showed the omitted factor shifts the displayed crossings by **9.67 minutes**.

**Impact:** Named dawn/dusk times drift systematically despite the code/test claim to use NOAA's method. Labeling feeding windows heuristic does not correct inaccurate sunrise/sunset anchors.

**Fix:** Convert the angular result to degrees before deriving minutes; verify dates across the annual equation-of-time range against an independent reference. **Effort: S.**

### F12 — P2: UTC calendar days become local report dates and “today's” windows

**Source:** [drafts.ts:24](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/state/drafts.ts#L24); [solar.ts:58](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/solar.ts#L58); [SolarWindowsCard.tsx:31](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/components/SolarWindowsCard.tsx#L31).

**Evidence:** At **September 29, 8:00 p.m. America/Chicago**, todayIso returned **September 30**, and solarWindows returned September 30 sunrise/sunset under “Today's windows.” Drafts use toISOString; solar math selects the UTC calendar date.

**Impact:** Evening reports default to the next day, and the current-day label refers to tomorrow's windows.

**Fix:** Pass an explicit civil date into solar math and generate draft dates from the intended local calendar. Keep current-time acquisition in callers. **Effort: S.**

### F13 — P2: Rapid independent preference patches overwrite each other

**Source:** [settings.tsx:28](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/settings.tsx#L28).

**Evidence:** update merges each patch with its captured render's settings, then performs an unconditional put. Two calls before Dexie updates that render produced **all / empty focus**, followed by **trout / smallmouth focus**: the second patch undid the first.

**Impact:** Fast or concurrent controls can silently lose another preference change.

**Fix:** Serialize a transaction that reads and merges the latest stored record, with suitable optimistic UI and failure handling. **Effort: M.**

### F14 — P2: Public gauge requests have unbounded distinct-key upstream fan-out

**Source:** [app.ts:185](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/app.ts#L185); [gauge-now.ts:47](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/lib/gauge-now.ts#L47); [gauge-now.ts:77](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/lib/gauge-now.ts#L77).

**Evidence:** The public route accepts any eight-digit ID. Dedupe applies only to the same ID; cache maps never evict expired keys, and there is no aggregate concurrency cap. With a blocked fetch stub, **100 distinct IDs caused 100 simultaneous upstream fetches**. No real USGS load test was performed.

**Impact:** Arbitrary IDs can consume upstream quota, memory and active requests, crowding out legitimate taps.

**Fix:** Bound upstream concurrency/queue/cache size, evict expired negatives, and apply an appropriate request budget. Preserve access to legitimate unwired gauges rather than blindly restricting to catalog gauges. **Effort: M.**

### F15 — P2: Accepted publication leaves a reusable draft and can be reported as failure

**Source:** [ComposerView.tsx:115](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/views/ComposerView.tsx#L115); [HistoryView.tsx:56](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/views/HistoryView.tsx#L56).

**Evidence:** After a real browser received a mocked valid **201**, the published body remained in the editable drafts list. Throwing QuotaExceededError during the subsequent local save made another accepted **201** display “Publishing failed — check your connection,” with the same body still editable.

**Impact:** Users can duplicate accepted reports, and local storage failure is misrepresented as server rejection.

**Fix:** Treat server acceptance as final; remove/mark the draft as published and handle local cleanup errors separately. Combine with API idempotency from F02. **Effort: S.**

### F16 — P2: Unpublished drafts are shared across shop identities

**Source:** [drafts.ts:5](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/state/drafts.ts#L5); [drafts.ts:16](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/state/drafts.ts#L16); [HistoryView.tsx:22](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/views/HistoryView.tsx#L22); [App.tsx:46](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/admin/src/App.tsx#L46).

**Evidence:** Drafts have no shopId and use one browser-global key. In a browser probe, Shop A saved unpublished notes and signed out; Shop B signed in, opened those notes and reached an enabled Publish button.

**Impact:** Shared-browser users can read private drafts and republish them under another shop's attribution.

**Fix:** Bind drafts to verified shop identity, filter access after login, and handle legacy unscoped drafts explicitly. Logout may retain drafts, but another shop must not inherit them. **Effort: M.**

### F17 — P2: The shared header pushes phone navigation outside a 320-pixel viewport

**Source:** [index.css:274](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/index.css#L274); [index.css:2063](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/index.css#L2063); [AppShell.tsx:146](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/components/layout/AppShell.tsx#L146).

**Evidence:** Real Chromium measurements on Settings, Logbook and Hatch Key gave **viewport 320, scrollWidth 378: 58 pixels overflow**. The nonshrinking header-actions cluster ended at x=377.5; the menu button began at x=333.5. A screenshot confirmed the menu was outside the visible screen.

**Impact:** Small-phone users lose the primary route-navigation control and must pan horizontally.

**Fix:** Reflow/collapse header controls at narrow widths while keeping menu/search usable and targets adequately sized. **Effort: S.**

### F18 — P2: A blocked optional local-storage read blanks the map entry page

**Source:** [MapLegend.tsx:72](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/MapLegend.tsx#L72).

**Evidence:** Injecting a SecurityError for Storage.getItem in a real browser made the home map render **empty body text**, with the uncaught storage error. The legend initializer reads storage without a guard; theme storage code already handles this condition.

**Impact:** Failure to remember an optional legend preference prevents access to the product.

**Fix:** Catch preference reads/writes and use in-memory defaults. Audit equivalent portal storage calls for a usable failure state. **Effort: S.**

### F19 — P2: The committed CI lint gate is reproducibly red

**Source:** [CI workflow:25](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/.github/workflows/ci.yml#L25); [eslint.config.js:1](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/eslint.config.js#L1); [browser-verify.mjs:84](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/e2e/browser-verify.mjs#L84).

**Evidence:** Recursive lint stopped at e2e. A no-bail sweep found **27 errors and 33 warnings**: e2e 4 errors; content 7 errors/1 warning; web 16 errors/32 warnings. Five other packages passed. Errors include missing runtime globals and unused script symbols. CI executes this gate before validation/tests/build.

**Impact:** The configured integration gate cannot complete on this revision. Targeted lint success is insufficient.

**Fix:** Configure globals for the actual script runtimes and remove real unused symbols, preserving meaningful lint rules. **Effort: S.**

### F20 — P2: Default light-theme legend text is nearly white on white

**Source:** [MapLegend.tsx:115](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/MapLegend.tsx#L115); [MapLegend.tsx:170](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/MapLegend.tsx#L170).

**Evidence:** Opened Daybreak legend in a real mobile browser: axe reported contrast **1.13:1** for the heading and **2.17:1** for supporting text, versus the required **4.5:1**. A screenshot confirmed the washed-out text. The component hardcodes night-palette text colors.

**Impact:** The map's explanation of scores and colors is difficult to read, especially outdoors or with low vision.

**Fix:** Use shared theme text tokens and verify the expanded legend in each preset. **Effort: S.**

### F21 — P2: A failed snapshot build still publishes part of the new generation

**Source:** [build.ts:212](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/snapshots/build.ts#L212); [build.ts:356](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/snapshots/build.ts#L356); [jsonFile.ts:8](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/lib/jsonFile.ts#L8).

**Evidence:** The builder publishes files sequentially. After a valid baseline, I changed a stream name and inserted an invalid release-schedule payload. The next build threw ZodError, but streams.json already contained **NEW GENERATION MARKER**. The prior catalog was not preserved.

**Impact:** Per-file atomic writes do not provide generation atomicity. A failed job can expose mixed generations while claiming publication failed.

**Fix:** Validate/build an entire staged generation, then promote it through a generation pointer or equivalent controlled switch. Preserve the prior generation on failure. **Effort: M–L.**

### F22 — P2: Catalog seeding retains deleted waters and partly applies failed runs

**Source:** [seed.ts:49](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/lib/seed.ts#L49); [seed.ts:76](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/lib/seed.ts#L76); [seed.ts:106](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/lib/seed.ts#L106).

**Evidence:** Seeding two authored waters, removing one YAML and reseeding reported **one input stream but two persisted streams**. In another run, a valid name change preceded an invalid YAML row: seed threw, but the valid row was already changed.

**Impact:** Authored removals do not remove obsolete API labels, and a failed seed leaves a partly updated catalog behind a failed job result.

**Fix:** Validate all input first; apply a transaction that synchronizes catalog membership. Preserve report/token history through explicit archival/foreign-key policy rather than leaving obsolete active rows. **Effort: M.**

### F23 — P2: Rollback rebuilds with new dependencies and different publication steps

**Source:** [deploy.sh:43](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/deploy.sh#L43); [load.ts:54](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/data/load.ts#L54); [package.json:9](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/package.json#L9).

**Evidence:** A copied-script failure probe recorded install → failed new build → Git reset → build, with **no reinstall for the restored lockfile**, no prerender, and **MARKETING_DATA_DIR unset**. The rollback then claimed last-good state was serving. The ordinary deploy explicitly rebuilds marketing with real snapshots; its default loader uses fixtures.

**Impact:** A dependency-changing deployment can fail to rebuild old code correctly. In the supported marketing stack, rollback can replace factual output with fixture pages; PWA prerendered route bodies also disappear. A green read-path check cannot prove complete code/artifact restoration.

**Fix:** Restore dependency/artifact state for the last-good revision and reuse the verified real-data/SEO build pipeline. Do not announce rollback success after a failed rebuild merely because an old process answers health. **Effort: M.**

### F24 — P2: Archive/restore deletes the good tree before promotion succeeds

**Source:** [snapshot-io.mjs:44](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/snapshot-io.mjs#L44); [snapshot-io.mjs:75](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/snapshot-io.mjs#L75).

**Evidence:** Source fault injection made the final rename throw EPERM. During archive promotion, the **last-good archive disappeared**; during restore promotion, the **live v1 tree disappeared**. Staged copies survived, but the automatic read/recovery paths no longer pointed to them.

**Impact:** A Windows promotion failure can remove the data required to recover. The claimed atomic swap is actually deletion followed by rename.

**Fix:** Retain the old generation until promotion succeeds and restore it on promotion failure. Use generation pointers where atomic directory replacement is unavailable. **Effort: M.**

### F25 — P2: An invisible legend wrapper blocks the desktop zoom button

**Source:** [index.css:789](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/index.css#L789); [MapLegend.tsx:102](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/MapLegend.tsx#L102); [RiverMapPage.tsx:954](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/RiverMapPage.tsx#L954).

**Evidence:** At 1280×720 on /?river=caney-fork-river&tab=Hatch&month=5, the zoom button center hit the legend's **relative wrapper**, not the button. The wrapper spanned **866 pixels** despite showing only its small legend chip. Playwright independently timed out with that wrapper intercepting pointer events.

**Impact:** Users cannot click a visible zoom control in this ordinary inspected-water flow.

**Fix:** Size the interactive legend wrapper to its contents, or limit pointer events to actual controls while preserving help links. **Effort: S.**

### F27 — P2: Marketing footer links fail minimum target size/spacing

**Source:** [Base.astro:75](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/layouts/Base.astro#L75); [global.css:134](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/styles/global.css#L134).

**Evidence:** All nine key marketing templates failed Lighthouse's target-size audit. Footer links were **19 pixels high**, with safe space measured at **22.2 pixels**, below its 24-pixel minimum. These failures coexist with overall accessibility scores of 95–96.

**Impact:** The same navigation targets are difficult to tap across the marketing site; a passing aggregate score hides the defect.

**Fix:** Provide adequate link hit areas and spacing, preferably the product's 44-pixel touch convention. **Effort: S.**

### F28 — P2: Terrain readiness probes a missing tile and mistakes the SPA shell for it

**Source:** [atlasAvailability.ts:101](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/atlasAvailability.ts#L101); [manifest.json:28](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/public/atlas/topo/manifest.json#L28); [app.ts:293](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/app.ts#L293).

**Evidence:** The manifest selects a z7 central-Tennessee probe, **hillshade/7/33/50.webp**, which does not exist among 531 shipped tiles. A filesystem-backed source probe returned false. The production API implementation instead returned **200 text/html** for that missing asset; the readiness helper checks only res.ok. Lighthouse on the stricter static server recorded repeated 404s for the same URL.

**Impact:** Readiness depends on the serving implementation: valid terrain can be disabled on a strict server, while a SPA-fallback server falsely certifies a nonexistent image. Layer-presence tests do not certify image availability.

**Fix:** Declare a real representative tile/actual tile range in the manifest, validate response type, and keep missing static assets out of the API's SPA fallback. **Effort: M.**

### F31 — P2: Non-map routes eagerly load the entire map/route bundle

**Source:** [App.tsx:1](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/App.tsx#L1); [TennesseeMap.tsx:2](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/TennesseeMap.tsx#L2).

**Evidence:** All routes, including MapLibre, are imported eagerly. The entry is **2,091,237 bytes / approximately 604.75 KB gzip**. A cold Logbook Lighthouse run found **1,354,079 unused JS bytes (64.75%)** and FCP **13.17 seconds** under its mobile profile. The map run had **6.68 seconds total blocking time**.

**Impact:** A visitor opening a simple local logbook still downloads/evaluates the map route set before rendering it.

**Fix:** Split routes and isolate MapLibre/optional work behind route or feature boundaries. Measure cold non-map and map starts after splitting. The recorded timings are local, uncompressed-static-server simulations with 4× CPU/1.6 Mbps settings, not a production latency claim. Intentional atlas size is not the finding. **Effort: M.**

### F32 — P2: A cache-write failure discards a successful current response

**Source:** [lib/snapshots.ts:67](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/snapshots.ts#L67).

**Evidence:** Source VM with actual snapshot fetcher and actual ConditionSnapshotSchema: one successful network fetch/current response, one Dexie write throwing QuotaExceededError, returned older-cached-response from August 29 instead of current-response from September 29; live=false.

**Impact:** Storage quota or IndexedDB write failures silently replace current data with old cached data despite a healthy network. Without a usable fallback cache, the fetcher can fail despite receiving a valid response.

**Fix:** Keep validation/network acceptance separate from best-effort cache persistence; return the validated current response even when cache persistence fails, and surface inability to cache independently. **Effort: S.**

### F33 — P2: Complete upstream ingestion failure is recorded as a healthy successful run

**Source:** [evidence/evidenceJob.ts:266](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/evidenceJob.ts#L266); [src/pipeline.ts:222](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/pipeline.ts#L222); [evidence/conditionsBridge.ts:328](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/conditionsBridge.ts#L328).

**Evidence:** Actual compiled evidence job, in-memory migrated SQLite and failing injected USGS fetch: the only enabled observation source failed, zero observations and one source error; stored job status ok and jobDegradation returned []; newest evidence replaced the prior successful observation with an empty observation list and source error.

**Impact:** Operational success masks complete feed failure, and the latest public evidence loses previously usable observations. The gauges dispatcher similarly ignores its ingestion result and returns ok=true. This is separate from unscheduled feeds in F05.

**Fix:** Define success/degraded/failure from expected sources and returned errors, propagate those outcomes through dispatch and health, and preserve last-good observations with explicit age/error provenance when upstream refresh fails. **Effort: M.**

### F34 — P2: Latest-value selection still orders ISO timestamps as text in SQL and evidence ingestion

**Source:** [ingest/usgs.ts:314](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/ingest/usgs.ts#L314); [evidence/usgs-provider.ts:75](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/usgs-provider.ts#L75); [evidence/usace-provider.ts:127](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/usace-provider.ts#L127).

**Evidence:** Actual migrated in-memory database and compiled parsers: 01:45-05:00 (06:45Z, flow100) versus 01:15-06:00 (07:15Z, flow200). The repaired legacy parser selected200, but latestReadings returned100 and the evidence parser returned100.

**Impact:** During the repeated daylight-saving hour, a valid newer observation is hidden behind the older local-clock value. The upstream parser repair is undone by database latest-per-gauge ordering; evidence has the same defect. The default Water Data adapter normalizes timestamps to UTC, reducing exposure on that path; the reproduced failure concerns accepted mixed-offset legacy/evidence values.

**Fix:** Normalize observation timestamps to UTC on storage or order by an epoch/julianday value, and use parsed instants consistently in evidence providers. Cover the ingestion→database→snapshot chain. **Effort: S–M.**

### F35 — P2: Month-only stocking schedules ignore remaining months in the current year

**Source:** [stocking/tn.ts:172](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/ingest/stocking/tn.ts#L172).

**Evidence:** Actual checked-in schedule fixture at September29: 16 month-only rows. Tims Ford lists M,A,M,J,J,A,S,O,N,D but resolves to March1,2027; Normandy lists J,F,M,N,D but resolves to January1,2027. A controlled M,A,M,J,J,A,S row likewise jumps to March2027.

**Impact:** The public schedule misses the nearest authored stocking months and suggests a many-month gap. Both stocking and evidence use this date resolver, so rescheduling feed jobs alone will not fix it.

**Fix:** Preserve the complete month recurrence or deliberately select the nearest listed current/future month, rolling the year only after all listed months have passed. Keep datePrecision=month. **Effort: S–M.**

### F36 — P2: TWRA raw captures overwrite one grid with the other

**Source:** [stocking/tn.ts:370](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/ingest/stocking/tn.ts#L370); [ingest/stockingJob.ts:19](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/ingest/stockingJob.ts#L19); [evidence/twra-evidence.ts:224](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/twra-evidence.ts#L224); [evidence/evidenceJob.ts:171](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/evidenceJob.ts#L171).

**Evidence:** The actual checked-in TWRA page exposes separate schedule and completed-release datatable URLs. Both fetchers name each JSON artifact exceldriven.json. Running the actual raw-save helper against a virtual filesystem returned the same JSON path twice: three fetched artifacts became only two stored files; the later grid replaced the earlier grid.

**Impact:** The retained raw audit trail cannot reproduce the normalization run and loses the schedule grid under the current page ordering. Evidence captures have the same collision, undermining source-history diagnosis.

**Fix:** Name captures by grid kind plus stable source identifier and run timestamp, record a URL/hash manifest, and save atomically. Preserve every fetched artifact. **Effort: S.**

### F37 — P2: NWS rainfall parsing rejects the actual quantitative-value response

**Source:** [evidence/nws-provider.ts:129](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/nws-provider.ts#L129); [test/nws-provider.test.ts:43](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/test/nws-provider.test.ts#L43).

**Evidence:** Read-only official KBNA observation HTTP200 shows precipitationLast3Hours={unitCode:'wmoUnit:mm',value:null,qualityControl:'Z'}. Actual compiled parser with the same documented shape and value4.2 returns [] while pressure parses correctly; its unit test uses an invented scalar4.2.

**Impact:** When the pressure job runs, valid measured regional rain is silently absent; the existing unit test falsely validates the integration.

**Fix:** Parse value/unitCode from the NWS quantitative-value object, accept null as no-data, check/convert the documented units, and use an authentic response fixture. **Effort: S.**

### F38 — P2: Two weather regions are wired to stations in the wrong places

**Source:** [evidence/nws-provider.ts:40](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/nws-provider.ts#L40); [evidence/nws-provider.ts:47](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/evidence/nws-provider.ts#L47).

**Evidence:** Read-only official NWS station metadata HTTP200: KMOR is Morristown Moore-Murrell (-83.3754,36.1794), but the Caney Fork mapping calls it Tullahoma; KMRN is Morganton-Lenoir, North Carolina (-81.60971,35.81922), but the Pigeon/French Broad mapping calls it Morristown.

**Impact:** Regional pressure/rain context comes from the wrong locality, including an out-of-state station, despite being labeled as each Tennessee water's area signal. Applies when the pressure job is scheduled or invoked.

**Fix:** Verify every station against official names/coordinates and the region geometry; select documented representative stations and store verified mapping provenance. **Effort: S.**

### F40 — P2: The map never requests West Tennessee hatch charts

**Source:** [map/useRiverMapData.ts:48](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/useRiverMapData.ts#L48).

**Evidence:** {"requestedRegions":11,"catalogCount":190,"omittedWaters":34,"omittedRegions":["tn-west"],"examples":["beech-lake","beech-river","big-sandy-river","cameron-brown-lake","covington-fbc-pond","edmund-orgill-lake","forked-deer-river","hatchie-river"],"authoredChartExists":true}

**Impact:** West-region waters never receive chart entries or hatch halos in map mode even though the regional calendar data ships. The map presents missing guidance rather than the authored chart.

**Fix:** Derive requested regions from the same registry/catalog as the hatch calendar and cover every region; avoid a separately maintained incomplete array. **Effort: S.**

### F41 — P2: A temporary context fetch failure is cached for the rest of the map session

**Source:** [map/networkClusters.ts:176](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/networkClusters.ts#L176); [map/networkClusters.ts:307](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/networkClusters.ts#L307).

**Evidence:** Actual source module transpiled into a VM: first cluster fetch threw a transient outage; a second request after recovery made no second fetch and added no layer (calls1,adds0). Both cluster-byte and manifest caches keep resolved null failures indefinitely.

**Impact:** After a cold offline start or transient first request failure, fine-stream map context remains absent through later pan/zoom requests even when connectivity returns. Reloading the app is required to clear module caches.

**Fix:** Evict failed promises/null results, trigger a bounded retry on recovery, retain successfully fetched bytes, and distinguish loading/error from valid empty data. **Effort: S–M.**

### F43 — P2: Map Trout controls cannot override a saved All fish preference

**Source:** [map/RiverMapPage.tsx:50](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/RiverMapPage.tsx#L50); [map/RiverMapPage.tsx:461](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/RiverMapPage.tsx#L461).

**Evidence:** Actual component source rendered into an isolated JSX/hook harness, saved speciesMode=all; clicking its Trout button deletes URL species and all Trout buttons remain aria-pressed=false because mode falls back to saved all.

**Impact:** A normal user who selects All fish in the persistent header/settings cannot switch to Trout using the map's filters, toolbars, or segmented selector.

**Fix:** Write an explicit species=trout selection or update the saved preference consistently across all controls; reserve parameter removal for returning to the saved default. **Effort: S.**

### F44 — P2: Fishability and custom palette changes do not invalidate memoized map colors

**Source:** [map/RiverMapPage.tsx:409](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/RiverMapPage.tsx#L409); [map/TennesseeMap.tsx:896](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/TennesseeMap.tsx#L896).

**Evidence:** Actual component source with dependency-preserving hook harness: a focus-species fishability90 response arrives after initial amber warmwater paint, but featureColors remains amber; the real decision helper correctly returns good/green. Dependencies omit fishability/focus and palette changes inside the same theme.id.

**Impact:** Sidebar/readouts and the Colors show [species] claim can update while river colors retain missing or old assessment; selecting a different species and custom map colors can likewise leave stale paint.

**Fix:** Memoize against the actual decision inputs, focus species and resolved map palette (or use an explicit revision), and validate delayed responses plus species/palette changes. **Effort: S.**

### F45 — P2: Touch taps select a river before an overlapping gauge or stocking overlay

**Source:** [map/TennesseeMap.tsx:728](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/TennesseeMap.tsx#L728); [map/TennesseeMap.tsx:742](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/TennesseeMap.tsx#L742).

**Evidence:** {"probe":"overlapping-touch-overlay","selected":["caney-fork-river"],"popupCalls":[],"expectedPopup":"gauge"} Actual touchend/click handler ASTs run in a VM with a point hitting both the mapped river and enabled gauge.

**Impact:** On touchscreens, a gauge/stocking/attractor dot on a river selects the river and sets the click-suppression timer, preventing the later click handler from opening the intended popup. Mouse clicks prioritize the overlay correctly.

**Fix:** Use one overlay-first selection routine for mouse and touch, then suppress only the duplicate event after dispatching the intended action. **Effort: S.**

### F46 — P2: Failure status writes suppress backup and hourly-refresh phone alerts

**Source:** [infra/alert.sh:36](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/alert.sh#L36); [infra/backup.sh:47](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/backup.sh#L47); [infra/refresh-data.sh:60](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/refresh-data.sh#L60).

**Evidence:** Isolated Git Bash harness ran the checked-in helper and exact missing-database caller statements with a stubbed notification command. Actual order produced zero messages; moving the same status write after the helper produced one message. No phone notification or production action was performed.

**Impact:** Backup missing-database and backup-tool failures, refresh skew/no-stamp refusal, seed errors, snapshot errors and failed read-path verification update the status file before transition-dedup checks it; the new failure therefore never produces its promised phone alert.

**Fix:** Check/send the transition before persisting it, or make one helper own prior-state capture, dispatch and status recording. Exercise real caller failure branches with a stubbed notifier. **Effort: S.**

### F47 — P2: A persistently degraded pipeline repeatedly sends false recovery notifications

**Source:** [infra/watchdog.sh:57](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/watchdog.sh#L57).

**Evidence:** Executed the actual alert helper and watchdog recovery/degraded alert statements over three persistently degraded checks. Messages were one degradation alert followed by two server-recovered alerts; the state never recovered.

**Impact:** On a green read path with unhealthy ingestion, the watchdog announces recovery before inspecting degradation. Once status is DEGRADED, every subsequent check sends “Trout server recovered” although the pipeline is still failing; the real degradation alert is deduplicated away.

**Fix:** Read health once and determine the final state before dispatching a transition. Send recovery only after an unhealthy state actually becomes healthy. **Effort: S.**

### F48 — P2: Fresh fishability snapshots keep an expired pressure trend indefinitely

**Source:** [snapshots/build.ts:491](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/snapshots/build.ts#L491); [components/FishabilityCard.tsx:44](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/components/FishabilityCard.tsx#L44).

**Evidence:** Actual compiled snapshot builder and migrated in-memory SQLite: a September29 snapshot includes a September1 pressure record and labels it Area pressure falling -3 hPa over about 3 hours. The client card shows this label/station without observation age; unlike rain context, pressure has no age gate.

**Impact:** A stopped pressure feed leaves an old three-hour weather trend looking like current area context, even after snapshots refresh successfully. This affects the displayed contextual advice; the probe did not show a score change.

**Fix:** Apply a documented pressure freshness window, omit or mark expired context, and display observation age alongside the station. Treat no recent observations as unavailable. **Effort: S.**

### P3 — lower priority

### F26 — P3: The regional geometry validator dereferences a deliberately retired file

**Source:** [validate-east-southeast.mjs:218](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/scripts/validate-east-southeast.mjs#L218); [KNOWN-ISSUES.md:271](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/KNOWN-ISSUES.md#L271).

**Evidence:** The command crashes with **ENOENT: public/atlas/lakes.geojson**. That empty passive layer was intentionally removed. The exception stops later cross-state/connection checks; the general atlas validator still passes.

**Impact:** The regional gate cannot finish against the current artifact layout.

**Fix:** Remove/replace the retired-layer check while preserving its remaining geometry checks. Do not resurrect an empty artifact to make the command pass. **Effort: S.**

### F29 — P3: Terrain cache invalidation records success before deletion succeeds

**Source:** [atlasAvailability.ts:156](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/lib/atlasAvailability.ts#L156).

**Evidence:** The new generation is stored before caches.delete. A transient deletion-failure probe produced **first=false, second=false, deleteCalls=1**, while the stored generation already read “new-generation.” The next call never retried deletion.

**Impact:** An old terrain cache can survive until another generation change, including the prior opaque-tile problem this mechanism was intended to resolve.

**Fix:** Advance the generation marker after successful invalidation; retain retryability after errors. **Effort: S.**

### F30 — P3: The visible “All fish” control has a mismatched accessible name

**Source:** [SpeciesModeToggle.tsx:31](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/components/SpeciesModeToggle.tsx#L31).

**Evidence:** Visible text is “All fish”; the accessible name is “All-fish mode.” Lighthouse explicitly failed label-content-name-mismatch on that button, even while the page's aggregate accessibility score remained 100.

**Impact:** Visible-label/voice-control matching is inconsistent.

**Fix:** Include the exact visible text in the accessible name, for example “All fish mode.” **Effort: S.**

### F39 — P3: The inert newsletter form reports subscription success on failed requests

**Source:** [components/NewsletterForm.astro:49](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/src/components/NewsletterForm.astro#L49); [infra/static-server.mjs:185](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/static-server.mjs#L185).

**Evidence:** Actual inline script in an isolated DOM: status405 and status500 both display Thanks — you're on the list. The configured marketing server rejects every POST with405; only404/501 are recognized as demo mode.

**Impact:** Visitors get a false subscription confirmation from the visible install/stocking form. The page's inactive-v1 copy lowers severity but does not make the confirmation true.

**Fix:** Keep an inactive form truly inert or handle only verified successful responses as subscriptions; disclose failure for every non-2xx response. **Effort: S.**

### F42 — P3: The cartography QA overlay locates crossings on the wrong segment parameter

**Source:** [qa/audit.ts:431](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/qa/audit.ts#L431).

**Evidence:** {"probe":"crossing-coordinate","expected":[-84.97142857142858,35.02857142857143],"returned":[[-84.92857142857144,35.07142857142856]]}

**Impact:** Verified self-crossings are marked at a different point, so the QA panel's zoom target and exported defect location can direct repair work to the wrong reach.

**Fix:** Compute the intersection parameter for the segment used in the returned point, or return the point on the other segment using its parameter; verify asymmetric crossings. **Effort: S.**

## 4. Intent compliance

- **Uncertainty-forward, seasonal dimming, species-relative ratings: FAIL end-to-end.** F01/F04/F48 undermine freshness honesty; F07/F08 remove uncertainty in static and interactive presentation, and F43/F44 prevent species controls and map colors from reflecting the requested assessment. The authored opportunity decision itself passes the reviewed policy: [waterDecision.ts:133](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/waterDecision.ts#L133) distinguishes regulatory windows from programs, and line 207 deemphasizes closed seasonal water. Programmatic stocking months must not become invented presence/absence.
- **Live data supplies conditions, never labels; missing feeds remain unassessed: FAIL end-to-end, authored boundary largely passes.** F01 manufactures freshness; F02 discards available assessment evidence; F22 can retain obsolete catalog membership. Labels/species/opportunity originate in authored fields, [waterDecision.ts:150](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/waterDecision.ts#L150), and genuine missing evidence has explicit unassessed branches.
- **Pure classification, no hidden clocks/network/model calls: PASS in reviewed paths.** [scoreConditions.ts:76](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/packages/contracts/src/scoreConditions.ts#L76), [scoreFishability.ts:23](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/packages/contracts/src/scoreFishability.ts#L23) and [waterDecision.ts:110](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/src/features/map/waterDecision.ts#L110) operate on inputs. Source search found no model calls or hidden current-time/network acquisition there. Parsing supplied timestamps is deterministic. Freshness fixes should retain injected time.
- **Offline-first, intentional large assets: PARTIAL FAIL, intentional asset design passes.** F03/F04/F32/F41 expose recovery/presentation gaps. Actual installed-browser offline roads remained checked and usable, with all three cached road files returning 200: this audit did not assume every HEAD-based recovery path fails. Installation size passed: **13.34 MB normal build / 13.41 MB fixture build, limit 25 MB**; approximately **76.23 MB atlas** is predominantly on demand. F31 concerns eager executable code, not deliberate geographic assets.

## 5. Test-suite honesty

The unit suite tests real behavior: forged/expired tokens, scoring boundaries, missing references, snapshot schemas, path handling, backup and skew guards. Its passing coverage misses important integration/failure-state boundaries. Directly testing runPressureJob proves the provider function, not its invocation. Portal publication tests bypass the broken portal-origin history. Offline recovery tests omit the early known-offline branch. Terrain layer tests can accept a 200 SPA shell as proof of a tile. Aggregate accessibility scores hide failed individual audits.

Executed checks:

- **Build:** pnpm -r build passed, including typechecks/content pack/PWA size gate.
- **Content:** pnpm validate:content passed; 134 documented ungauged warnings; 23 capture hashes and ledger/identity gates passed. Opportunity counts: 60 seasonal, 30 year-round, 34 unresolved, 54 warmwater, 12 mixed.
- **Units:** pnpm -r test passed **849 tests, one skipped, 89 files**. Contracts 198; API 238; content 19; web 375 plus one skip; admin 19. The stocking-match regression [stockingMatch.test.ts:132](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/web/test/stockingMatch.test.ts#L132) skips when its generated published feed is absent.
- **Contract coverage:** 97.3% statements/lines, 94.65% branches, 90.32% functions.
- **Infrastructure:** pnpm test:infra passed **12/12** after selecting Git Bash on PATH. Initial WSL-launcher failures were environmental and are not findings.
- **Browser suite:** CI=1, retries=0, max-failures=0: **85 passed / 20 failed / 105 attempted, 14.6 minutes**. The isolated touch-polygon rerun failed again. Its harness-versus-product cause remains unresolved.
- **Earlier focused runs:** 19 passed / 6 failed / 18 not run of 43, followed by privacy/offline **14/14** and navigation/touch **6/6**. These are narrower counts, not a substitute for the full run.
- **Lint:** recursive gate failed; no-bail sweep: **27 errors, 33 warnings, three failing packages**.
- **Geography:** atlas passed 190 unique IDs; roads passed 11,840 features/158,048 vertices/4.39 MB; topo passed 531 alpha-encoded tiles and byte/manifest checks. Regional East/Southeast validator failed as F26. gauges:check passed 137 gauges/44 catalog-wired; twra:check passed 1,897 attractors and 725 stocking points.
- **Axe:** actual 320-pixel Settings, Logbook and Hatch Key had no reported violations for the selected WCAG 2/2.1 A/AA tags; geometry measurements nevertheless exposed F17. Open Daybreak map legend exposed F20.
- **Lighthouse:** programmatic runs completed without runtime errors on the map, Logbook and all nine configured marketing templates. The actual profile was **mobile, 412×823, 4× CPU, approximately 1.6 Mbps**. Marketing: performance/best-practices/SEO **100**, accessibility **95–96**, with footer target failures. Map: performance **25**, accessibility **100**, best-practices **93**; Logbook: performance **55**, accessibility/best-practices **100**. PWA SEO was 90; marketing is the intended SEO surface. These are local fixture-build measurements, not production scores.
- **Lighthouse tooling limitation resolved:** stock LHCI reached results but failed cleaning Windows Chrome temp directories with EPERM. I used its installed Lighthouse API with a Playwright-managed browser to obtain complete measurements. Nothing was uploaded to temporary public storage.
- **Boundary reproductions:** all numbered findings include source and measured output or a directly cited failing implementation. Probes covered metric age, accepted reports, proxy routing, cache branches, publication/seed failure, archive promotion, preference merging, shop switching, storage failure, calendar/math, mobile geometry and upstream concurrency.

Dependency audit reported **27 production advisories: one critical, six high, 16 moderate, four low**. Astro/sharp entries include build/image/SSR paths; [astro.config.mjs:11](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/marketing/astro.config.mjs#L11) produces static output without integrations. React Router entries include redirect/SSR contexts. I did not establish a reachable production RCE and did not convert advisory counts into such a finding. Build-time dependency exposure and upgrades still require scoped follow-up.

Security positives are bounded and evidenced: [app.ts:67](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/app.ts#L67) redacts authorization/cookies/client addresses and caps bodies; [routes.ts:93](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/portal/routes.ts#L93) authenticates early; [tokens.ts:63](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/apps/api/src/portal/tokens.ts#L63) verifies expiry/HMAC; [static-server.mjs:198](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/infra/static-server.mjs#L198) enforces containment. Executed unit/infra/privacy tests support these specific paths. F14/F16 show why that is not a blanket security/privacy certification.

### Additional boundary checks from the remaining-file pass

Actual source/compiled-module probes verified: successful fetch + failed cache persistence (F32); all enabled observation sources failing while the evidence job records success (F33); mixed-offset latest-value selection across parser and SQLite (F34); captured TWRA month recurrence and raw-file collisions (F35/F36); authentic NWS quantitative-value shape with a controlled numeric precipitation value (F37); station identity/coordinates from official metadata (F38); newsletter HTTP 405/500 responses (F39); all-region catalog/chart reconciliation (F40); transient cluster failure followed by recovery (F41); asymmetric crossing coordinates (F42); persisted All-fish preference and delayed fishability responses in dependency-preserving React source harnesses (F43/F44); real touch/click handler ASTs with overlapping gauge/river hits (F45); actual Git Bash alert helper plus exact caller statements and a stub notifier (F46/F47); and a new snapshot with 28-day-old pressure context (F48). F08's completion labels were checked with the actual React function and cited prerender code.

Follow-up upstream access was limited to three official NWS GETs: station metadata for KMOR and KMRN and KBNA's latest observation. The latter published null precipitation; **4.2 mm was a controlled parser input, not a claimed measured rainfall at KBNA**. Source-module/hook/event harnesses do not replace a physical-device test. No actual phone push was sent. No failing draft probe is treated as verification: the pressure probe's initial wrong-column/TODAY harness errors were corrected, and the final run completed successfully.

## 6. Gaps and limits

- **Production state:** The prompt forbade production access. No installed task/service inventory, Cloudflare configuration, production credentials/logs/database, real alert delivery or public-origin latency was examined. Configuration findings identify repository behavior, not an observed live outage.
- **Scientific/regulatory truth:** Capture/hash/schema gates do not establish scientific applicability. I did not independently reread every external biological/regulatory source or re-adjudicate all 190 fisheries. Documented ungauged/unresolved water remains acknowledged uncertainty.
- **Field cartography:** No field survey, exhaustive visual tile inspection, or re-derivation of every reach/dam connection. Structural passes do not certify every selectable geometry. The isolated mocked touch-polygon failure remains unresolved.
- **Device accessibility:** Chromium mobile emulation, axe, Lighthouse and sampled keyboard/focus code were reviewed. No physical iPhone/Android, VoiceOver/TalkBack, complete screen-reader survey or WCAG certification.
- **Load/performance:** No sustained soak, real upstream quota exhaustion or production mobile baseline. The 100-request fan-out used a stub; Lighthouse used local fixtures/static serving without production compression.
- **Recovery:** Local copied-script and filesystem fault probes exercised dangerous failure order. No real deployment, full production database restore, Windows service-account recovery, logoff/reboot drill or OS power-loss experiment.
- **Exhaustiveness:** Every tracked file is now accounted for by a stated method below. Complete runtime program reads do not make every test, generator or historical document a manual line-by-line read. Structure/parse/asset checks cannot establish every semantic branch, scientific claim or visible pixel. Optional configuration combinations, dependency internals/exploits, ignored local secrets/data, Git object history, and all installed dependency source were not exhaustively reviewed. This audit does not guarantee absence of further defects.

### Per-file coverage ledger

Every row is from `git ls-files` at 14a92bc302842050cb1354108b5f16436b765504. Methods are additive to earlier targeted findings; the row names the most specific completed whole-file treatment. SHA columns contain **16 hexadecimal characters of a SHA-256 fingerprint**, not the full digest. The report itself is untracked and is not one of the 3,039 source-inventory rows. Dependencies, .git internals, ignored generated QA outputs and local runtime/secret files are outside this tracked-file census.

| Treatment | Files |
|---|---:|
| all-record-parse-and-coordinate-check | 174 |
| all-row-text-structure | 2 |
| binary-read-signature-and-hash | 4 |
| captured-source-text-inventory | 1 |
| direct-read | 84 |
| document-outline-and-link-index | 308 |
| document-outline-and-targeted-source-read | 3 |
| full-HTML-parse-and-structure-review | 23 |
| full-JSON-parse-and-coordinate-check | 717 |
| full-JSON-parse-and-record-inventory | 1 |
| full-SVG-XML-parse-and-active-content-check | 138 |
| full-YAML-parse | 492 |
| generated-worker-header-and-hash-review | 1 |
| program-read | 246 |
| program-structure-review | 171 |
| raster-full-decode | 608 |
| test-structure-review | 66 |
| **Total** | **3039** |

“Program read” means the complete executable program was displayed and reviewed, generally without comments. “Program/test structure review” means complete-source AST analysis with manually reviewed structural output. “Document outline” means complete-text machine indexing with reviewed identities/structure, not every prose sentence. “Parse/coordinate check” means every record was parsed and coordinates received basic numeric/range validation; schema/provenance gates and targeted semantic probes are reported separately. “Raster decode” does not imply an exhaustive visual review. CSV rows received text/row structure checks. Vendor worker header review does not certify all third-party worker internals.

<details>
<summary>All 3,039 tracked files, methods, bytes and SHA-256 prefixes</summary>

| File | Completed treatment | Bytes | SHA-256 prefix |
|---|---|---:|---|
| .env.example | direct-read | 1130 | c10431581f8a25d1 |
| .gitattributes | direct-read | 1249 | 65815df9d8739b31 |
| .github/workflows/ci.yml | direct-read | 786 | 6ae0296c686622b8 |
| .github/workflows/qa.yml | direct-read | 2318 | 29070c1db471e003 |
| .gitignore | direct-read | 1073 | 79d1426b02687aa5 |
| .prettierignore | direct-read | 65 | 064cf53e1bb46edb |
| .prettierrc.json | full-JSON-parse-and-coordinate-check | 110 | a480afc15588d34d |
| AGENTS.md | direct-read | 3959 | 9ebd2b26737fc329 |
| FANOUT-REPORT.md | document-outline-and-link-index | 29989 | 59c11d0c84da095d |
| README.md | direct-read | 5401 | 1b02d4bebe31908e |
| RUNBOOK.md | direct-read | 15532 | 04531fcb5e2e192d |
| apps/admin/TOKENS.md | direct-read | 6152 | 0a90438be265844f |
| apps/admin/index.html | direct-read | 369 | 4d12ec0998799810 |
| apps/admin/package.json | direct-read | 1081 | 514c0cd3e342ae27 |
| apps/admin/public/favicon.svg | full-SVG-XML-parse-and-active-content-check | 199 | 8a1efb03282a03a8 |
| apps/admin/public/mockServiceWorker.js | generated-worker-header-and-hash-review | 9666 | 26171599d94d5445 |
| apps/admin/scripts/mint-token.ts | direct-read | 1948 | 15fab8f814195787 |
| apps/admin/src/App.tsx | direct-read | 1548 | 4891e262d5976e29 |
| apps/admin/src/api/client.ts | direct-read | 5180 | fa27c79af02ca2eb |
| apps/admin/src/index.css | direct-read | 3060 | 4ec7579601e24faa |
| apps/admin/src/lib/tokenFormat.ts | direct-read | 1923 | c9283cc9eae1bb2b |
| apps/admin/src/lib/tokenNode.ts | direct-read | 2380 | 968a0f3dd99bb796 |
| apps/admin/src/main.tsx | direct-read | 697 | f8beec979e386f38 |
| apps/admin/src/msw/browser.ts | direct-read | 394 | 630234d092b7d0dd |
| apps/admin/src/msw/fixtures.ts | direct-read | 2349 | 6cb3a814b754d6cb |
| apps/admin/src/msw/handlers.ts | direct-read | 2461 | 80d69c83b5dce7cb |
| apps/admin/src/pack.ts | direct-read | 804 | 7cc3d6cf5278e832 |
| apps/admin/src/state/drafts.ts | direct-read | 1955 | 318e2c6e9a128fba |
| apps/admin/src/views/ComposerView.tsx | direct-read | 9913 | 16f155c637966b92 |
| apps/admin/src/views/HistoryView.tsx | direct-read | 4901 | 7f0272735298efca |
| apps/admin/src/views/LoginView.tsx | direct-read | 2886 | 2c060ae403d6cf9b |
| apps/admin/src/views/PortalView.tsx | direct-read | 2461 | 3571010643b26dc2 |
| apps/admin/test/contracts.test.ts | direct-read | 3154 | 68654fdbeb99b25a |
| apps/admin/test/drafts.test.ts | direct-read | 1543 | 16129c6a922ea6c6 |
| apps/admin/test/mswNode.ts | direct-read | 191 | 9f49b17d662855fb |
| apps/admin/test/pack-mock/patterns.json | direct-read | 716 | 038c5190dd221ac2 |
| apps/admin/test/pack-mock/streams.json | direct-read | 992 | cc214e4316d19e6a |
| apps/admin/test/portal.test.tsx | direct-read | 5881 | 906a5a24021a86f9 |
| apps/admin/test/setup.ts | direct-read | 328 | 6a27386fb4949780 |
| apps/admin/tsconfig.json | direct-read | 211 | 61720f3f695c0a09 |
| apps/admin/vite.config.ts | direct-read | 210 | 874c9a61c60f6332 |
| apps/admin/vitest.config.ts | direct-read | 1280 | 3e3a2de90d556b7c |
| apps/api/.env.example | direct-read | 712 | 0feded8bd1024f1f |
| apps/api/fixtures/NWS/observations-ktys.json | full-JSON-parse-and-coordinate-check | 1969 | ab8025d051f3577b |
| apps/api/fixtures/TN/2026-09-02.exceldriven.json | full-JSON-parse-and-coordinate-check | 108620 | 278c1b51420fb157 |
| apps/api/fixtures/TN/2026-09-02.html | full-HTML-parse-and-structure-review | 86709 | 99c7267a39248968 |
| apps/api/fixtures/TN/2026-09-03-redesign.html | full-HTML-parse-and-structure-review | 879 | 7198adeb824f7c4b |
| apps/api/fixtures/TN/2026-09-04-garbage.html | full-HTML-parse-and-structure-review | 197 | 04f4f09330a09e4e |
| apps/api/fixtures/TN/2026-09-04-recent.exceldriven.json | full-JSON-parse-and-coordinate-check | 943 | 3e22414df8b3030c |
| apps/api/fixtures/TN/2026-09-04-schedule.exceldriven.json | full-JSON-parse-and-coordinate-check | 108620 | 278c1b51420fb157 |
| apps/api/fixtures/TN/2026-09-04-stockings-page.html | full-HTML-parse-and-structure-review | 87093 | 600f5aee7dda0639 |
| apps/api/fixtures/TVA/generation-releases-COHT1-2026-09-13.json | full-JSON-parse-and-coordinate-check | 149 | 569fc901e4778c4d |
| apps/api/fixtures/TVA/generation-releases-NRST1-2026-09-13.json | full-JSON-parse-and-coordinate-check | 230 | 38f75eefa878281c |
| apps/api/fixtures/TVA/locations-2026-09-04.json | full-JSON-parse-and-coordinate-check | 8489 | ec85c4dd1fa557b6 |
| apps/api/fixtures/TVA/observed-data-NRST1-2026-09-04.json | full-JSON-parse-and-coordinate-check | 1073 | ab309370c8dea6c3 |
| apps/api/fixtures/TVA/observed-data-WTGT1-2026-09-04.json | full-JSON-parse-and-coordinate-check | 1089 | c883d857366d448b |
| apps/api/fixtures/TVA/predicted-data-COHT1-2026-09-13.json | full-JSON-parse-and-coordinate-check | 293 | 3507b00e52cc76d6 |
| apps/api/fixtures/TVA/predicted-data-NRST1-2026-09-13.json | full-JSON-parse-and-coordinate-check | 297 | c404d8dff620ae1d |
| apps/api/fixtures/USACE/CETT1-flow.json | full-JSON-parse-and-coordinate-check | 2702 | 93451f059cac3e65 |
| apps/api/fixtures/USACE/CETT1-stage.json | full-JSON-parse-and-coordinate-check | 4090 | 77dd41d1e8182a6a |
| apps/api/fixtures/USACE/CETT1-temp.json | full-JSON-parse-and-coordinate-check | 3978 | affa47bd403d8168 |
| apps/api/fixtures/USACE/CORT1-flow.json | full-JSON-parse-and-coordinate-check | 2681 | 2300191473a1e200 |
| apps/api/fixtures/USGS-SITE/site-iv-catalog-2026-09-04.json | full-JSON-parse-and-coordinate-check | 6323 | 0a9a73458252457e |
| apps/api/fixtures/USGS-WATERDATA/latest-continuous-03518500.json | full-JSON-parse-and-coordinate-check | 1267 | b958e463e3b2fc6f |
| apps/api/fixtures/USGS/iv-2026-09-02.json | full-JSON-parse-and-coordinate-check | 3898 | d97821a01419498d |
| apps/api/fixtures/USGS/iv-edge-cases.json | full-JSON-parse-and-coordinate-check | 3913 | 9c0b207cbcd19a5c |
| apps/api/fixtures/content/shops/TN/test-fly-shop.yaml | full-YAML-parse | 235 | dc9ce3c64dbd6aca |
| apps/api/fixtures/content/streams/TN/test-tailrace-b.yaml | full-YAML-parse | 675 | 773292f6735dd288 |
| apps/api/fixtures/content/streams/TN/watauga-river.yaml | full-YAML-parse | 933 | 8e705b97fbc48e7e |
| apps/api/migrations/001_init.sql | program-read | 2620 | 6ea9ca98688aad08 |
| apps/api/migrations/002_gauge_readings_normalized.sql | program-read | 730 | 7b78fab5fae9ed8f |
| apps/api/migrations/003_report_photo_url.sql | program-read | 297 | 533c80295bad2c21 |
| apps/api/migrations/004_stream_species.sql | program-read | 428 | f2cdf6c18266f27a |
| apps/api/migrations/005_stocking_date_precision.sql | program-read | 377 | 6762db3266022571 |
| apps/api/migrations/006_streams_waterbody_types.sql | program-read | 2011 | 6e5625468e147686 |
| apps/api/migrations/007_evidence_runs.sql | program-read | 858 | 84b3d2e0514546db |
| apps/api/migrations/008_streams_target_species.sql | program-read | 529 | 44a96d8d38b24aa4 |
| apps/api/migrations/009_region_pressure.sql | program-read | 832 | 60fef644a3e42988 |
| apps/api/migrations/010_stream_authored_metadata.sql | program-read | 502 | cfc3ade1f240e224 |
| apps/api/migrations/011_release_schedules.sql | program-read | 338 | 25cf3fa0dbd64a9e |
| apps/api/migrations/012_precipitation_context.sql | program-read | 209 | 5db5154cc4d0601e |
| apps/api/migrations/013_region_precipitation.sql | program-read | 365 | cc9d0164af820e4c |
| apps/api/migrations/014_dissolved_oxygen_reservoir_level.sql | program-read | 465 | 945b06a72c4f0892 |
| apps/api/migrations/015_stream_catalog_metadata.sql | program-read | 374 | 259de7fda92cfc11 |
| apps/api/migrations/016_stream_hydro_identity.sql | program-read | 206 | faec5f2af139fe7a |
| apps/api/migrations/017_stream_opportunity.sql | program-read | 116 | 4b4450ec71934779 |
| apps/api/package.json | direct-read | 1248 | d57fd151b047cd16 |
| apps/api/src/app.ts | program-read | 13623 | c2fa41851dce7ed9 |
| apps/api/src/cron.ts | program-read | 1757 | 6b4ef5ebdecc454b |
| apps/api/src/db.ts | program-read | 1676 | e81f15828afb39a2 |
| apps/api/src/env.ts | program-read | 3525 | af83962a7f56de4f |
| apps/api/src/evidence/alias-data.ts | program-read | 7032 | 38cbd37a6444f180 |
| apps/api/src/evidence/aliases.ts | program-read | 4920 | c0f569afc6787acf |
| apps/api/src/evidence/assemble.ts | program-read | 4758 | fe617c04e227d559 |
| apps/api/src/evidence/conditionsBridge.ts | program-read | 13118 | 5b509dd23c0fbd92 |
| apps/api/src/evidence/evidenceJob.ts | program-read | 13091 | 0ffc59f8935f927d |
| apps/api/src/evidence/monitors.ts | program-read | 8553 | 2b931c00c110b4d3 |
| apps/api/src/evidence/nws-provider.ts | program-read | 13993 | 1f7374424b55f375 |
| apps/api/src/evidence/sources.ts | program-read | 10158 | 9a147bb3dd703329 |
| apps/api/src/evidence/stale.ts | program-read | 2825 | ca3ec0931c1029c7 |
| apps/api/src/evidence/tva-provider.ts | program-read | 11481 | 6fd3b821d1601259 |
| apps/api/src/evidence/twra-evidence.ts | program-read | 10119 | 6dbf24d1bb848ccb |
| apps/api/src/evidence/usace-provider.ts | program-read | 8814 | 7f36a1a4c78acc06 |
| apps/api/src/evidence/usgs-provider.ts | program-read | 6510 | 0eedc2dae7b67f29 |
| apps/api/src/ingest/stocking/adapter-TEMPLATE.ts | program-read | 3771 | 8680704b2fe348e8 |
| apps/api/src/ingest/stocking/index.ts | program-read | 419 | 9a9b93e23cbe2261 |
| apps/api/src/ingest/stocking/tn.ts | program-read | 14528 | ef5db29aebb5a6cc |
| apps/api/src/ingest/stocking/types.ts | program-read | 1309 | db6ad55b79318d34 |
| apps/api/src/ingest/stockingJob.ts | program-read | 5302 | 210b1dfcbe5e7389 |
| apps/api/src/ingest/usgs-waterdata.ts | program-read | 6457 | 457fe7126964f9e7 |
| apps/api/src/ingest/usgs.ts | program-read | 14017 | af3bc57f6e2bff83 |
| apps/api/src/jobs/run.ts | program-read | 5071 | 729653a581488698 |
| apps/api/src/lib/content.ts | program-read | 1137 | 40060a7b3febb51c |
| apps/api/src/lib/gauge-now.ts | program-read | 3584 | b5337044acd011ff |
| apps/api/src/lib/ids.ts | program-read | 374 | 9d691b923cc53b69 |
| apps/api/src/lib/jsonFile.ts | program-read | 890 | 1749bceba1ed906c |
| apps/api/src/lib/retry.ts | program-read | 1247 | 118b02bb9a1b3786 |
| apps/api/src/lib/sanitize.ts | program-read | 1067 | 279384635bafd33b |
| apps/api/src/lib/seed.ts | program-read | 5192 | 0f5cd03bd3a55cfb |
| apps/api/src/pipeline.ts | program-read | 10899 | a7418f691303b37e |
| apps/api/src/portal/routes.ts | program-read | 7653 | ada0bb8a852b2fb9 |
| apps/api/src/portal/tokens.ts | program-read | 3441 | 2dd8f940b6a19092 |
| apps/api/src/scripts/build-coverage.ts | program-read | 21124 | e39ac6b2dfed4ef9 |
| apps/api/src/scripts/ingest.ts | program-read | 2522 | eaee3d8408843631 |
| apps/api/src/scripts/seed.ts | program-read | 781 | 2782a624538a6233 |
| apps/api/src/scripts/token.ts | program-read | 1617 | b9a17dd767cc1d99 |
| apps/api/src/server.ts | program-read | 977 | 71f7657d587bc904 |
| apps/api/src/snapshots/build.ts | program-read | 23688 | 8f0fa6cc9910e9d4 |
| apps/api/src/snapshots/fishability.ts | program-read | 12484 | 6b8ef45d66ccd1d6 |
| apps/api/src/snapshots/health.ts | program-read | 6282 | 90a28c4d357a169c |
| apps/api/test/app.test.ts | program-structure-review | 8540 | a88a9e2d276b5bc8 |
| apps/api/test/conditions-bridge.test.ts | program-structure-review | 15078 | b0968a124f10a2d9 |
| apps/api/test/dryRun.test.ts | program-structure-review | 1850 | 4a95371cd4a47bf2 |
| apps/api/test/evidence-aliases.test.ts | program-structure-review | 7322 | 32d1152044b9269c |
| apps/api/test/evidence-assemble.test.ts | program-structure-review | 11639 | 1e4b103f7a9400f9 |
| apps/api/test/evidence-snapshot.test.ts | program-structure-review | 6014 | ed63de2d1d8fa4be |
| apps/api/test/evidence-stale.test.ts | program-structure-review | 3040 | 0ef5109f5cb9d714 |
| apps/api/test/evidence-tva-schedule.test.ts | program-structure-review | 4959 | e3d91d658b311eb5 |
| apps/api/test/evidence-tva.test.ts | program-structure-review | 4354 | f47be78770441dbc |
| apps/api/test/evidence-twra.test.ts | program-structure-review | 6494 | fa6e8a8c9e39e268 |
| apps/api/test/evidence-usace.test.ts | program-structure-review | 7502 | 12d0a83e74f2fb6f |
| apps/api/test/evidence-usgs.test.ts | program-structure-review | 5196 | c87a3da045169a17 |
| apps/api/test/fishability-emission.test.ts | program-structure-review | 18567 | c38a0284dbf79693 |
| apps/api/test/gauges-now.test.ts | program-structure-review | 6050 | 80434e9154fd4e07 |
| apps/api/test/health.test.ts | program-structure-review | 12101 | 10e8a51592862521 |
| apps/api/test/helpers.ts | program-structure-review | 1958 | 56f2f7425624918c |
| apps/api/test/infra-alert-context.test.ts | program-structure-review | 2524 | f695e6d41e32e6c7 |
| apps/api/test/infra-backup.test.ts | direct-read | 5525 | c7672c7e6a306c84 |
| apps/api/test/infra-deploy.test.ts | program-structure-review | 7954 | ec68680057559553 |
| apps/api/test/infra-verify-site.test.ts | program-structure-review | 6288 | d79f33d8afb0fc25 |
| apps/api/test/ingest-waterdata.test.ts | program-structure-review | 1385 | bd75452d79875c5b |
| apps/api/test/migrations.test.ts | program-structure-review | 3427 | 14cfd1550e277be5 |
| apps/api/test/nws-provider.test.ts | direct-read | 10521 | 96015fe1a7e692ea |
| apps/api/test/pipelineConfig.test.ts | program-structure-review | 2033 | a52fb79bbdbe5fa5 |
| apps/api/test/portal.test.ts | program-structure-review | 11815 | 6f144879e97547cc |
| apps/api/test/release-schedule-snapshot.test.ts | program-structure-review | 1785 | d2ab56ac81e95286 |
| apps/api/test/retry.test.ts | program-structure-review | 1205 | 530cfbecd47703a1 |
| apps/api/test/seed.test.ts | program-structure-review | 4541 | 2a26fcfd232996a8 |
| apps/api/test/snapshots.test.ts | program-structure-review | 17154 | 05fabf5ca75ac5df |
| apps/api/test/stale-metrics.test.ts | program-structure-review | 4825 | af3b261b1268cad8 |
| apps/api/test/static-conditional.test.ts | program-structure-review | 3901 | d0bb9b7e6b560f98 |
| apps/api/test/static-server.test.ts | program-structure-review | 12406 | 8e7449fcb4d8d919 |
| apps/api/test/stocking.test.ts | program-structure-review | 8236 | 80179356a8828d37 |
| apps/api/test/usgs-waterdata.test.ts | program-structure-review | 3143 | 0a1b6bec40d13cfd |
| apps/api/test/usgs.test.ts | program-structure-review | 8738 | c83e309d5b3260ed |
| apps/api/tsconfig.build.json | direct-read | 243 | 94cb146330c53e25 |
| apps/api/tsconfig.json | direct-read | 206 | 4a40c1bc4ba334ea |
| apps/api/vitest.config.ts | direct-read | 532 | 54ef52067d8f838f |
| apps/marketing/ANALYTICS.md | document-outline-and-link-index | 1936 | 2b7102cf1ed6b0c7 |
| apps/marketing/GROWTH.md | document-outline-and-link-index | 2929 | f2f3cf64e1c43864 |
| apps/marketing/README.md | document-outline-and-link-index | 2032 | 72e59bf06b79c59b |
| apps/marketing/astro.config.mjs | program-read | 561 | d24ac1348d4b12bd |
| apps/marketing/package.json | direct-read | 653 | 778ef6d02e2eb224 |
| apps/marketing/partners.yaml | full-YAML-parse | 569 | 8c8d623ef9350f53 |
| apps/marketing/public/favicon.svg | full-SVG-XML-parse-and-active-content-check | 199 | 8a1efb03282a03a8 |
| apps/marketing/src/components/AdSlot.astro | program-read | 611 | cbd179bbd086725d |
| apps/marketing/src/components/AffiliateLink.astro | program-read | 1139 | 68d12b72df33e4e4 |
| apps/marketing/src/components/ConditionsEmbed.astro | program-read | 2369 | a33e21d7632928b7 |
| apps/marketing/src/components/Disclaimer.astro | program-read | 595 | 1235a11d9c5d4184 |
| apps/marketing/src/components/HatchChartTable.astro | program-read | 1708 | c08d1aaeb36bcb57 |
| apps/marketing/src/components/NewsletterForm.astro | program-read | 2085 | c9422b722934d1c8 |
| apps/marketing/src/components/ScoreBadge.astro | program-read | 586 | a65e0b60d85814cf |
| apps/marketing/src/components/StockingTable.astro | program-read | 1589 | 997a6e2f438ae88b |
| apps/marketing/src/data/fixtures/hatch.tn.json | full-JSON-parse-and-coordinate-check | 23567 | 337903857b3805ab |
| apps/marketing/src/data/fixtures/patterns.json | full-JSON-parse-and-coordinate-check | 4174 | 9d15c826e0c388c7 |
| apps/marketing/src/data/fixtures/readings.tn.json | full-JSON-parse-and-coordinate-check | 1194 | 232f43c8f15600ec |
| apps/marketing/src/data/fixtures/reports.tn.json | full-JSON-parse-and-coordinate-check | 2044 | fae79c499463ec28 |
| apps/marketing/src/data/fixtures/shops.tn.json | full-JSON-parse-and-coordinate-check | 723 | 649c831fe243c4dc |
| apps/marketing/src/data/fixtures/stocking.tn.json | full-JSON-parse-and-coordinate-check | 3383 | b0e8768b4ecf6a04 |
| apps/marketing/src/data/fixtures/streams.tn.json | full-JSON-parse-and-coordinate-check | 6113 | caf0139a01af2e13 |
| apps/marketing/src/data/fixtures/taxa.json | full-JSON-parse-and-coordinate-check | 9684 | cf011f9324f6626d |
| apps/marketing/src/data/load.ts | program-read | 12416 | 84e7c13dcc875199 |
| apps/marketing/src/data/posts.ts | program-read | 536 | 1a3de2b630d3db6f |
| apps/marketing/src/data/states.ts | program-read | 6134 | 09006b24a3cd56ba |
| apps/marketing/src/env.d.ts | program-read | 177 | 4302bc1a3be32bee |
| apps/marketing/src/layouts/Base.astro | program-read | 3418 | 5efa04313d80a07e |
| apps/marketing/src/lib/format.ts | program-read | 1358 | d4c229de9671cc35 |
| apps/marketing/src/lib/seo.ts | program-read | 2124 | adbedc012c06eeba |
| apps/marketing/src/lib/waterCopy.ts | program-read | 1388 | 285b44851ac03eba |
| apps/marketing/src/pages/404.astro | program-read | 599 | 0a7f9afebd498d5f |
| apps/marketing/src/pages/about.astro | program-read | 2545 | 554cbf4036a7d45e |
| apps/marketing/src/pages/blog/index.astro | program-read | 728 | efd1f2ddf64c0973 |
| apps/marketing/src/pages/blog/why-offline-first.astro | program-read | 2377 | cf295db72436837e |
| apps/marketing/src/pages/data-sources.astro | program-read | 7730 | 10a1a593881ef441 |
| apps/marketing/src/pages/fishing/[state]/index.astro | program-read | 6943 | 7d149552b46d3856 |
| apps/marketing/src/pages/hatch/[state]/[region]/index.astro | program-read | 4222 | f7b039887704e9a2 |
| apps/marketing/src/pages/index.astro | program-read | 4564 | 184273499853119f |
| apps/marketing/src/pages/install.astro | program-read | 2391 | ea01c204d7c8a21e |
| apps/marketing/src/pages/privacy.astro | program-read | 3327 | 6be4d4b8cd07c630 |
| apps/marketing/src/pages/regulations/[state]/index.astro | program-read | 5365 | 47926b6fa41061df |
| apps/marketing/src/pages/robots.txt.ts | program-read | 555 | 8322361c09c90668 |
| apps/marketing/src/pages/sitemap.xml.ts | program-read | 1977 | 29489ad1d8c643e0 |
| apps/marketing/src/pages/stocking/[state]/index.astro | program-read | 4845 | 79d7efbf03bfd39a |
| apps/marketing/src/pages/streams/[state]/[slug]/index.astro | program-read | 7225 | 8546852c1036777a |
| apps/marketing/src/pages/streams/[state]/index.astro | program-read | 2691 | 6b461e8a342289a8 |
| apps/marketing/src/pages/when-does-[state]-stock-trout/index.astro | program-read | 5063 | e28d9f4daba7ac1c |
| apps/marketing/src/site-config.ts | program-read | 276 | 03c07009fab39ff5 |
| apps/marketing/src/styles/global.css | program-read | 5006 | 5ad39b85aa370bee |
| apps/marketing/tsconfig.json | direct-read | 118 | 70c5d126e1c4ba37 |
| apps/web/.killmarker | direct-read | 0 | e3b0c44298fc1c14 |
| apps/web/atlas-sources/selectable-river-additions.json | full-JSON-parse-and-coordinate-check | 23615 | a793b03fa382a7e5 |
| apps/web/atlas-sources/selectable-water-traces.json | full-JSON-parse-and-coordinate-check | 64537 | 9b4637d998864dce |
| apps/web/atlas-sources/verified/east-southeast.geojson | full-JSON-parse-and-coordinate-check | 920115 | cfadedbefab73e07 |
| apps/web/atlas-sources/verified/east-southeast.topology.json | full-JSON-parse-and-coordinate-check | 159891 | 392d6dcfd48ba887 |
| apps/web/atlas-sources/verified/west-middle.geojson | full-JSON-parse-and-coordinate-check | 787639 | 8668ee66d108e758 |
| apps/web/atlas-sources/verified/west-middle.topology.json | full-JSON-parse-and-coordinate-check | 167087 | cf4d2f0b4694a7d7 |
| apps/web/fixtures/data/content/fishing.json | full-JSON-parse-and-coordinate-check | 25247 | 6177332efe728169 |
| apps/web/fixtures/data/content/patterns.json | full-JSON-parse-and-coordinate-check | 8217 | a86c083e429f6ca1 |
| apps/web/fixtures/data/content/taxa.json | full-JSON-parse-and-coordinate-check | 23276 | baa4a42bb819a04c |
| apps/web/fixtures/data/v1/conditions/latest.json | full-JSON-parse-and-coordinate-check | 92868 | c545ddaa4adcb057 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/1.json | full-JSON-parse-and-coordinate-check | 1108 | aa84055932414342 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/10.json | full-JSON-parse-and-coordinate-check | 1656 | b8f2e0d55828450e |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/11.json | full-JSON-parse-and-coordinate-check | 1656 | 17f9788b1f931a7c |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/12.json | full-JSON-parse-and-coordinate-check | 1109 | ebec77baf115bc05 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/2.json | full-JSON-parse-and-coordinate-check | 1108 | 4cd78a241ecd48d8 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/3.json | full-JSON-parse-and-coordinate-check | 1655 | e9f003728b6c50cb |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/4.json | full-JSON-parse-and-coordinate-check | 2956 | 94d3b6fdda37f7d5 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/5.json | full-JSON-parse-and-coordinate-check | 3906 | e374077dc432be94 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/6.json | full-JSON-parse-and-coordinate-check | 2087 | 264150538ad08095 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/7.json | full-JSON-parse-and-coordinate-check | 1532 | 9b32d571737d8ae0 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/8.json | full-JSON-parse-and-coordinate-check | 1532 | f97e662b4d083833 |
| apps/web/fixtures/data/v1/hatch/tn-cumberland-plateau/9.json | full-JSON-parse-and-coordinate-check | 783 | afa13ddd15993bc2 |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/1.json | full-JSON-parse-and-coordinate-check | 1101 | 55d0c6450f77fb68 |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/10.json | full-JSON-parse-and-coordinate-check | 1649 | bcd757190f057fb8 |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/11.json | full-JSON-parse-and-coordinate-check | 1649 | 577b005fcbec4d8e |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/12.json | full-JSON-parse-and-coordinate-check | 1102 | 37f8f4ccc933d3df |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/2.json | full-JSON-parse-and-coordinate-check | 1101 | ccb7b98c034f951d |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/3.json | full-JSON-parse-and-coordinate-check | 1648 | c8a6a985e16528df |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/4.json | full-JSON-parse-and-coordinate-check | 3671 | 9ce04b7179b13c64 |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/5.json | full-JSON-parse-and-coordinate-check | 4248 | 9f7030f87ef21eea |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/6.json | full-JSON-parse-and-coordinate-check | 3903 | d7bcbafc094f5e13 |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/7.json | full-JSON-parse-and-coordinate-check | 1692 | 5a4b005baf81421b |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/8.json | full-JSON-parse-and-coordinate-check | 1692 | 751710c819828b0f |
| apps/web/fixtures/data/v1/hatch/tn-east-clinch/9.json | full-JSON-parse-and-coordinate-check | 2584 | 3233c724b135b049 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/1.json | full-JSON-parse-and-coordinate-check | 1102 | c3b6a010059bddc2 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/10.json | full-JSON-parse-and-coordinate-check | 1650 | 0dd5ae804424fd60 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/11.json | full-JSON-parse-and-coordinate-check | 1650 | 3335935f855fe400 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/12.json | full-JSON-parse-and-coordinate-check | 1103 | 0f6d7a6b406cd402 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/2.json | full-JSON-parse-and-coordinate-check | 1102 | 39df0dd23d63336d |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/3.json | full-JSON-parse-and-coordinate-check | 1649 | 36a5a9dad51a9159 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/4.json | full-JSON-parse-and-coordinate-check | 3672 | 96335e10ed04a5a1 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/5.json | full-JSON-parse-and-coordinate-check | 4249 | d4f4c9dad8ed0738 |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/6.json | full-JSON-parse-and-coordinate-check | 3904 | fbba28417234d3fa |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/7.json | full-JSON-parse-and-coordinate-check | 1693 | 8b4f3dee15d4753e |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/8.json | full-JSON-parse-and-coordinate-check | 1693 | 54f03f32babc2c3f |
| apps/web/fixtures/data/v1/hatch/tn-east-holston/9.json | full-JSON-parse-and-coordinate-check | 2585 | d8184db5dd6ad608 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/1.json | full-JSON-parse-and-coordinate-check | 1113 | d902cdb948aef010 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/10.json | full-JSON-parse-and-coordinate-check | 1661 | 0bf6c7c93bda6293 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/11.json | full-JSON-parse-and-coordinate-check | 1661 | c6221db3b4dd8ae0 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/12.json | full-JSON-parse-and-coordinate-check | 1114 | 8ce985779baf9632 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/2.json | full-JSON-parse-and-coordinate-check | 1113 | 953e119c050e4dee |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/3.json | full-JSON-parse-and-coordinate-check | 1660 | ff08eb38fd1e4d39 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/4.json | full-JSON-parse-and-coordinate-check | 3683 | 63e8297d259fc120 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/5.json | full-JSON-parse-and-coordinate-check | 4260 | ab6ed093bd27cce3 |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/6.json | full-JSON-parse-and-coordinate-check | 3915 | 8e2981749ef4bc9c |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/7.json | full-JSON-parse-and-coordinate-check | 1704 | 5606ade748bc9e8a |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/8.json | full-JSON-parse-and-coordinate-check | 1704 | 1277378785ff936b |
| apps/web/fixtures/data/v1/hatch/tn-east-pigeon-frenchbroad/9.json | full-JSON-parse-and-coordinate-check | 2596 | 7f8a1bcae4b8bf6a |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/1.json | full-JSON-parse-and-coordinate-check | 1102 | e845c78e62b0ecce |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/10.json | full-JSON-parse-and-coordinate-check | 1650 | 404fcd085ea6e89e |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/11.json | full-JSON-parse-and-coordinate-check | 1650 | 6563596cac8fa75a |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/12.json | full-JSON-parse-and-coordinate-check | 1103 | 703b8bbaa06baf55 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/2.json | full-JSON-parse-and-coordinate-check | 1102 | 455133962631af77 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/3.json | full-JSON-parse-and-coordinate-check | 1649 | 3dcb8a83b26a8b9e |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/4.json | full-JSON-parse-and-coordinate-check | 3672 | e8de927fd330f6f0 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/5.json | full-JSON-parse-and-coordinate-check | 4249 | 12aa877095c15c15 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/6.json | full-JSON-parse-and-coordinate-check | 3904 | 8846b99a99790f15 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/7.json | full-JSON-parse-and-coordinate-check | 1693 | 372c167dc9e6cbe7 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/8.json | full-JSON-parse-and-coordinate-check | 1693 | d30fe575fe1e5f05 |
| apps/web/fixtures/data/v1/hatch/tn-east-smokies/9.json | full-JSON-parse-and-coordinate-check | 2585 | bf9376ed992aa813 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/1.json | full-JSON-parse-and-coordinate-check | 1107 | 4c9d5c67190ab3ae |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/10.json | full-JSON-parse-and-coordinate-check | 1655 | 5ee1f2689b543e03 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/11.json | full-JSON-parse-and-coordinate-check | 1655 | eb365fb862b513e7 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/12.json | full-JSON-parse-and-coordinate-check | 1108 | 5b2643ad5376bfef |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/2.json | full-JSON-parse-and-coordinate-check | 1107 | 83f40f27c53e9114 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/3.json | full-JSON-parse-and-coordinate-check | 1654 | 5ca974506217948b |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/4.json | full-JSON-parse-and-coordinate-check | 2955 | e9633b27c185b5a2 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/5.json | full-JSON-parse-and-coordinate-check | 3905 | e88205b964b55ec4 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/6.json | full-JSON-parse-and-coordinate-check | 2086 | 244d1989fdb9266f |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/7.json | full-JSON-parse-and-coordinate-check | 1531 | 4bfb98e279bc5e85 |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/8.json | full-JSON-parse-and-coordinate-check | 1531 | a9a818b5011f936b |
| apps/web/fixtures/data/v1/hatch/tn-middle-caney-fork/9.json | full-JSON-parse-and-coordinate-check | 782 | bc9bc0b5ebc5e21e |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/1.json | full-JSON-parse-and-coordinate-check | 1105 | 3cef34d411ce483c |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/10.json | full-JSON-parse-and-coordinate-check | 1653 | 6369a9697923a1d8 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/11.json | full-JSON-parse-and-coordinate-check | 1653 | ea65cd7b14afe8d1 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/12.json | full-JSON-parse-and-coordinate-check | 1106 | ad84e546b47cacfb |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/2.json | full-JSON-parse-and-coordinate-check | 1105 | fa5f1d50eb59d268 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/3.json | full-JSON-parse-and-coordinate-check | 1652 | 1598f69bda81a5c5 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/4.json | full-JSON-parse-and-coordinate-check | 2953 | f537b9ca3c09b629 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/5.json | full-JSON-parse-and-coordinate-check | 3903 | 2bbbb5bce29eb6bf |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/6.json | full-JSON-parse-and-coordinate-check | 2084 | 663cb292401cd1c7 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/7.json | full-JSON-parse-and-coordinate-check | 1529 | fa0f636305ead4c5 |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/8.json | full-JSON-parse-and-coordinate-check | 1529 | 0bb4b06789a5237e |
| apps/web/fixtures/data/v1/hatch/tn-middle-duck-elk/9.json | full-JSON-parse-and-coordinate-check | 780 | 822ae0cde616b43f |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/1.json | full-JSON-parse-and-coordinate-check | 1106 | e2fd3f34ae7040cd |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/10.json | full-JSON-parse-and-coordinate-check | 1654 | 33143ebdda3e0c98 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/11.json | full-JSON-parse-and-coordinate-check | 1654 | c965f62b0d4af333 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/12.json | full-JSON-parse-and-coordinate-check | 1107 | dd1aadb81ddb4263 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/2.json | full-JSON-parse-and-coordinate-check | 1106 | b7917414d14cf9f2 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/3.json | full-JSON-parse-and-coordinate-check | 1653 | 9e61803c2d81bb99 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/4.json | full-JSON-parse-and-coordinate-check | 2954 | e668587b6dcbb5fc |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/5.json | full-JSON-parse-and-coordinate-check | 3904 | d3e6692a7d694bf4 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/6.json | full-JSON-parse-and-coordinate-check | 2085 | 8b7f4552a89994a0 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/7.json | full-JSON-parse-and-coordinate-check | 1530 | f77b592dad29e250 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/8.json | full-JSON-parse-and-coordinate-check | 1530 | 71681d3c192985a5 |
| apps/web/fixtures/data/v1/hatch/tn-middle-nashville/9.json | full-JSON-parse-and-coordinate-check | 781 | ca77f8d9d4f3a199 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/1.json | full-JSON-parse-and-coordinate-check | 1107 | f7b8208e188b6931 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/10.json | full-JSON-parse-and-coordinate-check | 1655 | e6444d5cc8956f38 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/11.json | full-JSON-parse-and-coordinate-check | 1655 | 1b02e0012870ee6e |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/12.json | full-JSON-parse-and-coordinate-check | 1108 | 248928426621dce1 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/2.json | full-JSON-parse-and-coordinate-check | 1107 | a2397543276ccff8 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/3.json | full-JSON-parse-and-coordinate-check | 1654 | b412a2ddad5bfc3b |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/4.json | full-JSON-parse-and-coordinate-check | 3677 | f55a92b803c9044c |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/5.json | full-JSON-parse-and-coordinate-check | 4254 | 772e8e37cdded585 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/6.json | full-JSON-parse-and-coordinate-check | 3909 | a6858fca6bf40d7f |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/7.json | full-JSON-parse-and-coordinate-check | 1698 | def19dd5623c8164 |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/8.json | full-JSON-parse-and-coordinate-check | 1698 | f43cba89389f61cd |
| apps/web/fixtures/data/v1/hatch/tn-northeast-watauga/9.json | full-JSON-parse-and-coordinate-check | 2590 | 47efe7148a1d8b58 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/1.json | full-JSON-parse-and-coordinate-check | 417 | c13ba0f73e02e201 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/10.json | full-JSON-parse-and-coordinate-check | 1477 | 81dcc4c1318fc37a |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/11.json | full-JSON-parse-and-coordinate-check | 1310 | 51990efd662eea99 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/12.json | full-JSON-parse-and-coordinate-check | 418 | 003e97bcfb642181 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/2.json | full-JSON-parse-and-coordinate-check | 1309 | 754352d75f7e6ac3 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/3.json | full-JSON-parse-and-coordinate-check | 2209 | a92c9b56bdf7d41e |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/4.json | full-JSON-parse-and-coordinate-check | 3671 | 790ec97c3c8f7f5d |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/5.json | full-JSON-parse-and-coordinate-check | 4420 | fd740ed5d9f3aa18 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/6.json | full-JSON-parse-and-coordinate-check | 3163 | 0736a3809108bfe0 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/7.json | full-JSON-parse-and-coordinate-check | 1864 | cf62d6ff1dfef345 |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/8.json | full-JSON-parse-and-coordinate-check | 1864 | 0ed5b5e42edd3bcb |
| apps/web/fixtures/data/v1/hatch/tn-se-hiwassee/9.json | full-JSON-parse-and-coordinate-check | 2361 | 3d89b2038824be84 |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/1.json | full-JSON-parse-and-coordinate-check | 1106 | 659b04af65a3ad20 |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/10.json | full-JSON-parse-and-coordinate-check | 1654 | 63b764e5bbef66ae |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/11.json | full-JSON-parse-and-coordinate-check | 1654 | 33699be09801313b |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/12.json | full-JSON-parse-and-coordinate-check | 1107 | 8b5d9950cf8c119d |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/2.json | full-JSON-parse-and-coordinate-check | 1106 | 60b39c108110c112 |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/3.json | full-JSON-parse-and-coordinate-check | 1653 | 277d3f4f88e53c71 |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/4.json | full-JSON-parse-and-coordinate-check | 2954 | fc56622b4d68315c |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/5.json | full-JSON-parse-and-coordinate-check | 3904 | 406983752c22fd83 |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/6.json | full-JSON-parse-and-coordinate-check | 2085 | afc6aaf887a3836b |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/7.json | full-JSON-parse-and-coordinate-check | 1530 | 82c986c8f4c2b0fa |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/8.json | full-JSON-parse-and-coordinate-check | 1530 | f997a4a564491900 |
| apps/web/fixtures/data/v1/hatch/tn-upper-cumberland/9.json | full-JSON-parse-and-coordinate-check | 781 | b437f9971249bd9b |
| apps/web/fixtures/data/v1/reports/recent.json | full-JSON-parse-and-coordinate-check | 2640 | 964daf2029ee2b27 |
| apps/web/fixtures/data/v1/shops/TN.json | full-JSON-parse-and-coordinate-check | 1280 | 419898944be4f0aa |
| apps/web/fixtures/data/v1/stocking/TN.json | full-JSON-parse-and-coordinate-check | 4403 | ba7f38f5976ebe32 |
| apps/web/fixtures/data/v1/streams | full-JSON-parse-and-record-inventory | 255856 | a31622ad11774908 |
| apps/web/index.html | direct-read | 451 | 2c4dceadbac24c41 |
| apps/web/package.json | direct-read | 2030 | bd7f3743981a7c06 |
| apps/web/postcss.config.js | direct-read | 81 | e32657baf631d7c5 |
| apps/web/public/atlas/gauges-tn.geojson | full-JSON-parse-and-coordinate-check | 35161 | 56bc70bac890e9eb |
| apps/web/public/atlas/network/0505.geojson | full-JSON-parse-and-coordinate-check | 1894036 | 4bc82656de9c8af1 |
| apps/web/public/atlas/network/0511.geojson | full-JSON-parse-and-coordinate-check | 855883 | 49dd3b8728c43022 |
| apps/web/public/atlas/network/0513aaa.geojson | full-JSON-parse-and-coordinate-check | 3064026 | 9f23856b7bebd863 |
| apps/web/public/atlas/network/0513aab.geojson | full-JSON-parse-and-coordinate-check | 1477800 | 24d83dc28fa035d7 |
| apps/web/public/atlas/network/0513ab.geojson | full-JSON-parse-and-coordinate-check | 1528287 | 174e66aa188aecd9 |
| apps/web/public/atlas/network/0513b.geojson | full-JSON-parse-and-coordinate-check | 3267963 | 693b1b71bd7876b4 |
| apps/web/public/atlas/network/0601aa.geojson | full-JSON-parse-and-coordinate-check | 2932981 | 6bb07a5e7ab30c92 |
| apps/web/public/atlas/network/0601abaaa.geojson | full-JSON-parse-and-coordinate-check | 3223726 | 0b2a2ffd6fbc60ed |
| apps/web/public/atlas/network/0601abaab.geojson | full-JSON-parse-and-coordinate-check | 3351267 | 362896088d9b6677 |
| apps/web/public/atlas/network/0601abab.geojson | full-JSON-parse-and-coordinate-check | 999963 | 937ac4befbf86769 |
| apps/web/public/atlas/network/0601abb.geojson | full-JSON-parse-and-coordinate-check | 2756634 | 330a9076141be8a6 |
| apps/web/public/atlas/network/0601baa.geojson | full-JSON-parse-and-coordinate-check | 1977159 | 491469c2956a8190 |
| apps/web/public/atlas/network/0601bab.geojson | full-JSON-parse-and-coordinate-check | 2081211 | 4de4ddef20e8d76e |
| apps/web/public/atlas/network/0601bb.geojson | full-JSON-parse-and-coordinate-check | 3046483 | 0cb915b675472d74 |
| apps/web/public/atlas/network/0602a.geojson | full-JSON-parse-and-coordinate-check | 3098570 | 4dd6a7ffcb90f902 |
| apps/web/public/atlas/network/0602b.geojson | full-JSON-parse-and-coordinate-check | 757835 | 058e05535d624b22 |
| apps/web/public/atlas/network/0603a.geojson | full-JSON-parse-and-coordinate-check | 3360622 | fe5157a3beee8a3e |
| apps/web/public/atlas/network/0603b.geojson | full-JSON-parse-and-coordinate-check | 2430866 | eaf8880d245f3ae8 |
| apps/web/public/atlas/network/0604a.geojson | full-JSON-parse-and-coordinate-check | 3564855 | 729ea474a36f45b1 |
| apps/web/public/atlas/network/0604b.geojson | full-JSON-parse-and-coordinate-check | 2452698 | 3948c19878eace0b |
| apps/web/public/atlas/network/0801a.geojson | full-JSON-parse-and-coordinate-check | 2345043 | 261b7f66932b24f6 |
| apps/web/public/atlas/network/0801b.geojson | full-JSON-parse-and-coordinate-check | 2628153 | 5a2068ef918afd84 |
| apps/web/public/atlas/network/0803.geojson | full-JSON-parse-and-coordinate-check | 1137217 | d3636db74a5014b6 |
| apps/web/public/atlas/network/manifest.json | full-JSON-parse-and-coordinate-check | 6096 | c6158a43394e9b2b |
| apps/web/public/atlas/places.json | full-JSON-parse-and-coordinate-check | 4712 | b2307540969ebd17 |
| apps/web/public/atlas/provenance.json | full-JSON-parse-and-coordinate-check | 258399 | 969c5acaf690cca4 |
| apps/web/public/atlas/rivers.geojson | full-JSON-parse-and-coordinate-check | 3519970 | c656f605f7232885 |
| apps/web/public/atlas/roads-major.geojson | full-JSON-parse-and-coordinate-check | 1785851 | 746e57a282d09a1a |
| apps/web/public/atlas/roads-manifest.json | full-JSON-parse-and-coordinate-check | 3059 | 66865aa943f76913 |
| apps/web/public/atlas/roads-mid.geojson | full-JSON-parse-and-coordinate-check | 2651753 | f1975e35a071f8c2 |
| apps/web/public/atlas/roads-minor.geojson | full-JSON-parse-and-coordinate-check | 169053 | 2850927f7b2b9ec5 |
| apps/web/public/atlas/states-context.geojson | full-JSON-parse-and-coordinate-check | 393798 | ecfbe6b049d5f8d9 |
| apps/web/public/atlas/tn-boundary.geojson | full-JSON-parse-and-coordinate-check | 42200 | b04054e4e0f3efd5 |
| apps/web/public/atlas/tn-counties.geojson | full-JSON-parse-and-coordinate-check | 153381 | c44057f5089c6661 |
| apps/web/public/atlas/topo/contours-band0.geojson | full-JSON-parse-and-coordinate-check | 4209952 | 3e5f5f74c4bcc0d4 |
| apps/web/public/atlas/topo/contours-band1.geojson | full-JSON-parse-and-coordinate-check | 3085903 | ea57b1e1e8774a08 |
| apps/web/public/atlas/topo/contours-band2.geojson | full-JSON-parse-and-coordinate-check | 4943996 | 341fc277002a6650 |
| apps/web/public/atlas/topo/hillshade/10/256/403.webp | raster-full-decode | 10456 | 49792822801ab1d5 |
| apps/web/public/atlas/topo/hillshade/10/256/404.webp | raster-full-decode | 12378 | 9258ed0c21088be9 |
| apps/web/public/atlas/topo/hillshade/10/257/401.webp | raster-full-decode | 7372 | 6208870de2465ec2 |
| apps/web/public/atlas/topo/hillshade/10/257/402.webp | raster-full-decode | 9516 | f2e53248a3a17525 |
| apps/web/public/atlas/topo/hillshade/10/257/403.webp | raster-full-decode | 11062 | 267a5f7b1e3c0064 |
| apps/web/public/atlas/topo/hillshade/10/257/404.webp | raster-full-decode | 12382 | 598bd3b7a434197f |
| apps/web/public/atlas/topo/hillshade/10/258/401.webp | raster-full-decode | 10898 | a3085343116f2e1f |
| apps/web/public/atlas/topo/hillshade/10/258/402.webp | raster-full-decode | 10552 | 67e3f47b8ad41df3 |
| apps/web/public/atlas/topo/hillshade/10/258/403.webp | raster-full-decode | 11740 | 9b6a9f8bc8cc3471 |
| apps/web/public/atlas/topo/hillshade/10/258/404.webp | raster-full-decode | 15904 | 2cedd76eaae5949f |
| apps/web/public/atlas/topo/hillshade/10/259/401.webp | raster-full-decode | 12990 | d87a5fe2b5dcb121 |
| apps/web/public/atlas/topo/hillshade/10/259/402.webp | raster-full-decode | 14400 | 288a646628c29971 |
| apps/web/public/atlas/topo/hillshade/10/259/403.webp | raster-full-decode | 16238 | d565b00c002bfedd |
| apps/web/public/atlas/topo/hillshade/10/259/404.webp | raster-full-decode | 20192 | e22c47011dce2300 |
| apps/web/public/atlas/topo/hillshade/10/260/401.webp | raster-full-decode | 17738 | 580b6b251ea60f85 |
| apps/web/public/atlas/topo/hillshade/10/260/402.webp | raster-full-decode | 19818 | 264db6c6bed8f846 |
| apps/web/public/atlas/topo/hillshade/10/260/403.webp | raster-full-decode | 21350 | ce4027870a6931d2 |
| apps/web/public/atlas/topo/hillshade/10/260/404.webp | raster-full-decode | 19646 | 28f6c6aec049a3e5 |
| apps/web/public/atlas/topo/hillshade/10/261/401.webp | raster-full-decode | 20306 | 8b4da419c83bc133 |
| apps/web/public/atlas/topo/hillshade/10/261/402.webp | raster-full-decode | 22946 | 640d4ce92201982f |
| apps/web/public/atlas/topo/hillshade/10/261/403.webp | raster-full-decode | 26170 | a021a98e5a3f620f |
| apps/web/public/atlas/topo/hillshade/10/261/404.webp | raster-full-decode | 24894 | c3c6e7e8de981a75 |
| apps/web/public/atlas/topo/hillshade/10/262/400.webp | raster-full-decode | 25510 | d4b73de625417678 |
| apps/web/public/atlas/topo/hillshade/10/262/401.webp | raster-full-decode | 27906 | 9885313c1dd42f8a |
| apps/web/public/atlas/topo/hillshade/10/262/402.webp | raster-full-decode | 27824 | f19656b3144b6406 |
| apps/web/public/atlas/topo/hillshade/10/262/403.webp | raster-full-decode | 30206 | 1777096363e2a52f |
| apps/web/public/atlas/topo/hillshade/10/262/404.webp | raster-full-decode | 28980 | fdb015de18975dbd |
| apps/web/public/atlas/topo/hillshade/10/263/400.webp | raster-full-decode | 24392 | dd9ba6f66f9b5ec9 |
| apps/web/public/atlas/topo/hillshade/10/263/401.webp | raster-full-decode | 27650 | 281ced0cdda8c054 |
| apps/web/public/atlas/topo/hillshade/10/263/402.webp | raster-full-decode | 28084 | 0da2a898f4dea49b |
| apps/web/public/atlas/topo/hillshade/10/263/403.webp | raster-full-decode | 29132 | 874c8f28c61b3f42 |
| apps/web/public/atlas/topo/hillshade/10/263/404.webp | raster-full-decode | 21838 | 4e1f42bb690ef4f8 |
| apps/web/public/atlas/topo/hillshade/10/264/400.webp | raster-full-decode | 21164 | 034cda7bdf4a62a5 |
| apps/web/public/atlas/topo/hillshade/10/264/401.webp | raster-full-decode | 30744 | a21a28c61b3984b0 |
| apps/web/public/atlas/topo/hillshade/10/264/402.webp | raster-full-decode | 27868 | 12018032d494a8bd |
| apps/web/public/atlas/topo/hillshade/10/264/403.webp | raster-full-decode | 24840 | a00ddf406b1eed87 |
| apps/web/public/atlas/topo/hillshade/10/264/404.webp | raster-full-decode | 30828 | dbf3ab24a745b570 |
| apps/web/public/atlas/topo/hillshade/10/265/400.webp | raster-full-decode | 23570 | 75e41d418fc56470 |
| apps/web/public/atlas/topo/hillshade/10/265/401.webp | raster-full-decode | 21622 | d2eb36376172270c |
| apps/web/public/atlas/topo/hillshade/10/265/402.webp | raster-full-decode | 22612 | 42e6ffd0696986d0 |
| apps/web/public/atlas/topo/hillshade/10/265/403.webp | raster-full-decode | 14822 | e3e2f3aa0e55c89e |
| apps/web/public/atlas/topo/hillshade/10/265/404.webp | raster-full-decode | 29248 | 05e349802e11cc7b |
| apps/web/public/atlas/topo/hillshade/10/266/400.webp | raster-full-decode | 26662 | e5d8d76c7c577464 |
| apps/web/public/atlas/topo/hillshade/10/266/401.webp | raster-full-decode | 20736 | 1081a2ff52033132 |
| apps/web/public/atlas/topo/hillshade/10/266/402.webp | raster-full-decode | 16290 | e91fca0557f635ce |
| apps/web/public/atlas/topo/hillshade/10/266/403.webp | raster-full-decode | 22074 | b85c1db8a0ea759b |
| apps/web/public/atlas/topo/hillshade/10/266/404.webp | raster-full-decode | 25292 | daf9f3e1116e4795 |
| apps/web/public/atlas/topo/hillshade/10/267/400.webp | raster-full-decode | 32248 | 5d19e3be3cad871f |
| apps/web/public/atlas/topo/hillshade/10/267/401.webp | raster-full-decode | 32240 | 5c7a1a5de3e78b11 |
| apps/web/public/atlas/topo/hillshade/10/267/402.webp | raster-full-decode | 28998 | b377074a7b3b026e |
| apps/web/public/atlas/topo/hillshade/10/267/403.webp | raster-full-decode | 15382 | e189939062a51d64 |
| apps/web/public/atlas/topo/hillshade/10/267/404.webp | raster-full-decode | 18156 | 53c59ca0a5c37a51 |
| apps/web/public/atlas/topo/hillshade/10/268/400.webp | raster-full-decode | 35284 | 06f9a82ac0b8b66e |
| apps/web/public/atlas/topo/hillshade/10/268/401.webp | raster-full-decode | 28990 | 9e0f80edfb050bc1 |
| apps/web/public/atlas/topo/hillshade/10/268/402.webp | raster-full-decode | 27512 | 241b0d90c8b12348 |
| apps/web/public/atlas/topo/hillshade/10/268/403.webp | raster-full-decode | 27168 | 69730327093efdd0 |
| apps/web/public/atlas/topo/hillshade/10/268/404.webp | raster-full-decode | 30758 | 1f7298fe60217ffb |
| apps/web/public/atlas/topo/hillshade/10/269/400.webp | raster-full-decode | 30994 | 90c52e4eed2367a0 |
| apps/web/public/atlas/topo/hillshade/10/269/401.webp | raster-full-decode | 30214 | e139915a8e705ac0 |
| apps/web/public/atlas/topo/hillshade/10/269/402.webp | raster-full-decode | 28548 | 130f32160f7c9c0d |
| apps/web/public/atlas/topo/hillshade/10/269/403.webp | raster-full-decode | 29128 | b55bcac3a9ab266a |
| apps/web/public/atlas/topo/hillshade/10/269/404.webp | raster-full-decode | 32478 | 9a4ff8be609ee49d |
| apps/web/public/atlas/topo/hillshade/10/270/400.webp | raster-full-decode | 32556 | 7c052f17c67c7798 |
| apps/web/public/atlas/topo/hillshade/10/270/401.webp | raster-full-decode | 28634 | 1e23373250e20f3c |
| apps/web/public/atlas/topo/hillshade/10/270/402.webp | raster-full-decode | 31264 | b753aba98c651db8 |
| apps/web/public/atlas/topo/hillshade/10/270/403.webp | raster-full-decode | 30222 | d2a0614a1c7eb307 |
| apps/web/public/atlas/topo/hillshade/10/270/404.webp | raster-full-decode | 28364 | 9ab8912a900eaed1 |
| apps/web/public/atlas/topo/hillshade/10/271/400.webp | raster-full-decode | 33834 | e97714107accaf58 |
| apps/web/public/atlas/topo/hillshade/10/271/401.webp | raster-full-decode | 35428 | 4faa14791f19ebc4 |
| apps/web/public/atlas/topo/hillshade/10/271/402.webp | raster-full-decode | 33244 | f36c2752d0c687f8 |
| apps/web/public/atlas/topo/hillshade/10/271/403.webp | raster-full-decode | 29640 | 021dcbbbde936794 |
| apps/web/public/atlas/topo/hillshade/10/271/404.webp | raster-full-decode | 30044 | 6f87b3dce5a43608 |
| apps/web/public/atlas/topo/hillshade/10/272/400.webp | raster-full-decode | 38268 | 72ed11dff562524f |
| apps/web/public/atlas/topo/hillshade/10/272/401.webp | raster-full-decode | 37454 | b12e13edfbd8ba9e |
| apps/web/public/atlas/topo/hillshade/10/272/402.webp | raster-full-decode | 29226 | 3bead4eb08c5e598 |
| apps/web/public/atlas/topo/hillshade/10/272/403.webp | raster-full-decode | 29660 | aa0aa277c231d19c |
| apps/web/public/atlas/topo/hillshade/10/272/404.webp | raster-full-decode | 31034 | 500db25ba8b58fb3 |
| apps/web/public/atlas/topo/hillshade/10/273/400.webp | raster-full-decode | 36488 | 6cad389156b416e0 |
| apps/web/public/atlas/topo/hillshade/10/273/401.webp | raster-full-decode | 33248 | b1cff28651a086d9 |
| apps/web/public/atlas/topo/hillshade/10/273/402.webp | raster-full-decode | 28798 | 1a7d4a0da3ff31bf |
| apps/web/public/atlas/topo/hillshade/10/273/403.webp | raster-full-decode | 31546 | 6c5b5592629b86b8 |
| apps/web/public/atlas/topo/hillshade/10/274/400.webp | raster-full-decode | 36268 | 8dca496d226c502b |
| apps/web/public/atlas/topo/hillshade/10/274/401.webp | raster-full-decode | 29158 | e380dbe46f412935 |
| apps/web/public/atlas/topo/hillshade/10/274/402.webp | raster-full-decode | 30468 | 5ac0ec95a459286d |
| apps/web/public/atlas/topo/hillshade/10/275/400.webp | raster-full-decode | 37070 | d6ec80e323da0945 |
| apps/web/public/atlas/topo/hillshade/10/275/401.webp | raster-full-decode | 28438 | 6380af48759cb7eb |
| apps/web/public/atlas/topo/hillshade/10/275/402.webp | raster-full-decode | 31520 | 0d4914dbaf7f2bef |
| apps/web/public/atlas/topo/hillshade/10/276/400.webp | raster-full-decode | 34928 | 4e329e98a9cbf45b |
| apps/web/public/atlas/topo/hillshade/10/276/401.webp | raster-full-decode | 27942 | f2c4169ce66dec44 |
| apps/web/public/atlas/topo/hillshade/10/277/400.webp | raster-full-decode | 31786 | 648e9b3ba5ea2338 |
| apps/web/public/atlas/topo/hillshade/10/277/401.webp | raster-full-decode | 30522 | 9382204c2b94423a |
| apps/web/public/atlas/topo/hillshade/10/278/400.webp | raster-full-decode | 32188 | e5487dea7859a81e |
| apps/web/public/atlas/topo/hillshade/11/511/808.webp | raster-full-decode | 8000 | 4ec7bc8af3ffe7e1 |
| apps/web/public/atlas/topo/hillshade/11/511/809.webp | raster-full-decode | 10166 | c2c422c1cba3e0d3 |
| apps/web/public/atlas/topo/hillshade/11/511/810.webp | raster-full-decode | 10802 | 54a607345955b52d |
| apps/web/public/atlas/topo/hillshade/11/512/806.webp | raster-full-decode | 5184 | 140f81d89d5a2d5c |
| apps/web/public/atlas/topo/hillshade/11/512/807.webp | raster-full-decode | 11668 | fdd8ee1ce78cf97b |
| apps/web/public/atlas/topo/hillshade/11/512/808.webp | raster-full-decode | 15604 | ab56f3a6c83b1820 |
| apps/web/public/atlas/topo/hillshade/11/512/809.webp | raster-full-decode | 12962 | 15c1d32129c7f1ee |
| apps/web/public/atlas/topo/hillshade/11/512/810.webp | raster-full-decode | 9032 | 606c4791ad8d5aec |
| apps/web/public/atlas/topo/hillshade/11/513/805.webp | raster-full-decode | 3232 | 0353605b48c7c884 |
| apps/web/public/atlas/topo/hillshade/11/513/806.webp | raster-full-decode | 8574 | 4d389676a053b153 |
| apps/web/public/atlas/topo/hillshade/11/513/807.webp | raster-full-decode | 16602 | e77768f7d8d262d8 |
| apps/web/public/atlas/topo/hillshade/11/513/808.webp | raster-full-decode | 14732 | a992382faa2d8f35 |
| apps/web/public/atlas/topo/hillshade/11/513/809.webp | raster-full-decode | 12050 | afd0eb478f2d3ae6 |
| apps/web/public/atlas/topo/hillshade/11/513/810.webp | raster-full-decode | 12768 | f313783a621713a7 |
| apps/web/public/atlas/topo/hillshade/11/514/802.webp | raster-full-decode | 1848 | 71ac588173c14f60 |
| apps/web/public/atlas/topo/hillshade/11/514/803.webp | raster-full-decode | 4722 | d68d2a6e6d892842 |
| apps/web/public/atlas/topo/hillshade/11/514/804.webp | raster-full-decode | 3074 | e818a47c41f8c6f1 |
| apps/web/public/atlas/topo/hillshade/11/514/805.webp | raster-full-decode | 15928 | 57aa121c184af825 |
| apps/web/public/atlas/topo/hillshade/11/514/806.webp | raster-full-decode | 14906 | 64821309a075b5d8 |
| apps/web/public/atlas/topo/hillshade/11/514/807.webp | raster-full-decode | 9314 | 1a9dfd0dc3941b98 |
| apps/web/public/atlas/topo/hillshade/11/514/808.webp | raster-full-decode | 11532 | 9b3de969f0c8bf07 |
| apps/web/public/atlas/topo/hillshade/11/514/809.webp | raster-full-decode | 11578 | 0179ef51e85c521e |
| apps/web/public/atlas/topo/hillshade/11/514/810.webp | raster-full-decode | 12562 | e3f2679f15accecd |
| apps/web/public/atlas/topo/hillshade/11/515/801.webp | raster-full-decode | 7406 | e1f8c46744bfbf18 |
| apps/web/public/atlas/topo/hillshade/11/515/802.webp | raster-full-decode | 12160 | 80933e2041f5d0ff |
| apps/web/public/atlas/topo/hillshade/11/515/803.webp | raster-full-decode | 15076 | 281050da24e028f0 |
| apps/web/public/atlas/topo/hillshade/11/515/804.webp | raster-full-decode | 10410 | 393d04e9b7f12870 |
| apps/web/public/atlas/topo/hillshade/11/515/805.webp | raster-full-decode | 13298 | b45ffed1a4d9b1c3 |
| apps/web/public/atlas/topo/hillshade/11/515/806.webp | raster-full-decode | 11588 | 0707972c81b58e9f |
| apps/web/public/atlas/topo/hillshade/11/515/807.webp | raster-full-decode | 7816 | bede6ae0754b5efc |
| apps/web/public/atlas/topo/hillshade/11/515/808.webp | raster-full-decode | 12086 | e6ad146481f4d064 |
| apps/web/public/atlas/topo/hillshade/11/515/809.webp | raster-full-decode | 14608 | 9bb58e943e2ed523 |
| apps/web/public/atlas/topo/hillshade/11/515/810.webp | raster-full-decode | 16472 | 5a15922c86384868 |
| apps/web/public/atlas/topo/hillshade/11/516/801.webp | raster-full-decode | 21898 | 98711aeed5f6453b |
| apps/web/public/atlas/topo/hillshade/11/516/802.webp | raster-full-decode | 9848 | 485d0b3a49ab6adb |
| apps/web/public/atlas/topo/hillshade/11/516/803.webp | raster-full-decode | 12836 | 529a7cda23d74659 |
| apps/web/public/atlas/topo/hillshade/11/516/804.webp | raster-full-decode | 9766 | 57b5629c888f4fbd |
| apps/web/public/atlas/topo/hillshade/11/516/805.webp | raster-full-decode | 11644 | da1d66a3e23d4177 |
| apps/web/public/atlas/topo/hillshade/11/516/806.webp | raster-full-decode | 10102 | c248e548cb20e24f |
| apps/web/public/atlas/topo/hillshade/11/516/807.webp | raster-full-decode | 10836 | 1928838d7d5db6b9 |
| apps/web/public/atlas/topo/hillshade/11/516/808.webp | raster-full-decode | 16094 | 4a2d142b432d46c1 |
| apps/web/public/atlas/topo/hillshade/11/516/809.webp | raster-full-decode | 18094 | 77e04935750176b8 |
| apps/web/public/atlas/topo/hillshade/11/516/810.webp | raster-full-decode | 17028 | 16d90fea746325d2 |
| apps/web/public/atlas/topo/hillshade/11/517/801.webp | raster-full-decode | 10196 | 2d35ae0775997fac |
| apps/web/public/atlas/topo/hillshade/11/517/802.webp | raster-full-decode | 8656 | e590d747366f5b61 |
| apps/web/public/atlas/topo/hillshade/11/517/803.webp | raster-full-decode | 13786 | 0a640099bcd52bc7 |
| apps/web/public/atlas/topo/hillshade/11/517/804.webp | raster-full-decode | 10756 | b5af218a18569958 |
| apps/web/public/atlas/topo/hillshade/11/517/805.webp | raster-full-decode | 11712 | bedd1c05af81d6f8 |
| apps/web/public/atlas/topo/hillshade/11/517/806.webp | raster-full-decode | 11418 | c3d497396dde2d0d |
| apps/web/public/atlas/topo/hillshade/11/517/807.webp | raster-full-decode | 14402 | a9bc0407e6a2752b |
| apps/web/public/atlas/topo/hillshade/11/517/808.webp | raster-full-decode | 13020 | fbd5614c15a5f098 |
| apps/web/public/atlas/topo/hillshade/11/517/809.webp | raster-full-decode | 19594 | bd37f7c890198609 |
| apps/web/public/atlas/topo/hillshade/11/517/810.webp | raster-full-decode | 23214 | c8ea492ec80a553b |
| apps/web/public/atlas/topo/hillshade/11/518/801.webp | raster-full-decode | 11994 | 275ea6a6948214c1 |
| apps/web/public/atlas/topo/hillshade/11/518/802.webp | raster-full-decode | 10756 | 40a324d7201b6ea3 |
| apps/web/public/atlas/topo/hillshade/11/518/803.webp | raster-full-decode | 13048 | 5830d7ffbd3963d7 |
| apps/web/public/atlas/topo/hillshade/11/518/804.webp | raster-full-decode | 16082 | ec1b0bdf52e243e1 |
| apps/web/public/atlas/topo/hillshade/11/518/805.webp | raster-full-decode | 12828 | c6e07ba59ab559f7 |
| apps/web/public/atlas/topo/hillshade/11/518/806.webp | raster-full-decode | 12222 | e981ee7fc2d8fbff |
| apps/web/public/atlas/topo/hillshade/11/518/807.webp | raster-full-decode | 18548 | 966a1f615f16167a |
| apps/web/public/atlas/topo/hillshade/11/518/808.webp | raster-full-decode | 23896 | 327d1fc449c29078 |
| apps/web/public/atlas/topo/hillshade/11/518/809.webp | raster-full-decode | 19466 | a865509583230e31 |
| apps/web/public/atlas/topo/hillshade/11/518/810.webp | raster-full-decode | 18948 | 7435200548fdde92 |
| apps/web/public/atlas/topo/hillshade/11/519/801.webp | raster-full-decode | 15622 | a4d24206b37033cd |
| apps/web/public/atlas/topo/hillshade/11/519/802.webp | raster-full-decode | 16164 | db680dca41563c1d |
| apps/web/public/atlas/topo/hillshade/11/519/803.webp | raster-full-decode | 14810 | 6c4841b4c0fa09b1 |
| apps/web/public/atlas/topo/hillshade/11/519/804.webp | raster-full-decode | 15200 | 2f0a1d6369fa0fad |
| apps/web/public/atlas/topo/hillshade/11/519/805.webp | raster-full-decode | 18040 | a23135364e2cd35c |
| apps/web/public/atlas/topo/hillshade/11/519/806.webp | raster-full-decode | 21172 | 4524d650d09dde13 |
| apps/web/public/atlas/topo/hillshade/11/519/807.webp | raster-full-decode | 15138 | 3a563c67425f4723 |
| apps/web/public/atlas/topo/hillshade/11/519/808.webp | raster-full-decode | 19016 | 9e7921d305836dc7 |
| apps/web/public/atlas/topo/hillshade/11/519/809.webp | raster-full-decode | 21130 | 4552f6968bbe745f |
| apps/web/public/atlas/topo/hillshade/11/519/810.webp | raster-full-decode | 22010 | ce73c0043da435c7 |
| apps/web/public/atlas/topo/hillshade/11/520/801.webp | raster-full-decode | 15824 | 99d6068eb4dd9ca9 |
| apps/web/public/atlas/topo/hillshade/11/520/802.webp | raster-full-decode | 16182 | 6f99c8692b05c951 |
| apps/web/public/atlas/topo/hillshade/11/520/803.webp | raster-full-decode | 16746 | 2b36641669f33cd1 |
| apps/web/public/atlas/topo/hillshade/11/520/804.webp | raster-full-decode | 20654 | b3d9440cb897ba2f |
| apps/web/public/atlas/topo/hillshade/11/520/805.webp | raster-full-decode | 22696 | 84c8130df60bdb2e |
| apps/web/public/atlas/topo/hillshade/11/520/806.webp | raster-full-decode | 19970 | d3a081a6ea5b7063 |
| apps/web/public/atlas/topo/hillshade/11/520/807.webp | raster-full-decode | 20932 | 303b1759ddfba504 |
| apps/web/public/atlas/topo/hillshade/11/520/808.webp | raster-full-decode | 22678 | 4ead3af7f6ae6e1c |
| apps/web/public/atlas/topo/hillshade/11/520/809.webp | raster-full-decode | 22740 | 2e0bc8c8745e8688 |
| apps/web/public/atlas/topo/hillshade/11/520/810.webp | raster-full-decode | 19580 | bf40feb1a0182bfa |
| apps/web/public/atlas/topo/hillshade/11/521/801.webp | raster-full-decode | 20446 | 7fd7d8790f1a3c8a |
| apps/web/public/atlas/topo/hillshade/11/521/802.webp | raster-full-decode | 21048 | a9479a7d746c9eb5 |
| apps/web/public/atlas/topo/hillshade/11/521/803.webp | raster-full-decode | 20302 | 44b8f771fad56488 |
| apps/web/public/atlas/topo/hillshade/11/521/804.webp | raster-full-decode | 19060 | 31090c19836e32ea |
| apps/web/public/atlas/topo/hillshade/11/521/805.webp | raster-full-decode | 20844 | a568813c60dc2c57 |
| apps/web/public/atlas/topo/hillshade/11/521/806.webp | raster-full-decode | 23260 | 58f3b41192acee77 |
| apps/web/public/atlas/topo/hillshade/11/521/807.webp | raster-full-decode | 23362 | 7bb0ba84c69aa202 |
| apps/web/public/atlas/topo/hillshade/11/521/808.webp | raster-full-decode | 18666 | 29793293bc57e6b3 |
| apps/web/public/atlas/topo/hillshade/11/521/809.webp | raster-full-decode | 16764 | d48e3a9c38381716 |
| apps/web/public/atlas/topo/hillshade/11/521/810.webp | raster-full-decode | 16838 | 8ad447c1d1be8ec2 |
| apps/web/public/atlas/topo/hillshade/11/522/801.webp | raster-full-decode | 18796 | f932214e1140e258 |
| apps/web/public/atlas/topo/hillshade/11/522/802.webp | raster-full-decode | 17468 | bebb62e15f782d88 |
| apps/web/public/atlas/topo/hillshade/11/522/803.webp | raster-full-decode | 19384 | 3d105bee42e77cad |
| apps/web/public/atlas/topo/hillshade/11/522/804.webp | raster-full-decode | 23818 | b1660f1fd1b3a1af |
| apps/web/public/atlas/topo/hillshade/11/522/805.webp | raster-full-decode | 25246 | 546e5613f7543b9d |
| apps/web/public/atlas/topo/hillshade/11/522/806.webp | raster-full-decode | 23396 | 50af107404c6a94d |
| apps/web/public/atlas/topo/hillshade/11/522/807.webp | raster-full-decode | 24384 | 60e77c95dc9cbd79 |
| apps/web/public/atlas/topo/hillshade/11/522/808.webp | raster-full-decode | 22018 | 1752197afe8b2eb1 |
| apps/web/public/atlas/topo/hillshade/11/522/809.webp | raster-full-decode | 22186 | 2100fe6945c1213d |
| apps/web/public/atlas/topo/hillshade/11/522/810.webp | raster-full-decode | 24834 | 14a5c4973e7b1922 |
| apps/web/public/atlas/topo/hillshade/11/523/800.webp | raster-full-decode | 22842 | 49c4554dcfbf3917 |
| apps/web/public/atlas/topo/hillshade/11/523/801.webp | raster-full-decode | 25052 | 66e83fb7ddad1069 |
| apps/web/public/atlas/topo/hillshade/11/523/802.webp | raster-full-decode | 23758 | 7b7e94852c0297db |
| apps/web/public/atlas/topo/hillshade/11/523/803.webp | raster-full-decode | 22498 | c35ba170d9f35ae8 |
| apps/web/public/atlas/topo/hillshade/11/523/804.webp | raster-full-decode | 18022 | e28d45fe64d0a3b7 |
| apps/web/public/atlas/topo/hillshade/11/523/805.webp | raster-full-decode | 27738 | 384fa8629f9a7a4f |
| apps/web/public/atlas/topo/hillshade/11/523/806.webp | raster-full-decode | 28978 | fd713ca27a332723 |
| apps/web/public/atlas/topo/hillshade/11/523/807.webp | raster-full-decode | 29126 | 81fc7cb708daba52 |
| apps/web/public/atlas/topo/hillshade/11/523/808.webp | raster-full-decode | 27954 | 9da295fb754056e1 |
| apps/web/public/atlas/topo/hillshade/11/523/809.webp | raster-full-decode | 29574 | 6a1314d13f5c4cd5 |
| apps/web/public/atlas/topo/hillshade/11/523/810.webp | raster-full-decode | 25658 | 64be5a4fbad703e3 |
| apps/web/public/atlas/topo/hillshade/11/524/800.webp | raster-full-decode | 26004 | 82a3feeb3c19db2d |
| apps/web/public/atlas/topo/hillshade/11/524/801.webp | raster-full-decode | 28892 | d7435984c4e3a92b |
| apps/web/public/atlas/topo/hillshade/11/524/802.webp | raster-full-decode | 30218 | d7db8d383da6fcb8 |
| apps/web/public/atlas/topo/hillshade/11/524/803.webp | raster-full-decode | 28832 | 186fb1a81fd3b340 |
| apps/web/public/atlas/topo/hillshade/11/524/804.webp | raster-full-decode | 25504 | b6b0c356d452769b |
| apps/web/public/atlas/topo/hillshade/11/524/805.webp | raster-full-decode | 29724 | 2869e7ce75866ce4 |
| apps/web/public/atlas/topo/hillshade/11/524/806.webp | raster-full-decode | 31622 | 9d49d4ddfc825a22 |
| apps/web/public/atlas/topo/hillshade/11/524/807.webp | raster-full-decode | 31650 | 2249ce5203b65e4e |
| apps/web/public/atlas/topo/hillshade/11/524/808.webp | raster-full-decode | 31148 | 3b0fecfbc956b144 |
| apps/web/public/atlas/topo/hillshade/11/524/809.webp | raster-full-decode | 30004 | efb9fa811780ff00 |
| apps/web/public/atlas/topo/hillshade/11/524/810.webp | raster-full-decode | 27218 | ea34eea99cfc1f55 |
| apps/web/public/atlas/topo/hillshade/11/525/800.webp | raster-full-decode | 23442 | 853b357c24afda4a |
| apps/web/public/atlas/topo/hillshade/11/525/801.webp | raster-full-decode | 26606 | 9a08603f9fce1ce9 |
| apps/web/public/atlas/topo/hillshade/11/525/802.webp | raster-full-decode | 28540 | ff42e212f301b9db |
| apps/web/public/atlas/topo/hillshade/11/525/803.webp | raster-full-decode | 26992 | 9c1cb214be15fb4f |
| apps/web/public/atlas/topo/hillshade/11/525/804.webp | raster-full-decode | 29204 | 505c5e778e005832 |
| apps/web/public/atlas/topo/hillshade/11/525/805.webp | raster-full-decode | 30176 | fd597f211f2595a8 |
| apps/web/public/atlas/topo/hillshade/11/525/806.webp | raster-full-decode | 31314 | ecdeb6b6b7625444 |
| apps/web/public/atlas/topo/hillshade/11/525/807.webp | raster-full-decode | 29302 | c196d00583424e09 |
| apps/web/public/atlas/topo/hillshade/11/525/808.webp | raster-full-decode | 28020 | f9590d0b8af69e6f |
| apps/web/public/atlas/topo/hillshade/11/525/809.webp | raster-full-decode | 30942 | 1f44340700020f95 |
| apps/web/public/atlas/topo/hillshade/11/525/810.webp | raster-full-decode | 30874 | f6c468fdeda9ded9 |
| apps/web/public/atlas/topo/hillshade/11/526/800.webp | raster-full-decode | 23574 | 1784e88293c8e5a0 |
| apps/web/public/atlas/topo/hillshade/11/526/801.webp | raster-full-decode | 27412 | 90c6dd1febb769cb |
| apps/web/public/atlas/topo/hillshade/11/526/802.webp | raster-full-decode | 27730 | 3e43718596a46ffe |
| apps/web/public/atlas/topo/hillshade/11/526/803.webp | raster-full-decode | 26712 | c4b9de28f59521bf |
| apps/web/public/atlas/topo/hillshade/11/526/804.webp | raster-full-decode | 29796 | 21db21e72abc5006 |
| apps/web/public/atlas/topo/hillshade/11/526/805.webp | raster-full-decode | 28936 | ca3ea40d3aec8039 |
| apps/web/public/atlas/topo/hillshade/11/526/806.webp | raster-full-decode | 29752 | e770599d58df00e0 |
| apps/web/public/atlas/topo/hillshade/11/526/807.webp | raster-full-decode | 29024 | 12631e0d76970097 |
| apps/web/public/atlas/topo/hillshade/11/526/808.webp | raster-full-decode | 23998 | af313b535f01c7d1 |
| apps/web/public/atlas/topo/hillshade/11/526/809.webp | raster-full-decode | 25436 | d969cf48ea338944 |
| apps/web/public/atlas/topo/hillshade/11/526/810.webp | raster-full-decode | 26836 | e9c3acb8e0c1b448 |
| apps/web/public/atlas/topo/hillshade/11/527/800.webp | raster-full-decode | 21364 | 69d3aa27d0815fff |
| apps/web/public/atlas/topo/hillshade/11/527/801.webp | raster-full-decode | 27818 | 88a812cb2582f416 |
| apps/web/public/atlas/topo/hillshade/11/527/802.webp | raster-full-decode | 29810 | 2684d2a892ef4ea7 |
| apps/web/public/atlas/topo/hillshade/11/527/803.webp | raster-full-decode | 28754 | 3d6b8fffe7ae06db |
| apps/web/public/atlas/topo/hillshade/11/527/804.webp | raster-full-decode | 26952 | 01c3aa98078e39c3 |
| apps/web/public/atlas/topo/hillshade/11/527/805.webp | raster-full-decode | 30338 | 4ac2f233c7604488 |
| apps/web/public/atlas/topo/hillshade/11/527/806.webp | raster-full-decode | 29756 | a1970dbb6d52b996 |
| apps/web/public/atlas/topo/hillshade/11/527/807.webp | raster-full-decode | 29510 | 84f2296b2213fab1 |
| apps/web/public/atlas/topo/hillshade/11/527/808.webp | raster-full-decode | 20880 | 1c1ab907aa59262a |
| apps/web/public/atlas/topo/hillshade/11/527/809.webp | raster-full-decode | 21380 | 51cc4f9990cb7169 |
| apps/web/public/atlas/topo/hillshade/11/527/810.webp | raster-full-decode | 26896 | b341dde8e2aa7da9 |
| apps/web/public/atlas/topo/hillshade/11/528/800.webp | raster-full-decode | 19882 | a9f19972556f125a |
| apps/web/public/atlas/topo/hillshade/11/528/801.webp | raster-full-decode | 24836 | 89730db081cdb8c9 |
| apps/web/public/atlas/topo/hillshade/11/528/802.webp | raster-full-decode | 29482 | 3c8880e78f0e3595 |
| apps/web/public/atlas/topo/hillshade/11/528/803.webp | raster-full-decode | 31280 | b63316a5eee91347 |
| apps/web/public/atlas/topo/hillshade/11/528/804.webp | raster-full-decode | 29140 | 77bfe8a2d8ca9688 |
| apps/web/public/atlas/topo/hillshade/11/528/805.webp | raster-full-decode | 32128 | c0a6fa55e132d5e9 |
| apps/web/public/atlas/topo/hillshade/11/528/806.webp | raster-full-decode | 28356 | bee388cf1a8705ec |
| apps/web/public/atlas/topo/hillshade/11/528/807.webp | raster-full-decode | 24284 | 7c6daef8fee5e69d |
| apps/web/public/atlas/topo/hillshade/11/528/808.webp | raster-full-decode | 32480 | 56179b1ee61909f3 |
| apps/web/public/atlas/topo/hillshade/11/528/809.webp | raster-full-decode | 28310 | 0842194f1359b3b9 |
| apps/web/public/atlas/topo/hillshade/11/528/810.webp | raster-full-decode | 30498 | e4d1242388df8a6a |
| apps/web/public/atlas/topo/hillshade/11/529/800.webp | raster-full-decode | 19058 | 5027bff9d68413ab |
| apps/web/public/atlas/topo/hillshade/11/529/801.webp | raster-full-decode | 24782 | 3ad265459214bb8f |
| apps/web/public/atlas/topo/hillshade/11/529/802.webp | raster-full-decode | 33040 | 4bd8521104e61f69 |
| apps/web/public/atlas/topo/hillshade/11/529/803.webp | raster-full-decode | 28840 | 00469c13f16dd9f6 |
| apps/web/public/atlas/topo/hillshade/11/529/804.webp | raster-full-decode | 26368 | 3edfa2ac82654bf7 |
| apps/web/public/atlas/topo/hillshade/11/529/805.webp | raster-full-decode | 25852 | e885cd1d7efc4e50 |
| apps/web/public/atlas/topo/hillshade/11/529/806.webp | raster-full-decode | 23322 | 28e426ffcc1a7dca |
| apps/web/public/atlas/topo/hillshade/11/529/807.webp | raster-full-decode | 23480 | b983c069f1905eea |
| apps/web/public/atlas/topo/hillshade/11/529/808.webp | raster-full-decode | 31174 | f8930bae682ca5a5 |
| apps/web/public/atlas/topo/hillshade/11/529/809.webp | raster-full-decode | 30972 | 17b2b76fc26fe9c3 |
| apps/web/public/atlas/topo/hillshade/11/529/810.webp | raster-full-decode | 27896 | b2ef65373f9ecfef |
| apps/web/public/atlas/topo/hillshade/11/530/800.webp | raster-full-decode | 18094 | be6920125b2c4225 |
| apps/web/public/atlas/topo/hillshade/11/530/801.webp | raster-full-decode | 30338 | 0abb99d2cb141ef9 |
| apps/web/public/atlas/topo/hillshade/11/530/802.webp | raster-full-decode | 26310 | c675b632649ac0b3 |
| apps/web/public/atlas/topo/hillshade/11/530/803.webp | raster-full-decode | 22646 | 461c47579a1ea0c1 |
| apps/web/public/atlas/topo/hillshade/11/530/804.webp | raster-full-decode | 26206 | 62a74c14925927be |
| apps/web/public/atlas/topo/hillshade/11/530/805.webp | raster-full-decode | 26054 | 69863873b8d6255d |
| apps/web/public/atlas/topo/hillshade/11/530/806.webp | raster-full-decode | 19686 | 6693c226e8636119 |
| apps/web/public/atlas/topo/hillshade/11/530/807.webp | raster-full-decode | 13072 | a97b1f9db0c01c80 |
| apps/web/public/atlas/topo/hillshade/11/530/808.webp | raster-full-decode | 26858 | cca25a8ee59afe11 |
| apps/web/public/atlas/topo/hillshade/11/530/809.webp | raster-full-decode | 32788 | f135fa09e3b76fe0 |
| apps/web/public/atlas/topo/hillshade/11/530/810.webp | raster-full-decode | 28844 | 5ca599a85f25a343 |
| apps/web/public/atlas/topo/hillshade/11/531/800.webp | raster-full-decode | 20278 | 2c085b3e67ea6f4e |
| apps/web/public/atlas/topo/hillshade/11/531/801.webp | raster-full-decode | 28180 | d1acfebad03131c2 |
| apps/web/public/atlas/topo/hillshade/11/531/802.webp | raster-full-decode | 19440 | 9ded9d3eb4c83f8b |
| apps/web/public/atlas/topo/hillshade/11/531/803.webp | raster-full-decode | 18230 | 36ca21b29f8ddc17 |
| apps/web/public/atlas/topo/hillshade/11/531/804.webp | raster-full-decode | 20096 | daf0decc83a44e6c |
| apps/web/public/atlas/topo/hillshade/11/531/805.webp | raster-full-decode | 18154 | 28811e9971d2d092 |
| apps/web/public/atlas/topo/hillshade/11/531/806.webp | raster-full-decode | 12136 | d56a22dd6d7b3734 |
| apps/web/public/atlas/topo/hillshade/11/531/807.webp | raster-full-decode | 13904 | 0ee059b3a036d8cb |
| apps/web/public/atlas/topo/hillshade/11/531/808.webp | raster-full-decode | 25340 | ceb187fc6c8a0630 |
| apps/web/public/atlas/topo/hillshade/11/531/809.webp | raster-full-decode | 30654 | 479ceb61c38274f8 |
| apps/web/public/atlas/topo/hillshade/11/531/810.webp | raster-full-decode | 23016 | c21eb069f70bba1b |
| apps/web/public/atlas/topo/hillshade/11/532/800.webp | raster-full-decode | 27468 | 85093c16a3c96dde |
| apps/web/public/atlas/topo/hillshade/11/532/801.webp | raster-full-decode | 21772 | 968e120c666adb49 |
| apps/web/public/atlas/topo/hillshade/11/532/802.webp | raster-full-decode | 18898 | 7aa83f481442c46d |
| apps/web/public/atlas/topo/hillshade/11/532/803.webp | raster-full-decode | 18302 | c8ecb6145daf8e56 |
| apps/web/public/atlas/topo/hillshade/11/532/804.webp | raster-full-decode | 15172 | bebff17ce1ab04c4 |
| apps/web/public/atlas/topo/hillshade/11/532/805.webp | raster-full-decode | 7376 | 45bb74c8092e6cc8 |
| apps/web/public/atlas/topo/hillshade/11/532/806.webp | raster-full-decode | 13046 | 689b73eb0f49589b |
| apps/web/public/atlas/topo/hillshade/11/532/807.webp | raster-full-decode | 18704 | ec5a3dee25e4e9fb |
| apps/web/public/atlas/topo/hillshade/11/532/808.webp | raster-full-decode | 27198 | b3a0b5927cb9197f |
| apps/web/public/atlas/topo/hillshade/11/532/809.webp | raster-full-decode | 31710 | acbdb9223ff57854 |
| apps/web/public/atlas/topo/hillshade/11/532/810.webp | raster-full-decode | 23614 | 9cab42756896cfde |
| apps/web/public/atlas/topo/hillshade/11/533/800.webp | raster-full-decode | 31792 | d9707448c98cdf4b |
| apps/web/public/atlas/topo/hillshade/11/533/801.webp | raster-full-decode | 26476 | d0462c4e4be837c1 |
| apps/web/public/atlas/topo/hillshade/11/533/802.webp | raster-full-decode | 18684 | e174a86ea09f7f59 |
| apps/web/public/atlas/topo/hillshade/11/533/803.webp | raster-full-decode | 25536 | bf92b95fc4e86b8a |
| apps/web/public/atlas/topo/hillshade/11/533/804.webp | raster-full-decode | 23408 | a28455727ca7fb34 |
| apps/web/public/atlas/topo/hillshade/11/533/805.webp | raster-full-decode | 18942 | cd03a5f240168a5d |
| apps/web/public/atlas/topo/hillshade/11/533/806.webp | raster-full-decode | 29690 | dc22090b044187d7 |
| apps/web/public/atlas/topo/hillshade/11/533/807.webp | raster-full-decode | 27478 | 4f2b69293e5ca6b6 |
| apps/web/public/atlas/topo/hillshade/11/533/808.webp | raster-full-decode | 19346 | a4f7230e49b90959 |
| apps/web/public/atlas/topo/hillshade/11/533/809.webp | raster-full-decode | 23958 | 4a6fe38cc04f85ac |
| apps/web/public/atlas/topo/hillshade/11/533/810.webp | raster-full-decode | 19778 | b1b9804b61bb95a7 |
| apps/web/public/atlas/topo/hillshade/11/534/800.webp | raster-full-decode | 29162 | 000f531a08c37364 |
| apps/web/public/atlas/topo/hillshade/11/534/801.webp | raster-full-decode | 31366 | 20b3b162529230e3 |
| apps/web/public/atlas/topo/hillshade/11/534/802.webp | raster-full-decode | 27980 | f16df2383782dcd7 |
| apps/web/public/atlas/topo/hillshade/11/534/803.webp | raster-full-decode | 28684 | 717243b50fd0cca7 |
| apps/web/public/atlas/topo/hillshade/11/534/804.webp | raster-full-decode | 34312 | d3ccfeb8dd08dddd |
| apps/web/public/atlas/topo/hillshade/11/534/805.webp | raster-full-decode | 31440 | adf63de87bf527cc |
| apps/web/public/atlas/topo/hillshade/11/534/806.webp | raster-full-decode | 17678 | 78906d42368fd02a |
| apps/web/public/atlas/topo/hillshade/11/534/807.webp | raster-full-decode | 10716 | 727d1c95cc74f19d |
| apps/web/public/atlas/topo/hillshade/11/534/808.webp | raster-full-decode | 13662 | 333507d382460603 |
| apps/web/public/atlas/topo/hillshade/11/534/809.webp | raster-full-decode | 14970 | 271d74d3969f1b27 |
| apps/web/public/atlas/topo/hillshade/11/534/810.webp | raster-full-decode | 26176 | 1ba6c22b72ae6b19 |
| apps/web/public/atlas/topo/hillshade/11/535/800.webp | raster-full-decode | 30316 | 179d2f06707a264b |
| apps/web/public/atlas/topo/hillshade/11/535/801.webp | raster-full-decode | 37034 | c15879b0729d7d72 |
| apps/web/public/atlas/topo/hillshade/11/535/802.webp | raster-full-decode | 31542 | 5d3e050b9d5a8293 |
| apps/web/public/atlas/topo/hillshade/11/535/803.webp | raster-full-decode | 32920 | 1233a5e4570f1f95 |
| apps/web/public/atlas/topo/hillshade/11/535/804.webp | raster-full-decode | 29250 | 6ea30881a716c849 |
| apps/web/public/atlas/topo/hillshade/11/535/805.webp | raster-full-decode | 21196 | 0023833833c3d3b2 |
| apps/web/public/atlas/topo/hillshade/11/535/806.webp | raster-full-decode | 18794 | 8b2d35bcb239db1e |
| apps/web/public/atlas/topo/hillshade/11/535/807.webp | raster-full-decode | 18502 | 3ce03072d697e9fe |
| apps/web/public/atlas/topo/hillshade/11/535/808.webp | raster-full-decode | 23202 | 6a2cf7c4db2e9473 |
| apps/web/public/atlas/topo/hillshade/11/535/809.webp | raster-full-decode | 21974 | 07e6960680e4745f |
| apps/web/public/atlas/topo/hillshade/11/535/810.webp | raster-full-decode | 31164 | 71be3a3df64c9fef |
| apps/web/public/atlas/topo/hillshade/11/536/800.webp | raster-full-decode | 33824 | 71a50b9ba23aafdc |
| apps/web/public/atlas/topo/hillshade/11/536/801.webp | raster-full-decode | 34892 | 4bd130f8e47fc30a |
| apps/web/public/atlas/topo/hillshade/11/536/802.webp | raster-full-decode | 35044 | d84a50b9c18f13c6 |
| apps/web/public/atlas/topo/hillshade/11/536/803.webp | raster-full-decode | 31828 | 5443ae62358d3a88 |
| apps/web/public/atlas/topo/hillshade/11/536/804.webp | raster-full-decode | 31384 | b29f2d1319769821 |
| apps/web/public/atlas/topo/hillshade/11/536/805.webp | raster-full-decode | 26472 | f48f5dbfdd452f86 |
| apps/web/public/atlas/topo/hillshade/11/536/806.webp | raster-full-decode | 25798 | c92e2fd68c9b7c13 |
| apps/web/public/atlas/topo/hillshade/11/536/807.webp | raster-full-decode | 28426 | 45b384737ab0d02b |
| apps/web/public/atlas/topo/hillshade/11/536/808.webp | raster-full-decode | 26548 | ef61a28bf3fe88a7 |
| apps/web/public/atlas/topo/hillshade/11/536/809.webp | raster-full-decode | 30588 | 2f957cd2bb56cb6a |
| apps/web/public/atlas/topo/hillshade/11/536/810.webp | raster-full-decode | 27378 | c204e705c2ea4810 |
| apps/web/public/atlas/topo/hillshade/11/537/800.webp | raster-full-decode | 35368 | df6727059c854909 |
| apps/web/public/atlas/topo/hillshade/11/537/801.webp | raster-full-decode | 34036 | abfe67a0f299b615 |
| apps/web/public/atlas/topo/hillshade/11/537/802.webp | raster-full-decode | 24884 | cace01e7ade1c297 |
| apps/web/public/atlas/topo/hillshade/11/537/803.webp | raster-full-decode | 24676 | 3fef826067dad101 |
| apps/web/public/atlas/topo/hillshade/11/537/804.webp | raster-full-decode | 25366 | 02730ad7b98b8131 |
| apps/web/public/atlas/topo/hillshade/11/537/805.webp | raster-full-decode | 27776 | c737a623d4de0965 |
| apps/web/public/atlas/topo/hillshade/11/537/806.webp | raster-full-decode | 26476 | 48b678cb58ce6993 |
| apps/web/public/atlas/topo/hillshade/11/537/807.webp | raster-full-decode | 24734 | e2cc3d8545f6f382 |
| apps/web/public/atlas/topo/hillshade/11/537/808.webp | raster-full-decode | 30438 | 70f5d69418c37657 |
| apps/web/public/atlas/topo/hillshade/11/537/809.webp | raster-full-decode | 28162 | 9d0f77d72bac6a0d |
| apps/web/public/atlas/topo/hillshade/11/537/810.webp | raster-full-decode | 25366 | 9dd66a9928c93ee4 |
| apps/web/public/atlas/topo/hillshade/11/538/800.webp | raster-full-decode | 30574 | fe79da8261fd2360 |
| apps/web/public/atlas/topo/hillshade/11/538/801.webp | raster-full-decode | 28904 | f31ad0f834f2fc77 |
| apps/web/public/atlas/topo/hillshade/11/538/802.webp | raster-full-decode | 26954 | a556df86e50e459f |
| apps/web/public/atlas/topo/hillshade/11/538/803.webp | raster-full-decode | 30178 | 782ad7071c7a83f3 |
| apps/web/public/atlas/topo/hillshade/11/538/804.webp | raster-full-decode | 28454 | e1a620d4d6f5674e |
| apps/web/public/atlas/topo/hillshade/11/538/805.webp | raster-full-decode | 28492 | ac47a1bf51ede365 |
| apps/web/public/atlas/topo/hillshade/11/538/806.webp | raster-full-decode | 27298 | 9220b6f8db31968e |
| apps/web/public/atlas/topo/hillshade/11/538/807.webp | raster-full-decode | 31534 | 613a6f64c1f2fec3 |
| apps/web/public/atlas/topo/hillshade/11/538/808.webp | raster-full-decode | 28220 | d51df06f7b3efc03 |
| apps/web/public/atlas/topo/hillshade/11/538/809.webp | raster-full-decode | 29334 | f8e7c400baaa9426 |
| apps/web/public/atlas/topo/hillshade/11/538/810.webp | raster-full-decode | 29372 | 14475c96fd2dd9d4 |
| apps/web/public/atlas/topo/hillshade/11/539/800.webp | raster-full-decode | 30644 | 82508b928e5d4de7 |
| apps/web/public/atlas/topo/hillshade/11/539/801.webp | raster-full-decode | 32382 | d9b8199ed233e0d5 |
| apps/web/public/atlas/topo/hillshade/11/539/802.webp | raster-full-decode | 33634 | 501e319a12a1e57f |
| apps/web/public/atlas/topo/hillshade/11/539/803.webp | raster-full-decode | 26244 | 65e6687418f501c1 |
| apps/web/public/atlas/topo/hillshade/11/539/804.webp | raster-full-decode | 28844 | b19ccac271565b92 |
| apps/web/public/atlas/topo/hillshade/11/539/805.webp | raster-full-decode | 28292 | c76f3f8dc6947e4b |
| apps/web/public/atlas/topo/hillshade/11/539/806.webp | raster-full-decode | 29508 | 124e261c2e362a08 |
| apps/web/public/atlas/topo/hillshade/11/539/807.webp | raster-full-decode | 26918 | bbe57168d818d149 |
| apps/web/public/atlas/topo/hillshade/11/539/808.webp | raster-full-decode | 33684 | 1cc7a2f55d2be737 |
| apps/web/public/atlas/topo/hillshade/11/539/809.webp | raster-full-decode | 29138 | 611b3335629928ca |
| apps/web/public/atlas/topo/hillshade/11/539/810.webp | raster-full-decode | 24170 | e03f2e924b10035d |
| apps/web/public/atlas/topo/hillshade/11/540/800.webp | raster-full-decode | 31562 | ed4fcc1cc3defc86 |
| apps/web/public/atlas/topo/hillshade/11/540/801.webp | raster-full-decode | 30296 | 5ceca5f3b63de84c |
| apps/web/public/atlas/topo/hillshade/11/540/802.webp | raster-full-decode | 25540 | 87121daac109f293 |
| apps/web/public/atlas/topo/hillshade/11/540/803.webp | raster-full-decode | 28714 | ab2511b24aabb292 |
| apps/web/public/atlas/topo/hillshade/11/540/804.webp | raster-full-decode | 25630 | 3c697eafa0622dde |
| apps/web/public/atlas/topo/hillshade/11/540/805.webp | raster-full-decode | 28376 | 10eb4fc8d1855a10 |
| apps/web/public/atlas/topo/hillshade/11/540/806.webp | raster-full-decode | 29900 | 4738a58bbab8aba3 |
| apps/web/public/atlas/topo/hillshade/11/540/807.webp | raster-full-decode | 30918 | b7aeded48b51bd12 |
| apps/web/public/atlas/topo/hillshade/11/540/808.webp | raster-full-decode | 25766 | 23996d4360702f0d |
| apps/web/public/atlas/topo/hillshade/11/540/809.webp | raster-full-decode | 28270 | 9e70dab164a87678 |
| apps/web/public/atlas/topo/hillshade/11/540/810.webp | raster-full-decode | 27210 | 496a383082eeda59 |
| apps/web/public/atlas/topo/hillshade/11/541/800.webp | raster-full-decode | 33888 | cce8bcbb8a1b4085 |
| apps/web/public/atlas/topo/hillshade/11/541/801.webp | raster-full-decode | 30962 | 7c1806fa5dd4f499 |
| apps/web/public/atlas/topo/hillshade/11/541/802.webp | raster-full-decode | 28118 | 941a4cc80ec8fdad |
| apps/web/public/atlas/topo/hillshade/11/541/803.webp | raster-full-decode | 31468 | c5d0211864903ffa |
| apps/web/public/atlas/topo/hillshade/11/541/804.webp | raster-full-decode | 32444 | 0d8b82f5b7a72399 |
| apps/web/public/atlas/topo/hillshade/11/541/805.webp | raster-full-decode | 34052 | c9a0ffd91e1ba7a3 |
| apps/web/public/atlas/topo/hillshade/11/541/806.webp | raster-full-decode | 28614 | 5e0bc5ea2e507625 |
| apps/web/public/atlas/topo/hillshade/11/541/807.webp | raster-full-decode | 26458 | b5eac2f18a7cd2f4 |
| apps/web/public/atlas/topo/hillshade/11/541/808.webp | raster-full-decode | 30056 | 9cb983163bec3bf7 |
| apps/web/public/atlas/topo/hillshade/11/541/809.webp | raster-full-decode | 28160 | fb2bcc056485f6c7 |
| apps/web/public/atlas/topo/hillshade/11/541/810.webp | raster-full-decode | 25834 | 8ed8808103cc3740 |
| apps/web/public/atlas/topo/hillshade/11/542/800.webp | raster-full-decode | 33540 | 6af5010716597738 |
| apps/web/public/atlas/topo/hillshade/11/542/801.webp | raster-full-decode | 32664 | e8c5383363271c14 |
| apps/web/public/atlas/topo/hillshade/11/542/802.webp | raster-full-decode | 32120 | 87eb27b069b437aa |
| apps/web/public/atlas/topo/hillshade/11/542/803.webp | raster-full-decode | 34032 | a4a76d1495014d5c |
| apps/web/public/atlas/topo/hillshade/11/542/804.webp | raster-full-decode | 35606 | ba78d9f513744669 |
| apps/web/public/atlas/topo/hillshade/11/542/805.webp | raster-full-decode | 29552 | acf56d178227deea |
| apps/web/public/atlas/topo/hillshade/11/542/806.webp | raster-full-decode | 29390 | b9344583f003117b |
| apps/web/public/atlas/topo/hillshade/11/542/807.webp | raster-full-decode | 29934 | 9329cc30a4308e86 |
| apps/web/public/atlas/topo/hillshade/11/542/808.webp | raster-full-decode | 29410 | 10bc923868e46cf1 |
| apps/web/public/atlas/topo/hillshade/11/542/809.webp | raster-full-decode | 25032 | c8cd3c8791acc8ab |
| apps/web/public/atlas/topo/hillshade/11/542/810.webp | raster-full-decode | 30114 | 6b95f13cdfe0cb41 |
| apps/web/public/atlas/topo/hillshade/11/543/800.webp | raster-full-decode | 31948 | 990d99c37cf7f6cf |
| apps/web/public/atlas/topo/hillshade/11/543/801.webp | raster-full-decode | 34104 | 1fa5b52cfc0e66a0 |
| apps/web/public/atlas/topo/hillshade/11/543/802.webp | raster-full-decode | 36396 | 2dcd303b8e6c6981 |
| apps/web/public/atlas/topo/hillshade/11/543/803.webp | raster-full-decode | 34742 | fbe14bd4e206ca78 |
| apps/web/public/atlas/topo/hillshade/11/543/804.webp | raster-full-decode | 34268 | 17aa49b4c318efce |
| apps/web/public/atlas/topo/hillshade/11/543/805.webp | raster-full-decode | 30456 | 9ef1738dfdd7609d |
| apps/web/public/atlas/topo/hillshade/11/543/806.webp | raster-full-decode | 29144 | f6954c4d5b1f19c6 |
| apps/web/public/atlas/topo/hillshade/11/543/807.webp | raster-full-decode | 28626 | 566ccc6c28dabbd9 |
| apps/web/public/atlas/topo/hillshade/11/543/808.webp | raster-full-decode | 30200 | accc23e9ef5f7bec |
| apps/web/public/atlas/topo/hillshade/11/543/809.webp | raster-full-decode | 34488 | 5de1c0165e060653 |
| apps/web/public/atlas/topo/hillshade/11/543/810.webp | raster-full-decode | 35864 | 6a0fe7e4cba5590f |
| apps/web/public/atlas/topo/hillshade/11/544/800.webp | raster-full-decode | 34272 | f8346fe556eba2f0 |
| apps/web/public/atlas/topo/hillshade/11/544/801.webp | raster-full-decode | 35476 | d177bf9935dc0878 |
| apps/web/public/atlas/topo/hillshade/11/544/802.webp | raster-full-decode | 34776 | e17e061b72f36cdf |
| apps/web/public/atlas/topo/hillshade/11/544/803.webp | raster-full-decode | 37158 | fa88655a88ad1b3d |
| apps/web/public/atlas/topo/hillshade/11/544/804.webp | raster-full-decode | 31096 | a1a807c22042f5c9 |
| apps/web/public/atlas/topo/hillshade/11/544/805.webp | raster-full-decode | 29040 | 08270d48fcb896b8 |
| apps/web/public/atlas/topo/hillshade/11/544/806.webp | raster-full-decode | 28274 | e78a5be64d226508 |
| apps/web/public/atlas/topo/hillshade/11/544/807.webp | raster-full-decode | 29164 | 90b10e9f2411490c |
| apps/web/public/atlas/topo/hillshade/11/544/808.webp | raster-full-decode | 32190 | a17f2f227b36a8ce |
| apps/web/public/atlas/topo/hillshade/11/544/809.webp | raster-full-decode | 31582 | bb8283bac94e483c |
| apps/web/public/atlas/topo/hillshade/11/545/800.webp | raster-full-decode | 36286 | 3514ab4c1d2cd15a |
| apps/web/public/atlas/topo/hillshade/11/545/801.webp | raster-full-decode | 36250 | 69a0655d6385e853 |
| apps/web/public/atlas/topo/hillshade/11/545/802.webp | raster-full-decode | 34886 | 750583737ee9396b |
| apps/web/public/atlas/topo/hillshade/11/545/803.webp | raster-full-decode | 33296 | e735b1c1a1435e7b |
| apps/web/public/atlas/topo/hillshade/11/545/804.webp | raster-full-decode | 28900 | 0e4674fe789bb902 |
| apps/web/public/atlas/topo/hillshade/11/545/805.webp | raster-full-decode | 26696 | b0c04a93849d39fb |
| apps/web/public/atlas/topo/hillshade/11/545/806.webp | raster-full-decode | 27954 | fd39b7aa32a203b6 |
| apps/web/public/atlas/topo/hillshade/11/545/807.webp | raster-full-decode | 31420 | a5a743e99eb541d9 |
| apps/web/public/atlas/topo/hillshade/11/545/808.webp | raster-full-decode | 32924 | 1df1787f25546e9d |
| apps/web/public/atlas/topo/hillshade/11/546/800.webp | raster-full-decode | 35244 | 39df733bb8945e88 |
| apps/web/public/atlas/topo/hillshade/11/546/801.webp | raster-full-decode | 32588 | ca740e2a3bb9bea9 |
| apps/web/public/atlas/topo/hillshade/11/546/802.webp | raster-full-decode | 32052 | 35a16711ed595fb6 |
| apps/web/public/atlas/topo/hillshade/11/546/803.webp | raster-full-decode | 31674 | 6c77d1948cac1e12 |
| apps/web/public/atlas/topo/hillshade/11/546/804.webp | raster-full-decode | 30448 | 5c2e2af2649124c8 |
| apps/web/public/atlas/topo/hillshade/11/546/805.webp | raster-full-decode | 26396 | 883432a88939b50b |
| apps/web/public/atlas/topo/hillshade/11/546/806.webp | raster-full-decode | 30212 | 2fb0462676f99e6b |
| apps/web/public/atlas/topo/hillshade/11/546/807.webp | raster-full-decode | 35530 | dadb21b984c6cb88 |
| apps/web/public/atlas/topo/hillshade/11/547/800.webp | raster-full-decode | 35434 | 85a76100a058e767 |
| apps/web/public/atlas/topo/hillshade/11/547/801.webp | raster-full-decode | 34084 | fbceec218559462a |
| apps/web/public/atlas/topo/hillshade/11/547/802.webp | raster-full-decode | 34596 | af43631e48dfac4b |
| apps/web/public/atlas/topo/hillshade/11/547/803.webp | raster-full-decode | 31126 | 1a52c4da3f0fd091 |
| apps/web/public/atlas/topo/hillshade/11/547/804.webp | raster-full-decode | 28912 | 0ab9564123bd21bf |
| apps/web/public/atlas/topo/hillshade/11/547/805.webp | raster-full-decode | 30048 | 73bb538ab8db215f |
| apps/web/public/atlas/topo/hillshade/11/547/806.webp | raster-full-decode | 35804 | 82f24078705050ab |
| apps/web/public/atlas/topo/hillshade/11/548/800.webp | raster-full-decode | 34498 | 7c00ca0fcd5fb661 |
| apps/web/public/atlas/topo/hillshade/11/548/801.webp | raster-full-decode | 33938 | 18aa80dfb9db5ff3 |
| apps/web/public/atlas/topo/hillshade/11/548/802.webp | raster-full-decode | 32244 | 4a41b117bcc825d2 |
| apps/web/public/atlas/topo/hillshade/11/548/803.webp | raster-full-decode | 26018 | 1311c4db90fd5cfb |
| apps/web/public/atlas/topo/hillshade/11/548/804.webp | raster-full-decode | 29868 | 5215b0d344e3b651 |
| apps/web/public/atlas/topo/hillshade/11/548/805.webp | raster-full-decode | 32456 | d0e0120a8121a130 |
| apps/web/public/atlas/topo/hillshade/11/548/806.webp | raster-full-decode | 33378 | 0e288d238502b249 |
| apps/web/public/atlas/topo/hillshade/11/549/800.webp | raster-full-decode | 34394 | 59aaa0d98f4adbe0 |
| apps/web/public/atlas/topo/hillshade/11/549/801.webp | raster-full-decode | 34380 | 8f5ab58b7fa269f4 |
| apps/web/public/atlas/topo/hillshade/11/549/802.webp | raster-full-decode | 27566 | 902473a363c15864 |
| apps/web/public/atlas/topo/hillshade/11/549/803.webp | raster-full-decode | 28528 | 9851968311d3d7de |
| apps/web/public/atlas/topo/hillshade/11/549/804.webp | raster-full-decode | 26612 | 5d4f6d79062839f2 |
| apps/web/public/atlas/topo/hillshade/11/549/805.webp | raster-full-decode | 33278 | dc76139bffd9aa9f |
| apps/web/public/atlas/topo/hillshade/11/549/806.webp | raster-full-decode | 34710 | f3fe694c5622db0a |
| apps/web/public/atlas/topo/hillshade/11/550/800.webp | raster-full-decode | 36498 | fcbc1674207b9cf4 |
| apps/web/public/atlas/topo/hillshade/11/550/801.webp | raster-full-decode | 34234 | bfcb42467546de26 |
| apps/web/public/atlas/topo/hillshade/11/550/802.webp | raster-full-decode | 27672 | 5b2c0981c1b27704 |
| apps/web/public/atlas/topo/hillshade/11/550/803.webp | raster-full-decode | 28148 | 4bb9adec822fa1f4 |
| apps/web/public/atlas/topo/hillshade/11/550/804.webp | raster-full-decode | 27690 | d835d50d219da169 |
| apps/web/public/atlas/topo/hillshade/11/550/805.webp | raster-full-decode | 30754 | 8074e197d622f595 |
| apps/web/public/atlas/topo/hillshade/11/551/800.webp | raster-full-decode | 36662 | 10bb4f749ab1a848 |
| apps/web/public/atlas/topo/hillshade/11/551/801.webp | raster-full-decode | 35136 | f075cee7ddd21fe8 |
| apps/web/public/atlas/topo/hillshade/11/551/802.webp | raster-full-decode | 29130 | d974af1d92bb3d48 |
| apps/web/public/atlas/topo/hillshade/11/551/803.webp | raster-full-decode | 29460 | d9ba4e0433655b7e |
| apps/web/public/atlas/topo/hillshade/11/551/804.webp | raster-full-decode | 32098 | 5e36cba69a1b10c9 |
| apps/web/public/atlas/topo/hillshade/11/551/805.webp | raster-full-decode | 34344 | dc8a30b679cc1af5 |
| apps/web/public/atlas/topo/hillshade/11/552/800.webp | raster-full-decode | 36542 | 50d36d37f5a6b43e |
| apps/web/public/atlas/topo/hillshade/11/552/801.webp | raster-full-decode | 34246 | 31fcab7ec4b88523 |
| apps/web/public/atlas/topo/hillshade/11/552/802.webp | raster-full-decode | 27996 | 09f37b82438c537e |
| apps/web/public/atlas/topo/hillshade/11/552/803.webp | raster-full-decode | 28580 | 02b6504d2e99561c |
| apps/web/public/atlas/topo/hillshade/11/552/804.webp | raster-full-decode | 32620 | 0d144804ee37f4aa |
| apps/web/public/atlas/topo/hillshade/11/553/800.webp | raster-full-decode | 33420 | 394ac1d5ea9571a3 |
| apps/web/public/atlas/topo/hillshade/11/553/801.webp | raster-full-decode | 32966 | e8a61a71b03df874 |
| apps/web/public/atlas/topo/hillshade/11/553/802.webp | raster-full-decode | 30886 | 91c7521cda2863ba |
| apps/web/public/atlas/topo/hillshade/11/553/803.webp | raster-full-decode | 24820 | 17a83329d58b2205 |
| apps/web/public/atlas/topo/hillshade/11/554/800.webp | raster-full-decode | 30888 | 6d42f7b711ae8a6d |
| apps/web/public/atlas/topo/hillshade/11/554/801.webp | raster-full-decode | 31200 | a0449b7e19da61de |
| apps/web/public/atlas/topo/hillshade/11/554/802.webp | raster-full-decode | 27974 | cf9d8bf42a755aa5 |
| apps/web/public/atlas/topo/hillshade/11/554/803.webp | raster-full-decode | 35878 | 3e4627e2353c450e |
| apps/web/public/atlas/topo/hillshade/11/555/800.webp | raster-full-decode | 33748 | ec5f6a52bf8eca43 |
| apps/web/public/atlas/topo/hillshade/11/555/801.webp | raster-full-decode | 30366 | 942dbaa02560a1c1 |
| apps/web/public/atlas/topo/hillshade/11/555/802.webp | raster-full-decode | 29544 | 29feb297aa94d6ee |
| apps/web/public/atlas/topo/hillshade/11/556/800.webp | raster-full-decode | 31394 | 4f8b67d5c145a17a |
| apps/web/public/atlas/topo/hillshade/11/556/801.webp | raster-full-decode | 30832 | 41f885fec08c98e5 |
| apps/web/public/atlas/topo/hillshade/11/556/802.webp | raster-full-decode | 33096 | d1445971c09913ea |
| apps/web/public/atlas/topo/hillshade/11/557/800.webp | raster-full-decode | 29258 | be2ea1bc9cf1b97c |
| apps/web/public/atlas/topo/hillshade/11/557/801.webp | raster-full-decode | 34496 | c7fed23b8e812dd4 |
| apps/web/public/atlas/topo/hillshade/11/557/802.webp | raster-full-decode | 34336 | 61a662898aaa61c6 |
| apps/web/public/atlas/topo/hillshade/11/558/800.webp | raster-full-decode | 35854 | c331196855716a44 |
| apps/web/public/atlas/topo/hillshade/11/558/801.webp | raster-full-decode | 31244 | eb7033c65329976c |
| apps/web/public/atlas/topo/hillshade/8/65/100.webp | raster-full-decode | 17390 | 7b0c9c856c669044 |
| apps/web/public/atlas/topo/hillshade/8/66/100.webp | raster-full-decode | 18470 | 384acdb4e855dc05 |
| apps/web/public/atlas/topo/hillshade/8/67/100.webp | raster-full-decode | 28008 | 3c0fa712010623c5 |
| apps/web/public/atlas/topo/hillshade/8/68/100.webp | raster-full-decode | 29286 | f44994a5da6051cd |
| apps/web/public/atlas/topo/hillshade/9/129/201.webp | raster-full-decode | 10806 | 93bb50f762609f2a |
| apps/web/public/atlas/topo/hillshade/9/130/200.webp | raster-full-decode | 15250 | b3eb408f21e9c1a9 |
| apps/web/public/atlas/topo/hillshade/9/130/201.webp | raster-full-decode | 19794 | d0d2289e632002c6 |
| apps/web/public/atlas/topo/hillshade/9/131/200.webp | raster-full-decode | 23376 | 570e50d67213a46f |
| apps/web/public/atlas/topo/hillshade/9/131/201.webp | raster-full-decode | 26264 | 1e28e45ecc350318 |
| apps/web/public/atlas/topo/hillshade/9/132/200.webp | raster-full-decode | 21840 | 006e2ba2b1d15ca1 |
| apps/web/public/atlas/topo/hillshade/9/132/201.webp | raster-full-decode | 19810 | d4c54668acff7246 |
| apps/web/public/atlas/topo/hillshade/9/133/200.webp | raster-full-decode | 26378 | 09d71c7008033897 |
| apps/web/public/atlas/topo/hillshade/9/133/201.webp | raster-full-decode | 18432 | 6fe14264e28833f8 |
| apps/web/public/atlas/topo/hillshade/9/134/200.webp | raster-full-decode | 30070 | f1815612e75cac9d |
| apps/web/public/atlas/topo/hillshade/9/134/201.webp | raster-full-decode | 26660 | 6c6ef0a561dfb662 |
| apps/web/public/atlas/topo/hillshade/9/135/200.webp | raster-full-decode | 31924 | 6ed570d016b155b6 |
| apps/web/public/atlas/topo/hillshade/9/135/201.webp | raster-full-decode | 30768 | 1d922bafc973b33b |
| apps/web/public/atlas/topo/hillshade/9/136/200.webp | raster-full-decode | 36948 | 1a3c6461c84abce5 |
| apps/web/public/atlas/topo/hillshade/9/136/201.webp | raster-full-decode | 28708 | 7c6d3f11e96db2c3 |
| apps/web/public/atlas/topo/hillshade/9/137/200.webp | raster-full-decode | 32348 | b0795bbfbed854e0 |
| apps/web/public/atlas/topo/hillshade/9/138/200.webp | raster-full-decode | 30542 | 678a3faabeb45eba |
| apps/web/public/atlas/topo/manifest.json | full-JSON-parse-and-coordinate-check | 786 | 21bb7b50ea287786 |
| apps/web/public/atlas/twra-attractors.geojson | full-JSON-parse-and-coordinate-check | 350996 | bb6e5f6b19fa5b0d |
| apps/web/public/atlas/twra-stocking.geojson | full-JSON-parse-and-coordinate-check | 206764 | ebd5227f0639b3e0 |
| apps/web/public/favicon.svg | full-SVG-XML-parse-and-active-content-check | 673 | 658684d3403aee25 |
| apps/web/public/fonts/Fraunces-Variable.woff2 | binary-read-signature-and-hash | 67304 | 7234ed860a9cc830 |
| apps/web/public/fonts/IBMPlexSans-Bold.woff2 | binary-read-signature-and-hash | 22832 | 42e7b0c143c19df9 |
| apps/web/public/fonts/IBMPlexSans-Regular.woff2 | binary-read-signature-and-hash | 45712 | e2291e842cf5af16 |
| apps/web/public/fonts/IBMPlexSans-SemiBold.woff2 | binary-read-signature-and-hash | 24252 | 8960851d691c054e |
| apps/web/public/icons/icon-192.png | raster-full-decode | 2872 | 0e8f394f211a4246 |
| apps/web/public/icons/icon-512.png | raster-full-decode | 11862 | ea5aea2126e19cdc |
| apps/web/public/icons/maskable-512.png | raster-full-decode | 7116 | 8bfeeaece17b8f83 |
| apps/web/public/img/report-1.jpg | raster-full-decode | 160 | 4aa6d511a4b9b959 |
| apps/web/public/img/taxa/amphipoda.jpg | raster-full-decode | 49561 | 358b9c78f47fd49c |
| apps/web/public/img/taxa/annelida.jpg | raster-full-decode | 104337 | fb78d78de9de423d |
| apps/web/public/img/taxa/chironomidae.jpg | raster-full-decode | 60861 | 2cdbe7d3722d3f0d |
| apps/web/public/img/taxa/coleoptera.jpg | raster-full-decode | 175804 | 3088879322c3118d |
| apps/web/public/img/taxa/ephemeroptera.jpg | raster-full-decode | 38468 | 1ac20c57340f26c2 |
| apps/web/public/img/taxa/hymenoptera.jpg | raster-full-decode | 74339 | d4e342e4b3839a92 |
| apps/web/public/img/taxa/isopoda.jpg | raster-full-decode | 94159 | d91832426cb093ee |
| apps/web/public/img/taxa/megaloptera.jpg | raster-full-decode | 179220 | 6db28091355996b0 |
| apps/web/public/img/taxa/odonata.jpg | raster-full-decode | 46062 | 981a023d72b5e96b |
| apps/web/public/img/taxa/orthoptera.jpg | raster-full-decode | 73698 | 5a2ce121f624076d |
| apps/web/public/img/taxa/plecoptera.jpg | raster-full-decode | 191402 | 11bc7d2068aca106 |
| apps/web/public/img/taxa/simuliidae.jpg | raster-full-decode | 40490 | 3e1b878df822faa6 |
| apps/web/public/img/taxa/tipulidae.jpg | raster-full-decode | 39293 | 2be9641eeb5e7640 |
| apps/web/public/img/taxa/trichoptera.jpg | raster-full-decode | 127008 | 38289412f23753d0 |
| apps/web/scripts/atlas-reach-gates.mjs | program-structure-review | 5590 | e56f47b4ca7fdb5d |
| apps/web/scripts/audit-river-continuity.mjs | program-structure-review | 21029 | ed5a72edf2661868 |
| apps/web/scripts/audit-selectable-rivers.mjs | program-structure-review | 10843 | ec392027c29abc25 |
| apps/web/scripts/audit-water-identities.mjs | program-structure-review | 10717 | 16e8610d2f8407bc |
| apps/web/scripts/build-atlas-context-sources.mjs | program-structure-review | 8137 | 09dc7c85e62746b7 |
| apps/web/scripts/build-atlas-context.mjs | program-structure-review | 2240 | 0ae84097705b18c3 |
| apps/web/scripts/build-east-southeast-atlas.mjs | program-structure-review | 54524 | b0e96170edd00787 |
| apps/web/scripts/build-flow-orientation.mjs | program-structure-review | 4267 | 5d586ab99b00bd21 |
| apps/web/scripts/build-lakes.mjs | program-structure-review | 6973 | ff4c13e81a8520ac |
| apps/web/scripts/build-missing-rivers.mjs | program-structure-review | 17879 | 8807b489d478d9ab |
| apps/web/scripts/build-roads.mjs | program-structure-review | 22825 | 4a8d37b6596a2c55 |
| apps/web/scripts/build-selectable-river-additions.mjs | program-structure-review | 12277 | 0277d0f86c435f10 |
| apps/web/scripts/build-selectable-water-traces.mjs | program-structure-review | 23645 | 05149d4ac9e53c00 |
| apps/web/scripts/build-stillwater.mjs | program-structure-review | 6128 | 7c9cdbabe7abea0a |
| apps/web/scripts/build-topo.mjs | program-structure-review | 46733 | cb69f52f6b906c01 |
| apps/web/scripts/close-residual-gaps.mjs | program-structure-review | 5221 | d40a1b0660f78d43 |
| apps/web/scripts/copy-pack-fallback.mjs | program-structure-review | 2291 | bd5ee6873b04e0dc |
| apps/web/scripts/east-fetch-connectors.mjs | program-structure-review | 5630 | 046bbd11ec6948de |
| apps/web/scripts/east-fetch-gapwater.mjs | program-structure-review | 3769 | 015d0dbef9f3b945 |
| apps/web/scripts/east-fetch-nhd.mjs | program-structure-review | 14979 | 61a2a03310635f66 |
| apps/web/scripts/east-rebuild-build.mjs | program-structure-review | 92680 | fb53223d8bc3f899 |
| apps/web/scripts/fetch-atlas-sources.mjs | program-structure-review | 3687 | ca921e612c2842a7 |
| apps/web/scripts/fetch-atlas-subset.sh | direct-read | 1337 | a8a918b7f8c6a6de |
| apps/web/scripts/fetch-east-southeast-hydro.mjs | program-structure-review | 21350 | 02aaf4a3900e1f24 |
| apps/web/scripts/fetch-nhd-fixes.mjs | program-structure-review | 5121 | 802b21d72efa7ed0 |
| apps/web/scripts/fetch-nhd-targets.mjs | program-structure-review | 12144 | 0bb3022e2bee2f8e |
| apps/web/scripts/fetch-roads.mjs | program-structure-review | 2364 | 65cdf93fd76b3323 |
| apps/web/scripts/fetch-stillwater-nhd.mjs | program-structure-review | 23054 | 05cdee15bef5b3b8 |
| apps/web/scripts/fetch-tn-dem.mjs | program-structure-review | 10319 | 5b784adeac105d02 |
| apps/web/scripts/fill-topo-tiles.mjs | program-structure-review | 2521 | 19052cd04c82b931 |
| apps/web/scripts/fix-brush-creek-cocke.mjs | program-structure-review | 5671 | dd4c8032f2f0b431 |
| apps/web/scripts/fix-caney-fork.mjs | program-structure-review | 4572 | 1c87950200eec34b |
| apps/web/scripts/fix-clear-creek-obed.mjs | program-structure-review | 3911 | 520fbcc251225a60 |
| apps/web/scripts/fix-duck-river.mjs | program-structure-review | 11619 | bc4d67d17b2d88ee |
| apps/web/scripts/fix-elk-river.mjs | program-structure-review | 12769 | 15f4ec73304509c3 |
| apps/web/scripts/fix-great-falls-lake.mjs | program-structure-review | 6053 | 9a9b403cd509485f |
| apps/web/scripts/fix-horse-creek-greene.mjs | program-structure-review | 7213 | 3acaef98e494a930 |
| apps/web/scripts/fix-mill-creek-overton.mjs | program-structure-review | 6017 | 02ccca2b8fc9e0b7 |
| apps/web/scripts/fix-obey-river.mjs | program-structure-review | 8099 | 4d44c81980c3b373 |
| apps/web/scripts/fix-south-holston-dam-name.mjs | program-structure-review | 1278 | f21e9c10ed875ad3 |
| apps/web/scripts/fix-stones-river.mjs | program-structure-review | 6985 | d53459c4321cf583 |
| apps/web/scripts/fix-tellico-area.mjs | program-structure-review | 8416 | d1defe1cc1275e05 |
| apps/web/scripts/fix-wolf-river-fentress.mjs | program-structure-review | 8379 | 2c5d4f7b4c62caba |
| apps/web/scripts/fix-woods-elk-system.mjs | program-structure-review | 8351 | 60f42427222399f7 |
| apps/web/scripts/flow-orientation-core.mjs | program-structure-review | 22345 | d274dd19d6edea9f |
| apps/web/scripts/generate-fixtures.mjs | program-structure-review | 46637 | e538dea24f245fd2 |
| apps/web/scripts/intake-imagery.mjs | program-structure-review | 2692 | 0cb8c93e9acf0723 |
| apps/web/scripts/integrate-verified-atlas.mjs | program-structure-review | 41646 | 2402e1f13d1422d4 |
| apps/web/scripts/lib-west-middle-fix.mjs | program-structure-review | 19115 | ff5506b6a33da5f8 |
| apps/web/scripts/make-icons.mjs | program-structure-review | 2477 | ecc094621626f916 |
| apps/web/scripts/match-rivers-tiger.mjs | program-structure-review | 13321 | 0b4c3837b819665a |
| apps/web/scripts/merge-rivers.mjs | program-structure-review | 24727 | 97a209832e185af9 |
| apps/web/scripts/merge-west-tn-points.mjs | program-structure-review | 2584 | f62398e75f89bc9a |
| apps/web/scripts/prerender.mjs | program-structure-review | 27395 | 9c3f3618ec7ab266 |
| apps/web/scripts/prerender.test.mjs | test-structure-review | 3051 | 76de2ea939b975cd |
| apps/web/scripts/rebuild-manifests.mjs | program-structure-review | 5072 | de1958482060954b |
| apps/web/scripts/regenerate-river-index.mjs | program-structure-review | 1969 | f5f68185607dd2d2 |
| apps/web/scripts/render-east-southeast-qa.mjs | program-structure-review | 14807 | 7692234b9190aaa7 |
| apps/web/scripts/render-gap-zooms.mjs | program-structure-review | 6141 | 09e13cfca05a49ba |
| apps/web/scripts/size-budget.mjs | program-structure-review | 7323 | d86adfe4f78df4cf |
| apps/web/scripts/size-budget.test.mjs | test-structure-review | 3578 | a66716418dc59ad3 |
| apps/web/scripts/split-caney-fork.mjs | program-structure-review | 19820 | 4d7a0962c24476d3 |
| apps/web/scripts/trace-apply-all.mjs | program-structure-review | 14790 | c97fcba704b49cd4 |
| apps/web/scripts/trace-east/apply-east.mjs | program-structure-review | 8818 | aeed3b29936f2ed8 |
| apps/web/scripts/trace-east/fetch-east.mjs | program-structure-review | 4540 | d424e7f69b063af7 |
| apps/web/scripts/trace-east/lib.mjs | program-structure-review | 16116 | 002bdc08c0977927 |
| apps/web/scripts/trace-east/trace-east.mjs | program-structure-review | 21619 | 6009e883f2422b78 |
| apps/web/scripts/trace-stillwater.mjs | program-structure-review | 11441 | 58e241cb46d05b45 |
| apps/web/scripts/trace-west/apply-west.mjs | program-structure-review | 7116 | 129e158b751a5dae |
| apps/web/scripts/trace-west/fetch-west.mjs | program-structure-review | 15606 | 50c0628c70089e42 |
| apps/web/scripts/trace-west/lib.mjs | program-structure-review | 16242 | 9abed43945e3a983 |
| apps/web/scripts/trace-west/trace-west.mjs | program-structure-review | 23575 | 4640961e74117310 |
| apps/web/scripts/validate-atlas.mjs | program-structure-review | 9668 | 902d6ea551a1701f |
| apps/web/scripts/validate-east-southeast.mjs | program-structure-review | 24986 | 613e5783cd40414f |
| apps/web/scripts/validate-roads.mjs | program-structure-review | 8309 | 3e3774022e49f40b |
| apps/web/scripts/validate-topo.mjs | program-structure-review | 19259 | 5ec934cfafad282a |
| apps/web/scripts/west-middle-audit.mjs | program-structure-review | 17610 | f2d56d8ad44bf749 |
| apps/web/scripts/west-middle-build.mjs | program-structure-review | 87633 | 182b8e9a43ce6ebf |
| apps/web/scripts/west-middle-fetch-connectors.mjs | program-structure-review | 5159 | 4ed3963217cf6b23 |
| apps/web/scripts/west-middle-fetch-nhd.mjs | program-structure-review | 21947 | ae58e64c9c9b5318 |
| apps/web/scripts/west-middle-fetch-state.mjs | program-structure-review | 4067 | 9c7be31b0f8c89bd |
| apps/web/scripts/west-middle-render.mjs | program-structure-review | 11478 | 4b371043a69af50c |
| apps/web/scripts/west-middle-validate.mjs | program-structure-review | 17716 | 07a8efd39df7be5f |
| apps/web/src/App.tsx | program-read | 2350 | d10ff4ba7ca37fda |
| apps/web/src/components/FishabilityCard.tsx | program-read | 9773 | 363fc0daac2405ee |
| apps/web/src/components/FreshnessChip.tsx | program-read | 4091 | 1865d0a5605242d8 |
| apps/web/src/components/ScorePill.tsx | program-read | 1713 | 9b279d8a833f1e45 |
| apps/web/src/components/SolarWindowsCard.tsx | program-read | 1991 | 5aeb2d601a620c92 |
| apps/web/src/components/SpeciesModeToggle.tsx | program-read | 1386 | f66b133e0fc4667e |
| apps/web/src/components/art/DiscriminatorArt.tsx | program-read | 3642 | d4385c7c9ccc899b |
| apps/web/src/components/art/TaxonArt.tsx | program-read | 4925 | 0da86a05ed490b49 |
| apps/web/src/components/icons.tsx | program-read | 4850 | 46bb9f045be3c0ed |
| apps/web/src/components/layout/AppShell.tsx | program-read | 8837 | 6473eb4ad56cae55 |
| apps/web/src/components/motion/MotionSettings.tsx | program-read | 600 | 48275cbb531a19c9 |
| apps/web/src/components/motion/atlas-motion.ts | program-read | 1293 | f15b07e55f282a87 |
| apps/web/src/components/ui/AnimatedNumber.tsx | program-read | 1101 | 35c3ca766e4bfefa |
| apps/web/src/components/ui/Segmented.tsx | program-read | 1631 | 13b1ed1fb16e3a30 |
| apps/web/src/data/regions.ts | program-read | 3440 | 939b63d99f6ab2a4 |
| apps/web/src/data/streams-geo.json | full-JSON-parse-and-coordinate-check | 4544 | 8f13d8cfe23d55e9 |
| apps/web/src/features/map/BrowsePage.tsx | program-read | 5029 | 29acc1cd2786c289 |
| apps/web/src/features/map/HatchMonthControl.tsx | program-read | 4297 | 8caeb92796bde70b |
| apps/web/src/features/map/MapControlGroup.tsx | program-read | 4623 | e0ee49cfe69cd757 |
| apps/web/src/features/map/MapControls.tsx | program-read | 4730 | 3037d142bd7e1358 |
| apps/web/src/features/map/MapLegend.tsx | program-read | 9172 | d0f43c724408778e |
| apps/web/src/features/map/MapPage.tsx | program-read | 58 | 1650f455dd1e098f |
| apps/web/src/features/map/OpportunityCard.tsx | program-read | 2723 | 5b5da9624e304a3a |
| apps/web/src/features/map/RiverDrawer.tsx | program-read | 25948 | 383903c916ab3bf6 |
| apps/web/src/features/map/RiverMapPage.tsx | program-read | 39355 | 3875570f054ad642 |
| apps/web/src/features/map/RiverSearch.tsx | program-read | 6807 | f88a828b284e85ac |
| apps/web/src/features/map/TennesseeMap.tsx | program-read | 53586 | 73f983154c3bdcec |
| apps/web/src/features/map/fisheryType.ts | program-read | 3192 | 04b4a0f3846bd7d7 |
| apps/web/src/features/map/flowArrows.ts | program-read | 6832 | 760a28b5786f1d52 |
| apps/web/src/features/map/flowOrientation.json | full-JSON-parse-and-coordinate-check | 11268 | 6008d5df779b6dab |
| apps/web/src/features/map/labelPolicy.ts | program-read | 6361 | 82441cf900c019a9 |
| apps/web/src/features/map/mapStyle.ts | program-read | 38611 | bcd1cbd474e6b2ac |
| apps/web/src/features/map/mapTokens.ts | program-read | 3270 | 521b39113e767633 |
| apps/web/src/features/map/networkClusters.ts | program-read | 20467 | c6f376d22d4c2cd4 |
| apps/web/src/features/map/qa/QaPanel.tsx | program-read | 11451 | 1fabdd80fc4a4b55 |
| apps/web/src/features/map/qa/audit.ts | program-read | 22566 | 08bd59fbb24d5ac7 |
| apps/web/src/features/map/qa/reference.ts | program-read | 3617 | 29ec89bc50b71951 |
| apps/web/src/features/map/riverIndex.json | full-JSON-parse-and-coordinate-check | 316799 | 8e762b4fff08294e |
| apps/web/src/features/map/riverMapSelectors.ts | program-read | 5360 | e3031a6d9e3c34aa |
| apps/web/src/features/map/selection.ts | program-read | 5130 | ed9e3c9b6cbe32d8 |
| apps/web/src/features/map/useMapState.ts | program-read | 2576 | d917240f2f1071a4 |
| apps/web/src/features/map/useRiverMapData.ts | program-read | 11901 | c1f506613ce19807 |
| apps/web/src/features/map/waterDecision.ts | program-read | 22594 | 368ebf35ca26646b |
| apps/web/src/hooks/useInstallPrompt.ts | program-read | 1467 | 8d9db56bdf9eb22e |
| apps/web/src/hooks/useOnline.ts | program-read | 588 | 74ca71daf0ed3cf7 |
| apps/web/src/index.css | program-read | 58602 | 039a98d30ce68b2c |
| apps/web/src/lib/atlasAvailability.ts | program-read | 6130 | d201568f82e99a75 |
| apps/web/src/lib/conditions.ts | program-read | 5235 | e68b6aea3354dd60 |
| apps/web/src/lib/content.ts | program-read | 1774 | 01d07398d69cdbb3 |
| apps/web/src/lib/db.ts | program-read | 3329 | 229825eb73dc970a |
| apps/web/src/lib/endpoints.ts | program-read | 1316 | c4dd842ce739094d |
| apps/web/src/lib/fishability.ts | program-read | 4144 | 2c86f8a108fe4c7c |
| apps/web/src/lib/fishingInfo.ts | program-read | 2130 | 84f79d2cee5c8c4e |
| apps/web/src/lib/geo.ts | program-read | 2266 | 12f5585b1e509fa5 |
| apps/web/src/lib/hatchActivity.ts | program-read | 5145 | 9fe31f108f6d6bb4 |
| apps/web/src/lib/logbook.ts | program-read | 3109 | bcfaff47f5d9e564 |
| apps/web/src/lib/media.ts | program-read | 475 | aaf98f2318dc9173 |
| apps/web/src/lib/presentation.ts | program-read | 1535 | 7b7c04a8bc862a19 |
| apps/web/src/lib/provenance.ts | program-read | 823 | 7ae4d1bc52d052bf |
| apps/web/src/lib/riverContext.tsx | program-read | 2120 | 880d7372bf518f7b |
| apps/web/src/lib/settings.tsx | program-read | 1774 | b0c6c6c1086c299b |
| apps/web/src/lib/snapshots.ts | program-read | 4266 | d9ad27a4aacd3663 |
| apps/web/src/lib/solar.ts | program-read | 3457 | e5a0701d8f71c9e6 |
| apps/web/src/lib/stockingMatch.ts | program-read | 8373 | 2bf63571e7afb908 |
| apps/web/src/lib/taxonImages.ts | program-read | 4937 | 7639c1e465bcbd90 |
| apps/web/src/lib/time.ts | program-read | 1328 | ea72441cbe11f079 |
| apps/web/src/lib/troutCalendar.ts | program-read | 1103 | a14e0d798edcd1e1 |
| apps/web/src/lib/units.ts | program-read | 948 | c9f0f35c2b7a39c0 |
| apps/web/src/lib/useSnapshotQuery.ts | program-read | 893 | 8ffc978a0acd4a81 |
| apps/web/src/lib/useStreamsCatalog.ts | program-read | 3146 | a8ded2fdd0fefea9 |
| apps/web/src/main.tsx | program-read | 1277 | 74435a422930096a |
| apps/web/src/pages/AboutPrivacyPage.tsx | program-read | 4919 | c06c29a3f323b56e |
| apps/web/src/pages/ConditionsPage.tsx | program-read | 17894 | 5702ece877dae32c |
| apps/web/src/pages/FishingInfoPage.tsx | program-read | 11396 | d78867a3c6858aef |
| apps/web/src/pages/HatchChartDetailPage.tsx | program-read | 11749 | d6a117c471b25baa |
| apps/web/src/pages/HatchChartsPage.tsx | program-read | 2914 | 885fec7b059a9a7e |
| apps/web/src/pages/HatchKeyPage.tsx | program-read | 20320 | 7c0a3112f777d8e4 |
| apps/web/src/pages/LogbookPage.tsx | program-read | 10298 | bd66e24e3fb6a0ce |
| apps/web/src/pages/NotFoundPage.tsx | program-read | 533 | 8bdbc2aa7db86f92 |
| apps/web/src/pages/PatternDetailPage.tsx | program-read | 3737 | 9fcaa8097587f1d0 |
| apps/web/src/pages/SettingsPage.tsx | program-read | 9466 | 00f6254f1b13a57b |
| apps/web/src/pages/ShopsPage.tsx | program-read | 5567 | 8b9a9ef33dc006bd |
| apps/web/src/pages/StockingPage.tsx | program-read | 15394 | 6d4adb3c1bfdfc7b |
| apps/web/src/pages/StreamDetailPage.tsx | program-read | 25010 | 3c889c871c896c69 |
| apps/web/src/pages/TaxonDetailPage.tsx | program-read | 7280 | 71120fb8aa0f5b20 |
| apps/web/src/theme/ThemeProvider.tsx | program-read | 4329 | 1e2197576ed6a58b |
| apps/web/src/theme/themes.ts | program-read | 14284 | 4033c14a08e6e5e6 |
| apps/web/src/vite-env.d.ts | program-read | 354 | 1e45828c5c2a8139 |
| apps/web/tailwind.config.js | direct-read | 163 | 0fdcba73f5596b53 |
| apps/web/test/atlas-availability.test.ts | program-structure-review | 6219 | f804cd31979bda5f |
| apps/web/test/atlas-empty-artifacts.test.ts | program-structure-review | 693 | d26afac9484e9060 |
| apps/web/test/atlas-integration.test.ts | program-structure-review | 16068 | eb2b450b0b22e1d7 |
| apps/web/test/catalog-fallback.test.tsx | program-structure-review | 6790 | 23a0e6bb5ebf0aa4 |
| apps/web/test/components.test.tsx | program-structure-review | 5644 | a0eb1f2ea3a562be |
| apps/web/test/conditions-discovery.test.tsx | program-structure-review | 5730 | a6f7abf16e0affb0 |
| apps/web/test/conditions.test.ts | program-structure-review | 10033 | 227372703405fb9f |
| apps/web/test/east-southeast-atlas.test.ts | program-structure-review | 9336 | 5730bdaa96d95c3c |
| apps/web/test/fieldwork.test.tsx | test-structure-review | 15994 | 52776cf2fb1d27d6 |
| apps/web/test/fishability-card.test.tsx | test-structure-review | 8510 | 17eea912c663898b |
| apps/web/test/fishability-focus-wiring.test.tsx | test-structure-review | 4973 | 42dc676d7fb99347 |
| apps/web/test/fishery-type.test.ts | test-structure-review | 3060 | 71bbd73b2f2c583a |
| apps/web/test/fishing-info.test.tsx | test-structure-review | 7215 | c4cfcf2a0c5baa83 |
| apps/web/test/fixtures.test.ts | test-structure-review | 5449 | 75cf790c54ec5085 |
| apps/web/test/fixtures/stocking-tn-2026-09-12.json | full-JSON-parse-and-coordinate-check | 87548 | 8511154b98697b41 |
| apps/web/test/flow-arrow-icon-guard.test.ts | test-structure-review | 1653 | 933dc387039b17e0 |
| apps/web/test/flow-orientation.test.ts | test-structure-review | 9308 | 9ae830078ef51418 |
| apps/web/test/geo.test.ts | test-structure-review | 1269 | e3dd44a9f0b1cf76 |
| apps/web/test/hatch-key-onboarding.test.tsx | test-structure-review | 4871 | 0c65bea1360daa95 |
| apps/web/test/label-policy.test.ts | test-structure-review | 11047 | 99dde3adf57114c8 |
| apps/web/test/logbook.test.ts | test-structure-review | 2316 | 84dccbbd263d0dd9 |
| apps/web/test/map-camera.test.ts | test-structure-review | 3222 | 390795f1711253b1 |
| apps/web/test/map-control-group.test.tsx | test-structure-review | 6480 | 4ca3fd7b8e719df6 |
| apps/web/test/map-filter-hygiene.test.ts | test-structure-review | 4258 | 53e48982dbca2812 |
| apps/web/test/map-legend.test.tsx | test-structure-review | 4808 | 6a44923e53c0342d |
| apps/web/test/media.test.ts | test-structure-review | 723 | 4011c412d88a18bb |
| apps/web/test/mobile-detail.test.tsx | test-structure-review | 4512 | 97d2363a6f6ddd0d |
| apps/web/test/network-clusters.test.ts | test-structure-review | 12172 | 5cc900105f666881 |
| apps/web/test/offline-recovery.test.ts | test-structure-review | 2201 | dce69cca375ed7ec |
| apps/web/test/qa-audit.test.ts | test-structure-review | 9243 | f66ba41a6d936fe8 |
| apps/web/test/report-photos.test.tsx | test-structure-review | 3933 | 37b673545d8f5759 |
| apps/web/test/river-drawer-seasonal.test.tsx | test-structure-review | 6213 | 3b37c8c916e1266d |
| apps/web/test/selectable-river-expansion.test.ts | test-structure-review | 4074 | 000e2984f5faabed |
| apps/web/test/selection.test.ts | test-structure-review | 1644 | 6027cc3a4c360de9 |
| apps/web/test/setup.ts | test-structure-review | 511 | 74098ff5b251e160 |
| apps/web/test/snapshots.test.ts | test-structure-review | 4835 | b751ff453485ab66 |
| apps/web/test/solar.test.ts | test-structure-review | 2753 | e96018bd14675193 |
| apps/web/test/species-mode.test.tsx | test-structure-review | 3524 | 2e5747d6777a2f38 |
| apps/web/test/stocking-discovery.test.tsx | test-structure-review | 7097 | 12a7921544bcc62f |
| apps/web/test/stocking-recent.test.tsx | test-structure-review | 3013 | 04b8630c98e929c7 |
| apps/web/test/stockingMatch.test.ts | test-structure-review | 11209 | 877d819bbf787eb1 |
| apps/web/test/stream-detail.test.tsx | test-structure-review | 9387 | 075aa62e7b65f132 |
| apps/web/test/units.test.ts | test-structure-review | 1677 | 78c20c7a6aadbb74 |
| apps/web/test/water-decision.test.tsx | test-structure-review | 28216 | 18c352df3f64f597 |
| apps/web/tsconfig.json | direct-read | 237 | 7aade8bec3476a4c |
| apps/web/vite.config.ts | program-read | 1879 | 7ab04b86412e6273 |
| apps/web/vite.fixtures.config.ts | program-read | 1193 | 4000c093619a15c6 |
| apps/web/vite.shared.ts | program-read | 9579 | 8410bdcbc7103832 |
| apps/web/vitest.config.ts | program-read | 425 | 9830b7e702f56957 |
| data/nhd/derived/06010207.anchors.json | full-JSON-parse-and-coordinate-check | 6053 | 0e71360573861ccd |
| data/nhd/derived/catalog-discovery.json | full-JSON-parse-and-coordinate-check | 27603 | a155f68761080a13 |
| data/nhd/derived/catalog-trace-results.json | full-JSON-parse-and-coordinate-check | 880 | 855b40d63497ed90 |
| data/nhd/derived/reach-barren-fork-river.audit.json | full-JSON-parse-and-coordinate-check | 15974 | 32d9b85be05efa01 |
| data/nhd/derived/reach-barren-fork-river.geojson | full-JSON-parse-and-coordinate-check | 12432 | 19c0cf6c066cfea7 |
| data/nhd/derived/reach-barren-fork-river.validate.json | full-JSON-parse-and-coordinate-check | 986 | 84a548837f11a9c3 |
| data/nhd/derived/reach-beaverdam-creek.audit.json | full-JSON-parse-and-coordinate-check | 17464 | 14cca74691ad362d |
| data/nhd/derived/reach-beaverdam-creek.geojson | full-JSON-parse-and-coordinate-check | 6475 | dabd9df3b18edecd |
| data/nhd/derived/reach-beaverdam-creek.validate.json | full-JSON-parse-and-coordinate-check | 980 | 1526204a87bdf6f6 |
| data/nhd/derived/reach-big-rock-creek.audit.json | full-JSON-parse-and-coordinate-check | 9969 | 3cc082ed675020f2 |
| data/nhd/derived/reach-big-rock-creek.geojson | full-JSON-parse-and-coordinate-check | 8579 | e3c1eb31c854e7c1 |
| data/nhd/derived/reach-big-rock-creek.validate.json | full-JSON-parse-and-coordinate-check | 982 | 548cc5eb0e5a5865 |
| data/nhd/derived/reach-boiling-fork-creek.audit.json | full-JSON-parse-and-coordinate-check | 6139 | 7080a646b3fd1987 |
| data/nhd/derived/reach-boiling-fork-creek.geojson | full-JSON-parse-and-coordinate-check | 7059 | 732e688add83628a |
| data/nhd/derived/reach-boiling-fork-creek.validate.json | full-JSON-parse-and-coordinate-check | 985 | 6a9087258b09b413 |
| data/nhd/derived/reach-boone-tailwater.audit.json | full-JSON-parse-and-coordinate-check | 2821 | 72064637ad443490 |
| data/nhd/derived/reach-boone-tailwater.geojson | full-JSON-parse-and-coordinate-check | 2972 | 19e7c19d3eb9dbdf |
| data/nhd/derived/reach-boone-tailwater.validate.json | full-JSON-parse-and-coordinate-check | 983 | 308fad076e81083e |
| data/nhd/derived/reach-bradley-creek.audit.json | full-JSON-parse-and-coordinate-check | 3809 | 95ecde3b408675f8 |
| data/nhd/derived/reach-bradley-creek.geojson | full-JSON-parse-and-coordinate-check | 7276 | 72f894cb0f0c20b0 |
| data/nhd/derived/reach-bradley-creek.validate.json | full-JSON-parse-and-coordinate-check | 980 | ef3bf315460e855c |
| data/nhd/derived/reach-brush-creek-cocke.audit.json | full-JSON-parse-and-coordinate-check | 4674 | 522d4ac08b1b3d1a |
| data/nhd/derived/reach-brush-creek-cocke.geojson | full-JSON-parse-and-coordinate-check | 2627 | a293b2873a0b405a |
| data/nhd/derived/reach-brush-creek-cocke.validate.json | full-JSON-parse-and-coordinate-check | 984 | 0dc3f6d1f2869bd2 |
| data/nhd/derived/reach-buffalo-creek-grainger.audit.json | full-JSON-parse-and-coordinate-check | 1858 | f8f9403a3fb3827d |
| data/nhd/derived/reach-buffalo-creek-grainger.geojson | full-JSON-parse-and-coordinate-check | 2488 | 79bdf54a494bbbb9 |
| data/nhd/derived/reach-buffalo-creek-grainger.validate.json | full-JSON-parse-and-coordinate-check | 989 | c91b4d3507e295ff |
| data/nhd/derived/reach-buffalo-river.audit.json | full-JSON-parse-and-coordinate-check | 68642 | 9de4ef89371ef6a8 |
| data/nhd/derived/reach-buffalo-river.geojson | full-JSON-parse-and-coordinate-check | 17610 | 3192e34a3e9ed2dd |
| data/nhd/derived/reach-buffalo-river.validate.json | full-JSON-parse-and-coordinate-check | 983 | bc0f713259f58e9e |
| data/nhd/derived/reach-calfkiller-river.audit.json | full-JSON-parse-and-coordinate-check | 10245 | 0604cc746771282f |
| data/nhd/derived/reach-calfkiller-river.geojson | full-JSON-parse-and-coordinate-check | 13775 | d28ff7f44cb1ee65 |
| data/nhd/derived/reach-calfkiller-river.validate.json | full-JSON-parse-and-coordinate-check | 986 | 16512532c1b94553 |
| data/nhd/derived/reach-cane-creek.audit.json | full-JSON-parse-and-coordinate-check | 12212 | b7fb151557d08c62 |
| data/nhd/derived/reach-cane-creek.geojson | full-JSON-parse-and-coordinate-check | 12075 | 90a8638f2d45ed65 |
| data/nhd/derived/reach-cane-creek.validate.json | full-JSON-parse-and-coordinate-check | 979 | b8009216025b1959 |
| data/nhd/derived/reach-caney-fork-river.audit.json | full-JSON-parse-and-coordinate-check | 6285 | 181374ab8a1df7c8 |
| data/nhd/derived/reach-caney-fork-river.geojson | full-JSON-parse-and-coordinate-check | 5776 | 29ccc0c4b559fb0c |
| data/nhd/derived/reach-caney-fork-river.validate.json | full-JSON-parse-and-coordinate-check | 984 | a4eb4a1eab033870 |
| data/nhd/derived/reach-caney-fork-upper.audit.json | full-JSON-parse-and-coordinate-check | 28497 | 60430909c9086185 |
| data/nhd/derived/reach-caney-fork-upper.geojson | full-JSON-parse-and-coordinate-check | 15274 | 4142c9802e402ec1 |
| data/nhd/derived/reach-caney-fork-upper.validate.json | full-JSON-parse-and-coordinate-check | 986 | 47a31f362ef8c581 |
| data/nhd/derived/reach-charles-creek.audit.json | full-JSON-parse-and-coordinate-check | 5771 | 8b70034bb1f02d59 |
| data/nhd/derived/reach-charles-creek.geojson | full-JSON-parse-and-coordinate-check | 5314 | f425552bd9666608 |
| data/nhd/derived/reach-charles-creek.validate.json | full-JSON-parse-and-coordinate-check | 981 | bd218c1dee0657b0 |
| data/nhd/derived/reach-citico-creek.audit.json | full-JSON-parse-and-coordinate-check | 16953 | 84ed0a08e54e0837 |
| data/nhd/derived/reach-citico-creek.geojson | full-JSON-parse-and-coordinate-check | 9988 | d65d8f07fc59c06f |
| data/nhd/derived/reach-citico-creek.validate.json | full-JSON-parse-and-coordinate-check | 979 | 3694e1180474c1bd |
| data/nhd/derived/reach-clear-creek-obed.audit.json | full-JSON-parse-and-coordinate-check | 26002 | a3a038bf5824d7ef |
| data/nhd/derived/reach-clear-creek-obed.geojson | full-JSON-parse-and-coordinate-check | 16510 | 9a7a918a2aba0b38 |
| data/nhd/derived/reach-clear-creek-obed.validate.json | full-JSON-parse-and-coordinate-check | 986 | 110ec0bdfdad3cf3 |
| data/nhd/derived/reach-clear-fork.audit.json | full-JSON-parse-and-coordinate-check | 26329 | b9d1ce5aa1f48d88 |
| data/nhd/derived/reach-clear-fork.geojson | full-JSON-parse-and-coordinate-check | 13544 | b7e8ba793715c3c4 |
| data/nhd/derived/reach-clear-fork.validate.json | full-JSON-parse-and-coordinate-check | 980 | 9939264ec7b821e1 |
| data/nhd/derived/reach-clinch-river.audit.json | full-JSON-parse-and-coordinate-check | 20890 | d15b6cae95743444 |
| data/nhd/derived/reach-clinch-river.geojson | full-JSON-parse-and-coordinate-check | 15625 | 40a5cf5828a602c2 |
| data/nhd/derived/reach-clinch-river.validate.json | full-JSON-parse-and-coordinate-check | 2220 | 4d67974873417ee5 |
| data/nhd/derived/reach-collins-river.audit.json | full-JSON-parse-and-coordinate-check | 17803 | 8f9a8f57eed19b5e |
| data/nhd/derived/reach-collins-river.geojson | full-JSON-parse-and-coordinate-check | 16957 | c5c574464ae80b44 |
| data/nhd/derived/reach-collins-river.validate.json | full-JSON-parse-and-coordinate-check | 982 | c8685e2a5acbe5a1 |
| data/nhd/derived/reach-cosby-creek.audit.json | full-JSON-parse-and-coordinate-check | 14502 | f86053f21b8a47fc |
| data/nhd/derived/reach-cosby-creek.geojson | full-JSON-parse-and-coordinate-check | 6724 | f1703ec3396b0d13 |
| data/nhd/derived/reach-cosby-creek.validate.json | full-JSON-parse-and-coordinate-check | 978 | fbdd0282f2393e7d |
| data/nhd/derived/reach-cumberland-river.audit.json | full-JSON-parse-and-coordinate-check | 11144 | 799f7a1b016ad473 |
| data/nhd/derived/reach-cumberland-river.geojson | full-JSON-parse-and-coordinate-check | 8550 | 144d14606e9bed85 |
| data/nhd/derived/reach-cumberland-river.validate.json | full-JSON-parse-and-coordinate-check | 984 | 9a30055cc5bb8101 |
| data/nhd/derived/reach-daddys-creek.audit.json | full-JSON-parse-and-coordinate-check | 22017 | ea682eac97e131b9 |
| data/nhd/derived/reach-daddys-creek.geojson | full-JSON-parse-and-coordinate-check | 15383 | b2b6f61460b4998b |
| data/nhd/derived/reach-daddys-creek.validate.json | full-JSON-parse-and-coordinate-check | 981 | bd667d0476f887a1 |
| data/nhd/derived/reach-doe-creek-johnson.audit.json | full-JSON-parse-and-coordinate-check | 12241 | 7b365932f18a0994 |
| data/nhd/derived/reach-doe-creek-johnson.geojson | full-JSON-parse-and-coordinate-check | 5525 | 98b62bc50d6b0ea8 |
| data/nhd/derived/reach-doe-creek-johnson.validate.json | full-JSON-parse-and-coordinate-check | 982 | 621c8a5efec05d59 |
| data/nhd/derived/reach-doe-river.audit.json | full-JSON-parse-and-coordinate-check | 18049 | d614cb83c5694191 |
| data/nhd/derived/reach-doe-river.geojson | full-JSON-parse-and-coordinate-check | 9914 | 17cc7e363df59557 |
| data/nhd/derived/reach-doe-river.validate.json | full-JSON-parse-and-coordinate-check | 977 | f88afd8872b62cfc |
| data/nhd/derived/reach-duck-river-lower.audit.json | full-JSON-parse-and-coordinate-check | 17908 | 41b29b40ab3597f6 |
| data/nhd/derived/reach-duck-river-lower.geojson | full-JSON-parse-and-coordinate-check | 11588 | a7fa47281aba7da6 |
| data/nhd/derived/reach-duck-river-lower.validate.json | full-JSON-parse-and-coordinate-check | 986 | 351c43f377fd5561 |
| data/nhd/derived/reach-duck-river-mouth.audit.json | full-JSON-parse-and-coordinate-check | 59625 | c39b64df7647e3c3 |
| data/nhd/derived/reach-duck-river-mouth.geojson | full-JSON-parse-and-coordinate-check | 10093 | 6caad1cf45ef7789 |
| data/nhd/derived/reach-duck-river-mouth.validate.json | full-JSON-parse-and-coordinate-check | 986 | 68bf0777dd8b3200 |
| data/nhd/derived/reach-duck-river-tailwater.audit.json | full-JSON-parse-and-coordinate-check | 15028 | 74e2650b9d5062ee |
| data/nhd/derived/reach-duck-river-tailwater.geojson | full-JSON-parse-and-coordinate-check | 7613 | afeac93d8545b3cc |
| data/nhd/derived/reach-duck-river-tailwater.validate.json | full-JSON-parse-and-coordinate-check | 1552 | ee1ecaa2813b6265 |
| data/nhd/derived/reach-east-fork-shoal-creek.audit.json | full-JSON-parse-and-coordinate-check | 4385 | 9211e4b71e205867 |
| data/nhd/derived/reach-east-fork-shoal-creek.geojson | full-JSON-parse-and-coordinate-check | 3714 | 858bad0011ddce64 |
| data/nhd/derived/reach-east-fork-shoal-creek.validate.json | full-JSON-parse-and-coordinate-check | 986 | cdc20d142245cfc3 |
| data/nhd/derived/reach-east-fork-stones-river.audit.json | full-JSON-parse-and-coordinate-check | 16867 | f920f62ce9b1892b |
| data/nhd/derived/reach-east-fork-stones-river.geojson | full-JSON-parse-and-coordinate-check | 15440 | 55848797d5eae5da |
| data/nhd/derived/reach-east-fork-stones-river.validate.json | full-JSON-parse-and-coordinate-check | 991 | 1089fbe7f64ee923 |
| data/nhd/derived/reach-elk-river-lower.audit.json | full-JSON-parse-and-coordinate-check | 12346 | 63b6c6ef97ebb798 |
| data/nhd/derived/reach-elk-river-lower.geojson | full-JSON-parse-and-coordinate-check | 6951 | ee1d51465b2150df |
| data/nhd/derived/reach-elk-river-lower.validate.json | full-JSON-parse-and-coordinate-check | 983 | fac27fc6f72d7b58 |
| data/nhd/derived/reach-elk-river.audit.json | full-JSON-parse-and-coordinate-check | 24672 | 33d6659262b49425 |
| data/nhd/derived/reach-elk-river.geojson | full-JSON-parse-and-coordinate-check | 12513 | 681da675203ce4c7 |
| data/nhd/derived/reach-elk-river.validate.json | full-JSON-parse-and-coordinate-check | 980 | f1443c8b9622b396 |
| data/nhd/derived/reach-emory-river.audit.json | full-JSON-parse-and-coordinate-check | 26456 | 9d649359b8b0b620 |
| data/nhd/derived/reach-emory-river.geojson | full-JSON-parse-and-coordinate-check | 13230 | 7e5b17d4cdd176da |
| data/nhd/derived/reach-emory-river.validate.json | full-JSON-parse-and-coordinate-check | 981 | 257b14ddd4f8bbba |
| data/nhd/derived/reach-fletchers-fork.audit.json | full-JSON-parse-and-coordinate-check | 4497 | d795e7e439c0b84e |
| data/nhd/derived/reach-fletchers-fork.geojson | full-JSON-parse-and-coordinate-check | 7017 | 3e419b5977042974 |
| data/nhd/derived/reach-fletchers-fork.validate.json | full-JSON-parse-and-coordinate-check | 982 | 2298f4f4f74fb82b |
| data/nhd/derived/reach-forge-creek-johnson.audit.json | full-JSON-parse-and-coordinate-check | 2368 | 76f4cba2cdd01790 |
| data/nhd/derived/reach-forge-creek-johnson.geojson | full-JSON-parse-and-coordinate-check | 2081 | a993cacc39d7e878 |
| data/nhd/derived/reach-forge-creek-johnson.validate.json | full-JSON-parse-and-coordinate-check | 984 | 5de3d331365a51bc |
| data/nhd/derived/reach-french-broad-river.audit.json | full-JSON-parse-and-coordinate-check | 25293 | c5a4c9c3be8ee84f |
| data/nhd/derived/reach-french-broad-river.geojson | full-JSON-parse-and-coordinate-check | 12791 | b8f0bd8a76c45857 |
| data/nhd/derived/reach-french-broad-river.validate.json | full-JSON-parse-and-coordinate-check | 989 | 4fbe74f845cd84b4 |
| data/nhd/derived/reach-ft-patrick-henry-tailwater.audit.json | full-JSON-parse-and-coordinate-check | 2790 | 2eb656f3705a6d51 |
| data/nhd/derived/reach-ft-patrick-henry-tailwater.geojson | full-JSON-parse-and-coordinate-check | 2652 | a9d2a7be9a4813d7 |
| data/nhd/derived/reach-ft-patrick-henry-tailwater.validate.json | full-JSON-parse-and-coordinate-check | 994 | 2be3c122d8ccdcd1 |
| data/nhd/derived/reach-gap-creek-claiborne.audit.json | full-JSON-parse-and-coordinate-check | 1640 | eb033b63c1b0ddd0 |
| data/nhd/derived/reach-gap-creek-claiborne.geojson | full-JSON-parse-and-coordinate-check | 3697 | a977c4cd9debe864 |
| data/nhd/derived/reach-gap-creek-claiborne.validate.json | full-JSON-parse-and-coordinate-check | 984 | 73d24f225c1cd52e |
| data/nhd/derived/reach-goforth-creek.audit.json | full-JSON-parse-and-coordinate-check | 2043 | 5635b1a1f40d84ed |
| data/nhd/derived/reach-goforth-creek.geojson | full-JSON-parse-and-coordinate-check | 2522 | 5032bfec31511e80 |
| data/nhd/derived/reach-goforth-creek.validate.json | full-JSON-parse-and-coordinate-check | 978 | 18a1e201629406f5 |
| data/nhd/derived/reach-greasy-creek-polk.audit.json | full-JSON-parse-and-coordinate-check | 3845 | 13bd24f559d1e72c |
| data/nhd/derived/reach-greasy-creek-polk.geojson | full-JSON-parse-and-coordinate-check | 4835 | 039d663b43054179 |
| data/nhd/derived/reach-greasy-creek-polk.validate.json | full-JSON-parse-and-coordinate-check | 982 | 881dcafc0d9efec9 |
| data/nhd/derived/reach-gulf-fork-big-creek.audit.json | full-JSON-parse-and-coordinate-check | 13450 | 9a57bb049386ab62 |
| data/nhd/derived/reach-gulf-fork-big-creek.geojson | full-JSON-parse-and-coordinate-check | 9451 | 1a2e8bbf684e7487 |
| data/nhd/derived/reach-gulf-fork-big-creek.validate.json | full-JSON-parse-and-coordinate-check | 985 | 60cdcfdd8b4fa4d5 |
| data/nhd/derived/reach-harpeth-river.audit.json | full-JSON-parse-and-coordinate-check | 33542 | b2ddc3bb82f88594 |
| data/nhd/derived/reach-harpeth-river.geojson | full-JSON-parse-and-coordinate-check | 12723 | 2685836862672c69 |
| data/nhd/derived/reach-harpeth-river.validate.json | full-JSON-parse-and-coordinate-check | 984 | 9e8d8394b3741109 |
| data/nhd/derived/reach-hatchie-river.audit.json | full-JSON-parse-and-coordinate-check | 43528 | 0eb244833cc1c664 |
| data/nhd/derived/reach-hatchie-river.geojson | full-JSON-parse-and-coordinate-check | 17282 | 3075f1b3f8b0b1b2 |
| data/nhd/derived/reach-hatchie-river.validate.json | full-JSON-parse-and-coordinate-check | 983 | 102b2be13d6ec8a8 |
| data/nhd/derived/reach-hiwassee-river.audit.json | full-JSON-parse-and-coordinate-check | 24690 | 0c0309f9f3b0108a |
| data/nhd/derived/reach-hiwassee-river.geojson | full-JSON-parse-and-coordinate-check | 12008 | cda38cf05565b033 |
| data/nhd/derived/reach-hiwassee-river.validate.json | full-JSON-parse-and-coordinate-check | 985 | 78133f8bd335af41 |
| data/nhd/derived/reach-holston-river.audit.json | full-JSON-parse-and-coordinate-check | 54131 | 7d37b8d6fa7eb5e5 |
| data/nhd/derived/reach-holston-river.geojson | full-JSON-parse-and-coordinate-check | 13944 | cbe3eb3b2cad1436 |
| data/nhd/derived/reach-holston-river.validate.json | full-JSON-parse-and-coordinate-check | 985 | 9f15e59aee4e3298 |
| data/nhd/derived/reach-horse-creek-greene.audit.json | full-JSON-parse-and-coordinate-check | 4475 | c2a5b89a701619ee |
| data/nhd/derived/reach-horse-creek-greene.geojson | full-JSON-parse-and-coordinate-check | 4473 | 57aa1a7ca82fce7b |
| data/nhd/derived/reach-horse-creek-greene.validate.json | full-JSON-parse-and-coordinate-check | 983 | 10a1e8d2620cdc6c |
| data/nhd/derived/reach-hurricane-creek.audit.json | full-JSON-parse-and-coordinate-check | 13674 | 767204b6d3563839 |
| data/nhd/derived/reach-hurricane-creek.geojson | full-JSON-parse-and-coordinate-check | 8539 | 24bc595b17b5c70d |
| data/nhd/derived/reach-hurricane-creek.validate.json | full-JSON-parse-and-coordinate-check | 980 | fd4793c6c3c6bf24 |
| data/nhd/derived/reach-indian-creek-claiborne.audit.json | full-JSON-parse-and-coordinate-check | 8725 | c15ef23706901dc5 |
| data/nhd/derived/reach-indian-creek-claiborne.geojson | full-JSON-parse-and-coordinate-check | 12162 | 028c804c460a24c4 |
| data/nhd/derived/reach-indian-creek-claiborne.validate.json | full-JSON-parse-and-coordinate-check | 990 | f26bacd7a5d9720a |
| data/nhd/derived/reach-laurel-creek-johnson.audit.json | full-JSON-parse-and-coordinate-check | 8484 | b9cd330638f8120f |
| data/nhd/derived/reach-laurel-creek-johnson.geojson | full-JSON-parse-and-coordinate-check | 3943 | 0365a08fb2199c35 |
| data/nhd/derived/reach-laurel-creek-johnson.validate.json | full-JSON-parse-and-coordinate-check | 985 | 2c4d25707e047191 |
| data/nhd/derived/reach-laurel-fork-carter.audit.json | full-JSON-parse-and-coordinate-check | 10798 | 5d8da915bafcae97 |
| data/nhd/derived/reach-laurel-fork-carter.geojson | full-JSON-parse-and-coordinate-check | 6831 | 8f2cf12e07196652 |
| data/nhd/derived/reach-laurel-fork-carter.validate.json | full-JSON-parse-and-coordinate-check | 983 | fdbb0e5278d37bbf |
| data/nhd/derived/reach-leconte-creek.audit.json | full-JSON-parse-and-coordinate-check | 3170 | 356515efc5913ff2 |
| data/nhd/derived/reach-leconte-creek.geojson | full-JSON-parse-and-coordinate-check | 3401 | 8f9545ed5bc4f5b4 |
| data/nhd/derived/reach-leconte-creek.validate.json | full-JSON-parse-and-coordinate-check | 981 | 2c4db172607f7f1b |
| data/nhd/derived/reach-little-buffalo-river.audit.json | full-JSON-parse-and-coordinate-check | 9720 | ff11e1bd0c900a27 |
| data/nhd/derived/reach-little-buffalo-river.geojson | full-JSON-parse-and-coordinate-check | 6418 | b805e5e7e1aac91c |
| data/nhd/derived/reach-little-buffalo-river.validate.json | full-JSON-parse-and-coordinate-check | 987 | e0d79ad8feed140f |
| data/nhd/derived/reach-little-pigeon-river.audit.json | full-JSON-parse-and-coordinate-check | 35644 | 1eeba97457fd16ae |
| data/nhd/derived/reach-little-pigeon-river.geojson | full-JSON-parse-and-coordinate-check | 12490 | 0a68c7185230dd1c |
| data/nhd/derived/reach-little-pigeon-river.validate.json | full-JSON-parse-and-coordinate-check | 989 | da04b0a4bb0cee7b |
| data/nhd/derived/reach-little-river.audit.json | full-JSON-parse-and-coordinate-check | 60288 | 53042c119425d0a7 |
| data/nhd/derived/reach-little-river.geojson | full-JSON-parse-and-coordinate-check | 14734 | 665728e636e36132 |
| data/nhd/derived/reach-little-river.validate.json | full-JSON-parse-and-coordinate-check | 981 | d5a93bd942887ea4 |
| data/nhd/derived/reach-little-sequatchie-river.audit.json | full-JSON-parse-and-coordinate-check | 14556 | b0959a20e1c4d8d6 |
| data/nhd/derived/reach-little-sequatchie-river.geojson | full-JSON-parse-and-coordinate-check | 9605 | 86cd95d33d5bd0ca |
| data/nhd/derived/reach-little-sequatchie-river.validate.json | full-JSON-parse-and-coordinate-check | 988 | a93decaf1a0fe93f |
| data/nhd/derived/reach-little-tennessee-river.audit.json | full-JSON-parse-and-coordinate-check | 15579 | d1a4032f1c8d15ba |
| data/nhd/derived/reach-little-tennessee-river.geojson | full-JSON-parse-and-coordinate-check | 7532 | 771fbef9e9b7a851 |
| data/nhd/derived/reach-little-tennessee-river.validate.json | full-JSON-parse-and-coordinate-check | 990 | 6ee1b58daef83a9e |
| data/nhd/derived/reach-little-west-fork-creek.audit.json | full-JSON-parse-and-coordinate-check | 9836 | b6405ab05fd4a125 |
| data/nhd/derived/reach-little-west-fork-creek.geojson | full-JSON-parse-and-coordinate-check | 11317 | 8af4a456a10833fa |
| data/nhd/derived/reach-little-west-fork-creek.validate.json | full-JSON-parse-and-coordinate-check | 990 | d0b26c80420bd3f1 |
| data/nhd/derived/reach-mccutcheon-creek.audit.json | full-JSON-parse-and-coordinate-check | 2639 | 7c234ccbd079ad3d |
| data/nhd/derived/reach-mccutcheon-creek.geojson | full-JSON-parse-and-coordinate-check | 3756 | eaf10d517b59231b |
| data/nhd/derived/reach-mccutcheon-creek.validate.json | full-JSON-parse-and-coordinate-check | 983 | 002dfe456b2a6e97 |
| data/nhd/derived/reach-middle-prong-little-pigeon.audit.json | full-JSON-parse-and-coordinate-check | 7190 | 762a0849f8606c09 |
| data/nhd/derived/reach-middle-prong-little-pigeon.geojson | full-JSON-parse-and-coordinate-check | 4125 | 6d7062074a1e7a36 |
| data/nhd/derived/reach-middle-prong-little-pigeon.validate.json | full-JSON-parse-and-coordinate-check | 994 | 88b1a17c8e37ee80 |
| data/nhd/derived/reach-mill-creek-overton.audit.json | full-JSON-parse-and-coordinate-check | 6754 | 5beddee64bd40370 |
| data/nhd/derived/reach-mill-creek-overton.geojson | full-JSON-parse-and-coordinate-check | 6697 | 90cb5521aaf3eea3 |
| data/nhd/derived/reach-mill-creek-overton.validate.json | full-JSON-parse-and-coordinate-check | 985 | 7c38381e3f8c26bc |
| data/nhd/derived/reach-mississippi-river.audit.json | full-JSON-parse-and-coordinate-check | 17818 | 87c88f7e6fcd18f6 |
| data/nhd/derived/reach-mississippi-river.geojson | full-JSON-parse-and-coordinate-check | 14584 | d9a740996ddcabac |
| data/nhd/derived/reach-mississippi-river.validate.json | full-JSON-parse-and-coordinate-check | 987 | e74a03c8b5fc265c |
| data/nhd/derived/reach-mossy-creek-jefferson.audit.json | full-JSON-parse-and-coordinate-check | 2223 | 2c45fa82b732559d |
| data/nhd/derived/reach-mossy-creek-jefferson.geojson | full-JSON-parse-and-coordinate-check | 2803 | 2f3c7eee662cb645 |
| data/nhd/derived/reach-mossy-creek-jefferson.validate.json | full-JSON-parse-and-coordinate-check | 986 | 29689796d7909cfb |
| data/nhd/derived/reach-new-river.audit.json | full-JSON-parse-and-coordinate-check | 41189 | fbc12ad95d99bccd |
| data/nhd/derived/reach-new-river.geojson | full-JSON-parse-and-coordinate-check | 16203 | 99f59424e4180d23 |
| data/nhd/derived/reach-new-river.validate.json | full-JSON-parse-and-coordinate-check | 979 | 67f43dd346545375 |
| data/nhd/derived/reach-nolichucky-river.audit.json | full-JSON-parse-and-coordinate-check | 37346 | f7bb262dd46dfefe |
| data/nhd/derived/reach-nolichucky-river.geojson | full-JSON-parse-and-coordinate-check | 16653 | 9a8cc2a79278ce21 |
| data/nhd/derived/reach-nolichucky-river.validate.json | full-JSON-parse-and-coordinate-check | 987 | 4fa56ea5fb4820f8 |
| data/nhd/derived/reach-north-chickamauga-creek.audit.json | full-JSON-parse-and-coordinate-check | 15081 | a4f961da7aa1cce6 |
| data/nhd/derived/reach-north-chickamauga-creek.geojson | full-JSON-parse-and-coordinate-check | 10769 | 53a8a4cd9e30a998 |
| data/nhd/derived/reach-north-chickamauga-creek.validate.json | full-JSON-parse-and-coordinate-check | 991 | 8065666d220825d9 |
| data/nhd/derived/reach-north-fork-holston-river.audit.json | full-JSON-parse-and-coordinate-check | 34047 | 6f3e34796e9756a9 |
| data/nhd/derived/reach-north-fork-holston-river.geojson | full-JSON-parse-and-coordinate-check | 17311 | 59f67e817e56ad0e |
| data/nhd/derived/reach-north-fork-holston-river.validate.json | full-JSON-parse-and-coordinate-check | 994 | 11a016cb5debf169 |
| data/nhd/derived/reach-north-prong-barren-fork.audit.json | full-JSON-parse-and-coordinate-check | 4711 | a47aa24cdfb9e325 |
| data/nhd/derived/reach-north-prong-barren-fork.geojson | full-JSON-parse-and-coordinate-check | 4529 | 08c0b83ac415900e |
| data/nhd/derived/reach-north-prong-barren-fork.validate.json | full-JSON-parse-and-coordinate-check | 988 | 1e0ec2c1bfb8c0e5 |
| data/nhd/derived/reach-obed-river.audit.json | full-JSON-parse-and-coordinate-check | 26621 | 740b4fa3a6b15b06 |
| data/nhd/derived/reach-obed-river.geojson | full-JSON-parse-and-coordinate-check | 13847 | e6b81b62659cc664 |
| data/nhd/derived/reach-obed-river.validate.json | full-JSON-parse-and-coordinate-check | 980 | d02219233a628bc6 |
| data/nhd/derived/reach-obey-river.audit.json | full-JSON-parse-and-coordinate-check | 2060 | 198294d33a4d8989 |
| data/nhd/derived/reach-obey-river.geojson | full-JSON-parse-and-coordinate-check | 2328 | 2a0fd1a645a6d50d |
| data/nhd/derived/reach-obey-river.validate.json | full-JSON-parse-and-coordinate-check | 978 | 9b6ed127981fe6aa |
| data/nhd/derived/reach-obion-river.audit.json | full-JSON-parse-and-coordinate-check | 13641 | f8c639ef52eea09e |
| data/nhd/derived/reach-obion-river.geojson | full-JSON-parse-and-coordinate-check | 13536 | 5642d6f2b9a728d9 |
| data/nhd/derived/reach-obion-river.validate.json | full-JSON-parse-and-coordinate-check | 981 | 15576c951a2ad1e9 |
| data/nhd/derived/reach-ocoee-river.audit.json | full-JSON-parse-and-coordinate-check | 12686 | c6b7a0964ff85542 |
| data/nhd/derived/reach-ocoee-river.geojson | full-JSON-parse-and-coordinate-check | 9782 | 810bee742fa110c6 |
| data/nhd/derived/reach-ocoee-river.validate.json | full-JSON-parse-and-coordinate-check | 979 | c206599e6840156b |
| data/nhd/derived/reach-parksville-tailwater.audit.json | full-JSON-parse-and-coordinate-check | 3568 | 3fbf6159ce08683a |
| data/nhd/derived/reach-parksville-tailwater.geojson | full-JSON-parse-and-coordinate-check | 3545 | 1e8748923890c595 |
| data/nhd/derived/reach-parksville-tailwater.validate.json | full-JSON-parse-and-coordinate-check | 987 | 601768394e572a55 |
| data/nhd/derived/reach-pigeon-river.audit.json | full-JSON-parse-and-coordinate-check | 53480 | a43260dc9f1269d9 |
| data/nhd/derived/reach-pigeon-river.geojson | full-JSON-parse-and-coordinate-check | 14345 | 19e3cf931aa1c117 |
| data/nhd/derived/reach-pigeon-river.validate.json | full-JSON-parse-and-coordinate-check | 982 | d4725fc3ccf533e9 |
| data/nhd/derived/reach-pine-creek-dekalb.audit.json | full-JSON-parse-and-coordinate-check | 4943 | db8813bca0d764ca |
| data/nhd/derived/reach-pine-creek-dekalb.geojson | full-JSON-parse-and-coordinate-check | 5586 | 891d7c0b65d23311 |
| data/nhd/derived/reach-pine-creek-dekalb.validate.json | full-JSON-parse-and-coordinate-check | 984 | 3cf11f8e0eb06652 |
| data/nhd/derived/reach-piney-river-rhea.audit.json | full-JSON-parse-and-coordinate-check | 14980 | 9a9bafc7ad3ffa3a |
| data/nhd/derived/reach-piney-river-rhea.geojson | full-JSON-parse-and-coordinate-check | 9323 | 95b00ef615296eee |
| data/nhd/derived/reach-piney-river-rhea.validate.json | full-JSON-parse-and-coordinate-check | 981 | 02aece65c1e1bb77 |
| data/nhd/derived/reach-powell-river.audit.json | full-JSON-parse-and-coordinate-check | 24656 | ed0d4dd173d65175 |
| data/nhd/derived/reach-powell-river.geojson | full-JSON-parse-and-coordinate-check | 16037 | 8fe2f57f9bf6e428 |
| data/nhd/derived/reach-powell-river.validate.json | full-JSON-parse-and-coordinate-check | 983 | c91a2864c70691cd |
| data/nhd/derived/reach-puncheon-camp-creek.audit.json | full-JSON-parse-and-coordinate-check | 3241 | e06bf556c894c252 |
| data/nhd/derived/reach-puncheon-camp-creek.geojson | full-JSON-parse-and-coordinate-check | 3293 | 01f06430e65e8d63 |
| data/nhd/derived/reach-puncheon-camp-creek.validate.json | full-JSON-parse-and-coordinate-check | 984 | 7deb96b2006326ce |
| data/nhd/derived/reach-red-river-clarksville.audit.json | full-JSON-parse-and-coordinate-check | 5371 | 4ecb38e29a1ab0da |
| data/nhd/derived/reach-red-river-clarksville.geojson | full-JSON-parse-and-coordinate-check | 9144 | 9e71cd72818002d6 |
| data/nhd/derived/reach-red-river-clarksville.validate.json | full-JSON-parse-and-coordinate-check | 989 | 1c11ac2fdc8289db |
| data/nhd/derived/reach-reedy-creek.audit.json | full-JSON-parse-and-coordinate-check | 9861 | b6c274cdf84e36d6 |
| data/nhd/derived/reach-reedy-creek.geojson | full-JSON-parse-and-coordinate-check | 8485 | 1c50b41edbb13efe |
| data/nhd/derived/reach-reedy-creek.validate.json | full-JSON-parse-and-coordinate-check | 978 | df2b447b32ee996d |
| data/nhd/derived/reach-richardson-byrd-creek.audit.json | full-JSON-parse-and-coordinate-check | 3742 | 339b43b53db63d00 |
| data/nhd/derived/reach-richardson-byrd-creek.geojson | full-JSON-parse-and-coordinate-check | 3151 | 85e69993923f4803 |
| data/nhd/derived/reach-richardson-byrd-creek.validate.json | full-JSON-parse-and-coordinate-check | 988 | 41ed6f376159351d |
| data/nhd/derived/reach-roaring-fork.audit.json | full-JSON-parse-and-coordinate-check | 2938 | df2e76cd6c1357ea |
| data/nhd/derived/reach-roaring-fork.geojson | full-JSON-parse-and-coordinate-check | 3764 | e1347f957db685fa |
| data/nhd/derived/reach-roaring-fork.validate.json | full-JSON-parse-and-coordinate-check | 979 | 7d500ca1b2a4c5e8 |
| data/nhd/derived/reach-rocky-river.audit.json | full-JSON-parse-and-coordinate-check | 6230 | 1c305e15dd67e675 |
| data/nhd/derived/reach-rocky-river.geojson | full-JSON-parse-and-coordinate-check | 10380 | 9f5e678b0b0ad4ce |
| data/nhd/derived/reach-rocky-river.validate.json | full-JSON-parse-and-coordinate-check | 979 | cc27d098c9da6607 |
| data/nhd/derived/reach-salt-lick-creek.audit.json | full-JSON-parse-and-coordinate-check | 8779 | dc03fe94aec4dd6b |
| data/nhd/derived/reach-salt-lick-creek.geojson | full-JSON-parse-and-coordinate-check | 7527 | 256cfc2d759bc401 |
| data/nhd/derived/reach-salt-lick-creek.validate.json | full-JSON-parse-and-coordinate-check | 980 | f2889a07bbb03612 |
| data/nhd/derived/reach-sequatchie-river.audit.json | full-JSON-parse-and-coordinate-check | 40612 | 8b6e8167497d9087 |
| data/nhd/derived/reach-sequatchie-river.geojson | full-JSON-parse-and-coordinate-check | 13920 | 54912426d4b10787 |
| data/nhd/derived/reach-sequatchie-river.validate.json | full-JSON-parse-and-coordinate-check | 985 | 5463d39b4c07e7ac |
| data/nhd/derived/reach-shoal-creek.audit.json | full-JSON-parse-and-coordinate-check | 27708 | 0ade64d97078a9db |
| data/nhd/derived/reach-shoal-creek.geojson | full-JSON-parse-and-coordinate-check | 15779 | 118e92d3f1418295 |
| data/nhd/derived/reach-shoal-creek.validate.json | full-JSON-parse-and-coordinate-check | 979 | 5ae6706c9eead5e3 |
| data/nhd/derived/reach-sinking-creek-wilson.audit.json | full-JSON-parse-and-coordinate-check | 2183 | 3955cd0bbba604a9 |
| data/nhd/derived/reach-sinking-creek-wilson.geojson | full-JSON-parse-and-coordinate-check | 3464 | 32204f83e0184aa8 |
| data/nhd/derived/reach-sinking-creek-wilson.validate.json | full-JSON-parse-and-coordinate-check | 987 | 570190225ca7e2aa |
| data/nhd/derived/reach-south-fork-cumberland.audit.json | full-JSON-parse-and-coordinate-check | 9485 | b3ed796b3410cc08 |
| data/nhd/derived/reach-south-fork-cumberland.geojson | full-JSON-parse-and-coordinate-check | 5878 | f303208f50ad0987 |
| data/nhd/derived/reach-south-fork-cumberland.validate.json | full-JSON-parse-and-coordinate-check | 989 | 8e670d4570599515 |
| data/nhd/derived/reach-south-holston-river.audit.json | full-JSON-parse-and-coordinate-check | 4699 | 8cadbc79c80d641d |
| data/nhd/derived/reach-south-holston-river.geojson | full-JSON-parse-and-coordinate-check | 4550 | 3b6c1d5dc5855632 |
| data/nhd/derived/reach-south-holston-river.validate.json | full-JSON-parse-and-coordinate-check | 987 | f47e184b7e29b639 |
| data/nhd/derived/reach-spring-creek-polk.audit.json | full-JSON-parse-and-coordinate-check | 7228 | e9d7faa58f2d6819 |
| data/nhd/derived/reach-spring-creek-polk.geojson | full-JSON-parse-and-coordinate-check | 5961 | a6d5536ce81ca893 |
| data/nhd/derived/reach-spring-creek-polk.validate.json | full-JSON-parse-and-coordinate-check | 982 | b0057f7cbac21f0c |
| data/nhd/derived/reach-standing-rock-creek.audit.json | full-JSON-parse-and-coordinate-check | 5704 | c2f6cce0c117f302 |
| data/nhd/derived/reach-standing-rock-creek.geojson | full-JSON-parse-and-coordinate-check | 4831 | 42626fc4bc5d69a9 |
| data/nhd/derived/reach-standing-rock-creek.validate.json | full-JSON-parse-and-coordinate-check | 986 | 54da302666566dc7 |
| data/nhd/derived/reach-station-creek.audit.json | full-JSON-parse-and-coordinate-check | 2056 | 8b14a90a6c6ec4af |
| data/nhd/derived/reach-station-creek.geojson | full-JSON-parse-and-coordinate-check | 2837 | 2b63ea12dfa5fdcd |
| data/nhd/derived/reach-station-creek.validate.json | full-JSON-parse-and-coordinate-check | 979 | f9984739c420a46c |
| data/nhd/derived/reach-stones-river.audit.json | full-JSON-parse-and-coordinate-check | 2072 | 69e41692fbb51f05 |
| data/nhd/derived/reach-stones-river.geojson | full-JSON-parse-and-coordinate-check | 2101 | 0cde5ec82111e1b8 |
| data/nhd/derived/reach-stones-river.validate.json | full-JSON-parse-and-coordinate-check | 979 | 0c68eacc7e1dfa95 |
| data/nhd/derived/reach-stoney-creek-carter.audit.json | full-JSON-parse-and-coordinate-check | 21400 | a8589ae8100f1109 |
| data/nhd/derived/reach-stoney-creek-carter.geojson | full-JSON-parse-and-coordinate-check | 5772 | 4e6dcd5e198c3340 |
| data/nhd/derived/reach-stoney-creek-carter.validate.json | full-JSON-parse-and-coordinate-check | 984 | b7d1f3b1a5b48cba |
| data/nhd/derived/reach-sulfur-fork-creek.audit.json | full-JSON-parse-and-coordinate-check | 15994 | c5a7974cc6c286ba |
| data/nhd/derived/reach-sulfur-fork-creek.geojson | full-JSON-parse-and-coordinate-check | 12238 | f00a2602058b8677 |
| data/nhd/derived/reach-sulfur-fork-creek.validate.json | full-JSON-parse-and-coordinate-check | 985 | 96da02a56b87e423 |
| data/nhd/derived/reach-tellico-river.audit.json | full-JSON-parse-and-coordinate-check | 36907 | 12c22ecd180ae454 |
| data/nhd/derived/reach-tellico-river.geojson | full-JSON-parse-and-coordinate-check | 11659 | 406f765bff85a615 |
| data/nhd/derived/reach-tellico-river.validate.json | full-JSON-parse-and-coordinate-check | 983 | 680728fc130b2a3e |
| data/nhd/derived/reach-tennessee-river.audit.json | full-JSON-parse-and-coordinate-check | 56418 | 444a543e8ef60fed |
| data/nhd/derived/reach-tennessee-river.geojson | full-JSON-parse-and-coordinate-check | 14998 | 78ff5716aaccd004 |
| data/nhd/derived/reach-tennessee-river.validate.json | full-JSON-parse-and-coordinate-check | 985 | 18ee1b15e7c2dfe0 |
| data/nhd/derived/reach-trail-fork-big-creek.audit.json | full-JSON-parse-and-coordinate-check | 1226 | ce883182cc9baf7a |
| data/nhd/derived/reach-trail-fork-big-creek.geojson | full-JSON-parse-and-coordinate-check | 1426 | bd4a59205aa12f92 |
| data/nhd/derived/reach-trail-fork-big-creek.validate.json | full-JSON-parse-and-coordinate-check | 986 | cd9c12a9a48f6934 |
| data/nhd/derived/reach-tumbling-creek.audit.json | full-JSON-parse-and-coordinate-check | 4308 | 5f43961d516a4597 |
| data/nhd/derived/reach-tumbling-creek.geojson | full-JSON-parse-and-coordinate-check | 4497 | b5779021d30e660f |
| data/nhd/derived/reach-tumbling-creek.validate.json | full-JSON-parse-and-coordinate-check | 979 | f66f3bfb29998ced |
| data/nhd/derived/reach-upper-hills-creek.audit.json | full-JSON-parse-and-coordinate-check | 2482 | 5116a42ba2172129 |
| data/nhd/derived/reach-upper-hills-creek.geojson | full-JSON-parse-and-coordinate-check | 2804 | 4478fedcc05d9fc6 |
| data/nhd/derived/reach-upper-hills-creek.validate.json | full-JSON-parse-and-coordinate-check | 984 | bf99ece241961026 |
| data/nhd/derived/reach-upper-roan-creek.audit.json | full-JSON-parse-and-coordinate-check | 12814 | b78104f219856c3a |
| data/nhd/derived/reach-upper-roan-creek.geojson | full-JSON-parse-and-coordinate-check | 6304 | 1eff4664d21217bc |
| data/nhd/derived/reach-upper-roan-creek.validate.json | full-JSON-parse-and-coordinate-check | 984 | 6d551dac73d962af |
| data/nhd/derived/reach-watauga-river-wilbur-reach.audit.json | full-JSON-parse-and-coordinate-check | 2227 | 2c7f494639415d5e |
| data/nhd/derived/reach-watauga-river-wilbur-reach.geojson | full-JSON-parse-and-coordinate-check | 1600 | 36cf9d3652195d6c |
| data/nhd/derived/reach-watauga-river-wilbur-reach.validate.json | full-JSON-parse-and-coordinate-check | 992 | c2d4ae2f0978d7fe |
| data/nhd/derived/reach-watauga-river.audit.json | full-JSON-parse-and-coordinate-check | 9574 | 8e0f4be039d328cf |
| data/nhd/derived/reach-watauga-river.geojson | full-JSON-parse-and-coordinate-check | 8761 | 1fa749389309ccc6 |
| data/nhd/derived/reach-watauga-river.validate.json | full-JSON-parse-and-coordinate-check | 981 | c0fda370ee494198 |
| data/nhd/derived/reach-west-fork-stones-river.audit.json | full-JSON-parse-and-coordinate-check | 9912 | 11c09633ac8cc780 |
| data/nhd/derived/reach-west-fork-stones-river.geojson | full-JSON-parse-and-coordinate-check | 11491 | b701809d556980fd |
| data/nhd/derived/reach-west-fork-stones-river.validate.json | full-JSON-parse-and-coordinate-check | 991 | 89d6b8d0516d50d5 |
| data/nhd/derived/reach-west-prong-little-pigeon.audit.json | full-JSON-parse-and-coordinate-check | 34224 | 86b9bafbcd4ac0c8 |
| data/nhd/derived/reach-west-prong-little-pigeon.geojson | full-JSON-parse-and-coordinate-check | 13361 | 1ce9e07cf7ac4360 |
| data/nhd/derived/reach-west-prong-little-pigeon.validate.json | full-JSON-parse-and-coordinate-check | 993 | fa3371ecb9157f8a |
| data/nhd/derived/reach-white-oak-creek.audit.json | full-JSON-parse-and-coordinate-check | 18747 | 692b0fdebf6f19b1 |
| data/nhd/derived/reach-white-oak-creek.geojson | full-JSON-parse-and-coordinate-check | 10425 | ab4f6d45451b9b18 |
| data/nhd/derived/reach-white-oak-creek.validate.json | full-JSON-parse-and-coordinate-check | 984 | 3a4844ff6a1dfc08 |
| data/nhd/derived/reach-wolf-river-fentress.audit.json | full-JSON-parse-and-coordinate-check | 16528 | 11a749092abda4dc |
| data/nhd/derived/reach-wolf-river-fentress.geojson | full-JSON-parse-and-coordinate-check | 10604 | dc3ee0c06c4125b8 |
| data/nhd/derived/reach-wolf-river-fentress.validate.json | full-JSON-parse-and-coordinate-check | 987 | bedb3b6069fb3e10 |
| data/nhd/derived/reach-wolf-river-west-tennessee.audit.json | full-JSON-parse-and-coordinate-check | 55073 | 4e40da95621ccd91 |
| data/nhd/derived/reach-wolf-river-west-tennessee.geojson | full-JSON-parse-and-coordinate-check | 14776 | dc42a2dd1dbb3788 |
| data/nhd/derived/reach-wolf-river-west-tennessee.validate.json | full-JSON-parse-and-coordinate-check | 995 | 6892074a082c2a6b |
| data/nhd/derived/reference/rivers-baseline-1300194.geojson | full-JSON-parse-and-coordinate-check | 1829201 | 0b91f4ecd9247850 |
| data/nhd/derived/trace-results-chunk0.txt.json | full-JSON-parse-and-coordinate-check | 10196 | a83524244e066e3c |
| data/nhd/derived/trace-results-chunk1.txt.json | full-JSON-parse-and-coordinate-check | 9879 | 726400f224de8c84 |
| data/nhd/derived/trace-results-chunk2.txt.json | full-JSON-parse-and-coordinate-check | 10236 | 03ae28fb5374ccb5 |
| data/nhd/derived/trace-results-chunk3.txt.json | full-JSON-parse-and-coordinate-check | 10135 | 43c646d0f7413155 |
| data/nhd/derived/trace-specs.fix-boone-tailwater.json | full-JSON-parse-and-coordinate-check | 100 | 0d3b222bdc464576 |
| data/nhd/derived/trace-specs.fix-buffalo-river.json | full-JSON-parse-and-coordinate-check | 575 | f9ed0f18bd103066 |
| data/nhd/derived/trace-specs.fix-caney-fork-upper.json | full-JSON-parse-and-coordinate-check | 546 | aee28cb27d989346 |
| data/nhd/derived/trace-specs.fix-cumberland-river.json | full-JSON-parse-and-coordinate-check | 650 | 45be76218942e4ab |
| data/nhd/derived/trace-specs.fix-duck-river-lower.json | full-JSON-parse-and-coordinate-check | 715 | cedc4f76819dddc7 |
| data/nhd/derived/trace-specs.fix-duck-river-tailwater.json | full-JSON-parse-and-coordinate-check | 633 | eda61b22f8a33541 |
| data/nhd/derived/trace-specs.fix-elk-river-lower.json | full-JSON-parse-and-coordinate-check | 616 | 11d3028d283062c8 |
| data/nhd/derived/trace-specs.fix-french-broad-river.json | full-JSON-parse-and-coordinate-check | 683 | 5c738d1c3acd9aec |
| data/nhd/derived/trace-specs.fix-hiwassee-river.json | full-JSON-parse-and-coordinate-check | 643 | 6f1d52bbf85b8abc |
| data/nhd/derived/trace-specs.fix-little-tennessee-river.json | full-JSON-parse-and-coordinate-check | 748 | 52227532f7e7b524 |
| data/nhd/derived/trace-specs.fix-north-fork-holston-river.json | full-JSON-parse-and-coordinate-check | 100 | 2bab71b4dbdda5c6 |
| data/nhd/derived/trace-specs.fix-ocoee-river.json | full-JSON-parse-and-coordinate-check | 1037 | 072626f3b4c25355 |
| data/nhd/derived/trace-specs.fix-parksville-tailwater.json | full-JSON-parse-and-coordinate-check | 857 | 8959e44d7e6f9eea |
| data/nhd/derived/trace-specs.fix-pigeon-river.json | full-JSON-parse-and-coordinate-check | 734 | 4c37730bea77e1c7 |
| data/nhd/derived/trace-specs.fix-red-river-clarksville.json | full-JSON-parse-and-coordinate-check | 781 | 2582d84097292398 |
| data/nhd/derived/trace-specs.fix-richardson-byrd-creek.json | full-JSON-parse-and-coordinate-check | 656 | 9070690444010ea3 |
| data/nhd/derived/trace-specs.fix-south-fork-cumberland.json | full-JSON-parse-and-coordinate-check | 768 | 883c4e48d156d57e |
| data/nhd/derived/trace-specs.fix-south-holston-river.json | full-JSON-parse-and-coordinate-check | 111 | 2ba440aff400eeca |
| data/nhd/derived/trace-specs.fix-tennessee-river.json | full-JSON-parse-and-coordinate-check | 974 | c6cb55c8c77f8a0d |
| data/nhd/derived/trace-specs.fix-watauga-river-wilbur-reach.json | full-JSON-parse-and-coordinate-check | 106 | 8a4ca0bde5d9a234 |
| data/nhd/derived/trace-specs.fix2-borders.json | full-JSON-parse-and-coordinate-check | 1309 | 7f3f8d5f3c33bf3f |
| data/nhd/derived/trace-specs.json | full-JSON-parse-and-coordinate-check | 1629 | 61c7b98a4506113a |
| data/nhd/derived/validate/catalog-report.json | full-JSON-parse-and-coordinate-check | 171812 | 4292eb3add35608b |
| data/nhd/derived/validate/network-report.json | full-JSON-parse-and-coordinate-check | 562 | 37c604e8333c4bf6 |
| data/nhd/graphs/05050001.graph.json | full-JSON-parse-and-coordinate-check | 9146186 | e585d707800a3ee6 |
| data/nhd/graphs/05110002.graph.json | full-JSON-parse-and-coordinate-check | 7070962 | d3ab1487c1a57921 |
| data/nhd/graphs/05130101.graph.json | full-JSON-parse-and-coordinate-check | 8614242 | 96245cbe68d566ac |
| data/nhd/graphs/05130103.graph.json | full-JSON-parse-and-coordinate-check | 4440970 | 9cb8cfe5248d113f |
| data/nhd/graphs/05130104.graph.json | full-JSON-parse-and-coordinate-check | 6290973 | 588177097662fbc6 |
| data/nhd/graphs/05130105.graph.json | full-JSON-parse-and-coordinate-check | 2519383 | 0bc48cd079885f87 |
| data/nhd/graphs/05130106.graph.json | full-JSON-parse-and-coordinate-check | 2203350 | dede630c4796b886 |
| data/nhd/graphs/05130107.graph.json | full-JSON-parse-and-coordinate-check | 1439032 | 68613747c1348ca8 |
| data/nhd/graphs/05130108.graph.json | full-JSON-parse-and-coordinate-check | 4280697 | 40f0e39015b9531a |
| data/nhd/graphs/05130201.graph.json | full-JSON-parse-and-coordinate-check | 1837944 | 3fcabe5357786963 |
| data/nhd/graphs/05130202.graph.json | full-JSON-parse-and-coordinate-check | 1203341 | 10b72dc65723c555 |
| data/nhd/graphs/05130203.graph.json | full-JSON-parse-and-coordinate-check | 1331277 | 1a155b97dbab5942 |
| data/nhd/graphs/05130204.graph.json | full-JSON-parse-and-coordinate-check | 2880788 | ea8c26adabab5246 |
| data/nhd/graphs/05130205.graph.json | full-JSON-parse-and-coordinate-check | 5544577 | c11c9b1e63535a5b |
| data/nhd/graphs/05130206.graph.json | full-JSON-parse-and-coordinate-check | 2279715 | 6beaecb1777b23e3 |
| data/nhd/graphs/06010101.graph.json | full-JSON-parse-and-coordinate-check | 2841838 | b0fedc4233489556 |
| data/nhd/graphs/06010102.graph.json | full-JSON-parse-and-coordinate-check | 4724851 | e9650c613de5cba2 |
| data/nhd/graphs/06010103.graph.json | full-JSON-parse-and-coordinate-check | 4473108 | 1f03484a4c3b4b1c |
| data/nhd/graphs/06010104.graph.json | full-JSON-parse-and-coordinate-check | 2722477 | 8698019ab7333ea3 |
| data/nhd/graphs/06010105.graph.json | full-JSON-parse-and-coordinate-check | 24518230 | 256b18ae810e99d0 |
| data/nhd/graphs/06010106.graph.json | full-JSON-parse-and-coordinate-check | 3936546 | b4895840d3f00e17 |
| data/nhd/graphs/06010107.graph.json | full-JSON-parse-and-coordinate-check | 4836774 | d770ecd080e27048 |
| data/nhd/graphs/06010108.graph.json | full-JSON-parse-and-coordinate-check | 6748562 | e72f85976deb4d12 |
| data/nhd/graphs/06010201.graph.json | full-JSON-parse-and-coordinate-check | 5098496 | a74d6c05396ce7aa |
| data/nhd/graphs/06010202.graph.json | full-JSON-parse-and-coordinate-check | 7361493 | f96c581c6dad8407 |
| data/nhd/graphs/06010203.graph.json | full-JSON-parse-and-coordinate-check | 7167874 | 7fb8abe3bea1b118 |
| data/nhd/graphs/06010204.graph.json | full-JSON-parse-and-coordinate-check | 7911321 | d332df9239c68679 |
| data/nhd/graphs/06010205.graph.json | full-JSON-parse-and-coordinate-check | 6226799 | bdf0018a79dd2438 |
| data/nhd/graphs/06010206.graph.json | full-JSON-parse-and-coordinate-check | 2565282 | da50612deb6ee5c7 |
| data/nhd/graphs/06010207.graph.json | full-JSON-parse-and-coordinate-check | 2142236 | 0d4c7a383d286238 |
| data/nhd/graphs/06010208.graph.json | full-JSON-parse-and-coordinate-check | 2409661 | c543182b764bd378 |
| data/nhd/graphs/06020001.graph.json | full-JSON-parse-and-coordinate-check | 3932727 | b3976922ad0c9fe0 |
| data/nhd/graphs/06020002.graph.json | full-JSON-parse-and-coordinate-check | 6421450 | aa5fce8868352bd7 |
| data/nhd/graphs/06020003.graph.json | full-JSON-parse-and-coordinate-check | 2023069 | ace81ed2a3f567df |
| data/nhd/graphs/06020004.graph.json | full-JSON-parse-and-coordinate-check | 1392913 | 6cbe6d3b68f82c58 |
| data/nhd/graphs/06030001.graph.json | full-JSON-parse-and-coordinate-check | 3877409 | 9595f5c39aec6e57 |
| data/nhd/graphs/06030002.graph.json | full-JSON-parse-and-coordinate-check | 6861937 | 3f61dbfd568a169d |
| data/nhd/graphs/06030003.graph.json | full-JSON-parse-and-coordinate-check | 3206145 | 9be674a432097436 |
| data/nhd/graphs/06030004.graph.json | full-JSON-parse-and-coordinate-check | 2720562 | 053d2bec3c2c95ce |
| data/nhd/graphs/06030005.graph.json | full-JSON-parse-and-coordinate-check | 7365747 | 17c3f641b1b632ec |
| data/nhd/graphs/06040001.graph.json | full-JSON-parse-and-coordinate-check | 4873962 | 9b35fb22064590ad |
| data/nhd/graphs/06040002.graph.json | full-JSON-parse-and-coordinate-check | 3647742 | 95e4fd6a64812739 |
| data/nhd/graphs/06040003.graph.json | full-JSON-parse-and-coordinate-check | 5279877 | 3df9178c2c621706 |
| data/nhd/graphs/06040004.graph.json | full-JSON-parse-and-coordinate-check | 2573092 | 8dae04fa5ffdf624 |
| data/nhd/graphs/06040005.graph.json | full-JSON-parse-and-coordinate-check | 4867488 | cecc8c5c01f2c015 |
| data/nhd/graphs/06040006.graph.json | full-JSON-parse-and-coordinate-check | 2041520 | 3ea5458b378b733b |
| data/nhd/graphs/08010100.graph.json | full-JSON-parse-and-coordinate-check | 649280 | 44e552618e1059c4 |
| data/nhd/graphs/08010201.graph.json | full-JSON-parse-and-coordinate-check | 1857978 | daa569261b17e00e |
| data/nhd/graphs/08010202.graph.json | full-JSON-parse-and-coordinate-check | 1124748 | 8925ec6e3701d191 |
| data/nhd/graphs/08010203.graph.json | full-JSON-parse-and-coordinate-check | 1408248 | 46333294c473546a |
| data/nhd/graphs/08010204.graph.json | full-JSON-parse-and-coordinate-check | 903474 | 7101009e443b86eb |
| data/nhd/graphs/08010205.graph.json | full-JSON-parse-and-coordinate-check | 1119010 | 064222bdc47a30c3 |
| data/nhd/graphs/08010207.graph.json | full-JSON-parse-and-coordinate-check | 4089356 | 54248cf86bd2c876 |
| data/nhd/graphs/08010208.graph.json | full-JSON-parse-and-coordinate-check | 2244736 | 1deca82a46246cf6 |
| data/nhd/graphs/08010209.graph.json | full-JSON-parse-and-coordinate-check | 645032 | dca773a9637c9edc |
| data/nhd/graphs/08010210.graph.json | full-JSON-parse-and-coordinate-check | 1616718 | 0fda43659e3821ed |
| data/nhd/graphs/08010211.graph.json | full-JSON-parse-and-coordinate-check | 389317 | 4508510db71f9d97 |
| data/nhd/graphs/08030204.graph.json | full-JSON-parse-and-coordinate-check | 3120210 | 51c15330e254509d |
| data/nhd/hu8/05050001.jsonl | all-record-parse-and-coordinate-check | 7371572 | d34a1d84333f0684 |
| data/nhd/hu8/05050001.meta.json | full-JSON-parse-and-coordinate-check | 863 | 0fdb62a11e70bc6a |
| data/nhd/hu8/05050001.vaa.jsonl | all-record-parse-and-coordinate-check | 8019240 | 51d1d69ad219b1ae |
| data/nhd/hu8/05050001.waterbodies.jsonl | all-record-parse-and-coordinate-check | 4429 | 3bbb41594702ab13 |
| data/nhd/hu8/05110002.jsonl | all-record-parse-and-coordinate-check | 6312611 | ee8b033be2a47916 |
| data/nhd/hu8/05110002.meta.json | full-JSON-parse-and-coordinate-check | 862 | ff88b62867ff0476 |
| data/nhd/hu8/05110002.vaa.jsonl | all-record-parse-and-coordinate-check | 3794167 | c4e5859aa2267dad |
| data/nhd/hu8/05110002.waterbodies.jsonl | all-record-parse-and-coordinate-check | 1984 | 77c078174eb7f1c6 |
| data/nhd/hu8/05130101.jsonl | all-record-parse-and-coordinate-check | 6978757 | 40ba362ed56d6d46 |
| data/nhd/hu8/05130101.meta.json | full-JSON-parse-and-coordinate-check | 863 | 7639157457be2d68 |
| data/nhd/hu8/05130101.vaa.jsonl | all-record-parse-and-coordinate-check | 5310761 | aa832ea8549ac6bd |
| data/nhd/hu8/05130101.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2606 | 907c3d76fe28c65f |
| data/nhd/hu8/05130103.jsonl | all-record-parse-and-coordinate-check | 3643138 | 9ba343e8976108f8 |
| data/nhd/hu8/05130103.meta.json | full-JSON-parse-and-coordinate-check | 861 | 0dd77fa0395c60cb |
| data/nhd/hu8/05130103.vaa.jsonl | all-record-parse-and-coordinate-check | 2937297 | ceaad78592970df6 |
| data/nhd/hu8/05130103.waterbodies.jsonl | all-record-parse-and-coordinate-check | 642 | f98b54c43a4adce7 |
| data/nhd/hu8/05130104.jsonl | all-record-parse-and-coordinate-check | 5184168 | 1dbff8dc49e64a48 |
| data/nhd/hu8/05130104.meta.json | full-JSON-parse-and-coordinate-check | 862 | b847b88ebad13959 |
| data/nhd/hu8/05130104.vaa.jsonl | all-record-parse-and-coordinate-check | 3117206 | 04348f10a877d818 |
| data/nhd/hu8/05130104.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3061 | 9f410c43934f0138 |
| data/nhd/hu8/05130105.jsonl | all-record-parse-and-coordinate-check | 2050016 | 51842fd274cda6d4 |
| data/nhd/hu8/05130105.meta.json | full-JSON-parse-and-coordinate-check | 862 | dc8da7598728e3df |
| data/nhd/hu8/05130105.vaa.jsonl | all-record-parse-and-coordinate-check | 1344147 | db658ebf3140d24c |
| data/nhd/hu8/05130105.waterbodies.jsonl | all-record-parse-and-coordinate-check | 1761 | 3fab16043e729e8b |
| data/nhd/hu8/05130106.jsonl | all-record-parse-and-coordinate-check | 2294487 | b365b3ee709ff1b1 |
| data/nhd/hu8/05130106.meta.json | full-JSON-parse-and-coordinate-check | 862 | f25dbce3e81c9312 |
| data/nhd/hu8/05130106.vaa.jsonl | all-record-parse-and-coordinate-check | 1964922 | 0ad8b3b829b267ab |
| data/nhd/hu8/05130106.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2831 | 1773cddb9b3946d9 |
| data/nhd/hu8/05130107.jsonl | all-record-parse-and-coordinate-check | 1063386 | 3048f4a3a855063f |
| data/nhd/hu8/05130107.meta.json | full-JSON-parse-and-coordinate-check | 862 | fba22ee3997e22e2 |
| data/nhd/hu8/05130107.vaa.jsonl | all-record-parse-and-coordinate-check | 1279556 | f26fd1167d43036d |
| data/nhd/hu8/05130107.waterbodies.jsonl | all-record-parse-and-coordinate-check | 1902 | 60e4aeca98057350 |
| data/nhd/hu8/05130108.jsonl | all-record-parse-and-coordinate-check | 4449857 | b47e985b945cb23f |
| data/nhd/hu8/05130108.meta.json | full-JSON-parse-and-coordinate-check | 862 | c325cbf2997d2df8 |
| data/nhd/hu8/05130108.vaa.jsonl | all-record-parse-and-coordinate-check | 3181686 | 68df1edebfea1d5c |
| data/nhd/hu8/05130108.waterbodies.jsonl | all-record-parse-and-coordinate-check | 6189 | e008eee9e5745fcd |
| data/nhd/hu8/05130201.jsonl | all-record-parse-and-coordinate-check | 1919236 | 0bddced4949851fd |
| data/nhd/hu8/05130201.meta.json | full-JSON-parse-and-coordinate-check | 862 | f3b3e79efd1a0bf6 |
| data/nhd/hu8/05130201.vaa.jsonl | all-record-parse-and-coordinate-check | 1551601 | ffa443435c6f49d6 |
| data/nhd/hu8/05130201.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2228 | d7f9cda9e13b5321 |
| data/nhd/hu8/05130202.jsonl | all-record-parse-and-coordinate-check | 890491 | dd6d8483754c7de3 |
| data/nhd/hu8/05130202.meta.json | full-JSON-parse-and-coordinate-check | 862 | d952a510060d3b0c |
| data/nhd/hu8/05130202.vaa.jsonl | all-record-parse-and-coordinate-check | 1106190 | 04cc3e46c4f8e42f |
| data/nhd/hu8/05130202.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3700 | 5069129ad603a11c |
| data/nhd/hu8/05130203.jsonl | all-record-parse-and-coordinate-check | 991649 | bfb97003a431c4ac |
| data/nhd/hu8/05130203.meta.json | full-JSON-parse-and-coordinate-check | 861 | 5433624da1a34996 |
| data/nhd/hu8/05130203.vaa.jsonl | all-record-parse-and-coordinate-check | 1365880 | 7a4e9d960164af82 |
| data/nhd/hu8/05130203.waterbodies.jsonl | all-record-parse-and-coordinate-check | 1461 | 7428a90b47cd91f1 |
| data/nhd/hu8/05130204.jsonl | all-record-parse-and-coordinate-check | 2249248 | b909bb00ba9670b2 |
| data/nhd/hu8/05130204.meta.json | full-JSON-parse-and-coordinate-check | 862 | 4764bb1cef62d8b7 |
| data/nhd/hu8/05130204.vaa.jsonl | all-record-parse-and-coordinate-check | 2464247 | 4ece61d1fce18624 |
| data/nhd/hu8/05130204.waterbodies.jsonl | all-record-parse-and-coordinate-check | 5590 | 575ae8f86623cf60 |
| data/nhd/hu8/05130205.jsonl | all-record-parse-and-coordinate-check | 4275306 | 10913eb30dd9e3ce |
| data/nhd/hu8/05130205.meta.json | full-JSON-parse-and-coordinate-check | 863 | ee6e268fd98c3671 |
| data/nhd/hu8/05130205.vaa.jsonl | all-record-parse-and-coordinate-check | 5386380 | 6083ec54137cd133 |
| data/nhd/hu8/05130205.waterbodies.jsonl | all-record-parse-and-coordinate-check | 8472 | e68ae9a9c9794107 |
| data/nhd/hu8/05130206.jsonl | all-record-parse-and-coordinate-check | 1907828 | fa4c3fcdf9a549ab |
| data/nhd/hu8/05130206.meta.json | full-JSON-parse-and-coordinate-check | 862 | b3aa2bf96c3d0b0e |
| data/nhd/hu8/05130206.vaa.jsonl | all-record-parse-and-coordinate-check | 1923903 | afdc07749e2b82ce |
| data/nhd/hu8/05130206.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2219 | c879683db5b22a02 |
| data/nhd/hu8/06010101.jsonl | all-record-parse-and-coordinate-check | 2138913 | 258be422066066d1 |
| data/nhd/hu8/06010101.meta.json | full-JSON-parse-and-coordinate-check | 861 | 28a27198ba9cc9d0 |
| data/nhd/hu8/06010101.vaa.jsonl | all-record-parse-and-coordinate-check | 3597035 | cc1df282867d7622 |
| data/nhd/hu8/06010101.waterbodies.jsonl | all-record-parse-and-coordinate-check | 485 | 07d6906685a2d2b9 |
| data/nhd/hu8/06010102.jsonl | all-record-parse-and-coordinate-check | 3763657 | f3021515cfd67ba7 |
| data/nhd/hu8/06010102.meta.json | full-JSON-parse-and-coordinate-check | 862 | ddbb795a71f617bf |
| data/nhd/hu8/06010102.vaa.jsonl | all-record-parse-and-coordinate-check | 4021760 | 05fb2aea304f891b |
| data/nhd/hu8/06010102.waterbodies.jsonl | all-record-parse-and-coordinate-check | 1941 | 175fb808c21dac42 |
| data/nhd/hu8/06010103.jsonl | all-record-parse-and-coordinate-check | 3400208 | fba7e7ede9a25190 |
| data/nhd/hu8/06010103.meta.json | full-JSON-parse-and-coordinate-check | 862 | d64921b52f3b3a11 |
| data/nhd/hu8/06010103.vaa.jsonl | all-record-parse-and-coordinate-check | 3930336 | fc6a75f79fe4a8f7 |
| data/nhd/hu8/06010103.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2541 | bb483b9fdf37f149 |
| data/nhd/hu8/06010104.jsonl | all-record-parse-and-coordinate-check | 2885218 | e1045534bdc3b773 |
| data/nhd/hu8/06010104.meta.json | full-JSON-parse-and-coordinate-check | 862 | 9c1f6e5242368998 |
| data/nhd/hu8/06010104.vaa.jsonl | all-record-parse-and-coordinate-check | 4077407 | 68fa3f18050fd50c |
| data/nhd/hu8/06010104.waterbodies.jsonl | all-record-parse-and-coordinate-check | 4662 | 4de8ecbdeb9f7d75 |
| data/nhd/hu8/06010105.jsonl | all-record-parse-and-coordinate-check | 23393118 | bd2efef47e60b604 |
| data/nhd/hu8/06010105.meta.json | full-JSON-parse-and-coordinate-check | 866 | 7340aad172d5d817 |
| data/nhd/hu8/06010105.vaa.jsonl | all-record-parse-and-coordinate-check | 51191460 | a7cca09541b7e60d |
| data/nhd/hu8/06010105.waterbodies.jsonl | all-record-parse-and-coordinate-check | 20196 | 6652b1a3a2a3f507 |
| data/nhd/hu8/06010106.jsonl | all-record-parse-and-coordinate-check | 4183686 | 6a963b72d75af39f |
| data/nhd/hu8/06010106.meta.json | full-JSON-parse-and-coordinate-check | 862 | b4fbf58b1571f202 |
| data/nhd/hu8/06010106.vaa.jsonl | all-record-parse-and-coordinate-check | 5414106 | 3492421e3d2f8624 |
| data/nhd/hu8/06010106.waterbodies.jsonl | all-record-parse-and-coordinate-check | 1323 | 1e04963bab5c74e6 |
| data/nhd/hu8/06010107.jsonl | all-record-parse-and-coordinate-check | 4114404 | 645e56271c20f82e |
| data/nhd/hu8/06010107.meta.json | full-JSON-parse-and-coordinate-check | 863 | 358a30adcfb8789d |
| data/nhd/hu8/06010107.vaa.jsonl | all-record-parse-and-coordinate-check | 4967455 | 84a9acfb65771bbb |
| data/nhd/hu8/06010107.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2087 | fa83899c8b5164cb |
| data/nhd/hu8/06010108.jsonl | all-record-parse-and-coordinate-check | 7214615 | 97013723bcdd208f |
| data/nhd/hu8/06010108.meta.json | full-JSON-parse-and-coordinate-check | 863 | 4a2c048aa682fe8a |
| data/nhd/hu8/06010108.vaa.jsonl | all-record-parse-and-coordinate-check | 10358518 | 2556e946e18b4bf2 |
| data/nhd/hu8/06010108.waterbodies.jsonl | all-record-parse-and-coordinate-check | 5078 | fc2b9b4eabf51a23 |
| data/nhd/hu8/06010201.jsonl | all-record-parse-and-coordinate-check | 5368851 | e4f3dbf6e6f0ef08 |
| data/nhd/hu8/06010201.meta.json | full-JSON-parse-and-coordinate-check | 863 | 591da14daf8ec8e6 |
| data/nhd/hu8/06010201.vaa.jsonl | all-record-parse-and-coordinate-check | 5413969 | 59c587e9293e4ad2 |
| data/nhd/hu8/06010201.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3919 | 60408b124228dde0 |
| data/nhd/hu8/06010202.jsonl | all-record-parse-and-coordinate-check | 6527171 | e1b4002abd254880 |
| data/nhd/hu8/06010202.meta.json | full-JSON-parse-and-coordinate-check | 862 | ed591905482f2a90 |
| data/nhd/hu8/06010202.vaa.jsonl | all-record-parse-and-coordinate-check | 2156999 | d81da2f9062df914 |
| data/nhd/hu8/06010202.waterbodies.jsonl | all-record-parse-and-coordinate-check | 4986 | ca34af6b51392fc3 |
| data/nhd/hu8/06010203.jsonl | all-record-parse-and-coordinate-check | 6604934 | d0aa1a9f0a1f082a |
| data/nhd/hu8/06010203.meta.json | full-JSON-parse-and-coordinate-check | 862 | 0f975c6850031621 |
| data/nhd/hu8/06010203.vaa.jsonl | all-record-parse-and-coordinate-check | 3911093 | 19231b52ea3c39ed |
| data/nhd/hu8/06010203.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3041 | b55c6f662f4e7774 |
| data/nhd/hu8/06010204.jsonl | all-record-parse-and-coordinate-check | 6778727 | 3d2d450e30108498 |
| data/nhd/hu8/06010204.meta.json | full-JSON-parse-and-coordinate-check | 863 | a308ab1a11a8bcb7 |
| data/nhd/hu8/06010204.vaa.jsonl | all-record-parse-and-coordinate-check | 4297708 | 9f74946fc5acd0f5 |
| data/nhd/hu8/06010204.waterbodies.jsonl | all-record-parse-and-coordinate-check | 4396 | a1947c2b3980f4c8 |
| data/nhd/hu8/06010205.jsonl | all-record-parse-and-coordinate-check | 4815799 | e7a657e05ca20be9 |
| data/nhd/hu8/06010205.meta.json | full-JSON-parse-and-coordinate-check | 863 | 3c8d2c173b276678 |
| data/nhd/hu8/06010205.vaa.jsonl | all-record-parse-and-coordinate-check | 5832332 | 9c7b8152b0c1839c |
| data/nhd/hu8/06010205.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3057 | 51792f7dafc034df |
| data/nhd/hu8/06010206.jsonl | all-record-parse-and-coordinate-check | 2018026 | 9219b00cd5484870 |
| data/nhd/hu8/06010206.meta.json | full-JSON-parse-and-coordinate-check | 862 | 7f1b2a1815a8d77a |
| data/nhd/hu8/06010206.vaa.jsonl | all-record-parse-and-coordinate-check | 2360730 | b65bdccee25944ff |
| data/nhd/hu8/06010206.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2264 | 3e83bc40bae7cd55 |
| data/nhd/hu8/06010207.jsonl | all-record-parse-and-coordinate-check | 2260209 | 38122a7377d39a9b |
| data/nhd/hu8/06010207.meta.json | full-JSON-parse-and-coordinate-check | 862 | 7b15f49e17976813 |
| data/nhd/hu8/06010207.vaa.jsonl | all-record-parse-and-coordinate-check | 2548772 | 311ef8ff4654d66d |
| data/nhd/hu8/06010207.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2441 | 339b9f26f39d05a3 |
| data/nhd/hu8/06010208.jsonl | all-record-parse-and-coordinate-check | 2600023 | a268eeb14ff92a21 |
| data/nhd/hu8/06010208.meta.json | full-JSON-parse-and-coordinate-check | 862 | 1ce31f94beb78780 |
| data/nhd/hu8/06010208.vaa.jsonl | all-record-parse-and-coordinate-check | 3161584 | 6347def798d27628 |
| data/nhd/hu8/06010208.waterbodies.jsonl | all-record-parse-and-coordinate-check | 5329 | 89e7eb2afecedfb3 |
| data/nhd/hu8/06020001.jsonl | all-record-parse-and-coordinate-check | 4194956 | c89cb8f09448ab32 |
| data/nhd/hu8/06020001.meta.json | full-JSON-parse-and-coordinate-check | 863 | f49696492deecadb |
| data/nhd/hu8/06020001.vaa.jsonl | all-record-parse-and-coordinate-check | 6659669 | 4340bfcb63f384fa |
| data/nhd/hu8/06020001.waterbodies.jsonl | all-record-parse-and-coordinate-check | 10874 | 35ea49ac92c68112 |
| data/nhd/hu8/06020002.jsonl | all-record-parse-and-coordinate-check | 6839432 | d4c78116a6d93ee4 |
| data/nhd/hu8/06020002.meta.json | full-JSON-parse-and-coordinate-check | 863 | e3234e5d8114b3de |
| data/nhd/hu8/06020002.vaa.jsonl | all-record-parse-and-coordinate-check | 6590646 | f7f6658380a232e0 |
| data/nhd/hu8/06020002.waterbodies.jsonl | all-record-parse-and-coordinate-check | 9942 | 7a27afbbdec7f61e |
| data/nhd/hu8/06020003.jsonl | all-record-parse-and-coordinate-check | 2131612 | c6e51d73761d6c34 |
| data/nhd/hu8/06020003.meta.json | full-JSON-parse-and-coordinate-check | 862 | 9a441a50b8e45a9c |
| data/nhd/hu8/06020003.vaa.jsonl | all-record-parse-and-coordinate-check | 1423739 | c7ef3ab09df1ec97 |
| data/nhd/hu8/06020003.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3074 | adf37dd76ef2dab8 |
| data/nhd/hu8/06020004.jsonl | all-record-parse-and-coordinate-check | 1039191 | 67d00f569587dc68 |
| data/nhd/hu8/06020004.meta.json | full-JSON-parse-and-coordinate-check | 862 | 0a64f01dfe555be6 |
| data/nhd/hu8/06020004.vaa.jsonl | all-record-parse-and-coordinate-check | 1265117 | f855389168078bc8 |
| data/nhd/hu8/06020004.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2445 | 5bb1a92c1c8a23dc |
| data/nhd/hu8/06030001.jsonl | all-record-parse-and-coordinate-check | 4120562 | 84fa7a6690079864 |
| data/nhd/hu8/06030001.meta.json | full-JSON-parse-and-coordinate-check | 863 | 7c368e5cdfd884d4 |
| data/nhd/hu8/06030001.vaa.jsonl | all-record-parse-and-coordinate-check | 5159566 | 7cc480bcc50abde0 |
| data/nhd/hu8/06030001.waterbodies.jsonl | all-record-parse-and-coordinate-check | 6430 | e6a98cdaac915b2a |
| data/nhd/hu8/06030002.jsonl | all-record-parse-and-coordinate-check | 5295264 | 65149d55c9a4c1cc |
| data/nhd/hu8/06030002.meta.json | full-JSON-parse-and-coordinate-check | 863 | f57a50590cac1479 |
| data/nhd/hu8/06030002.vaa.jsonl | all-record-parse-and-coordinate-check | 7147242 | 24ea12591bdb1c3a |
| data/nhd/hu8/06030002.waterbodies.jsonl | all-record-parse-and-coordinate-check | 14178 | a008de95a1e49033 |
| data/nhd/hu8/06030003.jsonl | all-record-parse-and-coordinate-check | 3355188 | cc4624412c42704f |
| data/nhd/hu8/06030003.meta.json | full-JSON-parse-and-coordinate-check | 862 | 0c868526090aa5c7 |
| data/nhd/hu8/06030003.vaa.jsonl | all-record-parse-and-coordinate-check | 3239210 | c1b0f0f6a24d59df |
| data/nhd/hu8/06030003.waterbodies.jsonl | all-record-parse-and-coordinate-check | 5485 | 6d0ebf2a63c60ece |
| data/nhd/hu8/06030004.jsonl | all-record-parse-and-coordinate-check | 2874746 | 402be67c20e655b0 |
| data/nhd/hu8/06030004.meta.json | full-JSON-parse-and-coordinate-check | 862 | da56eb2f9c551f1e |
| data/nhd/hu8/06030004.vaa.jsonl | all-record-parse-and-coordinate-check | 3162102 | 08ee7d5c9067cc82 |
| data/nhd/hu8/06030004.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2106 | 9a7d951fdbf0b4a6 |
| data/nhd/hu8/06030005.jsonl | all-record-parse-and-coordinate-check | 5787824 | a5ac84c9b01c8b07 |
| data/nhd/hu8/06030005.meta.json | full-JSON-parse-and-coordinate-check | 863 | 2c8df844de4e3ad0 |
| data/nhd/hu8/06030005.vaa.jsonl | all-record-parse-and-coordinate-check | 8798291 | 777b0d48f1a37c21 |
| data/nhd/hu8/06030005.waterbodies.jsonl | all-record-parse-and-coordinate-check | 9057 | 7e02f8f18e4c08ed |
| data/nhd/hu8/06040001.jsonl | all-record-parse-and-coordinate-check | 5205526 | 91fe47609a6ffd77 |
| data/nhd/hu8/06040001.meta.json | full-JSON-parse-and-coordinate-check | 863 | 93f3156a267a5811 |
| data/nhd/hu8/06040001.vaa.jsonl | all-record-parse-and-coordinate-check | 6184358 | b83864a5e2d14908 |
| data/nhd/hu8/06040001.waterbodies.jsonl | all-record-parse-and-coordinate-check | 5710 | 3ec6f80f36c4ccca |
| data/nhd/hu8/06040002.jsonl | all-record-parse-and-coordinate-check | 3807297 | 351016666228d7e8 |
| data/nhd/hu8/06040002.meta.json | full-JSON-parse-and-coordinate-check | 862 | 32f5c0b130ef3664 |
| data/nhd/hu8/06040002.vaa.jsonl | all-record-parse-and-coordinate-check | 2922802 | 846e51dfdc294b65 |
| data/nhd/hu8/06040002.waterbodies.jsonl | all-record-parse-and-coordinate-check | 6048 | 546bbee7198c347c |
| data/nhd/hu8/06040003.jsonl | all-record-parse-and-coordinate-check | 5563315 | b63386d0209ba72c |
| data/nhd/hu8/06040003.meta.json | full-JSON-parse-and-coordinate-check | 863 | 4f49f70e9963ba6e |
| data/nhd/hu8/06040003.vaa.jsonl | all-record-parse-and-coordinate-check | 6034036 | 41f5a888275ce2a5 |
| data/nhd/hu8/06040003.waterbodies.jsonl | all-record-parse-and-coordinate-check | 9190 | 38ddb084d6dfb8f5 |
| data/nhd/hu8/06040004.jsonl | all-record-parse-and-coordinate-check | 2720521 | 6a59a0d360b7063f |
| data/nhd/hu8/06040004.meta.json | full-JSON-parse-and-coordinate-check | 862 | 1582146e13f1f91e |
| data/nhd/hu8/06040004.vaa.jsonl | all-record-parse-and-coordinate-check | 2801791 | 1d1568d2af97bd73 |
| data/nhd/hu8/06040004.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2426 | 0669a45c97fb093a |
| data/nhd/hu8/06040005.jsonl | all-record-parse-and-coordinate-check | 3587965 | 0ceace72b54f7109 |
| data/nhd/hu8/06040005.meta.json | full-JSON-parse-and-coordinate-check | 863 | 61d45691c710f4b1 |
| data/nhd/hu8/06040005.vaa.jsonl | all-record-parse-and-coordinate-check | 5341576 | 2e5b79f7964a9244 |
| data/nhd/hu8/06040005.waterbodies.jsonl | all-record-parse-and-coordinate-check | 5950 | 38529f4983e8222b |
| data/nhd/hu8/06040006.jsonl | all-record-parse-and-coordinate-check | 1532724 | d49d6dd2c6f137fe |
| data/nhd/hu8/06040006.meta.json | full-JSON-parse-and-coordinate-check | 862 | 565d2793050766a8 |
| data/nhd/hu8/06040006.vaa.jsonl | all-record-parse-and-coordinate-check | 2522341 | d5d3e209027ead71 |
| data/nhd/hu8/06040006.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2217 | 2a623bb5f34c28e5 |
| data/nhd/hu8/08010100.jsonl | all-record-parse-and-coordinate-check | 631837 | 20e90c782c85ee7c |
| data/nhd/hu8/08010100.meta.json | full-JSON-parse-and-coordinate-check | 862 | 21d57ef96bad0996 |
| data/nhd/hu8/08010100.vaa.jsonl | all-record-parse-and-coordinate-check | 1369395 | 5327a11fa254304a |
| data/nhd/hu8/08010100.waterbodies.jsonl | all-record-parse-and-coordinate-check | 19748 | a2ae17cc8a5510d1 |
| data/nhd/hu8/08010201.jsonl | all-record-parse-and-coordinate-check | 1487225 | 6bdc935f2ebcdd6f |
| data/nhd/hu8/08010201.meta.json | full-JSON-parse-and-coordinate-check | 863 | e0d4313347e68dd5 |
| data/nhd/hu8/08010201.vaa.jsonl | all-record-parse-and-coordinate-check | 4410862 | 6b633d3a143cd5f1 |
| data/nhd/hu8/08010201.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2404 | cea4e03be954c77c |
| data/nhd/hu8/08010202.jsonl | all-record-parse-and-coordinate-check | 818730 | bfc5e42fa5c6dabb |
| data/nhd/hu8/08010202.meta.json | full-JSON-parse-and-coordinate-check | 862 | 8ed7286942d302cc |
| data/nhd/hu8/08010202.vaa.jsonl | all-record-parse-and-coordinate-check | 3116697 | 384b7bc6742ae6a0 |
| data/nhd/hu8/08010202.waterbodies.jsonl | all-record-parse-and-coordinate-check | 8831 | 10f219290238d506 |
| data/nhd/hu8/08010203.jsonl | all-record-parse-and-coordinate-check | 1512009 | 9b1a4cab7efb10d5 |
| data/nhd/hu8/08010203.meta.json | full-JSON-parse-and-coordinate-check | 862 | 43b079211bf3d23c |
| data/nhd/hu8/08010203.vaa.jsonl | all-record-parse-and-coordinate-check | 3111482 | 6180e70bb8f86027 |
| data/nhd/hu8/08010203.waterbodies.jsonl | all-record-parse-and-coordinate-check | 7562 | 5571d30389c0a92b |
| data/nhd/hu8/08010204.jsonl | all-record-parse-and-coordinate-check | 981941 | 7f8f30e3dff09572 |
| data/nhd/hu8/08010204.meta.json | full-JSON-parse-and-coordinate-check | 862 | fb60b03d0d4836e2 |
| data/nhd/hu8/08010204.vaa.jsonl | all-record-parse-and-coordinate-check | 2370349 | 2e38461e08c4a270 |
| data/nhd/hu8/08010204.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3296 | a4e86004635bf933 |
| data/nhd/hu8/08010205.jsonl | all-record-parse-and-coordinate-check | 1204001 | 2992acfc16f12649 |
| data/nhd/hu8/08010205.meta.json | full-JSON-parse-and-coordinate-check | 862 | d13baaf61c73debf |
| data/nhd/hu8/08010205.vaa.jsonl | all-record-parse-and-coordinate-check | 2747463 | a0ee1bab4638ae47 |
| data/nhd/hu8/08010205.waterbodies.jsonl | all-record-parse-and-coordinate-check | 4060 | 26cc5c181373cb24 |
| data/nhd/hu8/08010207.jsonl | all-record-parse-and-coordinate-check | 4382945 | ae2217711602e4cf |
| data/nhd/hu8/08010207.meta.json | full-JSON-parse-and-coordinate-check | 863 | d89bdc8442564f9b |
| data/nhd/hu8/08010207.vaa.jsonl | all-record-parse-and-coordinate-check | 10610213 | 910a4bec1b21c0bb |
| data/nhd/hu8/08010207.waterbodies.jsonl | all-record-parse-and-coordinate-check | 3904 | 18364c2ba3951e06 |
| data/nhd/hu8/08010208.jsonl | all-record-parse-and-coordinate-check | 2389406 | 3489eb887fa46168 |
| data/nhd/hu8/08010208.meta.json | full-JSON-parse-and-coordinate-check | 864 | d8c7bce862acaaf2 |
| data/nhd/hu8/08010208.vaa.jsonl | all-record-parse-and-coordinate-check | 5052381 | 2193535f537c7659 |
| data/nhd/hu8/08010208.waterbodies.jsonl | all-record-parse-and-coordinate-check | 19379 | b1cb2518371d95fe |
| data/nhd/hu8/08010209.jsonl | all-record-parse-and-coordinate-check | 690115 | 00c4f0e4c7ca002f |
| data/nhd/hu8/08010209.meta.json | full-JSON-parse-and-coordinate-check | 861 | 7856faed910dbf09 |
| data/nhd/hu8/08010209.vaa.jsonl | all-record-parse-and-coordinate-check | 2498670 | 9b888fdce8bb882d |
| data/nhd/hu8/08010209.waterbodies.jsonl | all-record-parse-and-coordinate-check | 7084 | 55f3b04a342227a9 |
| data/nhd/hu8/08010210.jsonl | all-record-parse-and-coordinate-check | 1722743 | fd2f0b2298ae8edf |
| data/nhd/hu8/08010210.meta.json | full-JSON-parse-and-coordinate-check | 863 | b99ec3df02ce7ee9 |
| data/nhd/hu8/08010210.vaa.jsonl | all-record-parse-and-coordinate-check | 4922573 | aba03c83c18e2a77 |
| data/nhd/hu8/08010210.waterbodies.jsonl | all-record-parse-and-coordinate-check | 9140 | b6b43f049109097b |
| data/nhd/hu8/08010211.jsonl | all-record-parse-and-coordinate-check | 420963 | 1392ace0f7e53c7b |
| data/nhd/hu8/08010211.meta.json | full-JSON-parse-and-coordinate-check | 861 | b9f59e308c8f5f3e |
| data/nhd/hu8/08010211.vaa.jsonl | all-record-parse-and-coordinate-check | 2269425 | 48e9d4a51805a40e |
| data/nhd/hu8/08010211.waterbodies.jsonl | all-record-parse-and-coordinate-check | 2272 | 5e9dd831e1e2d4c5 |
| data/nhd/hu8/08030204.jsonl | all-record-parse-and-coordinate-check | 3380316 | 6cb587a968202e34 |
| data/nhd/hu8/08030204.meta.json | full-JSON-parse-and-coordinate-check | 859 | b35cd9ebeef49267 |
| data/nhd/hu8/08030204.vaa.jsonl | all-record-parse-and-coordinate-check | 0 | e3b0c44298fc1c14 |
| data/nhd/hu8/08030204.waterbodies.jsonl | all-record-parse-and-coordinate-check | 7969 | 1c6f6447de3a9439 |
| data/nhd/hu8/index.json | full-JSON-parse-and-coordinate-check | 47973 | f6ce9bff59034d49 |
| data/nhd/termini.json | full-JSON-parse-and-coordinate-check | 137825 | e844efd5727c1a0b |
| data/nhd/waterbodies/.gitignore | direct-read | 79 | 6cde1aa7026f7996 |
| data/nhd/waterbodies/NOTES.md | document-outline-and-link-index | 6702 | 08005f0adfa8219e |
| data/nhd/waterbodies/download-tn-waterbodies.mjs | program-structure-review | 6511 | 62a55a3ccc3d2f57 |
| data/nhd/waterbodies/extract-lake-polygons.mjs | program-structure-review | 14709 | b4e8811f5eb5708f |
| docs/ASSUMPTIONS.md | document-outline-and-link-index | 34575 | 55b7587e1f0eaa32 |
| docs/AUDIT-PROMPT.md | document-outline-and-link-index | 7964 | c85b0600a6a557ea |
| docs/BACKLOG.md | document-outline-and-link-index | 966 | 5a52afb04bbc3115 |
| docs/CODEBASE-GUIDE.md | document-outline-and-link-index | 41664 | 5103710784d06878 |
| docs/CONTINUITY-AUDIT.md | document-outline-and-link-index | 16112 | fda72db7512e9284 |
| docs/DATA-SOURCE-COVERAGE.md | document-outline-and-targeted-source-read | 29450 | 538a879c49c61f9e |
| docs/DATA-SOURCE-RESEARCH-PROMPT.md | document-outline-and-link-index | 12378 | 80bc5f937ada46f8 |
| docs/DESIGN.md | document-outline-and-link-index | 6647 | 297c321da388244d |
| docs/EXECUTION-PLAN.md | document-outline-and-link-index | 13257 | f3a9a61aee240138 |
| docs/FISHING-INFORMATION-SOURCES.md | document-outline-and-targeted-source-read | 17624 | cea2e2c5ab05fc62 |
| docs/GAUGE-CATALOG-GAPS.md | document-outline-and-link-index | 14086 | cbc225d0e92a7dae |
| docs/GEO-AUDIT.md | document-outline-and-link-index | 27700 | 27dd7ec5aaa23601 |
| docs/GEO-CONTINUITY-AUDIT-lane.md | document-outline-and-link-index | 15078 | e887e297653f22b5 |
| docs/HARDEN-AUDIT.md | document-outline-and-link-index | 10242 | 88c4b2265de92e46 |
| docs/INDEX.md | direct-read | 4669 | 29d4d7370f93644a |
| docs/KNOWN-ISSUES.md | direct-read | 30762 | a5dddf8e8e323971 |
| docs/LOGIC-AUDIT.md | document-outline-and-link-index | 16357 | a1a9b29a93c9268c |
| docs/NETWORK-ROLLOUT.md | document-outline-and-link-index | 7925 | dbde9133fe94e069 |
| docs/NHD-BEFORE-AFTER.md | document-outline-and-link-index | 11947 | 23449ddf576bdcde |
| docs/NHD-CONVENTIONS.md | document-outline-and-link-index | 17069 | b0f848dd5ca902ea |
| docs/OPERATIONS-ANALYTICS.md | document-outline-and-link-index | 4402 | 47982c166a89db21 |
| docs/REFERENCE-WATERBODY-INVENTORY.md | document-outline-and-link-index | 10749 | a19d1d89cf9bf58d |
| docs/REVIEW-PROMPT.md | direct-read | 13715 | 7967f5713f747793 |
| docs/SESSION-BRIEFS-STAGE-1.md | document-outline-and-link-index | 14271 | 4c4e5df449237586 |
| docs/SETUP.md | document-outline-and-link-index | 5071 | 9eb08e7d6b66dd75 |
| docs/SPECIES-REVIEW.md | document-outline-and-link-index | 25663 | 9197c328b4de4e9b |
| docs/STATEWIDE-RIVER-COVERAGE.md | document-outline-and-link-index | 84337 | bed6474d52183503 |
| docs/STILLWATER-COVERAGE.md | document-outline-and-link-index | 15290 | 8682805f9da843ce |
| docs/TN-DATA-SOURCES.md | direct-read | 8234 | 24557b2006a242f5 |
| docs/WATERBODY-GEOMETRY-CONTRACT.md | document-outline-and-link-index | 10594 | eefbae35762bad7f |
| docs/WATERBODY-IMPLEMENTATION-CHECKLIST.md | document-outline-and-link-index | 11022 | b00419de8730bbd5 |
| docs/adr/0000-template.md | document-outline-and-link-index | 835 | a79107bbd5b5e1f2 |
| docs/adr/0001-yaml-parser.md | document-outline-and-link-index | 1071 | 92b76f54ec8874e0 |
| docs/adr/0002-shop-report-photo-url.md | document-outline-and-link-index | 1494 | a253834f520b2987 |
| docs/adr/0003-portal-token-format.md | document-outline-and-link-index | 1951 | 9e4533a3ecaa1769 |
| docs/adr/0004-read-path-and-static-serving.md | document-outline-and-link-index | 2788 | 9ee6f004efe0f1c4 |
| docs/adr/0005-snapshot-url-layout.md | document-outline-and-link-index | 2946 | 2504de70cb29edc3 |
| docs/adr/0006-static-prefix-mounts.md | document-outline-and-link-index | 1786 | 0c462ed5a4766a57 |
| docs/adr/0007-fishability-contract.md | document-outline-and-link-index | 9697 | 3d5b582dfdd5662d |
| docs/adr/0008-accuracy-campaign-additive-contracts.md | document-outline-and-link-index | 1030 | 0f227b630bbf6664 |
| docs/adr/0009-hydrography-identity.md | document-outline-and-link-index | 2200 | 33cec62a5edb1883 |
| docs/adr/0010-documented-fishery-opportunity.md | document-outline-and-link-index | 5543 | 1b62736ce3cfabe8 |
| docs/adr/0011-reach-split-fishery-value.md | document-outline-and-link-index | 1615 | d1010fbdf11a4430 |
| docs/atlas-sources.md | document-outline-and-link-index | 17936 | 283ea0af364f570c |
| docs/atlas-validation.md | document-outline-and-link-index | 2392 | 20ad07c7e3bc63ae |
| docs/audits/EAST-SOUTHEAST-HYDROGRAPHY.md | document-outline-and-link-index | 27692 | 78b31b18720dfaf5 |
| docs/audits/S2-CONNECTIVITY-REPORT.md | document-outline-and-link-index | 66165 | 65fd1af4db11c1de |
| docs/audits/S2-DUPLICATES-REPORT.md | document-outline-and-link-index | 27635 | 46f8625f03bd3cf0 |
| docs/audits/S2-SELF-INTERSECTION-REPORT.md | document-outline-and-link-index | 58811 | c7af7bf2c139761a |
| docs/audits/UI-CONDITIONS-INTEGRATION.md | document-outline-and-link-index | 18648 | ea54e4a370c2e5bb |
| docs/audits/WEST-MIDDLE-HYDROGRAPHY.md | document-outline-and-link-index | 18854 | f7ab5c8009b3ddaf |
| docs/data-source-coverage.json | full-JSON-parse-and-coordinate-check | 373892 | 4bb78cf1163258b2 |
| docs/flow-orientation.md | document-outline-and-link-index | 7446 | 1e839984775d5fb3 |
| docs/imagery-provenance.csv | all-row-text-structure | 6588 | e2253adac2604cb6 |
| docs/lane-results/data-sources.md | document-outline-and-link-index | 11971 | 496ca8690ea5847c |
| docs/lane-results/geometry-lane.md | document-outline-and-link-index | 6596 | 791f016b4c0e8eba |
| docs/lane-results/ui.md | document-outline-and-link-index | 9534 | ae202d71ea65e6ba |
| docs/nhd-before-after/barren-fork-river.png | raster-full-decode | 126424 | f18aa375d12fc1aa |
| docs/nhd-before-after/barren-fork-river.svg | full-SVG-XML-parse-and-active-content-check | 8354 | a5c77828c119276b |
| docs/nhd-before-after/beaverdam-creek.png | raster-full-decode | 129777 | ad95006f3bc11632 |
| docs/nhd-before-after/beaverdam-creek.svg | full-SVG-XML-parse-and-active-content-check | 8709 | 7a3a51890ad54862 |
| docs/nhd-before-after/big-rock-creek.png | raster-full-decode | 129014 | d4ee3a5579cd480b |
| docs/nhd-before-after/big-rock-creek.svg | full-SVG-XML-parse-and-active-content-check | 9243 | 35a6c21b60bce19b |
| docs/nhd-before-after/boiling-fork-creek.png | raster-full-decode | 121299 | 855a6e7c60222de5 |
| docs/nhd-before-after/boiling-fork-creek.svg | full-SVG-XML-parse-and-active-content-check | 8839 | f2146870bd662c32 |
| docs/nhd-before-after/boone-tailwater.png | raster-full-decode | 138629 | 5ac1495125205326 |
| docs/nhd-before-after/boone-tailwater.svg | full-SVG-XML-parse-and-active-content-check | 5609 | adc701befb604c9e |
| docs/nhd-before-after/bradley-creek.png | raster-full-decode | 128659 | 256eb6b17533044e |
| docs/nhd-before-after/bradley-creek.svg | full-SVG-XML-parse-and-active-content-check | 7378 | 9e4ffc39937e27fc |
| docs/nhd-before-after/brush-creek-cocke.png | raster-full-decode | 120460 | 24794d855446abeb |
| docs/nhd-before-after/brush-creek-cocke.svg | full-SVG-XML-parse-and-active-content-check | 5078 | 3ed24f6f3db3f422 |
| docs/nhd-before-after/buffalo-creek-grainger.png | raster-full-decode | 126698 | efdf69530c743b6d |
| docs/nhd-before-after/buffalo-creek-grainger.svg | full-SVG-XML-parse-and-active-content-check | 5816 | 7a2a396fdd5a7970 |
| docs/nhd-before-after/buffalo-river.png | raster-full-decode | 147337 | a5c8370b07d2c986 |
| docs/nhd-before-after/buffalo-river.svg | full-SVG-XML-parse-and-active-content-check | 24564 | 33f957f047e0bf03 |
| docs/nhd-before-after/calfkiller-river.png | raster-full-decode | 133240 | 39a1aacab2159db3 |
| docs/nhd-before-after/calfkiller-river.svg | full-SVG-XML-parse-and-active-content-check | 11811 | fc5a67808c4ac3fb |
| docs/nhd-before-after/cane-creek.png | raster-full-decode | 103193 | e2990377dfa89c80 |
| docs/nhd-before-after/cane-creek.svg | full-SVG-XML-parse-and-active-content-check | 14276 | 845449cef4a7eada |
| docs/nhd-before-after/caney-fork-river.png | raster-full-decode | 143767 | 3cf413208d3499b8 |
| docs/nhd-before-after/caney-fork-river.svg | full-SVG-XML-parse-and-active-content-check | 7228 | 630e73a0b0f7c584 |
| docs/nhd-before-after/caney-fork-upper.png | raster-full-decode | 155220 | cea60a5fdc6bb7b0 |
| docs/nhd-before-after/caney-fork-upper.svg | full-SVG-XML-parse-and-active-content-check | 17583 | 1c16bdf61189cc10 |
| docs/nhd-before-after/charles-creek.png | raster-full-decode | 117811 | c9e4bb5ae33644b8 |
| docs/nhd-before-after/charles-creek.svg | full-SVG-XML-parse-and-active-content-check | 7738 | 2c945d37bd19d762 |
| docs/nhd-before-after/citico-creek.png | raster-full-decode | 127453 | ee824913d177f363 |
| docs/nhd-before-after/citico-creek.svg | full-SVG-XML-parse-and-active-content-check | 7322 | 25a692ef2c8740e3 |
| docs/nhd-before-after/clear-creek-obed.png | raster-full-decode | 130220 | 0e4bd585a479d1c6 |
| docs/nhd-before-after/clear-creek-obed.svg | full-SVG-XML-parse-and-active-content-check | 19786 | fbcfd55676ee19c9 |
| docs/nhd-before-after/clear-fork.png | raster-full-decode | 130871 | 5218741d87f861b1 |
| docs/nhd-before-after/clear-fork.svg | full-SVG-XML-parse-and-active-content-check | 8014 | 73f905d11ab4403d |
| docs/nhd-before-after/clinch-river.png | raster-full-decode | 101304 | 22876e06654425b4 |
| docs/nhd-before-after/clinch-river.svg | full-SVG-XML-parse-and-active-content-check | 21570 | a84056539d1192eb |
| docs/nhd-before-after/collins-river.png | raster-full-decode | 135121 | fa09161ed67331c6 |
| docs/nhd-before-after/collins-river.svg | full-SVG-XML-parse-and-active-content-check | 13831 | f546519e9288ee37 |
| docs/nhd-before-after/cosby-creek.png | raster-full-decode | 123038 | 02c64378992d20e4 |
| docs/nhd-before-after/cosby-creek.svg | full-SVG-XML-parse-and-active-content-check | 8069 | b578ad17abe68ffb |
| docs/nhd-before-after/cumberland-river.png | raster-full-decode | 145992 | a9ad8b546dab81f9 |
| docs/nhd-before-after/cumberland-river.svg | full-SVG-XML-parse-and-active-content-check | 36986 | c7452d9d9c3fead0 |
| docs/nhd-before-after/daddys-creek.png | raster-full-decode | 136597 | e1c00b9295ed5ec0 |
| docs/nhd-before-after/daddys-creek.svg | full-SVG-XML-parse-and-active-content-check | 11494 | c72de1bc0b9e46e9 |
| docs/nhd-before-after/doe-creek-johnson.png | raster-full-decode | 128030 | fe6e86b753ffb722 |
| docs/nhd-before-after/doe-creek-johnson.svg | full-SVG-XML-parse-and-active-content-check | 7960 | 82af8b1156da0de3 |
| docs/nhd-before-after/duck-river-tailwater.png | raster-full-decode | 136772 | 5ccdf2e9db74d827 |
| docs/nhd-before-after/duck-river-tailwater.svg | full-SVG-XML-parse-and-active-content-check | 8156 | 88f8a1ecbfd6e524 |
| docs/nhd-before-after/elk-river.png | raster-full-decode | 138462 | 7ebdb6c16766e42c |
| docs/nhd-before-after/elk-river.svg | full-SVG-XML-parse-and-active-content-check | 16648 | 7b49a7916019a2f7 |
| docs/nhd-before-after/french-broad-river.png | raster-full-decode | 136655 | 9d393a1ddeeaa03a |
| docs/nhd-before-after/french-broad-river.svg | full-SVG-XML-parse-and-active-content-check | 14079 | 451727308172ec86 |
| docs/nhd-before-after/ft-patrick-henry-tailwater.png | raster-full-decode | 133434 | 0a28560310498f7f |
| docs/nhd-before-after/ft-patrick-henry-tailwater.svg | full-SVG-XML-parse-and-active-content-check | 5072 | d12ff2679b4fb523 |
| docs/nhd-before-after/hiwassee-river.png | raster-full-decode | 137122 | ed2e22da7f07f93a |
| docs/nhd-before-after/hiwassee-river.svg | full-SVG-XML-parse-and-active-content-check | 11629 | e574109c81907c25 |
| docs/nhd-before-after/obey-river.png | raster-full-decode | 131885 | 5a90ad040eee6c25 |
| docs/nhd-before-after/obey-river.svg | full-SVG-XML-parse-and-active-content-check | 5195 | b685dbb68e74d52b |
| docs/nhd-before-after/parksville-tailwater.png | raster-full-decode | 123570 | e57e12c6cf6b593e |
| docs/nhd-before-after/parksville-tailwater.svg | full-SVG-XML-parse-and-active-content-check | 5499 | 66bacbe781c122bb |
| docs/nhd-before-after/south-holston-river.png | raster-full-decode | 135684 | 673c6a13a86532af |
| docs/nhd-before-after/south-holston-river.svg | full-SVG-XML-parse-and-active-content-check | 8981 | 5db2d5760a2a84b9 |
| docs/nhd-before-after/watauga-river.png | raster-full-decode | 132952 | de040a1ce871a7e1 |
| docs/nhd-before-after/watauga-river.svg | full-SVG-XML-parse-and-active-content-check | 11175 | 62c0f2d85611f97f |
| docs/reports/2026-09-13-audit-a-ground-truth.md | document-outline-and-link-index | 52124 | f32c8aa9fc9ee659 |
| docs/reports/2026-09-13-audit-b-water-sources.md | document-outline-and-link-index | 77237 | 5114990ea0ea6e6f |
| docs/reports/2026-09-13-audit-c-species-science.md | document-outline-and-link-index | 72075 | ef3aa4beb72b1587 |
| docs/reports/2026-09-13-campaign-implementation-plan.md | document-outline-and-link-index | 33087 | 8df05a5d7a537d76 |
| docs/reports/2026-09-22-evidence-backed-fisheries.md | document-outline-and-link-index | 13347 | 9fa0ca775ff6df4c |
| docs/reports/2026-09-22-evidence-branch-repair.md | document-outline-and-link-index | 44510 | 14e90f43de29fc03 |
| docs/reports/2026-09-24-low-confidence-evidence-pass.md | document-outline-and-link-index | 15438 | 01abc64ee5897b84 |
| docs/reports/2026-09-24-nine-water-deep-evidence-pass.md | document-outline-and-link-index | 39324 | f602e722d2640794 |
| docs/reports/2026-09-24-triage-apply.md | document-outline-and-link-index | 8920 | d5d164705494be6c |
| docs/reports/2026-09-25-completion-pass-134-waters.md | document-outline-and-link-index | 12502 | 04920e500722fb88 |
| docs/reports/2026-09-29-production-recovery.md | document-outline-and-link-index | 8903 | f89c38ebe75091d3 |
| docs/reports/ROLE-3-HANDOFF.md | document-outline-and-link-index | 7027 | 114f75afa97218c2 |
| docs/reports/ROLE-4-HANDOFF.md | document-outline-and-link-index | 4713 | f13612baf90d50d7 |
| docs/reports/hotfix-focus-wiring.md | document-outline-and-link-index | 4021 | 69690e2a59937644 |
| docs/reports/network-sweep-results.json | full-JSON-parse-and-coordinate-check | 10945 | f5e9b142c0f82519 |
| docs/reports/network-sweep/0505.png | raster-full-decode | 363125 | 9a6c06d93342ae3b |
| docs/reports/network-sweep/0511.png | raster-full-decode | 300869 | 7e0203c8d80b786d |
| docs/reports/network-sweep/0513aaa.png | raster-full-decode | 416385 | a7d6ba25ceebe916 |
| docs/reports/network-sweep/0513aab.png | raster-full-decode | 452109 | 80beb3eaea6a8640 |
| docs/reports/network-sweep/0513ab.png | raster-full-decode | 394310 | 8a00f2e1e7cd5ff2 |
| docs/reports/network-sweep/0513b.png | raster-full-decode | 348935 | b8b4b5c099152899 |
| docs/reports/network-sweep/0601aa.png | raster-full-decode | 455933 | dad00a022c97da34 |
| docs/reports/network-sweep/0601abaaa.png | raster-full-decode | 415788 | 60569f9feb467465 |
| docs/reports/network-sweep/0601abaab.png | raster-full-decode | 415232 | 37e8204c94737102 |
| docs/reports/network-sweep/0601abab.png | raster-full-decode | 502859 | e4e755fbf3996dd4 |
| docs/reports/network-sweep/0601abb.png | raster-full-decode | 493399 | f9aeeab7bb71ee92 |
| docs/reports/network-sweep/0601baa.png | raster-full-decode | 405633 | 85750c22c1d856e4 |
| docs/reports/network-sweep/0601bab.png | raster-full-decode | 539580 | e5a9ca7dec519ad9 |
| docs/reports/network-sweep/0601bb.png | raster-full-decode | 400656 | d2f6242d447dba35 |
| docs/reports/network-sweep/0602a.png | raster-full-decode | 545001 | 4bfbe7ddd5ce36e8 |
| docs/reports/network-sweep/0602b.png | raster-full-decode | 476314 | 282b06bdd81b74e1 |
| docs/reports/network-sweep/0603a.png | raster-full-decode | 285534 | 5bddd4ede51a7049 |
| docs/reports/network-sweep/0603b.png | raster-full-decode | 394566 | fac1ad040466eb9a |
| docs/reports/network-sweep/0604a.png | raster-full-decode | 395037 | e2c2405ac34aacb4 |
| docs/reports/network-sweep/0604b.png | raster-full-decode | 394116 | bdc24923dcc9612a |
| docs/reports/network-sweep/0801a.png | raster-full-decode | 280594 | fab668587834f068 |
| docs/reports/network-sweep/0801b.png | raster-full-decode | 256409 | 16510acde7f36d72 |
| docs/reports/network-sweep/0803.png | raster-full-decode | 254546 | 9760632187b7e8b2 |
| docs/reports/review-2026-09-11.md | document-outline-and-link-index | 37321 | 4d9b7e86305cec21 |
| docs/reports/role-2-handoff.md | document-outline-and-link-index | 4338 | 84743fbba3920854 |
| docs/reports/stage1-session-a.md | document-outline-and-link-index | 12367 | ffbb11f70f688c83 |
| docs/reports/stage1-session-b.md | document-outline-and-link-index | 12548 | 463cdbb16c45f3d1 |
| docs/reports/stage1-session-c.md | document-outline-and-link-index | 6488 | dd79e7cc60702344 |
| docs/reports/stage2-session-a.md | document-outline-and-link-index | 7906 | fc23d3aec8f44620 |
| docs/reports/stage2-session-b.md | document-outline-and-link-index | 6714 | f418e0577ff6ab64 |
| docs/reports/stage2-session-c.md | document-outline-and-link-index | 7804 | 5af1accac2ff64e7 |
| docs/reports/stage3-session-a.md | document-outline-and-link-index | 7934 | 6fcb42c83d52a449 |
| docs/reports/stage3-session-b.md | document-outline-and-link-index | 8516 | b597ace01db4c476 |
| docs/reports/stage3-session-c.md | document-outline-and-link-index | 5956 | c4e9473bff82a3b8 |
| docs/reports/stage4-session-a.md | document-outline-and-link-index | 5803 | 112ee3b56eea01eb |
| docs/reports/stage4-session-b.md | document-outline-and-link-index | 5765 | a4611a02f802a4d9 |
| docs/reports/stage4-session-c.md | document-outline-and-link-index | 4871 | 87126f19a625424f |
| docs/reports/stage5-session-a.md | document-outline-and-link-index | 13614 | 563babdf6da59df7 |
| docs/reports/stage5-session-b.md | document-outline-and-link-index | 4451 | b9e2edc4fc6a5735 |
| docs/reports/stage5-session-c.md | document-outline-and-link-index | 5858 | 56303072c3568580 |
| docs/research/2026-09-15-wave-ledgers/DIFF-REPORT.md | document-outline-and-link-index | 9160 | b1eea7b966146011 |
| docs/research/2026-09-15-wave-ledgers/README.md | document-outline-and-link-index | 1919 | b7f6f1ff4d59c190 |
| docs/research/2026-09-15-wave-ledgers/SOURCES-LEDGER-WAVE1-TAILWATERS-LAKES.md | document-outline-and-link-index | 138724 | 9cc8530743035ab6 |
| docs/research/2026-09-15-wave-ledgers/SOURCES-LEDGER-WAVE2-RIVERS-PONDS.md | document-outline-and-link-index | 152885 | b87e399434f83d65 |
| docs/research/2026-09-15-wave-ledgers/SOURCES-LEDGER-WAVE3-CREEKS.md | document-outline-and-link-index | 258472 | 8e58aa8f348e4e96 |
| docs/research/2026-09-15-wave-ledgers/ledger/diff.json | full-JSON-parse-and-coordinate-check | 153995 | 8944663d0f2b873f |
| docs/research/2026-09-15-wave-ledgers/ledger/waters.json | full-JSON-parse-and-coordinate-check | 891560 | 2c211f0aeedb78a4 |
| docs/research/2026-09-16-programmatic-season-audit.md | document-outline-and-link-index | 28138 | 6d0552da007a3889 |
| docs/research/2026-09-22-fishery-opportunities/ADJUDICATION-BRIEF.md | document-outline-and-link-index | 12930 | b2afe06eca04b384 |
| docs/research/2026-09-22-fishery-opportunities/OWNER-RULINGS-2026-09-24.md | document-outline-and-link-index | 2690 | 33dd7278ce9b70df |
| docs/research/2026-09-22-fishery-opportunities/captures/source-log.json | full-JSON-parse-and-coordinate-check | 14336 | c6944621cb9ac0ea |
| docs/research/2026-09-22-fishery-opportunities/captures/tu-trail-fork-2021.html | full-HTML-parse-and-structure-review | 262085 | 3ea555b98c86f35c |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-boone-lake.html | full-HTML-parse-and-structure-review | 67753 | 796534d798088f47 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-cherokee-lake.html | full-HTML-parse-and-structure-review | 75125 | babbef1b4a2a093a |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-chickamauga-lake.html | full-HTML-parse-and-structure-review | 82575 | 7ae4981475bc87ab |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-douglas-lake.html | full-HTML-parse-and-structure-review | 70332 | 3bc58c23bddfaa7f |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-duck-river-lower.html | full-HTML-parse-and-structure-review | 70280 | 93150c5d6d724b6c |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-fort-loudoun-lake.html | full-HTML-parse-and-structure-review | 69930 | 85a18bfef718790a |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-fort-patrick-henry-lake.html | full-HTML-parse-and-structure-review | 59847 | a5f91109a9d8ba1f |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-melton-hill-lake.html | full-HTML-parse-and-structure-review | 69833 | 874e1b35fb64a104 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-nickajack-lake.html | full-HTML-parse-and-structure-review | 77193 | 7d65fd49c3b7f1fa |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-norris-lake.html | full-HTML-parse-and-structure-review | 71795 | fe23cbe33c47674e |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-parksville-lake.html | full-HTML-parse-and-structure-review | 74428 | c82d4010f4665bc0 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-south-holston-lake.html | full-HTML-parse-and-structure-review | 68595 | 725a4bb9397cfe80 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-watauga-lake.html | full-HTML-parse-and-structure-review | 69323 | da814efc3a81c5e7 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-watts-bar-lake.html | full-HTML-parse-and-structure-review | 87595 | e95e47844b87ef8e |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-itemdata.json | full-JSON-parse-and-coordinate-check | 91004 | 86d4c1ea5cbf21a5 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-forecast-text.md | document-outline-and-link-index | 56949 | 9e6854b06aee5fef |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-recent-releases-2024-06-07-wayback.json | full-JSON-parse-and-coordinate-check | 4142 | b017587697347d06 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-recent-releases.json | full-JSON-parse-and-coordinate-check | 779 | 87cd13a2f5626f86 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-recent-report-page-2024-06-07-wayback.html | full-HTML-parse-and-structure-review | 107942 | b3abfd16b1f50a6f |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-schedule.json | full-JSON-parse-and-coordinate-check | 108620 | 278c1b51420fb157 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-stock-locations-meta.json | full-JSON-parse-and-coordinate-check | 24003 | a615809d809f2ef7 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-stock-locations.json | full-JSON-parse-and-coordinate-check | 513600 | 1a9233db18ec0128 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.html | full-HTML-parse-and-structure-review | 87592 | 7880a1be91c44fd5 |
| docs/research/2026-09-22-fishery-opportunities/captures/twra-trout-page.txt | captured-source-text-inventory | 32883 | e7970541ecdaca3c |
| docs/research/2026-09-22-fishery-opportunities/ledger.json | full-JSON-parse-and-coordinate-check | 2809146 | 831c045f2f00e7cb |
| docs/research/2026-09-22-fishery-opportunities/ledger.seed.json | full-JSON-parse-and-coordinate-check | 1783621 | 0e061663b3c0256e |
| docs/research/2026-09-22-fishery-opportunities/owner-corrections-report.json | full-JSON-parse-and-coordinate-check | 31426 | 3aedb68ed6b909db |
| docs/research/2026-09-22-fishery-opportunities/owner-triage.json | full-JSON-parse-and-coordinate-check | 333104 | 62c1c6aa493bf668 |
| docs/research/2026-09-22-fishery-opportunities/owner-triage.md | document-outline-and-link-index | 237015 | 2b9f7eb53d3e1e1b |
| docs/research/2026-09-22-fishery-opportunities/prior-leads.json | full-JSON-parse-and-coordinate-check | 958403 | bb862660b73b7da4 |
| docs/research/2026-09-22-fishery-opportunities/schedule-location-aliases.json | full-JSON-parse-and-coordinate-check | 12551 | d3e390184726764c |
| docs/research/2026-09-24-mtff-source-assessment.md | document-outline-and-link-index | 4887 | 9f35ee2b903246ee |
| docs/research/2026-09-27-evidence-review/EVIDENCE-REVIEW-190.html | full-HTML-parse-and-structure-review | 865967 | 8989e77c43a1d12e |
| docs/research/2026-09-27-evidence-review/evidence-decisions-data.json | full-JSON-parse-and-coordinate-check | 852935 | 7bec0f5dbbaa22ae |
| docs/research/2026-09-27-evidence-review/evidence-review.mjs | program-structure-review | 28785 | cf2d0be4f2f7468f |
| docs/research/SPECIES-CLASSIFICATION.md | document-outline-and-link-index | 60386 | dd662e4c0c9f5192 |
| docs/research/STOCKING-VERIFY.html | full-HTML-parse-and-structure-review | 95673 | 91d6c78060cbfa3b |
| docs/research/TN-TROUT-WATERWAYS-2026-09.md | document-outline-and-link-index | 25477 | 4e35bc1627c215e7 |
| docs/research/_notes/corroboration.md | document-outline-and-link-index | 23387 | fb68bb4c22a13a45 |
| docs/research/_notes/east-tailwaters-tva.md | document-outline-and-link-index | 24795 | 6f06e3f8a1723f6f |
| docs/research/_notes/east-wild-brook.md | document-outline-and-link-index | 24376 | 26eac6a413f8f0b9 |
| docs/research/_notes/middle-tn.md | document-outline-and-link-index | 32151 | 51cc083d49a1f9e3 |
| docs/research/_notes/twra-official.md | document-outline-and-link-index | 27622 | 7f6b811702b8c84a |
| docs/research/_notes/west-tn.md | document-outline-and-link-index | 19241 | ee63372198387492 |
| docs/research/build-classification.py | program-structure-review | 85991 | 257062d16a0fe185 |
| docs/research/completion-20260925/barren-fork-river.md | document-outline-and-link-index | 14539 | b495fa9f1d025c04 |
| docs/research/completion-20260925/beaverdam-creek.md | document-outline-and-link-index | 17830 | b8d617667b3658db |
| docs/research/completion-20260925/beech-lake.md | document-outline-and-link-index | 7493 | e16d67999b69be37 |
| docs/research/completion-20260925/big-rock-creek.md | document-outline-and-link-index | 10943 | a0e9569facf340b6 |
| docs/research/completion-20260925/big-soddy-creek.md | document-outline-and-link-index | 14050 | 913867137e91699d |
| docs/research/completion-20260925/blackburn-fork.md | document-outline-and-link-index | 8281 | 8970442d5bec9808 |
| docs/research/completion-20260925/boiling-fork-creek.md | document-outline-and-link-index | 9029 | 842212b93d454f28 |
| docs/research/completion-20260925/boone-lake.md | document-outline-and-link-index | 14504 | 37f1d19fa858647c |
| docs/research/completion-20260925/boone-tailwater.md | document-outline-and-link-index | 26765 | 888185eda4a07771 |
| docs/research/completion-20260925/brush-creek-cocke.md | document-outline-and-link-index | 14438 | 5fe96cfcd08ec1ee |
| docs/research/completion-20260925/buffalo-creek-grainger.md | document-outline-and-link-index | 19430 | 1d617895b6aef228 |
| docs/research/completion-20260925/buffalo-river.md | document-outline-and-link-index | 9388 | 0e795c5181d3acee |
| docs/research/completion-20260925/calderwood-lake.md | document-outline-and-link-index | 19039 | d0849bebaad94ce5 |
| docs/research/completion-20260925/calfkiller-river.md | document-outline-and-link-index | 16284 | 746bc639ed05a3db |
| docs/research/completion-20260925/cameron-brown-lake.md | document-outline-and-link-index | 5827 | 5fd0e711cf8ad26b |
| docs/research/completion-20260925/cane-creek-hickman-perry.md | document-outline-and-link-index | 10351 | 9506e57bc87349f5 |
| docs/research/completion-20260925/cane-creek.md | document-outline-and-link-index | 10519 | 2c19f56bd179899f |
| docs/research/completion-20260925/caney-fork-river.md | document-outline-and-link-index | 31438 | 72c8d5cfff403fbe |
| docs/research/completion-20260925/caney-fork-upper.md | document-outline-and-link-index | 9674 | e093519d6e83896b |
| docs/research/completion-20260925/center-hill-lake.md | document-outline-and-link-index | 7753 | 1991b46be0c681b3 |
| docs/research/completion-20260925/charles-creek.md | document-outline-and-link-index | 13436 | 7fdb01272dde7b8b |
| docs/research/completion-20260925/cherokee-lake.md | document-outline-and-link-index | 14834 | a9508066cb3a7cbd |
| docs/research/completion-20260925/chickamauga-lake.md | document-outline-and-link-index | 4138 | 85fc0d5bda0b7090 |
| docs/research/completion-20260925/chilhowee-lake.md | document-outline-and-link-index | 13839 | 4fa7c4d18b8bf76e |
| docs/research/completion-20260925/citico-creek.md | document-outline-and-link-index | 16633 | a4d42f4bc74fba40 |
| docs/research/completion-20260925/clear-creek-obed.md | document-outline-and-link-index | 8250 | 28d2b6dac224ceb1 |
| docs/research/completion-20260925/clinch-river.md | document-outline-and-link-index | 28636 | 310da0648e0f63e8 |
| docs/research/completion-20260925/collins-river.md | document-outline-and-link-index | 14812 | 550a782b25a480fc |
| docs/research/completion-20260925/conasauga-river.md | document-outline-and-link-index | 8188 | 1a76cb83613cb661 |
| docs/research/completion-20260925/cosby-creek.md | document-outline-and-link-index | 11928 | 71a792cf15c08821 |
| docs/research/completion-20260925/covington-fbc-pond.md | document-outline-and-link-index | 4857 | ddc5ba23180dda86 |
| docs/research/completion-20260925/cumberland-river.md | document-outline-and-link-index | 7967 | 8c75856de6190cb2 |
| docs/research/completion-20260925/daddys-creek.md | document-outline-and-link-index | 7252 | c00c71142d5caf00 |
| docs/research/completion-20260925/dale-hollow-lake.md | document-outline-and-link-index | 22679 | 178410820b46ffcf |
| docs/research/completion-20260925/doe-creek-johnson.md | document-outline-and-link-index | 18137 | 842efc993eef43c4 |
| docs/research/completion-20260925/doe-river.md | document-outline-and-link-index | 17292 | f6f91e10db6c0a10 |
| docs/research/completion-20260925/douglas-lake.md | document-outline-and-link-index | 7488 | e7dba64d03bf1cb6 |
| docs/research/completion-20260925/duck-river-lower.md | document-outline-and-link-index | 13085 | a9a14805a47a7904 |
| docs/research/completion-20260925/duck-river-mouth.md | document-outline-and-link-index | 12658 | 0fa044e0c443346f |
| docs/research/completion-20260925/duck-river-tailwater.md | document-outline-and-link-index | 16441 | 312f9ebfb8230d85 |
| docs/research/completion-20260925/east-fork-obey-river.md | document-outline-and-link-index | 10622 | e7f845045cd42084 |
| docs/research/completion-20260925/east-fork-shoal-creek.md | document-outline-and-link-index | 13054 | a6f22c8871fd0201 |
| docs/research/completion-20260925/edmund-orgill-lake.md | document-outline-and-link-index | 5144 | 5f058c7cc7c87814 |
| docs/research/completion-20260925/elk-river.md | document-outline-and-link-index | 31230 | 236439656f326842 |
| docs/research/completion-20260925/emory-river.md | document-outline-and-link-index | 10677 | 9bf1db9a2d8b3f3d |
| docs/research/completion-20260925/fletchers-fork.md | document-outline-and-link-index | 8289 | eccc19085f35c5f6 |
| docs/research/completion-20260925/forge-creek-johnson.md | document-outline-and-link-index | 15182 | bf022ffc60e712d7 |
| docs/research/completion-20260925/fort-loudoun-lake.md | document-outline-and-link-index | 7882 | 653eae3d585b5d36 |
| docs/research/completion-20260925/french-broad-river.md | document-outline-and-link-index | 10731 | ac04d8c9808a21a1 |
| docs/research/completion-20260925/ft-patrick-henry-tailwater.md | document-outline-and-link-index | 25260 | cd10b2c8a83ec97f |
| docs/research/completion-20260925/gap-creek-claiborne.md | document-outline-and-link-index | 6094 | 3814b806901d1034 |
| docs/research/completion-20260925/goforth-creek.md | document-outline-and-link-index | 13425 | 717a2b50eba23a54 |
| docs/research/completion-20260925/greasy-creek-polk.md | document-outline-and-link-index | 9101 | 1773f71aec3c6dd5 |
| docs/research/completion-20260925/great-falls-lake.md | document-outline-and-link-index | 7394 | 8e6c15936bbb71ac |
| docs/research/completion-20260925/gulf-fork-big-creek.md | document-outline-and-link-index | 12694 | 48cc8f36288e93b5 |
| docs/research/completion-20260925/hatchie-river.md | document-outline-and-link-index | 10459 | 2220531ac6961e73 |
| docs/research/completion-20260925/hiwassee-river.md | document-outline-and-link-index | 29121 | 345f7d1b09c14f89 |
| docs/research/completion-20260925/holston-river.md | document-outline-and-link-index | 27158 | 9d0cfe7559f357c5 |
| docs/research/completion-20260925/horse-creek-greene.md | document-outline-and-link-index | 10623 | c50286aa80c9576b |
| docs/research/completion-20260925/hurricane-creek.md | document-outline-and-link-index | 9683 | 6465aa9d79315483 |
| docs/research/completion-20260925/indian-creek-claiborne.md | document-outline-and-link-index | 5216 | 378e5448ab2335e7 |
| docs/research/completion-20260925/j-percy-priest-lake.md | document-outline-and-link-index | 5172 | c2108ac021ec2913 |
| docs/research/completion-20260925/johnson-park-lake.md | document-outline-and-link-index | 5373 | 1377286027e8485b |
| docs/research/completion-20260925/kentucky-lake.md | document-outline-and-link-index | 5781 | 2aad2ea1d9437099 |
| docs/research/completion-20260925/lake-barkley.md | document-outline-and-link-index | 5826 | 05317f30360782bd |
| docs/research/completion-20260925/lake-graham.md | document-outline-and-link-index | 6429 | ddc5c49229a44a80 |
| docs/research/completion-20260925/laurel-creek-johnson.md | document-outline-and-link-index | 17096 | d712988994bfab57 |
| docs/research/completion-20260925/laurel-fork-carter.md | document-outline-and-link-index | 18659 | f8658d3c12f0e582 |
| docs/research/completion-20260925/leconte-creek.md | document-outline-and-link-index | 15275 | 2e3621291c93d575 |
| docs/research/completion-20260925/little-buffalo-river.md | document-outline-and-link-index | 9091 | f62e76a255bf3be0 |
| docs/research/completion-20260925/little-river.md | document-outline-and-link-index | 14103 | fb62d2101390f1f0 |
| docs/research/completion-20260925/little-sequatchie-river.md | document-outline-and-link-index | 9992 | 786d410cc9002058 |
| docs/research/completion-20260925/little-tennessee-river.md | document-outline-and-link-index | 12932 | 267305e77143b5d3 |
| docs/research/completion-20260925/little-west-fork-creek.md | document-outline-and-link-index | 7012 | 634f308ecd40e64f |
| docs/research/completion-20260925/lt_chilhowee_page.md | document-outline-and-link-index | 4460 | ca3f11f84f8f520f |
| docs/research/completion-20260925/lt_tellico_page.md | document-outline-and-link-index | 8388 | cc788869a51a66ad |
| docs/research/completion-20260925/martin-city-pond.md | document-outline-and-link-index | 5005 | 7b0587de9472e934 |
| docs/research/completion-20260925/mccutcheon-creek.md | document-outline-and-link-index | 11369 | 7355d0bd83f06f9c |
| docs/research/completion-20260925/melton-hill-lake.md | document-outline-and-link-index | 10139 | 3830f95ffbbb7c09 |
| docs/research/completion-20260925/middle-prong-little-pigeon.md | document-outline-and-link-index | 13323 | f1237720a6513078 |
| docs/research/completion-20260925/milan-city-pond.md | document-outline-and-link-index | 4922 | a5348e0cd3d728d2 |
| docs/research/completion-20260925/mill-creek-overton.md | document-outline-and-link-index | 7946 | fea7856115555839 |
| docs/research/completion-20260925/mossy-creek-jefferson.md | document-outline-and-link-index | 15933 | de4bea6d7dff9a1a |
| docs/research/completion-20260925/nickajack-lake.md | document-outline-and-link-index | 5476 | 586acc588a387aeb |
| docs/research/completion-20260925/normandy-lake.md | document-outline-and-link-index | 5866 | 272c7d7cebe39926 |
| docs/research/completion-20260925/norris-lake.md | document-outline-and-link-index | 10372 | 171a8c49ce0bda2b |
| docs/research/completion-20260925/north-chickamauga-creek.md | document-outline-and-link-index | 15118 | a8d9fa395eee81b3 |
| docs/research/completion-20260925/north-fork-holston-river.md | document-outline-and-link-index | 13859 | cabb9a0d98c380d8 |
| docs/research/completion-20260925/obed-river.md | document-outline-and-link-index | 11003 | af9e51d37a10867c |
| docs/research/completion-20260925/obey-river.md | document-outline-and-link-index | 26737 | f2bcb944caa556c0 |
| docs/research/completion-20260925/obion-river.md | document-outline-and-link-index | 10324 | 2a9ea2d5acc388f2 |
| docs/research/completion-20260925/old-hickory-lake.md | document-outline-and-link-index | 5514 | 8aa5fff419963f05 |
| docs/research/completion-20260925/paint-creek-greene.md | document-outline-and-link-index | 9293 | da058af5ee657c3a |
| docs/research/completion-20260925/parksville-lake.md | document-outline-and-link-index | 16886 | 5823086044c3f493 |
| docs/research/completion-20260925/pickwick-lake.md | document-outline-and-link-index | 6318 | 2c5c08a5965071aa |
| docs/research/completion-20260925/pine-creek-dekalb.md | document-outline-and-link-index | 7766 | 98f051b9d7a468e6 |
| docs/research/completion-20260925/piney-river-rhea.md | document-outline-and-link-index | 16627 | 6d9effa40454eb8a |
| docs/research/completion-20260925/puncheon-camp-creek.md | document-outline-and-link-index | 5534 | 45acaa7499920d4b |
| docs/research/completion-20260925/red-river-clarksville.md | document-outline-and-link-index | 13012 | aaf320bd1e3c7c30 |
| docs/research/completion-20260925/reelfoot-lake.md | document-outline-and-link-index | 5867 | 2b2ff5dc765a7dd6 |
| docs/research/completion-20260925/richardson-byrd-creek.md | document-outline-and-link-index | 5124 | 1176f3e0f67427ea |
| docs/research/completion-20260925/roaring-fork.md | document-outline-and-link-index | 17540 | 9302c533f04426a7 |
| docs/research/completion-20260925/rocky-river.md | document-outline-and-link-index | 7020 | 7b29ef9d737a7176 |
| docs/research/completion-20260925/salt-lick-creek.md | document-outline-and-link-index | 11585 | 0c18984dfec4d4d8 |
| docs/research/completion-20260925/sequatchie-river.md | document-outline-and-link-index | 11322 | de91f43c27282c1c |
| docs/research/completion-20260925/shelby-farms-lake.md | document-outline-and-link-index | 6623 | 07a2c0bf504292f9 |
| docs/research/completion-20260925/sinking-creek-wilson.md | document-outline-and-link-index | 7563 | ab5a5008c5d59316 |
| docs/research/completion-20260925/south-holston-lake.md | document-outline-and-link-index | 22427 | a94c36e557079c60 |
| docs/research/completion-20260925/south-holston-river.md | document-outline-and-link-index | 29520 | 4a0dfc16f6947164 |
| docs/research/completion-20260925/spring-creek-polk.md | document-outline-and-link-index | 10187 | de0c95673a93467a |
| docs/research/completion-20260925/standing-rock-creek.md | document-outline-and-link-index | 10610 | f2a57d923f73b3aa |
| docs/research/completion-20260925/station-creek.md | document-outline-and-link-index | 4947 | 30e8dff38246f24d |
| docs/research/completion-20260925/stones-river.md | document-outline-and-link-index | 15083 | 6c90a698f23ecc48 |
| docs/research/completion-20260925/stoney-creek-carter.md | document-outline-and-link-index | 17961 | af5a47b8c9b236f9 |
| docs/research/completion-20260925/sulfur-fork-creek.md | document-outline-and-link-index | 7512 | fbb9c0243a494e74 |
| docs/research/completion-20260925/tellico-lake.md | document-outline-and-link-index | 13339 | 03b84eda07f85e64 |
| docs/research/completion-20260925/tellico-river.md | document-outline-and-link-index | 18889 | cbce9c6477cc4279 |
| docs/research/completion-20260925/tennessee-river.md | document-outline-and-link-index | 5775 | c6c04ed47dad5fbe |
| docs/research/completion-20260925/tims-ford-lake.md | document-outline-and-link-index | 4191 | 532efd7a946bbbfa |
| docs/research/completion-20260925/trail-fork-big-creek.md | document-outline-and-link-index | 17651 | 625e064213083d84 |
| docs/research/completion-20260925/tumbling-creek.md | document-outline-and-link-index | 10046 | 4ca0d0a9a8dfd44f |
| docs/research/completion-20260925/union-city-reelfoot-pond.md | document-outline-and-link-index | 4358 | 612add94bb300d15 |
| docs/research/completion-20260925/upper-hills-creek.md | document-outline-and-link-index | 6645 | 685d6607e9e0daff |
| docs/research/completion-20260925/upper-roan-creek.md | document-outline-and-link-index | 17964 | 0e51a407e646b430 |
| docs/research/completion-20260925/valentine-park-pond.md | document-outline-and-link-index | 5263 | c7c3bf01b8b0e83f |
| docs/research/completion-20260925/watauga-lake.md | document-outline-and-link-index | 18385 | 7d4050d6cf97c728 |
| docs/research/completion-20260925/watauga-river.md | document-outline-and-link-index | 31149 | 53e4645d29f0178c |
| docs/research/completion-20260925/watts-bar-lake.md | document-outline-and-link-index | 9595 | 5954f48357f4fdba |
| docs/research/completion-20260925/west-fork-stones-river.md | document-outline-and-link-index | 16336 | 3861c611e5eb4e1f |
| docs/research/completion-20260925/west-prong-little-pigeon.md | document-outline-and-link-index | 23518 | d11165fa06f63bd0 |
| docs/research/completion-20260925/white-oak-creek.md | document-outline-and-link-index | 10602 | df63159ec5833d0b |
| docs/research/completion-20260925/wilbur-lake.md | document-outline-and-link-index | 16252 | 1f5f0717a457604e |
| docs/research/completion-20260925/wolf-river-fentress.md | document-outline-and-link-index | 21924 | 8f7e389a736f3774 |
| docs/research/completion-20260925/wolf-river-west-tennessee.md | document-outline-and-link-index | 10754 | 213361c253bb2a03 |
| docs/research/completion-20260925/woods-reservoir.md | document-outline-and-link-index | 4983 | 0215e264e0084e4b |
| docs/research/completion-20260925/yale-road-park-lake.md | document-outline-and-link-index | 5296 | 18ae6b58397a32aa |
| docs/research/low-confidence-20260924/beech-river.md | document-outline-and-link-index | 18293 | 1cf1b7098cb4a748 |
| docs/research/low-confidence-20260924/big-bigby-creek.md | document-outline-and-link-index | 14757 | fd6d4ca4a9dfcc31 |
| docs/research/low-confidence-20260924/big-sandy-river.md | document-outline-and-link-index | 24880 | 4f03e88201544879 |
| docs/research/low-confidence-20260924/big-sewee-creek.md | document-outline-and-link-index | 16241 | 468d5598142edaab |
| docs/research/low-confidence-20260924/big-swan-creek.md | document-outline-and-link-index | 12270 | e8ad3eb35e3d5a24 |
| docs/research/low-confidence-20260924/bradley-creek.md | document-outline-and-link-index | 17417 | 2dd8d0f982aa6a88 |
| docs/research/low-confidence-20260924/brimstone-creek.md | document-outline-and-link-index | 11822 | 63ab33e6cce1bb7a |
| docs/research/low-confidence-20260924/bullrun-creek.md | document-outline-and-link-index | 24526 | 144d9abe1ab6a2fc |
| docs/research/low-confidence-20260924/candies-creek.md | document-outline-and-link-index | 11256 | 5283b3a95c5a95de |
| docs/research/low-confidence-20260924/chestuee-creek.md | document-outline-and-link-index | 9990 | 8b8a063f4f94fc16 |
| docs/research/low-confidence-20260924/clear-fork.md | document-outline-and-link-index | 26482 | ac4bc10445558038 |
| docs/research/low-confidence-20260924/crab-orchard-creek.md | document-outline-and-link-index | 2328 | 6305a1347fdd3be6 |
| docs/research/low-confidence-20260924/dumplin-creek.md | document-outline-and-link-index | 2623 | ac88c127cdd5702e |
| docs/research/low-confidence-20260924/falling-water-river.md | document-outline-and-link-index | 25358 | 54e7fc6bffb6424e |
| docs/research/low-confidence-20260924/forked-deer-river.md | document-outline-and-link-index | 20121 | e7c431c575d43b64 |
| docs/research/low-confidence-20260924/fort-patrick-henry-lake.md | document-outline-and-link-index | 31290 | 63b30a8d362649ea |
| docs/research/low-confidence-20260924/little-chuckey-creek.md | document-outline-and-link-index | 2252 | 3ba5d832edf23d64 |
| docs/research/low-confidence-20260924/little-harpeth-river.md | document-outline-and-link-index | 15383 | caefc545aa54f124 |
| docs/research/low-confidence-20260924/loosahatchie-river.md | document-outline-and-link-index | 16177 | d1915f9c1688fb3c |
| docs/research/low-confidence-20260924/middle-fork-forked-deer-river.md | document-outline-and-link-index | 13930 | ff1b6a9fa031128a |
| docs/research/low-confidence-20260924/middle-fork-obion-river.md | document-outline-and-link-index | 16464 | acb516ba0f69c35a |
| docs/research/low-confidence-20260924/mississippi-river.md | document-outline-and-link-index | 25979 | b6a7dad74891b74f |
| docs/research/low-confidence-20260924/nolichucky-river.md | document-outline-and-link-index | 23933 | ef86be140854bfdf |
| docs/research/low-confidence-20260924/nonconnah-creek.md | document-outline-and-link-index | 15300 | 6f0251c017e7b09e |
| docs/research/low-confidence-20260924/north-fork-forked-deer-river.md | document-outline-and-link-index | 19651 | e2e81bcd71314382 |
| docs/research/low-confidence-20260924/north-fork-obion-river.md | document-outline-and-link-index | 24485 | 50096fd2e3c8aa21 |
| docs/research/low-confidence-20260924/north-mouse-creek.md | document-outline-and-link-index | 13424 | 252ec1379493858f |
| docs/research/low-confidence-20260924/north-prong-barren-fork.md | document-outline-and-link-index | 15121 | 4ad8f989d241b229 |
| docs/research/low-confidence-20260924/ocoee-number-three-lake.md | document-outline-and-link-index | 15102 | c269329624886bdf |
| docs/research/low-confidence-20260924/ocoee-river.md | document-outline-and-link-index | 26968 | ce26ac83631c5b52 |
| docs/research/low-confidence-20260924/oostanaula-creek.md | document-outline-and-link-index | 13317 | c54340ca3c285258 |
| docs/research/low-confidence-20260924/paris-city-park-lake.md | document-outline-and-link-index | 20211 | 2e79501152b7044e |
| docs/research/low-confidence-20260924/parksville-tailwater.md | document-outline-and-link-index | 13284 | c09a24c4ddee5e85 |
| docs/research/low-confidence-20260924/piney-river-hickman.md | document-outline-and-link-index | 23373 | 7dea21ac07338d0a |
| docs/research/low-confidence-20260924/richland-creek-maury.md | document-outline-and-link-index | 17718 | 1174749224cb6e4d |
| docs/research/low-confidence-20260924/roaring-river.md | document-outline-and-link-index | 2504 | 6617f7be86d15c75 |
| docs/research/low-confidence-20260924/rutherford-fork-obion-river.md | document-outline-and-link-index | 14361 | 4b8650bae922c0aa |
| docs/research/low-confidence-20260924/sale-creek.md | document-outline-and-link-index | 12429 | cd86c193cf345e3f |
| docs/research/low-confidence-20260924/shoal-creek.md | document-outline-and-link-index | 24626 | 3f61407820127d5f |
| docs/research/low-confidence-20260924/south-chickamauga-creek.md | document-outline-and-link-index | 16564 | 49b1c9ee6bd944f3 |
| docs/research/low-confidence-20260924/south-fork-forked-deer-river.md | document-outline-and-link-index | 17075 | 06f8edd5e27b40ca |
| docs/research/low-confidence-20260924/south-fork-obion-river.md | document-outline-and-link-index | 21786 | 4c5ae8fccab40970 |
| docs/research/low-confidence-20260924/south-mouse-creek.md | document-outline-and-link-index | 12832 | 232f7c464d0d236a |
| docs/research/low-confidence-20260924/watauga-river-wilbur-reach.md | document-outline-and-link-index | 23085 | 96261374c3dc9c8f |
| docs/research/low-confidence-20260924/west-fork-obey-river.md | document-outline-and-link-index | 2889 | d2b42dcf1eab3a52 |
| docs/research/low-confidence-20260924/west-harpeth-river.md | document-outline-and-link-index | 12745 | b4425f8b62ff5114 |
| docs/research/low-confidence-20260924/yellow-creek-houston.md | document-outline-and-link-index | 17664 | 557253c265b13e56 |
| docs/research/nine-water-evidence-20260924/east-fork-stones.md | document-outline-and-link-index | 27848 | 085b3baa4d19b410 |
| docs/research/nine-water-evidence-20260924/elk-river-lower.md | document-outline-and-link-index | 26755 | ead07d48c6e4efbe |
| docs/research/nine-water-evidence-20260924/harpeth-river.md | document-outline-and-link-index | 23613 | 740db84dfee55134 |
| docs/research/nine-water-evidence-20260924/little-pigeon.md | document-outline-and-link-index | 26580 | 51279eab0e9e1f6e |
| docs/research/nine-water-evidence-20260924/new-river.md | document-outline-and-link-index | 30985 | 4eee71cb36af9244 |
| docs/research/nine-water-evidence-20260924/pigeon-river.md | document-outline-and-link-index | 30260 | 928801809ea1a340 |
| docs/research/nine-water-evidence-20260924/powell-river.md | document-outline-and-link-index | 31239 | a9186325903be791 |
| docs/research/nine-water-evidence-20260924/reedy-creek.md | document-outline-and-link-index | 23900 | db2e0eee2db2214c |
| docs/research/nine-water-evidence-20260924/south-fork-cumberland.md | document-outline-and-link-index | 25348 | 708b6bb874491b0b |
| docs/research/proposed-waters-2026-09.csv | all-row-text-structure | 62224 | 67cc7683feffba71 |
| docs/research/proposed-waters-2026-09.yaml | full-YAML-parse | 77236 | 5c8c06b4c51ec03c |
| docs/roads-sources.md | document-outline-and-link-index | 11027 | 2938ecee3cde9d26 |
| docs/topo-sources.md | document-outline-and-link-index | 11918 | 6a690c45dc46749d |
| docs/waterbody-inventory.json | full-JSON-parse-and-coordinate-check | 35710 | 3b3afd989fa458df |
| e2e/.gitignore | direct-read | 104 | f796dbcd25e7af13 |
| e2e/README.md | document-outline-and-link-index | 2991 | 6db03d52eaa29b3d |
| e2e/admin/portal.spec.ts | test-structure-review | 3826 | cbbb6f5641570f66 |
| e2e/api/fixtures.spec.ts | test-structure-review | 4551 | ccf64523a2c06163 |
| e2e/browser-verify.mjs | program-structure-review | 8893 | 1ac6116f3851d7c1 |
| e2e/fieldwork/layers-conditions.spec.ts | test-structure-review | 23302 | 5db0ff979d59afff |
| e2e/fieldwork/map-hit-selection.spec.ts | test-structure-review | 9681 | 4e5a084f645f26e8 |
| e2e/fieldwork/map-quality.spec.ts | test-structure-review | 5986 | bb93aaa4eebf5803 |
| e2e/fieldwork/ui.spec.ts | test-structure-review | 44138 | e2491dafa5187c68 |
| e2e/global-setup.mjs | program-structure-review | 1753 | d8fed33b2d6d907f |
| e2e/helpers/first-party.ts | program-structure-review | 2119 | b019b3ff3c4433a7 |
| e2e/lighthouserc.marketing.cjs | program-structure-review | 1592 | 8e614835f79edf48 |
| e2e/lighthouserc.web.cjs | program-structure-review | 1297 | d180b45c3efb1235 |
| e2e/marketing/seo.spec.ts | test-structure-review | 11202 | 3187aa2ddb239c1e |
| e2e/package.json | direct-read | 981 | 082cfce0febf3827 |
| e2e/playwright.config.ts | program-structure-review | 3706 | dd2702562d30eac0 |
| e2e/scripts/api-e2e-server.mjs | program-structure-review | 3157 | 013ec1e07742901b |
| e2e/scripts/static-server.mjs | program-structure-review | 2164 | 9921618621145148 |
| e2e/tsconfig.json | direct-read | 196 | cc98508ec2c4137a |
| e2e/web/atlas-verify.spec.ts | test-structure-review | 5441 | b0d05b7cffa8d0cd |
| e2e/web/conditions-fixtures.spec.ts | test-structure-review | 4766 | 883b8ef408913958 |
| e2e/web/fishability.spec.ts | test-structure-review | 6513 | d77ead355788a9f5 |
| e2e/web/manifest.spec.ts | test-structure-review | 1715 | 8f7d4352ab1a3205 |
| e2e/web/offline-cold-start.spec.ts | test-structure-review | 6187 | 763e53b65877da66 |
| e2e/web/offline-hatch.spec.ts | test-structure-review | 2258 | dedf38c07d32abea |
| e2e/web/privacy.spec.ts | test-structure-review | 4715 | 335cb9b42c38d73a |
| e2e/web/shell.spec.ts | test-structure-review | 2381 | a6d4e3da3161feed |
| e2e/web/touch-targets.spec.ts | test-structure-review | 2347 | f7e6f2dc168fa9dd |
| eslint.config.js | direct-read | 973 | d448906f650979dc |
| infra/RUNBOOK.md | document-outline-and-targeted-source-read | 25111 | 521bbf5ebd6ce73e |
| infra/alert-context.mjs | program-read | 5836 | 2361448ed37b8d73 |
| infra/alert-context.sh | program-read | 335 | b3cd8637109680da |
| infra/alert.sh | program-read | 2097 | 42cdbe3aeab7be29 |
| infra/archive-snapshots.sh | program-read | 1193 | 10d643cd967b8ba8 |
| infra/autoupdate.sh | program-read | 5320 | 5c71f6f2af75e23e |
| infra/backup.sh | program-read | 4672 | 3b6277d26794c4f1 |
| infra/bootstrap-server.sh | program-read | 3483 | d6866c4c02d0ce7f |
| infra/cloudflared/config.yml | direct-read | 1149 | 695885ee6723ce31 |
| infra/deploy-stamp.sh | program-read | 2381 | a8ce37b8dd3101b4 |
| infra/deploy.sh | program-read | 8471 | a6499a48f199628b |
| infra/install-schedules.sh | program-read | 5066 | 593d43223aedb47d |
| infra/pm2/ecosystem.config.cjs | program-read | 2654 | c256e40263251f24 |
| infra/push-notify.sh | program-read | 1717 | 9f2d439dabcb03ea |
| infra/refresh-data.sh | program-read | 5377 | 05b51cb3e2ac80e9 |
| infra/restart-app.sh | program-read | 1500 | 8b1fba410b379546 |
| infra/restore-snapshots.sh | program-read | 1258 | 4608bbc44056cf16 |
| infra/runtime-env.sh | program-read | 1916 | f85c1c7774add65e |
| infra/skew-guards.test.mjs | program-read | 8513 | c9073165e62de207 |
| infra/snapshot-io.mjs | program-read | 3535 | 51225a2d563080a4 |
| infra/static-server.mjs | direct-read | 9616 | b411e736de40e302 |
| infra/static-server.test.mjs | program-read | 3999 | 0860b23e7346c8bb |
| infra/sync-snapshots.sh | program-read | 10601 | 57445b2910565e5e |
| infra/update-trout.ps1 | program-read | 1652 | e4ef23bd0953df9c |
| infra/verify-site.sh | program-read | 7250 | a4ad105eff462437 |
| infra/watchdog.sh | program-read | 7540 | bb1ae5e70539e4ec |
| notes/MAP-PROMINENCE-DECISION-PACKAGE.md | direct-read | 10749 | b4dfba2c055891c3 |
| notes/apply-manifest.json | full-JSON-parse-and-coordinate-check | 18933 | fadc4e793c638034 |
| notes/candidates.json | full-JSON-parse-and-coordinate-check | 3323 | 9b629a87d83abe1b |
| notes/candidates.py | program-structure-review | 8855 | 230bebd5c7775474 |
| notes/catalog-signals-seed.json | full-JSON-parse-and-coordinate-check | 67654 | 448eae6dbab196af |
| notes/e2e-draft.md | document-outline-and-link-index | 8542 | b8ac32a33f8c4278 |
| notes/fills-split.json | full-JSON-parse-and-coordinate-check | 438 | 04d8a9a54f5bfd0e |
| notes/fills.json | full-JSON-parse-and-coordinate-check | 4183 | 54b7f0fca1ae992b |
| notes/filter-sweep.md | document-outline-and-link-index | 9833 | 07d10e81d27cbcb6 |
| notes/maplibre-v6-audit.md | document-outline-and-link-index | 21418 | 0ec9ef2370801151 |
| notes/shot-all-fish-mode.png | raster-full-decode | 280474 | 960fed5b41140262 |
| notes/shot-trout-mode.png | raster-full-decode | 288283 | 76204dac1ad210de |
| notes/signals.json | full-JSON-parse-and-coordinate-check | 95571 | cc36db02923d9ef7 |
| notes/sim-output.txt | direct-read | 3785 | 853c6dad074774a1 |
| notes/verify-1-caney-selected.png | raster-full-decode | 314268 | 2ed6d3bca67dd4cc |
| notes/verify-2-after-theme-swaps.png | raster-full-decode | 314320 | a627fa95db8a4f5a |
| package.json | direct-read | 1566 | d3a821ccd19ce73b |
| packages/content/README.md | document-outline-and-link-index | 3460 | 911a8f932ebcf33f |
| packages/content/bugs/alderfly-larva.yaml | full-YAML-parse | 1026 | adf8964b950c6919 |
| packages/content/bugs/anglers-curse.yaml | full-YAML-parse | 978 | ee01d426643c6ec0 |
| packages/content/bugs/ant.yaml | full-YAML-parse | 1145 | 3866d0b405241892 |
| packages/content/bugs/aquatic-moth.yaml | full-YAML-parse | 1089 | 9e0165716f91fbf2 |
| packages/content/bugs/aquatic-snail.yaml | full-YAML-parse | 1410 | 899517989920c720 |
| packages/content/bugs/aquatic-worm.yaml | full-YAML-parse | 1660 | 292c7ed8e43da34c |
| packages/content/bugs/autumn-mottled-sedge.yaml | full-YAML-parse | 948 | 35ee1169cf7dceba |
| packages/content/bugs/black-dancer-caddis.yaml | full-YAML-parse | 908 | 1a9c70cd2c5b485c |
| packages/content/bugs/black-fly.yaml | full-YAML-parse | 1264 | a0e22dc127eba3da |
| packages/content/bugs/black-quill.yaml | full-YAML-parse | 868 | 8d7c5574fb186f11 |
| packages/content/bugs/blacknose-dace.yaml | full-YAML-parse | 1185 | 6775e822212eb417 |
| packages/content/bugs/blood-midge.yaml | full-YAML-parse | 1672 | 653750e3c3339ed0 |
| packages/content/bugs/blue-quill.yaml | full-YAML-parse | 943 | 8ad436648bbbd706 |
| packages/content/bugs/blue-winged-olive.yaml | full-YAML-parse | 2025 | 691bcf6ebf2efae4 |
| packages/content/bugs/bluntnose-minnow.yaml | full-YAML-parse | 1084 | 901642bc42879722 |
| packages/content/bugs/burrowing-hex.yaml | full-YAML-parse | 1093 | d514cee25bd90caa |
| packages/content/bugs/chocolate-dun.yaml | full-YAML-parse | 936 | 59965f72292318fe |
| packages/content/bugs/common-shiner.yaml | full-YAML-parse | 1495 | 2b6f3e8af945519f |
| packages/content/bugs/crane-fly.yaml | full-YAML-parse | 1421 | 298221a7a13ec496 |
| packages/content/bugs/crayfish.yaml | full-YAML-parse | 1449 | 9c3677ed1dac1dcb |
| packages/content/bugs/cream-cahill.yaml | full-YAML-parse | 973 | 05eca8bfa840ce0f |
| packages/content/bugs/creek-chub.yaml | full-YAML-parse | 1432 | dc60c8f430c4a3ec |
| packages/content/bugs/cricket.yaml | full-YAML-parse | 904 | 7658fcaf051b2dd5 |
| packages/content/bugs/damselfly-nymph.yaml | full-YAML-parse | 1009 | 265f53024a55c6ba |
| packages/content/bugs/dark-blue-sedge.yaml | full-YAML-parse | 868 | 4403d3d9f1784cbf |
| packages/content/bugs/dark-cahill.yaml | full-YAML-parse | 858 | e3c8af46fb30fa40 |
| packages/content/bugs/dog-day-cicada.yaml | full-YAML-parse | 997 | 05d1013027070cf2 |
| packages/content/bugs/dragonfly-nymph.yaml | full-YAML-parse | 934 | 3d52290a172a2af0 |
| packages/content/bugs/early-black-caddis.yaml | full-YAML-parse | 911 | e904b6ed14dbdde5 |
| packages/content/bugs/early-black-stone.yaml | full-YAML-parse | 1027 | 41393df918793124 |
| packages/content/bugs/fishfly-larva.yaml | full-YAML-parse | 937 | df1acc68a0d559ac |
| packages/content/bugs/fishing-spider.yaml | full-YAML-parse | 1000 | dbe2c92b2f2eaca9 |
| packages/content/bugs/flying-ant.yaml | full-YAML-parse | 940 | 7c88aa1e16e19241 |
| packages/content/bugs/giant-black-stone.yaml | full-YAML-parse | 1011 | dd4ae4dbf1292d33 |
| packages/content/bugs/gizzard-shad.yaml | full-YAML-parse | 1122 | 420d284885951729 |
| packages/content/bugs/golden-flathead.yaml | full-YAML-parse | 1059 | 8b8ef757901b7bb8 |
| packages/content/bugs/golden-stone.yaml | full-YAML-parse | 1372 | 0ffb5f7b0f7beca0 |
| packages/content/bugs/grannom.yaml | full-YAML-parse | 945 | ba3038f76d4e38ab |
| packages/content/bugs/grasshopper.yaml | full-YAML-parse | 1155 | 4e0df6a868b509b0 |
| packages/content/bugs/gray-drake.yaml | full-YAML-parse | 874 | f7f261e103242c3b |
| packages/content/bugs/great-autumn-sedge.yaml | full-YAML-parse | 1075 | 57e72175d6f73a90 |
| packages/content/bugs/green-sedge.yaml | full-YAML-parse | 1013 | 79bd7a709b82deb3 |
| packages/content/bugs/hellgrammite.yaml | full-YAML-parse | 1154 | f871606598261e36 |
| packages/content/bugs/illustrations/alderfly-larva.svg | full-SVG-XML-parse-and-active-content-check | 623 | ea2daed02c1b9d54 |
| packages/content/bugs/illustrations/anglers-curse.svg | full-SVG-XML-parse-and-active-content-check | 647 | 9c747f6e6057630b |
| packages/content/bugs/illustrations/ant.svg | full-SVG-XML-parse-and-active-content-check | 581 | f2751b8e6699fa22 |
| packages/content/bugs/illustrations/aquatic-moth.svg | full-SVG-XML-parse-and-active-content-check | 474 | 118b73002de7f4a0 |
| packages/content/bugs/illustrations/aquatic-snail.svg | full-SVG-XML-parse-and-active-content-check | 440 | de33666c1bc5f7d7 |
| packages/content/bugs/illustrations/aquatic-worm.svg | full-SVG-XML-parse-and-active-content-check | 367 | e79ae7b556547979 |
| packages/content/bugs/illustrations/autumn-mottled-sedge.svg | full-SVG-XML-parse-and-active-content-check | 379 | 74c4d3b85146c13d |
| packages/content/bugs/illustrations/black-dancer-caddis.svg | full-SVG-XML-parse-and-active-content-check | 497 | 42f0d6232a8133a6 |
| packages/content/bugs/illustrations/black-fly.svg | full-SVG-XML-parse-and-active-content-check | 377 | c046c4aad24829fc |
| packages/content/bugs/illustrations/black-quill.svg | full-SVG-XML-parse-and-active-content-check | 647 | ad6e8188e6cc1dd8 |
| packages/content/bugs/illustrations/blacknose-dace.svg | full-SVG-XML-parse-and-active-content-check | 536 | 1e7959524f84aa38 |
| packages/content/bugs/illustrations/blood-midge.svg | full-SVG-XML-parse-and-active-content-check | 377 | 0539d9b20b70f52d |
| packages/content/bugs/illustrations/blue-quill.svg | full-SVG-XML-parse-and-active-content-check | 647 | 330bb3ed643d807d |
| packages/content/bugs/illustrations/blue-winged-olive.svg | full-SVG-XML-parse-and-active-content-check | 647 | 976010e8c323a8df |
| packages/content/bugs/illustrations/bluntnose-minnow.svg | full-SVG-XML-parse-and-active-content-check | 536 | 50b699ce0e2f5e7a |
| packages/content/bugs/illustrations/burrowing-hex.svg | full-SVG-XML-parse-and-active-content-check | 544 | 1bf10d354b331f47 |
| packages/content/bugs/illustrations/chocolate-dun.svg | full-SVG-XML-parse-and-active-content-check | 620 | 7d9c807304352eb9 |
| packages/content/bugs/illustrations/common-shiner.svg | full-SVG-XML-parse-and-active-content-check | 536 | fa86e278fbc54e0b |
| packages/content/bugs/illustrations/crane-fly.svg | full-SVG-XML-parse-and-active-content-check | 463 | 0683c5770475450d |
| packages/content/bugs/illustrations/crayfish.svg | full-SVG-XML-parse-and-active-content-check | 619 | b8ead20f54d3fa1d |
| packages/content/bugs/illustrations/cream-cahill.svg | full-SVG-XML-parse-and-active-content-check | 562 | ae8cb534df28188e |
| packages/content/bugs/illustrations/creek-chub.svg | full-SVG-XML-parse-and-active-content-check | 536 | 12a2a0d4afb5da3a |
| packages/content/bugs/illustrations/cricket.svg | full-SVG-XML-parse-and-active-content-check | 504 | 7d1cc25e0cb99735 |
| packages/content/bugs/illustrations/damselfly-nymph.svg | full-SVG-XML-parse-and-active-content-check | 567 | 4bf051ce044258fe |
| packages/content/bugs/illustrations/dark-blue-sedge.svg | full-SVG-XML-parse-and-active-content-check | 379 | 14312444fd418ddb |
| packages/content/bugs/illustrations/dark-cahill.svg | full-SVG-XML-parse-and-active-content-check | 562 | edcefe0a92d5ac9f |
| packages/content/bugs/illustrations/dog-day-cicada.svg | full-SVG-XML-parse-and-active-content-check | 493 | 7cef97ba55d37485 |
| packages/content/bugs/illustrations/dragonfly-nymph.svg | full-SVG-XML-parse-and-active-content-check | 567 | 6845a6c7c292b003 |
| packages/content/bugs/illustrations/early-black-caddis.svg | full-SVG-XML-parse-and-active-content-check | 497 | ab4aab345e9867c0 |
| packages/content/bugs/illustrations/early-black-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | 2948f47def29a631 |
| packages/content/bugs/illustrations/fishfly-larva.svg | full-SVG-XML-parse-and-active-content-check | 623 | 952d65aabe3d391b |
| packages/content/bugs/illustrations/fishing-spider.svg | full-SVG-XML-parse-and-active-content-check | 510 | f816524463f7d8af |
| packages/content/bugs/illustrations/flying-ant.svg | full-SVG-XML-parse-and-active-content-check | 581 | 090c972ccf74a7f3 |
| packages/content/bugs/illustrations/giant-black-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | 49a465bb7d441642 |
| packages/content/bugs/illustrations/gizzard-shad.svg | full-SVG-XML-parse-and-active-content-check | 536 | e50210564792d2a1 |
| packages/content/bugs/illustrations/golden-flathead.svg | full-SVG-XML-parse-and-active-content-check | 562 | 662060d0c0b03980 |
| packages/content/bugs/illustrations/golden-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | f7173c41175696b2 |
| packages/content/bugs/illustrations/grannom.svg | full-SVG-XML-parse-and-active-content-check | 379 | b39bf672a858cf2a |
| packages/content/bugs/illustrations/grasshopper.svg | full-SVG-XML-parse-and-active-content-check | 504 | 5402662a7dab91bc |
| packages/content/bugs/illustrations/gray-drake.svg | full-SVG-XML-parse-and-active-content-check | 647 | da4a196a7b061c82 |
| packages/content/bugs/illustrations/great-autumn-sedge.svg | full-SVG-XML-parse-and-active-content-check | 379 | 16a05f933eb81ef1 |
| packages/content/bugs/illustrations/green-sedge.svg | full-SVG-XML-parse-and-active-content-check | 497 | 8a2f4160c4867c9c |
| packages/content/bugs/illustrations/hellgrammite.svg | full-SVG-XML-parse-and-active-content-check | 623 | c9a1b24f9123ace9 |
| packages/content/bugs/illustrations/inchworm.svg | full-SVG-XML-parse-and-active-content-check | 474 | 4aecec4b82ffaff1 |
| packages/content/bugs/illustrations/japanese-beetle.svg | full-SVG-XML-parse-and-active-content-check | 522 | e5777bcbd550432b |
| packages/content/bugs/illustrations/june-beetle.svg | full-SVG-XML-parse-and-active-content-check | 522 | 9968639c437d4ca0 |
| packages/content/bugs/illustrations/leafhopper.svg | full-SVG-XML-parse-and-active-content-check | 504 | 03a9073865aff329 |
| packages/content/bugs/illustrations/leech.svg | full-SVG-XML-parse-and-active-content-check | 466 | 17726278a6695d69 |
| packages/content/bugs/illustrations/light-cahill.svg | full-SVG-XML-parse-and-active-content-check | 562 | 3e186a257694cd5c |
| packages/content/bugs/illustrations/little-black-midge.svg | full-SVG-XML-parse-and-active-content-check | 377 | f8e3c4c7c3ef5184 |
| packages/content/bugs/illustrations/little-black-sedge.svg | full-SVG-XML-parse-and-active-content-check | 497 | d8b6b0924423cfb2 |
| packages/content/bugs/illustrations/little-blue-winged-olive.svg | full-SVG-XML-parse-and-active-content-check | 647 | c55305a3391d501d |
| packages/content/bugs/illustrations/little-brown-sedge.svg | full-SVG-XML-parse-and-active-content-check | 379 | bac05829f547780a |
| packages/content/bugs/illustrations/little-brown-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | 6a5754ca82d5e525 |
| packages/content/bugs/illustrations/little-golden-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | c58cd58e24d5debd |
| packages/content/bugs/illustrations/little-gray-sedge.svg | full-SVG-XML-parse-and-active-content-check | 379 | 9d45c99968bea341 |
| packages/content/bugs/illustrations/little-green-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | 52a0792e0d866eeb |
| packages/content/bugs/illustrations/little-olive-net-spinner.svg | full-SVG-XML-parse-and-active-content-check | 497 | 19ec33bfab1a2914 |
| packages/content/bugs/illustrations/little-sister-sedge.svg | full-SVG-XML-parse-and-active-content-check | 497 | 8e7f6dc837afdb76 |
| packages/content/bugs/illustrations/little-spiny-crawler.svg | full-SVG-XML-parse-and-active-content-check | 620 | b4cfe3b4cde76ecc |
| packages/content/bugs/illustrations/little-sulphur.svg | full-SVG-XML-parse-and-active-content-check | 647 | d29833cbecc3e1d2 |
| packages/content/bugs/illustrations/little-yellow-quill.svg | full-SVG-XML-parse-and-active-content-check | 562 | a22cc720a1fb7746 |
| packages/content/bugs/illustrations/long-horned-sedge.svg | full-SVG-XML-parse-and-active-content-check | 497 | df6e9bfa295165ec |
| packages/content/bugs/illustrations/longnose-dace.svg | full-SVG-XML-parse-and-active-content-check | 536 | d5d47254f635107e |
| packages/content/bugs/illustrations/march-brown.svg | full-SVG-XML-parse-and-active-content-check | 562 | ad871368611ef6bc |
| packages/content/bugs/illustrations/micro-caddis.svg | full-SVG-XML-parse-and-active-content-check | 497 | 63459855be67c747 |
| packages/content/bugs/illustrations/moth.svg | full-SVG-XML-parse-and-active-content-check | 571 | 51b17036d8d70361 |
| packages/content/bugs/illustrations/mottled-willowfly.svg | full-SVG-XML-parse-and-active-content-check | 558 | 19c07b69f9827622 |
| packages/content/bugs/illustrations/needlefly.svg | full-SVG-XML-parse-and-active-content-check | 558 | 57a7f4dcf49a4387 |
| packages/content/bugs/illustrations/olive-midge.svg | full-SVG-XML-parse-and-active-content-check | 377 | 0a96b9595d512492 |
| packages/content/bugs/illustrations/pale-evening-dun.svg | full-SVG-XML-parse-and-active-content-check | 647 | 2ca4078a0baa4c36 |
| packages/content/bugs/illustrations/periodical-cicada.svg | full-SVG-XML-parse-and-active-content-check | 493 | d64f5c90590fac59 |
| packages/content/bugs/illustrations/quill-gordon.svg | full-SVG-XML-parse-and-active-content-check | 562 | 7a19f7ed0dac34ed |
| packages/content/bugs/illustrations/riffle-beetle.svg | full-SVG-XML-parse-and-active-content-check | 522 | d1654167d5c514fb |
| packages/content/bugs/illustrations/river-bed-burrower.svg | full-SVG-XML-parse-and-active-content-check | 544 | 7d699b2d8b0459db |
| packages/content/bugs/illustrations/roachfly.svg | full-SVG-XML-parse-and-active-content-check | 558 | 5b8ffabb95f3cc86 |
| packages/content/bugs/illustrations/saddle-case-caddis.svg | full-SVG-XML-parse-and-active-content-check | 379 | 0502863ded821033 |
| packages/content/bugs/illustrations/scud.svg | full-SVG-XML-parse-and-active-content-check | 573 | 6d1b3d5ab876f78a |
| packages/content/bugs/illustrations/sculpin.svg | full-SVG-XML-parse-and-active-content-check | 606 | 932fe3cc07c21878 |
| packages/content/bugs/illustrations/shortwing-golden-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | fe8928aa2f294e24 |
| packages/content/bugs/illustrations/slate-drake.svg | full-SVG-XML-parse-and-active-content-check | 620 | 6324d25ab62c79e1 |
| packages/content/bugs/illustrations/small-scud.svg | full-SVG-XML-parse-and-active-content-check | 573 | 4d78fcf6feaa571d |
| packages/content/bugs/illustrations/snail-case-caddis.svg | full-SVG-XML-parse-and-active-content-check | 379 | 5c96c54849d4b3a1 |
| packages/content/bugs/illustrations/soldier-beetle.svg | full-SVG-XML-parse-and-active-content-check | 522 | 441e1fdbf09f94fb |
| packages/content/bugs/illustrations/sowbug.svg | full-SVG-XML-parse-and-active-content-check | 578 | 8f7037d37c11dab4 |
| packages/content/bugs/illustrations/spiny-crawler-mayfly.svg | full-SVG-XML-parse-and-active-content-check | 620 | ab7585dfd228c18b |
| packages/content/bugs/illustrations/spotted-sedge.svg | full-SVG-XML-parse-and-active-content-check | 497 | 243d1f5b4cb18bec |
| packages/content/bugs/illustrations/stoneroller.svg | full-SVG-XML-parse-and-active-content-check | 536 | 1bc1df57dbde11bb |
| packages/content/bugs/illustrations/sucker.svg | full-SVG-XML-parse-and-active-content-check | 536 | ca15370c187148c3 |
| packages/content/bugs/illustrations/sulphur-dun.svg | full-SVG-XML-parse-and-active-content-check | 647 | 15030200e513e631 |
| packages/content/bugs/illustrations/threadfin-shad.svg | full-SVG-XML-parse-and-active-content-check | 536 | ee7457c8cbff4b6b |
| packages/content/bugs/illustrations/tiny-blue-winged-olive.svg | full-SVG-XML-parse-and-active-content-check | 647 | f8075d54fe255819 |
| packages/content/bugs/illustrations/tiny-winter-stone.svg | full-SVG-XML-parse-and-active-content-check | 558 | 6743bbe5b9e01250 |
| packages/content/bugs/illustrations/trico.svg | full-SVG-XML-parse-and-active-content-check | 647 | c606530502aaf275 |
| packages/content/bugs/illustrations/wasp-bee.svg | full-SVG-XML-parse-and-active-content-check | 522 | 0fa602f32c0fab31 |
| packages/content/bugs/illustrations/water-boatman.svg | full-SVG-XML-parse-and-active-content-check | 522 | 7e689e5b22dcf688 |
| packages/content/bugs/illustrations/water-penny.svg | full-SVG-XML-parse-and-active-content-check | 522 | faa59e597537223b |
| packages/content/bugs/illustrations/whirligig-beetle.svg | full-SVG-XML-parse-and-active-content-check | 522 | ce56ce8aa9b80e83 |
| packages/content/bugs/illustrations/white-fly.svg | full-SVG-XML-parse-and-active-content-check | 544 | 3fbf4755c977e1d4 |
| packages/content/bugs/illustrations/white-miller-caddis.svg | full-SVG-XML-parse-and-active-content-check | 497 | 29293ef41236a620 |
| packages/content/bugs/illustrations/yellow-drake.svg | full-SVG-XML-parse-and-active-content-check | 544 | eecca00552f6b041 |
| packages/content/bugs/illustrations/yellow-sally.svg | full-SVG-XML-parse-and-active-content-check | 558 | 4fc868cb3a23b690 |
| packages/content/bugs/illustrations/yellow-stone-eccoptura.svg | full-SVG-XML-parse-and-active-content-check | 558 | 4984092ce133239c |
| packages/content/bugs/inchworm.yaml | full-YAML-parse | 960 | b663af363f45b7f5 |
| packages/content/bugs/japanese-beetle.yaml | full-YAML-parse | 1016 | 330b97a64a760104 |
| packages/content/bugs/june-beetle.yaml | full-YAML-parse | 884 | 020bfc435d39b21a |
| packages/content/bugs/leafhopper.yaml | full-YAML-parse | 905 | 272843f07415f858 |
| packages/content/bugs/leech.yaml | full-YAML-parse | 1617 | d7bc5d2b8abd191f |
| packages/content/bugs/light-cahill.yaml | full-YAML-parse | 1305 | 4c021e98054a205d |
| packages/content/bugs/little-black-midge.yaml | full-YAML-parse | 1276 | 8d9baf09082ba9a4 |
| packages/content/bugs/little-black-sedge.yaml | full-YAML-parse | 1186 | 9348c26e16222765 |
| packages/content/bugs/little-blue-winged-olive.yaml | full-YAML-parse | 1216 | cb161ff52beb946a |
| packages/content/bugs/little-brown-sedge.yaml | full-YAML-parse | 1166 | 665bea6b08cc5059 |
| packages/content/bugs/little-brown-stone.yaml | full-YAML-parse | 912 | 72cd0092c812c5e5 |
| packages/content/bugs/little-golden-stone.yaml | full-YAML-parse | 1244 | f29e6dff5dc68671 |
| packages/content/bugs/little-gray-sedge.yaml | full-YAML-parse | 808 | eccb0c0f56907ddc |
| packages/content/bugs/little-green-stone.yaml | full-YAML-parse | 918 | b09693961320526c |
| packages/content/bugs/little-olive-net-spinner.yaml | full-YAML-parse | 1133 | ff135af35687cba1 |
| packages/content/bugs/little-sister-sedge.yaml | full-YAML-parse | 1411 | e7b7d0c1d86848de |
| packages/content/bugs/little-spiny-crawler.yaml | full-YAML-parse | 1178 | 9f71f6331dcbede9 |
| packages/content/bugs/little-sulphur.yaml | full-YAML-parse | 1160 | d10b692775551e94 |
| packages/content/bugs/little-yellow-quill.yaml | full-YAML-parse | 944 | 253c9bb809b7f0b0 |
| packages/content/bugs/long-horned-sedge.yaml | full-YAML-parse | 966 | 7b10b2ea6594284c |
| packages/content/bugs/longnose-dace.yaml | full-YAML-parse | 1150 | 5bc4a10ec4343ff7 |
| packages/content/bugs/march-brown.yaml | full-YAML-parse | 1247 | 5d8304465fb40fb5 |
| packages/content/bugs/micro-caddis.yaml | full-YAML-parse | 921 | 71215f07ad007478 |
| packages/content/bugs/moth.yaml | full-YAML-parse | 1044 | 4915c60140299c3e |
| packages/content/bugs/mottled-willowfly.yaml | full-YAML-parse | 843 | 536ba1e1df9c15b8 |
| packages/content/bugs/needlefly.yaml | full-YAML-parse | 1080 | 2940f526f0777374 |
| packages/content/bugs/olive-midge.yaml | full-YAML-parse | 1546 | fb04d3da1cdbe1a5 |
| packages/content/bugs/pale-evening-dun.yaml | full-YAML-parse | 1106 | 4098c4b66df59d1e |
| packages/content/bugs/periodical-cicada.yaml | full-YAML-parse | 1119 | ea8d580f9a5c35c3 |
| packages/content/bugs/quill-gordon.yaml | full-YAML-parse | 1015 | 68f4c91e71446475 |
| packages/content/bugs/riffle-beetle.yaml | full-YAML-parse | 1592 | 944dec09ed389f09 |
| packages/content/bugs/river-bed-burrower.yaml | full-YAML-parse | 1085 | 8eecdfcffbfadac7 |
| packages/content/bugs/roachfly.yaml | full-YAML-parse | 943 | 5fcf0304b267cff7 |
| packages/content/bugs/saddle-case-caddis.yaml | full-YAML-parse | 1284 | 26be10071e3ffbe0 |
| packages/content/bugs/scud.yaml | full-YAML-parse | 1689 | 70190784708af8f6 |
| packages/content/bugs/sculpin.yaml | full-YAML-parse | 1745 | 56295e1c47d59729 |
| packages/content/bugs/shortwing-golden-stone.yaml | full-YAML-parse | 947 | 926e60885769a47e |
| packages/content/bugs/slate-drake.yaml | full-YAML-parse | 1464 | 3323eb2dd3fa32db |
| packages/content/bugs/small-scud.yaml | full-YAML-parse | 1203 | 923a7b6ae1d916a7 |
| packages/content/bugs/snail-case-caddis.yaml | full-YAML-parse | 1060 | 2b7c2d4fe307ef6e |
| packages/content/bugs/soldier-beetle.yaml | full-YAML-parse | 853 | 05a67be438be5e42 |
| packages/content/bugs/sowbug.yaml | full-YAML-parse | 1529 | 3a1e5da7ea3651b3 |
| packages/content/bugs/spiny-crawler-mayfly.yaml | full-YAML-parse | 1198 | 67284b088392b875 |
| packages/content/bugs/spotted-sedge.yaml | full-YAML-parse | 1615 | 6a7c05278e254963 |
| packages/content/bugs/stoneroller.yaml | full-YAML-parse | 1329 | 218653432944f996 |
| packages/content/bugs/sucker.yaml | full-YAML-parse | 1187 | 375199dfdd26cf5c |
| packages/content/bugs/sulphur-dun.yaml | full-YAML-parse | 1280 | 6945d1a1c1b8eaf5 |
| packages/content/bugs/threadfin-shad.yaml | full-YAML-parse | 1330 | 950d90f48d781843 |
| packages/content/bugs/tiny-blue-winged-olive.yaml | full-YAML-parse | 1426 | 790f94999290f421 |
| packages/content/bugs/tiny-winter-stone.yaml | full-YAML-parse | 1034 | e16255e800982366 |
| packages/content/bugs/trico.yaml | full-YAML-parse | 979 | 1dee227612249a2e |
| packages/content/bugs/wasp-bee.yaml | full-YAML-parse | 1082 | c9fe0622db2e90ef |
| packages/content/bugs/water-boatman.yaml | full-YAML-parse | 902 | 86241d9f62ec4d01 |
| packages/content/bugs/water-penny.yaml | full-YAML-parse | 1029 | 9c65534632007785 |
| packages/content/bugs/whirligig-beetle.yaml | full-YAML-parse | 986 | a858f2ab610663d0 |
| packages/content/bugs/white-fly.yaml | full-YAML-parse | 958 | 54cbe3856fba7c6c |
| packages/content/bugs/white-miller-caddis.yaml | full-YAML-parse | 943 | 9fe5462e76efcbce |
| packages/content/bugs/yellow-drake.yaml | full-YAML-parse | 985 | b545136724c75b41 |
| packages/content/bugs/yellow-sally.yaml | full-YAML-parse | 1296 | 9bd0b92617445678 |
| packages/content/bugs/yellow-stone-eccoptura.yaml | full-YAML-parse | 932 | b3e5777d3e195569 |
| packages/content/data/fishing-information.json | full-JSON-parse-and-coordinate-check | 24719 | 9a361d6290da34e6 |
| packages/content/data/trout-calendar.json | full-JSON-parse-and-coordinate-check | 48954 | 95e81f43ac0c11b0 |
| packages/content/data/verified-gauges.json | full-JSON-parse-and-coordinate-check | 7527 | 1f4f7016f74fa2f1 |
| packages/content/data/west-tn-ponds.json | full-JSON-parse-and-coordinate-check | 5783 | 99be2cdc15ee9373 |
| packages/content/hatch/.gitkeep | direct-read | 96 | 47258e7ce4451d47 |
| packages/content/hatch/tn/tn-cumberland-plateau.yaml | full-YAML-parse | 73486 | 0d1fbb63c4a6ff42 |
| packages/content/hatch/tn/tn-east-clinch.yaml | full-YAML-parse | 109414 | 4290a86dc7c25ef1 |
| packages/content/hatch/tn/tn-east-holston.yaml | full-YAML-parse | 107506 | 83c2374496c147b1 |
| packages/content/hatch/tn/tn-east-pigeon-frenchbroad.yaml | full-YAML-parse | 74503 | 80c3d0c594905a32 |
| packages/content/hatch/tn/tn-east-smokies.yaml | full-YAML-parse | 79803 | 6104ca7637ff935c |
| packages/content/hatch/tn/tn-middle-caney-fork.yaml | full-YAML-parse | 98863 | c6af69deaaaad9cc |
| packages/content/hatch/tn/tn-middle-duck-elk.yaml | full-YAML-parse | 97236 | 1ee9842590c58db3 |
| packages/content/hatch/tn/tn-middle-nashville.yaml | full-YAML-parse | 65462 | 51b721e2f70c6355 |
| packages/content/hatch/tn/tn-northeast-watauga.yaml | full-YAML-parse | 99995 | 3812db15ccdfbab2 |
| packages/content/hatch/tn/tn-se-hiwassee.yaml | full-YAML-parse | 111865 | 93d3cb2545d66fdb |
| packages/content/hatch/tn/tn-upper-cumberland.yaml | full-YAML-parse | 52007 | a6cec2a0e5a533fa |
| packages/content/hatch/tn/tn-west.yaml | full-YAML-parse | 9453 | 5a01a63ada174aab |
| packages/content/package.json | direct-read | 825 | ac8dcb96edd70b6c |
| packages/content/patterns/adams.yaml | full-YAML-parse | 366 | 2a4a8b0d68f3378b |
| packages/content/patterns/autumn-sedge-dry.yaml | full-YAML-parse | 349 | 601ab00bfc2c33fd |
| packages/content/patterns/bitch-creek-nymph.yaml | full-YAML-parse | 357 | 28be86bcfb3d0c0a |
| packages/content/patterns/black-ghost.yaml | full-YAML-parse | 360 | 14c2c0fd6a1e45b0 |
| packages/content/patterns/black-nose-dace-streamer.yaml | full-YAML-parse | 340 | 31f551284c8e658e |
| packages/content/patterns/black-stone-dry.yaml | full-YAML-parse | 382 | e1a9f2e3880ad898 |
| packages/content/patterns/black-stone-nymph.yaml | full-YAML-parse | 433 | a266d431b828716d |
| packages/content/patterns/blue-quill-dry.yaml | full-YAML-parse | 308 | b3f4286b8a1b68bb |
| packages/content/patterns/blue-winged-olive-comparadun.yaml | full-YAML-parse | 406 | c9769560f8f7dcab |
| packages/content/patterns/blue-winged-olive-dun.yaml | full-YAML-parse | 399 | c3c0b1425e06187f |
| packages/content/patterns/blue-winged-olive-parachute.yaml | full-YAML-parse | 425 | 1fef945903922267 |
| packages/content/patterns/blue-winged-olive-sparkle-dun.yaml | full-YAML-parse | 448 | 315a278ae1c99392 |
| packages/content/patterns/brassie.yaml | full-YAML-parse | 304 | 871decfc813cad39 |
| packages/content/patterns/bwo-emerger.yaml | full-YAML-parse | 343 | d4c0f3a0386178d3 |
| packages/content/patterns/bwo-soft-hackle.yaml | full-YAML-parse | 324 | 29351d2e05abb81b |
| packages/content/patterns/caddis-pupa-olive.yaml | full-YAML-parse | 377 | caf2bde95875ead4 |
| packages/content/patterns/caddis-pupa-tan.yaml | full-YAML-parse | 392 | 8a0583e8fbcb7559 |
| packages/content/patterns/caddis-soft-hackle.yaml | full-YAML-parse | 326 | d59559c0100e0ff4 |
| packages/content/patterns/caenis-spinner.yaml | full-YAML-parse | 343 | 8ea4ea170fb06f29 |
| packages/content/patterns/cdc-midge-emerger.yaml | full-YAML-parse | 335 | 544bb0479106f074 |
| packages/content/patterns/chernobyl-ant.yaml | full-YAML-parse | 367 | 438a0ffa95b3faac |
| packages/content/patterns/chocolate-dun-parachute.yaml | full-YAML-parse | 302 | bdc1f728a3339f08 |
| packages/content/patterns/cinnamon-ant.yaml | full-YAML-parse | 270 | b585958270299a66 |
| packages/content/patterns/clouser-crayfish.yaml | full-YAML-parse | 378 | 1e3752d891634512 |
| packages/content/patterns/clouser-minnow.yaml | full-YAML-parse | 436 | 130293b2bf6b4cea |
| packages/content/patterns/coffin-fly-dry.yaml | full-YAML-parse | 333 | 347b5a5bbc623d92 |
| packages/content/patterns/copper-john.yaml | full-YAML-parse | 504 | 7b7dfd5161887ad3 |
| packages/content/patterns/crane-fly-adult-dry.yaml | full-YAML-parse | 291 | 0d563795d251112d |
| packages/content/patterns/crane-fly-larva.yaml | full-YAML-parse | 273 | 2459a8bc460fd8cc |
| packages/content/patterns/cream-cahill-dry.yaml | full-YAML-parse | 273 | e7d5ccd8fc9885ba |
| packages/content/patterns/cream-comparadun.yaml | full-YAML-parse | 390 | 08d97faa5715f070 |
| packages/content/patterns/damsel-nymph-olive.yaml | full-YAML-parse | 329 | a92a873f322f68ef |
| packages/content/patterns/dark-cahill-dry.yaml | full-YAML-parse | 269 | 0d2e89305199cc5e |
| packages/content/patterns/daves-hopper.yaml | full-YAML-parse | 406 | d0a3951122533dcb |
| packages/content/patterns/deep-sparkle-pupa.yaml | full-YAML-parse | 350 | ac1e868ea96d69db |
| packages/content/patterns/double-bead-stone.yaml | full-YAML-parse | 313 | 6d8b47ce0c856ff8 |
| packages/content/patterns/double-bunny-black.yaml | full-YAML-parse | 363 | 00211a222d6b12d5 |
| packages/content/patterns/early-black-stone-dry.yaml | full-YAML-parse | 365 | d9ca61aef788f0ee |
| packages/content/patterns/elk-hair-caddis-black.yaml | full-YAML-parse | 397 | 549e0cbebdb14298 |
| packages/content/patterns/elk-hair-caddis-dun.yaml | full-YAML-parse | 392 | 4ff80242b3535ce2 |
| packages/content/patterns/elk-hair-caddis-olive.yaml | full-YAML-parse | 426 | 484d0cda6d2c31f4 |
| packages/content/patterns/elk-hair-caddis-tan.yaml | full-YAML-parse | 484 | bde9c604896cb211 |
| packages/content/patterns/flashback-hares-ear.yaml | full-YAML-parse | 356 | a12cf877b1b8d3e4 |
| packages/content/patterns/flashback-pheasant-tail.yaml | full-YAML-parse | 411 | 2c8b0e4d3d3db766 |
| packages/content/patterns/flying-ant-dry.yaml | full-YAML-parse | 273 | cd12dacfd671b7eb |
| packages/content/patterns/foam-ant-black.yaml | full-YAML-parse | 258 | dc64ac4e3e8e17e0 |
| packages/content/patterns/foam-back-crawfish.yaml | full-YAML-parse | 326 | b2d345c60efcd515 |
| packages/content/patterns/foam-beetle.yaml | full-YAML-parse | 457 | 61934435a0b210ac |
| packages/content/patterns/foam-cicada.yaml | full-YAML-parse | 337 | 7f9b8499eb27fa2d |
| packages/content/patterns/foam-cricket.yaml | full-YAML-parse | 263 | 13b1c732a877312b |
| packages/content/patterns/foam-hopper.yaml | full-YAML-parse | 287 | ed13111d40a9f20b |
| packages/content/patterns/fur-ant.yaml | full-YAML-parse | 293 | cd84e48734dbc530 |
| packages/content/patterns/gartside-gurgler.yaml | full-YAML-parse | 376 | 087d7c72c5bdc6ae |
| packages/content/patterns/ginger-quill.yaml | full-YAML-parse | 326 | 79ad98763843306d |
| packages/content/patterns/girdle-bug.yaml | full-YAML-parse | 381 | 282061624b5db58e |
| packages/content/patterns/glo-bug.yaml | full-YAML-parse | 284 | 0aa11238e20047ca |
| packages/content/patterns/goddard-caddis.yaml | full-YAML-parse | 363 | 75a03b00087f04bd |
| packages/content/patterns/gold-ribbed-hares-ear.yaml | full-YAML-parse | 479 | 98a20f110fe28998 |
| packages/content/patterns/grannom-dry.yaml | full-YAML-parse | 286 | d97ad71c3bcfff12 |
| packages/content/patterns/grannom-larva.yaml | full-YAML-parse | 274 | 70405b1c19331af7 |
| packages/content/patterns/gray-drake-nymph.yaml | full-YAML-parse | 267 | 58bd672b4b3f128b |
| packages/content/patterns/gray-drake-spinner.yaml | full-YAML-parse | 307 | 4da85e999328ec70 |
| packages/content/patterns/green-rock-worm.yaml | full-YAML-parse | 315 | 2cf7dd261ea04cd7 |
| packages/content/patterns/green-weenie.yaml | full-YAML-parse | 311 | f5d1f44ff57667ab |
| packages/content/patterns/grey-ghost.yaml | full-YAML-parse | 402 | 8b03f3fae2cd9506 |
| packages/content/patterns/griffiths-gnat.yaml | full-YAML-parse | 448 | c379ab86c63e58ef |
| packages/content/patterns/hares-ear-soft-hackle.yaml | full-YAML-parse | 304 | 321b6673f8f5f95a |
| packages/content/patterns/hellgrammite-fly.yaml | full-YAML-parse | 410 | 2c4de34791830675 |
| packages/content/patterns/henryville-special.yaml | full-YAML-parse | 353 | 3ef6aca428f78ec0 |
| packages/content/patterns/hex-dun-dry.yaml | full-YAML-parse | 292 | 5c591de4246271a4 |
| packages/content/patterns/hex-emerger.yaml | full-YAML-parse | 271 | f9c40c511fb42837 |
| packages/content/patterns/hex-nymph.yaml | full-YAML-parse | 372 | eb3a4953fbf47cea |
| packages/content/patterns/inchworm-dry.yaml | full-YAML-parse | 282 | 6168bc45b0902e03 |
| packages/content/patterns/iris-caddis.yaml | full-YAML-parse | 369 | 13fef051a0fd791f |
| packages/content/patterns/isonychia-nymph.yaml | full-YAML-parse | 354 | 39f7d514badc843c |
| packages/content/patterns/japanese-beetle-dry.yaml | full-YAML-parse | 323 | c07ff5b9b4487874 |
| packages/content/patterns/leadwing-coachman.yaml | full-YAML-parse | 295 | 441b0b266fbb1814 |
| packages/content/patterns/light-cahill-dry.yaml | full-YAML-parse | 367 | 666c16509d4081f7 |
| packages/content/patterns/light-cahill-nymph.yaml | full-YAML-parse | 326 | da886f2aca573b72 |
| packages/content/patterns/lime-trude.yaml | full-YAML-parse | 334 | 736a9e5f16fb3e0d |
| packages/content/patterns/little-black-caddis-dry.yaml | full-YAML-parse | 348 | a0dba4efb818adc0 |
| packages/content/patterns/little-olive-caddis-dry.yaml | full-YAML-parse | 321 | bad349a17b1cf9a8 |
| packages/content/patterns/little-sulphur-dun-dry.yaml | full-YAML-parse | 291 | ce14ba334e1bbce1 |
| packages/content/patterns/little-yellow-quill-dry.yaml | full-YAML-parse | 307 | 1fa1afe9bfc55f32 |
| packages/content/patterns/long-horn-sedge-dry.yaml | full-YAML-parse | 307 | 961ecda57146d01a |
| packages/content/patterns/marabou-muddler.yaml | full-YAML-parse | 320 | 4177305c5f9b81fb |
| packages/content/patterns/march-brown-dry.yaml | full-YAML-parse | 298 | 7f99571843e3456e |
| packages/content/patterns/march-brown-nymph.yaml | full-YAML-parse | 367 | c8b777a342f43781 |
| packages/content/patterns/march-brown-wet.yaml | full-YAML-parse | 278 | cdc748a212599afc |
| packages/content/patterns/meat-whistle.yaml | full-YAML-parse | 339 | dcdda8f64996e945 |
| packages/content/patterns/mickey-finn.yaml | full-YAML-parse | 367 | b922b0a5a5d1e780 |
| packages/content/patterns/midge-pupa-olive.yaml | full-YAML-parse | 320 | 0f300111f2c7e3c6 |
| packages/content/patterns/muddler-minnow.yaml | full-YAML-parse | 399 | 458ed7b19dee4ce6 |
| packages/content/patterns/near-nuff-sculpin.yaml | full-YAML-parse | 357 | c0a07119e8ee36fd |
| packages/content/patterns/october-caddis-larva.yaml | full-YAML-parse | 297 | 434c168d176bcaba |
| packages/content/patterns/orange-stimulator.yaml | full-YAML-parse | 412 | 5ad9e06149e5a4b8 |
| packages/content/patterns/pale-evening-dun-dry.yaml | full-YAML-parse | 329 | 7898d2aeda437931 |
| packages/content/patterns/parachute-adams.yaml | full-YAML-parse | 394 | 62d2e837a3e4fd24 |
| packages/content/patterns/parachute-midge-black.yaml | full-YAML-parse | 352 | 7a043b5a3a58d16d |
| packages/content/patterns/partridge-and-orange.yaml | full-YAML-parse | 363 | 5d7118077b6d410f |
| packages/content/patterns/partridge-and-yellow.yaml | full-YAML-parse | 304 | 68a2b057790a2796 |
| packages/content/patterns/pats-rubber-legs.yaml | full-YAML-parse | 510 | ad6ccdecb3faa1f1 |
| packages/content/patterns/pheasant-tail-nymph.yaml | full-YAML-parse | 508 | c84edf14243565ae |
| packages/content/patterns/pheasant-tail-soft-hackle.yaml | full-YAML-parse | 338 | 5e283b2fd7f3f4d5 |
| packages/content/patterns/poly-wing-spinner.yaml | full-YAML-parse | 397 | 0a72962101f93b80 |
| packages/content/patterns/prince-nymph.yaml | full-YAML-parse | 451 | 963ebe2d972996cf |
| packages/content/patterns/quill-body-bwo.yaml | full-YAML-parse | 281 | 69f2d3bb0406eef1 |
| packages/content/patterns/quill-gordon-dry.yaml | full-YAML-parse | 321 | 21bdba0a3451c90e |
| packages/content/patterns/ray-charles.yaml | full-YAML-parse | 386 | 65ec42f72da960ad |
| packages/content/patterns/renegade.yaml | full-YAML-parse | 320 | 5886cdfed99d3379 |
| packages/content/patterns/riffle-beetle-dry.yaml | full-YAML-parse | 302 | d83a695fd166934b |
| packages/content/patterns/river-bed-burrower-nymph.yaml | full-YAML-parse | 289 | 77af9d7706b3eba0 |
| packages/content/patterns/royal-trude.yaml | full-YAML-parse | 336 | 036cc1be7ce0a494 |
| packages/content/patterns/royal-wulff.yaml | full-YAML-parse | 407 | ef1d57bcc4817e6e |
| packages/content/patterns/rs2-emerger.yaml | full-YAML-parse | 431 | 0faa0c2a5b170b01 |
| packages/content/patterns/rusty-spinner.yaml | full-YAML-parse | 387 | e3157266c65c8761 |
| packages/content/patterns/san-juan-worm.yaml | full-YAML-parse | 301 | ed35149d07453283 |
| packages/content/patterns/sawyer-pheasant-tail.yaml | full-YAML-parse | 432 | 0a39c5f817092b76 |
| packages/content/patterns/scud-gray.yaml | full-YAML-parse | 251 | a8b08ebfa23b52e6 |
| packages/content/patterns/scud-olive.yaml | full-YAML-parse | 290 | 7c0b8bb2fc19dc1b |
| packages/content/patterns/scud-orange.yaml | full-YAML-parse | 251 | 4f560766e0d90918 |
| packages/content/patterns/slate-drake-parachute.yaml | full-YAML-parse | 313 | 13b4cff12c20a31d |
| packages/content/patterns/slumpbuster.yaml | full-YAML-parse | 353 | 2ca5effa15582a23 |
| packages/content/patterns/snail-pattern-black.yaml | full-YAML-parse | 315 | bd2a49d9ed7b01e0 |
| packages/content/patterns/sowbug-gray.yaml | full-YAML-parse | 269 | 53d312afb07a7b64 |
| packages/content/patterns/sparkle-pupa.yaml | full-YAML-parse | 459 | b797acc6a37a24b7 |
| packages/content/patterns/split-case-bwo-nymph.yaml | full-YAML-parse | 444 | a71dedbc6ec410ee |
| packages/content/patterns/squirmy-wormy.yaml | full-YAML-parse | 295 | 40f55d46c8942972 |
| packages/content/patterns/sucker-spawn.yaml | full-YAML-parse | 294 | 1ea88620f5080290 |
| packages/content/patterns/sulphur-comparadun.yaml | full-YAML-parse | 353 | 67baf3d3965f9e81 |
| packages/content/patterns/sulphur-emerger.yaml | full-YAML-parse | 308 | 9a07a54084d002b1 |
| packages/content/patterns/sulphur-nymph.yaml | full-YAML-parse | 344 | 263d26175d313d65 |
| packages/content/patterns/sulphur-parachute.yaml | full-YAML-parse | 338 | 92d19e8d5ea8009f |
| packages/content/patterns/sulphur-soft-hackle.yaml | full-YAML-parse | 291 | 7c337540d8945f2a |
| packages/content/patterns/sulphur-spinner.yaml | full-YAML-parse | 352 | c9d5344ece207fa4 |
| packages/content/patterns/trico-parachute.yaml | full-YAML-parse | 304 | 36bc9b01f80c613a |
| packages/content/patterns/trico-spinner.yaml | full-YAML-parse | 340 | c1a7fd98891f3718 |
| packages/content/patterns/two-bit-hooker.yaml | full-YAML-parse | 412 | 0889abf40b474d7f |
| packages/content/patterns/white-fly-dry.yaml | full-YAML-parse | 319 | 4c7af24ff428cfbd |
| packages/content/patterns/white-fly-spinner.yaml | full-YAML-parse | 289 | f2003f1c1ae79508 |
| packages/content/patterns/white-miller-caddis-dry.yaml | full-YAML-parse | 300 | 1afc97577f9d942b |
| packages/content/patterns/woolly-bugger-black.yaml | full-YAML-parse | 357 | 318dd374b2d9af89 |
| packages/content/patterns/woolly-bugger-brown.yaml | full-YAML-parse | 374 | 989c12630f81ce0a |
| packages/content/patterns/woolly-bugger-olive.yaml | full-YAML-parse | 475 | e8551014f573ead5 |
| packages/content/patterns/woolly-bugger-rust.yaml | full-YAML-parse | 358 | 45cd8ad1b4d2c7c4 |
| packages/content/patterns/woolly-bugger-white.yaml | full-YAML-parse | 393 | 2ad456f68a1efd8f |
| packages/content/patterns/x-caddis-tan.yaml | full-YAML-parse | 404 | 86efda583ca6afa4 |
| packages/content/patterns/yellow-drake-dry.yaml | full-YAML-parse | 295 | 452cc2f19876f282 |
| packages/content/patterns/yellow-hammer.yaml | full-YAML-parse | 383 | 177d3de0315b6c1b |
| packages/content/patterns/yellow-sally-dry.yaml | full-YAML-parse | 344 | 8dabfc52590b13e1 |
| packages/content/patterns/yellow-stimulator.yaml | full-YAML-parse | 459 | b82880d5a72f3ea7 |
| packages/content/patterns/yellow-stone-nymph.yaml | full-YAML-parse | 372 | 9fcf8e2533d08a9a |
| packages/content/patterns/zebra-midge-black.yaml | full-YAML-parse | 394 | ee9530173d558437 |
| packages/content/patterns/zebra-midge-red.yaml | full-YAML-parse | 288 | 621d0f379388e30f |
| packages/content/patterns/zonker-olive.yaml | full-YAML-parse | 324 | 1b40245ca05487ff |
| packages/content/research/f2-species-reference.md | document-outline-and-link-index | 3694 | bb0a4f991fde053f |
| packages/content/research/f3-evidence-pass2.md | document-outline-and-link-index | 6094 | bcd83c11aac355e6 |
| packages/content/research/f3-evidence-pass3.md | document-outline-and-link-index | 3224 | aa1d0b6f40ea3741 |
| packages/content/research/f3-species-mapping.yaml | full-YAML-parse | 61826 | 0f9cce584d24a217 |
| packages/content/research/fishbrain-tn-graphql-discovery.json | full-JSON-parse-and-coordinate-check | 258384 | 58c0882221e23d47 |
| packages/content/research/fishbrain-tn-graphql-standard-discovery.json | full-JSON-parse-and-coordinate-check | 341997 | a30987d7390078dd |
| packages/content/scripts/build.ts | program-read | 4787 | e92078c90ff83980 |
| packages/content/scripts/f3-author-pass2.py | program-structure-review | 6626 | 0bb155c1c7aeb14a |
| packages/content/scripts/f3-author-pass3.py | program-structure-review | 3949 | 8bb9562834ada38e |
| packages/content/scripts/f3-species-mapping.mjs | program-structure-review | 7388 | 9ce9057ef4ffdfe2 |
| packages/content/scripts/lib.ts | program-read | 24115 | 4227c3f228f107cb |
| packages/content/scripts/opportunity/apply-opportunity.mjs | program-structure-review | 9376 | 6b996bdeafc733a7 |
| packages/content/scripts/opportunity/apply-owner-rulings.mjs | program-structure-review | 10041 | 6177c1e940524abb |
| packages/content/scripts/opportunity/apply-triage.mjs | program-structure-review | 14676 | 9b7ec042a804eb8e |
| packages/content/scripts/opportunity/build-seed.mjs | program-structure-review | 8605 | 103fb0425bfc549b |
| packages/content/scripts/opportunity/distill-prior-leads.mjs | program-structure-review | 3952 | da4175cb01e2d3f4 |
| packages/content/scripts/opportunity/join-stock-points.mjs | program-structure-review | 2020 | 472e03d0548a6838 |
| packages/content/scripts/opportunity/lib.mjs | program-structure-review | 16826 | 9a22be01d7d2d843 |
| packages/content/scripts/opportunity/merge-verdicts.mjs | program-structure-review | 4536 | e2e537a0292909fb |
| packages/content/scripts/opportunity/report-counts.mjs | program-structure-review | 980 | f0d06d3932bc9986 |
| packages/content/scripts/opportunity/verify-captures.mjs | program-structure-review | 1424 | 29ca347402cdbca7 |
| packages/content/scripts/opportunity/verify-ledger.mjs | program-structure-review | 10677 | 6abaddbc66ae262b |
| packages/content/scripts/regions.ts | direct-read | 1739 | ea94ae1779437a42 |
| packages/content/scripts/report.ts | direct-read | 2469 | fd96d184c0dc7ef1 |
| packages/content/scripts/validate.ts | program-read | 4279 | dd14b40de0909a6e |
| packages/content/scripts/wave-ledgers/apply-ledgers.mjs | program-structure-review | 14372 | ca1afc8f6c17b656 |
| packages/content/scripts/wave-ledgers/apply-regs-notes.mjs | program-structure-review | 3122 | c0c07308bae8b91b |
| packages/content/scripts/wave-ledgers/diff-ledgers.mjs | program-structure-review | 18460 | 78e78986cac3decc |
| packages/content/scripts/wave-ledgers/parse-ledgers.mjs | program-structure-review | 7030 | 5870eb2f8ca0ee51 |
| packages/content/scripts/wave-ledgers/wire-gauges.mjs | program-structure-review | 3630 | d603c071dbd445d4 |
| packages/content/shops/.gitkeep | direct-read | 96 | 47258e7ce4451d47 |
| packages/content/shops/tn/angry-eagle-lodge-outfitters.yaml | full-YAML-parse | 155 | 12402346b596b875 |
| packages/content/shops/tn/binks-lodge.yaml | full-YAML-parse | 121 | 7eee1b2e96e2dbc9 |
| packages/content/shops/tn/competitive-angler.yaml | full-YAML-parse | 138 | 5bc56003c9639f8b |
| packages/content/shops/tn/cumberland-transit.yaml | full-YAML-parse | 140 | 37e671173dd3c2f9 |
| packages/content/shops/tn/eastern-fly-outfitters.yaml | full-YAML-parse | 153 | 13b2908d60d1298e |
| packages/content/shops/tn/fly-south.yaml | full-YAML-parse | 113 | d55782b6cc06a5b7 |
| packages/content/shops/tn/harpeth-river-outfitters.yaml | full-YAML-parse | 154 | 6fbb23d7db2bf5d0 |
| packages/content/shops/tn/little-river-outfitters.yaml | full-YAML-parse | 153 | 8468fcd6d6178864 |
| packages/content/shops/tn/orvis-knoxville.yaml | full-YAML-parse | 145 | 7cd9a22e55aa0cfc |
| packages/content/shops/tn/orvis-memphis.yaml | full-YAML-parse | 144 | 1213a0ed7f85cf15 |
| packages/content/shops/tn/orvis-sevierville.yaml | full-YAML-parse | 160 | 92c532f8eb6a1556 |
| packages/content/shops/tn/reliance-fly-and-tackle.yaml | full-YAML-parse | 154 | 57158411d94e14b3 |
| packages/content/shops/tn/smoky-mountain-angler.yaml | full-YAML-parse | 153 | 2531271eaafb59ef |
| packages/content/shops/tn/south-holston-river-fly-shop.yaml | full-YAML-parse | 165 | a99689d49b5ddc37 |
| packages/content/shops/tn/tellico-outfitters.yaml | full-YAML-parse | 145 | b6890d956ff4e5e5 |
| packages/content/shops/tn/tennessee-traditional-flies.yaml | full-YAML-parse | 168 | 7865cc08d6fa0e9a |
| packages/content/shops/tn/the-fly-box.yaml | full-YAML-parse | 118 | 5f6af9afa5f71df8 |
| packages/content/shops/tn/the-hatch-outfitters.yaml | full-YAML-parse | 147 | f253d8242d32c894 |
| packages/content/shops/tn/three-rivers-angler.yaml | full-YAML-parse | 134 | 9bd4b8a916881b11 |
| packages/content/shops/tn/tims-flies-and-lies.yaml | full-YAML-parse | 152 | ea614b15e34c971e |
| packages/content/shops/tn/tn-fly-co.yaml | full-YAML-parse | 113 | 53d517771546151a |
| packages/content/shops/tn/toccoa-river-outfitters.yaml | full-YAML-parse | 166 | 33f536c27a43cd0e |
| packages/content/shops/tn/trophy-water-guide-service.yaml | full-YAML-parse | 160 | 8e3c35ae4700fbd3 |
| packages/content/species/species-reference.yaml | full-YAML-parse | 9365 | 99d747c1858b4a52 |
| packages/content/streams/.gitkeep | direct-read | 96 | 47258e7ce4451d47 |
| packages/content/streams/tn/barren-fork-river.yaml | full-YAML-parse | 2716 | c34e186d4334a068 |
| packages/content/streams/tn/beaverdam-creek.yaml | full-YAML-parse | 3333 | fa3d80ddcd72a1a6 |
| packages/content/streams/tn/beech-lake.yaml | full-YAML-parse | 2775 | edd0d6bc913dd961 |
| packages/content/streams/tn/beech-river.yaml | full-YAML-parse | 1447 | 4aa59337e7f406c8 |
| packages/content/streams/tn/big-bigby-creek.yaml | full-YAML-parse | 1363 | 864c94b1b52ddf07 |
| packages/content/streams/tn/big-rock-creek.yaml | full-YAML-parse | 2307 | a0044e1f0586815d |
| packages/content/streams/tn/big-sandy-river.yaml | full-YAML-parse | 2060 | b766822f646ffe22 |
| packages/content/streams/tn/big-sewee-creek.yaml | full-YAML-parse | 1365 | d31392560136a327 |
| packages/content/streams/tn/big-soddy-creek.yaml | full-YAML-parse | 2711 | 1efa47f11c828096 |
| packages/content/streams/tn/big-swan-creek.yaml | full-YAML-parse | 1354 | ad19a7b6ce9d214b |
| packages/content/streams/tn/blackburn-fork.yaml | full-YAML-parse | 1453 | ccf133985a5296ea |
| packages/content/streams/tn/boiling-fork-creek.yaml | full-YAML-parse | 2196 | 9383580e6703b573 |
| packages/content/streams/tn/boone-lake.yaml | full-YAML-parse | 4724 | 86074b6120761131 |
| packages/content/streams/tn/boone-tailwater.yaml | full-YAML-parse | 3910 | ba74434737fe153d |
| packages/content/streams/tn/bradley-creek.yaml | full-YAML-parse | 1321 | e5f7d4ccac9d04fd |
| packages/content/streams/tn/brimstone-creek.yaml | full-YAML-parse | 1321 | c9aa33eb0ffc6f15 |
| packages/content/streams/tn/brush-creek-cocke.yaml | full-YAML-parse | 2537 | 9f7f09952ea1071a |
| packages/content/streams/tn/buffalo-creek-grainger.yaml | full-YAML-parse | 4653 | b52068dc908fd6f5 |
| packages/content/streams/tn/buffalo-river.yaml | full-YAML-parse | 3009 | 893f7034678bf55e |
| packages/content/streams/tn/bullrun-creek.yaml | full-YAML-parse | 1388 | c587697c5432bee3 |
| packages/content/streams/tn/calderwood-lake.yaml | full-YAML-parse | 5208 | 2b439e1e82be92df |
| packages/content/streams/tn/calfkiller-river.yaml | full-YAML-parse | 2445 | edc0a5b1537c750a |
| packages/content/streams/tn/cameron-brown-lake.yaml | full-YAML-parse | 2764 | ce5c6da56f5673be |
| packages/content/streams/tn/candies-creek.yaml | full-YAML-parse | 1238 | 20cbfb3f304a2937 |
| packages/content/streams/tn/cane-creek-hickman-perry.yaml | full-YAML-parse | 2687 | 74d92df92132df20 |
| packages/content/streams/tn/cane-creek.yaml | full-YAML-parse | 2594 | 7467324e7dc7fd07 |
| packages/content/streams/tn/caney-fork-river.yaml | full-YAML-parse | 4201 | 90da4d7664b0a2f3 |
| packages/content/streams/tn/caney-fork-upper.yaml | full-YAML-parse | 3521 | 075d0b364dc2c9ef |
| packages/content/streams/tn/center-hill-lake.yaml | full-YAML-parse | 4567 | b2cb5f1c930eeab6 |
| packages/content/streams/tn/charles-creek.yaml | full-YAML-parse | 2191 | 5548a50f018bca46 |
| packages/content/streams/tn/cherokee-lake.yaml | full-YAML-parse | 4960 | 0e97c47f0b212f5b |
| packages/content/streams/tn/chestuee-creek.yaml | full-YAML-parse | 1413 | f91d2198fb2141bf |
| packages/content/streams/tn/chickamauga-lake.yaml | full-YAML-parse | 4090 | 172e008ce6fc9878 |
| packages/content/streams/tn/chilhowee-lake.yaml | full-YAML-parse | 4970 | 38c78abb2e2ee2d9 |
| packages/content/streams/tn/citico-creek.yaml | full-YAML-parse | 3617 | 65e20ea30b45e696 |
| packages/content/streams/tn/clear-creek-obed.yaml | full-YAML-parse | 3403 | 24572677cdf303dd |
| packages/content/streams/tn/clear-fork.yaml | full-YAML-parse | 1434 | f197da66e552a6a7 |
| packages/content/streams/tn/clinch-river.yaml | full-YAML-parse | 4324 | a475a3f1bcbd366c |
| packages/content/streams/tn/collins-river.yaml | full-YAML-parse | 2529 | 1166fa3f59b3347a |
| packages/content/streams/tn/conasauga-river.yaml | full-YAML-parse | 2405 | adebb51369f4a627 |
| packages/content/streams/tn/cosby-creek.yaml | full-YAML-parse | 3902 | f819a61a383de924 |
| packages/content/streams/tn/covington-fbc-pond.yaml | full-YAML-parse | 2721 | f0243fe46e463a90 |
| packages/content/streams/tn/crab-orchard-creek.yaml | full-YAML-parse | 1297 | 9ae68ddf8be9cbdf |
| packages/content/streams/tn/cumberland-river.yaml | full-YAML-parse | 3365 | 4424cf174c111ef9 |
| packages/content/streams/tn/daddys-creek.yaml | full-YAML-parse | 3297 | a307b663ed41484f |
| packages/content/streams/tn/dale-hollow-lake.yaml | full-YAML-parse | 5634 | 2fc77e2e174eb70e |
| packages/content/streams/tn/doe-creek-johnson.yaml | full-YAML-parse | 3222 | c8079509ea922b6e |
| packages/content/streams/tn/doe-river.yaml | full-YAML-parse | 3816 | df9d1ce619cc283b |
| packages/content/streams/tn/douglas-lake.yaml | full-YAML-parse | 4138 | afa7952398860ff5 |
| packages/content/streams/tn/duck-river-lower.yaml | full-YAML-parse | 4710 | 77e99a201b654dba |
| packages/content/streams/tn/duck-river-mouth.yaml | full-YAML-parse | 5387 | b2797c096b3a3a65 |
| packages/content/streams/tn/duck-river-tailwater.yaml | full-YAML-parse | 4185 | ba8b7cf4a0f4e295 |
| packages/content/streams/tn/dumplin-creek.yaml | full-YAML-parse | 1470 | 14ffbebfecd393dd |
| packages/content/streams/tn/east-fork-obey-river.yaml | full-YAML-parse | 1689 | 0a0ab91cfea02dce |
| packages/content/streams/tn/east-fork-shoal-creek.yaml | full-YAML-parse | 2692 | 25fee5792b8ddcfd |
| packages/content/streams/tn/east-fork-stones-river.yaml | full-YAML-parse | 2394 | 53f0a2287f1d0e78 |
| packages/content/streams/tn/edmund-orgill-lake.yaml | full-YAML-parse | 2585 | 4f20b03fd3ca64f7 |
| packages/content/streams/tn/elk-river-lower.yaml | full-YAML-parse | 3153 | 6d53e32f8315d62c |
| packages/content/streams/tn/elk-river.yaml | full-YAML-parse | 4431 | 90100ca1e8e81959 |
| packages/content/streams/tn/emory-river.yaml | full-YAML-parse | 2756 | 369828065fb028fb |
| packages/content/streams/tn/falling-water-river.yaml | full-YAML-parse | 2204 | 64b4bf79fd545f3c |
| packages/content/streams/tn/fletchers-fork.yaml | full-YAML-parse | 2928 | 12e5ec32b70e7c77 |
| packages/content/streams/tn/forge-creek-johnson.yaml | full-YAML-parse | 2359 | 5df95a46a2b422b8 |
| packages/content/streams/tn/forked-deer-river.yaml | full-YAML-parse | 2461 | 2638f5d59a761951 |
| packages/content/streams/tn/fort-loudoun-lake.yaml | full-YAML-parse | 4039 | 641392603d4353e8 |
| packages/content/streams/tn/fort-patrick-henry-lake.yaml | full-YAML-parse | 6142 | 51a693cc4309a2d9 |
| packages/content/streams/tn/french-broad-river.yaml | full-YAML-parse | 3989 | 2d1c618c738e83a8 |
| packages/content/streams/tn/ft-patrick-henry-tailwater.yaml | full-YAML-parse | 4006 | 4ebf47c3255a1127 |
| packages/content/streams/tn/gap-creek-claiborne.yaml | full-YAML-parse | 2466 | e9ff0cbda09fdc00 |
| packages/content/streams/tn/goforth-creek.yaml | full-YAML-parse | 2298 | 45f53dea1dc646fc |
| packages/content/streams/tn/greasy-creek-polk.yaml | full-YAML-parse | 2422 | e0a3120ed55cf128 |
| packages/content/streams/tn/great-falls-lake.yaml | full-YAML-parse | 3574 | c25615b2a2e1736a |
| packages/content/streams/tn/gulf-fork-big-creek.yaml | full-YAML-parse | 3269 | 4812186451b55d78 |
| packages/content/streams/tn/harpeth-river.yaml | full-YAML-parse | 3524 | c7a97742a5c5258c |
| packages/content/streams/tn/hatchie-river.yaml | full-YAML-parse | 3424 | f2ea25b64c3349ed |
| packages/content/streams/tn/hiwassee-river.yaml | full-YAML-parse | 5251 | af02f57a4fe83608 |
| packages/content/streams/tn/holston-river.yaml | full-YAML-parse | 5987 | 563e76b298e9c9c4 |
| packages/content/streams/tn/horse-creek-greene.yaml | full-YAML-parse | 3384 | 85ce50867853aabc |
| packages/content/streams/tn/hurricane-creek.yaml | full-YAML-parse | 2766 | cb4689ae3a36395d |
| packages/content/streams/tn/indian-creek-claiborne.yaml | full-YAML-parse | 2480 | 57429a63d65d239b |
| packages/content/streams/tn/j-percy-priest-lake.yaml | full-YAML-parse | 4162 | 49fbeee909984b99 |
| packages/content/streams/tn/johnson-park-lake.yaml | full-YAML-parse | 2575 | c8828786e015c687 |
| packages/content/streams/tn/kentucky-lake.yaml | full-YAML-parse | 3910 | 019aa2ed180261bc |
| packages/content/streams/tn/lake-barkley.yaml | full-YAML-parse | 4324 | 41248aa2258280b5 |
| packages/content/streams/tn/lake-graham.yaml | full-YAML-parse | 4491 | 7aa9d6f741494213 |
| packages/content/streams/tn/laurel-creek-johnson.yaml | full-YAML-parse | 2595 | 6f2075d10be7cab4 |
| packages/content/streams/tn/laurel-fork-carter.yaml | full-YAML-parse | 3419 | c7b969f8eb249f87 |
| packages/content/streams/tn/leconte-creek.yaml | full-YAML-parse | 4134 | 086ebd8ae7dff226 |
| packages/content/streams/tn/little-buffalo-river.yaml | full-YAML-parse | 3130 | 5ae9ac91509a92c4 |
| packages/content/streams/tn/little-chuckey-creek.yaml | full-YAML-parse | 1366 | 0d4cd8a8fd2b0a36 |
| packages/content/streams/tn/little-harpeth-river.yaml | full-YAML-parse | 1557 | 28d62910330c7f9d |
| packages/content/streams/tn/little-pigeon-river.yaml | full-YAML-parse | 3357 | 2a6460b294427849 |
| packages/content/streams/tn/little-river.yaml | full-YAML-parse | 5774 | f76d025be04c5375 |
| packages/content/streams/tn/little-sequatchie-river.yaml | full-YAML-parse | 2551 | faf03bf054aa2dc6 |
| packages/content/streams/tn/little-tennessee-river.yaml | full-YAML-parse | 3719 | 8788e52192ec00e9 |
| packages/content/streams/tn/little-west-fork-creek.yaml | full-YAML-parse | 2935 | 5b8b67f512ad5913 |
| packages/content/streams/tn/loosahatchie-river.yaml | full-YAML-parse | 1611 | 95a67e4b14597138 |
| packages/content/streams/tn/martin-city-pond.yaml | full-YAML-parse | 2892 | db1161e5d123d19a |
| packages/content/streams/tn/mccutcheon-creek.yaml | full-YAML-parse | 2906 | 205578d351cc5288 |
| packages/content/streams/tn/melton-hill-lake.yaml | full-YAML-parse | 4935 | 4810fd97d976d0ca |
| packages/content/streams/tn/middle-fork-forked-deer-river.yaml | full-YAML-parse | 2219 | bf304fc836a8b1f8 |
| packages/content/streams/tn/middle-fork-obion-river.yaml | full-YAML-parse | 2337 | 346269313cf72657 |
| packages/content/streams/tn/middle-prong-little-pigeon.yaml | full-YAML-parse | 4029 | c5f891f8761f951d |
| packages/content/streams/tn/milan-city-pond.yaml | full-YAML-parse | 2883 | ff9046bb468eeaf4 |
| packages/content/streams/tn/mill-creek-overton.yaml | full-YAML-parse | 3491 | ecb4bc4442de8a47 |
| packages/content/streams/tn/mississippi-river.yaml | full-YAML-parse | 2552 | 8ae5c568363f58de |
| packages/content/streams/tn/mossy-creek-jefferson.yaml | full-YAML-parse | 3652 | a64100d152bedd16 |
| packages/content/streams/tn/new-river.yaml | full-YAML-parse | 2240 | 318bde80eb850acc |
| packages/content/streams/tn/nickajack-lake.yaml | full-YAML-parse | 5276 | 187943cfd90b5a2c |
| packages/content/streams/tn/nolichucky-river.yaml | full-YAML-parse | 3637 | 953245bcb8f1be57 |
| packages/content/streams/tn/nonconnah-creek.yaml | full-YAML-parse | 1436 | 7e14209b8467d2d4 |
| packages/content/streams/tn/normandy-lake.yaml | full-YAML-parse | 3675 | 776e36155962c92f |
| packages/content/streams/tn/norris-lake.yaml | full-YAML-parse | 4943 | 4c3ee092e05f1420 |
| packages/content/streams/tn/north-chickamauga-creek.yaml | full-YAML-parse | 3532 | e9f5a3769b516394 |
| packages/content/streams/tn/north-fork-forked-deer-river.yaml | full-YAML-parse | 1847 | 10a6920d91f4a428 |
| packages/content/streams/tn/north-fork-holston-river.yaml | full-YAML-parse | 3343 | 0b886ad3f00f21d4 |
| packages/content/streams/tn/north-fork-obion-river.yaml | full-YAML-parse | 2294 | 5fd11331400de926 |
| packages/content/streams/tn/north-mouse-creek.yaml | full-YAML-parse | 1621 | b61602216d8eb5a6 |
| packages/content/streams/tn/north-prong-barren-fork.yaml | full-YAML-parse | 2726 | fba0bce91bf50528 |
| packages/content/streams/tn/obed-river.yaml | full-YAML-parse | 3597 | a24e86f8bf85e323 |
| packages/content/streams/tn/obey-river.yaml | full-YAML-parse | 3569 | 960f1582e951e3e8 |
| packages/content/streams/tn/obion-river.yaml | full-YAML-parse | 3302 | d9e4e4887a130604 |
| packages/content/streams/tn/ocoee-number-three-lake.yaml | full-YAML-parse | 1663 | a8ea08f0e0176dee |
| packages/content/streams/tn/ocoee-river.yaml | full-YAML-parse | 2630 | 40fc287bcc129bee |
| packages/content/streams/tn/old-hickory-lake.yaml | full-YAML-parse | 4135 | 639f4474803a10e9 |
| packages/content/streams/tn/oostanaula-creek.yaml | full-YAML-parse | 1340 | 2cbc6257675ce069 |
| packages/content/streams/tn/paint-creek-greene.yaml | full-YAML-parse | 3300 | f741116963217086 |
| packages/content/streams/tn/paris-city-park-lake.yaml | full-YAML-parse | 1978 | f4797065c786a6d2 |
| packages/content/streams/tn/parksville-lake.yaml | full-YAML-parse | 4824 | f4fb80aa2e1f3625 |
| packages/content/streams/tn/parksville-tailwater.yaml | full-YAML-parse | 3384 | 7e346b3d0d47de87 |
| packages/content/streams/tn/pickwick-lake.yaml | full-YAML-parse | 4737 | 736a52d646a49a61 |
| packages/content/streams/tn/pigeon-river.yaml | full-YAML-parse | 3612 | 965ce6955251b393 |
| packages/content/streams/tn/pine-creek-dekalb.yaml | full-YAML-parse | 3107 | 515cb06a35dbcd13 |
| packages/content/streams/tn/piney-river-hickman.yaml | full-YAML-parse | 1858 | 5530d9cc4b9e19db |
| packages/content/streams/tn/piney-river-rhea.yaml | full-YAML-parse | 3232 | d92d78dd041fdece |
| packages/content/streams/tn/powell-river.yaml | full-YAML-parse | 3348 | fac786456013ca16 |
| packages/content/streams/tn/puncheon-camp-creek.yaml | full-YAML-parse | 2386 | 635fa9d9dfc1d0b6 |
| packages/content/streams/tn/red-river-clarksville.yaml | full-YAML-parse | 3506 | ee73b55e5c4ec6fb |
| packages/content/streams/tn/reedy-creek.yaml | full-YAML-parse | 1963 | fecf4882e02bab44 |
| packages/content/streams/tn/reelfoot-lake.yaml | full-YAML-parse | 2564 | ddadb6610f8f9af8 |
| packages/content/streams/tn/richardson-byrd-creek.yaml | full-YAML-parse | 2809 | 01f0bfb98e463233 |
| packages/content/streams/tn/richland-creek-maury.yaml | full-YAML-parse | 1664 | b16d9560e6261e36 |
| packages/content/streams/tn/roaring-fork.yaml | full-YAML-parse | 4075 | 94c7279a5c382b6a |
| packages/content/streams/tn/roaring-river.yaml | full-YAML-parse | 2487 | 9d1dd72b7e3102db |
| packages/content/streams/tn/rocky-river.yaml | full-YAML-parse | 3251 | b1294605f90f312f |
| packages/content/streams/tn/rutherford-fork-obion-river.yaml | full-YAML-parse | 2328 | 8291e32fc7491a4a |
| packages/content/streams/tn/sale-creek.yaml | full-YAML-parse | 1484 | 79ab95e58f759767 |
| packages/content/streams/tn/salt-lick-creek.yaml | full-YAML-parse | 2510 | 3264c029d0a6f16a |
| packages/content/streams/tn/sequatchie-river.yaml | full-YAML-parse | 3694 | 47bd813fdc70d3f6 |
| packages/content/streams/tn/shelby-farms-lake.yaml | full-YAML-parse | 2511 | 20d37c5ad98a5cdf |
| packages/content/streams/tn/shoal-creek.yaml | full-YAML-parse | 1916 | 33881c0ea18b6ce6 |
| packages/content/streams/tn/sinking-creek-wilson.yaml | full-YAML-parse | 2107 | 6cf437577d411528 |
| packages/content/streams/tn/south-chickamauga-creek.yaml | full-YAML-parse | 1565 | d81a8507ab5ed29a |
| packages/content/streams/tn/south-fork-cumberland.yaml | full-YAML-parse | 2246 | 971deb971d7a6976 |
| packages/content/streams/tn/south-fork-forked-deer-river.yaml | full-YAML-parse | 1778 | 79d5833d8fd88031 |
| packages/content/streams/tn/south-fork-obion-river.yaml | full-YAML-parse | 2155 | f1500ebc61d8138d |
| packages/content/streams/tn/south-holston-lake.yaml | full-YAML-parse | 5506 | 2227f3a30a4294e2 |
| packages/content/streams/tn/south-holston-river.yaml | full-YAML-parse | 4064 | a3ed3e3b22124ce0 |
| packages/content/streams/tn/south-mouse-creek.yaml | full-YAML-parse | 1611 | cc573af6dec7c744 |
| packages/content/streams/tn/spring-creek-polk.yaml | full-YAML-parse | 2581 | a902354f6355ca5d |
| packages/content/streams/tn/standing-rock-creek.yaml | full-YAML-parse | 2673 | a29509ff2f3c5c53 |
| packages/content/streams/tn/station-creek.yaml | full-YAML-parse | 2743 | f67fdeeecdacc682 |
| packages/content/streams/tn/stones-river.yaml | full-YAML-parse | 3691 | ce0a272be6a1da2c |
| packages/content/streams/tn/stoney-creek-carter.yaml | full-YAML-parse | 2991 | 930c37ea7d83e39a |
| packages/content/streams/tn/sulfur-fork-creek.yaml | full-YAML-parse | 2341 | 5832b7ad61fd5930 |
| packages/content/streams/tn/tellico-lake.yaml | full-YAML-parse | 5625 | 5958caec05813afc |
| packages/content/streams/tn/tellico-river.yaml | full-YAML-parse | 5224 | 455430ee5b5a92b8 |
| packages/content/streams/tn/tennessee-river.yaml | full-YAML-parse | 3543 | 104349a84b3f73f6 |
| packages/content/streams/tn/tims-ford-lake.yaml | full-YAML-parse | 4741 | 64718bbb1d9f5046 |
| packages/content/streams/tn/trail-fork-big-creek.yaml | full-YAML-parse | 4304 | 562324de21115e31 |
| packages/content/streams/tn/tumbling-creek.yaml | full-YAML-parse | 2404 | 4c3dce4441bb6301 |
| packages/content/streams/tn/union-city-reelfoot-pond.yaml | full-YAML-parse | 2470 | b949e9744ca24dad |
| packages/content/streams/tn/upper-hills-creek.yaml | full-YAML-parse | 2395 | 98a52477629c096c |
| packages/content/streams/tn/upper-roan-creek.yaml | full-YAML-parse | 2676 | a203e442f11fa713 |
| packages/content/streams/tn/valentine-park-pond.yaml | full-YAML-parse | 2400 | 37c80ca93369a136 |
| packages/content/streams/tn/watauga-lake.yaml | full-YAML-parse | 5803 | c6e5834613f28fac |
| packages/content/streams/tn/watauga-river-wilbur-reach.yaml | full-YAML-parse | 3093 | 5de931374bf65178 |
| packages/content/streams/tn/watauga-river.yaml | full-YAML-parse | 4351 | 9ea0803932cc2f56 |
| packages/content/streams/tn/watts-bar-lake.yaml | full-YAML-parse | 5005 | 017c207de8265755 |
| packages/content/streams/tn/west-fork-obey-river.yaml | full-YAML-parse | 1659 | 9d85091934570296 |
| packages/content/streams/tn/west-fork-stones-river.yaml | full-YAML-parse | 3712 | bce42dfde014c5f9 |
| packages/content/streams/tn/west-harpeth-river.yaml | full-YAML-parse | 1544 | 66e877a989852061 |
| packages/content/streams/tn/west-prong-little-pigeon.yaml | full-YAML-parse | 4481 | ad1d037dfb973ccb |
| packages/content/streams/tn/white-oak-creek.yaml | full-YAML-parse | 2518 | 3ab0f436078fbde3 |
| packages/content/streams/tn/wilbur-lake.yaml | full-YAML-parse | 4965 | 16ec8a4a0aa58236 |
| packages/content/streams/tn/wolf-river-fentress.yaml | full-YAML-parse | 3644 | ea6bbf41be85c4ec |
| packages/content/streams/tn/wolf-river-west-tennessee.yaml | full-YAML-parse | 3875 | a0fa687f52636ca5 |
| packages/content/streams/tn/woods-reservoir.yaml | full-YAML-parse | 3496 | 62e236d69400160c |
| packages/content/streams/tn/yale-road-park-lake.yaml | full-YAML-parse | 2470 | b29c15d89d0e874e |
| packages/content/streams/tn/yellow-creek-houston.yaml | full-YAML-parse | 1574 | 142866c05a3b116a |
| packages/content/test/content.test.ts | test-structure-review | 11152 | 207ac8a71b7ee8cb |
| packages/content/vitest.config.ts | direct-read | 573 | 53f761a0076eb0d8 |
| packages/contracts/README.md | document-outline-and-link-index | 2395 | 19e5aa5b70904a6c |
| packages/contracts/package.json | direct-read | 898 | 6ad07af01d2db3f8 |
| packages/contracts/src/endpoints.ts | program-read | 2288 | 5eef5128e21d2adf |
| packages/contracts/src/index.ts | program-read | 1159 | 256b1f7e74c25cab |
| packages/contracts/src/matchHatch.ts | program-read | 3613 | 20e6c2358a3b44e4 |
| packages/contracts/src/readingFreshness.ts | program-read | 1598 | abd6df4eb4ca38ad |
| packages/contracts/src/schemas/conditions.ts | program-read | 1127 | ffd8cbff05777279 |
| packages/contracts/src/schemas/fishability.ts | program-read | 8481 | 0990a096ad522a86 |
| packages/contracts/src/schemas/fishingInformation.ts | program-read | 2074 | 7e2072933015948b |
| packages/contracts/src/schemas/gauge.ts | program-read | 743 | 22f5f5c1b230bb16 |
| packages/contracts/src/schemas/hatchChart.ts | program-read | 844 | 0a58803f7ac00721 |
| packages/contracts/src/schemas/observation.ts | program-read | 561 | 18cf872e64039dde |
| packages/contracts/src/schemas/pattern.ts | program-read | 736 | 7915d406428e4085 |
| packages/contracts/src/schemas/provenance.ts | program-read | 4537 | 25fdf434a6df96ad |
| packages/contracts/src/schemas/releaseSchedule.ts | program-read | 1367 | d6f04a3d8566733c |
| packages/contracts/src/schemas/shared.ts | program-read | 1262 | 212c70d97f521b30 |
| packages/contracts/src/schemas/shop.ts | program-read | 327 | e75e33a4783188d2 |
| packages/contracts/src/schemas/shopReport.ts | program-read | 1132 | 74152d8b85e39e5d |
| packages/contracts/src/schemas/stocking.ts | program-read | 1106 | d27035321fc6a00b |
| packages/contracts/src/schemas/stream.ts | program-read | 10071 | b37bb50e334249a7 |
| packages/contracts/src/schemas/taxon.ts | program-read | 1231 | 63be81d76e714990 |
| packages/contracts/src/schemas/waterEvidence.ts | program-read | 4602 | d071db85e5c86c59 |
| packages/contracts/src/scoreActivity.ts | program-read | 1183 | 2f351a8c1258923a |
| packages/contracts/src/scoreConditions.ts | program-read | 9325 | f07fb9d118710fa9 |
| packages/contracts/src/scoreFishability.ts | program-read | 4800 | 7846b21f452077be |
| packages/contracts/src/spawnState.ts | program-read | 2285 | a1c66b69c11b8482 |
| packages/contracts/test/endpoints.test.ts | test-structure-review | 878 | 44e55d174629885f |
| packages/contracts/test/fishability.test.ts | test-structure-review | 10022 | bb6db7d9d4852b04 |
| packages/contracts/test/helpers.ts | test-structure-review | 4183 | dcc41cfeec489eee |
| packages/contracts/test/matchHatch.test.ts | test-structure-review | 6450 | 11992497654ce456 |
| packages/contracts/test/readingFreshness.test.ts | test-structure-review | 2010 | e1174e44a812af7b |
| packages/contracts/test/schemas.test.ts | test-structure-review | 14650 | f90b384f9d49f673 |
| packages/contracts/test/scoreConditions.test.ts | test-structure-review | 6560 | e90485b8f8bbe8ea |
| packages/contracts/test/scoreFishability.test.ts | test-structure-review | 12359 | 47ccb9cfbf0f3ddb |
| packages/contracts/test/spawnState.test.ts | test-structure-review | 4179 | b16923c9094b68b7 |
| packages/contracts/test/waterEvidence.test.ts | test-structure-review | 5238 | b00f65548258ed6e |
| packages/contracts/tsconfig.build.json | direct-read | 245 | 947d54825f878a0b |
| packages/contracts/tsconfig.json | direct-read | 183 | bca3625d6614c698 |
| packages/contracts/vitest.config.ts | direct-read | 478 | 40cc4aaf19bc2d32 |
| packages/ui/README.md | document-outline-and-link-index | 992 | 515c23750331c3a0 |
| packages/ui/package.json | direct-read | 946 | 3d58c28af9b7ec64 |
| packages/ui/src/Button.tsx | program-read | 609 | 259e271f72f3cbbc |
| packages/ui/src/Card.tsx | program-read | 388 | 8df5fca4559a790a |
| packages/ui/src/Chip.tsx | program-read | 526 | 68fff80d843a8bde |
| packages/ui/src/ConfirmButton.tsx | program-read | 2539 | 0dab72362ab0dcd1 |
| packages/ui/src/DataBadge.tsx | program-read | 794 | 87156c0ffae32afe |
| packages/ui/src/Dialog.tsx | program-read | 1601 | 3689e11b2dc7bfd4 |
| packages/ui/src/EmptyState.tsx | program-read | 965 | 53309d4b0a31f8b3 |
| packages/ui/src/LastUpdatedChip.tsx | program-read | 1724 | f202fce085451611 |
| packages/ui/src/Toaster.tsx | program-read | 388 | dcdaf09d63363ee2 |
| packages/ui/src/cx.ts | program-read | 198 | 7236c58583e4be18 |
| packages/ui/src/index.ts | program-read | 786 | 4e3454d1cf5871f4 |
| packages/ui/tokens.css | direct-read | 10501 | 5ad4e41ea4cf011b |
| packages/ui/tsconfig.json | direct-read | 299 | bf7ebd0e525b547d |
| pnpm-lock.yaml | full-YAML-parse | 442335 | 02da99d7ac813ab4 |
| pnpm-workspace.yaml | full-YAML-parse | 44 | fe9fce14ac66b224 |
| scripts/catalog-gaps.mjs | program-structure-review | 9428 | 60fd4c36b6fe40a6 |
| scripts/migrate-hydro-identities.mjs | program-structure-review | 7065 | 3663f976733a4e29 |
| scripts/nhd-network-build.mjs | program-structure-review | 12355 | 6d5119d1a62109f7 |
| scripts/nhd-network-gates.mjs | program-structure-review | 12860 | 8b525ce91fd33fbd |
| scripts/nhd-network-proof.mjs | program-structure-review | 3878 | ab1aa4c4c8cf49a9 |
| scripts/nhd-network-validate.mjs | program-structure-review | 17913 | 914c0dac1a2d71c9 |
| scripts/nhd-validate-lib.mjs | program-structure-review | 17779 | f9e9d899078f3ec3 |
| scripts/nhd-validate-pack.mjs | program-structure-review | 19992 | 036d197af2316729 |
| scripts/nhd-validate.mjs | program-structure-review | 24451 | 538dedee86292f68 |
| scripts/nhd_build_graph.mjs | program-structure-review | 11330 | 171559366fb36d67 |
| scripts/nhd_convert_gdb.sh | direct-read | 5040 | 3a04cc8af919b0c1 |
| scripts/nhd_lib.mjs | program-structure-review | 4129 | c6dc111086f8c1fc |
| scripts/nhd_snap_anchors.mjs | program-structure-review | 3153 | 4493e28846d9877c |
| scripts/nhd_trace.mjs | program-structure-review | 14680 | d6040bfb44036213 |
| scripts/nhd_trace_catalog.mjs | program-structure-review | 22949 | 3fc43b062f8441d7 |
| scripts/nhd_validate.mjs | program-structure-review | 7068 | a6cb96b079bb77cc |
| scripts/statewide-coverage.mjs | program-structure-review | 10411 | 1283d34b41d68a32 |
| scripts/tn-gauges-build.mjs | program-structure-review | 8891 | d35e67a76cd2f2d7 |
| scripts/twra-layers-build.mjs | program-structure-review | 6012 | 440a3d6782ce20ba |
| tests/nhd-network-validate.test.mjs | test-structure-review | 13003 | 84636731fe5daf5d |
| tests/nhd-validate.test.mjs | test-structure-review | 22447 | 7f775a2bc4deaf59 |
| tsconfig.base.json | direct-read | 481 | 6bdf7062780fdacf |

</details>

## 7. Prior-work overlap

Earlier reports describe older revisions; today's failures do not negate their historical results.

- [review-2026-09-11.md:56](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/review-2026-09-11.md#L56) identified the earlier stale-metric class. F01 extends it to the current default Water Data parser despite T1-6 being checked off. [2026-09-13-audit-a-ground-truth.md:438](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/2026-09-13-audit-a-ground-truth.md#L438) distinguished backend age from display freshness; F04 covers cached species consumers.
- [stage5-session-c.md:65](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/stage5-session-c.md#L65) described SW recovery across surfaces. F03 identifies the early known-offline bypass. That report's 97/97 and [hotfix-focus-wiring.md:41](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/hotfix-focus-wiring.md#L41)'s seven passing focus cases belong to their revisions; F10 documents current drift.
- [2026-09-29-production-recovery.md:36](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/2026-09-29-production-recovery.md#L36) added deployment-time stocking ingestion. F05 confirms that change and the remaining scheduling/NWS gaps; it does not rediscover the repaired negative-TVA-inflow crash.
- [UI-CONDITIONS-INTEGRATION.md:67](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/audits/UI-CONDITIONS-INTEGRATION.md#L67) permits stale historical scores with labels and requires real zero to show Poor. F04/F07 extend that requirement to species/Astro. Its generation-keyed terrain purge, [UI-CONDITIONS-INTEGRATION.md:40](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/audits/UI-CONDITIONS-INTEGRATION.md#L40), has the failure ordering identified in F29.
- [2026-09-22-evidence-branch-repair.md:39](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/2026-09-22-evidence-branch-repair.md#L39) explicitly left 16 web-script lint errors outside its slice. F19 confirms the repository gate remains red and adds the other failing packages.
- [ROLE-4-HANDOFF.md:44](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/ROLE-4-HANDOFF.md#L44) describes drafts as editable until publication and published reports as read-only. F15 contradicts that behavior in the current implementation; F16 adds cross-shop draft exposure.

The remaining-file comparison extends the checked-off mixed-offset repair, [docs/KNOWN-ISSUES.md:275](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/KNOWN-ISSUES.md#L275): the legacy parser is repaired, but F34 verifies that SQLite and evidence providers still use text order. The NWS handoff, [reports/stage3-session-a.md:53](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/reports/stage3-session-a.md#L53), validates the provider in isolation; F37/F38/F48 expose response-shape, station-mapping and downstream expiry gaps, independent of F05's invocation gap. F46/F47 concern caller transition order, extending the diagnostics/first-failure alert repair marked done at [docs/KNOWN-ISSUES.md:229](https://github.com/Bchodges42/TroutSite/blob/14a92bc302842050cb1354108b5f16436b765504/docs/KNOWN-ISSUES.md#L229). They do not allege that redaction or the earlier fix never worked.

Open worklist items (including network persistent-offline caching, unresolved waters and owner source/region rulings) were not re-filed as new discoveries. F41 is failed-promise retryability after connectivity returns, rather than the accepted absence of persistent cluster caching. Historical documents are all indexed, but many were not read in full prose. The search did not establish that every additional finding is unprecedented.

## 8. Top-10 remediation plan

Ordered by risk reduction per effort. These are future implementation scopes; this audit made no implementation changes.

1. **Preserve per-metric observation age — F01.** M. A current flow sensor cannot renew a month-old temperature. Keep the metric/time representation change separate from UI policy.
2. **Contain report publication damage — F02.** S containment/M complete. Preserve unrelated fishability and make accepted writes/retries unambiguous. Dedicated backend publication scope.
3. **Restore truthful failure paging and job outcomes — F46/F47/F33.** S–M. Notify before recording the transition, decide final health before recovery, and classify complete source failure as unhealthy. Alert ordering fixes can safely batch; retain separate evidence-job semantics and fault cases.
4. **Repair portal history and draft ownership — F06/F15/F16.** S–M. Use the portal origin, end accepted drafts, and scope unpublished drafts to their owner. Safe alongside F02 with independently reviewable commits.
5. **Keep useful data through cache failures — F03/F04/F32/F41.** S–M. Return validated network data after cache-write failure, try installed content when actually offline, mark old species snapshots honestly, and retry failed context fetches. Share a cache/provenance branch with independent source-fetch, offline and cluster tests.
6. **Protect complete publication and last-good recovery — F24/F23/F21/F22.** M–L. Retain the old tree after promotion failure, align rollback dependencies/artifacts, synchronize authored removals and expose a complete generation. Split filesystem recovery and database/catalog work into separate branches.
7. **Repair scheduled data and provider integration — F05/F34/F35/F36/F37/F38/F48/F14.** S localized/M combined. Correct timestamp order, preserve month recurrence/raw captures, parse authentic rain, verify stations, expire pressure, then wire scheduled jobs with expected-run health. Provider repairs can batch by feed; bound public gauge work independently.
8. **Make map state and mobile interactions match the selected data — F43/F44/F45/F40, then F17/F18/F20/F25/F27/F30.** S–M. Explicit Trout override, assessment/palette invalidation, overlay-first touch dispatch, complete regional chart requests, then layout/storage/contrast/hit areas. Batch PWA controls separately from marketing touch targets.
9. **Align factual copy across interactive and static pages — F07/F08/F09/F39.** S–M. Preserve assessed-zero semantics and planned/completed/precision distinctions, make prerender repeatable, and remove false newsletter confirmations. Astro changes can batch; keep React/PWA prerender fixes independently reviewable.
10. **Restore integration and cartography gates — F19/F10/F26/F42.** S–M. Clean recursive lint, regenerate complete isolated fixtures, update valid expectations, finish the regional validator and correct crossing locations. Do not defer P1 containment until this larger gate cleanup is complete.

Subsequent localized batches: F11/F12 calendar/solar correctness; F28/F29 terrain readiness/invalidation; F13 preference transactions; F31 measured route splitting. Keep mathematical, cache and performance changes separate so their evidence remains reviewable.
