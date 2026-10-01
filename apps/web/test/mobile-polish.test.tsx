import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RiverDrawer } from '../src/features/map/RiverDrawer';
import { SettingsProvider } from '../src/lib/settings';
import type { RiverMapFeature } from '../src/features/map/riverMapSelectors';
import type { ConditionSnapshot } from '@trout/contracts';
import {
  SHEET_SNAP_POINTS,
  readKeyboardInset,
  resetDrawerSessionStores,
  snapToState,
  snapValueFor,
} from '../src/features/map/riverDrawerTabs';
import { renderMapPage, stubMapFeeds } from './map-page-harness';

/**
 * Mobile-polish wave: the compact peek snap, per-tab scroll + per-water visit
 * memory, and the visualViewport keyboard spacer. jsdom cannot run a real Vaul
 * drag, so the sheet tests assert the CONFIG and STATE LOGIC: vaul is stubbed
 * at the module boundary, recording every Drawer.Root prop it is given.
 */

vi.mock('vaul', async () => {
  const { createElement, Fragment } = await import('react');
  const store: { root?: Record<string, unknown> } = {};
  (globalThis as unknown as { __vaulStore?: typeof store }).__vaulStore = store;
  const passthrough = ({ children }: { children?: React.ReactNode }) =>
    createElement(Fragment, null, children);
  return {
    Drawer: {
      Root: (props: Record<string, unknown> & { open?: boolean; children?: React.ReactNode }) => {
        store.root = props;
        return createElement('div', { 'data-testid': 'vaul-root' }, props.open ? props.children : null);
      },
      Portal: passthrough,
      Content: ({ className, children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) =>
        createElement('div', { className, ...rest }, children),
      Title: ({ children }: { children?: React.ReactNode }) => createElement('div', null, children),
      Overlay: () => null,
      Handle: () => null,
      Close: passthrough,
      Trigger: passthrough,
    },
  };
});

vi.mock('../src/features/map/TennesseeMap', async () => {
  const { createElement } = await import('react');
  return {
    TN_BOUNDS: [
      [-90.6, 34.98],
      [-81.45, 36.75],
    ],
    TennesseeMap: () => createElement('div', { 'data-testid': 'map-stub' }),
  };
});

function vaulRoot(): Record<string, unknown> {
  const root = (globalThis as unknown as { __vaulStore?: { root?: Record<string, unknown> } })
    .__vaulStore?.root;
  if (!root) throw new Error('Drawer.Root has not rendered yet');
  return root;
}

const STREAMS = [
  {
    id: 'beech-lake',
    name: 'Beech Lake',
    stateId: 'TN',
    waterbodyType: 'lake',
    regionId: 'tn-west',
    hydroIdentity: { gnisIds: ['00000001'], huc8s: ['08000001'] },
    gaugeIds: [],
    stockingProgram: false,
    idealFlow: [],
    officialSources: [],
    species: 'trout',
  },
  {
    id: 'willow-creek',
    name: 'Willow Creek',
    stateId: 'TN',
    waterbodyType: 'river',
    regionId: 'tn-west',
    hydroIdentity: { gnisIds: ['00000002'], huc8s: ['08000002'] },
    gaugeIds: [],
    stockingProgram: false,
    idealFlow: [],
    officialSources: [],
    species: 'trout',
  },
];

function makeFeature(id = 'beech-lake', name = 'Beech Lake'): RiverMapFeature {
  return {
    stream: {
      id,
      name,
      stateId: 'TN',
      waterbodyType: 'lake',
      regionId: 'tn-west',
      hydroIdentity: { gnisIds: [], huc8s: [] },
      gaugeIds: ['g1'],
      stockingProgram: false,
      idealFlow: [],
      officialSources: [],
      species: 'trout',
    },
    snapshot: {
      streamId: id,
      fetchedAt: new Date().toISOString(),
      nextExpectedUpdate: new Date().toISOString(),
      score: { value: 72, assessed: true, reasons: ['Within the ideal range.'] },
      readings: [{ gaugeId: 'g1', timestamp: new Date().toISOString(), cfs: 100, tempC: 12 }],
    } as unknown as ConditionSnapshot,
    status: 'good',
    score: 72,
    species: 'trout',
  } as unknown as RiverMapFeature;
}

function DrawerHarness({
  feature,
  layout,
}: {
  feature: RiverMapFeature;
  layout: 'panel' | 'sheet';
}) {
  const [tab, setTab] = useState<'Water' | 'Hatch' | 'Stocking' | 'Reports' | 'Your Log'>('Water');
  return (
    <RiverDrawer
      feature={feature}
      tab={tab}
      onTab={setTab}
      onClose={() => {}}
      modeMonth={7}
      live={false}
      layout={layout}
    />
  );
}

function renderDrawer(feature: RiverMapFeature, layout: 'panel' | 'sheet' = 'panel') {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={['/']}>
          <DrawerHarness feature={feature} layout={layout} />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', stubMapFeeds({ streams: STREAMS }));
  resetDrawerSessionStores();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetDrawerSessionStores();
});

