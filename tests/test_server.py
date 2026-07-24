import http.cookiejar
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(PROJECT_ROOT))

from server import create_server  # noqa: E402


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
            "lat": 39.96,
            "lng": -83.0,
        }
    ],
    "interventions": [],
    "outcomes": [],
    "alertSubscriptions": [],
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
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
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
        status, _ = anonymous.request("GET", "/api/state")
        self.assertEqual(status, 401)

        operator = ApiClient(self.base_url)
        status, session = operator.login("operator", "operator-pass-123")
        self.assertEqual(status, 200)
        self.assertEqual(session["role"], "operator")

        status, saved = operator.request(
            "PUT", "/api/state", {"version": 0, "state": BASE_STATE}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 1))

        status, durable = operator.request("GET", "/api/state")
        self.assertEqual(status, 200)
        self.assertNotIn("auditLog", durable["state"])

        assigned = deepcopy(durable["state"])
        assigned["issues"][0].update(
            {"status": "assigned", "team": "Central response"}
        )
        status, saved = operator.request(
            "PUT", "/api/state", {"version": 1, "state": assigned}, csrf=True
        )
        self.assertEqual((status, saved["version"]), (200, 2))

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

        connection = self.server.RequestHandlerClass.database.connect()
        with self.assertRaises(Exception):
            connection.execute("DELETE FROM audit_log")
        connection.close()


if __name__ == "__main__":
    unittest.main()
