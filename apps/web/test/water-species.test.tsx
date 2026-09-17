import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WaterSpeciesCard } from '../src/components/WaterSpeciesCard';
import type { SpeciesOccurrenceCatalog } from '@trout/contracts';

const CATALOG: SpeciesOccurrenceCatalog = {
  schema: 'trout/species-occurrences/1',
  stateId: 'TN',
  updatedAt: '2026-09-16',
  collectionNote: 'Curated source-backed occurrence records for Tennessee waters.',
  sources: [
    {
      id: 'twra',
      url: 'https://www.tn.gov/twra/fishing.html',
      label: 'Tennessee Wildlife Resources Agency',
      retrieved: '2026-09-16',
      basis: 'Agency fishery and stocking information.',
    },
  ],
  species: [
    {
      id: 'rainbow-trout',
      displayName: 'Rainbow trout',
      scientificName: 'Oncorhynchus mykiss',
      group: 'trout',
    },
  ],
  occurrences: [
    {
      waterIds: ['test-water'],
      speciesIds: ['rainbow-trout'],
      evidenceType: 'stocking-record',
      confidence: 'high',
      seasonMonths: [1, 2, 12],
      sourceId: 'twra',
    },
  ],
};

afterEach(() => cleanup());

describe('WaterSpeciesCard', () => {
  it('renders source, evidence, scientific name, and seasonal context', () => {
    render(<WaterSpeciesCard waterId="test-water" catalog={CATALOG} />);

    expect(screen.getByRole('heading', { name: 'Recorded fish species' })).toBeInTheDocument();
    expect(screen.getByText('Rainbow trout')).toBeInTheDocument();
    expect(screen.getByText('Oncorhynchus mykiss')).toBeInTheDocument();
    expect(screen.getByText(/Stocking record · high evidence · seasonal: Jan, Feb, Dec/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Source ↗' })).toHaveAttribute('href', CATALOG.sources[0]?.url);
  });

  it('keeps an uncovered water visibly unknown', () => {
    render(<WaterSpeciesCard waterId="uncovered-water" catalog={CATALOG} />);

    expect(screen.getByText(/No species record has been collected/)).toBeInTheDocument();
    expect(screen.getByText(/not proof that the water is fishless/)).toBeInTheDocument();
    expect(screen.queryByTestId('recorded-species-list')).not.toBeInTheDocument();
  });
});
