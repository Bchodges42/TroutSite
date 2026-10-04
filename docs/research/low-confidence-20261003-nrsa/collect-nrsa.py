"""Capture the observed EPA NRSA download links, preserving exact response bytes.

CSV responses are stored as deterministic gzip files to avoid committing large,
unrelated national tables uncompressed. Metadata is kept in its original form.
Run from any directory; only the standard library is needed.
"""
import concurrent.futures
import datetime
import gzip
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent
INDEX = "https://www.epa.gov/national-aquatic-resource-surveys/data-national-aquatic-resource-surveys"
SOURCES = {
    "0809-fish.csv": "https://www.epa.gov/sites/default/files/2015-09/fishcts.csv",
    "0809-fish.txt": "https://www.epa.gov/sites/default/files/2015-09/fishcts.txt",
    "0809-sites.csv": "https://www.epa.gov/sites/default/files/2015-09/siteinfo_0.csv",
    "0809-sites.txt": "https://www.epa.gov/sites/default/files/2015-09/siteinfo_0.txt",
    "1314-fish.csv": "https://www.epa.gov/sites/default/files/2019-04/nrsa1314_fishcts_04232019.csv",
    "1314-fish.txt": "https://www.epa.gov/sites/default/files/2019-04/nrsa1314_fishcts_meta_04292019_0.txt",
    "1314-sites.csv": "https://www.epa.gov/sites/default/files/2019-04/nrsa1314_siteinformation_wide_04292019.csv",
    "1314-sites.txt": "https://www.epa.gov/sites/default/files/2019-04/nrsa1314_sitesuids_wide_meta_04292019.txt",
    "1819-fish.csv": "https://www.epa.gov/system/files/other-files/2022-03/nrsa-1819-fish-count-data.csv",
    "1819-fish.txt": "https://www.epa.gov/system/files/other-files/2022-03/nrsa-1819-fish-count-metadata.txt",
    "1819-sites.csv": "https://www.epa.gov/system/files/other-files/2023-01/NRSA_1819_SiteInfo.csv",
    "1819-sites.txt": "https://www.epa.gov/system/files/other-files/2023-01/NRSA18_19_Site_Information_Metadata.txt",
    "1819-sampling.csv": "https://www.epa.gov/system/files/other-files/2022-03/nrsa-1819-fish-sampling-information-data.csv",
    "1819-sampling.txt": "https://www.epa.gov/system/files/other-files/2022-03/nrsa-1819-fish-sampling-information-metadata.txt",
}


def capture(item):
    name, url = item
    req = urllib.request.Request(url, headers={"User-Agent": "Trout-waterway-research/1.0"})
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read()
        final_url = response.url
        content_type = response.headers.get("Content-Type")
    if name.endswith(".csv"):
        if b"<html" in raw[:500].lower():
            raise ValueError("HTML returned instead of CSV: " + url)
        saved = gzip.compress(raw, mtime=0)
        name += ".gz"
    else:
        saved = raw
    path = ROOT / "captures" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(saved)
    return dict(file="captures/" + name, url=url, finalUrl=final_url,
                retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                contentType=content_type, responseBytes=len(raw),
                responseSha256=hashlib.sha256(raw).hexdigest(),
                savedSha256=hashlib.sha256(saved).hexdigest())


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = list(pool.map(capture, SOURCES.items()))
    (ROOT / "source-manifest.json").write_text(
        json.dumps(dict(indexUrl=INDEX, linksObservedOn="2026-10-03",
                        captures=records), indent=2) + "\n", encoding="utf-8", newline="\n")
    for record in records:
        print(record["file"], record["responseBytes"])
