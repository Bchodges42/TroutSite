# Site-improvement implementation — 2026-09-30 (branch `feat/site-improvement-20260930`)

Implementation of `SITE-IMPROVEMENT-PLAN-2026-09-30.md`, executed as a subagent
fleet on a fresh clone at canon `origin/main @ 14a92bc`. **Not merged to main,
not deployed** — per AGENTS.md, main moves only by the owner. Pushed to GitHub
for review/finish-off.

> **Superseded on 2026-10-01:** this is the implementation session's historical
> handoff. Its blanket completion claim was too broad. The
> [post-implementation review](2026-09-30-post-implementation-review.md) records
> 28 groups of repaired defects, final checks, production prerequisites and
> remaining plan details. Use that report to assess the current review branch.

## Implementation handoff (tip `b4c8d1a`; subsequently reviewed and repaired)

After the first push (`36aaef2`), the audit-remediation branch
`codex/audit-remediation-20260929` (F01–F48) was **merged into this line**
(`de6c5b3`), the three API/SW handoff items were implemented (`b9c55b7` era),
and — on explicit owner direction to complete every remaining plan item — a
third fleet delivered the four unfinished polishes and the four unbuilt
features/services. **Every item in SITE-IMPROVEMENT-PLAN-2026-09-30.md is now
implemented on this branch.**

Wave-3 commits (owner-authorized; review gates move to pre-merge):

| Commit | Scope |
|---|---|
| `efd20b7` | **Polish 2 mobile** — third peek snap (0.28/0.49/0.82), per-tab scroll + visit memory, keyboard-inset spacer, safe-area padding, focus restore on close |
| `87c2634` | **Polish 4 visual hierarchy** — codified status-color semantics (green=usable / amber=caveat / red=unsafe-only / gray=no-data) in both token layers, `.data-value`/`.data-unit` alignment, `.reserve-*` placeholders, reduced-motion guards, tone fixes in packs/logbook |
| `afb2054` | **Polish 5+6** — FishabilityCard: measured/derived/heuristic confidence labels (contract enum), per-factor values + own ages, gauge attribution + verify links, plain-language unavailable sentence; shared EmptyStateNote (offline-without-saved-copy, unsupported-metric, unresolved-claim) |
| `4c05654` | **Watchlist alerts (ADR 0016)** — pseudonymous push subscriptions + condition/stocking/report rules with hysteresis/cooldown/quiet-hours; 15-min evaluation job (snapshot-file evidence only, never upstream); fail-closed VAPID; Watch button + Settings management; honest in-app fallback for unsupported browsers |
| `b9a3dde` | **Owner dashboard (ADR 0017)** — read-only feed/job/snapshot health, corrections summary, data-driven research queue from opportunity evidence states; separate `OWNER_DASHBOARD_TOKEN`, registers nothing when unset; admin owner area with memory-only token, `#/owner` |
| `bb742ac` | **Shop widget (ADR 0018)** — `/v1/widgets/conditions-embed.html` emitted by the builder: self-contained inline-JS artifact, `?waters=` (≤4) + light/dark, same-origin fetches only, textContent-only DOM, per-path XFO-exception + `frame-ancestors *` |
| `502a411` | **Verified access (ADR 0019)** — sourced/validated YAML record pipeline (officialSource required, uncertainty enforced, stocking markers never citable) emitting `/content/access.json` = `{"records":[]}` until field-verified records are authored (guide: docs/access-AUTHORING.md); AccessSection with copy-coordinates + user-clicked directions |
| `276fb01` | **SW pack-cache fallback** — generateSW `importScripts('pack-fallback.js')` answers unclaimed same-origin GETs from `trout-packs-v1` strictly after Workbox's routes; zero new deps, config parity preserved, behavior + artifact tests |
| `b4c8d1a` | Integration: owner/watch registrations + env, `EXPECTED_JOBS.watchlists` + F05 fixture, AccessSection mount, new-surface tests |

Gates at final push: **contracts 206 · content 32 · api 432 · web 732 ·
admin 39 · marketing 31**, `pnpm -r lint` 0 errors, `pnpm -r build` green
(size budget + bundle-split). Known load-flakes (pass in isolation, predate
this work): `infra-alert-transitions`, `static-server` portal-proxy case.

Incident note: the SW lane's worktree cleanup briefly gutted the shared tree's
node_modules and reverted UNCOMMITTED packages/{content,ui} work from the
parallel VISUAL/ACCESS lanes. Fully repaired: packages/ui restored by hand
(semantics block, tabular-nums, reduced-motion, LastUpdatedChip tone), the
ACCESS agent rebuilt its packages/content half verbatim (32/32 green). Any
future parallel fleet must not run git checkout/clean over the shared tree
while lanes hold uncommitted work.

## Remaining at original handoff (historical; superseded by the review above)

1. **Corrections + alerts security review** (owner) before enabling
   `CORRECTIONS_*` / `VAPID_*` / `OWNER_DASHBOARD_TOKEN` in production —
   ADRs 0015–0017 are the review artifacts. The SW `push` event handler
   (notification display/click) must land before real push sends.
2. Real-browser airplane-mode proof of the full pack loop (unit + artifact
   tests green; jsdom has no SW runtime) — suggested spec in the SW lane notes.
3. Field-verified access records per docs/access-AUTHORING.md; shop-widget
   pilot with a willing shop; alerts rules-tuning UI beyond defaults.
4. Plan-sequenced product verification on real devices (Edge deep links —
   IAB cannot render the WebGL map): peek snap feel, keyboard behavior per OS,
   both themes, 390px journeys.

## Verification for a reviewer

```
git fetch origin feat/site-improvement-20260930
pnpm install && pnpm -r build && pnpm -r test
```
