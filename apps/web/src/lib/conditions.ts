import type { ConditionSnapshot, GaugeReading } from '@trout/contracts';
import { formatFlow } from './units';

/**
 * Flow trend from the two most recent cfs readings AT THE SAME GAUGE.
 * Sorting readings across gauges fabricates trends (e.g. Harpeth: 31 cfs at
 * 03432350 vs 41 cfs at 03433500 would read as "rising" — that's two sites,
 * not a change over time). Zero flow is a valid reading, not missing data.
 * Pure so the UI stays honest offline (guiding principle #1).
 */
export type FlowTrend = 'rising' | 'falling' | 'steady' | 'unknown';

export function flowTrend(readings: GaugeReading[]): FlowTrend {
  // Candidate pairs per gauge; the gauge with the globally newest pair tells
  // the current story when a stream has several participating gauges.
  const byGauge = new Map<string, GaugeReading[]>();
  for (const r of readings) {
    if (typeof r.cfs !== 'number') continue;
    const list = byGauge.get(r.gaugeId) ?? [];
    list.push(r);
    byGauge.set(r.gaugeId, list);
  }

  let best: { newestTs: number; trend: FlowTrend } | null = null;
  for (const list of byGauge.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const newest = sorted[0];
    const previous = sorted[1];
    if (!newest || !previous) continue;
    const newestTs = Date.parse(newest.timestamp);
    const previousTs = Date.parse(previous.timestamp);
    // A pair must be two distinct observations; duplicate timestamps carry no trend.
    if (!Number.isFinite(newestTs) || !Number.isFinite(previousTs) || newestTs === previousTs) continue;
    const delta = (newest.cfs as number) - (previous.cfs as number);
    const relative = Math.abs(delta) / Math.max(previous.cfs as number, 1);
    const trend: FlowTrend = relative < 0.05 ? 'steady' : delta > 0 ? 'rising' : 'falling';
    if (!best || newestTs > best.newestTs) best = { newestTs, trend };
  }
  return best?.trend ?? 'unknown';
}

export const TREND_LABEL: Record<FlowTrend, string> = {
  rising: '↑ rising',
  falling: '↓ falling',
  steady: '→ steady',
  unknown: '',
};

/** Score pill banding shared by list + detail surfaces. */
export type ScoreBand = 'good' | 'fair' | 'poor';

export function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export function scoreLabel(score: number): string {
  if (score >= 70) return 'Fishable';
  if (score >= 40) return 'Marginal';
  return 'Poor';
}

const SIGNIFICANT_FLOW_RATIO = 0.1;

/** Readings newer than `prev` that moved the story — powers "what changed".
 *  Flow/temperature deltas are only stated when both sides come from the SAME
 *  gauge: comparing across sites reports geography, not change (see flowTrend). */
export function whatChanged(prev: GaugeReading[], next: GaugeReading[]): string[] {
  const prevTop = newestMetric(prev, 'cfs');
  const nextTop = newestMetric(next, 'cfs');
  const changes: string[] = [];

  if (prevTop && nextTop && prevTop.gaugeId === nextTop.gaugeId) {
    const relative = Math.abs(nextTop.value - prevTop.value) / Math.max(prevTop.value, 1);
    if (relative >= SIGNIFICANT_FLOW_RATIO) {
      const direction = nextTop.value > prevTop.value ? 'up' : 'down';
      changes.push(
        `Flow is ${direction} from ${formatFlow(prevTop.value)} to ${formatFlow(nextTop.value)} at ${nextTop.gaugeId}.`,
      );
    }
  }

  const prevTemp = newestMetric(prev, 'tempC');
  const nextTemp = newestMetric(next, 'tempC');
  if (prevTemp && nextTemp && prevTemp.gaugeId === nextTemp.gaugeId && Math.abs(nextTemp.value - prevTemp.value) >= 1) {
    changes.push(
      `Water temperature moved from ${Math.round(prevTemp.value)}°C to ${Math.round(nextTemp.value)}°C.`,
    );
  }

  const prevCount = prev.length;
  const nextCount = next.length;
  if (nextCount > prevCount) {
    changes.push(`${nextCount - prevCount} new gauge reading${nextCount - prevCount === 1 ? '' : 's'} since your last visit.`);
  }

  return changes;
}

/** Newest reading carrying `key` (zero is a value, not absence), per gauge. */
function newestMetric(
  readings: GaugeReading[],
  key: 'cfs' | 'tempC',
): { gaugeId: string; value: number } | null {
  let best: { gaugeId: string; value: number; ts: number } | null = null;
  for (const r of readings) {
    const v = r[key];
    if (typeof v !== 'number') continue;
    const ts = Date.parse(r.timestamp);
    if (!Number.isFinite(ts)) continue;
    if (!best || ts > best.ts) best = { gaugeId: r.gaugeId, value: v, ts };
  }
  return best ? { gaugeId: best.gaugeId, value: best.value } : null;
}

/** Baseline helpers for the "what changed since your last visit" card. */
export async function rememberSeen(snapshot: ConditionSnapshot): Promise<void> {
  const { db } = await import('./db');
  await db.seen.put({
    key: `stream:${snapshot.streamId}`,
    readings: snapshot.readings,
    seenAt: Date.now(),
  });
}

export async function readSeen(streamId: string): Promise<GaugeReading[] | null> {
  const { db } = await import('./db');
  const record = await db.seen.get(`stream:${streamId}`);
  return record ? (record.readings as GaugeReading[]) : null;
}
