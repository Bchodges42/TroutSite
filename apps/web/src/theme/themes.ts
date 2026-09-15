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
  /** Class-outline halo colors (2026-09-10): trout vs warmwater highlight. */
  troutOutline: string;
  warmOutline: string;
  /** Flow-arrow glyph colors — core + rim chosen per theme so the arrow reads
   * on both light and dark basemaps (owner direction 2026-09-10). */
  flowArrow: string;
  flowArrowHalo: string;
  flowArrowTip: string;
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
  id: 'daybreak' | 'nightfall' | 'riverstone' | 'high-contrast' | 'campfire';
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
export type CustomColorKey =
  | 'bg'
  | 'surface'
  | 'text'
  | 'muted'
  | 'accent'
  | 'accentSoft'
  | 'good'
  | 'fair'
  | 'poor'
  | 'unknown'
  | 'mapPaper'
  | 'mapWater'
  | 'mapSelection'
  | 'mapContour'
  | 'mapLake';
export type ColorOverrides = Partial<Record<CustomColorKey, string>>;

export interface CustomColorControl {
  key: CustomColorKey;
  label: string;
  description: string;
}

export const customColorControls: CustomColorControl[] = [
  { key: 'bg', label: 'App background', description: 'The canvas behind pages and panels.' },
  { key: 'surface', label: 'Surfaces', description: 'Cards, headers, drawers, and controls.' },
  { key: 'text', label: 'Main text', description: 'Primary headings and readable content.' },
  { key: 'muted', label: 'Muted text', description: 'Secondary labels and supporting copy.' },
  { key: 'accent', label: 'Accent', description: 'Actions, links, selection, and focus.' },
  {
    key: 'accentSoft',
    label: 'Accent wash',
    description: 'Subtle selected and highlighted surfaces.',
  },
  { key: 'good', label: 'Good status', description: 'Healthy or highly fishable water.' },
  { key: 'fair', label: 'Fair status', description: 'Caution and middling conditions.' },
  { key: 'poor', label: 'Poor status', description: 'Poor conditions and warnings.' },
  { key: 'unknown', label: 'Unassessed status', description: 'Missing or unavailable readings.' },
  { key: 'mapPaper', label: 'Map land', description: 'The main map land/terrain color.' },
  { key: 'mapWater', label: 'Map water', description: 'Waterways and water labels.' },
  { key: 'mapSelection', label: 'Map selection', description: 'The selected river or corridor.' },
  {
    key: 'mapContour',
    label: 'Map contours',
    description: 'Terrain lines and geographic texture.',
  },
  { key: 'mapLake', label: 'Map lakes', description: 'Lake fills and larger still-water areas.' },
];

