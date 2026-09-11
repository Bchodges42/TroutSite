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
  /** Heading level for the title: h1 when the empty state IS the page (e.g. 404), h2 under a page h1. */
  heading?: 'h1' | 'h2';
}

/** Empty/zero-data placeholder. Styling from @trout/ui/tokens.css (.trout-empty*). */
export function EmptyState({ title, description, action, icon, className, heading = 'h2' }: EmptyStateProps) {
  const Title = heading;
  return (
    <div className={cx('trout-empty', className)}>
      {icon ? <span className="trout-empty__icon" aria-hidden="true">{icon}</span> : null}
      <Title className="trout-empty__title">{title}</Title>
      {description ? <span>{description}</span> : null}
      {action ?? null}
    </div>
  );
}
