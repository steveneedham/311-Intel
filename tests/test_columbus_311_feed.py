import unittest
from copy import deepcopy

from columbus_311_feed import build_feed, merge_operational_issues


def feature(case_id="CAS-TEST-001", status="Received"):
    return {
        "attributes": {
            "CASE_ID": case_id,
            "STATUS": status,
            "STATUS_DATE": 1784765000000,
            "REPORTED_DATE": 1784764448000,
            "REQUEST_TYPE": "Shared Electric Bike & Scooters",
            "STREET": "E 4TH AVE & N 4TH ST",
            "ZIP": "43201",
            "COLUMBUSCOMMUNITY": "Italian Village",
            "COUNCILDISTRICT": "District 7",
            "LATITUDE": 39.9856330941,
            "LONGITUDE": -82.9993961962,
            "REQUEST_MODIFIED": 1784765000000,
        }
    }


class ColumbusFeedTest(unittest.TestCase):
    def test_build_feed_deduplicates_and_surfaces_invalid_rows(self):
        invalid = feature("")
        invalid["attributes"]["STREET"] = ""
        payload = {"features": [feature(), feature(), invalid]}
        feed = build_feed(payload, fetched_at="2026-07-23T22:00:00Z")
        self.assertEqual(feed["record_count"], 1)
        self.assertEqual(feed["duplicate_count"], 1)
        self.assertEqual(feed["invalid_count"], 1)
        self.assertIn("CASE_ID is required", feed["review"][0]["reasons"])

    def test_merge_preserves_operational_workflow(self):
        feed = build_feed({"features": [feature(status="Closed")]})
        existing = [
            {
                "id": "CAS-TEST-001",
                "status": "in_progress",
                "team": "Central response",
                "notes": "Do not overwrite",
                "address": "Old address",
            }
        ]
        merged, summary = merge_operational_issues(
            deepcopy(existing), feed["records"]
        )
        self.assertEqual(summary["added"], 0)
        self.assertEqual(summary["updated"], 1)
        self.assertEqual(merged[0]["status"], "in_progress")
        self.assertEqual(merged[0]["team"], "Central response")
        self.assertEqual(merged[0]["notes"], "Do not overwrite")
        self.assertEqual(merged[0]["sourceStatus"], "Closed")
        self.assertEqual(merged[0]["address"], "E 4TH AVE & N 4TH ST")

    def test_merge_adds_new_record_once(self):
        feed = build_feed({"features": [feature()]})
        once, first = merge_operational_issues([], feed["records"])
        twice, second = merge_operational_issues(once, feed["records"])
        self.assertEqual((first["added"], len(once)), (1, 1))
        self.assertEqual((second["added"], len(twice)), (0, 1))


if __name__ == "__main__":
    unittest.main()
