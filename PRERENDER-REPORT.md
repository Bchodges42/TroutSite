# PRERENDER-REPORT — SEO for the client-rendered Trout SPA

Prototype branch `proto/prerender` in the throwaway clone `C:\Users\Benjamin\Projects\trout-s3-proto`.
Everything below was verified by running the gates in this clone; nothing in `trout-s3` or `trout` was touched.

---

## 1. Approach chosen: (a) build-time post-`vite build` HTML injection — a ~330-line zero-dependency Node script

`apps/web/scripts/prerender.mjs` runs after `vite build`, reads the frozen snapshots (`/v1/streams`,
`/v1/conditions/latest.json`, `/v1/stocking/TN.json`, `/content/taxa.json`, `/content/patterns.json`,
`/v1/hatch/<region>/<month>.json`), takes the built `dist/index.html` as the shell template, and for each
SEO route writes `dist/<route>/index.html` with:

- per-route `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:title/og:description/og:url`;
- a JSON-LD block (`WebPage` + `BodyOfWater` + `BreadcrumbList` for waters; `ItemList` for hatch charts;
  `Taxon` for taxa; `Article` for patterns);
- **visible crawlable content inside `<div id="root">`** (h1 water name, region · type · species · ideal
  flow, the `notes` summary, latest gauge reading, up to 5 recent TWRA stocking rows; hatch-chart top-5
  taxa; stocking-schedule table; static-page intros). This is real content from the snapshots, not cloaked
  meta — and it is shown to the visitor for the pre-JS instant, so no hidden-text risk;
- the original `<script type="module" src="/assets/index-*.js">` untouched, so the SPA still boots and
  takes over.

It also emits `dist/sitemap.xml` (314 URLs) and `dist/robots.txt` (`Allow: /`, `Disallow: /logbook`,
`Disallow: /settings`, sitemap line) for the web-app origin `https://trout.tntechclimb.com`
(overridable via `SITE_URL`, mirroring `apps/marketing/astro.config.mjs`).

**Why not `react-dom/server renderToString` with a MemoryRouter?** Importing the real `App.tsx` into Node
drags in `maplibre-gl`, `virtual:pwa-register`, Dexie, CSS imports and Vite-only modules — you'd need a full
SSR transform (a second build) to render real components. Template injection into the already-built shell
gets 95% of the SEO value for 5% of the complexity, and cannot desync from the bundle because it *is* the
bundle's HTML.

## 2. URL forms that work on `infra/static-server.mjs` (no server change needed)

Read carefully: **the server DOES do directory-index fallback** (static-server.mjs lines 100–103):

- `GET /conditions/south-holston-river` → `dist/conditions/south-holston-river` exists as a directory →
  serves `dist/conditions/south-holston-river/index.html`, `200`, `text/html; charset=utf-8`,
  `Cache-Control: no-cache`. ✅ verified by curl.
- Same for `/stocking`, `/fishing-info`, `/charts/<region>/<month>`, `/taxa/<id>`, `/patterns/<id>`.
- Unknown extensionless paths (e.g. `/browse`) fall through to the SPA fallback (shell `index.html` for
  `Accept: text/html`) — unchanged behavior. ✅ verified.
- Data fetches without `Accept: text/html` still get real 404 JSON. ✅ verified (`/v1/nope` → 404).

**Conclusion: emit `<route>/index.html`, use clean pretty URLs in the sitemap. No static-server change.**

## 3. Diff summary (exact)

| File | Change |
|---|---|
| `apps/web/scripts/prerender.mjs` | **Added** — the whole implementation (~330 lines, zero deps, Node ≥ 23.6 for TS type-stripping of `src/data/regions.ts`) |
| `apps/web/package.json` | **Modified** — added scripts: `"prerender": "node scripts/prerender.mjs"`, `"build:seo": "pnpm run build && pnpm run prerender"`. `build` itself untouched |
| `PRERENDER-REPORT.md` | **Added** — this report |

