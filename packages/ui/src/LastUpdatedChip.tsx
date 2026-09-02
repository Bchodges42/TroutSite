import { Chip } from './Chip.js';
import { cx } from './cx.js';

export interface LastUpdatedChipProps {
  /** ISO string, epoch millis, or Date of the last data refresh. */
  updatedAt: string | number | Date | null | undefined;
  /** Minutes after which the chip turns "stale". Default 90 (USGS refreshes hourly). */
  staleAfterMinutes?: number;
  className?: string;
}

function formatAge(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / (60 * 24))}d ago`;
}

/** Data-freshness chip: "Updated 12m ago", turning "Stale — …" past staleAfterMinutes. */
export function LastUpdatedChip({ updatedAt, staleAfterMinutes = 90, className }: LastUpdatedChipProps) {
  if (updatedAt === null || updatedAt === undefined) {
    return (
      <Chip tone="neutral" className={cx('trout-last-updated', className)}>
        Never updated
      </Chip>
    );
  }

  const ms = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
  if (Number.isNaN(ms)) {
    return (
      <Chip tone="neutral" className={cx('trout-last-updated', className)}>
        Unknown freshness
      </Chip>
    );
  }

  const minutes = Math.max(0, (Date.now() - ms) / 60_000);
  const stale = minutes > staleAfterMinutes;
  return (
    <Chip
      tone={stale ? 'poor' : 'good'}
      className={cx('trout-last-updated', className)}
      title={stale ? 'Data is older than expected — it may be out of date.' : 'Data is fresh.'}
    >
      {stale ? `Stale — updated ${formatAge(minutes)}` : `Updated ${formatAge(minutes)}`}
    </Chip>
  );
}
