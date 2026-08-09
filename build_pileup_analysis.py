#!/usr/bin/env python3
"""Build pileup analysis from columbus-micromobility-data pileup history."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


PILEUP_DATA_URL = os.environ.get(
    "PILEUP_DATA_URL",
    "https://raw.githubusercontent.com/steveneedham/columbus-micromobility-data/main/data-pileup-history.json",
)


def fetch_from_source(url, timeout=30):
    request = Request(url, headers={"User-Agent": "311-Intel/1.0 pileup-analysis"})
    with urlopen(request, timeout=timeout) as response:
        return json.load(response)


def build_pileup_summary(pileup_data):
    """Build summary statistics from pileup history."""
    pileups = pileup_data.get("pileups", [])

    # Current/active pileups
    active = [p for p in pileups if p.get("active")]

    # Historical statistics
    total_detected = len(pileups)
    total_vehicles_in_pileups = sum(p.get("vehicle_count", 0) for p in pileups)
    avg_vehicles_per_pileup = (
        total_vehicles_in_pileups / total_detected if total_detected > 0 else 0
    )

    # Company breakdown
    companies = {}
    for p in pileups:
        for company in p.get("companies", []):
            companies[company] = companies.get(company, 0) + 1

    # Recency
    recent_pileups = sorted(
        pileups,
        key=lambda p: p.get("last_seen_at", ""),
        reverse=True
    )[:10]

    return {
        "fetched_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "name": "Columbus Micromobility Data — Vehicle Pileups",
            "data_url": PILEUP_DATA_URL,
            "mode": "read-only",
        },
        "summary": {
            "total_pileups_detected": total_detected,
            "active_pileup_count": len(active),
            "total_vehicles_in_pileups": total_vehicles_in_pileups,
            "avg_vehicles_per_pileup": round(avg_vehicles_per_pileup, 1),
            "companies_involved": companies,
        },
        "active_pileups": active,
        "recent_pileups": recent_pileups,
        "all_pileups": pileups,
        "method": pileup_data.get("method", {}),
    }


def main():
    project_root = Path(__file__).resolve().parent
    output = project_root / "pileup-analysis.json"

    pileup_data = fetch_from_source(PILEUP_DATA_URL)
    summary = build_pileup_summary(pileup_data)

    output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "output": str(output),
                "total_pileups": summary["summary"]["total_pileups_detected"],
                "active_pileups": summary["summary"]["active_pileup_count"],
                "vehicles_in_pileups": summary["summary"]["total_vehicles_in_pileups"],
                "fetched_at": summary["fetched_at"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
