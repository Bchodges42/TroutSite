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
  it('renders a continuous water corridor under every river line, with the condition color narrower and above it', () => {
    for (const theme of Object.values(themes)) {
      const style = atlasStyle('paper', theme.map);
      const ids = style.layers.map((layer) => layer.id);
      const base = style.layers.find((layer) => layer.id === 'rivers-base');
      const interior = style.layers.find((layer) => layer.id === 'rivers-interior');
      // Corridor sits between the casing and the condition centerline.
      expect(ids.indexOf('rivers-base')).toBeGreaterThan(ids.indexOf('rivers-casing'));
      expect(ids.indexOf('rivers-base')).toBeLessThan(ids.indexOf('rivers-interior'));
      // Solid water, never dashed: unassessed water still reads as water.
      expect(base?.paint).not.toHaveProperty('line-dasharray');
      // The corridor does not depend on the assessed state — it is visible for
      // every line, and selection/hover/dimmed/hidden are all honored.
      const basePaint = JSON.stringify(base?.paint);
      expect(basePaint).not.toContain('assessed');
      expect(basePaint).toContain('selected');
      expect(basePaint).toContain('hover');
      expect(basePaint).toContain('dimmed');
      expect(basePaint).toContain('hidden');
      // The condition centerline is narrower than the corridor (1.9 < 3.2).
      expect(JSON.stringify(interior?.paint)).toContain('1.9');
      expect(JSON.stringify(base?.paint)).toContain('3.2');
      // The corridor derives from the theme's water tones in both themes.
      expect(basePaint).toMatch(/#[0-9a-f]{6}/i);
    }
  });
  it('crossfades unassessed dashes from a quiet state-zoom treatment to clear local dashes', () => {
    for (const theme of Object.values(themes)) {
      const style = atlasStyle('ink', theme.map);
      const quiet = style.layers.find((layer) => layer.id === 'rivers-unassessed-quiet');
      const clear = style.layers.find((layer) => layer.id === 'rivers-unassessed');
      for (const layer of [quiet, clear]) {
        expect(layer?.paint).toHaveProperty('line-dasharray');
        // Dashes are unassessed-only: an assessed water never shows one.
        expect(JSON.stringify(layer?.paint)).toContain('assessed');
        expect(JSON.stringify(layer?.paint)).toContain('hidden');
      }
      // State zoom: the quiet tight dash reads as one cohesive river, then
      // fades out by z8.6 where the clearer dash takes over.
      expect(JSON.stringify(quiet?.paint)).toContain('5.6');
      expect(JSON.stringify(quiet?.paint)).toContain('8.6,0');
      expect(JSON.stringify(quiet?.paint)).toContain('0.22');
      // Regional/local zoom: honest, clearly dashed "no condition here".
      expect(JSON.stringify(clear?.paint)).toContain('7.4,0');
      expect(JSON.stringify(clear?.paint)).toContain('9.4');
      // The clearer dash is heavier than the quiet one.
      expect(JSON.stringify(clear?.paint)).toContain('2.3');
      expect(JSON.stringify(quiet?.paint)).toContain('1.9');
    }
  });
});

it('renders terrain relief in BOTH themes from the shadow-alpha tiles', () => {
  // The hillshade assets are shadow-only alpha WebP clipped to TN+3km, and the
  // service worker's CacheFirst topo cache is purged when the asset build
  // changes (lib/atlasAvailability). Terrain therefore no longer needs the old
  // Nightfall workaround of hiding the raster entirely — valid terrain shows
  // in both themes, subdued on the dark ground.
  const night = atlasStyle('topo', themes.nightfall.map);
  expect(night.layers.find((l) => l.id === 'topo-hillshade')?.layout).toHaveProperty(
    'visibility',
    'visible',
  );
  expect(night.layers.find((l) => l.id === 'topo-contours-major')).toBeDefined();
  // Nightfall draws the shadow-alpha hillshade subdued but really present.
  const nightHillshade = night.layers.find((l) => l.id === 'topo-hillshade') as {
    paint: Record<string, number>;
  };
  expect(nightHillshade.paint['raster-opacity']).toBe(themes.nightfall.map.reliefOpacity);
  expect(themes.nightfall.map.reliefOpacity).toBeGreaterThan(0);
  expect(
    atlasStyle('topo', themes.daybreak.map).layers.find((l) => l.id === 'topo-hillshade')?.layout,
  ).toHaveProperty('visibility', 'visible');
});

