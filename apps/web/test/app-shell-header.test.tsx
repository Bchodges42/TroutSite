import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '../src/components/layout/AppShell';
import { SettingsProvider } from '../src/lib/settings';
import { ThemeProvider } from '../src/theme/ThemeProvider';

beforeEach(() => {
  localStorage.clear();
  // The header catalog fetch never matters here; an empty catalog keeps the
  // search box renderable without network access.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => [] })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderShell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <ThemeProvider>
          <MemoryRouter initialEntries={['/settings']}>
            <AppShell />
          </MemoryRouter>
        </ThemeProvider>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

/**
 * jsdom applies no CSS, so the narrow-viewport behavior is pinned as a
 * stylesheet contract: extract the exact media block and assert the reflow /
 * collapse rules inside it (same pattern as map-control-group.test.tsx).
 * The real geometry cannot be measured here — it is covered by the Playwright
 * no-overflow assertions in e2e/fieldwork/ui.spec.ts (320/390 widths) plus the
 * CSS reasoning documented in the F17 fix.
 */
function mediaBlock(css: string, condition: string): string {
  const start = css.indexOf(`@media (${condition})`);
  expect(start, `missing @media (${condition})`).toBeGreaterThan(-1);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error('unbalanced braces in stylesheet');
}

function headerCss(): string {
  return readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
}

describe('AppShell header — narrow-viewport reflow (F17)', () => {
  it('keeps the menu button, the search surface, and the quick-settings cluster in the header', () => {
    renderShell();
    const header = screen.getByRole('banner');
    // Menu stays usable: the trigger with its accessible name is present.
    expect(within(header).getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    // Search stays usable: the header search surface never unmounts below
    // 640px — it reflows to its own full-width row (pinned in the CSS test).
    expect(within(header).getByRole('combobox')).toBeInTheDocument();
    // The non-shrinking cluster is one explicit group of toggles.
    expect(header.querySelector('.header-quick-settings')).not.toBeNull();
    expect(
      within(header.querySelector('.header-quick-settings') as HTMLElement).getByRole('group', {
        name: 'Fish mode',
      }),
    ).toBeInTheDocument();
  });

  it('reflows to a wrapped header with the search as a full-width row at ≤640px', () => {
    const css = headerCss();
    const block = mediaBlock(css, 'max-width: 640px');
    const headerRule = block.slice(block.indexOf('.app-header {'));
    expect(headerRule).toContain('flex-wrap: wrap');
    expect(headerRule).toContain('height: auto');
    expect(headerRule).toContain('min-height: 64px');
    const searchRule = block.slice(block.indexOf('.header-search {'));
    // The old fix hid the search entirely below 640px — that left phones
    // without any search on non-map pages and broke the drawer's focus
    // restore target. It must stay rendered and take its own row.
    expect(searchRule).not.toContain('display: none');
    expect(searchRule).toContain('order: 9');
    expect(searchRule).toContain('flex: 1 1 100%');
  });

  it('collapses the quick-settings cluster into the overflow menu at ≤480px', () => {
    const css = headerCss();
    const block = mediaBlock(css, 'max-width: 480px');
    const headerCopy = block.slice(block.indexOf('.header-quick-settings {'));
    expect(headerCopy).toContain('display: none');
    const menuCopy = block.slice(block.indexOf('.menu-quick-settings {'));
    expect(menuCopy).toContain('display: flex');
  });

  it('keeps every header control at the 44px touch convention', () => {
    const css = headerCss();
    // Menu trigger: 44px square.
    const iconButton = css.slice(css.indexOf('.icon-button {'), css.indexOf('.icon-button:hover'));
    expect(iconButton).toContain('width: 44px');
    expect(iconButton).toContain('height: 44px');
    // Theme toggle: the glyph collapses to ~15px with the name hidden, so the
    // target is pinned square in both axes.
    const themeToggle = css.slice(css.indexOf('.theme-toggle {'), css.indexOf('.theme-toggle >'));
    expect(themeToggle).toContain('min-height: 44px');
    expect(themeToggle).toContain('min-width: 44px');
    // Species toggle container: ≥44px tall with its own 42px buttons inside.
    const speciesToggle = css.slice(
      css.indexOf('.species-mode-toggle {'),
      css.indexOf('.species-mode-toggle button {'),
    );
    expect(speciesToggle).toContain('min-height: 44px');
  });
});

describe('AppShell overflow menu — quick settings (F17)', () => {
  it('renders the identical controls in the menu without duplicating the visible header copy', async () => {
    const user = userEvent.setup();
    renderShell();
    // Closed menu: exactly one Fish mode group (the header copy).
    expect(screen.getAllByRole('group', { name: 'Fish mode' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    const quick = dialog.querySelector('.menu-quick-settings') as HTMLElement;
    expect(quick).not.toBeNull();
    // Both copies exist while the menu is open (CSS shows exactly one), and
    // the menu copy carries the same controls.
    expect(screen.getAllByRole('group', { name: 'Fish mode' })).toHaveLength(2);
    expect(within(quick).getByRole('button', { name: 'Trout mode' })).toBeInTheDocument();
    expect(quick.querySelector('.theme-toggle')).not.toBeNull();
  });

  it('wires the menu copy to the same site-wide species setting', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    const quick = within(dialog.querySelector('.menu-quick-settings') as HTMLElement);
    await user.click(quick.getByRole('button', { name: 'All fish mode' }));
    await waitFor(() => {
      // The pressed state lands on every instance — one persisted setting.
      for (const button of screen.getAllByRole('button', { name: 'All fish mode' })) {
        expect(button).toHaveAttribute('aria-pressed', 'true');
      }
    });
  });

  it('keeps the menu drawer inside the focus trap with the new controls', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    // The trap collects a,button inside the dialog; the quick settings must
    // be part of it (they live inside the dialog element).
    expect(
      within(dialog).getAllByRole('button').length,
    ).toBeGreaterThanOrEqual(4); // close, quick settings (3), plus nav buttons
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).not.toBeInTheDocument();
    });
    // Focus returns to the (always visible) menu trigger.
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });
});
