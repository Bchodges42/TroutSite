import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { pipelineConfig } from '../src/pipeline.js';

// apps/api/test → repo root (same three-level walk pipeline.ts does from src/dist).
const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const cwd0 = process.cwd();
afterEach(() => process.chdir(cwd0));

it('resolves content pack / snapshots dirs from the repo root regardless of process.cwd()', () => {
  // Simulate pm2 (infra/pm2/ecosystem.config.cjs runs both api + cron with cwd=REPO_ROOT).
  // The 2026-09-08 incident: cwd-anchored defaults made the cron look for the pack at
  // <two levels above the repo>/packages/content/dist/pack → "content pack not found"
  // every hourly run while the same deploy found it fine (pnpm scripts run cwd=apps/api).
  process.chdir(repoRoot);
  const cfg = pipelineConfig({});
  expect(cfg.contentPackDir).toBe(join(repoRoot, 'packages', 'content', 'dist', 'pack'));
  expect(cfg.snapshotsDir).toBe(join(repoRoot, 'apps', 'web', 'public'));
  expect(cfg.rawDir).toBe(join(repoRoot, 'apps', 'api', 'data', 'raw'));
  expect(cfg.fixturesDir).toBe(join(repoRoot, 'apps', 'api', 'fixtures'));
});

it('also resolves correctly from the api package root (pnpm --filter api scripts)', () => {
  process.chdir(resolve(repoRoot, 'apps', 'api'));
  const cfg = pipelineConfig({});
  expect(cfg.contentPackDir).toBe(join(repoRoot, 'packages', 'content', 'dist', 'pack'));
  expect(cfg.snapshotsDir).toBe(join(repoRoot, 'apps', 'web', 'public'));
});

it('honors absolute TROUT_CONTENT_DIR / TROUT_SNAPSHOTS_DIR overrides (pm2 API_ENV)', () => {
  const cfg = pipelineConfig({
    TROUT_CONTENT_DIR: resolve(repoRoot, 'packages', 'content'),
    TROUT_SNAPSHOTS_DIR: join(repoRoot, 'apps', 'web', 'public'),
  });
  expect(cfg.contentPackDir).toBe(join(repoRoot, 'packages', 'content', 'dist', 'pack'));
  expect(cfg.snapshotsDir).toBe(join(repoRoot, 'apps', 'web', 'public'));
});
