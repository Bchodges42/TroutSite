/**
 * Regulations & fishing information — the structured answer page. Content is
 * data-driven from the content pack (/content/fishing.json): statewide rules,
 * water-specific special regulations, stocking terminology, access & safety.
 * Every claim cites its authority and the official page it was verified
 * against (rendered as text, not links); the only outbound links are the
 * license purchase and the official-sources directory at the bottom.
 *
 * ROUTING NOTE: /fishing-info and /regulations are shell aliases for this
 * page (App.tsx + AppShell menu).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Chip, EmptyState } from '@trout/ui';
import type { FishingInfoItem } from '@trout/contracts';
import {
  LICENSE_URL,
  
  useFishingInfo,
  waterRegulationItems,
} from '../lib/fishingInfo';
import { FreshnessChip } from '../components/FreshnessChip';
import { SearchIcon, CloseIcon } from '../components/icons';

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'official source';
  }
}

function Citation({ item }: { item: FishingInfoItem }) {
  return (
    <span className="fi-citation">
      {item.authority} · verified against {hostname(item.sourceUrl)}
      {item.effectiveFrom ? ` · effective ${item.effectiveFrom}` : ''}
      {item.effectiveThrough ? `–${item.effectiveThrough}` : ''}
    </span>
  );
}

function AnswerCard({ item }: { item: FishingInfoItem }) {
  return (
    <div className="list-row fi-answer" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
      <div className="min-w-0 flex-1">
        <h3 className="font-extrabold">{item.title}</h3>
        <p className="mt-1 text-sm">{item.text}</p>
        <Citation item={item} />
      </div>
    </div>
  );
}

export function FishingInfoPage() {
  const info = useFishingInfo();
  const [query, setQuery] = useState('');
  useEffect(() => {
    document.title = 'Tennessee fishing regulations & licenses — Trout field atlas';
    return () => {
      document.title = 'Trout — The Field Atlas';
    };
  }, []);

  const doc = info.data?.data;
  const sections = doc?.sections ?? [];
  const waterRegs = useMemo(() => {
    const all = waterRegulationItems(doc);
    const q = query.trim().toLowerCase();
    return q ? all.filter((i) => i.title.toLowerCase().includes(q)) : all;
  }, [doc, query]);

  // Render order: statewide sections first, then the per-water special regs,
  // then the official-sources directory. The jump nav mirrors this order.
  const notStatewide = sections.filter(
    (s) => s.id !== 'special-regulations' && s.id !== 'verification-links',
  );
  const specialSection = sections.find((s) => s.id === 'special-regulations');
  const sourceSection = sections.find((s) => s.id === 'verification-links');
  const hasWaterRegs = sections.some((s) => s.id === 'special-regulations');
  const hasSources = sections.some((s) => s.id === 'verification-links');
  const navItems = [
    ...notStatewide.map((s) => ({ id: s.id, title: s.title })),
    ...(hasWaterRegs
      ? [{ id: 'special-regulations', title: specialSection?.title ?? 'Special regulations' }]
      : []),
    ...(hasSources ? [{ id: 'official-sources', title: 'Official sources' }] : []),
  ];

  return (
    <main className="page fishing-info">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Fishing regulations &amp; licenses</h1>
        <FreshnessChip fetchedAt={info.data?.fetchedAt ?? null} live={info.data?.live ?? false} />
      </div>
      <p className="page-subtitle mt-2">
        The questions to ask before you go — answered in one place, with the rule, the agency that
        sets it, and the page it was verified against. Not legal advice: the agency page in force
        is always the authority.
      </p>
      {doc && (
        <p className="fi-reviewed" role="note">
          Content verified {doc?.verifiedAt}. Regulations are set by the Tennessee Wildlife
          Resources Agency (TWRA) and its partner agencies; effective dates are printed with each
          answer.
        </p>
      )}

      <nav className="fi-jump" aria-label="Questions on this page">
        {navItems.map((s) => (
          <a key={s.id} href={'#' + s.id}>
            {s.title}
          </a>
        ))}
      </nav>

      <Card className="mt-4 fi-license">
        <p className="text-sm">
          <strong>Fishing Tennessee's public waters requires a license</strong>, and trout fishing
          carries additional requirements beyond the base license. Categories, costs, and
          exemptions change — the current requirements are stated at purchase time.
        </p>
        <a
          className="primary-action mt-3"
          href={LICENSE_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          Buy a license at GoOutdoorsTennessee ↗
        </a>
      </Card>

      {info.isLoading ? (
        <p className="page-subtitle mt-6" role="status">
          Loading the regulations guide…
        </p>
      ) : info.isError ? (
        <div className="mt-6">
          <EmptyState
            icon="📋"
            title="Regulations guide not on this device yet"
            description="Open once while online — the guide then stays available offline, like the rest of your atlas."
          />
        </div>
      ) : (
        <>
          {notStatewide.map((section) => (
            <section key={section.id} id={section.id} className="fi-section" aria-labelledby={section.id + '-h'}>
              <h2 id={section.id + '-h'}>{section.title}</h2>
              {section.summary && <p className="page-subtitle">{section.summary}</p>}
              <div className="mt-3 flex flex-col gap-2">
                {section.items.map((item, i) =>
                  item.title.toLowerCase().includes('license') &&
                  section.id === 'statewide-rules' ? (
                    <div
                      key={section.id + i}
                      className="list-row fi-answer"
                      style={{ borderRadius: 'var(--trout-radius-lg)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold">{item.title}</h3>
                        <p className="mt-1 text-sm">{item.text}</p>
                        <Citation item={item} />
                        <p className="mt-2">
                          <a
                            className="focus-ring text-sm font-bold underline"
                            href={LICENSE_URL}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Purchase at GoOutdoorsTennessee ↗
                          </a>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <AnswerCard key={section.id + i} item={item} />
                  ),
                )}
              </div>
            </section>
          ))}

          {specialSection && (
            <section id="special-regulations" className="fi-section" aria-labelledby="special-h">
              <h2 id="special-h">
                {specialSection.title}
              </h2>
              <p className="page-subtitle">
                Waters where the general limits do not apply — delayed harvest, quality zones, gear
                restrictions. Each entry is also shown on the water's own page in the atlas.
              </p>
              {waterRegs.length > 6 && (
                <div className="discovery-search mt-3">
                  <div className="search-field">
                    <SearchIcon size={18} className="search-icon" />
                    <input
                      className="search-input"
                      type="search"
                      aria-label="Filter special-regulation waters by name"
                      placeholder="Filter waters…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        type="button"
                        className="discovery-clear"
                        aria-label="Clear filter"
                        onClick={() => setQuery('')}
                      >
                        <CloseIcon size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2">
                {waterRegs.map((item, i) => (
                  <div
                    key={item.title + i}
                    className="list-row fi-answer"
                    style={{ borderRadius: 'var(--trout-radius-lg)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold">{item.title}</h3>
                        <Chip tone="accent">{item.authority}</Chip>
                      </div>
                      <p className="mt-1 text-sm">{item.text}</p>
                      <Citation item={item} />
                      <p className="mt-2 flex flex-wrap gap-2">
                        {item.appliesTo?.map((waterId) => (
                          <Link
                            key={waterId}
                            className="focus-ring text-sm font-bold underline"
                            to={`/conditions/${waterId}`}
                          >
                            {waterId.replace(/-/g, ' ')} →
                          </Link>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
                {waterRegs.length === 0 && (
                  <p className="muted text-sm" role="status">
                    No special-regulation water matches that name.
                  </p>
                )}
              </div>
            </section>
          )}

          {sourceSection && (
            <section id="official-sources" className="fi-section" aria-labelledby="sources-h">
              <h2 id="sources-h">Official sources</h2>
              <p>
                Every claim above was verified against one of these pages. If this guide and an
                official source ever disagree, the official source wins.
              </p>
              <ul className="fi-sources">
                {sourceSection.items.map((item, i) => (
                  <li key={i}>
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer noopener">
                      {item.title} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {doc && (
        <div className="fi-disclaimer" role="note">
          <strong>{doc?.disclaimer}</strong>
        </div>
      )}
      <p className="mt-4">
        <Link to="/" className="text-action">
          ← Back to the field atlas
        </Link>
      </p>
    </main>
  );
}
