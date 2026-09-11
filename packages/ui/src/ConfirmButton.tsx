import { useEffect, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cx } from './cx.js';

export interface ConfirmButtonProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onClick' | 'children'> {
  /** Idle label — names the destructive action, e.g. "Delete". */
  label: string;
  /** Armed label — the action that will be committed, e.g. "Delete entry". */
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Seconds the armed state waits before disarming on its own. */
  armSeconds?: number;
}

/**
 * Inline confirm: a destructive button that morphs in place into
 * commit/cancel instead of throwing a blocking window.confirm() dialog.
 * Escape, focus leaving the group, or the timeout all disarm it.
 */
export function ConfirmButton({
  label,
  confirmLabel = `Confirm ${label.toLowerCase()}`,
  cancelLabel = 'Keep',
  onConfirm,
  armSeconds = 6,
  className,
  ...rest
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);

  const disarm = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setArmed(false);
  };
  useEffect(() => disarm, []);

  const arm = () => {
    setArmed(true);
    timer.current = window.setTimeout(disarm, armSeconds * 1000);
  };

  return (
    <span
      {...rest}
      className={cx('trout-confirm', armed && 'is-armed', className)}
      role="group"
      aria-label={label}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) disarm();
        rest.onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          disarm();
          e.stopPropagation();
        }
        rest.onKeyDown?.(e);
      }}
    >
      {armed ? (
        <>
          <button
            type="button"
            className="trout-confirm__commit"
            onClick={() => {
              disarm();
              onConfirm();
            }}
            autoFocus
          >
            {confirmLabel}
          </button>
          <button type="button" className="trout-confirm__cancel" onClick={disarm}>
            {cancelLabel}
          </button>
        </>
      ) : (
        <button type="button" className="trout-confirm__arm" onClick={arm}>
          {label}
        </button>
      )}
      <span className="trout-sr-only" role="status">
        {armed ? `${confirmLabel} — or ${cancelLabel.toLowerCase()} to keep it.` : ''}
      </span>
    </span>
  );
}
