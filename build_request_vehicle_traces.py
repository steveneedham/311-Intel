#!/usr/bin/env python3
"""Link 311 requests to defensible GBFS vehicle-trajectory candidates."""

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

from build_gbfs_snapshot import (
    DEFAULT_SNAPSHOT_ROOT,
    find_snapshots,
    read_positions,
    snapshot_id,
    write_json,
)


def parse_timestamp(value):
    return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)


def snapshot_timestamp(path):
    return datetime.strptime(snapshot_id(path), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)


def distance_meters(first, second):
    lat_scale = 111320
    lng_scale = 111320 * math.cos(
        math.radians((first["lat"] + second["lat"]) / 2)
    )
    return math.hypot(
        (first["lat"] - second["lat"]) * lat_scale,
        (first["lng"] - second["lng"]) * lng_scale,
    )


def load_complaints(path):
    payload = json.loads(path.read_text(encoding="utf-8"))
    records = payload.get("records", payload) if isinstance(payload, dict) else payload
    if not isinstance(records, list):
        raise ValueError("Complaint input must be an array or contain a records array.")
    complaints = []
    for record in records:
        try:
            complaints.append(
                {
                    "id": str(record.get("source_id") or record["id"]),
                    "reported_at": parse_timestamp(record.get("reported_at") or record["reportedAt"]),
                    "lat": float(record.get("latitude", record.get("lat"))),
                    "lng": float(record.get("longitude", record.get("lng"))),
                    "operator": str(record.get("operator") or "unknown"),
                    "address": str(record.get("address") or ""),
                }
            )
        except (KeyError, TypeError, ValueError):
            continue
    return complaints


def load_snapshots(root):
    snapshots = []
    invalid_rows = 0
    for path in find_snapshots(root):
        vehicles, rejected = read_positions(path)
        invalid_rows += rejected
        snapshots.append(
            {
                "id": snapshot_id(path),
                "observed_at": snapshot_timestamp(path),
                "vehicles": vehicles,
            }
        )
    return snapshots, invalid_rows


def trace_vehicle(observations, complaint, radius, continuity_minutes):
    nearby = [
        {**observation, "distance_meters": round(distance_meters(observation, complaint))}
        for observation in observations
        if distance_meters(observation, complaint) <= radius
    ]
    nearby.sort(key=lambda item: item["observed_at"])
    before = [item for item in nearby if item["observed_at"] <= complaint["reported_at"]]
    first_near = before[-1] if before else nearby[0]
    sequence = [first_near]
    for observation in reversed([item for item in nearby if item["observed_at"] < first_near["observed_at"]]):
        gap = (sequence[0]["observed_at"] - observation["observed_at"]).total_seconds() / 60
        if gap > continuity_minutes:
            break
        sequence.insert(0, observation)
    first_near = sequence[0]
    prior_observations = [
        item for item in observations
        if item["observed_at"] < first_near["observed_at"]
    ]
    prior = prior_observations[-1] if prior_observations else None
    if prior and distance_meters(prior, complaint) <= radius:
        prior = None
    minimum_dwell = None
    if first_near["observed_at"] <= complaint["reported_at"]:
        minimum_dwell = max(
            0,
            round((complaint["reported_at"] - first_near["observed_at"]).total_seconds() / 60),
        )
    return {
        "first_observed_near_at": first_near["observed_at"].isoformat().replace("+00:00", "Z"),
        "minimum_dwell_minutes": minimum_dwell,
        "near_observation_count": len(sequence),
        "arrival_window_start": (
            prior["observed_at"].isoformat().replace("+00:00", "Z") if prior else None
        ),
        "arrival_window_end": first_near["observed_at"].isoformat().replace("+00:00", "Z"),
        "came_from": (
            {
                "lat": prior["lat"],
                "lng": prior["lng"],
                "observed_at": prior["observed_at"].isoformat().replace("+00:00", "Z"),
                "distance_to_request_meters": round(distance_meters(prior, complaint)),
            }
            if prior
            else None
        ),
    }


