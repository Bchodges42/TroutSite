import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderMapPage,
  seedSettings,
  stubDesktopMediaQuery,
  stubMapFeeds,
  type FeedOptions,
} from './map-page-harness';

/**
 * F43 — the map's own Trout controls must be able to override a saved
 * All-fish preference. With speciesMode=all persisted, clicking a Trout
 * control used to DELETE the URL species param; the mode fell back to the
 * saved all and every Trout control stayed aria-pressed=false. The map
 * controls now write an EXPLICIT species=trout selection; only the site-wide
 * header toggle (SpeciesModeToggle, intentionally out of scope) removes the
 * param to return to the saved default.
 */

vi.mock('../src/features/map/TennesseeMap', async () => {
  const { createElement } = await import('react');
  globalThis.__tnMapRecords = [];
  return {
    TN_BOUNDS: [
      [-90.6, 34.98],
      [-81.45, 36.75],
    ],
    TennesseeMap: (props: Record<string, unknown>) => {
      globalThis.__tnMapRecords!.push(props);
      return createElement('div', { 'data-testid': 'map-stub' });
    },
  };
});

/** getByRole here matches every control named e.g. "Trout"; disambiguate by class. */
function byClass(className: string, name: string): HTMLElement {
  const el = screen
    .getAllByRole('button', { name })
    .find((candidate) => candidate.classList.contains(className));
  if (!el) throw new Error(`no .${className} button named "${name}"`);
  return el;
}

function feedOptions(): FeedOptions {
  return {
    streams: [
      {
        id: 'beech-lake',
        name: 'Beech Lake',
        stateId: 'TN',
        waterbodyType: 'lake',
        regionId: 'tn-west',
        gaugeIds: [],
        stockingProgram: true,
        idealFlow: [],
        officialSources: [],
        species: 'warmwater',
      },
    ],
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('map Trout controls override a saved All-fish preference (F43)', () => {
  it('the sidebar Trout filter chip writes an explicit species=trout', async () => {
    stubDesktopMediaQuery();
    await seedSettings({ speciesMode: 'all' });
    vi.stubGlobal('fetch', stubMapFeeds(feedOptions()));
    renderMapPage('/');

    // Saved all-fish mode is in force: All fish pressed, Trout not.
    const troutChip = await byClass('filter-chip', 'Trout');
    await waitFor(() => {
      expect(byClass('filter-chip', 'All fish')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
    expect(troutChip).toHaveAttribute('aria-pressed', 'false');

    const user = userEvent.setup();
    await user.click(troutChip);

    // The override is an EXPLICIT param — never a deletion that falls back
    // to the saved preference.
    await waitFor(() => {
      expect(globalThis.__mapPageSearch).toContain('species=trout');
    });
    expect(byClass('filter-chip', 'Trout')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(byClass('filter-chip', 'All fish')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('the map-tool Trout button writes an explicit species=trout', async () => {
    stubDesktopMediaQuery();
    await seedSettings({ speciesMode: 'all' });
    vi.stubGlobal('fetch', stubMapFeeds(feedOptions()));
    renderMapPage('/');

    const troutTool = await byClass('map-tool', 'Trout');
    const user = userEvent.setup();
    await user.click(troutTool);

    await waitFor(() => {
      expect(globalThis.__mapPageSearch).toContain('species=trout');
    });
    expect(byClass('map-tool', 'Trout')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('the desktop Segmented selector writes an explicit species=trout', async () => {
    stubDesktopMediaQuery();
    await seedSettings({ speciesMode: 'all' });
    vi.stubGlobal('fetch', stubMapFeeds(feedOptions()));
    renderMapPage('/');

    const troutTab = await screen.findByRole('tab', { name: 'Trout' });
    const user = userEvent.setup();
    await user.click(troutTab);

    await waitFor(() => {
      expect(globalThis.__mapPageSearch).toContain('species=trout');
    });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Trout' })).toHaveAttribute('aria-selected', 'true');
    });
    // All-fish stays explicit too.
    await user.click(screen.getByRole('tab', { name: 'All fish' }));
    await waitFor(() => {
      expect(globalThis.__mapPageSearch).toContain('species=all');
    });
  });
});
