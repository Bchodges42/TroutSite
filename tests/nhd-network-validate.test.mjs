// tests/nhd-network-validate.test.mjs — unit tests for the QA statewide network
// validator (SESSION GEOQA). Run: node --test tests/
// The integration path (real 23-cluster build) is `node scripts/nhd-network-validate.mjs`.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runNetworkValidation } from '../scripts/nhd-network-validate.mjs';

const tmpRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'trout-netval-'));

const clusterFeature = (pid, coords, extra = {}) => ({
  type: 'Feature',
  properties: {
    kind: 'minor-water',
    name: extra.name ?? 'Test Creek',
    ftype: 460,
    lengthKm: 1.0,
    hu8: extra.hu8 ?? '06010207',
    pid,
  },
  geometry: { type: 'MultiLineString', coordinates: coords },
});

const writeJsonlFeature = (pid, coords, name = 'Test Creek') =>
  JSON.stringify({
    type: 'Feature',
    properties: { permanent_identifier: pid, gnis_name: name },
    // source JSONLs ship MultiLineString (one part in practice)
    geometry: { type: 'MultiLineString', coordinates: [coords] },
  });

/** Writes a minimal consistent fixture: one unit, one cluster, one 2-vertex line. */
function writeFixture({ features = null, jsonl = null, clusterBytes } = {}) {
  const dir = tmpRoot();
  const outDir = path.join(dir, 'network');
  const hu8Dir = path.join(dir, 'hu8');
  fs.mkdirSync(outDir);
  fs.mkdirSync(hu8Dir);
  const coords = [
    [
      [-86.0, 36.0],
      [-86.0003, 36.0002],
    ],
  ];
  const feats = features ?? [clusterFeature('11111111', coords)];
  const fc = JSON.stringify({ type: 'FeatureCollection', features: feats });
  fs.writeFileSync(path.join(outDir, '0601.geojson'), fc);
  const lines = jsonl ?? [writeJsonlFeature('11111111', coords[0])];
  fs.writeFileSync(path.join(hu8Dir, '06010207.jsonl'), lines.join('\n') + '\n');
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({
      schema: 'trout/nhd-network/1',
      simplifyM: 20,
      clusters: [
        {
          id: '0601',
          file: 'network/0601.geojson',
          units: ['06010207'],
          bbox: [-87, 35, -85, 37],
          bytes: clusterBytes ?? Buffer.byteLength(fc),
          lines: feats.length,
        },
      ],
    }),
  );
  return { outDir, hu8Dir };
}

// The manifest writer above covers the single-cluster case; this helper gives
// the test full control of the manifest contents.
function writeRawFixture({ manifest, clusterFiles, jsonlFiles }) {
  const dir = tmpRoot();
  const outDir = path.join(dir, 'network');
  const hu8Dir = path.join(dir, 'hu8');
  fs.mkdirSync(outDir);
  fs.mkdirSync(hu8Dir);
  for (const [name, body] of Object.entries(clusterFiles ?? {}))
    fs.writeFileSync(path.join(outDir, name), body);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));
  for (const [name, body] of Object.entries(jsonlFiles ?? {}))
    fs.writeFileSync(path.join(hu8Dir, name), body);
  return { outDir, hu8Dir };
}

const straight = [
  [
    [-86.0, 36.0],
    [-86.0003, 36.0002],
  ],
];

test('clean synthetic build passes all checks', () => {
  const { outDir, hu8Dir } = writeFixture();
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, true, JSON.stringify(r.failures, null, 1));
  assert.equal(r.summary.clusters, 1);
  assert.equal(r.summary.subUnitSplits.length, 0);
});

test('C5 — triple-nested coordinates (vertex is a pair, not a position) fails', () => {
  const { outDir, hu8Dir } = writeFixture({
    features: [clusterFeature('11111111', [[straight[0].map((v) => [v])][0]])],
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(
    r.failures.some((f) => f.check === 'C5' && /nesting bug/.test(f.evidence)),
    JSON.stringify(r.failures),
  );
});

test('C5 — out-of-range coordinate fails', () => {
  const { outDir, hu8Dir } = writeFixture({
    features: [
      clusterFeature('11111111', [
        [
          [-186.0, 36.0],
          [-86.0, 36.0],
        ],
      ]),
    ],
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'C5' && /out of range/.test(f.evidence)));
});

test('C6 — duplicate consecutive vertex fails', () => {
  const dup = [
    [
      [-86.0, 36.0],
      [-86.0, 36.0],
      [-86.0003, 36.0002],
    ],
  ];
  const { outDir, hu8Dir } = writeFixture({ features: [clusterFeature('11111111', dup)] });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'C6' && /duplicate/.test(f.evidence)));
});

