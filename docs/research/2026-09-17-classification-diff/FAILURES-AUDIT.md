# FAILURES AUDIT — habitat-semantics run (2026-09-17, 190 waters)

Systematic pass: all 8 reviewed waters, 14 tailwater-class waters, 8 wild
GSMNP waters, 7 owner-stripped warmwaters, low-confidence set, consistency
flags. Clean: tailwaters 10/14 OK, wild waters 7/8 OK, stripped warmwaters
6/7 OK, reviewed 8/8 effective.

## Real model failures (2)

1. **middle-prong-little-pigeon → warmwater-winter-stocked (conf 0.28)**.
   GSMNP wild water; the composite documents a Spring stocking program
   (months [2,3,4,5,10,11]) AND the ledger class is 'mixed' (wild + stocked).
   Correct answer: trout-stream-year-round. Cause: ambiguous evidence
   (Spring program + mixed ledger) and the model read thin — its siblings
   (West Prong, LeConte) classified correctly.
2. **tellico-river → warmwater-winter-stocked (conf 0.38)**. The composite
   documents an 11-month stocking window (Feb–Dec). A water stocked
   essentially year-round contradicts the winter-stocked criterion "they do
   not survive the summer" — the model under-called; should have been
   trout-stream-year-round at low confidence, or at minimum carried the
   consistency flag.

## Open owner boxes (consistent with known conflicts, not new failures)

3. **red-river-clarksville → winter-stocked**: TWRA currently stocks it
   (live feed + schedule) against the 2026-09-15 warmwater strip. Owner box.
4. **holston-river → winter-stocked**: composite marks the feed-vs-schedule
   program conflict; segment spans the cold Cherokee tailwater reach and
   warmer downstream water. Owner box.

## Judgment calls needing owner eyes

5. **wilbur-lake → winter-stocked**: composite calls it Tailwater; wave-1
   documents Mar–Jul stocking on a cold small lake — plausibly a year-round
   trout lake. Owner call.
6. **elk-river-lower → winter-stocked**: probably correct (lower Elk warms
   away from the Tims Ford releases), but the Tailwater program class
   warrants a look.
7. **fort-patrick-henry-lake**: winter-stocked with 12/12 month presence —
   consistency flag. On the nine-trout-reservoir list; decide between
   winter-stocked and year-round.
8. **south-fork-cumberland → trout-stream-year-round with 0/12 months**
   (carried flag): the ledger's "uncorroborated wild claim" — verify or
   strike.

## Clean

- Reviewed 8/8 effective (2 overrides: dale-hollow + south-holston-lake,
  both now owner-reversed to winter/seasonal — those MATCH raw).
- All 7 stripped warmwaters correct except red-river (open box above).
- No water with a documented wild/mixed class other than Middle Prong was
  misclassified.
