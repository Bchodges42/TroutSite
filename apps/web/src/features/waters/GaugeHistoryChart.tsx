import { useState } from 'react';
import { cx } from '@trout/ui';
import { useGaugeHistory } from './useGaugeHistory';
import {
  dedupeSamples,
  historyWindow,
  metricsInWindow,
  metricStats,
  normalizeSamples,
  recentChangeText,
  splitAtGaps,
  windowSamples,
  type GaugeHistory,
  type GaugeMetric,
  type HistorySegment,
  type HistoryWindowId,
  type MetricStats,
  type NormalizedSample,
} from './gaugeHistory';
import { formatHeight, formatFlow, formatNum, formatTemp } from '../../lib/units';
import { useSettingsContext } from '../../lib/settings';

/**
 * Gauge history (ADR 0014) — per-gauge recent observations on the water detail
 * page. Honesty rules baked in:
 *
 * - The section renders NOTHING at all while loading, on 404, or on any fetch
 *   failure. Absent history is honest absence — the page looks exactly like
 *   today until the API lane's `/v1/gauge-history/*` files exist.
 * - ONE chart per metric (temperature, discharge, stage) — never dual-axis.
 * - Gaps (an interval > 3× the median cadence) are drawn as visible breaks;
 *   nothing is interpolated or smoothed. Sparse windows render as scatter
 *   instead of implying a continuous line.
 * - A keyboard-accessible tabular equivalent (<details> data table) doubles as
 *   the chart's accessible fallback.
 * - Source attribution, "verify with USGS" link, retrieved time, and an
 *   explicit "last known" wording when rendering the offline Dexie copy.
 */

/** Bound fetches per water (some waters list several gauges). */
const MAX_GAUGES_PER_WATER = 2;

/** Below this many observations in a window, draw dots — a line would imply a
 *  continuity the sparse record does not have. */
const MIN_LINE_POINTS = 10;

const METRIC_LABEL: Record<GaugeMetric, string> = {
  tempC: 'Water temperature',
  cfs: 'Discharge',
  heightFt: 'Stage (gage height)',
};

export interface GaugeHistorySectionProps {
  streamId: string;
  gaugeIds: readonly string[];
  className?: string;
}

/**
 * The wiring surface for StreamDetailPage: null while loading / 404 / error,
 * one panel per resolving gauge once history exists. Self-enables in production
 * when the API lane lands; in tests it renders against fixtures + mocked fetch.
 */
export function GaugeHistorySection({ streamId, gaugeIds, className }: GaugeHistorySectionProps) {
  const ids = (gaugeIds ?? []).filter(Boolean).slice(0, MAX_GAUGES_PER_WATER);
  if (ids.length === 0) return null;
  return (
    <>
      {ids.map((gaugeId) => (
        <GaugeHistoryPanel
          key={gaugeId}
          streamId={streamId}
          gaugeId={gaugeId}
          className={className}
        />
      ))}
    </>
  );
}

function GaugeHistoryPanel({
  streamId,
  gaugeId,
  className,
}: {
  streamId: string;
  gaugeId: string;
  className?: string;
}) {
  const query = useGaugeHistory(gaugeId);
  const history = query.data?.data;
  // Pending, errored (404/unreachable/invalid), or otherwise absent → nothing.
  if (query.isPending || query.isError || !history) return null;
  return (
    <GaugeHistoryChart
      history={history}
      live={query.data.live}
      className={className}
      data-stream-id={streamId}
    />
  );
}

