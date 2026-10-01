# Post-implementation review and repairs

Started September 30; finalized October 1, 2026.

**The implementation needed substantial repairs.** This review fixed 28 groups of defects in the completed audit-remediation and improvement work. The repaired code passes the checks below. The original handoff's “all plan items implemented” claim was too broad: production setup, reviewed access data, device verification and several product details remain open.

Review branch: `codex/post-implementation-review-20260930` in its own clone, `trout-post-implementation-review-20260930`. Started from `origin/main @ 14a92bc302842050cb1354108b5f16436b765504`, then fast-forwarded the submitted implementation, `feat/site-improvement-20260930 @ 73cf827d1049d21a242502c2f46d6403846f1a91`. Repairs are committed and pushed to GitHub. This report does not certify what is currently deployed.

## Biggest problems repaired

- **Notifications could not reliably work.** The sender discarded encryption keys, the worker had no display/click handler, and Windows production had no evaluator task. Failed sends also consumed transitions, preventing a retry. These paths now work together, with an explicit scheduled dispatcher and retryable failures.
- **Push enrollment exposed security problems.** User-chosen endpoints could direct server requests to arbitrary hosts; endpoint-only upserts could replace another subscription and disclose its controlling ID. Provider/key validation and authorization checks now prevent those cases.
- **“Downloaded” did not mean usable offline.** Workbox bypassed the pack fallback, terrain could expire, and HTML shells could be accepted as data. Packs now have a separate durable cache, verified contents and version, cancellation, and a real airplane-mode/restart test.
- **New personal workflows could lose or duplicate data.** Photo edits were not safely staged, backup IDs could overwrite media, and marking a trip completed did not create its logbook records. Transactional completion/restore and draft-only photo edits repair these cases.
- **Water summaries could contradict their evidence.** Fresh flow could renew old temperature; comparison/favorites could use a trout verdict despite a different species focus. Shared summaries now use each metric's clock and the selected species' assessment/reasons.
- **Live services and widgets had integration gaps.** Private capability requests could enter offline caches/logs, correction cleanup was unscheduled, and the shop widget requested a deliberately blocked catalog URL. These paths now use the correct transport and privacy boundaries.

## Scope and limits

Inputs: the [original 48-finding audit](2026-09-29-senior-code-audit.md), [audit-remediation handoff](2026-09-30-audit-remediation.md), [improvement handoff](2026-09-30-site-improvement-implementation.md), accepted `SITE-IMPROVEMENT-PLAN-2026-09-30.md`, worklist, ADRs and production runbook. The plan covers six polishes, ten visitor features and three broader improvements. Personal fly inventory remains excluded.

This was a source and integration review of the submitted changes and their dependencies, backed by regression tests, full builds, validators and browser journeys. It was **not a second line-by-line reread of all 3,039 repository files**. The original audit's file ledger is historical evidence, not this review's coverage claim.

No production deployment, main merge, production task installation, real notification, third-party message or secret rotation was performed. Browser checks ran in automated Chromium, including narrow screens and offline mode. Physical iOS/Android behavior, actual OS push delivery and production configuration remain unverified. Automated accessibility assertions do not replace a screen-reader/usability session.

## Repaired findings

Priority describes the reviewed defect before repair. All R01–R28 below are fixed on the review branch; production benefits depend on owner merge/deployment.

### Notifications, security and maintenance

Source: [push service](../../apps/api/src/push/service.ts), [notifier](../../apps/api/src/push/notifier.ts), [evaluator](../../apps/api/src/push/evaluate.ts), [dispatcher](../../apps/api/src/push/job.ts), [app wiring](../../apps/api/src/app.ts), [Windows wrapper](../../infra/evaluate-watches.sh). Evidence: [push regressions](../../apps/api/test/post-implementation-push.test.ts), [service tests](../../apps/api/test/watchlists.test.ts), [transition tests](../../apps/api/test/watchlists-evaluate.test.ts), [health tests](../../apps/api/test/health.test.ts).

