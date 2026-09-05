import {
  WaterEvidenceSchema,
  WaterEvidenceSetSchema,
} from '@trout/contracts';
import type { EvidenceRegulation, EvidenceStockingEvent, WaterEvidence, WaterObservation } from '@trout/contracts';

/**
 * Evidence assembly (pure — no fetches, no clock; everything is injected).
 *
 * Combines provider outputs (USGS/TVA observations, TWRA stocking events) with the
 * fishing-information content (regulations) into contract-valid WaterEvidence records,
 * one per catalog water. Provider failures arrive as pre-built per-source errors and
 * land in the affected waters' `errors` arrays — never swallowed, never zero-filled.
 */

export interface RegulationItem {
  title: string;
  text: string;
  authority: string;
  sourceUrl: string;
  sourceId?: string;
  effectiveFrom?: string;
  effectiveThrough?: string;
  appliesTo?: string[];
}

export interface FishingInfoDocument {
  scope: string;
  verifiedAt: string;
  disclaimer: string;
  sections: { id: string; title: string; summary?: string; items: RegulationItem[] }[];
}

/** Sections of the fishing-information doc that are regulations (vs terminology/safety). */
const REGULATION_SECTION_IDS = new Set(['statewide-rules', 'special-regulations']);

export function regulationsFromFishingInfo(
  doc: FishingInfoDocument,
): { statewide: EvidenceRegulation[]; byWater: Map<string, EvidenceRegulation[]> } {
  const statewide: EvidenceRegulation[] = [];
  const byWater = new Map<string, EvidenceRegulation[]>();
  for (const section of doc.sections) {
    if (!REGULATION_SECTION_IDS.has(section.id)) continue;
    for (const item of section.items) {
      const reg: EvidenceRegulation = {
        authority: item.authority,
        sourceUrl: item.sourceUrl,
        title: item.title,
        ...(item.effectiveFrom ? { effectiveFrom: item.effectiveFrom } : {}),
        ...(item.effectiveThrough ? { effectiveThrough: item.effectiveThrough } : {}),
        ...(item.text ? { summary: item.text } : {}),
      };
      if (!item.appliesTo || item.appliesTo.length === 0) {
        statewide.push(reg);
        continue;
      }
      for (const waterId of item.appliesTo) {
        const list = byWater.get(waterId) ?? [];
        list.push(reg);
        byWater.set(waterId, list);
      }
    }
  }
  return { statewide, byWater };
}

export interface EvidenceInputWater {
  waterId: string;
}

export interface EvidenceInput {
  waters: EvidenceInputWater[];
  retrievedAt: string;
  /** Observations keyed by waterId (the caller maps monitors/gauges to waters). */
  observationsByWater: Map<string, WaterObservation[]>;
  /** Scheduled + reported-complete events keyed by waterId. */
  scheduledByWater: Map<string, EvidenceStockingEvent[]>;
  completeByWater: Map<string, EvidenceStockingEvent[]>;
  statewideRegulations: EvidenceRegulation[];
  waterRegulations: Map<string, EvidenceRegulation[]>;
  /** Pre-built per-source failures, keyed by the waterIds they affect. */
  errorsByWater: Map<string, { sourceId: string; code: string; message: string }[]>;
}

export interface AssembledEvidence {
  /** Contract-valid records in catalog order. */
  evidence: WaterEvidence[];
  /** Waters whose record failed contract validation (should be impossible; surfaced). */
  invalid: { waterId: string; issues: string }[];
}

export function assembleWaterEvidence(input: EvidenceInput): AssembledEvidence {
  const evidence: WaterEvidence[] = [];
  const invalid: { waterId: string; issues: string }[] = [];
  for (const w of input.waters) {
    const observations = [...(input.observationsByWater.get(w.waterId) ?? [])].sort(
      (a, b) => a.observedAt.localeCompare(b.observedAt) || a.metric.localeCompare(b.metric),
    );
    const stockingEvents = [
      ...(input.scheduledByWater.get(w.waterId) ?? []),
      ...(input.completeByWater.get(w.waterId) ?? []),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.status.localeCompare(b.status));
    const regulations = [...input.statewideRegulations, ...(input.waterRegulations.get(w.waterId) ?? [])];
    const errors = input.errorsByWater.get(w.waterId) ?? [];
    const candidate = WaterEvidenceSchema.safeParse({
      waterId: w.waterId,
      retrievedAt: input.retrievedAt,
      observations,
      stockingEvents,
      regulations,
      errors,
    });
    if (candidate.success) evidence.push(candidate.data);
    else invalid.push({ waterId: w.waterId, issues: candidate.error.issues.map((i) => i.message).join('; ') });
  }
  // The whole set re-validates as a unit before anything serves it.
  const set = WaterEvidenceSetSchema.safeParse(evidence);
  if (!set.success) {
    invalid.push({ waterId: '(set)', issues: set.error.issues.map((i) => i.message).join('; ') });
  }
  return { evidence, invalid };
}
