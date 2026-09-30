import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { App, RouteFallback } from '../src/App';
import { SettingsProvider } from '../src/lib/settings';
import {
  MAPLIBRE_MARKER,
  builtJsChunks,
  checkBundleSplit,
  eagerClosure,
  parseHtmlEntry,
} from '../scripts/bundle-split-check.mjs';

/**
 * F31 route-splitting guards, at two levels:
 *
 *  1. Source level — App.tsx must keep every page behind React.lazy, so a
 *     re-added static page import (which would silently pull MapLibre back
 *     into the entry) fails here.
 *  2. Artifact level — checkBundleSplit runs against the REAL dist (when one
 *     has been built) and asserts the eager entry graph is maplibre-free, the
 *     lazy MapPage chunk exists outside it, every built chunk is in the SW
 *     precache manifest, and the install-time budget holds. The same gate
 *     also runs on every `pnpm build` / `build:fixtures` (see package.json),
 *     so a dist-less unit-test run skips the artifact part without weakening
 *     enforcement.
 */

afterEach(cleanup);

describe('App.tsx lazy route boundaries (source level)', () => {
  const appSource = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');

  it('imports no page statically — every page load goes through lazy import()', () => {
    // A static `from './pages/…'` / `from './features/…'` import would put that
    // page (and, through the map page, MapLibre) back into the entry bundle.
    expect(appSource).not.toMatch(/from\s+'\.\/pages\//);
    expect(appSource).not.toMatch(/from\s+'\.\/features\//);
    // The only component import left eager is the shell.
    expect(appSource).toMatch(/import\s+\{ AppShell \}\s+from\s+'\.\/components\/layout\/AppShell';/);
  });

  it('wraps every route page in lazy(() => import(…))', () => {
    const lazyCount = [...appSource.matchAll(/=\s*lazy\(\(\)\s*=>/g)].length;
    // 23 routes in App: 21 unique page components (FishingInfoPage is reused
    // by /fishing-info and /regulations; the site-improvement line adds
    // MyWaters, Compare, Trips, Corrections, CorrectionsReview) + MapPage +
    // BrowsePage.
    expect(lazyCount).toBe(21);
    expect(appSource).toContain('<Suspense fallback={<RouteFallback />}>');
  });

  it('keeps only the shell as an eager component import', () => {
    const eagerImports = [...appSource.matchAll(/^import\s+\{[^}]+\}\s+from\s+'([^']+)';$/gm)].map(
      (m) => m[1],
    );
    expect(eagerImports).toEqual(
      expect.arrayContaining(['react', 'react-router-dom', './components/layout/AppShell']),
    );
    expect(eagerImports.filter((s) => s !== './components/layout/AppShell')).toEqual([
      'react',
      'react-router-dom',
    ]);
  });
});

describe('RouteFallback (lazy boundary placeholder)', () => {
  it('announces loading as a polite status region', () => {
    render(<RouteFallback />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });
});

describe('App renders a non-map route through the lazy boundary', () => {
  it('mounts /logbook from its lazy chunk (providers as in main.tsx)', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <SettingsProvider>
          <MemoryRouter initialEntries={['/logbook']}>
            <App />
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>,
    );
    // Resolving this heading proves the Suspense boundary fell back and then
    // resolved the lazily-imported LogbookPage.
    expect(await screen.findByRole('heading', { name: 'Logbook' })).toBeTruthy();
  });
});

// ---- artifact-level helpers (synthetic dist fixtures) ----------------------

function makeDist({ chunks, htmlEntry }: { chunks: Record<string, string>; htmlEntry: string }) {
  const files = Object.keys(chunks);
  return {
    files,
    readAsset: (f: string) => chunks[f] ?? null,
    sizeOf: (f: string) => chunks[f]?.length ?? 0,
    html: `<html><head></head><body><script type="module" crossorigin src="/${htmlEntry}"></script></body></html>`,
  };
}

const SW_MANIFEST = (urls: string[]) =>
  `workbox.precacheAndRoute([${urls.map((u) => `{url:"${u}",revision:null}`).join(',')}]);`;

