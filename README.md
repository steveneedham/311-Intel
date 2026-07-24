# 311 Field Intelligence

An evidence-forward operational trial for Columbus shared-mobility 311
requests. It combines a read-only 311 snapshot, GBFS vehicle positions,
privacy-safe historical trends, official service-level thresholds, and dated
event context so operators can prioritize work without overstating what the
available data proves.

## What is verified

- The current City of Columbus 30-day public feed contributes 137 deduplicated
  complaint records. All 104 IDs from the preserved Base44 export remain
  present; 33 newer City-only records are added without overwriting local
  ownership, notes, evidence review, or lifecycle state.
- New local JSON records are normalized, deduplicated by source ID, and shown
  in the queue. Invalid records are excluded and retained in a correction
  review containing only their source identifier and validation reasons.
- Records with narratives receive deterministic complaint classifications and
  vendor-name attribution with the matched rule shown in request detail.
  Records without narratives retain their source label and are explicitly
  marked source-only or unattributed.
- Accessibility keywords create a high-priority `ADA concern`, not a confirmed
  violation. Only an Administrator-recorded supporting photograph promotes the
  classification to a critical `ADA ramp`. Operators can submit an evidence
  challenge for City review, but the challenge never implies a waiver,
  dismissal, SLA pause, or lifecycle change.
- Public OneView request pages can be used as a read-only cross-reference for
  operator, photograph, narrative, and public-status evidence. Cross-reference
  status is displayed separately and never overwrites the Base44/local
  lifecycle. Every request exposes the nearby-request lookup; an Administrator
  can attach the exact matched URL, public status, privacy-safe summary,
  operator, and verification method. Contact details are rejected, and the
  durable audit identifies changed evidence fields without copying their
  values.
- Requests can be assigned and moved through local lifecycle states.
- The operational queue filters by lifecycle status, source-anchored date
  window, zone, complaint type, operator, and severity; search covers case,
  address, zone, type, and operator.
- Explainable hotspot scores use priority, recency, accessibility relevance,
  and same-address burst suppression.
- The operational map overlays 52 features from 17 published Columbus
  no-parking, mandatory-parking, and no-ride policies. A reproducible spatial
  join finds 26 of the 104 loaded complaints within 25 metres of a policy
  boundary, 29 within 50 metres, and 31 within 100 metres. The interface treats
  this as a hypothesis signal and requires a matched control set before claiming
  disproportionate concentration or causation.
- High and Critical hotspots can generate evidence-linked recommendations.
- Administrator-only approval, dispatch, completion, and skip transitions are
  recorded in the local activity ledger.
- An optional local service adds password-authenticated Viewer, Operator, and
  Administrator sessions, HTTP-only cookies, CSRF protection, server-enforced
  role checks, optimistic versioning, SQLite persistence, and an append-only
  audit table.
- Completion requires a field note and creates explicit baseline/post-period
  outcome windows.
- 3,592 current Veo and Spin GBFS positions support cross-vendor proximity
  review.
- Ten Goodale/Olentangy observations are compared with the official Columbus
  Crew home schedule. One observation is event-window linked with six vehicles;
  the newer observation contains one Veo and no cross-vendor condition. The
  interface preserves both states and does not claim recurrence or causation.
- A privacy-safe 1,339-record historical extract excludes reporter names,
  emails, telephone numbers, and free-text descriptions.
- Local alert rules deduplicate unchanged request states.
- GA4 property `G-V40E4MZEMV` is configured.

## What is not live

The browser fallback loads a committed City feed snapshot. The authenticated
service includes an optional read-only City refresh, but no production host or
scheduled runtime has been deployed or verified. This build also does not claim
production identity-provider integration, TLS termination, email/SMS delivery,
or automatic vendor enforcement. OneView matching is a human-reviewed lookup,
not an undocumented scraper or API integration. Base44 and GitHub are not
modified by running the trial.

## Run locally

```bash
npm install
npm run serve
```

Open `http://127.0.0.1:8765/`.

The service starts without configured users and the browser remains in local
trial mode. To test durable authenticated operations, provide one or more
passwords of at least 12 characters:

```bash
APP_VIEWER_PASSWORD='replace-with-a-long-password' \
APP_OPERATOR_PASSWORD='replace-with-a-long-password' \
APP_ADMIN_PASSWORD='replace-with-a-long-password' \
npm run serve
```

Sign in as `viewer`, `operator`, or `admin`. Passwords are PBKDF2-hashed in the
local SQLite database; plaintext credentials are not stored. The database is
created at `data/311-intel.sqlite3` and is excluded from version control. Use
`APP_DATABASE` to select another path. Set `APP_SECURE_COOKIES=1` behind an
HTTPS deployment; leave it unset only for direct localhost evaluation.

The server-side daily brief and alert evaluator are opt-in:

```bash
APP_ADMIN_PASSWORD='replace-with-a-long-password' \
APP_ENABLE_SCHEDULER=1 \
APP_SCHEDULER_INTERVAL_SECONDS=300 \
npm run serve
```

