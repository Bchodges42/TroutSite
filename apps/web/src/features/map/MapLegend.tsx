import { atlas } from './mapTokens';

export function MapLegend({ mode }: { mode: 'conditions' | 'hatches' }) {
  if (mode === 'hatches') {
    return (
      <div
        className="rounded-2xl border bg-[#F8F2E5] px-3 py-2 text-xs shadow-sm"
        style={{ borderColor: atlas.hairline }}
        aria-label="Hatch legend"
      >
        <p className="font-bold text-[#24352D]">Hatch activity</p>
        <p className="text-[#566158]">Halo shows dominant hatch for selected month</p>
        <div className="mt-1 flex gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full" style={{ background: atlas.sulphur }} aria-hidden /> active
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full" style={{ background: atlas.noData }} aria-hidden /> quiet
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl border bg-[#F8F2E5] px-3 py-2 text-xs shadow-sm"
      style={{ borderColor: atlas.hairline }}
      aria-label="Condition legend"
    >
      <p className="font-bold text-[#24352D]">Fishability</p>
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
    </div>
  );
}
