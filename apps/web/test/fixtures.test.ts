import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  StreamSchema, ConditionSnapshotSchema, StockingEventSchema, HatchChartSchema,
  ShopSchema, ShopReportSchema, BugTaxonSchema, FlyPatternSchema,
} from '@trout/contracts';

/**
 * The fixture data IS the contract-conformance gate for the PWA demo path:
 * every file under fixtures/data must parse against the frozen schemas.
 * (The fixtures directory is covered by the repo-wide eslint ignore for data
 * dirs, so this test is the place that guarantee lives.)
 */

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'data');

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, rel), 'utf8'));
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

describe('fixture data conforms to the frozen contracts', () => {
  it('streams file (extensionless endpoint mirror) parses as Stream[]', () => {
    const streams = StreamSchema.array().parse(readJson('v1/streams'));
    expect(streams.length).toBeGreaterThanOrEqual(6);
    expect(streams.every((s) => s.stateId === 'TN')).toBe(true);
  });

  it('keeps the authored statewide label tiers in the fixture catalog', () => {
    const streams = StreamSchema.array().parse(readJson('v1/streams'));
    const counts = Object.fromEntries(
      ['featured', 'standard', 'reference'].map((tier) => [
        tier,
        streams.filter((stream) => stream.display === tier).length,
      ]),
    );
    expect(counts).toEqual({ featured: 38, standard: 96, reference: 16 });
  });

  it('conditions/latest parses as ConditionSnapshot[] with contract-accurate scores', () => {
    const snaps = ConditionSnapshotSchema.array().parse(readJson('v1/conditions/latest.json'));
    expect(snaps.length).toBeGreaterThanOrEqual(6);
    const bands = new Set(snaps.map((s) => (s.score.value >= 70 ? 'good' : s.score.value >= 40 ? 'fair' : 'poor')));
    // the fixture set intentionally exercises every score band for the UI
    expect(bands).toEqual(new Set(['good', 'fair', 'poor']));
  });

  it('stocking/TN parses as StockingEvent[] sorted data present', () => {
    const events = StockingEventSchema.array().parse(readJson('v1/stocking/TN.json'));
    expect(events.length).toBeGreaterThanOrEqual(10);
    expect(events.every((e) => e.sourceUrl.startsWith('https://'))).toBe(true);
  });

  it('shops/TN and reports/recent parse; every report is attributed', () => {
    const shops = ShopSchema.array().parse(readJson('v1/shops/TN.json'));
    const reports = ShopReportSchema.array().parse(readJson('v1/reports/recent.json'));
    expect(shops.length).toBeGreaterThanOrEqual(4);
    expect(reports.length).toBeGreaterThanOrEqual(3);
    for (const r of reports) {
      expect(shops.some((s) => s.id === r.shopId)).toBe(true);
      expect(r.attributionUrl).toMatch(/^https:\/\//);
    }
  });

  it('the content pack parses (taxa + patterns) with sources on every taxon', () => {
    const taxa = BugTaxonSchema.array().parse(readJson('content/taxa.json'));
    const patterns = FlyPatternSchema.array().parse(readJson('content/patterns.json'));
    expect(taxa.length).toBeGreaterThanOrEqual(10);
    expect(patterns.length).toBeGreaterThanOrEqual(12);
    expect(taxa.every((t) => t.sources.length >= 1)).toBe(true);
    const taxonIds = new Set(taxa.map((t) => t.id));
    // no orphan pattern references
    for (const p of patterns) {
      for (const tid of p.imitates) expect(taxonIds.has(tid), `${p.id} imitates unknown ${tid}`).toBe(true);
    }
  });

  it('every region/month hatch chart parses with resolvable taxa and patterns', () => {
    const hatchDir = join(fixturesDir, 'v1', 'hatch');
    if (!existsSync(hatchDir)) throw new Error('missing hatch charts');
    const taxa = BugTaxonSchema.array().parse(readJson('content/taxa.json'));
    const patterns = FlyPatternSchema.array().parse(readJson('content/patterns.json'));
    const taxonIds = new Set(taxa.map((t) => t.id));
    const patternIds = new Set(patterns.map((p) => p.id));

    let charts = 0;
    for (const region of readdirSync(hatchDir)) {
      const regionPath = join(hatchDir, region);
      if (!statSync(regionPath).isDirectory()) continue;
      for (const file of readdirSync(regionPath)) {
        const chart = HatchChartSchema.parse(readJson(`v1/hatch/${region}/${file}`));
        charts += 1;
        for (const entry of chart.entries) {
          expect(taxonIds.has(entry.taxonId), `unknown taxon ${entry.taxonId}`).toBe(true);
          for (const pid of entry.patterns) {
            expect(patternIds.has(pid), `unknown pattern ${pid}`).toBe(true);
          }
        }
      }
    }
    expect(charts).toBeGreaterThanOrEqual(30);
  });

  it('fixtures directory contains no unexpected top-level entries', () => {
    const allowed = new Set(['v1', 'content']);
    const entries = readdirSync(fixturesDir);
    expect(entries.every((e) => allowed.has(e))).toBe(true);
  });

  it('walk() helper covers all files (sanity)', () => {
    const files = [...walk(fixturesDir)];
    expect(files.length).toBeGreaterThanOrEqual(40);
  });
});
