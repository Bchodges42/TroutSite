import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TennesseeMap } from './TennesseeMap';
import { RiverDrawer } from './RiverDrawer';
import { RiverSearch } from './RiverSearch';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { Segmented } from '../../components/ui/Segmented';
import type { BasemapVariant } from './mapStyle';
import { useShell } from '../../components/layout/AppShell';
import { MenuIcon } from '../../components/icons';
import { useRiverMapData } from './useRiverMapData';
import { currentMonth } from '../../lib/time';
import { useOnline } from '../../hooks/useOnline';
import { ageMinutes } from '../../lib/time';
import { SPRING, useAtlasReducedMotion } from '../../components/motion/atlas-motion';

const TABS = ['Water','Hatch','Stocking','Reports','Your Log'] as const;
type SpeciesMode = 'trout' | 'all';
const isSpeciesMode = (v: string | null): v is SpeciesMode => v === 'trout' || v === 'all';

// Cycled by the basemap control. 'topo' joins once the /atlas/topo/manifest.json probe succeeds.
const CORE_BASEMAPS: BasemapVariant[] = ['ink', 'paper'];
const ALL_BASEMAPS: BasemapVariant[] = [...CORE_BASEMAPS, 'topo'];
const isBasemapVariant = (v: string | null): v is BasemapVariant => v === 'paper' || v === 'ink' || v === 'topo';