it('no longer carries the relief masking machinery — the merged topo assets are TN-clipped', () => {
  for (const theme of Object.values(themes)) {
    const style = atlasStyle('topo', theme.map);
    const ids = style.layers.map((layer) => layer.id);
    expect(ids).not.toContain('terrain-outside-mask');
    // The neighboring-state context sits in its natural place below the
    // boundary contours; no reordering trick, no paper fill-over.
    expect(ids.indexOf('states-context-fill')).toBeLessThan(ids.indexOf('tn-contour'));
    expect(Object.keys(style.sources)).not.toContain('terrain-outside-mask');
  }
});

it('builds quiet road layers beneath every water layer only from a roads manifest', () => {
  const roads = {
    files: [
      { file: 'roads-major.geojson', lod: 'major' },
      { file: 'roads-mid.geojson', lod: 'mid' },
      { file: 'roads-minor.geojson', lod: 'minor' },
    ],
    attribution: 'Roads: US Census TIGER',
  };
  for (const theme of Object.values(themes)) {
    for (const variant of ['paper', 'ink', 'topo'] as const) {
      const withRoads = atlasStyle(variant, theme.map, { roads });
      const ids = withRoads.layers.map((layer) => layer.id);
      // One layer per manifest entry, zoom-gated by LOD, riding above the
      // ground and beneath ALL water.
      expect(ids).toContain('roads-0');
      expect(ids).toContain('roads-2');
      expect(ids.indexOf('roads-0')).toBeLessThan(ids.indexOf('lakes-fill'));
      // LOD zoom gates: majors from the state view, minor trails last.
      expect(withRoads.layers.find((l) => l.id === 'roads-0')).toHaveProperty('minzoom', 5.6);
      expect(withRoads.layers.find((l) => l.id === 'roads-1')).toHaveProperty('minzoom', 8);
      const minor = withRoads.layers.find((l) => l.id === 'roads-2');
      expect(minor).toHaveProperty('minzoom', 9.5);
      expect(JSON.stringify(minor?.paint)).toContain(theme.map.road);
      // Same-origin source only — the manifest contract never leaks a URL.
      expect(JSON.stringify(withRoads.sources)).not.toMatch(/https?:\/\//);
      // Sources point at the atlas-root files the roads session delivered.
      expect(JSON.stringify(withRoads.sources)).toContain('/atlas/roads-minor.geojson');
    }
  }
  // No manifest, no roads: the style is unchanged and claims nothing.
  const without = atlasStyle('paper', themes.daybreak.map);
  expect(without.layers.map((l) => l.id)).not.toContain('roads-0');
  // An explicit minZoom on a manifest entry overrides the LOD default.
  const explicit = atlasStyle('paper', themes.daybreak.map, {
    roads: { files: [{ file: 'roads-major.geojson', lod: 'major', minZoom: 7 }] },
  });
  expect(explicit.layers.find((l) => l.id === 'roads-0')).toHaveProperty('minzoom', 7);
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
    {
      id: 'piney-hickman',
      name: 'Piney River (Hickman County)',
      aliases: ['Piney River'],
      regionId: 'tn-middle-duck-elk',
    },
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
  it('finds a disambiguated catalog entity by its ordinary local alias', async () => {
    const user = userEvent.setup();
    render(<RiverSearch streams={streams} onSelect={vi.fn()} />);
    await user.type(screen.getByRole('combobox'), 'Piney River');
    expect(screen.getByRole('option')).toHaveTextContent('Piney River (Hickman County)');
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
