# STAGE 1 SESSION BRIEFS — three sessions, paste-ready

One fresh agent session per brief. Each brief is self-contained: paste the ENTIRE
fenced block as the session's first message. Before pasting, complete
[`SETUP.md`](SETUP.md) (branches exist, baseline green). The three sessions own
disjoint files — a session that needs a file outside its ownership does NOT edit it; it
notes the need in its report and moves on (EXECUTION-PLAN §1).

---

## SESSION A — API & INFRA

```
You are Session A of a 3-session change program. Read, in order: AGENTS.md (binding rules),
docs/EXECUTION-PLAN.md (protocol, file ownership, stage definitions), docs/KNOWN-ISSUES.md
(your item IDs' full details), infra/RUNBOOK.md §9 (production self-heal stack).

SETUP (do first, in this order):
1. Confirm: git status clean, branch = session-a, base = origin/main. Record the base
   SHA as the first line of docs/reports/stage1-session-a.md (create it) with sections:
   Status / Per-item evidence / Verification summary / Blockers.
2. git config user.name "Bhodges42"; git push origin session-a (establish the target).

OWNERSHIP — you may edit ONLY: apps/api/**, packages/contracts/**, infra/**,
.github/**, e2e/api/**, e2e/admin/**, and your report file. Touching anything else =
stop and note it in the report.

SCOPE (docs/KNOWN-ISSUES.md has full evidence per ID). Work in this order; each item
ends with its regression test written and green — a fix without its test is not done.

STEP 1 — T0-1 (P0): conditional HEAD kills the API.
Repro first: HEAD with If-None-Match on a static mount (apps/api/src/app.ts static
registrations + the no-store setHeaders/onSend interplay, Fastify 4.29.1 +
@fastify/static 7.0.4) → ERR_HTTP_HEADERS_SENT, process exit. Fix the response
handling (etag/304 path) — do not just disable caching globally. Regression tests:
for EACH static mount (/v1, /content, dist root): GET 200, HEAD 200, HEAD + valid
If-None-Match → 304, process alive after all three. Re-review the review evidence:
reports/review-2026-09-11.md PASS1-1.
STEP 2 — T0-2: deploy.sh pulls before build under set -e; early failure exits before
the verify/rollback block; autoupdate.sh treats HEAD==origin as UP-TO-DATE. Fix:
archive before any mutation; an ERR trap that rolls back from the FIRST mutation
onward; track last-good revision (e.g. backups/last-good-rev); autoupdate retries a
failed deploy even when HEAD==origin. CONSTRAINT: production Git Bash runs bash
builtins + git + pnpm + node ONLY (no sleep/tar/find/tee/curl) — RUNBOOK §9. Prove
failure paths with local dry-run seams, never against production.
STEP 3 — T0-3: verify-site.sh must send the configured watchdog token and check the
public /v1/streams contract, not the deliberately blocked /v1/streams.json file.
Update RUNBOOK §9 wording to match.
STEP 4 — T1-6: stale gauge metrics must not inherit a fresh observation timestamp
(apps/api/src/ingest/usgs.ts, evidence/conditionsBridge.ts). Preserve per-metric
observedAt or filter stale metrics before scoring. Test: month-old discharge+temp +
current stage must NOT produce a fresh-stamped high score.
STEP 5 — T1-10: snapshots/health.ts must contract-validate conditions rows (bad rows,
invalid fetchedAt → healthy:false). Tests: [{}] and invalid-timestamp feeds.
STEP 6 — T1-12: backup.sh's no-sqlite3 fallback copies only the main DB file and
loses committed WAL data. Replace with a consistent online backup (node +
better-sqlite3 .backup() is allowed — node is on the host). Test: temp WAL-mode DB,
checkpoint, insert, backup, restore, recent row present.
STEP 7 — T2-45: infra/static-server.mjs buffers the whole request body BEFORE
forwarding (unauthenticated 1 MiB accepted). Add a streaming size cap (reject early,
incl. missing Content-Length) + an idle timeout. Probe test: oversized POST → 401
fast, memory bounded.

PUSH CADENCE: after each STEP, run pnpm --filter api test && pnpm -r build; if green,
commit ("fix(api): T0-1 ..." style, one commit per item) and git push origin session-a.
Branch CI must be green before the next step starts.

FINAL AGENT VERIFICATION (append pass/fail for each to your report, then push):
- Crash probe: HEAD + If-None-Match fired TWICE at every static mount on a locally
  running API → correct status each time, process alive after all.
- verify-site.sh: green against a local hardened instance (token set).
- Backup: the STEP 6 test's restore includes the post-checkpoint insert.
- Proxy: oversized unauthenticated POST → fast 401, upstream untouched.
- Full gates: pnpm -r lint && pnpm -r test && pnpm -r build green.

RULES: never merge to main, never deploy. Blocked >30 min → write the blocker in the
report, move to the next step. Do not edit worklist checkboxes (release session does
that). Out-of-scope fixes you're tempted to make → note them in the report instead.
```

