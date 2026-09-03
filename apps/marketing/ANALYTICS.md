# ANALYTICS — self-hosted option (documented, NOT installed) (ROLE 5)

**v1 status: no analytics of any kind.** No third-party scripts, no cookies, no
beacons on the PWA, this marketing site, or the shop portal. This file documents
the *only* analytics approach this project would ever take, so nobody reaches
for Google Analytics out of habit (privacy non-negotiable #3).

## The decision

If traffic measurement becomes genuinely necessary, the plan is:

- **Umami**, self-hosted on the same laptop/server family as the rest of the
  stack (§15: no external paid services, no third-party processors).
  - Cookie-free, aggregate-only, no cross-site tracking, GDPR-friendly by design.
  - Served from our own domain (e.g. `analytics.<our-domain>` behind the
    existing Cloudflare tunnel) — first-party origin only.
- **What it records:** page path, referrer domain, country (IP-derived server
  side, then discarded), device class. No IPs stored, no fingerprints, no
  personal identifiers.
- **Where:** marketing content pages only. The **PWA never gets analytics** —
  it is offline-first and its privacy audit (zero third-party requests) is a
  shipped test that must keep passing.

## Cost / effort sketch

1. `umami` container or Node process beside the api (pm2 ecosystem entry).
2. One `<script defer data-website-id=… src="https://analytics.<domain>/umami.js">`
   snippet in `Base.astro`, gated by an env flag (`PUBLIC_ANALYTICS_ID`) so it
   stays absent until explicitly enabled.
3. Update the privacy page (currently promises zero analytics in v1) in the same
   commit that enables it.

## Why not the alternatives

- Google Analytics / Meta Pixel / Hotjar: third-party processors, tracking
  headers, behavioral tooling — flatly against the positioning.
- Plausible/Cloudflare Web Analytics (hosted): less bad, but still external
  requests from our properties; Umami on our infra keeps requests first-party.
