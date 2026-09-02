import { cx } from './cx.js';

export interface DataBadgeProps {
  /** Uppercase label, e.g. "FLOW", "FISHABILITY". */
  label: string;
  /** The measured value or verdict, e.g. "250 cfs", "Fair". */
  value: string;
  /** Semantic status tinting; defaults to neutral. */
  status?: 'good' | 'fair' | 'poor' | 'unknown';
  className?: string;
}

/** Labeled data readout with a status-colored edge. Styling from @trout/ui/tokens.css (.trout-badge*). */
export function DataBadge({ label, value, status = 'unknown', className }: DataBadgeProps) {
  return (
    <span className={cx('trout-badge', status !== 'unknown' && `trout-badge--${status}`, className)}>
      <span className="trout-badge__label">{label}</span>
      <span className="trout-badge__value">{value}</span>
    </span>
  );
}
