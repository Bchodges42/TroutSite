# F2 research notes — per-species comfort & activity reference data (DRAFT)

Stage-2 scope. Nothing here is wired into builds or validators yet; the draft
YAML lives beside this file (`f2-species-reference.yaml`). Status: research
draft for the F2 content pack. Every shippable value must carry a `sourceUrl`;
values still lacking a verified source are marked `citationStatus: pending` and
MUST NOT be promoted into the content pack.

## What the fishability model needs (per F2 in KNOWN-ISSUES)

1. Comfort bands: lower-active, optimal range, upper-active, avoidance, lethal.
2. Spawn thresholds: pre-spawn / spawning / post-spawn water-temp triggers.
3. Flow-trend preference (stable/falling favorable; hard-rising unfavorable).
4. Pressure-trend sensitivity.

## Evidence found (2026-09-12)

- **Crappie — TWRA (Watts Bar Reservoir page, official):** white crappie spawn
  at 60–65°F; black crappie later, 62–68°F.
  https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/watts-bar-reservoir.html
- **Smallmouth — Little River Outfitters (TN local, primary observation):**
  spawn 55–70°F; most active feeding 68–80°F.
  https://littleriveroutfitters.com/pages/fishing/smallmouth-reproduction.html
- **Largemouth — In-Fisherman:** optimum 82–84°F cited for summer peak;
  anglers' comfort/activity zone ~65–75°F; spawn commonly 60–75°F (FishUSA:
  bass spawn 55–80°F across species, largemouth at the warm end).
  https://www.in-fisherman.com/editorial/largemouth-bass-temperature-thermoclines/494247
  https://www.fishusa.com/learn/when-do-bass-spawn/
- **Spotted bass — FishUSA/MLF (general bass range):** spawn mid-range of the
  55–80°F bass window (~60–70°F); comfort between smallmouth and largemouth.
  Needs a species-specific primary source before shipping → pending.
- **Channel catfish — CatfishNow (aggregates state-agency spawn data):** spawn
  70–85°F, optimum ~80–81°F.
  https://catfishnow.com/spawning-time-facts/
- **Bluegill — University of Missouri Extension (peer-reviewed extension
  publication):** most bluegill spawn at a minimum of 74°F, repeating through
  summer. https://extension.missouri.edu/publications/g9473
- **Striped bass — NOT yet sourced to citation standard.** Well-known
  management facts (prefer ≤ ~72°F, summer stress in the mid-70s°F, TN
  reservoir stripeds rely on cool tailwater refuges July–Sept) need a primary
  citation (TWRA reservoir page or peer-reviewed) before any value ships.
- **Flow-trend preference — no species-specific primary literature found yet.**
  The F2 spec's default (stable/falling favorable, hard-rising unfavorable)
  stays a heuristic until per-species citations exist.
- **Barometric pressure — weak evidence culture-wide.** Consistent with F12's
  exclusion reasoning: mark any pressure-trend weighting as `heuristic`,
  low confidence, and expect Stage-2 review to keep contributions small or
  defer. No value ships without a source even then.

## Gaps to close before the F2 validator lands

1. Primary sources (TWRA reservoir/species pages or peer-reviewed) for:
   spotted bass bands, striped bass bands + summer-refuge stress thresholds,
   crappie comfort band (only spawn temps are TWRA-sourced so far), and
   every flow-trend/pressure preference.
2. Lethal / avoidance temperatures for all species (upper incipient lethal,
   lower active cutoff) — these exist in the thermal-tolerance literature
   (e.g., EPA temperature criteria documents); fetch per species.
3. Consistent units decision: literature is °F; the scorer consumes °C — the
   YAML carries both, with °C as canonical (converted values noted).
