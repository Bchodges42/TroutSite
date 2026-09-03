import { useEffect, useRef, useState } from 'react';
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

const TABS = ['Water','Hatch','Stocking','Reports','Your Log'] as const;
type Tab = typeof TABS[number];

export function RiverDrawer({ feature, tab, onTab, onClose, modeMonth, live, fetchedAt }: { feature: RiverMapFeature | null; tab: Tab; onTab: (t: Tab) => void; onClose: () => void; modeMonth: number; live: boolean; fetchedAt: number | null }) {
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

  if (!feature) return null;
  const snap = feature.snapshot;
  const height = sheet === 'peek' ? 'min-h-[148px] max-h-[32vh]' : sheet === 'medium' ? 'max-h-[58vh]' : 'max-h-[86vh]';
  const freshnessLabel = fetchedAt ? `${live ? 'Updated' : 'Cached'} ${ageMinutes(fetchedAt)} · ${clockTime(fetchedAt)}` : 'No recent reading';

  return (
    <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-[20px] border-t bg-[#F8F2E5] shadow-[0_-8px_32px_rgba(51,45,32,0.16)] ${height} overflow-hidden`} style={{ borderColor: atlas.hairline, paddingBottom: 'env(safe-area-inset-bottom)' }} role="dialog" aria-label={`${feature.stream.name} details`} aria-modal="false">
      <button ref={dragRef as any} type="button" aria-label={sheet === 'full' ? 'Collapse river details' : 'Expand river details'} aria-expanded={sheet !== 'peek'} onClick={() => setSheet(s => s === 'peek' ? 'medium' : s === 'medium' ? 'full' : 'peek')} className="flex min-h-[32px] flex-col items-center justify-center px-8 pt-2 pb-1">
        <span className="h-1.5 w-10 rounded-full bg-[#D3C6AB]" aria-hidden />
      </button>
      {/* Peek header */}
      <div className="px-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-['Fraunces'] text-[22px] font-extrabold leading-none tracking-tight text-[#24352D]">{feature.stream.name}</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#566158]">{regionName(feature.stream.regionId)}</p>
            <p className="mt-1 text-sm font-bold" style={{ color: feature.color }}>{plainStatus(feature.status, feature.score)} · {interpretationFor(snap, feature.stream)}</p>
            <p className="text-xs text-[#566158]">{freshnessLabel}{snap ? ` · trend ${TREND_LABEL[flowTrend(snap.readings)] || 'n/a'}` : ''}</p>
            {feature.hatchChart && <p className="text-xs text-[#566158]">{feature.hatchChart.entries[0]?.taxonId ?? ''} toward dusk</p>}
            {feature.logCount > 0 && <p className="text-xs text-[#566158]">{feature.logCount} private entries on this river · Only on this device</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 shrink-0 rounded-full border bg-white text-lg" style={{ borderColor: atlas.hairline }}>×</button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto border-b" style={{ borderColor: atlas.hairline }} role="tablist" aria-label="River details">
          {TABS.map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => { onTab(t); setSheet('medium'); }} className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-2 py-2 text-sm font-bold ${tab === t ? 'border-[#24352D] text-[#24352D]' : 'border-transparent text-[#566158]'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-4 pb-6">
        {tab === 'Water' && <WaterTab feature={feature} />}
        {tab === 'Hatch' && <HatchTab feature={feature} month={modeMonth} />}
        {tab === 'Stocking' && <StockingTab feature={feature} />}
        {tab === 'Reports' && <ReportsTab feature={feature} />}
        {tab === 'Your Log' && <LogTab feature={feature} />}
      </div>
    </div>
  );
}

function WaterTab({ feature }: { feature: RiverMapFeature }) {
  const snap = feature.snapshot;
  const { settings } = useSettingsContext();
  if (!snap) return <p className="text-sm text-[#566158]">No recent reading. {feature.stream.notes ?? ''}</p>;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-white p-3" style={{ borderColor: '#D3C6AB' }}>
        <p className="text-sm font-bold" style={{ color: feature.color }}>{plainStatus(feature.status, feature.score)}</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-[#24352D]">{snap.score.reasons.map(r => <li key={r}>{r}</li>)}</ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border bg-white px-3 py-1 text-sm font-semibold" style={{ borderColor: '#D3C6AB' }}>Flow {snap.readings.find(r=>r.cfs!=null)?.cfs != null ? formatFlow(snap.readings.find(r=>r.cfs!=null)!.cfs!) : 'n/a'}</span>
        <span className="rounded-full border bg-white px-3 py-1 text-sm font-semibold" style={{ borderColor: '#D3C6AB' }}>Temp {snap.readings.find(r=>r.tempC!=null)?.tempC != null ? formatTemp(snap.readings.find(r=>r.tempC!=null)!.tempC!, settings.tempUnit) : 'n/a'}</span>
      </div>
      <details className="rounded-xl border bg-white p-3 text-sm" style={{ borderColor: '#D3C6AB' }}><summary className="cursor-pointer font-bold">Gauge readings</summary>
        <table className="mt-2 w-full text-left text-sm"><thead><tr className="text-xs text-[#566158]"><th>Gauge</th><th>Flow</th><th>Temp</th><th>When</th></tr></thead><tbody>{[...snap.readings].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,8).map((r,i)=><tr key={i} className="border-t" style={{ borderColor: '#F2E9D5' }}><td className="py-1 font-mono text-xs">{r.gaugeId}</td><td>{r.cfs!=null?formatFlow(r.cfs):'—'}</td><td>{r.tempC!=null?formatTemp(r.tempC, settings.tempUnit):'—'}</td><td className="text-xs text-[#566158]">{ageMinutes(Date.parse(r.timestamp))}</td></tr>)}</tbody></table>
      </details>
      <Link to={`/conditions/${feature.stream.id}`} className="inline-flex text-sm font-bold underline">Open full water page →</Link>
    </div>
  );
}
function HatchTab({ feature, month }: { feature: RiverMapFeature; month: number }) {
  const chart = feature.hatchChart;
  if (!chart || !chart.entries.length) return <p className="text-sm text-[#566158]">No hatch chart for this region/month.</p>;
  return (
    <div className="space-y-2">
      {chart.entries.slice(0,5).map((e:any) => (
        <div key={e.taxonId} className="rounded-xl border bg-white p-3" style={{ borderColor: '#D3C6AB' }}>
          <p className="text-sm font-bold text-[#24352D]">{e.taxonId} · {e.stage} · {e.timeOfDay} · size {e.size_mm ?? '—'}mm</p>
          <p className="text-xs text-[#566158]">abundance {e.abundance}/3 {e.notes ? `· ${e.notes}` : ''}</p>
        </div>
      ))}
      <Link to={`/charts/${feature.stream.regionId}/${month}`} className="inline-flex text-sm font-bold underline">Hatch chart →</Link>
      <Link to={`/hatch-key`} className="ml-3 inline-flex text-sm font-bold underline">Match this water →</Link>
    </div>
  );
}
function StockingTab({ feature }: { feature: RiverMapFeature }) {
  if (!feature.stocking) return <p className="text-sm text-[#566158]">No recent stocking in the cached schedule.</p>;
  const s: any = feature.stocking;
  return <div className="rounded-xl border bg-white p-3 text-sm" style={{ borderColor: '#D3C6AB' }}><p className="font-bold">{s.species} · {s.date}</p><p className="text-[#566158]">{s.streamName} · {s.count ?? ''} {s.hatchery ?? ''}</p><Link to="/stocking" className="font-bold underline">All stocking →</Link></div>;
}
function ReportsTab({ feature }: { feature: RiverMapFeature }) {
  if (!feature.report) return <p className="text-sm text-[#566158]">No shop reports for this water.</p>;
  const r: any = feature.report;
  return <div className="rounded-xl border bg-white p-3 text-sm" style={{ borderColor: '#D3C6AB' }}><p className="font-bold">{r.shopName ?? r.shopId} · {r.date ?? ''}</p><p className="mt-1 line-clamp-3 text-[#24352D]">{r.summary ?? r.body ?? ''}</p><Link to="/shops" className="font-bold underline">All reports →</Link></div>;
}
function LogTab({ feature }: { feature: RiverMapFeature }) {
  const entries = useLiveQuery(() => db.logbook.where('streamId').equals(feature.stream.id).toArray().then(a => a.sort((x,y)=> y.date.localeCompare(x.date)).slice(0,5)), [feature.stream.id]) ?? [];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#566158]">{LOGBOOK_NOTE} · Only on this device</p>
      <Link to="/logbook" className="inline-flex rounded-full bg-[#24352D] px-4 py-2 text-sm font-bold text-white">Add entry for {feature.stream.name}</Link>
      {entries.length === 0 ? <p className="text-sm text-[#566158]">No private entries yet.</p> : entries.map((e:any)=><div key={e.id} className="rounded-xl border bg-white p-3 text-sm" style={{ borderColor: '#D3C6AB' }}><p className="font-bold">{e.date} · {e.streamName}</p><p className="text-[#24352D]">{e.notes}</p>{e.flies?.length ? <p className="text-xs text-[#566158]">Flies: {e.flies.join(', ')}</p> : null}</div>)}
      <p className="text-xs text-[#566158]">{feature.logCount} total private entries on this water.</p>
    </div>
  );
}
