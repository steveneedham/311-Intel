#!/usr/bin/env python3
"""Build a compact, inspectable 311 proximity analysis from public MDS policy data."""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

PUBLIC_POLICY_URL = (
    "https://app.populus.ai/columbus/public/policies"
    "?policy_id=db37662e-cd6c-429f-90f9-84e5ffb9099e"
)
BOUNDARY_TERMS = {
    "mandatory_parking": ("mandatory parking", "mpz"),
    "no_parking": ("no parking", "npz"),
    "no_ride": ("no ride", "no riding"),
}
EARTH_RADIUS_M = 6_371_008.8


def policy_kind(policy):
    text = " ".join(
        [
            str(policy.get("name", "")),
            str(policy.get("description", "")),
            *[str(rule.get("name", "")) for rule in policy.get("rules", [])],
        ]
    ).lower()
    for kind, terms in BOUNDARY_TERMS.items():
        if any(term in text for term in terms):
            return kind
    return None


def geometry_rings(geometry):
    if not isinstance(geometry, dict):
        return []
    coordinates = geometry.get("coordinates") or []
    if geometry.get("type") == "Polygon":
        return coordinates
    if geometry.get("type") == "MultiPolygon":
        return [ring for polygon in coordinates for ring in polygon]
    return []


def project(point, latitude):
    longitude, point_latitude = point
    factor = math.pi / 180
    return (
        EARTH_RADIUS_M * longitude * factor * math.cos(latitude * factor),
        EARTH_RADIUS_M * point_latitude * factor,
    )


def segment_distance_m(point, start, end):
    latitude = (point[1] + start[1] + end[1]) / 3
    px, py = project(point, latitude)
    ax, ay = project(start, latitude)
    bx, by = project(end, latitude)
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    ratio = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + ratio * dx), py - (ay + ratio * dy))


def point_in_ring(point, ring):
    longitude, latitude = point
    inside = False
    for index, start in enumerate(ring):
        end = ring[(index + 1) % len(ring)]
        x1, y1 = start[:2]
        x2, y2 = end[:2]
        if (y1 > latitude) != (y2 > latitude):
            crossing = (x2 - x1) * (latitude - y1) / (y2 - y1) + x1
            if longitude < crossing:
                inside = not inside
    return inside


def geometry_proximity(point, geometry):
    rings = geometry_rings(geometry)
    if not rings:
        return None
    inside = any(point_in_ring(point, ring) for ring in rings if len(ring) >= 3)
    distance = min(
        segment_distance_m(point, ring[index][:2], ring[(index + 1) % len(ring)][:2])
        for ring in rings
        if len(ring) >= 2
        for index in range(len(ring))
    )
    return {"inside": inside, "boundary_distance_m": round(distance, 1)}


def feature_geometries(geography):
    collection = geography.get("geography_json") or {}
    return [
        feature.get("geometry")
        for feature in collection.get("features", [])
        if feature.get("geometry", {}).get("type") in {"Polygon", "MultiPolygon"}
    ]


