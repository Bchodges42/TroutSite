import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { cx } from '@trout/ui';
import { useOnline } from '../../hooks/useOnline';
import { useSettingsContext } from '../../lib/settings';
import {
  BookIcon, BugIcon, CloseIcon, FishIcon, GearIcon, LocationIcon,
  MenuIcon, ShieldIcon, ShopIcon, WavesIcon,
} from '../icons';

function MapIcon(props: { size?: number }) {
  const s = props.size ?? 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M3 6.5 9 3l6 3.5L21 3v13.5L15 20l-6-3.5L3 20V6.5Z" /><path d="M9 3v13.5M15 6.5V20" />
    </svg>
  );
}

// Mobile: 4 items — Map / Match / Log / More (More opens drawer)
const MOBILE_TABS = [
  { to: '/', label: 'Map', Icon: MapIcon },
  { to: '/hatch-key', label: 'Match', Icon: BugIcon },
  { to: '/logbook', label: 'Log', Icon: BookIcon },
  { to: '/settings', label: 'More', Icon: MenuIcon, isMore: true },
] as const;

const DESKTOP_NAV = [
  { to: '/', label: 'Map', Icon: MapIcon },
  { to: '/hatch-key', label: 'Match the Hatch', Icon: BugIcon },
  { to: '/logbook', label: 'Logbook', Icon: BookIcon },
  { to: '/settings', label: 'More', Icon: GearIcon },
] as const;

// Full list for the drawer / hamburger
const MORE_LINKS = [
  { to: '/charts', label: 'Hatch Charts', Icon: FishIcon },
  { to: '/conditions', label: 'Conditions', Icon: WavesIcon },
  { to: '/stocking', label: 'Stocking', Icon: FishIcon },
  { to: '/shops', label: 'Shops & Reports', Icon: ShopIcon },
  { to: '/browse', label: 'Browse as list', Icon: LocationIcon },
  { to: '/settings', label: 'Settings', Icon: GearIcon },
  { to: '/about', label: 'About & Privacy', Icon: ShieldIcon },
];

export function AppShell() {
  const online = useOnline();
  const location = useLocation();
  // The map is the product: it gets the full viewport width (no centered
  // max-width margins). Every other route keeps the readable column.
  const isMapRoute = location.pathname === '/';
  const { settings } = useSettingsContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings.reduceMotion]);

  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    const trigger = menuButtonRef.current;
    drawer?.querySelector<HTMLElement>('nav a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); return; }
      if (e.key !== 'Tab' || !drawer) return;
      const items = [...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      if (items.length === 0) return;
      const first = items[0]!; const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); trigger?.focus(); };
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">Skip to content</a>

      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--trout-paper)', borderColor: 'var(--trout-rule)' }}>
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-2 px-4">
          <button
            type="button"
            ref={menuButtonRef}
            className="focus-ring -ml-2 flex h-12 w-12 items-center justify-center rounded-lg lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link to="/" className="focus-ring flex items-center gap-2 rounded-lg py-1 text-left" aria-label="Trout — home">
            <FishIcon size={26} />
            <span className="atlas-title text-lg font-black tracking-tight">Trout</span>
            <span className="hidden text-xs font-semibold sm:inline" style={{ color: 'var(--trout-ink-muted)' }}>Field Atlas</span>
          </Link>
          <span className="ml-auto flex items-center gap-2">
            {!online && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--trout-amber-soft)', color: 'var(--trout-amber)' }}>
                Offline — still works
              </span>
            )}
          </span>
        </div>
      </header>

      <div className={isMapRoute ? 'flex w-full flex-1' : 'mx-auto flex w-full max-w-[1600px] flex-1'}>
        <nav aria-label="Primary" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r p-3 lg:flex" style={{ borderColor: 'var(--trout-rule)' }}>
          {DESKTOP_NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-link focus-ring">
              <Icon size={20} />{label}
            </NavLink>
          ))}
          <div className="mt-2 border-t pt-3" style={{ borderColor: 'var(--trout-rule)' }}>
            <p className="px-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--trout-ink-faint)' }}>More</p>
            {MORE_LINKS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className="nav-link focus-ring"><Icon size={18} />{label}</NavLink>
            ))}
          </div>
          <p className="mt-auto px-3 pt-4 text-xs" style={{ color: 'var(--trout-ink-muted)' }}>No accounts. No tracking. Your logbook never leaves this device.</p>
        </nav>

        {menuOpen && (
          <div ref={drawerRef} id="mobile-menu" className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-stone-900/40" onClick={() => setMenuOpen(false)} />
            <nav aria-label="Primary mobile" className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto p-3 pt-16 shadow-xl" style={{ background: 'var(--trout-paper)' }}>
              {DESKTOP_NAV.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end={to === '/'} className="nav-link focus-ring" onClick={() => setMenuOpen(false)}><Icon size={20} />{label}</NavLink>
              ))}
              {MORE_LINKS.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className="nav-link focus-ring" onClick={() => setMenuOpen(false)}><Icon size={18} />{label}</NavLink>
              ))}
              <button type="button" onClick={() => setMenuOpen(false)} className="focus-ring mt-2 flex min-h-[44px] items-center gap-3 rounded-lg px-3 font-semibold"><CloseIcon size={18} /> Close</button>
            </nav>
          </div>
        )}

        <div id="main" className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>

      <nav aria-label="Primary tabs" className={cx('sticky bottom-0 z-30 flex border-t lg:hidden')} style={{ background: 'var(--trout-paper)', borderColor: 'var(--trout-rule)' }}>
        {MOBILE_TABS.map(({ to, label, Icon, isMore }: any) => (
          isMore ? (
            <button key={to} type="button" onClick={() => setMenuOpen(true)} className="bottom-tab focus-ring flex-1">
              <Icon size={22} />{label}
            </button>
          ) : (
            <NavLink key={to} to={to} end={to === '/'} className="bottom-tab focus-ring">
              <Icon size={22} />{label}
            </NavLink>
          )
        ))}
      </nav>

      {!online && <OfflineNote />}
    </div>
  );
}

function OfflineNote() {
  return (
    <div className="fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold shadow-md lg:bottom-4" style={{ background: 'var(--trout-slate-800)', color: '#fff' }} role="status">
      <span className="inline-flex items-center gap-2"><LocationIcon size={14} /> Airplane mode is fine — everything core works offline.</span>
    </div>
  );
}
