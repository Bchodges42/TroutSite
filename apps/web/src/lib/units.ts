import type { SettingsRecord } from './db';

/** Locale-aware number: groups thousands, one decimal max. */
const numFmt = new Intl.NumberFormat([], { maximumFractionDigits: 1 });

/** Format a bare measurement for display (grouped, locale decimal). */
export function formatNum(n: number): string {
  return numFmt.format(Math.round(n * 10) / 10);
}

/** °C → °F, rounded to tenths to match USGS precision. */
export function cToF(c: number): number {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function formatTemp(tempC: number, tempUnit: SettingsRecord['tempUnit']): string {
  if (tempUnit === 'C') return `${formatNum(tempC)}°C`;
  return `${formatNum(cToF(tempC))}°F`;
}

/** Flow stays in cfs: contracts freeze idealFlow.unit to 'cfs' (§6). */
export function formatFlow(cfs: number): string {
  return `${formatNum(cfs)} cfs`;
}

export function formatHeight(ft: number): string {
  return `${formatNum(ft)} ft`;
}
