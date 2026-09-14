import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('atlas artifact hygiene', () => {
  it('does not ship the retired empty lakes GeoJSON', () => {
    const path = join(process.cwd(), 'public', 'atlas', 'lakes.geojson');
    expect(existsSync(path)).toBe(false);
  });

  it('keeps the canonical rivers atlas non-empty', () => {
    const path = join(process.cwd(), 'public', 'atlas', 'rivers.geojson');
    expect(existsSync(path)).toBe(true);
    const atlas = JSON.parse(readFileSync(path, 'utf8')) as { features?: unknown[] };
    expect(atlas.features?.length ?? 0).toBeGreaterThan(0);
  });
});
