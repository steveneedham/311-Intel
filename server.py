#!/usr/bin/env python3
"""Local durable service for 311 Field Intelligence.

The server uses only the Python standard library. It serves the static app and
adds authenticated, versioned workflow state plus an append-only audit ledger.
"""

import argparse
import hashlib
import hmac
import http.cookies
import json
import os
import secrets
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROLE_RANK = {"viewer": 0, "operator": 1, "admin": 2}
SESSION_HOURS = 12
MAX_BODY_BYTES = 5_000_000
PASSWORD_ITERATIONS = 310_000


def now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def password_digest(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return salt.hex(), digest.hex()


def verify_password(password, salt_hex, digest_hex):
    _, candidate = password_digest(password, bytes.fromhex(salt_hex))
    return hmac.compare_digest(candidate, digest_hex)


class Database:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.initialize()

    def connect(self):
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        return connection

    def initialize(self):
        with self.lock, self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    role TEXT NOT NULL CHECK (role IN ('viewer','operator','admin')),
                    password_salt TEXT NOT NULL,
                    password_digest TEXT NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_digest TEXT PRIMARY KEY,
                    username TEXT NOT NULL REFERENCES users(username),
                    csrf_token TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS workflow_state (
                    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
                    version INTEGER NOT NULL,
                    state_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    updated_by TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS audit_log (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    at TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    role TEXT NOT NULL,
                    action TEXT NOT NULL,
                    target TEXT NOT NULL,
                    detail TEXT NOT NULL,
                    state_version INTEGER
                );
                CREATE TRIGGER IF NOT EXISTS audit_no_update
                BEFORE UPDATE ON audit_log BEGIN
                    SELECT RAISE(ABORT, 'audit log is append-only');
                END;
                CREATE TRIGGER IF NOT EXISTS audit_no_delete
                BEFORE DELETE ON audit_log BEGIN
                    SELECT RAISE(ABORT, 'audit log is append-only');
                END;
                CREATE TABLE IF NOT EXISTS workflow_runs (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    workflow TEXT NOT NULL,
                    trigger TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('success','skipped','failed')),
                    output_json TEXT NOT NULL
                );
                CREATE TRIGGER IF NOT EXISTS workflow_runs_no_update
                BEFORE UPDATE ON workflow_runs BEGIN
                    SELECT RAISE(ABORT, 'workflow runs are append-only');
                END;
                CREATE TRIGGER IF NOT EXISTS workflow_runs_no_delete
                BEFORE DELETE ON workflow_runs BEGIN
                    SELECT RAISE(ABORT, 'workflow runs are append-only');
                END;
                CREATE TABLE IF NOT EXISTS scheduled_alert_deliveries (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    dedupe_key TEXT NOT NULL UNIQUE,
                    subscription_id TEXT NOT NULL,
                    issue_id TEXT NOT NULL,
                    issue_status TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    zone TEXT NOT NULL,
                    state TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO workflow_state
                (singleton, version, state_json, updated_at, updated_by)
                VALUES (1, 0, 'null', ?, 'system')
                """,
                (now_iso(),),
            )

    def seed_users_from_environment(self):
        configured = []
        for username, role, variable in (
            ("viewer", "viewer", "APP_VIEWER_PASSWORD"),
            ("operator", "operator", "APP_OPERATOR_PASSWORD"),
            ("admin", "admin", "APP_ADMIN_PASSWORD"),
        ):
            password = os.environ.get(variable)
            if not password:
                continue
            if len(password) < 12:
                raise ValueError(f"{variable} must contain at least 12 characters")
            salt, digest = password_digest(password)
            with self.lock, self.connect() as connection:
                connection.execute(
                    """
                    INSERT INTO users
                    (username, role, password_salt, password_digest, active, updated_at)
                    VALUES (?, ?, ?, ?, 1, ?)
                    ON CONFLICT(username) DO UPDATE SET
                      role=excluded.role,
                      password_salt=excluded.password_salt,
                      password_digest=excluded.password_digest,
                      active=1,
                      updated_at=excluded.updated_at
                    """,
                    (username, role, salt, digest, now_iso()),
                )
                connection.execute(
                    "DELETE FROM sessions WHERE username=?",
                    (username,),
                )
            configured.append(username)
        return configured

    def authenticate(self, username, password):
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM users WHERE username=? AND active=1", (username,)
            ).fetchone()
        if not row or not verify_password(
            password, row["password_salt"], row["password_digest"]
        ):
            return None
        return {"username": row["username"], "role": row["role"]}

    def create_session(self, username):
        token = secrets.token_urlsafe(32)
        csrf = secrets.token_urlsafe(24)
        expires = datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)
        with self.lock, self.connect() as connection:
            connection.execute(
                """
                INSERT INTO sessions
                (token_digest, username, csrf_token, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    hashlib.sha256(token.encode()).hexdigest(),
                    username,
                    csrf,
                    expires.isoformat(),
                    now_iso(),
                ),
            )
        return token, csrf, expires

    def session(self, token):
        if not token:
            return None
        digest = hashlib.sha256(token.encode()).hexdigest()
        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT s.*, u.role, u.active
                FROM sessions s JOIN users u ON u.username=s.username
                WHERE s.token_digest=?
                """,
                (digest,),
            ).fetchone()
        if (
            not row
            or not row["active"]
            or datetime.fromisoformat(row["expires_at"]) <= datetime.now(timezone.utc)
        ):
            return None
        return {
            "username": row["username"],
            "role": row["role"],
            "csrf": row["csrf_token"],
            "token_digest": digest,
        }

    def delete_session(self, token_digest):
        if not token_digest:
            return
        with self.lock, self.connect() as connection:
            connection.execute(
                "DELETE FROM sessions WHERE token_digest=?", (token_digest,)
            )

    def get_state(self):
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM workflow_state WHERE singleton=1"
            ).fetchone()
        return {
            "version": row["version"],
            "state": json.loads(row["state_json"]),
            "updated_at": row["updated_at"],
            "updated_by": row["updated_by"],
        }

    def replace_state(self, expected_version, state, actor, role):
        clean_state = dict(state)
        clean_state.pop("auditLog", None)
        with self.lock, self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            current = connection.execute(
                "SELECT * FROM workflow_state WHERE singleton=1"
            ).fetchone()
            if current["version"] != expected_version:
                connection.rollback()
                return None
            previous = json.loads(current["state_json"])
            validate_transition(previous, clean_state, role)
            next_version = expected_version + 1
            connection.execute(
                """
                UPDATE workflow_state
                SET version=?, state_json=?, updated_at=?, updated_by=?
                WHERE singleton=1
                """,
                (
                    next_version,
                    json.dumps(clean_state, separators=(",", ":")),
                    now_iso(),
                    actor,
                ),
            )
            connection.execute(
                """
                INSERT INTO audit_log
                (at, actor, role, action, target, detail, state_version)
                VALUES (?, ?, ?, 'state_replaced', 'workflow_state', ?, ?)
                """,
                (
                    now_iso(),
                    actor,
                    role,
                    summarize_change(previous, clean_state),
                    next_version,
                ),
            )
            connection.commit()
        return next_version

    def audit(self, limit=200):
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM audit_log ORDER BY sequence DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(row) for row in rows]

    def run_workflows(self, trigger="scheduled"):
        started_at = now_iso()
        with self.lock, self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT state_json, version FROM workflow_state WHERE singleton=1"
            ).fetchone()
            state = json.loads(row["state_json"])
            if not state:
                outputs = {
                    "daily_brief": {"reason": "durable workflow state is not initialized"},
                    "alert_evaluation": {"reason": "durable workflow state is not initialized"},
                }
                status = "skipped"
            else:
                outputs = {
                    "daily_brief": build_daily_brief(state),
                    "alert_evaluation": evaluate_alerts(connection, state),
                }
                status = "success"
            completed_at = now_iso()
            for workflow, output in outputs.items():
                connection.execute(
                    """
                    INSERT INTO workflow_runs
                    (workflow, trigger, started_at, completed_at, status, output_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        workflow,
                        trigger,
                        started_at,
                        completed_at,
                        status,
                        json.dumps(output, separators=(",", ":")),
                    ),
                )
            connection.commit()
        return {"status": status, "runs": outputs, "completed_at": completed_at}

    def workflow_runs(self, limit=40):
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM workflow_runs ORDER BY sequence DESC LIMIT ?", (limit,)
            ).fetchall()
            delivery_count = connection.execute(
                "SELECT COUNT(*) AS count FROM scheduled_alert_deliveries"
            ).fetchone()["count"]
        return {
            "runs": [
                {**dict(row), "output": json.loads(row["output_json"])}
                for row in rows
            ],
            "delivery_count": delivery_count,
        }


