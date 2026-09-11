# Integration checklist — executable §12 (ROLE 5)

The Phase-2 gate (00-SHARED-CONTEXT §12) as exact commands, in run order.
Windows/Git Bash assumed throughout (§15). Every command has been run on this
branch at least once; items marked **[integration]** depend on Roles 2/3/4
output and are pre-wired in the e2e suites (see e2e/README.md coverage map).

Run from the repo root unless a working directory is given.

---

### 1. Clean clone: install + lint + test + build green

```bash
git clone <repo> trout-verify && cd trout-verify
pnpm install
pnpm -r lint && pnpm -r test && pnpm -r build
```

PASS = all three exit 0. (`packages/contracts` test runs with a ≥90% coverage gate.)

### 2. Ingestion dry-run parses all fixture HTML **[integration — Role 3]**

```bash
pnpm --filter api ingest --dry-run
```

PASS = exit 0 and it prints contract-valid snapshot JSON per source.
Pre-wired: `e2e/api/fixtures.spec.ts` runs exactly this command (currently
`test.fixme` — enabled when the `ingest` script exists).

### 3. Cron run → snapshots regenerate → PWA shows live TN conditions + stocking

```bash
pnpm --filter api seed                       # content into SQLite
pnpm --filter api snapshots                  # ROLE 3's snapshot script (see ASSUMPTIONS: deploy.sh guard)
pnpm --filter @trout/web build && pnpm --filter @trout/web preview
# in a browser: conditions + stocking render; check apps/web/public/data/*.json regenerated
```

### 4. Airplane-mode cold start: hatch key, ID flow, charts, last-known conditions

Automated by `e2e/web/offline-hatch.spec.ts`:

```bash
pnpm -r build
pnpm --filter @trout/e2e e2e --project=web
```

The shell-level tests (manifest + SW register, offline reload renders) PASS
today. The canonical deep flow steps are `test.fixme` — enable at integration
by deleting the `fixme` wrapper once Role 2's UI lands. LastUpdatedChips are
asserted via `getByTestId('last-updated-chip')`.

### 5. Shop portal: token → report → attributed entry in reports/recent.json

Automated by `e2e/admin/portal.spec.ts` (MSW-mode steps are `test.fixme` until
Role 4's UI):

```bash
pnpm --filter @trout/e2e e2e --project=admin-portal
# end-to-end with the live API:
pnpm --filter api dev &      # :8787
pnpm --filter @trout/admin preview   # token login → publish → verify reports/recent.json
```

### 6. Playwright e2e: offline hatch flow + online conditions flow green

```bash
pnpm -r build
pnpm --filter @trout/e2e e2e
```

PASS = 0 failures (skips allowed only while their owning role's deliverable is
absent; at integration ALL fixmes are enabled → 0 skips).

### 7. Lighthouse: PWA installable, offline pass, a11y ≥ 90

```bash
pnpm --filter @trout/e2e exec lhci autorun --config=lighthouserc.marketing.cjs
pnpm --filter @trout/e2e exec lhci autorun --config=lighthouserc.web.cjs
```

Marketing asserts SEO ≥ 0.95 / a11y ≥ 0.9 / best-practices ≥ 0.9 as errors
today. The web config gates a11y as error and PWA as **warn** pre-integration —
at integration, flip `'categories:pwa'` to `error` in
`e2e/lighthouserc.web.cjs` (installable + offline + a11y ≥ 90 all mandatory).

### 8. Privacy audit: no third-party requests; location never in any request

```bash
pnpm --filter @trout/e2e e2e --project=web   # privacy.spec.ts
pnpm --filter @trout/e2e e2e --project=marketing   # zero remote script/style refs on every page
```

Request interception records every request per route and fails on any
cross-origin call or geolocation usage. Add new app routes to
`WEB_ROUTES` in `e2e/helpers/first-party.ts` as Role 2 ships them.

### 9. Content validation CI gate (no orphans; sources attributed)

```bash
pnpm validate:content        # Role 4's gate
pnpm --filter @trout/e2e e2e --project=marketing   # fixtures re-validated against contracts
```

Marketing additionally self-gates: the Astro build fails on any fixture that
violates the frozen Zod schemas or has orphan references
(`apps/marketing/src/data/load.ts`).

### 10. Clean laptop reboot → full recovery per RUNBOOK

Follow `infra/RUNBOOK.md` (Role 1). Verification additions from this role:

- After reboot + `bash infra/deploy.sh`: `curl http://127.0.0.1:8787/healthz`
  → `{"ok":true}`, then confirm the marketing site rebuilds with fresh
  snapshot JSON (step 3) and `pnpm --filter @trout/e2e e2e` is green.

---

## Pre-launch SEO switch (this role's launch tasks)

```bash
SITE_URL=https://<production-domain> pnpm --filter @trout/marketing build
```

- Set the real domain (canonicals, sitemap.xml, robots.txt all derive from it).
- Confirm `Sitemap:` line in robots.txt matches the production domain.
- Re-run item 6 + 7 after the switch.
