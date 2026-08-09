#!/usr/bin/env python3
"""Build deployable GBFS position and watch-history JSON from columbus-micromobility-data snapshots."""

import argparse
import csv
import json
import math
import os
import re
import tempfile
from io import StringIO
from pathlib import Path
from urllib.request import Request, urlopen


DEFAULT_SNAPSHOT_ROOT = os.environ.get(
    "GBFS_SNAPSHOT_ROOT",
    "/workspace/steveneedham/columbus-micromobility-data/snapshots",
)
REMOTE_SNAPSHOT_BASE_URL = (
    "https://raw.githubusercontent.com/steveneedham/columbus-micromobility-data/main/snapshots"
)
SNAPSHOT_PATTERN = "**/columbus_scooters_*.csv"
SNAPSHOT_ID_PATTERN = re.compile(r"^columbus_scooters_(\d{8}T\d{6}Z)$")
GOODALE_OLENTANGY = {
    "id": "WATCH-GOODALE-OLENTANGY",
    "name": "Goodale Street & Olentangy River Road",
    "lat": 39.9744,
    "lng": -83.0260,
    "radius": 250,
}


def parse_args():
    project_root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description=(
            "Normalize the newest archived GBFS CSV from columbus-micromobility-data "
            "and rebuild the complete Goodale/Olentangy watch history."
        )
    )
    parser.add_argument(
        "--snapshot-root",
        type=str,
        default=DEFAULT_SNAPSHOT_ROOT,
        help="Remote URL or local path containing timestamped snapshot directories.",
    )
    parser.add_argument(
        "--source",
        type=str,
        help="Specific CSV URL or path for the current vehicle-position payload; defaults to newest.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=project_root / "gbfs-vehicle-positions.json",
    )
    parser.add_argument(
        "--history-output",
        type=Path,
        default=project_root / "gbfs-watch-history.json",
    )
    return parser.parse_args()


def snapshot_id(path):
    filename = path.stem if hasattr(path, 'stem') else path
    if filename == "columbus_scooters_latest":
        return "latest"
    match = SNAPSHOT_ID_PATTERN.match(filename)
    if not match:
        raise ValueError(f"Unrecognized snapshot filename: {filename}")
    return match.group(1)