describe('checkBundleSplit (artifact level, synthetic dist)', () => {
  it('passes a split dist: maplibre only in a lazy chunk, all chunks precached', () => {
    const dist = makeDist({
      htmlEntry: 'assets/index-entry.js',
      chunks: {
        'index.html': '',
        'sw.js': SW_MANIFEST([
          'assets/index-entry.js',
          'assets/vendor.js',
          'assets/app.js',
          'assets/MapPage-abc.js',
          'sw.js',
        ]),
        'assets/index-entry.js': 'import{a}from"./vendor.js";import"./app.js";',
        'assets/vendor.js': 'export const a=1;',
        'assets/app.js': 'const m=import("./MapPage-abc.js");',
        'assets/MapPage-abc.js': `const lib="${MAPLIBRE_MARKER}";`,
      },
    });
    const { ok, problems } = checkBundleSplit(dist);
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it('fails when the entry statically reaches the map chunk', () => {
    const dist = makeDist({
      htmlEntry: 'assets/index-entry.js',
      chunks: {
        'index.html': '',
        'sw.js': SW_MANIFEST(['assets/index-entry.js', 'assets/MapPage-abc.js']),
        'assets/index-entry.js': 'import"./MapPage-abc.js";',
        'assets/MapPage-abc.js': `${MAPLIBRE_MARKER}-gl map`,
      },
    });
    const { ok, problems } = checkBundleSplit(dist);
    expect(ok).toBe(false);
    expect(problems.some((p) => p.includes('statically reachable'))).toBe(true);
  });

  it('fails when a built chunk is missing from the SW precache manifest', () => {
    const dist = makeDist({
      htmlEntry: 'assets/index-entry.js',
      chunks: {
        'index.html': '',
        'sw.js': SW_MANIFEST(['assets/index-entry.js']),
        'assets/index-entry.js': 'const m=import("./LogbookPage-x.js");',
        'assets/LogbookPage-x.js': 'logbook',
        'assets/MapPage-abc.js': MAPLIBRE_MARKER,
      },
    });
    const { ok, problems } = checkBundleSplit(dist);
    expect(ok).toBe(false);
    expect(problems.some((p) => p.includes('missing from the SW precache manifest'))).toBe(true);
  });

  it('fails when no lazy map chunk carries maplibre', () => {
    const dist = makeDist({
      htmlEntry: 'assets/index-entry.js',
      chunks: {
        'index.html': '',
        'sw.js': SW_MANIFEST(['assets/index-entry.js']),
        'assets/index-entry.js': 'export {};',
      },
    });
    const { ok, problems } = checkBundleSplit(dist);
    expect(ok).toBe(false);
    expect(problems.some((p) => p.includes('no assets/MapPage-'))).toBe(true);
  });

  it('fails the install budget when the precached set exceeds 25 MB', () => {
    const big = 'x'.repeat(26 * 1024 * 1024);
    const dist = makeDist({
      htmlEntry: 'assets/index-entry.js',
      chunks: {
        'index.html': '',
        'sw.js': SW_MANIFEST(['assets/index-entry.js', 'assets/huge.js', 'sw.js']),
        'assets/index-entry.js': 'export {};',
        'assets/huge.js': big,
      },
    });
    const { ok, problems } = checkBundleSplit(dist);
    expect(ok).toBe(false);
    expect(problems.some((p) => p.includes('install-time set is'))).toBe(true);
  });

  it('fails when index.html has no module entry', () => {
    const dist = makeDist({ htmlEntry: 'assets/index-entry.js', chunks: { 'index.html': '' } });
    const { ok, problems } = checkBundleSplit({ ...dist, html: '<html><body></body></html>' });
    expect(ok).toBe(false);
    expect(problems[0]).toMatch(/no type=module script entry/);
  });
});

describe('eagerClosure / parseHtmlEntry / builtJsChunks', () => {
  it('follows static imports but not dynamic import() calls', () => {
    const chunks: Record<string, string> = {
      'assets/entry.js': 'import"./a.js";import{b}from"./b.js";const c=import("./c.js");',
      'assets/a.js': 'from"./d.js"',
      'assets/b.js': '',
      'assets/c.js': 'dynamic-only',
      'assets/d.js': '',
    };
    const closure = eagerClosure('assets/entry.js', (f) => chunks[f] ?? null);
    expect([...closure].sort()).toEqual(['assets/a.js', 'assets/b.js', 'assets/d.js', 'assets/entry.js']);
  });

  it('parses the module entry out of built index.html', () => {
    expect(parseHtmlEntry('<script type="module" crossorigin src="/assets/index-x.js">')).toBe(
      'assets/index-x.js',
    );
    expect(parseHtmlEntry('<script src="/legacy.js"></script>')).toBeNull();
  });

  it('lists only assets/*.js as built chunks', () => {
    expect(
      builtJsChunks(['assets/a.js', 'assets/b.css', 'assets/x.map', 'atlas/topo/t.webp', 'index.html']),
    ).toEqual(['assets/a.js']);
  });
});

// ---- artifact level against the REAL dist (built by pnpm build) ------------

const distDir = join(process.cwd(), 'dist');
const distReady =
  existsSync(join(distDir, 'index.html')) && existsSync(join(distDir, 'sw.js'));

describe.runIf(distReady)('built dist (real artifact)', () => {
  function walk(dir: string, prefix = ''): string[] {
    const out: string[] = [];
    for (const e of readdirSync(join(dir, prefix), { withFileTypes: true })) {
      const rel = `${prefix}${e.name}`;
      if (e.isDirectory()) out.push(...walk(dir, `${rel}/`));
      else out.push(rel);
    }
    return out;
  }
  const files = walk(distDir);
  const readAsset = (f: string) => {
    try {
      return readFileSync(join(distDir, f), 'utf8');
    } catch {
      return null;
    }
  };
  const sizeOf = (f: string) => {
    try {
      return statSync(join(distDir, f)).size;
    } catch {
      return 0;
    }
  };

  it('keeps MapLibre out of the eager entry graph and every chunk precached', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    const { ok, problems, info } = checkBundleSplit({ files, readAsset, html, sizeOf });
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
    expect(info.eagerMaplibreFree).toBe(true);
    expect(info.mapChunk).toMatch(/^assets\/MapPage-.*\.js$/);
  });
});
