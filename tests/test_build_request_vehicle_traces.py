import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from build_request_vehicle_traces import build  # noqa: E402
from tests.test_build_gbfs_snapshot import vehicle, write_snapshot  # noqa: E402


class RequestVehicleTraceBuilderTest(unittest.TestCase):
    def test_links_unique_vehicle_and_preserves_arrival_window(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            write_snapshot(
                root,
                "20260724T100000Z",
                [vehicle("spin-1", "Spin", 39.9600, -83.0100)],
            )
            write_snapshot(
                root,
                "20260724T103000Z",
                [vehicle("spin-1", "Spin", 39.9700, -83.0200)],
            )
            write_snapshot(
                root,
                "20260724T110000Z",
                [vehicle("spin-1", "Spin", 39.9700, -83.0200)],
            )
            complaints = root / "complaints.json"
            complaints.write_text(
                json.dumps(
                    {
                        "records": [
                            {
                                "source_id": "CAS-TEST-1",
                                "reported_at": "2026-07-24T11:05:00Z",
                                "latitude": 39.9700,
                                "longitude": -83.0200,
                                "operator": "Spin",
                                "address": "Test address",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            output = root / "traces.json"

            result = build(root, complaints, output)
            trace = result["traces"][0]

            self.assertEqual(trace["status"], "likely_match")
            self.assertEqual(trace["vehicle"]["id"], "spin-1")
            self.assertEqual(trace["trajectory"]["first_observed_near_at"], "2026-07-24T10:30:00Z")
            self.assertEqual(trace["trajectory"]["minimum_dwell_minutes"], 35)
            self.assertEqual(trace["trajectory"]["came_from"]["observed_at"], "2026-07-24T10:00:00Z")
            self.assertEqual(trace["root_cause_signal"], "recent_vehicle_arrival")

    def test_returns_no_match_when_no_vehicle_is_near_request(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            write_snapshot(
                root,
                "20260724T110000Z",
                [vehicle("veo-1", "Veo", 40.0500, -83.1000)],
            )
            complaints = root / "complaints.json"
            complaints.write_text(
                json.dumps(
                    {
                        "records": [
                            {
                                "source_id": "CAS-TEST-2",
                                "reported_at": "2026-07-24T11:05:00Z",
                                "latitude": 39.9700,
                                "longitude": -83.0200,
                                "operator": "unknown",
                                "address": "Test address",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            output = root / "traces.json"

            result = build(root, complaints, output)

            self.assertEqual(result["traces"][0]["status"], "no_match")
            self.assertEqual(result["matched_request_count"], 0)


if __name__ == "__main__":
    unittest.main()
