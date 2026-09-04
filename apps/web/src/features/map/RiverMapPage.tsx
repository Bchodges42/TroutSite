import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TennesseeMap } from './TennesseeMap';
import { RiverDrawer } from './RiverDrawer';
import { RiverSearch } from './RiverSearch';
import { MapModeControl } from './MapModeControl';
import { HatchMonthControl } from './HatchMonthControl';
import { MapLegend } from './MapLegend';
import type { BasemapVariant } from './mapStyle';
import { useShell } from '../../components/layout/AppShell';
import { MenuIcon } from '../../components/icons';
import { useRiverMapData } from './useRiverMapData';
import { currentMonth } from '../../lib/time';
import { useOnline } from '../../hooks/useOnline';
import { ageMinutes } from '../../lib/time';

const TABS = ['Water','Hatch','Stocking','Reports','Your Log'] as const;

// Cycled by the basemap pill. 'topo' joins once the /atlas/topo/manifest.json probe succeeds.
const CORE_BASEMAPS: BasemapVariant[] = ['paper', 'ink'];
const ALL_BASEMAPS: BasemapVariant[] = [...CORE_BASEMAPS, 'topo'];
const BASEMAP_LABELS: Record<BasemapVariant, string> = { paper: 'Paper', ink: 'Ink', topo: 'Topo' };
const isBasemapVariant = (v: string | null): v is BasemapVariant => v === 'paper' || v === 'ink' || v === 'topo';

