import { describe, expect, it } from 'vitest';
import { migrateThemeId, themes } from '../src/theme/themes';

/**
 * Design audit 2026-10-04 (P1-17): three curated themes. A visitor who saved
 * a retired preset must land on its nearest survivor, never on a broken id.
 */
describe('theme presets', () => {
  it('ships exactly Daybreak, Nightfall and High contrast', () => {
    expect(Object.keys(themes).sort()).toEqual(['daybreak', 'high-contrast', 'nightfall']);
  });

  it('keeps current ids and maps retired ones to the nearest survivor', () => {
    expect(migrateThemeId('nightfall')).toBe('nightfall');
    expect(migrateThemeId('riverstone')).toBe('daybreak');
    expect(migrateThemeId('campfire')).toBe('nightfall');
  });

  it('rejects unknown or missing values', () => {
    expect(migrateThemeId('neon')).toBeNull();
    expect(migrateThemeId(null)).toBeNull();
  });
});
