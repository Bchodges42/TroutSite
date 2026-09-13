import { Card, Chip } from '@trout/ui';

/** About & Privacy (scope 1): the privacy-by-architecture story, in plain words. */
export function AboutPrivacyPage() {
  return (
    <main className="page">
      <h1 className="page-title">About &amp; Privacy</h1>
      <p className="page-subtitle mt-1">
        Trout is an offline-first decision tool for trout anglers: match the hatch, read the water,
        and keep your own log — without giving anyone your data.
      </p>

      <h2 className="section-title">Privacy by architecture, not policy</h2>
      <Card>
        <ul className="flex flex-col gap-3 text-sm">
          <li>
            <Chip tone="good">No accounts</Chip> There is nothing to sign up for and nothing to log
            into. You are not a user profile to us — you are not on the server at all.
          </li>
          <li>
            <Chip tone="good">No cookies, no trackers</Chip> The app makes{' '}
            <strong>no third-party trackers or analytics</strong> requests by default, and has no
            ads and no embeds. Everything else it fetches comes from its own origin, with one
            exception by design: shop report photos load from the shop's own attributed site, so
            that host sees the photo request. If aggregate traffic measurement is switched on for
            the live site, it runs on Cloudflare Web Analytics — cookie-free, no fingerprinting, no
            cross-site tracking, no personal data — and this page is the place it is disclosed. No
            analytics code ships in this build unless the operator enabled it; the offline install
            makes no third-party requests either way.
          </li>
          <li>
            <Chip tone="good">Location never leaves the device</Chip> "Near me" uses your browser's
            location only to sort the stream list on your screen. Coordinates are never stored,
            logged, or sent anywhere — there is no code path that could.
          </li>
          <li>
            <Chip tone="good">Logbook stays local</Chip> Your fishing log is stored only in this
            browser's IndexedDB. Export it as a JSON file anytime; it is never uploaded.
          </li>
          <li>
            <Chip tone="good">Free to use</Chip> v1 ships with no ads and no payments. Monetization
            scaffolding stays switched off.
          </li>
        </ul>
      </Card>

      <h2 className="section-title">What the app stores on your device</h2>
      <Card>
        <ul className="list-disc pl-5 text-sm">
          <li>Cached public data snapshots: hatch charts, gauge conditions, stocking schedules, shops.</li>
          <li>The bundled insect &amp; fly-pattern reference.</li>
          <li>Your settings (units, state, reduce-motion).</li>
          <li>Your logbook entries — if you write any.</li>
        </ul>
        <p className="page-subtitle mt-3">
          Clearing site data in your browser removes all of it permanently.
        </p>
      </Card>

      <h2 className="section-title">Where the data comes from</h2>
      <Card>
        <ul className="list-disc pl-5 text-sm">
          <li>
            <strong>Stream conditions:</strong> USGS Waterservices (public domain), refreshed hourly.
            Verify at{' '}
            <a className="focus-ring underline" href="https://waterdata.usgs.gov" target="_blank" rel="noreferrer noopener">
              waterdata.usgs.gov
            </a>
            .
          </li>
          <li>
            <strong>Stocking:</strong> Tennessee Wildlife Resources Agency weekly schedules. Verify at{' '}
            <a className="focus-ring underline" href="https://www.tn.gov/twra/fishing/stocking.html" target="_blank" rel="noreferrer noopener">
              TWRA stocking
            </a>
            .
          </li>
          <li>
            <strong>Hatch &amp; fly reference:</strong> curated content with cited sources on every
            entry; community-validated, never authoritative.
          </li>
          <li>
            <strong>Shop reports:</strong> written and attributed by the shops themselves, linked to
            their source.
          </li>
        </ul>
      </Card>

      <h2 className="section-title">Honest limitations</h2>
      <Card>
        <ul className="list-disc pl-5 text-sm">
          <li>This app is <strong>never authoritative</strong> on flows, regulations, licenses, or fees — always verify with the official links provided.</li>
          <li>Scores and hatch charts are guides, not guarantees. Rivers change fast; dam releases faster.</li>
          <li>v1 covers Tennessee only. More states arrive in v2.</li>
        </ul>
      </Card>

      <p className="page-subtitle mt-6">
        Built as a passion project. Works in airplane mode. Questions in the code:
        <span className="font-mono"> apps/web</span>.
      </p>
    </main>
  );
}
