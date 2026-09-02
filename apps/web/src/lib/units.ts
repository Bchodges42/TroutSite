import type { SettingsRecord } from './db';

/** °C → °F, rounded to tenths to match USGS precision. */
export function cToF(c: number): number {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function formatTemp(tempC: number, tempUnit: SettingsRecord['tempUnit']): string {
  if (tempUnit === 'C') return `${trim(tempC)}°C`;
  return `${trim(cToF(tempC))}°F`;
}

/** Flow stays in cfs: contracts freeze idealFlow.unit to 'cfs' (§6). */
export function formatFlow(cfs: number): string {
  return `${trim(cfs)} cfs`;
}

export function formatHeight(ft: number): string {
  return `${trim(ft)} ft`;
}

function trim(n: number): string {
  return String(Math.round(n * 10) / 10);
}