export const customColorKeys = customColorControls.map(({ key }) => key);
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
      troutOutline: '#1b7fa8',
      warmOutline: '#b06f14',
      flowArrow: '#22343c',
      flowArrowHalo: '#ffffff',
      flowArrowTip: '#c2342c',
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
      troutOutline: '#6fd0e8',
      warmOutline: '#f2a94f',
      flowArrow: '#f2f7f4',
      flowArrowHalo: '#0d181c',
      flowArrowTip: '#ff6b5e',
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
      // Terrain relief renders in BOTH themes: the hillshade tiles are
      // shadow-only alpha WebP (verified VP8L alpha, clipped to TN+3km), so
      // Nightfall draws them as subdued dark valley shading on the dark
      // ground. Hiding them here (the old reliefOpacity: 0 workaround for the
      // pre-alpha opaque tiles) hid valid terrain; the rectangle those opaque
      // tiles painted is instead prevented at the asset + cache layer (stale
      // runtime-cache purge on manifest change — see lib/atlasAvailability).
      reliefOpacity: 0.45,
      reliefBrightness: 1,
    },
  },
  riverstone: {
    id: 'riverstone',
    name: 'Riverstone',
    scheme: 'light',
    colors: {
      bg: '#edf2f4',
      surface: '#f8fbfc',
      subtle: '#e7eef0',
      raised: '#d6e2e5',
      text: '#19323a',
      muted: '#4b6870',
      faint: '#607b83',
      border: '#c9d8dc',
      borderStrong: '#718e96',
      accent: '#2e6f7e',
      accentHover: '#245765',
      accentSoft: '#dfedf0',
      onAccent: '#ffffff',
      good: '#1f7a62',
      fair: '#9a6b0b',
      poor: '#b54845',
      unknown: '#5f7780',
      warmwater: '#7d6042',
      shadow: '0 6px 30px rgb(25 50 58 / 0.1)',
    },
    map: {
      paper: '#d9e5e8',
      paperRaised: '#eef5f6',
      paperWarm: '#e5edef',
      ink: '#eef5f6',
      softInk: '#5d7b83',
      inkFaint: '#81969c',
      water: '#337e91',
      good: '#21836c',
      fair: '#95690c',
      poor: '#b94a45',
      noData: '#5e7880',
      warmwater: '#8b6c49',
      troutOutline: '#1b7fa8',
      warmOutline: '#b06f14',
      flowArrow: '#22343c',
      flowArrowHalo: '#ffffff',
      flowArrowTip: '#c2342c',
      sulphur: '#b9792d',
      selection: '#2e6f7e',
      hover: '#21444d',
      contour: '#aec4c7',
      hairline: '#91aaaf',
      lakeFill: '#b5dce3',
      lakeShore: '#6da8b4',
      shadow: 'rgb(25 50 58 / 0.14)',
      placeText: '#41616a',
      placeHalo: '#eef5f6',
      road: '#c6d5d7',
      reliefOpacity: 0.28,
      reliefBrightness: 1,
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High contrast',
    scheme: 'light',
    colors: {
      bg: '#ffffff',
      surface: '#ffffff',
      subtle: '#f0f2f5',
      raised: '#d9dee7',
      text: '#111827',
      muted: '#334155',
      faint: '#475569',
      border: '#64748b',
      borderStrong: '#334155',
      accent: '#005fcc',
      accentHover: '#00449e',
      accentSoft: '#dbeafe',
      onAccent: '#ffffff',
      good: '#006b3c',
      fair: '#7a4b00',
      poor: '#b42318',
      unknown: '#475569',
      warmwater: '#6b4f1d',
      shadow: '0 5px 24px rgb(15 23 42 / 0.18)',
    },
    map: {
      paper: '#eef2f7',
      paperRaised: '#ffffff',
      paperWarm: '#f5f7fa',
      ink: '#111827',
      softInk: '#475569',
      inkFaint: '#64748b',
      water: '#006d77',
      good: '#007a4d',
      fair: '#8a5a00',
      poor: '#b42318',
      noData: '#475569',
      warmwater: '#6b4f1d',
      troutOutline: '#005f87',
      warmOutline: '#8a5200',
      flowArrow: '#111827',
      flowArrowHalo: '#ffffff',
      flowArrowTip: '#b42318',
      sulphur: '#9a6700',
      selection: '#005fcc',
      hover: '#0f172a',
      contour: '#8490a3',
      hairline: '#637083',
      lakeFill: '#bfe4f2',
      lakeShore: '#1976a0',
      shadow: 'rgb(15 23 42 / 0.2)',
      placeText: '#243b53',
      placeHalo: '#ffffff',
      road: '#aab5c3',
      reliefOpacity: 0.28,
      reliefBrightness: 1,
    },
  },
  campfire: {
    id: 'campfire',
    name: 'Campfire',
    scheme: 'dark',
    colors: {
      bg: '#1e1715',
      surface: '#2a1e1b',
      subtle: '#362722',
      raised: '#4a332b',
      text: '#f9eee7',
      muted: '#d2b9ad',
      faint: '#b79b8f',
      border: '#594037',
      borderStrong: '#8b6252',
      accent: '#f1a15e',
      accentHover: '#ffbe7e',
      accentSoft: '#513126',
      onAccent: '#291a12',
      good: '#8fd0a7',
      fair: '#e6bf74',
      poor: '#f4998c',
      unknown: '#b79b8f',
      warmwater: '#d8b48a',
      shadow: '0 8px 34px rgb(0 0 0 / 0.36)',
    },
    map: {
      paper: '#261c1a',
      paperRaised: '#3b2925',
      paperWarm: '#4b3026',
      ink: '#1d1615',
      softInk: '#c5a99b',
      inkFaint: '#97786d',
      water: '#5fb1c0',
      good: '#7bd0a6',
      fair: '#e6bc6e',
      poor: '#e98b81',
      noData: '#a78b7d',
      warmwater: '#d2ac7f',
      troutOutline: '#6fd0e8',
      warmOutline: '#f2a94f',
      flowArrow: '#f2f7f4',
      flowArrowHalo: '#0d181c',
      flowArrowTip: '#ff6b5e',
      sulphur: '#ebbd6e',
      selection: '#f1a15e',
      hover: '#f8eee6',
      contour: '#624940',
      hairline: '#806054',
      lakeFill: '#20515d',
      lakeShore: '#3e7f8c',
      shadow: 'rgb(0 0 0 / 0.34)',
      placeText: '#d6c1b6',
      placeHalo: '#332622',
      road: '#55433c',
      reliefOpacity: 0.4,
      reliefBrightness: 1,
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
export const isThemeId = (id: unknown): id is ThemeId =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(themes, id);
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
export function resolveTheme(
  theme: ThemeDefinition,
  overrides: ColorOverrides = {},
): ThemeDefinition {
  const colors = { ...theme.colors };
  const map = { ...theme.map };
  for (const key of [
    'bg',
    'surface',
    'text',
    'muted',
    'accent',
    'accentSoft',
    'good',
    'fair',
    'poor',
    'unknown',
  ] as const) {
    const value = overrides[key];
    if (value) colors[key] = value;
  }
  if (overrides.mapPaper) map.paper = overrides.mapPaper;
  if (overrides.mapWater) map.water = overrides.mapWater;
  if (overrides.mapSelection) map.selection = overrides.mapSelection;
  if (overrides.mapContour) map.contour = overrides.mapContour;
  if (overrides.mapLake) map.lakeFill = overrides.mapLake;
  return { ...theme, colors, map };
}

export function colorValue(theme: ThemeDefinition, key: CustomColorKey): string {
  switch (key) {
    case 'mapPaper':
      return theme.map.paper;
    case 'mapWater':
      return theme.map.water;
    case 'mapSelection':
      return theme.map.selection;
    case 'mapContour':
      return theme.map.contour;
    case 'mapLake':
      return theme.map.lakeFill;
    default:
      return theme.colors[key];
  }
}

export function applyTheme(id: ThemeId, overrides: ColorOverrides = {}) {
  const theme = resolveTheme(themes[id], overrides);
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
