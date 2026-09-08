# OPERATIONS — Analytics, kill-switch, ads readiness (Session 3, 2026-09-08)

Owner-facing runbook for the trout.tntechclimb.com subdomain. Code wiring shipped in
this repo; every dashboard step below is a human action (nothing is applied for you).

## 1. Cloudflare Web Analytics — second token for the subdomain

Why a second token: zone-level analytics aggregate the whole domain
(tntechclimb.com); Cloudflare RUM tokens are per-site. The main site's token
must not silently absorb (or be polluted by) the trout subdomain.

### Create + enable (dashboard steps)

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics** → *Add a site*.
2. Enter `trout.tntechclimb.com` as the site. Cloudflare prints a JS snippet
   with a fresh token — copy **only the token** (the `data-cf-beacon` value).
3. Put it in the deploy environment: in `infra/deploy.sh`'s shell (pm2/`bash`
   profile or a gitignored `.env` sourced there), export
   `VITE_CF_ANALYTICS_TOKEN=<token>` before `pnpm -r build` runs. The build
   (`apps/web/vite.shared.ts` → `analyticsBeaconPlugin`) injects the beacon
   into `index.html` **only when the variable is set** — dev, fixture, CI, and
   privacy-audit builds never contain it.
4. Redeploy (or `pnpm --filter @trout/web build` on the host with the env set).
5. Verify:
   - `curl -s https://trout.tntechclimb.com/ | grep cloudflareinsights` → the
     beacon script tag is present.
   - The Web Analytics dashboard starts showing page views within the hour.
   - A fixture/CI build still shows **no** beacon (`grep cloudflareinsights`
     on a fixture dist comes back empty) — the privacy e2e suite keeps passing.
6. `https://trout.tntechclimb.com/about` (About & privacy) now discloses the
   aggregate, cookie-free measurement — the disclosure shipped with the wiring,
   so enabling the token does not outrun the privacy page.

### What it measures (and never measures)

Page paths, referrers, country, device class — aggregate only. No cookies, no
localStorage, no fingerprinting, no personal identifiers, no cross-site
tracking. The PWA's offline install performs no third-party requests; the
beacon is a first-paint script on live visits only.

## 2. Emergency kill-switch (documented, NOT applied)

If the subdomain ever misbehaves (bad deploy, abuse, data incident), tarpit it
at the edge without touching the main site:

1. Cloudflare dashboard → select the `tntechclimb.com` zone → **Security →
   WAF → Custom rules**.
2. *Create rule*:
   - Field: `Hostname` · Operator: `equals` · Value: `trout.tntechclimb.com`
   - Then take the action: **Managed Challenge** (first choice — real users
     with a browser pass; bots stop) or **Block** (total stop).
3. Save and deploy — edge-propagates in seconds. The main site
   (`tntechclimb.com` and every other hostname) is untouched because the rule
   matches only that hostname.
4. Revert by toggling the same rule off once the origin is healthy.

Escalation ladder: Managed Challenge → Block → (nuclear, zone-wide and NOT
recommended) pausing Cloudflare proxying. Never add a blanket `Block` for the
whole zone — that takes down the main site.

## 3. Ads readiness (do this BEFORE any ad script ships)

The current privacy promise is "no ads"; the marketing app's growth scaffold
(`apps/marketing/GROWTH.md`) keeps every monetization surface inert. Before any
ad code loads, in this order:

1. **Consent banner**: a cookie/consent notice is required in most ad stacks —
   even though Cloudflare analytics itself is cookie-free, ad networks are not.
   Build it as a first-class UI element, not an overlay hack.
2. **Privacy page update** (`apps/web/src/pages/AboutPrivacyPage.tsx`, marketing
   `/privacy`): name the ad partner(s), what they set, and how to opt out — in
   the same commit that first ships an ad script (same discipline as §1).
3. **Ad slots stay out of data surfaces**: stocking/conditions/hatch tables stay
   commercial-free; slots go on marketing content pages only (existing rule).
4. **Kill-switch first**: §2 above must be live-tested once (on a staging
   hostname) before the first ad impression is ever served.
5. **License hygiene**: imagery in the app is CC0/PD/CC BY/CC BY-SA (see
   `docs/imagery-provenance.csv`) — ad-safe by construction. Do not add
   NonCommercial-licensed images (BugGuide is BY-NC-ND: out) while ads run.
