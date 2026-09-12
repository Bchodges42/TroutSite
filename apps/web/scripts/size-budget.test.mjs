// Unit tests for the install-time size budget (T0-4). Pure functions, fixture
// file lists — no real dist/ needed.
// Run with: node --test apps/web/scripts/size-budget.test.mjs  (the web vitest
// config only includes test/** — wiring this into package.json/CI is noted in the
// session-b report).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  INSTALL_LIMIT_BYTES,
  judge,
  onDemandBreakdown,
  parsePrecacheManifest,
  splitBudget,
} from './size-budget.mjs';

const SW_WITH_MANIFEST = `define(["./workbox-f641ca17"],function(e){"use strict";e.precacheAndRoute([{url:"index.html",revision:"aa"},{url:"fonts/x.woff2",revision:"bb"},{url:"atlas/topo/t.pbf",revision:"cc"}]);});`;

describe('parsePrecacheManifest', () => {
  it('extracts every precache entry from a built sw.js', () => {
    assert.deepEqual(parsePrecacheManifest(SW_WITH_MANIFEST), [
      { url: 'index.html' },
      { url: 'fonts/x.woff2' },
      { url: 'atlas/topo/t.pbf' },
    ]);
  });
  it('parses real minified workbox output with a trailing options object', () => {
    const sw = 'e.precacheAndRoute([{url:"index.html",revision:"abc"},{url:"a/b.js",revision:null}],{cleanURLs:true});';
    assert.deepEqual(parsePrecacheManifest(sw), [{ url: 'index.html' }, { url: 'a/b.js' }]);
  });
  it('returns [] when there is no precacheAndRoute call', () => {
    assert.deepEqual(parsePrecacheManifest('self.skipWaiting();'), []);
  });
  it('throws on an unparseable manifest array', () => {
    assert.throws(() => parsePrecacheManifest('precacheAndRoute([not json])'), /could not parse/);
  });
});

describe('splitBudget', () => {
  const files = ['index.html', 'sw.js', 'fonts/x.woff2', 'atlas/topo/t.pbf', 'atlas/other.geojson', 'img/big.jpg'];
  it('install set = manifest entries + sw.js; everything else is on-demand', () => {
    const { installFiles, onDemandFiles } = splitBudget(files, ['index.html', 'fonts/x.woff2', 'atlas/topo/t.pbf']);
    assert.deepEqual(installFiles, ['index.html', 'sw.js', 'fonts/x.woff2', 'atlas/topo/t.pbf']);
    assert.deepEqual(onDemandFiles, ['atlas/other.geojson', 'img/big.jpg']);
  });
  it('keeps manifest entries that are absent from the file list (caller detects staleness)', () => {
    const { installFiles } = splitBudget(['index.html'], ['index.html', 'ghost.js']);
    assert.deepEqual(installFiles, ['index.html']);
  });
});

describe('judge', () => {
  it('passes when install bytes are within the limit regardless of on-demand size', () => {
    const r = judge({ installBytes: 10 * 1024 * 1024, onDemandBytes: 500 * 1024 * 1024, topoBytes: 0 });
    assert.equal(r.ok, true);
    assert.deepEqual(r.problems, []);
  });
  it('fails only on install-time overflow', () => {
    const r = judge({ installBytes: INSTALL_LIMIT_BYTES + 1, onDemandBytes: 0, topoBytes: 0 });
    assert.equal(r.ok, false);
    assert.match(r.problems[0], /install-time set is .* MB/);
  });
  it('warns when topo runtime-cached bytes exceed 100 MB without failing', () => {
    const r = judge({ installBytes: 0, onDemandBytes: 0, topoBytes: 101 * 1024 * 1024 });
    assert.equal(r.ok, true);
    assert.match(r.warns[0], /topo is 101\.00 MB/);
  });
});

describe('onDemandBreakdown', () => {
  it('aggregates bytes per top-level directory, largest first', () => {
    const sizeOf = (f) => ({ 'atlas/a.pbf': 3, 'atlas/b.pbf': 4, 'img/x.jpg': 10 }[f] ?? 0);
    assert.deepEqual(onDemandBreakdown(['img/x.jpg', 'atlas/a.pbf', 'atlas/b.pbf'], sizeOf), [
      ['img', 10],
      ['atlas', 7],
    ]);
  });
});
