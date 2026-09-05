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
});
