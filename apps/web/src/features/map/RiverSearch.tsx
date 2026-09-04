import { useMemo, useState, useRef, useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSnapshotQuery } from '../../lib/useSnapshotQuery';
import { snapshotUrls } from '../../lib/endpoints';
import { StreamSchema } from '@trout/contracts';
import type { Stream } from '@trout/contracts';
import { regionName } from '../../data/regions';
import { SPRING } from '../../components/motion/atlas-motion';

function normalize(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function searchHay(stream: Stream): string[] {
  const parts: string[] = [stream.name, stream.id, stream.regionId, regionName(stream.regionId)];
  const m = stream.name.match(/\(([^)]+)\)/);
  if (m?.[1]) parts.push(m[1]);
  stream.name.split(/[/—–-]/).forEach((p) => { if (p.trim().length > 3) parts.push(p.trim()); });
  return parts.map(normalize).filter(Boolean);
}

type Props =
  | { streams?: Stream[]; onSelect: (id: string) => void; selectedId?: string | null; placeholder?: string }
  | { streams: { id: string; name: string; regionId: string }[]; onSelect: (id: string) => void };

export function RiverSearch(props: any) {
  const { onSelect, streams: streamsProp, selectedId, placeholder } = props as { streams?: any[]; onSelect: (id: string) => void; selectedId?: string | null; placeholder?: string };
  const streamsQuery = useSnapshotQuery(snapshotUrls.streams, StreamSchema.array(), 60 * 24, !streamsProp);
  const streams: Stream[] = (streamsProp as Stream[]) ?? (streamsQuery.data?.data as Stream[] ?? []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId(); const inputId = useId();

  const filtered = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return streams.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 12);
    const scored = streams.map((s) => {
      const hay = searchHay(s as Stream);
      let score = -1;
      for (const h of hay) {
        if (h === nq) score = Math.max(score, 100);
        else if (h.startsWith(nq)) score = Math.max(score, 80);
        else if (h.includes(nq)) score = Math.max(score, 50);
        const tokens = nq.split(' ').filter(Boolean);
        if (tokens.every((t) => t.length < 2 || h.includes(t))) score = Math.max(score, 30);
      }
      return { s, score };
    }).filter((x) => x.score >= 30).sort((a,b)=> b.score - a.score || a.s.name.localeCompare(b.s.name)).map((x)=> x.s);
    return scored.slice(0, 12);
  }, [streams, q]);

  useEffect(() => setActiveIndex(0), [q]);
  // Omnibar: ⌘K / Ctrl+K (and "/" when nothing is focused) jumps to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!(e.target as Element).closest('[data-river-search]')) setOpen(false); };
    document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const activeId = (filtered[activeIndex] as any)?.id;

  return (
    <div data-river-search className="relative w-full max-w-[360px]">
      <label htmlFor={inputId} className="sr-only">Search rivers</label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B8177' }}>⌕</span>
        <input
          id={inputId} ref={inputRef} type="search" role="combobox"
          aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={activeId ? `river-opt-${activeId}` : undefined}
          placeholder={placeholder ?? 'Search 92 Tennessee waters…'}
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) setOpen(true);
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') { const t = filtered[activeIndex] as any; if (t) { onSelect(t.id); setOpen(false); inputRef.current?.blur(); } }
            else if (e.key === 'Escape') setOpen(false);
          }}
          className="focus-ring atlas-glass h-11 w-full rounded-full pl-9 pr-14 text-sm font-medium text-[#EAF2ED] outline-none placeholder:text-[#6B8177]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-bold text-[#9FB5AA] sm:inline" style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)' }} aria-hidden>⌘K</kbd>
      </div>
      <AnimatePresence>
      {open && (
        <motion.div
          id={listId} role="listbox" aria-label="River results"
          initial={{ opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={SPRING.snappy}
          className="atlas-glass absolute left-0 right-0 z-20 mt-2 max-h-[52vh] overflow-auto rounded-2xl py-1 shadow-[0_8px_32px_rgba(51,45,32,0.16)]"
        >
          {filtered.length === 0 ? <p className="px-4 py-6 text-sm" style={{ color: '#9FB5AA' }}>No streams match “{q}”.</p> : (
            <ul>
              {filtered.map((s: any, idx: number) => {
                const isActive = idx === activeIndex; const isSelected = s.id === selectedId;
                const dup = streams.filter((x: any) => normalize((x.name as string).split('(')[0]!) === normalize((s.name as string).split('(')[0]!)).length > 1;
                return (
                  <li key={s.id}>
                    <button id={`river-opt-${s.id}`} role="option" aria-selected={isActive} onMouseEnter={() => setActiveIndex(idx)} onMouseDown={() => { onSelect(s.id); setOpen(false); }} className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5 focus:bg-white/5 focus:outline-none" style={{ background: isActive ? 'rgba(255,255,255,0.06)' : undefined, borderLeft: isSelected ? '3px solid #E8B04B' : '3px solid transparent' }}>
                      <span className="text-sm font-bold text-[#EAF2ED]">{s.name}</span>
                      <span className="text-xs text-[#9FB5AA]">{dup ? `${regionName(s.regionId)} · ` : ''}{s.regionId ? regionName(s.regionId).split(' — ')[0] : ''}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t px-3 py-2 text-xs" style={{ borderColor: 'rgba(211,198,171,0.6)', color: '#908a7a' }}>{streams.length} streams · offline · alternate names in parentheses</div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
