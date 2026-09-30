/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Join the 730 mapped TWRA stocking-location points (live GIS capture) onto
 * catalog waters. A point is a MAPPED LOCATION — not a release event and not
 * a complete stocked reach — so this only seeds candidates for review.
 *
 *   node packages/content/scripts/opportunity/join-stock-points.mjs <locations.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, loadCatalog, resolveEvent } from './lib.mjs';

const locationsPath = process.argv[2] ?? join(REPO_ROOT, 'evidence-work', 'captures', 'twra-stock-locations.json');
const loc = JSON.parse(readFileSync(locationsPath, 'utf8'));
const catalog = loadCatalog();
const out = {};
const unmatched = [];
for (const f of loc.features ?? []) {
  const a = f.attributes ?? {};
  const coord = a.LATITUDE != null && a.LONGITUDE != null ? [a.LONGITUDE, a.LATITUDE] : null;
  const res = resolveEvent(
    {
      water: a.StreamName || a.Site_Name,
      site: a.Site_Name,
      county: a.County,
      program: a.StockingProgram,
      waterClass: a.WaterClass,
      sampleCoord: coord,
    },
    catalog,
  );
  if (!res.slug) {
    unmatched.push({ name: a.StreamName, site: a.Site_Name, county: a.County, program: a.StockingProgram, how: res.how, reason: res.reason ?? null });
    continue;
  }
  const cur = out[res.slug] ?? { count: 0, sites: [] };
  cur.count += 1;
  if (cur.sites.length < 12) {
    cur.sites.push({ site: a.Site_Name, program: a.StockingProgram, species: a.Species, county: a.County, waterClass: a.WaterClass, how: res.how });
  }
  out[res.slug] = cur;
}
writeFileSync(join(REPO_ROOT, 'evidence-work', 'point-join.json'), JSON.stringify(out, null, 2));
console.log('point join: waters matched =', Object.keys(out).length, '| unmatched points =', unmatched.length);
writeFileSync(join(REPO_ROOT, 'evidence-work', 'point-join-unmatched.json'), JSON.stringify(unmatched, null, 2));
