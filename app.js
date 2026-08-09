import { PileupDashboard } from './pileup-dashboard.js';

const STORAGE_KEY = "311-field-intelligence-trial-v1";
const ROLE_KEY = "311-field-intelligence-trial-role";
const SECTION_VIEW_KEY = "311-field-intelligence-section-views-v1";
const SECTION_VIEW_EVENTS_KEY = "311-field-intelligence-section-view-events-v1";
const MAP_RECENT_ADDRESSES_KEY = "311-field-intelligence-map-recent-addresses-v1";
const MAP_RECENT_ADDRESSES_LIMIT = 4;
const requestEvidenceOverrides = {
  "CAS-3085935-H5M2M1": {
    description: "Spin scooter blocking ADA accessibility on the sidewalk at 4th Avenue and 4th Street; a second improperly parked scooter was reported at 4th Street and 5th Avenue.",
    officialStatus: "assigned",
    accessibilityEvidence: "photo_inconclusive",
    evidence: "User-verified public OneView request detail; personal names and correspondence references were intentionally omitted.",
    sourceUrl: "https://columbusoh.oneviewcrm.cc/servicerequests/84b19b9a-2886-f111-a86d-000d3adc4910"
  }
};
const operatorEvidenceOverrides = {
  "CAS-3085935-H5M2M1": {
    operator: "Spin",
    confidence: "photo-and-text-confirmed",
    evidence: "The official OneView narrative explicitly identifies Spin, and user-reviewed request photographs show an orange Spin device.",
    sourceUrl: "https://columbusoh.oneviewcrm.cc/servicerequests/84b19b9a-2886-f111-a86d-000d3adc4910"
  },
  "CAS-3080008-R7Z5H2": {
    operator: "Veo",
    confidence: "photo-confirmed",
    evidence: "User-verified teal Veo vehicle visible in the official request photograph.",
    sourceUrl: "https://columbusoh.oneviewcrm.cc/servicerequests/2523ba1f-df82-f111-a86d-000d3adc4910"
  },
  "CAS-3079843-Q2Y0Q4": {
    operator: "Spin",
    confidence: "photo-confirmed",
    evidence: "User-verified orange Spin vehicles visible in the official request photograph.",
    sourceUrl: "https://columbusoh.oneviewcrm.cc/servicerequests/b7aa8749-a282-f111-a86d-000d3adc4910"
  }
};

const initialState = {
  issues: [
    { id: "CAS-3085935-H5M2M1", type: "ADA ramp", descriptor: "Shared electric bike blocking curb ramp", address: "1485 N High St", zone: "University District", operator: "unknown", reportedAt: "2026-07-23T01:12:00Z", status: "received", priority: "critical", team: "", notes: "", lat: 40.0122, lng: -83.0101 },
    { id: "CAS-3085657-R4J3G9", type: "Sidewalk block", descriptor: "Scooters across pedestrian path", address: "1317 E Weber Rd", zone: "North Linden", operator: "unknown", reportedAt: "2026-07-22T20:41:44Z", status: "received", priority: "high", team: "", notes: "", lat: 40.0231, lng: -82.9765 },
    { id: "CAS-3085543-X4L9D8", type: "Sidewalk block", descriptor: "Vehicle left across sidewalk", address: "539 Olentangy St", zone: "Clintonville", operator: "Veo", reportedAt: "2026-07-22T19:51:11Z", status: "assigned", priority: "high", team: "North response", notes: "Confirm operator pickup window.", lat: 40.0204, lng: -82.9979 },
    { id: "CAS-3084355-W6D4C7", type: "Sidewalk block", descriptor: "Multiple scooters near bus stop", address: "W Broad St & N Warren Ave", zone: "Greater Hilltop", operator: "Spin", reportedAt: "2026-07-22T12:24:50Z", status: "in_progress", priority: "high", team: "West response", notes: "Field verification requested.", lat: 39.9550, lng: -83.0716 },
    { id: "CAS-3083605-R6C1M7", type: "Business entrance", descriptor: "Scooter blocking accessible entrance", address: "32 E Gay St", zone: "Downtown", operator: "Veo", reportedAt: "2026-07-21T21:15:00Z", status: "received", priority: "critical", team: "", notes: "", lat: 39.9641, lng: -82.9988 },
    { id: "CAS-3083237-J3H2W3", type: "Pile-up", descriptor: "Six scooters clustered at corner", address: "401 N High St", zone: "Downtown", operator: "Spin", reportedAt: "2026-07-21T16:40:00Z", status: "assigned", priority: "high", team: "Central response", notes: "", lat: 39.9706, lng: -83.0022 },
    { id: "CAS-3083190-N0R8Q5", type: "Abandoned", descriptor: "Damaged vehicle in tree lawn", address: "850 Parsons Ave", zone: "South Side", operator: "unknown", reportedAt: "2026-07-21T14:08:00Z", status: "received", priority: "standard", team: "", notes: "", lat: 39.9437, lng: -82.9830 },
    { id: "CAS-3082644-P9D1M0", type: "No-ride zone", descriptor: "Repeated riding through pedestrian plaza", address: "15 E State St", zone: "Downtown", operator: "unknown", reportedAt: "2026-07-21T08:12:00Z", status: "in_progress", priority: "standard", team: "Central response", notes: "Review geofence boundary.", lat: 39.9602, lng: -82.9991 },
    { id: "CAS-3080338-F7J6S3", type: "ADA ramp", descriptor: "Vehicle blocking curb cut", address: "1100 N High St", zone: "University District", operator: "Spin", reportedAt: "2026-07-19T17:42:00Z", status: "resolved", priority: "critical", team: "Central response", notes: "Removed and operator notified.", lat: 39.9852, lng: -83.0054 },
    { id: "CAS-3080336-R3K9V6", type: "ADA ramp", descriptor: "Two vehicles across tactile pad", address: "1295 N High St", zone: "University District", operator: "Veo", reportedAt: "2026-07-19T16:11:00Z", status: "resolved", priority: "critical", team: "Central response", notes: "Cleared within 45 minutes.", lat: 39.9927, lng: -83.0066 },
    { id: "CAS-3080271-C9W2L2", type: "Sidewalk block", descriptor: "Scooter obstructing narrow sidewalk", address: "660 Neil Ave", zone: "Harrison West", operator: "unknown", reportedAt: "2026-07-19T14:05:00Z", status: "resolved", priority: "standard", team: "Central response", notes: "", lat: 39.9767, lng: -83.0145 },
    { id: "CAS-3080114-R7B8P3", type: "Pile-up", descriptor: "Vehicles clustered outside venue", address: "405 Neil Ave", zone: "Arena District", operator: "Spin", reportedAt: "2026-07-19T09:20:00Z", status: "resolved", priority: "high", team: "Central response", notes: "", lat: 39.9698, lng: -83.0087 }
  ],
  interventions: [
    { id: "INT-001", zone: "University District", strategy: "Targeted ramp patrol", rationale: "Three ADA-ramp reports within the trial period, including two resolved cases along the same corridor.", status: "recommended", team: "Central response", createdAt: "2026-07-23T12:00:00Z" },
    { id: "INT-002", zone: "Downtown", strategy: "Operator redistribution", rationale: "Three active complaint types in a compact area indicate a collection and parking-management need.", status: "approved", team: "Central response", createdAt: "2026-07-23T12:20:00Z" }
  ],
  outcomes: [
    { id: "OUT-001", interventionId: "INT-000", zone: "Clintonville", strategy: "Operator pickup window", baseline: 5, post: 2, baselineWindow: "July 8–14", postWindow: "July 15–21", label: "reduced" }
  ],
  alertSubscriptions: [
    { id: "SUB-001", severity: "critical", zone: "all", enabled: true, createdAt: "2026-07-23T12:00:00Z" }
  ],
  alertDeliveries: [],
  importReview: [],
  auditLog: []
};

const teams = ["", "Central response", "North response", "West response", "South response"];
let state = loadState();
let selectedIssueId = null;
let currentRole = localStorage.getItem(ROLE_KEY) || "admin";
let durableSession = {
  available: false,
  authenticated: false,
  username: "",
  role: "",
  csrf: "",
  version: 0
};
let durableSaveQueue = Promise.resolve();
let vehicleState = { vehicles: [], snapshotId: "", sourceFile: "", pileups: [], watchHistory: [] };
let operationalMap = null;
let operationalMapLayers = null;
let operationalMapHasFit = false;
let operationalMapSearchLayer = null;
let operationalMapInterventionRenderer = null;
let mapRecentAddresses = loadMapRecentAddresses();
const completionNoteDrafts = new Map();
let slaEvidenceState = { records: [], status: "unavailable" };
let historicalState = { records: [], status: "loading" };
let eventState = { events: [], venue: null, source: null, status: "loading" };
let forecastState = {
  schema_version: 1,
  status: "loading",
  forecast: null,
  history: [],
  event_comparisons: []
};
let vehicleTraceState = { status: "loading", traces: [], method: null };
let populusState = {
  status: "loading",
  idle_review_threshold_minutes: 120,
  observations: []
};
let workflowState = { enabled: false, citySyncEnabled: false, intervalSeconds: 0, runs: [], deliveryCount: 0, status: "unavailable" };
let policyBoundaryState = { boundaries: [], complaints: [], summary: null, source: null, method: null, status: "loading" };
let siteMetricsState = {
  ga4: { measurement_id: "G-V40E4MZEMV", status: "reporting_api_not_connected" },
  uptime: { status: "current_reachability_only" }
};
let base44ArtifactState = null;
let currentReachability = null;
const dataFeedUpdates = new Map();
const vehicleWatchLocations = [
  {
    id: "WATCH-GOODALE-OLENTANGY",
    name: "Goodale Street & Olentangy River Road",
    lat: 39.9744,
    lng: -83.0260,
    radius: 250,
    context: "Event-linked hypothesis: reported recurring post–Columbus Crew match staging and dumping area.",
    comparison: "Compare pre-event, 0–2 hour immediate, 2–6 hour recovery, next-morning, and non-event snapshots."
  }
];

const appState = {
  selectedPileup: null
};

let pileupDashboard = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.issues) return structuredClone(initialState);
    saved.auditLog ||= [];
    saved.interventions ||= [];
    saved.outcomes ||= [];
    saved.alertSubscriptions ||= structuredClone(initialState.alertSubscriptions);
    saved.alertDeliveries ||= [];
    return saved;
  } catch {
    return structuredClone(initialState);
  }
}

function loadMapRecentAddresses() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_RECENT_ADDRESSES_KEY));
    return Array.isArray(saved)
      ? saved
        .filter(address => typeof address === "string" && address.trim())
        .map(address => address.trim().slice(0, 160))
        .slice(0, MAP_RECENT_ADDRESSES_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function rememberMapAddress(address) {
  const normalizedAddress = address.trim();
  mapRecentAddresses = [
    normalizedAddress,
    ...mapRecentAddresses.filter(saved => saved.toLowerCase() !== normalizedAddress.toLowerCase())
  ].slice(0, MAP_RECENT_ADDRESSES_LIMIT);
  try {
    localStorage.setItem(MAP_RECENT_ADDRESSES_KEY, JSON.stringify(mapRecentAddresses));
  } catch {
    // Address search remains available when browser storage is restricted.
  }
  renderMapRecentAddresses();
}

function renderMapRecentAddresses() {
  const container = document.getElementById("mapSavedAddresses");
  const clearButton = document.getElementById("mapClearAddresses");
  if (!container || !clearButton) return;
  container.innerHTML = mapRecentAddresses.length
    ? mapRecentAddresses.map(address => `<button class="map-address-chip" type="button" data-map-address="${escapeHtml(address)}">${escapeHtml(address)}</button>`).join("")
    : `<span class="map-address-empty">Successful searches appear here.</span>`;
  clearButton.hidden = !mapRecentAddresses.length;
}

function roleAllows(required) {
  const rank = { viewer: 0, operator: 1, admin: 2 };
  return rank[currentRole] >= rank[required];
}

function requireRole(required, action) {
  if (roleAllows(required)) return true;
  const direction = durableSession.authenticated
    ? `An authenticated ${label(required)} is required.`
    : `Switch the trial role to ${label(required)} or higher.`;
  showNotice(`${label(currentRole)} role cannot ${action}. ${direction}`, "error");
  return false;
}

function recordAudit(action, target, detail = "") {
  state.auditLog ||= [];
  state.auditLog.push({
    id: `AUD-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actor: durableSession.authenticated ? durableSession.username : `local-${currentRole}`,
    role: currentRole,
    action,
    target,
    detail
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (durableSession.authenticated && roleAllows("operator")) {
    durableSaveQueue = durableSaveQueue
      .then(writeDurableState)
      .catch(error => {
        console.error("Durable state save failed.", error);
        showNotice(`Durable save failed: ${error.message}`, "error");
      });
  }
}

async function apiJson(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (options.csrf && durableSession.csrf) headers["X-CSRF-Token"] = durableSession.csrf;
  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error("Durable service is unavailable.");
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || `Service request failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function serverAuditEntries(entries = []) {
  return entries.map(entry => ({
    id: `SERVER-AUD-${entry.sequence}`,
    at: entry.at,
    actor: entry.actor,
    role: entry.role,
    action: entry.action,
    target: entry.target,
    detail: entry.detail
  }));
}

async function writeDurableState() {
  try {
    const result = await apiJson("/api/state", {
      method: "PUT",
      csrf: true,
      body: { version: durableSession.version, state }
    });
    durableSession.version = result.version;
  } catch (error) {
    if (error.status === 409 && Number.isInteger(error.payload?.version)) {
      durableSession.version = error.payload.version;
      throw new Error("another session changed the workflow; reload before saving again");
    }
    throw error;
  }
}

async function loadDurableState() {
  const [workflow, audit, workflows] = await Promise.all([
    apiJson("/api/state"),
    apiJson("/api/audit"),
    apiJson("/api/workflows")
  ]);
  workflowState = {
    enabled: workflows.enabled,
    citySyncEnabled: workflows.city_sync_enabled,
    intervalSeconds: workflows.interval_seconds,
    runs: workflows.runs || [],
    deliveryCount: workflows.delivery_count || 0,
    status: "available"
  };
  durableSession.version = workflow.version;
  if (workflow.state?.issues) {
    state = {
      ...workflow.state,
      auditLog: serverAuditEntries(audit.entries)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else if (roleAllows("operator")) {
    await writeDurableState();
  }
}

function renderDurableMode() {
  const roleSelect = document.getElementById("roleSelect");
  const authButton = document.getElementById("authButton");
  const roleLabel = document.getElementById("roleControlLabel");
  const persistenceNote = document.getElementById("persistenceNote");
  const activityNote = document.getElementById("activityStorageNote");
  authButton.hidden = !durableSession.available;
  document.getElementById("workflowMonitor").hidden = !durableSession.authenticated;
  roleSelect.disabled = durableSession.authenticated;
  roleLabel.textContent = durableSession.authenticated ? "Authenticated role" : "Trial role";
  authButton.textContent = durableSession.authenticated
    ? `Sign out ${durableSession.username}`
    : "Sign in";
  if (durableSession.authenticated) {
    persistenceNote.textContent = `Workflow changes are versioned in SQLite as ${durableSession.username}; the Base44 source snapshot remains read-only.`;
    activityNote.textContent = "Server-side audit entries are append-only and attributed to authenticated identities.";
  } else {
    persistenceNote.textContent = "Source snapshot is read-only; assignments and notes stay in this browser.";
    activityNote.textContent = "Append-only within this browser trial. Sign in through the durable local service for server-enforced storage.";
  }
}

async function initializeDurableMode() {
  try {
    const session = await apiJson("/api/session");
    durableSession.available = true;
    if (session.authenticated) {
      durableSession = {
        ...durableSession,
        authenticated: true,
        username: session.username,
        role: session.role,
        csrf: session.csrf
      };
      currentRole = session.role;
      localStorage.setItem(ROLE_KEY, currentRole);
      await loadDurableState();
      if (typeof window.posthog !== "undefined") {
        window.posthog.identify(session.username, { role: session.role });
      }
    }
  } catch {
    durableSession.available = false;
  }
  document.getElementById("roleSelect").value = currentRole;
  renderDurableMode();
}

async function submitAuth(event) {
  event.preventDefault();
  const error = document.getElementById("authError");
  error.textContent = "";
  try {
    const session = await apiJson("/api/login", {
      method: "POST",
      body: {
        username: document.getElementById("authUsername").value.trim(),
        password: document.getElementById("authPassword").value
      }
    });
    durableSession = {
      available: true,
      authenticated: true,
      username: session.username,
      role: session.role,
      csrf: session.csrf,
      version: 0
    };
    currentRole = session.role;
    localStorage.setItem(ROLE_KEY, currentRole);
    await loadDurableState();
    document.getElementById("authDialog").close();
    document.getElementById("authForm").reset();
    document.getElementById("roleSelect").value = currentRole;
    renderDurableMode();
    renderAll();
    if (typeof window.posthog !== "undefined") {
      window.posthog.identify(session.username, { role: session.role });
      window.posthog.capture("user_signed_in", { role: session.role });
    }
    showNotice(`Signed in as ${session.username}. Durable workflow storage is active.`, "success");
  } catch (authError) {
    error.textContent = authError.message;
  }
}

async function signOutDurableMode() {
  await apiJson("/api/logout", { method: "POST", csrf: true, body: {} });
  durableSession = {
    available: true,
    authenticated: false,
    username: "",
    role: "",
    csrf: "",
    version: 0
  };
  workflowState = { enabled: false, citySyncEnabled: false, intervalSeconds: 0, runs: [], deliveryCount: 0, status: "unavailable" };
  currentRole = "viewer";
  localStorage.setItem(ROLE_KEY, currentRole);
  document.getElementById("roleSelect").value = currentRole;
  renderDurableMode();
  renderAll();
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("user_signed_out");
    window.posthog.reset();
  }
  showNotice("Signed out. Durable records remain on the server; local trial controls are available in Viewer mode.");
}

async function runServerWorkflows() {
  if (!requireRole("admin", "run server workflows")) return;
  try {
    await durableSaveQueue;
    const result = await apiJson("/api/workflows/run", {
      method: "POST",
      csrf: true,
      body: {}
    });
    await loadDurableState();
    renderAll();
    showNotice(`Server workflows completed with status ${result.status}.`, result.status === "success" ? "success" : "");
  } catch (error) {
    showNotice(`Workflow run failed: ${error.message}`, "error");
  }
}

function showNotice(message, tone = "") {
  const notice = document.getElementById("dataNotice");
  notice.textContent = message;
  notice.className = `data-notice visible ${tone}`.trim();
  window.clearTimeout(showNotice.timeout);
  showNotice.timeout = window.setTimeout(() => {
    notice.className = "data-notice";
  }, 8000);
}

function parseFeedTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const epoch = new Date(value);
    return Number.isNaN(epoch.getTime()) ? null : epoch;
  }
  const snapshotMatch = String(value).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  const parsed = snapshotMatch
    ? new Date(Date.UTC(
      Number(snapshotMatch[1]),
      Number(snapshotMatch[2]) - 1,
      Number(snapshotMatch[3]),
      Number(snapshotMatch[4]),
      Number(snapshotMatch[5]),
      Number(snapshotMatch[6])
    ))
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function recordDataFeedUpdate(id, labelText, updatedAt, detail = "", status = "loaded") {
  dataFeedUpdates.set(id, {
    id,
    label: labelText,
    updatedAt: parseFeedTimestamp(updatedAt),
    detail,
    status
  });
  renderDataFeedUpdates();
}

function renderDataFeedUpdates() {
  const status = document.getElementById("dataFeedStatus");
  const time = document.getElementById("dataFeedUpdatedAt");
  const list = document.getElementById("dataFeedUpdateList");
  if (!status || !time || !list) return;
  const feeds = [...dataFeedUpdates.values()].toSorted((a, b) => {
    if (a.updatedAt && b.updatedAt) return b.updatedAt - a.updatedAt;
    if (a.updatedAt) return -1;
    if (b.updatedAt) return 1;
    return a.label.localeCompare(b.label);
  });
  const latest = feeds.find(feed => feed.updatedAt);
  if (latest) {
    time.dateTime = latest.updatedAt.toISOString();
    time.textContent = latest.updatedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    status.title = `${feeds.length} data feeds checked · latest update from ${latest.label} at ${latest.updatedAt.toLocaleString()}`;
  } else {
    time.textContent = feeds.length ? "Timestamps unavailable" : "Loading…";
    time.removeAttribute("datetime");
    status.title = feeds.length ? `${feeds.length} data feeds checked; no source supplied a valid update timestamp.` : "Data feeds are loading.";
  }
  list.innerHTML = feeds.length
    ? feeds.map(feed => `<article class="data-feed-update${feed.status === "unavailable" ? " is-unavailable" : ""}">
        <strong>${escapeHtml(feed.label)}</strong>
        ${feed.updatedAt
          ? `<time datetime="${feed.updatedAt.toISOString()}">${feed.updatedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>`
          : `<span class="feed-time-unavailable">${feed.status === "unavailable" ? "Unavailable" : "No timestamp"}</span>`}
        <p>${escapeHtml(feed.detail || (feed.status === "unavailable" ? "Feed could not be loaded." : "Feed loaded; the source did not provide an update timestamp."))}</p>
      </article>`).join("")
    : `<article class="data-feed-update is-unavailable"><strong>Loading data feeds</strong><span class="feed-time-unavailable">In progress</span><p>Update details will appear as each source responds.</p></article>`;
}

function normalizedPriority(record) {
  if (["critical", "high", "standard"].includes(record.priority)) return record.priority;
  if (/ada ramp|entrance/i.test(record.complaint_type || record.type || "")) return "critical";
  if (/ada concern|pile|sidewalk/i.test(record.complaint_type || record.type || "")) return "high";
  return "standard";
}

function priorityWithConfidenceAdjustment(issue) {
  const basePriority = issue.priority || "standard";
  const priorityRank = { critical: 3, high: 2, standard: 1 };
  let adjustedRank = priorityRank[basePriority] || 1;

  if (issue.pileup_related) adjustedRank = Math.min(adjustedRank + 1, 3);
  if (issue.operatorConfidence === "vehicle-proximity-match" && issue.operator !== "unknown") adjustedRank = Math.min(adjustedRank + 0.5, 3);

  const rankMap = { 3: "critical", 2: "high", 1: "standard" };
  return rankMap[Math.min(Math.ceil(adjustedRank), 3)];
}

function sourceNarrative(record) {
  const description = String(record.description || "").trim();
  if (description) return description;
  const descriptor = String(record.descriptor || "").trim();
  return /^shared electric bike\s*&\s*scooters$/i.test(descriptor) ? "" : descriptor;
}

function classifyComplaint(record, accessibilityEvidence = "not_assessed") {
  const narrative = sourceNarrative(record);
  const accessibilityPattern = /\b(ada|wheelchair|curb (?:cut|ramp)|accessibility|tactile)\b/i;
  if ((narrative && accessibilityPattern.test(narrative)) || accessibilityEvidence === "photo_supporting") {
    if (accessibilityEvidence === "photo_supporting") {
      return {
        type: "ADA ramp",
        confidence: "visually-confirmed",
        evidence: "A reviewer recorded visual evidence supporting an obstructed accessible path or curb ramp."
      };
    }
    const evidenceBoundary = {
      no_photo: "No request photograph was available for visual confirmation.",
      photo_inconclusive: "A photograph was reviewed, but it does not conclusively establish blocked accessible clearance.",
      photo_not_supporting: "A photograph was reviewed and does not visually support the reported accessibility obstruction.",
      not_assessed: "Visual evidence has not been assessed."
    }[accessibilityEvidence] || "Visual evidence has not been assessed.";
    return {
      type: "ADA concern",
      confidence: "reported-claim",
      evidence: `The supplied narrative alleges an accessibility obstruction. ${evidenceBoundary} Treat this as a reported concern, not a confirmed ADA violation.`
    };
  }
  const rules = [
    { type: "Business entrance", pattern: /\b(entrance|doorway|driveway|exit)\b/i, rule: "entrance or driveway keyword" },
    { type: "Pile-up", pattern: /\b(pile[\s-]?up|cluster|stack(?:ed|ing)?|multiple|several|group of)\b/i, rule: "multi-vehicle concentration keyword" },
    { type: "Abandoned", pattern: /\b(abandon(?:ed)?|damaged|broken|discarded)\b/i, rule: "abandoned or damaged-device keyword" },
    { type: "No-ride zone", pattern: /\b(no[\s-]?ride|geofence|riding through|pedestrian plaza)\b/i, rule: "riding or geofence keyword" },
    { type: "Sidewalk block", pattern: /\b(sidewalk|pedestrian path|walkway|blocking|obstruct(?:ed|ion|ing)?)\b/i, rule: "pedestrian-path obstruction keyword" }
  ];
  const match = narrative ? rules.find(rule => rule.pattern.test(narrative)) : null;
  if (match) {
    return {
      type: match.type,
      confidence: "rule-matched",
      evidence: `Matched ${match.rule} in the supplied narrative.`
    };
  }
  const sourceType = String(record.complaint_type || record.type || "other");
  return {
    type: label(sourceType),
    confidence: "source-label",
    evidence: narrative
      ? `No classification keyword matched; retained source label “${label(sourceType)}”.`
      : `Retained source label “${label(sourceType)}”; the export contains no complaint narrative to classify.`
  };
}

function attributeOperator(record, sourceId) {
  const override = operatorEvidenceOverrides[sourceId];
  if (override) return override;
  const sourceOperator = String(record.operator || "").trim();
  if (/^(veo|spin)$/i.test(sourceOperator)) {
    const operator = sourceOperator.toLowerCase() === "veo" ? "Veo" : "Spin";
    return {
      operator,
      confidence: "source-provided",
      evidence: `The source record identifies ${operator}.`,
      sourceUrl: ""
    };
  }
  const narrative = sourceNarrative(record);
  const mentionsVeo = /\bveo\b/i.test(narrative);
  const mentionsSpin = /\bspin\b/i.test(narrative);
  if (mentionsVeo !== mentionsSpin) {
    const operator = mentionsVeo ? "Veo" : "Spin";
    return {
      operator,
      confidence: "description-keyword",
      evidence: `The supplied narrative explicitly names ${operator}; field or photo verification is still recommended.`,
      sourceUrl: ""
    };
  }
  return {
    operator: "unknown",
    confidence: mentionsVeo && mentionsSpin ? "ambiguous" : "unattributed",
    evidence: mentionsVeo && mentionsSpin
      ? "The narrative names both vendors, so no single operator was assigned."
      : "Neither the source operator field nor the supplied narrative identifies a vendor.",
    sourceUrl: ""
  };
}

function normalizeImportedIssue(record) {
  if (importRecordProblems(record).length) return null;
  const sourceId = record.source_id || record.id;
  const reportedAt = record.reported_at || record.reportedAt;
  const latitude = Number(record.latitude ?? record.lat);
  const longitude = Number(record.longitude ?? record.lng);
  const rawStatus = record.status || "received";
  const status = ["received", "assigned", "in_progress", "resolved"].includes(rawStatus)
    ? rawStatus
    : rawStatus === "closed" ? "resolved" : "received";
  const requestEvidence = requestEvidenceOverrides[sourceId];
  const effectiveRecord = requestEvidence
    ? { ...record, description: requestEvidence.description }
    : record;
  const accessibilityEvidence = requestEvidence?.accessibilityEvidence || "not_assessed";
  const classification = classifyComplaint(effectiveRecord, accessibilityEvidence);
  const operatorEvidence = attributeOperator(effectiveRecord, sourceId);
  return {
    id: String(sourceId),
    type: classification.type,
    classificationConfidence: classification.confidence,
    classificationEvidence: classification.evidence,
    descriptor: String(requestEvidence?.description || record.descriptor || record.description || "No source description supplied"),
    address: String(record.address),
    zone: String(record.zone_id || record.zone || "Unassigned zone").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()),
    operator: operatorEvidence.operator,
    operatorConfidence: operatorEvidence.confidence,
    operatorEvidence: operatorEvidence.evidence,
    sourceUrl: requestEvidence?.sourceUrl || operatorEvidence.sourceUrl || "",
    crossReferenceUrl: requestEvidence?.sourceUrl || operatorEvidence.sourceUrl || "",
    crossReferencePhotoUrls: Array.isArray(record.crossReferencePhotoUrls) ? record.crossReferencePhotoUrls : [],
    crossReferenceSummary: requestEvidence?.description || "",
    crossReferenceStatus: requestEvidence?.officialStatus || "",
    crossReferenceEvidence: requestEvidence?.evidence || "",
    accessibilityEvidence,
    accessibilityChallengeStatus: "no_challenge",
    accessibilityChallengeNote: "",
    reportedAt: new Date(reportedAt).toISOString(),
    status,
    priority: normalizedPriority({ ...record, complaint_type: classification.type }),
    team: String(record.team || record.assigned_team || ""),
    notes: String(record.notes || ""),
    lat: latitude,
    lng: longitude
  };
}

function importRecordProblems(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return ["record is not an object"];
  const problems = [];
  const sourceId = String(record.source_id || record.id || "").trim();
  const address = String(record.address || "").trim();
  const reportedAt = record.reported_at || record.reportedAt;
  const latitude = Number(record.latitude ?? record.lat);
  const longitude = Number(record.longitude ?? record.lng);
  if (!sourceId) problems.push("source_id is required");
  if (!address) problems.push("address is required");
  if (!reportedAt || !Number.isFinite(new Date(reportedAt).getTime())) problems.push("reported time is missing or invalid");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) problems.push("latitude is missing or invalid");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) problems.push("longitude is missing or invalid");
  return problems;
}

async function importJsonFile(file) {
  if (!requireRole("operator", "import source records")) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    showNotice("Import failed: the selected file is not valid JSON.", "error");
    return;
  }
  const records = Array.isArray(parsed) ? parsed : parsed.entities || parsed.records || parsed.issues;
  if (!Array.isArray(records)) {
    showNotice("Import failed: expected an array, or an object containing entities, records, or issues.", "error");
    return;
  }
  const reviewedAt = new Date().toISOString();
  const rejectedRecords = records.flatMap((record, index) => {
    const problems = importRecordProblems(record);
    if (!problems.length) return [];
    return [{
      id: crypto.randomUUID(),
      sourceId: String(record?.source_id || record?.id || `Row ${index + 1}`),
      reasons: problems,
      fileName: file.name,
      reviewedAt
    }];
  });
  state.importReview ||= [];
  state.importReview.push(...rejectedRecords);
  state.importReview = state.importReview.slice(-100);
  const normalized = records.map(normalizeImportedIssue);
  const rejected = normalized.filter(record => !record).length;
  const valid = normalized.filter(Boolean);
  const existingIds = new Set(state.issues.map(issue => issue.id));
  const unique = valid.filter(issue => !existingIds.has(issue.id));
  state.issues.push(...unique);
  if (unique.length || rejected) recordAudit("records_imported", file.name, `${unique.length} added; ${valid.length - unique.length} duplicates; ${rejected} sent to review`);
  saveState();
  renderAll();
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("records_imported", {
      records_added: unique.length,
      records_duplicate: valid.length - unique.length,
      records_rejected: rejected,
    });
  }
  showNotice(
    `Imported ${unique.length} new request${unique.length === 1 ? "" : "s"}; ${valid.length - unique.length} duplicate${valid.length - unique.length === 1 ? "" : "s"} skipped; ${rejected} invalid record${rejected === 1 ? "" : "s"} sent to review.`,
    rejected ? "" : "success"
  );
}

