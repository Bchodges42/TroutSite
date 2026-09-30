import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { themes } from '../src/theme/themes';
import { mapStyleKey } from '../src/features/map/TennesseeMap';

/**
 * F44 — the style-swap identity must include the RESOLVED map palette.
 * Custom map colors (mapWater/mapLake/mapSelection/...) change theme.map
 * WITHOUT changing theme.id; a key of theme.id + basemap + roads left the
 * setStyle swap untriggered and the paint stale. This file imports the real
 * TennesseeMap module (no map is constructed — the export is pure), so it
 * lives apart from the RiverMapPage harness that mocks the module.
 */
describe('map style identity includes the resolved palette (F44)', () => {
  it('mapStyleKey changes when the resolved map palette changes inside the same theme', () => {
    const base = themes.daybreak.map;
    const customized = { ...base, water: '#123456' };
    expect(mapStyleKey('daybreak', base, 'paper', false)).toBe(
      mapStyleKey('daybreak', base, 'paper', false),
    );
    // Same theme.id, different palette (a custom map color) → different key,
    // so the style swap re-runs instead of serving stale paint.
    expect(mapStyleKey('daybreak', customized, 'paper', false)).not.toBe(
      mapStyleKey('daybreak', base, 'paper', false),
    );
    expect(mapStyleKey('nightfall', base, 'ink', true)).not.toBe(
      mapStyleKey('daybreak', base, 'ink', true),
    );
    expect(mapStyleKey('daybreak', base, 'paper', true)).not.toBe(
      mapStyleKey('daybreak', base, 'paper', false),
    );
  });

  it('the style-swap effect keys off the palette signature, not just theme.id', () => {
    // The effect wiring cannot run without a WebGL context; pin the dependency
    // list in source (same honesty gate as the 44px CSS pin in the control
    // group tests): the style-swap effect that computes
    // `const styleKey = mapStyleKey(...)` must re-run when the palette
    // signature changes.
    const source = readFileSync(resolve(process.cwd(), 'src/features/map/TennesseeMap.tsx'), 'utf8');
    const effectStart = source.indexOf('const styleKey = mapStyleKey(');
    expect(effectStart).toBeGreaterThan(-1);
    const depsStart = source.indexOf('}, [', effectStart);
    const depsEnd = source.indexOf(']);', depsStart);
    expect(depsStart).toBeGreaterThan(-1);
    expect(depsEnd).toBeGreaterThan(depsStart);
    const deps = source.slice(depsStart + 3, depsEnd);
    expect(deps).toContain('paletteSignature');
  });
});
