// tests/nhd-validate.test.mjs — unit tests for the catalog-wide NHD regression
// suite's pure checks (SESSION GEOVALID-2). Run: node --test tests/
// The integration path (real catalog + reference HU8) is `node scripts/nhd-validate.mjs`.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { haversineM } from '../scripts/nhd_lib.mjs';
import {
  BBOX_SHARE_TOL_DEG,
  CONFIDENCE_LEVELS,
  FAIL_CHORD_M,
  HUMAN_REVIEW_TOKENS,
  KNOWN_BAD,
  REVIEW_CHORD_M,
  STILLWATER_TYPES,
  TAILWATER_TYPE,
  loadCatalogYamls,
  parseStatedMiles,
  lengthSanity,
  multiLongitudeDisconnection,
  nearShareBbox,
  parseStreamYaml,
  pathCoincidence,
  scanChords,
  isValidDownSpec,
  isValidUpSpec,
} from '../scripts/nhd-validate-lib.mjs';

// Equator meters-per-longitude-degree via the project's own haversine — lets
// the threshold tests build chords of an exact target length deterministically.
const M_PER_DEG_EQUATOR = haversineM([0, 0], [0, 1]);
// Real catalog fixture dir (read-only) and the schema's allowed waterbody types.
const TN_DIR = fileURLToPath(new URL('../packages/content/streams/tn', import.meta.url));
const WATERBODY_TYPES = new Set([
  'creek',
  'river',
  'lake',
  'pond',
  'tailrace',
  'spring',
  'reservoir',
]);
// Termini drafts are session artifacts in /tmp — skip silently when absent.
const TERMINI_DRAFT_DIR = '/tmp/geovalid2-termini';

// --- termini grammar (docs/NHD-CONVENTIONS.md §6.2) ---------------------------

test('up grammar accepts dam and headwater only', () => {
  assert.equal(isValidUpSpec('headwater'), true);
  assert.equal(isValidUpSpec('dam:Norris Lake'), true);
  assert.equal(isValidUpSpec('dam:J. Percy Priest Lake'), true);
  assert.equal(
    isValidUpSpec('dam:Norris Dam'),
    true,
    'grammar-level valid; NHD-name check is the termini table’s job',
  );
  assert.equal(isValidUpSpec('dam:'), false);
  assert.equal(isValidUpSpec('dam: Norris Lake'), false);
  assert.equal(isValidUpSpec('mouth'), false);
  assert.equal(isValidUpSpec('confluence:Obey River'), false);
  assert.equal(isValidUpSpec('point:36.2,-84.1'), false);
  assert.equal(isValidUpSpec(null), false);
  assert.equal(isValidUpSpec(undefined), false);
});

test('down grammar accepts mouth, confluence, point only', () => {
  assert.equal(isValidDownSpec('mouth'), true);
  assert.equal(isValidDownSpec('confluence:Holston River'), true);
  assert.equal(isValidDownSpec('point:36.2156,-84.0821'), true);
  assert.equal(isValidDownSpec('point:-35.5,-84.1'), true);
  assert.equal(isValidDownSpec('headwater'), false);
  assert.equal(isValidDownSpec('dam:Norris Lake'), false);
  assert.equal(isValidDownSpec('confluence:'), false);
  assert.equal(isValidDownSpec('point:91,-84.1'), false, 'lat out of range');
  assert.equal(isValidDownSpec('point:36.2'), false);
  assert.equal(isValidDownSpec('point:36.2,-84.1,7'), false);
  assert.equal(isValidDownSpec(null), false);
});

test('dam/confluence names: unicode, dotted, padded and comma forms', () => {
  assert.equal(isValidUpSpec('dam:Étang du Nord'), true, 'unicode names pass the grammar');
  assert.equal(isValidUpSpec('dam:Norris Lake '), false, 'trailing space rejected');
  assert.equal(isValidUpSpec('dam:Norris Lake\t'), false, 'trailing tab rejected');
  assert.equal(isValidUpSpec('dam:Fort Loudoun, TN'), false, 'comma rejected in dam names');
  assert.equal(isValidDownSpec('confluence:Crutcher Branch'), true);
  assert.equal(isValidDownSpec('confluence:J. Percy Priest Lake'), true, 'dotted names pass');
  assert.equal(isValidDownSpec('confluence:Cañada Larga'), true, 'unicode names pass');
  assert.equal(isValidDownSpec('confluence:Holston River '), false, 'trailing space rejected');
  // PINNED quirk: dam names exclude commas but confluence names do not.
  assert.equal(isValidDownSpec('confluence:Odd, Name'), true);
});

