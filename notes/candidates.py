"""Candidate featured sets + statewide first-paint simulation.

Mirrors apps/web/src/features/map/labelPolicy.ts labelDecision exactly
(FEATURED_ANCHOR_SUBORDINATE_LABELS=true). Reads notes/catalog-signals-seed.json.
Run: python notes/candidates.py
"""
import json
from collections import defaultdict

rows = json.load(open('notes/catalog-signals-seed.json', encoding='utf-8'))
MONTH = 9  # September 2026 — today's first paint

# ---- R1: signature trout tailwaters (species trout + fishery tailwater) ----
R1 = sorted(w for w, v in rows.items()
            if v.get('species') == 'trout' and v.get('fishery') == 'tailwater'
            and w != 'watauga-river-wilbur-reach')  # reach of watauga-river, stays standard
# ---- R2: major trout lakes (species trout, lake, stocked, real reservoir fishery) ----
R2 = ['dale-hollow-lake', 'south-holston-lake', 'watauga-lake', 'chilhowee-lake',
      'calderwood-lake', 'fort-patrick-henry-lake']
# marginal: tellico-lake (reach-limited stocking) — candidate A demotes, B keeps
# ---- R3: grand-region anchors (smallest set so no grand region opens empty) ----
R3 = {
    'piney-river-rhea': 'tn-cumberland-plateau anchor — year-round DH-style stocked Plateau stream',
    'little-river': 'tn-east-smokies anchor — Little River (Smokies/Blount), TWRA-dated stocking + park trout corridor',
    'harpeth-river': 'tn-middle-nashville anchor — December-stocked urban fishery, most-fished Middle trout river',
    'shelby-farms-lake': 'tn-west anchor — Memphis winter put-and-take, most-fished West trout water (titles Nov-Mar only)',
}
R3_B = {
    'tellico-lake': 'kept featured (candidate B): major reservoir, reach-limited trout (upper arm, Feb-Apr)',
    'tennessee-river': 'kept featured (candidate B): geographic spine, dim subordinate context in trout mode',
    'mississippi-river': 'kept featured (candidate B): geographic spine, dim subordinate context in trout mode',
}
# Candidate B additionally flips FEATURED_WARMWATER_CONTEXT: featured plain-warmwater
# anchors stay VISIBLE as dim subordinate context in trout mode instead of being
# excluded by the 2026-09-07 campaign rule.

CANDIDATE_A = sorted(set(R1) | set(R2) | set(R3))
CANDIDATE_B = sorted(set(CANDIDATE_A) | set(R3_B))
CURRENT = sorted(w for w, v in rows.items() if v.get('display') == 'featured')

GRAND = {'tn-west': 'West', 'tn-middle-duck-elk': 'Middle', 'tn-middle-nashville': 'Middle',
         'tn-middle-caney-fork': 'Middle', 'tn-upper-cumberland': 'Middle',
         'tn-cumberland-plateau': 'Middle', 'tn-east-clinch': 'East', 'tn-east-holston': 'East',
         'tn-northeast-watauga': 'East', 'tn-east-smokies': 'East',
         'tn-east-pigeon-frenchbroad': 'East', 'tn-se-hiwassee': 'East'}


# Species fills proposed by manifest section B (source: SPECIES-CLASSIFICATION.md,
# TWRA-cited; wave ledgers where noted). Plain-warmwater (no stockingProgram) is
# EXCLUDED from trout mode by the 2026-09-07 campaign rule, so after fills these
# leave the trout-mode map entirely.
WARMWATER_FILLS = [
    'watts-bar-lake', 'chickamauga-lake', 'kentucky-lake', 'reelfoot-lake', 'pickwick-lake',
    'old-hickory-lake', 'j-percy-priest-lake', 'center-hill-lake', 'tims-ford-lake',
    'norris-lake', 'cherokee-lake', 'douglas-lake', 'boone-lake', 'fort-loudoun-lake',
    'tennessee-river', 'mississippi-river', 'lake-barkley', 'duck-river-lower',
    'buffalo-river', 'french-broad-river', 'cumberland-river', 'duck-river-mouth',
    'obed-river',  # wave-3 ledger + NPS: warmwater, zero salmonids (medium confidence)
]


def apply_candidate(candidate):
    """Return (set_featured, set_standard) applying the candidate: candidate -> featured;
    current featured not in candidate -> standard. Everything else keeps its authored tier."""
    featured = set(candidate)
    demoted = [w for w in CURRENT if w not in featured]
    return featured, demoted


