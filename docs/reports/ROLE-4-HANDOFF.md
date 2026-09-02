# ROLE 4 HANDOFF — Content corpus + Shop portal (branch `feat/content`)

Date: 2026-09-02 · Worktree: `C:\Users\Benjamin\Projects\trout-content` · Merged into main by Integration (Role 6).

## Content counts (pnpm --filter @trout/content report)

| Entity | Count | DoD target |
|---|---|---|
| Taxa (bugs) | **103** (103 SVG line-art illustrations) | ≥ 100 ✓ |
| Fly patterns | **155** (43 attributed, 112 public-domain) | ≥ 150 ✓ |
| Hatch charts | **11 regions × 12 months** (5,931 entries) | 12 months per launch region ✓ |
| Streams | **92** (41 USGS-gauged, 51 documented ungauged → validator WARN) | ≥ 60 ✓ |
| Shops | **23** (all `reportsEnabled: false` until onboarded) | ≥ 15 ✓ |
| Content pack | **1.3 MB** in `packages/content/dist/pack` (138 files) | ≤ 20 MB ✓ |

Regions covered (Tennessee): `tn-east-holston`, `tn-northeast-watauga`, `tn-east-clinch`,
`tn-east-smokies`, `tn-east-pigeon-frenchbroad`, `tn-se-hiwassee`, `tn-cumberland-plateau`,
`tn-upper-cumberland`, `tn-middle-caney-fork`, `tn-middle-duck-elk`, `tn-middle-nashville`.
Registry of record: `packages/content/scripts/regions.ts`.

Pattern mix by type: dry 53, nymph 47, streamer 18, terrestrial 13, wet 9, spinner 8, emerger 7
(= 155; fixed the report's total line, which printed the type count instead of the sum). Taxa by order led by
Ephemeroptera 26, Trichoptera 18, Plecoptera 13, with midges, terrestrials, scuds/sowbugs,
crayfish, and baitfish represented.

Note on stream counts: an earlier status note said "51 gauged / 41 ungauged"; the verified
numbers are **41 gauged / 51 ungauged** (validator WARN count = 51, distinct verified gauge
IDs referenced = 41). The USGS verification fixture `data/verified-gauges.json` holds 51
live-verified gauge IDs (2026-09-02; TVA dam gauges IV-confirmed individually).

## Shop portal (apps/admin)

- **Auth:** offline-minted HMAC token `v1.<shopId>.<iatMs>.<expMs>.<sig>`; pasted token is
  verified against `GET /v1/portal/me` (additive endpoint, see ASSUMPTIONS) before it is stored
  in localStorage (`trout.admin.token`); cleared/never-stored on failure. No cookies, no
  analytics, no third-party requests.
- **Token CLI:** `PORTAL_SECRET=<secret> pnpm --filter @trout/admin mint-token --shopId <id> [--days N]`
  (1–366 days, default 30; stdout = token, stderr = metadata). Full lifecycle — wire format,
  server-side verify order (structural → expiry → constant-time HMAC → shop lookup), TTL
  guidance, delivery channel, revocation via `PORTAL_SECRET` rotation — in `apps/admin/TOKENS.md`.
- **Composer:** stream picker (grouped by region, fed by `@trout/content/pack`), 10–2000 char
  body validation, hot-pattern rows with hook sizes, optional https-only photo URL (additive
  field, see ASSUMPTIONS). Drafts live only in the browser (`trout.admin.drafts.v1`).
- **History:** drafts editable until published; published reports read-only with attribution.
- **Dev mock:** MSW fixtures parsed with frozen `@trout/contracts` schemas at load; browser
  worker default-on in dev (`VITE_ENABLE_MSW=false` to disable); unhandled requests fail tests.
- **Build order:** `pnpm --filter @trout/content build` before `apps/admin` build (pack export
  `@trout/content/pack/*`).

## Verification

- `pnpm --filter @trout/content validate` green — zero orphans, sources attributed, gauge lint.
- `pnpm -r lint && pnpm -r test && pnpm -r build` green on Windows/Git Bash
  (contracts 82 tests, api 11, content 11, admin 19 — incl. auth flow, composer validation,
  publish → feed, and the "invalid token is never stored" guarantee).
- Portal flows E2E-ready against MSW fixtures validating against contracts (real API = Role 3).

## For Role 3 (API)

- Implement `GET /v1/portal/me` + `POST /v1/portal/reports` per `apps/admin/TOKENS.md`
  (verification order + timing-safe compare) and `@trout/contracts` `ShopReportInputSchema`.
- Decide on additive `photoUrl` (accept + pass through recommended; see ASSUMPTIONS).
- Consumes content pack via the same snapshot shapes (`/v1/hatch/{regionId}/{month}.json`).

## Assumptions recorded

Six `[ROLE 4]` entries in `docs/ASSUMPTIONS.md`: TN launch state (supersedes Phase-0
TX/OK/AR note), additive `/v1/portal/me`, additive `photoUrl`, one-hatch-YAML-per-region,
`./pack/*` subpath export, MSW default-on in dev.

## Research grounding

Live-verified 2026-09-02 (snapshots in Git Bash `/tmp/trout-research`): 51 USGS TN gauge IDs
(site + IV services), TWRA Trout Stocking Locations ArcGIS layer (730 records → stocking flags
+ species mixes; Tellico DH season Oct 1–Feb 28 noted), 23 real fly shops (thewickedfly.com
directory). Every content file carries `sources:`; original prose only.
