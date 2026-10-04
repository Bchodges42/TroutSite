"""Continue museum discovery with the same documented, paginated controls.

Exact stream names, locality descriptions, county, coordinates, taxonomy,
collection dates, and sampling effort require review after discovery.
"""
import concurrent.futures
import importlib.util
import sys
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
source = ROOT.parent / "low-confidence-20261003/collect-museum.py"
spec = importlib.util.spec_from_file_location("prior_museum_capture", source)
capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)
capture.ROOT = ROOT
TERMS = ["Chestuee", "Chestua", "Candies", "Oostanaula", "Mouse"]

if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(capture.collect, TERMS):
            print(*result)
