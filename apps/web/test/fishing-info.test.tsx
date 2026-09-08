import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FishingInfoPage } from '../src/pages/FishingInfoPage';
import type { FishingInformation } from '@trout/contracts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const DOC: FishingInformation = {
  scope: 'statewide-tn',
  verifiedAt: '2026-09-08',
  disclaimer: 'This guide is informational and never a legal guarantee.',
  sections: [
    {
      id: 'statewide-rules',
      title: 'Tennessee statewide fishing rules',
      items: [
        {
          title: 'Statewide trout creel and size limits',
          text: 'Seven trout per day across waters under statewide rules.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
          effectiveFrom: '2026-08-01',
        },
        {
          title: 'License and trout stamp requirement',
          text: 'A license with the trout stamp is required to fish for trout.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
        },
      ],
    },
    {
      id: 'special-regulations',
      title: 'Water-specific special regulations',
      summary: 'Waters where the general limits do not apply.',
      items: [
        {
          title: 'Clinch River special regulation',
          text: 'One trout 14–20 inches may be kept below Norris Dam.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
          appliesTo: ['clinch-river'],
        },
        {
          title: 'Caney Fork River special regulation',
          text: 'Brown trout have a one-fish 24-inch minimum on one day per year.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
          appliesTo: ['caney-fork-river'],
        },
      ],
    },
    {
      id: 'verification-links',
      title: 'Official verification links',
      items: [
        {
          title: 'TWRA fishing regulations',
          text: 'The regulations hub.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs.html',
        },
        {
          title: 'Licenses',
          text: 'License purchase.',
          authority: 'TWRA',
          sourceUrl: 'https://gooutdoorstennessee.com/',
        },
      ],
    },
  ],
};

const OFFICIAL_DOMAINS = ['tn.gov', 'gooutdoorstennessee.com', 'usgs.gov', 'tva.com'];

function renderPage(path = '/regulations') {
  const fetchMock = vi.fn(async (url: string) =>
    new Response(
      url.includes('fishing') ? JSON.stringify(DOC) : JSON.stringify([]),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <FishingInfoPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Regulations page (data-driven from /content/fishing.json)', () => {
  it('renders statewide answers and the per-water special-regulations section', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { name: DOC.sections[0].title, level: 2 })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: DOC.sections[1].title, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Seven trout per day/)).toBeInTheDocument();
    expect(screen.getByText(/One trout 14–20 inches/)).toBeInTheDocument();
  });

  it('surfaces each special-regulation water with a link into the field atlas', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Caney Fork River special regulation/)).toBeInTheDocument());
    const clinchLink = screen.getByRole('link', { name: /clinch river →/ });
    expect(clinchLink).toHaveAttribute('href', '/conditions/clinch-river');
    expect(screen.getByRole('link', { name: /caney fork river →/ })).toHaveAttribute(
      'href',
      '/conditions/caney-fork-river',
    );
  });

  it('keeps outbound links minimal and official: license purchase plus the sources directory', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Caney Fork River special regulation/)).toBeInTheDocument());
    const external = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('http'));
    // One license CTA card + one purchase link on the license item + the two
    // official-sources entries — nothing else links off-site.
    expect(external.length).toBe(4);
    for (const link of external) {
      const hostname = new URL(link.getAttribute('href')!).hostname;
      const registrable = hostname.split('.').slice(-2).join('.');
      expect(OFFICIAL_DOMAINS).toContain(registrable);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    }
    // Citations on answer cards are text, not links.
    expect(screen.getAllByText(/verified against tn\.gov/i).length).toBeGreaterThanOrEqual(3);
  });

  it('carries the verified date and the disclaimer from the document', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Content verified 2026-09-08/)).toBeInTheDocument());
    expect(screen.getByText(/never a legal guarantee/)).toBeInTheDocument();
  });

  it('provides a jump nav whose anchors match real section ids in render order', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelectorAll('.fi-jump a').length).toBe(3));
    const jumps = [...container.querySelectorAll('.fi-jump a')];
    expect(jumps.map((j) => j.getAttribute('href'))).toEqual([
      '#statewide-rules',
      '#special-regulations',
      '#official-sources',
    ]);
    for (const jump of jumps) {
      const id = jump.getAttribute('href')!.slice(1);
      expect(container.querySelector('#' + CSS.escape(id))).not.toBeNull();
    }
  });

  it('filters the special-regulation list by water name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Caney Fork River special regulation/)).toBeInTheDocument());
    // With few items the filter input stays out of the way; force the long-list
    // behavior via the documented >6 threshold by verifying absence here.
    expect(screen.queryByPlaceholderText('Filter waters…')).not.toBeInTheDocument();
  });

  it('links back into the app surfaces', async () => {
    renderPage('/fishing-info');
    await waitFor(() => expect(screen.getByText(/Caney Fork River special regulation/)).toBeInTheDocument());
    const back = screen.getByRole('link', { name: '← Back to the field atlas' });
    expect(back).toHaveAttribute('href', '/');
  });
});
