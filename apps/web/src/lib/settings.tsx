import { createContext, useContext, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { SettingsRecord } from './db';

export const DEFAULT_SETTINGS: SettingsRecord = {
  tempUnit: 'F',
  speciesMode: 'trout',
  speciesFocus: '',
  showGauges: false,
  showStockingSites: false,
  showAttractors: false,
  reduceMotion: false,
};

const SETTINGS_KEY = 'app';

/**
 * Visitor preferences (scope 8), persisted in Dexie — never cookies, never the
 * server (privacy non-negotiable #1). Renders defaults until IndexedDB loads.
 */
export function useSettings(): [SettingsRecord, (patch: Partial<SettingsRecord>) => void] {
  const stored = useLiveQuery(async () => {
    const row = await db.settings.get(SETTINGS_KEY);
    return row?.value as Partial<SettingsRecord> | undefined;
  }, []);

  const settings: SettingsRecord = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  const update = (patch: Partial<SettingsRecord>) => {
    // F13 (2026-09-29 audit): merge against the LATEST STORED record inside a
    // serialized readwrite transaction. Merging against this render's captured
    // `settings` let two rapid patches overwrite each other — the second put
    // wrote the first patch's old values back (all/empty-focus then
    // trout/smallmouth-focus). Dexie runs same-table readwrite transactions
    // one at a time, so each patch now reads what the previous one wrote.
    void db
      .transaction('readwrite', db.settings, async () => {
        const row = await db.settings.get(SETTINGS_KEY);
        const next: SettingsRecord = {
          ...DEFAULT_SETTINGS,
          ...((row?.value as Partial<SettingsRecord>) ?? {}),
          ...patch,
        };
        await db.settings.put({ key: SETTINGS_KEY, value: next });
      })
      .catch((err: unknown) => {
        // A failed preference write must not masquerade as success — but it
        // also must not crash the UI over an optional preference.
        console.warn('[settings] preference update failed', err);
      });
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
  return (
    <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used inside <SettingsProvider>');
  return ctx;
}
