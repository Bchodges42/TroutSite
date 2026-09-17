import { z } from 'zod';
import { StateIdSchema } from './shared.js';

/** Stable ids for fish in the curated Tennessee occurrence catalog. */
export const FishSpeciesSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'species ids must be kebab-case'),
  displayName: z.string().min(1),
  scientificName: z.string().min(1),
  group: z.enum(['bass', 'trout', 'panfish', 'catfish', 'predator', 'other']),
});
export type FishSpecies = z.infer<typeof FishSpeciesSchema>;

/** What the cited source actually establishes about a water/species pair. */
export const SpeciesOccurrenceEvidenceTypeSchema = z.enum([
  'agency-fishery-list',
  'stocking-record',
  'wild-population',
  'regulation',
]);
export type SpeciesOccurrenceEvidenceType = z.infer<typeof SpeciesOccurrenceEvidenceTypeSchema>;

export const SpeciesOccurrenceSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'source ids must be kebab-case'),
  url: z.string().url().refine((url) => url.startsWith('https://'), 'source URL must use https://'),
  label: z.string().min(1),
  retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'retrieved must be YYYY-MM-DD'),
  /** Short curator explanation; never presented as a verbatim agency quote. */
  basis: z.string().min(12),
});
export type SpeciesOccurrenceSource = z.infer<typeof SpeciesOccurrenceSourceSchema>;

/**
 * A compact, normalized group of water/species associations. `waterIds` and
 * `speciesIds` are arrays to keep the static catalog small when one official
 * page documents the same species set for a water. Consumers expand the
 * group by water/species when indexing it.
 */
export const SpeciesOccurrenceGroupSchema = z.object({
  waterIds: z.array(z.string().min(1)).min(1),
  speciesIds: z.array(z.string().min(1)).min(1),
  evidenceType: SpeciesOccurrenceEvidenceTypeSchema,
  confidence: z.enum(['high', 'medium', 'low']),
  /** Optional months when the source documents a seasonal presence/program. */
  seasonMonths: z
    .array(z.number().int().min(1).max(12))
    .max(12)
    .refine((months) => new Set(months).size === months.length, 'seasonMonths must not contain duplicates')
    .optional(),
  sourceId: z.string().min(1),
});
export type SpeciesOccurrenceGroup = z.infer<typeof SpeciesOccurrenceGroupSchema>;

export const SpeciesOccurrenceCatalogSchema = z
  .object({
    schema: z.literal('trout/species-occurrences/1'),
    stateId: StateIdSchema,
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'updatedAt must be YYYY-MM-DD'),
    /** Human-readable collection policy shipped with the data for attribution. */
    collectionNote: z.string().min(20),
    sources: z.array(SpeciesOccurrenceSourceSchema).min(1),
    species: z.array(FishSpeciesSchema).min(1),
    occurrences: z.array(SpeciesOccurrenceGroupSchema),
  })
  .superRefine((catalog, ctx) => {
    const speciesIds = new Set<string>();
    const sourceIds = new Set<string>();
    for (const [index, species] of catalog.species.entries()) {
      if (speciesIds.has(species.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['species', index, 'id'], message: `duplicate species id ${species.id}` });
      }
      speciesIds.add(species.id);
    }

    for (const [index, source] of catalog.sources.entries()) {
      if (sourceIds.has(source.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sources', index, 'id'], message: `duplicate source id ${source.id}` });
      }
      sourceIds.add(source.id);
    }

    const pairs = new Set<string>();
    for (const [index, group] of catalog.occurrences.entries()) {
      for (const speciesId of group.speciesIds) {
        if (!speciesIds.has(speciesId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['occurrences', index, 'speciesIds'], message: `unknown species id ${speciesId}` });
        }
        for (const waterId of group.waterIds) {
          const pair = `${waterId}:${speciesId}`;
          if (pairs.has(pair)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['occurrences', index], message: `duplicate water/species occurrence ${pair}` });
          }
          pairs.add(pair);
        }
      }
      if (!sourceIds.has(group.sourceId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['occurrences', index, 'sourceId'], message: `unknown source id ${group.sourceId}` });
      }
      if (new Set(group.waterIds).size !== group.waterIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['occurrences', index, 'waterIds'], message: 'waterIds must not contain duplicates' });
      }
      if (new Set(group.speciesIds).size !== group.speciesIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['occurrences', index, 'speciesIds'], message: 'speciesIds must not contain duplicates' });
      }
    }
  });
export type SpeciesOccurrenceCatalog = z.infer<typeof SpeciesOccurrenceCatalogSchema>;

/** One row after expanding the compact on-disk groups for a water detail. */
export interface SpeciesOccurrence {
  waterId: string;
  species: FishSpecies;
  evidenceType: SpeciesOccurrenceEvidenceType;
  confidence: SpeciesOccurrenceGroup['confidence'];
  seasonMonths?: number[];
  source: SpeciesOccurrenceSource;
}

export function occurrencesForWater(
  catalog: SpeciesOccurrenceCatalog | null | undefined,
  waterId: string,
): SpeciesOccurrence[] {
  if (!catalog) return [];
  const speciesById = new Map(catalog.species.map((species) => [species.id, species]));
  const sourcesById = new Map(catalog.sources.map((source) => [source.id, source]));
  return catalog.occurrences.flatMap((group) =>
    group.waterIds.includes(waterId)
      ? group.speciesIds.flatMap((speciesId) => {
          const species = speciesById.get(speciesId);
          const source = sourcesById.get(group.sourceId);
          return species && source
            ? [{ waterId, species, evidenceType: group.evidenceType, confidence: group.confidence, seasonMonths: group.seasonMonths, source }]
            : [];
        })
      : [],
  );
}
