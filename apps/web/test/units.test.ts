import { describe, expect, it } from 'vitest';
import { cToF, formatFlow, formatHeight, formatTemp } from '../src/lib/units';
import { ageMinutes, clockTime, currentMonth, shortDate } from '../src/lib/time';

describe('units', () => {
  it('converts °C to °F', () => {
    expect(cToF(0)).toBe(32);
    expect(cToF(9.4)).toBeCloseTo(48.9, 1);
    expect(cToF(25.4)).toBeCloseTo(77.7, 1);
  });

  it('formats temperatures in both units', () => {
    expect(formatTemp(9.4, 'C')).toBe('9.4°C');
    expect(formatTemp(9.4, 'F')).toBe('48.9°F');
  });

  it('formats flow and stage', () => {
    expect(formatFlow(245)).toBe('245 cfs');
    expect(formatFlow(1234.56)).toMatch(/1.234[.,]6 cfs/);
    expect(formatHeight(3.14159)).toBe('3.1 ft');
  });
});

describe('time', () => {
  const now = Date.parse('2026-09-02T12:00:00Z');

  it('formats relative age', () => {
    expect(ageMinutes(now - 30_000, now)).toBe('now');
    expect(ageMinutes(now - 12 * 60_000, now)).toBe('12 minutes ago');
    expect(ageMinutes(now - 3 * 3600_000, now)).toBe('3 hours ago');
    expect(ageMinutes(now - 2 * 24 * 3600_000, now)).toBe('2 days ago');
  });

  it('never reports negative age', () => {
    expect(ageMinutes(now + 10 * 60_000, now)).toBe('now');
  });

  it('formats a clock time', () => {
    // Construct in local time so the assertion is timezone-independent.
    expect(clockTime(new Date(2026, 3, 1, 18, 40).getTime())).toMatch(/6:40/);
  });

  it('formats short dates', () => {
    expect(shortDate('2026-08-21')).toMatch(/Aug 21/);
  });

  it('gives the current calendar month', () => {
    expect(currentMonth(new Date('2026-09-02T12:00:00Z'))).toBe(9);
  });
});