test('point grammar: integer coordinates accepted, out-of-range and malformed rejected', () => {
  assert.equal(isValidDownSpec('point:36,-84'), true, 'integer lat/lng accepted');
  assert.equal(isValidDownSpec('point:90,180'), true, 'range corners inclusive');
  assert.equal(isValidDownSpec('point:-90,-180'), true, 'range corners inclusive');
  assert.equal(isValidDownSpec('point:91,-84.1'), false, 'lat above 90 rejected');
  assert.equal(isValidDownSpec('point:-90.5,0'), false, 'lat below -90 rejected');
  assert.equal(isValidDownSpec('point:36.2,-181'), false, 'lon below -180 rejected');
  assert.equal(isValidDownSpec('point:36.2,181'), false, 'lon above 180 rejected');
  assert.equal(isValidDownSpec('point:36.2.3,-84.1'), false, 'double decimal malformed');
  assert.equal(isValidDownSpec('point:abc,-84.1'), false, 'non-numeric malformed');
  assert.equal(isValidDownSpec('point:36.2,-84.1x'), false, 'trailing junk malformed');
  assert.equal(isValidDownSpec('point:36.2,-1000'), false, '4-digit lon does not parse');
  assert.equal(isValidDownSpec('point:36,-84,'), false, 'trailing comma malformed');
});

// --- catalog YAML subset parser ------------------------------------------------

test('parseStreamYaml reads the streams pack shape', () => {
  const doc = parseStreamYaml(`id: test-creek
name: Test Creek
stateId: TN
waterbodyType: creek
regionId: tn-test
gaugeIds:
  - "03486810"
  - tva:BOOT1
stockingProgram: true
species: trout
fishery: tailwater
yearRound: true
idealFlow:
  - min: 150
    max: 1200
    unit: cfs
notes: >-
  A folded note mentioning Norris Dam
  and 33 miles of water.
`);
  assert.equal(doc.id, 'test-creek');
  assert.equal(doc.waterbodyType, 'creek');
  assert.deepEqual(doc.gaugeIds, ['03486810', 'tva:BOOT1']);
  assert.match(doc.notes, /Norris Dam and 33 miles of water\./);
});

test('parseStreamYaml folds wrapped plain scalars', () => {
  const doc = parseStreamYaml(`id: reedy-creek
notes: Small creek receiving stocking. Spring-fed pockets
  and park access; flows track rain closely.
waterbodyType: creek
`);
  assert.equal(
    doc.notes,
    'Small creek receiving stocking. Spring-fed pockets and park access; flows track rain closely.',
  );
});

test('parseStreamYaml throws loudly on malformed top-level lines', () => {
  assert.throws(() => parseStreamYaml('id: x\n:this is not yaml\n'), /unparseable/);
  assert.throws(() => parseStreamYaml('name: no id here\n'), /missing id/);
  assert.throws(() => parseStreamYaml('id: a\nid: b\n'), /duplicate/);
});

test('parseStreamYaml reads literal-strip and folded block headers (|, |-, >)', () => {
  const literal = parseStreamYaml(`id: block-style
notes: |
  Line one.
  Line two.
`);
  // PINNED: the subset parser folds '|' exactly like '>-' (newlines to spaces),
  // unlike real YAML literal blocks — harmless for notes prose.
  assert.equal(literal.notes, 'Line one. Line two.');
  const strip = parseStreamYaml(`id: block-strip
notes: |-
  Only line.

`);
  assert.equal(strip.notes, 'Only line.', 'blank trailer folded away');
});

test('parseStreamYaml lists: quoted/unquoted scalars, embedded comments, empty list', () => {
  const doc = parseStreamYaml(`id: list-shapes
gaugeIds:
  # office note about the first gauge
  - "03457000"
  - tva:BOOT1
  - "tva:SHDT1"
  - '03457002'
notes: kept
`);
  assert.deepEqual(doc.gaugeIds, ['03457000', 'tva:BOOT1', 'tva:SHDT1', '03457002']);
  const empty = parseStreamYaml(`id: no-gauges
gaugeIds:
notes: none
`);
  assert.deepEqual(empty.gaugeIds, [], 'bare key yields an empty list');
});

