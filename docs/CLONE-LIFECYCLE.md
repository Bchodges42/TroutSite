# CLONE-LIFECYCLE — rules for trout-* working copies on the dev machine

Written 2026-09-17 by the `cleanup-purge` lane after surveying 39 `trout-*`
entries in `C:\Users\Benjamin\Projects` (31 git clones, 5 non-git snapshots,
2 stray selftest scripts, 1 plan workspace). Rules are binding for future lanes.

## The rules

1. **A clone is disposable when nothing in it is unique.** Unique = any local
   branch tip (not just the checked-out one) that is neither an ancestor of
   GitHub `main` nor the tip of a branch on GitHub. Verify with
   `git ls-remote` + `git merge-base --is-ancestor` against the *fresh* refs —
   never against a clone's own stale `origin/main`.
2. **Rescue before delete.** A clone holding unique commits gets its branch
   pushed to GitHub as-is (never merged, never judged). Push with the explicit
   GitHub URL — many codex-era clones have `origin` pointing at *another local
   clone*, so a bare `git push` silently pushes to a local path.
3. **Untracked scratch (notes/, session dirs) is not work.** Copy anything that
   looks like a deliverable into the plan workspace, then delete the clone.
   A modified *tracked* file must be inspected before its clone is deleted.
4. **Keep-list floor:** the shared tree `trout` (serves the dev pm2 stack),
   `trout-merge-test` (QA tree), and the current lane's own clone.
5. **Owner-parked trees are not deletable** even when abandoned — deletion
   destroys uncommitted work irrecoverably (2026-09: `trout-redesign`).
6. **Non-git full-tree snapshots older than the last campaign are deleted**
   after a `find -newermt <campaign-start>` check proves nothing recent or
   deliverable-shaped is inside.
7. **Delete the same day a lane's branch is merged.** The four-lane merge
   session left 29 clones behind; this document exists because that pile
   happens every campaign otherwise.

## Applied 2026-09-17 (this purge)

- **Rescued to GitHub (pushed as-is, not merged):** `fishability/model`
  (from `trout-fishability`), `codex/trout-fieldwork-20260904` (from
  `trout-geometry`), `proto/prerender` (from `trout-s3-proto`). Machine-wide
  scan proved these were the only 3 branch tips unique to local disks.
- **Deleted (29 clones):** every clone whose HEAD + all local branch tips were
  ancestors of GitHub `main` @ d1e48d1 (the four lane merges absorbed them), or
  whose branch was already pushed — incl. `trout-atlas-geometry`,
  `trout-hit-selection`, `trout-prominence`, `trout-host-fix`,
  `trout-codex-verify-20260915`, both `trout-luna-*`, `trout-research`,
  all `trout-s1/s2/s3`, the codex-fieldwork leftovers, and others.
- **Deleted (5 non-git snapshots):** `trout-api`, `trout-content`,
  `trout-growth`, `trout-livefix-repro`, `trout-web` — pre-2026-09-10 full-tree
  copies, zero files newer than 2026-09-10, no git history to lose.
- **Kept:** `trout` (floor), `trout-merge-test` (floor), `trout-cleanup`
  (lane clone), `trout-redesign` (owner-parked, 34 uncommitted files —
  rescue explicitly cancelled by owner 2026-09-17; not judged, not deleted).
- **Kept (stray files, harmless):** `trout-autoupdate-selftest.sh`,
  `trout-selftest.sh` (copies of merged infra selftests).