async function hydrateFromVerifiedSnapshot() {
  try {
    const response = await fetch("base44-live-snapshot.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Snapshot request failed with ${response.status}`);
    const snapshot = await response.json();
    const records = Array.isArray(snapshot.entities) ? snapshot.entities : [];
    const normalized = records.map(normalizeImportedIssue).filter(Boolean);
    if (!normalized.length) throw new Error("Snapshot contains no valid records");
    const preserveVerifiedEdits = Boolean(state.snapshotExportedAt);
    const existingById = preserveVerifiedEdits
      ? new Map(state.issues.map(issue => [issue.id, issue]))
      : new Map();
    state.issues = normalized.map(issue => {
      const existing = existingById.get(issue.id);
      if (!existing) return issue;
      const localStatus = ["assigned", "in_progress", "resolved"].includes(existing.status)
        ? existing.status
        : issue.status;
      const verifiedEvidence = existing.crossReferenceUrl ? {
        type: existing.type,
        classificationConfidence: existing.classificationConfidence,
        classificationEvidence: existing.classificationEvidence,
        descriptor: existing.descriptor,
        priority: existing.priority,
        operator: existing.operator,
        operatorConfidence: existing.operatorConfidence,
        operatorEvidence: existing.operatorEvidence,
        sourceUrl: existing.sourceUrl,
        crossReferenceUrl: existing.crossReferenceUrl,
        crossReferenceSummary: existing.crossReferenceSummary,
        crossReferenceStatus: existing.crossReferenceStatus,
        crossReferenceEvidence: existing.crossReferenceEvidence,
        accessibilityEvidence: existing.accessibilityEvidence,
        accessibilityChallengeStatus: existing.accessibilityChallengeStatus,
        accessibilityChallengeNote: existing.accessibilityChallengeNote
      } : {};
      return {
        ...issue,
        ...verifiedEvidence,
        status: localStatus,
        team: existing.team || "",
        notes: existing.notes || ""
      };
    });
    state.snapshotExportedAt = snapshot.exported_at || "";
    state.base44SnapshotCount = normalized.length;
    recordDataFeedUpdate("base44-complaints", "Base44 complaint snapshot", snapshot.exported_at, `${normalized.length.toLocaleString()} complaint records loaded`);
    saveState();
    const mode = document.getElementById("dataMode");
    mode.innerHTML = `<span></span> Base44 snapshot · ${state.issues.length}`;
    mode.title = snapshot.exported_at ? `Read-only export created ${new Date(snapshot.exported_at).toLocaleString()}` : "Read-only Base44 export";
    return true;
  } catch (error) {
    console.warn("Verified Base44 snapshot unavailable; using local trial data.", error);
    recordDataFeedUpdate("base44-complaints", "Base44 complaint snapshot", null, error.message, "unavailable");
    return false;
  }
}

async function hydrateFromCityFeed() {
  try {
    const response = await fetch("columbus-311-current.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`City feed request failed with ${response.status}`);
    const feed = await response.json();
    const records = Array.isArray(feed.records) ? feed.records : [];
    if (!records.length) throw new Error("City feed contains no records");
    const existingById = new Map(state.issues.map(issue => [issue.id, issue]));
    let added = 0;
    let refreshed = 0;
    records.forEach(record => {
      const normalized = normalizeImportedIssue(record);
      if (!normalized) return;
      const sourceFields = {
        address: normalized.address,
        zone: normalized.zone,
        reportedAt: normalized.reportedAt,
        lat: normalized.lat,
        lng: normalized.lng,
        sourceStatus: record.source_status || "",
        sourceStatusAt: record.source_status_at || "",
        sourceUpdatedAt: record.source_updated_at || "",
        sourceName: record.source_name || "City of Columbus 311 public map",
        sourceFeedUrl: record.source_url || "https://gis.columbus.gov/coc311map/",
        councilDistrict: record.council_district || "",
        zip: record.zip || ""
      };
      const existing = existingById.get(normalized.id);
      if (existing) {
        Object.assign(existing, sourceFields);
        refreshed += 1;
        return;
      }
      const issue = { ...normalized, ...sourceFields };
      state.issues.push(issue);
      existingById.set(issue.id, issue);
      added += 1;
    });

    enrichComplaintsWithVehicleData(state.issues);

    state.cityFeedFetchedAt = feed.fetched_at || "";
    state.cityFeedRecordCount = records.length;
    state.importReview ||= [];
    state.importReview = state.importReview.filter(
      item => !String(item.id || "").startsWith("city-feed-")
    );
    const feedReview = Array.isArray(feed.review) ? feed.review : [];
    feedReview.forEach((item, index) => {
      state.importReview.push({
        id: `city-feed-${item.source_id || index}`,
        sourceId: item.source_id || `City feed row ${index + 1}`,
        reasons: item.reasons || ["invalid public-feed record"],
        fileName: "City of Columbus 311 public feed",
        reviewedAt: feed.fetched_at || new Date().toISOString()
      });
    });
    state.importReview = state.importReview.slice(-100);
    saveState();
    const mode = document.getElementById("dataMode");
    mode.innerHTML = `<span></span> City 30-day feed · ${records.length}`;
    mode.title = `${refreshed} preserved Base44 records refreshed; ${added} additional City records added read-only${feed.fetched_at ? ` · fetched ${new Date(feed.fetched_at).toLocaleString()}` : ""}`;
    recordDataFeedUpdate("city-311", "City of Columbus 311", feed.fetched_at, `${records.length.toLocaleString()} current records loaded`);
    return { added, refreshed, total: state.issues.length };
  } catch (error) {
    console.warn("Current Columbus 311 public feed unavailable.", error);
    recordDataFeedUpdate("city-311", "City of Columbus 311", null, error.message, "unavailable");
    return null;
  }
}

function enrichComplaintsWithVehicleData(records) {
  const PROXIMITY_THRESHOLD = 50;
  records.forEach(record => {
    const matches = vehicleState.vehicles
      .map(vehicle => ({
        vehicle,
        distance: distanceMeters(record, vehicle)
      }))
      .filter(item => item.distance <= PROXIMITY_THRESHOLD)
      .toSorted((a, b) => a.distance - b.distance);

    const matchedVendors = [...new Set(matches.map(m => m.vehicle.company))];
    const pileupMatch = vehicleState.pileups.find(pileup =>
      distanceMeters(record, pileup) <= 20
    );

    if (matches.length > 0) {
      const primaryVendor = matches[0].vehicle.company;
      const confidence = matches.length === 1 || matches[0].vehicle.company !== (matches[1]?.vehicle.company)
        ? "vehicle-proximity-match"
        : "vehicle-proximity-ambiguous";

      record.operator = primaryVendor;
      record.operatorConfidence = confidence;
      record.operatorEvidence = `Matched to ${matches.length} vehicle(s) within ${Math.round(matches[0].distance)}m. ${matchedVendors.length > 1 ? `Secondary vendor (${matchedVendors[1]}) also nearby.` : ""}`;
      record.matched_vehicles = matches.slice(0, 5).map(m => ({
        id: m.vehicle.id,
        company: m.vehicle.company,
        distance_meters: Math.round(m.distance),
        type: m.vehicle.type,
        battery: m.vehicle.battery
      }));
    }

    if (pileupMatch) {
      record.pileup_related = true;
      record.nearby_pileup = {
        id: pileupMatch.id,
        distance_meters: Math.round(distanceMeters(record, pileupMatch)),
        vehicle_count: pileupMatch.vehicles.length,
        companies: pileupMatch.companies
      };
    }
  });

  return records;
}

async function hydrateOperationalSources() {
  const snapshotLoaded = await hydrateFromVerifiedSnapshot();
  const cityFeed = await hydrateFromCityFeed();
  return { snapshotLoaded, cityFeed };
}

async function hydrateVehiclePositions() {
  try {
    const [response, historyResponse] = await Promise.all([
      fetch("gbfs-vehicle-positions.json", { cache: "no-store" }),
      fetch("gbfs-watch-history.json", { cache: "no-store" })
    ]);
    if (!response.ok) throw new Error(`GBFS snapshot request failed with ${response.status}`);
    const snapshot = await response.json();
    const historySnapshot = historyResponse.ok ? await historyResponse.json() : { snapshots: [] };
    const vehicles = Array.isArray(snapshot.vehicles)
      ? snapshot.vehicles.filter(vehicle => Number.isFinite(vehicle.lat) && Number.isFinite(vehicle.lng))
      : [];
    if (!vehicles.length) throw new Error("GBFS snapshot contains no valid positions");
    vehicleState = {
      vehicles,
      snapshotId: snapshot.snapshot_id || "",
      sourceFile: snapshot.source_file || "",
      pileups: detectPileups(vehicles),
      watchHistory: Array.isArray(historySnapshot.snapshots) ? historySnapshot.snapshots : []
    };
    recordDataFeedUpdate("gbfs-positions", "GBFS vehicle positions", snapshot.snapshot_id, `${vehicles.length.toLocaleString()} vehicle positions loaded`);
    const latestWatchSnapshot = vehicleState.watchHistory.at(-1);
    recordDataFeedUpdate(
      "gbfs-watch-history",
      "GBFS watch history",
      latestWatchSnapshot?.snapshot_id,
      `${vehicleState.watchHistory.length.toLocaleString()} watch snapshots loaded`
    );
    return true;
  } catch (error) {
    console.warn("GBFS vehicle positions unavailable.", error);
    vehicleState = { vehicles: [], snapshotId: "", sourceFile: "", pileups: [], watchHistory: [] };
    recordDataFeedUpdate("gbfs-positions", "GBFS vehicle positions", null, error.message, "unavailable");
    recordDataFeedUpdate("gbfs-watch-history", "GBFS watch history", null, error.message, "unavailable");
    return false;
  }
}

async function hydrateSlaEvidence() {
  try {
    const response = await fetch("sla-screenshot-evidence.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`SLA evidence request failed with ${response.status}`);
    const evidence = await response.json();
    slaEvidenceState = {
      records: Array.isArray(evidence.records) ? evidence.records : [],
      status: evidence.transcription_status || "provisional"
    };
    recordDataFeedUpdate("sla-evidence", "SLA evidence", evidence.generated_at, `${slaEvidenceState.records.length.toLocaleString()} provisional evidence records loaded`);
  } catch (error) {
    console.warn("Provisional SLA screenshot evidence unavailable.", error);
    slaEvidenceState = { records: [], status: "unavailable" };
    recordDataFeedUpdate("sla-evidence", "SLA evidence", null, error.message, "unavailable");
  }
}

async function hydrateHistorical311() {
  try {
    const response = await fetch("historical-311-safe.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.source?.piiRemoved || !Array.isArray(data.records)) {
      throw new Error("Historical extract did not pass its privacy contract.");
    }
    historicalState = { ...data, status: "verified-safe-extract" };
    recordDataFeedUpdate("historical-311", "Historical 311 extract", data.generated_at, `${data.recordCount.toLocaleString()} privacy-safe records loaded`);
  } catch (error) {
    console.warn("Historical 311 extract unavailable.", error);
    historicalState = { records: [], status: "unavailable" };
    recordDataFeedUpdate("historical-311", "Historical 311 extract", null, error.message, "unavailable");
  }
}

async function hydrateEvents() {
  try {
    const response = await fetch("external-events.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Event dataset request failed with ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.events) || !data.venue || !data.source?.url) {
      throw new Error("Event dataset is missing required provenance or venue fields.");
    }
    eventState = {
      events: data.events,
      venue: data.venue,
      source: data.source,
      status: "verified-schedule"
    };
    recordDataFeedUpdate("events", "External event schedule", data.source.verified_at, `${data.events.length.toLocaleString()} events loaded`);
  } catch (error) {
    console.warn("External event context unavailable.", error);
    eventState = { events: [], venue: null, source: null, status: "unavailable" };
    recordDataFeedUpdate("events", "External event schedule", null, error.message, "unavailable");
  }
}

async function hydrateDailyForecast() {
  try {
    const response = await fetch("daily-forecast.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Forecast request failed with ${response.status}`);
    const data = await response.json();
    if (data?.schema_version !== 1 || !Array.isArray(data.history) || !Array.isArray(data.event_comparisons)) {
      throw new Error("Forecast output does not match schema version 1.");
    }
    forecastState = data;
    recordDataFeedUpdate("daily-forecast", "Daily 311 forecast", data.published_at || data.as_of, data.status === "awaiting_first_forecast" ? "Awaiting the first published forecast" : "Forecast output loaded");
  } catch (error) {
    console.warn("Daily forecast output unavailable.", error);
    forecastState = {
      schema_version: 1,
      status: "unavailable",
      forecast: null,
      history: [],
      event_comparisons: []
    };
    recordDataFeedUpdate("daily-forecast", "Daily 311 forecast", null, error.message, "unavailable");
  }
}

async function hydrateRequestVehicleTraces() {
  try {
    const response = await fetch("request-vehicle-traces.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Vehicle trace request failed with ${response.status}`);
    const data = await response.json();
    if (data?.schema_version !== 1 || !Array.isArray(data.traces)) {
      throw new Error("Vehicle trace output does not match schema version 1.");
    }
    vehicleTraceState = data;
    recordDataFeedUpdate("vehicle-traces", "Request vehicle traces", data.generated_at, `${Number(data.matched_request_count || 0).toLocaleString()} matched requests`);
  } catch (error) {
    console.warn("Request vehicle traces unavailable.", error);
    vehicleTraceState = { status: "unavailable", traces: [], method: null };
    recordDataFeedUpdate("vehicle-traces", "Request vehicle traces", null, error.message, "unavailable");
  }
}

async function hydratePopulusOperations() {
  try {
    const response = await fetch("populus-zone-operations.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Populus context request failed with ${response.status}`);
    const data = await response.json();
    if (data?.schema_version !== 1 || !Array.isArray(data.observations)) {
      throw new Error("Populus context does not match schema version 1.");
    }
    populusState = data;
    recordDataFeedUpdate("populus", "Populus operations", data.generated_at || data.as_of, `${data.observations.length.toLocaleString()} operational observations loaded`);
  } catch (error) {
    console.warn("Populus operational context unavailable.", error);
    populusState = {
      status: "unavailable",
      idle_review_threshold_minutes: 120,
      observations: []
    };
    recordDataFeedUpdate("populus", "Populus operations", null, error.message, "unavailable");
  }
}

async function hydratePolicyBoundaries() {
  try {
    const response = await fetch("mobility-policy-boundaries.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`policy boundary request failed with ${response.status}`);
    const payload = await response.json();
    policyBoundaryState = {
      boundaries: Array.isArray(payload.boundaries) ? payload.boundaries : [],
      complaints: Array.isArray(payload.complaints) ? payload.complaints : [],
      summary: payload.summary || null,
      source: payload.source || null,
      method: payload.method || null,
      status: "ready"
    };
    recordDataFeedUpdate("mobility-policy", "Mobility policy boundaries", payload.generated_at, `${policyBoundaryState.boundaries.length.toLocaleString()} policy boundaries loaded`);
  } catch (error) {
    console.warn("Published mobility-policy boundaries unavailable.", error);
    policyBoundaryState = { boundaries: [], complaints: [], summary: null, source: null, method: null, status: "unavailable" };
    recordDataFeedUpdate("mobility-policy", "Mobility policy boundaries", null, error.message, "unavailable");
  }
}

async function hydratePileupDashboard() {
  try {
    if (!pileupDashboard) {
      pileupDashboard = new PileupDashboard(appState);
    }
    const data = await pileupDashboard.loadPileupData();
    if (data?.summary) {
      recordDataFeedUpdate("pileup-analysis", "Vehicle pileup analysis", data.fetched_at, `${data.summary.total_pileups_detected} pileups detected (${data.summary.active_pileup_count} active)`);
    }
  } catch (error) {
    console.warn("Pileup analysis unavailable.", error);
    recordDataFeedUpdate("pileup-analysis", "Vehicle pileup analysis", null, error.message, "unavailable");
  }
}

function distanceMeters(a, b) {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.hypot((a.lat - b.lat) * latScale, (a.lng - b.lng) * lngScale);
}

function snapshotIdToDate(snapshotId) {
  const match = String(snapshotId || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  return new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6])
  ));
}

function eventContextForTime(value) {
  const time = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(time.getTime())) return null;
  const windows = eventState.events.filter(event => event.start_at && event.expected_end_at).map(event => {
    const start = new Date(event.start_at);
    const end = new Date(event.expected_end_at);
    const hoursFromEnd = (time - end) / 3600000;
    let window = "";
    if (time >= new Date(start.getTime() - 4 * 3600000) && time < start) window = "pre_event";
    else if (time >= start && time <= end) window = "during_event";
    else if (hoursFromEnd > 0 && hoursFromEnd <= 2) window = "immediate_post_event";
    else if (hoursFromEnd > 2 && hoursFromEnd <= 6) window = "recovery_window";
    else if (hoursFromEnd > 6 && hoursFromEnd <= 16) window = "next_morning";
    return window ? { event, window, hoursFromEnd } : null;
  }).filter(Boolean);
  return windows.toSorted((a, b) => Math.abs(a.hoursFromEnd) - Math.abs(b.hoursFromEnd))[0] || null;
}

function eventTimingDescription(context) {
  if (!context) return "outside the documented event windows";
  if (context.window === "during_event") {
    return `${Math.abs(context.hoursFromEnd).toFixed(1)} hours before the estimated match end`;
  }
  if (context.window === "pre_event") {
    return `${Math.abs(context.hoursFromEnd).toFixed(1)} hours before the estimated match end, during the pre-event window`;
  }
  return `${Math.abs(context.hoursFromEnd).toFixed(1)} hours after the estimated match end`;
}

function eventEvidenceForIssue(issue) {
  if (!eventState.venue || !Number.isFinite(issue.lat) || !Number.isFinite(issue.lng)) return null;
  const venueDistance = distanceMeters(issue, eventState.venue);
  if (venueDistance > 1500) return null;
  const context = eventContextForTime(issue.reportedAt);
  return context ? {
    issueId: issue.id,
    eventId: context.event.id,
    eventName: context.event.name,
    window: context.window,
    hoursFromExpectedEnd: Math.round(context.hoursFromEnd * 10) / 10,
    venueDistanceMeters: Math.round(venueDistance)
  } : null;
}

function watchEventAnalysis() {
  const observations = vehicleState.watchHistory.map(snapshot => {
    const observedAt = snapshotIdToDate(snapshot.snapshot_id);
    return { ...snapshot, observedAt, eventContext: observedAt ? eventContextForTime(observedAt) : null };
  });
  const eventLinked = observations.filter(observation => observation.eventContext);
  const baseline = observations.filter(observation => !observation.eventContext);
  const median = values => {
    const ordered = values.toSorted((a, b) => a - b);
    return ordered.length ? ordered[Math.floor(ordered.length / 2)] : null;
  };
  return {
    observations,
    eventLinked,
    baseline,
    eventMedian: median(eventLinked.map(item => item.watch_count)),
    baselineMedian: median(baseline.map(item => item.watch_count)),
    latest: observations.at(-1) || null
  };
}

function detectPileups(vehicles) {
  const radius = 20;
  const cell = 0.00018;
  const buckets = new Map();
  vehicles.forEach((vehicle, index) => {
    const key = `${Math.floor(vehicle.lat / cell)}:${Math.floor(vehicle.lng / cell)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(index);
  });
  const visited = new Set();
  const clusters = [];
  vehicles.forEach((vehicle, index) => {
    if (visited.has(index)) return;
    const queue = [index];
    const members = [];
    visited.add(index);
    while (queue.length) {
      const currentIndex = queue.pop();
      const current = vehicles[currentIndex];
      members.push(current);
      const cellLat = Math.floor(current.lat / cell);
      const cellLng = Math.floor(current.lng / cell);
      for (let y = -1; y <= 1; y += 1) {
        for (let x = -1; x <= 1; x += 1) {
          const neighbors = buckets.get(`${cellLat + y}:${cellLng + x}`) || [];
          neighbors.forEach(neighborIndex => {
            if (!visited.has(neighborIndex) && distanceMeters(current, vehicles[neighborIndex]) <= radius) {
              visited.add(neighborIndex);
              queue.push(neighborIndex);
            }
          });
        }
      }
    }
    const companies = [...new Set(members.map(member => member.company))];
    if (members.length >= 4 && companies.length > 1) {
      clusters.push({
        id: `GBFS-FLAG-${String(clusters.length + 1).padStart(3, "0")}`,
        vehicles: members,
        companies,
        lat: members.reduce((sum, member) => sum + member.lat, 0) / members.length,
        lng: members.reduce((sum, member) => sum + member.lng, 0) / members.length
      });
    }
  });
  return clusters.toSorted((a, b) => b.vehicles.length - a.vehicles.length);
}

function exportTrialData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `311-field-intelligence-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("data_exported", {
      issue_count: state.issues.length,
      intervention_count: state.interventions.length,
    });
  }
}

function defaultIntakeTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function openIntakeDialog() {
  if (!requireRole("operator", "add a request")) return;
  const dialog = document.getElementById("intakeDialog");
  document.getElementById("intakeForm").reset();
  document.getElementById("intakeReportedAt").value = defaultIntakeTime();
  document.getElementById("intakeError").textContent = "";
  dialog.showModal();
  document.getElementById("intakeSourceId").focus();
}

function closeIntakeDialog() {
  document.getElementById("intakeDialog").close();
}

function submitIntake(event) {
  event.preventDefault();
  if (!requireRole("operator", "add a request")) return;
  const error = document.getElementById("intakeError");
  const sourceId = document.getElementById("intakeSourceId").value.trim();
  if (state.issues.some(issue => issue.id.toLowerCase() === sourceId.toLowerCase())) {
    error.textContent = `A request with source ID ${sourceId} already exists.`;
    return;
  }
  const latitude = Number(document.getElementById("intakeLatitude").value);
  const longitude = Number(document.getElementById("intakeLongitude").value);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    error.textContent = "Enter valid latitude and longitude values.";
    return;
  }
  const type = document.getElementById("intakeType").value;
  const issue = {
    id: sourceId,
    type,
    classificationConfidence: "operator-selected",
    classificationEvidence: `Complaint type selected by ${durableSession.authenticated ? durableSession.username : `local-${currentRole}`} during intake.`,
    descriptor: document.getElementById("intakeDescriptor").value.trim() || "No source description supplied",
    address: document.getElementById("intakeAddress").value.trim(),
    zone: document.getElementById("intakeZone").value.trim(),
    operator: document.getElementById("intakeOperator").value,
    operatorConfidence: document.getElementById("intakeOperator").value === "unknown" ? "unattributed" : "operator-selected",
    operatorEvidence: document.getElementById("intakeOperator").value === "unknown"
      ? "No operator was identified during intake."
      : `Operator selected during intake; source or photo verification remains recommended.`,
    accessibilityEvidence: "not_assessed",
    accessibilityChallengeStatus: "no_challenge",
    accessibilityChallengeNote: "",
    reportedAt: new Date(document.getElementById("intakeReportedAt").value).toISOString(),
    status: "received",
    priority: normalizedPriority({ type }),
    team: "",
    notes: "",
    lat: latitude,
    lng: longitude
  };
  state.issues.push(issue);
  recordAudit("request_created", issue.id, `${issue.type} · ${issue.address}`);
  selectedIssueId = issue.id;
  saveState();
  document.getElementById("filters").reset();
  closeIntakeDialog();
  renderAll();
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("request_created", {
      complaint_type: issue.type,
      zone: issue.zone,
      operator: issue.operator,
      priority: issue.priority,
    });
  }
  showNotice(`${issue.id} added to the operational queue.`, "success");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function label(value = "") {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function ageInHours(date) {
  return Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 3600000));
}

function ageLabel(date) {
  const hours = ageInHours(date);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

function priorityRank(priority) {
  return ({ critical: 0, high: 1, standard: 2 })[priority] ?? 3;
}

function openIssues() {
  return state.issues.filter(issue => issue.status !== "resolved");
}

function issueScore(issue) {
  const priority = ({ critical: 5, high: 3, standard: 1 })[issue.priority] || 0;
  const sourceAnchor = Math.max(...state.issues.map(item => new Date(item.reportedAt).getTime()).filter(Number.isFinite));
  const issueTime = new Date(issue.reportedAt).getTime();
  const recency = Number.isFinite(sourceAnchor) && Number.isFinite(issueTime) && sourceAnchor - issueTime <= 86400000 ? 2 : 1;
  const access = /ADA|entrance/i.test(issue.type) ? 2 : 0;
  return priority + recency + access;
}

function renderMetrics() {
  const unresolved = openIssues();
  const critical = unresolved.filter(issue => issue.priority === "critical").length;
  const assigned = unresolved.filter(issue => issue.team).length;
  const oldest = unresolved.toSorted((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt))[0];
  const items = [
    ["Open requests", unresolved.length, `${critical} critical accessibility risks`],
    ["Assigned", assigned, `${unresolved.length - assigned} awaiting ownership`],
    ["In progress", unresolved.filter(issue => issue.status === "in_progress").length, "Field action recorded"],
    ["Oldest open", oldest ? ageLabel(oldest.reportedAt) : "—", oldest ? oldest.zone : "No unresolved work"]
  ];
  const container = document.getElementById("metrics");
  const template = document.getElementById("metricTemplate");
  container.innerHTML = "";
  items.forEach(([title, value, note]) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".metric-label").textContent = title;
    node.querySelector(".metric-value").textContent = value;
    node.querySelector(".metric-note").textContent = note;
    container.appendChild(node);
  });
}

function sectionViewCounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(SECTION_VIEW_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function recordSectionView(section) {
  const counts = sectionViewCounts();
  counts[section] = (counts[section] || 0) + 1;
  localStorage.setItem(SECTION_VIEW_KEY, JSON.stringify(counts));
  let events = [];
  try {
    const saved = JSON.parse(localStorage.getItem(SECTION_VIEW_EVENTS_KEY));
    if (Array.isArray(saved)) events = saved;
  } catch {
    events = [];
  }
  events.push({ section, at: new Date().toISOString() });
  localStorage.setItem(
    SECTION_VIEW_EVENTS_KEY,
    JSON.stringify(events.filter(event => Date.now() - new Date(event.at).getTime() <= 90 * 86400000))
  );
  if (typeof window.gtag === "function") {
    window.gtag("event", "section_view", { section_name: section });
  }
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("section_viewed", { section_name: section });
  }
}

function localViewWindows() {
  let events = [];
  try {
    const saved = JSON.parse(localStorage.getItem(SECTION_VIEW_EVENTS_KEY));
    if (Array.isArray(saved)) events = saved;
  } catch {
    events = [];
  }
  const now = Date.now();
  return [1, 3, 7, 30, 60, 90].map(days => ({
    days,
    count: events.filter(event => now - new Date(event.at).getTime() <= days * 86400000).length
  }));
}

function metricRows(rows) {
  return `<dl class="metric-report">${rows.map(([term, value]) => `
    <div class="metric-report-row">
      <dt>${escapeHtml(term)}</dt>
      <dd>${value}</dd>
    </div>
  `).join("")}</dl>`;
}

function renderSiteMetrics() {
  const reportingConnected = siteMetricsState.ga4?.status === "connected";
  const counts = Object.entries(sectionViewCounts()).sort((a, b) => b[1] - a[1]);
  const topLocal = counts.length
    ? counts.slice(0, 5).map(([section, count]) => `${escapeHtml(label(section))} — ${count}`).join("<br>")
    : "No section views recorded on this device yet.";
  const viewWindows = localViewWindows();
  const reachability = currentReachability
    ? `<span class="metric-status">${currentReachability.ok ? "Reachable now" : "Unavailable now"}</span><br>${escapeHtml(currentReachability.detail)}`
    : "Run a current reachability check. Historical uptime monitoring is not connected.";

  document.getElementById("siteMetricsSummary").innerHTML = [
    ["GA4 collection", siteMetricsState.ga4?.measurement_id || "Not configured", "Aggregate measurement tag"],
    ["Reporting", reportingConnected ? "Connected" : "Not connected", "No aggregate audience claim"],
    ["Local section views", counts.reduce((sum, [, count]) => sum + count, 0), "This device only"],
    ["Uptime history", "Unavailable", "Current reachability only"]
  ].map(([title, value, note]) => `
    <article class="metric">
      <span class="metric-label">${escapeHtml(title)}</span>
      <strong class="metric-value">${escapeHtml(value)}</strong>
      <span class="metric-note">${escapeHtml(note)}</span>
    </article>
  `).join("");

  document.getElementById("audienceMetrics").innerHTML = metricRows([
    ["Measurement", `<span class="metric-status">GA4 configured</span>`],
    ["Who uses it most", reportingConnected ? "Aggregate report available." : "Reporting connection required. No visitor groups are inferred from the browser tag."]
  ]);
  document.getElementById("pageMetrics").innerHTML = metricRows([
    ["Sitewide top pages", reportingConnected ? "Aggregate report available." : "Reporting connection required."],
    ["This device only", topLocal]
  ]) + `
    <div class="view-window-grid" aria-label="View periods recorded on this device">
      ${viewWindows.map(window => `
        <div><strong>${window.count}</strong><span>Past ${window.days} ${window.days === 1 ? "day" : "days"}</span></div>
      `).join("")}
    </div>
    <p class="metric-boundary-note">These windows begin when this browser first records a section view. Connect GA4 Reporting for sitewide 1-, 3-, 7-, 30-, 60-, and 90-day views.</p>
  `;
  document.getElementById("uptimeMetrics").innerHTML = metricRows([
    ["Current status", reachability],
    ["Historical uptime", "Monitoring service not connected; no percentage is claimed."]
  ]);
  document.getElementById("measurementBoundary").innerHTML = `
    <p class="metric-boundary-note">GA4 collection is configured, but its Reporting API is not connected to this demo. Section counts shown here remain in this browser only. A successful check confirms current reachability, not historical uptime or service reliability.</p>
  `;

  const artifacts = base44ArtifactState?.artifacts;
  document.getElementById("base44Artifacts").innerHTML = artifacts ? `
    <p class="metric-boundary-note">A read-only snapshot from Base44 app <strong>${escapeHtml(base44ArtifactState.source.app_name)}</strong> is integrated as source evidence. GitHub remains the source of truth, and no Base44 records or credits were changed during this inspection.</p>
    <div class="artifact-counts">
      <div><strong>${escapeHtml(artifacts.MicromobilityComplaint.records)}</strong><span>preserved complaint records</span></div>
      <div><strong>${escapeHtml(artifacts.schema_only_entities.count)}</strong><span>schema-only operational entities</span></div>
      <div><strong>${escapeHtml(artifacts.schema_only_entities.records)}</strong><span>populated records in those derived entities</span></div>
    </div>
  ` : `<p class="metric-boundary-note">Base44 artifact inventory is unavailable. No derived Base44 data is assumed.</p>`;
}

async function hydrateSiteMetrics() {
  const [metricsResult, artifactResult] = await Promise.allSettled([
    fetch("./site-metrics.json", { cache: "no-store" }).then(response => {
      if (!response.ok) throw new Error("metrics unavailable");
      return response.json();
    }),
    fetch("./base44-artifacts.json", { cache: "no-store" }).then(response => {
      if (!response.ok) throw new Error("artifacts unavailable");
      return response.json();
    })
  ]);
  if (metricsResult.status === "fulfilled") {
    siteMetricsState = metricsResult.value;
    recordDataFeedUpdate("site-metrics", "Site metrics", siteMetricsState.generated_at, "Site measurement configuration loaded");
  } else {
    recordDataFeedUpdate("site-metrics", "Site metrics", null, metricsResult.reason?.message || "Feed could not be loaded.", "unavailable");
  }
  if (artifactResult.status === "fulfilled") {
    base44ArtifactState = artifactResult.value;
    recordDataFeedUpdate("base44-artifacts", "Base44 artifact inventory", base44ArtifactState.inspected_at, "Read-only integration inventory loaded");
  } else {
    recordDataFeedUpdate("base44-artifacts", "Base44 artifact inventory", null, artifactResult.reason?.message || "Feed could not be loaded.", "unavailable");
  }
  renderSiteMetrics();
}

async function checkCurrentReachability() {
  const button = document.getElementById("checkUptime");
  button.disabled = true;
  const started = performance.now();
  try {
    const response = await fetch(`./index.html?reachability=${Date.now()}`, { cache: "no-store" });
    currentReachability = {
      ok: response.ok,
      detail: response.ok ? `${Math.round(performance.now() - started)} ms response from this site.` : `HTTP ${response.status}.`
    };
  } catch {
    currentReachability = { ok: false, detail: "This device could not reach the site." };
  } finally {
    button.disabled = false;
    renderSiteMetrics();
  }
}

function renderQueueFilterOptions() {
  const zoneFilter = document.getElementById("zoneFilter");
  const selectedZone = zoneFilter.value || "all";
  const zones = [...new Set(state.issues.map(issue => issue.zone))].sort();
  zoneFilter.innerHTML = `<option value="all">All zones</option>${zones.map(zone => `<option value="${escapeHtml(zone)}">${escapeHtml(zone)}</option>`).join("")}`;
  zoneFilter.value = zones.includes(selectedZone) ? selectedZone : "all";
  const typeFilter = document.getElementById("typeFilter");
  const selectedType = typeFilter.value || "all";
  const types = [...new Set(state.issues.map(issue => issue.type))].sort();
  typeFilter.innerHTML = `<option value="all">All complaint types</option>${types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
  typeFilter.value = types.includes(selectedType) ? selectedType : "all";
}

function filteredIssues() {
  const search = document.getElementById("searchFilter").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const priority = document.getElementById("priorityFilter").value;
  const zone = document.getElementById("zoneFilter").value;
  const dateWindow = document.getElementById("dateFilter").value;
  const type = document.getElementById("typeFilter").value;
  const operator = document.getElementById("operatorFilter").value;
  const sourceAnchor = Math.max(...state.issues.map(issue => new Date(issue.reportedAt).getTime()).filter(Number.isFinite));
  const dateCutoff = dateWindow === "all" || !Number.isFinite(sourceAnchor)
    ? null
    : sourceAnchor - Number(dateWindow) * 86400000;
  return state.issues
    .filter(issue => status === "all" || (status === "open" ? issue.status !== "resolved" : issue.status === status))
    .filter(issue => priority === "all" || issue.priority === priority)
    .filter(issue => zone === "all" || issue.zone === zone)
    .filter(issue => type === "all" || issue.type === type)
    .filter(issue => operator === "all" || issue.operator === operator)
    .filter(issue => dateCutoff === null || new Date(issue.reportedAt).getTime() >= dateCutoff)
    .filter(issue => !search || [issue.id, issue.address, issue.zone, issue.type, issue.operator].some(value => value.toLowerCase().includes(search)))
    .toSorted((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || new Date(b.reportedAt) - new Date(a.reportedAt));
}

function renderImportReview() {
  const panel = document.getElementById("importReviewPanel");
  const list = document.getElementById("importReviewList");
  const items = state.importReview || [];
  panel.hidden = !items.length;
  list.innerHTML = items.map(item => `
    <div class="import-review-item">
      <strong>${escapeHtml(item.sourceId)}</strong>
      <span>${escapeHtml(item.reasons.join("; "))} · ${escapeHtml(item.fileName)}</span>
    </div>`).join("");
  document.getElementById("clearImportReview").disabled = !roleAllows("operator");
}

function renderQueue() {
  const issues = filteredIssues();
  document.getElementById("resultCount").textContent = `${issues.length} ${issues.length === 1 ? "request" : "requests"}`;
  const rows = document.getElementById("issueRows");
  rows.innerHTML = issues.length ? issues.map(issue => {
    const adjustedPriority = priorityWithConfidenceAdjustment(issue);
    return `
    <tr data-id="${escapeHtml(issue.id)}" class="${selectedIssueId === issue.id ? "selected" : ""}${issue.pileup_related ? " pileup-alert" : ""}" tabindex="0">
      <td><span class="badge badge-${adjustedPriority}" title="${issue.operatorConfidence === "vehicle-proximity-match" || issue.pileup_related ? "Priority adjusted based on vehicle match confidence and pileup detection" : ""}">${label(adjustedPriority)}${adjustedPriority !== issue.priority ? " ⬆️" : ""}</span></td>
      <td>
        <span class="case-title">${escapeHtml(issue.type)}</span>
        ${issue.pileup_related ? `<span class="badge badge-warning" style="margin-left: 4px; background: #ff9800; color: white;">⚠️ Pileup</span>` : ""}
        <span class="case-meta">${escapeHtml(issue.id)} · ${escapeHtml(issue.address)}</span>
        ${issue.matched_vehicles && issue.matched_vehicles.length > 0 ? `<span class="case-meta" style="color: #0066cc;">${issue.matched_vehicles.length} nearby vehicle${issue.matched_vehicles.length > 1 ? "s" : ""}</span>` : ""}
      </td>
      <td>${escapeHtml(issue.operator || "unknown")}</td>
      <td>${escapeHtml(issue.zone)}</td>
      <td>${ageLabel(issue.reportedAt)}</td>
      <td><span class="badge badge-${issue.status}">${label(issue.status)}</span></td>
    </tr>`;
  }).join("") : `<tr><td colspan="6">No requests match these filters.</td></tr>`;

  rows.querySelectorAll("tr[data-id]").forEach(row => {
    const select = () => {
      selectedIssueId = row.dataset.id;
      renderQueue();
      renderDetail();
    };
    row.addEventListener("click", select);
    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
  });
}

function validOneViewRequestUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "columbusoh.oneviewcrm.cc"
      && /^\/servicerequests\/[0-9a-f-]{36}\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function validEvidencePhotoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function containsContactDetails(value) {
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/i.test(value);
}

function validHttpUrl(value) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function copyToClipboard(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = typeof document.execCommand === "function" && document.execCommand("copy");
    } finally {
      field.remove();
    }
    return copied;
  }
}

function crossReferenceEvidenceText(operator, confidence) {
  if (operator === "unknown") return "The public OneView detail did not establish a single vendor.";
  const method = {
    "photo-confirmed": "request photographs",
    "text-confirmed": "the public request narrative",
    "photo-and-text-confirmed": "both the public narrative and request photographs"
  }[confidence] || "the reviewed public request";
  return `Administrator verified ${operator} using ${method}.`;
}

function renderLinkedPhotos(issue) {
  const photoUrls = Array.isArray(issue.crossReferencePhotoUrls)
    ? issue.crossReferencePhotoUrls.filter(validEvidencePhotoUrl)
    : [];
  if (!photoUrls.length) return "";
  return `
    <section class="linked-photo-panel" aria-label="Linked OneView request photographs">
      <div class="linked-photo-heading">
        <div>
          <p class="eyebrow">Linked OneView evidence</p>
          <strong>${photoUrls.length} request photograph${photoUrls.length === 1 ? "" : "s"}</strong>
        </div>
        ${issue.sourceUrl ? `<a href="${escapeHtml(issue.sourceUrl)}" target="_blank" rel="noreferrer">Open request</a>` : ""}
      </div>
      <div class="linked-photo-strip" tabindex="0">
        ${photoUrls.map((url, index) => `<a class="linked-photo" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(url)}" alt="OneView request photograph ${index + 1} for ${escapeHtml(issue.id)}" loading="lazy" referrerpolicy="no-referrer">
          <span>Photograph ${index + 1}</span>
        </a>`).join("")}
      </div>
    </section>`;
}

function normalizedPlace(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
}

function populusContextForIssue(issue, trace) {
  const observations = populusState.observations || [];
  if (!observations.length) return null;
  const issueTime = new Date(issue.reportedAt);
  const operator = issue.operator !== "unknown" ? issue.operator : trace?.vehicle?.operator;
  const candidates = observations.filter(item => {
    const observedAt = new Date(item.observed_at);
    return normalizedPlace(item.zone) === normalizedPlace(issue.zone)
      && (!operator || normalizedPlace(item.operator) === normalizedPlace(operator))
      && Number.isFinite(observedAt.getTime());
  });
  const current = candidates
    .filter(item => Math.abs(new Date(item.observed_at) - issueTime) <= 6 * 3600000)
    .toSorted((a, b) => Math.abs(new Date(a.observed_at) - issueTime) - Math.abs(new Date(b.observed_at) - issueTime))[0];
  if (!current) return null;
  const baseline = candidates.filter(item => {
    const observedAt = new Date(item.observed_at);
    const age = issueTime - observedAt;
    const hourDistance = Math.min(
      Math.abs(observedAt.getUTCHours() - issueTime.getUTCHours()),
      24 - Math.abs(observedAt.getUTCHours() - issueTime.getUTCHours())
    );
    return age >= 86400000 && age <= 28 * 86400000 && hourDistance <= 2;
  });
  const value = (item, field, fallback = 0) => Number(item?.[field] ?? fallback);
  const rides = item => Number(item?.rides ?? (value(item, "rides_started") + value(item, "rides_ended")));
  const baselineMedian = getter => baseline.length ? median(baseline.map(getter).filter(Number.isFinite)) : null;
  const baselineFleet = baselineMedian(item => value(item, "fleet_size"));
  const baselineRides = baselineMedian(rides);
  const baselineIdle = baselineMedian(item => value(item, "idle_vehicles"));
  const currentFleet = value(current, "fleet_size");
  const currentRides = rides(current);
  const currentIdle = value(current, "idle_vehicles");
  const fleetRatio = baselineFleet ? currentFleet / baselineFleet : null;
  const rideRatio = baselineRides ? currentRides / baselineRides : null;
  const idleRatio = baselineIdle ? currentIdle / baselineIdle : null;
  const idleMinutes = value(current, "median_idle_minutes", NaN);
  const threshold = Number(populusState.idle_review_threshold_minutes || 120);
  const netDeployments = value(current, "deployments") - value(current, "removals");
  let pattern = "insufficient_evidence";
  if (Number.isFinite(idleMinutes) && idleMinutes >= threshold && currentIdle > 0 && (rideRatio === null || rideRatio <= 1.1)) {
    pattern = "idle_management_gap";
  } else if (fleetRatio !== null && fleetRatio >= 1.25 && (rideRatio === null || fleetRatio - rideRatio >= 0.25) && netDeployments > 0) {
    pattern = "supply_driven_concentration";
  } else if (rideRatio !== null && rideRatio >= 1.2 && fleetRatio !== null && Math.abs(fleetRatio - rideRatio) <= 0.35) {
    pattern = "demand_driven_concentration";
  }
  return {
    pattern,
    operator: current.operator || operator || "All operators",
    observedAt: current.observed_at,
    currentFleet,
    currentRides,
    currentIdle,
    idleMinutes: Number.isFinite(idleMinutes) ? idleMinutes : null,
    deployments: value(current, "deployments"),
    removals: value(current, "removals"),
    baselineFleet,
    baselineRides,
    baselineIdle,
    fleetRatio,
    rideRatio,
    idleRatio,
    baselineCount: baseline.length
  };
}

function renderRootCauseReview(issue) {
  const trace = (vehicleTraceState.traces || []).find(item => item.request_id === issue.id);
  const policy = (policyBoundaryState.complaints || []).find(item => item.source_id === issue.id);
  const event = eventEvidenceForIssue(issue);
  const repeatCount = [...(historicalState.records || []), ...state.issues]
    .filter(item => normalizedPlace(item.address) === normalizedPlace(issue.address))
    .length;
  const populus = populusContextForIssue(issue, trace);
  const signals = [];
  if (trace?.vehicle) {
    const dwell = Number.isFinite(trace.trajectory?.minimum_dwell_minutes)
      ? `${trace.trajectory.minimum_dwell_minutes} minutes minimum observed dwell`
      : "arrival time not bounded";
    signals.push(`${trace.vehicle.operator} ${trace.vehicle.id} · ${trace.matched_observation.distance_meters} m from request · ${dwell}`);
  }
  if (repeatCount > 1) signals.push(`${repeatCount} loaded requests at the same normalized address`);
  if (event) signals.push(`${event.eventName} · ${label(event.window)} · ${event.venueDistanceMeters} m from venue`);
  if (policy) signals.push(`${policy.nearest_boundary_distance_m} m from ${policy.nearest_policy_name} ${label(policy.nearest_boundary_type)} boundary`);
  if (populus) {
    signals.push(`${populus.operator} · fleet ${populus.currentFleet} · rides ${populus.currentRides} · idle ${populus.currentIdle}${populus.idleMinutes === null ? "" : ` · median idle ${populus.idleMinutes} min`}`);
  }
  const rootCauseSignal = populus?.pattern && populus.pattern !== "insufficient_evidence"
    ? populus.pattern
    : trace?.root_cause_signal || "insufficient_evidence";
  const conclusion = {
    demand_driven_concentration: "Demand-driven concentration: Populus rides and fleet increased together relative to the matched baseline.",
    supply_driven_concentration: "Supply-driven concentration for review: fleet and net deployments rose faster than rides. This does not establish intent.",
    idle_management_gap: "Idle-management gap for review: idle duration exceeded the configured threshold while demand was not unusually high. A duty or SLA breach is not established here.",
    recent_vehicle_arrival: "A likely matched vehicle arrived from another observed location before the complaint. The data does not identify who moved or parked it.",
    long_dwell: "A likely matched vehicle remained near the request long enough to support a dwell-management review.",
    vehicle_cluster: "Multiple vehicle candidates were present, so the exact device and causal action remain unresolved.",
    insufficient_evidence: "Insufficient evidence to distinguish rider parking, operator staging, displacement, or another cause."
  }[rootCauseSignal];
  const confidence = populus && trace?.confidence === "high"
    ? "high"
    : populus || ["high", "medium"].includes(trace?.confidence)
      ? "medium"
      : "insufficient";
  return `
    <section class="root-cause-review" aria-label="Root cause review">
      <div class="root-cause-heading">
        <div>
          <p class="eyebrow">Root-cause review</p>
          <h4>${escapeHtml(label(rootCauseSignal))}</h4>
        </div>
        <span class="badge badge-${confidence === "high" ? "completed" : confidence === "medium" ? "high" : "standard"}">${escapeHtml(confidence)} confidence</span>
      </div>
      <p class="root-cause-conclusion">${escapeHtml(conclusion)}</p>
      ${signals.length ? `<ul>${signals.map(signal => `<li>${escapeHtml(signal)}</li>`).join("")}</ul>` : `<p>No linked vehicle trajectory or Populus zone observation is available yet.</p>`}
      ${trace?.vehicle ? `<dl class="vehicle-trace">
        <div><dt>Likely vehicle</dt><dd>${escapeHtml(trace.vehicle.operator)} · ${escapeHtml(trace.vehicle.id)} · ${escapeHtml(trace.vehicle.type)}</dd></div>
        <div><dt>Matched observation</dt><dd>${new Date(trace.matched_observation.observed_at).toLocaleString()} · ${trace.matched_observation.distance_meters} m away</dd></div>
        <div><dt>First observed near</dt><dd>${new Date(trace.trajectory.first_observed_near_at).toLocaleString()}</dd></div>
        <div><dt>Arrived from</dt><dd>${trace.trajectory.came_from ? `${trace.trajectory.came_from.lat.toFixed(5)}, ${trace.trajectory.came_from.lng.toFixed(5)} · observed ${new Date(trace.trajectory.came_from.observed_at).toLocaleString()}` : "No defensible prior location in the loaded snapshot sequence"}</dd></div>
        <div><dt>Observed dwell</dt><dd>${Number.isFinite(trace.trajectory.minimum_dwell_minutes) ? `At least ${trace.trajectory.minimum_dwell_minutes} minutes before the report` : "Not bounded by the loaded snapshots"}</dd></div>
        <div><dt>Other candidates</dt><dd>${trace.candidate_count > 1 ? `${trace.candidate_count - 1} additional vehicle candidate${trace.candidate_count - 1 === 1 ? "" : "s"}` : "None within the matching window"}</dd></div>
      </dl>` : ""}
      <p class="evidence-boundary">GBFS and Populus support operational pattern review. They do not, by themselves, prove who placed a vehicle, operator intent, negligence, or a contractual violation.</p>
    </section>`;
}

function requestHistory(issue) {
  const auditEntries = (state.auditLog || [])
    .filter(entry => entry.target === issue.id || String(entry.detail || "").includes(issue.id))
    .toSorted((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);
  const entries = auditEntries.map(entry => `
    <li>
      <time datetime="${escapeHtml(entry.at)}">${new Date(entry.at).toLocaleString()}</time>
      <strong>${escapeHtml(label(entry.action))}</strong>
      <span>${escapeHtml(entry.actor || "system")} · ${escapeHtml(entry.detail || "No additional detail")}</span>
    </li>`).join("");
  return `
    <section class="request-history" aria-label="Request history">
      <p class="eyebrow">Request history</p>
      <ol>
        ${entries}
        <li>
          <time datetime="${escapeHtml(issue.reportedAt)}">${new Date(issue.reportedAt).toLocaleString()}</time>
          <strong>Source record received</strong>
          <span>${escapeHtml(issue.id)} · preserved source timestamp</span>
        </li>
      </ol>
    </section>`;
}

function renderDetail() {
  const issue = state.issues.find(item => item.id === selectedIssueId);
  const panel = document.getElementById("detailPanel");
  if (!issue) {
    panel.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Request detail</p>
        <h3>Select a request</h3>
        <p>Review its source evidence, assign responsibility, and record the next operational action.</p>
      </div>`;
    return;
  }
  const canEditEvidence = roleAllows("admin");
  const canChallenge = roleAllows("operator");
  const lookupUrl = "https://columbusoh.oneviewcrm.cc/servicerequests/nearby";
  const challengeStatuses = roleAllows("admin")
    ? ["no_challenge", "review_requested", "submitted_to_city", "city_reviewing", "city_supported", "city_not_supported"]
    : ["no_challenge", "review_requested", "submitted_to_city"];
  if (issue.accessibilityChallengeStatus && !challengeStatuses.includes(issue.accessibilityChallengeStatus)) {
    challengeStatuses.push(issue.accessibilityChallengeStatus);
  }
  panel.innerHTML = `
    <p class="eyebrow">${escapeHtml(issue.id)}</p>
    <h3>${escapeHtml(issue.type)}</h3>
    <p class="detail-address">${escapeHtml(issue.address)}<br>${escapeHtml(issue.zone)}</p>
    <span class="badge badge-${issue.priority}">${label(issue.priority)}</span>
    <dl class="evidence">
      <div><dt>Source evidence</dt><dd>${escapeHtml(issue.descriptor)}</dd></div>
      ${issue.sourceStatus ? `<div><dt>City source status</dt><dd>${escapeHtml(issue.sourceStatus)} · read-only public feed${issue.sourceUpdatedAt ? ` · updated ${new Date(issue.sourceUpdatedAt).toLocaleString()}` : ""}</dd></div>` : ""}
      ${issue.crossReferenceStatus ? `<div><dt>OneView status</dt><dd>${escapeHtml(label(issue.crossReferenceStatus))} · read-only cross-reference</dd></div>` : ""}
      ${issue.crossReferenceEvidence ? `<div><dt>Cross-reference evidence</dt><dd>${escapeHtml(issue.crossReferenceEvidence)}</dd></div>` : ""}
      ${/ADA/i.test(issue.type) || issue.accessibilityEvidence !== "not_assessed" ? `<div><dt>Accessibility evidence</dt><dd>${escapeHtml(label(issue.accessibilityEvidence || "not_assessed"))}</dd></div>` : ""}
      ${/ADA/i.test(issue.type) || issue.accessibilityChallengeStatus !== "no_challenge" ? `<div><dt>Challenge status</dt><dd>${escapeHtml(label(issue.accessibilityChallengeStatus || "no_challenge"))}${issue.accessibilityChallengeStatus && issue.accessibilityChallengeStatus !== "no_challenge" ? " · no waiver implied" : ""}</dd></div>` : ""}
      <div><dt>Reported</dt><dd>${new Date(issue.reportedAt).toLocaleString()}</dd></div>
      <div><dt>Classification</dt><dd>${escapeHtml(label(issue.classificationConfidence || "trial fixture"))}</dd></div>
      <div><dt>Classification evidence</dt><dd>${escapeHtml(issue.classificationEvidence || "Local trial fixture; no automated classification claim.")}</dd></div>
      <div><dt>Operator</dt><dd>${escapeHtml(issue.operator)}</dd></div>
      <div><dt>Attribution</dt><dd>${escapeHtml(label(issue.operatorConfidence || "unattributed"))}</dd></div>
      <div><dt>Attribution evidence</dt><dd>${escapeHtml(issue.operatorEvidence || "No operator evidence is available.")}</dd></div>
      ${issue.matched_vehicles && issue.matched_vehicles.length > 0 ? `
      <div><dt>Nearby vehicles</dt><dd>
        <div class="matched-vehicles-list" style="margin-top: 8px;">
          ${issue.matched_vehicles.map((v, idx) => `
            <div style="margin-bottom: ${idx < issue.matched_vehicles.length - 1 ? "8px" : "0"}; padding: 8px; background: #f5f5f5; border-left: 3px solid #0066cc;">
              <strong>${escapeHtml(v.company || "Unknown")}</strong> · ${v.distance_meters.toFixed(0)}m away
              <br><small style="color: #666;">Type: ${escapeHtml(v.type || "vehicle")} · Battery: ${v.battery || "N/A"}%</small>
            </div>
          `).join("")}
        </div>
      </dd></div>
      ` : ""}
      ${issue.pileup_related && issue.nearby_pileup ? `
      <div><dt>Pileup alert</dt><dd>
        <div class="pileup-info" style="padding: 8px; background: #fff3cd; border-left: 3px solid #ff9800;">
          <strong>⚠️ Detected pileup nearby</strong>
          <br>ID: ${escapeHtml(issue.nearby_pileup.id || "unknown")}
          <br>Distance: ${issue.nearby_pileup.distance_meters?.toFixed(0) || "N/A"}m
          <br>Vehicle count: ${issue.nearby_pileup.vehicle_count || "N/A"}
          <br>Operators: ${escapeHtml((issue.nearby_pileup.companies || []).join(", ") || "Unknown")}
        </div>
      </dd></div>
      ` : ""}
      <div><dt>Coordinates</dt><dd>${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}</dd></div>
      ${issue.councilDistrict ? `<div><dt>Council district</dt><dd>${escapeHtml(issue.councilDistrict)}</dd></div>` : ""}
    </dl>
    ${renderLinkedPhotos(issue)}
    <div class="operator-evidence">
      <strong>OneView lookup</strong>
      <p>Search the public system near <b>${escapeHtml(issue.address)}</b>, match request ID <b>${escapeHtml(issue.id)}</b>, then record only operational evidence—never resident names or contact details.</p>
      ${issue.sourceUrl
        ? `<a href="${escapeHtml(issue.sourceUrl)}" target="_blank" rel="noreferrer">Open matched OneView request and photographs</a>`
        : `<a href="${lookupUrl}" target="_blank" rel="noreferrer" data-oneview-lookup>Search nearby requests in OneView</a>`}
    </div>
    ${renderRootCauseReview(issue)}
    <form class="detail-form evidence-review-form" id="evidenceReviewForm">
      <p class="eyebrow">Administrator evidence review</p>
      <label>Matched OneView request URL
        <input id="crossReferenceUrlInput" type="url" value="${escapeHtml(issue.crossReferenceUrl || "")}" placeholder="https://columbusoh.oneviewcrm.cc/servicerequests/…" ${canEditEvidence ? "" : "disabled"}>
      </label>
      <label>Public request photograph URLs
        <textarea id="crossReferencePhotoUrlsInput" maxlength="3000" placeholder="One HTTPS image URL per line" ${canEditEvidence ? "" : "disabled"}>${escapeHtml((issue.crossReferencePhotoUrls || []).join("\n"))}</textarea>
      </label>
      <label>Privacy-safe operational summary
        <textarea id="crossReferenceSummaryInput" maxlength="600" placeholder="Describe the obstruction and location. Omit resident names, email addresses, phone numbers, and correspondence details." ${canEditEvidence ? "" : "disabled"}>${escapeHtml(issue.crossReferenceSummary || "")}</textarea>
      </label>
      <div class="evidence-review-grid">
        <label>Public OneView status
          <select id="crossReferenceStatusInput" ${canEditEvidence ? "" : "disabled"}>
            ${["", "assigned", "concluded", "closed", "comments_tracked_close"].map(status => `<option value="${status}" ${status === (issue.crossReferenceStatus || "") ? "selected" : ""}>${status ? label(status) : "Not recorded"}</option>`).join("")}
          </select>
        </label>
        <label>Operator
          <select id="crossReferenceOperatorInput" ${canEditEvidence ? "" : "disabled"}>
            ${["unknown", "Spin", "Veo"].map(operator => `<option value="${operator}" ${operator === issue.operator ? "selected" : ""}>${label(operator)}</option>`).join("")}
          </select>
        </label>
        <label>Verification
          <select id="crossReferenceConfidenceInput" ${canEditEvidence ? "" : "disabled"}>
            ${["unattributed", "photo-confirmed", "text-confirmed", "photo-and-text-confirmed"].map(confidence => `<option value="${confidence}" ${confidence === (issue.operatorConfidence || "unattributed") ? "selected" : ""}>${label(confidence)}</option>`).join("")}
          </select>
        </label>
        <label>Accessibility finding
          <select id="accessibilityEvidenceInput" ${canEditEvidence ? "" : "disabled"}>
            ${["not_assessed", "no_photo", "photo_inconclusive", "photo_not_supporting", "photo_supporting"].map(finding => `<option value="${finding}" ${finding === (issue.accessibilityEvidence || "not_assessed") ? "selected" : ""}>${label(finding)}</option>`).join("")}
          </select>
        </label>
      </div>
      <p class="evidence-boundary">An ADA checkbox or narrative is a resident-reported concern. Only “photo supporting” is treated as visually confirmed; other findings remain challengeable evidence states.</p>
      <p class="form-error" id="evidenceReviewError"></p>
      <button class="secondary-button" type="submit" ${canEditEvidence ? "" : "disabled"}>Save verified evidence</button>
    </form>
    ${requestHistory(issue)}
    ${/ADA/i.test(issue.type) || issue.accessibilityEvidence !== "not_assessed" ? `
      <form class="detail-form challenge-form" id="accessibilityChallengeForm">
        <p class="eyebrow">Accessibility review / challenge</p>
        <p class="evidence-boundary">A challenge records an evidence dispute for City review. It does not dismiss the request, change its lifecycle, pause an SLA calculation, or imply that the City will waive the request or agree with the operator.</p>
        <label>Review status
          <select id="accessibilityChallengeStatusInput" ${canChallenge ? "" : "disabled"}>
            ${challengeStatuses.map(status => `<option value="${status}" ${status === (issue.accessibilityChallengeStatus || "no_challenge") ? "selected" : ""}>${label(status)}</option>`).join("")}
          </select>
        </label>
        <label>Evidence note
          <textarea id="accessibilityChallengeNoteInput" maxlength="600" placeholder="State what the photograph does or does not establish; omit resident identity and contact details." ${canChallenge ? "" : "disabled"}>${escapeHtml(issue.accessibilityChallengeNote || "")}</textarea>
        </label>
        <p class="form-error" id="accessibilityChallengeError"></p>
        <button class="secondary-button" type="submit" ${canChallenge ? "" : "disabled"}>Save review status</button>
      </form>` : ""}
    <form class="detail-form" id="issueUpdateForm">
      <label>Assigned team
        <select id="teamInput">${teams.map(team => `<option value="${escapeHtml(team)}" ${team === issue.team ? "selected" : ""}>${team || "Unassigned"}</option>`).join("")}</select>
      </label>
      <label>Status
        <select id="statusInput">
          ${["received", "assigned", "in_progress", "resolved"].map(status => `<option value="${status}" ${status === issue.status ? "selected" : ""}>${label(status)}</option>`).join("")}
        </select>
      </label>
      <label>Operational note
        <textarea id="notesInput" placeholder="Document the next action or result.">${escapeHtml(issue.notes)}</textarea>
      </label>
      <button class="primary-button" type="submit">Save update</button>
    </form>`;
  document.querySelector("[data-oneview-lookup]")?.addEventListener("click", () => {
    void copyToClipboard(issue.address).then(copied => {
      showNotice(
        copied
          ? `${issue.address} copied. Paste it into OneView's address search.`
          : `OneView opened. Copy ${issue.address} into the address search.`,
        copied ? "success" : "error"
      );
    });
  });
  document.getElementById("evidenceReviewForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!requireRole("admin", "record verified source evidence")) return;
    const error = document.getElementById("evidenceReviewError");
    const url = document.getElementById("crossReferenceUrlInput").value.trim();
    const photoUrls = document.getElementById("crossReferencePhotoUrlsInput").value
      .split(/\r?\n/)
      .map(value => value.trim())
      .filter(Boolean);
    const summary = document.getElementById("crossReferenceSummaryInput").value.trim();
    const officialStatus = document.getElementById("crossReferenceStatusInput").value;
    const operator = document.getElementById("crossReferenceOperatorInput").value;
    const confidence = document.getElementById("crossReferenceConfidenceInput").value;
    const accessibilityEvidence = document.getElementById("accessibilityEvidenceInput").value;
    if (!validOneViewRequestUrl(url)) {
      error.textContent = "Enter the exact public OneView request URL, not the nearby-search page.";
      return;
    }
    if (photoUrls.length > 6 || photoUrls.some(value => !validEvidencePhotoUrl(value))) {
      error.textContent = "Add no more than six public HTTPS photograph URLs, one per line.";
      return;
    }
    if (summary.length < 12) {
      error.textContent = "Add a concise operational summary before saving evidence.";
      return;
    }
    if (containsContactDetails(summary)) {
      error.textContent = "Remove email addresses and telephone numbers from the operational summary.";
      return;
    }
    if (operator !== "unknown" && confidence === "unattributed") {
      error.textContent = "Choose how the named operator was verified.";
      return;
    }
    const classification = classifyComplaint({ description: summary, complaint_type: issue.type }, accessibilityEvidence);
    issue.descriptor = summary;
    issue.crossReferenceSummary = summary;
    issue.crossReferenceUrl = url;
    issue.sourceUrl = url;
    issue.crossReferencePhotoUrls = photoUrls;
    issue.crossReferenceStatus = officialStatus;
    issue.crossReferenceEvidence = "Administrator-verified public OneView detail; the saved summary excludes personal contact information.";
    issue.accessibilityEvidence = accessibilityEvidence;
    issue.type = classification.type;
    issue.classificationConfidence = classification.confidence;
    issue.classificationEvidence = classification.evidence;
    issue.priority = normalizedPriority({ priority: "", complaint_type: classification.type });
    issue.operator = operator;
    issue.operatorConfidence = operator === "unknown" ? "unattributed" : confidence;
    issue.operatorEvidence = crossReferenceEvidenceText(operator, issue.operatorConfidence);
    recordAudit("cross_reference_verified", issue.id, `OneView evidence recorded; ${issue.type}; ${operator}`);
    saveState();
    renderAll();
    if (typeof window.posthog !== "undefined") {
      window.posthog.capture("evidence_verified", {
        complaint_type: issue.type,
        operator: issue.operator,
        operator_confidence: issue.operatorConfidence,
        accessibility_evidence: issue.accessibilityEvidence,
        photo_count: photoUrls.length,
      });
    }
    showNotice(`${issue.id} OneView evidence saved without changing its local lifecycle status.`, "success");
  });
  panel.querySelectorAll(".linked-photo img").forEach(image => {
    image.addEventListener("error", () => {
      const link = image.closest(".linked-photo");
      if (!link) return;
      image.remove();
      link.classList.add("photo-load-failed");
      link.querySelector("span").textContent = "Open photograph";
    }, { once: true });
  });
  document.getElementById("accessibilityChallengeForm")?.addEventListener("submit", event => {
    event.preventDefault();
    if (!requireRole("operator", "record an accessibility evidence challenge")) return;
    const error = document.getElementById("accessibilityChallengeError");
    const challengeStatus = document.getElementById("accessibilityChallengeStatusInput").value;
    const challengeNote = document.getElementById("accessibilityChallengeNoteInput").value.trim();
    if (!roleAllows("admin") && ["city_reviewing", "city_supported", "city_not_supported"].includes(challengeStatus)) {
      error.textContent = "Only an Administrator can record a City review finding.";
      return;
    }
    if (challengeStatus !== "no_challenge" && challengeNote.length < 12) {
      error.textContent = "Add a concise evidence note for the review record.";
      return;
    }
    if (containsContactDetails(challengeNote)) {
      error.textContent = "Remove email addresses and telephone numbers from the evidence note.";
      return;
    }
    issue.accessibilityChallengeStatus = challengeStatus;
    issue.accessibilityChallengeNote = challengeNote;
    recordAudit("accessibility_review_updated", issue.id, `${label(challengeStatus)}; evidence note ${challengeNote ? "recorded" : "cleared"}; no waiver or lifecycle change implied`);
    saveState();
    renderAll();
    if (typeof window.posthog !== "undefined") {
      window.posthog.capture("accessibility_review_updated", {
        challenge_status: challengeStatus,
        has_evidence_note: Boolean(challengeNote),
      });
    }
    showNotice(`${issue.id} review status saved. No waiver, dismissal, SLA pause, or lifecycle change is implied.`, "success");
  });
  document.getElementById("issueUpdateForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!requireRole("operator", "update a request")) return;
    const previous = { team: issue.team, status: issue.status, notes: issue.notes };
    issue.team = document.getElementById("teamInput").value;
    issue.status = document.getElementById("statusInput").value;
    issue.notes = document.getElementById("notesInput").value.trim();
    if (issue.team && issue.status === "received") issue.status = "assigned";
    const changes = [
      previous.team !== issue.team ? `team: ${previous.team || "unassigned"} → ${issue.team || "unassigned"}` : "",
      previous.status !== issue.status ? `status: ${previous.status} → ${issue.status}` : "",
      previous.notes !== issue.notes ? "operational note updated" : ""
    ].filter(Boolean).join("; ");
    if (changes) {
      recordAudit("request_updated", issue.id, changes);
      if (typeof window.posthog !== "undefined") {
        window.posthog.capture("request_updated", {
          complaint_type: issue.type,
          zone: issue.zone,
          new_status: issue.status,
          previous_status: previous.status,
          team_assigned: Boolean(issue.team),
        });
      }
    }
    saveState();
    renderAll();
  });
}

