import { Link } from 'react-router-dom';
import { Card, Chip, EmptyState } from '@trout/ui';
import { ShopSchema, ShopReportSchema } from '@trout/contracts';
import type { ShopReport } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useContentPack } from '../lib/content';
import { shortDate } from '../lib/time';
import { FreshnessChip } from '../components/FreshnessChip';

/** Shops & reports (scope 6): directory + attributed, linked-out reports. */
export function ShopsPage() {
  const shopsQuery = useSnapshotQuery(snapshotUrls.shops('TN'), ShopSchema.array(), 60 * 24 * 7, true);
  const reportsQuery = useSnapshotQuery(snapshotUrls.reportsRecent, ShopReportSchema.array(), 60 * 12, true);
  const pack = useContentPack();

  const shops = shopsQuery.data?.data ?? [];
  const reports = [...(reportsQuery.data?.data ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <main className="page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Shops &amp; Reports</h1>
        <FreshnessChip fetchedAt={reportsQuery.data?.fetchedAt} live={reportsQuery.data?.live ?? false} />
      </div>
      <p className="page-subtitle mt-1">
        Every report is attributed to the shop that filed it — tap through and support the people
        who scout the water.
      </p>

      <h2 className="section-title">Recent reports</h2>
      {reportsQuery.isLoading ? (
        <p className="page-subtitle" role="status">Loading reports…</p>
      ) : reportsQuery.isError && reports.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Reports not on this device yet"
          description="Open once while online to cache the latest attributed reports."
        />
      ) : reports.length === 0 ? (
        <EmptyState icon="📝" title="No reports yet" description="Shops will file reports here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} patternName={(id) => pack.data?.patterns.find((p) => p.id === id)?.name ?? id} />
          ))}
        </ul>
      )}

      <h2 className="section-title">Shop directory</h2>
      {shopsQuery.isError && shops.length === 0 ? (
        <EmptyState icon="🏪" title="Directory not cached yet" description="Open once while online to store it." />
      ) : (
        <ul className="flex flex-col gap-2">
          {shops.map((s) => (
            <li key={s.id} className="list-row" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
              <span className="min-w-0">
                <h3 className="block text-base font-extrabold">{s.name}</h3>
                <span className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
                  {s.town}, {s.stateId}
                  {s.reportsEnabled ? ' · files reports' : ''}
                </span>
              </span>
              <a className="focus-ring shrink-0 text-sm font-bold underline" href={s.websiteUrl} target="_blank" rel="noreferrer noopener">
                Website ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ReportCard({ report, patternName }: { report: ShopReport; patternName: (id: string) => string }) {
  return (
    <li>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <a
            className="focus-ring font-extrabold underline"
            href={report.attributionUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {report.shopName}
          </a>
          <Chip tone="accent">{shortDate(report.date)}</Chip>
          {report.streamId && (
            <Link to={`/conditions/${report.streamId}`} className="focus-ring text-xs font-bold underline">
              conditions →
            </Link>
          )}
        </div>
        <p className="mt-2 text-sm">{report.body}</p>
        {report.hotPatterns.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.hotPatterns.map((hp) => (
              <Chip key={hp.patternId}>
                {patternName(hp.patternId)}
                {hp.hookSize ? ` · #${hp.hookSize}` : ''}
              </Chip>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          Report by {report.shopName} ·{' '}
          <a className="focus-ring underline" href={report.attributionUrl} target="_blank" rel="noreferrer noopener">
            view at source ↗
          </a>
        </p>
      </Card>
    </li>
  );
}
