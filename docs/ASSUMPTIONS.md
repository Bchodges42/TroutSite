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
