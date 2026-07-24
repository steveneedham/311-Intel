import http.cookiejar
import json
import os
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(PROJECT_ROOT))

from server import WorkflowScheduler, create_server  # noqa: E402


BASE_STATE = {
    "issues": [
        {
            "id": "CAS-TEST-001",
            "type": "ADA ramp",
            "descriptor": "Source description",
            "address": "100 Test St",
            "zone": "Downtown",
            "operator": "unknown",
            "reportedAt": "2026-07-23T12:00:00Z",
            "status": "received",
            "priority": "critical",
            "team": "",
            "notes": "",
            "accessibilityChallengeStatus": "no_challenge",
            "accessibilityChallengeNote": "",
            "lat": 39.96,
            "lng": -83.0,
        }
    ],
    "interventions": [],
    "outcomes": [],
    "alertSubscriptions": [
        {
            "id": "SUB-TEST-001",
            "severity": "high",
            "zone": "all",
            "enabled": True,
        }
    ],
    "alertDeliveries": [],
    "auditLog": [{"id": "client-entry-must-not-be-stored"}],
}


class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookies)
        )
        self.csrf = ""
        self.last_headers = {}

    def request(self, method, path, payload=None, csrf=False):
        body = None if payload is None else json.dumps(payload).encode()
        headers = {"Content-Type": "application/json"}
        if csrf:
            headers["X-CSRF-Token"] = self.csrf
        request = urllib.request.Request(
            self.base_url + path, data=body, headers=headers, method=method
        )
        try:
            with self.opener.open(request) as response:
                self.last_headers = dict(response.headers.items())
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            self.last_headers = dict(error.headers.items())
            return error.code, json.loads(error.read())

    def login(self, username, password):
        status, payload = self.request(
            "POST", "/api/login", {"username": username, "password": password}
        )
        if status == 200:
            self.csrf = payload["csrf"]
        return status, payload


class DurableServerTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        database = Path(self.temporary_directory.name) / "test.sqlite3"
        environment = {
            "APP_OPERATOR_PASSWORD": "operator-pass-123",
            "APP_ADMIN_PASSWORD": "administrator-pass-123",
        }
        self.environment_patch = patch.dict(os.environ, environment, clear=False)
        self.environment_patch.start()
        self.server = create_server("127.0.0.1", 0, database, PROJECT_ROOT)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.environment_patch.stop()
        self.temporary_directory.cleanup()

    def test_auth_versioning_permissions_and_append_only_audit(self):
        anonymous = ApiClient(self.base_url)
        status, health = anonymous.request("GET", "/api/health")
        self.assertEqual((status, health["storage"]), (200, "sqlite"))
        self.assertFalse(health["city_sync_enabled"])
        self.assertEqual(anonymous.last_headers["X-Frame-Options"], "DENY")
        self.assertIn("frame-ancestors 'none'", anonymous.last_headers["Content-Security-Policy"])
        status, _ = anonymous.request("GET", "/api/state")
        self.assertEqual(status, 401)

        operator = ApiClient(self.base_url)
        status, session = operator.login("operator", "operator-pass-123")
        self.assertEqual(status, 200)
        self.assertEqual(session["role"], "operator")
        self.assertIn("HttpOnly", operator.last_headers["Set-Cookie"])
        self.assertIn("SameSite=Strict", operator.last_headers["Set-Cookie"])

        status, saved = operator.request(
            "PUT", "/api/state", {"version": 0, "state": BASE_STATE}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 1))

        status, durable = operator.request("GET", "/api/state")
        self.assertEqual(status, 200)
        self.assertNotIn("auditLog", durable["state"])

        assigned = deepcopy(durable["state"])
        assigned["issues"][0].update(
            {
                "status": "assigned",
                "team": "Central response",
                "accessibilityChallengeStatus": "submitted_to_city",
                "accessibilityChallengeNote": "Photo does not establish blocked clearance.",
            }
        )
        status, saved = operator.request(
            "PUT", "/api/state", {"version": 1, "state": assigned}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 2))

        city_finding = deepcopy(assigned)
        city_finding["issues"][0]["accessibilityChallengeStatus"] = "city_supported"
        status, payload = operator.request(
            "PUT", "/api/state", {"version": 2, "state": city_finding}, csrf=True
        )
        self.assertEqual(status, 403)
        self.assertIn("administrator required to record City findings", payload["error"])

        source_edit = deepcopy(assigned)
        source_edit["issues"][0]["crossReferenceUrl"] = (
            "https://columbusoh.oneviewcrm.cc/servicerequests/"
            "33333333-3333-3333-3333-333333333333"
        )
        status, payload = operator.request(
            "PUT", "/api/state", {"version": 2, "state": source_edit}, csrf=True
        )
        self.assertEqual(status, 403)
        self.assertIn("cannot alter source fields", payload["error"])

        recommended = deepcopy(assigned)
        recommended["interventions"].append(
            {"id": "INT-TEST-001", "status": "recommended", "zone": "Downtown"}
        )
        status, saved = operator.request(
            "PUT", "/api/state", {"version": 2, "state": recommended}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 3))

        unauthorized_transition = deepcopy(recommended)
        unauthorized_transition["interventions"][0]["status"] = "approved"
        status, payload = operator.request(
            "PUT",
            "/api/state",
            {"version": 3, "state": unauthorized_transition},
            csrf=True,
        )
        self.assertEqual(status, 403)
        self.assertIn("administrator required", payload["error"])

        admin = ApiClient(self.base_url)
        status, session = admin.login("admin", "administrator-pass-123")
        self.assertEqual((status, session["role"]), (200, "admin"))
        status, saved = admin.request(
            "PUT",
            "/api/state",
            {"version": 3, "state": unauthorized_transition},
            csrf=True,
        )
        self.assertEqual((status, saved["version"]), (200, 4))

        status, conflict = admin.request(
            "PUT",
            "/api/state",
            {"version": 3, "state": unauthorized_transition},
            csrf=True,
        )
        self.assertEqual(status, 409)
        self.assertEqual(conflict["version"], 4)

        status, audit = admin.request("GET", "/api/audit")
        self.assertEqual(status, 200)
        self.assertEqual(len(audit["entries"]), 4)
        self.assertTrue(
            all(entry["action"] == "state_replaced" for entry in audit["entries"])
        )

        status, payload = operator.request(
            "POST", "/api/workflows/run", {}, csrf=True
        )
        self.assertEqual(status, 403)

        status, first_run = admin.request(
            "POST", "/api/workflows/run", {}, csrf=True
        )
        self.assertEqual((status, first_run["status"]), (200, "success"))
        self.assertEqual(
            first_run["runs"]["alert_evaluation"]["new_delivery_count"], 1
        )
        status, second_run = admin.request(
            "POST", "/api/workflows/run", {}, csrf=True
        )
        self.assertEqual(status, 200)
        self.assertEqual(
            second_run["runs"]["alert_evaluation"]["new_delivery_count"], 0
        )
        self.assertEqual(
            second_run["runs"]["alert_evaluation"]["deduplicated_state_count"], 1
        )
        status, workflows = admin.request("GET", "/api/workflows")
        self.assertEqual(status, 200)
        self.assertEqual(workflows["delivery_count"], 1)
        self.assertEqual(len(workflows["runs"]), 4)

        connection = self.server.RequestHandlerClass.database.connect()
        with self.assertRaises(Exception):
            connection.execute("DELETE FROM audit_log")
        with self.assertRaises(Exception):
            connection.execute("DELETE FROM workflow_runs")
        connection.close()

    def test_scheduler_records_repeated_successful_runs(self):
        admin = ApiClient(self.base_url)
        status, _ = admin.login("admin", "administrator-pass-123")
        self.assertEqual(status, 200)
        status, saved = admin.request(
            "PUT", "/api/state", {"version": 0, "state": BASE_STATE}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 1))

        database = self.server.RequestHandlerClass.database
        scheduler = WorkflowScheduler(database, 1)
        scheduler.start()
        time.sleep(1.25)
        scheduler.stop()

        runs = database.workflow_runs(limit=20)["runs"]
        scheduled_daily = [
            run
            for run in runs
            if run["workflow"] == "daily_brief"
            and run["trigger"] == "scheduled"
            and run["status"] == "success"
        ]
        scheduled_alerts = [
            run
            for run in runs
            if run["workflow"] == "alert_evaluation"
            and run["trigger"] == "scheduled"
            and run["status"] == "success"
        ]
        self.assertGreaterEqual(len(scheduled_daily), 2)
        self.assertGreaterEqual(len(scheduled_alerts), 2)
        self.assertEqual(scheduled_alerts[0]["output"]["new_delivery_count"], 0)

    def test_city_sync_preserves_local_workflow_and_is_idempotent(self):
        admin = ApiClient(self.base_url)
        status, _ = admin.login("admin", "administrator-pass-123")
        self.assertEqual(status, 200)
        initial = deepcopy(BASE_STATE)
        initial["issues"][0].update(
            {
                "status": "assigned",
                "team": "Central response",
                "notes": "Operator is en route.",
            }
        )
        status, saved = admin.request(
            "PUT", "/api/state", {"version": 0, "state": initial}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 1))

        payload = {
            "features": [
                {
                    "attributes": {
                        "CASE_ID": "CAS-TEST-001",
                        "STATUS": "Closed",
                        "STATUS_DATE": 1784865600000,
                        "REPORTED_DATE": 1784779200000,
                        "REQUEST_TYPE": "Shared Electric Bike & Scooters",
                        "STREET": "100 Updated Test St",
                        "CITY": "Columbus",
                        "ZIP": "43215",
                        "COLUMBUSCOMMUNITY": "Downtown",
                        "AREACOMMISSION": "Downtown",
                        "COUNCILDISTRICT": "1",
                        "LATITUDE": 39.961,
                        "LONGITUDE": -83.001,
                        "REQUEST_MODIFIED": 1784865600000,
                    }
                },
                {
                    "attributes": {
                        "CASE_ID": "CAS-TEST-002",
                        "STATUS": "Open",
                        "STATUS_DATE": 1784869200000,
                        "REPORTED_DATE": 1784862000000,
                        "REQUEST_TYPE": "Shared Electric Bike & Scooters",
                        "STREET": "200 New Test St",
                        "CITY": "Columbus",
                        "ZIP": "43215",
                        "COLUMBUSCOMMUNITY": "Downtown",
                        "AREACOMMISSION": "Downtown",
                        "COUNCILDISTRICT": "1",
                        "LATITUDE": 39.962,
                        "LONGITUDE": -83.002,
                        "REQUEST_MODIFIED": 1784869200000,
                    }
                },
            ]
        }
        database = self.server.RequestHandlerClass.database
        first = database.sync_city_311(fetcher=lambda: payload)
        self.assertEqual(
            (
                first["status"],
                first["added"],
                first["updated"],
                first["state_changed"],
                first["state_version"],
            ),
            ("success", 1, 1, True, 2),
        )

        status, durable = admin.request("GET", "/api/state")
        self.assertEqual(status, 200)
        by_id = {issue["id"]: issue for issue in durable["state"]["issues"]}
        existing = by_id["CAS-TEST-001"]
        self.assertEqual(existing["status"], "assigned")
        self.assertEqual(existing["team"], "Central response")
        self.assertEqual(existing["notes"], "Operator is en route.")
        self.assertEqual(existing["sourceStatus"], "Closed")
        self.assertEqual(existing["address"], "100 Updated Test St")
        self.assertEqual(by_id["CAS-TEST-002"]["status"], "received")

        second = database.sync_city_311(fetcher=lambda: payload)
        self.assertEqual(
            (second["status"], second["added"], second["updated"], second["state_changed"]),
            ("success", 0, 0, False),
        )
        status, durable = admin.request("GET", "/api/state")
        self.assertEqual((status, durable["version"]), (200, 2))
        self.assertEqual(len(durable["state"]["issues"]), 2)
        sync_entries = [
            entry
            for entry in database.audit(limit=20)
            if entry["action"] == "source_records_synced"
        ]
        self.assertEqual(len(sync_entries), 1)

    def test_operator_state_boundary_and_minimum_fields(self):
        operator = ApiClient(self.base_url)
        status, _ = operator.login("operator", "operator-pass-123")
        self.assertEqual(status, 200)
        status, saved = operator.request(
            "PUT", "/api/state", {"version": 0, "state": BASE_STATE}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 1))

        malformed = deepcopy(BASE_STATE)
        malformed["issues"].append(
            {
                "id": "CAS-MALFORMED",
                "address": "",
                "zone": "Downtown",
                "reportedAt": "not-a-date",
                "lat": 39.96,
                "lng": -83.0,
                "status": "received",
                "priority": "standard",
            }
        )
        status, payload = operator.request(
            "PUT", "/api/state", {"version": 1, "state": malformed}, csrf=True
        )
        self.assertEqual(status, 400)
        self.assertIn("requires descriptor", payload["error"])

        protected_section = deepcopy(BASE_STATE)
        protected_section["cityFeedRecordCount"] = 0
        status, payload = operator.request(
            "PUT",
            "/api/state",
            {"version": 1, "state": protected_section},
            csrf=True,
        )
        self.assertEqual(status, 403)
        self.assertIn("administrator required to change sections", payload["error"])

        altered_rule = deepcopy(BASE_STATE)
        altered_rule["alertSubscriptions"][0]["severity"] = "standard"
        status, payload = operator.request(
            "PUT", "/api/state", {"version": 1, "state": altered_rule}, csrf=True
        )
        self.assertEqual(status, 403)
        self.assertIn("only enable or pause", payload["error"])

        deleted_rule = deepcopy(BASE_STATE)
        deleted_rule["alertSubscriptions"] = []
        status, payload = operator.request(
            "PUT", "/api/state", {"version": 1, "state": deleted_rule}, csrf=True
        )
        self.assertEqual(status, 403)
        self.assertIn("cannot delete alert subscriptions", payload["error"])

        paused_rule = deepcopy(BASE_STATE)
        paused_rule["alertSubscriptions"][0]["enabled"] = False
        status, saved = operator.request(
            "PUT", "/api/state", {"version": 1, "state": paused_rule}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 2))

        duplicate_request = deepcopy(paused_rule)
        duplicate_request["issues"].append(deepcopy(duplicate_request["issues"][0]))
        status, payload = operator.request(
            "PUT",
            "/api/state",
            {"version": 2, "state": duplicate_request},
            csrf=True,
        )
        self.assertEqual(status, 400)
        self.assertIn("request ids must be unique", payload["error"])


if __name__ == "__main__":
    unittest.main()
