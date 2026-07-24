import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from build_gbfs_snapshot import build  # noqa: E402


FIELDS = [
    "Company",
    "Vehicle_ID",
    "Type",
    "Latitude",
    "Longitude",
    "Battery_Pct",
    "Range_Miles",
    "Is_Available",
    "Is_Disabled",
    "Is_Reserved",
    "Last_Reported",
]


def write_snapshot(root, snapshot_id, rows):
    folder = root / snapshot_id / "snapshots"
    folder.mkdir(parents=True)
    path = folder / f"columbus_scooters_{snapshot_id}.csv"
    with path.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    return path


def vehicle(vehicle_id, company, latitude, longitude):
    return {
        "Company": company,
        "Vehicle_ID": vehicle_id,
        "Type": "scooter",
        "Latitude": latitude,
        "Longitude": longitude,
        "Battery_Pct": 80,
        "Range_Miles": 12.5,
        "Is_Available": "true",
        "Is_Disabled": "false",
        "Is_Reserved": "false",
        "Last_Reported": "2026-07-23T04:46:00Z",
    }


class SnapshotBuilderTest(unittest.TestCase):
    def test_selects_latest_and_preserves_rejected_row_counts(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            write_snapshot(
                root,
                "20260722T120000Z",
                [vehicle("veo-1", "Veo", 39.9744, -83.0260)],
            )
            write_snapshot(
                root,
                "20260723T044626Z",
                [
                    vehicle("spin-1", "Spin", 39.9745, -83.0261),
                    vehicle("bad-1", "Spin", "not-a-latitude", -83.0261),
                ],
            )
            output = root / "positions.json"
            history_output = root / "history.json"

            result = build(root, None, output, history_output)
            positions = json.loads(output.read_text(encoding="utf-8"))
            history = json.loads(history_output.read_text(encoding="utf-8"))

            self.assertEqual(result["current_snapshot"], "20260723T044626Z")
            self.assertEqual(positions["position_count"], 1)
            self.assertEqual(positions["invalid_row_count"], 1)
            self.assertEqual(history["snapshot_count"], 2)
            self.assertEqual(history["invalid_row_count"], 1)
            self.assertEqual(history["snapshots"][1]["watch_count"], 1)
            self.assertEqual(history["snapshots"][1]["operators"], {"Spin": 1})


if __name__ == "__main__":
    unittest.main()
