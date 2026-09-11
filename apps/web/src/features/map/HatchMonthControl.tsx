type Props = { month?: number; value?: number; onChange: (m: number) => void; onCommit?: (m: number) => void; compact?: boolean };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

export function HatchMonthControl({ month: monthProp, value: valueProp, onChange, onCommit, compact }: Props) {
  const month = monthProp ?? valueProp ?? 1;
  const commit = (m: number) => { onChange(m); onCommit?.(m); };
  const months = MONTHS;

  // Compact — one keyboard-operable strip inside the floating controls panel.
  if (compact) {
    return (
      <div
        role="slider" aria-label="Hatch month" aria-valuemin={1} aria-valuemax={12} aria-valuenow={month} aria-valuetext={months[month - 1]} tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); commit(Math.min(12, month + 1)); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); commit(Math.max(1, month - 1)); }
          else if (e.key === 'Home') { e.preventDefault(); commit(1); }
          else if (e.key === 'End') { e.preventDefault(); commit(12); }
        }}
        className="focus-ring flex items-center gap-1"
      >
        {months.map((label, i) => {
          const m = i + 1; const active = m === month;
          return (
            <button key={label} type="button" aria-pressed={active} aria-label={`Set month to ${label}`} onClick={() => commit(m)} className={`h-8 min-w-0 flex-1 rounded-full text-xs font-bold focus-visible:outline focus-visible:outline-2 ${active ? 'bg-[#E8B04B] text-[#0A100E]' : 'text-[#9FB5AA] hover:bg-white/10'}`}>{label.slice(0,1)}</button>
          );
        })}
        <span className="ml-1 w-8 shrink-0 text-xs font-bold text-[#EAF2ED]">{months[month - 1]}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Slider row — sm and up. On phones the discrete grid below is the
          primary control: bigger targets, no horizontal squeeze. */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="eyebrow">Month</span>
        <div
          role="slider" aria-label="Hatch month" aria-valuemin={1} aria-valuemax={12} aria-valuenow={month} aria-valuetext={months[month - 1]} tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); commit(Math.min(12, month + 1)); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); commit(Math.max(1, month - 1)); }
            else if (e.key === 'Home') { e.preventDefault(); commit(1); }
            else if (e.key === 'End') { e.preventDefault(); commit(12); }
          }}
          className="focus-ring atlas-glass flex h-11 flex-1 items-center gap-1 rounded-full px-1"
        >
          {months.map((label, i) => {
            const m = i + 1; const active = m === month;
            return (
              <button key={label} type="button" aria-pressed={active} aria-label={`Set month to ${label}`} onClick={() => commit(m)} className={`h-8 min-w-0 flex-1 rounded-full text-xs font-bold focus-visible:outline focus-visible:outline-2 ${active ? 'bg-[#E8B04B] text-[#0A100E]' : 'text-[#9FB5AA] hover:bg-white/10'}`}>{label.slice(0,1)}</button>
            );
          })}
        </div>
        <span className="atlas-glass rounded-full px-2.5 py-1 text-xs font-bold text-[#EAF2ED]">{months[month - 1]}</span>
      </div>
      {/* Discrete large targets row for touch */}
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
        {months.map((label,i)=>{
          const m=i+1; const active=m===month;
          return <button key={label} type="button" aria-pressed={active} onClick={()=>commit(m)} className="focus-ring min-h-[44px] rounded-full border text-xs font-bold" style={{ background: active? '#E8B04B':'#131F19', color: active?'#0A100E':'#9FB5AA', borderColor: '#223329'}}>{label}</button>;
        })}
      </div>
      <input type="range" min={1} max={12} step={1} value={month} onChange={(e)=> onChange(Number(e.target.value))} onPointerUp={(e)=> onCommit?.(Number((e.target as HTMLInputElement).value))} className="sr-only" aria-hidden tabIndex={-1} />
    </div>
  );
}
