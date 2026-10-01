import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RiverSearch } from '../src/features/map/RiverSearch';
import { RECENT_SEARCH_KEY, clearRecentSelections, recentSelections, rememberSelection } from '../src/features/search/recentSelections';

const streams = [
  { id: 'elk-river', name: 'Elk River', regionId: 'tn-south-cumberland', species: 'trout' as const },
  { id: 'norris-lake', name: 'Norris Lake', regionId: 'tn-east', species: 'warmwater' as const },
];
beforeEach(() => { clearRecentSelections(); Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('recalls only actual choices in scope after remount, requires explicit selection and clears history', () => {
  rememberSelection('retired-water'); rememberSelection('norris-lake'); rememberSelection('elk-river');
  const onSelect = vi.fn();
  const first = render(<RiverSearch streams={streams} onSelect={onSelect} />);
  fireEvent.focus(screen.getByRole('combobox'));
  expect(screen.getAllByRole('option')).toHaveLength(1);
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
  expect(onSelect).not.toHaveBeenCalled();
  first.unmount();
  render(<RiverSearch streams={streams} onSelect={onSelect} />);
  fireEvent.focus(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: /Elk River/ }));
  expect(onSelect).toHaveBeenCalledWith('elk-river');
  fireEvent.focus(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('button', { name: 'Clear recent selections' }));
  expect(recentSelections()).toEqual([]);
});

it('bounds and deduplicates IDs, rejects malformed persisted data and survives blocked storage', () => {
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(['elk-river', 'elk-river', {}, 'secret / invalid']));
  expect(recentSelections()).toEqual(['elk-river']);
  for (let i = 0; i < 10; i++) rememberSelection(`water-${i}`);
  expect(recentSelections()).toHaveLength(6);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  rememberSelection('elk-river');
  expect(recentSelections()[0]).toBe('elk-river');
  clearRecentSelections();
  expect(recentSelections()).toEqual([]);
});
