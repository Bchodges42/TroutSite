import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapLegend } from '../src/features/map/MapLegend';
import { fisheryTypeCounts } from '../src/features/map/fisheryType';
import { themes } from '../src/theme/themes';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const base = {
  mode: 'conditions' as const,
  species: 'trout' as const,
  hasAssessedConditions: true,
};

/** The live catalog shape: 148 waters, none unclassifiable. */
const catalogCounts = fisheryTypeCounts([
  ...Array.from({ length: 12 }, () => ({ waterbodyType: 'tailrace', stockingProgram: true })),
  ...Array.from({ length: 9 }, () => ({
    waterbodyType: 'creek',
    species: 'trout' as const,
    stockingProgram: false,
  })),
  ...Array.from({ length: 80 }, () => ({ waterbodyType: 'river', stockingProgram: true })),
  ...Array.from({ length: 47 }, () => ({ waterbodyType: 'lake', stockingProgram: false })),
]);

function openPanel(props: Partial<ComponentProps<typeof MapLegend>> = {}) {
  localStorage.setItem('trout:legendOpen', '1');
  render(<MapLegend {...base} {...props} />);
}

describe('MapLegend final state', () => {
  it('keeps the condition-rating rows when the snapshot has assessed waters', () => {
    openPanel();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.queryByText('Tailwater')).not.toBeInTheDocument();
  });

  it('swaps condition rows for water classes when the feed has no assessments', () => {
    openPanel({ hasAssessedConditions: false, fisheryCounts: catalogCounts });
    expect(screen.getByText('Water guide')).toBeInTheDocument();
    expect(screen.getByText('Tailwater')).toBeInTheDocument();
    expect(screen.getByText('Wild trout')).toBeInTheDocument();
    expect(screen.getByText('Stocked')).toBeInTheDocument();
    expect(screen.getByText('Other fish waters')).toBeInTheDocument();
    // The condition bands are gone — no colors pretending to be conditions.
    expect(screen.queryByText('Good')).not.toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
    // Counts are catalog truth: 12 tailwaters, 9 wild, 80 stocked, 47 other.
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('never shows an Unclassified row when every water classifies', () => {
    openPanel({ hasAssessedConditions: false, fisheryCounts: catalogCounts });
    expect(screen.queryByText('Unclassified')).not.toBeInTheDocument();
  });

  it('counts unclassifiable waters honestly when the catalog has gaps', () => {
    const counts = { ...fisheryTypeCounts([]), tailwater: 1, unknown: 2 };
    openPanel({ hasAssessedConditions: false, fisheryCounts: counts });
    expect(screen.getByText('Unclassified')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('without counts it still names the classes and omits the unknown row', () => {
    openPanel({ hasAssessedConditions: false });
    expect(screen.getByText('Tailwater')).toBeInTheDocument();
    expect(screen.getByText('Wild trout')).toBeInTheDocument();
    expect(screen.queryByText('Unclassified')).not.toBeInTheDocument();
  });

  it('folds the warmwater row into the grouping in all-fish mode', () => {
    openPanel({ hasAssessedConditions: false, species: 'all', fisheryCounts: catalogCounts });
    expect(screen.queryByText('Warmwater — bass & panfish')).not.toBeInTheDocument();
    expect(screen.getByText(/Bass & panfish waters sit under Other fish waters/)).toBeInTheDocument();
  });

  it('keeps the warmwater row beside live condition bands in all-fish mode', () => {
    openPanel({ species: 'all' });
    expect(screen.getByText('Warmwater — bass & panfish')).toBeInTheDocument();
    expect(screen.queryByText(/sit under Other fish waters/)).not.toBeInTheDocument();
  });

  it('keeps hatch mode rows regardless of condition coverage', () => {
    openPanel({ mode: 'hatches', hasAssessedConditions: false });
    expect(screen.getByText('Hatch activity')).toBeInTheDocument();
    expect(screen.getByText('guidance')).toBeInTheDocument();
    expect(screen.queryByText('Tailwater')).not.toBeInTheDocument();
  });

  it('stays collapsible and persists the choice', () => {
    openPanel();
    expect(screen.queryByRole('button', { name: 'Hide legend' })).toBeTruthy();
    expect(localStorage.getItem('trout:legendOpen')).toBe('1');
  });
});

/** Audit F18 — a blocked optional storage read must never blank the map page. */
describe('MapLegend — storage failure resilience (F18)', () => {
  const securityError = () => Object.assign(new Error('denied'), { name: 'SecurityError' });

  it('renders the collapsed legend when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw securityError();
    });
    // Before the fix this threw inside the useState initializer and React
    // unmounted the whole tree — the audit measured an empty body on the
    // home map with an uncaught storage error.
    render(<MapLegend {...base} />);
    expect(screen.getByRole('button', { name: 'Show legend' })).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('expands and collapses in memory when localStorage.setItem throws', async () => {
    const user = userEvent.setup();
    render(<MapLegend {...base} />);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw securityError();
    });
    await user.click(screen.getByRole('button', { name: 'Show legend' }));
    expect(screen.getByRole('button', { name: 'Hide legend' })).toBeInTheDocument();
    expect(screen.getByText('Flow + temp → 0–100 · Good ≥70 · Fair ≥40')).toBeInTheDocument();
    // Collapsing again also survives the blocked write.
    await user.click(screen.getByRole('button', { name: 'Hide legend' }));
    expect(screen.getByRole('button', { name: 'Show legend' })).toBeInTheDocument();
  });

  it('still restores a persisted open state when storage works', () => {
    localStorage.setItem('trout:legendOpen', '1');
    render(<MapLegend {...base} />);
    expect(screen.getByRole('button', { name: 'Hide legend' })).toBeInTheDocument();
  });
});

/** Audit F20 — legend text uses theme tokens, never hardcoded night colors. */
describe('MapLegend — theme-token text (F20)', () => {
  const legendSource = readFileSync(
    path.resolve(__dirname, '../src/features/map/MapLegend.tsx'),
    'utf8',
  );

  function luminance(hex: string): number {
    const channels = [0, 2, 4].map((offset) => {
      const srgb = parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255;
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function contrast(foreground: string, background: string): number {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
      (a, b) => b - a,
    );
    return (lighter + 0.05) / (darker + 0.05);
  }

  it('hardcodes no night-palette text or divider colors', () => {
    // The audited pairing: #EAF2ED headings / #9FB5AA supporting text on the
    // glass surface measured 1.13:1 and 2.17:1 in the Daybreak preset.
    expect(legendSource).not.toContain('#EAF2ED');
    expect(legendSource).not.toContain('#9FB5AA');
    expect(legendSource).not.toContain('rgba(255,255,255,0.08)');
    expect(legendSource).toContain('var(--ui-text)');
    expect(legendSource).toContain('var(--ui-muted)');
    expect(legendSource).toContain('var(--ui-border)');
  });

  it('labels and supporting text carry the theme token classes in the DOM', () => {
    openPanel({ hasAssessedConditions: false, species: 'all', fisheryCounts: catalogCounts });
    const panel = screen.getByLabelText('Water guide legend');
    expect(panel.querySelector('p.font-bold')?.className).toContain(
      'text-[color:var(--ui-text)]',
    );
    const mutedParagraphs = [...panel.querySelectorAll('p')].filter((p) =>
      p.className.includes('text-[color:var(--ui-muted)]'),
    );
    expect(mutedParagraphs.length).toBeGreaterThanOrEqual(3);
  });

  it('theme text tokens pass 4.5:1 on the legend surface in every preset', () => {
    // The panel is .atlas-glass: background var(--ui-surface). The legend
    // renders headings/count labels in --ui-text and supporting copy in
    // --ui-muted, so both pairs must clear WCAG AA for normal text in all
    // five presets — daybreak 14.3/6.1, nightfall 13.7/8.7, riverstone
    // 13.0/5.7, high-contrast 17.7/10.4, campfire 14.2/8.7 (computed here).
    for (const theme of Object.values(themes)) {
      expect(contrast(theme.colors.text, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.colors.muted, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the retired hardcoded pairing really was the audited failure', () => {
    // Guard the guard: these assertions stay meaningful only while the old
    // hexes are genuinely sub-4.5:1 on the Daybreak surface (#ffffff) — the
    // audit's 1.13:1 heading and 2.17:1 supporting text.
    expect(contrast('#EAF2ED', '#ffffff')).toBeCloseTo(1.14, 1);
    expect(contrast('#9FB5AA', '#ffffff')).toBeCloseTo(2.17, 1);
  });
});

/** Audit F25 — the legend slot must not intercept the map zoom control. */
describe('MapLegend — wrapper hit geometry (F25)', () => {
  const css = readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');

  function ruleOf(selector: string): string {
    const start = css.indexOf(`${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  }

  it('renders one click-through slot sized by the stylesheet, not a bare relative block', () => {
    const { container } = render(<MapLegend {...base} />);
    const wrapper = container.firstElementChild as HTMLElement;
    // The old bare `relative` div stretched across .map-bottom (866px) and
    // intercepted the zoom button; the slot class carries the fix.
    expect(wrapper.className).toBe('map-legend-slot');
    expect(wrapper.querySelector(':scope > button[aria-expanded="false"]')).not.toBeNull();
  });

  it('styles the slot click-through and content-sized with higher specificity than .map-bottom > *', () => {
    // jsdom applies no CSS, so pin the geometry contract against the
    // stylesheet (same pattern as map-control-group.test.tsx). The audit
    // rule: `.map-bottom > *` re-enabled pointer events on the full-width
    // wrapper; the slot rule (0,2,0) must beat it (0,1,0), so cascade order
    // cannot resurrect the invisible hit area.
    const slot = ruleOf('.map-bottom > .map-legend-slot');
    expect(slot).toContain('pointer-events: none');
    expect(slot).toContain('width: fit-content');
    const reEnable = ruleOf('.map-legend-slot > *');
    expect(reEnable).toContain('pointer-events: auto');
    expect(css.indexOf('.map-bottom > .map-legend-slot')).toBeGreaterThan(
      css.indexOf('.map-bottom > *'),
    );
  });

  it('keeps the open panel (and its close control) inside the interactive slot', () => {
    openPanel();
    const panel = screen.getByLabelText('Trout conditions legend');
    expect(panel.parentElement?.className).toBe('map-legend-slot');
  });
});