function hotspots() {
  const groups = {};
  openIssues().forEach(issue => {
    groups[issue.zone] ||= [];
    groups[issue.zone].push(issue);
  });
  return Object.entries(groups).map(([zone, issues]) => {
    const chronological = issues.toSorted((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt));
    const independentSignals = chronological.filter((issue, index) => {
      const previous = chronological[index - 1];
      if (!previous || previous.address.toUpperCase() !== issue.address.toUpperCase()) return true;
      return new Date(issue.reportedAt) - new Date(previous.reportedAt) > 10 * 60000;
    });
    const score = independentSignals.reduce((sum, issue) => sum + issueScore(issue), 0);
    const critical = issues.filter(issue => issue.priority === "critical").length;
    return { zone, issues, independentSignals, score, critical, tier: score >= 13 ? "critical" : score >= 7 ? "high" : "standard" };
  }).toSorted((a, b) => b.score - a.score);
}

function reportingPatternWatch() {
  const corridor = state.issues
    .filter(issue => /\bw\s+broad\s+(?:st|street)\b/i.test(issue.address))
    .toSorted((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt));
  const burstPairs = [];
  for (let index = 1; index < corridor.length; index += 1) {
    const previous = corridor[index - 1];
    const current = corridor[index];
    const sameAddress = previous.address.toUpperCase() === current.address.toUpperCase();
    const minutes = (new Date(current.reportedAt) - new Date(previous.reportedAt)) / 60000;
    if (sameAddress && minutes >= 0 && minutes <= 10) {
      burstPairs.push({ previous, current, minutes });
    }
  }
  return {
    issues: corridor,
    burstPairs,
    open: corridor.filter(issue => issue.status !== "resolved").length,
    closed: corridor.filter(issue => issue.status === "resolved").length,
    spanMiles: corridor.length > 1 ? Math.max(...corridor.flatMap((issue, index) =>
      corridor.slice(index + 1).map(other => distanceMeters(issue, other) / 1609.344)
    )) : 0
  };
}