test('parseStreamYaml tolerates notes-first and unusual key ordering', () => {
  const notesFirst = parseStreamYaml(`notes: >-
  Notes arrive before any other key.
  Still folding.
name: Notes-First Creek
waterbodyType: creek
id: notes-first-creek
`);
  assert.equal(notesFirst.id, 'notes-first-creek');
  assert.equal(notesFirst.name, 'Notes-First Creek');
  assert.equal(notesFirst.waterbodyType, 'creek');
  assert.equal(notesFirst.notes, 'Notes arrive before any other key. Still folding.');
  const idLast = parseStreamYaml(`name: Last-Id Creek
gaugeIds:
  - "07000000"
notes: id comes last
id: last-id-creek
`);
  assert.equal(idLast.id, 'last-id-creek');
  assert.deepEqual(idLast.gaugeIds, ['07000000']);
});

test('parseStreamYaml skips nested-map list items without corrupting later keys', () => {
  const doc = parseStreamYaml(`id: nested-skip
idealFlow:
  - min: 150
    max: 1200
    unit: cfs
  - min: 300
    max: 900
    unit: cfs
gaugeIds:
  - "03457000"
notes: parsed after a nested block
`);
  // PINNED: nested-map items keep only their raw first line; callers ignore
  // them. The keys after the nested block must come through untouched.
  assert.deepEqual(doc.idealFlow, ['min: 150', 'min: 300']);
  assert.deepEqual(doc.gaugeIds, ['03457000']);
  assert.equal(doc.notes, 'parsed after a nested block');
});

test('parseStreamYaml ignores top-level comments/blanks; hash inside a block is literal', () => {
  const doc = parseStreamYaml(`# catalog export header
# generated by the streams pack

id: comment-creek

# between keys
name: Comment Creek
notes: >-
  Body line one.
  # not-a-comment inside the block
  Body line two.

# trailing comment

`);
  assert.equal(doc.id, 'comment-creek');
  assert.equal(doc.name, 'Comment Creek');
  // Inside a block scalar '#' is literal content (matches YAML); interior
  // blank lines fold to spaces.
  assert.equal(doc.notes, 'Body line one. # not-a-comment inside the block Body line two.');
});

test('parseStreamYaml rejects CRLF input loudly (pinned throw; lib is LF-only)', () => {
  // JS regex `.`/`$` do not swallow the trailing \r on 'key: value\r' lines, so
  // the first top-level line fails as unparseable. GEOVALID-2 decision: pin the
  // throw here and leave the lib untouched (report-only).
  assert.throws(() => parseStreamYaml('id: crlf-creek\r\nname: CRLF Creek\r\n'), /unparseable/);
  assert.throws(
    () => parseStreamYaml('id: crlf-creek\r\nnotes: >-\r\n  folded line\r\n'),
    /unparseable/,
  );
});

// --- bbox sharing (B13 duplicate class) ----------------------------------------

test('nearShareBbox flags the B13 identical-fragment signature', () => {
  const sig = [-81.999, 36.594, -81.999, 36.594];
  assert.equal(nearShareBbox(sig, [-81.9991, 36.5939, -81.9992, 36.5941]), true);
  assert.equal(nearShareBbox(sig, [-82.5137, 36.4406, -82.4378, 36.5084]), false);
  assert.equal(nearShareBbox([-85, 35, -84, 36], [-85.001, 35.001, -84.001, 36.001], 0.002), true);
  assert.equal(BBOX_SHARE_TOL_DEG, 0.0005);
});

test('pathCoincidence separates duplicated linework from adjacency', () => {
  const line = [
    [
      [0, 0],
      [0.001, 0],
      [0.002, 0],
    ],
  ];
  const same = [
    [
      [0, 0],
      [0.001, 0],
      [0.002, 0],
    ],
  ];
  const offset = [
    [
      [0, 0.05],
      [0.001, 0.05],
      [0.002, 0.05],
    ],
  ];
  assert.equal(pathCoincidence(line, same), 1);
  assert.ok(pathCoincidence(line, offset) < 0.1, 'offset path shares no vertices');
});

