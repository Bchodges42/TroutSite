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
