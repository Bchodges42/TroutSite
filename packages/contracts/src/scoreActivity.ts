import type { ActivityComponent, ActivityOutlook } from './schemas/fishability.js';

/**
 * Activity outlook total (ADR 0007, F4): deterministic, transparent, no AI.
 * The total is 50 (neutral) plus every factor's declared contribution, clamped
 * to 0–100 — each component row visibly moves the total, and the UI can render
 * the breakdown straight from `components` without re-deriving anything.
 *
 * The returned list is ordered descending by |contribution| (most influential
 * factor first); equal contributions keep the caller's authoring order (stable
 * index tie-break). Inputs are never mutated — the ordering works on a copy.
 */
export function scoreActivity(components: ActivityComponent[]): ActivityOutlook {
  if (components.length === 0) {
    return { total: 0, components: [] };
  }
  const sum = components.reduce((total, c) => total + c.contribution, 0);
  const total = Math.min(100, Math.max(0, Math.round(50 + sum)));
  const ordered = components
    .map((c, index) => ({ c, index }))
    .sort((a, b) => Math.abs(b.c.contribution) - Math.abs(a.c.contribution) || a.index - b.index)
    .map(({ c }) => c);
  return { total, components: ordered };
}