def build_analysis(policies_payload, geographies_payload, complaints_payload):
    policies = policies_payload.get("items")
    if policies is None:
        policies = policies_payload.get("data", {}).get("policies", policies_payload)
    geographies = geographies_payload.get("geographies", geographies_payload)
    geography_by_id = {
        item.get("geography_id"): item for item in geographies if item.get("geography_id")
    }
    boundaries = []
    for policy in policies:
        kind = policy_kind(policy)
        if not kind:
            continue
        geography_ids = sorted(
            {
                geography_id
                for rule in policy.get("rules", [])
                for geography_id in rule.get("geographies", [])
            }
        )
        for geography_id in geography_ids:
            geography = geography_by_id.get(geography_id)
            if not geography:
                continue
            for geometry in feature_geometries(geography):
                boundaries.append(
                    {
                        "policy_id": policy.get("policy_id"),
                        "policy_name": policy.get("name"),
                        "boundary_type": kind,
                        "description": policy.get("description") or "",
                        "geography_id": geography_id,
                        "geography_name": geography.get("name"),
                        "geometry": geometry,
                    }
                )

    complaint_results = []
    thresholds = (25, 50, 100)
    counts = {str(threshold): 0 for threshold in thresholds}
    inside_count = 0
    for complaint in complaints_payload.get("entities", complaints_payload):
        try:
            point = (float(complaint["longitude"]), float(complaint["latitude"]))
        except (KeyError, TypeError, ValueError):
            continue
        matches = []
        for boundary in boundaries:
            proximity = geometry_proximity(point, boundary["geometry"])
            if proximity is None:
                continue
            matches.append(
                {
                    "policy_id": boundary["policy_id"],
                    "policy_name": boundary["policy_name"],
                    "boundary_type": boundary["boundary_type"],
                    **proximity,
                }
            )
        if not matches:
            continue
        nearest = min(matches, key=lambda item: item["boundary_distance_m"])
        if nearest["inside"]:
            inside_count += 1
        for threshold in thresholds:
            if nearest["boundary_distance_m"] <= threshold:
                counts[str(threshold)] += 1
        complaint_results.append(
            {
                "source_id": complaint.get("source_id") or complaint.get("id"),
                "address": complaint.get("address"),
                "reported_at": complaint.get("reported_at"),
                "status": complaint.get("status"),
                "zone": complaint.get("zone_id"),
                "latitude": point[1],
                "longitude": point[0],
                "inside_policy_zone": nearest["inside"],
                "nearest_boundary_distance_m": nearest["boundary_distance_m"],
                "nearest_policy_id": nearest["policy_id"],
                "nearest_policy_name": nearest["policy_name"],
                "nearest_boundary_type": nearest["boundary_type"],
            }
        )

    complaint_results.sort(
        key=lambda item: (
            not item["inside_policy_zone"],
            item["nearest_boundary_distance_m"],
            item["source_id"] or "",
        )
    )
    source_count = len(complaints_payload.get("entities", complaints_payload))
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "policy_url": PUBLIC_POLICY_URL,
            "policy_export_version": policies_payload.get("version"),
            "policy_export_updated": policies_payload.get("updated"),
            "geography_export_version": geographies_payload.get("version"),
            "geography_export_updated": geographies_payload.get("updated"),
            "complaint_exported_at": complaints_payload.get("exported_at"),
        },
        "method": {
            "purpose": "Test proximity to published no-parking, mandatory-parking, and no-ride boundaries.",
            "distance": "Nearest point-to-polygon-boundary distance using a local equirectangular approximation.",
            "thresholds_m": list(thresholds),
            "interpretation": (
                "Proximity is an operational correlation signal only. It does not establish that a policy "
                "boundary caused a complaint, that the policy was active at report time, or that a vehicle "
                "was inside a prohibited area."
            ),
        },
        "summary": {
            "source_complaint_count": source_count,
            "boundary_policy_count": len({item["policy_id"] for item in boundaries}),
            "boundary_feature_count": len(boundaries),
            "inside_policy_zone_count": inside_count,
            "within_boundary_m": counts,
        },
        "boundaries": boundaries,
        "complaints": complaint_results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("policies", type=Path)
    parser.add_argument("geographies", type=Path)
    parser.add_argument("--complaints", type=Path, default=Path("base44-live-snapshot.json"))
    parser.add_argument("--output", type=Path, default=Path("mobility-policy-boundaries.json"))
    args = parser.parse_args()
    analysis = build_analysis(
        json.loads(args.policies.read_text()),
        json.loads(args.geographies.read_text()),
        json.loads(args.complaints.read_text()),
    )
    args.output.write_text(json.dumps(analysis, indent=2) + "\n")
    print(json.dumps(analysis["summary"], indent=2))


if __name__ == "__main__":
    main()
