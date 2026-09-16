# Full-spectrum review — paste-ready prompt (single session)

**How to use:** open ONE capable session on a fresh clone of this repository, paste
everything below the cut line as the first message, and let it run. The session performs
the entire review itself — no subagents — and writes one report to
`docs/reports/review-<date>.md`. Nothing else in the repo is modified.
(For a record of past reviews/audits see `docs/INDEX.md`; known open items:
`docs/KNOWN-ISSUES.md`.)

---

You are the sole reviewer of the Trout repository and live site. Run a full-spectrum
review — security, privacy & data leakage, endpoint exposure, data integrity,
accessibility, ease of use, design, performance, offline behavior, SEO, content &
cartography, ops — and deliver one evidence-backed report. You report; you never repair.

Work pass by pass in the order given (it's priority order). Within each pass: **read the
code first, verify empirically only what reading can't settle**, and record findings as
you go — not in a batch at the end. Depth allocation: passes 1–2 deserve real
experimental verification; 3–5 are mostly reading plus targeted spot-checks; 6–7 are
cheap validators plus sampling judgment. Full e2e/Lighthouse runs are optional — only
if a finding needs one.

## Claims to falsify (the review's spine)

The product makes testable claims. Treat each as guilty until verified:

1. **Offline-first:** core flows (map, hatch key, charts, logbook) work with no signal.
2. **Privacy by architecture:** no third-party requests, no analytics in default builds,
   no cookies, no geolocation use, nothing leaves the device.
3. **One write surface:** everything public is static snapshot JSON except
   `POST /v1/portal/reports` + `GET /v1/portal/me` (HMAC shop token).
4. **Attribution culture:** every published fact carries a source citation.
5. **Self-healing production:** the watchdog/deploy loop actually heals the historic
   failure mode (vanishing/stale snapshot trees serving "Catalog unavailable").

## Context

Trout (trout.tntechclimb.com) is an offline-first, privacy-first PWA for Tennessee trout
anglers: MapLibre map with a generated Tennessee water catalog, USGS/TVA/USACE condition scores, TWRA
stocking, match-the-hatch key, shop reports, regulations, 555 prerendered SEO routes +
Astro marketing site. pnpm monorepo (Node ≥ 20, pnpm 9):

| Path | What it is |
|---|---|
| `packages/contracts` | Zod schemas, frozen `ENDPOINTS`, `scoreConditions`, `matchHatch` |
| `packages/ui` · `packages/content` | Design tokens · YAML content pack + validators |
| `apps/web` | React 18 + Vite 5 PWA (MapLibre, Workbox SW, Dexie, Tailwind) |
| `apps/api` | Fastify + better-sqlite3: ingest jobs, snapshot builder, live routes |
| `apps/admin` | Shop portal SPA (HMAC token auth — `apps/admin/TOKENS.md`) |
| `apps/marketing` · `e2e` | Astro SEO site · Playwright + Lighthouse harness |
| `infra` | deploy/watchdog/verify/backup scripts, static-server, pm2, RUNBOOK |
| `docs` | ADRs, provenance, KNOWN-ISSUES, INDEX, this prompt |

Invariants (verify, don't assume): read path = static files under `/v1/*` + `/content/*`
regenerated hourly (the one dynamic GET is `/v1/streams?state=`); snapshot routes are
served `no-store` so HTTP caching can't masquerade as live data; offline layer = Workbox
+ Dexie in-browser; production is a separate headless Windows laptop (WinSW service
`TroutSite`, schtasks watchdog/refresh/autoupdate, Cloudflare tunnel) that self-deploys
`main` hourly — dev machines use the pm2 stack. Do not confuse the two, don't "fix" prod.

## Ground rules (binding)

1. **Read-only.** No edits, commits, pushes, deploys, restarts. The only file you create
   is the report. `AGENTS.md` applies.
2. **Production is passive-only.** GET public URLs like a normal visitor; at most a
   couple of unauthenticated portal calls (expecting 401/503) to confirm fail-closed. No
   load tests, scanning floods, brute force, or crafted-token POSTs against prod.
3. **Third-party upstreams (USGS/TVA/USACE/TWRA/OSM) get a handful of polite requests
   max,** using the repo's declared User-Agent.
4. **Secrets stay secret.** Report location + redacted fingerprint (first/last 4 chars)
   only — never full values in the report or quoted output.
5. **Evidence or it didn't happen:** every finding carries `file:line`, a command +
   output, or URL + response. Unverified hypotheses are labeled SUSPECTED with
   confidence and the check that would settle them.
6. **`docs/KNOWN-ISSUES.md` items are exempt** (but report stale/wrong entries), and
   **negative results are results:** track what you checked and found sound per pass.

## Bring-up

```bash
pnpm install                       # pnpm 9, Node >= 20
pnpm -r build                      # contracts/ui dists + all apps
pnpm --filter api seed             # SQLite migrations + content seed
pnpm --filter api snapshots        # generate gitignored apps/web/public/{v1,content}
pnpm dev                           # web :5173 · admin :5174 · api :8787 · marketing :4321
curl -s http://127.0.0.1:8787/healthz
```

Caveats: `apps/web/public/v1/**` + `/content/**` are generated artifacts — absent until
seed + snapshots run (one web test skips honestly without them). Map has a built-in
geometry audit at `?qa=1`. `pnpm validate:content` validates the pack; asset validators
live in `apps/web/scripts/validate-*.mjs`. `infra/static-server.mjs <distDir> <port>
[--proxy v1/portal=http://127.0.0.1:8787]` is the zero-dep server for the portal and
marketing origins. Full e2e (boots all servers + a temp API with a minted portal token):
`pnpm --filter @trout/e2e exec playwright install chromium && pnpm e2e`.

## Severity

**P0** exploitable security hole / secret exposure / data loss / site-down · **P1** the
product lies (wrong data as fact, broken privacy/offline claim) or a core-flow blocker ·
**P2** meaningful defect with a workaround · **P3** polish/drift.

## Pass 1 — Security & privacy *(deepest verification)*

Read: `apps/api/src/app.ts`, `src/portal/routes.ts` + `tokens.ts`, `src/lib/sanitize.ts`,
`apps/admin/src/lib/tokenNode.ts`, `infra/static-server.mjs`, `apps/admin/TOKENS.md`,
`.gitignore`, `.env.example`, `e2e/web/privacy.spec.ts`, analytics plugin in
`apps/web/vite.shared.ts`.

- **Route inventory:** enumerate every URL the public can reach on every origin (API
  process, portal + marketing static servers, prerendered files, the live site). Should
  each be public? Is `/healthz`'s jobs summary operational over-disclosure?
- **Portal auth:** auth runs before body parsing; constant-time HMAC compare; expiry,
  unknown shop, `reportsEnabled:false` all fail correctly; unset secret fails closed.
  Mint your own test token locally and probe replay / tampered signature / expired /
  malformed — all must 401.
- **Rate limiter** (in-memory Map): unbounded growth? bypassable pre-auth?
- **Injection:** report text + `photoUrl` sanitized on write AND on every render path
  (web + admin); `photoUrl` never server-fetched (SSRF), client renders it only as img.
- **Leakage scan** of generated `public/v1/**`, `/content/**`, built dists: owner
  emails, internal paths, tokens, source maps. Check log output (redaction covers
  authorization/cookie/IP — what about query strings, error URLs, portal bodies?).
- **Headers** per origin: CSP, X-Content-Type-Options, frame/referrer protection —
  absence consequences given token-in-localStorage.
- **Secrets hygiene:** `.env` + `backups/push-url.txt` (ntfy topic = credential)
  gitignored and absent; test secrets confined to fixtures; `pnpm audit` triaged.
- **Privacy falsification (claim 2):** inspect a default build dist for third-party
  URLs, analytics beacon, geolocation API use; run the e2e privacy spec if cheap; check
  the logbook/Dexie layer never syncs.

## Pass 2 — Data integrity

Read: `apps/api/src/ingest/**`, `src/evidence/**` (conditionsBridge, monitors, aliases,
providers, stale), `src/snapshots/build.ts` + `health.ts`, `src/jobs/run.ts`, `src/db.ts`,
`src/lib/ids.ts`, `packages/contracts/src/scoreConditions.ts` + `readingFreshness.ts`,
`apps/web/src/lib/stockingMatch.ts`.

- Run `seed` + `snapshots` twice — byte-stable output? Deterministic ids across
  regenerations (a changed id silently orphans client caches)?
- Fake one dead provider (stub URL): are partial rows quarantined or published as truth?
- Scorer: determinism; clamped-0 lethal → Poor vs cannot-assess → No data; sanity that
  in-band improvements never lower the score without reason; unit correctness across
  USGS (cfs) / TVA / USACE (conversions, °F/°C).
- Freshness: fetch time never presented as observation time; stale/offline wording
  matches data.
- Stocking: sample 10 real TWRA rows through the alias matcher; scheduled ≠ stocked
  honesty; `datePrecision` end-to-end; timezone behavior at date boundaries.
- Hatch charts: month-keyed (no prior-month substitution); 12 regions × 12 months.
- Snapshot build: Zod-validates before writing; atomic swap; `conditionsFeedHealth`
  actually catches the historic failure (claim 5's detector).

## Pass 3 — Interface: accessibility, usability, design

Keyboard-only the core flows (search → water → conditions → hatch key → chart → logbook;
portal login → compose → publish): focus visible, logical order, no unintentional traps,
Escape closes topmost only. Contrast in BOTH themes (Daybreak/Nightfall) including map
condition colors and faint text — measure ratios. Touch targets ≥ 44px (esp. map
points); 200% zoom reflow; reduced motion honored (CSS + map camera); async states have
aria-live; prerendered pages are accessible pre-JS; portal forms announce errors.

Usability judgment: first-visit comprehension, jargon explained, honest empty/offline/
error states, back-button + deep-link behavior, mobile sheet ergonomics, search quality.

Design vs `docs/DESIGN.md` canon: screenshot ~10 key screens at 320/390/768/1440 in both
themes (map statewide + East TN zoom 8–9, atlas, water detail, hatch key, chart,
stocking, regulations, taxa detail, portal, marketing); token discipline (grep hardcoded
hex in components); theme swap preserves camera; prerender → SPA boot parity; typography.

## Pass 4 — Performance & offline

Bundle + size-budget output; the standing ~1.7 MB main chunk — what's in it, highest-
leverage split. Warm → airplane-mode flow manually (hatch wizard, charts, unvisited
water shows "Offline · last known", reload resilience); SW precache list vs actual
assets (atlas/topo/roads glob); runtime cache timeout behavior; fonts precached; `no-store`
interplay with the SW. Dexie schema/migrations + quota exhaustion behavior. Lighthouse
(shipped configs in `e2e/`) optional. Prerender: build time, weight, staleness vs
snapshot age.

## Pass 5 — SEO & marketing surface

Sitemap: URL classes + spot-check 30 resolve; lastmod honesty; self-canonicals;
`/fishing-info` → `/regulations` canonical. robots: noindex on /logbook + /settings
only. Sample pages: unique title/description, OG/Twitter, JSON-LD parses and validates.
Prerendered content present pre-JS and matches SPA data; title swap on boot harmless.
Marketing site: internal links resolve, zero third-party refs, mobile layout, CTA → app
handoff, no analytics beacon in default build.

## Pass 6 — Content & cartography

Run every shipped validator (`apps/web/scripts/validate-*.mjs`, `pnpm validate:content`)
— all green? `?qa=1` in the app; reconcile its counts (looser thresholds) vs build-time
detectors. Geometry spot-audit 10 waters across regions vs authoritative sources; confirm
the known-fixed defects (Duck, Tellico, Horse Creek, Wolf) are still fixed. Sample 10
stream YAMLs (species/fishery/yearRound supported by cited source?), 5 hatch months
(seasonal plausibility), 5 regs entries vs current TWRA publication, taxa photo
credits/licenses vs `docs/imagery-provenance.csv`. Sweep for naked facts (no `sourceUrl`)
and stale captures claiming current currency.

## Pass 7 — Ops, CI & repo hygiene

RUNBOOK vs reality: documented commands match script flags (dry-run with `--dry-run` /
`--local` seams — never against prod). Trace `deploy.sh` archive→mutate→verify→rollback
for a path that skips verification or half-rolls-back. Watchdog heal ladder (regen before
restore, ntfy on transitions only). Portability: production Git Bash allows bash builtins
+ git + pnpm + node ONLY — grep entry scripts for sleep/tar/find/tee/curl. schtasks names
vs RUNBOOK §9; pm2 = dev only. CI (`ci.yml`, `qa.yml`): what's gated, what should be but
isn't (validators? prerender?). Backups: what covers the SQLite DB itself; has restore
ever been tested. Docs: INDEX.md accurate, no dangling links.

## Synthesis & report

1. Cross-cutting patterns first — a solo review's advantage: look for the *class* behind
   individual findings (e.g., one missing validation habit, one stale-assumption theme).
2. Re-verify every would-be P0 yourself before writing it down.
3. Write `docs/reports/review-<today>.md`:
   - **Executive summary:** verdict per dimension (1–5 + one paragraph), counts by
     severity, top-10 must-fix.
   - **Findings** (sorted by severity), each as
     `{ id: PASS<n>-<n>, severity: P0–P3, confidence: verified|suspected, area,
     location, evidence, impact, recommended_fix }`.
   - **Verified-OK ledger:** per pass, the specific things checked and found sound.
   - **Method appendix:** environment + versions + date, what ran vs what was reasoned
     from reading, what was skipped and why.
4. Done when: the report exists, `git status` shows no other change, and your final
   message summarizes the top findings.
