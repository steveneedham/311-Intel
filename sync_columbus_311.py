#!/usr/bin/env python3
"""Refresh the read-only Columbus shared-mobility 311 feed."""

import argparse
import json
from pathlib import Path

from columbus_311_feed import build_feed, fetch_payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", type=Path, default=Path("columbus-311-current.json")
    )
    args = parser.parse_args()
    feed = build_feed(fetch_payload())
    args.output.write_text(json.dumps(feed, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(args.output),
                "records": feed["record_count"],
                "duplicates": feed["duplicate_count"],
                "invalid": feed["invalid_count"],
                "fetched_at": feed["fetched_at"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
