import { useEffect, useRef } from 'react';
import { useSpring, useTransform, useMotionValueEvent, animate } from 'motion/react';

/**
 * AnimatedNumber — SmoothUI-style stat ticker. The span always renders the
 * current value as text (screen readers, tests, no-JS-motion all see it);
 * the spring just rolls the digits when the value changes.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 120, damping: 24, mass: 1 });
  const text = useTransform(spring, (v) => (format ? format(v) : String(Math.round(v))));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(spring, value, { stiffness: 120, damping: 24, mass: 1 });
    return () => controls.stop();
  }, [spring, value]);

  useMotionValueEvent(text, 'change', (v) => {
    if (ref.current) ref.current.textContent = v;
  });

  return (
    <span ref={ref} className={className}>
      {format ? format(value) : String(value)}
    </span>
  );
}