def match_request(
    complaint,
    snapshots,
    radius=40,
    lookback_hours=6,
    lookahead_minutes=60,
    continuity_minutes=90,
):
    window_start = complaint["reported_at"].timestamp() - lookback_hours * 3600
    window_end = complaint["reported_at"].timestamp() + lookahead_minutes * 60
    candidate_observations = {}
    all_observations = {}
    for snapshot in snapshots:
        for vehicle in snapshot["vehicles"]:
            observation = {
                **vehicle,
                "snapshot_id": snapshot["id"],
                "observed_at": snapshot["observed_at"],
            }
            all_observations.setdefault(vehicle["id"], []).append(observation)
            if not (window_start <= snapshot["observed_at"].timestamp() <= window_end):
                continue
            if complaint["operator"].lower() in {"spin", "veo"} and vehicle["company"].lower() != complaint["operator"].lower():
                continue
            distance = distance_meters(vehicle, complaint)
            if distance > radius:
                continue
            minutes = abs((snapshot["observed_at"] - complaint["reported_at"]).total_seconds()) / 60
            after_penalty = 15 if snapshot["observed_at"] > complaint["reported_at"] else 0
            candidate_observations.setdefault(vehicle["id"], []).append(
                {
                    **observation,
                    "distance_meters": round(distance),
                    "minutes_from_report": round(
                        (snapshot["observed_at"] - complaint["reported_at"]).total_seconds() / 60,
                        1,
                    ),
                    "score": distance + min(minutes, 360) * 0.25 + after_penalty,
                }
            )

    ranked = []
    for vehicle_id, observations in candidate_observations.items():
        best = min(observations, key=lambda item: item["score"])
        ranked.append((best["score"], vehicle_id, best))
    ranked.sort(key=lambda item: item[0])
    if not ranked:
        return {
            "request_id": complaint["id"],
            "status": "no_match",
            "confidence": "insufficient",
            "reason": (
                f"No GBFS vehicle was observed within {radius} metres during the "
                f"{lookback_hours}-hour pre-report and {lookahead_minutes}-minute post-report window."
            ),
            "candidate_count": 0,
        }

    _, vehicle_id, best = ranked[0]
    trajectory = trace_vehicle(
        all_observations[vehicle_id],
        complaint,
        radius,
        continuity_minutes,
    )
    second_score = ranked[1][0] if len(ranked) > 1 else None
    unique_margin = second_score is None or second_score - ranked[0][0] >= 15
    time_distance = abs(best["minutes_from_report"])
    if unique_margin and best["distance_meters"] <= 20 and time_distance <= 30:
        confidence = "high"
    elif unique_margin and best["distance_meters"] <= 30 and time_distance <= 90:
        confidence = "medium"
    else:
        confidence = "low"
    root_cause_signal = "insufficient_evidence"
    if len(ranked) > 1:
        root_cause_signal = "vehicle_cluster"
    elif trajectory["came_from"]:
        root_cause_signal = "recent_vehicle_arrival"
    elif (trajectory["minimum_dwell_minutes"] or 0) >= 120:
        root_cause_signal = "long_dwell"
    return {
        "request_id": complaint["id"],
        "status": "likely_match" if confidence in {"high", "medium"} else "candidate_only",
        "confidence": confidence,
        "candidate_count": len(ranked),
        "vehicle": {
            "id": vehicle_id,
            "operator": best["company"],
            "type": best["type"],
            "available": best["available"],
            "disabled": best["disabled"],
            "reserved": best["reserved"],
        },
        "matched_observation": {
            "snapshot_id": best["snapshot_id"],
            "observed_at": best["observed_at"].isoformat().replace("+00:00", "Z"),
            "lat": best["lat"],
            "lng": best["lng"],
            "distance_meters": best["distance_meters"],
            "minutes_from_report": best["minutes_from_report"],
        },
        "trajectory": trajectory,
        "root_cause_signal": root_cause_signal,
        "alternatives": [
            {
                "vehicle_id": item[1],
                "operator": item[2]["company"],
                "distance_meters": item[2]["distance_meters"],
                "minutes_from_report": item[2]["minutes_from_report"],
            }
            for item in ranked[1:4]
        ],
        "evidence_boundary": (
            "GBFS establishes observed device positions, not who parked, deployed, "
            "moved, or displaced the vehicle. A likely vehicle match is not a causal finding."
        ),
    }


def build(
    snapshot_root,
    complaint_input,
    output,
    radius=40,
    lookback_hours=6,
    lookahead_minutes=60,
    continuity_minutes=90,
):
    complaints = load_complaints(complaint_input)
    snapshots, invalid_rows = load_snapshots(snapshot_root)
    traces = [
        match_request(
            complaint,
            snapshots,
            radius,
            lookback_hours,
            lookahead_minutes,
            continuity_minutes,
        )
        for complaint in complaints
    ]
    payload = {
        "schema_version": 1,
        "status": "ready",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "method": {
            "radius_meters": radius,
            "lookback_hours": lookback_hours,
            "lookahead_minutes": lookahead_minutes,
            "continuity_gap_minutes": continuity_minutes,
            "warning": (
                "Matches are evidence-scored GBFS candidates. They do not identify "
                "the person or operational action that caused a request."
            ),
        },
        "snapshot_count": len(snapshots),
        "invalid_snapshot_rows": invalid_rows,
        "request_count": len(complaints),
        "matched_request_count": sum(trace["status"] == "likely_match" for trace in traces),
        "traces": traces,
    }
    write_json(output, payload)
    return payload


def parse_args():
    project_root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot-root", type=Path, default=DEFAULT_SNAPSHOT_ROOT)
    parser.add_argument("--complaints", type=Path, default=project_root / "columbus-311-current.json")
    parser.add_argument("--output", type=Path, default=project_root / "request-vehicle-traces.json")
    parser.add_argument("--radius-meters", type=float, default=40)
    parser.add_argument("--lookback-hours", type=float, default=6)
    parser.add_argument("--lookahead-minutes", type=float, default=60)
    parser.add_argument("--continuity-minutes", type=float, default=90)
    return parser.parse_args()


def main():
    args = parse_args()
    result = build(
        args.snapshot_root.resolve(),
        args.complaints.resolve(),
        args.output.resolve(),
        args.radius_meters,
        args.lookback_hours,
        args.lookahead_minutes,
        args.continuity_minutes,
    )
    print(
        json.dumps(
            {
                "request_count": result["request_count"],
                "matched_request_count": result["matched_request_count"],
                "snapshot_count": result["snapshot_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