test('C6 — fold-back (turn >135° on <60 m segments) fails', () => {
  const hairpin = [
    [
      [-86.0, 36.0],
      [-86.0003, 36.0], // ~27 m east
      [-86.0, 36.0], // straight back — 180° turn on a <60 m segment
      [-86.0002, 36.0001],
    ],
  ];
  const { outDir, hu8Dir } = writeFixture({ features: [clusterFeature('11111111', hairpin)] });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'C6' && /fold-back/.test(f.evidence)));
});

test('C2 — byte count mismatch vs manifest fails', () => {
  const { outDir, hu8Dir } = writeFixture({ clusterBytes: 1 });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'C2' && /manifest/.test(f.evidence)));
});

test('C2 — byte cap is enforced per cluster', () => {
  const { outDir, hu8Dir } = writeFixture();
  const r = runNetworkValidation({ outDir, hu8Dir, maxFileBytes: 10 });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'C2' && /> 10/.test(f.evidence)));
});

test('C4 — missing name/pid/hu8 fails', () => {
  const bad = {
    type: 'Feature',
    properties: { kind: 'minor-water', ftype: 460, lengthKm: 1 },
    geometry: { type: 'MultiLineString', coordinates: straight },
  };
  const { outDir, hu8Dir } = writeFixture({ features: [bad] });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  for (const field of ['name', 'pid', 'hu8'])
    assert.ok(
      r.failures.some((f) => f.check === 'C4' && f.evidence.includes(field)),
      `no C4 failure for ${field}`,
    );
});

test('C7 — feature outside the manifest bbox fails', () => {
  const { outDir, hu8Dir } = writeRawFixture({
    manifest: {
      schema: 'trout/nhd-network/1',
      simplifyM: 20,
      clusters: [
        {
          id: '0601',
          file: 'network/0601.geojson',
          units: ['06010207'],
          // bbox far from the feature's true location
          bbox: [-80, 30, -79, 31],
          bytes: 0,
          lines: 1,
        },
      ],
    },
    clusterFiles: {
      '0601.geojson': JSON.stringify({
        type: 'FeatureCollection',
        features: [clusterFeature('11111111', straight)],
      }),
    },
    jsonlFiles: { '06010207.jsonl': writeJsonlFeature('11111111', straight[0]) + '\n' },
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'C7' && /outside cluster bbox/.test(f.evidence)));
});

test('U2 — source unit claimed by no cluster fails; U3 catches a non-degenerate line gap', () => {
  const { outDir, hu8Dir } = writeFixture({
    // the shipped unit is short one non-degenerate line (a U3 gap) ...
    jsonl: [writeJsonlFeature('11111111', straight[0]), writeJsonlFeature('22222222', straight[0])],
  });
  // ... and a second, wholly unclaimed unit file — no cluster lists 06999999
  fs.writeFileSync(
    path.join(hu8Dir, '06999999.jsonl'),
    writeJsonlFeature('33333333', straight[0], 'Unclaimed Creek') + '\n',
  );
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(
    r.failures.some(
      (f) => f.check === 'U2' && f.id === '06999999' && /claimed by no cluster/.test(f.evidence),
    ),
    JSON.stringify(r.failures),
  );
  assert.ok(
    r.failures.some((f) => f.check === 'U3' && /pipeline expects/.test(f.evidence)),
    'non-degenerate gap must fail U3',
  );
});

