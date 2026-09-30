import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StockingEventSchema } from '@trout/contracts';
import { runStockingJob, saveRawArtifacts } from '../src/ingest/stockingJob.js';
import { getAdapter, getAdapters } from '../src/ingest/stocking/index.js';
import {
  extractDatatableJsonPaths,
  normalizeTwra,
  parseInlineTable,
  parseMonthInitials,
  resolveDate,
  TWRA_PAGE_URL,
} from '../src/ingest/stocking/tn.js';
import type { RawFetch } from '../src/ingest/stocking/types.js';
import { makeEnv, mockFetch, readFixture, type TestEnv } from './helpers.js';

const NOW = new Date('2026-09-02T16:00:00Z');

function rawFromFixtures(files: string[]): RawFetch {
  return {
    artifacts: files.map((f) => ({
      suffix: f.endsWith('.json') ? 'exceldriven.json' : 'html',
      content: readFixture(`TN/${f}`),
      url: TWRA_PAGE_URL,
    })),
    fetchedAt: NOW.toISOString(),
  };
}

describe('TWRA adapter — normalize (pure)', () => {
  it('normalizes the recorded 2026 schedule into hundreds of valid events', () => {
    const result = normalizeTwra(rawFromFixtures(['2026-09-02.html', '2026-09-02.exceldriven.json']), { now: NOW });
    expect(result.events.length).toBeGreaterThan(500);
    expect(result.warnings).toHaveLength(0);

    for (const e of result.events) {
      const parsed = StockingEventSchema.safeParse(e);
      expect(parsed.success).toBe(true);
    }
    // Deterministic, deduped ids; sorted by date.
    const ids = new Set(result.events.map((e) => e.id));
    expect(ids.size).toBe(result.events.length);
  });

  it('maps exact days, week-of Sundays, TBD months, and recurring month lists', () => {
    const html = '<html><body>irrelevant — json carries the rows</body></html>';
    const json = JSON.stringify({
      data: [
        { REGION: '4', COUNTY: 'Sullivan', LOCATION: 'Exact Day Creek', TYPE: 'Seasonal', 'STOCKING DAY': '4/15/2026', 'STOCKING WEEK': '', 'STOCKING MONTHS': '', SPECIES: 'Rainbow Trout' },
        { REGION: '4', COUNTY: 'Unicoi', LOCATION: 'Week Of Creek', TYPE: 'Seasonal', 'STOCKING DAY': '', 'STOCKING WEEK': '6/7/2026', 'STOCKING MONTHS': '', SPECIES: 'Rainbow Trout' },
        { REGION: '1', COUNTY: 'Caroll', LOCATION: 'TBD Pond', TYPE: 'Winter', 'STOCKING DAY': 'TBD 12/2026', 'STOCKING WEEK': '', 'STOCKING MONTHS': '', SPECIES: 'Rainbow Trout' },
        { REGION: '3', COUNTY: 'Polk', LOCATION: 'Hiwassee River', TYPE: 'Tailwater', 'STOCKING DAY': '', 'STOCKING WEEK': '', 'STOCKING MONTHS': 'N, D', SPECIES: 'Rainbow, Brown Trout' },
      ],
    });
    const result = normalizeTwra(
      { artifacts: [{ suffix: 'html', content: html, url: TWRA_PAGE_URL }, { suffix: 'exceldriven.json', content: json, url: TWRA_PAGE_URL }], fetchedAt: NOW.toISOString() },
      { now: NOW },
    );
    const byStream = new Map(result.events.map((e) => [e.streamName, e]));
    expect(byStream.get('Exact Day Creek')?.date).toBe('2026-04-15');
    expect(byStream.get('Week Of Creek')?.date).toBe('2026-06-07');
    expect(byStream.get('TBD Pond')?.date).toBe('2026-12-01');
    // Month list expands to the next occurrence; multi-species rows emit one event each.
    const hiwassee = result.events.filter((e) => e.streamName === 'Hiwassee River');
    expect(hiwassee.map((e) => e.species).sort()).toEqual(['brown', 'rainbow']);
    expect(hiwassee.every((e) => e.date === '2026-11-01')).toBe(true);
  });

  it('soft-fails on a redesigned page (inline-table fallback then stale-data warning)', () => {
    const redesign = normalizeTwra(rawFromFixtures(['2026-09-03-redesign.html']), { now: NOW });
    expect(redesign.events.length).toBeGreaterThan(0);
    expect(redesign.warnings.join(' ')).toContain('inline-table fallback');

    const garbage = normalizeTwra(rawFromFixtures(['2026-09-04-garbage.html']), { now: NOW });
    expect(garbage.events).toHaveLength(0);
    expect(garbage.warnings.join(' ')).toContain('soft-fail');
  });

  it('extracts the excel-driven JSON paths from the real page config', () => {
    const paths = extractDatatableJsonPaths(readFixture('TN/2026-09-02.html'));
    // The recorded page wires two datatable configs; both carry an excel-driven JSON.
    expect(paths.length).toBeGreaterThanOrEqual(1);
    expect(paths.every((p) => p.includes('.exceldriven.json'))).toBe(true);
  });

  it('parses month-initial lists by position (J,F,M,A,M,J,J,A,S,O,N,D)', () => {
    expect(parseMonthInitials('J, F, M, A, M, J, J, A, S, O, N, D')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(parseMonthInitials('N, D')).toEqual([11, 12]);
    expect(parseMonthInitials('M, A, M, J, J, A, S')).toEqual([3, 4, 5, 6, 7, 8, 9]);
  });

  it('resolves month-only rows to the NEAREST listed month, not the first (F35)', () => {
    const lateSept = new Date('2026-09-29T12:00:00Z');
    // The audit's exact cases: Tims Ford lists M–D but used to resolve to March 2027;
    // Normandy lists J,F,M,N,D but used to resolve to January 2027.
    expect(resolveDate({ 'STOCKING MONTHS': 'M, A, M, J, J, A, S, O, N, D' } as never, lateSept).date).toBe('2026-09-01');
    expect(resolveDate({ 'STOCKING MONTHS': 'J, F, M, N, D' } as never, lateSept).date).toBe('2026-11-01');
    expect(resolveDate({ 'STOCKING MONTHS': 'M, A, M, J, J, A, S' } as never, lateSept).date).toBe('2026-09-01');
    // Current month counts as current/future: nearest listed month at/after now.
    expect(resolveDate({ 'STOCKING MONTHS': 'J, F, M, S' } as never, new Date('2026-09-15T12:00:00Z')).date).toBe('2026-09-01');
    expect(resolveDate({ 'STOCKING MONTHS': 'F, N, D' } as never, lateSept).date).toBe('2026-11-01');
  });

  it('rolls a month-only row to next year only after ALL listed months passed (F35)', () => {
    const lateSept = new Date('2026-09-29T12:00:00Z');
    expect(resolveDate({ 'STOCKING MONTHS': 'M, A' } as never, lateSept).date).toBe('2027-03-01');
    expect(resolveDate({ 'STOCKING MONTHS': 'A' } as never, lateSept).date).toBe('2027-04-01');
    // Year boundary: December with a J,F,M schedule rolls to January.
    expect(resolveDate({ 'STOCKING MONTHS': 'J, F, M' } as never, new Date('2026-12-15T12:00:00Z')).date).toBe('2027-01-01');
  });

  it('month-only rows keep month precision and first-of-month (never a fabricated day)', () => {
    const lateSept = new Date('2026-09-29T12:00:00Z');
    for (const months of ['M, A, M, J, J, A, S, O, N, D', 'J, F, M, N, D', 'M, A']) {
      const r = resolveDate({ 'STOCKING MONTHS': months } as never, lateSept);
      expect(r.precision).toBe('month');
      expect(r.date?.endsWith('-01')).toBe(true);
      expect(r.warnings).toEqual([]);
    }
  });

  it('inline-table parser maps header names to row fields', () => {
    const { rows, warnings } = parseInlineTable(readFixture('TN/2026-09-03-redesign.html'));
    expect(warnings).toHaveLength(0);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.LOCATION).toContain('Hiwassee');
    expect(rows[0]?.SPECIES).toBe('Rainbow, Brown Trout');
  });
});