export function RiverMapPage() {
  const [params, setParams] = useSearchParams();
  const { openMenu, menuOpen } = useShell();
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

  const hatchColors = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of features) if (f.hatchHalo) m.set(f.stream.id, f.hatchHalo.color);
    return m;
  }, [features]);

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

  // Basemap — URL param wins, then last choice (localStorage), then paper.
  const [basemap, setBasemap] = useState<BasemapVariant>(() => {
    const fromUrl = params.get('basemap');
    if (isBasemapVariant(fromUrl)) return fromUrl;
    const saved = localStorage.getItem('trout:basemap');
    return isBasemapVariant(saved) ? saved : 'paper';
  });
  const setBasemapPersist = (v: BasemapVariant) => {
    setBasemap(v);
    localStorage.setItem('trout:basemap', v);
    const next = new URLSearchParams(params);
    next.set('basemap', v);
    setParams(next, { replace: true });
  };
  // Topo is capability-detected (guide Task 6e Phase B step 3): the switcher
  // only offers it when the build's topo output actually exists.
  const [topoReady, setTopoReady] = useState(false);
  const basemapRef = useRef(basemap);
  basemapRef.current = basemap;
  useEffect(() => {
    let cancelled = false;
    fetch('/atlas/topo/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j && Array.isArray(j.bands) && j.hillshade && typeof j.minZoom === 'number' && typeof j.maxZoom === 'number') {
          setTopoReady(true);
        } else if (basemapRef.current === 'topo') {
          setBasemapPersist('paper'); // deep link / saved topo without the data — fall back honestly
        }
      })
      .catch(() => {
        if (!cancelled && basemapRef.current === 'topo') setBasemapPersist('paper');
      });
    return () => { cancelled = true; };
  }, []);
  const cycleBasemap = () => {
    const list = topoReady ? ALL_BASEMAPS : CORE_BASEMAPS;
    const idx = list.indexOf(basemap);
    const next = list[(idx + 1) % list.length] ?? 'paper';
    setBasemapPersist(next);
  };
  // Until the probe confirms the build output, 'topo' renders as paper — the
  // style's sources must never be requested before the files exist.
  const effectiveBasemap: BasemapVariant = basemap === 'topo' && !topoReady ? 'paper' : basemap;

  const [hintDismissed, setHintDismissed] = useState<boolean>(() => localStorage.getItem('trout:hintDismissed') === '1');
  useEffect(() => { if (selectedId) { localStorage.setItem('trout:hintDismissed','1'); setHintDismissed(true); } }, [selectedId]);

  // location (private, in-memory only)
  const [userPos, setUserPos] = useState<{lat:number;lon:number}|null>(null);
  const requestLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p=> setUserPos({ lat: p.coords.latitude, lon: p.coords.longitude }), ()=>{}, { maximumAge: 300000, timeout: 8000 });
  };

  // Desktop detection for panel-aware map fit (selection centers clear of the
  // 420px inspector, top controls, and left nav).
  const [isDesktop, setIsDesktop] = useState<boolean>(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const fitPadding = selectedId
    ? isDesktop
      ? { top: 96, bottom: 32, left: 32, right: 452 }
      : { top: 148, bottom: 320, left: 16, right: 16 }
    : undefined;
  const allIds = useMemo(() => features.map((f) => f.stream.id), [features]);

  // Orientation places (real Census centroids, same-origin /atlas/places.json)
  const [places, setPlaces] = useState<Array<{ name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' }>>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/atlas/places.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j && Array.isArray(j.places)) setPlaces(j.places); })
      .catch(() => { /* labels are orientation aids only */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={`relative flex h-dvh flex-col overflow-hidden bg-[#F2E9D5]${selectedId && isDesktop ? ' atlas-panel-open' : ''}`}>
      {/* Map fills */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* paper grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />
        <TennesseeMap selectedId={selectedId} onSelect={setRiver} featureColors={featureColors} allIds={allIds} hatchActiveIds={hatchActiveIds} hatchColors={hatchColors} fitPadding={fitPadding} places={places} basemap={effectiveBasemap} />
        {/* Top bar — right-capped on desktop when the inspector is open so
            controls never slide under the 420px panel (+24px gutters). */}
        <div className={`pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3 ${selectedId && isDesktop ? 'lg:right-[444px]' : ''}`}>
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={openMenu} aria-label="Open menu" aria-expanded={menuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm" style={{ borderColor: '#D3C6AB' }}>
              <MenuIcon size={20} />
            </button>
            <Link to="/" className="flex shrink-0 items-center gap-1.5 rounded-full border bg-white px-3 py-2 shadow-sm" style={{ borderColor: '#D3C6AB' }} aria-label="Trout — home">
              <span className="atlas-title text-sm font-black tracking-tight text-[#24352D]">Trout</span>
              <span className="hidden text-[11px] font-semibold text-[#566158] sm:inline">Field Atlas</span>
            </Link>
            <RiverSearch streams={streams} onSelect={setRiver} />
            <MapModeControl mode={mode} onChange={setMode} />
            <button type="button" onClick={cycleBasemap} aria-label={`Basemap: ${BASEMAP_LABELS[basemap]} — change`} title={`Basemap: ${BASEMAP_LABELS[basemap]} — change`} className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-full border bg-white px-3 text-xs font-bold shadow-sm" style={{ borderColor: '#D3C6AB' }}>
              {BASEMAP_LABELS[basemap]}
            </button>
            <button onClick={requestLocation} className="rounded-full border bg-white px-3 py-2 text-xs font-bold shadow-sm" style={{ borderColor: '#D3C6AB' }} title="Use location only on this device — never sent">Near me</button>
            <a href="/conditions" className="rounded-full border bg-white px-3 py-2 text-xs font-bold shadow-sm" style={{ borderColor: '#D3C6AB' }}>Browse as list</a>
          </div>
          <div className="pointer-events-auto flex flex-wrap gap-2">
            {mode === 'hatches' && <HatchMonthControl month={month} onChange={setMonthReplace} />}
            <span className="whitespace-nowrap rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-sm" style={{ borderColor: '#D3C6AB' }}>{live ? 'Live' : 'Cached'} {fetchedAt ? `· ${ageMinutes(fetchedAt)}` : ''} {!online ? '· Offline — still works' : ''}</span>
          </div>
          {!hintDismissed && (
            <div className="pointer-events-auto flex max-w-[360px] items-center justify-between gap-2 rounded-2xl border bg-[#F8F2E5] px-3 py-2 text-xs shadow-sm" style={{ borderColor: '#D3C6AB' }}>
              <span className="font-semibold text-[#24352D]">Tap a river. Color shows current conditions.</span>
              <button onClick={() => { setHintDismissed(true); localStorage.setItem('trout:hintDismissed','1'); }} className="rounded-full bg-[#24352D] px-3 py-1 text-xs font-bold text-white">Got it</button>
            </div>
          )}
        </div>
        {/* Docked legend — bottom-left; clears attribution (bottom-right) and the mobile peek sheet. */}
        <div className={`absolute left-3 z-10 ${selectedFeature ? 'bottom-[172px] lg:bottom-3' : 'bottom-3'}`}>
          <MapLegend mode={mode} />
        </div>
        {/* desktop inspector — full-height card, content starts at the top,
            ONE scroll region (the panel body inside RiverDrawer). */}
        {selectedFeature && (
          <div className="atlas-panel-open pointer-events-none absolute bottom-3 right-3 top-20 hidden w-[420px] lg:block" data-testid="desktop-panel">
            <div className="pointer-events-auto h-full overflow-hidden rounded-2xl border bg-[#F8F2E5] shadow-[0_8px_32px_rgba(51,45,32,0.16)]" style={{ borderColor: '#D3C6AB' }}>
              <RiverDrawer feature={selectedFeature} tab={validatedTab} onTab={setTab} onClose={() => setRiver(null)} modeMonth={month} live={live} fetchedAt={fetchedAt} layout="panel" />
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
