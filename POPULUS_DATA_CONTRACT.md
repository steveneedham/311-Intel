# Populus root-cause context

`populus-zone-operations.json` is an optional, privacy-safe input used only for
request-level operational pattern review. It must contain hourly or finer
aggregates by operator and zone; no rider, trip, or vehicle identifiers belong
in this file.

## Observation fields

```json
{
  "observed_at": "2026-07-24T14:00:00Z",
  "zone": "Downtown",
  "operator": "Spin",
  "fleet_size": 184,
  "rides": 76,
  "idle_vehicles": 48,
  "median_idle_minutes": 97,
  "deployments": 24,
  "removals": 11
}
```

`rides` may be replaced with separate `rides_started` and `rides_ended`
fields. The interface compares the observation nearest each request with
same-zone, same-operator observations from the previous 28 days at a similar
hour.

## Review patterns

- **Demand-driven concentration:** rides and fleet rise together.
- **Supply-driven concentration:** fleet and net deployments rise materially
  faster than rides.
- **Idle-management gap:** idle time exceeds the configured threshold while
  demand is not unusually high.
- **Insufficient evidence:** the baseline or operational fields cannot support
  one of the above.

These patterns support investigation. They do not establish intent,
negligence, a contractual breach, or who placed an individual vehicle.
