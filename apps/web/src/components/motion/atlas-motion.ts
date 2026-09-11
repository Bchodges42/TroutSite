import { useReducedMotion as useMotionReducedMotion } from 'motion/react';
import { useSettingsContext } from '../../lib/settings';

/**
 * Atlas motion vocabulary — every animated surface in the app pulls its
 * transition from here so nothing ever snaps or eases linearly.
 * Springs only (Framer/Motion `motion` package); no tweens with linear/ease.
 */
export const SPRING = {
  /** Overlay chips, small panels — quick but soft. */
  snappy: { type: 'spring', stiffness: 520, damping: 32, mass: 0.9 } as const,
  /** Sheets, drawers, inspectors — a touch of travel. */
  soft: { type: 'spring', stiffness: 320, damping: 30, mass: 1 } as const,
  /** Deliberate entrances (intro stagger). */
  gentle: { type: 'spring', stiffness: 180, damping: 26, mass: 1.1 } as const,
};

/** MapLibre camera easing for the intro push-in (easeOutCubic — never linear). */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * True when the visitor asked for reduced motion — either the OS setting or
 * the in-app toggle (Settings → Reduce motion, persisted in Dexie).
 */
export function useAtlasReducedMotion(): boolean {
  const { settings } = useSettingsContext();
  const media = useMotionReducedMotion();
  return settings.reduceMotion || media === true;
}
