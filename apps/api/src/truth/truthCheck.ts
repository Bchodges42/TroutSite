import type { ConditionSnapshot, GaugeReading, ReleaseSchedule, StockingEvent } from '@trout/contracts';
import { parseTvaGenerationReleaseReport } from '../evidence/tva-provider.js';

/**
 * Data truth check (audit 2026-10-14 guardrail): compare what the site
 * PUBLISHES against what the upstream agency says right now. Every function
 * here is pure — the CLI (scripts/truth-check.ts) does the fetching — so each
 * rule is pinned by tests built from real captures.
 *
 * Findings:
 *   mismatch — the published value disagrees with the source for the same moment
 *   stale    — the source has newer data than we publish, past the tolerance
 *   unparsed — the source publishes rows our parsers cannot read
 */
export type TruthSource = 'usgs' | 'tva' | 'twra';
export interface TruthFinding {
  kind: 'mismatch' | 'stale' | 'unparsed';
  source: TruthSource;
  subject: string;
  detail: string;
}

/** The scorer's freshness window: published readings may lag the source this much. */
export const USGS_LAG_TOLERANCE_MS = 3 * 60 * 60_000;
/** Release schedules are refreshed hourly (build withholds them past 3 h). */
export const TVA_SCHEDULE_MAX_AGE_MS = 3 * 60 * 60_000;
/** TWRA is read daily; the PWA calls it stale after 2 days. */
export const TWRA_MAX_AGE_MS = 2 * 24 * 60 * 60_000;
/** Allowed drift between published and freshly-parsed schedule row counts. */
export const TWRA_COUNT_TOLERANCE = 0.1;

const VALUE_FIELDS = ['cfs', 'heightFt', 'tempC'] as const;

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.005);
}

/**
 * Published USGS readings (from v1/conditions/latest.json) vs the source's
 * latest-continuous values. Only bare numeric (USGS) gauge ids are checked.
 */
export function compareUsgsReadings(snapshots: ConditionSnapshot[], upstream: GaugeReading[]): { checked: number; findings: TruthFinding[] } {
  const published = new Map<string, GaugeReading>();
  for (const s of snapshots) {
    for (const r of s.readings) {
      if (!/^\d+$/.test(r.gaugeId)) continue;
      const prev = published.get(r.gaugeId);
      if (!prev || Date.parse(r.timestamp) > Date.parse(prev.timestamp)) published.set(r.gaugeId, r);
    }
  }
  const source = new Map(upstream.map((r) => [r.gaugeId, r]));
  const findings: TruthFinding[] = [];
  let checked = 0;
  for (const [gaugeId, pub] of published) {
    const up = source.get(gaugeId);
    if (!up) continue; // nothing current upstream to compare against
    checked += 1;
    const pubMs = Date.parse(pub.timestamp);
    const upMs = Date.parse(up.timestamp);
    if (upMs - pubMs > USGS_LAG_TOLERANCE_MS) {
      findings.push({
        kind: 'stale',
        source: 'usgs',
        subject: gaugeId,
        detail: `published ${pub.timestamp}, USGS has ${up.timestamp} (${Math.round((upMs - pubMs) / 3_600_000)} h newer)`,
      });
      continue;
    }
    if (upMs !== pubMs) continue; // different instants within tolerance — values may legitimately differ
    for (const field of VALUE_FIELDS) {
      const a = pub[field];
      const b = up[field];
      if (typeof a === 'number' && typeof b === 'number' && !close(a, b)) {
        findings.push({ kind: 'mismatch', source: 'usgs', subject: gaugeId, detail: `${field} published ${a}, USGS ${b} at ${pub.timestamp}` });
      } else if (typeof a === 'number' && typeof b !== 'number') {
        findings.push({ kind: 'mismatch', source: 'usgs', subject: gaugeId, detail: `${field} published ${a} at ${pub.timestamp}; USGS has no current ${field}` });
      }
    }
  }
  return { checked, findings };
}

const blockKey = (b: { date: string; startTime: string; endTime: string }) => `${b.date} ${b.startTime}-${b.endTime}`;

/** One published TVA release schedule vs TVA's raw generation-releases payload. */
export function compareTvaSchedule(published: ReleaseSchedule, upstreamPayload: unknown, now: Date): TruthFinding[] {
  const findings: TruthFinding[] = [];
  const subject = `${published.waterId} (${published.locationId})`;
  const age = now.getTime() - Date.parse(published.retrievedAt);
  if (age > TVA_SCHEDULE_MAX_AGE_MS) {
    findings.push({ kind: 'stale', source: 'tva', subject, detail: `schedule retrieved ${published.retrievedAt} (${Math.round(age / 3_600_000)} h ago)` });
  }
  let report;
  try {
    report = parseTvaGenerationReleaseReport(upstreamPayload);
  } catch (err) {
    findings.push({ kind: 'unparsed', source: 'tva', subject, detail: (err as Error).message });
    return findings;
  }
  if (report.dropped.length > 0) {
    findings.push({ kind: 'unparsed', source: 'tva', subject, detail: `${report.dropped.length} of ${report.rawRows} TVA rows unreadable: ${JSON.stringify(report.dropped[0])}` });
  }
  if (report.blocks.length > 0 && published.status !== 'available') {
    findings.push({ kind: 'mismatch', source: 'tva', subject, detail: `TVA publishes ${report.blocks.length} block(s); site shows status "${published.status}"` });
    return findings;
  }
  const upstreamByKey = new Map(report.blocks.map((b) => [blockKey(b), b]));
  for (const block of published.releases) {
    const up = upstreamByKey.get(blockKey(block));
    if (up && up.generators !== block.generators) {
      findings.push({ kind: 'mismatch', source: 'tva', subject, detail: `${blockKey(block)}: site "${block.generators}" generators, TVA "${up.generators}"` });
    }
  }
  return findings;
}

/** Published TWRA stocking feed vs a fresh parse of TWRA's page. */
export function compareTwraStocking(published: StockingEvent[], fresh: StockingEvent[], now: Date, scheduleYear: number): TruthFinding[] {
  const findings: TruthFinding[] = [];
  const scheduled = (list: StockingEvent[]) => list.filter((e) => (e.status ?? 'scheduled') === 'scheduled');
  const pubCount = scheduled(published).length;
  const freshCount = scheduled(fresh).length;
  if (freshCount > 0 && Math.abs(pubCount - freshCount) / freshCount > TWRA_COUNT_TOLERANCE) {
    findings.push({ kind: 'mismatch', source: 'twra', subject: 'TN schedule', detail: `site publishes ${pubCount} scheduled events, TWRA's page parses to ${freshCount}` });
  }
  const newest = Math.max(0, ...published.map((e) => Date.parse(e.fetchedAt)).filter(Number.isFinite));
  if (now.getTime() - newest > TWRA_MAX_AGE_MS) {
    findings.push({ kind: 'stale', source: 'twra', subject: 'TN feed', detail: `newest TWRA fetch ${newest ? new Date(newest).toISOString() : 'never'}` });
  }
  const invented = published.filter((e) => Number(e.date.slice(0, 4)) > scheduleYear && e.datePrecision !== 'day');
  if (invented.length > 0) {
    findings.push({ kind: 'mismatch', source: 'twra', subject: 'TN schedule', detail: `${invented.length} window event(s) dated past the ${scheduleYear} schedule, e.g. ${invented[0]?.streamName} ${invented[0]?.date}` });
  }
  return findings;
}
