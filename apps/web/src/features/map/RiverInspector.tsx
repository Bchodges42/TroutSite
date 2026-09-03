import type { DrawerTab } from './useMapState';

export function RiverInspector({ streamId, tab, onTab, month }: { streamId: string | null; tab: DrawerTab; onTab: (t: DrawerTab) => void; month: number }) {
  if (!streamId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="atlas-title text-xl font-black">Tennessee Trout Atlas</p>
        <p className="mt-2 max-w-sm text-sm" style={{ color: 'var(--trout-ink-muted)' }}>
          Search a river or click a dot on the map. Your selection stays in the URL so you can share it.
        </p>
        <p className="mt-4 text-xs" style={{ color: 'var(--trout-ink-faint)' }}>Tip: use Month to preview hatches across the season.</p>
      </div>
    );
  }
  // Delegate to a shared content renderer — for now inline placeholder that links to full pages.
  // Full tab content lives in RiverDrawer's tabs; desktop reuses same data via snapshot queries.
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 gap-1 border-b px-3 py-2 overflow-x-auto" style={{ borderColor: 'var(--trout-rule)', background: 'var(--trout-paper-2)' }}>
        {(['water', 'hatch', 'stocking', 'reports', 'log'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => onTab(t)}
            className="focus-ring min-h-[44px] shrink-0 rounded-full border px-3.5 text-sm font-bold capitalize"
            style={{
              background: tab === t ? 'var(--trout-moss)' : 'var(--trout-paper)',
              color: tab === t ? '#fff' : 'var(--trout-ink)',
              borderColor: tab === t ? 'var(--trout-moss)' : 'var(--trout-rule)',
            }}
          >
            {t === 'log' ? 'Your Log' : t}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="text-sm" style={{ color: 'var(--trout-ink-muted)' }}>
          {streamId} · {tab} · month {month}
        </p>
        <p className="mt-2 text-xs" style={{ color: 'var(--trout-ink-faint)' }}>
          Offline atlas — full water/hatch/stocking details available in the tab views. Open the river page for complete data.
        </p>
        <a href={`/conditions/${streamId}`} className="mt-3 inline-flex text-sm font-bold underline">Open water page →</a>
      </div>
    </div>
  );
}
