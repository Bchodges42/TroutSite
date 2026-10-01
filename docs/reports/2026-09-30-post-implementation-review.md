# Post-implementation review and repairs — 2026-09-30

Review in progress. Scope: the 48 audit remediations and the accepted site-improvement plan (six polishes, ten visitor features, three broader improvements). This report will distinguish verified implementation from remaining data/device/configuration work.

Reviewed starting point: `feat/site-improvement-20260930 @ 73cf827`, including the merged audit remediation. Own clone/branch: `trout-post-implementation-review-20260930` / `codex/post-implementation-review-20260930`, created from `origin/main @ 14a92bc` before fast-forwarding the completed work. No production changes or real visitor/owner notifications.

## Verified defects being repaired

| ID | Priority | Problem | Repair / verification |
|---|---|---|---|
| R01 | P1 | Push sender passed an endpoint string and discarded encryption keys; real web-push requires a subscription, payload, and options. | Correct adapter; real library generates an encrypted request locally without network. |
| R02 | P1 | Arbitrary HTTP/HTTPS push endpoints enabled server requests to user-chosen hosts. | HTTPS browser-provider allowlist, valid key encoding/curve checks, delivery-time guard for legacy rows. |
| R03 | P1 | Endpoint-only upsert replaced another subscription's keys and disclosed its controlling ID. | Require matching original encryption/auth keys; mismatch fails without modifying or exposing the capability. |
| R04 | P1 | Failed/dry-run sends consumed alert transitions and job health remained green. | Only acknowledged delivery updates notification memory; failure remains retryable and degrades job health. |
| R05 | P2 | A below watch also fired on rising temperatures. | Direction-specific firing with silent rearming. |
| R06 | P1 | No service-worker push display/click handler. | Worker notification handling, digest copy, same-origin safe deep links. |
| R07 | P1 | Alerts scheduled only in dev node-cron; canonical Windows production had no evaluation job. | Explicit dispatcher job and deploy-stamp-guarded schtasks entry; installation remains an owner rollout step. |
| R08 | P2 | Future stocking dates repeatedly satisfied the new-item test after every cooldown; alert matching diverged from the water pages. | Durable publication identity plus shared county/alias matcher. |
| R09 | P2 | Quiet hours assumed all Tennessee was in Central time. | Explicit validated IANA zone, preserving existing rule behavior through an additive migration. |
| R10 | P1 | Workbox's snapshot/terrain routes bypassed the pinned pack fallback; pinned terrain was subject to disposable runtime-cache expiration. | Route error fallback to separate pinned cache; browser proof pending. |
| R11 | P1 | New private live APIs matched the broad snapshot offline-cache rule, and capability URLs entered request logs. | Network-only live routes and sanitized logging; regression checks pending. |
| R12 | P2 | Corrections had a 90-day purge function with no scheduler caller. | Maintenance in the explicit watch dispatcher, including when push is disabled. |

## Initial checks

- Recursive production build passed; install/route bundle budgets passed.
- Initial recursive tests selected Windows' WSL launcher for Bash-dependent tests. With Git Bash on PATH, API baseline: 430 passing, two 5-second load timeouts in existing alert-transition tests. These require a bounded rerun after repairs.
- Web baseline: 730 passing, one skipped generated-snapshot test, one mobile test whose assertion accepted `undefined` and returned a null disclosure before loading completed. Repair the assertion and verify the actual UI.
- New push regression suite: all 12 checks failed before the initial fixes; all 12 passed afterward. Additional publication/timezone/scheduler checks are being added.

## Coverage and final validation

Pending completion of the remaining source review and integration checks. Do not treat this interim document as final approval.
