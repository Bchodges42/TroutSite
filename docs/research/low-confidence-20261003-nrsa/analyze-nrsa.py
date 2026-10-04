"""Join captured EPA visits by site, visit number, and date; flag reach leads.

The 1819 fish table predates the site-table UID revision. Never join its UID
blindly. All source fields and all Tennessee count rows remain in the output.
Nearest catalog lines are discovery leads only, not automated reach matches.
"""
import collections
import csv
import datetime
import gzip
import io
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]


def load(name):
    raw = gzip.decompress((ROOT / "captures" / (name + ".csv.gz")).read_bytes())
    encoding = "utf-8-sig"
    try:
        text = raw.decode(encoding)
    except UnicodeDecodeError:
        encoding = "cp1252"
        text = raw.decode(encoding)
    return list(csv.DictReader(io.StringIO(text))), encoding


def date(value):
    for fmt in ("%m/%d/%Y", "%d-%b-%y"):
        try:
            return datetime.datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    raise ValueError("Unrecognized collection date: " + value)


def key(row):
    return row["SITE_ID"], row["VISIT_NO"], date(row["DATE_COL"])


def distance(feature, lon, lat):
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


if __name__ == "__main__":
    baseline = json.loads((ROOT.parent / "low-confidence-20261003/baseline.json").read_text(encoding="utf-8"))
    weak = {r["id"] for r in baseline["waters"]}
    features = [r for r in json.loads((REPO / "apps/web/public/atlas/rivers.geojson").read_text(encoding="utf-8"))["features"] if r["properties"]["id"] in weak and r["geometry"]["type"] in ("LineString", "MultiLineString")]
    visits, audits = [], []
    sampling, _ = load("1819-sampling")
    unkeyed_methods = [r for r in sampling if not r["DATE_COL"]]
    assert all(r["STATE"] != "TN" for r in unkeyed_methods)
    methods = {key(r): r for r in sampling if r["DATE_COL"]}
    assert len(methods) + len(unkeyed_methods) == len(sampling), "Duplicate sampling visit keys"
    for cycle in ("0809", "1314", "1819"):
        sites, site_encoding = load(cycle + "-sites")
        counts, count_encoding = load(cycle + "-fish")
        sitekeys = {key(r): r for r in sites}
        assert len(sitekeys) == len(sites), "Duplicate site visit keys"
        fish = collections.defaultdict(list)
        for r in counts:
            fish[key(r)].append(r)
        tn_sites = [r for r in sites if r.get("STATE") == "TN" or r.get("PSTL_CODE") == "TN"]
        tn_count_rows = [r for r in counts if r.get("STATE") == "TN" or r.get("PSTL_CODE") == "TN" or r["SITE_ID"].startswith("FW08TN") or r["SITE_ID"].startswith("FW08RTN")]
        unmatched = [r for r in tn_count_rows if key(r) not in sitekeys]
        assert not unmatched, "Tennessee count row without exact site/visit/date match"
        for s in tn_sites:
            fs = fish.get(key(s), [])
            lon, lat = float(s["LON_DD83"]), float(s["LAT_DD83"])
            nearest = sorted((dict(waterId=f["properties"]["id"], distanceM=distance(f, lon, lat)) for f in features), key=lambda r: r["distanceM"])[:3]
            positives = [r for r in fs if float(r.get("TOTAL") or r.get("FINAL_CT") or 0) > 0]
            v = dict(cycle=cycle, siteId=s["SITE_ID"], visitNo=s["VISIT_NO"],
                     collectionDate=date(s["DATE_COL"]), site=s, fishRows=fs,
                     rowCount=len(fs), positiveTaxonLabels=sorted({r["FINAL_NAME"] for r in positives}),
                     totalIndividuals=sum(int(r.get("TOTAL") or r.get("FINAL_CT") or 0) for r in positives),
                     nearestWeakCatalogLines=nearest,
                     reachAssignment="UNREVIEWED; nearest line alone is insufficient")
            if cycle == "1819":
                v["sampling"] = methods.get(key(s))
            visits.append(v)
        audits.append(dict(cycle=cycle, siteEncoding=site_encoding, fishEncoding=count_encoding,
                           tennesseeSiteVisits=len(tn_sites), tennesseeCountRows=len(tn_count_rows),
                           unmatchedTennesseeCountRows=len(unmatched),
                           tennesseeVisitsWithCountRows=sum(key(s) in fish for s in tn_sites),
                           uidDisagreements=sum(any(r["UID"] != s["UID"] for r in fish.get(key(s), [])) for s in tn_sites)))
    output = dict(joinKey=["SITE_ID", "VISIT_NO", "normalized DATE_COL"],
                  limitation="Complete published count rows for each visit, not a census of a river. No count rows does not establish no fish. Positive taxon labels are not necessarily distinct species. NAD83-to-catalog line distances are approximate discovery checks, not habitat or access claims.",
                  unkeyedNonTennesseeSamplingRows=unkeyed_methods,
                  audits=audits, visits=visits)
    (ROOT / "tennessee-visits.json").write_text(json.dumps(output, ensure_ascii=True, indent=2) + "\n", encoding="utf-8", newline="\n")
    reviewed_groups = {
        "big-sandy-river": ["NRS18_TN_10340"],
        "nolichucky-river": ["FW08TN015", "TNR9-0905", "NRS18_TN_10008"],
        "clear-fork": ["NRS18_TN_RF002"],
        "richland-creek-maury": ["FW08TN024"],
    }
    reviewed = []
    for water, ids in reviewed_groups.items():
        rows = [dict(v, reachAssignment="REVIEWED: " + water) for v in visits if v["siteId"] in ids]
        assert len(rows) == len(ids)
        reviewed.append(dict(waterId=water, visits=rows))
    rejected = [dict(v, reachAssignment="REJECTED for Nonconnah main stem: unnamed tributary, COMID 14199409; upstream main-path TDEC stations explicitly name Nonconnah Creek Unnamed Tributary. A 64 m nearest-line distance cannot override hydrologic identity.") for v in visits if v["siteId"] in ("TNSS-1064", "NRS18_TN_10011")]
    assert len(rejected) == 2
    for name, data in (("reviewed-visits.json", reviewed), ("quarantined-visits.json", rejected)):
        (ROOT / name).write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(audits, indent=2))
    for v in visits:
        n = v["nearestWeakCatalogLines"][0]
        if n["distanceM"] < 300:
            print(v["cycle"], v["siteId"], v["collectionDate"], v["site"].get("LOC_NAME") or v["site"].get("GNIS_NAME"), n, len(v["positiveTaxonLabels"]), v["totalIndividuals"])
