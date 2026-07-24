# 311 Field Intelligence — Completion Audit

Audit date: 2026-07-23  
Current artifact: local browser application in `/Users/sjneedhamicloud.com/Documents/311 Intel`

## Evidence summary

- The application loads a read-only export of 104 records from Base44 app
  `6a614b54abec07520930dbea`.
- A read-only query of the official City of Columbus 30-day ArcGIS feed
  returned 137 unique shared-mobility requests with zero invalid or duplicate
  rows. All 104 Base44 IDs are present in that feed and 33 City-only records
  are added to the queue.
- The verified snapshot contains 8 open and 96 resolved complaints.
- Base44 records were not modified while building or testing the local app.
- Browser validation found no console errors.
- Test-created local records and assignments were removed after validation.
- A fresh isolated browser test confirmed that Viewer cannot add requests or
  transition interventions, while Administrator approval creates an activity
  entry recording `recommended → approved` and `local-admin`. The isolated
  browser profile was discarded after the test.
- A dated GBFS snapshot adds 3,592 Veo and Spin vehicle positions without
  modifying either source system.
- Cross-vendor clusters are flagged for human review when at least four
  vehicles form a connected group within approximately 20 metres.
- Goodale Street and Olentangy River Road is retained as a named watch location
  based on a reported recurring post–Columbus Crew match condition. The current
  snapshot is summarized within 250 metres, but recurrence is not claimed until
  multiple snapshots are joined to the match schedule.
- The intended event test compares a pre-event baseline, the first two hours
  after event end, and the following morning. Cross-vendor concentration and
  persistence—not event attendance alone—should drive a review flag.
- Ten dated GBFS observations now provide a preliminary Goodale/Olentangy
  baseline. The July 23 event-linked observation contains six vehicles (five
  Spin and one Veo), compared with a non-event median of two. The newer July 24
  observation contains one Veo and no cross-vendor condition, so the app marks
  the earlier pile-up as cleared in the current snapshot while preserving it in
  history. This proves a dated association and changing conditions, not
  recurrence or causation.
- The event dataset contains nine remaining 2026 Crew home dates from the
  official single-match schedule; eight have official kickoff times and one is
  time-TBD. Expected end times are transparently estimated at 2h15 after
  kickoff. The inspectable join windows are four hours pre-event, during the
  event, 0–2 hours immediate post-event, 2–6 hours recovery, and 6–16 hours
  next morning.
- Browser tests confirmed one of ten Goodale/Olentangy observations is
  event-window linked. Its watch count is six, compared with a non-event median
  of two. The UI explicitly says one linked observation is insufficient to
  establish recurrence or causation and links to the official schedule source.
- A public Populus export adds 17 Columbus no-parking, mandatory-parking, and
  no-ride policies represented by 52 mapped features. A reproducible
  point-to-boundary join finds 26 of 104 complaints within 25 metres, 29 within
  50 metres, and 31 within 100 metres; 24 complaint coordinates fall inside a
  published policy zone. The map and hotspot view expose the evidence, source,
  and exact thresholds. The interface does not claim policy activation at the
  report time, causal effect, or disproportionate concentration without a
  matched control set.
- The verified 311 snapshot contains three N 4th Street complaints:
  `CAS-3085935-H5M2M1`, `CAS-3080008-R7Z5H2`, and `CAS-3070558-P1C4L9`.
  One is open. The app labels this an infrastructure-change watch tied to the
  reported new bike-lane configuration, while reserving causal conclusions for
  comparison with installation dates and a pre-change baseline.
- `CAS-3085935-H5M2M1` now has a read-only OneView cross-reference. The public
  detail and photographs confirm Spin, but the photograph does not
  conclusively establish blocked accessible clearance. The app therefore
  records a high-priority `ADA concern`, `reported-claim`, and
  `photo-inconclusive`—not a confirmed critical violation. OneView's `Assigned`
  status is shown separately from the preserved Base44 `received` state.
- Automated browser coverage verifies the exact OneView source URL, separate
  status fields, photo-and-text attribution, ADA classification, and privacy
  boundary. Repository CI runs the locked acceptance/service suite and checks
  that the production container builds.
- Every request now exposes the public nearby-request lookup. Administrators
  can record the exact matched URL, privacy-safe operational summary, public
  status, operator, and photo/text verification method. Email addresses and
  telephone numbers are rejected; Viewer controls are disabled, and the
  durable service rejects Operator attempts to alter evidence fields.
