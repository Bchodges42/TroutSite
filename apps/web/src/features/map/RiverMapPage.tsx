import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TennesseeMap } from './TennesseeMap';
import { RiverDrawer } from './RiverDrawer';
import { RiverSearch } from './RiverSearch';
import { MapModeControl } from './MapModeControl';
import { HatchMonthControl } from './HatchMonthControl';
import { MapLegend } from './MapLegend';
import { useRiverMapData } from './useRiverMapData';
import { currentMonth } from '../../lib/time';
import { useOnline } from '../../hooks/useOnline';
import { ageMinutes } from '../../lib/time';

const TABS = ['Water','Hatch','Stocking','Reports','Your Log'] as const;

export function RiverMapPage() {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const selectedId = params.get('river');
  const tab = (params.get('tab') as typeof TABS[number]) ?? 'Water';
  const mode = (params.get('mode') as 'conditions' | 'hatches') ?? 'conditions';
  const monthParam = params.get('month');
  const [month, setMonth] = useState<number>(monthParam ? parseInt(monthParam,10) : currentMonth());
  const { features, fetchedAt, live, streams } = useRiverMapData({ month: mode === 'hatches' ? month : currentMonth() } as any);

  const featureColors = useMemo(() => {
    const m = new Map<string,string>();
    for (const f of features) m.set(f.stream.id, f.color);
    return m;
  }, [features]);

  const hatchActiveIds = useMemo(() => {
    if (mode !== 'hatches') return new Set<string>();
    const s = new Set<string>();
    for (const f of features) if (f.hatchChart && f.hatchChart.entries.some((e:any)=> e.abundance>=2)) s.add(f.stream.id);
    return s;
  }, [features, mode]);

  const selectedFeature = useMemo(() => features.find(f=> f.stream.id === selectedId) ?? null, [features, selectedId]);
  const validatedTab = (TABS as readonly string[]).includes(tab) ? tab as typeof TABS[number] : 'Water';

  const setRiver = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('river', id); else next.delete('river');
    if (!next.get('tab')) next.set('tab','Water');
    setParams(next, { replace: false });
  };
  const setTab = (t: typeof TABS[number]) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    if (selectedId) next.set('river', selectedId);
    setParams(next, { replace: true });
  };
  const setMode = (m: 'conditions' | 'hatches') => {
    const next = new URLSearchParams(params);
    next.set('mode', m);
    setParams(next, { replace: true });
  };
  const setMonthReplace = (m: number) => {
    setMonth(m);
    const next = new URLSearchParams(params);
    next.set('month', String(m));
    setParams(next, { replace: true });
  };

  const [hintDismissed, setHintDismissed] = useState<boolean>(() => localStorage.getItem('trout:hintDismissed') === '1');
  useEffect(() => { if (selectedId) { localStorage.setItem('trout:hintDismissed','1'); setHintDismissed(true); } }, [selectedId]);

  // location (private, in-memory only)
  const [userPos, setUserPos] = useState<{lat:number;lon:number}|null>(null);
  const requestLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p=> setUserPos({ lat: p.coords.latitude, lon: p.coords.longitude }), ()=>{}, { maximumAge: 300000, timeout: 8000 });
  };

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem-3.5rem)] flex-col bg-[#F2E9D5] lg:h-[calc(100dvh-3.5rem)]">
      {/* Map fills */}
      <div className="relative flex-1 overflow-hidden">
        {/* paper grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />
        <TennesseeMap selectedId={selectedId} onSelect={setRiver} featureColors={featureColors} hatchActiveIds={hatchActiveIds} />
        {/* Top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <RiverSearch streams={streams} onSelect={setRiver} />
            <MapModeControl mode={mode} onChange={setMode} />
            <button onClick={requestLocation} className="rounded-full border bg-white px-3 py-2 text-xs font-bold shadow-sm" style={{ borderColor: '#D3C6AB' }} title="Use location only on this device — never sent">Near me</button>
            <a href="/conditions" className="rounded-full border bg-white px-3 py-2 text-xs font-bold shadow-sm" style={{ borderColor: '#D3C6AB' }}>Browse as list</a>
          </div>
          <div className="pointer-events-auto flex flex-wrap gap-2">
            {mode === 'hatches' && <HatchMonthControl month={month} onChange={setMonthReplace} />}
            <MapLegend mode={mode} />
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-sm" style={{ borderColor: '#D3C6AB' }}>{live ? 'Live' : 'Cached'} {fetchedAt ? `· ${ageMinutes(fetchedAt)}` : ''} {!online ? '· Offline — still works' : ''}</span>
          </div>
          {!hintDismissed && (
            <div className="pointer-events-auto flex max-w-[360px] items-center justify-between gap-2 rounded-2xl border bg-[#F8F2E5] px-3 py-2 text-xs shadow-sm" style={{ borderColor: '#D3C6AB' }}>
              <span className="font-semibold text-[#24352D]">Tap a river. Color shows current conditions.</span>
              <button onClick={() => { setHintDismissed(true); localStorage.setItem('trout:hintDismissed','1'); }} className="rounded-full bg-[#24352D] px-3 py-1 text-xs font-bold text-white">Got it</button>
            </div>
          )}
        </div>
        {/* desktop inspector */}
        {selectedFeature && (
          <div className="pointer-events-none absolute bottom-3 right-3 top-20 hidden w-[420px] lg:block">
            <div className="pointer-events-auto h-full overflow-auto rounded-2xl border bg-[#F8F2E5] shadow-[0_8px_32px_rgba(51,45,32,0.16)]" style={{ borderColor: '#D3C6AB' }}>
              <RiverDrawer feature={selectedFeature} tab={validatedTab} onTab={setTab} onClose={() => setRiver(null)} modeMonth={month} live={live} fetchedAt={fetchedAt} />
            </div>
          </div>
        )}
      </div>
      {/* mobile drawer */}
      <div className="lg:hidden">
        {selectedFeature && <RiverDrawer feature={selectedFeature} tab={validatedTab} onTab={setTab} onClose={() => setRiver(null)} modeMonth={month} live={live} fetchedAt={fetchedAt} />}
      </div>
      {userPos && <span className="sr-only">Location used locally only</span>}
    </div>
  );
}
