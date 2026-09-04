import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { atlas } from './mapTokens';
import { SPRING } from '../../components/motion/atlas-motion';

const OPEN_KEY = 'trout:legendOpen';

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden /> {label}
    </span>
  );
}

/**
 * MapLegend — collapses to a corner chip by default and expands into a
 * compact glass panel on demand. Pure overlay: it never occupies layout
 * space, and its open/closed choice persists per device. In All-fish mode the
 * warmwater bronze is documented so the map never shows an unexplained color.
 */
export function MapLegend({ mode, species }: { mode: 'conditions' | 'hatches'; species: 'trout' | 'all' }) {
  const [open, setOpen] = useState<boolean>(() => localStorage.getItem(OPEN_KEY) === '1');
  const toggle = () =>
    setOpen((v) => {
      localStorage.setItem(OPEN_KEY, v ? '0' : '1');
      return !v;
    });

  return (
    <div className="relative">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={SPRING.snappy}
            className="atlas-glass w-[236px] rounded-2xl px-3.5 py-3 text-xs"
            aria-label={mode === 'hatches' ? 'Hatch legend' : 'Condition legend'}
          >
            <div className="flex items-center gap-2">
              <p className="font-bold text-[#EAF2ED]">{mode === 'hatches' ? 'Hatch activity' : 'Fishability'}</p>
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label="Hide legend"
                className="atlas-chip ml-auto h-7 w-7 rounded-full text-[#9FB5AA]"
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden focusable="false"><path d="m6 9 6 6 6-6" /></svg>
              </button>
            </div>
            {mode === 'hatches' ? (
              <>
                <p className="mt-1 text-[#9FB5AA]">Halo shows dominant hatch for selected month</p>
                <div className="mt-1.5 flex gap-2">
                  <LegendSwatch color={atlas.sulphur} label="active" />
                  <LegendSwatch color={atlas.noData} label="quiet" />
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-[#9FB5AA]">Flow + temp → 0–100 · Good ≥70 · Fair ≥40</p>
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                  <LegendSwatch color={atlas.good} label="Good" />
                  <LegendSwatch color={atlas.fair} label="Fair" />
                  <LegendSwatch color={atlas.poor} label="Poor" />
                  <LegendSwatch color={atlas.noData} label="No data" />
                </div>
              </>
            )}
            {species === 'all' && (
              <div className="mt-2 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <LegendSwatch color={atlas.warmwater} label="Warmwater — bass & panfish" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="chip"
            type="button"
            onClick={toggle}
            aria-expanded={false}
            aria-label="Show legend"
            title="Show legend"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={SPRING.snappy}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="atlas-glass atlas-chip h-10 gap-2 px-3 text-xs font-bold text-[#EAF2ED]"
          >
            <span className="flex gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.good }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.fair }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.poor }} />
            </span>
            Legend
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
