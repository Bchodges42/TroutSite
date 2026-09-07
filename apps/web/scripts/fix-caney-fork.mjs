// Rebuild the caney-fork-river atlas feature from USGS NHDPlus HR flowlines.
//
// SUPERSEDED (2026-09-07, review G2): the single full-course caney-fork-river
// identity this script (re)builds was split into two reach-scoped identities —
// caney-fork-river (the assessed Center Hill tailwater, Center Hill Dam to the
// Carthage mouth) and caney-fork-upper (headwaters and the Great Falls /
// Center Hill pool route). Do NOT re-run this script against the split
// staging: use west-middle-build.mjs (two reach-gated RIVER_SPECS entries)
// followed by split-caney-fork.mjs (the deterministic dam cut). The
// full-course geometry this script established is preserved, not reverted.
//
// Why: the original TIGER name-match kept only a headwaters fragment (TIGER
// LINEARWATER names the upper river "Caney Fork Riv/Frk" in Cumberland/White
// counties, and the lake and lower reaches carry no TIGER name at all). The
// cached NHD extract (.atlas-src/nhd/caney-fork.geojson, refetched with the
// widened envelope + fcode set in fetch-nhd-targets.mjs) covers the full
// 143-mile course.
//
// Ground-truth anchors verified during the refetch (Wikipedia "Caney Fork"):
//   source: ~-85.158, 36.043 (Cumberland County, near Campbell Junction)
//   mouth:  ~-85.941, 36.239 (Cumberland River / Old Hickory Lake at Carthage)
// Run: node scripts/fix-caney-fork.mjs
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const atlasPath = join(webDir, 'public', 'atlas', 'rivers.geojson');
const nhdPath = join(webDir, '.atlas-src', 'nhd', 'caney-fork.geojson');

// Label anchor target: the Center Hill tailwater reach (DeKalb/Smith area).
const ANCHOR_TARGET = [-85.75, 35.98];

const nhd = JSON.parse(readFileSync(nhdPath, 'utf8'));
const parts = [];
for (const f of nhd.features) {
  if ((f.properties?.gnis_name ?? '') !== 'Caney Fork') continue; // drop "Caney Fork Creek"
  const g = f.geometry;
  const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
  for (const line of lines) if (line.length >= 2) parts.push(line);
}
console.log(`nhd caney fork parts: ${parts.length}`);
if (parts.length < 20) {
  console.error('FAIL: too few NHD segments — refetch with fetch-nhd-targets.mjs caney-fork');
  process.exit(1);
}

const b = [Infinity, Infinity, -Infinity, -Infinity];
let verts = 0;
for (const line of parts) {
  for (const [x, y] of line) {
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
  }
  verts += line.length;
}
console.log(`bounds: ${b.map((v) => v.toFixed(3)).join(', ')} | parts ${parts.length} | verts ${verts}`);

// Verify the rebuilt geometry reaches the researched source and mouth.
const near = (pt, lon, lat, tol) => Math.abs(pt[0] - lon) < tol && Math.abs(pt[1] - lat) < tol;
const touchesSource = parts.some((l) => l.some((pt) => near(pt, -85.158, 36.043, 0.12)));
const touchesMouth = parts.some((l) => l.some((pt) => near(pt, -85.941, 36.239, 0.12)));
console.log(`touches source area: ${touchesSource} | touches mouth area: ${touchesMouth}`);
if (!touchesSource || !touchesMouth) {
  console.error('FAIL: rebuilt geometry does not reach the verified source/mouth anchors — refusing to write.');
  process.exit(1);
}

// Label anchor: vertex nearest the tailwater reach.
let anchor = null, best = Infinity;
for (const line of parts) for (const pt of line) {
  const d = (pt[0] - ANCHOR_TARGET[0]) ** 2 + (pt[1] - ANCHOR_TARGET[1]) ** 2;
  if (d < best) { best = d; anchor = pt; }
}

const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const old = atlas.features.find((f) => f.properties.id === 'caney-fork-river');
if (!old) { console.error('FAIL: caney-fork-river feature not found'); process.exit(1); }
old.properties = {
  ...old.properties,
  bounds: b.map((v) => Math.round(v * 1e4) / 1e4),
  labelAnchor: [Math.round(anchor[0] * 1e4) / 1e4, Math.round(anchor[1] * 1e4) / 1e4],
  source: ['nhd-hr', 'caney-fork-corridor-fix'],
  partCount: parts.length,
  vertexCount: verts,
};
old.geometry = { type: 'MultiLineString', coordinates: parts };

renameSync(atlasPath, `${atlasPath}.bak`);
writeFileSync(atlasPath, `${JSON.stringify(atlas, null, 1)}\n`);
console.log(`caney-fork-river rebuilt: ${parts.length} parts, ${verts} verts, anchor ${anchor.map((v) => v.toFixed(3)).join(',')}`);
