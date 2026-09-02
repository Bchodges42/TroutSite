# ADR template (copy to 000N-short-title.md)

Copy this file to `docs/adr/000N-short-title.md` (N continues the sequence) when a decision needs
recording: any deviation from the pinned stack (§4), any additive change to `@trout/contracts` (§6),
or any new runtime dependency.

```markdown
# 000N. Short title of the decision

- **Status:** proposed | accepted | superseded by 000M
- **Date:** YYYY-MM-DD
- **Decider:** ROLE n

## Context

What problem forces a decision? Constraints (offline-first, privacy, Windows/Git Bash, no Docker)?

## Decision

The change we're making, stated precisely (configs, dependency names/versions, contract fields).

## Consequences

What becomes easier/harder. Migration or contract-tag impact (e.g. contracts-v1.0.1).

## Alternatives considered

One line each on the options rejected and why.
```