---

## SESSION B — BUILD & CONTENT

```
You are Session B of a 3-session change program. Read, in order: AGENTS.md (binding rules),
docs/EXECUTION-PLAN.md (protocol, file ownership), docs/KNOWN-ISSUES.md (your item
IDs' full details).

SETUP (do first, in this order):
1. Confirm: git status clean, branch = session-b, base = origin/main. Record the
   base SHA as the first line of docs/reports/stage1-session-b.md (create it) with sections:
   Status / Per-item evidence / Verification summary / Blockers.
2. git config user.name "Bhodges42"; git push origin session-b.

OWNERSHIP — you may edit ONLY: packages/content/**, apps/web/scripts/**,
apps/web/public/atlas/** (regenerated artifacts), apps/marketing/**,
e2e/marketing/**, and your report file. NOTE: apps/web/src/** and apps/web/vite*.ts
belong to Session C — never edit them. .github/** belongs to Session A — if CI should run
a validator, put the proposed workflow snippet in your report instead.

SCOPE (full evidence in docs/KNOWN-ISSUES.md). Each item ends with its regression
test/check green.

STEP 1 — T1-5: packages/content/scripts/build.ts replaces '/' with '\' in output
paths — on POSIX this writes literal-backslash filenames and the app gets
hatchCharts:0. Join with the platform path API. After build, assert all
12-region × 12-month chart outputs exist and are readable at their intended paths
(extend the build's self-check or a content test).
STEP 2 — T0-4: the size gate fails real builds (65.36 MB vs 25 MB) because it counts
the whole dist while the SW precaches ~10 MB. Redesign apps/web/scripts/
size-budget.mjs to budget the INSTALL-TIME set (read the generated Workbox precache
manifest) separately from on-demand/runtime-cached assets; keep a hard gate on
install-time bytes; report both numbers in output. Unit-test the script against a
fixture file list. Update the budget doc-comment to match the new semantics.
STEP 3 — T1-8: apps/web/scripts/prerender.mjs silently falls back to fixture data
when public/v1 snapshots are absent — fixture stocking was published as "reported
releases." Production prerender must NOT use fixtures for factual pages: require an
explicit --allow-fixtures flag (e2e/global-setup uses it) or fail loudly; when real
data is absent, render honest "unavailable" states. Carry datePrecision and
scheduled-vs-released wording into generated stocking copy. Test: prerender without
snapshots and without the flag exits with a clear error; with the flag, no
"reported releases" wording on fixture data.
STEP 4 — T1-11: shipped atlas/topo metadata fails its own validators (vertex-count
drift on 3 features; topo manifest 531 tiles vs 1,021 files, byte mismatches, fully
transparent tiles). Regenerate the manifests from the final artifacts with the
existing scripts; omit empty tiles from the manifest; re-run validate-atlas,
validate-topo, validate-roads, west-middle, east-southeast until ALL green, and
record the command outputs in your report.
STEP 5 — T1-7 (your half): correct packages/content/streams/tn/wolf-river-fentress
.yaml — its notes call the Fentress water "Memphis-bound," conflating it with the
West Tennessee Wolf River. Rewrite per TWRA (the Fentress Wolf is a Dale Hollow
Reservoir arm — TWRA's Dale Hollow page is the source; cite it). Do NOT touch the
matcher (Session C owns stockingMatch.ts). Content test green.
OVERFLOW (only after all five steps are pushed and green): start F2 research —
per-species comfort/activity reference data (largemouth, smallmouth, spotted,
crappie, bluegill, channel catfish, striped bass): temperature bands, spawn temp
thresholds, flow-trend preferences, barometric sensitivity. Every value carries its
source URL in a draft under packages/content (you own it). This is Stage 2 scope —
research notes + draft YAML only, nothing wired into builds.

PUSH CADENCE: after each STEP: pnpm validate:content && pnpm --filter @trout/content
test && pnpm --filter @trout/web build (the build runs the size budget); green →
commit ("fix(build): T1-5 ...") and push origin session-b. Branch CI green before
the next step.

FINAL AGENT VERIFICATION (append to report, then push): content build on this POSIX
machine leaves 144 readable chart files at correct paths; size-budget unit test +
budgeted build green; prerender without snapshots + without flag fails loudly;
prerender with flag contains no "reported releases" on fixture rows; all five asset
validators green on regenerated manifests; full gates green.

RULES: never merge to main, never deploy. Blocked >30 min → report, next step. Do
not edit worklist checkboxes. Tempting out-of-scope fixes → note in report.
```

