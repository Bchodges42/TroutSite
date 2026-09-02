# ROLE 3 HANDOFF — Data Pipelines, Conditions & Ingestion Backend (`feat/api`)

Date: 2026-09-02 · Worktree: `C:\Users\Benjamin\Projects\trout-api` · Branch: `feat/api`

## Definition of Done — verified

- [x] `pnpm --filter api ingest --dry-run` parses all fixtures cleanly on Windows/Git Bash
      (5 fixture sets, 627 stocking events, 4 gauge readings, exit 0, no writes)
- [x] Full live run against USGS + the live TWRA page: `pnpm --filter api ingest --job=all`
      → SQLite populated (623 TN stocking events, live gauge readings) → 5 contract-valid
      snapshots regenerated under `apps/web/public/data/`
- [x] Failure simulation (adapter pointed at HTTP 404): soft-fail, `jobs_log` error rows for
      `stocking` and `stocking:TN`, previous data retained (stale), process survives — covered
      by `test/stocking.test.ts` and `test/usgs.test.ts`
- [x] Portal (verified live, not just in tests): valid token POST → 201 → report in
      `reports/recent.json` with attribution; missing/invalid token → 401 (auth runs before
      body parsing, verified via curl without a content-type); reports-disabled shop → 403;
      oversized / HTML-injected input → 422 / sanitized
- [x] `pnpm -r lint && pnpm -r test && pnpm -r build` green (49 api tests + 82 contracts tests)
- [x] Conventional commits on `feat/api`; deviations in `docs/ASSUMPTIONS.md` ([ROLE 3] entries)

## What was built

```
apps/api/
├─ migrations/002_gauge_readings_normalized.sql   # additive: normalized gauge cols + index
├─ src/
│  ├─ jobs/run.ts              # jobs_log runner (ok/error/running + detail JSON), health summary
│  ├─ lib/{jsonFile,ids,retry,sanitize}.ts  # atomic writes, deterministic ids, fetch retry, plain-text sanitizer
│  ├─ ingest/usgs.ts           # USGS IV client (00060/00065/00010), parser, gauges job, raw audit
│  ├─ ingest/stocking/
│  │  ├─ types.ts              # StateAdapter interface (fetchLatest network+raw / normalize PURE)
│  │  ├─ tn.ts                 # TWRA adapter (see source URLs below)
│  │  ├─ index.ts              # adapter registry — add state #2 here
│  │  └─ adapter-TEMPLATE.ts   # documented recipe: state #2 in under a day
│  ├─ ingest/stockingJob.ts    # per-state soft-fail orchestration + raw snapshot persistence
│  ├─ snapshots/build.ts       # regenerates apps/web/public/data per ENDPOINTS (atomic writes)
│  ├─ portal/{tokens,routes}.ts# HMAC tokens + me/reports routes (onRequest auth, rate limit)
│  ├─ pipeline.ts              # runJob()/dryRun() shared by cron + CLI
│  ├─ scripts/ingest.ts        # `pnpm --filter api ingest --job=… [--states=…] [--dry-run]`
│  ├─ scripts/token.ts         # `pnpm --filter api token -- --shop=<id>` mints portal tokens
│  ├─ app.ts / server.ts / cron.ts
├─ fixtures/                   # "fixtures are law"
│  ├─ USGS/                    # 2 recorded IV responses (real capture + edge cases)
│  ├─ TN/                      # real 2026 TWRA page + datatable JSON, redesign case, garbage case
│  └─ content/                 # bootstrap streams/shops YAML (test/demo only — Role 4 supersedes)
└─ test/                       # 49 tests: parsers, adapters, snapshots, parity, portal, dry-run, retry
```

## External sources (as implemented)

| Source | URL | Notes |
|---|---|---|
| USGS Waterservices IV | `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=…&parameterCd=00060,00065,00010` | batched ≤50 sites/request, 1s politeness gap, User-Agent from `USGS_USER_AGENT`, handles missing params/sentinels/empty series |
| TWRA 2026 stocking schedule | `https://www.tn.gov/twra/fishing/trout-information-stockings.html` | rows in a CMS "excel-driven" JSON (`…_jcr_content/...tn_complex_datatable_<id>.exceldriven.json`); the `<id>` is re-resolved from the page `data-config` every fetch (never hardcoded); inline-table fallback; both artifacts snapshotted |

## Snapshot files produced (regenerated hourly)

| File | Contract shape | Freshness signal |
|---|---|---|
| `data/streams.json` | `Stream[]` | content-driven (changes on re-seed) |
| `data/conditions/latest.json` | `ConditionSnapshot[]` | stale when `now > nextExpectedUpdate` (now+1h healthy / `now` on gauges failure) |
| `data/stocking/{state}.json` | `StockingEvent[]` | stale when `fetchedAt` > 26h old (failed states are not rewritten) |
| `data/shops/{state}.json` | `Shop[]` | content-driven |
| `data/reports/recent.json` | `ShopReport[]` | last 30 days, newest first, cap 100 |

These are gitignored build artifacts — run `pnpm --filter api snapshots` (or a full ingest) to
produce them. Role 6's checklist item 3 runs cron to generate them.

## Job schedule (cron.ts; all runs logged to jobs_log)

- `gauges` — hourly at :05 · fetches every gaugeId seeded from content streams
- `stocking` — daily 06:00 · per-state soft-fail (`stocking:<STATE>` rows)
- `snapshots` — nightly 04:30 safety net · also regenerated after each gauges/stocking run and
  immediately after every accepted portal report

## Portal API shape (for Role 4)

- Token: `t1.<b64url(shopId)>.<b64url(HMAC-SHA256(PORTAL_SECRET, shopId))>` in
  `Authorization: Bearer`; mint with `pnpm --filter api token -- --shop=<shopId>`; server needs
  `PORTAL_SECRET` set (routes return 503 without it).
- `GET /v1/portal/me` → `{ shop: { id, name, town, websiteUrl, reportsEnabled } }`
- `POST /v1/portal/reports` body:
  `{ streamId?, date?: "YYYY-MM-DD", body: string(≤4000), hotPatterns?: [{ patternId, hookSize? }] }`
  → `201 { report: ShopReport }`. Server owns `id/shopId/shopName/attributionUrl/publishedAt`;
  body is sanitized to plain text; refs are strict slugs; 20 reports/shop/hour rate limit;
  the reports snapshot regenerates inline on success.

## Assumptions & flags for other roles

- All [ROLE 3] decisions: `docs/ASSUMPTIONS.md` — headline items: contract-shaped snapshot
  payloads with documented staleness semantics; additive `/healthz` `jobs` field; Bearer/HMAC
  portal auth; TWRA mapping rules; bootstrap content fixtures; gitignored generated snapshots;
  retry/backoff on all fetches.
- Cross-role flag: `packages/content/README.md` (Role 4) still says launch regions "TX/OK/AR";
  master plan §2/§7 says Tennessee. Master plan wins — Role 4 should author TN content.
- The seed tolerates an empty content pack, so the pipeline is a healthy no-op until Role 4 lands.

## Live verification evidence (2026-09-02)

- Conditions snapshot contained a real reading: gauge `03486000` "Watauga River at Elizabethton,
  TN" — 1920 cfs → score 10, reason "Flow 1920 cfs is above the ideal range (100–500 cfs) — water
  is high and may be unsafe."
- `stocking/TN.json`: 623 events from the live 2026 schedule (616 rows, multi-species rows expand).
- Portal round-trip: token → me → POST (HTML stripped, slug normalized) → attribution in
  `reports/recent.json` within the same request.