- Operators can record that an accessibility evidence review was requested or
  submitted to the City. This never changes the request lifecycle and the UI
  explicitly states that no waiver, dismissal, SLA pause, or favorable City
  finding is implied. Only an Administrator can record or alter City-review
  findings.
- The verified snapshot contains 18 W Broad Street complaints; 17 are closed
  and one is open. Same-address duplicate bursts appear at 2305 W Broad
  (two pairs on consecutive days) and 2744 W Broad, with submissions separated
  by roughly one to two minutes. The app labels this as a reporting-pattern
  anomaly and avoids inferring reporter identity or intent from public data.
  Burst-linked records remain inspectable but should count as one prioritization
  signal until independently corroborated.
- The W Broad records span about 3.6 miles, consistent with the supplied map
  image's linear corridor pattern rather than a single physical pile-up.
  Hotspot scoring now suppresses same-address submissions made within ten
  minutes while retaining every source record for inspection.
- The Vendor SLA view now models IP1, IP2, and IP3 response times as monthly
  eligible vendor averages (60, 180, and 1,440 minutes), not independent
  request-level deadlines. It reports zero currently assessable monthly
  populations because the export lacks assessment dates, vendor identity,
  eligibility decisions, and verified resolution timestamps.
- The official report cards provide precedent for two implemented signals:
  one October response-time assessment excluded October 23 and 24 because each
  date had 16 requests within one hour, and a September 19 audit found the
  Goodale no-parking geofence active. The records-request draft now asks for
  the underlying records, exclusion methodology, and geofence history.
- The interface describes 28 standards across five performance areas but does
  not repeat unsupported claims that every request is automatically routed or
  that every missed response time automatically generates a City fine.
- A user-supplied screenshot was provisionally transcribed into 25 duration
  observations. Eighteen are user-flagged ADA and have an unverified sample
  mean of 198 minutes (3h18m). This is not a monthly vendor SLA result because
  dates, vendor identity, eligibility decisions, and visual ADA validation are
  absent. Screenshot row labels remain source annotations and are not treated
  as contractual request-level passes or failures.
- The street map now supports manually initiated search around any Columbus
  address using OpenStreetMap geocoding. It draws a half-mile review radius and
  summarizes nearby loaded 311 requests and GBFS vehicles. Request filters
  combine status with 7-day, 30-day, or all-loaded time windows.
- A privacy-safe extract of the historical workbook adds 1,339 records covering
  April 2024 through October 2025. The deployable JSON contains no reporter
  names, email addresses, phone numbers, or free-text descriptions; automated
  checks found zero email-like or phone-like values.
- The Historical Trends view calculates monthly volume, intake-channel mix,
  repeat locations, 196 consecutive same-address pairs within ten minutes, and
  three named corridor counts. It also shows rank-only source concentration
  across 195 distinct source values. Raw identities are discarded and the UI
  explicitly warns that a source may be a resident, shared account, or intake
  channel and does not infer intent.
- The Daily Brief view now derives four attention-first sections from the
  loaded snapshot and local workflow state: requests in the latest 24-hour
  source window, unresolved critical issues, dispatched interventions, and
  measured outcomes. Its cutoff is explicit and it is labeled as a read-only
  snapshot summary.
- Severity- and zone-based alert subscriptions are supported in the local
  trial. Each matching issue is emitted once per subscription, request,
  lifecycle state, and severity. Delivery is explicitly labeled `Local
  preview`; the interface does not claim email, SMS, or production dispatch.
- Isolated browser tests confirmed Viewer cannot add a subscription, Operator
  can add one, a high-severity citywide rule generated eight unique alert
  states, rerendering did not duplicate them, and a duplicate rule was
  rejected. Both desktop and mobile runs completed without console errors or
  document overflow.
- A deterministic hotspot-to-intervention workflow now generates a
  recommendation only for High or Critical hotspot tiers. Each recommendation
  preserves the score, tier, all source request IDs, duplicate-suppressed
  signal IDs, assigned response team, rationale, creator role, and creation
  timestamp. An unresolved recommendation prevents another recommendation for
  the same zone.
- The intervention lifecycle records recommended, approved, dispatched,
  completed, and skipped states with actor and timestamps. Completion requires
  a field note. Completing work creates an inconclusive outcome path with
  explicit seven-day baseline and post-period ISO timestamps, baseline source
  IDs, and the completion evidence; skipping does not create an outcome.
