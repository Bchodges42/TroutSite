import { useLocation, useNavigate } from 'react-router-dom';
import { useSettingsContext } from '../lib/settings';

/**
 * F6 site-wide species mode (TASK 1): a compact header control that writes the
 * persisted setting every surface reads. While the map's shareable ?species=
 * URL override is present, toggling clears it — otherwise the override would
 * mask the setting the visitor just changed.
 */
export function SpeciesModeToggle() {
  const { settings, update } = useSettingsContext();
  const location = useLocation();
  const navigate = useNavigate();

  const setMode = (mode: 'trout' | 'all') => {
    update({ speciesMode: mode });
    if (location.pathname === '/' && location.search.includes('species=')) {
      const next = new URLSearchParams(location.search);
      next.delete('species');
      navigate('/' + (next.size ? '?' + next.toString() : ''), { replace: true });
    }
  };

  return (
    <div className="species-mode-toggle" role="group" aria-label="Fish mode">
      {(['trout', 'all'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={settings.speciesMode === mode}
          aria-label={mode === 'trout' ? 'Trout mode' : 'All-fish mode'}
          onClick={() => setMode(mode)}
        >
          {mode === 'trout' ? 'Trout' : 'All fish'}
        </button>
      ))}
    </div>
  );
}
