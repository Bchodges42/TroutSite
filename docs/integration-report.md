# Integration report — ROLE 6 (Phase 2)

## Status snapshot (2026-09-03, integration complete pending operator launch steps)

**Merges (merge order per CHAT-6, all complete):**
1. `feat/api` → main (fast-forward) ✓
2. `feat/content` → main ✓ (ASSUMPTIONS union-merged, lockfile regenerated)
3. `feat/web` → main ✓ (ASSUMPTIONS union-merged, lockfile regenerated)
4. `feat/growth` → main ✓ (ASSUMPTIONS union-merged, lockfile regenerated)

**Seams resolved (each with an ADR in `docs/adr/`):**
1. Snapshot URL mismatch — builder emits `apps/web/public/v1/**` + `/content/*`
   exactly at the frozen ENDPOINTS surface (ADR 0005). `/v1/streams?state=` is
   answered live by the API route reading `v1/streams.json`.
2. Hatch charts + content pack — builder emits 132 `/v1/hatch/{region}/{month}.json`
   files + `/content/{taxa,patterns}.json` from Role 4's built pack, contract-validated
   (same ADR 0005). Web precaches `content/**` + `v1/hatch/**` only (conditions must
   stay runtime-cached so hourly cron updates reach clients).
3. Portal tokens — adopted Role 4's expiring `v1.<shopId>.<iat>.<exp>.<sig>` format
   in `apps/api/src/portal/tokens.ts`; token CLI mints with `--days` (ADR 0003).
   *Fixed en route:* pnpm forwards the literal `--` separator on Windows, which
   strict `parseArgs` rejected — both api CLIs now strip it (operator CLI verified
   working: `pnpm --filter api token -- --shop=X --days=30`).
4. `photoUrl` — accepted + passed through; additive `ShopReportSchema.photoUrl`
   (https-only) → **contracts-v1.0.1** tag; api migration 003 `shop_reports.photo_url`
   (ADR 0002).
5. Static serving — Fastify serves the PWA dist + live `/v1` snapshot tree (same
   origin); `infra/static-server.mjs` (zero-dep) serves the portal (:8788, proxying
   `/v1/portal/*` to the API — same-origin, no CORS) and marketing (:8789); pm2
   ecosystem + cloudflared ingress + deploy.sh + RUNBOOK updated (ADR 0004).
   *Fixed 2026-09-03 (ADR 0006):* the two `prefix: '/'` @fastify/static mounts
   collided (`/*` route clash) and `trout-api` crash-looped on its first real pm2
   boot — invisible until now because e2e boots with only one tree present. Each
   tree now mounts at its own prefix (`/v1`, `/content`, `/`), plus an SPA fallback
   (client routes → `index.html`; `/v1/*`, `/content/*` stay 404). Regression tests
   in `apps/api/test/app.test.ts`.
6. Shared files — `docs/ASSUMPTIONS.md` union-merged (all four roles' entries kept);
   lockfile regenerated with `pnpm install` after each merge; no BACKLOG conflicts.
7. Two Playwright suites — `e2e/` is canonical: Role 2's specs absorbed
   (`offline-cold-start`, `conditions-fixtures`, `manifest`; privacy-audit's unique
   checks folded into `privacy.spec`), `apps/web` harness retired, WEB_ROUTES
   updated to the shipped route table.
8. Deferred tests — all `test.fixme` wrappers enabled (0 skips): api dry-run runs the
   real CLI; admin portal specs drive the REAL API via `e2e/scripts/api-e2e-server.mjs`
   (temp seeded DB + CLI-minted token + production-style same-origin proxy);
   *amended 2026-09-03:* `lighthouserc.web.cjs` no longer asserts `categories:pwa`
   (Lighthouse 12 removed the PWA category upstream — `auditRan: 0` on any code);
   PWA substance is covered by manifest + offline Playwright specs (ASSUMPTIONS
   [ROLE 6] 2026-09-03). a11y + best-practices stay `error`.
9. pm2 reboot persistence — RUNBOOK §4 documents `pm2-windows-startup` bootstrap;
   installed + registered 2026-09-03 (`pm2 save` → dump.pm2, `pm2-startup install`
   → startup registry entry); only the actual reboot + `pm2 resurrect` check is an
   operator step (see Deployment state).
10. Marketing SITE_URL switch — `MARKETING_DATA_DIR` switch implemented: deploy.sh
    rebuilds marketing from the real `/v1` snapshot tree (verified: pages built from
    real data). Actual `SITE_URL=<production-domain>` pending domain choice.

**e2e fixes closed out 2026-09-03 (38/38 green):**
- `shop token logs in and shows the composer` — root cause was a real Role 3 ↔
  Role 4 seam: the API's `GET /v1/portal/me` omitted `stateId`, so the admin's
  `ShopSchema` validation failed. Route now returns the full contract Shop shape.
- `POST /v1/portal/reports` response envelope — the real API returns
  `201 { report: ShopReport }` but Role 4's client parsed a bare ShopReport (MSW
  masked the difference). Client now unwraps the envelope; MSW handler updated.
