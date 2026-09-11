# @trout/marketing

Astro programmatic-SEO site — **OWNER: ROLE 5**.

Zero JS, zero trackers: every page ships plain HTML (canonical, meta/OG,
JSON-LD, sitemap.xml, robots.txt). Data comes from contract-validated fixtures
at build time — the build FAILS on schema violations or orphan references.

## Build

```bash
pnpm --filter @trout/contracts build   # required first: loader imports the built dist
pnpm --filter @trout/marketing build
SITE_URL=https://<production-domain> pnpm --filter @trout/marketing build  # pre-launch
```

`astro dev` / `astro preview` work as usual (contracts must still be built once).

## Layout

```
src/data/fixtures/    TN sample data (streams, stocking, readings, hatch, taxa, patterns, shops, reports)
src/data/load.ts      Zod validation vs frozen contracts + cross-ref lint + scoreConditions()
src/data/states.ts    launch-state + region registry (templates are data-driven off this)
src/pages/stocking/[state]/      TN stocking calendar + FAQ + Dataset JSON-LD
src/pages/streams/[state]/…      stream pages: conditions, ideal flow, stocking, hatch, reports
src/pages/hatch/[state]/[region] 12-month hatch chart per region
src/pages/when-does-[state]-…    keyword pages (real schedule data, FAQPage JSON-LD)
src/components/       AdSlot (inert), AffiliateLink (inert), NewsletterForm (stub), etc.
partners.yaml         affiliate registry — all entries enabled:false in v1
GROWTH.md             go-live plan for affiliates/ads/newsletter (Resend)
ANALYTICS.md          self-hosted Umami option (NOT installed)
```

## Launch page count

v1 (TN): 19 built pages (6 streams, 3 hatch regions, stocking, when-does,
streams hub, 6 static). With Role 4's full catalog (§7: ~50–100 streams), the
same templates generate ~120–200 pages — data entry, not code.

## At integration (§12 #3)

Swap `src/data/fixtures/*` imports for the regenerated snapshot JSON
(`apps/api` snapshots). Getter signatures in `src/data/load.ts` stay identical;
validation and scoring keep guarding the build.
