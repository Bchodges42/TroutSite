import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsContext } from '../../lib/settings';
import { useRiverMapData } from './useRiverMapData';
import { regionName } from '../../data/regions';
import { ScorePill } from '../../components/ScorePill';
import { rememberedMapUrl } from '../../lib/riverContext';
import { decisionStatusText, toWaterDecisionView } from './waterDecision';
import type { FishabilityFocus } from './waterDecision';
import { useFishabilityIndex } from '../../lib/fishability';
export function BrowsePage() {
  const data = useRiverMapData();
  const { settings } = useSettingsContext();
  const speciesMode = settings.speciesMode;
  const focus = (settings.speciesFocus || null) as import('@trout/contracts').SpeciesKey | null;
  const fishabilityIndexQ = useFishabilityIndex(data.streams, focus, speciesMode === 'all');
  const fishabilityByWater = fishabilityIndexQ.data ?? {};
  const [search, setSearch] = useState('');
  const rows = data.features
    .filter((f) =>
      (f.stream.name + ' ' + regionName(f.stream.regionId))
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.stream.name.localeCompare(b.stream.name));
  return (
    <main className="page">
      <p className="eyebrow mb-3">Tennessee / Water index</p>
      <h1 className="page-title">Browse streams</h1>
      <p className="page-subtitle mt-2">
        Every water, with or without a map. Search the catalog and open full conditions, sources,
        and hatch guidance.
      </p>
      <Link to={rememberedMapUrl()} className="text-action mt-3">
        ← Back to map
      </Link>
      <label className="block mt-5">
        <span className="block text-sm font-semibold mb-2">Find a water</span>
        <input
          className="search-input !pl-4"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="River name or region"
        />
      </label>
      {data.isLoading ? (
        <p className="mt-6" role="status">
          Loading streams…
        </p>
      ) : data.isError ? (
        <div className="empty-note mt-6" role="alert">
          <strong>Catalog unavailable</strong>
          <p>Connect once to download the stream catalog. Your local logbook is unaffected.</p>
        </div>
      ) : (
        <>
          <p className="muted text-sm my-4" role="status">
            {rows.length} waters
          </p>
          <ul className="space-y-2">
            {rows.map((f) => (
              <li key={f.stream.id}>
                <Link
                  to={'/conditions/' + f.stream.id}
                  className="list-row focus-ring browse-row-dense"
                >
                  <span className="min-w-0 flex items-baseline gap-2">
                    <strong>{f.stream.name}</strong>
                    <span className="muted text-xs">{regionName(f.stream.regionId)}</span>
                  </span>
                  {(() => {
                    const comfort = focus
                      ? fishabilityByWater[f.stream.id]?.bySpecies[focus]
                      : undefined;
                    const fishability: FishabilityFocus | undefined = comfort
                      ? { species: focus as never, comfort: comfort.comfort }
                      : undefined;
                    const decision = toWaterDecisionView(
                      f,
                      speciesMode,
                      new Date().getMonth() + 1,
                      fishability,
                    );
                    if (decision.displayMetric === 'fishability' && fishability)
                      return <ScorePill score={fishability.comfort.value} />;
                    return (
                      <span className="muted text-sm">
                        {decisionStatusText(decision, f, fishability)}
                      </span>
                    );
                  })()}
                </Link>
              </li>
            ))}
          </ul>
          {rows.length === 0 && (
            <div className="empty-note">
              <strong>No matching waters</strong>
              <p>Try a shorter name or a different region.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
