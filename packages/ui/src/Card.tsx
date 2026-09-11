import type { HTMLAttributes } from 'react';
import { cx } from './cx.js';

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Surface container. Styling comes from @trout/ui/tokens.css (.trout-card). */
export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cx('trout-card', className)} {...rest}>
      {children}
    </div>
  );
}
