"""Rebuild reviewed record selections and the 190-water baseline, offline.

Selections below are exact reviewed locality/date groups, not search-engine
classifications. Counts are occurrence rows/taxon names, never fish abundance.
"""
import collections
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n",
                    encoding="utf-8", newline="\n")


def distance(feature, record):
    if "decimalLongitude" not in record or "decimalLatitude" not in record:
        return None
    lon, lat = record["decimalLongitude"], record["decimalLatitude"]
    sx, sy = 111320 * math.cos(math.radians(lat)), 111320
    lines = feature["geometry"]["coordinates"]
    if feature["geometry"]["type"] == "LineString":
        lines = [lines]
    best = float("inf")
    for line in lines:
        for a, b in zip(line, line[1:]):
            ax, ay = (a[0] - lon) * sx, (a[1] - lat) * sy
            bx, by = (b[0] - lon) * sx, (b[1] - lat) * sy
            dx, dy = bx - ax, by - ay
            den = dx * dx + dy * dy
            t = max(0, min(1, -(ax * dx + ay * dy) / den)) if den else 0
            best = min(best, math.hypot(ax + t * dx, ay + t * dy))
    return round(best)


# Exact accepted locality groups; all counties and dates were inspected.
GROUPS = {
    "west-fork-obey-river": ("obey", [
        ("West Fork Obey River, sampled ca. 300 m downstream of TN Hwy 52, upstream to confluence of Cowen Branch", "2020-03-11"),
        ("West Fork Obey River at TN Hwy 52, 14 km E of Livingston", "2002-04-19"),
    ]),
    "bradley-creek": ("bradley", [("Bradley Creek at Dean's Shop Rd", "2009-06-24")]),
    "reedy-creek": ("reedy", [
        ("Reedy Creek at Ollis Bowers Hill Rd., 8 km E of Kingsport", "2000-03-30"),
        ("Reedy Creek at US Hwy 11 bridge, ca 5 mi E of Kingsport.", "1969-03-22"),
    ]),
    "little-chuckey-creek": ("chucky", [
        ("Little Chucky Creek at Denver Bible Rd. (Bible Branch Rd.), 2.4 mi E of Warrensburg (Nolichucky River)", "2001-05-02"),
        ("Little Chucky Creek from Bible Branch Road upstream ca. 300 m, 2.4 mi E of Warrensburg (Nolichucky River)", "1999-12-19"),
        ("Little Chucky Creek at Bible Branch Road, 2.1 mi E of Warrensburg (Nolichucky River)", "2000-03-24"),
        ("Little Chucky Creek at Denver Bible Rd. (Bible Branch Rd.), 4 airmi E of Warrensburg (Nolichucky River)", "2001-02-28"),
        ("Little Chucky Creek at mouth of Jackson Branch, 3.3 mi ESE of Warrensburg (Nolichucky River)", "2001-03-01"),
    ]),
    "dumplin-creek": ("dumplin", [
        ("Dumplin Cr., 5.8 mi. S of Jefferson City on Dondridge Hwy.", "1953-05-14"),
        ("Dumplin Cr. 6 mi. on Rt. 92 from Carson-Newman", "1953-03-05"),
        ("Dumplin Cr., 5.7 mi. SE of Jefferson City on St. Rd. 92", "1952-11-13"),
        ("Dumplin Cr., 5.7 mi. from Carson-Newman College on Dandridge Hwy. at bridge", "1952-11-13"),
    ]),
    "roaring-river": ("roaring", [
        ("Roaring River at Overton Road, 21 km due N of Cookeville", "2006-08-11"),
        ("Roaring River, off SR 136 (Standing Stone Hwy), 6.1 miles SW of Livingston TN", "2007-04-27"),
        ("Roaring R. at Rt. 136 bridge, about 13 airmi. N of Cookeville", "1966-09-11"),
        ("Roaring R., along Rt. 135 at 8.7 mi. N of Jackson-Putnam Co. line", "1965-06-11"),
    ]),
}


if __name__ == "__main__":
    ledger = read(REPO / "docs/research/2026-09-22-fishery-opportunities/ledger.json")
    waters = ledger["waters"]
    assert len(waters) == 190
    weak = [r for r in waters if r["headline"]["evidenceState"] != "documented"]
    write(ROOT / "baseline.json", dict(baseCommit="14a92bc302842050cb1354108b5f16436b765504",
        criterion="headline.evidenceState != documented", catalogCount=len(waters),
        evidenceStateCounts=dict(collections.Counter(r["headline"]["evidenceState"] for r in waters)),
        weakCount=len(weak), waters=[dict(id=r["id"], name=r["name"], headline=r["headline"],
        unresolvedQuestion=r.get("unresolvedQuestion")) for r in weak]))
    features = {r["properties"]["id"]: r for r in read(REPO / "apps/web/public/atlas/rivers.geojson")["features"]}
    findings = []
    for water, (term, groups) in GROUPS.items():
        capture = read(ROOT / "captures" / ("museum-" + term + ".json"))
        rows = [r for r in capture["records"] if (r.get("locality"), r.get("eventDate")) in groups]
        assert len(set(r["key"] for r in rows)) == len(rows)
        assert all(any(r.get("locality") == loc and r.get("eventDate") == date for r in rows) for loc, date in groups)
        events = []
        for loc, date in groups:
            eventrows = [r for r in rows if r.get("locality") == loc and r.get("eventDate") == date]
            events.append(dict(locality=loc, date=date, occurrenceRows=len(eventrows),
                               distinctTaxonNames=sorted(set(r["scientificName"] for r in eventrows))))
        for r in rows:
            r["catalogTraceDistanceM"] = distance(features[water], r)
            r["sourceUrl"] = "https://www.gbif.org/occurrence/" + str(r["key"])
        findings.append(dict(waterId=water, sourceCapture="captures/museum-" + term + ".json",
            occurrenceRows=len(rows), events=events, records=rows,
            limitation="Museum vouchers are positive historical observations. Selective preservation and incomplete methods prevent treating omitted trout as a complete-survey non-detection. Repeated specimen/tissue rows do not create independent survey events."))
        print(water, len(rows), "rows", len(set(r.get("eventDate") for r in rows)), "dates")
    write(ROOT / "reviewed-museum-records.json", findings)
    quarantine = []
    for term, water, keys in [("bradley", "bradley-creek", [624260725,624260711]),
                              ("reedy", "reedy-creek", [868410348])]:
        for r in read(ROOT / "captures" / ("museum-" + term + ".json"))["records"]:
            if r["key"] in keys:
                r["catalogTraceDistanceM"] = distance(features[water], r)
                r["reason"] = "Locality/county and coordinates disagree with mapped water; do not infer occupancy at the encoded coordinate."
                quarantine.append(r)
    write(ROOT / "quarantined-records.json", quarantine)
    manifest = []
    for p in sorted((ROOT / "captures").rglob("*")):
        if p.is_file():
            manifest.append(dict(path=p.relative_to(ROOT).as_posix(), bytes=p.stat().st_size,
                                 capturedFileSha256=hashlib.sha256(p.read_bytes()).hexdigest()))
    write(ROOT / "capture-manifest.json", manifest)
