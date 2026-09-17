import { describe, expect, it } from 'vitest';
import {
  SpeciesOccurrenceCatalogSchema,
  occurrencesForWater,
} from '../src/index.js';

const source = {
  id: 'twra',
  url: 'https://www.tn.gov/twra/fishing.html',
  label: 'TWRA fishing information',
  retrieved: '2026-09-16',
  basis: 'Agency source used for the occurrence record.',
};

const catalog = {
  schema: 'trout/species-occurrences/1' as const,
  stateId: 'TN' as const,
  updatedAt: '2026-09-16',
  collectionNote: 'Static source-backed fixture catalog for schema tests.',
  sources: [source],
  species: [
    { id: 'rainbow-trout', displayName: 'Rainbow trout', scientificName: 'Oncorhynchus mykiss', group: 'trout' as const },
    { id: 'smallmouth-bass', displayName: 'Smallmouth bass', scientificName: 'Micropterus dolomieu', group: 'bass' as const },
  ],
  occurrences: [
    {
      waterIds: ['water-a'],
      speciesIds: ['rainbow-trout'],
      evidenceType: 'stocking-record' as const,
      confidence: 'high' as const,
      sourceId: 'twra',
    },
  ],
};

describe('SpeciesOccurrenceCatalogSchema', () => {
  it('accepts a catalog and expands groups for a water', () => {
    const parsed = SpeciesOccurrenceCatalogSchema.parse(catalog);
    const rows = occurrencesForWater(parsed, 'water-a');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.species.displayName).toBe('Rainbow trout');
    expect(rows[0]?.source.id).toBe('twra');
  });

  it('rejects duplicate water/species pairs and unknown source ids', () => {
    expect(() => SpeciesOccurrenceCatalogSchema.parse({
      ...catalog,
      occurrences: [
        catalog.occurrences[0],
        catalog.occurrences[0],
      ],
    })).toThrow(/duplicate water\/species occurrence/);

    expect(() => SpeciesOccurrenceCatalogSchema.parse({
      ...catalog,
      occurrences: [{ ...catalog.occurrences[0], sourceId: 'missing' }],
    })).toThrow(/unknown source id/);
  });
});
