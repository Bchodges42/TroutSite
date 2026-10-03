"""Retrieve locality leads; search results are not reach assignments or censuses.

Standard library only. Run from the repository root. Responses are normalized
to UTF-8/LF JSON, with original HTTP-body hashes kept in the manifest.
"""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent
FIELDS = "key datasetKey institutionCode collectionCode catalogNumber occurrenceID scientificName verbatimScientificName order family genus species taxonKey basisOfRecord individualCount eventDate year month day country stateProvince county locality verbatimLocality decimalLatitude decimalLongitude coordinateUncertaintyInMeters georeferenceRemarks issues license references recordedBy identifiedBy samplingProtocol occurrenceRemarks".split()
TERMS = ["Orchard", "Reedy", "Obey", "Bradley", "Chucky", "Chuckey", "Dumplin", "Roaring"]


def collect(term):
    rows, pages = [], []
    offset = 0
    while True:
        params = dict(country="US", stateProvince="Tennessee",
                      basisOfRecord="PRESERVED_SPECIMEN", taxonKey=44,
                      q=term, limit=300, offset=offset)
        url = "https://api.gbif.org/v1/occurrence/search?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"User-Agent": "Trout-waterway-research/1.0"})
        with urllib.request.urlopen(req, timeout=45) as response:
            raw = response.read()
        data = json.loads(raw)
        pages.append(dict(url=url, retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                          responseSha256=hashlib.sha256(raw).hexdigest(),
                          count=data["count"], returned=len(data["results"]),
                          endOfRecords=data["endOfRecords"]))
        rows.extend({k: r[k] for k in FIELDS if k in r} for r in data["results"])
        if data["endOfRecords"]:
            break
        offset += len(data["results"])
        if offset > 5000 or not data["results"]:
            raise RuntimeError("Search grew beyond bounded research scope")
    out = dict(term=term, note="Chordata search, including non-fish and unrelated waters; locality and taxonomy must be checked individually.", pages=pages, records=rows)
    path = ROOT / "captures" / ("museum-" + term.lower() + ".json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, ensure_ascii=True, indent=2) + "\n", encoding="utf-8", newline="\n")
    return term, len(rows), path.name


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(collect, TERMS):
            print(*result)