function responseTeamForZone(zone) {
  if (/hilltop|west/i.test(zone)) return "West response";
  if (/south/i.test(zone)) return "South response";
  if (/north|clintonville|italian|university|victorian/i.test(zone)) return "North response";
  return "Central response";
}

function nextInterventionId() {
  const highest = state.interventions.reduce((maximum, item) => {
    const numeric = Number(String(item.id).match(/\d+/)?.[0]);
    return Number.isFinite(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `INT-${String(highest + 1).padStart(3, "0")}`;
}

function generateHotspotRecommendation(zone) {
  if (!requireRole("operator", "generate an intervention recommendation")) return;
  const hotspot = hotspots().find(item => item.zone === zone);
  if (!hotspot || !["high", "critical"].includes(hotspot.tier)) {
    showNotice("This hotspot does not meet the current recommendation threshold.", "error");
    return;
  }
  const duplicate = state.interventions.find(item =>
    item.zone === zone && !["completed", "skipped"].includes(item.status)
  );
  if (duplicate) {
    showNotice(`${duplicate.id} already covers this zone.`, "error");
    return;
  }
  const createdAt = new Date().toISOString();
  const eventEvidence = hotspot.issues.map(eventEvidenceForIssue).filter(Boolean);
  const attributedVendors = [...new Set(
    hotspot.issues.map(issue => issue.operator).filter(operator => ["Spin", "Veo"].includes(operator))
  )];
  const mappedIssues = hotspot.issues.filter(issue => Number.isFinite(issue.lat) && Number.isFinite(issue.lng));
  const mapCenter = mappedIssues.length ? {
    lat: mappedIssues.reduce((sum, issue) => sum + issue.lat, 0) / mappedIssues.length,
    lng: mappedIssues.reduce((sum, issue) => sum + issue.lng, 0) / mappedIssues.length
  } : { lat: 39.9612, lng: -82.9988 };
  const mapRadius = mappedIssues.length
    ? Math.min(1609, Math.max(150, ...mappedIssues.map(issue => distanceMeters(issue, mapCenter) + 75)))
    : 250;
  const item = {
    id: nextInterventionId(),
    interventionType: "field_response",
    cadence: "one_off",
    recurrence: "",
    timeframeStart: createdAt.slice(0, 10),
    timeframeEnd: createdAt.slice(0, 10),
    mapArea: {
      label: zone,
      type: "circle",
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      radiusMeters: Math.round(mapRadius)
    },
    zone,
    strategy: hotspot.critical
      ? "Accessibility obstruction field response"
      : "Targeted field verification and redistribution",
    rationale: `${hotspot.independentSignals.length} independent prioritization signals produce a score of ${hotspot.score}; ${hotspot.critical} are critical. Same-address reports within ten minutes are retained as records but collapsed for scoring.${eventEvidence.length ? ` ${eventEvidence.length} source record${eventEvidence.length === 1 ? "" : "s"} also fall within the documented venue/time review window; this is contextual evidence, not proof of causation.` : ""}`,
    status: "recommended",
    requirementStatus: "above_current_311_requirements",
    authorityBasis: "voluntary_pilot",
    intendedEffect: "fewer_future_311_requests",
    slaStatus: "not_applicable",
    team: responseTeamForZone(zone),
    createdAt,
    score: hotspot.score,
    tier: hotspot.tier,
    sourceIssueIds: hotspot.issues.map(issue => issue.id),
    independentIssueIds: hotspot.independentSignals.map(issue => issue.id),
    eventEvidence,
    targetVendors: attributedVendors.length ? attributedVendors : ["Spin", "Veo"],
    vendorResponses: {},
    transitions: [{ status: "recommended", at: createdAt, actor: `local-${currentRole}` }]
  };
  state.interventions.push(item);
  recordAudit("intervention_recommended", item.id, `${zone} · score ${hotspot.score} · ${hotspot.issues.length} source records`);
  saveState();
  renderAll();
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("intervention_recommended", {
      zone,
      hotspot_score: hotspot.score,
      hotspot_tier: hotspot.tier,
      source_issue_count: hotspot.issues.length,
      has_event_evidence: eventEvidence.length > 0,
    });
  }
  showNotice(`${item.id} proactive forecast created for review. It is not a 311 request.`, "success");
}

function renderHotspots() {
  const data = hotspots();
  const policyPanel = document.getElementById("policyBoundaryAnalysis");
  if (policyPanel) {
    if (policyBoundaryState.status === "ready" && policyBoundaryState.summary) {
      const summary = policyBoundaryState.summary;
      const closest = policyBoundaryState.complaints
        .filter(item => item.nearest_boundary_distance_m <= 25)
        .slice(0, 6);
      policyPanel.innerHTML = `
        <div class="brief-heading">
          <div>
            <p class="eyebrow">Published MDS policy context</p>
            <h3>311 proximity to no-park and no-ride boundaries</h3>
          </div>
          <a href="${escapeHtml(policyBoundaryState.source?.policy_url || "#")}" target="_blank" rel="noreferrer">Open public policy map</a>
        </div>
        <div class="policy-metrics">
          <p><strong>${summary.within_boundary_m["25"]}</strong><span>of ${summary.source_complaint_count} within 25 m</span></p>
          <p><strong>${summary.within_boundary_m["50"]}</strong><span>within 50 m</span></p>
          <p><strong>${summary.within_boundary_m["100"]}</strong><span>within 100 m</span></p>
          <p><strong>${summary.inside_policy_zone_count}</strong><span>inside a published zone</span></p>
        </div>
        <p>${summary.boundary_policy_count} published no-parking, mandatory-parking, or no-ride policies contribute ${summary.boundary_feature_count} mapped features. The closest records include ${closest.map(item => `${escapeHtml(item.source_id)} · ${escapeHtml(item.nearest_policy_name)} · ${item.nearest_boundary_distance_m.toFixed(1)} m`).join("; ")}.</p>
        <p class="threshold-note"><strong>Interpretation boundary:</strong> proximity is a review signal, not evidence that a geofence caused the complaint or was active at report time. A matched control set of ordinary street locations is still required before claiming complaints are disproportionately concentrated near policy edges.</p>`;
    } else {
      policyPanel.innerHTML = `<p class="threshold-note">Published mobility-policy boundaries are unavailable in this build.</p>`;
    }
  }
  const reportingWatch = reportingPatternWatch();
  const reportingWatchCard = reportingWatch.issues.length ? `
    <article class="hotspot-item named-watch reporting-watch">
      <span class="badge badge-standard">Reporting-pattern review</span>
      <h3>W Broad Street submission concentration</h3>
      <p>${reportingWatch.issues.length} verified complaints span approximately ${reportingWatch.spanMiles.toFixed(1)} miles of the corridor; ${reportingWatch.closed} are closed and ${reportingWatch.open} remain open. ${reportingWatch.burstPairs.length} same-address pairs were submitted within ten minutes.</p>
      <p><strong>Duplicate-burst evidence:</strong> ${reportingWatch.burstPairs.length ? reportingWatch.burstPairs.map(pair => `${escapeHtml(pair.previous.address)} · ${escapeHtml(pair.previous.id)} + ${escapeHtml(pair.current.id)} · ${pair.minutes.toFixed(1)} min`).join("; ") : "None detected."}</p>
      <p>The linear corridor spread is different from a single physical pile-up. Records remain individually inspectable, but burst-linked submissions count as one signal when prioritizing a hotspot. Public data does not establish reporter identity or intent.</p>
      <p><strong>City precedent:</strong> the October 2025 SLA report excluded October 23 and 24 from one response-time result because each day had 16 requests submitted within one hour.</p>
    </article>` : "";
  const fourthStreetIssues = state.issues
    .filter(issue => /\b(?:n\s+)?4th\s+(?:st|street)\b/i.test(issue.address))
    .toSorted((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
  const fourthStreetWatch = fourthStreetIssues.length ? `
    <article class="hotspot-item named-watch">
      <span class="badge badge-high">Infrastructure watch</span>
      <h3>N 4th Street bikeway corridor</h3>
      <p>${fourthStreetIssues.length} verified complaints match the corridor; ${fourthStreetIssues.filter(issue => issue.status !== "resolved").length} remain open. Reported association with the new bike-lane configuration should be tested against installation dates and a pre-change baseline.</p>
      <p><strong>Evidence:</strong> ${fourthStreetIssues.map(issue => `${escapeHtml(issue.id)} · ${escapeHtml(issue.address)}`).join("; ")}</p>
    </article>` : "";
  const eventAnalysis = watchEventAnalysis();
  const latestLinkedObservation = eventAnalysis.eventLinked.at(-1);
  const latestEventContext = latestLinkedObservation?.eventContext;
  const latestIsEventLinked = latestLinkedObservation?.snapshot_id === eventAnalysis.latest?.snapshot_id;
  const eventWatchCard = latestEventContext ? `
    <article class="hotspot-item named-watch event-watch">
      <span class="badge badge-high">Historical event-window observation</span>
      <h3>Goodale and Olentangy after ${escapeHtml(latestEventContext.event.name)}</h3>
      <p>The ${new Date(latestLinkedObservation.observedAt).toLocaleString()} GBFS snapshot was captured ${eventTimingDescription(latestEventContext)} and contains ${latestLinkedObservation.watch_count} vehicles within 250 metres of the named watch.</p>
      <p>${latestIsEventLinked ? "This is the latest observation" : `The newer ${new Date(eventAnalysis.latest.observedAt).toLocaleString()} observation`} and ${eventAnalysis.latest.cross_vendor ? "has" : "does not have"} a cross-vendor condition. The complete history remains available for comparison.</p>
      <p>${eventAnalysis.eventLinked.length} of ${eventAnalysis.observations.length} observations fall within a defined event window. Event-window median: ${eventAnalysis.eventMedian ?? "—"}; non-event median: ${eventAnalysis.baselineMedian ?? "—"}. One event-linked observation is insufficient to establish recurrence or causation.</p>
      <p><strong>Join rule:</strong> four hours pre-event; official kickoff through an estimated 2h15 end; 0–2 hours immediate post-event; 2–6 hours recovery; 6–16 hours next morning.</p>
      <p><a href="${escapeHtml(eventState.source?.url || "#")}" target="_blank" rel="noreferrer">Official Columbus Crew schedule source</a> · expected end times are analytical estimates.</p>
    </article>` : "";
  const max = Math.max(...data.map(item => item.score), 1);
  document.getElementById("zoneMap").innerHTML = data.map(item => {
    const alpha = 0.12 + (item.score / max) * 0.7;
    return `<div class="zone-block" style="background:rgba(31,91,70,${alpha.toFixed(2)});color:${alpha > 0.48 ? "white" : "var(--ink)"}">
      <div><strong>${escapeHtml(item.zone)}</strong><span style="color:inherit">${item.issues.length} open · score ${item.score}</span></div>
    </div>`;
  }).join("");
  const hotspotList = document.getElementById("hotspotList");
  hotspotList.innerHTML = reportingWatchCard + fourthStreetWatch + eventWatchCard + data.map(item => {
    const qualifying = ["high", "critical"].includes(item.tier);
    const existing = state.interventions.find(intervention =>
      intervention.zone === item.zone && !["completed", "skipped"].includes(intervention.status)
    );
    return `
      <article class="hotspot-item">
        <span class="badge badge-${item.tier}">${label(item.tier)}</span>
        <h3>${escapeHtml(item.zone)}</h3>
        <p>${item.issues.length} open requests representing ${item.independentSignals.length} prioritization signals; ${item.critical} critical. Severity combines priority, recency, and accessibility relevance after duplicate-burst suppression.</p>
        <p><strong>Evidence:</strong> ${item.issues.map(issue => escapeHtml(issue.id)).join(", ")}</p>
        ${qualifying ? `<button class="secondary-button" type="button" data-recommend-zone="${escapeHtml(item.zone)}" ${existing || !roleAllows("operator") ? "disabled" : ""}>${existing ? `${escapeHtml(existing.id)} in review` : "Generate recommendation"}</button>` : `<p class="threshold-note">Below the score threshold for an intervention recommendation.</p>`}
      </article>`;
  }).join("");
  hotspotList.querySelectorAll("[data-recommend-zone]").forEach(button => {
    button.addEventListener("click", () => generateHotspotRecommendation(button.dataset.recommendZone));
  });
}

function interventionVendors(item) {
  const configured = Array.isArray(item.targetVendors)
    ? item.targetVendors.filter(vendor => ["Spin", "Veo"].includes(vendor))
    : [];
  if (configured.length) return [...new Set(configured)];
  const attributed = (item.sourceIssueIds || [])
    .map(issueId => state.issues.find(issue => issue.id === issueId)?.operator)
    .filter(vendor => ["Spin", "Veo"].includes(vendor));
  return attributed.length ? [...new Set(attributed)] : ["Spin", "Veo"];
}

function vendorResponseComplete(item) {
  return interventionVendors(item).every(vendor =>
    ["accepted", "acknowledged"].includes(item.vendorResponses?.[vendor]?.status)
  );
}

function vendorRoutingComplete(item) {
  return interventionVendors(item).every(vendor => {
    const response = item.vendorResponses?.[vendor];
    return Boolean(
      ["accepted", "acknowledged"].includes(response?.status) &&
      response?.assignedTo?.trim() &&
      response?.vendorPriority &&
      response?.routingMethod
    );
  });
}

function renderVendorResponses(item) {
  if (!["dispatched", "completed"].includes(item.status)) return "";
  const vendors = interventionVendors(item);
  return `
    <section class="vendor-response-panel" aria-label="Vendor responses for ${escapeHtml(item.id)}">
      <div class="forecast-boundary">
        <p class="eyebrow">Proactive vendor dispatch · not a 311 request</p>
        <p>This optional early-warning record anticipates a place and timeframe that may otherwise produce a future 311 request. It is above current vendor 311 requirements, has no SLA, and does not represent a citizen report, predict a person or intent, create an enforcement finding, or make non-participation a compliance failure.</p>
      </div>
      <div>
        <p class="eyebrow">Vendor operational record</p>
        <p>Each vendor records receipt, the on-duty assignment, priority, internal route, and any evidence. Slack is one routing option; vendors may use their own system.</p>
      </div>
      <div class="vendor-response-list">
        ${vendors.map(vendor => {
          const response = item.vendorResponses?.[vendor];
          const status = response?.status || "pending";
          const editable = item.status === "dispatched" && roleAllows("operator");
          return `
            <div class="vendor-response-row">
              <div class="vendor-response-summary">
                <strong>${escapeHtml(vendor)}</strong>
                <span class="badge badge-${status === "pending" ? "standard" : status === "accepted" ? "approved" : "in_progress"}">${escapeHtml(label(status))}</span>
                ${response?.at ? `<small>Receipt ${new Date(response.at).toLocaleString()} · ${escapeHtml(response.actor || "recorded response")}</small>` : ""}
                ${response?.routingUpdatedAt ? `<small>Routing updated ${new Date(response.routingUpdatedAt).toLocaleString()} · ${escapeHtml(response.routingActor || "recorded update")}</small>` : ""}
              </div>
              ${item.status === "dispatched" && status === "pending" ? `
                <div class="vendor-response-actions">
                  <button class="secondary-button" type="button" data-vendor-response="accepted" data-vendor="${escapeHtml(vendor)}" data-id="${escapeHtml(item.id)}" ${!roleAllows("operator") ? "disabled" : ""}>Accept</button>
                  <button class="secondary-button" type="button" data-vendor-response="acknowledged" data-vendor="${escapeHtml(vendor)}" data-id="${escapeHtml(item.id)}" ${!roleAllows("operator") ? "disabled" : ""}>Acknowledge</button>
                </div>` : ""}
              ${status !== "pending" ? `
                <form class="vendor-routing-form" data-vendor-routing data-vendor="${escapeHtml(vendor)}" data-id="${escapeHtml(item.id)}">
                  <label>Assigned on-duty responder or team <span>Required</span>
                    <input name="assignedTo" value="${escapeHtml(response?.assignedTo || "")}" placeholder="Columbus on-duty operations" ${editable ? "" : "disabled"} required>
                  </label>
                  <label>Vendor priority <span>Required</span>
                    <select name="vendorPriority" ${editable ? "" : "disabled"} required>
                      <option value="">Select priority</option>
                      ${["immediate", "high", "routine", "monitor"].map(priority => `<option value="${priority}" ${response?.vendorPriority === priority ? "selected" : ""}>${label(priority)}</option>`).join("")}
                    </select>
                  </label>
                  <label>Routed via <span>Required</span>
                    <select name="routingMethod" ${editable ? "" : "disabled"} required>
                      <option value="">Select route</option>
                      ${["slack", "vendor_app", "email", "phone", "other"].map(method => `<option value="${method}" ${response?.routingMethod === method ? "selected" : ""}>${label(method)}</option>`).join("")}
                    </select>
                  </label>
                  <label>Routing reference
                    <input name="routingReference" value="${escapeHtml(response?.routingReference || "")}" placeholder="#columbus-ops, message URL, or vendor case ID" ${editable ? "" : "disabled"}>
                  </label>
                  <label class="vendor-routing-wide">Evidence note
                    <textarea name="evidenceNote" placeholder="Vehicle movement, field observation, disposition, or follow-up evidence" ${editable ? "" : "disabled"}>${escapeHtml(response?.evidenceNote || "")}</textarea>
                  </label>
                  <label class="vendor-routing-wide">Evidence URL
                    <input name="evidenceUrl" type="url" value="${escapeHtml(response?.evidenceUrl || "")}" placeholder="https://…" ${editable ? "" : "disabled"}>
                  </label>
                  <p class="form-error vendor-routing-wide" data-vendor-routing-error></p>
                  ${editable ? `<button class="secondary-button vendor-routing-wide" type="submit">Save vendor routing</button>` : ""}
                </form>` : ""}
            </div>`;
        }).join("")}
      </div>
    </section>`;
}

function toggleInterventionExperimentFields() {
  const type = document.getElementById("interventionTypeInput").value;
  const cadence = document.getElementById("interventionCadenceInput").value;
  const experimentFields = document.getElementById("interventionExperimentFields");
  const recurrenceFields = document.getElementById("interventionRecurrenceFields");
  const experiment = type === "experiment";
  const repeating = cadence === "repeating";
  experimentFields.hidden = !experiment;
  experimentFields.querySelectorAll("input, textarea").forEach(control => {
    control.required = experiment;
  });
  recurrenceFields.hidden = !repeating;
  recurrenceFields.querySelectorAll("input, textarea").forEach(control => {
    control.required = repeating;
  });
}

function openInterventionDialog() {
  if (!requireRole("operator", "create an intervention")) return;
  document.getElementById("interventionForm").reset();
  document.getElementById("interventionError").textContent = "";
  document.getElementById("interventionSpinInput").checked = true;
  document.getElementById("interventionVeoInput").checked = true;
  toggleInterventionExperimentFields();
  document.getElementById("interventionDialog").showModal();
  document.getElementById("interventionStrategyInput").focus();
}

function closeInterventionDialog() {
  document.getElementById("interventionDialog").close();
}

function submitIntervention(event) {
  event.preventDefault();
  if (!requireRole("operator", "create an intervention")) return;
  const error = document.getElementById("interventionError");
  const interventionType = document.getElementById("interventionTypeInput").value;
  const cadence = document.getElementById("interventionCadenceInput").value;
  const recurrence = document.getElementById("interventionRecurrenceInput").value.trim();
  const strategy = document.getElementById("interventionStrategyInput").value.trim();
  const zone = document.getElementById("interventionZoneInput").value.trim();
  const rationale = document.getElementById("interventionRationaleInput").value.trim();
  const targetVendors = [
    document.getElementById("interventionSpinInput").checked ? "Spin" : "",
    document.getElementById("interventionVeoInput").checked ? "Veo" : ""
  ].filter(Boolean);
  if (strategy.length < 5 || zone.length < 2 || rationale.length < 12) {
    error.textContent = "Add a strategy, service area, and concise rationale.";
    return;
  }
  if (!targetVendors.length) {
    error.textContent = "Select at least one vendor that must respond.";
    return;
  }
  const hypothesis = document.getElementById("interventionHypothesisInput").value.trim();
  const successMeasure = document.getElementById("interventionSuccessMeasureInput").value.trim();
  const timeframeStart = document.getElementById("interventionStartInput").value;
  const timeframeEnd = document.getElementById("interventionEndInput").value;
  const latitude = Number(document.getElementById("interventionLatitudeInput").value);
  const longitude = Number(document.getElementById("interventionLongitudeInput").value);
  const radiusMeters = Number(document.getElementById("interventionRadiusInput").value);
  if (!timeframeStart || !timeframeEnd || new Date(`${timeframeEnd}T12:00:00`) < new Date(`${timeframeStart}T12:00:00`)) {
    error.textContent = "Add a valid start and end or review date.";
    return;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !Number.isFinite(radiusMeters) || radiusMeters < 25 || radiusMeters > 5000) {
    error.textContent = "Define the map area with valid coordinates and a 25–5,000 metre radius.";
    return;
  }
  if (cadence === "repeating" && recurrence.length < 5) {
    error.textContent = "Describe when the repeating intervention occurs.";
    return;
  }
  if (interventionType === "experiment" && (hypothesis.length < 12 || successMeasure.length < 8)) {
    error.textContent = "Experiments require a hypothesis and success measure.";
    return;
  }
  const createdAt = new Date().toISOString();
  const item = {
    id: nextInterventionId(),
    interventionType,
    cadence,
    recurrence: cadence === "repeating" ? recurrence : "",
    timeframeStart,
    timeframeEnd,
    mapArea: {
      label: zone,
      type: "circle",
      lat: latitude,
      lng: longitude,
      radiusMeters
    },
    zone,
    strategy,
    rationale,
    status: "recommended",
    requirementStatus: "above_current_311_requirements",
    authorityBasis: "voluntary_pilot",
    intendedEffect: "fewer_future_311_requests",
    slaStatus: "not_applicable",
    team: responseTeamForZone(zone),
    createdAt,
    targetVendors,
    vendorResponses: {},
    sourceIssueIds: [],
    independentIssueIds: [],
    eventEvidence: [],
    hypothesis: interventionType === "experiment" ? hypothesis : "",
    successMeasure: interventionType === "experiment" ? successMeasure : "",
    plannedStart: interventionType === "experiment" ? timeframeStart : "",
    plannedEnd: interventionType === "experiment" ? timeframeEnd : "",
    transitions: [{ status: "recommended", at: createdAt, actor: `local-${currentRole}` }]
  };
  state.interventions.push(item);
  recordAudit("intervention_created", item.id, `${label(interventionType)} · ${label(cadence)} · ${zone} · ${targetVendors.join(", ")}`);
  saveState();
  closeInterventionDialog();
  renderAll();
  if (typeof window.posthog !== "undefined") {
    window.posthog.capture("intervention_created", {
      intervention_type: interventionType,
      cadence,
      zone,
      vendor_count: targetVendors.length,
    });
  }
  showNotice(`${item.id} proactive forecast created for review. It is not a 311 request.`, "success");
}

function renderInterventions() {
  const list = document.getElementById("interventionList");
  list.innerHTML = state.interventions.length ? state.interventions.map(item => `
    <article class="record-card">
      <div>
        <span class="badge badge-${item.status}">${label(item.status)}</span>
        <p class="eyebrow">${escapeHtml(label(item.interventionType || "field_response"))}</p>
        <h3>${escapeHtml(item.strategy)} · ${escapeHtml(item.zone)}</h3>
        <p>${escapeHtml(item.rationale)}</p>
        <div class="intervention-scope">
          <p><strong>Cadence:</strong> ${escapeHtml(label(item.cadence || "one_off"))}${item.recurrence ? ` · ${escapeHtml(item.recurrence)}` : ""}</p>
          <p><strong>Requirement status:</strong> Voluntary pilot request · above current 311 response requirements</p>
          <p><strong>SLA status:</strong> Not applicable · requested priority is not a contractual clock</p>
          <p><strong>Intended effect:</strong> Fewer future 311 requests in the defined area and timeframe</p>
          <p><strong>Timeframe:</strong> ${escapeHtml(item.timeframeStart || item.plannedStart || "Not recorded")}–${escapeHtml(item.timeframeEnd || item.plannedEnd || "Not recorded")}</p>
          <p><strong>Map area:</strong> ${escapeHtml(item.mapArea?.label || item.zone)}${item.mapArea ? ` · ${Number(item.mapArea.lat).toFixed(5)}, ${Number(item.mapArea.lng).toFixed(5)} · ${Number(item.mapArea.radiusMeters).toLocaleString()} m radius` : " · coordinates not recorded"}</p>
          ${item.mapArea ? `<button class="quiet-button" type="button" data-view-intervention-area="${escapeHtml(item.id)}">View map area</button>` : ""}
        </div>
        ${item.sourceIssueIds?.length ? `<p class="intervention-evidence"><strong>Source records:</strong> ${item.sourceIssueIds.map(issueId => escapeHtml(issueId)).join(", ")}</p>` : ""}
        ${item.eventEvidence?.length ? `<p class="intervention-evidence"><strong>Event-window context:</strong> ${item.eventEvidence.map(evidence => `${escapeHtml(evidence.issueId)} · ${escapeHtml(evidence.eventName)} · ${escapeHtml(label(evidence.window))} · ${evidence.venueDistanceMeters} m from venue`).join("; ")}</p>` : ""}
        ${item.interventionType === "experiment" ? `
          <div class="experiment-plan">
            <p><strong>Hypothesis:</strong> ${escapeHtml(item.hypothesis)}</p>
            <p><strong>Success measure:</strong> ${escapeHtml(item.successMeasure)}</p>
            <p><strong>Planned window:</strong> ${escapeHtml(item.timeframeStart || item.plannedStart)}–${escapeHtml(item.timeframeEnd || item.plannedEnd)}</p>
          </div>` : ""}
        ${item.completionNotes ? `<p class="completion-note"><strong>Completion note:</strong> ${escapeHtml(item.completionNotes)}</p>` : ""}
        ${renderVendorResponses(item)}
        <div class="record-meta">
          <span>${escapeHtml(item.id)}</span>
          <span>Team: ${escapeHtml(item.team || "Unassigned")}</span>
          <span>Vendors: ${interventionVendors(item).map(vendor => escapeHtml(vendor)).join(", ")}</span>
          <span>Created ${new Date(item.createdAt).toLocaleString()}</span>
          ${item.approvedAt ? `<span>Approved ${new Date(item.approvedAt).toLocaleString()}</span>` : ""}
          ${item.dispatchedAt ? `<span>Dispatched ${new Date(item.dispatchedAt).toLocaleString()}</span>` : ""}
          ${item.completedAt ? `<span>Completed ${new Date(item.completedAt).toLocaleString()}</span>` : ""}
          ${item.skippedAt ? `<span>Skipped ${new Date(item.skippedAt).toLocaleString()}</span>` : ""}
        </div>
      </div>
      <div class="record-actions">
        ${item.status === "recommended" ? `<button class="secondary-button" type="button" data-action="approve" data-id="${item.id}" ${!roleAllows("admin") ? "disabled" : ""}>Approve</button>` : ""}
        ${["recommended", "approved"].includes(item.status) ? `<button class="secondary-button" type="button" data-action="skip" data-id="${item.id}" ${!roleAllows("admin") ? "disabled" : ""}>Skip</button>` : ""}
        ${item.status === "approved" ? `<button class="primary-button" type="button" data-action="dispatch" data-id="${item.id}" ${!roleAllows("admin") ? "disabled" : ""}>Dispatch</button>` : ""}
        ${item.status === "dispatched" ? `<label class="completion-control">Completion note
          <textarea data-completion-note="${item.id}" placeholder="Field result, removal, or disposition" required ${!roleAllows("admin") ? "disabled" : ""}>${escapeHtml(completionNoteDrafts.get(item.id) || item.completionNotes || "")}</textarea>
          <button class="primary-button" type="button" data-action="complete" data-id="${item.id}" ${!roleAllows("admin") ? "disabled" : ""}>Complete</button>
        </label>` : ""}
      </div>
    </article>`).join("") : `<div class="empty-card">No interventions have been generated.</div>`;
  list.querySelectorAll("[data-completion-note]").forEach(textarea => {
    textarea.addEventListener("input", () => {
      completionNoteDrafts.set(textarea.dataset.completionNote, textarea.value);
    });
  });
  list.querySelectorAll("button[data-view-intervention-area]").forEach(button => {
    button.addEventListener("click", () => {
      const item = state.interventions.find(intervention => intervention.id === button.dataset.viewInterventionArea);
      if (!item?.mapArea) return;
      document.querySelector('.nav-item[data-view="map"]')?.click();
      document.getElementById("mapInterventionsToggle").checked = true;
      renderOperationalMap();
      operationalMap?.setView([item.mapArea.lat, item.mapArea.lng], item.mapArea.radiusMeters <= 250 ? 16 : item.mapArea.radiusMeters <= 750 ? 14 : 13);
    });
  });
  list.querySelectorAll("button[data-vendor-response]").forEach(button => {
    button.addEventListener("click", () => {
      const item = state.interventions.find(intervention => intervention.id === button.dataset.id);
      if (!item || item.status !== "dispatched") return;
      if (!requireRole("operator", "record a vendor response")) return;
      const vendor = button.dataset.vendor;
      const response = button.dataset.vendorResponse;
      const targetVendors = interventionVendors(item);
      if (!targetVendors.includes(vendor) || !["accepted", "acknowledged"].includes(response)) return;
      const now = new Date().toISOString();
      item.targetVendors = targetVendors;
      item.vendorResponses ||= {};
      item.vendorResponses[vendor] = {
        status: response,
        at: now,
        actor: `local-${currentRole}`
      };
      recordAudit("vendor_proactive_dispatch_response", item.id, `${vendor} · ${response}`);
      saveState();
      renderAll();
      showNotice(`${vendor} ${response} ${item.id}.`, "success");
    });
  });
  list.querySelectorAll("form[data-vendor-routing]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const item = state.interventions.find(intervention => intervention.id === form.dataset.id);
      if (!item || item.status !== "dispatched") return;
      if (!requireRole("operator", "record vendor routing")) return;
      const vendor = form.dataset.vendor;
      const response = item.vendorResponses?.[vendor];
      if (!["accepted", "acknowledged"].includes(response?.status)) return;
      const assignedTo = form.elements.assignedTo.value.trim();
      const vendorPriority = form.elements.vendorPriority.value;
      const routingMethod = form.elements.routingMethod.value;
      const routingReference = form.elements.routingReference.value.trim();
      const evidenceNote = form.elements.evidenceNote.value.trim();
      const evidenceUrl = form.elements.evidenceUrl.value.trim();
      const error = form.querySelector("[data-vendor-routing-error]");
      if (!assignedTo || !vendorPriority || !routingMethod) {
        error.textContent = "Record the on-duty assignment, vendor priority, and routing method.";
        return;
      }
      if (!validHttpUrl(evidenceUrl)) {
        error.textContent = "Enter a valid http or https evidence URL.";
        return;
      }
      Object.assign(response, {
        assignedTo,
        vendorPriority,
        routingMethod,
        routingReference,
        evidenceNote,
        evidenceUrl,
        routingUpdatedAt: new Date().toISOString(),
        routingActor: `local-${currentRole}`
      });
      recordAudit("vendor_proactive_dispatch_routing_updated", item.id, `${vendor} · ${vendorPriority} · ${routingMethod} · assigned ${assignedTo}`);
      saveState();
      renderAll();
      showNotice(`${vendor} routing recorded for ${item.id}.`, "success");
    });
  });
  list.querySelectorAll("button[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      const item = state.interventions.find(intervention => intervention.id === button.dataset.id);
      if (!item) return;
      if (!requireRole("admin", `${button.dataset.action} an intervention`)) return;
      const previousStatus = item.status;
      const now = new Date();
      if (button.dataset.action === "complete") {
        const completionNotes = list.querySelector(`[data-completion-note="${CSS.escape(item.id)}"]`)?.value.trim();
        if (!completionNotes) {
          showNotice("A completion note is required before closing dispatched work.", "error");
          return;
        }
        const pendingVendors = interventionVendors(item).filter(vendor =>
          !["accepted", "acknowledged"].includes(item.vendorResponses?.[vendor]?.status)
        );
        if (pendingVendors.length) {
          showNotice(`Vendor response required from ${pendingVendors.join(" and ")} before completion.`, "error");
          return;
        }
        const incompleteRouting = interventionVendors(item).filter(vendor => {
          const response = item.vendorResponses?.[vendor];
          return !response?.assignedTo?.trim() || !response?.vendorPriority || !response?.routingMethod;
        });
        if (incompleteRouting.length) {
          showNotice(`Vendor routing record required from ${incompleteRouting.join(" and ")} before completion.`, "error");
          return;
        }
        item.completionNotes = completionNotes;
        completionNoteDrafts.delete(item.id);
      }
      item.status = ({ approve: "approved", dispatch: "dispatched", complete: "completed", skip: "skipped" })[button.dataset.action];
      item.transitions ||= [];
      item.transitions.push({ status: item.status, at: now.toISOString(), actor: `local-${currentRole}` });
      if (item.status === "approved") item.approvedAt = now.toISOString();
      if (item.status === "dispatched") {
        item.dispatchedAt = now.toISOString();
        item.targetVendors = interventionVendors(item);
        item.vendorResponses ||= {};
      }
      if (item.status === "skipped") item.skippedAt = now.toISOString();
      if (item.status === "completed") item.completedAt = now.toISOString();
      recordAudit("intervention_transition", item.id, `${previousStatus} → ${item.status}`);
      if (item.status === "completed" && !state.outcomes.some(outcome => outcome.interventionId === item.id)) {
        const baselineEnd = new Date(item.dispatchedAt || item.createdAt);
        const baselineStart = new Date(baselineEnd.getTime() - 7 * 86400000);
        const postStart = new Date(item.completedAt);
        const postEnd = new Date(postStart.getTime() + 7 * 86400000);
        const baselineIssues = state.issues.filter(issue => {
          const reportedAt = new Date(issue.reportedAt);
          return issue.zone === item.zone && reportedAt >= baselineStart && reportedAt < baselineEnd;
        });
        state.outcomes.push({
          id: `OUT-${String(state.outcomes.length + 1).padStart(3, "0")}`,
          interventionId: item.id,
          zone: item.zone,
          strategy: item.strategy,
          baseline: baselineIssues.length,
          post: null,
          baselineStart: baselineStart.toISOString(),
          baselineEnd: baselineEnd.toISOString(),
          postStart: postStart.toISOString(),
          postEnd: postEnd.toISOString(),
          baselineWindow: `${baselineStart.toLocaleDateString()}–${baselineEnd.toLocaleDateString()}`,
          postWindow: `${postStart.toLocaleDateString()}–${postEnd.toLocaleDateString()} (pending)`,
          baselineSourceIds: baselineIssues.map(issue => issue.id),
          completionNotes: item.completionNotes,
          interventionType: item.interventionType || "field_response",
          cadence: item.cadence || "one_off",
          recurrence: item.recurrence || "",
          timeframeStart: item.timeframeStart || "",
          timeframeEnd: item.timeframeEnd || "",
          mapArea: item.mapArea || null,
          hypothesis: item.hypothesis || "",
          successMeasure: item.successMeasure || "",
          plannedStart: item.plannedStart || "",
          plannedEnd: item.plannedEnd || "",
          label: "inconclusive",
          createdAt: now.toISOString()
        });
      }
      saveState();
      renderAll();
      if (typeof window.posthog !== "undefined") {
        window.posthog.capture("intervention_transitioned", {
          action: button.dataset.action,
          new_status: item.status,
          previous_status: previousStatus,
          zone: item.zone,
          intervention_type: item.interventionType || "field_response",
        });
      }
    });
  });
}

