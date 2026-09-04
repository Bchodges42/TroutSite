import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, DataBadge, EmptyState } from '@trout/ui';
import { ConditionSnapshotSchema, StreamSchema, newestReadingAt } from '@trout/contracts';
import type { GaugeReading } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useSettingsContext } from '../lib/settings';
import { flowTrend, rememberSeen, readSeen, scoreLabel, scoreBand, TREND_LABEL, whatChanged } from '../lib/conditions';
import { formatFlow, formatHeight, formatNum, formatTemp } from '../lib/units';
import { ageMinutes } from '../lib/time';
import { FreshnessChip } from '../components/FreshnessChip';
import { ScorePill } from '../components/ScorePill';

const CONDITIONS_TTL_MIN = 60;

/** Stream detail (scope 4): readings, score + reasons, what changed, official links. */
export function StreamDetailPage() {
  const { streamId = '' } = useParams();
  const { settings } = useSettingsContext();

  const streamsQuery = useSnapshotQuery(snapshotUrls.streams, StreamSchema.array(), 60 * 24, true);
  const conditionsQuery = useSnapshotQuery(
    snapshotUrls.conditionsLatest,
    ConditionSnapshotSchema.array(),
    CONDITIONS_TTL_MIN,
    true,
  );
  const stream = streamsQuery.data?.data.find((s) => s.id === streamId);
  const snapshot = conditionsQuery.data?.data.find((s) => s.streamId === streamId);

  const [changes, setChanges] = useState<string[] | null>(null);
  const seenHandled = useRef(false);

  // "What changed since your last visit": diff against the stored baseline,
  // then remember the current readings as the new baseline.
  useEffect(() => {
    if (!snapshot || seenHandled.current) return;
    seenHandled.current = true;
    void (async () => {
      const previous = await readSeen(snapshot.streamId);
      if (previous) setChanges(whatChanged(previous, snapshot.readings));
      await rememberSeen(snapshot);
    })();
  }, [snapshot]);

  if (streamsQuery.isLoading) {
    return (
      <main className="page">
        <p className="page-subtitle" role="status">Loading stream…</p>
      </main>
    );
  }

  if (!stream) {
    return (
      <main className="page">
        <EmptyState
          title="Stream not found"
          description="It may not be in the cached catalog yet."
          action={<Link to="/conditions" className="focus-ring font-bold underline">Back to Conditions</Link>}
        />
      </main>
    );
  }

  const readings = snapshot?.readings ?? [];
  const trend = flowTrend(readings);
  const newestCfs = newestValue(readings, 'cfs');
  const newestTemp = newestValue(readings, 'tempC');
  const newestHeight = newestValue(readings, 'heightFt');

  return (
    <main className="page">
      <Link to="/conditions" className="focus-ring text-sm font-bold underline">← Conditions</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{stream.name}</h1>
          <p className="page-subtitle capitalize">
            {stream.waterbodyType} · {stream.stockingProgram ? 'stocked by TWRA' : 'wild / not stocked'}
          </p>
        </div>
        <FreshnessChip fetchedAt={conditionsQuery.data?.fetchedAt} live={conditionsQuery.data?.live ?? false} observedAt={newestReadingAt(snapshot?.readings ?? [])} />
      </div>

      {!snapshot ? (
        <div className="mt-6">
          <EmptyState
            icon="📡"
            title="No conditions cached for this stream"
            description="Reopen this page once while online to store the latest gauge snapshot."
          />
        </div>
      ) : (
        <>
          <Card className="mt-4">
            <div className="flex flex-wrap items-center gap-4">
              <ScorePill score={snapshot.score.value} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  Fishability: {scoreLabel(snapshot.score.value)} ({scoreBand(snapshot.score.value)})
                  {trend !== 'unknown' && <span className="ml-2 font-semibold">{TREND_LABEL[trend]}</span>}
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {snapshot.score.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            <DataBadge
              label="Flow"
              value={newestCfs != null ? formatFlow(newestCfs) : 'n/a'}
              status={newestCfs != null ? statusForFlow(stream, newestCfs) : 'unknown'}
            />
            <DataBadge
              label="Water temp"
              value={newestTemp != null ? formatTemp(newestTemp, settings.tempUnit) : 'n/a'}
              status={newestTemp != null ? statusForTemp(newestTemp) : 'unknown'}
            />
            {newestHeight != null && <DataBadge label="Stage" value={formatHeight(newestHeight)} status="unknown" />}
            <DataBadge
              label="Ideal flow"
              value={stream.idealFlow.map((r) => `${formatNum(r.min)}–${formatNum(r.max)}`).join(', ') + ' cfs'}
              status="unknown"
            />
          </div>

          {changes && changes.length > 0 && (
            <Card className="mt-4">
              <p className="text-sm font-bold">What changed since your last visit</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Card>
          )}

          <h2 className="section-title">Gauge readings</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ color: 'var(--trout-color-text-muted)' }}>
                  <th className="py-2 pr-3">Gauge</th>
                  <th className="py-2 pr-3">Flow</th>
                  <th className="py-2 pr-3">Stage</th>
                  <th className="py-2 pr-3">Temp</th>
                  <th className="py-2">Observed</th>
                </tr>
              </thead>
              <tbody>
                {[...readings]
                  .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
                  .map((r, i) => (
                    <tr key={`${r.gaugeId}-${r.timestamp}-${i}`} className="border-t" style={{ borderColor: 'var(--trout-color-border)' }}>
                      <td className="py-2 pr-3 font-mono text-xs">{r.gaugeId}</td>
                      <td className="py-2 pr-3 font-semibold">{r.cfs != null ? formatFlow(r.cfs) : '—'}</td>
                      <td className="py-2 pr-3">{r.heightFt != null ? formatHeight(r.heightFt) : '—'}</td>
                      <td className="py-2 pr-3">{r.tempC != null ? formatTemp(r.tempC, settings.tempUnit) : '—'}</td>
                      <td className="py-2" style={{ color: 'var(--trout-color-text-muted)' }}>
                        {ageMinutes(Date.parse(r.timestamp))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {stream.notes && (
        <>
          <h2 className="section-title">Notes</h2>
          <Card>
            <p className="text-sm">{stream.notes}</p>
          </Card>
        </>
      )}

      <h2 className="section-title">Verify officially</h2>
      <Card>
        <p className="mb-2 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          This app is never authoritative on flows, regulations, or fees. Confirm at the official
          sources:
        </p>
        <ul className="list-disc pl-5 text-sm">
          {stream.officialSources.map((src) => (
            <li key={src.url}>
              <a className="focus-ring font-semibold underline" href={src.url} target="_blank" rel="noreferrer noopener">
                {src.label}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

function newestValue(readings: GaugeReading[], key: 'cfs' | 'tempC' | 'heightFt'): number | null {
  const sorted = [...readings]
    .filter((r) => typeof r[key] === 'number')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const top = sorted[0];
  return top ? (top[key] as number) : null;
}

function statusForFlow(stream: { idealFlow: { min: number; max: number }[] }, cfs: number): 'good' | 'fair' | 'poor' {
  if (stream.idealFlow.some((r) => cfs >= r.min && cfs <= r.max)) return 'good';
  const nearest = stream.idealFlow.reduce(
    (best, r) => {
      const d = cfs < r.min ? r.min - cfs : cfs > r.max ? cfs - r.max : 0;
      return d < best.d ? { d } : best;
    },
    { d: Number.POSITIVE_INFINITY },
  );
  return nearest.d <= (stream.idealFlow[0]?.min ?? 100) * 0.5 ? 'fair' : 'poor';
}

function statusForTemp(tempC: number): 'good' | 'fair' | 'poor' {
  if (tempC >= 6 && tempC <= 20) return 'good';
  if (tempC < 2 || tempC > 24) return 'poor';
  return 'fair';
}