- **R01 · P1 — Invalid real-push adapter.** The SDK was called with an endpoint string while encryption keys were lost. It now receives the complete subscription, payload and options. A test constructs an actual encrypted request locally, without contacting a recipient.
- **R02 · P1 — Arbitrary push targets.** HTTPS alone allowed server requests to user-selected hosts. Enrollment and delivery require supported browser-provider hosts, valid P-256/auth keys and safe URL structure. Legacy persisted endpoints are also checked at delivery.
- **R03 · P1 — Subscription takeover/capability disclosure.** Endpoint-only registration could change another subscription's keys and return its controlling ID. Re-registration now requires the original keys; a mismatch neither modifies the record nor exposes its capability.
- **R04 · P1 — Lost alerts after failed or simulated delivery.** Failures and dry runs advanced notification memory while job health stayed green. Only acknowledged real sends advance memory. Failure remains retryable and produces failed job health; stub evaluation does not consume a real alert.
- **R05 · P2 — Wrong-direction and invalid-evidence alerts.** A below-threshold watch could notify on a rising reading. Direction-specific firing now silently rearms on the reverse transition. Measurements must be finite, fresh and applicable, using their own metric timestamps; implausible future observations are rejected.
- **R06 · P1 — No notification display/click integration.** Added worker push handling, digest display and validated same-origin water navigation. Synthetic event tests cover the worker. Real OS delivery is a rollout check.
- **R07 · P1 — No canonical production evaluator.** Dev node-cron was insufficient for the headless Windows host. Added `ingest --job=watchlists`, a deploy-stamp-guarded wrapper and the 15-minute `trout-evaluate-watches` schtask. Development uses the same dispatcher. The owner must install the production schedule after a verified deployment.
- **R08 · P2 — Repeated future stocking notices and inconsistent matching.** A future schedule date kept appearing new after every cooldown. Persisted publication identities now deduplicate independently of fetch time/date. Watches share county/alias matching with the app and require an active catalog target; notices describe schedules, not completed releases.
- **R09 · P2 — Wrong quiet-hours timezone.** All rules assumed Central time despite Tennessee spanning two zones. Rules now accept a validated IANA timezone. Additive migration 022 preserves existing Central-time behavior; timezone/DST and quiet-hour cases are tested.
- **R12 · P2 — Unenforced correction retention.** The 90-day purge function had no scheduler caller. The dispatcher now performs correction maintenance even with push disabled. Health and the owner dashboard expect that job when either corrections or push is configured. Missing/failed maintenance is tested through both API surfaces.

### Offline downloads and privacy

Source: [worker](../../apps/web/src/sw.ts), [fallback](../../apps/web/src/lib/swPinnedResponse.ts), [pack planning](../../apps/web/src/lib/packBuilder.ts), [pinning](../../apps/web/src/lib/packCache.ts), [manager](../../apps/web/src/features/downloads/usePackManager.ts). Evidence: [cache tests](../../apps/web/test/pack-cache.test.ts), [builder tests](../../apps/web/test/pack-builder.test.ts), [worker tests](../../apps/web/test/sw-pack-fallback.test.ts), [browser proof](../../e2e/web/pinned-packs.spec.ts).

