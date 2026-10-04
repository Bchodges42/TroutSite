import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { SPRING } from '../motion/atlas-motion';

/**
 * Segmented — the ONE segmented control (design audit 2026-10-04, P0-4/P1-14).
 * A row of mutually exclusive toggle buttons (aria-pressed, inside a labelled
 * group — not a tablist, there are no tab panels). The active thumb slides via
 * a shared layoutId spring. Every color comes from theme tokens (.seg* in
 * index.css); `floating` lifts the track onto the map with e2 elevation.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  floating = false,
  className,
}: {
  options: ReadonlyArray<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  floating?: boolean;
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={'seg' + (floating ? ' seg--floating' : '') + (className ? ' ' + className : '')}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            className="seg__btn"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING.snappy}
                className="seg__thumb"
                aria-hidden
              />
            )}
            <span className="seg__label">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
