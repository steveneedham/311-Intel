import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8876;
const baseUrl = `http://127.0.0.1:${port}/`;
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
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
  await page.waitForFunction(() => document.getElementById("dataMode")?.innerText.includes("104"));

  check((await page.locator("#dataMode").innerText()).includes("Base44 snapshot · 104"), "104-record source snapshot loads");
  check(await page.locator("#issueRows tr").count() === 8, "open queue shows eight unresolved snapshot records");
  check(await page.locator('script[src*="G-V40E4MZEMV"]').count() === 1, "GA4 script is present once");
  check(await page.evaluate(() => window.dataLayer?.some(item => item?.[0] === "config" && item?.[1] === "G-V40E4MZEMV")), "GA4 property is configured");
  await page.locator("#issueRows tr[data-id]").first().click();
  const sourceOnlyDetail = await page.locator("#detailPanel").innerText();
  check(sourceOnlyDetail.includes("Source Label") && sourceOnlyDetail.includes("no complaint narrative"), "source-only classification boundary is visible");
  check(sourceOnlyDetail.includes("Unattributed") && sourceOnlyDetail.includes("Neither the source operator field"), "unknown operator evidence is visible");
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
  check(transparentRules.type === "ADA ramp" && transparentRules.classificationConfidence === "rule-matched", "narrative classification applies an inspectable accessibility rule");
  check(transparentRules.classificationEvidence.includes("curb-ramp keyword"), "classification evidence names the matched rule");
  check(transparentRules.operator === "Spin" && transparentRules.operatorConfidence === "description-keyword", "explicit vendor name produces reviewable operator attribution");
  check(transparentRules.ambiguousOperator === "unknown" && transparentRules.ambiguousConfidence === "ambiguous", "multi-vendor narrative is not forced to one operator");

  await page.locator('[data-view="trends"]').click();
  const trendText = await page.locator("#trends").innerText();
  check(trendText.includes("1,339"), "privacy-safe historical record count renders");
  check(trendText.includes("196"), "same-address burst count renders");
  check(trendText.includes("Source cluster 01"), "anonymous source concentration renders");
  check(!/@gmail|@citysourced|douglas lang|pasquale grado|chester ridenour/i.test(trendText), "reporter identity and contact data are absent");

  await page.locator('[data-view="vehicles"]').click();
  const vehicleText = await page.locator("#pileupList").innerText();
  check(vehicleText.toLowerCase().includes("recovery window"), "latest Goodale observation is classified in the recovery window");
  check(vehicleText.includes("Columbus Crew vs. New York City FC"), "official event context renders");
  check(vehicleText.includes("event median 6 vs. non-event median 2"), "event and non-event comparison renders");
  check(vehicleText.includes("Association only"), "causation boundary renders");
  check(await page.locator(".watch-history .event-linked-bar").count() === 1, "one of nine watch observations is event linked");

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

  await page.locator("#importFile").setInputFiles({
    name: "acceptance-hotspot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{
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
    }]))
  });
  await page.locator('[data-view="hotspots"]').click();
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
  await page.locator(`[data-action="complete"][data-id="${interventionId}"]`).click();
  check((await page.locator("#dataNotice").innerText()).includes("completion note is required"), "completion without evidence is rejected");
  await page.locator(`[data-completion-note="${interventionId}"]`).fill("Field team verified the obstruction was cleared.");
  await page.locator(`[data-action="complete"][data-id="${interventionId}"]`).click();
  const lifecycle = await page.evaluate(id => {
    const state = JSON.parse(localStorage.getItem("311-field-intelligence-trial-v1"));
    return {
      intervention: state.interventions.find(item => item.id === id),
      outcome: state.outcomes.find(item => item.interventionId === id)
    };
  }, interventionId);
  check(lifecycle.intervention.status === "completed", "intervention reaches completed state");
  check(lifecycle.intervention.transitions.map(item => item.status).join(",") === "recommended,approved,dispatched,completed", "all lifecycle transitions are recorded");
  check(Boolean(lifecycle.outcome?.baselineStart && lifecycle.outcome?.postEnd), "completion creates explicit outcome windows");

  check(pageErrors.length === 0, "desktop run has no JavaScript page errors");
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForFunction(() => document.getElementById("dataMode")?.innerText.includes("104"));
  await mobilePage.locator('[data-view="vehicles"]').click();
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), "mobile document has no horizontal overflow");
  check((await mobilePage.locator("#pileupList").innerText()).includes("Columbus Crew vs. New York City FC"), "event evidence preserves mobile hierarchy");
  await mobileContext.close();

  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
