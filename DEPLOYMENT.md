# Deployment contract

The deployable unit is the non-root container defined by `Dockerfile`. It serves
the static interface and authenticated API from one origin, runs the optional
workflow scheduler, and stores durable state in SQLite.

## Required platform capabilities

- HTTPS termination before traffic reaches the container.
- A persistent volume mounted at `/data`.
- Encrypted secret injection through environment variables.
- A single running application instance while SQLite is the database.
- Automated snapshots or backups of `/data/311-intel.sqlite3`.
- Health checks against `GET /api/health`.

Do not deploy the SQLite build to an autoscaling or multi-instance service.
Multiple writers need a managed transactional database and a migration from the
current state contract.

## Required secrets and configuration

Configure at least one password of 12 or more characters:

```text
APP_ADMIN_PASSWORD
APP_OPERATOR_PASSWORD
APP_VIEWER_PASSWORD
```

Do not place passwords in the repository, image, build arguments, or deployment
manifest. Changing a configured password on restart invalidates that user's
existing sessions.

Recommended runtime values:

```text
APP_HOST=0.0.0.0
PORT=8080
APP_DATABASE=/data/311-intel.sqlite3
APP_ENV=production
APP_SECURE_COOKIES=1
APP_ENABLE_SCHEDULER=1
APP_ENABLE_CITY_SYNC=1
APP_SCHEDULER_INTERVAL_SECONDS=300
APP_SINGLE_INSTANCE=1
APP_BACKUP_CONFIRMED=1
```

`APP_ENABLE_SCHEDULER` should be enabled on exactly one instance. When
`APP_ENABLE_CITY_SYNC=1`, that instance also needs outbound HTTPS access to
`maps2.columbus.gov`. The integration is read-only at the source: it retrieves
the official public ArcGIS feed and writes only normalized source facts into
the app's own SQLite state.

`APP_ENV=production` activates a fail-closed startup gate. The service refuses
to start unless an Administrator password, secure cookies, City sync, the
scheduler, a non-loopback host, an absolute database path, the single-instance
acknowledgement, and the backup acknowledgement are all present. Set
`APP_BACKUP_CONFIRMED=1` only after automated snapshots or backups have been
configured and a restore procedure has been documented.

## Local container verification

```bash
docker build -t 311-field-intelligence:trial .
docker run --rm \
  -p 8080:8080 \
  -v 311-intel-data:/data \
  -e APP_ADMIN_PASSWORD='replace-with-a-long-password' \
  -e APP_ENABLE_SCHEDULER=1 \
  -e APP_ENABLE_CITY_SYNC=1 \
  311-field-intelligence:trial
```

Then open `http://127.0.0.1:8080/` and verify `/api/health`. This local HTTP
example is not the production security boundary; production access must use
HTTPS.

## Production migration gates

Before exposing the app beyond a controlled evaluation:

1. Select the hosting platform and persistent-volume backup policy.
2. Replace evaluation passwords with an approved identity provider or document
   a reviewed credential-rotation and recovery policy.
3. Configure HTTPS, secure headers at the edge, request logging, and monitoring.
4. Restore a database backup into a staging volume and run the complete
   acceptance suite against that deployment.
5. Verify the scheduler has recent successful `city_311_sync`, `daily_brief`,
   and `alert_evaluation` runs.
6. Confirm the current City count is plausible, IDs are unique, and all 104
   preserved Base44 complaint IDs remain present.
7. Confirm a City refresh does not overwrite local request status, assigned
   team, notes, evidence review, interventions, or outcomes.
8. Schedule `event_gbfs_runner.py` every five minutes on exactly one collector
   host, passing the absolute path to `Veo_Spin_CBS_GBFS_Extract.ipynb`. Verify
   one successful pre-event and one successful post-event run before relying on
   the event signal operationally.

The container does not connect to or modify Base44. Base44 integration should
remain read-only until a narrow, reversible write contract is separately
approved.
