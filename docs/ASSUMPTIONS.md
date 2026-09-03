# ASSUMPTIONS & DEVIATIONS LOG

Shared read, append-only per role. Every deviation from the plan (00-SHARED-CONTEXT + role bodies)
gets an entry here: **[ROLE n] — date — decision — why — impact on other roles.** Cross-area change
requests also go here under the requesting role's number (§5).

Template:

```
### [ROLE n] YYYY-MM-DD — short title
Decision: ...
Why: ...
Impact on others: ...
```

---

### [ROLE 1] 2026-09-02 — `tsx` as the TypeScript script runner (dev-only)
Decision: `apps/api` dev/seed scripts and the content validate stub run via `tsx` (devDependency).
Why: the pinned stack names no way to execute TypeScript entrypoints directly; tsx keeps `pnpm
--filter api seed` and `dev` one-liners on Windows/Git Bash.
Impact: none at runtime (it never ships); ROLE 3/4 may keep or replace it.

### [ROLE 1] 2026-09-02 — `yaml` parser added (ADR 0001)
Decision: `yaml` v2 for content validation + api seed.
Why: §7 mandates YAML but no parser is pinned; ADR required per non-negotiable #3.
Impact: ROLE 4 uses the same parser for validate/build scripts.

### [ROLE 1] 2026-09-02 — packages/content shell + validate stub created by ROLE 1
Decision: created the package shell (package.json, README, empty entity dirs, `scripts/validate.ts`
stub that only YAML-parses) and marked ownership inside each file.
Why: the api seed (Role 1 deliverable) and the CI content gate (Role 1 deliverable) need the package
to exist before ROLE 4 starts.
Impact: ROLE 4 owns everything in the package and replaces the validate stub with the full
schema/orphan/gauge-lint/SVG gate (§7).

### [ROLE 1] 2026-09-02 — `RankedTaxon` shape defined
Decision: §6 doesn't define `matchHatch`'s return type, so contracts-v1.0.0 freezes
`RankedTaxon = { taxon, score, maxScore, matchedAttributes: string[], monthInRegion, inHatchChart,
confidence: 'high'|'medium'|'low' }` with max score 8 (5 attribute points + 2 chart + 1 season).
Why: the UI needs a stable ranked-taxon surface; scoring must stay transparent/deterministic.
Impact: ROLE 2 renders from these fields; any change now needs a contracts ADR + tag bump.

### [ROLE 1] 2026-09-02 — empty/unusable readings score 0, not "unknown"
Decision: `scoreConditions` returns value 0 with an explanatory reason when readings are empty,
foreign to the stream's gauges, or carry no cfs/height. The §6 contract only allows 0–100, so there
is no null state; the reasons array is the "unknown" signal.
Impact: ROLE 2 should surface the reason strings (EmptyState/LastUpdatedChip) instead of inventing
a null score.

