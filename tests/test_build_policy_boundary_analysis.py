import unittest

from build_policy_boundary_analysis import build_analysis


class PolicyBoundaryAnalysisTest(unittest.TestCase):
    def test_selects_relevant_boundaries_and_measures_proximity(self):
        policies = {
            "items": [
                {
                    "policy_id": "policy-no-parking",
                    "name": "Test NPZ",
                    "description": "No parking in this geography.",
                    "rules": [{"name": "No Parking", "geographies": ["geo-1"]}],
                },
                {
                    "policy_id": "policy-speed",
                    "name": "Test Slow Zone",
                    "description": "10 mph",
                    "rules": [{"name": "Speed Limit", "geographies": ["geo-2"]}],
                },
            ]
        }
        geographies = {
            "geographies": [
                {
                    "geography_id": "geo-1",
                    "name": "Test square",
                    "geography_json": {
                        "type": "FeatureCollection",
                        "features": [
                            {
                                "type": "Feature",
                                "properties": {},
                                "geometry": {
                                    "type": "Polygon",
                                    "coordinates": [
                                        [
                                            [-83.001, 39.999],
                                            [-82.999, 39.999],
                                            [-82.999, 40.001],
                                            [-83.001, 40.001],
                                            [-83.001, 39.999],
                                        ]
                                    ],
                                },
                            }
                        ],
                    },
                }
            ]
        }
        complaints = {
            "entities": [
                {
                    "source_id": "CAS-TEST",
                    "address": "Test",
                    "latitude": 40,
                    "longitude": -83,
                }
            ]
        }
        result = build_analysis(policies, geographies, complaints)
        self.assertEqual(result["summary"]["boundary_policy_count"], 1)
        self.assertEqual(result["summary"]["inside_policy_zone_count"], 1)
        self.assertEqual(result["complaints"][0]["nearest_boundary_type"], "no_parking")
        self.assertTrue(result["complaints"][0]["inside_policy_zone"])


if __name__ == "__main__":
    unittest.main()
