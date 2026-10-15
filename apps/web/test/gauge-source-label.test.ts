import { describe, expect, it } from 'vitest';
import { gaugeSourceLabel } from '../src/lib/presentation';

// USGS audit 2026-10-14: the map drawer printed "USGS tva:HADT1" for TVA dam data.
describe('gaugeSourceLabel', () => {
  it('names the real agency behind each namespaced gauge id', () => {
    expect(gaugeSourceLabel('03566000')).toBe('USGS 03566000');
    expect(gaugeSourceLabel('tva:HADT1')).toBe('TVA dam release HADT1');
    expect(gaugeSourceLabel('usace:CETT1')).toBe('USACE tailwater CETT1');
  });
});
