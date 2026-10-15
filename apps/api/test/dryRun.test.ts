import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dryRun, pipelineConfig } from '../src/pipeline.js';
import { fixturesDir, makeEnv, type TestEnv } from './helpers.js';

describe('ingest --dry-run', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('parses every fixture (USGS + TN) against the frozen contracts and writes nothing', () => {
    const cfg = pipelineConfig(
      { TROUT_SNAPSHOTS_DIR: env.snapshotsDir, TROUT_RAW_DIR: env.rawDir },
      fixturesDir(),
    );
    const result = dryRun(cfg);

    expect(result.ok).toBe(true);
    // fixtures/USGS: 2 recorded responses; USGS-WATERDATA: 2 (03518500 + 2026-10-14 statewide);
    // fixtures/TN: 3 dated artifact sets;
    // fixtures/TVA: 4 observed-data captures (2026-09-04 + 2026-10-14 Noon/Midnight);
    // TN evidence parser: 2 page+json sets (2026-09-04, 2026-10-14 live capture).
    expect(result.fixtureSets).toBe(15);
    expect(result.readings).toBeGreaterThanOrEqual(2);
    // Evidence-layer parses of the same fixtures (data-sources lane):
    expect(result.observations).toBeGreaterThanOrEqual(2);
    expect(result.evidenceStockingEvents).toBeGreaterThan(500);
    // Real 2026 TWRA schedule → hundreds of events; redesign fallback adds a few.
    expect(result.events).toBeGreaterThan(500);
    // The two-grid page's completed-stockings report is classified by its
    // columns (status 'reported'), so its rows no longer hit the schedule
    // parser as LOCATION-less skips (audit 2026-10-14 §2).
    expect(result.warnings.join(' ')).not.toContain('row without LOCATION skipped');

    // No writes: no snapshots, no raw captures.
    expect(existsSync(env.snapshotsDir)).toBe(false);
    expect(existsSync(join(env.rawDir, 'TN'))).toBe(false);
  });
});