def label_decision(water, ctx_mode='trout', zoom=5.7, month=MONTH, selected=False,
                   featured=(), demoted=(), filled_warm=(), interim=False,
                   featured_warm_context=False):
    """Python mirror of labelPolicy.labelDecision + species fills + the candidate-B
    featured-warmwater-context rule. interim=True models the branch as-is (2a
    subordinate labels, species still unset)."""
    v = rows.get(water, {})
    species = v.get('species')
    display = v.get('display')
    if water in featured:
        display = 'featured'
    elif water in demoted and display == 'featured':
        display = 'standard'
    if not interim and water in filled_warm:
        species = 'warmwater'
    if selected:
        return 'titled'
    sm = v.get('seasonMonths')
    if isinstance(sm, str):
        sm = [int(x) for x in sm.strip('[]').split(',') if x.strip()]
    elif isinstance(sm, list):
        sm = [int(x) for x in sm]
    yr = v.get('yearRound')
    if sm is None and yr is False:
        sm = [11, 12, 1, 2, 3]
    if species == 'trout' and sm is not None and month not in sm:
        return 'hidden'  # seasonalAbsent
    if ctx_mode == 'trout':
        if species == 'warmwater':
            stocked = v.get('stockingProgram')
            if stocked:
                return 'subordinate' if display == 'featured' else 'hidden'  # deemphasize, dim
            if display == 'featured' and featured_warm_context:
                return 'subordinate'  # candidate B: geographic anchors stay dim-labeled
            return 'hidden'  # plain warmwater: excluded from trout mode entirely
        if species is None and display == 'featured':
            return 'subordinate'
        if species is None:
            return 'hidden'
    if display == 'reference':
        return 'hidden'
    if display == 'featured':
        return 'titled'
    return 'hidden'  # standard at statewide zoom


def first_paint(candidate, mode='trout', month=MONTH, interim=False, fills=True,
                featured_warm_context=False):
    """Per-grand-region visible labels at statewide zoom under the candidate."""
    featured, demoted = apply_candidate(candidate)
    out = defaultdict(list)
    for w, v in rows.items():
        verdict = label_decision(w, mode, month=month, featured=featured, demoted=demoted,
                                 filled_warm=WARMWATER_FILLS if fills else (), interim=interim,
                                 featured_warm_context=featured_warm_context)
        if verdict != 'hidden':
            out[GRAND.get(v.get('regionId'), '?')].append((w, verdict))
    return out


if __name__ == '__main__':
    print(f'CURRENT featured: {len(CURRENT)}  | candidate A: {len(CANDIDATE_A)}  | candidate B: {len(CANDIDATE_B)}')
    print(f'R1 tailwaters ({len(R1)}): {R1}')
    print(f'R2 major trout lakes ({len(R2)}): {R2}')
    print(f'R3 anchors: {json.dumps(R3, indent=1)}')
    print()
    views = [
        ('CURRENT (branch: 2a fix, species unset)', CURRENT, dict(interim=True)),
        ('A interim (2a, species unset)', CANDIDATE_A, dict(interim=True)),
        ('A end-state (tiers + species fills)', CANDIDATE_A, dict()),
        ('B end-state (A + spine/context + tellico)', CANDIDATE_B, dict(featured_warm_context=True)),
    ]
    for name, cand, kw in views:
        fp = first_paint(cand, **kw)
        print(f'== {name} — trout mode, Sept (z=5.7):')
        for g in ('West', 'Middle', 'East'):
            titled = [w for w, vd in sorted(fp.get(g, [])) if vd == 'titled']
            sub = [w for w, vd in sorted(fp.get(g, [])) if vd == 'subordinate']
            print(f'   {g:7s} titled={len(titled):2d} {titled}')
            if sub:
                print(f'           dim/subordinate={len(sub):2d} {sub}')
        print()
    for name, cand in (('A end-state', CANDIDATE_A), ('B end-state', CANDIDATE_B)):
        fp = first_paint(cand, month=11)
        print(f'== {name} — trout mode, November (winter program live):')
        for g in ('West', 'Middle', 'East'):
            print(f'   {g:7s} {sorted(w for w, _ in fp.get(g, []))}')
        print()
    fp = first_paint(CANDIDATE_A, mode='all')
    tot = sum(1 for _, lst in fp.items() for _ in lst)
    print(f'candidate A end-state, ALL-fish mode Sept statewide titles: {tot} '
          '(featured set only; demoted majors title from z=9.5 like today\'s standard waters)')
    json.dump({'candidateA': CANDIDATE_A, 'candidateB': CANDIDATE_B, 'current': CURRENT,
               'demotedByA': apply_candidate(CANDIDATE_A)[1], 'demotedByB': apply_candidate(CANDIDATE_B)[1],
               'warmwaterFills': WARMWATER_FILLS},
              open('notes/candidates.json', 'w'), indent=1)
