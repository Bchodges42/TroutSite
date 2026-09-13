import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HatchKeyPage } from '../src/pages/HatchKeyPage';
import { SettingsProvider } from '../src/lib/settings';

/**
 * T2-39 — hatch key onboarding: a "not sure" path through the size step,
 * plain-language size hints, and a visible step counter.
 */

vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })) as unknown as typeof fetch,
);

function renderKey() {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={['/hatch-key']}>
          <HatchKeyPage />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

describe('T2-39 — hatch key onboarding', () => {
  it('shows a visible step counter and plain-language size hints', () => {
    renderKey();
    expect(screen.getByText(/^Step 1 of 6/)).toBeInTheDocument();
    expect(screen.getAllByText(/stoneflies, hoppers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tiny — midges/i).length).toBeGreaterThan(0);
  });

  it("'Not sure' starts the beginner at #16 and labels the size as assumed in results", async () => {
    const user = userEvent.setup();
    renderKey();
    await user.click(screen.getByRole('button', { name: /Not sure — start me with a #16/i }));
    // Lands on the color step without requiring a size pick.
    expect(screen.getAllByText(/body color/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'olive' }));
    await user.click(screen.getByRole('button', { name: /^2 tails/ }));
    await user.click(
      screen.getByRole('button', { name: 'Flat plates (lamellae) along the sides' }),
    );
    await user.click(screen.getByRole('button', { name: /^slender/ }));
    await user.click(screen.getByRole('button', { name: 'See matches' }));
    const note = await screen.findByRole('note');
    expect(note).toHaveTextContent(/size was assumed \(#16\)/i);
    expect(note).toHaveTextContent(/re-check the size/i);
  });

  it('picking a real size clears the assumed flag — no assumed note in results', async () => {
    const user = userEvent.setup();
    renderKey();
    // "Not sure" then go Back — the size step shows the assumed #16.
    await user.click(screen.getByRole('button', { name: /Not sure/i }));
    await user.click(screen.getByRole('button', { name: /← Back/i }));
    expect(screen.getByRole('button', { name: /^#16/ })).toBeVisible();
    // Choosing a real size now is a measurement, not an assumption: the full
    // flow to results must NOT carry the assumed-size note.
    const size18 = screen.getAllByRole('button').find((b) => b.textContent?.startsWith('#18'));
    expect(size18).toBeTruthy();
    await user.click(size18!);
    await user.click(screen.getByRole('button', { name: 'olive' }));
    await user.click(screen.getByRole('button', { name: /^2 tails/ }));
    await user.click(
      screen.getByRole('button', { name: 'Flat plates (lamellae) along the sides' }),
    );
    await user.click(screen.getByRole('button', { name: /^slender/ }));
    await user.click(screen.getByRole('button', { name: 'See matches' }));
    // Results reached; the assumed-size note is absent for a real pick.
    expect(document.getElementById('hatch-results-heading')).not.toBeNull();
    expect(screen.queryByRole('note')).toBeNull();
  });
});

/** T2-43 — a missing region-month chart is announced, never silently re-ranked. */
describe('T2-43 — chartless hatch key notice', () => {
  it('says matching is key-features-and-season only when the chart is not cached', async () => {
    const user = userEvent.setup();
    renderKey();
    // Any full observation completes the context step only after the picks —
    // drive to the results via "Not sure" and the standard picks.
    await user.click(screen.getByRole('button', { name: /Not sure/i }));
    await user.click(screen.getByRole('button', { name: 'olive' }));
    await user.click(screen.getByRole('button', { name: /^2 tails/ }));
    await user.click(
      screen.getByRole('button', { name: 'Flat plates (lamellae) along the sides' }),
    );
    await user.click(screen.getByRole('button', { name: /^slender/ }));
    await user.click(screen.getByRole('button', { name: 'See matches' }));
    expect(await screen.findByRole('note', { name: 'Chart not cached notice' })).toHaveTextContent(
      /matching by key features and season only/i,
    );
  });
});
