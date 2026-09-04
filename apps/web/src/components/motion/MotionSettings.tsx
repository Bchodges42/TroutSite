import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { useSettingsContext } from '../../lib/settings';

/**
 * App-wide motion policy: springs everywhere, but both the OS
 * prefers-reduced-motion setting and the in-app Reduce motion toggle
 * (Dexie-persisted) collapse animations to instant state changes.
 */
export function MotionSettings({ children }: { children: ReactNode }) {
  const { settings } = useSettingsContext();
  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
      {children}
    </MotionConfig>
  );
}