Each cycle records separate `daily_brief` and `alert_evaluation` runs in
append-only SQLite history. Alert states use the subscription, request,
lifecycle status, and severity as a unique key, so an unchanged condition is
not delivered twice. Authenticated users can inspect recent runs in Activity;
only an Administrator can trigger a manual verification run.

To include a read-only refresh of the official City 311 public feed in each
scheduler cycle, add:

```bash
APP_ENABLE_CITY_SYNC=1
```

The refresh may update City-owned source facts and add newly published cases,
but it preserves every existing local lifecycle state, assigned team, note,
evidence review, and intervention workflow. City source status, OneView status,
and the app's operational status remain separate fields.

For the browser-only fallback:

```bash
npm run serve:static
```

## Deployment preparation

The repository includes a non-root [Dockerfile](Dockerfile) and an explicit
[deployment contract](DEPLOYMENT.md). The container expects HTTPS at the
platform edge, encrypted environment secrets, and a persistent `/data` volume.
The current SQLite build must run as a single application instance.

## Reproducible acceptance test

```bash
npm test
```

The committed `pnpm-lock.yaml` pins the browser-test dependency. GitHub Actions
runs the same test command and validates the Docker build on pushes and pull
requests.

The first test starts an isolated static server and exercises snapshot hydration,
historical privacy boundaries, GA4 configuration, event matching, alert
deduplication, complete queue filters, invalid-import review, role restrictions,
hotspot recommendation, approval, dispatch, completion-note enforcement,
outcome creation, and mobile overflow. The durable
browser test verifies authenticated role assignment, durable evidence review,
SQLite persistence across reload, audit attribution, and inspectable workflow
runs. Standard-library tests cover API authorization, CSRF, optimistic
concurrency, Administrator-only evidence/intervention/workflow actions,
recurring scheduled runs, alert deduplication, append-only audit/run
protection, read-only City-feed normalization and idempotent workflow-preserving
merges, deterministic GBFS refresh behavior, and policy-boundary selection and
proximity calculations.

## Refresh current Columbus 311 evidence

```bash
npm run refresh:311
```

This command reads the official City of Columbus ArcGIS service for the
`Shared Electric Bike & Scooters` request type and rebuilds
`columbus-311-current.json`. It performs no write to the City system or
Base44. Invalid rows are excluded from the operational payload and retained as
source-ID-plus-reason review entries.

## Refresh archived GBFS evidence

```bash
npm run refresh:gbfs
```

The refresh command selects the newest timestamped CSV below the configured
snapshot archive, rebuilds the current position payload, and recomputes the
complete Goodale/Olentangy history. Set `GBFS_SNAPSHOT_ROOT` or pass
`--snapshot-root` when the archive lives elsewhere. Invalid rows are counted
and surfaced in the generated metadata instead of being silently accepted.

## Collect around major events

Run the collector every five minutes from one scheduler instance:

```bash
python3 event_gbfs_runner.py \
  --notebook /absolute/path/to/Veo_Spin_CBS_GBFS_Extract.ipynb
```

The runner reads `external-events.json` and executes the notebook once 30
minutes before kickoff and once 30 minutes after the estimated end of each
scheduled event. A 10-minute tolerance supports a five-minute cron or platform
scheduler, and `event-gbfs-runs.json` prevents duplicate execution. Event types
are not hard-coded, so verified soccer, football, concert, or other major-event
records can use the same contract. Use `--dry-run` to inspect a due window
without executing the notebook.

The notebook is intentionally not bundled in this app checkout. Pass its
absolute path on the collection host. Successful execution requires
Jupyter/nbconvert in that host's Python environment.

## Evidence boundaries

- Vehicle clustering and event joins are review signals, not confirmed
  violations or causal findings.
- Policy-boundary proximity does not prove that a geofence caused a complaint,
  was active at report time, or produced enrichment relative to ordinary street
  locations. The latter requires a matched spatial control set.
- Keyword-based classifications and operator names are reviewable evidence, not
  automated image recognition. User-reviewed photographs confirm vendor
  identity for three specified requests; they do not automatically establish
  an accessibility obstruction.
- Crew kickoff times come from the official schedule. Expected match-end times
  are analytical estimates set 2 hours 15 minutes after kickoff.
- The screenshot-derived duration rows remain provisional because dates,
  vendors, eligibility decisions, and visual ADA validation are absent. They
  are summarized as an unverified sample mean, never request-level contractual
  passes or failures. SLA response time is a monthly eligible vendor average.
- Roles in the browser-only fallback are interface controls, not production
  authentication.
- Authenticated local sessions are server-enforced, but deployment still
  requires HTTPS, managed secrets, backups, and an approved identity provider.

See [COMPLETION_AUDIT.md](COMPLETION_AUDIT.md) for requirement-by-requirement
evidence and remaining deployment gates.
