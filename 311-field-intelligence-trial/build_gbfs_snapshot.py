import csv
import json
import math
from pathlib import Path

SOURCE = Path(
    "/Users/sjneedhamicloud.com/Library/CloudStorage/GoogleDrive-sjneedham1974@gmail.com/"
    "My Drive/columbus_micromobility_snapshots/20260723T044653Z/snapshots/"
    "columbus_scooters_20260723T044626Z.csv"
)
OUTPUT = Path(__file__).with_name("gbfs-vehicle-positions.json")
HISTORY_OUTPUT = Path(__file__).with_name("gbfs-watch-history.json")
SNAPSHOT_ROOT = SOURCE.parents[2]
GOODALE_OLENTANGY = {"lat": 39.9744, "lng": -83.0260, "radius": 250}


def distance_meters(latitude, longitude, watch):
    lat_scale = 111320
    lng_scale = 111320 * math.cos(math.radians((latitude + watch["lat"]) / 2))
    return math.hypot(
        (latitude - watch["lat"]) * lat_scale,
        (longitude - watch["lng"]) * lng_scale,
    )


def read_positions(path):
    positions = []
    with path.open(newline="", encoding="utf-8-sig") as source:
        for row in csv.DictReader(source):
            try:
                positions.append(
                    {
                        "id": row["Vehicle_ID"],
                        "company": row["Company"],
                        "type": row["Type"],
                        "lat": round(float(row["Latitude"]), 6),
                        "lng": round(float(row["Longitude"]), 6),
                        "battery": int(float(row["Battery_Pct"] or 0)),
                        "range": round(float(row["Range_Miles"] or 0), 1),
                        "available": row["Is_Available"].lower() == "true",
                        "disabled": row["Is_Disabled"].lower() == "true",
                        "reserved": row["Is_Reserved"].lower() == "true",
                    }
                )
            except (KeyError, ValueError):
                continue
    return positions

vehicles = read_positions(SOURCE)

payload = {
    "snapshot_id": "20260723T044626Z",
    "source_file": SOURCE.name,
    "position_count": len(vehicles),
    "vehicles": vehicles,
}
OUTPUT.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Wrote {len(vehicles)} positions to {OUTPUT.name}")

history = []
for path in sorted(SNAPSHOT_ROOT.glob("*/snapshots/columbus_scooters_*.csv")):
    positions = read_positions(path)
    nearby = [
        vehicle
        for vehicle in positions
        if distance_meters(vehicle["lat"], vehicle["lng"], GOODALE_OLENTANGY)
        <= GOODALE_OLENTANGY["radius"]
    ]
    operators = {}
    for vehicle in nearby:
        operators[vehicle["company"]] = operators.get(vehicle["company"], 0) + 1
    snapshot_id = path.stem.replace("columbus_scooters_", "")
    history.append(
        {
            "snapshot_id": snapshot_id,
            "position_count": len(positions),
            "watch_count": len(nearby),
            "operators": operators,
            "cross_vendor": len(operators) > 1,
        }
    )

history_payload = {
    "watch": {
        "id": "WATCH-GOODALE-OLENTANGY",
        "name": "Goodale Street & Olentangy River Road",
        **GOODALE_OLENTANGY,
    },
    "snapshot_count": len(history),
    "snapshots": history,
}
HISTORY_OUTPUT.write_text(
    json.dumps(history_payload, separators=(",", ":")) + "\n",
    encoding="utf-8",
)
print(f"Wrote {len(history)} watch observations to {HISTORY_OUTPUT.name}")
