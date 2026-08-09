#!/usr/bin/env python3
"""Refresh the read-only Columbus shared-mobility 311 feed from columbus-micromobility-data."""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from columbus_311_feed import normalize_feature


DATA_SOURCE_URL = os.environ.get(
    "COLUMBUS_311_DATA_URL",
    "https://raw.githubusercontent.com/steveneedham/columbus-micromobility-data/main/"
    "snapshots/311_requests_latest.json",
)


def fetch_from_source(url, timeout=30):
    request = Request(url, headers={"User-Agent": "311-Intel/1.0 read-only-data-feed"})
    with urlopen(request, timeout=timeout) as response:
        return json.load(response)


def build_feed_from_snapshot(snapshot_data, fetched_at=None):
    """Build feed from a snapshot array of 311 records."""
    records = []
    review = []
    seen = set()
    duplicates = 0
    for feature in snapshot_data:
        normalized = {
            "attributes": {
                "CASE_ID": feature.get("CASE_ID"),
                "STATUS": feature.get("STATUS"),
                "STATUS_DATE": feature.get("STATUS_DATE"),
                "REPORTED_DATE": feature.get("REPORTED_DATE"),
                "REQUEST_TYPE": feature.get("REQUEST_TYPE"),
                "STREET": feature.get("STREET"),
                "CITY": feature.get("CITY"),
                "ZIP": feature.get("ZIP"),
                "COLUMBUSCOMMUNITY": feature.get("COLUMBUSCOMMUNITY"),
                "AREACOMMISSION": feature.get("AREACOMMISSION"),
                "COUNCILDISTRICT": feature.get("COUNCILDISTRICT"),
                "LATITUDE": feature.get("LATITUDE"),
                "LONGITUDE": feature.get("LONGITUDE"),
                "REQUEST_MODIFIED": feature.get("REQUEST_MODIFIED"),
            }
        }
        record, invalid = normalize_feature(normalized)
        if invalid:
            review.append(invalid)
            continue
        if record["source_id"] in seen:
            duplicates += 1
            continue
        seen.add(record["source_id"])
        records.append(record)
    return {
        "fetched_at": fetched_at
        or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "name": "Columbus Micromobility Data — 311 Complaints",
            "data_url": DATA_SOURCE_URL,
            "request_type": "Shared Electric Bike & Scooters",
            "mode": "read-only",
        },
        "record_count": len(records),
        "duplicate_count": duplicates,
        "invalid_count": len(review),
        "records": records,
        "review": review,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", type=Path, default=Path("columbus-311-current.json")
    )
    parser.add_argument(
        "--source", type=str, default=DATA_SOURCE_URL, help="Data source URL"
    )
    args = parser.parse_args()
    snapshot = fetch_from_source(args.source)
    feed = build_feed_from_snapshot(snapshot)
    args.output.write_text(json.dumps(feed, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(args.output),
                "records": feed["record_count"],
                "duplicates": feed["duplicate_count"],
                "invalid": feed["invalid_count"],
                "fetched_at": feed["fetched_at"],
                "source": args.source,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
