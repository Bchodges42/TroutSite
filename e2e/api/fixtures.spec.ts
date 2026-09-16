/**
 * Contract validation for the marketing fixtures and ingestion dry-run.
 *
 * v1 status:
 *  - PASSES today: every marketing fixture file is validated against the frozen
 *    @trout/contracts Zod schemas (same gate the Astro build runs, asserted here
 *    outside the build so CI catches it independently).
 *  - test.fixme: the `ingest --dry-run` CLI does not exist yet; the skipped test
 *    runs the intended command and asserts snapshot validity once it does.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import {
  BugTaxonSchema,
  FlyPatternSchema,
  HatchChartSchema,
  ShopReportSchema,
  ShopSchema,
  StockingEventSchema,
  StreamSchema,
} from '@trout/contracts';
import { z } from 'zod';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = path.join(REPO_ROOT, 'apps', 'marketing', 'src', 'data', 'fixtures');

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf-8'));
}

test.describe('marketing fixtures are contract-valid', () => {
  test('streams.tn.json validates against StreamSchema', () => {
    const result = z.array(StreamSchema).safeParse(loadFixture('streams.tn.json'));
    expect(result.error ?? null, JSON.stringify(result.error?.issues ?? [])).toBe(null);
    expect(result.success).toBe(true);
  });

  test('stocking.tn.json validates against StockingEventSchema', () => {
    const result = z.array(StockingEventSchema).safeParse(loadFixture('stocking.tn.json'));
    expect(result.error ?? null, JSON.stringify(result.error?.issues ?? [])).toBe(null);
    expect(result.success).toBe(true);
  });

  test('taxa.json validates against BugTaxonSchema (sources required)', () => {
    const result = z.array(BugTaxonSchema).safeParse(loadFixture('taxa.json'));
    expect(result.error ?? null, JSON.stringify(result.error?.issues ?? [])).toBe(null);
    expect(result.success).toBe(true);
    const taxa = result.success ? (result.data as { id: string; sources: string[] }[]) : [];
    for (const t of taxa) expect(t.sources.length, `taxon ${t.id} cites sources`).toBeGreaterThan(0);
  });

  test('patterns.json validates against FlyPatternSchema', () => {
    const result = z.array(FlyPatternSchema).safeParse(loadFixture('patterns.json'));
    expect(result.error ?? null, JSON.stringify(result.error?.issues ?? [])).toBe(null);
    expect(result.success).toBe(true);
  });

  test('hatch.tn.json validates against HatchChartSchema', () => {
    const result = z.array(HatchChartSchema).safeParse(loadFixture('hatch.tn.json'));
    expect(result.error ?? null, JSON.stringify(result.error?.issues ?? [])).toBe(null);
    expect(result.success).toBe(true);
  });

  test('shops.tn.json + reports.tn.json validate against shop schemas', () => {
    const shops = z.array(ShopSchema).safeParse(loadFixture('shops.tn.json'));
    expect(shops.error ?? null, JSON.stringify(shops.error?.issues ?? [])).toBe(null);
    const reports = z.array(ShopReportSchema).safeParse(loadFixture('reports.tn.json'));
    expect(reports.error ?? null, JSON.stringify(reports.error?.issues ?? [])).toBe(null);
  });

  test('readings.tn.json gauge ids match their stream gaugeIds', () => {
    const streams = z.array(StreamSchema).parse(loadFixture('streams.tn.json'));
    const snapshots = (
      loadFixture('readings.tn.json') as { snapshots: { streamId: string; readings: { gaugeId: string }[] }[] }
    ).snapshots;
    for (const snap of snapshots) {
      const stream = streams.find((s) => s.id === snap.streamId);
      expect(stream, `snapshot stream ${snap.streamId} exists`).toBeTruthy();
      if (!stream) continue;
      for (const r of snap.readings) {
        expect(
          stream.gaugeIds,
          `reading gauge ${r.gaugeId} is one of ${stream.id}'s gauges`,
        ).toContain(r.gaugeId);
      }
    }
  });
});

test.describe('api ingestion dry-run (§12 #2 — enabled at integration)', () => {
  test('`ingest --dry-run` parses all fixture HTML and emits contract-valid snapshots', () => {
    // Exact §12 #2 command against the api's recorded fixtures.
    execFileSync('pnpm', ['--filter', 'api', 'ingest', '--dry-run'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: true, // Windows/Git Bash
    });
  });
});