test('U3 — degenerate-only gap is legitimate (single-vertex source line)', () => {
  const { outDir, hu8Dir } = writeFixture({
    jsonl: [writeJsonlFeature('11111111', straight[0]), writeJsonlFeature('22222222', [[-86, 36]])],
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, true, JSON.stringify(r.failures, null, 1));
  assert.equal(r.summary.gapUnits, 1);
  assert.equal(r.summary.degenerateDrops, 1);
});

test('U3 — emitted > source is never legitimate', () => {
  const { outDir, hu8Dir } = writeFixture({
    features: [
      clusterFeature('11111111', straight),
      clusterFeature('33333333', straight, { name: 'Phantom Creek' }),
    ],
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'U3' && /never legitimate/.test(f.evidence)));
});

test('U1/U4 — sub-unit split with exact pid partition passes and is recorded', () => {
  const half = [
    [
      [-86.0, 36.0],
      [-86.0003, 36.0002],
    ],
  ];
  const other = [
    [
      [-86.1, 36.1],
      [-86.1003, 36.1002],
    ],
  ];
  const a = JSON.stringify({
    type: 'FeatureCollection',
    features: [clusterFeature('11111111', half)],
  });
  const b = JSON.stringify({
    type: 'FeatureCollection',
    features: [clusterFeature('22222222', other, { name: 'Split Creek' })],
  });
  const { outDir, hu8Dir } = writeRawFixture({
    manifest: {
      schema: 'trout/nhd-network/1',
      simplifyM: 20,
      clusters: [
        {
          id: '0601aaa',
          file: 'network/0601aaa.geojson',
          units: ['06010207'],
          bbox: [-87, 35, -85, 37],
          bytes: Buffer.byteLength(a),
          lines: 1,
        },
        {
          id: '0601aab',
          file: 'network/0601aab.geojson',
          units: ['06010207'],
          bbox: [-87, 35, -85, 37],
          bytes: Buffer.byteLength(b),
          lines: 1,
        },
      ],
    },
    clusterFiles: { '0601aaa.geojson': a, '0601aab.geojson': b },
    jsonlFiles: {
      '06010207.jsonl':
        writeJsonlFeature('11111111', half[0]) +
        '\n' +
        writeJsonlFeature('22222222', other[0]) +
        '\n',
    },
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, true, JSON.stringify(r.failures, null, 1));
  assert.deepEqual(r.summary.subUnitSplits, [
    { hu8: '06010207', clusters: ['0601aaa', '0601aab'] },
  ]);
});

test('U4 — same pid shipped in both split siblings fails (duplicate ship)', () => {
  const half = [
    [
      [-86.0, 36.0],
      [-86.0003, 36.0002],
    ],
  ];
  const a = JSON.stringify({
    type: 'FeatureCollection',
    features: [clusterFeature('11111111', half)],
  });
  const b = JSON.stringify({
    type: 'FeatureCollection',
    features: [clusterFeature('11111111', half)],
  });
  const { outDir, hu8Dir } = writeRawFixture({
    manifest: {
      schema: 'trout/nhd-network/1',
      simplifyM: 20,
      clusters: [
        {
          id: '0601aaa',
          file: 'network/0601aaa.geojson',
          units: ['06010207'],
          bbox: [-87, 35, -85, 37],
          bytes: Buffer.byteLength(a),
          lines: 1,
        },
        {
          id: '0601aab',
          file: 'network/0601aab.geojson',
          units: ['06010207'],
          bbox: [-87, 35, -85, 37],
          bytes: Buffer.byteLength(b),
          lines: 1,
        },
      ],
    },
    clusterFiles: { '0601aaa.geojson': a, '0601aab.geojson': b },
    jsonlFiles: { '06010207.jsonl': writeJsonlFeature('11111111', half[0]) + '\n' },
  });
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'U4' && /shipped 2x, source 1x/.test(f.evidence)));
});

test('M2 — orphan file on disk (not in manifest) fails', () => {
  const { outDir, hu8Dir } = writeFixture();
  fs.writeFileSync(path.join(outDir, '0999.geojson'), '{"type":"FeatureCollection","features":[]}');
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(
    r.failures.some(
      (f) => f.check === 'M2' && f.id === 'file-set' && /vs manifest/.test(f.evidence),
    ),
  );
});

test('M1 — wrong schema fails and short-circuits to not-ok', () => {
  const dir = tmpRoot();
  const outDir = path.join(dir, 'network');
  const hu8Dir = path.join(dir, 'hu8');
  fs.mkdirSync(outDir);
  fs.mkdirSync(hu8Dir);
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ schema: 'some/other/2', clusters: [] }),
  );
  const r = runNetworkValidation({ outDir, hu8Dir });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.check === 'M1'));
});
