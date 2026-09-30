import { useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { motion } from 'motion/react';
import { Toaster } from '@trout/ui';
import { useOnline } from '../../hooks/useOnline';
import { useSettingsContext } from '../../lib/settings';
import { SPRING } from '../motion/atlas-motion';
import {
  BookIcon,
  BugIcon,
  ChartIcon,
  CloseIcon,
  FishIcon,
  GearIcon,
  ListIcon,
  LocationIcon,
  MenuIcon,
  ShieldIcon,
  ShopIcon,
  WavesIcon,
} from '../icons';
import { ThemeToggle } from '../../theme/ThemeProvider';
import { SpeciesModeToggle } from '../SpeciesModeToggle';
import { rememberedMapUrl, rememberMapUrl, contextUrl } from '../../lib/riverContext';
import { RiverSearch } from '../../features/map/RiverSearch';
import { useStreamsCatalog } from '../../lib/useStreamsCatalog';

// Regulations rides at position 3 of the menu (after Match the hatch and
// Logbook) — the session-3 promotion: it answers "can I fish this legally"
// before the utility pages below it.
const moreLinks = [
  { to: '/my-waters', label: 'My Waters', Icon: LocationIcon },
  { to: '/regulations', label: 'Regulations', Icon: ListIcon },
  { to: '/conditions', label: 'Conditions', Icon: WavesIcon },
  { to: '/compare', label: 'Compare waters', Icon: ChartIcon },
  { to: '/charts', label: 'Hatch calendar', Icon: BugIcon },
  { to: '/stocking', label: 'Stocking schedules', Icon: FishIcon },
  { to: '/shops', label: 'Shops & reports', Icon: ShopIcon },
  { to: '/settings', label: 'Settings', Icon: GearIcon },
  { to: '/about', label: 'About & privacy', Icon: ShieldIcon },
];

export function AppShell() {
  const online = useOnline();
  const location = useLocation();
  const navigate = useNavigate();
  const isMap = location.pathname === '/';
  const { settings } = useSettingsContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerCatalog = useStreamsCatalog(1440);
  const headerStreams = headerCatalog.data?.data ?? [];
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (isMap) rememberMapUrl('/' + location.search);
  const mapUrl = rememberedMapUrl();
  const currentParams = new URLSearchParams(location.search);
  const contextParams =
    currentParams.has('river') || isMap ? currentParams : new URLSearchParams(mapUrl.split('?')[1]);
  const contextual = (path: string) => contextUrl(path, contextParams);
  const selectHeaderWater = (riverId: string) => {
    const params = new URLSearchParams({ river: riverId, tab: 'Water' });
    navigate('/?' + params.toString());
  };
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings.reduceMotion]);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname === '/') return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const heading =
        document.querySelector<HTMLElement>('#main h1') ?? document.getElementById('main');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
      if (e.key !== 'Tab') return;
      const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('a,button') ?? [])];
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      triggerRef.current?.focus();
    };
  }, [menuOpen]);
  return (
    <div className="app-shell">
      <Toaster />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <Link to={mapUrl} className="brand" aria-label="Trout — explore waters">
          <span className="brand-mark">
            <FishIcon size={30} />
          </span>
          <span className="brand-word">
            Trout<span className="brand-dot">.</span>
          </span>
          <span className="brand-caption">THE FIELD ATLAS</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary">
          <NavLink to={mapUrl} end className={isMap ? 'is-current' : ''}>
            <WavesIcon size={18} />
            Explore waters
          </NavLink>
          <NavLink to={contextual('/hatch-key')}>
            <BugIcon size={18} />
            Match the hatch
          </NavLink>
          <NavLink to={contextual('/logbook')}>
            <BookIcon size={18} />
            Logbook
          </NavLink>
        </nav>
        <div className="header-search">
          <RiverSearch
            streams={headerStreams}
            onSelect={selectHeaderWater}
            placeholder="Search any water…"
            shortcut={false}
            showShortcut={false}
          />
        </div>
        <div className="header-actions">
          <span className="privacy-note">
            <ShieldIcon size={15} />
            On your device. Out in the wild.
          </span>
          <SpeciesModeToggle />
          <ThemeToggle />
          <button
            ref={triggerRef}
            type="button"
            className="icon-button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="app-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MenuIcon size={21} />
          </button>
        </div>
      </header>
      {!online && (
        <div className="offline-banner" role="status">
          Offline · saved maps and information only. Readings may be out of date.
        </div>
      )}
      {import.meta.env.DEV_FIXTURES === true && (
        <div className="offline-banner" role="status">
          Demonstration data · not current fishing conditions
        </div>
      )}
      <div id="main" tabIndex={-1} className={isMap ? 'map-main' : 'page-main'}>
        {isMap ? (
          // The map owns its own entrance (camera push-in); a wrapper here
          // would break the field-map height chain.
          <Outlet context={{ openMenu: () => setMenuOpen(true), menuOpen }} />
        ) : (
          <motion.div
            key={location.pathname}
            className="route-enter"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.soft}
          >
            <Outlet context={{ openMenu: () => setMenuOpen(true), menuOpen }} />
          </motion.div>
        )}
      </div>
      {menuOpen && (
        <div className="menu-backdrop" onClick={() => setMenuOpen(false)}>
          <div
            ref={menuRef}
            id="app-menu"
            className="app-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-heading">
              <span className="eyebrow">Your field atlas</span>
              <button
                className="icon-button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <nav aria-label="All pages">
              <Link
                className="nav-link"
                to={contextual('/hatch-key')}
                onClick={() => setMenuOpen(false)}
              >
                <BugIcon size={20} />
                Match the hatch
              </Link>
              <Link
                className="nav-link"
                to={contextual('/logbook')}
                onClick={() => setMenuOpen(false)}
              >
                <BookIcon size={20} />
                Logbook
              </Link>
              {moreLinks.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className="nav-link" onClick={() => setMenuOpen(false)}>
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <p className="muted text-sm p-3">
              No accounts. No tracking. Your logbook never leaves this device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export function useShell() {
  return useOutletContext<{ openMenu: () => void; menuOpen: boolean }>();
}
