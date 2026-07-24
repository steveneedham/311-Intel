# 311 Issue Resolution App — Completion Specification

## Objective

Create an operational Columbus 311 issue-resolution app that turns incoming service requests into prioritized, assigned, trackable work and measures whether interventions resolve recurring problems.

## Current authoritative state

- Base44 app: `311` (`6a614b54abec07520930dbea`)
- GitHub repository: `steveneedham/311intel`
- The live Base44 data layer contains 104 `MicromobilityComplaint` records.
- All 104 live complaints are classified as `sidewalk_block`.
- All 104 live complaints have operator `unknown`.
- The live `MicromobilityHotspot`, `InterventionRecommendation`,
  `InterventionOutcome`, `CityZone`, `OperatorDeployment`, `ExternalEvent`,
  `WeatherSnapshot`, `FieldTeam`, and `AlertSubscription` entities are empty.
- The repository dashboard is a static historical analysis of 1,339 complaints.
  Its values are hard-coded and do not represent the current Base44 records.
- Base44 does not expose source-sandbox inspection for this app type.
- The current Base44 surface is a Superagent chat rather than a standard
  application workspace. Its visible message input is disabled because the
  account has no remaining daily credits.
- The approved builder instruction must not be treated as complete until a
  standard operational interface and the acceptance-test flows below are
  visible and verified.

## Required product behavior

### 1. Intake and normalization

- Ingest new Columbus 311 records without duplicating `source_id`.
- Preserve source, address, coordinates, reported time, status, and description.
- Classify complaint type using the source description.
- Attribute Veo, Spin, or unknown using transparent rules.
- Surface invalid or incomplete records for review instead of silently accepting
  them.

### 2. Operational queue

- Show unresolved requests first.
- Filter by status, date, zone, complaint type, operator, and severity.
- Provide a request detail view with history, location, evidence, ownership, and
  next action.
- Allow an authorized user to assign a field team and update lifecycle status.

### 3. Map and hotspot analysis

- Plot live requests on a Columbus map.
- Aggregate complaints into defined city zones.
- Explain hotspot severity using complaint volume, recency, accessibility risk,
  nearby events, deployments, and weather where available.
- Keep historical analysis visually distinct from current operational data.

### 4. Intervention workflow

- Generate a reviewable recommendation for an identified hotspot.
- Require approval before dispatch.
- Track recommended, approved, dispatched, completed, and skipped states.
- Record the assigned team, rationale, timestamps, and completion notes.

### 5. Outcome measurement

- Compare a documented pre-intervention baseline with a defined post-period.
- Report reduced, unchanged, or inconclusive outcomes.
- Display the calculation window and source records behind each result.

### 6. Alerts and accountability

- Support severity- and zone-based alert subscriptions.
- Record alert delivery state and avoid repeated alerts for the same unchanged
  condition.
- Provide a concise daily operating brief covering new issues, unresolved
  critical items, dispatched work, and measured outcomes.

### 7. Access and data integrity

- Preserve the existing administrator.
- Apply role-appropriate permissions to all operational entities.
- Require the minimum fields needed for valid records.
- Prevent destructive bulk actions without confirmation.
- Preserve existing real data and workflows during the build.

## Interface direction

- Follow Steven Needham's editorial design system: restrained typography,
  generous whitespace, timeless layouts, minimal iconography, and
  evidence-forward explanations.
- Use brand-neutral public language.
- Avoid promotional claims and unsupported causal explanations.
- Clearly label live, historical, forecast, and inferred information.
- Treat accessibility-related complaints as an operational priority without
  making unsupported legal conclusions.

## Acceptance tests

1. A new source complaint is ingested once and appears in the operational queue.
2. Its classification and operator attribution include inspectable evidence.
3. An authorized user can assign it, change status, and see an audit history.
4. The complaint appears at the correct map location and in the correct zone.
5. A qualifying cluster produces an explainable hotspot and a recommendation.
6. The recommendation cannot be dispatched before approval.
7. Completing an intervention creates an outcome-evaluation path with explicit
   baseline and post-period dates.
8. Filters and summary counts are computed from live records, not hard-coded
   constants.
9. A non-admin cannot perform admin-only writes.
10. Existing records remain present after the change.
11. Mobile and desktop layouts preserve the operational hierarchy.
12. No UI text claims a function or workflow is live unless current runtime
    evidence verifies it.

## Verification evidence required before completion

- Live UI walkthrough covering intake, queue, detail, assignment, status update,
  hotspot, recommendation, dispatch, and outcome.
- Current entity counts and representative records.
- Evidence that scheduled workflows are active and have recent successful runs.
- Permission checks for admin and non-admin roles.
- A build/runtime check with no blocking errors.
- Confirmation that existing complaint IDs were preserved.
