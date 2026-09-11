import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MapControlGroup } from '../src/features/map/MapControlGroup';

afterEach(cleanup);

function base(overrides: Partial<Parameters<typeof MapControlGroup>[0]> = {}) {
  return {
    onRecenter: vi.fn(),
    layersOpen: false,
    onLayersToggle: vi.fn(),
    onLocate: vi.fn(),
    locating: false,
    onOpenSearch: vi.fn(),
    layersPanel: <p>terrain relief controls</p>,
    ...overrides,
  };
}

function renderGroup(overrides: Partial<Parameters<typeof MapControlGroup>[0]> = {}) {
  const props = base(overrides);
  render(<MapControlGroup {...props} />);
  return props;
}

describe('MapControlGroup', () => {
  it('exposes one restrained toolbar where every control has an accessible name', () => {
    renderGroup();
    expect(screen.getByRole('toolbar', { name: 'Map controls' })).toBeInTheDocument();
    for (const name of [
      'Center map on Tennessee',
      'Map layers',
      'Use my location',
      'Search waters',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('carries fluid tooltips that appear on hover and keyboard focus without trapping focus', () => {
    renderGroup();
    for (const name of [
      'Center map on Tennessee',
      'Map layers',
      'Use my location',
      'Search waters',
    ]) {
      const button = screen.getByRole('button', { name });
      // data-tip drives the CSS ::after tooltip for hover and :focus-visible.
      expect(button).toHaveAttribute('data-tip');
    }
    const search = screen.getByRole('button', { name: 'Search waters' });
    search.focus();
    expect(search).toHaveFocus(); // focus passes straight through — no trap
    fireEvent.focus(search);
  });

  it('keeps every touch target at the 44px minimum', async () => {
    renderGroup();
    for (const el of screen.getAllByRole('button')) {
      expect(el.className).toMatch(/map-fab/);
    }
    // jsdom applies no CSS, so pin the geometry contract against the
    // stylesheet itself: a refactor cannot silently shrink the tap target.
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    const fabRule = css.slice(css.indexOf('.map-fab {'), css.indexOf('.map-fab:hover'));
    expect(fabRule).toContain('width: 44px');
    expect(fabRule).toContain('height: 44px');
  });

  it('activates each control through its own callback', () => {
    const props = renderGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Center map on Tennessee' }));
    expect(props.onRecenter).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Search waters' }));
    expect(props.onOpenSearch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(props.onLocate).toHaveBeenCalledTimes(1);
  });

  it('opens the layers panel on activation and closes it on Escape with focus returned', () => {
    const props = renderGroup({ layersOpen: true });
    expect(screen.getByText('terrain relief controls')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onLayersToggle).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the Layers control only when the panel closes — never on mount', () => {
    const props = base();
    const { rerender } = render(<MapControlGroup {...props} layersOpen />);
    expect(screen.getByText('terrain relief controls')).toBeInTheDocument();
    rerender(<MapControlGroup {...props} layersOpen={false} />);
    expect(screen.getByRole('button', { name: 'Map layers' })).toHaveFocus();
  });

  it('does not steal focus from the page on first load', () => {
    renderGroup();
    expect(screen.getByRole('button', { name: 'Map layers' })).not.toHaveFocus();
  });

  it('defers Escape to the app menu when it is open', () => {
    const menu = document.createElement('div');
    menu.id = 'app-menu';
    document.body.appendChild(menu);
    const props = renderGroup({ layersOpen: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onLayersToggle).not.toHaveBeenCalled();
    menu.remove();
  });

  it('shows the locating state on the near-me control', () => {
    renderGroup({ locating: true });
    expect(screen.getByRole('button', { name: 'Use my location' })).toBeDisabled();
  });

  it('does NOT treat a press inside the layers panel as an outside press', () => {
    // Regression: the panel renders as a SIBLING of the toolbar, so the old
    // containment check (toolbar only) saw every press on the panel's inputs
    // as outside — mousedown unmounted the panel before the click could reach
    // the checkbox, so Terrain/Roads closed the menu without activating.
    const props = renderGroup({ layersOpen: true });
    const panel = screen.getByRole('group', { name: 'Map layers' });
    const checkboxInside = document.createElement('input');
    checkboxInside.type = 'checkbox';
    panel.appendChild(checkboxInside);
    fireEvent.mouseDown(checkboxInside);
    fireEvent.pointerDown(checkboxInside);
    expect(props.onLayersToggle).not.toHaveBeenCalled();
  });

  it('closes the panel on an intentional outside press (mouse and touch)', () => {
    const props = renderGroup({ layersOpen: true });
    fireEvent.pointerDown(document.body);
    expect(props.onLayersToggle).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(document.body);
    expect(props.onLayersToggle).toHaveBeenCalledTimes(2);
  });

  it('lets the Layers button toggle closed through its own handler, not the outside-press path', () => {
    const props = renderGroup({ layersOpen: true });
    const layersButton = screen.getByRole('button', { name: 'Map layers' });
    fireEvent.pointerDown(layersButton);
    fireEvent.click(layersButton);
    // The press is contained (no dismissal), then the button's own click
    // toggles — exactly once.
    expect(props.onLayersToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps dismissal working for checkbox-driven panel content end to end', () => {
    // The panel content comes from RiverMapPage's layerPanel; simulate the
    // real sequence a click produces: pointerdown → mousedown on the input.
    // The panel must survive both so the input's change event can fire.
    const props = renderGroup({
      layersOpen: true,
      layersPanel: (
        <label>
          <input type="checkbox" aria-label="Terrain relief" readOnly />
          Terrain relief
        </label>
      ),
    });
    const input = screen.getByLabelText('Terrain relief');
    fireEvent.pointerDown(input);
    fireEvent.mouseDown(input);
    fireEvent.click(input);
    expect(props.onLayersToggle).not.toHaveBeenCalled();
  });
});