- **R10 · P1 — Workbox bypassed pinned packs; terrain was disposable.** A later fallback listener did not recover failures inside existing Workbox routes. The `injectManifest` worker now recovers failed public JSON/terrain reads from `trout-packs-v1`. Pinned terrain uses that durable cache rather than the expiring runtime cache. Worker code does not import application/Dexie runtime code.
- **R11 · P1 — Private live APIs entered caches and logs.** Broad snapshot rules also matched watch/receipt requests, and URLs could log capabilities. These routes are network-only; activation removes legacy private cache entries. Logging strips query strings and redacts capability/receipt paths. A browser test proves seeded private responses are not replayed offline.
- **R13 · P1 — False readiness and wrong pack resources.** SPA HTML 200 responses and invalid cluster/history assumptions could mark unusable sections downloaded. Pinning validates response type/content; plans use correct cluster paths, applicable history, access/report resources and resolvable trip waters. Readiness verifies physical assets and manifest compatibility; empty required sections cannot be ready. Removal preserves shared assets still pinned by another pack.
- **R27 · P2 — Incomplete controls and stalled response bodies.** Added a basic-pack default and explicit optional terrain, bounded to zooms 10–11, plus refresh/cancel. Timeouts cover the complete response body; abort signals reach metadata and pinning. Cancellation does not erase an existing ready pack; partial results and storage failure remain truthful. A complete pre-download byte estimate remains a gap.
- **R28 · P2 — Privacy copy contradicted connected features.** Copy implied nothing left the device despite opt-in push/corrections and optional analytics. It now explains server records, the browser push provider, local notes/photos/backups, receipt access, closed-correction retention (90 days), inactive subscription expiry (180 days), unsubscribe and optional aggregate analytics. Removed “nothing to leak.” See [privacy page](../../apps/marketing/src/pages/privacy.astro) and README.

### Evidence, species and public presentation

Source: [overview](../../apps/web/src/lib/waterOverview.ts), [freshness](../../packages/contracts/src/readingFreshness.ts), [decision model](../../apps/web/src/features/map/waterDecision.ts), [widget](../../apps/api/src/widgets/embed.ts). Evidence: [overview tests](../../apps/web/test/water-overview.test.ts), [comparison tests](../../apps/web/test/compare.test.tsx), [history tests](../../apps/api/test/gauge-history.test.ts), [widget tests](../../apps/api/test/widgets.test.ts).

- **R14 · P1 — New summaries/captures renewed old measurements.** A general reading/fetch timestamp could make stale temperature look current. Overview/detail/capture now preserve each metric's clock, select the newest usable value, reject invalid/future data and expose actual freshness. Saved/offline labels require a saved snapshot.
- **R15 · P2 — History manufactured observations and mishandled offsets.** Old temperature could be emitted at every fresh-flow fetch time. History uses actual per-metric times and deduplicates equivalent instants with different UTC offsets. Sparse provider measurements remain sparse; no observations are invented.
- **R20 · P1 — Selected species did not control comparison/favorites/reasons.** Focused surfaces could retain trout status/color/explanation. Bounded per-water species snapshots now feed those surfaces and the common decision model. Explicit Trout URL selection overrides saved All-fish preference. Regression fixtures give trout and focused-species assessments different verdicts and reasons.
- **R26 · P1 — Widget could not fetch its catalog and could misstate conditions.** It requested blocked `/v1/streams.json`; it now uses `/v1/streams`. Own-clock freshness/finite checks prevent stale values appearing current; warmwater cards do not inherit trout scores. Conservative county/unique-alias matching omits ambiguous stocking associations. Schedule precision is preserved. Tests exercise the built API transport and emitted artifact; the implementation file remains blocked.

### Trips, logbook and local records

Source: [trips](../../apps/web/src/lib/trips.ts), [logbook/restore](../../apps/web/src/lib/logbook.ts), [entry editor](../../apps/web/src/features/logbook/EntryForm.tsx), [saved waters](../../apps/web/src/lib/savedWaters.ts). Evidence: [trip/local-store tests](../../apps/web/test/trips-manifests-photos.test.ts), [logbook v2 tests](../../apps/web/test/logbook-v2.test.ts), [saved-water tests](../../apps/web/test/saved-waters.test.ts).

