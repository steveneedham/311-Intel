#!/usr/bin/env python3
"""Build deployable GBFS position and watch-history JSON from archived CSVs."""

import argparse
import csv
import json
import math
import os
import re
from pathlib import Path


DEFAULT_SNAPSHOT_ROOT = Path(
    "/Users/sjneedhamicloud.com/Library/CloudStorage/"
    "GoogleDrive-sjneedham1974@gmail.com/My Drive/"
    "columbus_micromobility_snapshots"
)
SNAPSHOT_PATTERN = "*/snapshots/columbus_scooters_*.csv"
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
            "Normalize the newest archived GBFS CSV and rebuild the complete "
            "Goodale/Olentangy watch history."
        )
    )
    parser.add_argument(
        "--snapshot-root",
        type=Path,
        default=Path(os.environ.get("GBFS_SNAPSHOT_ROOT", DEFAULT_SNAPSHOT_ROOT)),
        help="Root containing timestamped snapshot directories.",
    )
    parser.add_argument(
        "--source",
        type=Path,
        help="Specific CSV for the current vehicle-position payload; defaults to newest.",
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
    match = SNAPSHOT_ID_PATTERN.match(path.stem)
    if not match:
        raise ValueError(f"Unrecognized snapshot filename: {path.name}")
    return match.group(1)


def find_snapshots(root):
    if not root.is_dir():
        raise FileNotFoundError(f"Snapshot root does not exist: {root}")
    snapshots = sorted(root.glob(SNAPSHOT_PATTERN), key=snapshot_id)
    if not snapshots:
        raise FileNotFoundError(f"No snapshot CSVs found below: {root}")
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


def read_positions(path):
    positions = []
    invalid_rows = 0
    with path.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
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
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(
                f"{path.name} is missing columns: {', '.join(sorted(missing))}"
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
                        "disabled": row["Is_Disabled"].lower() == "true",
                        "reserved": row["Is_Reserved"].lower() == "true",
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
    current_source = source or snapshots[-1]
    if current_source not in snapshots:
        snapshot_id(current_source)
        if not current_source.is_file():
            raise FileNotFoundError(f"Source CSV does not exist: {current_source}")

    vehicles, invalid_rows = read_positions(current_source)
    current_id = snapshot_id(current_source)
    write_json(
        output,
        {
            "snapshot_id": current_id,
            "source_file": current_source.name,
            "position_count": len(vehicles),
            "invalid_row_count": invalid_rows,
            "vehicles": vehicles,
        },
    )

    history = []
    total_invalid_rows = 0
    for path in snapshots:
        positions, rejected = read_positions(path)
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
        history.append(
            {
                "snapshot_id": snapshot_id(path),
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
    result = build(
        args.snapshot_root.resolve(),
        args.source.resolve() if args.source else None,
        args.output.resolve(),
        args.history_output.resolve(),
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
