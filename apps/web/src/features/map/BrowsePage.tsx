import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StreamSchema, ConditionSnapshotSchema, newestReadingAt } from '@trout/contracts';
import { snapshotUrls } from '../../lib/endpoints';
import { useSnapshotQuery } from '../../lib/useSnapshotQuery';
import { useSettingsContext } from '../../lib/settings';
import { flowTrend, TREND_LABEL } from '../../lib/conditions';
import { FreshnessChip } from '../../components/FreshnessChip';
import { ScorePill } from '../../components/ScorePill';
import { regionName } from '../../data/regions';

export function BrowsePage() {
  const { settings } = useSettingsContext();
  const streamsQuery = useSnapshotQuery(snapshotUrls.streams, StreamSchema.array(), 60*24, true);
  const conditionsQuery = useSnapshotQuery(snapshotUrls.conditionsLatest, ConditionSnapshotSchema.array(), 60, true);
  const streams = streamsQuery.data?.data ?? [];
  const condByStream = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of conditionsQuery.data?.data ?? []) m.set(s.streamId, s);
    return m;
  }, [conditionsQuery.data]);

  const rows = useMemo(() => {
    return [...streams].sort((a, b) => {
      const sa = condByStream.get(a.id)?.score.value ?? -1;
      const sb = condByStream.get(b.id)?.score.value ?? -1;
      return sb - sa || a.name.localeCompare(b.name);
    });
  }, [streams, condByStream]);

  return (
    <main className="page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Browse streams</h1>
        <FreshnessChip fetchedAt={conditionsQuery.data?.fetchedAt} live={conditionsQuery.data?.live ?? false} observedAt={newestReadingAt((conditionsQuery.data?.data ?? []).flatMap((s) => s.readings))} />
      </div>
      <p className="page-subtitle mt-1">List fallback for the map — same rivers, keyboard and screen-reader friendly.</p>
      <p className="mt-2 text-sm"><Link to="/" className="font-bold underline">← Back to Map</Link></p>
      {streamsQuery.isLoading ? <p className="mt-6 text-sm">Loading streams…</p> : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((s) => {
            const snap = condByStream.get(s.id);
            return (
              <li key={s.id}>
                <Link to={`/?river=${encodeURIComponent(s.id)}`} className="list-row focus-ring" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{s.name}</span>
                    <span className="block text-sm" style={{ color: 'var(--trout-ink-muted)' }}>
                      {regionName(s.regionId)} · {s.waterbodyType} {snap ? `· trend ${TREND_LABEL[flowTrend(snap.readings)] || 'n/a'}` : '· no cached readings'}
                    </span>
                  </span>
                  {snap ? <ScorePill score={snap.score.value} /> : <span className="text-sm" style={{ color: 'var(--trout-ink-faint)' }}>—</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