def indexed(items):
    return {str(item.get("id")): item for item in items or [] if item.get("id")}


def validate_transition(previous, candidate, role):
    if not isinstance(candidate, dict):
        raise ValueError("state must be an object")
    if role not in ROLE_RANK or ROLE_RANK[role] < ROLE_RANK["operator"]:
        raise PermissionError("operator role required")
    if role == "admin" or previous is None:
        return

    previous_issues = indexed(previous.get("issues"))
    candidate_issues = indexed(candidate.get("issues"))
    if not previous_issues.keys() <= candidate_issues.keys():
        raise PermissionError("operators cannot delete requests")
    mutable_issue_fields = {"status", "team", "notes"}
    for issue_id, old in previous_issues.items():
        new = candidate_issues[issue_id]
        changed = {key for key in set(old) | set(new) if old.get(key) != new.get(key)}
        if not changed <= mutable_issue_fields:
            raise PermissionError(
                f"operators cannot alter source fields for request {issue_id}"
            )

    previous_interventions = indexed(previous.get("interventions"))
    candidate_interventions = indexed(candidate.get("interventions"))
    if not previous_interventions.keys() <= candidate_interventions.keys():
        raise PermissionError("operators cannot delete interventions")
    for intervention_id, old in previous_interventions.items():
        if candidate_interventions[intervention_id] != old:
            raise PermissionError(
                f"administrator required to change intervention {intervention_id}"
            )
    for intervention_id in candidate_interventions.keys() - previous_interventions.keys():
        if candidate_interventions[intervention_id].get("status") != "recommended":
            raise PermissionError("operators may only add recommended interventions")

    if candidate.get("outcomes", []) != previous.get("outcomes", []):
        raise PermissionError("administrator required to change outcomes")


