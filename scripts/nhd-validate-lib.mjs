// nhd-validate-lib.mjs — pure check functions for the catalog-wide NHD
// regression suite (SESSION GEOVALID-2). Zero dependencies, Node stdlib only.
// Conventions: docs/NHD-CONVENTIONS.md (frozen by GEOCONV-0) is the schema
// source of truth for termini specs, tolerances, and the reach output shape.
//
// Consumers: scripts/nhd-validate.mjs (CLI), tests/nhd-validate.test.mjs,
// scripts/nhd-validate-pack.mjs (before/after review pack).

import fs from 'node:fs';
import path from 'node:path';
import { haversineM, mPerDegLon } from './nhd_lib.mjs';

// ---------------------------------------------------------------------------
// Termini grammar (docs/NHD-CONVENTIONS.md §6.2, extended by the engine v2
// integration note: upstream point/confluence stops mirror the downstream
// rules — additive, inert unless a spec uses them; pending GEOCONV-0 review)
//   up:   "dam:<waterbody gnis_name>" | "headwater" | "confluence:<name>" | "point:<lat>,<lng>"
//   down: "mouth" | "confluence:<gnis_name>" | "point:<lat>,<lng>"
// ---------------------------------------------------------------------------

export function isValidUpSpec(spec) {
  if (spec === 'headwater') return true;
  if (typeof spec === 'string' && spec.startsWith('dam:')) {
    const name = spec.slice(4);
    return name.length > 0 && !/^\s|\s$/.test(name) && !name.includes(',');
  }
  // v2 upstream stops (mirror of the downstream rules)
  if (typeof spec === 'string' && spec.startsWith('confluence:')) {
    const name = spec.slice(11);
    return name.length > 0 && !/^\s|\s$/.test(name);
  }
  if (typeof spec === 'string' && spec.startsWith('point:')) return isValidDownSpec(spec);
  return false;
}

