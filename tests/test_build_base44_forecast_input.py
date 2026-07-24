import json
import tempfile
import unittest
from pathlib import Path

from build_base44_forecast_input import build


class Base44ForecastInputTest(unittest.TestCase):
    def test_builds_compact_cross_vendor_and_complaint_summary(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixtures = {
                "positions.json": {
                    "snapshot_id": "20260724T100000Z",
                    "position_count": 5,
                    "vehicles": [
                        {"id": "v1", "company": "Veo", "type": "scooter", "lat": 39.97, "lng": -83.0, "battery": 80, "available": True, "disabled": False, "reserved": False},
                        {"id": "v2", "company": "Veo", "type": "scooter", "lat": 39.97001, "lng": -83.0, "battery": 10, "available": True, "disabled": False, "reserved": False},
                        {"id": "s1", "company": "Spin", "type": "scooter", "lat": 39.97002, "lng": -83.0, "battery": 70, "available": True, "disabled": False, "reserved": False},
                        {"id": "s2", "company": "Spin", "type": "scooter", "lat": 39.97003, "lng": -83.0, "battery": 60, "available": False, "disabled": False, "reserved": False},
                        {"id": "far", "company": "Spin", "type": "bicycle", "lat": 40.1, "lng": -83.1, "battery": 50, "available": True, "disabled": False, "reserved": False},
                    ],
                },
                "complaints.json": {
                    "fetched_at": "2026-07-24T09:55:00Z",
                    "record_count": 2,
                    "records": [
                        {"source_id": "one", "zone_id": "Downtown", "complaint_type": "sidewalk_block", "operator": "unknown", "reported_at": "2026-07-24T09:00:00Z"},
                        {"source_id": "two", "zone_id": "Downtown", "complaint_type": "ada_concern", "operator": "Veo", "reported_at": "2026-07-22T09:00:00Z"},
                    ],
                },
                "history.json": {"watch": {"id": "watch"}, "snapshots": [{"snapshot_id": "one", "watch_count": 2}]},
                "events.json": {"events": [{"id": "event", "name": "Match", "start_at": "2026-07-25T10:00:00Z"}]},
            }
            for name, payload in fixtures.items():
                (root / name).write_text(json.dumps(payload), encoding="utf-8")

            result = build(
                root / "positions.json",
                root / "complaints.json",
                root / "history.json",
                root / "events.json",
            )

            self.assertEqual(result["fleet"]["vehicles"], 5)
            self.assertEqual(result["cross_vendor_stacking"]["cluster_count"], 1)
            self.assertEqual(result["cross_vendor_stacking"]["top_clusters"][0]["operators"], {"Spin": 2, "Veo": 2})
            self.assertEqual(result["complaint_pressure"]["periods_days"]["1"]["complaints"], 1)
            self.assertEqual(result["complaint_pressure"]["periods_days"]["3"]["severity_points"], 8)
            self.assertEqual(result["events_next_72h"][0]["hours_from_as_of"], 24.0)
            self.assertNotIn("vehicles", result["cross_vendor_stacking"]["top_clusters"][0])
            self.assertEqual(result["forecast_horizons_hours"], [24, 48, 72])


if __name__ == "__main__":
    unittest.main()
