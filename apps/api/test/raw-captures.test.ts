import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runStockingJob, saveRawArtifacts, saveRawCaptures } from '../src/ingest/stockingJob.js';
import type { RawCaptureManifest } from '../src/ingest/stockingJob.js';
import { normalizeTwra, tnAdapter, TWRA_PAGE_URL } from '../src/ingest/stocking/tn.js';
import { fetchTwraArtifacts } from '../src/evidence/twra-evidence.js';
import { runEvidenceJob } from '../src/evidence/evidenceJob.js';
import { makeEnv, readFixture, type TestEnv } from './helpers.js';

/**
 * F36 — TWRA raw captures used to name every datatable JSON `exceldriven.json`,
 * so the schedule grid and the completed-release grid overwrote each other
 * (3 fetched artifacts → 2 stored files, later grid replacing the earlier).
 * These tests pin the collision-proof capture scheme: one file per fetched
 * artifact, named by run timestamp + sequence + grid kind + stable source id,
 * with a URL/hash manifest written atomically as the run's commit record.
 */

const NOW = new Date('2026-09-29T16:30:00Z');
const STAMP = '20260929T163000Z';
const PAGE_URL = TWRA_PAGE_URL;
const PAGE = readFixture('TN/2026-09-04-stockings-page.html');
const SCHEDULE = readFixture('TN/2026-09-04-schedule.exceldriven.json');
const RECENT = readFixture('TN/2026-09-04-recent.exceldriven.json');
const SCHEDULE_URL = 'https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json';
const RECENT_URL = 'https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json';

/** The real two-grid capture: page + BOTH datatable grids (same 'exceldriven.json' suffix). */
function twoGridArtifacts(): { suffix: string; content: string; url: string; captureKind?: string }[] {
  return [
    { suffix: 'html', content: PAGE, url: PAGE_URL, captureKind: undefined },
    { suffix: 'exceldriven.json', content: SCHEDULE, url: SCHEDULE_URL, captureKind: 'schedule' },
    { suffix: 'exceldriven.json', content: RECENT, url: RECENT_URL, captureKind: 'recent' },
  ];
}

function twoGridFetch(): typeof fetch {
  return (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url === PAGE_URL) return new Response(PAGE, { status: 200 });
    if (url === SCHEDULE_URL) return new Response(SCHEDULE, { status: 200 });
    if (url === RECENT_URL) return new Response(RECENT, { status: 200 });
    throw new Error(`unexpected URL ${url}`);
  }) as typeof fetch;
}

