#!/usr/bin/env python3
"""Run a GBFS notebook once in each configured major-event collection window."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


DEFAULT_EVENTS = Path(__file__).resolve().parent / "external-events.json"
DEFAULT_STATE = Path(__file__).resolve().parent / "event-gbfs-runs.json"


def parse_time(value):
    if not value:
        return None
    return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(
        timezone.utc
    )


def collection_windows(events, pre_minutes=30, post_minutes=30):
    windows = []
    for event in events:
        if event.get("status") != "scheduled":
            continue
        start = parse_time(event.get("start_at"))
        expected_end = parse_time(event.get("expected_end_at"))
        if start:
            windows.append(
                {
                    "key": f"{event['id']}:pre_event",
                    "event_id": event["id"],
                    "event_name": event.get("name", event["id"]),
                    "phase": "pre_event",
                    "scheduled_at": start - timedelta(minutes=pre_minutes),
                }
            )
        if expected_end:
            windows.append(
                {
                    "key": f"{event['id']}:post_event",
                    "event_id": event["id"],
                    "event_name": event.get("name", event["id"]),
                    "phase": "post_event",
                    "scheduled_at": expected_end + timedelta(minutes=post_minutes),
                }
            )
    return sorted(windows, key=lambda item: item["scheduled_at"])


def due_windows(windows, completed, now=None, tolerance_minutes=10):
    now = now or datetime.now(timezone.utc)
    tolerance = timedelta(minutes=tolerance_minutes)
    return [
        window
        for window in windows
        if window["key"] not in completed
        and window["scheduled_at"] <= now <= window["scheduled_at"] + tolerance
    ]


def load_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return fallback


def save_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def execute_notebook(notebook, output_dir, window):
    output_dir.mkdir(parents=True, exist_ok=True)
    output_name = (
        f"{notebook.stem}-{window['event_id']}-{window['phase']}-"
        f"{window['scheduled_at'].strftime('%Y%m%dT%H%M%SZ')}.ipynb"
    )
    subprocess.run(
        [
            sys.executable,
            "-m",
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            str(notebook),
            "--output",
            output_name,
            "--output-dir",
            str(output_dir),
        ],
        check=True,
    )
    return output_dir / output_name


def run_due(
    events_path,
    notebook,
    state_path,
    output_dir,
    now=None,
    tolerance_minutes=10,
    pre_minutes=30,
    post_minutes=30,
    executor=execute_notebook,
    dry_run=False,
):
    events = load_json(events_path, {}).get("events", [])
    state = load_json(state_path, {"completed": {}})
    completed = state.setdefault("completed", {})
    windows = collection_windows(events, pre_minutes, post_minutes)
    due = due_windows(windows, completed, now, tolerance_minutes)
    results = []
    for window in due:
        if dry_run:
            results.append({**window, "status": "due"})
            continue
        output = executor(notebook, output_dir, window)
        completed[window["key"]] = {
            "completed_at": datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "output": str(output),
        }
        save_json(state_path, state)
        results.append({**window, "status": "completed", "output": str(output)})
    return {
        "checked_at": (now or datetime.now(timezone.utc))
        .isoformat()
        .replace("+00:00", "Z"),
        "window_count": len(windows),
        "due_count": len(due),
        "results": results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--notebook",
        type=Path,
        required=True,
        help="Path to Veo_Spin_CBS_GBFS_Extract.ipynb.",
    )
    parser.add_argument("--events", type=Path, default=DEFAULT_EVENTS)
    parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "event-notebook-runs",
    )
    parser.add_argument("--tolerance-minutes", type=int, default=10)
    parser.add_argument("--pre-minutes", type=int, default=30)
    parser.add_argument("--post-minutes", type=int, default=30)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not args.notebook.is_file():
        parser.error(f"Notebook does not exist: {args.notebook}")
    result = run_due(
        args.events,
        args.notebook,
        args.state,
        args.output_dir,
        tolerance_minutes=args.tolerance_minutes,
        pre_minutes=args.pre_minutes,
        post_minutes=args.post_minutes,
        dry_run=args.dry_run,
    )
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
