import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FishingInfoPage } from '../src/pages/FishingInfoPage';

afterEach(cleanup);

function renderPage(path = '/fishing-info') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FishingInfoPage />
    </MemoryRouter>,
  );
}

const OFFICIAL_DOMAINS = ['tn.gov', 'gooutdoorstennessee.com', 'usgs.gov', 'tva.com'];

describe('Fishing information & regulations guide', () => {
  it('organizes the guide around the common angler questions', () => {
    renderPage();
    for (const heading of [
      'Do I need a license?',
      'When can I fish for trout?',
      'What are the trout rules?',
      'Which waters have special regulations?',
      'What does the stocking schedule mean?',
      'Where can I legally get in?',
      'What should I check before I wade in?',
      'Official sources',
    ]) {
      expect(screen.getByRole('heading', { name: heading, level: 2 })).toBeInTheDocument();
    }
  });

  it('links every regulatory claim to an official source', () => {
    renderPage();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('http'));
    expect(links.length).toBeGreaterThanOrEqual(8);
    for (const link of links) {
      const hostname = new URL(link.getAttribute('href')!).hostname;
      const registrable = hostname.split('.').slice(-2).join('.');
      expect(OFFICIAL_DOMAINS).toContain(registrable);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    }
  });

  it('carries effective-date language and a reviewed date, and promises no completeness', () => {
    renderPage();
    expect(screen.getByText(/Guide reviewed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Effective dates:/i).length).toBeGreaterThanOrEqual(4);
    expect(
      screen.getByText(/not legal advice and not a complete summary/i),
    ).toBeInTheDocument();
    // No promise of legal completeness anywhere in the page copy.
    expect(document.body.textContent).toMatch(/never complete|not a complete summary/);
  });

  it('provides a jump nav whose anchors match real section ids', () => {
    const { container } = renderPage();
    const jumps = [...container.querySelectorAll('.fi-jump a')];
    expect(jumps.length).toBe(8);
    for (const jump of jumps) {
      const id = jump.getAttribute('href')!.slice(1);
      expect(container.querySelector('#' + CSS.escape(id))).not.toBeNull();
    }
  });

  it('renders for the /regulations alias path too', () => {
    renderPage('/regulations');
    expect(screen.getByRole('heading', { name: /Fishing information & regulations/i })).toBeInTheDocument();
  });

  it('links back into the app surfaces', () => {
    renderPage();
    const back = screen.getByRole('link', { name: '← Back to the field atlas' });
    expect(back).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'stocking browser' })).toHaveAttribute('href', '/stocking');
  });
});