describe('saveRawCaptures — collision-proof raw capture names (F36)', () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `trout-rawcap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('stores EVERY fetched artifact: three artifacts sharing a suffix → three distinct files', () => {
    const manifest = saveRawCaptures(dir, NOW, twoGridArtifacts());
    const files = readdirSync(dir).sort();
    // 3 artifacts + 1 manifest — nothing lost, nothing overwritten.
    expect(files.length).toBe(4);
    const jsonFiles = files.filter((f) => f.endsWith('.exceldriven.json'));
    expect(jsonFiles.length).toBe(2);
    expect(readFileSync(join(dir, jsonFiles[0] as string), 'utf8')).not.toBe(readFileSync(join(dir, jsonFiles[1] as string), 'utf8'));
    expect(manifest.artifacts.length).toBe(3);
  });

  it('names each capture with run timestamp, sequence, grid kind, and stable source id', () => {
    saveRawCaptures(dir, NOW, twoGridArtifacts());
    const files = readdirSync(dir).sort();
    expect(files).toContain(`${STAMP}.00.trout-information-stockings.html`);
    expect(files).toContain(`${STAMP}.01.schedule.tn_complex_datatable_1990410459.exceldriven.json`);
    expect(files).toContain(`${STAMP}.02.recent.tn_complex_datatable.exceldriven.json`);
    expect(files).toContain(`${STAMP}.manifest.json`);
  });

  it('manifest maps every file to its source URL, sha256, grid kind, and byte size', () => {
    saveRawCaptures(dir, NOW, twoGridArtifacts());
    const manifest = JSON.parse(readFileSync(join(dir, `${STAMP}.manifest.json`), 'utf8')) as RawCaptureManifest;
    expect(manifest.run).toBe(STAMP);
    expect(manifest.fetchedAt).toBe(NOW.toISOString());
    const byFile = new Map(manifest.artifacts.map((a) => [a.file, a]));
    const schedule = byFile.get(`${STAMP}.01.schedule.tn_complex_datatable_1990410459.exceldriven.json`);
    const recent = byFile.get(`${STAMP}.02.recent.tn_complex_datatable.exceldriven.json`);
    expect(schedule).toMatchObject({ url: SCHEDULE_URL, suffix: 'exceldriven.json', gridKind: 'schedule' });
    expect(schedule?.sha256).toBe(createHash('sha256').update(SCHEDULE, 'utf8').digest('hex'));
    expect(schedule?.bytes).toBe(Buffer.byteLength(SCHEDULE, 'utf8'));
    expect(recent).toMatchObject({ url: RECENT_URL, gridKind: 'recent' });
    // No URL appears twice: every artifact is individually addressable.
    expect(new Set(manifest.artifacts.map((a) => a.file)).size).toBe(3);
  });

  it('re-runs land beside earlier captures instead of on top of them', () => {
    saveRawCaptures(dir, NOW, twoGridArtifacts());
    const later = new Date('2026-09-29T17:45:00Z');
    saveRawCaptures(dir, later, twoGridArtifacts());
    const files = readdirSync(dir);
    expect(files.filter((f) => f.startsWith('20260929T163000Z')).length).toBe(4);
    expect(files.filter((f) => f.startsWith('20260929T174500Z')).length).toBe(4);
  });

  it('a mid-run write failure loses no manifest commit record and leaves no .tmp debris', () => {
    const realWrite = (path: string, content: string): void => {
      if (!path.endsWith('.tmp')) writeFileSync(path, content, 'utf8');
    };
    let calls = 0;
    const failing = (path: string, content: string): void => {
      calls += 1;
      if (calls === 2) throw new Error('disk full');
      realWrite(path, content);
    };
    expect(() => saveRawCaptures(dir, NOW, twoGridArtifacts(), { writeFile: failing })).toThrow('disk full');
    const files = readdirSync(dir);
    // First artifact survived atomically; the failed one left no partial file; no manifest.
    expect(files.length).toBe(1);
    expect(files[0]).toBe(`${STAMP}.00.trout-information-stockings.html`);
    expect(files.some((f) => f.includes('.tmp'))).toBe(false);
    expect(files.some((f) => f.endsWith('manifest.json'))).toBe(false);
  });

  it('default atomic writes leave no temp files behind', () => {
    saveRawCaptures(dir, NOW, twoGridArtifacts());
    expect(readdirSync(dir).some((f) => f.includes('.tmp'))).toBe(false);
  });

  it('saveRawArtifacts persists every artifact of an adapter run and returns their paths', () => {
    const written = saveRawArtifacts(dir, 'TN', NOW, {
      artifacts: twoGridArtifacts(),
      fetchedAt: NOW.toISOString(),
    });
    expect(written.length).toBe(3);
    for (const p of written) expect(existsSync(p)).toBe(true);
  });
});

describe('TWRA fetchers tag each grid by column-signature kind (F36)', () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `trout-rawtag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('stocking fetchLatest tags schedule vs recent captures', async () => {
    const raw = await tnAdapter.fetchLatest({ fetchImpl: twoGridFetch(), userAgent: 'test', rawDir: dir, now: NOW });
    expect(raw.artifacts.length).toBe(3);
    expect(raw.artifacts.map((a) => a.captureKind)).toEqual([undefined, 'schedule', 'recent']);
  });

  it('evidence fetchTwraArtifacts tags schedule vs recent captures', async () => {
    const artifacts = await fetchTwraArtifacts({ userAgent: 'test', fetchImpl: twoGridFetch() });
    expect(artifacts.length).toBe(3);
    expect(artifacts.map((a) => a.captureKind)).toEqual([undefined, 'schedule', 'recent']);
  });

  it('normalizeTwra consumes the schedule grid even when the recent grid is captured first', () => {
    const raw = {
      // Recent grid FIRST — the old code read whichever JSON came first.
      artifacts: [
        { suffix: 'html', content: '<html>stub</html>', url: PAGE_URL },
        { suffix: 'exceldriven.json', content: RECENT, url: RECENT_URL, captureKind: 'recent' },
        { suffix: 'exceldriven.json', content: SCHEDULE, url: SCHEDULE_URL, captureKind: 'schedule' },
      ],
      fetchedAt: NOW.toISOString(),
    };
    const result = normalizeTwra(raw, { now: NOW });
    expect(result.events.length).toBeGreaterThan(500); // schedule grid has 616 rows; recent has 12
  });
});

