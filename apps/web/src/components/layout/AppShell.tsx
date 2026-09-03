import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cx } from '@trout/ui';
import { useOnline } from '../../hooks/useOnline';
import { useSettingsContext } from '../../lib/settings';
import {
  BookIcon, BugIcon, ChartIcon, CloseIcon, FishIcon, GearIcon, HomeIcon, LocationIcon,
  MenuIcon, ShieldIcon, ShopIcon, WifiOffIcon, WavesIcon,
} from '../icons';

export const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/hatch-key', label: 'Hatch Key', Icon: BugIcon },
  { to: '/charts', label: 'Hatch Charts', Icon: ChartIcon },
  { to: '/conditions', label: 'Conditions', Icon: WavesIcon },
  { to: '/stocking', label: 'Stocking', Icon: FishIcon },
  { to: '/shops', label: 'Shops & Reports', Icon: ShopIcon },
  { to: '/logbook', label: 'Logbook', Icon: BookIcon },
  { to: '/settings', label: 'Settings', Icon: GearIcon },
  { to: '/about', label: 'About & Privacy', Icon: ShieldIcon },
];

const TAB_ITEMS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/hatch-key', label: 'Hatch', Icon: BugIcon },
  { to: '/conditions', label: 'Water', Icon: WavesIcon },
  { to: '/charts', label: 'Charts', Icon: ChartIcon },
  { to: '/logbook', label: 'Log', Icon: BookIcon },
];

export function AppShell() {
  const online = useOnline();
  const { settings } = useSettingsContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // reduce-motion is an html-level class so CSS can honor it everywhere
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings.reduceMotion]);

  // close the drawer on Escape (a11y)
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold"
      >
        Skip to content
      </a>

      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: 'var(--trout-color-surface)', borderColor: 'var(--trout-color-border)' }}
      >
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
          <button
            type="button"
            className="focus-ring -ml-2 flex h-12 w-12 items-center justify-center rounded-lg lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="focus-ring flex items-center gap-2 rounded-lg py-1 text-left"
            aria-label="Trout — home"
          >
            <FishIcon size={26} />
            <span className="text-lg font-extrabold tracking-tight">Trout</span>
          </button>
          <span className="ml-auto flex items-center gap-2">
            {!online && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: 'var(--trout-amber-100)', color: 'var(--trout-amber-600)' }}
              >
                <WifiOffIcon size={14} /> Offline — still works
              </span>
            )}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <nav aria-label="Primary" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r p-3 lg:flex" style={{ borderColor: 'var(--trout-color-border)' }}>
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-link focus-ring">
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <p className="mt-auto px-3 pt-4 text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
            No accounts. No tracking. Your logbook never leaves this device.
          </p>
        </nav>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMenuOpen(false)}
            />
            <nav
              aria-label="Primary mobile"
              className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto p-3 pt-16 shadow-xl"
              style={{ background: 'var(--trout-color-surface)' }}
            >
              {NAV_ITEMS.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className="nav-link focus-ring"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Primary tabs"
        className={cx('sticky bottom-0 z-30 flex border-t lg:hidden')}
        style={{ background: 'var(--trout-color-surface)', borderColor: 'var(--trout-color-border)' }}
      >
        {TAB_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="bottom-tab focus-ring">
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>

      {!online && <OfflineNote />}
    </div>
  );
}

function OfflineNote() {
  return (
    <div
      className="fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold shadow-md lg:bottom-4"
      style={{ background: 'var(--trout-slate-800)', color: '#fff' }}
      role="status"
    >
      <span className="inline-flex items-center gap-2">
        <LocationIcon size={14} /> Airplane mode is fine — everything core works offline.
      </span>
    </div>
  );
}
