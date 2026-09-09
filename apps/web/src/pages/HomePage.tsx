import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Chip, EmptyState } from '@trout/ui';
import { ConditionSnapshotSchema, newestReadingAt } from '@trout/contracts';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useStreamsCatalog } from '../lib/useStreamsCatalog';
import { useSettingsContext } from '../lib/settings';
import { flowTrend, TREND_LABEL } from '../lib/conditions';
import { FreshnessChip } from '../components/FreshnessChip';
import { ScorePill } from '../components/ScorePill';
import { BugIcon, ChartIcon, FishIcon, ShopIcon } from '../components/icons';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useOnline } from '../hooks/useOnline';
import { latestFlowLabel, latestTempLabel } from './ConditionsPage';
import { monthName, REGIONS } from '../data/regions';
import { currentMonth } from '../lib/time';

const ConditionsListSchema = ConditionSnapshotSchema.array();

interface TopStreamRow {
  snap: ConditionSnapshot;
  stream: Stream;
}

/** Home: quick paths into the four core jobs + honest install card. */
export function HomePage() {
  const { settings } = useSettingsContext();
  const online = useOnline();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const now = currentMonth();

  const conditionsQuery = useSnapshotQuery(snapshotUrls.conditionsLatest, ConditionsListSchema, 60, true);
  const streamsQuery = useStreamsCatalog(60 * 24, true);

  const topStreams: TopStreamRow[] = useMemo(() => {
    const byId = new Map((streamsQuery.data?.data ?? []).map((s) => [s.id, s]));
    return (conditionsQuery.data?.data ?? [])
      .map((snap) => ({ snap, stream: byId.get(snap.streamId) }))
      .filter((r): r is TopStreamRow => r.stream !== undefined)
      .filter((r) => r.stream.stateId === settings.defaultState)
      .sort((a, b) => b.snap.score.value - a.snap.score.value)
      .slice(0, 3);
  }, [conditionsQuery.data, streamsQuery.data, settings.defaultState]);

  return (
    <main className="page">
      <section className="mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight">What's hatching right now?</h1>
        <p className="mt-2 max-w-xl text-base" style={{ color: 'var(--trout-color-text-muted)' }}>
          Identify the bug, pick the fly, check the water — everything works offline, and nothing
          about you ever leaves this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/hatch-key" className="trout-btn trout-btn--primary trout-btn--lg focus-ring no-underline">
            <BugIcon size={20} /> Open the Hatch Key
          </Link>
          <Link to="/conditions" className="trout-btn trout-btn--secondary trout-btn--lg focus-ring no-underline">
            <ChartIcon size={20} /> Check the water
          </Link>
        </div>
        {!online && (
          <p className="mt-3 text-sm font-bold" style={{ color: 'var(--trout-amber-600)' }}>
            You're offline — all core features still work from the data on this device.
          </p>
        )}
      </section>

      <section aria-label="Best water right now">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Best water near your default state ({settings.defaultState})</h2>
          <FreshnessChip fetchedAt={conditionsQuery.data?.fetchedAt} live={conditionsQuery.data?.live ?? false} observedAt={newestReadingAt((conditionsQuery.data?.data ?? []).flatMap((s) => s.readings))} />
        </div>
        {conditionsQuery.isLoading || streamsQuery.isLoading ? (
          <p className="page-subtitle" role="status">Loading water…</p>
        ) : topStreams.length === 0 ? (
          <EmptyState
            icon="📡"
            title="No conditions cached yet"
            description="Open the app once while online, or visit the Conditions page to fetch."
            action={
              <Link to="/conditions" className="focus-ring font-bold underline">Go to Conditions</Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {topStreams.map(({ snap, stream }) => (
              <li key={stream.id}>
                <Link to={`/conditions/${stream.id}`} className="list-row focus-ring" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{stream.name}</span>
                    <span className="block text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
                      {latestFlowLabel(snap)} · {latestTempLabel(snap, settings.tempUnit)} · trend{' '}
                      {TREND_LABEL[flowTrend(snap.readings)] || 'n/a'}
                    </span>
                  </span>
                  <ScorePill score={snap.score.value} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Features">
        <h2 className="section-title">The toolkit</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FeatureCard
            to="/hatch-key"
            icon={<BugIcon size={22} />}
            title="Match the hatch"
            body="A guided ID key that narrows 150+ taxa down on your device — no signal needed."
          />
          <FeatureCard
            to="/charts"
            icon={<ChartIcon size={22} />}
            title="Hatch charts"
            body={`${REGIONS.length} Tennessee regions, month by month. ${monthName(now)} is a good place to start.`}
          />
          <FeatureCard
            to="/conditions"
            icon={<FishIcon size={22} />}
            title="Fishability scores"
            body="USGS gauges turned into plain-English, 0–100 scores with the reasons shown."
          />
          <FeatureCard
            to="/shops"
            icon={<ShopIcon size={22} />}
            title="Shops & reports"
            body="Attributed intel from local fly shops, linked straight back to them."
          />
        </div>
      </section>

      {!installed && (
        <section aria-label="Install" className="mt-6">
          <Card>
            <p className="font-bold">Take it to the riverbank</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
              {canInstall
                ? 'Install Trout for full-screen offline use. Honest copy: it adds a shortcut and caches public data on this device. Nothing else.'
                : 'Use your browser menu → Install app (or iOS: Share → Add to Home Screen).'}
            </p>
            {canInstall && (
              <Button className="focus-ring mt-3" onClick={() => void promptInstall()}>
                Install Trout
              </Button>
            )}
          </Card>
        </section>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="good">No accounts</Chip>
          <Chip tone="good">No tracking</Chip>
          <Chip tone="good">Location never sent</Chip>
          <Chip tone="good">Logbook stays local</Chip>
        </div>
        <p className="mt-2 text-sm">
          <Link to="/about" className="focus-ring font-bold underline">
            How the privacy works →
          </Link>
        </p>
      </div>
    </main>
  );
}

function FeatureCard({ to, icon, title, body }: { to: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className="focus-ring no-underline" style={{ color: 'inherit' }}>
      <Card className="h-full hover:!border-[var(--trout-color-primary)]">
        <span style={{ color: 'var(--trout-color-primary)' }}>{icon}</span>
        <h3 className="mt-2 text-base font-extrabold">{title}</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          {body}
        </p>
      </Card>
    </Link>
  );
}
