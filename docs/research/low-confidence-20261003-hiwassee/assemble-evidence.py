"""Rebuild exact reviewed groups, limited leads, exclusions, and capture hashes.

Discovery results include other waters and non-fish. Selective museum lots
establish positive dated presence, not a complete assemblage or trout absence.
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
spec = importlib.util.spec_from_file_location("prior_evidence", ROOT.parent / "low-confidence-20261003/assemble-evidence.py")
prior = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prior)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    captures = {term: read(ROOT / "captures" / ("museum-" + term + ".json"))["records"] for term in ("chestuee", "chestua", "candies", "oostanaula", "mouse")}
    features = {f["properties"]["id"]: f for f in read(REPO / "apps/web/public/atlas/rivers.geojson")["features"]}
    groups = {
        "south-mouse-creek": ("2018-08-30", "South Mouse Creek, Hiwassee-Tennessee Drainage, NorthWest Lauderdale Memorial Hwy (Rd. 308) Crossing", 7),
        "north-mouse-creek": ("1936-09-25", "North Mouse Creek, trib to lower Hiwassee River", 13),
    }
    reviewed = []
    for water, (date, locality, count) in groups.items():
        rows = [dict(r) for r in captures["mouse"] if r.get("eventDate") == date and r.get("locality") == locality]
        assert len(rows) == count
        for r in rows:
            r["catalogTraceDistanceM"] = prior.distance(features[water], r)
            r["sourceUrl"] = "https://www.gbif.org/occurrence/" + str(r["key"])
        reviewed.append(dict(waterId=water, date=date, locality=locality, occurrenceRows=count,
                             distinctTaxonNames=sorted({r["scientificName"] for r in rows}),
                             records=rows, limitation="One collecting event; museum rows and specimen/tissue preparations must not be added as independent fish or surveys. No capture effort or complete community list is supplied."))
    write("reviewed-records.json", reviewed)
    lead = next(dict(r) for r in captures["candies"] if r["key"] == 4521289664)
    lead["catalogTraceDistanceM"] = prior.distance(features["candies-creek"], lead)
    lead["status"] = "QUALIFIED HISTORICAL LEAD: locality Candes Creek near Cleveland is compatible with Candies, but georeference explicitly assumed, uncertainty 19,401 m, identification only Catostomidae; encoded 5 m map distance is not reach precision."
    write("qualified-leads.json", [lead])
    exclusions = []
    for term in ("chestuee", "oostanaula", "mouse", "candies"):
        for r in captures[term]:
            loc = r.get("locality", "")
            reason = None
            if term == "chestuee" and loc.startswith(("Hiwassee", "Hiwasee")):
                reason = "Receiving Hiwassee River above Chestuee mouth, not a Chestuee Creek occurrence."
            elif term == "oostanaula" and loc.startswith("Hiwassee"):
                reason = "Receiving Hiwassee River below Oostanaula confluence, not an Oostanaula Creek occurrence."
            elif term == "oostanaula" and loc.startswith("Conasauga"):
                reason = "Different river; discovery matched additional indexed context, and coordinates are a known suspicious Tennessee default."
            elif term == "mouse" and loc in ("Spring Branch, N Mouse Creek", "Arnwine Spring Creek, branch of N Mouse Creek, ca 5 mi north of Athens; Hiwassee drainage"):
                reason = "Explicit named tributary, not North Mouse main stem."
            elif r["key"] == 5103660854:
                reason = "Queen snake, collected alive on road; not fish evidence."
            if reason:
                exclusions.append(dict(r, reason=reason))
    write("excluded-records.json", exclusions)
    manifest = [dict(path=p.relative_to(ROOT).as_posix(), bytes=p.stat().st_size,
                     sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sorted((ROOT / "captures").iterdir()) if p.is_file()]
    write("capture-manifest.json", manifest)
    print("Reviewed", sum(r["occurrenceRows"] for r in reviewed), "rows,", len(reviewed), "waters; one qualified lead; excluded", len(exclusions), "rows")
