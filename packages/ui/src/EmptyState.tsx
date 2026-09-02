import type { ReactNode } from 'react';
import { cx } from './cx.js';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional call to action (e.g. a Button). */
  action?: ReactNode;
  /** Optional glyph (emoji/SVG). */
  icon?: ReactNode;
  className?: string;
}

/** Empty/zero-data placeholder. Styling from @trout/ui/tokens.css (.trout-empty*). */
export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cx('trout-empty', className)}>
      {icon ? <span className="trout-empty__icon">{icon}</span> : null}
      <span className="trout-empty__title">{title}</span>
      {description ? <span>{description}</span> : null}
      {action ?? null}
    </div>
  );
}