describe('sheet snap helpers', () => {
  it('exposes the [peek, half, expanded] snap set and buckets values onto states', () => {
    expect(SHEET_SNAP_POINTS).toEqual([0.28, 0.49, 0.82]);
    expect(snapValueFor('peek')).toBe(0.28);
    expect(snapValueFor('half')).toBe(0.49);
    expect(snapValueFor('expanded')).toBe(0.82);
    expect(snapToState(0.28)).toBe('peek');
    expect(snapToState(0.49)).toBe('half');
    expect(snapToState(0.82)).toBe('expanded');
    expect(snapToState(0.4)).toBe('half'); // mid-drag value settles to nearest
    expect(snapToState(null)).toBe('half'); // vaul can report null on dismiss
  });

  it('treats URL-bar-sized viewport changes as zero keyboard inset', () => {
    expect(readKeyboardInset({ height: 720, offsetTop: 40 }, 768)).toBe(0);
    expect(readKeyboardInset({ height: 470, offsetTop: 0 }, 768)).toBe(298);
    expect(readKeyboardInset(null, 768)).toBe(0);
  });
});

describe('peek snap point in the vaul sheet config', () => {
  it(
    'configures vaul with the 0.28/0.49/0.82 snap points and settles each state',
    { timeout: 20_000 },
    async () => {
      renderMapPage('/?river=beech-lake');
      // The drawer loads with the catalog; the sheet config exists from the
      // first render, the tab chrome only once the feature is in.
      await screen.findByRole('heading', { level: 2, name: 'Beech Lake' }, { timeout: 15_000 });
      expect(vaulRoot().snapPoints).toEqual([0.28, 0.49, 0.82]);
      // The long-standing default position is unchanged: half.
      expect(vaulRoot().activeSnapPoint).toBe(0.49);
      expect(screen.getByRole('tablist')).toBeTruthy();

      act(() => vaulRoot().setActiveSnapPoint(0.28));
      expect(vaulRoot().activeSnapPoint).toBe(0.28);
      // Peek collapses the tab chrome but keeps the overview summary readable.
      expect(screen.queryByRole('tablist')).toBeNull();
      expect(screen.getByRole('heading', { level: 2, name: 'Beech Lake' })).toBeTruthy();

      act(() => vaulRoot().setActiveSnapPoint(0.82));
      expect(vaulRoot().activeSnapPoint).toBe(0.82);
      expect(screen.getByRole('button', { name: 'Show map' })).toBeTruthy();
      expect(screen.getByRole('tablist')).toBeTruthy();
    },
  );
});

