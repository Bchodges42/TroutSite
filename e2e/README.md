# @trout/e2e

Playwright QA harness — **OWNER: ROLE 5** (00-SHARED-CONTEXT §4.5), consolidated
at integration (ROLE 6): Role 2's apps/web specs + harness were absorbed here and
the extra `apps/web/playwright.config.ts` retired — this suite is canonical.
Covers the whole product, not just the web PWA: offline behavior, the privacy
audit, fixture validity, ingestion, the shop portal (against the REAL API), and
the marketing/SEO site.

## Run (Windows / Git Bash)

```bash
pnpm -r build                    # builds contracts/ui dists + all app dists
pnpm --filter @trout/e2e exec playwright install chromium   # once
pnpm --filter @trout/e2e e2e     # the suite (root `pnpm e2e` alias added at integration)
pnpm --filter @trout/e2e e2e:report
```

The Playwright config starts every server itself (marketing :4321, web :4173,
admin :4174, plus an e2e-only API on :8791) from the built dists. `globalSetup`
rebuilds web as the deterministic fixture flavor and rebuilds admin for same-origin
requests. `scripts/api-e2e-server.mjs` seeds a run-unique temp DB from
`apps/api/fixtures/content` and mints a real portal token with the API token CLI.
It also sets a distinct synthetic owner token and prepares private candidate/status
fixtures. The portal serves through the production static-server proxy, exercising
the exact token → publish → attributed `reports/recent.json` flow and the separate
owner read-only path. Tests use temporary data and credentials.

## Coverage map (§12 items each suite gates)

| Suite | What it enforces |
|---|---|
| `marketing/seo.spec.ts` | sitemap/robots, unique title/desc, self-canonical per page, JSON-LD (Dataset/FAQPage/Breadcrumb), real-data content assertions, zero third-party refs, no dead internal links |
| `web/privacy.spec.ts` | §12 #8 — zero third-party requests + zero geolocation use on every shipped route, request-body location scan, near-me coordinate-leak check (ported from Role 2) |
| `web/offline-hatch.spec.ts` | §12 #4/#6 groundwork — SW/manifest register, offline reload renders |
| `web/offline-cold-start.spec.ts` | §12 #4/#6 deep flow (from Role 2) — online warm-up → airplane mode → full hatch wizard → charts → never-visited stream with "Offline · last known" → reload resilience |
| `web/conditions-fixtures.spec.ts` | §12 #6 online conditions flow (from Role 2) — score pills/bands, reasons, verify-official links, near-me sort, stocking filters |
| `web/manifest.spec.ts` | §12 #7 groundwork — manifest sanity + SW control (from Role 2) |
| `api/fixtures.spec.ts` | contract-valid fixtures (Zod, outside the Astro build); §12 #2 `ingest --dry-run` (enabled at integration) |
| `admin/portal.spec.ts` | §12 #5 — real-API token login (bad token 401 + nothing stored), composer publish, attributed entry in `reports/recent.json` |
| `admin/owner.spec.ts` | Real portal proxy + API authentication, no-store, unchanged public baseline after candidate preparation, mobile claim preview, keyboard table scrolling and memory-only owner sign-in |
| `web/remaining-improvements.spec.ts` | Mobile recent-water recall/clear, source-review labels, saved trip access after offline reload, size estimates, live offline controls and zero page overflow at 320/390px |

## Zero skips

The `test.fixme` wrappers written in Phase 1 were enabled at integration
(§12 #6: 0 skips): the offline deep flow now lives in
`web/offline-cold-start.spec.ts` (Role 2's verified selectors), the online
conditions flow in `web/conditions-fixtures.spec.ts`, the ingestion dry-run runs
the real CLI, and the portal specs drive the real API.
