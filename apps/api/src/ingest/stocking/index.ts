import { tnAdapter } from './tn.js';
import type { StateAdapter } from './types.js';

/**
 * Adapters registered for ingestion. To add state #2 (v2), follow
 * adapter-TEMPLATE.ts and append its adapter here.
 */
export function getAdapters(): StateAdapter[] {
  return [tnAdapter];
}

export function getAdapter(stateId: string): StateAdapter | undefined {
  return getAdapters().find((a) => a.stateId === stateId);
}