test('pathCoincidence: subset linework is asymmetric; empties and point parts degenerate', () => {
  const longLine = [
    [
      [0, 0],
      [0.001, 0],
      [0.002, 0],
      [0.003, 0],
    ],
  ];
  const subset = [
    [
      [0, 0],
      [0.002, 0],
    ],
  ];
  assert.equal(pathCoincidence(subset, longLine), 1, 'A ⊂ B: every A vertex sits on B');
  assert.equal(pathCoincidence(longLine, subset), 0.75, 'reverse: 3 of 4 B vertices on A');
  assert.equal(pathCoincidence(subset, []), 0, 'empty reference path: nothing to be near');
  assert.equal(pathCoincidence([], []), 0, 'both empty');
  const point = [[[0.5, 0.5]]];
  // PINNED: the metric samples A's vertices against B's segments; a single-
  // vertex part has no segments, so its distance is Infinity and it never
  // coincides — even against itself.
  assert.equal(pathCoincidence(point, point), 0);
  const segment = [
    [
      [0, 0],
      [0.01, 0],
    ],
  ];
  assert.equal(pathCoincidence(segment, segment), 1, 'identical single-segment lines');
});

// --- chord / disconnection scan (B13 Cane Creek class) --------------------------

test('scanChords passes reservoir artpaths and fails long-range disconnection', () => {
  const legit = [
    [
      [-84.5, 35.9],
      [-84.499, 35.9],
      [-84.487, 35.901], // ~1.0 km final chord — Melton-Hill-style artpath
    ],
  ];
  const scanned = scanChords(legit);
  assert.equal(scanned.fail.length, 0);
  assert.equal(scanned.review.length, 0);

  const disconnected = [
    [
      [-87.7888, 35.5354],
      [-85.3038, 35.8149], // 2.2° jump — the cane-creek defect signature
    ],
  ];
  const bad = scanChords(disconnected);
  assert.equal(bad.fail.length, 1);
  assert.ok(bad.maxChordM > 200000);
});

test('scanChords band edges: strict > thresholds at 2000 m review / 20000 m fail', () => {
  const part = (meters) => [
    [
      [0, 0],
      [meters / M_PER_DEG_EQUATOR, 0],
    ],
  ];
  // Just below the 2,000 m review edge (lib uses strict >, so a chord of
  // exactly REVIEW_CHORD_M would also stay out of review — documented via
  // just-below / just-above pairs since float haversine can't hit it exactly).
  const below2k = scanChords(part(1990));
  assert.deepEqual(below2k, { maxChordM: 1990, review: [], fail: [] });
  assert.ok(below2k.maxChordM < REVIEW_CHORD_M && below2k.maxChordM > 1900);
  const above2k = scanChords(part(2010));
  assert.equal(above2k.fail.length, 0);
  assert.equal(above2k.review.length, 1);
  assert.ok(above2k.review[0].distM > REVIEW_CHORD_M && above2k.review[0].distM < 2100);
  // (REVIEW, FAIL] is review-only: just below the 20,000 m fail edge.
  const below20k = scanChords(part(19990));
  assert.equal(below20k.review.length, 1);
  assert.equal(below20k.fail.length, 0);
  assert.ok(below20k.maxChordM < FAIL_CHORD_M && below20k.maxChordM > 19000);
  const above20k = scanChords(part(20010));
  assert.equal(above20k.fail.length, 1);
  assert.ok(above20k.fail[0].distM > FAIL_CHORD_M && above20k.fail[0].distM < 21000);
});

test('scanChords walks multi-part inputs, tolerates empty parts, isolates part index', () => {
  const fine = [
    [0, 0],
    [0.0005, 0],
  ]; // ~56 m chord
  const broken = [
    [-87.7888, 35.5354],
    [-85.3038, 35.8149],
  ]; // cane-creek jump
  const scanned = scanChords([fine, [], broken]);
  assert.equal(scanned.fail.length, 1);
  assert.equal(scanned.fail[0].part, 2, 'only part 2 carries the disconnection');
  assert.equal(scanned.maxChordM, scanned.fail[0].distM, 'max spans all parts');
  assert.deepEqual(scanChords([[]]), { maxChordM: 0, review: [], fail: [] });
  assert.deepEqual(scanChords([]), { maxChordM: 0, review: [], fail: [] });
});

