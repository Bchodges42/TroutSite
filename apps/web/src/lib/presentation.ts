import type { ConditionSnapshot } from '@trout/contracts';
import { formatTemp } from './units';
/** Display ordering only. Availability/scoring/freshness semantics belong upstream. */
export function orderedReadings(snapshot: ConditionSnapshot | undefined) {
  return [...(snapshot?.readings ?? [])].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
}
/** Presentation-only conversion of supplied prose into the selected temperature unit. */
export function conditionReason(reason: string, unit: 'C' | 'F'): string {
  return reason.replace(/(-?\d+(?:\.\d+)?)\s*°C/g, (_, value: string) =>
    formatTemp(Number(value), unit),
  );
}

/** Typographic hierarchy only; preserve the complete catalog identity and reach. */
export function waterIdentity(label: string): { name: string; reach?: string } {
  const match = label.match(/^(.+?)\s+\((.+)\)$/);
  return match ? { name: match[1]!, reach: match[2]! } : { name: label };
}
