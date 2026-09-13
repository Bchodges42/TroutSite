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
    expect(screen.getByLabelText('Condition score 90 out of 100 — Good')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows marginal and poor bands', () => {
    render(
      <>
        <ScorePill score={50} />
        <ScorePill score={20} />
      </>,
    );
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });
});

describe('FreshnessChip', () => {
  it('labels a network response as a snapshot, not a live observation', () => {
    render(<FreshnessChip fetchedAt={Date.now() - 2 * 60_000} live />);
    expect(screen.getByText(/Snapshot · 2 minutes ago/)).toBeInTheDocument();
  });

  it('shows Gauge live · observed with the reading age when observedAt is present', () => {
    render(<FreshnessChip fetchedAt={Date.now()} live observedAt={Date.now() - 2 * 60_000} />);
    expect(screen.getByText(/Gauge live · observed 2 minutes ago/)).toBeInTheDocument();
  });

  it('shows Gauge stale · observed when the newest reading is old, even on a live fetch', () => {
    render(
      <FreshnessChip fetchedAt={Date.now()} live observedAt={Date.now() - 4 * 60 * 60_000} />,
    );
    expect(screen.getByText(/Gauge stale · observed 4 hours ago/)).toBeInTheDocument();
  });

  it('never claims Live without reading timestamps', () => {
    render(<FreshnessChip fetchedAt={Date.now() - 2 * 60_000} live />);
    expect(screen.getByText(/Snapshot · 2 minutes ago/)).toBeInTheDocument();
    expect(screen.queryByText(/Live ·/)).not.toBeInTheDocument();
  });

  it('shows Cached · last known when using cached data online', () => {
    render(<FreshnessChip fetchedAt={Date.now() - 90 * 60_000} live={false} />);
    expect(screen.getByText(/Cached · last known/)).toBeInTheDocument();
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

  // H4/C1: the feed's own nextExpectedUpdate, when already past, must surface
  // right on the chip — an unhealthy feed is visible without expanding the
  // source disclosure, and a fresh fetch cannot make it look healthy.
  it('flags update overdue when the promised next update has passed', () => {
    render(
      <FreshnessChip
        fetchedAt={Date.now() - 26 * 60 * 60_000}
        live
        nextExpectedAt={Date.now() - 25 * 60 * 60_000}
      />,
    );
    expect(screen.getByText(/Snapshot · .* · update overdue/)).toBeInTheDocument();
  });

  it('does not flag overdue while the promised update is still in the future', () => {
    render(
      <FreshnessChip
        fetchedAt={Date.now() - 30 * 60_000}
        live
        nextExpectedAt={Date.now() + 30 * 60_000}
      />,
    );
    expect(screen.getByText(/Snapshot · 30 minutes ago/)).toBeInTheDocument();
    expect(screen.queryByText(/update overdue/)).not.toBeInTheDocument();
  });
});

describe('TaxonArt', () => {
  it('renders decorative line art with an accessible label', () => {
    const taxon = BugTaxonSchema.parse(taxaFixture[0]);
    render(<TaxonArt taxon={taxon} />);
    expect(
      screen.getByRole('img', { name: `Line drawing of a ${taxon.commonName}` }),
    ).toBeInTheDocument();
  });
});

describe('T2-36 — the visible header search owns the / shortcut', () => {
  it('focuses the visible instance, never a hidden one, when / is pressed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })) as unknown as typeof fetch);
    const { render } = await import('@testing-library/react');
    const user = (await import('@testing-library/user-event')).default;
    const { RiverSearch } = await import('../src/features/map/RiverSearch');
    // One visible instance (header-like) + one inside a display:none container
    // (sidebar-like — mounted but hidden).
    render(
      <>
        <RiverSearch shortcut />
        <div style={{ display: 'none' }} data-testid="hidden-host">
          <RiverSearch shortcut />
        </div>
      </>,
    );
    await user.keyboard('/');
    const inputs = document.querySelectorAll<HTMLInputElement>('.search-input');
    expect(inputs[1]).not.toHaveFocus();
    expect(inputs[0]).toHaveFocus();
  });
});
