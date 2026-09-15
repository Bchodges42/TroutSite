import { useMemo, useState, useRef, useEffect, useId } from 'react';
import { regionName } from '../../data/regions';
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
}
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
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const matches = useMemo(
    () =>
      streams
        .filter((s) =>
          normalize([s.name, ...(s.aliases ?? []), regionName(s.regionId)].join(' ')).includes(
            normalize(query),
          ),
        )
        .sort(
          (a, b) =>
            Number(normalize(b.name).includes(normalize(query))) -
              Number(normalize(a.name).includes(normalize(query))) || a.name.localeCompare(b.name),
        )
        .slice(0, 30),
    [streams, query],
  );
  useEffect(() => {
    setActive(0);
  }, [query, matches.length]);
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
          aria-activedescendant={open && matches[active] ? id + '-option-' + active : undefined}
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
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, Math.max(0, matches.length - 1)));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === 'Enter' && open && matches[active]) {
              e.preventDefault();
              choose(matches[active]!.id);
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
          {matches.length === 0 && (
            <p className="search-note">
              {streams.length
                ? 'No waters match. Try another name or region.'
                : 'River catalog is loading or unavailable. Browse the list for details.'}
            </p>
          )}
          {matches.map((s, i) => (
            <button
              key={s.id}
              id={id + '-option-' + i}
              tabIndex={-1}
              type="button"
              role="option"
              aria-selected={i === active}
              className="search-option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s.id)}
              onMouseEnter={() => setActive(i)}
            >
              <strong>{s.name}</strong>
              <small>{regionName(s.regionId)}</small>
            </button>
          ))}
          <div className="search-note">
            {streams.length} waters · ↑ ↓ to explore · Enter to select
          </div>
        </div>
      )}
    </div>
  );
}
