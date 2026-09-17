#!/usr/bin/env python3
"""Convert the owner-supplied TWRA stocking-schedule workbook to JSON.

Source: packages/content/research/twra-stockings-2026.xlsx (TWRA official
'Trout Fishing & Stockings in Tennessee' schedule, 2026 season). Values only
are converted here; all interpretation (month-letter windows, water
resolution) happens in node so it is unit-testable.

Usage: python convert-stockings-xlsx.py <xlsx> <out.json>
"""
import json
import sys
from datetime import datetime

import openpyxl


def norm(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def cell_date(v):
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    return norm(v)


def main():
    src, out = sys.argv[1], sys.argv[2]
    wb = openpyxl.load_workbook(src, data_only=True)
    ws = wb["Sheet1"]
    rows = []
    for r in ws.iter_rows(min_row=3, values_only=True):
        if r[0] is None and r[2] is None:
            continue
        rows.append({
            "region": int(r[0]) if r[0] is not None else None,
            "county": norm(r[1]),
            "location": norm(r[2]),
            "type": norm(r[3]),
            "stockingDay": cell_date(r[4]),
            "stockingWeek": cell_date(r[5]),
            "stockingMonthsRaw": norm(r[6]),
            "species": norm(r[7]),
        })
    doc = {
        "schema": "trout.twra-stocking-schedule.v1",
        "stateId": "TN",
        "source": "TWRA official stocking schedule workbook (owner-supplied 2026-09-17)",
        "sourceRole": "authoritative program calendar: type + months + exact dates; outranks the map feed's coarse season labels",
        "collectedAt": datetime.now().strftime("%Y-%m-%d"),
        "rowCount": len(rows),
        "rows": rows,
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    print(f"wrote {out}: {len(rows)} rows")


if __name__ == "__main__":
    main()
