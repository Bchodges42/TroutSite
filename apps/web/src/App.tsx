import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
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
import { SettingsPage } from './pages/SettingsPage';
import { AboutPrivacyPage } from './pages/AboutPrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Route map (scope 1): Home, Hatch Key, Charts, Conditions, Stocking, Shops, Logbook, Settings, About. */
export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
