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

Initial verification: 30 search/estimate checks and five metadata/conditional
HEAD checks pass. An estimate regression caught a concurrent accumulator bug;
the fix waits for each body length before adding it to the shared total.

Next: separately selectable source-outage/recovery watches, exact candidate
publication preview/operations visibility, sourced access records and private
trip access selection. Full integration and mobile/offline verification follow.

Production merge/configuration and physical-phone push delivery remain separate
from local implementation. Official-source review will be identified as such;
no in-person site visit will be invented.
