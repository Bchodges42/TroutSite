export function MapModeControl({ mode, value, onChange }: { mode?: 'conditions' | 'hatches'; value?: 'conditions' | 'hatches'; onChange: (m: 'conditions' | 'hatches') => void }) {
  const v = mode ?? value ?? 'conditions';
  return (
    <div role="tablist" aria-label="Map mode" className="inline-flex rounded-full border bg-white p-1 shadow-sm" style={{ borderColor: '#D3C6AB' }}>
      {(['conditions','hatches'] as const).map(m => (
        <button key={m} role="tab" aria-selected={v === m} onClick={() => onChange(m)} className={`rounded-full px-4 py-2 text-sm font-bold ${v === m ? 'bg-[#24352D] text-white' : 'text-[#566158]'}`}>{m === 'conditions' ? 'Conditions' : 'Hatches'}</button>
      ))}
    </div>
  );
}
