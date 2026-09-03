import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { currentMonth } from '../../lib/time';

export type MapMode = 'conditions' | 'hatches';
export type DrawerTab = 'water' | 'hatch' | 'stocking' | 'reports' | 'log';

const VALID_TABS: DrawerTab[] = ['water', 'hatch', 'stocking', 'reports', 'log'];
const VALID_MODES: MapMode[] = ['conditions', 'hatches'];

export interface MapState {
  river: string | null;
  tab: DrawerTab;
  mode: MapMode;
  month: number; // 1..12
}

export function useMapState() {
  const [params, setParams] = useSearchParams();

  const state: MapState = useMemo(() => {
    const river = params.get('river');
    const tabRaw = params.get('tab') as DrawerTab | null;
    const tab = tabRaw && VALID_TABS.includes(tabRaw) ? tabRaw : 'water';
    const modeRaw = params.get('mode') as MapMode | null;
    const mode = modeRaw && VALID_MODES.includes(modeRaw) ? modeRaw : 'conditions';
    const monthRaw = Number(params.get('month'));
    const month = monthRaw >= 1 && monthRaw <= 12 ? monthRaw : currentMonth();
    return { river, tab, mode, month };
  }, [params]);

  const update = useCallback(
    (patch: Partial<MapState>, opts?: { replace?: boolean; history?: 'push' | 'replace' }) => {
      const replace = opts?.replace ?? opts?.history === 'replace';
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.river !== undefined) {
            if (patch.river) next.set('river', patch.river);
            else next.delete('river');
          }
          if (patch.tab !== undefined) next.set('tab', patch.tab);
          if (patch.mode !== undefined) next.set('mode', patch.mode);
          if (patch.month !== undefined) next.set('month', String(patch.month));
          return next;
        },
        { replace: replace ? true : false },
      );
    },
    [setParams],
  );

  // scrub-safe: does replace to avoid flooding history
  const updateMonthReplace = useCallback(
    (month: number) => update({ month }, { replace: true }),
    [update],
  );

  return { state, update, updateMonthReplace, params };
}