- An isolated acceptance fixture (`CAS-ACCEPTANCE-HOTSPOT`) proved the complete
  local flow and was discarded with its browser profile afterward. Operator
  generated `INT-003` but could not approve it; Administrator approved,
  dispatched, and completed it. Completion without a note was rejected.
  `OUT-002` was then created with explicit windows and evidence. A second
  recommendation, `INT-004`, proved the skipped path and created no outcome.
- The packaged `npm test` browser acceptance suite passed all 67 checks on
  2026-07-23. It starts an isolated local server, uses a disposable browser
  profile and fixture, and verifies source hydration, GA4 configuration,
  complete queue filters, invalid-import review, OneView lookup and evidence
  review, contact-detail rejection, evidence-qualified ADA claims, non-waiving
  challenges, monthly-average SLA presentation, lifecycle separation,
  historical privacy boundaries, event evidence, alert deduplication, role
  restrictions, the complete intervention lifecycle, outcome windows, no
  desktop JavaScript errors, and mobile layout containment.
- The GBFS refresh pipeline now discovers timestamped archive files
  automatically instead of relying on a hard-coded source path. It selected
  `20260724T010404Z` from ten unique observations, preserved all 3,592 valid
  positions (2,300 Veo and 1,292 Spin), and reported zero rejected rows. A disposable
  two-snapshot unit test verifies newest-snapshot selection, invalid-row
  accounting, vendor counts, and Goodale watch-history generation.
- A standard-library local service now provides optional durable operations:
  PBKDF2 password verification, HTTP-only same-site sessions, per-session CSRF
  tokens, Viewer/Operator/Administrator roles, optimistic state versions,
  SQLite persistence, and database triggers that reject audit updates or
  deletions. No default credentials are embedded; users are configured from
  environment variables and password changes revoke their existing sessions.
- An authenticated browser acceptance run passed 15 checks: service
  detection, server-assigned Administrator role, visible persistence boundary,
  verified-evidence write-through, request write-through, persistence after
  reload, field-level append-only audit creation, workflow visibility,
  authenticated actor attribution, and zero JavaScript errors. Separate API
  tests proved anonymous reads are rejected, Operator changes are limited to
  request workflow fields and new recommendations, Administrator permission is
  required for source evidence and approval, stale versions return conflict,
  CSRF is enforced, and audit rows cannot be deleted. The durable boundary also
  rejects duplicate request IDs, missing intake fields, invalid dates or
  coordinates, Operator changes to protected top-level sections, alert-rule
  deletion or retargeting, and edits to append-only alert delivery history.
- Complaint classification and operator attribution now expose their evidence
  in request detail. A deterministic fixture containing “Spin” and “wheelchair
  curb ramp” produced `ADA concern` and `reported-claim` until a supporting
  photo finding was explicitly recorded; Spin attribution remained separately
  supported by the narrative-name rule. The
  preserved 104-record Base44 export has no complaint narratives—all records
  contain only the generic descriptor `Shared Electric Bike & Scooters`—so
  those records honestly retain the source `sidewalk_block` label and
  `unknown` operator unless photo-confirmed. The interface explains that
  evidence boundary instead of inventing specificity.
- The durable service now includes an opt-in scheduler for `daily_brief` and
  `alert_evaluation`, plus an independently opt-in `city_311_sync`. Each cycle
  writes append-only run records; server alert states are unique by
  subscription, request, lifecycle status, and severity.
  Two consecutive scheduled test cycles produced successful runs: the first
  created the matching delivery state and the second suppressed it as
  unchanged. An Operator received 403 for manual execution, while an
  authenticated Administrator successfully ran both workflows. Activity shows
  the enabled state, interval, recent statuses, summary counts, and the
  explicit disabled/local-evaluation boundary.
- The City sync reads only the official public ArcGIS endpoint. A deterministic
  service test refreshed City-owned source fields for an existing request while
  preserving its local `assigned` lifecycle, response team, and operator note;
  added one new request; and proved a second identical run created no duplicate,
  state version, or audit entry. Source status remains separate from OneView and
  operational lifecycle status.
- A read-only Base44 sandbox capability check against app
  `6a614b54abec07520930dbea` returned `The sandbox-bridge tools are not
  available for this app type.` No builder prompt or mutating call was made.
  This confirms that a low-credit code inspection/edit loop is unavailable;
  the Superagent builder remains the only visible Base44 modification route.
