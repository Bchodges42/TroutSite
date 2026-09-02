import type { HTMLAttributes } from 'react';
import { cx } from './cx.js';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'good' | 'fair' | 'poor';
}

/** Small pill label. Styling comes from @trout/ui/tokens.css (.trout-chip*). */
export function Chip({ tone = 'neutral', className, children, ...rest }: ChipProps) {
  return (
    <span className={cx('trout-chip', tone !== 'neutral' && `trout-chip--${tone}`, className)} {...rest}>
      {children}
    </span>
  );
}
