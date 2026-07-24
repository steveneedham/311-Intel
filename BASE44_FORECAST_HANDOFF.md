# Base44 daily forecast handoff

Scheduled agent: `11-columbus-daily-forecast`  
Schedule: daily at 6:00 AM `America/New_York`

## Credit-saving data contract

The agent should not ingest or analyze the full GBFS vehicle-position payload.
The repository deterministically converts that payload, the Columbus 311 feed,
named-watch history, and dated event evidence into:

`base44-forecast-input.json`

After publication, use this stable URL:

`https://steveneedham.github.io/311-Intel/base44-forecast-input.json`

The summary contains no vehicle identifiers or reporter information. It
includes fleet totals, 20-metre cross-vendor stacking flags, 1/3/7/30-day
complaint pressure, severity-weighted zone signals, named-watch observations,
and events beginning within 72 hours.

## Recommended scheduled-agent instruction

> Fetch `https://steveneedham.github.io/311-Intel/base44-forecast-input.json`.
> Stop without persisting a forecast if the request fails, the schema version
> is not 1, or `freshness.gbfs_snapshot_id` is more than 24 hours old. Do not
> fetch or process the full GBFS file. Using only this compact summary, generate
> one `MicromobilityHotspot` record per forecasted zone, populating the existing
> `predicted_complaints_24h`, `predicted_complaints_48h`, and
> `predicted_complaints_72h` fields together. Populate the existing centroid,
> severity, problem-type, operator, indicator, and forecast-window fields only;
> do not invent schema fields. Put confidence, contributing signals, source
> timestamps, and a plain-language uncertainty note in `leading_indicators`.
> Treat cross-vendor stacking as a review signal rather than a violation, treat
> user-reported ADA language as unverified until evidence is reviewed, and
> never infer an unknown operator. Before creating a record, query by
> `zone_id + forecast_window_start`; update that match or create it if absent,
> so retries are idempotent. Then produce one concise team brief listing only
> new or materially changed predictions.

This instruction matches the verified live `MicromobilityHotspot` schema as of
July 24, 2026. The schema stores all three horizons in one record and does not
provide a separate idempotency-key field.

## Refresh order

Run these steps before the 6:00 AM Base44 schedule:

1. Refresh the Columbus 311 evidence.
2. Refresh the current GBFS snapshot and watch history.
3. Run `python3 build_base44_forecast_input.py`.
4. Publish the resulting JSON.
5. Let the Base44 agent run at 6:00 AM.

Target the deterministic refresh for 5:45 AM ET. If a fresh summary cannot be
published, the agent should fail closed rather than spend credits forecasting
from stale evidence.
