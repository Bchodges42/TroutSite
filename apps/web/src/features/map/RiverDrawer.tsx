import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { regionName } from '../../data/regions';
import { ageMinutes, clockTime } from '../../lib/time';
import { formatFlow, formatTemp } from '../../lib/units';
import { flowTrend, TREND_LABEL } from '../../lib/conditions';
import { useSettingsContext } from '../../lib/settings';
import { atlas } from './mapTokens';
import { interpretationFor, plainStatus } from './riverMapSelectors';
import type { RiverMapFeature } from './riverMapSelectors';
import { LOGBOOK_NOTE, listEntries } from '../../lib/logbook';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { SPRING } from '../../components/motion/atlas-motion';

const TABS = ['Water','Hatch','Stocking','Reports','Your Log'] as const;
type Tab = typeof TABS[number];

export function RiverDrawer({ feature, tab, onTab, onClose, modeMonth, live, fetchedAt, layout, loading }: { feature: RiverMapFeature | null; tab: Tab; onTab: (t: Tab) => void; onClose: () => void; modeMonth: number; live: boolean; fetchedAt: number | null; layout?: 'sheet' | 'panel'; loading?: boolean }) {
  const [sheet, setSheet] = useState<'peek'|'medium'|'full'>('peek');
  const dragRef = useRef<HTMLDivElement>(null);

  // drag to expand
  useEffect(() => {
    const el = dragRef.current?.parentElement;
    if (!el) return;
    let startY = 0, startSheet: typeof sheet = 'peek';
    const onDown = (e: TouchEvent | MouseEvent) => {
      const y = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : (e as MouseEvent).clientY;
      startY = y; startSheet = sheet;
      const onMove = (ev: TouchEvent | MouseEvent) => {
        const cur = 'touches' in ev ? ((ev as TouchEvent).touches[0]?.clientY ?? 0) : (ev as MouseEvent).clientY;
        const dy = startY - cur;
        if (dy > 80 && startSheet === 'peek') setSheet('medium');
        if (dy > 180) setSheet('full');
        if (dy < -80 && startSheet !== 'peek') setSheet(startSheet === 'full' ? 'medium' : 'peek');
      };
      const onUp = () => { window.removeEventListener('mousemove', onMove as any); window.removeEventListener('touchmove', onMove as any); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchend', onUp); };
      window.addEventListener('mousemove', onMove as any); window.addEventListener('touchmove', onMove as any, { passive: true } as any);
      window.addEventListener('mouseup', onUp); window.addEventListener('touchend', onUp);
    };
    el.addEventListener('touchstart', onDown as any, { passive: true } as any);
    el.addEventListener('mousedown', onDown as any);
    return () => { el.removeEventListener('touchstart', onDown as any); el.removeEventListener('mousedown', onDown as any); };
  }, [sheet]);

  // Mobile: feature still loading → a small skeleton peek; unknown id → nothing.
  if (!feature && layout !== 'panel') {
    if (!loading) return null;
    return (
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={SPRING.soft}
        className="absolute inset-x-0 bottom-0 z-10 rounded-t-[20px] border-t border-white/10 bg-[#0D1411]/95 p-4 pb-8 backdrop-blur-md"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        role="status" aria-label="Loading river details"
      >
        <div className="skeleton h-1.5 w-10 rounded-full" />
        <div className="skeleton mt-4 h-6 w-2/3" />
        <div className="skeleton mt-2 h-4 w-1/3" />
      </motion.div>
    );
  }
  if (!feature) return null;

  const snap = feature.snapshot;
  const isPanel = layout === 'panel';
  const isWarm = feature.species === 'warmwater';
  const accent = isWarm ? atlas.warmwater : feature.color;
  const snapHeight = sheet === 'peek' ? '32vh' : sheet === 'medium' ? '58vh' : '86vh';
  const freshnessLabel = fetchedAt ? `${live ? 'Updated' : 'Cached'} ${ageMinutes(fetchedAt)} · ${clockTime(fetchedAt)}` : 'No recent reading';

  const header = (size: 'panel' | 'sheet') => (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{regionName(feature.stream.regionId)}</p>
          <h2 className={`atlas-title mt-1 font-black leading-[1.05] tracking-tight text-[#EAF2ED] ${size === 'panel' ? 'text-[26px]' : 'text-[23px]'}`}>{feature.stream.name}</h2>
          {isWarm ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: 'rgba(181,133,79,0.16)', color: atlas.warmwater }}>
              Warmwater · smallmouth &amp; panfish
            </p>
          ) : (
            <>
              <p className="mt-1.5 flex items-baseline gap-2">
                <span className="atlas-title text-[34px] font-black leading-none" style={{ color: accent }}>{feature.score ?? '—'}</span>
                <span className="text-sm font-bold" style={{ color: accent }}>{feature.status === 'no-data' ? 'No data' : plainStatus(feature.status, feature.score).split('· ')[1] ?? ''}</span>
              </p>
              <p className="text-sm font-semibold text-[#9FB5AA]">{interpretationFor(snap, feature.stream)}</p>
            </>
          )}
          {!isWarm && <p className="text-xs text-[#6B8177]">{freshnessLabel}{snap ? ` · trend ${TREND_LABEL[flowTrend(snap.readings)] || 'n/a'}` : ''}</p>}
          {feature.hatchChart && !isWarm && <p className="text-xs text-[#6B8177]">{feature.hatchChart.entries[0]?.taxonId ?? ''} toward dusk</p>}
          {feature.logCount > 0 && <p className="text-xs text-[#6B8177]">{feature.logCount} private entries · Only on this device</p>}
        </div>
        <button onClick={onClose} aria-label={size === 'panel' ? 'Close river details' : 'Close'} className="atlas-chip atlas-glass h-11 w-11 shrink-0 text-lg">×</button>
      </div>
      {!isWarm && (
        <div className="mt-3 flex gap-1 overflow-x-auto border-b border-[#223329]" role="tablist" aria-label="River details">
          {TABS.map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => { onTab(t); if (size === 'sheet') setSheet('medium'); }} className={`-mb-px shrink-0 whitespace-nowrap px-2.5 py-2 text-sm font-bold ${tab === t ? 'text-[#EAF2ED]' : 'text-[#6B8177]'}`}>
              <span className="relative inline-block">
                {t}
                {tab === t && <motion.span layoutId={`tab-underline-${size}`} transition={SPRING.snappy} className="absolute -bottom-[10px] left-0 right-0 h-0.5 rounded-full bg-[#E8B04B]" aria-hidden />}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (isPanel) {
    // Desktop inspector: content starts at the top, ONE scroll region (the
    // body). Heading + tabs are sticky. No sheet positioning, no blank space.
    return (
      <div className="flex h-full min-h-0 flex-col bg-transparent" role="dialog" aria-label={`${feature.stream.name} details`} aria-modal="false">
        <div className="shrink-0 px-5 pt-4">
          {header('panel')}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {isWarm ? <WarmTab feature={feature} /> : (
            <>
              {tab === 'Water' && <WaterTab feature={feature} />}
              {tab === 'Hatch' && <HatchTab feature={feature} month={modeMonth} />}
              {tab === 'Stocking' && <StockingTab feature={feature} />}
              {tab === 'Reports' && <ReportsTab feature={feature} />}
              {tab === 'Your Log' && <LogTab feature={feature} />}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0, height: snapHeight }}
      exit={{ y: '100%' }}
      transition={SPRING.soft}
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-[20px] border-t border-white/10 bg-[#0D1411]/95 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="dialog" aria-label={`${feature.stream.name} details`} aria-modal="false"
    >
      <button ref={dragRef as any} type="button" aria-label={sheet === 'full' ? 'Collapse river details' : 'Expand river details'} aria-expanded={sheet !== 'peek'} onClick={() => setSheet(s => s === 'peek' ? 'medium' : s === 'medium' ? 'full' : 'peek')} className="flex min-h-[32px] flex-col items-center justify-center px-8 pt-2 pb-1">
        <span className="h-1.5 w-10 rounded-full bg-[#31473B]" aria-hidden />
      </button>
      <div className="px-4 pb-2">
        {header('sheet')}
      </div>
      <div className="flex-1 overflow-auto px-4 pb-6">
        {isWarm ? <WarmTab feature={feature} /> : (
          <>
            {tab === 'Water' && <WaterTab feature={feature} />}
            {tab === 'Hatch' && <HatchTab feature={feature} month={modeMonth} />}
            {tab === 'Stocking' && <StockingTab feature={feature} />}
            {tab === 'Reports' && <ReportsTab feature={feature} />}
            {tab === 'Your Log' && <LogTab feature={feature} />}
          </>
        )}
      </div>
    </motion.div>
  );
}

/** Warmwater rivers — honest, useful, and clearly not a trout score. */
function WarmTab({ feature }: { feature: RiverMapFeature }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3 text-sm" style={{ borderColor: '#223329', background: 'rgba(181,133,79,0.08)' }}>
        <p className="font-bold" style={{ color: atlas.warmwater }}>Warmwater fishery</p>
        <p className="mt-1 text-[#9FB5AA]">This river holds smallmouth, spotted bass, and panfish rather than trout, so it isn&rsquo;t scored for trout fishability. Toggle <span className="font-bold text-[#EAF2ED]">All fish</span> on the map to keep it visible.</p>
      </div>
      {feature.stream.notes && <div className="rounded-xl border p-3 text-sm" style={{ borderColor: '#223329', background: '#131F19' }}><p className="text-[#EAF2ED]">{feature.stream.notes}</p></div>}
      <div className="flex flex-wrap gap-2">
        <a href={`/conditions/${feature.stream.id}`} className="atlas-chip atlas-glass min-h-[40px] px-3 text-xs">Flow &amp; gauges →</a>
        <a href="/browse" className="atlas-chip atlas-glass min-h-[40px] px-3 text-xs">All streams</a>
      </div>
    </div>
  );
}

function WaterTab({ feature }: { feature: RiverMapFeature }) {
  const snap = feature.snapshot;
  const { settings } = useSettingsContext();
  if (!snap) return <p className="text-sm text-[#9FB5AA]">No recent reading. {feature.stream.notes ?? ''}</p>;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3" style={{ borderColor: '#223329', background: '#131F19' }}>
        <p className="text-sm font-bold" style={{ color: feature.color }}>{plainStatus(feature.status, feature.score)}</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-[#EAF2ED]">{snap.score.reasons.map(r => <li key={r}>{r}</li>)}</ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: '#223329', background: '#131F19' }}>Flow {snap.readings.find(r=>r.cfs!=null)?.cfs != null ? formatFlow(snap.readings.find(r=>r.cfs!=null)!.cfs!) : 'n/a'}</span>
        <span className="rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: '#223329', background: '#131F19' }}>Temp {snap.readings.find(r=>r.tempC!=null)?.tempC != null ? formatTemp(snap.readings.find(r=>r.tempC!=null)!.tempC!, settings.tempUnit) : 'n/a'}</span>
      </div>
      <details className="rounded-xl border p-3 text-sm" style={{ borderColor: '#223329', background: '#131F19' }}><summary className="cursor-pointer font-bold">Gauge readings</summary>
        <table className="mt-2 w-full text-left text-sm"><thead><tr className="text-xs text-[#6B8177]"><th>Gauge</th><th>Flow</th><th>Temp</th><th>When</th></tr></thead><tbody>{[...snap.readings].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,8).map((r,i)=><tr key={i} className="border-t" style={{ borderColor: '#223329' }}><td className="py-1 font-mono text-xs">{r.gaugeId}</td><td>{r.cfs!=null?formatFlow(r.cfs):'—'}</td><td>{r.tempC!=null?formatTemp(r.tempC, settings.tempUnit):'—'}</td><td className="text-xs text-[#6B8177]">{ageMinutes(Date.parse(r.timestamp))}</td></tr>)}</tbody></table>
      </details>
      <Link to={`/conditions/${feature.stream.id}`} className="inline-flex text-sm font-bold underline decoration-[#E8B04B] underline-offset-4">Open full water page →</Link>
    </div>
  );
}
function HatchTab({ feature, month }: { feature: RiverMapFeature; month: number }) {
  const chart = feature.hatchChart;
  if (!chart || !chart.entries.length) return <p className="text-sm text-[#9FB5AA]">No hatch chart for this region/month.</p>;
  return (
    <div className="space-y-2">
      {chart.entries.slice(0,5).map((e:any) => (
        <div key={e.taxonId} className="rounded-xl border p-3" style={{ borderColor: '#223329', background: '#131F19' }}>
          <p className="text-sm font-bold text-[#EAF2ED]">{e.taxonId} · {e.stage} · {e.timeOfDay} · size {e.size_mm ?? '—'}mm</p>
          <p className="text-xs text-[#9FB5AA]">abundance {e.abundance}/3 {e.notes ? `· ${e.notes}` : ''}</p>
        </div>
      ))}
      <Link to={`/charts/${feature.stream.regionId}/${month}`} className="inline-flex text-sm font-bold underline decoration-[#E8B04B] underline-offset-4">Hatch chart →</Link>
      <Link to={`/hatch-key`} className="ml-3 inline-flex text-sm font-bold underline decoration-[#E8B04B] underline-offset-4">Match this water →</Link>
    </div>
  );
}
function StockingTab({ feature }: { feature: RiverMapFeature }) {
  if (!feature.stocking) return <p className="text-sm text-[#9FB5AA]">No recent stocking in the cached schedule.</p>;
  const s: any = feature.stocking;
  return <div className="rounded-xl border p-3 text-sm" style={{ borderColor: '#223329', background: '#131F19' }}><p className="font-bold">{s.species} · {s.date}</p><p className="text-[#9FB5AA]">{s.streamName} · {s.count ?? ''} {s.hatchery ?? ''}</p><Link to="/stocking" className="font-bold underline decoration-[#E8B04B] underline-offset-4">All stocking →</Link></div>;
}
function ReportsTab({ feature }: { feature: RiverMapFeature }) {
  if (!feature.report) return <p className="text-sm text-[#9FB5AA]">No shop reports for this water.</p>;
  const r: any = feature.report;
  return <div className="rounded-xl border p-3 text-sm" style={{ borderColor: '#223329', background: '#131F19' }}><p className="font-bold">{r.shopName ?? r.shopId} · {r.date ?? ''}</p><p className="mt-1 line-clamp-3 text-[#EAF2ED]">{r.summary ?? r.body ?? ''}</p><Link to="/shops" className="font-bold underline decoration-[#E8B04B] underline-offset-4">All reports →</Link></div>;
}
function LogTab({ feature }: { feature: RiverMapFeature }) {
  const entries = useLiveQuery(() => db.logbook.where('streamId').equals(feature.stream.id).toArray().then(a => a.sort((x,y)=> y.date.localeCompare(x.date)).slice(0,5)), [feature.stream.id]) ?? [];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#6B8177]">{LOGBOOK_NOTE} · Only on this device</p>
      <Link to="/logbook" className="atlas-chip atlas-chip--primary min-h-[40px] px-4 text-sm">Add entry for {feature.stream.name}</Link>
      {entries.length === 0 ? <p className="text-sm text-[#9FB5AA]">No private entries yet.</p> : entries.map((e:any)=><div key={e.id} className="rounded-xl border p-3 text-sm" style={{ borderColor: '#223329', background: '#131F19' }}><p className="font-bold">{e.date} · {e.streamName}</p><p className="text-[#EAF2ED]">{e.notes}</p>{e.flies?.length ? <p className="text-xs text-[#9FB5AA]">Flies: {e.flies.join(', ')}</p> : null}</div>)}
      <p className="text-xs text-[#6B8177]">{feature.logCount} total private entries on this water.</p>
    </div>
  );
}
