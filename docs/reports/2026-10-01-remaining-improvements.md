# Remaining improvements completed — October 1, 2026

**POST-29–33 are implemented and verified locally.** This continues the existing
session-owned clone and `codex/post-implementation-review-20260930` branch from
the prior repair checkpoint `5770a85`. The completed code checkpoint is
`ad3665926164cd77dc07c63776f8c49af0289ae4`; the branch is pushed to GitHub.

The previous report distinguished missing implementation from rollout and
acceptance checks. This work closes the five remaining code/data gaps. Owner
merge/configuration and physical-device/shop acceptance remain POST-34/35.
This is an implementation and regression-verification report; the earlier audit
and review retain their original scope and file-reading evidence.

## What now works

**POST-29 — Recent waters.** Explicit search selections are recalled on this
device when an empty search receives focus. History holds at most six unique
catalog IDs and follows the active catalog and fish scope. Removed IDs disappear
from results; Enter does not silently select a recalled water. History can be
cleared and blocked/malformed browser storage does not break search. Coordinates,
private notes and account data never enter this history.

**POST-30 — Download size before pinning.** Water details, saved waters, trips
and Settings have an opt-in, cancellable size check. Estimation and downloading
use the same plan with duplicate URLs removed. Saved response bodies provide
cached sizes; bounded HEAD requests provide missing public-asset metadata.
Uncompressed byte headers survive transport compression. Missing sizes remain
explicitly unknown. Available browser storage and the larger terrain option
help users decide what to save. The controls react to connectivity changes:
size checks, terrain changes and downloads disable immediately offline and
reenable when the connection returns. Verification/removal retain their local
behavior; a size estimate never declares a pack ready.

**POST-31 — Separate source outage/recovery watches.** Users can select flow or
temperature availability independently of a condition watch. Availability uses
the selected metric's own observation time and supported-provider history,
rather than mistaking a fresh unrelated reading for recovery. Unsupported
metrics remain unknown. The first known baseline is quiet; subsequent loss and
recovery are deduplicated, respect cooldown/selected-zone quiet hours, and remain
pending after failed or dry-run delivery. Notification wording describes source
availability. Migration 023 preserves existing rule rows, identities, deletion
cascades and SQLite ID continuity.

**POST-32 — Publication candidate and host visibility.** The preparation CLI
opens an existing migrated database read-only and uses the ordinary snapshot
builder to create private candidate files. The owner dashboard shows changed
source/species/opportunity/access/regulation/evidence/stocking claims and the
same opportunity wording used publicly. The preview labels abbreviated values
and omitted waters. Publication promotes the exact reviewed bytes through the
existing backup/rollback mechanism; wrong IDs, tampering, live-baseline drift or
one-hour expiry prevent promotion. Preparation leaves live snapshots unchanged.

Build outcomes come from pipeline history. Deployment, backup, watchdog,
refresh and auto-update visibility comes from fixed sanitized status/stamp
files; missing collection is shown as unknown. Raw logs, environment files,
notification topics and database backups are not read into the dashboard.
The portal proxy now forwards the four fixed owner GET/HEAD paths while the
API enforces separate owner authentication and no-store responses. Shop tokens
fail owner authentication. Dashboard tables scroll inside named keyboard-focusable
regions on mobile; before/after wording stacks vertically and long values wrap.
The owner token stays in memory and refreshing requires sign-in again.

**POST-33 — Sourced access and individual trip choices.** Two real NPS parking
records cover Metcalf Bottoms on Little River and Chimneys on West Prong Little
Pigeon. Primary official pages were read and checked claims, review dates,
source hashes and limitations recorded in
[the access-pilot research note](../research/access-pilot-2026-10-01.md).
Cards distinguish official-source review from an on-site visit. Unverified
coordinates, bank routes, current closures and parking requirements remain
explicit; a stocking point does not establish public access. This is a two-water
pilot, with further coverage left to source research.

Authoring, API snapshots and the offline client share the access contract.
Snapshot generation now includes validated access records. Trips select specific
records and save their IDs privately with atomic merges against the latest trip
row. Foreign-water selections are rejected. Retired selections remain visible
and removable, and temporary guide-loading failure retains saved choices.
Selections survive an offline reload. The checkbox remains selected while its
local save completes. Private access choices are excluded from shared trip text.

