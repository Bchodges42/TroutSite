import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MapLegend } from '../src/features/map/MapLegend';
import { fisheryTypeCounts } from '../src/features/map/fisheryType';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

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
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.queryByText('Tailwater')).not.toBeInTheDocument();
  });

  it('stays collapsible and persists the choice', () => {
    openPanel();
    expect(screen.queryByRole('button', { name: 'Hide legend' })).toBeTruthy();
    expect(localStorage.getItem('trout:legendOpen')).toBe('1');
  });
});
