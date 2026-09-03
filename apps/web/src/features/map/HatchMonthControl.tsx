type Props = { month?: number; value?: number; onChange: (m: number) => void; onCommit?: (m: number) => void };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

export function HatchMonthControl({ month: monthProp, value: valueProp, onChange, onCommit }: Props) {
  const month = monthProp ?? valueProp ?? 1;
  const commit = (m: number) => { onChange(m); onCommit?.(m); };
  const months = MONTHS;
  return (
    <div className="flex flex-col gap-2">
      {/* Slider row — sm and up. On phones the discrete grid below is the
          primary control: bigger targets, no horizontal squeeze. */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-xs font-bold uppercase tracking-wide text-[#566158]">Month</span>
        <div
          role="slider" aria-label="Hatch month" aria-valuemin={1} aria-valuemax={12} aria-valuenow={month} aria-valuetext={months[month - 1]} tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); commit(Math.min(12, month + 1)); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); commit(Math.max(1, month - 1)); }
            else if (e.key === 'Home') { e.preventDefault(); commit(1); }
            else if (e.key === 'End') { e.preventDefault(); commit(12); }
          }}
          className="focus-ring flex h-11 flex-1 items-center gap-1 rounded-full border bg-white px-1 shadow-sm" style={{ borderColor: '#D3C6AB' }}
        >
          {months.map((label, i) => {
            const m = i + 1; const active = m === month;
            return (
              <button key={label} type="button" aria-pressed={active} aria-label={`Set month to ${label}`} onClick={() => commit(m)} className={`h-8 min-w-0 flex-1 rounded-full text-xs font-bold focus-visible:outline focus-visible:outline-2 ${active ? 'bg-[#24352D] text-white' : 'text-[#566158] hover:bg-[#F2E9D5]'}`}>{label.slice(0,1)}</button>
            );
          })}
        </div>
        <span className="rounded-full border bg-white px-2.5 py-1 text-xs font-bold text-[#24352D] shadow-sm" style={{ borderColor: '#D3C6AB' }}>{months[month - 1]}</span>
      </div>
      {/* Discrete large targets row for touch */}
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
        {months.map((label,i)=>{
          const m=i+1; const active=m===month;
          return <button key={label} type="button" aria-pressed={active} onClick={()=>commit(m)} className="focus-ring min-h-[44px] rounded-full border text-xs font-bold" style={{ background: active? '#24352D':'#fff', color: active?'#fff':'#566158', borderColor: '#D3C6AB'}}>{label}</button>;
        })}
      </div>
      <input type="range" min={1} max={12} step={1} value={month} onChange={(e)=> onChange(Number(e.target.value))} onPointerUp={(e)=> onCommit?.(Number((e.target as HTMLInputElement).value))} className="sr-only" aria-hidden tabIndex={-1} />
    </div>
  );
}
