import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SpeciesModeToggle } from '../src/components/SpeciesModeToggle';
import { SettingsProvider, useSettingsContext } from '../src/lib/settings';
import { db } from '../src/lib/db';

/**
 * F6 TASK 1 — the site-wide species mode: persisted in Dexie (default
 * Trout), surfaced in the header, and readable by every surface. The map's
 * ?species= URL override wins while present; toggling in the header clears it.
 */

function Probe({ onSettings }: { onSettings: (s: { speciesMode: string }) => void }) {
  const { settings } = useSettingsContext();
  onSettings(settings);
  return null;
}

function renderToggle(route = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <SpeciesModeToggle />
                  <Probe onSettings={() => {}} />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SpeciesModeToggle — persisted site-wide species mode', () => {
  it('defaults to Trout and persists All-fish into Dexie settings', async () => {
    const user = userEvent.setup();
    renderToggle();
    expect(screen.getByRole('button', { name: 'Trout mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'All fish mode' }));
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'All fish mode' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
    await vi.waitFor(async () => {
      const row = await db.settings.get('app');
      expect(row?.value).toMatchObject({ speciesMode: 'all' });
    });
  });

  it('clears the map ?species= override when toggled on the map route', async () => {
    const user = userEvent.setup();
    let pushed = '';
    function LocationProbe() {
      const loc = useLocation();
      pushed = loc.search;
      return null;
    }
    const client = new QueryClient({
      defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <SettingsProvider>
          <MemoryRouter initialEntries={['/?species=all&river=caney-fork-river']}>
            <Routes>
              <Route
                path="*"
                element={
                  <>
                    <SpeciesModeToggle />
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>,
    );
    expect(pushed).toContain('species=all');
    await user.click(screen.getByRole('button', { name: 'Trout mode' }));
    expect(pushed).not.toContain('species=');
    expect(pushed).toContain('river=caney-fork-river');
  });
});