describe('runStockingJob', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('fetches live, saves raw artifacts, upserts contract-valid events', async () => {
    const { fetchImpl } = mockFetch(200, (url) => {
      if (url === TWRA_PAGE_URL) return readFixture('TN/2026-09-02.html');
      if (url.includes('.exceldriven.json')) return readFixture('TN/2026-09-02.exceldriven.json');
      throw new Error(`unexpected URL ${url}`);
    });
    const result = await runStockingJob(
      env.db,
      { fetchImpl, userAgent: 'test-agent/1.0', rawDir: env.rawDir, now: NOW },
    );
    expect(result.ok).toBe(true);
    expect(result.items).toBeGreaterThan(500);

    // Raw snapshot saved on every fetch (non-negotiable #2), collision-proof (F36):
    // one file per fetched artifact — {runStamp}.{seq}.{kind?}.{source-slug}.{suffix} —
    // plus a manifest.json. The mock page wires TWO datatable URLs (both answered with
    // the schedule fixture); each must land in its OWN file, never overwrite the other.
    const tnDir = join(env.rawDir, 'TN');
    const files = readdirSync(tnDir).sort();
    expect(files.length).toBe(4); // html + 2 distinct json captures + manifest
    expect(files.filter((f) => f.endsWith('.exceldriven.json')).length).toBe(2);
    expect(files.some((f) => f.endsWith('manifest.json'))).toBe(true);
    expect(files.every((f) => f.startsWith('20260902T160000Z'))).toBe(true);

    const rows = env.db.prepare('SELECT COUNT(*) AS n FROM stocking_events').get() as { n: number };
    expect(rows.n).toBe(result.items);

    // Idempotent re-run: upserts, no duplicates.
    const again = await runStockingJob(env.db, { fetchImpl, userAgent: 'test-agent/1.0', rawDir: env.rawDir, now: NOW });
    expect(again.items).toBe(result.items);
    const after = env.db.prepare('SELECT COUNT(*) AS n FROM stocking_events').get() as { n: number };
    expect(after.n).toBe(result.items);
  });

  it('soft-fails when pointed at a 404: error rows, stale data kept, process survives', async () => {
    const { fetchImpl } = mockFetch(404, () => 'gone');
    const result = await runStockingJob(
      env.db,
      { fetchImpl, userAgent: 'test-agent/1.0', rawDir: env.rawDir, now: NOW },
    );
    expect(result.ok).toBe(false);

    const state = env.db
      .prepare("SELECT status, detail FROM jobs_log WHERE job='stocking:TN' ORDER BY id DESC LIMIT 1")
      .get() as { status: string; detail: string | null };
    expect(state.status).toBe('error');
    expect(state.detail).toContain('HTTP 404');

    const parent = env.db
      .prepare("SELECT status, detail FROM jobs_log WHERE job='stocking' ORDER BY id DESC LIMIT 1")
      .get() as { status: string; detail: string | null };
    expect(parent.status).toBe('error');
    expect(parent.detail).toContain('soft-fail');
  });

  it('records raw artifacts via saveRawArtifacts helper', () => {
    const raw: RawFetch = {
      artifacts: [{ suffix: 'html', content: '<html></html>', url: TWRA_PAGE_URL }],
      fetchedAt: NOW.toISOString(),
    };
    const written = saveRawArtifacts(env.rawDir, 'TN', NOW, raw);
    expect(written.length).toBe(1);
    expect(existsSync(written[0] as string)).toBe(true);
    expect(existsSync(join(env.rawDir, 'TN', '20260902T160000Z.00.trout-information-stockings.html'))).toBe(true);
    expect(existsSync(join(env.rawDir, 'TN', '20260902T160000Z.manifest.json'))).toBe(true);
  });
});

describe('adapter registry', () => {
  it('registers exactly the TN adapter (v1 launch state)', () => {
    expect(getAdapters().map((a) => a.stateId)).toEqual(['TN']);
    expect(getAdapter('TN')?.sourceUrl).toContain('tn.gov/twra');
    expect(getAdapter('ZZ')).toBeUndefined();
  });
});
