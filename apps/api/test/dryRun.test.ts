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
    // fixtures/USGS: 2 recorded responses; fixtures/TN: 3 dated artifact sets.
    expect(result.fixtureSets).toBe(5);
    expect(result.readings).toBeGreaterThanOrEqual(2);
    // Real 2026 TWRA schedule → hundreds of events; redesign fallback adds a few.
    expect(result.events).toBeGreaterThan(500);
    // Soft-fail warning from the garbage fixture is expected and surfaced.
    expect(result.warnings.join(' ')).toContain('soft-fail');

    // No writes: no snapshots, no raw captures.
    expect(existsSync(env.snapshotsDir)).toBe(false);
    expect(existsSync(join(env.rawDir, 'TN'))).toBe(false);
  });
});