describe('runStockingJob + runEvidenceJob preserve every fetched grid on disk (F36)', () => {
  let env: TestEnv;
  let packDir: string;

  beforeEach(() => {
    env = makeEnv();
    packDir = join(env.dir, 'pack');
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('stocking job: both datatable grids survive the raw snapshot', async () => {
    const result = await runStockingJob(env.db, { fetchImpl: twoGridFetch(), userAgent: 'test', rawDir: env.rawDir, now: NOW });
    expect(result.ok).toBe(true);
    const files = readdirSync(join(env.rawDir, 'TN')).sort();
    const manifest = JSON.parse(readFileSync(join(env.rawDir, 'TN', `${STAMP}.manifest.json`), 'utf8')) as RawCaptureManifest;
    const scheduleEntry = manifest.artifacts.find((a) => a.gridKind === 'schedule');
    const recentEntry = manifest.artifacts.find((a) => a.gridKind === 'recent');
    expect(scheduleEntry && recentEntry).toBeTruthy();
    expect(readFileSync(join(env.rawDir, 'TN', scheduleEntry!.file), 'utf8')).toBe(SCHEDULE);
    expect(readFileSync(join(env.rawDir, 'TN', recentEntry!.file), 'utf8')).toBe(RECENT);
    expect(files.filter((f) => f.endsWith('.exceldriven.json')).length).toBe(2);
  });

  it('evidence job: the TWRA capture set keeps all three artifacts plus a URL/hash manifest', async () => {
    const result = await runEvidenceJob(
      env.db,
      { contentPackDir: packDir, rawDir: env.rawDir, userAgent: 'test' },
      { now: NOW, fetchImpl: twoGridFetch(), providers: { usgs: false, tva: false } },
    );
    expect(result.scheduled).toBeGreaterThan(500);
    expect(result.reportedComplete).toBeGreaterThan(0);

    const evDir = join(env.rawDir, 'evidence');
    const files = readdirSync(evDir).sort();
    expect(files.length).toBe(4); // html + schedule + recent + manifest — nothing overwritten
    const manifest = JSON.parse(readFileSync(join(evDir, `${STAMP}.manifest.json`), 'utf8')) as RawCaptureManifest;
    expect(manifest.artifacts.length).toBe(3);
    expect(manifest.artifacts.map((a) => a.gridKind)).toEqual([undefined, 'schedule', 'recent']);
    const scheduleEntry = manifest.artifacts.find((a) => a.gridKind === 'schedule');
    expect(readFileSync(join(evDir, scheduleEntry!.file), 'utf8')).toBe(SCHEDULE);
    expect(scheduleEntry?.sha256).toBe(createHash('sha256').update(SCHEDULE, 'utf8').digest('hex'));
  });
});