export function RiverMapPage() {
  const [params, setParams] = useSearchParams();
  const { openMenu, menuOpen } = useShell();
  const online = useOnline();
  const reducedMotion = useAtlasReducedMotion();
  const selectedId = params.get('river');
  const tab = (params.get('tab') as typeof TABS[number]) ?? 'Water';
  const mode = (params.get('mode') as 'conditions' | 'hatches') ?? 'conditions';
  const speciesParam = params.get('species');
  const species: SpeciesMode = isSpeciesMode(speciesParam) ? speciesParam : 'trout';
  const monthParam = params.get('month');
  const [month, setMonth] = useState<number>(monthParam ? parseInt(monthParam,10) : currentMonth());
  const { features, isLoading, streams, live, fetchedAt } = useRiverMapData({ month: mode === 'hatches' ? month : currentMonth() } as any);

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

  // Species visibility — Trout mode (default) hides warmwater rivers entirely
  // (paint + hit-testing); the selected river is always exempt from the filter.
  const visibleIds = useMemo(() => {
    const s = new Set<string>();
    for (const f of features) {
      if (species === 'all' || f.species === 'trout' || f.stream.id === selectedId) s.add(f.stream.id);
    }
    return s;
  }, [features, species, selectedId]);

  const searchableStreams = useMemo(
    () => (species === 'all' ? streams : streams.filter((s: any) => (s.species ?? 'trout') === 'trout')),
    [streams, species],
  );

  const setSpecies = (next: SpeciesMode) => {
    const p = new URLSearchParams(params);
    if (next === 'trout') p.delete('species'); else p.set('species', next);
    setParams(p, { replace: true });
  };

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

  // Basemap — URL param wins, then last choice (localStorage), then dark ink.
  const [basemap, setBasemap] = useState<BasemapVariant>(() => {
    const fromUrl = params.get('basemap');
    if (isBasemapVariant(fromUrl)) return fromUrl;
    const saved = localStorage.getItem('trout:basemap');
    return isBasemapVariant(saved) ? saved : 'ink';
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
          setBasemapPersist('ink'); // deep link / saved topo without the data — fall back honestly
        }
      })
      .catch(() => {
        if (!cancelled && basemapRef.current === 'topo') setBasemapPersist('ink');
      });
    return () => { cancelled = true; };
  }, []);
  // Until the probe confirms the build output, 'topo' renders as ink — the
  // style's sources must never be requested before the files exist.
  const effectiveBasemap: BasemapVariant = basemap === 'topo' && !topoReady ? 'ink' : basemap;

  const [hintDismissed, setHintDismissed] = useState<boolean>(() => localStorage.getItem('trout:hintDismissed') === '1');
  useEffect(() => { if (selectedId) { localStorage.setItem('trout:hintDismissed','1'); setHintDismissed(true); } }, [selectedId]);

  // location (private, in-memory only)
  const requestLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p=> setUserPos({ lat: p.coords.latitude, lon: p.coords.longitude }), ()=>{}, { maximumAge: 300000, timeout: 8000 });
  };
  const [userPos, setUserPos] = useState<{lat:number;lon:number}|null>(null);

  // First-load cinematic: the map eases into Tennessee, then the overlays
  // stagger in. Deep links with a selected river skip the fly-in.
  const introEligible = useRef(!selectedId).current;

  // Desktop detection for panel-aware map fit (selection centers clear of the
  // floating inspector, top controls, and left nav).
  const [isDesktop, setIsDesktop] = useState<boolean>(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const fitPadding = selectedId
    ? isDesktop
      ? { top: 110, bottom: 32, left: 32, right: 472 }
      : { top: 148, bottom: 320, left: 16, right: 16 }
    : undefined;
  const allIds = useMemo(() => features.map((f) => f.stream.id), [features]);

  // Orientation places (real Census centroids, same-origin /atlas/places.json)
  // plus lake/reservoir labels from the atlas lakes file.
  const [places, setPlaces] = useState<Array<{ name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' }>>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/atlas/places.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/atlas/lakes.geojson').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([pj, lakes]) => {
      if (cancelled) return;
      const out: Array<{ name: string; lon: number; lat: number; kind: 'city' | 'town' | 'water' }> = [];
      if (pj && Array.isArray(pj.places)) out.push(...pj.places);
      if (lakes && Array.isArray(lakes.features)) {
        for (const f of lakes.features) {
          const a = f.properties?.labelAnchor;
          if (Array.isArray(a) && typeof a[0] === 'number' && typeof a[1] === 'number') {
            out.push({ name: f.properties.name, lon: a[0], lat: a[1], kind: 'water' });
          }
        }
      }
      setPlaces(out);
    });
    return () => { cancelled = true; };
  }, []);

  const statusLabel = `${live ? 'Live' : 'Cached'}${fetchedAt ? ` · ${ageMinutes(fetchedAt)}` : ''}${!online ? ' · Offline — still works' : ''}`;
  // Overlay stagger: quiet entrances once the fly-in has committed. With
  // reduced motion everything is simply there.
  const enter = () =>
    reducedMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } };
  const stagger = (i: number) => reducedMotion ? 0 : 0.55 + i * 0.12;

  return (
    <div className={`relative h-dvh overflow-hidden bg-[#0A100E]${selectedId && isDesktop ? ' atlas-panel-open' : ''}`}>
      {/* Map fills edge to edge — overlays float above it and never take layout space */}
      <div className="absolute inset-0">
        {/* paper grain */}
        <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />
        <TennesseeMap selectedId={selectedId} onSelect={setRiver} featureColors={featureColors} allIds={allIds} visibleIds={visibleIds} hatchActiveIds={hatchActiveIds} hatchColors={hatchColors} fitPadding={fitPadding} places={places} basemap={effectiveBasemap} intro={introEligible && !reducedMotion} />
      </div>

      {/* Floating control cluster — menu, brand, omnibar, species, overflow */}
      <motion.div
        {...enter()}
        transition={{ ...SPRING.gentle, delay: stagger(0) }}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3 lg:p-4"
      >
        <div className={`pointer-events-auto flex w-full max-w-[680px] items-center gap-2 ${selectedId && isDesktop ? 'lg:mr-[472px] lg:max-w-none lg:justify-start' : ''}`}>
          <motion.button
            type="button" onClick={openMenu} aria-label="Open menu" aria-expanded={menuOpen}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            className="atlas-chip atlas-glass h-11 w-11 shrink-0"
          >
            <MenuIcon size={20} />
          </motion.button>
          <div className="hidden shrink-0 select-none flex-col leading-none sm:flex">
            <Link to="/" aria-label="Trout — home" className="focus-ring rounded">
              <span className="atlas-title text-[19px] font-black tracking-tight text-[#EAF2ED]">Trout</span>
            </Link>
            <span className="eyebrow mt-0.5 text-[9px]">Field Atlas</span>
          </div>
          <RiverSearch streams={searchableStreams} onSelect={setRiver} selectedId={selectedId} placeholder={species === 'all' ? 'Search Tennessee waters…' : 'Search trout waters…'} />
          <div className="hidden md:block">
            <Segmented
              ariaLabel="Species"
              size="sm"
              value={species}
              onChange={setSpecies}
              options={[{ value: 'trout', label: 'Trout' }, { value: 'all', label: 'All fish' }]}
            />
          </div>
          <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold text-[#9FB5AA] lg:flex" title={statusLabel}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: online ? (live ? '#4CC38A' : '#E5A83B') : '#E0684B' }} aria-hidden />
            {online ? (live ? 'Live' : 'Cached') : 'Offline'}
          </span>
          <MapControls
            mode={mode}
            onMode={setMode}
            basemap={basemap}
            basemapOptions={topoReady ? ALL_BASEMAPS : CORE_BASEMAPS}
            onBasemap={setBasemapPersist}
            month={month}
            onMonth={setMonthReplace}
            onLocate={requestLocation}
            status={statusLabel}
            species={species}
            onSpecies={setSpecies}
          />
        </div>
      </motion.div>

      {/* First-visit hint — floats under the cluster, dismisses for good */}
      <AnimatePresence>
        {!hintDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ ...SPRING.soft, delay: reducedMotion ? 0 : 1.1 }}
            className="atlas-glass pointer-events-auto absolute left-3 top-[68px] z-10 flex max-w-[320px] items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs"
          >
            <span className="font-semibold text-[#EAF2ED]">Tap a river. Color shows current conditions.</span>
            <button onClick={() => { setHintDismissed(true); localStorage.setItem('trout:hintDismissed','1'); }} className="atlas-chip atlas-chip--primary px-3 py-1 text-xs">Got it</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend — corner chip by default, expands on demand; never layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.gentle, delay: stagger(1) }}
        className={`absolute left-3 z-10 ${selectedFeature && !isDesktop ? 'bottom-[calc(32vh+24px)]' : 'bottom-3'}`}
      >
        <MapLegend mode={mode} species={species} />
      </motion.div>

      {/* Desktop inspector — floating card, spring in/out, map re-fits around it.
          Presence keys off selectedId so a selection NEVER no-ops: while the
          feature loads (or if the id is unknown) the card shows why. */}
      <AnimatePresence>
        {selectedId && isDesktop && (
          <motion.div
            key="desktop-inspector"
            data-testid="desktop-panel"
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={SPRING.soft}
            className="atlas-panel-open pointer-events-auto absolute bottom-3 right-3 top-[88px] hidden w-[440px] lg:block"
          >
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D1411]/95 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
              {selectedFeature ? (
                <RiverDrawer feature={selectedFeature} tab={validatedTab} onTab={setTab} onClose={() => setRiver(null)} modeMonth={month} live={live} fetchedAt={fetchedAt} layout="panel" />
              ) : (
                <InspectorPlaceholder
                  loading={isLoading}
                  onBrowse={() => setRiver(null)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile inspector — spring bottom sheet */}
      <div className="lg:hidden">
        <AnimatePresence>
          {selectedId && (
            <RiverDrawer key="mobile-inspector" feature={selectedFeature} tab={validatedTab} onTab={setTab} onClose={() => setRiver(null)} modeMonth={month} live={live} fetchedAt={fetchedAt} loading={isLoading} />
          )}
        </AnimatePresence>
      </div>
      {userPos && <span className="sr-only">Location used locally only</span>}
    </div>
  );
}

/**
 * InspectorPlaceholder — the in-between states for the river card: a paper
 * skeleton while snapshots load, and an honest "not mapped" note when the id
 * resolves to nothing. Never a spinner.
 */
function InspectorPlaceholder({ loading, onBrowse }: { loading: boolean; onBrowse: () => void }) {
  return (
    <div className="flex h-full flex-col p-5" role="status" aria-label="Loading river details">
      {loading ? (
        <>
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-3 h-8 w-3/4" />
          <div className="skeleton mt-2 h-4 w-40" />
          <div className="skeleton mt-6 h-20 w-full" />
          <div className="skeleton mt-3 h-14 w-full" />
          <div className="skeleton mt-3 h-14 w-full" />
        </>
      ) : (
        <div className="flex h-full flex-col items-start justify-center gap-3">
          <p className="eyebrow">Off the atlas</p>
          <p className="text-sm text-[#9FB5AA]">
            That water isn&rsquo;t in the mapped set. Browse the full stream list instead — every water is reachable there.
          </p>
          <a href="/browse" onClick={onBrowse} className="atlas-chip atlas-chip--primary min-h-[44px] px-4 text-sm">Browse streams</a>
        </div>
      )}
    </div>
  );
}