No changes to `src/`, `vite.shared.ts`, `infra/static-server.mjs`, or the size-budget script.

## 4. Trade-offs: (a) vs (b) vs (c)

| | (a) post-build script (CHOSEN) | (b) SSG/prerender plugin | (c) marketing Astro app owns SEO |
|---|---|---|---|
| SEO coverage | All 314 app-origin routes from snapshot data | Same, in principle | Marketing origin only (`/streams/{state}/{slug}/`) |
| Toolchain risk | None — runs on build output, no plugin APIs | vike = framework adoption; react-snap unmaintained (Puppeteer, breaks on React 18 `createRoot`); vite-ssg is Vue-centric; all fight `vite-plugin-pwa` + `virtual:pwa-register` | None, but only helps its own origin |
| Maintenance | One script re-reads snapshot JSON; breaks loudly if schema drifts | External dep churn, SSR-shaped entry rewrite | Split-brain: two data pipelines for the same waters |
| PWA compatibility | Perfect by construction (runs after workbox writes `sw.js`) | Must re-verify precache globs/navigateFallback per plugin | Untouched |
| Hydration | None — `createRoot` clears injected DOM (see §5) | Real hydration = mismatch risk with Dexie/Query async data | n/a |
| Verdict | ✅ done, green | Rejected: maintenance risk >> a 330-line script | Rejected as the primary fix; note below |

**Note on (c):** the prompt said water-detail pages "don't exist" in `apps/marketing` — they actually do:
`apps/marketing/src/pages/streams/[state]/[slug]/index.astro` already prerenders per-water programmatic
pages with JSON-LD, plus `sitemap.xml.ts` / `robots.txt.ts` (ROLE 5). So marketing already owns long-tail
SEO on its own origin. But the **app origin** is what this task targets: deep links to
`trout.tntechclimb.com/conditions/:id` (shared from the PWA, linked from gauges) still served an empty
shell to crawlers. (a) fixes the app origin; (c) remains complementary, not a substitute.

## 5. Hydration notes (plainly)

- **There is no hydration.** `apps/web/src/main.tsx` uses `createRoot(document.getElementById('root')).render(...)`.
  React 18 `createRoot` **clears all existing children** of the container on first render, so the injected
  `#prerender` block is wiped wholesale the moment the bundle executes. Because we never call `hydrateRoot`,
  **no hydration-mismatch warnings are possible**, ever.
- Cost: a brief "flash of static content then app render" on slow connections (the same URL renders the
  same route, so the swap is content-similar). Benefit: crawlers and slow devices see text immediately.
- **Data refetch happens as today**: TanStack Query (`networkMode: 'offlineFirst'`) fetches `/v1/*` after
  boot exactly as on the plain shell. The prerendered gauge/stocking numbers are build-time snapshots by
  design; live values replace them client-side.
- StrictMode double-render is dev-only and unaffected; nothing in the prerendered output is interactive
  (no event listeners to rebind).

## 6. PWA / service-worker impact (state: which files are precached and why)

- `vite.shared.ts` precaches `globPatterns: ['**/*.{js,css,html,svg,woff2}', …]` **at `vite build` time**.
  The prerender script runs **after** that, so its 314 HTML files are generated after workbox has already
  written `dist/sw.js`. **Verified in the built `sw.js`: the only HTML in the precache manifest is
  `index.html`; zero `conditions/`, `charts/`, `taxa/`, `patterns/` URLs.**
- This is the correct outcome, stated explicitly: prerendered pages are **intentionally NOT precached** —
  (1) ~1.4 MB of churny per-deploy HTML revisions would bloat the 25 MB install budget for no offline gain;
  (2) offline navigations are already covered by `workbox.navigateFallback: '/index.html'` (verified
  present in `sw.js`), which serves the precached shell and lets the router render from Dexie as it does
  today. `navigateFallbackDenylist` needs no change.