- **R16 · P1 — Completing a plan did not record its visits.** Completion now creates one logbook entry per distinct water with its catalog name/date/species/notes/trip ID, and stamps completion in the same transaction. Repeated completion is idempotent; future/no-water plans are rejected. No historical gauge readings are fabricated.
- **R17 · P1 — Backup restore could overwrite photos or collapse visits.** Full restore remaps media collisions and rolls back entries/media together on quota failure. Version/calendar/null validation and legacy import remain supported. Entries-only restore excludes unresolved photo links. Dedup preserves distinct trip IDs, flies and visit context even when creation clocks match. Unknown-age captures survive without acquiring an invented observation time.
- **R18 · P1 — Cancelling a photo edit could change saved media.** Photos/removals remain staged until Save. Cancel leaves original attachments intact; failed staged work is cleaned up and double-save is prevented. Retired waters retain their saved name.
- **R19 · P2 — Rapid local edits lost updates.** Checklist/group read-modify-write operations now execute in serialized Dexie transactions, preserving concurrent changes. Download removal still excludes personal stores.

### Correction review, settings, tooling and operations

Source: [correction routes](../../apps/api/src/corrections/routes.ts), [status](../../apps/web/src/features/corrections/CorrectionStatus.tsx), [handoff](../../apps/web/src/features/corrections/review.ts), [watch UI](../../apps/web/src/features/watches/WatchesSettings.tsx), [owner service](../../apps/api/src/owner/service.ts). Evidence: [correction tests](../../apps/web/test/corrections.test.tsx), [handoff tests](../../apps/web/test/correction-handoff.test.ts), [watch UI tests](../../apps/web/test/watches.test.tsx), [owner tests](../../apps/api/test/owner-dashboard.test.ts).

- **R21 · P2 — Only default watch rules were manageable.** Added custom temperature/flow threshold, direction, hysteresis, cooldown, stocking/report choices and quiet-hours/timezone controls. Users can inspect/delete rules; deleting the final rule unsubscribes rather than leaving an unexplained empty subscription.
- **R22 · P2 — Watch settings could stick or falsely claim deletion.** Checks now resolve loading failures, expired capabilities and blocked storage. Server deletion must succeed before local identity is forgotten. Unsupported devices retain an honestly described manual-check watchlist; requests are bounded and live/no-store.
- **R23 · P2 — Correction receipt/status/handoff mistakes.** The receipt pattern now matches issued codes. Temporary failure no longer becomes “not found”; accepted proposals are not described as published. Public moderator-note visibility is disclosed, list limits are clamped, and source-cited accepted-proposal exports exclude capabilities. Public facts still require a reviewed content PR.
- **R24 · P1 — Audit lint cleanup broke ten atlas tools.** Unused imports had been renamed to nonexistent Node exports (`_readFileSync`, `_existsSync`, etc.), so tools failed before validation. Removed them and added a check against actual exports. Fixed Windows PATH/test-runtime issues and wired all 29 infra checks into the root command and CI. Script tests use sandboxes, not production.
- **R25 · P2 — Owner health/counts/schedules were misleading.** Aggregates compare real instants and select the right latest outcome; totals do not stop at a 200-row detail cap. Explicit `windows`/`cron`/`unknown` profiles prevent dev cadence being presented as production cadence. Missing correction maintenance is visible without VAPID. Credentials stay memory-only, failed gates clear and requests time out. A complete publication preview is still absent.

## Original audit regression coverage

The original 48 items remain in the worklist. This review checked implementation/regression coverage and inspected high-risk paths affected by the added features. Passing an existing test does not claim a new manual reproduction of every finding.