function renderCompliance() {
  const standards = [
    {
      id: "IP1",
      name: "ADA obstruction response",
      threshold: "Monthly eligible average ≤ 60 minutes",
      detail: "Resolve every request as quickly as possible: a slower observation can be offset in the monthly mean by faster eligible resolutions. Individual durations are not contractual pass/fail verdicts.",
      match: issue => /ada|curb ramp|wheelchair/i.test(`${issue.type} ${issue.descriptor}`)
    },
    {
      id: "IP2",
      name: "Travel or bike-lane obstruction",
      threshold: "Monthly eligible average ≤ 180 minutes",
      detail: "Calculated from the eligible vendor population for the assessment month; one observation above three hours does not by itself determine the monthly result.",
      match: issue => /bike lane|travel lane/i.test(`${issue.type} ${issue.descriptor}`)
    },
    {
      id: "IP3",
      name: "Other parking issue",
      threshold: "Monthly eligible average ≤ 1,440 minutes",
      detail: "Calculated as the mean resolution duration for eligible requests in the assessment month, not as independent request-level passes and failures.",
      match: issue => !/ada|curb ramp|wheelchair|bike lane|travel lane/i.test(`${issue.type} ${issue.descriptor}`)
    }
  ];
  const evidence = slaEvidenceState.records;
  const adaEvidence = evidence.filter(record => record.ada);
  const averageMinutes = records => records.length
    ? Math.round(records.reduce((sum, record) => sum + record.duration_minutes, 0) / records.length)
    : null;
  const formatMinutes = minutes => minutes === null
    ? "—"
    : minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const adaAverage = averageMinutes(adaEvidence);
  const goodale = evidence.filter(record => /GOODALE/i.test(record.location));
  const broad = evidence.filter(record => /W BROAD/i.test(record.location));
  document.getElementById("slaEvidenceSummary").innerHTML = evidence.length ? `
    <article>
      <p class="eyebrow">Provisional duration observations</p>
      <h3>${evidence.length} cases transcribed from the supplied screenshot</h3>
      <div class="evidence-metrics">
        <div><strong>${adaEvidence.length}</strong><span>user-flagged ADA observations</span></div>
        <div><strong>${formatMinutes(adaAverage)}</strong><span>unverified sample mean</span></div>
        <div><strong>${formatMinutes(adaEvidence.length ? Math.min(...adaEvidence.map(record => record.duration_minutes)) : null)}</strong><span>fastest observation</span></div>
        <div><strong>${formatMinutes(adaEvidence.length ? Math.max(...adaEvidence.map(record => record.duration_minutes)) : null)}</strong><span>slowest observation</span></div>
      </div>
      <p>Goodale: ${goodale.length} observations, mean ${formatMinutes(averageMinutes(goodale))}. W Broad: ${broad.length} observations, mean ${formatMinutes(averageMinutes(broad))}. These rows lack dates, vendor identity, eligibility decisions, and visual ADA validation, so none of these means establishes a monthly vendor SLA result.</p>
      <p class="provisional-label">The screenshot's row labels are source annotations, not contractual request-level verdicts. Verify the eligible monthly population before enforcement use.</p>
    </article>` : `<div class="empty-card">No request-level SLA evidence has been loaded.</div>`;
  document.getElementById("slaGrid").innerHTML = standards.map(standard => {
    const candidates = state.issues.filter(standard.match);
    const attributable = candidates.filter(issue => issue.operator && issue.operator !== "unknown");
    return `<article class="sla-card">
      <div class="sla-id">${standard.id}</div>
      <p class="eyebrow">Official performance threshold</p>
      <h3>${escapeHtml(standard.name)}</h3>
      <p class="sla-threshold">${escapeHtml(standard.threshold)}</p>
      <p>${escapeHtml(standard.detail)}</p>
      <dl>
        <div><dt>Candidate 311 records</dt><dd>${candidates.length}</dd></div>
        <div><dt>Operator attributed</dt><dd>${attributable.length}</dd></div>
        <div><dt>Assessable now</dt><dd>0</dd></div>
      </dl>
      <p class="sla-gap">Missing assessment month, vendor identity, eligible-request population, and verified resolution durations needed for the monthly average.</p>
    </article>`;
  }).join("");
}

