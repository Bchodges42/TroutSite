import type { DownloadManifestRecord } from '../../lib/db';
import { computePackReadiness, type PackReadiness } from '../../lib/downloadManifests';
import { tripPackStatus } from '../../lib/trips';

/**
 * Pure presentation math for the trips page (ADR 0012). Everything here takes
 * plain records in and returns plain values out — the components compose these
 * with the live Dexie/catalog hooks. Honesty rules encoded here:
 *  - a trip with no manifest has "no offline pack yet" (never "ready");
 *  - future-dated trips get seasonal flags only, never gauge readings;
 *  - the shareable plan text carries waters + date ONLY — notes and the
 *    checklist are private to the device and never enter the clipboard.
 */

/** Local calendar day, YYYY-MM-DD (toISOString() is UTC and shifts near midnight). */
export function localTodayStr(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type TripTiming = 'future' | 'today' | 'past' | 'unscheduled';

/**
 * How a trip relates to today. Only 'today' and 'past' trips may render a
 * "current conditions" line — a future (or unscheduled) trip must never show
 * gauge readings, which say nothing about the day actually planned.
 */
export function tripTiming(date: string | undefined, today: string = localTodayStr()): TripTiming {
  if (!date) return 'unscheduled';
  if (date > today) return 'future';
  if (date < today) return 'past';
  return 'today';
}

/** Split a comma/newline separated free-text list into clean, deduped values. */
export function parseList(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[,\n]/)) {
    const value = part.trim();
    if (value) seen.add(value);
  }
  return [...seen];
}

/**
 * The PUBLIC share text for a trip: date + waters (names with their catalog
 * ids so a friend can find them). Notes, species, and the checklist are
 * deliberately absent — they stay on this device.
 */
export function buildTripCopyText(input: {
  date?: string;
  waters: Array<{ id: string; name: string }>;
}): string {
  const lines = [`Trip plan — ${input.date ?? 'date to be decided'}`, 'Waters:'];
  if (input.waters.length === 0) {
    lines.push('  (none chosen yet)');
  } else {
    for (const w of input.waters) lines.push(`  - ${w.name} (${w.id})`);
  }
  return lines.join('\n');
}

/** The trip's own pack manifests, with per-manifest verified readiness. */
export interface TripPackSummary {
  /** tripPackStatus over every manifest of this trip. */
  status: 'none' | 'partial' | 'ready';
  /** False = the trip has no manifest at all: "no offline pack yet". */
  hasManifest: boolean;
  manifests: Array<{ id: string; label: string; readiness: PackReadiness }>;
}

/** Summarize the manifests that belong to one trip (pre-filtered `trip:<id>`). */
export function summarizeTripPacks(tripManifests: DownloadManifestRecord[]): TripPackSummary {
  const manifests = tripManifests.map((m) => ({
    id: m.id,
    label: m.label,
    readiness: computePackReadiness(m.sections),
  }));
  return {
    status: tripPackStatus(manifests.map((m) => m.readiness)),
    hasManifest: manifests.length > 0,
    manifests,
  };
}

/** Trip's-manifest id → owning trip id, or null for water/other manifests. */
export function tripIdFromManifestId(manifestId: string): string | null {
  return manifestId.startsWith('trip:') ? manifestId.slice('trip:'.length) : null;
}

export interface PackChip {
  label: string;
  tone: 'neutral' | 'accent' | 'good' | 'fair' | 'poor';
}

/** The list-row readiness chip. Display-only: the pack builder is a later lease. */
export function packChip(summary: TripPackSummary): PackChip {
  if (!summary.hasManifest) return { label: 'No offline pack yet', tone: 'neutral' };
  if (summary.status === 'ready') return { label: 'Pack ready', tone: 'good' };
  if (summary.status === 'partial') return { label: 'Pack partial', tone: 'fair' };
  return { label: 'Pack not ready', tone: 'neutral' };
}

/** One manifest's honest one-liner for the detail view ("required ready / partial / none"). */
export function packSectionText(readiness: PackReadiness): string {
  if (readiness.requiredReady && readiness.partialOptional) {
    return 'Required sections ready · optional sections not downloaded';
  }
  if (readiness.requiredReady) return 'All required sections ready';
  if (readiness.anyReady) return 'Partial — required sections not downloaded yet';
  return 'Nothing downloaded yet';
}

/** Compact availability wording for a "current conditions" line (identity + availability only). */
export function availabilityText(conditions: 'live' | 'stale' | 'unavailable'): string {
  if (conditions === 'live') return 'gauge data is current';
  if (conditions === 'stale') return 'latest readings are stale — verify before relying on them';
  return 'no gauge data right now';
}
