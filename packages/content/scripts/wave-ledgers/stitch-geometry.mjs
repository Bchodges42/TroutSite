#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Geometry repair: stitch the 40 selectable-river additions from the NHD
 * network clusters.
 *
 * The expansion build copied every matching NHD segment as a SEPARATE catalog
 * part (rutherford-fork-obion: 164 parts = 164 network features), so the
 * catalog lines render as fragmented jaggies that visibly deviate from the
 * network's clean NHD geometry underneath. This script re-derives each
 * addition's geometry from the network clusters (same source the map renders
 * as the zoom-gated creek layer), joining segments at shared endpoints into
 * continuous polylines, then rewrites rivers.geojson features:
 *   geometry = stitched MultiLineString, partCount/vertexCount/lengthKm and
 *   bounds recomputed, source note appended to the properties audit trail.
 *
 *   node packages/content/scripts/wave-ledgers/stitch-geometry.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const atlasDir = join(root, 'apps', 'web', 'public', 'atlas');
const additionsPath = join(root, 'apps', 'web', 'atlas-sources', 'selectable-river-additions.json');

const gj = JSON.parse(readFileSync(join(atlasDir, 'rivers.geojson'), 'utf8'));
const additions = JSON.parse(readFileSync(additionsPath, 'utf8')).candidates;
const manifest = JSON.parse(readFileSync(join(atlasDir, 'network', 'manifest.json'), 'utf8'));

// load every cluster once, keyed for name lookup
const clusterFeatures = [];
for (const c of manifest.clusters) {
  const fc = JSON.parse(readFileSync(join(atlasDir, 'network', c.file.split('/').pop()), 'utf8'));
  for (const f of fc.features) clusterFeatures.push({ cluster: c.id, f });
}
console.log(`[stitch] ${clusterFeatures.length} network features across ${manifest.clusters.length} clusters`);

function flatCoords(geom) {
  const c = geom.coordinates;
  return geom.type === 'MultiLineString' ? c : [c];
}
function asMulti(geom) {
  return geom.type === 'MultiLineString' ? geom.coordinates : [geom.coordinates];
}
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la = (a[1] * Math.PI) / 180;
  const lb = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// stitch a bag of segments into continuous polylines by shared endpoints
