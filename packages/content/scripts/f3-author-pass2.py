#!/usr/bin/env python3
"""F3 pass-2 authoring: add targetSpecies + sourced note sentence + TWRA source
to catalog waters from the TWRA where-to-fish pages (see research/f3-evidence-pass2.md).
Idempotent: skips waters that already carry targetSpecies."""
import sys, re

KEY_ORDER = ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish", "striped-bass"]
KEY_NAMES = {
    "largemouth-bass": "largemouth bass", "smallmouth-bass": "smallmouth bass",
    "spotted-bass": "spotted bass", "crappie": "crappie", "bluegill": "bluegill",
    "channel-catfish": "catfish", "striped-bass": "striped bass",
}
R = "https://www.tn.gov/twra/fishing/where-to-fish/"

# id, twra label, url path, keys
WATERS = [
    ("cherokee-lake", "Cherokee Reservoir", "east-tennessee-r4/cherokee-reservoir.html", 7),
    ("watts-bar-lake", "Watts Bar Reservoir", "cumberland-plateau-r3/watts-bar-reservoir.html", 7),
    ("chickamauga-lake", "Chickamauga Reservoir", "cumberland-plateau-r3/chickamauga-reservoir.html", 7),
    ("norris-lake", "Norris Reservoir", "east-tennessee-r4/norris-reservoir.html", 7),
    ("tims-ford-lake", "Tims Ford Reservoir", "middle-tennessee-r2/tims-ford-reservoir.html", 7),
    ("kentucky-lake", "Kentucky Reservoir", "west-tennessee-r1/kentucky-reservoir.html", 7),
    ("pickwick-lake", "Pickwick Reservoir", "west-tennessee-r1/pickwick-reservoir.html", 7),
    ("lake-barkley", "Barkley Reservoir", "west-tennessee-r1/barkley-reservoir.html", 7),
    ("old-hickory-lake", "Old Hickory Reservoir", "middle-tennessee-r2/old-hickory-reservoir.html", 7),
    ("j-percy-priest-lake", "J. Percy Priest Reservoir", "middle-tennessee-r2/percy-priest-reservoir.html", 7),
    ("douglas-lake", "Douglas Reservoir", "east-tennessee-r4/douglas-reservoir.html", 7),
    ("fort-loudoun-lake", "Fort Loudoun Reservoir", "east-tennessee-r4/fort-loudoun-reservoir.html", 7),
    ("melton-hill-lake", "Melton Hill Reservoir", "east-tennessee-r4/melton-hill-reservoir.html", 7),
    ("tellico-lake", "Tellico Reservoir", "east-tennessee-r4/tellico-reservoir.html", 7),
    ("boone-lake", "Boone Reservoir", "east-tennessee-r4/boone-lake.html", 7),
    ("fort-patrick-henry-lake", "Fort Patrick Henry Reservoir", "east-tennessee-r4/fort-patrick-henry.html", 7),
    ("south-holston-lake", "South Holston Reservoir", "east-tennessee-r4/south-holston-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("watauga-lake", "Watauga Reservoir", "east-tennessee-r4/watauga-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("chilhowee-lake", "Chilhowee Reservoir", "east-tennessee-r4/chilhowee-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("calderwood-lake", "Calderwood Reservoir", "east-tennessee-r4/calderwood-lake.html", ["largemouth-bass", "smallmouth-bass", "crappie", "bluegill", "channel-catfish"]),
    ("center-hill-lake", "Center Hill Reservoir", "cumberland-plateau-r3/center-hill-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("dale-hollow-lake", "Dale Hollow Reservoir", "cumberland-plateau-r3/dale-hollow-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("nickajack-lake", "Nickajack Reservoir", "cumberland-plateau-r3/nickajack-reservoir.html", 7),
    ("parksville-lake", "Parksville Reservoir", "cumberland-plateau-r3/parksville-reservoir.html", ["largemouth-bass", "spotted-bass", "crappie", "bluegill"]),
    ("great-falls-lake", "Great Falls Reservoir", "cumberland-plateau-r3/great-falls-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("normandy-lake", "Normandy Reservoir", "middle-tennessee-r2/normandy-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("woods-reservoir", "Woods Reservoir", "middle-tennessee-r2/woods-reservoir.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "crappie", "bluegill", "channel-catfish"]),
    ("duck-river-lower", "Duck River", "middle-tennessee-r2/duck-river.html", ["largemouth-bass", "smallmouth-bass", "spotted-bass", "channel-catfish"]),
    ("lake-graham", "Lake Graham", "west-tennessee-r1/lake-graham.html", ["largemouth-bass", "crappie", "bluegill", "channel-catfish"]),
]

sel = set(sys.argv[1:])
for wid, label, path, keys in WATERS:
    if sel and wid not in sel:
        continue
    if keys == 7:
        keys = KEY_ORDER
    fname = f"{wid}.yaml"
    s = open(fname).read()
    if "targetSpecies:" in s:
        print(f"SKIP {fname} (already authored)")
        continue
    key_list = "".join(f"  - {k}\n" for k in keys)
    names = ", ".join(KEY_NAMES[k] for k in keys)
    block = f"targetSpecies:\n{key_list}"
    assert re.search(r"^notes:", s, re.M), fname
    s = re.sub(r"^notes:", block + "notes:", s, count=1, flags=re.M)
    # append the sourced sentence as the LAST line of the notes block (or onto
    # an inline single-line notes scalar).
    m = re.search(r"^notes:[ \t]*(>-|\||\|-|>-\-)?[ \t]*$", s, re.M)
    if m:
        block_m = re.compile(r"^([ \t]+)\S")
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
        lines.insert(last + 1, f"{indent}TWRA's {label} page lists the fishery as {names} (see officialSources).")
        s = s[:start] + "\n".join(lines)
    else:
        m2 = re.search(r"^(notes:[ \t]+\S.*)$", s, re.M)
        assert m2, fname
        s = s[:m2.start(1)] + m2.group(1).rstrip() + f" TWRA's {label} page lists the fishery as {names} (see officialSources)." + s[m2.end(1):]
    # officialSources entry at end of file
    entry = f"  - label: TWRA — {label} fishing (species list)\n    url: {R}{path}\n"
    assert s.endswith("\n"), fname
    s += entry
    open(fname, "w").write(s)
    print(f"{fname}: +targetSpecies ({len(keys)}) + source")