test('multiLongitudeDisconnection catches few-point long-lon spans', () => {
  const parts = [
    [
      [-87.7, 35.5],
      [-85.3, 35.8],
    ],
  ];
  assert.deepEqual(multiLongitudeDisconnection(parts).length, 1);
  const dense = [
    [
      [-87.7, 35.5],
      [-87.1, 35.55],
      [-86.5, 35.6],
      [-85.9, 35.7],
      [-85.3, 35.8],
    ],
  ];
  assert.deepEqual(multiLongitudeDisconnection(dense), []);
});

test('multiLongitudeDisconnection: multi-part inputs, empty parts, exact 0.5° boundary', () => {
  const quiet = [
    [-87.7, 35.5],
    [-87.3, 35.55],
  ]; // 0.4° span — under the gate
  const jump = [
    [-87.7, 35.5],
    [-85.3, 35.8],
  ]; // 2.4° span, 2 vertices
  const mixed = multiLongitudeDisconnection([quiet, [], jump]);
  assert.equal(mixed.length, 1, 'only part 2 is disconnected');
  assert.equal(mixed[0].part, 2);
  assert.deepEqual(multiLongitudeDisconnection([[], []]), [], 'empty parts never crash or flag');
  assert.deepEqual(multiLongitudeDisconnection([]), []);
  // Exactly at the 0.5° default the span stays unflagged (strict >).
  assert.deepEqual(
    multiLongitudeDisconnection([
      [
        [-0.25, 0],
        [0.25, 0],
      ],
    ]),
    [],
  );
  const justAboveHalf = multiLongitudeDisconnection([
    [
      [0, 0],
      [0.500001, 0],
    ],
  ]);
  assert.equal(justAboveHalf.length, 1, 'just above flags');
  // PINNED: the <=4-vertex cap exempts dense parts regardless of span.
  const fourPt = [
    [0, 0],
    [0.2, 0],
    [0.4, 0],
    [0.7, 0],
  ];
  assert.equal(multiLongitudeDisconnection([fourPt]).length, 1);
  assert.deepEqual(multiLongitudeDisconnection([[...fourPt, [0.9, 0]]]), []);
});

// --- length sanity ---------------------------------------------------------------

test('parseStatedMiles extracts corridor statements', () => {
  const found = parseStatedMiles(
    'The 33-mile dam-to-dam corridor is the Little T. It runs upstream 72.4 miles to Fort Loudoun.',
  );
  assert.deepEqual(
    found.map((f) => f.miles).sort((a, b) => a - b),
    [33, 72.4],
  );
  assert.deepEqual(parseStatedMiles('no mileage here'), []);
});

test('parseStatedMiles ignores river-mile markers (number must precede "miles")', () => {
  // PINNED: 'River mile 602.3' places the number AFTER the word, so the
  // /N miles?/ pattern never fires — markers never surface as corridor
  // lengths; the <500 sanity cap would reject 602.3 even if it did.
  assert.deepEqual(parseStatedMiles('Put-in is at River mile 602.3 on the Cumberland.'), []);
  // Magnitude is not the filter — a sub-500 marker is ignored all the same.
  assert.deepEqual(parseStatedMiles('Access at river mile 45.2 above the dam.'), []);
  const mixed = parseStatedMiles(
    'River mile 602.3 of the Cumberland; the reach runs 30.5 miles to the mouth.',
  );
  assert.deepEqual(
    mixed.map((f) => f.miles),
    [30.5],
    'corridor statement captured, marker not',
  );
});

test('parseStatedMiles boundary values and the hyphenated form', () => {
  assert.deepEqual(parseStatedMiles('0 miles of water'), [], 'open interval: 0 excluded');
  assert.deepEqual(parseStatedMiles('500 miles of water'), [], 'open interval: 500 excluded');
  assert.deepEqual(parseStatedMiles('500.1 miles of water'), [], 'above the cap excluded');
  assert.deepEqual(
    parseStatedMiles('499.9 miles of water').map((f) => f.miles),
    [499.9],
    'just below the cap accepted',
  );
  assert.deepEqual(
    parseStatedMiles('a 150-mile corridor').map((f) => f.miles),
    [150],
    'hyphenated form accepted',
  );
});

test('parseStatedMiles ignores 4-digit figures entirely', () => {
  // the lookbehind keeps the match from restarting inside a longer number;
  // a 4-digit "mileage" is not a credible corridor statement, so no capture
  const found = parseStatedMiles('runs 1234 miles total');
  assert.deepEqual(found, []);
});