function renderOutcomes() {
  const list = document.getElementById("outcomeList");
  list.innerHTML = state.outcomes.length ? state.outcomes.map(item => {
    const reduction = Number.isFinite(item.post) && item.baseline ? Math.round((1 - item.post / item.baseline) * 100) : null;
    return `<article class="record-card">
      <div>
        <span class="badge badge-${item.label === "reduced" ? "completed" : "standard"}">${label(item.label)}</span>
        <h3>${escapeHtml(item.strategy)} · ${escapeHtml(item.zone)}</h3>
        <p>${reduction === null ? "The post-intervention observation window is not complete." : `${item.baseline} baseline requests compared with ${item.post} afterward—a ${reduction}% reduction.`}</p>
        ${item.completionNotes ? `<p><strong>Completion evidence:</strong> ${escapeHtml(item.completionNotes)}</p>` : ""}
        ${item.interventionType === "experiment" ? `<p><strong>Experiment:</strong> ${escapeHtml(item.hypothesis)}<br><strong>Success measure:</strong> ${escapeHtml(item.successMeasure)}</p>` : ""}
        <p><strong>Scope:</strong> ${escapeHtml(label(item.cadence || "one_off"))} · ${escapeHtml(item.timeframeStart || "Not recorded")}–${escapeHtml(item.timeframeEnd || "Not recorded")} · ${escapeHtml(item.mapArea?.label || item.zone)}</p>
        ${item.baselineSourceIds?.length ? `<p><strong>Baseline records:</strong> ${item.baselineSourceIds.map(issueId => escapeHtml(issueId)).join(", ")}</p>` : `<p><strong>Baseline records:</strong> none in the defined window.</p>`}
        <div class="record-meta"><span>Baseline: ${escapeHtml(item.baselineWindow)}</span><span>Post-period: ${escapeHtml(item.postWindow)}</span><span>${escapeHtml(item.interventionId)}</span></div>
      </div>
    </article>`;
  }).join("") : `<div class="empty-card">No completed interventions are ready for outcome measurement.</div>`;
}

function renderActivity() {
  const workflowList = document.getElementById("workflowRunList");
  const runButton = document.getElementById("runWorkflows");
  runButton.disabled = !durableSession.authenticated || !roleAllows("admin");
  const recentRuns = workflowState.runs.slice(0, 6);
  workflowList.innerHTML = durableSession.authenticated ? `
    <p class="section-note">${workflowState.enabled
      ? `Scheduler enabled · every ${workflowState.intervalSeconds} seconds · City 311 sync ${workflowState.citySyncEnabled ? "enabled" : "disabled"} · ${workflowState.deliveryCount} deduplicated delivery states stored`
      : `Scheduler disabled · City 311 sync ${workflowState.citySyncEnabled ? "enabled for manual runs" : "disabled"} · ${workflowState.deliveryCount} deduplicated delivery states stored · Administrator may run a local verification manually`}</p>
    <div class="workflow-run-grid">${recentRuns.length ? recentRuns.map(run => `
      <article class="workflow-run">
        <span class="badge badge-${run.status === "success" ? "completed" : run.status === "failed" ? "critical" : "standard"}">${escapeHtml(label(run.status))}</span>
        <h4>${escapeHtml(label(run.workflow))}</h4>
        <p>${new Date(run.completed_at).toLocaleString()} · ${escapeHtml(run.trigger)}</p>
        <p>${run.workflow === "daily_brief"
          ? `${run.output.new_request_count ?? 0} new · ${run.output.unresolved_critical_count ?? 0} critical · ${run.output.dispatched_intervention_count ?? 0} dispatched`
          : run.workflow === "city_311_sync"
            ? `${run.output.source_records ?? 0} source records · ${run.output.added ?? 0} added · ${run.output.updated ?? 0} refreshed · ${run.output.invalid ?? 0} invalid`
            : `${run.output.new_delivery_count ?? 0} new delivery states · ${run.output.deduplicated_state_count ?? 0} unchanged states suppressed`}</p>
      </article>`).join("") : `<div class="empty-card">No workflow runs recorded yet.</div>`}</div>` : "";
  const ledger = document.getElementById("activityLedger");
  const entries = (state.auditLog || []).toReversed();
  ledger.innerHTML = entries.length ? entries.map(entry => `
    <article class="activity-entry">
      <time datetime="${escapeHtml(entry.at)}">${new Date(entry.at).toLocaleString()}</time>
      <div>
        <span class="badge badge-${entry.role === "admin" ? "approved" : entry.role === "operator" ? "in_progress" : "standard"}">${escapeHtml(entry.role)}</span>
        <h3>${escapeHtml(label(entry.action))}</h3>
        <p><strong>${escapeHtml(entry.target)}</strong>${entry.detail ? ` · ${escapeHtml(entry.detail)}` : ""}</p>
        <p>${escapeHtml(entry.actor)} · ${escapeHtml(entry.id)}</p>
      </div>
    </article>`).join("") : `<div class="empty-card">No local actions have been recorded. Snapshot hydration is read-only and is not logged as a user action.</div>`;
}

function filteredVehicles() {
  const company = document.getElementById("vehicleCompanyFilter").value;
  const type = document.getElementById("vehicleTypeFilter").value;
  const availability = document.getElementById("vehicleAvailabilityFilter").value;
  return vehicleState.vehicles
    .filter(vehicle => company === "all" || vehicle.company === company)
    .filter(vehicle => type === "all" || vehicle.type === type)
    .filter(vehicle => availability === "all" || (availability === "available" ? vehicle.available : !vehicle.available));
}

