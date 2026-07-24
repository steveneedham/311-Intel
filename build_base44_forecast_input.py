#!/usr/bin/env python3
"""Build a compact, deterministic input for the Base44 daily forecast agent."""

import argparse
import json
import math
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
CLUSTER_RADIUS_METERS = 20
MIN_CLUSTER_SIZE = 4
HORIZONS = (24, 48, 72)
SEVERITY_WEIGHTS = {
    "ada_ramp": 5,
    "ada_concern": 5,
    "business_entrance": 4,
    "sidewalk_block": 3,
    "pile_up": 3,
    "pile-up": 3,
    "no_ride_zone": 2,
    "abandoned": 1,
}


def parse_datetime(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def snapshot_datetime(snapshot_id):
    return datetime.strptime(snapshot_id, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)


def distance_meters(first, second):
    latitude = (first["lat"] + second["lat"]) / 2
    lat_scale = 111320
    lng_scale = 111320 * math.cos(math.radians(latitude))
    return math.hypot(
        (first["lat"] - second["lat"]) * lat_scale,
        (first["lng"] - second["lng"]) * lng_scale,
    )


def detect_cross_vendor_clusters(vehicles):
    cell = 0.00018
    buckets = defaultdict(list)
    for index, vehicle in enumerate(vehicles):
        buckets[
            (math.floor(vehicle["lat"] / cell), math.floor(vehicle["lng"] / cell))
        ].append(index)

    visited = set()
    clusters = []
    for index, vehicle in enumerate(vehicles):
        if index in visited:
            continue
        visited.add(index)
        queue = [index]
        members = []
        while queue:
            current_index = queue.pop()
            current = vehicles[current_index]
            members.append(current)
            cell_lat = math.floor(current["lat"] / cell)
            cell_lng = math.floor(current["lng"] / cell)
            for y in range(-1, 2):
                for x in range(-1, 2):
                    for neighbor_index in buckets.get((cell_lat + y, cell_lng + x), []):
                        if neighbor_index in visited:
                            continue
                        neighbor = vehicles[neighbor_index]
                        if distance_meters(current, neighbor) <= CLUSTER_RADIUS_METERS:
                            visited.add(neighbor_index)
                            queue.append(neighbor_index)
        operators = Counter(item.get("company") or "unknown" for item in members)
        if len(members) >= MIN_CLUSTER_SIZE and len(operators) > 1:
            clusters.append(
                {
                    "vehicle_count": len(members),
                    "operators": dict(sorted(operators.items())),
                    "lat": round(sum(item["lat"] for item in members) / len(members), 6),
                    "lng": round(sum(item["lng"] for item in members) / len(members), 6),
                }
            )
    clusters.sort(key=lambda item: (-item["vehicle_count"], item["lat"], item["lng"]))
    return clusters


def complaint_pressure(records, as_of):
    periods = {}
    for days in (1, 3, 7, 30):
        eligible = []
        for record in records:
            reported = parse_datetime(record.get("reported_at"))
            if reported and 0 <= (as_of - reported).total_seconds() <= days * 86400:
                eligible.append(record)
        periods[str(days)] = {
            "complaints": len(eligible),
            "severity_points": sum(
                SEVERITY_WEIGHTS.get(record.get("complaint_type"), 1)
                for record in eligible
            ),
        }

    zone_signals = []
    by_zone = defaultdict(list)
    for record in records:
        reported = parse_datetime(record.get("reported_at"))
        if reported and 0 <= (as_of - reported).total_seconds() <= 7 * 86400:
            by_zone[record.get("zone_id") or "unknown"].append(record)
    for zone, items in by_zone.items():
        types = Counter(item.get("complaint_type") or "unknown" for item in items)
        operators = Counter(item.get("operator") or "unknown" for item in items)
        severity = sum(SEVERITY_WEIGHTS.get(item.get("complaint_type"), 1) for item in items)
        zone_signals.append(
            {
                "zone": zone,
                "complaints_7d": len(items),
                "severity_points_7d": severity,
                "complaint_types": dict(sorted(types.items())),
                "operators": dict(sorted(operators.items())),
            }
        )
    zone_signals.sort(
        key=lambda item: (-item["severity_points_7d"], -item["complaints_7d"], item["zone"])
    )
    return periods, zone_signals


def fleet_summary(vehicles):
    operators = Counter(item.get("company") or "unknown" for item in vehicles)
    vehicle_types = Counter(item.get("type") or "unknown" for item in vehicles)
    unavailable = sum(
        1
        for item in vehicles
        if not item.get("available") or item.get("disabled") or item.get("reserved")
    )
    low_battery = sum(1 for item in vehicles if (item.get("battery") or 0) <= 20)
    return {
        "vehicles": len(vehicles),
        "operators": dict(sorted(operators.items())),
        "vehicle_types": dict(sorted(vehicle_types.items())),
        "unavailable_or_restricted": unavailable,
        "battery_at_or_below_20_percent": low_battery,
    }


def upcoming_events(events, as_of):
    result = []
    for event in events:
        start = parse_datetime(event.get("start_at"))
        if not start:
            continue
        hours = (start - as_of).total_seconds() / 3600
        if 0 <= hours <= max(HORIZONS):
            result.append(
                {
                    "id": event.get("id"),
                    "name": event.get("name"),
                    "start_at": event.get("start_at"),
                    "hours_from_as_of": round(hours, 1),
                }
            )
    return sorted(result, key=lambda item: item["start_at"])


def build(positions_path, complaints_path, history_path, events_path):
    positions = json.loads(positions_path.read_text(encoding="utf-8"))
    complaints = json.loads(complaints_path.read_text(encoding="utf-8"))
    history = json.loads(history_path.read_text(encoding="utf-8"))
    events = json.loads(events_path.read_text(encoding="utf-8"))

    as_of = snapshot_datetime(positions["snapshot_id"])
    vehicles = positions.get("vehicles", [])
    records = complaints.get("records", [])
    clusters = detect_cross_vendor_clusters(vehicles)
    periods, zone_signals = complaint_pressure(records, as_of)

    return {
        "schema_version": 1,
        "purpose": "credit-efficient-input-for-11-columbus-daily-forecast",
        "as_of": as_of.isoformat().replace("+00:00", "Z"),
        "forecast_horizons_hours": list(HORIZONS),
        "freshness": {
            "gbfs_snapshot_id": positions["snapshot_id"],
            "gbfs_position_count": positions.get("position_count", len(vehicles)),
            "complaint_feed_fetched_at": complaints.get("fetched_at"),
            "complaint_record_count": complaints.get("record_count", len(records)),
        },
        "fleet": fleet_summary(vehicles),
        "cross_vendor_stacking": {
            "method": "connected vehicles within 20 metres; minimum four vehicles; more than one operator",
            "cluster_count": len(clusters),
            "top_clusters": clusters[:25],
        },
        "complaint_pressure": {
            "severity_weights": SEVERITY_WEIGHTS,
            "periods_days": periods,
            "top_zone_signals_7d": zone_signals[:20],
        },
        "named_watch": {
            "watch": history.get("watch"),
            "observations": history.get("snapshots", [])[-20:],
        },
        "events_next_72h": upcoming_events(events.get("events", []), as_of),
        "agent_guardrails": [
            "Treat GBFS positions as a point-in-time operational signal, not a prediction.",
            "Treat cross-vendor stacking as a proximity flag requiring review, not a violation.",
            "Treat user-reported ADA language as an allegation unless supporting evidence is verified.",
            "Label 24h, 48h, and 72h outputs as forecasts with confidence and evidence timestamps.",
            "Do not infer operator when the complaint source says unknown.",
        ],
    }


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--positions", type=Path, default=PROJECT_ROOT / "gbfs-vehicle-positions.json")
    parser.add_argument("--complaints", type=Path, default=PROJECT_ROOT / "columbus-311-current.json")
    parser.add_argument("--history", type=Path, default=PROJECT_ROOT / "gbfs-watch-history.json")
    parser.add_argument("--events", type=Path, default=PROJECT_ROOT / "external-events.json")
    parser.add_argument("--output", type=Path, default=PROJECT_ROOT / "base44-forecast-input.json")
    return parser.parse_args()


def main():
    args = parse_args()
    payload = build(args.positions, args.complaints, args.history, args.events)
    args.output.write_text(
        json.dumps(payload, separators=(",", ":"), sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output),
                "bytes": args.output.stat().st_size,
                "clusters": payload["cross_vendor_stacking"]["cluster_count"],
                "zones": len(payload["complaint_pressure"]["top_zone_signals_7d"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
