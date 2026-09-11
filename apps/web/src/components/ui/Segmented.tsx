import { useId } from 'react';
import { motion } from 'motion/react';
import { SPRING } from '../motion/atlas-motion';

/**
 * Segmented — SmoothUI-style animated segmented control. The active pill
 * slides between options via a shared layoutId spring; keyboard users get
 * the same tablist semantics the old controls had.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}) {
  const layoutId = useId();
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <div role="tablist" aria-label={ariaLabel} className="atlas-glass inline-flex rounded-full p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`focus-ring relative min-h-[36px] rounded-full ${pad} font-bold transition-colors ${active ? 'text-[#0A100E]' : 'text-[#9FB5AA] hover:text-[#EAF2ED]'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING.snappy}
                className="absolute inset-0 rounded-full bg-[#E8B04B]"
                aria-hidden
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
