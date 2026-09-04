import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiverSearch } from '../src/features/map/RiverSearch';
import { applyTheme, initialTheme, themes, THEME_KEY } from '../src/theme/themes';
import { atlasStyle } from '../src/features/map/mapStyle';
import { contextUrl, validMonth } from '../src/lib/riverContext';
import { conditionReason, waterIdentity } from '../src/lib/presentation';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Fieldwork themes', () => {
  it('defaults to Daybreak and honors saved selection', () => {
    expect(initialTheme()).toBe('daybreak');
    localStorage.setItem(THEME_KEY, 'nightfall');
    expect(initialTheme()).toBe('nightfall');
  });
  it('preserves legacy basemap deep links without changing layout', () => {
    localStorage.setItem(THEME_KEY, 'nightfall');
    window.history.replaceState({}, '', '/?basemap=paper');
    expect(initialTheme()).toBe('daybreak');
  });
  it('applies chrome and map tokens together', () => {
    for (const theme of Object.values(themes)) {
      applyTheme(theme.id);
      expect(document.documentElement.dataset.theme).toBe(theme.id);
      expect(document.documentElement.style.getPropertyValue('--ui-accent')).toBe(
        theme.colors.accent,
      );
      expect(document.documentElement.style.getPropertyValue('--map-selection')).toBe(
        theme.map.selection,
      );
      expect(
        atlasStyle('paper', theme.map).layers.find((l) => l.id === 'background')?.paint,
      ).toEqual({ 'background-color': theme.map.paper });
    }
  });
  it('keeps map assets first-party, unknown lines dashed, and selection/hover distinct', () => {
    for (const theme of Object.values(themes)) {
      const style = atlasStyle('topo', theme.map);
      expect(JSON.stringify(style.sources)).not.toMatch(/https?:\/\//);
      expect(style.layers.find((l) => l.id === 'rivers-unassessed')?.paint).toHaveProperty(
        'line-dasharray',
      );
      expect(JSON.stringify(style.layers)).toContain(theme.map.hover);
      expect(theme.map.selection).not.toBe(theme.map.good);
    }
  });
  it('renders still waters as zoom-scaled rings with a 44px minimum hit target', () => {
    for (const theme of Object.values(themes)) {
      const style = atlasStyle('paper', theme.map);
      const ids = style.layers.map((layer) => layer.id);
      expect(ids).toContain('rivers-point-halo');
      expect(ids).toContain('rivers-point-center');
      const marker = style.layers.find((layer) => layer.id === 'rivers-point');
      expect(JSON.stringify(marker?.paint)).toContain('feature-state","hover');
      const hit = style.layers.find((layer) => layer.id === 'rivers-point-hit');
      expect(JSON.stringify(hit?.paint)).toContain('22');
    }
  });
  it('gives catalog polygons a base, state wash, shore, and generous transparent hit surface', () => {
    for (const theme of Object.values(themes)) {
      const layers = atlasStyle('paper', theme.map).layers;
      const ids = layers.map((layer) => layer.id);
      expect(ids.indexOf('rivers-water-base')).toBeLessThan(ids.indexOf('rivers-water'));
      expect(ids.indexOf('rivers-water')).toBeLessThan(ids.indexOf('rivers-water-shore'));
      expect(ids.indexOf('rivers-water-shore')).toBeLessThan(ids.indexOf('rivers-water-hit'));
      expect(JSON.stringify(layers.find((layer) => layer.id === 'rivers-water')?.paint)).toContain(
        'feature-state","hover',
      );
      expect(layers.find((layer) => layer.id === 'rivers-water-hit')).toMatchObject({
        type: 'fill',
        filter: ['==', '$type', 'Polygon'],
      });
      expect(layers.find((layer) => layer.id === 'rivers-water-hit-outline')?.paint).toHaveProperty(
        'line-width',
        18,
      );
    }
  });
});

it('uses contour relief in Nightfall without the opaque light raster footprint', () => {
  const night = atlasStyle('topo', themes.nightfall.map);
  expect(night.layers.find((l) => l.id === 'topo-hillshade')?.layout).toHaveProperty(
    'visibility',
    'none',
  );
  expect(night.layers.find((l) => l.id === 'topo-contours-major')).toBeDefined();
  expect(
    atlasStyle('topo', themes.daybreak.map).layers.find((l) => l.id === 'topo-hillshade')?.layout,
  ).toHaveProperty('visibility', 'visible');
});

it('masks rectangular relief extents outside the real Tennessee boundary in both themes', () => {
  for (const theme of Object.values(themes)) {
    const layers = atlasStyle('topo', theme.map).layers.map((layer) => layer.id);
    expect(layers.indexOf('states-context-fill')).toBeGreaterThan(
      layers.indexOf('topo-contours-minor'),
    );
    expect(layers.indexOf('terrain-outside-mask')).toBeGreaterThan(
      layers.indexOf('topo-contours-minor'),
    );
    expect(layers.indexOf('tn-outline')).toBeGreaterThan(layers.indexOf('terrain-outside-mask'));
    expect(layers.indexOf('tn-outline')).toBeGreaterThan(layers.indexOf('states-context-fill'));
    expect(layers.indexOf('rivers-interior')).toBeGreaterThan(layers.indexOf('tn-outline'));
  }
});

describe('River navigation context', () => {
  it('carries only water, region, and month across workflows', () => {
    const params = new URLSearchParams(
      'river=caney&region=tn-middle-caney-fork&month=5&tab=Hatch&terrain=1',
    );
    expect(contextUrl('/patterns/foo', params)).toBe(
      '/patterns/foo?river=caney&region=tn-middle-caney-fork&month=5',
    );
  });
  it('allows a calendar month override and explicit river clearing', () => {
    expect(
      contextUrl('/charts', new URLSearchParams('river=caney&month=5'), {
        river: null,
        month: '6',
      }),
    ).toBe('/charts?month=6');
    expect(validMonth('5')).toBe(5);
    expect(validMonth('13')).toBe(new Date().getMonth() + 1);
  });
});

describe('Presentation only', () => {
  it('converts temperature prose without altering other measurements', () => {
    expect(conditionReason('Water 20°C; flow 918 cfs.', 'F')).toBe('Water 68°F; flow 918 cfs.');
  });
  it('separates a named reach without discarding it', () => {
    expect(waterIdentity('Clinch River (Norris tailwater)')).toEqual({
      name: 'Clinch River',
      reach: 'Norris tailwater',
    });
    expect(waterIdentity('Tellico River')).toEqual({ name: 'Tellico River' });
  });
});

describe('Accessible river search', () => {
  const streams = [
    { id: 'barren', name: 'Barren Fork River', regionId: 'tn-middle-caney-fork' },
    { id: 'caney', name: 'Caney Fork River', regionId: 'tn-middle-caney-fork' },
  ];
  it('ranks river-name matches before region matches and supports Enter', async () => {
    const onSelect = vi.fn(),
      user = userEvent.setup();
    render(<RiverSearch streams={streams} onSelect={onSelect} />);
    await user.type(screen.getByRole('combobox'), 'Caney');
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Caney Fork River');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('caney');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
  it('supports the advertised slash shortcut and closes only the results on Escape', async () => {
    const user = userEvent.setup();
    render(<RiverSearch streams={streams} onSelect={vi.fn()} />);
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByRole('combobox')).toHaveFocus();
    await user.keyboard('x{Escape}');
    expect(screen.getByRole('combobox')).toHaveValue('x');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
