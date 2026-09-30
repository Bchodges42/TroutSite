import { useMemo, useState, useRef, useEffect, useId } from 'react';
import { regionName } from '../../data/regions';
import { waterTypeLabel } from '../../lib/presentation';
import { buildEntries, match } from '../search/searchIndex';
/** True when the element is actually rendered (walks hidden ancestors). */
function isRendered(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    if (node.hasAttribute('hidden')) return false;
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    node = node.parentElement;
  }
  return true;
}

interface SearchStream {
  id: string;
  name: string;
  aliases?: string[];
  regionId: string;
  /** Full catalog rows carry these; lightweight fixture rows may not. */
  species?: 'trout' | 'warmwater';
  waterbodyType?: string;
  hydroIdentity?: { counties?: string[] } & Record<string, unknown>;
}

/**
 * Water search (offline): the index is rebuilt at RUNTIME from the precached
 * catalog in a useMemo (features/search/searchIndex.ts) — the bundled catalog
 * already IS the offline index, so there is no generated index file to drift.
 *
 * Fish scope: results default to the trout scope (everything the catalog does
 * not positively mark warmwater — catalog silence is never a negative). When
 * the trout scope has zero results but warmwater-only waters match, ONE
 * explicit "Search all fish" action widens the scope; widening is sticky for
 * the instance (an explicit choice is never silently re-narrowed) and the
 * scope is NEVER switched automatically. Every water stays reachable.
 *
 * Enter never silently picks a guess: it commits the highlighted result only
 * when the top result is an exact/prefix match (tiers 1-2) or the visitor
 * moved the highlight themselves (arrow keys). Fuzzy/word-prefix-only result
 * sets require an explicit click or ↓+Enter.
 */