- **Data/source age and job health:** F01, F04, F05, F06, F33, F34, F37, F38, F48. Metric clocks, source health, offset ordering, quantitative rain/pressure data and provider/gauge applicability regressions pass. New overview/history/alert/widget paths required repairs above.
- **Report/snapshot publication:** F02, F15, F16, F21, F22, F24. Durable report acceptance/idempotency, isolated report-feed publication, draft isolation, failed-generation rollback and archive policies are covered by API tests.
- **Offline/bounded network work:** F03, F14, F28, F29, F32, F41. Cold storage, content fallback, valid terrain, purge scope, quota failure, retry and bounded fan-out tests pass. Packs/private routes required additional repairs and browser proof.
- **Personal state/calendar:** F11, F12, F13, F35, F36. Solar units, civil dates/recurrences, serialized preferences and capture identity checks pass. Trips/media/backup integration required R16–R19.
- **Species/map/mobile:** F17, F18, F20, F25, F30, F40, F42, F43, F44, F45. Narrow layout, blocked storage, contrast, zoom interception, accessible name, West Tennessee hatches, crossing geometry, species override/repaint and overlay taps are covered. Browser reruns cover changed search/title semantics.
- **Marketing/prerender:** F07, F08, F09, F27, F39. Assessment bands, scheduled date precision, repeatable prerender, touch targets and newsletter failure states pass. Widget transport/privacy copy still needed repair.
- **Build/tooling:** F10, F19, F26, F31. Fixture/production separation, lint and lazy-route/size gates pass. R24 repairs invalid atlas imports left by lint cleanup; regional validators now run without weaker checks.
- **Deploy/alert transitions:** F23, F46, F47. Rollback dependency restoration, first-failure/dedup/recovery and no false watchdog recovery pass in sandboxed script tests with stub notifiers.

## Accepted plan coverage

“Implemented” means code exists and the described checks passed; it does not certify physical-device acceptance or complete sourced coverage.

- **Polish 1, common overview:** implemented; repaired metric age and selected-species consistency across detail/map/saved/compare.
- **Polish 2, mobile handling:** peek/tab/scroll and focus/navigation handling present; narrow-screen cases pass. Physical keyboard, safe-area and screen-reader journeys remain to be checked.
- **Polish 3, search:** exact/alias-first matching, abbreviations, restrained typos, explicit scope widening and disambiguation present. Empty-query recent-selection recall remains absent.
- **Polish 4, hierarchy:** tokens/primitives, tabular numbers and reduced motion reused; related layout/contrast regressions pass. No claim of complete subjective design/device review.
- **Polish 5, availability:** shared unavailable/stale/offline and targeted empty states present; repaired download/transient-service states preserve partial information.
- **Polish 6, explanations:** existing species explanation components reused; new overview/widget outputs now agree on metric time, assessment and schedule wording.
- **My Waters:** local saves/groups/retired identities and bounded focused snapshots present; transactional group updates repaired.
- **Comparison:** up to three waters and trip handoff present; focused verdicts/reasons repaired. Optional data stays explicitly unavailable.
- **Downloads:** basic/optional-terrain packs, refresh/cancel, compatibility/readiness/removal and actual offline fallback verified. Full pre-download byte estimates remain absent.
- **Private logbook:** edit/filter/summary/media and legacy/full backups present; restore, visit dedup and Cancel repaired.
- **History:** real provider series, metric-specific clocks, windows and table alternatives present; gaps visible. Source availability is not universal.
- **Verified access:** schema, authoring/validation, public snapshot and cards exist; emitted access snapshot has **zero authored records**. A useful guide/pilot remains a data deliverable. Stocking markers are not promoted to access facts.
- **Tailwater:** schedule/context integrated; unknown provider information is not invented. Real generation schedules and safe-use copy need provider/device checks; discharge is not a wading-safety guarantee.
- **Watchlist:** threshold/report/stocking rules now connect to safe enrollment, delivery, worker UI, scheduling and management. Separately selectable **source-outage notifications are not implemented**. Physical push is a rollout gate.
- **Trips:** private plans/checklists, water context, packs and actual logbook completion work. Selecting specific authored access records is incomplete; there are no verified records to choose yet.
- **Corrections:** suggestion/receipt/status, protected review, decision audit and source-cited accepted handoff present; receipt/transient-state/privacy repaired. Accepted is not automatically published; reports do not override provider readings.
- **Owner/publication review:** protected feed/job/snapshot/research/correction visibility works. Exact candidate old/new previews and dedicated build/deploy/backup panels remain incomplete.
- **Evidence coverage:** ledger, unresolved claims and editorial queue integrated. Better substantiated coverage remains source/research work, not a consequence of adding a dashboard.
- **Shop widgets:** lightweight embed and hardened-API transport verified; no MapLibre/behavioral tracking added. A willing-shop pilot remains required.