- `submitted report lands in reports/recent.json` feed check — the e2e API booted
  with an empty temp snapshot dir, so the static mount was skipped and the feed
  404'd after a successful publish. `api-e2e-server.mjs` now runs
  `pnpm --filter api snapshots` after `seed`, before importing the server.

**Also done:**
- Web region table aligned to Role 4's 11-region registry (was 3 fixture-era ids);
  marketing region registry + all fixtures re-pointed likewise (incl. the LHCI URL
  list, which still pointed at retired `/hatch/tn/east-tailwaters/`).
- Root `pnpm e2e` alias added (Role 5's request); [ROLE 6] ASSUMPTIONS entries written.
- Real data pipeline verified live: seed 92 streams / 23 shops; 623 real TWRA
  stocking events + USGS gauge readings; snapshots regenerated (139 files, 132 hatch
  charts, content pack, zero warnings).

## §12 checklist (10 items)

| # | Item | Status |
|---|---|---|
| 1 | Clean clone install+lint+test+build green | ✓ PASS 2026-09-03: `pnpm -r lint` ✓ · `pnpm -r test` ✓ (216 tests: 83 contracts + 56 api + 11 content + 47 web + 19 admin) · `pnpm -r build` ✓ (web dist 1.58 MB / 25 MB budget) |
| 2 | `ingest --dry-run` parses all fixtures | ✓ PASS (`5 fixture sets, 627 stocking events`, exit 0; e2e `api/fixtures.spec.ts` green) |
| 3 | Cron run → snapshots → PWA live TN data | ✓ PASS: `seed` + `snapshots` → 92 streams / 92 conditions / 623 TN stocking events / 23 shops / 132 hatch charts; all served live from :8787 (`/v1/streams?state=TN`, `conditions/latest.json`, `stocking/TN.json`, `shops/TN.json`, `hatch/…`, `content/…`) |
| 4 | Airplane-mode cold start | ✓ PASS: e2e `offline-cold-start` + `offline-hatch` + `manifest` specs green |
| 5 | Portal token → report → attributed entry | ✓ PASS e2e (3/3 portal specs) AND live: minted a 1-day token for `three-rivers-angler` against the pm2 stack, `POST /v1/portal/reports` → 201, entry with `attributionUrl` in `/v1/reports/recent.json`; test report deleted + snapshots regenerated + shop flag reverted afterwards |
| 6 | Playwright e2e green (0 skips) | ✓ PASS: **38/38**, 0 skips |
| 7 | Lighthouse PWA/a11y gates | ✓ PASS: `lhci autorun` green on both configs (web: a11y 1.0, best-practices 0.96; marketing: all 9 URLs pass SEO ≥ 0.95 / a11y ≥ 0.9 / best-practices ≥ 0.9). PWA category removed upstream — covered by Playwright (see seam 8) |
| 8 | Privacy audit | ✓ PASS: e2e privacy (zero third-party, location never leaves device) + marketing first-party specs green |
| 9 | Content validation CI gate | ✓ PASS: `pnpm validate:content` green (WARN 51 = documented ungauged streams) |
| 10 | Clean reboot → recovery per RUNBOOK | PARTIAL: stack runs green under pm2 locally (api :8787, cron, portal :8788, marketing :8789; `pm2 save` + `pm2-startup install` done 2026-09-03). Operator steps remain: actual reboot + recovery check, cloudflared/tunnel (see Deployment state) |

## Deployment state

- pm2 installed; `trout-api`, `trout-cron`, `trout-portal-static`,
  `trout-marketing-static` online and serving (verified 2026-09-03, see #3/#5/#10).
  `trout-cloudflared` not started — cloudflared binary + tunnel do not exist yet.
- Root `.env` (gitignored) holds the local `PORTAL_SECRET` for the pm2 processes.
- Still operator-side: choose production domain → `cloudflared tunnel create trout` →
  fill `infra/cloudflared/config.yml` → `SITE_URL=https://<domain>` marketing rebuild
  → re-run e2e + LHCI → real reboot test → mint/delete shop-token round-trip →
  tag `v0.1.0` + `docs/LAUNCH-NOTES.md` → remove worktrees
  (`trout-web`, `trout-api`, `trout-content`, `trout-growth`) + `git worktree prune`.
- Operator note: Git Bash curl sends a wrong Content-Length for multibyte
  (non-ASCII) POST bodies (observed: em-dash body → `FST_ERR_CTP_INVALID_CONTENT_LENGTH`);
  ASCII bodies work. Browser/fetch clients are unaffected — curl-only quirk.

## Evidence pointers

- Full e2e: `pnpm --filter @trout/e2e e2e` → 38 passed.
- Workspace gate: `pnpm -r lint && pnpm -r test && pnpm -r build`.
- LHCI: `pnpm --filter @trout/e2e exec lhci autorun --config=lighthouserc.web.cjs`
  and `--config=lighthouserc.marketing.cjs`.
- pm2: `pm2 ls` (4 online), `curl -fsS http://127.0.0.1:8787/healthz`.
