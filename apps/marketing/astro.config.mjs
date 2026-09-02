import { defineConfig } from 'astro/config';

// Canonical origin for SEO (canonical URLs, sitemap.xml, og:url).
// Set SITE_URL to the production domain before launch (see docs/integration-checklist.md).
// The default is a placeholder so builds are deterministic everywhere.
const site = process.env.SITE_URL ?? 'https://trout.example';

// https://astro.build/config
export default defineConfig({
  site,
  // Zero-JS static output: every page ships plain HTML. No integrations, no trackers.
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
});
