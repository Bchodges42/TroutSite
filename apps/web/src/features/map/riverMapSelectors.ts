import type { Stream, ConditionSnapshot, ShopReport, StockingEvent, HatchChart } from '@trout/contracts';
import { scoreBand } from '../../lib/conditions';
import { atlas, conditionColor } from './mapTokens';

export type ConditionStatus = 'good' | 'fair' | 'poor' | 'no-data';

export function statusForScore(score: number | null, hasData: boolean): ConditionStatus {
  // scoreConditions returns value 0 only when it cannot assess (no readings,
  // no matching gauge, or no usable flow/stage) — FLOW_SCORE_FLOOR keeps every
  // real assessment at 10+. Render that as no-data, never "0 · Poor".
  if (!hasData || score == null || score === 0) return 'no-data';
  const b = scoreBand(score);
  return b as ConditionStatus;
}

export function colorForStatus(s: ConditionStatus): string {
  if (s === 'good') return atlas.good;
  if (s === 'fair') return atlas.fair;
  if (s === 'poor') return atlas.poor;
  return atlas.noData;
}

export function colorForSnapshot(snap: ConditionSnapshot | undefined): string {
  if (!snap) return atlas.noData;
  return conditionColor(snap.score.value, true);
}

export function plainStatus(status: ConditionStatus, score: number | null): string {
  if (status === 'no-data' || score == null) return 'No data';
  if (status === 'good') return `${score} · Good`;
  if (status === 'fair') return `${score} · Fair`;
  return `${score} · Poor`;
}

export function interpretationFor(snap: ConditionSnapshot | undefined, _stream: Stream): string {
  if (!snap) return 'No recent gauge reading — check recent rain.';
  const r = snap.score.reasons[0] ?? '';
  if (r.toLowerCase().includes('within')) return 'Running near its usual range';
  if (r.toLowerCase().includes('below')) return 'Running low';
  if (r.toLowerCase().includes('above')) return 'Running high';
  return snap.score.reasons[0] ?? 'Condition assessed from latest gauge.';
}

// Hatch dominance — strongest abundance wins, tie-break by taxonId
export function dominantHatch(chart: HatchChart | null | undefined): HatchChart['entries'][number] | null {
  if (!chart || !chart.entries.length) return null;
  return [...chart.entries].sort((a, b) => b.abundance - a.abundance || a.taxonId.localeCompare(b.taxonId))[0] ?? null;
}

export function hatchHaloForChart(chart: HatchChart | null | undefined): { active: boolean; color: string } {
  const d = dominantHatch(chart);
  if (!d) return { active: false, color: atlas.sulphur };
  const intensity = d.abundance >= 3 ? 0.55 : d.abundance === 2 ? 0.35 : 0.18;
  return { active: intensity > 0.15, color: atlas.sulphur };
}

// Freshness — mirrors FreshnessChip: live vs stale offline
export function freshnessLabel(fetchedAt: number | null | undefined, live: boolean): string {
  if (fetchedAt == null) return 'Never updated';
  const mins = Math.max(0, (Date.now() - fetchedAt) / 60_000);
  const age = mins < 1 ? 'now' : mins < 90 ? `${Math.round(mins)} min ago` : `${Math.round(mins / 60)} hr ago`;
  return live ? `Live · ${age}` : `Offline · last known ${new Date(fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function isFresh(fetchedAt: number | null | undefined, ttlMinutes: number): boolean {
  if (fetchedAt == null) return false;
  return Date.now() - fetchedAt < ttlMinutes * 60_000;
}

export interface RiverMapFeature {
  stream: Stream;
  snapshot: ConditionSnapshot | undefined;
  status: ConditionStatus;
  color: string;
  score: number | null;
  species: 'trout' | 'warmwater';
  freshness: number | null;
  hatchChart: HatchChart | null;
  hatchDominant: HatchChart['entries'][number] | null;
  hatchHalo: { active: boolean; color: string };
  stocking: StockingEvent | null;
  stockingCount: number;
  report: ShopReport | null;
  reportCount: number;
  logCount: number;
}
