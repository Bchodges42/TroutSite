# Completing the remaining improvements — October 1, 2026

Implementation in progress on `codex/post-implementation-review-20260930`,
continuing the session-owned review clone/branch at `5770a85`. The owner requested
completion of the code and data gaps identified in the previous review.

Completed so far:

- POST-29: device-local recent-water recall, explicit selection, clear history,
  bounded IDs, scope/catalog filtering and storage fallback.
- POST-30: cancellable pre-download estimates for water/saved/trip/Settings packs,
  using the exact pin plan and unique URLs. Cached body sizes and HEAD metadata
  provide full-pack estimates; unknown sizes are labelled. Public API/static
  headers preserve uncompressed size through edge compression. No private API
  metadata or personal data is probed.
- POST-31: separately selected flow/temperature outage and recovery watches,
  silent baseline, supported-metric evidence, deduplication, timezone/quiet-hour
  handling and retry-safe delivery memory. Upgrade preserves existing rules and
  IDs; custom enrollment no longer attaches a default condition threshold.
- POST-32: private candidate generation, authenticated read-only old/new claims
  and shared public wording, exact-byte promotion with baseline/hash/expiry
  checks, bounded previews and collected host-status visibility. Preparation
  uses a read-only DB; no live publication or production operation was performed.
- POST-33: two source-reviewed NPS parking records, shared authoring/API/offline
  validation and review-method labels. Trips save individual access IDs privately,
  retain retired choices and recall selections from the real offline snapshot
  cache. The access pilot is two waters, not complete statewide coverage.

Initial verification: 30 search/estimate checks and five metadata/conditional
HEAD checks pass. An estimate regression caught a concurrent accumulator bug;
the fix waits for each body length before adding it to the shared total.

Outage verification: 61 API/evaluation/migration checks and 13 watch UI checks
pass; API compilation and web typechecking pass.

Preview verification: 34 API/builder/owner checks and eight admin UI/auth checks
pass. Access/trip verification: 32 web checks, 13 content-gate checks and two
shared-schema checks pass. Full integration and mobile/offline verification are
in progress. The contract coverage gate detected missing direct coverage of the
new shared wording functions; that coverage is being completed before rerunning.

Production merge/configuration and physical-phone push delivery remain separate
from local implementation. Official-source review will be identified as such;
no in-person site visit will be invented.
