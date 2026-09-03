import type { ConditionSnapshot, GaugeReading } from '@trout/contracts';
import { formatFlow } from './units';

/**
 * Flow trend from the two most recent cfs readings in a snapshot.
 * Pure so the UI stays honest offline (guiding principle #1).
 */
export type FlowTrend = 'rising' | 'falling' | 'steady' | 'unknown';

export function flowTrend(readings: GaugeReading[]): FlowTrend {
  const withCfs = [...readings]
    .filter((r) => typeof r.cfs === 'number')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const [newest, previous] = withCfs;
  if (!newest?.cfs || !previous?.cfs) return 'unknown';
  const delta = newest.cfs - previous.cfs;
  const relative = Math.abs(delta) / Math.max(previous.cfs, 1);
  if (relative < 0.05) return 'steady';
  return delta > 0 ? 'rising' : 'falling';
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

/** Readings newer than `prev` that moved the story — powers "what changed". */
export function whatChanged(prev: GaugeReading[], next: GaugeReading[]): string[] {
  const prevTop = newestCfs(prev);
  const nextTop = newestCfs(next);
  const changes: string[] = [];

  if (prevTop && nextTop) {
    const relative = Math.abs(nextTop.value - prevTop.value) / Math.max(prevTop.value, 1);
    if (relative >= SIGNIFICANT_FLOW_RATIO) {
      const direction = nextTop.value > prevTop.value ? 'up' : 'down';
      changes.push(
        `Flow is ${direction} from ${formatFlow(prevTop.value)} to ${formatFlow(nextTop.value)} at ${nextTop.gaugeId}.`,
      );
    }
  }

  const prevTemp = newestTemp(prev);
  const nextTemp = newestTemp(next);
  if (prevTemp && nextTemp && Math.abs(nextTemp - prevTemp) >= 1) {
    changes.push(
      `Water temperature moved from ${Math.round(prevTemp)}°C to ${Math.round(nextTemp)}°C.`,
    );
  }

  const prevCount = prev.length;
  const nextCount = next.length;
  if (nextCount > prevCount) {
    changes.push(`${nextCount - prevCount} new gauge reading${nextCount - prevCount === 1 ? '' : 's'} since your last visit.`);
  }

  return changes;
}

function newestCfs(readings: GaugeReading[]): { gaugeId: string; value: number } | null {
  const sorted = [...readings]
    .filter((r) => typeof r.cfs === 'number')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const top = sorted[0];
  return top?.cfs != null ? { gaugeId: top.gaugeId, value: top.cfs } : null;
}

function newestTemp(readings: GaugeReading[]): number | null {
  const sorted = [...readings]
    .filter((r) => typeof r.tempC === 'number')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const top = sorted[0];
  return top?.tempC ?? null;
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