---

## SESSION C — WEB APP

```
You are Session C of a 3-session change program. Read, in order: AGENTS.md (binding rules),
docs/EXECUTION-PLAN.md (protocol, file ownership), docs/KNOWN-ISSUES.md (your item
IDs' full details), docs/DESIGN.md (the canon you must not violate).

SETUP (do first, in this order):
1. Confirm: git status clean, branch = session-c, base = origin/main. Record the base
   SHA as the first line of docs/reports/stage1-session-c.md (create it) with sections:
   Status / Per-item evidence / Verification summary / Blockers.
2. git config user.name "Bhodges42"; git push origin session-c.

OWNERSHIP — you may edit ONLY: apps/web/src/**, apps/web/vite*.ts (incl.
vite.shared.ts), e2e/web/**, and your report file. NOTE: apps/web/scripts/** belongs
to Session B — never edit it (that's where the size budget and prerender live). If a
test belongs in e2e/marketing or e2e/api, note it for that session instead.

THE PRINCIPLE for every fix below: apps/web/src/features/map/waterDecision.ts is the
single classification authority. Route species/context questions through it; never
re-test feature.species ad hoc in a page.

SCOPE (full evidence in docs/KNOWN-ISSUES.md). Each item ends with its regression
test green.

STEP 1 — T1-9: StreamDetailPage.tsx:149 calls statusForScore(value, hasData) WITHOUT
the assessed flag — a real clamped-0 lethal assessment shows "Assessment
unavailable" on detail while map/list show Poor. Pass snapshot.score.assessed, and
add a parity test asserting the three surfaces (map decision, conditions row, detail)
derive IDENTICAL status from the same snapshot (fix riverMapSelectors statusForScore
usage sites if needed).
STEP 2 — T1-13: the detail page renders snapshot.score.reasons and the score trend
label unconditionally (lines ~163-171) — trout language on warmwater water. Gate both
on the decision view: reasons + trend render ONLY when displayMetric === 
'trout-condition'; warmwater/unverified waters show raw readings with neutral framing
(waterDecision.toWaterDecisionView already computes displayMetric — use it).
STEP 3 — T1-14: statusForTemp/statusForFlow in StreamDetailPage color badges with
trout physiology on every water. Interim rule: color ONLY when species === 'trout';
non-trout waters get the neutral 'unknown' styling. Keep the trout thresholds for
trout waters.
STEP 4 — T1-15: the Ideal flow badge renders " cfs" (empty join + ' cfs') when
stream.idealFlow is [] (winter ponds). Show "Not listed" for an empty array.
Each step: extend/adjust the web unit tests (Vitest) — include a test that renders a
warmwater fixture water and asserts NO trout-model strings appear anywhere in the
detail output.

STEP 5 — T1-7 (your half): stocking matcher misattribution. Exact-name matching
ignores county: TWRA "Wolf River" (Fentress) resolves to wolf-river-west-tennessee;
"Ft. Patrick Henry TW / S. Fork Holston River" falls through to holston-river
(apps/web/src/lib/stockingMatch.ts:56,104,125). Fix: county/reach disambiguation
BEFORE generic containment (the catalog's regionId + the TWRA row's county are the
identity signal). Keep the review's captured 623-event set as regression fixtures —
the two bad cases must resolve to wolf-river-fentress and ft-patrick-henry-tailwater,
and the controls (Center Hill/Caney Fork, Normandy/Duck) must stay correct. (The
wolf-river-fentress.yaml description fix is Session B's.)

PUSH CADENCE: after each STEP: pnpm --filter @trout/web typecheck && test && build;
green → commit ("fix(web): T1-9 ...") and push origin session-c. Branch CI green
before the next step.

FINAL AGENT VERIFICATION (append to report, then push): the warmwater-fixture test
proves zero trout-model strings on detail; the parity test pins map/list/detail to
identical status; typecheck + full web test suite + build green; e2e/web offline +
privacy specs still green locally (pnpm --filter @trout/e2e exec playwright test
--project=web against your built dist).

RULES: never merge to main, never deploy. Blocked >30 min → report, next step. Do
not edit worklist checkboxes. Out-of-scope polish you're tempted to do (there is a
LOT in KNOWN-ISSUES T2 for your session) → note in report; Stage 2 and Stage 5 will assign it.
```

---

## After all three sessions report green

The release session merges the three branches into `integration/stage-1`, runs the full
gates + e2e, then merges to `main` (standing delegation, EXECUTION-PLAN §3), runs the
deploy, and re-verifies through the public edge. Then the worklist checkboxes
(T0-1..4, T1-5..15) get ticked in KNOWN-ISSUES.md, and the owner gets one summary:
what shipped, verification results, appendix look-sees for Release 1.