## Verification

- **1,544 unit checks passed**, with one existing conditional published-stocking
  integration check skipped because the ignored live feed is absent in this
  clone. Package passes: contracts 214, content 32, marketing 31, API 462,
  admin 41, web 764. Contracts pass the coverage gate: 96.85% statements/lines,
  92.4% branches and 92.3% functions.
- After the last interaction/layout changes, the affected web suites passed
  **32 checks** and the complete admin unit suite passed **41 checks** again.
- **31 infrastructure checks passed**, including owner proxy authentication,
  no-store preservation, fixed-read allowlisting, blocked owner mutations,
  existing portal/public-feed transport and deployment/backup guards.
- **24 distinct targeted browser cases passed in the final combined run**:
  12 privacy cases, two pinned-cache recovery cases, three new mobile search/
  access/offline cases, three real owner integration/mobile cases and four
  existing real shop-portal cases. Owner/access layouts were checked at both
  320 and 390 pixels, including keyboard table scrolling.
- `pnpm -r build` passes for all packages. The production PWA installation set
  is **12.71 MB against a 25 MB budget**; the eager entry remains MapLibre-free
  and the map remains behind its lazy boundary. Fixture web/admin builds used
  by the browser checks also pass TypeScript and build gates. Existing large
  chunk warnings remain visible.
- `pnpm -r lint` finishes with **zero errors**. Existing warnings remain:
  32 web hook warnings and one content-script unused-disable warning.
- Content validation and the water-identity audit pass. These changes add no
  geometry; the prior review's geometry-validator results remain historical
  evidence, rather than being presented as a new run.

Targeted checks additionally exercise estimate deduplication/unknown bytes and
conditional HEAD metadata, watch upgrades and quiet-hour retry transitions,
candidate hash/baseline/expiry guards, access source schemas, cross-water trip
rejection, concurrent local merges and retired-choice removal. Browser owner
checks use the real API and production-style portal proxy against throwaway
data and synthetic credentials. Candidate preparation is checked against an
unchanged public catalog baseline.

During verification, the estimate tests exposed a concurrent byte accumulator
bug; adding resolved byte lengths now preserves all worker results. The contract
coverage gate exposed missing direct coverage for shared wording helpers; the
coverage is added and the gate passes. Mobile checks also led to the local-save
checkbox, live connectivity, owner transport and dashboard overflow fixes.
Git Bash was placed before the Windows WSL shim for infrastructure tests; the
corrected run is green.

Chromium/SW offline emulation can reset `navigator.onLine` during a document
reload. The mobile cases assert the actual offline state and disabled controls
before reload, then separately verify cached access and persisted selections
after restart. Those checks do not certify a phone operating system's behavior.

## Delivery and remaining owner acceptance

Implementation commits are pushed on `codex/post-implementation-review-20260930`:

- `1d53b78` — recent waters and pack-size estimates.
- `5599e1c` — independent outage/recovery watches and safe rule migration.
- `a9d55dd` — candidate review, shared access contracts and source-reviewed trip access.
- `add8acb` — owner API forwarding and responsive offline/local-save controls.
- `ad36659` — mobile owner tables and real portal integration verification.

[KNOWN-ISSUES](../KNOWN-ISSUES.md) closes POST-29–33 and retains two distinct
acceptance items:

- **POST-34:** owner review/merge to main, ordinary self-deployment, desired
  distinct production secrets, the Windows scheduler profile and guarded task
  installation from a verified production checkout. Instructions are in
  [RUNBOOK §9.1–9.2](../../infra/RUNBOOK.md). Repository rules reserve main and
  production operations to the owner; implementation did not merge, deploy,
  install production tasks, change real credentials or send real notifications.
- **POST-35:** supported physical phones, actual OS push/click/unsubscribe,
  quiet hours, keyboard/safe areas, themes, screen-reader journeys and a willing
  shop's widget pilot. Local browser and encrypted-request tests cannot certify
  those physical/external outcomes.

Continued access coverage is editorial work: add source-supported records when
they can be verified, and identify a field visit only when one actually occurs.
These remaining rollout/acceptance/data-research activities do not represent
missing code in the five completed implementation items.
