import { createContext, useContext, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { SettingsRecord } from './db';

export const DEFAULT_SETTINGS: SettingsRecord = {
  tempUnit: 'F',
  reduceMotion: false,
};

const SETTINGS_KEY = 'app';

/**
 * Visitor preferences (scope 8), persisted in Dexie — never cookies, never the
 * server (privacy non-negotiable #1). Renders defaults until IndexedDB loads.
 */
export function useSettings(): [SettingsRecord, (patch: Partial<SettingsRecord>) => void] {
  const stored = useLiveQuery(
    async () => {
      const row = await db.settings.get(SETTINGS_KEY);
      return row?.value as Partial<SettingsRecord> | undefined;
    },
    [],
  );

  const settings: SettingsRecord = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  const update = (patch: Partial<SettingsRecord>) => {
    const next = { ...settings, ...patch };
    void db.settings.put({ key: SETTINGS_KEY, value: next });
  };

  return [settings, update];
}

interface SettingsContextValue {
  settings: SettingsRecord;
  update: (patch: Partial<SettingsRecord>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, update] = useSettings();
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used inside <SettingsProvider>');
  return ctx;
}