function renderVehicleFilters() {
  const companyFilter = document.getElementById("vehicleCompanyFilter");
  const typeFilter = document.getElementById("vehicleTypeFilter");
  const selectedCompany = companyFilter.value || "all";
  const selectedType = typeFilter.value || "all";
  const companies = [...new Set(vehicleState.vehicles.map(vehicle => vehicle.company))].sort();
  const types = [...new Set(vehicleState.vehicles.map(vehicle => vehicle.type))].sort();
  companyFilter.innerHTML = `<option value="all">All operators</option>${companies.map(company => `<option value="${escapeHtml(company)}">${escapeHtml(company)}</option>`).join("")}`;
  typeFilter.innerHTML = `<option value="all">All types</option>${types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(label(type))}</option>`).join("")}`;
  companyFilter.value = companies.includes(selectedCompany) ? selectedCompany : "all";
  typeFilter.value = types.includes(selectedType) ? selectedType : "all";
}

function renderVehicleMetrics() {
  const vehicles = filteredVehicles();
  const available = vehicles.filter(vehicle => vehicle.available).length;
  const companies = [...new Set(vehicles.map(vehicle => vehicle.company))].length;
  const ranges = vehicles.map(vehicle => vehicle.range).filter(Number.isFinite).toSorted((a, b) => a - b);
  const medianRange = ranges.length ? ranges[Math.floor(ranges.length / 2)] : null;
  const items = [
    ["Positions shown", vehicles.length.toLocaleString(), `${vehicleState.vehicles.length.toLocaleString()} in source snapshot`],
    ["Available", available.toLocaleString(), `${vehicles.length ? Math.round(available / vehicles.length * 100) : 0}% of filtered positions`],
    ["Operators", companies, "Cross-vendor proximity is prioritized"],
    ["Review flags", vehicleState.pileups.length, "Four or more vehicles · ~20 m"],
  ];
  const container = document.getElementById("vehicleMetrics");
  const template = document.getElementById("metricTemplate");
  container.innerHTML = "";
  items.forEach(([title, value, note], index) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".metric-label").textContent = title;
    node.querySelector(".metric-value").textContent = value;
    node.querySelector(".metric-note").textContent = index === 3 && medianRange !== null ? `${note} · median range ${medianRange} mi` : note;
    container.appendChild(node);
  });
}

function renderVehicleMap() {
  const canvas = document.getElementById("vehicleCanvas");
  const context = canvas.getContext("2d");
  const vehicles = filteredVehicles();
  const all = vehicleState.vehicles;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f1f1ec";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (!all.length) {
    context.fillStyle = "#66706b";
    context.font = "16px sans-serif";
    context.fillText("Vehicle positions are unavailable.", 32, 48);
    return;
  }
  const bounds = all.reduce((result, vehicle) => ({
    minLat: Math.min(result.minLat, vehicle.lat),
    maxLat: Math.max(result.maxLat, vehicle.lat),
    minLng: Math.min(result.minLng, vehicle.lng),
    maxLng: Math.max(result.maxLng, vehicle.lng)
  }), { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity });
  const pad = 28;
  const point = ({ lat, lng }) => ({
    x: pad + (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng) * (canvas.width - pad * 2),
    y: canvas.height - pad - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) * (canvas.height - pad * 2)
  });
  vehicles.forEach(vehicle => {
    const position = point(vehicle);
    context.beginPath();
    context.arc(position.x, position.y, 2.2, 0, Math.PI * 2);
    context.fillStyle = vehicle.company === "Veo" ? "rgba(0,139,139,.58)" : "rgba(232,111,63,.58)";
    context.fill();
  });
  vehicleState.pileups.forEach(pileup => {
    const position = point(pileup);
    context.beginPath();
    context.arc(position.x, position.y, 6 + Math.min(pileup.vehicles.length, 24) / 3, 0, Math.PI * 2);
    context.strokeStyle = "rgba(155,63,53,.9)";
    context.lineWidth = 2;
    context.stroke();
  });
  vehicleWatchLocations.forEach(location => {
    const position = point(location);
    context.beginPath();
    context.arc(position.x, position.y, 14, 0, Math.PI * 2);
    context.strokeStyle = "rgba(149,107,29,.95)";
    context.setLineDash([5, 4]);
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);
  });
}

function initOperationalMap() {
  if (operationalMap || typeof L === "undefined") {
    if (typeof L === "undefined") {
      document.getElementById("operationalMap").hidden = true;
      document.getElementById("mapFallback").hidden = false;
    }
    return;
  }
  operationalMap = L.map("operationalMap", {
    center: [39.98, -83.01],
    zoom: 12,
    preferCanvas: true
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(operationalMap);
  operationalMapLayers = L.layerGroup().addTo(operationalMap);
  operationalMapSearchLayer = L.layerGroup().addTo(operationalMap);
  operationalMapInterventionRenderer = L.svg({ padding: 0.5 });
  window.setTimeout(() => operationalMap.invalidateSize(), 0);
}

function renderOperationalMap() {
  if (!operationalMap || !operationalMapLayers) return;
  operationalMapLayers.clearLayers();
  const complaintMode = document.getElementById("mapComplaintFilter").value;
  const windowValue = document.getElementById("mapWindowFilter").value;
  const cutoff = windowValue === "all" ? null : Date.now() - Number(windowValue) * 86400000;
  const complaints = state.issues.filter(issue =>
    (complaintMode === "all" ||
    (complaintMode === "open" ? issue.status !== "resolved" : issue.status === "resolved")) &&
    (!cutoff || new Date(issue.reportedAt).getTime() >= cutoff)
  );
  const showVehicles = document.getElementById("mapVehiclesToggle").checked;
  const showFlags = document.getElementById("mapFlagsToggle").checked;
  const showWatches = document.getElementById("mapWatchesToggle").checked;
  const showPolicies = document.getElementById("mapPoliciesToggle").checked;
  const showInterventions = document.getElementById("mapInterventionsToggle").checked;
  const activeInterventions = state.interventions.filter(item =>
    item.mapArea && !["completed", "skipped"].includes(item.status)
  );
  const bounds = [];
  if (showPolicies && policyBoundaryState.status === "ready") {
    policyBoundaryState.boundaries.forEach(boundary => {
      const color = boundary.boundary_type === "no_ride" ? "#7a4b76"
        : boundary.boundary_type === "mandatory_parking" ? "#355f79"
          : "#956b1d";
      L.geoJSON(
        { type: "Feature", properties: {}, geometry: boundary.geometry },
        {
          style: {
            color,
            weight: 1.4,
            opacity: 0.72,
            fillColor: color,
            fillOpacity: 0.05,
            dashArray: boundary.boundary_type === "no_ride" ? "5 4" : null
          }
        }
      ).bindPopup(
        `<strong>${escapeHtml(boundary.policy_name)}</strong><br>${escapeHtml(label(boundary.boundary_type))}<br>${escapeHtml(boundary.description)}<br>Published policy context; not proof of a violation.`
      ).addTo(operationalMapLayers);
    });
  }
  if (showInterventions) {
    activeInterventions.forEach(item => {
      const point = [item.mapArea.lat, item.mapArea.lng];
      bounds.push(point);
      const color = item.interventionType === "experiment" ? "#7a4b76"
        : item.cadence === "rule_policy_change" ? "#075d8d"
          : "#2f6b4f";
      L.circle(point, {
        renderer: operationalMapInterventionRenderer,
        radius: item.mapArea.radiusMeters,
        color,
        weight: 2.5,
        fillColor: color,
        fillOpacity: 0.12,
        dashArray: item.interventionType === "experiment" ? "6 5" : null,
        className: "intervention-area-layer"
      }).bindPopup(`
        <strong>${escapeHtml(item.strategy)}</strong><br>
        ${escapeHtml(label(item.interventionType || "field_response"))} · ${escapeHtml(label(item.cadence || "one_off"))}<br>
        ${escapeHtml(item.mapArea.label || item.zone)} · ${Number(item.mapArea.radiusMeters).toLocaleString()} m radius<br>
        ${escapeHtml(item.timeframeStart || "Not recorded")}–${escapeHtml(item.timeframeEnd || "Not recorded")}<br>
        ${escapeHtml(label(item.status))}
      `).addTo(operationalMapLayers);
    });
  }
  complaints.forEach(issue => {
    const point = [issue.lat, issue.lng];
    bounds.push(point);
    L.circleMarker(point, {
      renderer: L.canvas(),
      radius: issue.status === "resolved" ? 4 : 6,
      color: issue.priority === "critical" ? "#9b3f35" : issue.priority === "high" ? "#956b1d" : "#355f79",
      weight: 2,
      fillColor: "#fffefb",
      fillOpacity: 0.9
    }).bindPopup(`
      <strong>${escapeHtml(issue.type)}</strong><br>
      ${escapeHtml(issue.id)}<br>
      ${escapeHtml(issue.address)}<br>
      ${escapeHtml(issue.zone)} · ${escapeHtml(label(issue.status))}
      ${issue.operator !== "unknown" ? `<br>${escapeHtml(issue.operator)} · ${escapeHtml(label(issue.operatorConfidence || ""))}` : ""}
      ${issue.sourceUrl ? `<br><a href="${escapeHtml(issue.sourceUrl)}" target="_blank" rel="noreferrer">Official request and photos</a>` : ""}
    `).addTo(operationalMapLayers);
  });
  if (showVehicles) {
    const renderer = L.canvas({ padding: 0.4 });
    vehicleState.vehicles.forEach(vehicle => {
      const point = [vehicle.lat, vehicle.lng];
      L.circleMarker(point, {
        renderer,
        radius: 2,
        stroke: false,
        fillColor: vehicle.company === "Veo" ? "#008b8b" : "#e86f3f",
        fillOpacity: 0.48
      }).bindTooltip(`${escapeHtml(vehicle.company)} · ${escapeHtml(label(vehicle.type))}`).addTo(operationalMapLayers);
    });
  }
  if (showFlags) {
    vehicleState.pileups.forEach(flag => {
      L.circle([flag.lat, flag.lng], {
        radius: 24,
        color: "#9b3f35",
        weight: 2,
        fill: false
      }).bindPopup(`<strong>${escapeHtml(flag.id)}</strong><br>${flag.vehicles.length} vehicles · ${flag.companies.map(escapeHtml).join(" + ")}<br>Review signal, not confirmed violation.`).addTo(operationalMapLayers);
    });
  }
  if (showWatches) {
    const latestWatchEvent = watchEventAnalysis().latest?.eventContext;
    vehicleWatchLocations.forEach(watch => {
      const point = [watch.lat, watch.lng];
      bounds.push(point);
      L.circle(point, {
        radius: watch.radius,
        color: "#956b1d",
        dashArray: "6 5",
        weight: 2,
        fillColor: "#f4ead3",
        fillOpacity: 0.18
      }).bindPopup(`<strong>${escapeHtml(watch.name)}</strong><br>${escapeHtml(watch.context)}<br>${escapeHtml(watch.comparison)}${latestWatchEvent ? `<br><strong>${escapeHtml(label(latestWatchEvent.window))}:</strong> ${escapeHtml(latestWatchEvent.event.name)} · ${Math.abs(latestWatchEvent.hoursFromEnd).toFixed(1)}h after estimated end` : ""}`).addTo(operationalMapLayers);
    });
  }
  document.getElementById("mapResultCount").textContent =
    `${complaints.length} requests${showVehicles ? ` · ${vehicleState.vehicles.length.toLocaleString()} vehicles` : ""}${showFlags ? ` · ${vehicleState.pileups.length} flags` : ""}${showPolicies && policyBoundaryState.status === "ready" ? ` · ${policyBoundaryState.summary.boundary_feature_count} policy features` : ""}${showInterventions ? ` · ${activeInterventions.length} intervention areas` : ""}`;
  if (!operationalMapHasFit && bounds.length) {
    operationalMap.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 });
    operationalMapHasFit = true;
  }
}

async function searchNearAddress(event) {
  event.preventDefault();
  initOperationalMap();
  if (!operationalMap) {
    showNotice("Address search requires the street-map library.", "error");
    return;
  }
  const query = document.getElementById("mapAddressSearch").value.trim();
  if (!query) return;
  const summary = document.getElementById("mapSearchSummary");
  summary.textContent = "Searching OpenStreetMap…";
  try {
    const searchQuery = /columbus/i.test(query) ? query : `${query}, Columbus, Ohio`;
    const params = new URLSearchParams({
      q: searchQuery,
      format: "jsonv2",
      limit: "1",
      countrycodes: "us",
      viewbox: "-83.25,40.20,-82.75,39.75",
      bounded: "1"
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "Accept-Language": "en-US" }
    });
    if (!response.ok) throw new Error(`Address search failed with ${response.status}`);
    const [result] = await response.json();
    if (!result) {
      summary.textContent = `No Columbus-area match found for “${query}.”`;
      return;
    }
    const point = { lat: Number(result.lat), lng: Number(result.lon) };
    rememberMapAddress(query);
    showMapSearchPoint(point, result.display_name);
  } catch (error) {
    console.warn("Address search unavailable.", error);
    summary.textContent = "Address search is temporarily unavailable. Existing request addresses remain searchable in Operations.";
  }
}

function showMapSearchPoint(point, name, privacyNote = "") {
  const nearbyIssues = state.issues
    .map(issue => ({ issue, distance: distanceMeters(issue, point) }))
    .filter(item => item.distance <= 805)
    .toSorted((a, b) => a.distance - b.distance);
  const nearbyVehicles = vehicleState.vehicles.filter(vehicle => distanceMeters(vehicle, point) <= 805);
  operationalMapSearchLayer.clearLayers();
  L.marker([point.lat, point.lng])
    .bindPopup(`<strong>${escapeHtml(name)}</strong><br>Search location`)
    .addTo(operationalMapSearchLayer)
    .openPopup();
  L.circle([point.lat, point.lng], {
    radius: 805,
    color: "#18201d",
    dashArray: "4 5",
    weight: 1.5,
    fillColor: "#fffefb",
    fillOpacity: 0.05
  }).addTo(operationalMapSearchLayer);
  operationalMap.setView([point.lat, point.lng], 14);
  document.getElementById("mapSearchSummary").innerHTML =
    `<strong>${escapeHtml(name)}</strong> · within ½ mile: ${nearbyIssues.length} loaded 311 request${nearbyIssues.length === 1 ? "" : "s"} and ${nearbyVehicles.length.toLocaleString()} GBFS vehicle${nearbyVehicles.length === 1 ? "" : "s"}${nearbyIssues.length ? ` · nearest: ${nearbyIssues.slice(0, 3).map(item => `${escapeHtml(item.issue.id)} (${Math.round(item.distance)} m)`).join(", ")}` : ""}${privacyNote ? ` · ${escapeHtml(privacyNote)}` : ""}`;
}

function searchNearCurrentLocation() {
  initOperationalMap();
  const summary = document.getElementById("mapSearchSummary");
  const button = document.getElementById("mapNearMe");
  if (!operationalMap) {
    showNotice("Location search requires the street-map library.", "error");
    return;
  }
  if (!navigator.geolocation) {
    summary.textContent = "Current location is not available in this browser. Enter an address instead.";
    return;
  }
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  summary.textContent = "Waiting for location permission…";
  navigator.geolocation.getCurrentPosition(
    position => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      showMapSearchPoint(
        { lat: position.coords.latitude, lng: position.coords.longitude },
        "Current location",
        "Precise location was not saved or sent to the address-search service."
      );
    },
    error => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      const message = error.code === 1
        ? "Location permission was not granted. Allow location access or enter an address instead."
        : error.code === 3
          ? "Current location took too long to resolve. Try again or enter an address."
          : "Current location could not be determined. Check location services or enter an address.";
      summary.textContent = message;
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

function renderPileups() {
  const list = document.getElementById("pileupList");
  document.getElementById("pileupCount").textContent = `${vehicleState.pileups.length} flags`;
  const eventAnalysis = watchEventAnalysis();
  const watchItems = vehicleWatchLocations.map(location => {
    const nearby = vehicleState.vehicles.filter(vehicle => distanceMeters(vehicle, location) <= location.radius);
    const counts = Object.entries(nearby.reduce((result, vehicle) => {
      result[vehicle.company] = (result[vehicle.company] || 0) + 1;
      return result;
    }, {}));
    const crossVendor = counts.length > 1;
    const history = vehicleState.watchHistory;
    const historicalCounts = history.map(item => item.watch_count).toSorted((a, b) => a - b);
    const median = historicalCounts.length ? historicalCounts[Math.floor(historicalCounts.length / 2)] : null;
    const latest = history.at(-1);
    const multiple = latest && median ? latest.watch_count / median : null;
    const historySummary = history.length
      ? `${history.length} observations · historical median ${median} · latest ${latest.watch_count}${multiple ? ` (${multiple.toFixed(1)}× median)` : ""}`
      : "Longitudinal observations unavailable.";
    const bars = history.map(item => {
      const height = Math.max(8, item.watch_count / Math.max(...historicalCounts, 1) * 42);
      const eventContext = eventContextForTime(snapshotIdToDate(item.snapshot_id));
      return `<span class="${eventContext ? "event-linked-bar" : ""}" style="height:${height}px" title="${escapeHtml(item.snapshot_id)} · ${item.watch_count} vehicles${eventContext ? ` · ${escapeHtml(label(eventContext.window))}` : ""}"></span>`;
    }).join("");
    const latestLinkedObservation = eventAnalysis.eventLinked.at(-1);
    const latestEventContext = latestLinkedObservation?.eventContext;
    const latestIsEventLinked = latestLinkedObservation?.snapshot_id === eventAnalysis.latest?.snapshot_id;
    const eventSummary = latestEventContext ? `
      <div class="event-context">
        <strong>Historical ${escapeHtml(label(latestEventContext.window))}</strong>
        <p>${escapeHtml(latestEventContext.event.name)} · ${latestLinkedObservation.watch_count} vehicles in the event-linked snapshot, captured ${eventTimingDescription(latestEventContext)}.</p>
        <p>The latest observation ${latestIsEventLinked ? "is this event-linked snapshot" : "is outside the event window"} and has ${eventAnalysis.latest.watch_count} vehicle${eventAnalysis.latest.watch_count === 1 ? "" : "s"}; ${eventAnalysis.latest.cross_vendor ? "a cross-vendor condition is present" : "no cross-vendor condition is present"}.</p>
        <p>${eventAnalysis.eventLinked.length} event-window observation${eventAnalysis.eventLinked.length === 1 ? "" : "s"}; event median ${eventAnalysis.eventMedian ?? "—"} vs. non-event median ${eventAnalysis.baselineMedian ?? "—"}. Association only; more match and non-match observations are required.</p>
        <a href="${escapeHtml(eventState.source?.url || "#")}" target="_blank" rel="noreferrer">Official schedule</a>
      </div>` : `<p>No loaded observation falls inside a verified event window.</p>`;
    return `<article class="pileup-item watch-item">
      <span class="badge badge-${crossVendor && nearby.length >= 4 ? "high" : "standard"}">Named watch</span>
      <h3>${escapeHtml(location.name)}</h3>
      <p>${escapeHtml(location.context)}</p>
      <p><strong>${nearby.length} vehicle${nearby.length === 1 ? "" : "s"} within ${location.radius} m</strong>${counts.length ? ` · ${counts.map(([company, count]) => `${escapeHtml(company)} ${count}`).join(" · ")}` : ""}</p>
      <p>${crossVendor ? "Cross-vendor presence in this snapshot; review against match end time." : "No cross-vendor condition in this snapshot."}</p>
      <p>${escapeHtml(location.comparison)}</p>
      ${eventSummary}
      <p><strong>City precedent:</strong> the official September 2025 audit found the Goodale no-parking geofence active on September 19.</p>
      <div class="watch-history" aria-label="Vehicle counts across ${history.length} snapshots">${bars}</div>
      <p><strong>${escapeHtml(historySummary)}</strong></p>
    </article>`;
  }).join("");
  const clusterItems = vehicleState.pileups.slice(0, 30).map(pileup => {
    const counts = Object.entries(pileup.vehicles.reduce((result, vehicle) => {
      result[vehicle.company] = (result[vehicle.company] || 0) + 1;
      return result;
    }, {})).map(([company, count]) => `${escapeHtml(company)} ${count}`).join(" · ");
    return `<article class="pileup-item">
      <span class="badge badge-critical">Review</span>
      <h3>${pileup.vehicles.length} vehicles · ${pileup.companies.length} operators</h3>
      <p>${counts}</p>
      <p class="coordinate-link">${pileup.lat.toFixed(5)}, ${pileup.lng.toFixed(5)}</p>
      <p>${escapeHtml(pileup.id)} · proximity signal only</p>
    </article>`;
  }).join("");
  list.innerHTML = watchItems + (clusterItems || `<div class="empty-card">No other cross-vendor clusters meet the current review threshold.</div>`);
}

function renderVehicles() {
  renderVehicleFilters();
  renderVehicleMetrics();
  renderVehicleMap();
  renderPileups();
  const note = document.getElementById("vehicleSnapshotNote");
  note.textContent = vehicleState.snapshotId
    ? `Dated snapshot ${vehicleState.snapshotId.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3 · $4:$5:$6 UTC")}. Flags require field or complaint confirmation.`
    : "Vehicle positions are unavailable. Flags are review signals, not confirmed violations.";
}

function renderHistoricalTrends() {
  const sourceNote = document.getElementById("historicalSourceNote");
  const metrics = document.getElementById("historicalMetrics");
  const monthBars = document.getElementById("historicalMonthBars");
  const channels = document.getElementById("historicalChannels");
  const addresses = document.getElementById("historicalAddresses");
  const bursts = document.getElementById("historicalBursts");
  if (!sourceNote || !metrics || !monthBars || !channels || !addresses || !bursts) return;

  if (!historicalState.records.length) {
    sourceNote.textContent = "The privacy-safe historical extract is unavailable. No workbook data is being displayed.";
    metrics.innerHTML = "";
    monthBars.innerHTML = channels.innerHTML = addresses.innerHTML = bursts.innerHTML =
      `<div class="empty-card">Historical records unavailable.</div>`;
    return;
  }

  const start = new Date(historicalState.dateRange.start);
  const end = new Date(historicalState.dateRange.end);
  const received = Object.entries(historicalState.byStatus || {})
    .filter(([status]) => /received/i.test(status))
    .reduce((sum, [, count]) => sum + count, 0);
  const burstPairs = historicalState.burstPairs || [];
  const monthEntries = Object.entries(historicalState.byMonth || {}).sort(([a], [b]) => a.localeCompare(b));
  const maximumMonth = Math.max(...monthEntries.map(([, count]) => count), 1);
  const originEntries = Object.entries(historicalState.byOrigin || {}).sort((a, b) => b[1] - a[1]);
  const maximumOrigin = Math.max(...originEntries.map(([, count]) => count), 1);
  const corridors = historicalState.namedCorridors || {};

  sourceNote.innerHTML = `${historicalState.recordCount.toLocaleString()} records from <strong>${escapeHtml(historicalState.source.file)}</strong>, ${start.toLocaleDateString()}–${end.toLocaleDateString()}. Names, email addresses, telephone numbers, and free-text descriptions were removed before this file entered the application.`;
  metrics.innerHTML = [
    ["Dataset", historicalState.recordCount.toLocaleString(), "privacy-safe requests"],
    ["Coverage", monthEntries.length, "months represented"],
    ["Open state", received.toLocaleString(), "received at export"],
    ["Burst review", burstPairs.length.toLocaleString(), "same-address pairs ≤10 min"]
  ].map(([heading, value, note]) => `<div class="metric">
    <p class="metric-label">${heading}</p>
    <p class="metric-value">${value}</p>
    <p class="metric-note">${note}</p>
  </div>`).join("");

  monthBars.innerHTML = monthEntries.map(([month, count]) => {
    const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" });
    return `<div class="bar-row">
      <span>${escapeHtml(monthLabel)}</span>
      <div><i style="width:${Math.max(2, count / maximumMonth * 100).toFixed(1)}%"></i></div>
      <strong>${count}</strong>
    </div>`;
  }).join("");

  channels.innerHTML = originEntries.map(([origin, count]) => `<div class="channel-row">
    <div><strong>${escapeHtml(origin)}</strong><span>${(count / historicalState.recordCount * 100).toFixed(1)}%</span></div>
    <div class="channel-track"><i style="width:${(count / maximumOrigin * 100).toFixed(1)}%"></i></div>
    <span>${count.toLocaleString()} requests</span>
  </div>`).join("");

  addresses.innerHTML = (historicalState.topAddresses || []).slice(0, 12).map((item, index) => `<div class="rank-row">
    <span>${String(index + 1).padStart(2, "0")}</span>
    <strong>${escapeHtml(item.address)}</strong>
    <em>${item.count}</em>
  </div>`).join("");

  const burstExamples = burstPairs.slice(0, 8).map(pair => `<li>
    <strong>${escapeHtml(pair.address)}</strong>
    <span>${escapeHtml(pair.firstId)} + ${escapeHtml(pair.secondId)} · ${Number(pair.elapsedMinutes).toFixed(1)} min</span>
  </li>`).join("");
  const sourcePatterns = historicalState.reportingPatterns?.topAnonymousClusters || [];
  const sourcePatternRows = sourcePatterns.slice(0, 5).map(pattern => `<div class="source-pattern-row">
    <strong>${escapeHtml(pattern.cluster)}</strong>
    <span>${pattern.submissions.toLocaleString()} submissions · ${pattern.distinctAddresses.toLocaleString()} distinct addresses · ${pattern.rapidPairs.toLocaleString()} consecutive pairs ≤10 min</span>
  </div>`).join("");
  bursts.innerHTML = `
    <div class="burst-summary">
      <strong>${burstPairs.length.toLocaleString()}</strong>
      <p>consecutive same-address pairs occurred within ten minutes. These remain inspectable records, but should be collapsed into one signal when ranking operational hotspots.</p>
    </div>
    <dl class="corridor-counts">
      <div><dt>North Fourth Street</dt><dd>${corridors.nFourth || 0}</dd></div>
      <div><dt>West Broad Street</dt><dd>${corridors.wBroad || 0}</dd></div>
      <div><dt>Goodale corridor</dt><dd>${corridors.goodale || 0}</dd></div>
    </dl>
    <ol class="burst-examples">${burstExamples}</ol>
    <div class="anonymous-patterns">
      <p class="eyebrow">Anonymous source concentration</p>
      <p>Source fields may represent residents, shared system accounts, or intake channels. The app discards identities and shows rank-level aggregates only; it does not infer intent.</p>
      ${sourcePatternRows}
    </div>`;
}

