import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8876;
const baseUrl = `http://127.0.0.1:${port}/`;
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const cityFeed = JSON.parse(readFileSync(resolve(root, "columbus-311-current.json"), "utf8"));
const base44Snapshot = JSON.parse(readFileSync(resolve(root, "base44-live-snapshot.json"), "utf8"));
const expectedCityCount = cityFeed.records.length;
const preservedBase44Ids = base44Snapshot.entities.map(record => record.source_id);
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore"
});

const checks = [];
function check(condition, description) {
  checks.push({ description, passed: Boolean(condition) });
  if (!condition) throw new Error(`Acceptance failure: ${description}`);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  throw new Error("Local acceptance server did not start.");
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {})
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    count => document.getElementById("dataMode")?.innerText.includes(String(count)),
    expectedCityCount
  );

  check(
    (await page.locator("#dataMode").innerText()).includes(`City 30-day feed · ${expectedCityCount}`),
    `${expectedCityCount}-record City feed loads`
  );
  check(
    await page.evaluate(
      ({ expectedCount, baseIds }) => {
        const issueIds = new Set(state.issues.map(issue => issue.id));
        return (
          state.base44SnapshotCount === baseIds.length &&
          state.issues.length === expectedCount &&
          issueIds.size === expectedCount &&
          baseIds.every(id => issueIds.has(id))
        );
      },
      { expectedCount: expectedCityCount, baseIds: preservedBase44Ids }
    ),
    `all ${preservedBase44Ids.length} Base44 IDs are preserved and City records are deduplicated`
  );
  check(await page.locator("#issueRows tr").count() === 8, "open queue shows eight unresolved current records");
  check((await page.locator('#issueRows tr[data-id="CAS-3085935-H5M2M1"] td').nth(2).innerText()) === "Spin", "operational queue includes the verified vendor");
  check(await page.locator('script[src*="G-V40E4MZEMV"]').count() === 1, "GA4 script is present once");
  check(await page.evaluate(() => window.dataLayer?.some(item => item?.[0] === "config" && item?.[1] === "G-V40E4MZEMV")), "GA4 property is configured");
  check(await page.locator('link[rel="manifest"][href="manifest.webmanifest"]').count() === 1, "PWA manifest is linked");
  check((await page.locator(".site-footer").innerText()).includes("© 2026 Steven Needham") && (await page.locator(".footer-tagline").innerText()) === "Made in Columbus, Ohio.", "copyright and Columbus tagline render");
  check(await page.evaluate(async () => {
    const manifest = await fetch("manifest.webmanifest").then(response => response.json());
    return manifest.display === "standalone" && manifest.icons.some(icon => icon.sizes === "192x192") && manifest.icons.some(icon => icon.sizes === "512x512");
  }), "PWA manifest declares standalone display and install icons");
  await page.setViewportSize({ width: 390, height: 844 });
  check(await page.locator(".masthead").evaluate(element => element.scrollWidth <= element.clientWidth), "mobile masthead does not overflow");
  check(await page.locator("#issueRows tr").first().evaluate(element => getComputedStyle(element).display === "grid"), "mobile requests render as touch-friendly cards");
  check(await page.locator(".nav-item").first().evaluate(element => element.getBoundingClientRect().height >= 44), "mobile navigation meets touch target sizing");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#issueRows tr[data-id="CAS-3085657-R4J3G9"]').click();
  const sourceOnlyDetail = await page.locator("#detailPanel").innerText();
  check(sourceOnlyDetail.includes("Source Label") && sourceOnlyDetail.includes("no complaint narrative"), "source-only classification boundary is visible");
  check(sourceOnlyDetail.includes("Unattributed") && sourceOnlyDetail.includes("Neither the source operator field"), "unknown operator evidence is visible");
  await page.locator("#statusFilter").selectOption("all");
  await page.locator("#operatorFilter").selectOption("Spin");
  const spinIds = await page.locator("#issueRows tr[data-id]").evaluateAll(rows => rows.map(row => row.dataset.id));
  check(spinIds.length > 0 && await page.evaluate(ids => ids.every(id => state.issues.find(issue => issue.id === id)?.operator === "Spin"), spinIds), "operator filter returns only the selected vendor");
  await page.locator("#operatorFilter").selectOption("all");
  await page.locator("#typeFilter").selectOption("ADA concern");
  check(await page.locator('#issueRows tr[data-id="CAS-3085935-H5M2M1"]').count() === 1, "complaint-type filter exposes the verified ADA request");
  await page.locator("#typeFilter").selectOption("all");
  await page.locator("#dateFilter").selectOption("1");
  const recentIds = await page.locator("#issueRows tr[data-id]").evaluateAll(rows => rows.map(row => row.dataset.id));
  check(recentIds.length > 0 && await page.evaluate(ids => {
    const anchor = Math.max(...state.issues.map(issue => new Date(issue.reportedAt).getTime()));
    return ids.every(id => new Date(state.issues.find(issue => issue.id === id).reportedAt).getTime() >= anchor - 86400000);
  }, recentIds), "date filter uses the loaded source anchor rather than the wall clock");
  await page.locator("#dateFilter").selectOption("all");
  await page.locator("#statusFilter").selectOption("open");
  await page.locator('#issueRows tr[data-id="CAS-3085935-H5M2M1"]').click();
  const crossReferenceDetail = await page.locator("#detailPanel").innerText();
  check(crossReferenceDetail.includes("ADA concern") && crossReferenceDetail.includes("Spin"), "OneView evidence preserves the reported ADA concern and confirms only the operator");
  check(crossReferenceDetail.includes("Reported Claim") && crossReferenceDetail.includes("Photo Inconclusive") && crossReferenceDetail.includes("HIGH"), "unconfirmed ADA report remains evidence-qualified rather than a critical violation");
  check(crossReferenceDetail.includes("Photo And Text Confirmed"), "photo-and-text attribution confidence is visible");
  check(/City source status/i.test(crossReferenceDetail) && crossReferenceDetail.includes("Received") && /OneView status/i.test(crossReferenceDetail) && crossReferenceDetail.includes("Assigned") && crossReferenceDetail.includes("read-only cross-reference") && await page.locator("#statusInput").inputValue() === "received", "City, OneView, and operational lifecycle statuses remain separate");
  check(crossReferenceDetail.includes("second improperly parked scooter") && !/Justin Goodwin|Walter Hardy|7:07PM/i.test(crossReferenceDetail), "official narrative is summarized without personal details");
  check(await page.locator('#detailPanel a[href="https://columbusoh.oneviewcrm.cc/servicerequests/84b19b9a-2886-f111-a86d-000d3adc4910"]').count() === 1, "official OneView request link is exact");
  await page.locator("#roleSelect").selectOption("viewer");
  check(await page.locator('#accessibilityChallengeForm button[type="submit"]').isDisabled(), "Viewer cannot submit an accessibility evidence challenge");
  await page.locator("#roleSelect").selectOption("operator");
  await page.locator("#accessibilityChallengeStatusInput").selectOption("submitted_to_city");
  await page.locator("#accessibilityChallengeNoteInput").fill("Photograph does not establish a blocked accessible path; City review requested.");
  await page.locator('#accessibilityChallengeForm button[type="submit"]').click();
  const challengeState = await page.evaluate(() => {
    const issue = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1")).issues.find(item => item.id === "CAS-3085935-H5M2M1");
    return { lifecycle: issue.status, challenge: issue.accessibilityChallengeStatus };
  });
  check(challengeState.lifecycle === "received" && challengeState.challenge === "submitted_to_city", "operator challenge is recorded without dismissing or changing the request lifecycle");
  check((await page.locator("#detailPanel").innerText()).includes("no waiver implied") && (await page.locator("#dataNotice").innerText()).includes("No waiver"), "challenge UI explicitly rejects any presumed waiver or SLA pause");
  await page.locator("#roleSelect").selectOption("admin");
  await page.locator('#issueRows tr[data-id="CAS-3082644-P9D1M0"]').click();
  const oneViewLookup = page.locator('#detailPanel a[data-oneview-lookup]');
  check(await oneViewLookup.count() === 1, "unmatched requests expose the public nearby-request lookup");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(value) {
          window.__copiedOneViewAddress = value;
          return Promise.resolve();
        }
      }
    });
  });
  await oneViewLookup.evaluate(element => element.addEventListener("click", event => event.preventDefault()));
  await oneViewLookup.click();
  await page.waitForFunction(() => window.__copiedOneViewAddress);
  check(
    await page.evaluate(() => window.__copiedOneViewAddress) === "875 MICHIGAN AVE",
    "OneView lookup copies the selected request address"
  );
  check((await page.locator("#dataNotice").innerText()).includes("875 MICHIGAN AVE copied"), "OneView lookup confirms the copied address");
  await page.locator('#issueRows tr[data-id="CAS-3085657-R4J3G9"]').click();
  await page.locator("#roleSelect").selectOption("viewer");
  check(await page.locator('#evidenceReviewForm button[type="submit"]').isDisabled(), "Viewer cannot record cross-reference evidence");
  await page.locator("#roleSelect").selectOption("admin");
  await page.locator("#crossReferenceUrlInput").fill("https://columbusoh.oneviewcrm.cc/servicerequests/11111111-1111-1111-1111-111111111111");
  await page.locator("#crossReferenceSummaryInput").fill("Veo scooter blocks the ADA ramp. Contact resident@example.com.");
  await page.locator("#crossReferenceStatusInput").selectOption("concluded");
  await page.locator("#crossReferenceOperatorInput").selectOption("Veo");
  await page.locator("#crossReferenceConfidenceInput").selectOption("photo-confirmed");
  await page.locator("#accessibilityEvidenceInput").selectOption("photo_supporting");
  await page.locator('#evidenceReviewForm button[type="submit"]').click();
  check((await page.locator("#evidenceReviewError").innerText()).includes("Remove email addresses"), "contact details are rejected from cross-reference summaries");
  await page.locator("#crossReferenceSummaryInput").fill("Veo scooter blocks the ADA curb ramp at the reported intersection.");
  await page.locator('#evidenceReviewForm button[type="submit"]').click();
  const recordedEvidence = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1"));
    const issue = state.issues.find(item => item.id === "CAS-3085657-R4J3G9");
    return {
      status: issue.status,
      type: issue.type,
      operator: issue.operator,
      confidence: issue.operatorConfidence,
      crossReferenceStatus: issue.crossReferenceStatus,
      crossReferenceUrl: issue.crossReferenceUrl
    };
  });
  check(recordedEvidence.status === "received" && recordedEvidence.crossReferenceStatus === "concluded", "saving cross-reference evidence does not overwrite the local lifecycle");
  check(recordedEvidence.type === "ADA ramp" && recordedEvidence.operator === "Veo" && recordedEvidence.confidence === "photo-confirmed", "reviewed evidence updates classification and operator attribution");
  check(recordedEvidence.crossReferenceUrl.endsWith("11111111-1111-1111-1111-111111111111"), "reviewed evidence retains the exact matched request URL");
  check((await page.locator(".request-history").innerText()).includes("Cross Reference Verified") && (await page.locator(".request-history").innerText()).includes("local-admin"), "request detail shows its evidence-review history");
  const transparentRules = await page.evaluate(() => {
    const normalized = normalizeImportedIssue({
      source_id: "CAS-RULE-TEST",
      complaint_type: "other",
      description: "Orange Spin scooters blocking wheelchair curb ramp",
      address: "100 TEST ST",
      zone_id: "test",
      operator: "unknown",
      reported_at: "2026-07-23T12:00:00Z",
      status: "received",
      latitude: 39.96,
      longitude: -83
    });
    const ambiguous = normalizeImportedIssue({
      source_id: "CAS-AMBIGUOUS-TEST",
      complaint_type: "sidewalk_block",
      description: "Veo and Spin devices are grouped on the sidewalk",
      address: "200 TEST ST",
      zone_id: "test",
      operator: "unknown",
      reported_at: "2026-07-23T12:00:00Z",
      status: "received",
      latitude: 39.96,
      longitude: -83
    });
    return {
      type: normalized.type,
      classificationConfidence: normalized.classificationConfidence,
      classificationEvidence: normalized.classificationEvidence,
      operator: normalized.operator,
      operatorConfidence: normalized.operatorConfidence,
      operatorEvidence: normalized.operatorEvidence,
      ambiguousOperator: ambiguous.operator,
      ambiguousConfidence: ambiguous.operatorConfidence
    };
  });
  check(transparentRules.type === "ADA concern" && transparentRules.classificationConfidence === "reported-claim", "ADA narrative remains a reported concern without visual confirmation");
  check(transparentRules.classificationEvidence.includes("not a confirmed ADA violation"), "classification evidence states the allegation boundary");
  check(transparentRules.operator === "Spin" && transparentRules.operatorConfidence === "description-keyword", "explicit vendor name produces reviewable operator attribution");
  check(transparentRules.ambiguousOperator === "unknown" && transparentRules.ambiguousConfidence === "ambiguous", "multi-vendor narrative is not forced to one operator");

  await page.locator('[data-view="compliance"]').click();
  const complianceText = await page.locator("#compliance").innerText();
  check(complianceText.includes("Monthly eligible average ≤ 60 minutes") && complianceText.includes("individual duration above the target"), "SLA response time is modeled as a monthly eligible average");
  check(complianceText.includes("3h 18m") && complianceText.includes("unverified sample mean"), "provisional duration rows are summarized as a sample mean");
  check(!complianceText.includes("request-level ADA pass rate") && !complianceText.includes("ADA within target"), "individual observations are not labeled contractual passes or failures");

  await page.locator('[data-view="trends"]').click();
  const trendText = await page.locator("#trends").innerText();
  check(trendText.includes("1,339"), "privacy-safe historical record count renders");
  check(trendText.includes("196"), "same-address burst count renders");
  check(trendText.includes("Source cluster 01"), "anonymous source concentration renders");
  check(!/@gmail|@citysourced|douglas lang|pasquale grado|chester ridenour/i.test(trendText), "reporter identity and contact data are absent");

  await page.locator('[data-view="vehicles"]').click();
  const vehicleText = await page.locator("#pileupList").innerText();
  check((await page.locator("#vehicleSnapshotNote").innerText()).includes("2026-07-24 · 01:04:04 UTC"), "newest GBFS snapshot timestamp renders");
  check((await page.locator("#vehicleMetrics").innerText()).includes("3,592"), "newest GBFS position count renders");
  check(vehicleText.includes("1 vehicle within 250 m") && vehicleText.includes("No cross-vendor condition in this snapshot"), "latest Goodale observation shows the prior pile-up has cleared");
  check(vehicleText.toLowerCase().includes("historical recovery window") && vehicleText.includes("6 vehicles in the event-linked snapshot"), "prior event-linked pile-up remains in history");
  check(vehicleText.includes("Columbus Crew vs. New York City FC"), "official event context renders");
  check(vehicleText.includes("event median 6 vs. non-event median 2"), "event and non-event comparison renders");
  check(vehicleText.includes("Association only"), "causation boundary renders");
  check((await page.locator(".watch-history").getAttribute("aria-label")).includes("10 snapshots") && await page.locator(".watch-history .event-linked-bar").count() === 1, "one of ten watch observations is event linked");

  await page.locator('[data-view="briefing"]').click();
  check((await page.locator("#dailyBrief").innerText()).includes("Unresolved critical items"), "daily brief contains required attention sections");
  await page.locator("#roleSelect").selectOption("viewer");
  check(await page.locator("#subscriptionForm button[type='submit']").isDisabled(), "Viewer cannot add alert subscriptions");
  await page.locator("#roleSelect").selectOption("operator");
  await page.locator("#subscriptionSeverity").selectOption("high");
  await page.locator("#subscriptionZone").selectOption("all");
  await page.locator("#subscriptionForm button[type='submit']").click();
  const alertState = await page.evaluate(() => JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1")));
  check(alertState.alertDeliveries.length === new Set(alertState.alertDeliveries.map(item => item.dedupeKey)).size, "alert delivery keys are unique");
  const alertCount = alertState.alertDeliveries.length;
  await page.locator('[data-view="operations"]').click();
  await page.locator('[data-view="briefing"]').click();
  check(await page.evaluate(() => JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1")).alertDeliveries.length) === alertCount, "rerender does not duplicate unchanged alerts");

  await page.locator('[data-view="operations"]').click();
  await page.locator("#importFile").setInputFiles({
    name: "acceptance-hotspot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([
      {
        source_id: "CAS-ACCEPTANCE-HOTSPOT",
        complaint_type: "ada_ramp",
        description: "Accessibility obstruction acceptance fixture",
        address: "100 TEST PLAZA",
        zone_id: "acceptance_zone",
        operator: "unknown",
        reported_at: "2026-07-23T19:45:00Z",
        status: "received",
        latitude: 39.9612,
        longitude: -82.9988
      },
      {
        source_id: "CAS-INCOMPLETE-REVIEW",
        complaint_type: "sidewalk_block",
        reported_at: "not-a-date",
        latitude: 200
      }
    ]))
  });
  await page.locator("#importReviewPanel").waitFor({ state: "visible" });
  const reviewText = await page.locator("#importReviewPanel").innerText();
  check(reviewText.includes("CAS-INCOMPLETE-REVIEW") && reviewText.includes("address is required") && reviewText.includes("reported time is missing or invalid"), "incomplete import is surfaced with actionable validation reasons");
  check(await page.locator('#issueRows tr[data-id="CAS-INCOMPLETE-REVIEW"]').count() === 0, "rejected import never enters the operational queue");
  await page.locator('[data-view="map"]').click();
  check((await page.locator("#mapResultCount").innerText()).includes("52 policy features"), "published policy features are joined to the operational map");
  check(await page.locator(".leaflet-overlay-pane canvas").count() > 0, "published policy geometry renders as a map overlay");
  await page.locator('[data-view="hotspots"]').click();
  const policyText = await page.locator("#policyBoundaryAnalysis").innerText();
  check(policyText.includes("26") && policyText.toLowerCase().includes("within 25 m") && policyText.toLowerCase().includes("of 104"), "published policy boundary proximity summary renders");
  check(policyText.includes("matched control set") && policyText.includes("not evidence that a geofence caused"), "policy proximity does not claim causation or enrichment");
  check(await page.locator("#mapPoliciesToggle").isChecked(), "published policy boundary map layer is enabled by default");
  const recommendationButton = page.locator('[data-recommend-zone="Acceptance Zone"]');
  check(await recommendationButton.isEnabled(), "qualifying hotspot exposes recommendation action to Operator");
  await recommendationButton.click();
  const interventionId = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1"));
    return state.interventions.find(item => item.zone === "Acceptance Zone" && item.status === "recommended")?.id;
  });
  check(Boolean(interventionId), "hotspot creates an intervention recommendation");

  await page.locator('[data-view="interventions"]').click();
  check(await page.locator(`[data-action="approve"][data-id="${interventionId}"]`).isDisabled(), "Operator cannot approve intervention");
  check(await page.locator(`[data-action="dispatch"][data-id="${interventionId}"]`).count() === 0, "dispatch is unavailable before approval");
  await page.locator("#roleSelect").selectOption("admin");
  await page.locator(`[data-action="approve"][data-id="${interventionId}"]`).click();
  await page.locator(`[data-action="dispatch"][data-id="${interventionId}"]`).click();
  check(await page.locator(`[data-vendor-response][data-id="${interventionId}"]`).count() === 4, "dispatch requests an accept-or-acknowledge response from both unattributed vendors");
  await page.locator(`[data-action="complete"][data-id="${interventionId}"]`).click();
  check((await page.locator("#dataNotice").innerText()).includes("completion note is required"), "completion without evidence is rejected");
  await page.locator(`[data-completion-note="${interventionId}"]`).fill("Field team verified the obstruction was cleared.");
  await page.locator(`[data-action="complete"][data-id="${interventionId}"]`).click();
  check((await page.locator("#dataNotice").innerText()).includes("Vendor response required from Spin and Veo"), "completion waits for every dispatched vendor");
  await page.locator(`[data-vendor-response="acknowledged"][data-vendor="Spin"][data-id="${interventionId}"]`).click();
  await page.locator(`[data-vendor-response="accepted"][data-vendor="Veo"][data-id="${interventionId}"]`).click();
  await page.locator(`[data-action="complete"][data-id="${interventionId}"]`).click();
  const lifecycle = await page.evaluate(id => {
    const state = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1"));
    return {
      intervention: state.interventions.find(item => item.id === id),
      outcome: state.outcomes.find(item => item.interventionId === id)
    };
  }, interventionId);
  check(lifecycle.intervention.status === "completed", "intervention reaches completed state");
  check(
    lifecycle.intervention.vendorResponses.Spin.status === "acknowledged" &&
    lifecycle.intervention.vendorResponses.Veo.status === "accepted",
    "each dispatched vendor response is preserved"
  );
  check(lifecycle.intervention.transitions.map(item => item.status).join(",") === "recommended,approved,dispatched,completed", "all lifecycle transitions are recorded");
  check(Boolean(lifecycle.outcome?.baselineStart && lifecycle.outcome?.postEnd), "completion creates explicit outcome windows");

  await page.locator("#openIntervention").click();
  await page.locator("#interventionTypeInput").selectOption("policy");
  await page.locator("#interventionCadenceInput").selectOption("rule_policy_change");
  await page.locator("#interventionZoneInput").fill("Harrison West");
  await page.locator("#interventionStrategyInput").fill("Mandatory parking in this area");
  await page.locator("#interventionRationaleInput").fill("Repeated sidewalk-blocking requests support a longer-term designated-parking intervention.");
  await page.locator("#interventionStartInput").fill("2026-08-01");
  await page.locator("#interventionEndInput").fill("2026-11-01");
  await page.locator("#interventionLatitudeInput").fill("39.9791");
  await page.locator("#interventionLongitudeInput").fill("-83.0172");
  await page.locator("#interventionRadiusInput").fill("400");
  await page.locator('#interventionForm button[type="submit"]').click();
  const policyIntervention = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1"));
    return state.interventions.find(item => item.strategy === "Mandatory parking in this area");
  });
  check(
    policyIntervention?.interventionType === "policy" &&
    policyIntervention.cadence === "rule_policy_change" &&
    policyIntervention.targetVendors.length === 2 &&
    policyIntervention.mapArea.radiusMeters === 400 &&
    policyIntervention.timeframeEnd === "2026-11-01",
    "rule or policy intervention preserves its cadence, map area, timeframe, and responding vendors"
  );

  await page.locator("#openIntervention").click();
  await page.locator("#interventionTypeInput").selectOption("experiment");
  await page.locator("#interventionCadenceInput").selectOption("repeating");
  await page.locator("#interventionRecurrenceInput").fill("Daily during the two-week test window");
  await page.locator("#interventionZoneInput").fill("Harrison West");
  await page.locator("#interventionStrategyInput").fill("Two-week mandatory-parking experiment");
  await page.locator("#interventionRationaleInput").fill("Test whether a defined parking rule reduces repeat obstruction signals before permanent adoption.");
  await page.locator("#interventionHypothesisInput").fill("Mandatory parking will reduce independent sidewalk-blocking requests in the test area.");
  await page.locator("#interventionSuccessMeasureInput").fill("At least 25% fewer independent 311 requests");
  await page.locator("#interventionStartInput").fill("2026-08-01");
  await page.locator("#interventionEndInput").fill("2026-08-15");
  await page.locator("#interventionLatitudeInput").fill("39.9791");
  await page.locator("#interventionLongitudeInput").fill("-83.0172");
  await page.locator("#interventionRadiusInput").fill("250");
  await page.locator('#interventionForm button[type="submit"]').click();
  const experimentIntervention = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1"));
    return state.interventions.find(item => item.strategy === "Two-week mandatory-parking experiment");
  });
  check(
    experimentIntervention?.interventionType === "experiment" &&
    experimentIntervention.cadence === "repeating" &&
    experimentIntervention.recurrence.includes("Daily") &&
    experimentIntervention.mapArea.radiusMeters === 250 &&
    experimentIntervention.hypothesis.includes("reduce independent") &&
    experimentIntervention.successMeasure.includes("25%") &&
    experimentIntervention.plannedStart === "2026-08-01" &&
    experimentIntervention.plannedEnd === "2026-08-15",
    "experiment preserves its cadence, map area, hypothesis, measure, and planned window"
  );
  await page.locator('[data-view="map"]').click();
  check(await page.locator("#mapInterventionsToggle").isChecked(), "intervention areas are enabled on the operational map");
  check(await page.locator(".intervention-area-layer").count() >= 2, "active interventions render as defined map areas");
  check((await page.locator("#mapResultCount").innerText()).includes("intervention areas"), "map summary counts active intervention areas");

  await page.locator('[data-view="site-metrics"]').click();
  const metricsText = await page.locator("#site-metrics").innerText();
  check(metricsText.includes("G-V40E4MZEMV") && metricsText.includes("Reporting connection required"), "metrics page distinguishes configured collection from unconnected aggregate reporting");
  check(metricsText.includes("This device only") && metricsText.includes("not historical uptime"), "metrics page states its privacy and uptime measurement boundaries");
  check(["Past 1 day", "Past 3 days", "Past 7 days", "Past 30 days", "Past 60 days", "Past 90 days"].every(label => metricsText.includes(label)), "metrics page includes 1-, 3-, 7-, 30-, 60-, and 90-day view windows");
  check(metricsText.includes("104") && metricsText.includes("preserved complaint records") && metricsText.includes("0") && metricsText.includes("populated records in those derived entities"), "Base44 artifacts are integrated without presenting empty derived entities as live data");
  await page.locator("#checkUptime").click();
  await page.locator("#uptimeMetrics").getByText("Reachable now").waitFor();
  check((await page.locator("#uptimeMetrics").innerText()).includes("Reachable now"), "current reachability is checked without claiming historical uptime");

  check(pageErrors.length === 0, "desktop run has no JavaScript page errors");
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForFunction(() => document.getElementById("dataMode")?.innerText.includes("137"));
  await mobilePage.locator('[data-view="vehicles"]').click();
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), "mobile document has no horizontal overflow");
  check((await mobilePage.locator("#pileupList").innerText()).includes("Columbus Crew vs. New York City FC"), "event evidence preserves mobile hierarchy");
  await mobilePage.locator('[data-view="site-metrics"]').click();
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), "site metrics has no mobile horizontal overflow");
  await mobileContext.close();

  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
