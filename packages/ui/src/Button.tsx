import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/** Base button. Styling comes from @trout/ui/tokens.css (.trout-btn*). */
export function Button({ variant = 'primary', size = 'md', className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cx('trout-btn', `trout-btn--${variant}`, size !== 'md' && `trout-btn--${size}`, className)}
      {...rest}
    />
  );
}
