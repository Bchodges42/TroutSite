import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  applyTheme,
  customColorKeys,
  initialTheme,
  isThemeId,
  resolveTheme,
  themes,
  THEME_KEY,
  type ColorOverrides,
  type CustomColorKey,
  type ThemeId,
} from './themes';

const OVERRIDES_KEY = 'trout:theme-overrides';
type ThemeOverrides = Partial<Record<ThemeId, ColorOverrides>>;

interface ThemeContextValue {
  theme: (typeof themes)[ThemeId];
  setTheme: (id: ThemeId) => void;
  customColors: ColorOverrides;
  setCustomColor: (key: CustomColorKey, value: string) => void;
  resetCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.daybreak,
  setTheme: () => {},
  customColors: {},
  setCustomColor: () => {},
  resetCustomColors: () => {},
});

function readOverrides(): ThemeOverrides {
  try {
    const raw = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}') as Record<string, unknown>;
    const parsed: ThemeOverrides = {};
    for (const [themeId, values] of Object.entries(raw)) {
      if (!isThemeId(themeId) || typeof values !== 'object' || values === null) continue;
      const safe: ColorOverrides = {};
      for (const [key, value] of Object.entries(values)) {
        if (
          customColorKeys.includes(key as CustomColorKey) &&
          typeof value === 'string' &&
          /^#[0-9a-f]{6}$/i.test(value)
        ) {
          safe[key as CustomColorKey] = value;
        }
      }
      if (Object.keys(safe).length) parsed[themeId] = safe;
    }
    return parsed;
  } catch {
    return {};
  }
}

function persistOverrides(overrides: ThemeOverrides): void {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* usable without storage */
  }
}

// Runs before the first React render, not in an effect after paint.
const bootTheme = typeof document !== 'undefined' ? initialTheme() : 'daybreak';
const bootOverrides = typeof window !== 'undefined' ? readOverrides() : {};
if (typeof document !== 'undefined') applyTheme(bootTheme, bootOverrides[bootTheme]);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ThemeId>(bootTheme);
  const [overrides, setOverrides] = useState<ThemeOverrides>(bootOverrides);
  const theme = useMemo(() => resolveTheme(themes[id], overrides[id]), [id, overrides]);
  const setTheme = (next: ThemeId) => {
    applyTheme(next, overrides[next]);
    setId(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* usable without storage */
    }
  };
  const setCustomColor = (key: CustomColorKey, value: string) => {
    if (!customColorKeys.includes(key) || !/^#[0-9a-f]{6}$/i.test(value)) return;
    setOverrides((previous) => {
      const next = { ...previous, [id]: { ...previous[id], [key]: value } };
      applyTheme(id, next[id]);
      persistOverrides(next);
      return next;
    });
  };
  const resetCustomColors = () => {
    setOverrides((previous) => {
      const next = { ...previous };
      delete next[id];
      applyTheme(id, {});
      persistOverrides(next);
      return next;
    });
  };
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        customColors: overrides[id] ?? {},
        setCustomColor,
        resetCustomColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${theme.id === 'daybreak' ? 'Nightfall' : 'Daybreak'} theme`}
      title={`${theme.name} theme`}
      onClick={() => {
        if (params.get('basemap') === 'paper' || params.get('basemap') === 'ink') {
          const next = new URLSearchParams(params);
          next.delete('basemap');
          setParams(next, { replace: true });
        }
        setTheme(theme.id === 'daybreak' ? 'nightfall' : 'daybreak');
      }}
    >
      <span aria-hidden>{theme.id === 'daybreak' ? '◐' : '◑'}</span>
      <span className="theme-name">{theme.name}</span>
    </button>
  );
}
