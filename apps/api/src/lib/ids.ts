import { createHash } from 'node:crypto';

/**
 * Deterministic event id, stable across re-runs so upserts stay idempotent
 * (re-scraping the same schedule updates existing rows instead of duplicating).
 */
export function deterministicId(...parts: string[]): string {
  const h = createHash('sha256').update(parts.join('\u0000')).digest('hex');
  return h.slice(0, 16);
}
