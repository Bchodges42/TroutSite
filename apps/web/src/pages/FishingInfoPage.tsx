/**
 * Fishing information & regulations guide — organized around the questions
 * anglers actually ask, with an official source and effective-date language
 * for every regulatory claim. This page deliberately makes no promise of
 * legal completeness and caches nothing: regulation content links out to the
 * agency in force.
 *
 * ROUTING NOTE: the route table (App.tsx) is outside the UI lane's ownership;
 * the /fishing-info and /regulations paths are registered as shell aliases in
 * AppShell.tsx, which renders this page in place of the outlet.
 */
import { Link } from 'react-router-dom';

const REVIEWED = 'September 4, 2026';

const SECTIONS = [
  { id: 'license', question: 'Do I need a license?' },
  { id: 'seasons', question: 'When can I fish for trout?' },
  { id: 'rules', question: 'What are the trout rules?' },
  { id: 'special-regulations', question: 'Which waters have special regulations?' },
  { id: 'stocking-terms', question: 'What does the stocking schedule mean?' },
  { id: 'access', question: 'Where can I legally get in?' },
  { id: 'safety', question: 'What should I check before I wade in?' },
  { id: 'official-links', question: 'Official sources' },
] as const;

const SOURCES = {
  twraFishing: {
    label: 'TWRA — Fishing in Tennessee',
    url: 'https://www.tn.gov/twra/fishing.html',
  },
  twraTrout: {
    label: 'TWRA — Trout information & stockings',
    url: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
  },
  twraLicense: {
    label: 'TWRA — Buy a license (GoOutdoorsTennessee)',
    url: 'https://license.gooutdoorstennessee.com/',
  },
  usgs: {
    label: 'USGS — Tennessee water data',
    url: 'https://waterdata.usgs.gov/tn/nwis',
  },
  tva: {
    label: 'TVA — Lake levels & release schedules',
    url: 'https://www.tva.com/environment/lake-levels',
  },
} as const;

