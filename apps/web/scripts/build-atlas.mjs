#!/usr/bin/env node
/**
 * RETIRED — do not run. This script generated the old SYNTHETIC atlas
 * (seeded jitter around region centroids) and is kept only as a tombstone.
 * It is NOT part of the canonical pipeline and MUST NOT overwrite
 * public/atlas/*.geojson.
 *
 * Canonical atlas pipeline (real Census + USGS sources, all public domain) —
 * see docs/atlas-sources.md:
 *   1. node apps/web/scripts/fetch-atlas-sources.mjs        # Census downloads (TIGER lw/aw + GENZ cb_ context)
 *   2. node apps/web/scripts/build-atlas-context-sources.mjs # context intermediates (boundary/counties/states/places)
 *   3. node apps/web/scripts/fetch-nhd-targets.mjs          # USGS NHDPlus HR fetches
 *   4. node apps/web/scripts/match-rivers-tiger.mjs         # TIGER LINEARWATER stream matching
 *   5. node apps/web/scripts/merge-rivers.mjs               # assemble public/atlas/rivers.geojson
 *   6. node apps/web/scripts/build-atlas-context.mjs        # slim + publish context files
 *   7. node apps/web/scripts/validate-atlas.mjs             # structural gate (must PASS)
 */
console.error('build-atlas.mjs is RETIRED (synthetic generator). See docs/atlas-sources.md for the canonical real-data pipeline.');
process.exit(1);
