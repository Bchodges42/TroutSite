import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

/**
 * F31 route splitting: every page below the shell is loaded lazily, so the
 * entry bundle carries only the shell/router and MapLibre ships in the map
 * route's chunk instead of every non-map start. The Workbox precache glob
 * (the all-JS pattern in vite.shared.ts) still covers the split chunks, so an
 * offline cold start has every route available after the first visit.
 *
 * The map is the home route, so it keeps first-class treatment: AppShell stays
 * eager (header/nav/search render immediately) and the Suspense fallback only
 * fills the outlet while a route chunk streams in.
 */

const MapPage = lazy(() =>
  import('./features/map/MapPage').then((m) => ({ default: m.MapPage })),
);
const BrowsePage = lazy(() =>
  import('./features/map/BrowsePage').then((m) => ({ default: m.BrowsePage })),
);
const HatchKeyPage = lazy(() =>
  import('./pages/HatchKeyPage').then((m) => ({ default: m.HatchKeyPage })),
);
const TaxonDetailPage = lazy(() =>
  import('./pages/TaxonDetailPage').then((m) => ({ default: m.TaxonDetailPage })),
);
const PatternDetailPage = lazy(() =>
  import('./pages/PatternDetailPage').then((m) => ({ default: m.PatternDetailPage })),
);
const HatchChartsPage = lazy(() =>
  import('./pages/HatchChartsPage').then((m) => ({ default: m.HatchChartsPage })),
);
const HatchChartDetailPage = lazy(() =>
  import('./pages/HatchChartDetailPage').then((m) => ({ default: m.HatchChartDetailPage })),
);
const ConditionsPage = lazy(() =>
  import('./pages/ConditionsPage').then((m) => ({ default: m.ConditionsPage })),
);
const StreamDetailPage = lazy(() =>
  import('./pages/StreamDetailPage').then((m) => ({ default: m.StreamDetailPage })),
);
const StockingPage = lazy(() =>
  import('./pages/StockingPage').then((m) => ({ default: m.StockingPage })),
);
const ShopsPage = lazy(() =>
  import('./pages/ShopsPage').then((m) => ({ default: m.ShopsPage })),
);
const LogbookPage = lazy(() =>
  import('./pages/LogbookPage').then((m) => ({ default: m.LogbookPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AboutPrivacyPage = lazy(() =>
  import('./pages/AboutPrivacyPage').then((m) => ({ default: m.AboutPrivacyPage })),
);
const FishingInfoPage = lazy(() =>
  import('./pages/FishingInfoPage').then((m) => ({ default: m.FishingInfoPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

/** Outlet placeholder while a route chunk loads (role=status for AT). */
export function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <p className="muted text-sm">Loading…</p>
    </div>
  );
}

/** Route map: / is the map-first home; existing pages preserved as fallbacks. */
export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MapPage />} />
          <Route path="browse" element={<BrowsePage />} />
          {/* Fallback/legacy routes preserved */}
          <Route path="hatch-key" element={<HatchKeyPage />} />
          <Route path="taxa/:taxonId" element={<TaxonDetailPage />} />
          <Route path="patterns/:patternId" element={<PatternDetailPage />} />
          <Route path="charts" element={<HatchChartsPage />} />
          <Route path="charts/:regionId/:month" element={<HatchChartDetailPage />} />
          <Route path="conditions" element={<ConditionsPage />} />
          <Route path="conditions/:streamId" element={<StreamDetailPage />} />
          <Route path="stocking" element={<StockingPage />} />
          <Route path="shops" element={<ShopsPage />} />
          <Route path="logbook" element={<LogbookPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPrivacyPage />} />
          <Route path="fishing-info" element={<FishingInfoPage />} />
          <Route path="regulations" element={<FishingInfoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