function SourceList({ sources }: { sources: Array<{ label: string; url: string }> }) {
  return (
    <ul className="fi-sources">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noreferrer noopener">
            {s.label} <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function FishingInfoPage() {
  return (
    <main className="page fishing-info">
      <p className="eyebrow">Tennessee / Field guide</p>
      <h1 className="page-title">Fishing information &amp; regulations</h1>
      <p className="page-subtitle mt-2">
        The questions to ask before you go — answered with a link to the official source every
        time. This guide is a starting point, not a legal summary, and it is never complete: rules
        change, and the agency page in force is always the authority.
      </p>
      <p className="fi-reviewed" role="note">
        Guide reviewed {REVIEWED}. Regulations are set by the Tennessee Wildlife Resources Agency
        (TWRA) — effective dates for everything below are printed on the official pages linked in
        each section.
      </p>

      <nav className="fi-jump" aria-label="Questions on this page">
        {SECTIONS.map((s) => (
          <a key={s.id} href={'#' + s.id}>
            {s.question}
          </a>
        ))}
      </nav>

      <section id="license" className="fi-section" aria-labelledby="license-h">
        <h2 id="license-h">Do I need a license?</h2>
        <p>
          Yes — fishing Tennessee's public waters requires a state fishing license, and trout
          fishing carries additional license requirements beyond the base license. Exact
          categories, costs, and exemptions change, and the license you need depends on residency,
          age, and how you fish.
        </p>
        <p className="fi-effective">
          Effective dates: license requirements and fees are set by TWRA and the Tennessee
          legislature; the current requirements are stated on the official license page at
          purchase time.
        </p>
        <SourceList sources={[SOURCES.twraLicense, SOURCES.twraFishing]} />
      </section>

      <section id="seasons" className="fi-section" aria-labelledby="seasons-h">
        <h2 id="seasons-h">When can I fish for trout?</h2>
        <p>
          Tennessee has no single statewide "trout season": the major tailwaters are managed and
          stocked year-round, while TWRA's winter put-and-take program runs roughly December
          through early March on selected streams and small impoundments. Open water, open
          sections, and daily hours for specific waters all come from the current proclamation —
          not from this app.
        </p>
        <p className="fi-effective">
          Effective dates: stocking windows and open periods are published by TWRA and revised
          during the season; verify at the trout information page before planning a trip.
        </p>
        <SourceList sources={[SOURCES.twraTrout, SOURCES.twraFishing]} />
        <p>
          In the app: the <Link to="/stocking">stocking browser</Link> mirrors the published
          schedule with attribution, and every water page links its own official sources.
        </p>
      </section>

      <section id="rules" className="fi-section" aria-labelledby="rules-h">
        <h2 id="rules-h">What are the trout rules?</h2>
        <p>
          Creel limits, size limits, gear restrictions, and catch-and-release requirements are set
          annually by TWRA proclamation and vary by water. This app intentionally does not restate
          the numbers: a summarized limit that is one year out of date is worse than none. Read
          the proclamation summary for the water you are fishing before you keep anything.
        </p>
        <p className="fi-effective">
          Effective dates: the proclamation in force (with its effective period) is published on
          TWRA's fishing regulations pages each year.
        </p>
        <SourceList sources={[SOURCES.twraFishing, SOURCES.twraTrout]} />
      </section>

      <section id="special-regulations" className="fi-section" aria-labelledby="special-h">
        <h2 id="special-h">Which waters have special regulations?</h2>
        <p>
          Some of Tennessee's best-known trout waters — delayed-harvest streams, quality zones on
          tailwaters, and gear-restricted reaches — carry special regulations that differ from the
          statewide defaults. Special-regulation waters are listed by name in the official
          regulation summary, and boundaries are described there in legal detail.
        </p>
        <p className="fi-effective">
          Effective dates: the special-regulation list is part of the annual proclamation and can
          change year to year; confirm the reach you plan to fish against the current list.
        </p>
        <SourceList sources={[SOURCES.twraFishing]} />
      </section>

      <section id="stocking-terms" className="fi-section" aria-labelledby="terms-h">
        <h2 id="terms-h">What does the stocking schedule mean?</h2>
        <dl className="fi-terms">
          <dt>Put-and-take</dt>
          <dd>
            Waters stocked to be fished out over a season. The winter program stocks catchable
            trout for anglers to harvest under the current rules.
          </dd>
          <dt>Scheduled</dt>
          <dd>
            A published plan. TWRA publishes weekly schedules during the season — a scheduled
            entry describes intent, and plans change.
          </dd>
          <dt>Reported</dt>
          <dd>
            A past-dated published entry. In this app a past date is labeled "reported," which
            means the schedule said it happened — not that it was field-verified.
          </dd>
          <dt>Date precision</dt>
          <dd>
            TWRA publishes exact days, "week of" dates, and month windows. Entries in this app
            carry that precision so a week never masquerades as a day.
          </dd>
        </dl>
        <p className="fi-effective">
          Effective dates: stocking schedules are published weekly in season by TWRA; this app
          re-reads the published source each time it refreshes and never caches a schedule
          indefinitely.
        </p>
        <SourceList sources={[SOURCES.twraTrout]} />
      </section>

      <section id="access" className="fi-section" aria-labelledby="access-h">
        <h2 id="access-h">Where can I legally get in?</h2>
        <p>
          Public access comes from TWRA access areas, public bridges and right-of-ways, and
          designated public lands. Much riverbank in Tennessee is private; landing on private
          property is a trespass issue even when the water itself is navigable. Access rules for
          specific reaches — and parking rules at access areas — are described on the official
          pages and on-site signage.
        </p>
        <p className="fi-effective">
          Effective dates: access-area openings, closures, and parking rules are managed by TWRA
          and local authorities and can change without notice.
        </p>
        <SourceList sources={[SOURCES.twraFishing, SOURCES.twraTrout]} />
      </section>

      <section id="safety" className="fi-section" aria-labelledby="safety-h">
        <h2 id="safety-h">What should I check before I wade in?</h2>
        <ul>
          <li>
            <strong>Dam releases.</strong> Tailwater rivers can rise fast and without local
            warning. Check the generation schedule for the dam above you before you get in, and
            watch the water while you are in it.
          </li>
          <li>
            <strong>Flow and temperature.</strong> Gauge data drives this app's conditions — the
            raw readings are always available from USGS.
          </li>
          <li>
            <strong>Cold water.</strong> Tailwater discharges are cold enough to disable a
            swimmer in minutes, in summer as well as winter.
          </li>
          <li>
            <strong>Weather upstream.</strong> Clear skies at your put-in do not mean clear water
            is coming; rain far upstream can move a river hours later.
          </li>
        </ul>
        <SourceList sources={[SOURCES.tva, SOURCES.usgs]} />
      </section>

      <section id="official-links" className="fi-section" aria-labelledby="links-h">
        <h2 id="links-h">Official sources</h2>
        <p>
          Everything regulatory in this guide lives on one of these pages. If this app and an
          official source ever disagree, the official source wins.
        </p>
        <SourceList
          sources={Object.values(SOURCES).map((s) => ({ label: s.label, url: s.url }))}
        />
      </section>

      <div className="fi-disclaimer" role="note">
        <strong>This guide is not legal advice and not a complete summary of the law.</strong> It
        collects where the answers live. Regulations, seasons, limits, and access rules change —
        the proclamation and schedules in force at the official links above are the only
        authoritative versions.
      </div>
      <p className="mt-4">
        <Link to="/" className="text-action">
          ← Back to the field atlas
        </Link>
      </p>
    </main>
  );
}
