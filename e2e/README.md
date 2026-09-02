# @trout/e2e

Playwright QA harness — **OWNER: ROLE 5** (00-SHARED-CONTEXT §4.5). Covers the
whole product, not just the web PWA: offline behavior, the privacy audit,
fixture validity, the shop portal, and the marketing/SEO site.

## Run (Windows / Git Bash)

```bash
pnpm -r build                    # builds contracts/ui dists + all app dists
pnpm --filter @trout/e2e exec playwright install chromium   # once
pnpm --filter @trout/e2e e2e     # the suite (root `pnpm e2e` alias: requested — see ASSUMPTIONS)
pnpm --filter @trout/e2e e2e:report
```

The Playwright config starts all three preview servers itself (marketing :4321,
web :4173, admin :4174) from the built dists, so the suite never needs the live
API — CI-safe by construction.

## Coverage map (§12 items each suite gates)

| Suite | What it enforces |
|---|---|
| `marketing/seo.spec.ts` | sitemap/robots, unique title/desc, self-canonical per page, JSON-LD (Dataset/FAQPage/Breadcrumb), real-data content assertions, zero third-party refs, no dead internal links |
| `web/privacy.spec.ts` | §12 #8 — zero third-party requests + zero geolocation use on every route, request-body location scan |
| `web/offline-hatch.spec.ts` | §12 #4/#6 — SW/manifest register, offline reload renders; canonical offline hatch flow `fixme` until Role 2's UI lands |
| `api/fixtures.spec.ts` | contract-valid fixtures (Zod, outside the Astro build); `ingest --dry-run` test `fixme` until Role 3's CLI |
| `admin/portal.spec.ts` | portal first-party-only; token login + composer `fixme` until Role 4's UI |

## Why `test.fixme` exists

The canonical deep flows (offline ID key, portal composer, ingestion dry-run)
target UI/CLIs owned by Roles 2/3/4 that don't exist yet. The skipped tests are
written against the frozen expected semantics so integration enables them by
deleting the `fixme` wrapper — see `docs/integration-checklist.md`.
