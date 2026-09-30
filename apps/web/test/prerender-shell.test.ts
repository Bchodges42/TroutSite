import { describe, expect, it } from 'vitest';
import { stripPrerenderedRoot } from '../scripts/prerender-shell.mjs';

const EMPTY_ROOT = '<html><head><title>Trout</title></head><body><div id="root"></div></body></html>';

/** The exact shape prerender.mjs leaves in dist/index.html after a home-page emit. */
function prerenderedShell(homeBody: string): string {
  return (
    '<html><head><title>Home</title></head><body>' +
    `<div id="root"><div id="prerender" data-prerender="true" style="max-width:42rem">${homeBody}</div></div>` +
    '<script type="module" src="/assets/x.js"></script></body></html>'
  );
}

describe('stripPrerenderedRoot — F09 repeated-prerender shell integrity', () => {
  it('leaves a fresh vite shell (empty root) untouched', () => {
    expect(stripPrerenderedRoot(EMPTY_ROOT)).toBe(EMPTY_ROOT);
  });

  it('restores an empty root when the shell carries the previous home body', () => {
    const dirty = prerenderedShell('<h1>Home hero</h1><p>home-only marker</p>');
    const clean = stripPrerenderedRoot(dirty);
    expect(clean).not.toContain('home-only marker');
    expect(clean).toContain('<div id="root"></div>');
    expect(clean).toContain('<script type="module" src="/assets/x.js"></script>');
  });

  it('strips the full wrapper even when the home body nests divs', () => {
    const dirty = prerenderedShell('<section><div class="a"><div class="b">deep</div></div></section>');
    const clean = stripPrerenderedRoot(dirty);
    expect(clean).not.toContain('deep');
    expect(clean).toContain('<div id="root"></div>');
    expect(clean.endsWith('</body></html>')).toBe(true);
  });

  it('round-trips: stripping twice is idempotent', () => {
    const dirty = prerenderedShell('<h1>Home</h1>');
    expect(stripPrerenderedRoot(stripPrerenderedRoot(dirty))).toBe(stripPrerenderedRoot(dirty));
  });

  it('throws on a structurally impossible shell instead of emitting wrong pages', () => {
    const unbalanced = '<div id="root"><div id="prerender" data-prerender="true" style="x"><div>oops';
    expect(() => stripPrerenderedRoot(unbalanced)).toThrow(/unbalanced/);
  });
});