## Final validation

Counts come from this review's runs, not the prior handoff.

- **1,518 unit passes; one skip:** contracts 211, API 450, web 755, marketing 31, content 32, admin 39. Contracts coverage meets its ≥90% gate. Web skip depends on a generated snapshot. A sequential full recursive run passed, followed by final full web/API runs after their last changes; totals do not describe one simultaneous run.
- **Browser coverage:** 109 distinct cases passed across the full suite and targeted reruns. First full run: 96 passes/13 failures. Changed explicit search behavior and duplicate-heading locators were corrected and those cases rerun. After later species/pack changes, 23 relevant cases passed again; the final two pack/privacy cases also passed. This is not one uninterrupted final 109/109 run.
- **Real offline proof:** download Harpeth, remove disposable runtime/precache entries and the ordinary Dexie snapshot store, enter airplane mode, reload, fetch actual public conditions from the pinned cache, verify the pack and remove it online. A separate case rejects legacy cached private status/rule responses.
- **Infrastructure:** 29/29 via `pnpm test:infra`, covering static serving, deploy skew, install budget and Node export linkage. API suites also execute guarded scripts using isolated fixtures/stub notifiers, including rollback and owner-alert transitions.
- **Builds:** recursive build passed; final web/API/marketing builds passed after their latest changes. SW install **12.70 MB / 25 MB**; eager entry **568.1 KB**, MapLibre isolated in the lazy map chunk; route chunks precached.
- **Lint:** zero errors. Existing web hook warnings (32) and one content unused-disable warning remain.
- **Data/geo:** content schema and canonical water identities pass. Atlas, east/southeast, west/middle, topo and roads validators pass. West/middle retains four documented NHD seams; no coordinates/checks were changed to hide them.

Reproduce with frozen install and Git Bash ahead of Windows' WSL launcher:

```powershell
$env:PATH = 'C:\Program Files\Git\bin;' + $env:PATH
pnpm install --frozen-lockfile
pnpm -r --workspace-concurrency=1 run test --maxWorkers=4 --minWorkers=1 --testTimeout=30000
pnpm test:infra
pnpm -r run lint
pnpm -r run build
pnpm validate:content
pnpm --filter @trout/e2e exec playwright test
```

Playwright builds/starts local test servers; it does not deploy. Local `review-*.log` files remain in the review clone, not committed raw runtime logs. Use linked regression tests for failure reproduction rather than treating source-shape assertions as sufficient proof.

## Remaining work and release decision

The repaired branch is ready for owner review. It is **not proof that every plan detail is finished or that the deployed site has these repairs**.

1. Owner review/merge of implementation plus repairs; ordinary self-deployment, distinct optional credentials, correct scheduler profile and one-time task installation. Follow [RUNBOOK §9.1](../../infra/RUNBOOK.md#91-optional-visitor-services-rollout-post-implementation-review-2026-10-01).
2. Physical-phone/screen-reader acceptance and real push delivery/unsubscribe; willing-shop widget pilot. Simulated dimensions/encrypted-request tests do not replace these.
3. Sourced access records and continuing evidence review. An empty valid pipeline is not a populated public-access guide.
4. Remaining product details: recent-selection recall, full download size estimates, separate outage alerts, candidate publication preview/collected operations panels, and access-record selection in Trips.

Tracked in the [worklist](../KNOWN-ISSUES.md#post-implementation-review--2026-10-01). No owner decision or live configuration has been silently assumed.