def summarize_change(previous, candidate):
    if previous is None:
        return "initial durable state"
    parts = []
    for key in ("issues", "interventions", "outcomes", "alertSubscriptions"):
        before = len(previous.get(key, []))
        after = len(candidate.get(key, []))
        if before != after:
            parts.append(f"{key}: {before} to {after}")
    return "; ".join(parts) or "workflow fields updated"


def parse_time(value):
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def build_daily_brief(state):
    issues = state.get("issues", [])
    valid_times = [
        parsed for parsed in (parse_time(issue.get("reportedAt")) for issue in issues)
        if parsed
    ]
    anchor = max(valid_times) if valid_times else datetime.now(timezone.utc)
    window_start = anchor - timedelta(hours=24)
    recent = [
        issue for issue in issues
        if (parse_time(issue.get("reportedAt")) or datetime.min.replace(tzinfo=timezone.utc))
        >= window_start
    ]
    critical = [
        issue for issue in issues
        if issue.get("status") != "resolved" and issue.get("priority") == "critical"
    ]
    dispatched = [
        item for item in state.get("interventions", [])
        if item.get("status") == "dispatched"
    ]
    measured = [
        item for item in state.get("outcomes", [])
        if isinstance(item.get("post"), (int, float))
    ]
    return {
        "source_anchor": anchor.isoformat().replace("+00:00", "Z"),
        "window_start": window_start.isoformat().replace("+00:00", "Z"),
        "new_request_count": len(recent),
        "unresolved_critical_count": len(critical),
        "dispatched_intervention_count": len(dispatched),
        "measured_outcome_count": len(measured),
    }


def subscription_matches(issue, subscription):
    severity_rank = {"standard": 0, "high": 1, "critical": 2}
    return (
        issue.get("status") != "resolved"
        and severity_rank.get(issue.get("priority"), 0)
        >= severity_rank.get(subscription.get("severity"), 2)
        and (
            subscription.get("zone") == "all"
            or subscription.get("zone") == issue.get("zone")
        )
    )