- A non-root container definition and deployment contract now package the
  authenticated service, scheduler, static interface, and evidence files for a
  single-instance host with HTTPS, managed secrets, persistent `/data`, and
  backups. Docker is not installed in this workspace, so an image build is not
  claimed. The equivalent environment-driven runtime was started on a
  temporary port and verified to report SQLite storage, enabled scheduling,
  the configured interval, and CSP/frame/referrer/permissions headers through
  `/api/health`.
- An optional event-window runner reads the dated external-event schedule and
  defines one notebook execution 30 minutes before kickoff and one 30 minutes
  after estimated event end. Three deterministic tests prove its window
  calculations, expired-window handling, and exactly-once state. The collection
  notebook and external scheduler are not present or claimed as deployed.

## Acceptance-test audit

| # | Requirement | Status | Evidence or gap |
|---|---|---|---|
| 1 | A new source complaint is ingested once and appears in the operational queue. | Proven locally | The current official City feed adds 33 records beyond the 104-record Base44 baseline. A deterministic server test added a new City record exactly once; an identical second sync made no state change. A malformed fixture is excluded and retained with validation reasons. |
| 2 | Classification and operator attribution include inspectable evidence. | Proven locally | Narrative inputs use deterministic ordered rules and show evidence boundaries. Accessibility keywords create `ADA concern`/`reported-claim`; only a recorded supporting photograph creates `ADA ramp`/`visually-confirmed`. Vendor attribution is independent. Three user-reviewed request photographs support operator identity overrides; the current 4th Avenue photo remains accessibility-inconclusive. |
| 3 | An authorized user can assign a request, change status, and see an audit history. | Proven locally | The durable service authenticates a configured user, persists request and evidence updates in SQLite, and exposes append-only field-level history directly in request detail. The acceptance update survived reload and was attributed to `admin`. |
| 4 | The complaint appears at the correct map location and in the correct zone. | Proven for available coordinates | The joined operational street map plots every selected 311 record at its stored latitude/longitude with source ID, address, zone, status, and priority. It overlays 3,592 GBFS positions, cross-vendor flags, named watches, and 52 published no-park/no-ride policy features on OpenStreetMap tiles. Source-zone correctness still depends on the upstream record. |
| 5 | A qualifying cluster produces an explainable hotspot and recommendation. | Proven locally | A temporary reported accessibility fixture generated a score-7 High hotspot without claiming a confirmed violation. Operator created an intervention preserving its score, source record, independent signal, deterministic team, rationale, and transition. Viewer controls were disabled and duplicate active-zone recommendations are prevented. |
| 6 | A recommendation cannot be dispatched before approval. | Proven locally | Browser test confirmed a recommended intervention exposes only Approve; Dispatch appears only after approval. |
| 7 | Completing an intervention creates an outcome path with explicit dates. | Proven locally | Isolated Chromium testing completed recommended → approved → dispatched → completed, required a completion note, and created an inconclusive outcome with four ISO boundary timestamps, readable seven-day windows, baseline source IDs, and completion evidence. A separate skipped recommendation created no outcome. |
| 8 | Filters and summary counts come from live records rather than hard-coded totals. | Proven for current feed | The interface shows `City 30-day feed · 137`, preserves all 104 Base44 IDs, and recalculates counts after source hydration and local changes. Dedicated status, source-anchored date, zone, complaint-type, operator, and severity filters are exercised against loaded records. |
| 9 | A non-admin cannot perform admin-only writes. | Proven locally | The server rejects anonymous reads, requires CSRF, permits Operators to assign requests, add recommendations, pause alert rules, and submit evidence challenges, but rejects source-evidence changes, City findings, intervention approval, protected-section edits, malformed intake, duplicate IDs, alert-rule deletion/retargeting, and alert-history mutation. Administrator transitions are accepted. |
| 10 | Existing records remain present after the change. | Proven locally | Base44 was accessed read-only; all 104 exported IDs remain within the 137-record City-hydrated queue. The service merge test proves source refreshes preserve local lifecycle, team, and notes. |
| 11 | Mobile and desktop layouts preserve operational hierarchy. | Proven locally | Headless Chromium verified the Historical Trends view at 1440×1000 and 390×844. Both layouts show the source boundary, metrics, monthly volume, channels, repeat locations, and anonymous reporting-pattern evidence; document width matches the viewport at both sizes. The horizontally scrollable mobile navigation is intentional. |
| 12 | UI text does not claim unverified functions are live. | Proven locally | The interface labels the 137-record City data as a read-only 30-day feed, distinguishes committed browser evidence from durable mode, and does not claim the optional scheduler is deployed. |

## Required-behavior coverage beyond the numbered tests