- Consequence worth knowing: once a visitor's SW is active, workbox's `NavigationRoute` serves the precached
  shell for navigations regardless of network, so repeat PWA visits don't consume the per-route HTML. That
  is pre-existing app-shell behavior, unchanged; crawlers and first-time visitors (no SW) get the
  prerendered files.
- `registerType: 'autoUpdate'` unaffected; the SW hash changes only when the precached set changes.

## 7. Size-budget impact

- The gate (`pnpm --filter @trout/web build` → `scripts/size-budget.mjs`) runs **inside** `build`, before
  prerender: it saw **9.28 MB / 25 MB — OK**, identical to before (the script adds no bundle bytes).
- Prerender then adds **~1.4 MB** to `dist` (conditions/ 660 KB, charts/ 576 KB, taxa/patterns/static +
  sitemap). A later manual size-budget re-run would read 10.7 MB — still 40% headroom. Precache/ignore:
  not precached (§6), so the install budget is untouched.
- Watch item: if waters grow to ~1000, conditions/ grows ~5×; still fine, but re-check.

## 8. Verification evidence (this clone)

`pnpm --filter @trout/web build` → green (`size-budget: OK — 9.28 MB`), `pnpm --filter @trout/web
prerender` → `wrote 314 route pages + sitemap.xml + robots.txt` (147 waters, 11 regions × 12 charts,
12 taxa, 17 patterns), run twice to prove idempotency (each page has exactly 1 title/canonical/description),
`pnpm --filter @trout/web typecheck` → exit 0. Served with `node infra/static-server.mjs apps/web/dist`:

| Route | Title in raw HTML | Canonical | JSON-LD | Content | Module script |
|---|---|---|---|---|---|
| `/conditions/south-holston-river` | "South Holston River fly fishing — flows, stocking & hatch chart" | ✅ | ✅ WebPage+BodyOfWater+BreadcrumbList | h1, region/type/flow, notes, gauge reading, "Recent stocking" list | ✅ `/assets/index-Dgev2al3.js` (200, 1.68 MB) |
| `/stocking` | "Tennessee trout stocking schedule — recent TWRA releases" | ✅ | n/a (static) | h1 + dated release rows (Caney Fork 5,200 rainbow…) | ✅ |
| `/fishing-info` | "Fishing info — licenses, gauges & official resources" | ✅ | n/a (static) | h1 + intro | ✅ |
| `/charts/tn-east-holston/9` | 200 | ✅ | ✅ ItemList | top-5 hatches | — |
| `/sitemap.xml` / `/robots.txt` | 200 `application/xml` / 200 | — | — | 314 URLs / sitemap line | — |

## 9. Integration checklist for the main session (apply to the real clone)

1. Copy `apps/web/scripts/prerender.mjs` from this proto branch (single file, no deps).
2. In `apps/web/package.json` add the two scripts (`prerender`, `build:seo`); leave `build` untouched.
3. Decide how CI invokes it: either `pnpm --filter @trout/web build && pnpm --filter @trout/web prerender`
   in the deploy pipeline, or rename `prerender` to `postbuild` (pnpm runs it automatically after `build`;
   note `build:fixtures` would NOT trigger it — verify that's desired).
4. Set `SITE_URL=https://trout.tntechclimb.com` in the deploy env if it isn't the default already.
5. Deploy: ship `dist/` as today — `infra/static-server.mjs` already resolves
   `/conditions/<id>` → `dist/conditions/<id>/index.html` (directory-index fallback, lines 100–103). If any
   other host (e.g. `npx serve`) fronts the origin, confirm it has directory-index support too.
6. Submit `https://trout.tntechclimb.com/sitemap.xml` in Search Console after first deploy; keep
   `robots.txt` Disallow list (`/logbook`, `/settings`) in sync with any future private routes.
7. Optional hardening: a unit test that asserts a prerendered water page contains the water name and a
   canonical (guards against snapshot-schema drift silently emptying pages).