test('lengthSanity band rejects the cane-creek-style over-merge', () => {
  const inBand = lengthSanity(53.1, 33); // 33 mi = 53.1 km
  assert.equal(inBand.pass, true);
  const overMerged = lengthSanity(126, 33); // 2.4x the stated corridor
  assert.equal(overMerged.pass, false);
  assert.equal(overMerged.ratio > 2, true);
});

// --- B13 registry integrity -------------------------------------------------------

test('KNOWN_BAD registry covers the 19 non-ok GEO-AUDIT rows exactly once', () => {
  assert.equal(KNOWN_BAD.length, 19);
  assert.equal(new Set(KNOWN_BAD.map((b) => b.id)).size, 19);
  for (const bad of KNOWN_BAD) {
    assert.ok(['duplicate', 'misjoined', 'fragment', 'missing'].includes(bad.cls), bad.id);
    if (bad.cls !== 'missing') assert.equal(bad.orig.length, 4, bad.id);
  }
});

// --- catalog-wide integration (read-only fixtures) --------------------------------

test('catalog integration: all 148 TN YAMLs parse, ids match filenames, type census holds', () => {
  const files = fs
    .readdirSync(TN_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .sort();
  assert.equal(files.length, 148);
  for (const file of files) {
    const doc = parseStreamYaml(fs.readFileSync(path.join(TN_DIR, file), 'utf8'));
    assert.ok(doc.id.length > 0, file);
    assert.equal(doc.id, file.replace(/\.yaml$/, ''), `id must equal filename: ${file}`);
    assert.equal(typeof doc.notes, 'string', file);
    assert.ok(Array.isArray(doc.gaugeIds), file);
  }
  const waters = loadCatalogYamls(TN_DIR);
  assert.equal(waters.size, 148);
  for (const water of waters.values()) {
    assert.ok(WATERBODY_TYPES.has(water.waterbodyType), `${water.id}: ${water.waterbodyType}`);
  }
  const values = [...waters.values()];
  const tailraces = values.filter((w) => w.waterbodyType === TAILWATER_TYPE);
  assert.equal(tailraces.length, 12, 'tailrace count');
  assert.equal(
    values.filter((w) => STILLWATER_TYPES.has(w.waterbodyType)).length,
    43,
    'stillwater (lake/pond/reservoir) count',
  );
});

test(
  'termini drafts: 148 unique ids, grammar-valid specs, tailrace rows dam-anchored',
  {
    skip: !fs.existsSync(TERMINI_DRAFT_DIR),
  },
  () => {
    const rows = fs
      .readdirSync(TERMINI_DRAFT_DIR)
      .filter((f) => /^batch-.*\.json$/.test(f))
      .sort()
      .flatMap((f) => JSON.parse(fs.readFileSync(path.join(TERMINI_DRAFT_DIR, f), 'utf8')).rows);
    assert.equal(rows.length, 148);
    assert.equal(new Set(rows.map((r) => r.id)).size, 148, 'ids unique across all batches');
    for (const row of rows) {
      const at = row.id;
      if (row.stillwater) {
        assert.equal(row.up.spec, null, at);
        assert.equal(row.down.spec, null, at);
        assert.equal(row.up.confidence, 'n/a', at);
        assert.equal(row.down.confidence, 'n/a', at);
      } else {
        assert.ok(isValidUpSpec(row.up.spec), `up ${JSON.stringify(row.up.spec)} @ ${at}`);
        assert.ok(isValidDownSpec(row.down.spec), `down ${JSON.stringify(row.down.spec)} @ ${at}`);
        assert.notEqual(row.up.confidence, 'n/a', at);
        assert.notEqual(row.down.confidence, 'n/a', at);
      }
      assert.ok(CONFIDENCE_LEVELS.includes(row.up.confidence), `up confidence @ ${at}`);
      assert.ok(CONFIDENCE_LEVELS.includes(row.down.confidence), `down confidence @ ${at}`);
      if (row.waterbodyType === TAILWATER_TYPE) {
        assert.ok(String(row.up.spec).startsWith('dam:'), `tailrace ${at} needs dam: up spec`);
      }
      assert.ok(
        row.humanReview === null || HUMAN_REVIEW_TOKENS.includes(row.humanReview),
        `humanReview token @ ${at}`,
      );
    }
  },
);
