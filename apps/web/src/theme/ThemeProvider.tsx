import { createContext, useContext, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applyTheme, initialTheme, themes, THEME_KEY, type ThemeId } from './themes';

const ThemeContext = createContext({ theme: themes.daybreak, setTheme: (_id: ThemeId) => {} });
// Runs before the first React render, not in an effect after paint.
const bootTheme = typeof document !== 'undefined' ? initialTheme() : 'daybreak';
if (typeof document !== 'undefined') applyTheme(bootTheme);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ThemeId>(bootTheme);
  const setTheme = (next: ThemeId) => {
    applyTheme(next);
    setId(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* usable without storage */
    }
  };
  return (
    <ThemeContext.Provider value={{ theme: themes[id], setTheme }}>
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
