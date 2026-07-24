"""Read and normalize the official Columbus 311 public map feed."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SERVICE_URL = (
    "https://maps2.columbus.gov/arcgis/rest/services/"
    "Applications/ServiceRequests/MapServer/0/query"
)
PUBLIC_MAP_URL = "https://gis.columbus.gov/coc311map/"
REQUEST_TYPE = "Shared Electric Bike & Scooters"
OUT_FIELDS = (
    "CASE_ID,STATUS,STATUS_DATE,REPORTED_DATE,REQUEST_TYPE,STREET,CITY,ZIP,"
    "COLUMBUSCOMMUNITY,AREACOMMISSION,COUNCILDISTRICT,LATITUDE,LONGITUDE,"
    "REQUEST_MODIFIED"
)


def epoch_milliseconds_to_iso(value):
    try:
        return datetime.fromtimestamp(float(value) / 1000, timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )
    except (TypeError, ValueError, OSError):
        return ""


def query_url():
    parameters = {
        "where": f"REQUEST_TYPE = '{REQUEST_TYPE}'",
        "outFields": OUT_FIELDS,
        "returnGeometry": "true",
        "outSR": "4326",
        "orderByFields": "REPORTED_DATE DESC",
        "f": "json",
    }
    return f"{SERVICE_URL}?{urlencode(parameters)}"


def fetch_payload(timeout=30):
    request = Request(
        query_url(),
        headers={"User-Agent": "311-field-intelligence/1.0 read-only-public-feed"},
    )
    with urlopen(request, timeout=timeout) as response:
        payload = json.load(response)
    if payload.get("error"):
        raise RuntimeError(payload["error"].get("message", "ArcGIS query failed"))
    if not isinstance(payload.get("features"), list):
        raise ValueError("ArcGIS response is missing features")
    return payload


def normalize_feature(feature):
    attributes = feature.get("attributes") if isinstance(feature, dict) else None
    attributes = attributes if isinstance(attributes, dict) else {}
    source_id = str(attributes.get("CASE_ID") or "").strip()
    address = str(attributes.get("STREET") or "").strip()
    reported_at = epoch_milliseconds_to_iso(attributes.get("REPORTED_DATE"))
    try:
        latitude = float(attributes.get("LATITUDE"))
        longitude = float(attributes.get("LONGITUDE"))
    except (TypeError, ValueError):
        latitude = longitude = None
    problems = []
    if not source_id:
        problems.append("CASE_ID is required")
    if not address:
        problems.append("STREET is required")
    if not reported_at:
        problems.append("REPORTED_DATE is missing or invalid")
    if latitude is None or not -90 <= latitude <= 90:
        problems.append("LATITUDE is missing or invalid")
    if longitude is None or not -180 <= longitude <= 180:
        problems.append("LONGITUDE is missing or invalid")
    if problems:
        return None, {
            "source_id": source_id or "unknown",
            "reasons": problems,
        }
    source_status = str(attributes.get("STATUS") or "Unknown")
    zone = str(
        attributes.get("COLUMBUSCOMMUNITY")
        or attributes.get("AREACOMMISSION")
        or "Unassigned zone"
    ).strip()
    return {
        "source_id": source_id,
        "city": "columbus",
        "operator": "unknown",
        "complaint_type": "sidewalk_block",
        "descriptor": str(attributes.get("REQUEST_TYPE") or REQUEST_TYPE),
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "zone_id": zone,
        "reported_at": reported_at,
        "status": "resolved" if source_status.lower() == "closed" else "received",
        "source_status": source_status,
        "source_status_at": epoch_milliseconds_to_iso(attributes.get("STATUS_DATE")),
        "source_updated_at": epoch_milliseconds_to_iso(
            attributes.get("REQUEST_MODIFIED")
        ),
        "source_name": "City of Columbus 311 public map",
        "source_url": PUBLIC_MAP_URL,
        "council_district": str(attributes.get("COUNCILDISTRICT") or ""),
        "zip": str(attributes.get("ZIP") or ""),
    }, None


def build_feed(payload, fetched_at=None):
    records = []
    review = []
    seen = set()
    duplicates = 0
    for feature in payload.get("features", []):
        record, invalid = normalize_feature(feature)
        if invalid:
            review.append(invalid)
            continue
        if record["source_id"] in seen:
            duplicates += 1
            continue
        seen.add(record["source_id"])
        records.append(record)
    return {
        "fetched_at": fetched_at
        or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "name": "City of Columbus 311 Service Requests — Last 30 Days",
            "map_url": PUBLIC_MAP_URL,
            "query_url": query_url(),
            "request_type": REQUEST_TYPE,
            "mode": "read-only",
        },
        "record_count": len(records),
        "duplicate_count": duplicates,
        "invalid_count": len(review),
        "records": records,
        "review": review,
    }


def merge_operational_issues(existing, incoming):
    """Merge source facts without overwriting local ownership or lifecycle."""
    by_id = {str(issue.get("id")): dict(issue) for issue in existing if issue.get("id")}
    added = updated = unchanged = 0
    source_fields = {
        "descriptor",
        "address",
        "zone",
        "reportedAt",
        "lat",
        "lng",
        "sourceStatus",
        "sourceStatusAt",
        "sourceUpdatedAt",
        "sourceName",
        "sourceFeedUrl",
        "councilDistrict",
        "zip",
    }
    for record in incoming:
        issue_id = str(record["source_id"])
        source_values = {
            "descriptor": record["descriptor"],
            "address": record["address"],
            "zone": record["zone_id"],
            "reportedAt": record["reported_at"],
            "lat": record["latitude"],
            "lng": record["longitude"],
            "sourceStatus": record["source_status"],
            "sourceStatusAt": record["source_status_at"],
            "sourceUpdatedAt": record["source_updated_at"],
            "sourceName": record["source_name"],
            "sourceFeedUrl": record["source_url"],
            "councilDistrict": record["council_district"],
            "zip": record["zip"],
        }
        if issue_id in by_id:
            issue = by_id[issue_id]
            before = {key: issue.get(key) for key in source_fields}
            issue.update(source_values)
            updated += before != {key: issue.get(key) for key in source_fields}
            unchanged += before == {key: issue.get(key) for key in source_fields}
            continue
        by_id[issue_id] = {
            "id": issue_id,
            "type": "Sidewalk block",
            "classificationConfidence": "source-only",
            "classificationEvidence": (
                "The official public feed supplies only the shared-mobility request "
                "category; no narrative supports a more specific classification."
            ),
            **source_values,
            "operator": "unknown",
            "operatorConfidence": "unattributed",
            "operatorEvidence": "The public feed does not identify a vendor.",
            "sourceUrl": "",
            "crossReferenceUrl": "",
            "crossReferenceSummary": "",
            "crossReferenceStatus": "",
            "crossReferenceEvidence": "",
            "accessibilityEvidence": "not_assessed",
            "accessibilityChallengeStatus": "no_challenge",
            "accessibilityChallengeNote": "",
            "status": record["status"],
            "priority": "standard",
            "team": "",
            "notes": "",
        }
        added += 1
    return list(by_id.values()), {
        "added": added,
        "updated": updated,
        "unchanged": unchanged,
        "total": len(by_id),
    }