def evaluate_alerts(connection, state):
    created = 0
    matched = 0
    issues = state.get("issues", [])
    subscriptions = [
        item for item in state.get("alertSubscriptions", []) if item.get("enabled")
    ]
    for subscription in subscriptions:
        for issue in issues:
            if not subscription_matches(issue, subscription):
                continue
            matched += 1
            dedupe_key = ":".join(
                str(value)
                for value in (
                    subscription.get("id"),
                    issue.get("id"),
                    issue.get("status"),
                    issue.get("priority"),
                )
            )
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO scheduled_alert_deliveries
                (dedupe_key, subscription_id, issue_id, issue_status, severity,
                 zone, state, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'server_recorded', ?)
                """,
                (
                    dedupe_key,
                    str(subscription.get("id")),
                    str(issue.get("id")),
                    str(issue.get("status")),
                    str(issue.get("priority")),
                    str(issue.get("zone")),
                    now_iso(),
                ),
            )
            created += max(cursor.rowcount, 0)
    return {
        "enabled_subscription_count": len(subscriptions),
        "matched_state_count": matched,
        "new_delivery_count": created,
        "deduplicated_state_count": matched - created,
    }


class WorkflowScheduler:
    def __init__(self, database, interval_seconds):
        self.database = database
        self.interval_seconds = max(1, int(interval_seconds))
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._run, daemon=True)

    def start(self):
        self.thread.start()

    def _run(self):
        while not self.stop_event.is_set():
            try:
                self.database.run_workflows("scheduled")
            except Exception as error:
                with self.database.lock, self.database.connect() as connection:
                    connection.execute(
                        """
                        INSERT INTO workflow_runs
                        (workflow, trigger, started_at, completed_at, status, output_json)
                        VALUES ('scheduler', 'scheduled', ?, ?, 'failed', ?)
                        """,
                        (
                            now_iso(),
                            now_iso(),
                            json.dumps({"error": str(error)}, separators=(",", ":")),
                        ),
                    )
            self.stop_event.wait(self.interval_seconds)

    def stop(self):
        self.stop_event.set()
        if self.thread.is_alive():
            self.thread.join(timeout=3)


class AppHandler(SimpleHTTPRequestHandler):
    database = None
    static_root = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(self.static_root), **kwargs)

    def log_message(self, format_string, *args):
        if os.environ.get("APP_REQUEST_LOG") == "1":
            super().log_message(format_string, *args)

    def json_response(self, status, payload, headers=None):
        body = json.dumps(payload, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def body_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("invalid Content-Length") from error
        if length <= 0 or length > MAX_BODY_BYTES:
            raise ValueError("request body size is invalid")
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError as error:
            raise ValueError("request body is not valid JSON") from error

    def cookie_token(self):
        cookie = http.cookies.SimpleCookie(self.headers.get("Cookie"))
        morsel = cookie.get("311_session")
        return morsel.value if morsel else None

    def current_session(self):
        return self.database.session(self.cookie_token())

    def require_session(self, role="viewer", csrf=False):
        session = self.current_session()
        if not session:
            self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "authentication required"})
            return None
        if ROLE_RANK[session["role"]] < ROLE_RANK[role]:
            self.json_response(HTTPStatus.FORBIDDEN, {"error": f"{role} role required"})
            return None
        if csrf and not hmac.compare_digest(
            self.headers.get("X-CSRF-Token", ""), session["csrf"]
        ):
            self.json_response(HTTPStatus.FORBIDDEN, {"error": "invalid CSRF token"})
            return None
        return session

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            self.json_response(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "storage": "sqlite",
                    "authenticated": bool(self.current_session()),
                    "scheduler_enabled": self.server.scheduler_enabled,
                    "scheduler_interval_seconds": self.server.scheduler_interval_seconds,
                },
            )
        elif path == "/api/session":
            session = self.current_session()
            if not session:
                self.json_response(HTTPStatus.OK, {"authenticated": False})
            else:
                self.json_response(
                    HTTPStatus.OK,
                    {
                        "authenticated": True,
                        "username": session["username"],
                        "role": session["role"],
                        "csrf": session["csrf"],
                    },
                )
        elif path == "/api/state":
            session = self.require_session()
            if session:
                self.json_response(HTTPStatus.OK, self.database.get_state())
        elif path == "/api/audit":
            session = self.require_session()
            if session:
                self.json_response(HTTPStatus.OK, {"entries": self.database.audit()})
        elif path == "/api/workflows":
            session = self.require_session()
            if session:
                self.json_response(
                    HTTPStatus.OK,
                    {
                        "enabled": self.server.scheduler_enabled,
                        "interval_seconds": self.server.scheduler_interval_seconds,
                        **self.database.workflow_runs(),
                    },
                )
        elif path.startswith("/api/"):
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "not found"})
        else:
            super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self.body_json()
        except ValueError as error:
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return
        if path == "/api/login":
            user = self.database.authenticate(
                str(payload.get("username", "")), str(payload.get("password", ""))
            )
            if not user:
                self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "invalid credentials"})
                return
            token, csrf, expires = self.database.create_session(user["username"])
            cookie = (
                f"311_session={token}; HttpOnly; SameSite=Strict; Path=/; "
                f"Max-Age={SESSION_HOURS * 3600}"
            )
            self.json_response(
                HTTPStatus.OK,
                {**user, "authenticated": True, "csrf": csrf, "expires_at": expires.isoformat()},
                {"Set-Cookie": cookie},
            )
        elif path == "/api/logout":
            session = self.require_session(csrf=True)
            if session:
                self.database.delete_session(session["token_digest"])
                self.json_response(
                    HTTPStatus.OK,
                    {"authenticated": False},
                    {"Set-Cookie": "311_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"},
                )
        elif path == "/api/workflows/run":
            session = self.require_session("admin", csrf=True)
            if session:
                self.json_response(
                    HTTPStatus.OK,
                    self.database.run_workflows("manual"),
                )
        else:
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_PUT(self):
        path = urlparse(self.path).path
        if path != "/api/state":
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "not found"})
            return
        session = self.require_session("operator", csrf=True)
        if not session:
            return
        try:
            payload = self.body_json()
            expected_version = int(payload.get("version"))
            state = payload.get("state")
            next_version = self.database.replace_state(
                expected_version,
                state,
                session["username"],
                session["role"],
            )
            if next_version is None:
                self.json_response(
                    HTTPStatus.CONFLICT,
                    {"error": "state version conflict", **self.database.get_state()},
                )
                return
            self.json_response(HTTPStatus.OK, {"version": next_version})
        except PermissionError as error:
            self.json_response(HTTPStatus.FORBIDDEN, {"error": str(error)})
        except (TypeError, ValueError) as error:
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(error)})


def create_server(
    host,
    port,
    database_path,
    static_root,
    scheduler_enabled=False,
    scheduler_interval_seconds=300,
):
    database = Database(database_path)
    configured_users = database.seed_users_from_environment()
    handler = type(
        "ConfiguredAppHandler",
        (AppHandler,),
        {"database": database, "static_root": Path(static_root)},
    )
    server = ThreadingHTTPServer((host, port), handler)
    server.configured_users = configured_users
    server.scheduler_enabled = bool(scheduler_enabled)
    server.scheduler_interval_seconds = max(1, int(scheduler_interval_seconds))
    server.scheduler = None
    if server.scheduler_enabled:
        server.scheduler = WorkflowScheduler(
            database, server.scheduler_interval_seconds
        )
        server.scheduler.start()
    return server


def main():
    parser = argparse.ArgumentParser(description="Serve 311 Field Intelligence")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument(
        "--database",
        type=Path,
        default=Path(os.environ.get("APP_DATABASE", "data/311-intel.sqlite3")),
    )
    args = parser.parse_args()
    scheduler_enabled = os.environ.get("APP_ENABLE_SCHEDULER") == "1"
    scheduler_interval = int(os.environ.get("APP_SCHEDULER_INTERVAL_SECONDS", "300"))
    server = create_server(
        args.host,
        args.port,
        args.database.resolve(),
        Path(__file__).resolve().parent,
        scheduler_enabled=scheduler_enabled,
        scheduler_interval_seconds=scheduler_interval,
    )
    print(
        json.dumps(
            {
                "url": f"http://{args.host}:{server.server_port}/",
                "database": str(args.database),
                "configured_users": server.configured_users,
                "scheduler_enabled": server.scheduler_enabled,
                "scheduler_interval_seconds": server.scheduler_interval_seconds,
            }
        ),
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        if server.scheduler:
            server.scheduler.stop()
        server.server_close()


if __name__ == "__main__":
    main()
