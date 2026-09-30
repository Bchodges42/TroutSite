import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HatchKeyPage } from './pages/HatchKeyPage';
import { TaxonDetailPage } from './pages/TaxonDetailPage';
import { PatternDetailPage } from './pages/PatternDetailPage';
import { HatchChartsPage } from './pages/HatchChartsPage';
import { HatchChartDetailPage } from './pages/HatchChartDetailPage';
import { ConditionsPage } from './pages/ConditionsPage';
import { StreamDetailPage } from './pages/StreamDetailPage';
import { StockingPage } from './pages/StockingPage';
import { ShopsPage } from './pages/ShopsPage';
import { LogbookPage } from './pages/LogbookPage';
import { MyWatersPage } from './pages/MyWatersPage';
import { ComparePage } from './pages/ComparePage';
import { TripsPage } from './pages/TripsPage';
import { CorrectionsPage } from './pages/CorrectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPrivacyPage } from './pages/AboutPrivacyPage';
import { FishingInfoPage } from './pages/FishingInfoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MapPage } from './features/map/MapPage';
import { BrowsePage } from './features/map/BrowsePage';

/** Route map: / is the map-first home; existing pages preserved as fallbacks. */
export function App() {
  return (
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
        <Route path="my-waters" element={<MyWatersPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="corrections" element={<CorrectionsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPrivacyPage />} />
        <Route path="fishing-info" element={<FishingInfoPage />} />
        <Route path="regulations" element={<FishingInfoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