function stitch(segments) {
  const segs = segments.map((s) => [...s]);
  const EPS = 1e-6; // ~0.1 m — NHD shared endpoints are exact
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const lines = [];
  while (segs.length) {
    let line = segs.pop();
    let grew = true;
    while (grew) {
      grew = false;
      const startK = key(line[0]);
      const endK = key(line[line.length - 1]);
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const sk = key(s[0]);
        const ek = key(s[s.length - 1]);
        if (ek === startK) {
          line = [...s, ...line];
          segs.splice(i, 1);
          grew = true;
          break;
        }
        if (sk === endK) {
          line = [...line, ...s];
          segs.splice(i, 1);
          grew = true;
          break;
        }
        if (sk === startK) {
          line = [...[...s].reverse(), ...line];
          segs.splice(i, 1);
          grew = true;
          break;
        }
        if (ek === endK) {
          line = [...line, ...[...s].reverse()];
          segs.splice(i, 1);
          grew = true;
          break;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Bridge disconnected chains: greedy nearest-endpoint connection. West TN
 * lowland rivers lose whole reaches between network chains (the reach is
 * carried under a different local name or as an unnamed ditch), which rendered
 * as a visible break (middle-fork-forked-deer: 12.4 km). A direct connector
 * is the honest render — the underlying NHD genuinely has no named flowline
 * there — and bridges are flagged in properties.
 */
function bridgeChains(lines, maxBridgeKm = 30) {
  const chains = lines.map((l) => [...l]);
  let bridges = 0;
  if (chains.length <= 1) return { lines: chains, bridges };
  chains.sort((a, b) => b.length - a.length);
  let cur = chains.shift();
  const leftovers = [];
  const rest = chains;
  while (rest.length) {
    // find the remaining chain whose endpoint is nearest to EITHER open end
    // of the growing line
    let bi = -1;
    let bestKm = Infinity;
    let toHead = false;
    let reverseCand = false;
    const ends = [
      { pt: cur[0], head: true },
      { pt: cur[cur.length - 1], head: false },
    ];
    for (let i = 0; i < rest.length; i++) {
      const cand = rest[i];
      for (const e of ends) {
        const kmF = haversineKm(e.pt, cand[0]);
        const kmR = haversineKm(e.pt, cand[cand.length - 1]);
        const km = Math.min(kmF, kmR);
        if (km < bestKm) {
          bestKm = km;
          bi = i;
          toHead = e.head;
          reverseCand = kmR < kmF;
        }
      }
    }
    if (bi < 0) break;
    const cand = rest.splice(bi, 1)[0];
    const oriented = reverseCand ? [...cand].reverse() : cand;
    if (bestKm > maxBridgeKm) {
      leftovers.push(oriented); // too far to bridge honestly — open end stays
      continue;
    }
    // spread the two connector points INTO the chain (a nested [p,p] element
    // would render as a corrupt segment)
    cur = toHead
      ? [...oriented, oriented[oriented.length - 1], cur[0], ...cur]
      : [...cur, cur[cur.length - 1], oriented[0], ...oriented];
    bridges += 1;
  }
  return { lines: leftovers.length ? [cur, ...leftovers] : [cur], bridges };
}

let repaired = 0;
const report = [];

// Legacy (non-addition) waters with visible gaps: repaired from the network
// by name, envelope = the feature's own bounds. The sweep below adds more
// where the network proves a materially longer water than the catalog holds.
const EXTRA_REPAIRS = [{ id: 'obion-river', nhdNames: ['Obion River'] }];

const worklist = [
  ...additions.map((c) => ({ id: c.id, nhdNames: c.nhdNames, envelope: c.envelope })),
  ...EXTRA_REPAIRS.map((r) => {
    const f = gj.features.find((x) => x.properties.id === r.id);
    return { id: r.id, nhdNames: r.nhdNames, envelope: f?.properties.bounds ?? null };
  }),
];

for (const cand of worklist) {
  const feature = gj.features.find((f) => f.properties.id === cand.id);
  if (!feature) {
    report.push(`MISSING feature for ${cand.id}`);
    continue;
  }
  if (!cand.envelope) {
    report.push(`SKIP ${cand.id}: no envelope`);
    continue;
  }
  const names = new Set(cand.nhdNames.map((n) => n.toLowerCase()));
  const [w, s, e, n] = cand.envelope;
  const segments = [];
  for (const { f } of clusterFeatures) {
    const nm = (f.properties.name ?? '').toLowerCase();
    if (!names.has(nm)) continue;
    for (const part of asMulti(f.geometry)) {
      // keep only segments with at least one vertex inside the envelope
      if (part.some(([x, y]) => x >= w - 0.02 && x <= e + 0.02 && y >= s - 0.02 && y <= n + 0.02)) {
        segments.push(part.map((p) => [p[0], p[1]]));
      }
    }
  }
  if (segments.length < 2) {
    report.push(`SKIP ${cand.id}: only ${segments.length} network segments matched`);
    continue;
  }
  const before = feature.properties.partCount;
  const { lines, bridges } = bridgeChains(stitch(segments));
  const totalKm = lines.reduce((sum, l) => {
    let km = 0;
    for (let i = 1; i < l.length; i++) km += haversineKm(l[i - 1], l[i]);
    return sum + km;
  }, 0);
  // NO-SHRINK GUARD: a stitch that comes out materially shorter than the
  // catalog water means the network names only part of it (e.g. the Obion's
  // lower reach) — replacing would DELETE mapped river. Keep the catalog line.
  if (totalKm < feature.properties.lengthKm * 0.9) {
    report.push(`SKIP ${cand.id}: stitched ${Math.round(totalKm)} km < catalog ${feature.properties.lengthKm} km (partial-name match)`);
    continue;
  }
  const verts = lines.reduce((n2, l) => n2 + l.length, 0);
  const xs = lines.flatMap((l) => l.map((p) => p[0]));
  const ys = lines.flatMap((l) => l.map((p) => p[1]));
  feature.geometry = { type: 'MultiLineString', coordinates: lines };
  feature.properties.partCount = lines.length;
  feature.properties.vertexCount = verts;
  feature.properties.lengthKm = Math.round(totalKm * 10) / 10;
  feature.properties.bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  feature.properties.source = 'nhd-network-stitch (2026-09-15, joined from /atlas/network clusters)';
  if (bridges > 0) feature.properties.bridgedSegments = bridges;
  report.push(
    `STITCHED ${cand.id}: ${before} parts -> ${lines.length} parts, ${Math.round(totalKm)} km, ${verts} verts` +
      (bridges ? ` (+${bridges} bridge${bridges > 1 ? 's' : ''})` : ''),
  );
  repaired += 1;
}

// Sanitize: drop non-finite vertices everywhere. NaN coordinates (43 lake/
// reservoir polygons carried them since before 2026-09-15) render as
// degenerate segments — the "doubled/garbage lines" down the Tennessee
// reservoir corridors.
function cleanParts(parts, minLen) {
  const out = [];
  for (const part of parts) {
    const pts = (part ?? []).filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (pts.length >= minLen) out.push(pts);
  }
  return out;
}
let sanitized = 0;
for (const f of gj.features) {
  const g = f.geometry;
  if (g.type === 'LineString') {
    const parts = cleanParts([g.coordinates], 2);
    if (parts.length === 1) {
      g.coordinates = parts[0];
      sanitized += 1;
    }
  } else if (g.type === 'MultiLineString') {
    const parts = cleanParts(g.coordinates, 2);
    if (parts.length > 0) {
      g.coordinates = parts;
      sanitized += 1;
    }
  } else if (g.type === 'Polygon') {
    const rings = cleanParts(g.coordinates, 4);
    if (rings.length > 0) {
      g.coordinates = rings;
      sanitized += 1;
    }
  } else if (g.type === 'MultiPolygon') {
    const polys = g.coordinates.map((poly) => cleanParts(poly, 4)).filter((poly) => poly.length > 0);
    if (polys.length > 0) {
      g.coordinates = polys;
      sanitized += 1;
    }
  }
}
console.log(`[sanitize] ${sanitized} features vertex-clean`);

console.log(report.join('\n'));
console.log(`[stitch] ${repaired}/${worklist.length} waters repaired`);

// Sweep: other catalog rivers/creeks whose network name-match proves a
// materially longer water than the catalog holds (visible as missing
// segments). Conservative: only river/creek types, only when stitched is
// >20% longer AND stays in <=6 continuous parts, envelope = own bounds+pad.
const sweep = [];
for (const feature of gj.features) {
  const p = feature.properties;
  if (!['river', 'creek'].includes(p.waterbodyType)) continue;
  // a previous buggy run could leave non-finite bounds — always re-derive those
  const corruptBounds = (p.bounds ?? []).some((v) => !Number.isFinite(v));
  if (!corruptBounds && p.partCount > 1 && p.partCount < 8) continue; // only fragmented or provably short
  const base = (p.name ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
  if (!base) continue;
  const [w, s, e, n] = p.bounds;
  const segments = [];
  for (const { f } of clusterFeatures) {
    if (String(f.properties.name ?? '').toLowerCase() !== base) continue;
    for (const part of asMulti(f.geometry)) {
      if (part.some(([x, y]) => x >= w - 0.05 && x <= e + 0.05 && y >= s - 0.05 && y <= n + 0.05)) {
        segments.push(part.map((pt) => [pt[0], pt[1]]));
      }
    }
  }
  if (segments.length < 4) continue;
  const bridged = bridgeChains(stitch(segments));
  const lines = bridged.lines;
  if (lines.length > 6) continue;
  const totalKm = lines.reduce((sum, l) => {
    let km = 0;
    for (let i = 1; i < l.length; i++) km += haversineKm(l[i - 1], l[i]);
    return sum + km;
  }, 0);
  if (totalKm < p.lengthKm * 1.2 + 2) continue;
  sweep.push({ feature, lines, totalKm, base });
}
for (const { feature, lines, totalKm, base } of sweep) {
  const p = feature.properties;
  const wasKm = p.lengthKm;
  const verts = lines.reduce((n2, l) => n2 + l.length, 0);
  const xs = lines.flatMap((l) => l.map((pt) => pt[0]));
  const ys = lines.flatMap((l) => l.map((pt) => pt[1]));
  feature.geometry = { type: 'MultiLineString', coordinates: lines };
  p.partCount = lines.length;
  p.vertexCount = verts;
  p.lengthKm = Math.round(totalKm * 10) / 10;
  p.bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  p.source = 'nhd-network-stitch (2026-09-15, joined from /atlas/network clusters)';
  repaired += 1;
  report.push(`SWEEP-STITCHED ${p.id} ("${base}"): ${totalKm.toFixed(1)} km in ${lines.length} parts (was ${wasKm} km)`);
}
if (sweep.length) console.log(report.slice(-sweep.length).join('\n'));
console.log(`[stitch] ${repaired}/${worklist.length + sweep.length} waters repaired`);
if (!dryRun && repaired > 0) {
  writeFileSync(join(atlasDir, 'rivers.geojson'), JSON.stringify(gj) + '\n');
  console.log('[stitch] rivers.geojson rewritten');
}
