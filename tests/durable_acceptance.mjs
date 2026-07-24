import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = 8877;
const baseUrl = `http://127.0.0.1:${port}/`;
const temporaryDirectory = mkdtempSync(join(tmpdir(), "311-intel-durable-"));
const database = join(temporaryDirectory, "acceptance.sqlite3");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const server = spawn(
  "python3",
  ["server.py", "--port", String(port), "--database", database],
  {
    cwd: root,
    stdio: "ignore",
    env: {
      ...process.env,
      APP_ADMIN_PASSWORD: "administrator-pass-123"
    }
  }
);

const checks = [];
function check(condition, description) {
  checks.push({ description, passed: Boolean(condition) });
  if (!condition) throw new Error(`Durable acceptance failure: ${description}`);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  throw new Error("Durable acceptance server did not start.");
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {})
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.getElementById("authButton")?.hidden);

  check((await page.locator("#authButton").innerText()) === "Sign in", "durable service is detected");
  await page.locator("#authButton").click();
  await page.locator("#authUsername").fill("admin");
  await page.locator("#authPassword").fill("administrator-pass-123");
  await page.locator("#authForm button[type='submit']").click();
  await page.waitForFunction(() => document.getElementById("roleSelect")?.disabled);
  check(await page.locator("#roleSelect").inputValue() === "admin", "authenticated server role replaces trial role");
  check((await page.locator("#persistenceNote").innerText()).includes("versioned in SQLite"), "durable storage boundary is visible");

  const requestId = await page.locator("#issueRows tr[data-id]").first().getAttribute("data-id");
  await page.locator(`#issueRows tr[data-id="${requestId}"]`).click();
  await page.locator("#crossReferenceUrlInput").fill("https://columbusoh.oneviewcrm.cc/servicerequests/22222222-2222-2222-2222-222222222222");
  await page.locator("#crossReferenceSummaryInput").fill("Spin scooter blocks the ADA curb ramp at the reported intersection.");
  await page.locator("#crossReferenceStatusInput").selectOption("assigned");
  await page.locator("#crossReferenceOperatorInput").selectOption("Spin");
  await page.locator("#crossReferenceConfidenceInput").selectOption("photo-and-text-confirmed");
  await page.locator('#evidenceReviewForm button[type="submit"]').click();
  await page.waitForFunction(async id => {
    const response = await fetch("/api/state");
    const payload = await response.json();
    return payload.state?.issues?.find(issue => issue.id === id)?.crossReferenceUrl?.includes("22222222");
  }, requestId);
  check(true, "Administrator evidence review reaches durable state");
  await page.locator("#teamInput").selectOption("Central response");
  await page.locator("#statusInput").selectOption("assigned");
  await page.locator("#notesInput").fill("Durable acceptance field note.");
  await page.locator("#issueUpdateForm button[type='submit']").click();

  await page.waitForFunction(async id => {
    const response = await fetch("/api/state");
    const payload = await response.json();
    return payload.state?.issues?.find(issue => issue.id === id)?.notes === "Durable acceptance field note.";
  }, requestId);
  check(true, "request update reaches durable state");

  await page.locator('[data-view="activity"]').click();
  const workflowBoundary = await page.locator("#workflowRunList").innerText();
  check(
    workflowBoundary.includes("Scheduler disabled") && workflowBoundary.includes("City 311 sync disabled"),
    "scheduler and City source-sync activation boundaries are visible"
  );
  await page.locator("#runWorkflows").click();
  await page.waitForFunction(() => document.querySelectorAll(".workflow-run").length >= 2);
  const workflowText = await page.locator("#workflowRunList").innerText();
  check(workflowText.includes("Daily Brief") && workflowText.includes("Alert Evaluation"), "manual verification records both server workflows");
  const workflowPayload = await page.evaluate(async () => (await fetch("/api/workflows")).json());
  check(workflowPayload.runs.length === 2 && workflowPayload.runs.every(run => run.status === "success"), "workflow API exposes recent successful runs");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.getElementById("roleSelect")?.disabled);
  await page.locator(`#issueRows tr[data-id="${requestId}"]`).click();
  check(await page.locator("#notesInput").inputValue() === "Durable acceptance field note.", "durable request update survives reload");
  check(await page.locator("#crossReferenceSummaryInput").inputValue() === "Spin scooter blocks the ADA curb ramp at the reported intersection.", "verified cross-reference evidence survives reload");
  check((await page.locator(".request-history").innerText()).includes("State Replaced") && (await page.locator(".request-history").innerText()).includes("crossReferenceUrl"), "request detail reconstructs durable field-level history");

  const audit = await page.evaluate(async () => (await fetch("/api/audit")).json());
  check(audit.entries.length >= 2, "server audit records bootstrap and update");
  check(audit.entries.every(entry => entry.actor === "admin"), "server audit attributes authenticated identity");
  check(audit.entries.some(entry => entry.detail.includes("crossReferenceUrl")), "server audit names changed evidence fields without copying their values");
  check(pageErrors.length === 0, "durable browser run has no JavaScript errors");
  await context.close();
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
