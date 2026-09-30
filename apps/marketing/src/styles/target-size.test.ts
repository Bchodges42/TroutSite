import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
); // strip comments so selector splitting never sees prose commas

/** Extract `min-height` (px) declared inside a CSS rule whose selector list
 *  includes `selector`. Returns undefined when the rule does not set one. */
function declaredMinHeight(css: string, selector: string): number | undefined {
  for (const rule of css.split('}')) {
    const [heads, body] = rule.split('{');
    if (!heads || !body) continue;
    const selectors = heads.split(',').map((s) => s.trim());
    if (!selectors.includes(selector)) continue;
    const m = body.match(/min-height:\s*([\d.]+)px/);
    if (m) return Number(m[1]);
  }
  return undefined;
}

/** Extract `row-gap`/`gap` in px from a flex/grid `gap` declaration. */
function declaredGapPx(css: string, selector: string): number | undefined {
  for (const rule of css.split('}')) {
    const [heads, body] = rule.split('{');
    if (!heads || !body) continue;
    const selectors = heads.split(',').map((s) => s.trim());
    if (!selectors.includes(selector)) continue;
    const m = body.match(/(?:^|;|\s)gap:\s*([\d.]+)(rem|px)/);
    if (m) return Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
  }
  return undefined;
}

/** F27 (2026-09-29 audit): every marketing template failed Lighthouse's
 *  target-size audit — footer links measured 19px high with 22.2px safe
 *  space against the 24px minimum. The fix adopts the product's 44px touch
 *  convention via min-height (not font-size inflation), so this test parses
 *  the shipped CSS and pins the computed hit areas. */
describe('navigation link target sizes (F27)', () => {
  it('gives footer list links a 44px-tall hit area', () => {
    const minH = declaredMinHeight(css, '.site-footer ul a');
    expect(minH).toBeDefined();
    // Margins are 0 and box-sizing is border-box, so the declared min-height
    // IS the link box height: ≥44px convention, above the 24px Lighthouse floor.
    expect(minH!).toBeGreaterThanOrEqual(44);
  });

  it('separates stacked footer links with an explicit row gap', () => {
    const gap = declaredGapPx(css, '.site-footer ul');
    expect(gap).toBeDefined();
    // Each 44px target already clears the 24px safe-space rule on its own;
    // the gap keeps the stacked rhythm comfortable without crowding.
    expect(gap!).toBeGreaterThanOrEqual(4);
  });

  it('gives header navigation links a 44px-tall hit area', () => {
    const minH = declaredMinHeight(css, '.site-header nav a');
    expect(minH).toBeDefined();
    expect(minH!).toBeGreaterThanOrEqual(44);
  });

  it('gives the header wordmark link the same convention', () => {
    const minH = declaredMinHeight(css, '.site-header .brand');
    expect(minH).toBeDefined();
    expect(minH!).toBeGreaterThanOrEqual(44);
  });
});
