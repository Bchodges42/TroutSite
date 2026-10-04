import { useLocation, useNavigate } from 'react-router-dom';
import { useSettingsContext } from '../lib/settings';
import { Segmented } from './ui/Segmented';

/**
 * F6 site-wide species mode — the ONE Trout / All fish control (design audit
 * 2026-10-04, P0-4). It writes the persisted setting every surface reads.
 * On the map, a shareable ?species= override may be present; the map syncs
 * that override into the setting on arrival, and toggling here clears it so
 * the URL can never disagree with the control.
 */
export function SpeciesModeToggle({ floating = false }: { floating?: boolean }) {
  const { settings, update } = useSettingsContext();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const urlSpecies = location.pathname === '/' ? params.get('species') : null;
  const value: 'trout' | 'all' =
    urlSpecies === 'all' || urlSpecies === 'trout' ? urlSpecies : (settings.speciesMode ?? 'trout');

  const setMode = (mode: 'trout' | 'all') => {
    update({ speciesMode: mode });
    if (location.pathname === '/' && params.has('species')) {
      params.delete('species');
      navigate('/' + (params.size ? '?' + params.toString() : ''), { replace: true });
    }
  };

  return (
    <Segmented
      ariaLabel="Fish mode"
      floating={floating}
      value={value}
      onChange={setMode}
      options={[
        { value: 'trout', label: 'Trout' },
        { value: 'all', label: 'All fish' },
      ]}
    />
  );
}
