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
    // fixtures/USGS: 2 recorded responses; fixtures/TN: 3 dated artifact sets;
    // fixtures/TVA: 2 observed-data captures; TN evidence parser: 1 page+json set.
    expect(result.fixtureSets).toBe(9);
    expect(result.readings).toBeGreaterThanOrEqual(2);
    // Evidence-layer parses of the same fixtures (data-sources lane):
    expect(result.observations).toBeGreaterThanOrEqual(2);
    expect(result.evidenceStockingEvents).toBeGreaterThan(500);
    // Real 2026 TWRA schedule → hundreds of events; redesign fallback adds a few.
    expect(result.events).toBeGreaterThan(500);
    // The 2026-09-04 group now carries real schedule JSON, so the adapter parses
    // it clean; its recent-report grid rows hit the schedule adapter as tolerant
    // skips (documented noise from the two-grid page).
    expect(result.warnings.join(' ')).toContain('row without LOCATION skipped');

    // No writes: no snapshots, no raw captures.
    expect(existsSync(env.snapshotsDir)).toBe(false);
    expect(existsSync(join(env.rawDir, 'TN'))).toBe(false);
  });
});
