import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Segmented } from '../../components/ui/Segmented';
import { SPRING } from '../../components/motion/atlas-motion';
import { ListIcon, LocationIcon, SlidersIcon } from '../../components/icons';
import { HatchMonthControl } from './HatchMonthControl';
import type { BasemapVariant } from './mapStyle';

const BASEMAP_LABELS: Record<BasemapVariant, string> = { ink: 'Night', paper: 'Paper', topo: 'Relief' };

/**
 * MapControls — the overflow home for every secondary map control (mode,
 * basemap, month, near-me, browse). Collapsed it is a single icon chip;
 * expanded, a floating glass panel. Never occupies layout space. The species
 * toggle lives here too so phones can reach it (desktops get it inline).
 */
export function MapControls({
  mode,
  onMode,
  basemap,
  basemapOptions,
  onBasemap,
  month,
  onMonth,
  onLocate,
  status,
}: {
  mode: 'conditions' | 'hatches';
  onMode: (m: 'conditions' | 'hatches') => void;
  basemap: BasemapVariant;
  basemapOptions: BasemapVariant[];
  onBasemap: (b: BasemapVariant) => void;
  month: number;
  onMonth: (m: number) => void;
  onLocate: () => void;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Map controls"
        title="Map controls"
        className="atlas-chip atlas-glass h-11 w-11"
      >
        <SlidersIcon size={20} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={SPRING.snappy}
            className="atlas-glass absolute right-0 z-20 mt-2 w-[300px] rounded-2xl p-3"
            role="group"
            aria-label="Map controls panel"
          >
            <div className="space-y-3">
              <div>
                <p className="eyebrow mb-1.5">Show</p>
                <Segmented
                  ariaLabel="Map mode"
                  size="sm"
                  value={mode}
                  onChange={onMode}
                  options={[{ value: 'conditions', label: 'Conditions' }, { value: 'hatches', label: 'Hatches' }]}
                />
              </div>
              <div>
                <p className="eyebrow mb-1.5">Basemap</p>
                <Segmented
                  ariaLabel="Basemap"
                  size="sm"
                  value={basemap}
                  onChange={onBasemap}
                  options={basemapOptions.map((b) => ({ value: b, label: BASEMAP_LABELS[b] }))}
                />
              </div>
              {mode === 'hatches' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={SPRING.soft}
                  className="overflow-hidden"
                >
                  <p className="eyebrow mb-1.5">Hatch month</p>
                  <HatchMonthControl month={month} onChange={onMonth} onCommit={onMonth} compact />
                </motion.div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={onLocate} className="atlas-chip atlas-glass min-h-[40px] flex-1 justify-start gap-2 px-3 text-xs" title="Use location only on this device — never sent">
                  <LocationIcon size={16} /> Near me
                </button>
                <a href="/conditions" className="atlas-chip atlas-glass min-h-[40px] flex-1 justify-start gap-2 px-3 text-xs">
                  <ListIcon size={16} /> Browse list
                </a>
              </div>
              <p className="border-t pt-2 text-[11px] font-semibold text-[#9FB5AA]" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>{status}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
