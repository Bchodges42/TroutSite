# ADR 0011. Reach-split fishery value `wild+stocked`

- **Status:** accepted
- **Date:** 2026-09-24
- **Decider:** owner (triage decision 2026-09-24), applied by the triage-apply lane

## Context

Six named waters — little-river, tellico-river, middle-prong-little-pigeon,
cosby-creek, leconte-creek, roaring-fork — each carry a documented WILD reach
(NPS park reaches with no stocking since 1975; Tellico's wild reproduction
above North River) and a documented TWRA-STOCKED reach (below-park Gatlinburg
program rows, Walland/Maryville reaches, the Tellico corridor) on the same
catalog feature. The `fishery` field held one value, so every choice was
technically wrong for one reach. The 2026-09-24 owner triage adopted encoding
the split in the field itself.

## Decision

1. `Stream.fishery` (contracts 2.4.0) gains `wild+stocked` additively. The
   water's `notes` state the reach split (which reach is wild, which is
   stocked) — the field alone never implies which reach is which.
2. `fisheryType()` buckets `wild+stocked` as `stocked` for the legend/
   grouping (the stocking program is the countable fact; the wild reach is
   carried in the water's own words), the same way a `mixed` opportunity
   headline keeps its warmwater class outline rules.
3. Authored only where both halves are documented (the six waters above);
   absent stays "evidence does not reach — never guessed."

## Consequences

- The map/legend need no change (bucket behavior only).
- Any future reach-split water needs both halves evidenced before the value
  is authored; the ledger's claims remain the provenance layer.