| Requirement | Status | Evidence or gap |
|---|---|---|
| Severity- and zone-based alert subscriptions | Proven locally | Operator can create or pause browser-local rules. Viewer creation is disabled and role-gated. |
| Avoid repeated alerts for the same unchanged condition | Proven locally | Delivery keys combine subscription, request, lifecycle state, and severity. Eight unique states remained eight after rerender; a duplicate rule was rejected. |
| Concise daily operating brief | Proven locally | The Brief & Alerts view computes new requests, unresolved critical items, dispatched work, and measured outcomes from the loaded state with an explicit source-window cutoff. |
| Production alert delivery | Partial | The authenticated server now records and deduplicates scheduled delivery states. Email/SMS/push transport still requires an authorized provider and recipient management; the UI does not claim those transports are active. |

## Completion-evidence decision

| Required evidence | Current decision | Authoritative evidence |
|---|---|---|
| Live UI walkthrough across the full operational lifecycle | Proven in isolated local runtime; not yet proven on a deployed URL | 67-check browser suite covers intake, queue, detail, hotspot, recommendation, approval, dispatch, completion, and outcome. The 15-check durable suite covers authenticated persistence and audit history. |
| Current entity counts and representative records | Proven for the refreshed evidence bundle | Official public-feed refresh contains 137 unique requests; all 104 Base44 IDs remain present and 33 City-only records are added. |
| Scheduled workflows active with recent successful runs | Proven in local runtime; deployment evidence missing | Repeated scheduler tests create successful append-only brief and alert runs. City sync is independently tested and idempotent. No production host currently supplies recent runtime records. |
| Administrator and non-administrator permission checks | Proven locally | Browser and API tests cover Viewer, Operator, and Administrator paths, protected sections, source evidence, interventions, malformed intake, duplicate IDs, alerts, and append-only histories. |
| Build/runtime check with no blocking errors | Proven locally; container-host build remains external | JavaScript syntax, 67 browser checks, 15 durable-browser checks, and 12 standard-library tests pass. Docker is unavailable in this workspace, so a host image build is not claimed. |
| Existing complaint IDs preserved | Proven locally | The acceptance suite compares the 104 Base44 source IDs with the 137-record hydrated queue and requires every ID to remain present. |

The product behavior is implemented and locally verified. Completion under the
spec remains intentionally unclaimed until a controlled deployment supplies a
live URL, successful container/runtime check, and recent scheduled-run evidence.

## Reproducible local verification

- Install the declared Playwright development dependency with `npm install`.
- Run `npm test` from the project root.
- The exact browser-check count is emitted by the suite; every check must pass.
- Run `npm run refresh:311` to rebuild the committed current City feed using a
  read-only public query.
- Run `npm run refresh:gbfs` to deterministically rebuild the current positions
  and complete watch history from the configured snapshot archive.
- Run `npm run serve` with one or more `APP_*_PASSWORD` values to exercise
  durable authenticated mode; no password is included in the repository.
- Add `APP_ENABLE_SCHEDULER=1` and an
  `APP_SCHEDULER_INTERVAL_SECONDS` value to exercise recurring workflows.
- Add `APP_ENABLE_CITY_SYNC=1` to include the read-only City refresh. The suite
  itself uses deterministic fixtures and does not write to Base44, GitHub, or
  City systems.

## Remaining completion gates

1. Select and authorize a container host with HTTPS, managed secrets, a
   persistent volume, and backups, then build the prepared image there.
2. Replace evaluation passwords with an approved identity provider, managed
   secrets, HTTPS, backups, and operational session policy for deployment.
3. Validate the proven classification rules against actual complaint narratives
   when a source containing those narratives becomes available.
4. Collect enough additional matched event and non-event GBFS snapshots to
   test recurrence; the current schedule join has only one event-linked
   observation and cannot establish causation.
5. Select the production database and migrate the proven SQLite state contract
   without risking existing Base44 records.
6. Run the complete acceptance suite against the deployed application.
7. Enable the proven scheduler in the deployed environment and verify recent
   successful `city_311_sync`, `daily_brief`, and `alert_evaluation` runs there;
   local scheduled runs do not prove production uptime.

## Base44 credit decision

A builder-agent prompt is not justified yet. Read-only inspection proved that
this Base44 app type has no sandbox bridge, so changes cannot be previewed or
verified through the low-credit remote-development loop. Preserve credits and
reserve a single narrow Superagent request for a reversible integration test
only after the container deployment route is selected.
