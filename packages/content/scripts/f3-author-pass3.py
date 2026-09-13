#!/usr/bin/env python3
"""F3 pass-3 authoring: targetSpecies from TWRA's statewide regulation
exceptions (see research/f3-evidence-pass3.md). Idempotent."""
import re

URL = "https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html"
SRC = "  - label: TWRA — Statewide fishing regulation exceptions (species rule)\n    url: " + URL + "\n"

# id -> (keys, note sentence)
WATERS = {
    "north-fork-holston-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions set a smallmouth bass rule on this water: 13–17 in protected length range, one over 17 in per day.",
    ),
    "holston-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions set a smallmouth bass rule on this water: 13–17 in protected length range, one over 17 in per day.",
    ),
    "nolichucky-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions set a smallmouth bass rule on this water: 13–17 in protected length range, one over 17 in per day.",
    ),
    "french-broad-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions set smallmouth bass rules on this water: 18 in minimum on one reach, 13–17 in protected length range upstream.",
    ),
    "powell-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions set a smallmouth bass rule on this water: 13–17 in protected length range, one over 17 in per day.",
    ),
    "wolf-river-fentress": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions set a smallmouth bass rule on this water: 2 per day within a 16–21 in protected length range.",
    ),
    "pigeon-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions carry a smallmouth/black bass rule for this river.",
    ),
    "little-pigeon-river": (
        ["smallmouth-bass"],
        "TWRA's statewide regulation exceptions carry a smallmouth/black bass rule for this river.",
    ),
    "wolf-river-west-tennessee": (
        ["crappie"],
        "TWRA's statewide regulation exceptions include this river in the shared West Tennessee crappie rule: 30 per day, no length limit.",
    ),
    "obion-river": (
        ["crappie"],
        "TWRA's statewide regulation exceptions include this river in the shared West Tennessee crappie rule: 30 per day, no length limit.",
    ),
    "hatchie-river": (
        ["crappie"],
        "TWRA's statewide regulation exceptions include this river in the shared West Tennessee crappie rule: 30 per day, no length limit.",
    ),
}

for wid, (keys, sentence) in WATERS.items():
    fname = f"{wid}.yaml"
    s = open(fname).read()
    if "targetSpecies:" in s:
        print(f"SKIP {fname}")
        continue
    block = "targetSpecies:\n" + "".join(f"  - {k}\n" for k in keys)
    m = re.search(r"^notes:[ \t]*(>-| \||\|-|>-)?[ \t]*$", s, re.M)
    if m:
        start = m.end()
        lines = s[start:].split("\n")
        indent = None
        last = -1
        for i, ln in enumerate(lines):
            if ln.strip() == "":
                if indent is not None and i > last:
                    break
                continue
            im = re.match(r"^([ \t]+)", ln)
            if not im:
                break
            if indent is None:
                indent = im.group(1)
            if not ln.startswith(indent):
                break
            last = i
        assert indent is not None and last >= 0, fname
        lines.insert(last + 1, f"{indent}{sentence} (see officialSources).")
        s = s[:start] + "\n".join(lines)
    else:
        m2 = re.search(r"^(notes:[ \t]+\S.*)$", s, re.M)
        assert m2, fname
        s = s[:m2.start(1)] + m2.group(1).rstrip() + f" {sentence} (see officialSources)." + s[m2.end(1):]
    assert s.endswith("\n"), fname
    s += SRC
    open(fname, "w").write(s)
    print(f"{fname}: +targetSpecies {' '.join(keys)}")
