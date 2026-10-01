import { useEffect, useState } from 'react';

/**
 * Mobile-polish helpers for the river inspector bottom sheet (RiverMapPage +
 * RiverDrawer). One small module because the sheet's tab state, per-tab scroll
 * memory, visit memory, and keyboard-inset read all need to be shared by both
 * components (and unit-tested) without a new persisted store — everything here
 * is in-memory for the current session only.
 */

/**
 * Mobile sheet snap points, as fractions of the viewport (vaul's format).
 * 0.28 = peek (the Water Overview card's summary under the sheet chrome),
 * 0.49 = half (the long-standing default position), 0.82 = expanded.
 */
export const SHEET_SNAP_POINTS = [0.28, 0.49, 0.82] as const;

/** The `expanded` boolean grew a middle state: peek / half / expanded. */
export type SheetSnapState = 'peek' | 'half' | 'expanded';

const SNAP_VALUES: Record<SheetSnapState, number> = {
  peek: 0.28,
  half: 0.49,
  expanded: 0.82,
};

export function snapValueFor(state: SheetSnapState): number {
  return SNAP_VALUES[state];
}

/** Buckets a vaul snap value (or a mid-drag/null value) back onto a state. */
export function snapToState(value: number | string | null | undefined): SheetSnapState {
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (numeric == null || Number.isNaN(numeric)) return 'half';
  if (numeric <= 0.35) return 'peek';
  if (numeric <= 0.65) return 'half';
  return 'expanded';
}

/**
 * Session visit memory (mobile only): the last tab + snap per water, so
 * reopening the same water in this session resumes where the visit left off.
 * Deliberately in-memory — a fresh session starts clean, nothing persisted.
 */
export interface WaterVisit {
  tab: string;
  snap: SheetSnapState;
}

const visits = new Map<string, WaterVisit>();

export function getWaterVisit(id: string): WaterVisit | undefined {
  return visits.get(id);
}

export function recordWaterVisit(id: string, visit: WaterVisit): void {
  visits.set(id, visit);
}

/**
 * Per-tab scroll memory for a visit: switching Water/Hatch/Stocking/Reports/
 * Your Log keeps each tab's scroll position (keyed water + tab so a second
 * water never inherits another's offsets). In-memory, session-scoped.
 */
const tabScroll = new Map<string, number>();

const tabKey = (waterId: string, tab: string) => waterId + '|' + tab;

export function getTabScroll(waterId: string, tab: string): number {
  return tabScroll.get(tabKey(waterId, tab)) ?? 0;
}

export function setTabScroll(waterId: string, tab: string, top: number): void {
  tabScroll.set(tabKey(waterId, tab), top);
}

/** Test isolation only — the stores are never cleared in the app session. */
export function resetDrawerSessionStores(): void {
  visits.clear();
  tabScroll.clear();
}

/**
 * Soft-keyboard inset from the visual viewport: how many layout pixels the
 * keyboard (or any bottom chrome taller than a URL-bar wobble) covers.
 * Small offsets (< KEYBOARD_INSET_THRESHOLD) are URL-bar resizes, not the
 * keyboard, and report 0 so nothing jumps during scroll. Plain-object input
 * so tests can stub the VisualViewport.
 */
export const KEYBOARD_INSET_THRESHOLD = 100;

export function readKeyboardInset(
  viewport: { height: number; offsetTop: number } | null | undefined,
  layoutHeight: number,
): number {
  if (!viewport) return 0;
  const inset = Math.round(layoutHeight - (viewport.height + viewport.offsetTop));
  return inset >= KEYBOARD_INSET_THRESHOLD ? inset : 0;
}

/**
 * Reactive keyboard inset for the sheet surfaces. RiverDrawer appends a
 * scroll spacer of this height inside the tab panel so the quick-log form
 * actions (and every tab's tail content) stay reachable above the keyboard;
 * RiverMapPage caps the search-results dropdown the same way.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(() => readKeyboardInset(window.visualViewport, window.innerHeight));
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setInset(readKeyboardInset(viewport, window.innerHeight));
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}