describe('per-tab scroll restoration', () => {
  it('keeps each tab’s scroll position while switching tabs in a visit', async () => {
    renderDrawer(makeFeature());
    const body = (await screen.findByRole('tabpanel')) as HTMLElement;
    body.scrollTop = 120;
    fireEvent.click(screen.getByRole('tab', { name: 'Hatches' }));
    // A tab never scrolled starts at the top…
    expect(body.scrollTop).toBe(0);
    body.scrollTop = 300;
    fireEvent.click(screen.getByRole('tab', { name: 'Conditions' }));
    // …and the Water tab returns exactly where it was left.
    expect(body.scrollTop).toBe(120);
  });
});

describe('visit memory across sheet reopen', () => {
  it(
    'reopens the same water at its last tab + snap, and a new water at the defaults',
    { timeout: 30_000 },
    async () => {
      renderMapPage('/?river=beech-lake');
      await screen.findByRole('heading', { level: 2, name: 'Beech Lake' }, { timeout: 15_000 });

    // Visit leaves the water on the Hatches tab, which expands the sheet.
    fireEvent.click(screen.getByRole('tab', { name: 'Hatches' }));
    await waitFor(() =>
      expect(String((globalThis as unknown as { __mapPageSearch?: string }).__mapPageSearch)).toContain(
        'tab=Hatch',
      ),
    );
    expect(vaulRoot().activeSnapPoint).toBe(0.82);

    // Close the sheet, then pick a DIFFERENT water: defaults, not beech's state.
    act(() => vaulRoot().onOpenChange(false));
    fireEvent.click(await screen.findByRole('button', { name: /Select Willow Creek/ }));
    expect(vaulRoot().activeSnapPoint).toBe(0.49);
    expect(
      String((globalThis as unknown as { __mapPageSearch?: string }).__mapPageSearch),
    ).toContain('river=willow-creek');
    expect(
      String((globalThis as unknown as { __mapPageSearch?: string }).__mapPageSearch),
    ).toContain('tab=Water');

    // Reopen the first water: its remembered tab + snap come back.
    act(() => vaulRoot().onOpenChange(false));
    fireEvent.click(await screen.findByRole('button', { name: /Select Beech Lake/ }));
    expect(vaulRoot().activeSnapPoint).toBe(0.82);
    expect(
      String((globalThis as unknown as { __mapPageSearch?: string }).__mapPageSearch),
    ).toContain('river=beech-lake');
    expect(
      String((globalThis as unknown as { __mapPageSearch?: string }).__mapPageSearch),
    ).toContain('tab=Hatch');
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Hatches' }).getAttribute('aria-selected')).toBe(
        'true',
      ),
    );
    },
  );
});

describe('soft keyboard (visualViewport) spacer', () => {
  it('raises scroll room for the quick-log actions while the keyboard is up', async () => {
    const listeners: Record<string, Set<() => void>> = {};
    const viewport = {
      height: 480, // jsdom innerHeight is 768 → inset 288
      offsetTop: 0,
      addEventListener: (type: string, cb: () => void) => {
        (listeners[type] ??= new Set()).add(cb);
      },
      removeEventListener: (type: string, cb: () => void) => {
        listeners[type]?.delete(cb);
      },
    };
    vi.stubGlobal('visualViewport', viewport);

    // layout="sheet" mirrors the mobile bottom sheet, where the keyboard can
    // cover the tab panel's tail content.
    renderDrawer(makeFeature(), 'sheet');
    fireEvent.click(await screen.findByRole('button', { name: 'Log trip' }));
    expect(screen.getByTestId('quick-log-form')).toBeTruthy();

    const spacer = document.querySelector(
      '[data-testid="keyboard-spacer"]',
    ) as HTMLElement | null;
    expect(spacer).not.toBeNull();
    expect(spacer.style.height).toBe('288px');
    expect(screen.getByRole('tabpanel').contains(spacer)).toBe(true);

    // Keyboard closes → the resize listener drops the inset and the spacer.
    viewport.height = 768;
    act(() => {
      listeners.resize!.forEach((cb) => cb());
    });
    expect(document.querySelector('[data-testid="keyboard-spacer"]')).toBeNull();
  });
});