export function RiverSearch({
  streams = [],
  onSelect,
  placeholder = 'Search rivers, creeks…',
  shortcut = true,
  showShortcut = true,
}: {
  streams?: SearchStream[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
  placeholder?: string;
  shortcut?: boolean;
  showShortcut?: boolean;
}) {
  const [query, setQuery] = useState('');
  /** T2-36: shared across instances — the first VISIBLE instance to handle a
   *  shortcut keystroke claims it (others skip). */
  const lastShortcutHandledAt = useRef(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  /** True once the visitor moved the highlight themselves (ArrowUp/Down) —
   *  the keyboard-explicit signal that lets Enter commit any tier. */
  const navigated = useRef(false);
  /** Trout scope by default; widened only by the explicit "Search all fish"
   *  action, then sticky (never auto-narrowed behind the visitor's back). */
  const [allFish, setAllFish] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();
  const entries = useMemo(
    () =>
      buildEntries(
        streams.map((s) => ({
          id: s.id,
          name: s.name,
          aliases: s.aliases,
          regionId: s.regionId,
          regionLabel: regionName(s.regionId),
          counties: s.hydroIdentity?.counties,
          waterbodyType: s.waterbodyType,
          allFishOnly: s.species === 'warmwater',
        })),
      ),
    [streams],
  );
  const matches = useMemo(() => {
    const scope = allFish ? entries : entries.filter((e) => !e.allFishOnly);
    return match(query, scope);
  }, [entries, query, allFish]);
  const visible = useMemo(() => matches.slice(0, 30), [matches]);
  // Widening candidates exist ONLY when the current scope found nothing —
  // this is the explicit "Search all fish" escape hatch, never an auto-switch.
  const widerMatches = useMemo(() => {
    if (allFish || matches.length > 0) return [];
    return match(query, entries).filter((m) => m.entry.allFishOnly);
  }, [entries, query, allFish, matches.length]);
  // Disambiguation: when two+ visible results share a base name (Duck River,
  // Cane Creek, Piney River…), each row gains a "counties · type" line.
  const repeated = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of visible)
      counts.set(m.entry.baseName, (counts.get(m.entry.baseName) ?? 0) + 1);
    return counts;
  }, [visible]);
  useEffect(() => {
    setActive(0);
  }, [query, visible.length]);
  useEffect(() => {
    if (!shortcut) return;
    const key = (e: KeyboardEvent) => {
      if (document.getElementById('app-menu')) return;
      const editing =
        e.target instanceof HTMLElement &&
        (e.target.matches('input,textarea,select') || e.target.isContentEditable);
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') ||
        (e.key === '/' && !editing && !e.ctrlKey && !e.metaKey && !e.altKey)
      ) {
        // T2-36: several instances mount (header + sidebar + drawer flows) and
        // hidden ones keep their listeners. The VISIBLE instance owns the
        // shortcut — hidden inputs must never receive focus, and when two are
        // visible the first to handle the event wins.
        if (lastShortcutHandledAt.current === e.timeStamp) return;
        if (!input.current || !isRendered(input.current)) return;
        e.preventDefault();
        lastShortcutHandledAt.current = e.timeStamp;
        input.current.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [shortcut]);
  useEffect(() => {
    if (open)
      document.getElementById(id + '-option-' + active)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);
  const choose = (river: string) => {
    setOpen(false);
    setQuery('');
    navigated.current = false;
    onSelect(river);
  };
  return (
    <div
      ref={wrap}
      className="search-wrap"
      data-river-search
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="search-field">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="6.5" />
          <path d="m15 15 5 5" />
        </svg>
        <input
          ref={input}
          className="search-input"
          type="search"
          role="combobox"
          aria-label="Search rivers"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && visible[active] ? id + '-option-' + active : undefined}
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            // An empty query opens nothing: the auto-focused atlas search must
            // not drop a result sheet over the filters below it. Typing or
            // ArrowDown still opens the list immediately.
            if (query) setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            navigated.current = false;
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              navigated.current = true;
              setOpen(true);
              setActive((i) => Math.min(i + 1, Math.max(0, visible.length - 1)));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              navigated.current = true;
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === 'Enter' && open && visible[active]) {
              e.preventDefault();
              // Hard rule: never silently select a different water. Enter
              // commits only an exact/prefix top result, or a highlight the
              // visitor moved themselves; fuzzy/word-prefix-only sets require
              // an explicit click or ↓+Enter.
              const topExact = visible[0] !== undefined && visible[0].tier <= 2;
              if (topExact || navigated.current) choose(visible[active]!.entry.id);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }
          }}
        />
        {showShortcut && (
          <kbd className="search-key" aria-hidden="true">
            /
          </kbd>
        )}
      </div>
      {open && (
        <div id={id} role="listbox" aria-label="River results" className="search-results">
          {visible.length === 0 && widerMatches.length > 0 && (
            <button
              type="button"
              className="search-note text-action"
              onClick={() => {
                setAllFish(true);
                setOpen(true);
              }}
            >
              No trout waters match “{query}” — search all fish ({widerMatches.length}{' '}
              {widerMatches.length === 1 ? 'match' : 'matches'})
            </button>
          )}
          {visible.length === 0 && widerMatches.length === 0 && (
            <p className="search-note">
              {streams.length
                ? 'No waters match. Try another name or region.'
                : 'River catalog is loading or unavailable. Browse the list for details.'}
            </p>
          )}
          {visible[0] && visible[0].tier > 2 && (
            <p className="search-note">
              No exact name match — these are similar or partial results. Choose one explicitly
              (click, or ↓ then Enter).
            </p>
          )}
          {visible.map((m, i) => {
            const why =
              m.reason === 'exact-alias'
                ? 'alias'
                : m.reason === 'fuzzy'
                  ? 'similar'
                  : undefined;
            const disambig =
              (repeated.get(m.entry.baseName) ?? 0) > 1
                ? [
                    m.entry.counties.length ? m.entry.counties.join(', ') : undefined,
                    m.entry.waterbodyType ? waterTypeLabel(m.entry.waterbodyType) : undefined,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined;
            const meta = [why, disambig].filter(Boolean).join(' · ');
            return (
              <button
                key={m.entry.id}
                id={id + '-option-' + i}
                tabIndex={-1}
                type="button"
                role="option"
                aria-selected={i === active}
                className="search-option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(m.entry.id)}
                onMouseEnter={() => setActive(i)}
              >
                <strong>{m.entry.name}</strong>
                <small>{regionName(m.entry.regionId ?? '')}</small>
                {meta && <small>{meta}</small>}
              </button>
            );
          })}
          <div className="search-note">
            {streams.length} waters · ↑ ↓ to explore · Enter to select
          </div>
        </div>
      )}
    </div>
  );
}