export function GaugeHistoryChart({
  history,
  live,
  className,
  ...rest
}: {
  history: GaugeHistory;
  live: boolean;
  className?: string;
  'data-stream-id'?: string;
}) {
  const { settings } = useSettingsContext();
  const [windowId, setWindowId] = useState<HistoryWindowId>('24h');
  const window = historyWindow(windowId);
  const nowMs = Date.now();

  const all = dedupeSamples(normalizeSamples(history.samples));
  const windowed = windowSamples(all, window.ms, nowMs);
  const presentMetrics = metricsInWindow(windowed);

  const formatValue = (metric: GaugeMetric) => (n: number) => formatMetricValue(metric, n, settings.tempUnit);

  const recordStartMs = all.length > 0 ? all[0]!.timestampMs : null;

  return (
    <section
      className={cx('detail-section', 'gauge-history', className)}
      aria-label={`Recent gauge history for gauge ${history.gaugeId}`}
      data-testid="gauge-history"
      data-gauge-id={history.gaugeId}
      {...rest}
    >
      <p className="eyebrow">Gauge history · USGS {history.gaugeId}</p>
      <h3 className="section-title">Recent gauge history</h3>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="History window">
        {(['24h', '7d', '30d'] as HistoryWindowId[]).map((id) => {
          const w = historyWindow(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={id === windowId}
              className={`option-card focus-ring min-h-[40px] w-auto px-3 py-1 text-sm ${id === windowId ? 'is-selected' : ''}`}
              onClick={() => setWindowId(id)}
            >
              {w.label}
            </button>
          );
        })}
      </div>

      {windowed.length === 0 ? (
        <div className="empty-note mt-3" role="note" data-testid="gauge-history-empty-window">
          <strong>No observations inside the last {window.label.toLowerCase()}</strong>
          <p>
            The retrieved record for this gauge begins{' '}
            {recordStartMs != null ? localStamp.format(recordStartMs) : 'at an unknown time'}. Try a
            longer window. Nothing is invented to fill the chart.
          </p>
        </div>
      ) : (
        <>
          {presentMetrics.map((metric) => (
            <MetricChartBlock
              key={metric}
              metric={metric}
              samples={windowed}
              nowMs={nowMs}
              windowMs={window.ms}
              windowLabel={window.label}
              formatValue={formatValue(metric)}
              tempUnit={settings.tempUnit}
            />
          ))}

          {/* Accessible tabular equivalent — the same windowed observations as
          the charts, one row per timestamp, for screen readers and anyone who
          wants the numbers. */}
          <details className="gauge-history-table mt-3">
            <summary className="focus-ring cursor-pointer text-sm font-bold underline">
              View as a data table ({windowed.length} observations)
            </summary>
            <div className="overflow-x-auto mt-2">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wide"
                    style={{ color: 'var(--trout-color-text-muted)' }}
                  >
                    <th className="py-2 pr-3">Observed</th>
                    {presentMetrics.map((metric) => (
                      <th key={metric} className="py-2 pr-3">
                        {METRIC_LABEL[metric]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...windowed].reverse().map((s) => (
                    <tr
                      key={s.timestampMs}
                      className="border-t"
                      style={{ borderColor: 'var(--trout-color-border)' }}
                    >
                      <td className="py-2 pr-3">{localStamp.format(s.timestampMs)}</td>
                      {presentMetrics.map((metric) => (
                        <td key={metric} className="py-2 pr-3 font-semibold">
                          {typeof s[metric] === 'number'
                            ? formatValue(metric)(s[metric] as number)
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <p className="muted text-xs mt-3">
        Source: USGS gauge {history.gaugeId} · record retrieved{' '}
        {localStamp.format(Date.parse(history.retrievedAt))}
        {history.samplingCadenceNote ? ` · ${history.samplingCadenceNote}` : ''}
        {live ? '' : ' · offline — showing the last copy saved on this device'}. Gaps are breaks in
        the record, never filled; values before the record begins are never invented. Completeness
        is not implied.
      </p>
      <a
        className="text-action focus-ring text-sm font-bold underline"
        href={history.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        Verify with USGS ↗
      </a>
    </section>
  );
}

function formatMetricValue(metric: GaugeMetric, n: number, tempUnit: 'C' | 'F'): string {
  if (metric === 'cfs') return formatFlow(n);
  if (metric === 'heightFt') return formatHeight(n);
  return formatTemp(n, tempUnit);
}

function axisUnit(metric: GaugeMetric, tempUnit: 'C' | 'F'): string {
  if (metric === 'cfs') return 'cfs';
  if (metric === 'heightFt') return 'ft';
  return tempUnit === 'F' ? '°F' : '°C';
}

function axisValue(metric: GaugeMetric, n: number, tempUnit: 'C' | 'F'): string {
  if (metric === 'tempC') {
    const v = tempUnit === 'F' ? Math.round(((n * 9) / 5 + 32) * 10) / 10 : n;
    return formatNum(v);
  }
  return formatNum(n);
}

function MetricChartBlock({
  metric,
  samples,
  nowMs,
  windowMs,
  windowLabel,
  formatValue,
  tempUnit,
}: {
  metric: GaugeMetric;
  samples: NormalizedSample[];
  nowMs: number;
  windowMs: number;
  windowLabel: string;
  formatValue: (n: number) => string;
  tempUnit: 'C' | 'F';
}) {
  const carrying = samples.filter((s) => typeof s[metric] === 'number');
  if (carrying.length === 0) return null;
  const stats = metricStats(samples, metric)!;
  const segments = splitAtGaps(carrying);
  const change = recentChangeText(stats, formatValue);
  const renderMode = carrying.length >= MIN_LINE_POINTS ? 'line' : 'scatter';
  const gaps = segments.filter((s) => s.gapBeforeMs !== undefined).length;

  const ariaLabel =
    `${METRIC_LABEL[metric]} at this gauge — last ${windowLabel}: ` +
    `${stats.count} observations from ${formatValue(stats.min)} to ${formatValue(stats.max)}, ` +
    `most recently ${formatValue(stats.last)}` +
    (gaps > 0 ? `; ${gaps === 1 ? 'one gap' : `${gaps} gaps`} marked as breaks — nothing interpolated.` : '.');

  return (
    <div className="gauge-history-metric mt-3" data-metric={metric} data-render-mode={renderMode}>
      <p className="eyebrow">
        {METRIC_LABEL[metric]} ({axisUnit(metric, tempUnit)}) · last {windowLabel}
      </p>
      <p className="text-sm font-bold">
        {formatValue(stats.last)}{' '}
        <span className="muted text-xs">
          observed {localStamp.format(stats.lastTimestampMs)}
        </span>
      </p>
      <figure role="img" aria-label={ariaLabel} className="mt-2">
        <MetricSvg
          metric={metric}
          samples={carrying}
          segments={segments}
          stats={stats}
          nowMs={nowMs}
          windowMs={windowMs}
          renderMode={renderMode}
          tempUnit={tempUnit}
        />
      </figure>
      {change && <p className="muted text-xs mt-1">{change}</p>}
    </div>
  );
}

// ── Hand-rolled SVG (no chart dependency — matches the site's approach) ─────

const W = 600;
const H = 190;
const PLOT = { left: 58, right: 592, top: 12, bottom: 150 } as const;

function MetricSvg({
  metric,
  samples,
  segments,
  stats,
  nowMs,
  windowMs,
  renderMode,
  tempUnit,
}: {
  metric: GaugeMetric;
  samples: NormalizedSample[];
  segments: HistorySegment[];
  stats: MetricStats;
  nowMs: number;
  windowMs: number;
  renderMode: 'line' | 'scatter';
  tempUnit: 'C' | 'F';
}) {
  const t0 = nowMs - windowMs;
  const x = (t: number) =>
    PLOT.left + ((t - t0) / windowMs) * (PLOT.right - PLOT.left);

  const span = stats.max - stats.min;
  const pad = span === 0 ? Math.max(Math.abs(stats.max) * 0.05, 0.1) : span * 0.08;
  const lo = stats.min - pad;
  const hi = stats.max + pad;
  const y = (v: number) => PLOT.bottom - ((v - lo) / (hi - lo)) * (PLOT.bottom - PLOT.top);

  const gridValues = span === 0 ? [stats.min] : [stats.min, (stats.min + stats.max) / 2, stats.max];

  const startLabel = windowMs <= 24 * 3_600_000 ? axisClock : axisDayClock;
  const endLabel = windowMs <= 24 * 3_600_000 ? axisClock : axisDayClock;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="gauge-history-svg w-full"
      style={{ color: 'var(--trout-color-text, currentColor)' }}
      aria-hidden="true"
      focusable="false"
    >
      {/* horizontal grid + y-axis labels (units are in the block heading) */}
      {gridValues.map((v) => (
        <g key={`grid-${v}`}>
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--ui-border)"
            strokeWidth={1}
          />
          <text
            x={PLOT.left - 6}
            y={y(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            fill="var(--trout-color-text-muted)"
          >
            {axisValue(metric, v, tempUnit)}
          </text>
        </g>
      ))}

      {/* x-axis: window start and end (observation times) */}
      <line
        x1={PLOT.left}
        x2={PLOT.right}
        y1={PLOT.bottom}
        y2={PLOT.bottom}
        stroke="var(--ui-borderStrong)"
        strokeWidth={1}
      />
      <text x={PLOT.left} y={PLOT.bottom + 18} fontSize={11} fill="var(--trout-color-text-muted)">
        {startLabel.format(t0)}
      </text>
      <text
        x={PLOT.right}
        y={PLOT.bottom + 18}
        textAnchor="end"
        fontSize={11}
        fill="var(--trout-color-text-muted)"
      >
        {endLabel.format(nowMs)}
      </text>

      {/* gap markers FIRST so strokes sit on top: a dashed break, never a bridge */}
      {segments.slice(1).map((segment, i) => {
        const prevLast = segments[i]!.samples[segments[i]!.samples.length - 1]!;
        const first = segment.samples[0]!;
        const midT = (prevLast.timestampMs + first.timestampMs) / 2;
        return (
          <g
            key={`gap-${segment.samples[0]!.timestampMs}`}
            className="gauge-history-gap"
            data-gap="true"
          >
            <line
              x1={x(midT)}
              x2={x(midT)}
              y1={PLOT.top}
              y2={PLOT.bottom}
              stroke="var(--ui-borderStrong)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <title>
              {`Gap in the retrieved record — no measurements for ${Math.round(
                segment.gapBeforeMs! / 3_600_000,
              )} h. Nothing was interpolated across it.`}
            </title>
          </g>
        );
      })}

      {renderMode === 'line'
        ? segments.map((segment) => (
            <polyline
              key={`line-${segment.samples[0]!.timestampMs}`}
              className="gauge-history-line"
              fill="none"
              stroke="var(--ui-accent, currentColor)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={segment.samples
                .map((s) => `${x(s.timestampMs).toFixed(1)},${y(s[metric] as number).toFixed(1)}`)
                .join(' ')}
            />
          ))
        : samples.map((s) => (
            <circle
              key={`dot-${s.timestampMs}`}
              className="gauge-history-dot"
              cx={x(s.timestampMs)}
              cy={y(s[metric] as number)}
              r={3}
              fill="var(--ui-accent, currentColor)"
            >
              <title>
                {`${axisValue(metric, s[metric] as number, tempUnit)} at ${axisDayClock.format(s.timestampMs)}`}
              </title>
            </circle>
          ))}
    </svg>
  );
}

const axisClock = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' });
const axisDayClock = new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: 'numeric' });
const localStamp = new Intl.DateTimeFormat([], {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
