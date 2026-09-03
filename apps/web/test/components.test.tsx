import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScorePill } from '../src/components/ScorePill';
import { FreshnessChip } from '../src/components/FreshnessChip';
import { BugTaxonSchema } from '@trout/contracts';
import { TaxonArt } from '../src/components/art/TaxonArt';
import taxaFixture from '../fixtures/data/content/taxa.json';

function stubOnline(online: boolean): () => void {
  const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
  return () => {
    delete (navigator as { onLine?: boolean }).onLine;
    if (original) Object.defineProperty(Navigator.prototype, 'onLine', original);
  };
}

describe('ScorePill', () => {
  it('labels the band with plain English', () => {
    render(<ScorePill score={90} />);
    expect(screen.getByLabelText('Fishability 90 out of 100 — Fishable')).toBeInTheDocument();
    expect(screen.getByText('Fishable')).toBeInTheDocument();
  });

  it('shows marginal and poor bands', () => {
    render(
      <>
        <ScorePill score={50} />
        <ScorePill score={20} />
      </>,
    );
    expect(screen.getByText('Marginal')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });
});

describe('FreshnessChip', () => {
  it('shows Live for fresh network data', () => {
    render(<FreshnessChip fetchedAt={Date.now() - 2 * 60_000} live />);
    expect(screen.getByText(/Live · 2 min ago/)).toBeInTheDocument();
  });

  it('shows Offline · last known for cached data', () => {
    render(<FreshnessChip fetchedAt={Date.now() - 90 * 60_000} live={false} />);
    expect(screen.getByText(/Offline · last known/)).toBeInTheDocument();
  });

  it('shows Offline · last known while the device is offline, even for live data', () => {
    const restore = stubOnline(false);
    try {
      render(<FreshnessChip fetchedAt={Date.now() - 2 * 60_000} live />);
      expect(screen.queryByText(/Live ·/)).not.toBeInTheDocument();
      expect(screen.getByText(/Offline · last known/)).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('shows Never updated when nothing is cached', () => {
    render(<FreshnessChip fetchedAt={undefined} live={false} />);
    expect(screen.getByText('Never updated')).toBeInTheDocument();
  });
});

describe('TaxonArt', () => {
  it('renders decorative line art with an accessible label', () => {
    const taxon = BugTaxonSchema.parse(taxaFixture[0]);
    render(<TaxonArt taxon={taxon} />);
    expect(screen.getByRole('img', { name: `Line drawing of a ${taxon.commonName}` })).toBeInTheDocument();
  });
});