function issueMatchesSubscription(issue, subscription) {
  const severityRank = { standard: 0, high: 1, critical: 2 };
  const issueRank = severityRank[issue.priority] ?? 0;
  const minimumRank = severityRank[subscription.severity] ?? 2;
  return issue.status !== "resolved" &&
    issueRank >= minimumRank &&
    (subscription.zone === "all" || issue.zone === subscription.zone);
}

function reconcileAlertDeliveries() {
  state.alertSubscriptions ||= [];
  state.alertDeliveries ||= [];
  const knownKeys = new Set(state.alertDeliveries.map(delivery => delivery.dedupeKey));
  let added = 0;
  state.alertSubscriptions.filter(subscription => subscription.enabled).forEach(subscription => {
    state.issues.filter(issue => issueMatchesSubscription(issue, subscription)).forEach(issue => {
      const dedupeKey = `${subscription.id}:${issue.id}:${issue.status}:${issue.priority}`;
      if (knownKeys.has(dedupeKey)) return;
      state.alertDeliveries.push({
        id: `ALERT-${crypto.randomUUID()}`,
        subscriptionId: subscription.id,
        issueId: issue.id,
        zone: issue.zone,
        severity: issue.priority,
        issueStatus: issue.status,
        state: "local_preview",
        createdAt: new Date().toISOString(),
        dedupeKey
      });
      knownKeys.add(dedupeKey);
      added += 1;
    });
  });
  if (added) saveState();
  return added;
}

function isoWeekParts(value) {
  const source = new Date(value);
  if (!Number.isFinite(source.getTime())) return null;
  const date = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  return {
    year: isoYear,
    week: Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  };
}

function sameIsoWeekComparison() {
  const currentRecords = state.issues.map(issue => ({ id: issue.id, reportedAt: issue.reportedAt }));
  const historicalRecords = (historicalState.records || []).map(record => ({ id: record.id, reportedAt: record.reportedAt }));
  const records = [...new Map([...historicalRecords, ...currentRecords].map(record => [record.id, record])).values()]
    .filter(record => isoWeekParts(record.reportedAt));
  const currentAnchor = currentRecords
    .map(record => new Date(record.reportedAt))
    .filter(date => Number.isFinite(date.getTime()))
    .toSorted((a, b) => b - a)[0];
  const current = currentAnchor ? isoWeekParts(currentAnchor) : isoWeekParts(new Date());
  if (!current) return null;
  const prior = { year: current.year - 1, week: current.week };
  const count = target => records.filter(record => {
    const parts = isoWeekParts(record.reportedAt);
    return parts?.year === target.year && parts.week === target.week;
  }).length;
  const currentCount = count(current);
  const priorCount = count(prior);
  return {
    current,
    prior,
    currentCount,
    priorCount,
    delta: priorCount ? Math.round((currentCount - priorCount) / priorCount * 100) : null
  };
}

function forecastAccuracy() {
  const evaluated = (forecastState.history || []).filter(item =>
    Number.isFinite(Number(item.predicted_complaints))
      && Number.isFinite(Number(item.actual_complaints))
  );
  if (!evaluated.length) return null;
  const errors = evaluated.map(item => Math.abs(Number(item.predicted_complaints) - Number(item.actual_complaints)));
  const actualTotal = evaluated.reduce((sum, item) => sum + Number(item.actual_complaints), 0);
  const withinTolerance = evaluated.filter(item => {
    const tolerance = Number.isFinite(Number(item.tolerance))
      ? Number(item.tolerance)
      : Math.max(1, Math.ceil(Number(item.actual_complaints) * 0.25));
    return Math.abs(Number(item.predicted_complaints) - Number(item.actual_complaints)) <= tolerance;
  }).length;
  const predictedHotspots = new Set(evaluated.flatMap(item => item.predicted_hotspots || []));
  const actualHotspots = new Set(evaluated.flatMap(item => item.actual_hotspots || []));
  const hotspotHits = [...predictedHotspots].filter(zone => actualHotspots.has(zone)).length;
  return {
    evaluated: evaluated.length,
    mae: errors.reduce((sum, error) => sum + error, 0) / evaluated.length,
    wape: actualTotal ? errors.reduce((sum, error) => sum + error, 0) / actualTotal * 100 : null,
    withinTolerance: withinTolerance / evaluated.length * 100,
    precision: predictedHotspots.size ? hotspotHits / predictedHotspots.size * 100 : null,
    recall: actualHotspots.size ? hotspotHits / actualHotspots.size * 100 : null
  };
}

function renderDailyForecast() {
  const strip = document.getElementById("forecastStrip");
  const status = document.getElementById("forecastStatus");
  const measurement = document.getElementById("forecastMeasurement");
  if (!strip || !status || !measurement) return;

  const publishedAt = forecastState.published_at ? new Date(forecastState.published_at) : null;
  const horizons = Array.isArray(forecastState.forecast?.horizons)
    ? [...forecastState.forecast.horizons].toSorted((a, b) => Number(a.hours) - Number(b.hours))
    : [];
  status.textContent = horizons.length
    ? `Published ${publishedAt && Number.isFinite(publishedAt.getTime()) ? publishedAt.toLocaleString() : "without a valid timestamp"}`
    : forecastState.status === "unavailable"
      ? "Forecast output is unavailable."
      : "Waiting for the first published 6:00 AM forecast.";

  const horizonHours = [24, 48, 72];
  strip.innerHTML = horizonHours.map(hours => {
    const horizon = horizons.find(item => Number(item.hours) === hours);
    if (!horizon) {
      return `<article class="forecast-card forecast-card-pending">
        <span class="badge badge-standard">${hours} hours</span>
        <p class="forecast-value">—</p>
        <h4>Awaiting forecast</h4>
        <p>No prediction has been published for this horizon.</p>
      </article>`;
    }
    const zones = Array.isArray(horizon.zones) ? horizon.zones : [];
    const events = Array.isArray(horizon.events) ? horizon.events : [];
    return `<article class="forecast-card">
      <div class="forecast-card-topline">
        <span class="badge badge-standard">${hours} hours</span>
        <span class="forecast-confidence">${escapeHtml(label(horizon.confidence || "not stated"))} confidence</span>
      </div>
      <p class="forecast-value">${Number.isFinite(Number(horizon.predicted_complaints)) ? Number(horizon.predicted_complaints).toLocaleString() : "—"}</p>
      <h4>Predicted 311 requests</h4>
      <p>${zones.length
        ? `<strong>Top zones:</strong> ${zones.slice(0, 3).map(item => `${escapeHtml(item.zone)}${Number.isFinite(Number(item.predicted_complaints)) ? ` (${Number(item.predicted_complaints)})` : ""}`).join(" · ")}`
        : "No zone forecast was supplied."}</p>
      ${events.length ? `<p><strong>Event context:</strong> ${events.map(item => escapeHtml(item.name || item)).join(" · ")}</p>` : ""}
      <p class="forecast-boundary">${escapeHtml(horizon.uncertainty || "Forecast signal only; compare with actual requests after the horizon closes.")}</p>
    </article>`;
  }).join("");

  const iso = sameIsoWeekComparison();
  const accuracy = forecastAccuracy();
  const eventComparisons = forecastState.event_comparisons || [];
  const latestEvent = eventComparisons.at(-1);
  measurement.innerHTML = `
    <section>
      <p class="eyebrow">Prediction accuracy</p>
      ${accuracy ? `
        <div class="forecast-score-row">
          <span><strong>${accuracy.mae.toFixed(1)}</strong> MAE</span>
          <span><strong>${accuracy.wape === null ? "—" : `${accuracy.wape.toFixed(0)}%`}</strong> WAPE</span>
          <span><strong>${accuracy.withinTolerance.toFixed(0)}%</strong> within tolerance</span>
          <span><strong>${accuracy.precision === null ? "—" : `${accuracy.precision.toFixed(0)}%`}</strong> hotspot precision</span>
          <span><strong>${accuracy.recall === null ? "—" : `${accuracy.recall.toFixed(0)}%`}</strong> hotspot recall</span>
        </div>
        <p>${accuracy.evaluated} closed forecast horizon${accuracy.evaluated === 1 ? "" : "s"} evaluated against actual requests.</p>`
        : `<p>Accuracy will appear after the first forecast horizon closes and actual 311 requests are linked.</p>`}
    </section>
    <section>
      <p class="eyebrow">Year-over-year context</p>
      ${iso ? `<p><strong>ISO week ${String(iso.current.week).padStart(2, "0")}:</strong> ${iso.current.year} has ${iso.currentCount} loaded request${iso.currentCount === 1 ? "" : "s"} vs. ${iso.priorCount} in ${iso.prior.year}${iso.delta === null ? " · prior-year denominator unavailable" : ` · ${iso.delta >= 0 ? "+" : ""}${iso.delta}%`}.</p>` : `<p>Same-ISO-week comparison is unavailable.</p>`}
      ${latestEvent
        ? `<p><strong>Event over event:</strong> ${escapeHtml(latestEvent.current_event)} vs. ${escapeHtml(latestEvent.prior_event)} · ${escapeHtml(latestEvent.metric)} ${Number(latestEvent.current_value).toLocaleString()} vs. ${Number(latestEvent.prior_value).toLocaleString()}${Number.isFinite(Number(latestEvent.delta_pct)) ? ` · ${Number(latestEvent.delta_pct) >= 0 ? "+" : ""}${Number(latestEvent.delta_pct).toFixed(0)}%` : ""}.</p>`
        : `<p>Same-event year-over-year results will appear once matched prior-year event evidence is published.</p>`}
    </section>`;
}

function renderDailyBrief() {
  const brief = document.getElementById("dailyBrief");
  if (!brief) return;
  const issueTimes = state.issues.map(issue => new Date(issue.reportedAt).getTime()).filter(Number.isFinite);
  const anchor = issueTimes.length ? Math.max(...issueTimes) : Date.now();
  const windowStart = anchor - 24 * 60 * 60 * 1000;
  const newIssues = state.issues
    .filter(issue => {
      const time = new Date(issue.reportedAt).getTime();
      return time >= windowStart && time <= anchor;
    })
    .toSorted((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
  const critical = openIssues()
    .filter(issue => issue.priority === "critical")
    .toSorted((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt));
  const dispatched = state.interventions.filter(item => item.status === "dispatched");
  const measured = state.outcomes.filter(item => Number.isFinite(item.post));
  const sourceLabel = state.snapshotExportedAt ? "Snapshot brief" : "Trial-data brief";
  const compactIssueList = (items, emptyText) => items.length
    ? `<ul>${items.slice(0, 5).map(issue => `<li><strong>${escapeHtml(issue.id)}</strong><span>${escapeHtml(issue.type)} · ${escapeHtml(issue.address)} · ${escapeHtml(issue.zone)}</span></li>`).join("")}</ul>`
    : `<p class="brief-empty">${emptyText}</p>`;

  brief.innerHTML = `
    <div class="brief-heading">
      <div>
        <p class="eyebrow">${sourceLabel}</p>
        <h3>Operating brief through ${new Date(anchor).toLocaleString()}</h3>
      </div>
      <span class="badge badge-standard">Read-only summary</span>
    </div>
    <div class="brief-grid">
      <section>
        <p class="brief-number">${newIssues.length}</p>
        <h4>New in the latest 24-hour source window</h4>
        ${compactIssueList(newIssues, "No new requests in this source window.")}
      </section>
      <section>
        <p class="brief-number">${critical.length}</p>
        <h4>Unresolved critical items</h4>
        ${compactIssueList(critical, "No unresolved critical items.")}
      </section>
      <section>
        <p class="brief-number">${dispatched.length}</p>
        <h4>Dispatched interventions</h4>
        ${dispatched.length ? `<ul>${dispatched.map(item => `<li><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.strategy)} · ${escapeHtml(item.zone)}</span></li>`).join("")}</ul>` : `<p class="brief-empty">No interventions are currently dispatched.</p>`}
      </section>
      <section>
        <p class="brief-number">${measured.length}</p>
        <h4>Measured outcomes</h4>
        ${measured.length ? `<ul>${measured.map(item => `<li><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(label(item.label))} · ${escapeHtml(item.zone)}</span></li>`).join("")}</ul>` : `<p class="brief-empty">No completed comparison is available.</p>`}
      </section>
    </div>`;
}

function renderAlerts() {
  const subscriptionZone = document.getElementById("subscriptionZone");
  const subscriptionList = document.getElementById("subscriptionList");
  const deliveryList = document.getElementById("alertDeliveryList");
  const deliveryCount = document.getElementById("alertDeliveryCount");
  if (!subscriptionZone || !subscriptionList || !deliveryList || !deliveryCount) return;

  const selectedZone = subscriptionZone.value || "all";
  const zones = [...new Set(state.issues.map(issue => issue.zone).filter(Boolean))].sort();
  subscriptionZone.innerHTML = `<option value="all">All zones</option>${zones.map(zone => `<option value="${escapeHtml(zone)}">${escapeHtml(zone)}</option>`).join("")}`;
  subscriptionZone.value = zones.includes(selectedZone) ? selectedZone : "all";

  subscriptionList.innerHTML = state.alertSubscriptions.length ? state.alertSubscriptions.map(subscription => {
    const matches = state.issues.filter(issue => issueMatchesSubscription(issue, subscription)).length;
    return `<article class="subscription-item">
      <div>
        <span class="badge badge-${subscription.enabled ? "completed" : "standard"}">${subscription.enabled ? "Enabled" : "Paused"}</span>
        <h4>${escapeHtml(label(subscription.severity))} · ${subscription.zone === "all" ? "All zones" : escapeHtml(subscription.zone)}</h4>
        <p>${matches} current match${matches === 1 ? "" : "es"} · ${escapeHtml(subscription.id)}</p>
      </div>
      <button class="secondary-button" type="button" data-subscription-toggle="${escapeHtml(subscription.id)}">${subscription.enabled ? "Pause" : "Enable"}</button>
    </article>`;
  }).join("") : `<div class="empty-card">No alert subscriptions configured.</div>`;

  const recent = [...state.alertDeliveries].toSorted((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
  deliveryCount.textContent = `${state.alertDeliveries.length} unique state${state.alertDeliveries.length === 1 ? "" : "s"}`;
  deliveryList.innerHTML = recent.length ? recent.map(delivery => `<article class="alert-delivery">
    <div>
      <span class="badge badge-${delivery.severity}">${escapeHtml(label(delivery.severity))}</span>
      <h4>${escapeHtml(delivery.issueId)} · ${escapeHtml(delivery.zone)}</h4>
      <p>${escapeHtml(label(delivery.issueStatus))} · ${escapeHtml(delivery.subscriptionId)}</p>
    </div>
    <div>
      <strong>Local preview</strong>
      <time datetime="${escapeHtml(delivery.createdAt)}">${new Date(delivery.createdAt).toLocaleString()}</time>
    </div>
  </article>`).join("") : `<div class="empty-card">No matching alert states have been generated.</div>`;

  subscriptionList.querySelectorAll("[data-subscription-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      if (!requireRole("operator", "change an alert subscription")) return;
      const subscription = state.alertSubscriptions.find(item => item.id === button.dataset.subscriptionToggle);
      if (!subscription) return;
      subscription.enabled = !subscription.enabled;
      recordAudit("alert_subscription_updated", subscription.id, subscription.enabled ? "enabled" : "paused");
      reconcileAlertDeliveries();
      saveState();
      renderAll();
    });
  });
}

function submitSubscription(event) {
  event.preventDefault();
  if (!requireRole("operator", "add an alert subscription")) return;
  const severity = document.getElementById("subscriptionSeverity").value;
  const zone = document.getElementById("subscriptionZone").value;
  const duplicate = state.alertSubscriptions.find(subscription =>
    subscription.severity === severity && subscription.zone === zone
  );
  if (duplicate) {
    showNotice("That severity and zone subscription already exists.", "error");
    return;
  }
  const subscription = {
    id: `SUB-${crypto.randomUUID()}`,
    severity,
    zone,
    enabled: true,
    createdAt: new Date().toISOString()
  };
  state.alertSubscriptions.push(subscription);
  recordAudit("alert_subscription_created", subscription.id, `${severity} · ${zone}`);
  const emitted = reconcileAlertDeliveries();
  saveState();
  renderAll();
  showNotice(`Subscription added; ${emitted} unique local alert state${emitted === 1 ? "" : "s"} generated.`, "success");
}

function renderAll() {
  reconcileAlertDeliveries();
  renderMetrics();
  renderQueueFilterOptions();
  renderQueue();
  renderImportReview();
  renderDetail();
  renderHotspots();
  renderInterventions();
  renderCompliance();
  renderOutcomes();
  renderVehicles();
  renderHistoricalTrends();
  renderDailyForecast();
  renderDailyBrief();
  renderAlerts();
  renderActivity();
  renderOperationalMap();
  renderSiteMetrics();
  document.getElementById("openIntake").disabled = !roleAllows("operator");
  document.getElementById("openIntervention").disabled = !roleAllows("operator");
  document.getElementById("importFile").disabled = !roleAllows("operator");
  document.getElementById("resetDemo").disabled = !roleAllows("admin");
  document.querySelector("#subscriptionForm button[type='submit']").disabled = !roleAllows("operator");
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === button.dataset.view));
    if (button.dataset.view === "vehicles") renderVehicleMap();
    if (button.dataset.view === "map") {
      initOperationalMap();
      renderOperationalMap();
      window.setTimeout(() => operationalMap?.invalidateSize(), 0);
    }
    history.replaceState(null, "", `#${button.dataset.view}`);
    recordSectionView(button.dataset.view);
    if (button.dataset.view === "site-metrics") renderSiteMetrics();
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
});

let deferredInstallPrompt = null;
const installButton = document.getElementById("installApp");
const connectionStatus = document.getElementById("connectionStatus");

function renderConnectionStatus() {
  connectionStatus.hidden = navigator.onLine;
}

window.addEventListener("online", renderConnectionStatus);
window.addEventListener("offline", renderConnectionStatus);
renderConnectionStatus();

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  showNotice("311 Field Intelligence is installed on this device.", "success");
});

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Offline support could not be enabled.", error);
    });
  });
}

const initialView = window.location.hash.slice(1);
const initialViewButton = document.querySelector(`.nav-item[data-view="${CSS.escape(initialView)}"]`);
if (initialViewButton) initialViewButton.click();

document.getElementById("filters").addEventListener("input", renderQueue);
document.getElementById("filters").addEventListener("change", renderQueue);
document.getElementById("roleSelect").value = currentRole;
document.getElementById("roleSelect").addEventListener("change", event => {
  if (durableSession.authenticated) return;
  currentRole = event.target.value;
  localStorage.setItem(ROLE_KEY, currentRole);
  showNotice(`Trial role changed to ${label(currentRole)}. This is a local interface control, not production authentication.`);
  renderAll();
});
document.getElementById("vehicleFilters").addEventListener("input", () => {
  renderVehicleMetrics();
  renderVehicleMap();
});
document.getElementById("vehicleFilters").addEventListener("change", () => {
  renderVehicleMetrics();
  renderVehicleMap();
});
document.getElementById("mapControls").addEventListener("input", renderOperationalMap);
document.getElementById("mapControls").addEventListener("change", renderOperationalMap);
document.getElementById("mapControls").addEventListener("submit", searchNearAddress);
document.getElementById("mapNearMe").addEventListener("click", searchNearCurrentLocation);
document.getElementById("mapSavedAddresses").addEventListener("click", event => {
  const button = event.target.closest("[data-map-address]");
  if (!button) return;
  document.getElementById("mapAddressSearch").value = button.dataset.mapAddress;
  document.getElementById("mapControls").requestSubmit();
});
document.getElementById("mapClearAddresses").addEventListener("click", () => {
  mapRecentAddresses = [];
  try {
    localStorage.removeItem(MAP_RECENT_ADDRESSES_KEY);
  } catch {
    // The visible list can still be cleared when browser storage is restricted.
  }
  renderMapRecentAddresses();
  document.getElementById("mapAddressSearch").focus();
});
renderMapRecentAddresses();
document.getElementById("openIntake").addEventListener("click", openIntakeDialog);
document.getElementById("openIntervention").addEventListener("click", openInterventionDialog);
document.getElementById("closeIntervention").addEventListener("click", closeInterventionDialog);
document.getElementById("cancelIntervention").addEventListener("click", closeInterventionDialog);
document.getElementById("interventionForm").addEventListener("submit", submitIntervention);
document.getElementById("interventionTypeInput").addEventListener("change", toggleInterventionExperimentFields);
document.getElementById("interventionCadenceInput").addEventListener("change", toggleInterventionExperimentFields);
document.getElementById("closeIntake").addEventListener("click", closeIntakeDialog);
document.getElementById("cancelIntake").addEventListener("click", closeIntakeDialog);
document.getElementById("intakeForm").addEventListener("submit", submitIntake);
document.getElementById("authButton").addEventListener("click", async () => {
  if (durableSession.authenticated) {
    try {
      await signOutDurableMode();
    } catch (error) {
      showNotice(`Sign out failed: ${error.message}`, "error");
    }
    return;
  }
  document.getElementById("authError").textContent = "";
  document.getElementById("authDialog").showModal();
  document.getElementById("authUsername").focus();
});
document.getElementById("closeAuth").addEventListener("click", () => document.getElementById("authDialog").close());
document.getElementById("cancelAuth").addEventListener("click", () => document.getElementById("authDialog").close());
document.getElementById("authForm").addEventListener("submit", submitAuth);
document.getElementById("runWorkflows").addEventListener("click", runServerWorkflows);
document.getElementById("checkUptime").addEventListener("click", checkCurrentReachability);
document.getElementById("subscriptionForm").addEventListener("submit", submitSubscription);
document.getElementById("importFile").addEventListener("change", event => {
  const [file] = event.target.files;
  if (file) importJsonFile(file);
  event.target.value = "";
});
document.getElementById("clearImportReview").addEventListener("click", () => {
  if (!requireRole("operator", "clear reviewed import errors")) return;
  const count = (state.importReview || []).length;
  if (!count || !window.confirm(`Clear ${count} reviewed import item${count === 1 ? "" : "s"}? This does not change any operational request.`)) return;
  state.importReview = [];
  recordAudit("import_review_cleared", "import review", `${count} reviewed item${count === 1 ? "" : "s"} cleared after confirmation`);
  saveState();
  renderAll();
});
document.getElementById("exportData").addEventListener("click", exportTrialData);
document.getElementById("resetDemo").addEventListener("click", async () => {
  if (!requireRole("admin", "reset local edits")) return;
  if (!window.confirm("Reset browser-local assignments, statuses, subscriptions, interventions, and outcomes? The verified source snapshot and activity ledger will be preserved.")) return;
  const preservedAudit = [...(state.auditLog || [])];
  state = structuredClone(initialState);
  state.auditLog = preservedAudit;
  recordAudit("local_edits_reset", "trial workspace", "Verified source snapshot restored; prior activity ledger preserved");
  selectedIssueId = null;
  document.getElementById("filters").reset();
  localStorage.removeItem(STORAGE_KEY);
  const restoredSources = await hydrateOperationalSources();
  renderAll();
  showNotice(restoredSources.snapshotLoaded ? "Local changes cleared; verified source records restored." : "Local trial data restored.", "success");
});

document.addEventListener('pileupSelected', (event) => {
  const { lat, lng } = event.detail;
  initOperationalMap();
  if (operationalMap) {
    operationalMap.setView([lat, lng], 15);
  }
});

Promise.all([
  hydrateVehiclePositions(),
  hydrateSlaEvidence(),
  hydrateHistorical311(),
  hydrateEvents(),
  hydrateDailyForecast(),
  hydrateRequestVehicleTraces(),
  hydratePopulusOperations(),
  hydratePolicyBoundaries(),
  hydratePileupDashboard(),
  hydrateSiteMetrics()
]).then(() => hydrateOperationalSources()).then(initializeDurableMode).finally(() => {
  renderDurableMode();
  renderAll();
  document.documentElement.dataset.appReady = "true";
});
