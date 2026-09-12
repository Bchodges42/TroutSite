// T1-8 regression: prerender must never publish fixture stocking data as real
// "reported releases", and must fail loudly when real snapshots are missing
// unless --allow-fixtures is passed.
// Run with: node --test apps/web/scripts/prerender.test.mjs  (requires a prior
// `vite build` so dist/index.html exists — skips honestly otherwise).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url)); // apps/web/scripts
const appRoot = join(scriptDir, '..');
const HIDDEN = [];
const hide = (rel) => {
  const p = join(appRoot, rel);
  if (existsSync(p)) {
    renameSync(p, `${p}.prerender-test-hold`);
    HIDDEN.push(p);
  }
};
const restoreAll = () => {
  for (const p of HIDDEN.splice(0)) renameSync(`${p}.prerender-test-hold`, p);
};

function runPrerender(args = []) {
  const r = spawnSync('node', [join(scriptDir, 'prerender.mjs'), ...args], {
    cwd: appRoot,
    encoding: 'utf8',
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

describe('prerender fixture policy (T1-8)', () => {
  it('fails loudly without snapshots and without --allow-fixtures', { skip: !existsSync(join(appRoot, 'dist', 'index.html')) && 'dist/index.html missing — run vite build first' }, () => {
    try {
      hide('public/v1');
      hide('public/content');
      assert.ok(!existsSync(join(appRoot, 'public', 'v1')), 'test setup failed to hide public/v1');
      const r = runPrerender();
      assert.equal(r.status, 1, `expected exit 1, got ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
      assert.match(r.stderr, /refusing to publish fixture data/i);
      assert.match(r.stderr, /--allow-fixtures/);
    } finally {
      restoreAll();
    }
  });

  it('with --allow-fixtures renders sample wording, never "reported releases"', { skip: !existsSync(join(appRoot, 'dist', 'index.html')) && 'dist/index.html missing — run vite build first' }, () => {
    try {
      hide('public/v1');
      hide('public/content');
      const r = runPrerender(['--allow-fixtures']);
      assert.equal(r.status, 0, `expected exit 0, got ${r.status}\nstderr: ${r.stderr}`);
      assert.match(r.stderr, /--allow-fixtures in effect/);
      const page = readFileSync(join(appRoot, 'dist', 'stocking', 'index.html'), 'utf8');
      assert.ok(!page.includes('reported releases'), 'fixture stocking page must not say "reported releases"');
      assert.match(page, /[Ss]ample data|NOT live TWRA data/);
    } finally {
      restoreAll();
    }
    // Re-render with the real snapshots so dist/ is left in the honest state.
    mkdirSync(join(appRoot, 'dist'), { recursive: true });
    if (existsSync(join(appRoot, 'dist', 'index.html')) && existsSync(join(appRoot, 'public', 'v1'))) {
      runPrerender();
    }
  });
});
