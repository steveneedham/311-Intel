# 311 Field Intelligence

An evidence-forward operational trial for Columbus shared-mobility 311
requests. It combines a read-only 311 snapshot, GBFS vehicle positions,
privacy-safe historical trends, official service-level thresholds, and dated
event context so operators can prioritize work without overstating what the
available data proves.

## What is verified

- 104 complaint records load from a preserved Base44 export.
- New local JSON records are normalized, deduplicated by source ID, and shown
  in the queue.
- Records with narratives receive deterministic complaint classifications and
  vendor-name attribution with the matched rule shown in request detail.
  Records without narratives retain their source label and are explicitly
  marked source-only or unattributed.
- Requests can be assigned and moved through local lifecycle states.
- Explainable hotspot scores use priority, recency, accessibility relevance,
  and same-address burst suppression.
- High and Critical hotspots can generate evidence-linked recommendations.
- Administrator-only approval, dispatch, completion, and skip transitions are
  recorded in the local activity ledger.
- An optional local service adds password-authenticated Viewer, Operator, and
  Administrator sessions, HTTP-only cookies, CSRF protection, server-enforced
  role checks, optimistic versioning, SQLite persistence, and an append-only
  audit table.
- Completion requires a field note and creates explicit baseline/post-period
  outcome windows.
- 3,578 Veo and Spin GBFS positions support cross-vendor proximity review.
- Nine Goodale/Olentangy observations are compared with the official Columbus
  Crew home schedule. One observation is event-window linked; the interface
  does not claim recurrence or causation.
- A privacy-safe 1,339-record historical extract excludes reporter names,
  emails, telephone numbers, and free-text descriptions.
- Local alert rules deduplicate unchanged request states.
- GA4 property `G-V40E4MZEMV` is configured.

## What is not live

This build does not claim live Columbus ingestion, production identity-provider
integration, TLS termination, email/SMS delivery, scheduled workflows, or
automatic vendor enforcement. The included authenticated service is intended
for controlled local evaluation. Base44 and GitHub are not modified by running
the trial.

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
`APP_DATABASE` to select another path.

For the browser-only fallback:

```bash
npm run serve:static
```

## Reproducible acceptance test

```bash
npm test
```

The first test starts an isolated static server and exercises snapshot hydration,
historical privacy boundaries, GA4 configuration, event matching, alert
deduplication, role restrictions, hotspot recommendation, approval, dispatch,
completion-note enforcement, outcome creation, and mobile overflow. The durable
browser test verifies authenticated role assignment, SQLite persistence across
reload, and audit attribution. Standard-library tests cover API authorization,
CSRF, optimistic concurrency, administrator-only intervention transitions,
append-only audit protection, and deterministic GBFS refresh behavior.

## Refresh archived GBFS evidence

```bash
npm run refresh:gbfs
```

The refresh command selects the newest timestamped CSV below the configured
snapshot archive, rebuilds the current position payload, and recomputes the
complete Goodale/Olentangy history. Set `GBFS_SNAPSHOT_ROOT` or pass
`--snapshot-root` when the archive lives elsewhere. Invalid rows are counted
and surfaced in the generated metadata instead of being silently accepted.

## Evidence boundaries

- Vehicle clustering and event joins are review signals, not confirmed
  violations or causal findings.
- Keyword-based classifications and operator names are reviewable evidence, not
  automated image recognition. Photo-confirmed overrides remain limited to the
  two requests explicitly reviewed by the user.
- Crew kickoff times come from the official schedule. Expected match-end times
  are analytical estimates set 2 hours 15 minutes after kickoff.
- The screenshot-derived SLA rows remain provisional because dates and vendors
  are absent.
- Roles in the browser-only fallback are interface controls, not production
  authentication.
- Authenticated local sessions are server-enforced, but deployment still
  requires HTTPS, managed secrets, backups, and an approved identity provider.

See [COMPLETION_AUDIT.md](COMPLETION_AUDIT.md) for requirement-by-requirement
evidence and remaining deployment gates.
