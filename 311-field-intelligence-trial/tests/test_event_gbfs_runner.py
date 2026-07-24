import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from event_gbfs_runner import collection_windows, due_windows, run_due  # noqa: E402


class EventGbfsRunnerTest(unittest.TestCase):
    def test_windows_are_before_start_and_after_expected_end(self):
        events = [
            {
                "id": "EVENT-1",
                "name": "Major event",
                "status": "scheduled",
                "start_at": "2026-07-25T23:00:00Z",
                "expected_end_at": "2026-07-26T01:15:00Z",
            }
        ]
        windows = collection_windows(events, pre_minutes=30, post_minutes=30)
        self.assertEqual(
            [(item["phase"], item["scheduled_at"].isoformat()) for item in windows],
            [
                ("pre_event", "2026-07-25T22:30:00+00:00"),
                ("post_event", "2026-07-26T01:45:00+00:00"),
            ],
        )

    def test_due_window_runs_once(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            events = root / "events.json"
            state = root / "state.json"
            notebook = root / "collector.ipynb"
            notebook.write_text("{}", encoding="utf-8")
            events.write_text(
                json.dumps(
                    {
                        "events": [
                            {
                                "id": "EVENT-1",
                                "name": "Major event",
                                "status": "scheduled",
                                "start_at": "2026-07-25T23:00:00Z",
                                "expected_end_at": "2026-07-26T01:15:00Z",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            calls = []

            def executor(notebook_path, output_dir, window):
                calls.append(window["key"])
                return output_dir / "result.ipynb"

            now = datetime(2026, 7, 25, 22, 35, tzinfo=timezone.utc)
            first = run_due(
                events,
                notebook,
                state,
                root / "runs",
                now=now,
                executor=executor,
            )
            second = run_due(
                events,
                notebook,
                state,
                root / "runs",
                now=now,
                executor=executor,
            )
            self.assertEqual(first["due_count"], 1)
            self.assertEqual(second["due_count"], 0)
            self.assertEqual(calls, ["EVENT-1:pre_event"])

    def test_completed_and_expired_windows_are_not_due(self):
        windows = [
            {
                "key": "EVENT-1:pre_event",
                "scheduled_at": datetime(2026, 7, 25, 22, 30, tzinfo=timezone.utc),
            }
        ]
        now = datetime(2026, 7, 25, 23, 0, tzinfo=timezone.utc)
        self.assertEqual(due_windows(windows, {}, now, tolerance_minutes=10), [])
        now = datetime(2026, 7, 25, 22, 35, tzinfo=timezone.utc)
        self.assertEqual(
            due_windows(
                windows,
                {"EVENT-1:pre_event": {"completed_at": "done"}},
                now,
                tolerance_minutes=10,
            ),
            [],
        )


if __name__ == "__main__":
    unittest.main()