def fetch_remote_file(url):
    """Fetch a file from a remote URL and return its content as a string."""
    request = Request(url, headers={"User-Agent": "311-Intel/1.0 gbfs-snapshot-builder"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def list_remote_snapshots(base_url):
    """List available CSV snapshots from remote GitHub directory (not implemented, requires local path)."""
    raise NotImplementedError(
        "Remote snapshot listing requires a local path. "
        "Set GBFS_SNAPSHOT_ROOT to a local directory or clone columbus-micromobility-data repository."
    )


def find_snapshots(root):
    if isinstance(root, str) and root.startswith("http"):
        return list_remote_snapshots(root)
    root = Path(root) if isinstance(root, str) else root
    if not root.is_dir():
        raise FileNotFoundError(f"Snapshot root does not exist: {root}")
    all_snapshots = list(root.glob(SNAPSHOT_PATTERN))
    if not all_snapshots:
        raise FileNotFoundError(f"No snapshot CSVs found below: {root}")
    snapshots = sorted(all_snapshots, key=lambda p: snapshot_id(p))
    ids = [snapshot_id(path) for path in snapshots]
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        raise ValueError(f"Duplicate snapshot IDs: {', '.join(duplicates)}")
    return snapshots


def distance_meters(latitude, longitude, watch):
    lat_scale = 111320
    lng_scale = 111320 * math.cos(
        math.radians((latitude + watch["lat"]) / 2)
    )
    return math.hypot(
        (latitude - watch["lat"]) * lat_scale,
        (longitude - watch["lng"]) * lng_scale,
    )


def read_positions(source):
    """Read positions from a file path or remote URL."""
    positions = []
    invalid_rows = 0
    if isinstance(source, dict) and "url" in source:
        csv_content = fetch_remote_file(source["url"])
        csv_file = StringIO(csv_content)
        filename = source.get("name", "remote_snapshot.csv")
    elif isinstance(source, str) and source.startswith("http"):
        csv_content = fetch_remote_file(source)
        csv_file = StringIO(csv_content)
        filename = source.split("/")[-1]
    else:
        path = Path(source) if isinstance(source, str) else source
        with path.open(newline="", encoding="utf-8-sig") as f:
            csv_content = f.read()
        csv_file = StringIO(csv_content)
        filename = path.name
    reader = csv.DictReader(csv_file)
    required = {
        "Vehicle_ID",
        "Company",
        "Type",
        "Latitude",
        "Longitude",
        "Battery_Pct",
        "Range_Miles",
        "Is_Available",
        "Is_Disabled",
        "Is_Reserved",
    }
    optional = {"Is_Disabled", "Is_Reserved"}
    missing = required.difference(reader.fieldnames or [])
    if missing and not missing.issubset(optional):
        raise ValueError(
            f"{filename} is missing columns: {', '.join(sorted(missing - optional))}"
        )
    for row in reader:
        try:
            latitude = float(row["Latitude"])
            longitude = float(row["Longitude"])
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                raise ValueError
            positions.append(
                {
                    "id": row["Vehicle_ID"],
                    "company": row["Company"],
                    "type": row["Type"],
                    "lat": round(latitude, 6),
                    "lng": round(longitude, 6),
                    "battery": int(float(row["Battery_Pct"] or 0)),
                    "range": round(float(row["Range_Miles"] or 0), 1),
                    "available": row["Is_Available"].lower() == "true",
                    "disabled": row.get("Is_Disabled", "false").lower() == "true",
                    "reserved": row.get("Is_Reserved", "false").lower() == "true",
                }
            )
        except (KeyError, TypeError, ValueError):
            invalid_rows += 1
    return positions, invalid_rows


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def build(snapshot_root, source, output, history_output):
    snapshots = find_snapshots(snapshot_root)
    if not snapshots:
        raise ValueError("No snapshots found")
    if source:
        current_source = source
    else:
        current_source = snapshots[-1]
    vehicles, invalid_rows = read_positions(current_source)
    if isinstance(current_source, dict):
        current_id = current_source["id"]
        source_name = current_source["name"]
    else:
        path = Path(current_source) if isinstance(current_source, str) else current_source
        current_id = snapshot_id(path)
        source_name = path.name
    write_json(
        output,
        {
            "snapshot_id": current_id,
            "source_file": source_name,
            "position_count": len(vehicles),
            "invalid_row_count": invalid_rows,
            "vehicles": vehicles,
        },
    )

    history = []
    total_invalid_rows = 0
    for snapshot in snapshots:
        positions, rejected = read_positions(snapshot)
        total_invalid_rows += rejected
        nearby = [
            vehicle
            for vehicle in positions
            if distance_meters(vehicle["lat"], vehicle["lng"], GOODALE_OLENTANGY)
            <= GOODALE_OLENTANGY["radius"]
        ]
        operators = {}
        for vehicle in nearby:
            operators[vehicle["company"]] = operators.get(vehicle["company"], 0) + 1
        if isinstance(snapshot, dict):
            snap_id = snapshot["id"]
        else:
            snap_id = snapshot_id(snapshot)
        history.append(
            {
                "snapshot_id": snap_id,
                "position_count": len(positions),
                "invalid_row_count": rejected,
                "watch_count": len(nearby),
                "operators": operators,
                "cross_vendor": len(operators) > 1,
            }
        )

    write_json(
        history_output,
        {
            "watch": GOODALE_OLENTANGY,
            "snapshot_count": len(history),
            "invalid_row_count": total_invalid_rows,
            "snapshots": history,
        },
    )
    return {
        "current_snapshot": current_id,
        "position_count": len(vehicles),
        "snapshot_count": len(history),
        "invalid_row_count": total_invalid_rows,
    }


def main():
    args = parse_args()
    snapshot_root = args.snapshot_root
    if not isinstance(snapshot_root, str) or not snapshot_root.startswith("http"):
        snapshot_root = Path(snapshot_root).resolve()
    source = args.source
    if source and (not isinstance(source, str) or not source.startswith("http")):
        source = Path(source).resolve()
    result = build(
        snapshot_root,
        source,
        args.output.resolve(),
        args.history_output.resolve(),
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
