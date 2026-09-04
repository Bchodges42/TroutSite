/** One source of truth for application and cartographic colors. */
export interface MapPalette {
  paper: string;
  paperRaised: string;
  paperWarm: string;
  ink: string;
  softInk: string;
  inkFaint: string;
  water: string;
  good: string;
  fair: string;
  poor: string;
  noData: string;
  warmwater: string;
  sulphur: string;
  selection: string;
  hover: string;
  contour: string;
  hairline: string;
  lakeFill: string;
  lakeShore: string;
  shadow: string;
  placeText: string;
  placeHalo: string;
  road: string;
  reliefOpacity: number;
  reliefBrightness: number;
}
export interface ThemeDefinition {
  id: 'daybreak' | 'nightfall';
  name: string;
  scheme: 'light' | 'dark';
  colors: Record<
    | 'bg'
    | 'surface'
    | 'subtle'
    | 'raised'
    | 'text'
    | 'muted'
    | 'faint'
    | 'border'
    | 'borderStrong'
    | 'accent'
    | 'accentHover'
    | 'accentSoft'
    | 'onAccent'
    | 'good'
    | 'fair'
    | 'poor'
    | 'unknown'
    | 'warmwater'
    | 'shadow',
    string
  >;
  map: MapPalette;
}
export type ThemeId = ThemeDefinition['id'];
export const themes: Record<ThemeId, ThemeDefinition> = {
  daybreak: {
    id: 'daybreak',
    name: 'Daybreak',
    scheme: 'light',
    colors: {
      bg: '#f3f4f0',
      surface: '#ffffff',
      subtle: '#f1f3ef',
      raised: '#e7ece7',
      text: '#192e2b',
      muted: '#526760',
      faint: '#60716c',
      border: '#dbe2dc',
      borderStrong: '#778e81',
      accent: '#b34824',
      accentHover: '#903719',
      accentSoft: '#faeee6',
      onAccent: '#ffffff',
      good: '#237155',
      fair: '#8e630b',
      poor: '#b13b38',
      unknown: '#64746e',
      warmwater: '#765739',
      shadow: '0 6px 30px rgb(25 46 43 / 0.09)',
    },
    map: {
      paper: '#dde4df',
      paperRaised: '#edf0e8',
      paperWarm: '#e4eadd',
      ink: '#edf0e8',
      softInk: '#5e756a',
      inkFaint: '#839487',
      water: '#39828e',
      good: '#21846b',
      fair: '#986b12',
      poor: '#bc4b45',
      noData: '#607b6e',
      warmwater: '#957246',
      sulphur: '#bd722c',
      selection: '#b34824',
      hover: '#233e35',
      contour: '#b7c6b3',
      hairline: '#9cb09e',
      lakeFill: '#b7d8da',
      lakeShore: '#7fafb9',
      shadow: 'rgb(25 46 43 / 0.12)',
      placeText: '#425e51',
      placeHalo: '#edf0e8',
      road: '#ced6c5',
      reliefOpacity: 0.28,
      reliefBrightness: 1,
    },
  },
  nightfall: {
    id: 'nightfall',
    name: 'Nightfall',
    scheme: 'dark',
    colors: {
      bg: '#101c20',
      surface: '#17272b',
      subtle: '#1e3034',
      raised: '#293f43',
      text: '#ecf3ed',
      muted: '#b2c7c3',
      faint: '#9cb3b0',
      border: '#33494a',
      borderStrong: '#617f7b',
      accent: '#f0b478',
      accentHover: '#f8c994',
      accentSoft: '#3b332b',
      onAccent: '#18272b',
      good: '#7cd0a7',
      fair: '#e8c17c',
      poor: '#f28d83',
      unknown: '#9aafaa',
      warmwater: '#d2b186',
      shadow: '0 8px 34px rgb(0 0 0 / 0.28)',
    },
    map: {
      paper: '#102125',
      paperRaised: '#1a3032',
      paperWarm: '#203a38',
      ink: '#102125',
      softInk: '#a4bcb3',
      inkFaint: '#72978a',
      water: '#64afc0',
      good: '#71cda8',
      fair: '#e0b86d',
      poor: '#ed887c',
      noData: '#7ca394',
      warmwater: '#c4a477',
      sulphur: '#e5b773',
      selection: '#f0b478',
      hover: '#e5efdf',
      contour: '#3c5850',
      hairline: '#567569',
      lakeFill: '#214b55',
      lakeShore: '#3b7080',
      shadow: 'rgb(0 0 0 / 0.3)',
      placeText: '#b4cabb',
      placeHalo: '#1a3032',
      road: '#38504b',
      // Nightfall uses contour relief; opaque light hillshade tiles create a rectangular wash.
      reliefOpacity: 0,
      reliefBrightness: 0.35,
    },
  },
};
export const foundations = {
  'font-body': "'IBM Plex Sans', system-ui, sans-serif",
  'font-display': "'Fraunces', Georgia, serif",
  'font-mono': "ui-monospace, 'Cascadia Code', monospace",
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-6': '24px',
  'space-8': '32px',
  'radius-sm': '6px',
  'radius-md': '10px',
  'radius-lg': '16px',
  'motion-fast': '120ms',
  'motion-normal': '220ms',
  'motion-ease': 'cubic-bezier(.2,.8,.2,1)',
} as const;
export const THEME_KEY = 'trout:theme';
export const isThemeId = (id: unknown): id is ThemeId => id === 'daybreak' || id === 'nightfall';
export function initialTheme(): ThemeId {
  try {
    const requested = new URLSearchParams(window.location.search).get('basemap');
    if (requested === 'paper') return 'daybreak';
    if (requested === 'ink') return 'nightfall';
    const saved = localStorage.getItem(THEME_KEY);
    if (isThemeId(saved)) return saved;
    return localStorage.getItem('trout:basemap') === 'ink' ? 'nightfall' : 'daybreak';
  } catch {
    return 'daybreak';
  }
}
export function applyTheme(id: ThemeId) {
  const theme = themes[id];
  const root = document.documentElement;
  root.dataset.theme = id;
  root.style.colorScheme = theme.scheme;
  Object.entries(theme.colors).forEach(([key, value]) =>
    root.style.setProperty(`--ui-${key}`, value),
  );
  Object.entries(theme.map).forEach(([key, value]) =>
    root.style.setProperty(`--map-${key}`, String(value)),
  );
  Object.entries(foundations).forEach(([key, value]) =>
    root.style.setProperty(`--trout-${key}`, value),
  );
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.surface);
}
