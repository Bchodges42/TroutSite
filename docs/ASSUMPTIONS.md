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
