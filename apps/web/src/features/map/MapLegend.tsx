import { useState } from 'react';
import { atlas } from './mapTokens';

const HIDDEN_KEY = 'trout:legendHidden';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {open ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}

function LegendToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  const label = hidden ? 'Show legend' : 'Hide legend';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!hidden}
      aria-label={label}
      title={label}
      className="ml-auto -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#566158] hover:bg-[#EFE5CF]"
    >
      <ChevronIcon open={!hidden} />
    </button>
  );
}

export function MapLegend({ mode }: { mode: 'conditions' | 'hatches' }) {
  const [hidden, setHidden] = useState<boolean>(() => localStorage.getItem(HIDDEN_KEY) === '1');
  const toggle = () =>
    setHidden((v) => {
      if (v) localStorage.removeItem(HIDDEN_KEY);
      else localStorage.setItem(HIDDEN_KEY, '1');
      return !v;
    });

  if (mode === 'hatches') {
    return (
      <div
        className="rounded-2xl border bg-[#F8F2E5]/95 px-3.5 py-2.5 text-xs shadow-[0_4px_16px_rgba(51,45,32,0.14)] backdrop-blur-sm"
        style={{ borderColor: atlas.hairline }}
        aria-label="Hatch legend"
      >
        <div className="flex items-center gap-2">
          <p className="font-bold text-[#24352D]">Hatch activity</p>
          <LegendToggle hidden={hidden} onToggle={toggle} />
        </div>
        {!hidden && (
          <>
            <p className="text-[#566158]">Halo shows dominant hatch for selected month</p>
            <div className="mt-1 flex gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-4 rounded-full" style={{ background: atlas.sulphur }} aria-hidden /> active
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-4 rounded-full" style={{ background: atlas.noData }} aria-hidden /> quiet
              </span>
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl border bg-[#F8F2E5]/95 px-3.5 py-2.5 text-xs shadow-[0_4px_16px_rgba(51,45,32,0.14)] backdrop-blur-sm"
      style={{ borderColor: atlas.hairline }}
      aria-label="Condition legend"
    >
      <div className="flex items-center gap-2">
        <p className="font-bold text-[#24352D]">Fishability</p>
        <LegendToggle hidden={hidden} onToggle={toggle} />
      </div>
      {!hidden && (
        <>
          <p className="text-xs text-[#566158]">Flow + temp → 0–100 · Good ≥70 · Fair ≥40</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.good }} aria-hidden /> Good
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.fair }} aria-hidden /> Fair
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.poor }} aria-hidden /> Poor
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.noData }} aria-hidden /> No data
            </span>
          </div>
        </>
      )}
    </div>
  );
}