### [ROLE 1] 2026-09-02 — date/time string formats in contracts
Decision: `IsoDateSchema` = `YYYY-MM-DD`; `IsoDateTimeSchema` = ISO-8601 with optional seconds and
optional timezone (regex-based, not zod's strict datetime) so content authors can write
`2026-04-01T14:00Z` or full offsets.
Impact: ROLE 4 content + ROLE 3 ingestion must emit these formats; roles can extend (additively)
if a stricter format is needed.

### [ROLE 1] 2026-09-02 — `stateId` is any 2-letter US state code, not an enum of TX/OK/AR
Decision: `StateIdSchema = /^[A-Z]{2}$/`.
Why: v2 adds states (§13); keeping the contract additive means no breaking rename later. V1 content
still only ships TX/OK/AR per §2.
Impact: ROLE 4 must limit content to TX/OK/AR by discipline, not by schema.

### [ROLE 1] 2026-09-02 — seed reads the content pack by directory, not by package import
Decision: `seedContent()` reads `<workspace>/packages/content/{streams,shops}` (relative path,
override via `TROUT_CONTENT_DIR`), and the seed CLI rebuilds contracts first.
Why: avoids a workspace dependency on ROLE 4's package internals while still ingesting its YAML.
Impact: ROLE 3 should keep the `TROUT_CONTENT_DIR` override when packaging.

### [ROLE 1] 2026-09-02 — deploy.sh snapshot step is guarded
Decision: `infra/deploy.sh` runs the snapshot regeneration only if `apps/api/package.json` defines
a `snapshots` script; otherwise it prints a notice and continues.
Why: ROLE 1 cannot invent ROLE 3's script name/behavior; the §9 deploy chain must not fail in
Phase 0.
Impact: ROLE 3 names its script `snapshots` (or updates deploy.sh via an ASSUMPTIONS entry).

### [ROLE 1] 2026-09-02 — CI runs on windows-latest
Decision: GitHub Actions uses a Windows runner to mirror the actual deployment target (§15).
Why: catches Windows-only breakage (paths, native deps) that ubuntu runners would hide.
Impact: slower CI, but matches the DoD "green on Windows/Git Bash".

### [ROLE 1] 2026-09-02 — UI primitives styled by CSS variables, Tailwind kept app-side
Decision: `packages/ui` ships `tokens.css` (CSS variables + `.trout-*` classes) and dependency-free
React primitives; Tailwind 3.4 is wired in `apps/web` only (where the pinned stack puts it).
Why: the tokens must work in both the PWA (Tailwind) and the admin SPA (no Tailwind pinned).
Impact: ROLE 2/4 can adopt shadcn/ui on top of the tokens; Roles 2/4/5 add namespaced ui files.

### [ROLE 1] 2026-09-02 — Node runtime on this laptop is v24 (>= 20 constraint kept)
Decision: `engines.node = ">=20"` (as pinned: Node 20 LTS floor). The local machine runs Node
24.11.1, which satisfies it; CI pins Node 20.
Why: plan pins the floor, not the exact patch; no code uses >20 features.
Impact: none. If a native dep (better-sqlite3) needs newer for Node 24 prebuilds, bump minor with
an ADR.

### [ROLE 1] 2026-09-02 — e2e/ is a placeholder
Decision: created `e2e/` with package.json + README only (no Playwright yet).
Why: §5 lists e2e/ in the layout; ROLE 5 owns its contents and installing browsers early would
waste time.
Impact: ROLE 5 adds the Playwright scaffold + tests.

### [ROLE 1] 2026-09-02 — better-sqlite3 at ^12 (not ^11)
Decision: `apps/api` uses better-sqlite3 v12.x.
Why: the plan pins the package but no version; v11 has no prebuilt Windows binary for the local
Node 24 runtime and this machine has no MSVC toolchain, so v11 cannot install here. v12 ships
Node 24 prebuilds and the same synchronous API used by the skeleton.
Impact: none for other roles (same API); CI (Node 20) also has v12 prebuilds.

### [ROLE 1] 2026-09-02 — ownership comments use the `"//"` JSON key, not literal comments
Decision: ownership markers in package.json files are stored as a first-field `"//": "OWNER: …"`
entry instead of a literal `// …` comment line.
Why: pnpm rejects literal comments in package.json (`Unexpected token '/'`), but the `"//"` key is
the npm-documented comment convention and parses everywhere.
Impact: none — the ownership text is intact at the top of every package.json.

### [ROLE 1] 2026-09-02 — `workbox-window` added explicitly to apps/web devDeps
Decision: `apps/web` declares `workbox-window@^7` in devDependencies.
Why: `vite-plugin-pwa`'s `virtual:pwa-register` imports `workbox-window` without declaring it, which
pnpm's strict node_modules layout correctly rejects at build time. It is part of the Workbox
toolchain the pinned stack already names.
Impact: none for other roles; standard fix for pnpm + vite-plugin-pwa.

### [ROLE 1] 2026-09-02 — no GitHub remote connected at Phase-0 exit
Decision: CI workflow committed; repo runs locally only.
Why: the user did not provide a GitHub remote URL for this project.
Impact: "remote pending" — Actions will go green once the remote is connected and pushed
(see README).

### [ROLE 3] 2026-09-02 — snapshot payloads are exactly contract-shaped; no file-level wrapper
Decision: every file under `apps/web/public/data/` validates against the frozen §6 schemas
(`Stream[]`, `ConditionSnapshot[]`, `StockingEvent[]`, `Shop[]`, `ShopReport[]`) with NO extra
`{generatedAt, data}` wrapper. Freshness rides the per-item contract fields: conditions carry
`fetchedAt` + `nextExpectedUpdate` per snapshot; stocking events carry `fetchedAt`; reports carry
`publishedAt`. Staleness contract for the PWA: **conditions are stale when `now > nextExpectedUpdate`**
(builder sets it to now+1h after a healthy gauges run, `now` (immediately stale) when the last
gauges job errored); **stocking is stale when `fetchedAt` is > 26h old** (daily 06:00 job; failed
states are not rewritten, so their files simply age).
Why: a wrapper would break consumers that validate GET responses with the frozen Zod schemas
(§6: `GET /v1/stocking/{state}.json → StockingEvent[]`), and Role 2 should not need a second shape.
Impact: Role 2 reads the files as the endpoint payloads they are; Role 6's checklist item 3 works
against the same validation.

### [ROLE 3] 2026-09-02 — migration 002: normalized gauge columns + index
Decision: `migrations/002_gauge_readings_raw.sql` adds `cfs`, `height_ft`, `temp_c`, `observed_at`
columns and an `(gauge_id, observed_at)` index to Role 1's `gauge_readings_raw`; the raw USGS
payload column is untouched as the audit trail. Raw rows older than 90 days are pruned per run.
Why: sanctioned by the role brief ("Role 1's schema; extend via documented migration if needed");
"latest per gauge" becomes an indexed lookup instead of re-parsing payloads at snapshot time.
Impact: none on other roles; Role 1's migrations test updated inside apps/api (my owned package)
to expect two applied migrations.

### [ROLE 3] 2026-09-02 — /healthz extended additively with a job health summary
Decision: `GET /healthz` returns `{ ok: true }` when the app has no DB wired, and
`{ ok: true, jobs: { <job>: { job, status, startedAt, finishedAt, detail } } }` when wired (server
runtime). Job names: `gauges`, `stocking`, `stocking:<STATE>`, `snapshots`, `seed`.
Why: the deliverable requires a job health summary; §6 permits additive changes; `ok: true`
remains the liveness signal Role 1's CI/infra probes.
Impact: pm2/infra checks should keep asserting `ok === true`; dashboards can now read `jobs`.

### [ROLE 3] 2026-09-02 — portal auth shape: `Authorization: Bearer`, stateless HMAC tokens
Decision: shop tokens are `t1.<base64url(shopId)>.<base64url(HMAC-SHA256(PORTAL_SECRET, shopId))>`
sent as `Authorization: Bearer <token>`; verification is constant-time with no server-side token
store. `GET /v1/portal/me` → `{ shop: { id, name, town, websiteUrl, reportsEnabled } }`.
`POST /v1/portal/reports` accepts `{ streamId?, date?, body, hotPatterns?: [{patternId, hookSize?}] }`;
the server fills `id`, `shopId`, `shopName`, `attributionUrl` (shop website), `publishedAt` — a shop
can never forge attribution. Without `PORTAL_SECRET` the routes fail closed with 503. Rate limit:
20 reports/shop/hour (in-memory, nothing persisted). Body: plain text ≤ 4000 chars after
sanitization (tags stripped, control chars removed), pattern/stream refs are strict slugs,
≤ 25 patterns, hook sizes 1–24.
Why: the endpoint map fixes only the paths ("shop token in header"), so Bearer + HMAC was chosen
for statelessness (privacy-by-architecture: nothing about the requester is stored — no IPs in
logs, no sessions).
Impact: Role 4's admin SPA must send `Authorization: Bearer`; operators mint tokens with
`pnpm --filter api token -- --shop=<shopId>`. See `docs/reports/ROLE-3-HANDOFF.md`.

### [ROLE 3] 2026-09-02 — TWRA source target and schedule→event mapping
Decision: researched 2026-09-02 — the 2026 stocking schedule at
https://www.tn.gov/twra/fishing/trout-information-stockings.html renders an empty DataTables shell;
rows load from a CMS "excel-driven" JSON file whose URL (containing a redeploy-fragile numeric id)
is re-resolved from the page's `data-config` attribute on every fetch; raw page HTML + JSON are
both snapshotted to `apps/api/data/raw/TN/{date}.*`. Mapping: `LOCATION`→`streamName`,
`COUNTY`→`county`, `SPECIES`→ one event per species named; date = exact `STOCKING DAY` >
`STOCKING WEEK` (week-of Sunday) > `TBD M/YYYY` (first of month) > `STOCKING MONTHS` initials
(expanded to their next calendar occurrence, position-aware for repeated J/M/A initials); rows
with no usable date are skipped with a warning. `count` is omitted (TWRA does not publish it in
the schedule) and past dates are retained (consumers filter "upcoming").
Why: the JSON source is far more stable than scraping rendered HTML; the mapping is lossless
within the frozen contract and deterministic (idempotent re-scrapes upsert by content hash id).
Impact: Role 2 should treat stocking as a forward-looking schedule (dates may be past → filter);
stocking events have no `count`. A TWRA redesign soft-fails: warning in jobs_log + healthz,
previous events retained, process survives.

### [ROLE 3] 2026-09-02 — bootstrap content fixtures under apps/api/fixtures/content
Decision: two TN stream YAMLs + one fictional shop YAML live in `apps/api/fixtures/content/` so
tests and live demos run before Role 4's pack lands. One stream wires the live-verified USGS
gauge 03486000 ("Watauga River at Elizabethton TN"); the other is explicitly fictional with no
gauge (exercises the score-0/no-data path). Gauge IDs are consumed from `packages/content/streams`
via the existing seed (`TROUT_CONTENT_DIR` override kept).
Why: the gauges job has nothing to fetch until Role 4 ships streams; fixtures let the pipeline be
verified end-to-end (DoD "full cron run against live USGS + one live state page").
Impact: Role 4's real content supersedes these; nobody should copy fixture YAML into
packages/content wholesale. NOTE: the shared content README still says "launch regions TX/OK/AR"
while the master plan §2/§7 says Tennessee — flagging for Role 4/6; master plan wins.

### [ROLE 3] 2026-09-02 — generated snapshots are gitignored build artifacts
Decision: added one line to the root `.gitignore` (Role 1's file): `apps/web/public/data/` is
treated like `dist/` — regenerated by `pnpm --filter api snapshots` (wired into deploy.sh via the
`snapshots` script Role 1 anticipated) and by cron after each ingestion.
Why: snapshots are derived data (regenerated hourly); committing them would churn git and risk
stale serving. This is the only edit made outside `apps/api/**`.
Impact: Role 2 dev servers see no data files until one ingest run; Role 5's e2e should generate
them in setup or stub. If the team prefers committed snapshots for dev convenience, delete the
.gitignore line and commit the folder (both work with the builder).

### [ROLE 3] 2026-09-02 — fetch retries with backoff (live-observed transient failures)
Decision: all USGS + TWRA fetches retry transient failures (network errors, 5xx, 429) up to 3
attempts with exponential backoff (1–1.5s base). Non-transient 4xx fail immediately.
Why: tn.gov intermittently resets connections (observed live during verification: "fetch failed"
with no HTTP response, then success on manual retry); polite retry is cheaper than failed runs.
Impact: none on other roles; job durations may be ~2-3s longer under transient failure.

### [ROLE 4] 2026-09-02 — launch state is Tennessee (supersedes Phase-0 TX/OK/AR note)
Decision: the Role-4 content corpus is Tennessee-only (§2 v1 scope + §7 content model name TN
launch regions); Role 1's Phase-0 shell README listed Guadalupe (TX)/Lower Mountain Fork (OK)/
White & Little Red (AR) from an earlier draft.
Why: the shared context is canonical — "1 launch state (Tennessee)" and the §7 region list are
explicit and later than the shell note.
Impact: hatch/streams/shops dirs are `tn/` only; `stateId` remains a free 2-letter code in the
frozen contracts, so adding states later needs no contract change.

### [ROLE 4] 2026-09-02 — additive `GET /v1/portal/me` endpoint
Decision: the portal calls `GET /v1/portal/me` (Bearer shop token → Shop) to resolve identity at
login; this route is not in the frozen §6 endpoint map.
Why: the portal needs to verify a pasted token and show shop identity without trusting the token's
unsigned shopId segment; §6's POST-only portal surface has no read for it.
Impact: ADDITIVE only — no existing route renamed/removed (per §6 additive-change rule; requires
ADR + tag bump only if signatures change). ROLE 3 implements it as snapshot-free live auth route.

### [ROLE 4] 2026-09-02 — additive `photoUrl` on report input
Decision: the composer accepts an optional `photoUrl` (https-only, validated client-side) and
sends it with `POST /v1/portal/reports`; the frozen `ShopReport` schema has no such field.
Why: shop reports are more useful with a photo; the role brief lists "optional photo URL" as a
composer feature.
Impact: ROLE 3 may ignore, persist, or reject-unknown-fields the extra key per its Zod config —
recommend accepting + passing it through additively. Public feed renders it only if present.

### [ROLE 4] 2026-09-02 — hatch YAML is one file per region with a `months[]` list
Decision: `hatch/{stateId}/{regionId}.yaml` holds the whole year for a region as `months:` (12
entries), not one file per month.
Why: authoring/reviewing a region's seasonality in one file beats 132 files; the build emits the
frozen `HatchChart` shape (and per-month `/v1/hatch/{regionId}/{month}.json` snapshots) unchanged.
Impact: none at the contract surface; Role 5's marketing pages and the PWA consume built JSON.

### [ROLE 4] 2026-09-02 — `@trout/content` exposes the built pack via `./pack/*` export
Decision: content's package.json adds `"exports": { "./pack/*": "./dist/pack/*" }`; `apps/admin`
imports `@trout/content/pack/{streams,patterns}.json` for the composer pickers.
Why: the portal needs the same content pack as the PWA; a workspace subpath export is the
pnpm-sanctioned way to consume another package's build artifact without reaching into its internals.
Impact: build order matters — `pnpm --filter @trout/content build` must precede admin build/test
(vitest config aliases the pack to a test mock so tests don't require it).

### [ROLE 4] 2026-09-02 — MSW mock API is default-on in portal dev mode
Decision: `apps/admin` starts `msw`'s browser worker in dev unless `VITE_ENABLE_MSW=false`; the
worker file (`public/mockServiceWorker.js`) is dev-only and never deployed.
Why: the real API arrives with Role 3; an always-working dev experience with fixtures parsed
against the frozen contracts keeps portal development unblocked and contract-honest.
Impact: production builds never import MSW (guarded by `import.meta.env.DEV`); Role 3's API can
replace it by running the portal against the real origin.

### [ROLE 2] 2026-09-02 — Playwright harness lives in apps/web; specs in e2e/web; additive devDep in e2e/
Decision: Role 2's Playwright specs live at `e2e/web/*.spec.ts` (per role scope #10) but the
harness — `apps/web/playwright.config.ts`, `apps/web/e2e.global-setup.cjs`, the `test:e2e` script —
lives in `apps/web`. `e2e/package.json` received ONLY an additive devDependency (`@playwright/test`)
and a `test:web` script, flagged in its `//` ownership comment.
Why: e2e/ is Role 5's area; keeping config inside apps/web minimizes the footprint in Role 5's
territory while the specs sit at the contract location Role 6's checklist expects (§12 #6).
Impact: Role 5 owns e2e/ going forward; keep the additive entries, add Role 5 specs alongside.

### [ROLE 2] 2026-09-02 — e2e runs against the fixture BUILD via `vite preview`, not a mock server
Decision: `e2e.global-setup.cjs` runs the real production pipeline (`vite build --config
vite.fixtures.config.ts` + size-budget gate) and the suite serves `dist` through
`vite preview` on :4173 — the same static-hosting layout Cloudflare will serve (real /v1/* URLs,
real service worker, real IndexedDB). If the sandbox forbids spawning processes, setup reuses an
existing `build:fixtures` output and refuses to continue with none.
Why: tests the actual SW precache + runtime caching + offline behavior instead of a dev-server
facsimile; the build+size gate doubles as the §2 25 MB CI check.
Impact: Role 3/4 snapshot/content output must land at `apps/web/public/data/**`, `public/content/**`,
`public/v1/**` (or be copied into dist) to be picked up; the SW precache globs are presence-driven.

### [ROLE 2] 2026-09-02 — content-pack + snapshot fixture URLs mirror the frozen endpoint surface
Decision: `apps/web/fixtures/data/` mirrors `ENDPOINTS` (`/v1/streams`, `/v1/conditions/latest.json`,
`/v1/stocking/TN.json`, `/v1/hatch/{region}/{month}.json`, `/v1/shops/TN.json`,
`/v1/reports/recent.json`) plus the bundled content pack at `/content/taxa.json` and
`/content/patterns.json`, generated by `scripts/generate-fixtures.mjs` and validated against the
frozen Zod schemas before writing.
Why: scope #9 requires fixtures demoable before Roles 3/4 merge; scoring in fixtures is computed
with the REAL `scoreConditions()` so fixtures stay contract-accurate.
Impact: Role 3's snapshot builder and Role 4's content build must emit the same URL shapes
(/v1/* per contracts; content pack at /content/*.json) or the PWA URLs change.

### [ROLE 2] 2026-09-02 — FreshnessChip reads "Offline · last known" whenever the device is offline
Decision: the chip ANDs the payload's `live` flag with `navigator.onLine` (via `useOnline()`).
A payload fetched live seconds before signal dropped renders as "Offline · last known …" while the
device is offline.
Why: while offline the device cannot confirm the data is still current; TanStack Query may legally
serve a still-unstale live entry after airplane mode flips, which would otherwise render a lying
"Live" chip (caught by the offline cold-start e2e).
Impact: none on other roles; purely presentation truthfulness.

### [ROLE 2] 2026-09-02 — "Near me" uses a bundled stream-coordinate table (client-side only)
Decision: `src/data/streams-geo.json` bundles approximate public gauge coordinates per stream; the
"near me" sort computes great-circle distance on-device from the Geolocation API position.
Why: privacy non-negotiable #2 — coordinates must never appear in any request; server-provided geo
would also make the feature network-dependent. Coordinates are approximate public data (gauge
locations, not secret spots).
Impact: Role 4 stream content should eventually carry/confirm coordinates so the table can move
into the content pack (kept as an integration follow-up, not a v1 blocker).

### [ROLE 2] 2026-09-02 — bottom tab bar uses short labels; e2e asserts sidebar labels
Decision: mobile bottom tabs render short labels (Home/Hatch/Water/Charts/Log); the desktop sidebar
keeps full labels. Specs use sidebar labels at the default 1280×720 viewport.
Why: tab bar legibility on small screens; Playwright's default viewport is desktop-width, so the
tab bar (lg:hidden) is not in the accessibility tree during e2e.
Impact: none.

### [ROLE 5] 2026-09-02 — launch state is TENNESSEE ONLY (canonical plan), not TX/OK/AR
Decision: all marketing programmatic pages, fixtures, and e2e coverage target a single launch
state, TN (regions: East TN tailwaters, Hiwassee, Middle TN per §7 of 00-SHARED-CONTEXT).
Why: the canonical plan (CHAT-*.md / 00-MASTER-PLAN.md) says "1 launch state (Tennessee)" and the
user confirmed Tennessee-only explicitly. Phase-0 shell text elsewhere in the repo (root README,
packages/content/README.md, the endpoints.ts doc comment) references TX/OK/AR — that predates the
Tennessee decision in the canonical files.
Impact: contracts are state-agnostic (StateIdSchema = /^[A-Z]{2}$/), so nothing frozen changes.
REQUEST to ROLE 1/4: update the TX/OK/AR mentions in README.md, packages/content/README.md and
any seed/scrape targets to Tennessee (TWRA) at integration.

### [ROLE 5] 2026-09-02 — marketing builds from contract-validated fixtures, not the live API
Decision: `apps/marketing/src/data/fixtures/*.json` are the build-time data source; every file is
Zod-validated against frozen @trout/contracts schemas at build (loader: src/data/load.ts) with
cross-reference lint (orphan taxon/pattern/stream refs fail the build). ConditionSnapshot scores
are computed at build with the frozen scoreConditions(), never hand-written.
Why: CI and static builds must run without the laptop server (§3 read path is static); scores must
not drift from the PWA logic.
Impact: at integration (§12 #3), swap the fixture imports for regenerated snapshot JSON — the
getter signatures and validation stay identical.

### [ROLE 5] 2026-09-02 — fixture gauge IDs and sample data are illustrative
Decision: stream gaugeIds (03476500, 03467000, 03566000, 03414000, 03597000), stocking events,
shops and shop reports in the marketing fixtures are realistic SAMPLES; shops use example.com
URLs and names suffixed "(sample)".
Why: Role 3/4 own authoritative gauge linkage and content; Role 5 must not publish invented facts
as authoritative (attribution culture, §1.5). Every page carries "verify officially" disclaimers.
Impact: Role 3/4 replace fixtures with verified data at integration; no code changes.

### [ROLE 5] 2026-09-02 — e2e deep flows shipped as `test.fixme` against frozen semantics
Decision: `e2e/web/offline-hatch.spec.ts` (hatch ID flow, conditions flow), `e2e/admin/portal.spec.ts`
(MSW token login + composer) and `e2e/api/fixtures.spec.ts` (`ingest --dry-run`) contain the
canonical deep steps as test.fixme; the suites are green today (24 passed) with shell-level
assertions running for real (SW registration, offline reload, privacy interception, SEO hygiene).
Why: the UIs/CLI belong to Roles 2/3/4 and don't exist yet; skipping with written expectations is
honest (suite green now) and mechanically enables at integration by deleting the fixme wrapper.
Impact: Integration enables all fixmes in Phase 2 (docs/integration-checklist.md items 2/4/5/6).

### [ROLE 5] 2026-09-02 — root `pnpm e2e` alias requested (did not edit root package.json)
Decision: the suite runs via `pnpm --filter @trout/e2e e2e` everywhere (qa.yml, checklist, e2e
README). Requesting ROLE 1 add `"e2e": "pnpm --filter @trout/e2e e2e"` to root scripts.
Why: §4 role brief says "run via `pnpm e2e`", but root package.json is ROLE 1-owned (§5 hard rule;
protocol = record request here, use a shim, move on).
Impact: one-line addition by Role 1; nothing else changes.

### [ROLE 5] 2026-09-02 — @trout/ui + yaml added to marketing dependencies
Decision: marketing depends on `@trout/ui` (tokens.css for brand consistency, imported in
Base.astro) and `yaml` v2 (parses partners.yaml for the inert AffiliateLink registry; parser
already blessed by ADR 0001).
Why: tokens keep marketing visually consistent with the PWA; partners.yaml is Role 5's registry
per the role brief.
Impact: none on other packages.

### [ROLE 5] 2026-09-02 — canonical SITE_URL placeholder `https://trout.example`
Decision: astro.config.mjs + src/site-config.ts read SITE_URL (default `https://trout.example`);
canonical/OG URLs, sitemap.xml and robots.txt all derive from it. SEO tests assert pathname
self-canonicality + sitemap/canonical origin agreement, not the placeholder host.
Why: the production domain is not chosen yet (deployment via cloudflared tunnel, Role 1/infra);
tests must not depend on the host.
Impact: pre-launch task in docs/integration-checklist.md: rebuild with SITE_URL=<production>.

### [ROLE 5] 2026-09-02 — Lighthouse PWA gate runs as `warn` pre-integration
Decision: e2e/lighthouserc.web.cjs asserts a11y ≥ 0.9 and best-practices ≥ 0.9 as errors;
`categories:pwa` ≥ 0.9 is warn until Integration flips it to error. Marketing asserts
SEO ≥ 0.95 / a11y ≥ 0.9 / best-practices ≥ 0.9 as errors today.
Why: §12 #7 (installable + offline + a11y ≥ 90) is an integration-phase gate judged against the
finished app; the Phase-0 shell already passes a11y and registers its SW.
Impact: one-word config flip at integration (checklist item 7).

### [ROLE 6] 2026-09-02 — web region table aligned to the content registry (11 regions)
Decision: `apps/web/src/data/regions.ts` and marketing's `states.ts` REGIONS now carry the
11 launch-region ids from `packages/content/scripts/regions.ts` (Role 4). The fixture-era
ids (`tn-east-tailwaters`, `tn-hiwassee`, `tn-middle`) no longer exist anywhere; web +
marketing fixture generators were re-pointed at the real ids.
Why: charts/streams pages and marketing region pages fetch `/v1/hatch/{regionId}/…` — the
UI table and the snapshot tree must key off the same registry.
Impact: none on contracts (regionId is an open string); better-sorted near-me unaffected.

### [ROLE 6] 2026-09-02 — e2e consolidation: `e2e/` is canonical, apps/web harness retired
Decision: Role 2's four web specs were absorbed into `e2e/web/` (offline-cold-start,
conditions-fixtures, manifest; privacy-audit's unique checks folded into privacy.spec) and
`apps/web/playwright.config.ts` / `apps/web/e2e.global-setup.cjs` / its `test:e2e` script
were removed. `e2e/global-setup.mjs` now builds the web fixture flavor + the admin flavor
(baked against the e2e API origin) and seeds a throwaway DB + mints a real portal token so
the portal specs run the §12 #5 flow against the REAL API on :8791.
Why: two overlapping Playwright suites with two configs would drift (confirmed seam #7).
Impact: `pnpm --filter @trout/e2e e2e` is the one suite; root `pnpm e2e` alias added (the
[ROLE 5] request is satisfied).

### [ROLE 6] 2026-09-02 — all Phase-1 `test.fixme` wrappers enabled (0 skips)
Decision: the api `ingest --dry-run` spec runs the real CLI; the offline deep flow lives in
`e2e/web/offline-cold-start.spec.ts` (Role 2's verified selectors replace the stubbed
semantics); the online conditions flow is `e2e/web/conditions-fixtures.spec.ts`; the admin
portal specs drive the real API. `e2e/lighthouserc.web.cjs` `categories:pwa` flipped
`warn → error` per §12 #7.
Why: §12 #6 mandates 0 skips at integration; Role 5's stubbed selectors did not match the
shipped UI (no `data-testid` hooks exist), so the equivalent working assertions were used.
Impact: qa.yml unchanged — the suite is strictly stronger.

### [ROLE 6] 2026-09-02 — secondary origins served by `infra/static-server.mjs`
Decision: pm2 runs `trout-portal-static` (:8788, apps/admin/dist, proxying `/v1/portal/*`
to the API so the portal build stays same-origin and environment-neutral) and
`trout-marketing-static` (:8789, apps/marketing/dist). cloudflared ingress entries for both
are completed in `infra/cloudflared/config.yml`. See ADR 0004.
Why: seam #5 — nothing served the two secondary app builds; a zero-dep Node server avoids
new dependencies and keeps the portal's build free of the production hostname.
Impact: `PORTAL_ORIGINS`/CORS remains as a dev-only escape hatch (portal dev against a
local API can still set `VITE_API_BASE`).

### [ROLE 6] 2026-09-02 — marketing reads real snapshots when `MARKETING_DATA_DIR` is set
Decision: `apps/marketing/src/data/load.ts` accepts `MARKETING_DATA_DIR=<apps/web/public>`
at build time and consumes the regenerated `/v1/*` + `/content/*` tree (validated with the
same frozen schemas); default remains the bundled `(sample)` fixtures so CI and e2e stay
deterministic. `infra/deploy.sh` rebuilds marketing from real data after snapshots.
Why: Role 5's assumption ("swap the fixture imports for regenerated snapshot JSON") — the
programmatic SEO pages then render real Tennessee data.
Impact: soft content (stocking/reports) degrades to empty pages if not yet scraped; core
files stay strict.