export function isValidDownSpec(spec) {
  if (spec === 'mouth') return true;
  if (typeof spec === 'string' && spec.startsWith('confluence:')) {
    const name = spec.slice(11);
    return name.length > 0 && !/^\s|\s$/.test(name);
  }
  if (typeof spec === 'string' && spec.startsWith('point:')) {
    const m = /^point:(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/.exec(spec);
    if (!m) return false;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
  return false;
}

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'n/a'];
export const HUMAN_REVIEW_TOKENS = [
  'dam-name-unverified',
  'reach-split-ambiguous',
  'ambiguous-notes',
  'no-endpoint-evidence',
  'crosses-state-line',
];
export const STILLWATER_TYPES = new Set(['lake', 'pond', 'reservoir']);
export const TAILWATER_TYPE = 'tailrace';

// Anchor snap tolerance (§6.1): ok <= 250 m; a reach must not anchor farther.
export const MAX_ANCHOR_SNAP_M = 250;
// Reach geometry discipline: one part; consecutive-vertex chords beyond
// FAIL_CHORD_M indicate a disconnected reach (B13 Cane Creek class). Chords in
// (REVIEW_CHORD_M, FAIL_CHORD_M] are flagged for review — reservoir artificial
// paths are legitimate straight chords (measured max 1,282 m on the reference
// Clinch), so 2 km review / 20 km fail leave a 15x margin over legitimate art.
export const REVIEW_CHORD_M = 2000;
export const FAIL_CHORD_M = 20000;
// Junction gaps between consecutive path edges (audit sidecar) — §7 continuity.
export const MAX_JUNCTION_M = 50;
// Byte budget per reach (§6.5).
export const REACH_BUDGET_BYTES = 81920;
// bbox "shared geometry" tolerance (B13 duplicate class: boone-tailwater /
// south-holston-river shipped identical bounds to 4-6 decimals). Two waters
// whose bounds agree on all four edges within this many degrees are flagged.
export const BBOX_SHARE_TOL_DEG = 0.0005; // ~50 m at TN latitudes

// ---------------------------------------------------------------------------
// Catalog YAML reader (strict subset parser — the streams pack uses flat
// top-level scalars, a folded `notes: >-` block, and simple `key:` lists).
// Unknown compound blocks are skipped structurally; anything malformed at
// column 0 throws, so the suite fails loudly on unexpected YAML shapes.
// ---------------------------------------------------------------------------

export function parseStreamYaml(text) {
  const lines = text.split('\n');
  const doc = {};
  let i = 0;
  let lastKey = null;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    if (/^[^\s#]/.test(line)) {
      const m = /^([A-Za-z][A-Za-z0-9_]*):(.*)$/.exec(line);
      if (!m) throw new Error(`unparseable top-level line: ${JSON.stringify(line)}`);
      const key = m[1];
      if (key in doc) throw new Error(`duplicate top-level key ${key}`);
      let rest = m[2].trim();
      lastKey = key;
      if (rest === '>-' || rest === '>' || rest === '|' || rest === '|-') {
        // block scalar: consume indented/blank lines, fold newlines to spaces
        const body = [];
        i++;
        while (i < lines.length && (lines[i].trim() === '' || /^[ \t]/.test(lines[i]))) {
          body.push(lines[i].replace(/^[ \t]+/, ''));
          i++;
        }
        doc[key] = body.join(' ').replace(/\s+/g, ' ').trim();
        continue;
      }
      if (rest === '') {
        // block list or nested map: capture only simple scalar items (gaugeIds
        // shape); nested `k: v` items are skipped but must stay well-indented.
        const items = [];
        i++;
        while (i < lines.length && (lines[i].trim() === '' || /^[ \t]/.test(lines[i]))) {
          const l = lines[i];
          const item = /^ {2}- (.+)$/.exec(l);
          if (item) {
            const v = item[1].trim();
            if (/^["']?.*:/.test(v) && !/^["'].*["']$/.test(v)) {
              items.push(v); // nested-map first line — kept raw, caller ignores
            } else {
              items.push(v.replace(/^["']|["']$/g, ''));
            }
          }
          i++;
        }
        doc[key] = items;
        continue;
      }
      doc[key] = rest.replace(/^["']|["']$/g, '');
      i++;
      // plain scalars may wrap onto indented continuation lines (folded)
      const cont = [];
      while (i < lines.length && /^[ \t]+\S/.test(lines[i]) && !/^[ \t]*- /.test(lines[i])) {
        cont.push(lines[i].replace(/^[ \t]+/, ''));
        i++;
      }
      if (cont.length > 0) doc[key] = (doc[key] + ' ' + cont.join(' ')).replace(/\s+/g, ' ').trim();
      continue;
    }
    throw new Error(`unexpected indented line outside a block: ${JSON.stringify(line)}`);
  }
  if (!doc.id) throw new Error('missing id');
  if (typeof doc.notes !== 'string') doc.notes = doc.notes === undefined ? '' : String(doc.notes);
  if (!Array.isArray(doc.gaugeIds)) doc.gaugeIds = [];
  if (lastKey === null) throw new Error('empty document');
  return doc;
}

export function loadCatalogYamls(dir) {
  const waters = new Map();
  for (const file of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()) {
    const doc = parseStreamYaml(fs.readFileSync(path.join(dir, file), 'utf8'));
    const id = file.replace(/\.yaml$/, '');
    if (doc.id !== id) throw new Error(`id mismatch in ${file}: yaml id ${doc.id}`);
    waters.set(id, doc);
  }
  return waters;
}

// ---------------------------------------------------------------------------
// Geometry checks
// ---------------------------------------------------------------------------

export function bboxesOverlap(a, b) {
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

// True when two bboxes agree on all four edges within tolDeg — the "same
// geometry shipped twice" signature (B13 duplicate class).
export function nearShareBbox(a, b, tolDeg = BBOX_SHARE_TOL_DEG) {
  return (
    Math.abs(a[0] - b[0]) <= tolDeg &&
    Math.abs(a[1] - b[1]) <= tolDeg &&
    Math.abs(a[2] - b[2]) <= tolDeg &&
    Math.abs(a[3] - b[3]) <= tolDeg
  );
}

// Consecutive-vertex chord scan over every part. Disconnections (B13 Cane
// Creek class: two unrelated same-named creeks merged into one feature)
// manifest as huge intra-part chords; reservoir artificial paths produce
// legitimate straight chords well under REVIEW_CHORD_M.
export function scanChords(parts) {
  let maxChordM = 0;
  const review = [];
  const fail = [];
  for (const [pi, part] of parts.entries()) {
    for (let i = 1; i < part.length; i++) {
      const d = haversineM(part[i - 1], part[i]);
      if (d > maxChordM) maxChordM = d;
      const rec = { part: pi, atVertex: i, distM: Math.round(d), from: part[i - 1], to: part[i] };
      if (d > FAIL_CHORD_M) fail.push(rec);
      else if (d > REVIEW_CHORD_M) review.push(rec);
    }
  }
  return { maxChordM: Math.round(maxChordM), review, fail };
}

// "Multi-longitude" long-range disconnection: a part whose vertices jump more
// than minSpanDeg of longitude with no intermediate vertices is disconnected
// even if a freak chord scan missed it (belt-and-braces with scanChords).
export function multiLongitudeDisconnection(parts, minSpanDeg = 0.5) {
  const findings = [];
  for (const [pi, part] of parts.entries()) {
    let minLon = Infinity;
    let maxLon = -Infinity;
    for (const [lon] of part) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
    // A single straight chord across >0.5° with only its two endpoints is the
    // merge-defect signature; real reservoir artpaths stay far below this.
    if (maxLon - minLon > minSpanDeg && part.length <= 4) {
      findings.push({ part: pi, lonSpanDeg: Math.round((maxLon - minLon) * 1000) / 1000 });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Line sanitation — hairpin collapse (rendering sanitizer)
// ---------------------------------------------------------------------------

// Collapse "hairpin" vertices: A -> B -> C where the line doubles back on
// itself within a few tens of meters (a digitization artifact in NHD
// flowlines). Rendered with round caps/joins these spikes become filled
// pills/wedges whose shape shifts with zoom (owner-reported map glitch).
// Removing the apex vertex keeps the line visually identical at rendering
// widths while eliminating the artifact. Also drops duplicate consecutive
// vertices. Pure; returns a new array plus the removal count for audit.
export function collapseHairpins(coords, opts = {}) {
  const pinM = opts.pinM ?? 60;
  const minAngleDeg = opts.minAngleDeg ?? 135;
  const out = coords.map((c) => [c[0], c[1]]);
  let removed = 0;
  const angleAt = (a, b, c) => {
    const v1 = [a[0] - b[0], a[1] - b[1]];
    const v2 = [c[0] - b[0], c[1] - b[1]];
    const m = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
    if (m === 0) return 0;
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
  };
  let i = 1;
  while (i < out.length - 1) {
    const dAB = haversineM(out[i - 1], out[i]);
    if (dAB < 0.5) {
      out.splice(i, 1); // duplicate consecutive vertex
      removed++;
      continue;
    }
    const dBC = haversineM(out[i], out[i + 1]);
    if (dAB < pinM && dBC < pinM && angleAt(out[i - 1], out[i], out[i + 1]) > minAngleDeg) {
      out.splice(i, 1);
      removed++;
      if (i > 1) i--;
      continue;
    }
    i++;
  }
  return { coords: out, removed };
}

// ---------------------------------------------------------------------------
// Length sanity vs stated river miles (YAML notes)
// ---------------------------------------------------------------------------

// Extract stated reach lengths from notes text: "33-mile dam-to-dam corridor",
// "upstream 46 miles", "runs 72.4 miles to ...". Returns [{ miles, quote }].
export function parseStatedMiles(notes) {
  if (typeof notes !== 'string') return [];
  const out = [];
  const re = /(?<![\d.])(\d{1,3}(?:\.\d+)?)\s*(?:-|\s)?\s*miles?\b[^.]{0,80}/gi;
  for (const m of notes.matchAll(re)) {
    const miles = Number(m[1]);
    if (miles > 0 && miles < 500) out.push({ miles, quote: m[0].trim() });
  }
  return out;
}

// Compare a reach length against a stated mileage. River miles describe the
// managed corridor loosely (dam-to-dam vs in-stream, label vs centerline), so
// the gate is a wide sanity band, not a precision check.
export function lengthSanity(reachKm, statedMiles, opts = {}) {
  const minRatio = opts.minRatio ?? 0.7;
  const maxRatio = opts.maxRatio ?? 1.4;
  const statedKm = statedMiles * 1.60934;
  const ratio = reachKm / statedKm;
  return {
    statedKm: Math.round(statedKm * 10) / 10,
    reachKm,
    ratio: Math.round(ratio * 100) / 100,
    pass: ratio >= minRatio && ratio <= maxRatio,
  };
}

// ---------------------------------------------------------------------------
// B13 known-bad registry (deliverable 4). Source: docs/GEO-AUDIT.md deliverable
// table (lane trout-geo, merged 2026-09-04) — every row whose ORIGINAL verdict
// was not ok/point-anchor. `orig` is the defect signature (bbox at 3dp as
// published, or a class marker for missing-geometry rows); the regression run
// proves the current geometry no longer carries the signature and the NHD
// pipeline makes the class unreachable.
// ---------------------------------------------------------------------------

export const KNOWN_BAD = [
  { id: 'boone-tailwater', cls: 'duplicate', orig: [-81.999, 36.594, -81.999, 36.594] },
  { id: 'cane-creek', cls: 'misjoined', orig: [-87.789, 35.535, -85.304, 35.788] },
  { id: 'clinch-river', cls: 'fragment', orig: [-83.349, 36.447, -83.256, 36.499] },
  { id: 'duck-river-lower', cls: 'misjoined', orig: [-87.282, 35.443, -86.081, 35.7] },
  { id: 'duck-river-tailwater', cls: 'misjoined', orig: [-87.282, 35.443, -86.081, 35.7] },
  { id: 'elk-river-lower', cls: 'duplicate', orig: [-87.006, 35.004, -85.834, 35.358] },
  { id: 'elk-river', cls: 'misjoined', orig: [-87.006, 35.004, -85.834, 35.358] },
  { id: 'forge-creek-johnson', cls: 'fragment', orig: [-81.771, 36.442, -81.758, 36.453] },
  { id: 'french-broad-river', cls: 'missing', orig: null },
  { id: 'ft-patrick-henry-tailwater', cls: 'duplicate', orig: [-81.999, 36.594, -81.999, 36.594] },
  { id: 'hiwassee-river', cls: 'missing', orig: null },
  { id: 'leconte-creek', cls: 'fragment', orig: [-83.523, 35.686, -83.5, 35.71] },
  { id: 'mossy-creek-jefferson', cls: 'fragment', orig: [-83.513, 36.121, -83.474, 36.129] },
  { id: 'obey-river', cls: 'missing', orig: null },
  { id: 'ocoee-river', cls: 'fragment', orig: [-84.694, 35.073, -84.491, 35.148] },
  { id: 'parksville-tailwater', cls: 'fragment', orig: [-84.694, 35.073, -84.491, 35.148] },
  { id: 'south-holston-river', cls: 'duplicate', orig: [-81.999, 36.594, -81.999, 36.594] },
  { id: 'station-creek', cls: 'fragment', orig: [-83.626, 36.596, -83.625, 36.598] },
  { id: 'watauga-river', cls: 'fragment', orig: [-81.936, 36.287, -81.919, 36.294] },
];

// Waivers: catalog entries whose remaining "defect-shaped" geometry is a
// reviewed, deliberate decision owned by the content lane (documented in
// docs/GEO-AUDIT.md), not an open geometry defect.
export const KNOWN_BAD_WAIVERS = {
  'cane-creek':
    'GEO-AUDIT: CONFIRMED but deliberate — the catalog entry intentionally covers both stocked Cane Creeks (Bledsoe/Van Buren + Hickman/Perry bands); splitting is a content-lane catalog change. The NHD trace pipeline cannot reproduce the merge (one anchor per water, one connected component enforced), and the bbox-uniqueness/multi-longitude gates keep the class closed.',
};

// bbox still essentially the original defect signature? (4dp agreement on all
// edges — the audit published 3dp, so 0.0007 covers its rounding.)
export function stillAtOriginalSignature(orig, current, tolDeg = 0.0007) {
  if (!orig) return false;
  return nearShareBbox(orig, current, tolDeg);
}

// Line-work coincidence: fraction of A's vertices lying within tolM of B's
// paths. The B13 duplicate class (boone-tailwater et al.) shipped the SAME
// fragment under several ids — coincidence ~1.0. Distinct waters that merely
// share a tiny neighborhood (a tailwater hugging its reservoir) score low.
export function pathCoincidence(partsA, partsB, tolM = 25) {
  let near = 0;
  let total = 0;
  for (const part of partsA) {
    for (const p of part) {
      total++;
      let best = Infinity;
      for (const other of partsB) {
        const d = distPointToPathM(p, other);
        if (d < best) best = d;
        if (best <= tolM) break;
      }
      if (best <= tolM) near++;
    }
  }
  return total === 0 ? 0 : near / total;
}

// Line parts of a geometry, or null for polygonal (stillwater) geometry —
// lake-adjacent reaches legitimately share their lake's bbox.
export function linePartsOf(geometry) {
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  if (geometry.type === 'LineString') return [geometry.coordinates];
  return null;
}

// Point-to-segment distance helper reused by the review pack renderer.
export function distPointToPathM(p, part) {
  let best = Infinity;
  for (let i = 1; i < part.length; i++) {
    const d = segDistM(p, part[i - 1], part[i]);
    if (d < best) best = d;
  }
  return best;
}

function segDistM(p, a, b) {
  const sx = mPerDegLon((a[1] + b[1]) / 2);
  const px = p[0] * sx;
  const py = p[1] * 111132;
  const ax = a[0] * sx;
  const ay = a[1] * 111132;
  const bx = b[0] * sx;
  const by = b[1] * 111132;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
