const STORAGE_KEY = "311-field-intelligence-trial-v1";
const ROLE_KEY = "311-field-intelligence-trial-role";
const operatorEvidenceOverrides = {
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
  auditLog: []
};

const teams = ["", "Central response", "North response", "West response", "South response"];
let state = loadState();
let selectedIssueId = null;
let currentRole = localStorage.getItem(ROLE_KEY) || "admin";
let vehicleState = { vehicles: [], snapshotId: "", sourceFile: "", pileups: [], watchHistory: [] };
let operationalMap = null;
let operationalMapLayers = null;
let operationalMapHasFit = false;
let operationalMapSearchLayer = null;
let slaEvidenceState = { records: [], status: "unavailable" };
let historicalState = { records: [], status: "loading" };
const vehicleWatchLocations = [
  {
    id: "WATCH-GOODALE-OLENTANGY",
    name: "Goodale Street & Olentangy River Road",
    lat: 39.9744,
    lng: -83.0260,
    radius: 250,
    context: "Event-linked hypothesis: reported recurring post–Columbus Crew match staging and dumping area.",
    comparison: "Compare pre-event, 0–2 hours post-event, and next-morning snapshots."
  }
];

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

function roleAllows(required) {
  const rank = { viewer: 0, operator: 1, admin: 2 };
  return rank[currentRole] >= rank[required];
}

function requireRole(required, action) {
  if (roleAllows(required)) return true;
  showNotice(`${label(currentRole)} role cannot ${action}. Switch the trial role to ${label(required)} or higher.`, "error");
  return false;
}

function recordAudit(action, target, detail = "") {
  state.auditLog ||= [];
  state.auditLog.push({
    id: `AUD-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actor: `local-${currentRole}`,
    role: currentRole,
    action,
    target,
    detail
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function normalizedPriority(record) {
  if (["critical", "high", "standard"].includes(record.priority)) return record.priority;
  if (/ada|entrance/i.test(record.complaint_type || record.type || "")) return "critical";
  if (/pile|sidewalk/i.test(record.complaint_type || record.type || "")) return "high";
  return "standard";
}

function normalizeImportedIssue(record) {
  const sourceId = record.source_id || record.id;
  const reportedAt = record.reported_at || record.reportedAt;
  const latitude = Number(record.latitude ?? record.lat);
  const longitude = Number(record.longitude ?? record.lng);
  if (!sourceId || !record.address || !reportedAt || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const rawStatus = record.status || "received";
  const status = ["received", "assigned", "in_progress", "resolved"].includes(rawStatus)
    ? rawStatus
    : rawStatus === "closed" ? "resolved" : "received";
  const operatorEvidence = operatorEvidenceOverrides[sourceId] || null;
  return {
    id: String(sourceId),
    type: label(record.complaint_type || record.type || "other"),
    descriptor: String(record.descriptor || record.description || "No source description supplied"),
    address: String(record.address),
    zone: String(record.zone_id || record.zone || "Unassigned zone").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()),
    operator: operatorEvidence?.operator || String(record.operator || "unknown"),
    operatorConfidence: operatorEvidence?.confidence || (record.operator && record.operator !== "unknown" ? "source-provided" : "unattributed"),
    operatorEvidence: operatorEvidence?.evidence || "",
    sourceUrl: operatorEvidence?.sourceUrl || "",
    reportedAt: new Date(reportedAt).toISOString(),
    status,
    priority: normalizedPriority(record),
    team: String(record.team || record.assigned_team || ""),
    notes: String(record.notes || ""),
    lat: latitude,
    lng: longitude
  };
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
  const normalized = records.map(normalizeImportedIssue);
  const rejected = normalized.filter(record => !record).length;
  const valid = normalized.filter(Boolean);
  const existingIds = new Set(state.issues.map(issue => issue.id));
  const unique = valid.filter(issue => !existingIds.has(issue.id));
  state.issues.push(...unique);
  if (unique.length) recordAudit("records_imported", file.name, `${unique.length} added; ${valid.length - unique.length} duplicates; ${rejected} invalid`);
  saveState();
  renderAll();
  showNotice(
    `Imported ${unique.length} new request${unique.length === 1 ? "" : "s"}; ${valid.length - unique.length} duplicate${valid.length - unique.length === 1 ? "" : "s"} skipped; ${rejected} invalid record${rejected === 1 ? "" : "s"} rejected.`,
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
      return {
        ...issue,
        status: localStatus,
        team: existing.team || "",
        notes: existing.notes || ""
      };
    });
    state.snapshotExportedAt = snapshot.exported_at || "";
    saveState();
    const mode = document.getElementById("dataMode");
    mode.innerHTML = `<span></span> Base44 snapshot · ${state.issues.length}`;
    mode.title = snapshot.exported_at ? `Read-only export created ${new Date(snapshot.exported_at).toLocaleString()}` : "Read-only Base44 export";
    return true;
  } catch (error) {
    console.warn("Verified Base44 snapshot unavailable; using local trial data.", error);
    return false;
  }
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
    return true;
  } catch (error) {
    console.warn("GBFS vehicle positions unavailable.", error);
    vehicleState = { vehicles: [], snapshotId: "", sourceFile: "", pileups: [], watchHistory: [] };
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
  } catch (error) {
    console.warn("Provisional SLA screenshot evidence unavailable.", error);
    slaEvidenceState = { records: [], status: "unavailable" };
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
  } catch (error) {
    console.warn("Historical 311 extract unavailable.", error);
    historicalState = { records: [], status: "unavailable" };
  }
}

function distanceMeters(a, b) {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.hypot((a.lat - b.lat) * latScale, (a.lng - b.lng) * lngScale);
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
    descriptor: document.getElementById("intakeDescriptor").value.trim() || "No source description supplied",
    address: document.getElementById("intakeAddress").value.trim(),
    zone: document.getElementById("intakeZone").value.trim(),
    operator: document.getElementById("intakeOperator").value,
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
  showNotice(`${issue.id} added to the operational queue.`, "success");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function label(value = "") {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
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
  const recency = ageInHours(issue.reportedAt) <= 24 ? 2 : 1;
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

function renderZoneFilter() {
  const zoneFilter = document.getElementById("zoneFilter");
  const selected = zoneFilter.value || "all";
  const zones = [...new Set(state.issues.map(issue => issue.zone))].sort();
  zoneFilter.innerHTML = `<option value="all">All zones</option>${zones.map(zone => `<option value="${escapeHtml(zone)}">${escapeHtml(zone)}</option>`).join("")}`;
  zoneFilter.value = zones.includes(selected) ? selected : "all";
}

function filteredIssues() {
  const search = document.getElementById("searchFilter").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const priority = document.getElementById("priorityFilter").value;
  const zone = document.getElementById("zoneFilter").value;
  return state.issues
    .filter(issue => status === "all" || (status === "open" ? issue.status !== "resolved" : issue.status === status))
    .filter(issue => priority === "all" || issue.priority === priority)
    .filter(issue => zone === "all" || issue.zone === zone)
    .filter(issue => !search || [issue.id, issue.address, issue.zone, issue.type].some(value => value.toLowerCase().includes(search)))
    .toSorted((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || new Date(b.reportedAt) - new Date(a.reportedAt));
}

function renderQueue() {
  const issues = filteredIssues();
  document.getElementById("resultCount").textContent = `${issues.length} ${issues.length === 1 ? "request" : "requests"}`;
  const rows = document.getElementById("issueRows");
  rows.innerHTML = issues.length ? issues.map(issue => `
    <tr data-id="${escapeHtml(issue.id)}" class="${selectedIssueId === issue.id ? "selected" : ""}" tabindex="0">
      <td><span class="badge badge-${issue.priority}">${label(issue.priority)}</span></td>
      <td><span class="case-title">${escapeHtml(issue.type)}</span><span class="case-meta">${escapeHtml(issue.id)} · ${escapeHtml(issue.address)}</span></td>
      <td>${escapeHtml(issue.zone)}</td>
      <td>${ageLabel(issue.reportedAt)}</td>
      <td><span class="badge badge-${issue.status}">${label(issue.status)}</span></td>
    </tr>`).join("") : `<tr><td colspan="5">No requests match these filters.</td></tr>`;

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
  panel.innerHTML = `
    <p class="eyebrow">${escapeHtml(issue.id)}</p>
    <h3>${escapeHtml(issue.type)}</h3>
    <p class="detail-address">${escapeHtml(issue.address)}<br>${escapeHtml(issue.zone)}</p>
    <span class="badge badge-${issue.priority}">${label(issue.priority)}</span>
    <dl class="evidence">
      <div><dt>Source evidence</dt><dd>${escapeHtml(issue.descriptor)}</dd></div>
      <div><dt>Reported</dt><dd>${new Date(issue.reportedAt).toLocaleString()}</dd></div>
      <div><dt>Operator</dt><dd>${escapeHtml(issue.operator)}</dd></div>
      <div><dt>Attribution</dt><dd>${escapeHtml(label(issue.operatorConfidence || "unattributed"))}</dd></div>
      <div><dt>Coordinates</dt><dd>${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}</dd></div>
    </dl>
    ${issue.operatorEvidence ? `<div class="operator-evidence"><strong>Photo evidence</strong><p>${escapeHtml(issue.operatorEvidence)}</p>${issue.sourceUrl ? `<a href="${escapeHtml(issue.sourceUrl)}" target="_blank" rel="noreferrer">Open official request and photographs</a>` : ""}</div>` : ""}
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
    if (changes) recordAudit("request_updated", issue.id, changes);
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

function renderHotspots() {
  const data = hotspots();
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
  const max = Math.max(...data.map(item => item.score), 1);
  document.getElementById("zoneMap").innerHTML = data.map(item => {
    const alpha = 0.12 + (item.score / max) * 0.7;
    return `<div class="zone-block" style="background:rgba(31,91,70,${alpha.toFixed(2)});color:${alpha > 0.48 ? "white" : "var(--ink)"}">
      <div><strong>${escapeHtml(item.zone)}</strong><span style="color:inherit">${item.issues.length} open · score ${item.score}</span></div>
    </div>`;
  }).join("");
  document.getElementById("hotspotList").innerHTML = reportingWatchCard + fourthStreetWatch + data.map(item => `
    <article class="hotspot-item">
      <span class="badge badge-${item.tier}">${label(item.tier)}</span>
      <h3>${escapeHtml(item.zone)}</h3>
      <p>${item.issues.length} open requests representing ${item.independentSignals.length} prioritization signals; ${item.critical} critical. Severity combines priority, recency, and accessibility relevance after duplicate-burst suppression.</p>
      <p><strong>Evidence:</strong> ${item.issues.map(issue => escapeHtml(issue.id)).join(", ")}</p>
    </article>`).join("");
}

function renderInterventions() {
  const list = document.getElementById("interventionList");
  list.innerHTML = state.interventions.length ? state.interventions.map(item => `
    <article class="record-card">
      <div>
        <span class="badge badge-${item.status}">${label(item.status)}</span>
        <h3>${escapeHtml(item.strategy)} · ${escapeHtml(item.zone)}</h3>
        <p>${escapeHtml(item.rationale)}</p>
        <div class="record-meta"><span>${escapeHtml(item.id)}</span><span>Team: ${escapeHtml(item.team)}</span><span>Created ${new Date(item.createdAt).toLocaleDateString()}</span></div>
      </div>
      <div class="record-actions">
        ${item.status === "recommended" ? `<button class="secondary-button" type="button" data-action="approve" data-id="${item.id}">Approve</button>` : ""}
        ${item.status === "approved" ? `<button class="primary-button" type="button" data-action="dispatch" data-id="${item.id}">Dispatch</button>` : ""}
        ${item.status === "dispatched" ? `<button class="primary-button" type="button" data-action="complete" data-id="${item.id}">Complete</button>` : ""}
      </div>
    </article>`).join("") : `<div class="empty-card">No interventions have been generated.</div>`;
  list.querySelectorAll("button[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      const item = state.interventions.find(intervention => intervention.id === button.dataset.id);
      if (!item) return;
      if (!requireRole("admin", `${button.dataset.action} an intervention`)) return;
      const previousStatus = item.status;
      item.status = ({ approve: "approved", dispatch: "dispatched", complete: "completed" })[button.dataset.action];
      recordAudit("intervention_transition", item.id, `${previousStatus} → ${item.status}`);
      if (item.status === "completed" && !state.outcomes.some(outcome => outcome.interventionId === item.id)) {
        state.outcomes.push({
          id: `OUT-${String(state.outcomes.length + 1).padStart(3, "0")}`,
          interventionId: item.id,
          zone: item.zone,
          strategy: item.strategy,
          baseline: openIssues().filter(issue => issue.zone === item.zone).length,
          post: null,
          baselineWindow: "Trial period before completion",
          postWindow: "Pending seven-day observation",
          label: "inconclusive"
        });
      }
      saveState();
      renderAll();
    });
  });
}

function renderCompliance() {
  const standards = [
    {
      id: "IP1",
      name: "ADA obstruction response",
      threshold: "90%+ resolved within 1 hour",
      detail: "For reports received 8 a.m.–10 p.m.; otherwise by 8 a.m. the next day. Assessed as a 30-day average.",
      match: issue => /ada|curb ramp|wheelchair/i.test(`${issue.type} ${issue.descriptor}`)
    },
    {
      id: "IP2",
      name: "Travel or bike-lane obstruction",
      threshold: "90%+ resolved within 3 hours",
      detail: "For reports received 8 a.m.–10 p.m.; otherwise by 8 a.m. the next day. Assessed as a 30-day average.",
      match: issue => /bike lane|travel lane/i.test(`${issue.type} ${issue.descriptor}`)
    },
    {
      id: "IP3",
      name: "Other parking issue",
      threshold: "90%+ removed within 24 hours",
      detail: "Assessed as a 30-day average.",
      match: issue => !/ada|curb ramp|wheelchair|bike lane|travel lane/i.test(`${issue.type} ${issue.descriptor}`)
    }
  ];
  const evidence = slaEvidenceState.records;
  const adaEvidence = evidence.filter(record => record.ada);
  const adaPassed = adaEvidence.filter(record => record.result === "passed").length;
  const adaFailed = adaEvidence.filter(record => record.result === "failed").length;
  const goodale = evidence.filter(record => /GOODALE/i.test(record.location));
  const broad = evidence.filter(record => /W BROAD/i.test(record.location));
  document.getElementById("slaEvidenceSummary").innerHTML = evidence.length ? `
    <article>
      <p class="eyebrow">Provisional request-level evidence</p>
      <h3>${evidence.length} cases transcribed from the supplied screenshot</h3>
      <div class="evidence-metrics">
        <div><strong>${adaEvidence.length}</strong><span>ADA flagged</span></div>
        <div><strong>${adaPassed}</strong><span>ADA within target</span></div>
        <div><strong>${adaFailed}</strong><span>ADA over one hour</span></div>
        <div><strong>${adaEvidence.length ? Math.round(adaPassed / adaEvidence.length * 100) : 0}%</strong><span>request-level ADA pass rate</span></div>
      </div>
      <p>Goodale: ${goodale.length} cases, ${goodale.filter(record => record.result === "failed").length} failed. W Broad: ${broad.length} cases, ${broad.filter(record => record.result === "failed").length} failed. These rows lack dates and vendors, so they cannot establish a monthly vendor SLA result.</p>
      <p class="provisional-label">Provisional transcription—verify against the original spreadsheet before enforcement use.</p>
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
      <p class="sla-gap">Missing vendor response/removal timestamps and record-level SLA inclusion decisions.</p>
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
        <div class="record-meta"><span>Baseline: ${escapeHtml(item.baselineWindow)}</span><span>Post-period: ${escapeHtml(item.postWindow)}</span><span>${escapeHtml(item.interventionId)}</span></div>
      </div>
    </article>`;
  }).join("") : `<div class="empty-card">No completed interventions are ready for outcome measurement.</div>`;
}

function renderActivity() {
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
  const bounds = [];
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
      }).bindPopup(`<strong>${escapeHtml(watch.name)}</strong><br>${escapeHtml(watch.context)}<br>${escapeHtml(watch.comparison)}`).addTo(operationalMapLayers);
    });
  }
  document.getElementById("mapResultCount").textContent =
    `${complaints.length} requests${showVehicles ? ` · ${vehicleState.vehicles.length.toLocaleString()} vehicles` : ""}${showFlags ? ` · ${vehicleState.pileups.length} flags` : ""}`;
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
    const nearbyIssues = state.issues
      .map(issue => ({ issue, distance: distanceMeters(issue, point) }))
      .filter(item => item.distance <= 805)
      .toSorted((a, b) => a.distance - b.distance);
    const nearbyVehicles = vehicleState.vehicles.filter(vehicle => distanceMeters(vehicle, point) <= 805);
    operationalMapSearchLayer.clearLayers();
    L.marker([point.lat, point.lng])
      .bindPopup(`<strong>${escapeHtml(result.display_name)}</strong><br>Search location`)
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
    summary.innerHTML = `<strong>${escapeHtml(result.display_name)}</strong> · within ½ mile: ${nearbyIssues.length} loaded 311 request${nearbyIssues.length === 1 ? "" : "s"} and ${nearbyVehicles.length.toLocaleString()} GBFS vehicle${nearbyVehicles.length === 1 ? "" : "s"}${nearbyIssues.length ? ` · nearest: ${nearbyIssues.slice(0, 3).map(item => `${escapeHtml(item.issue.id)} (${Math.round(item.distance)} m)`).join(", ")}` : ""}`;
  } catch (error) {
    console.warn("Address search unavailable.", error);
    summary.textContent = "Address search is temporarily unavailable. Existing request addresses remain searchable in Operations.";
  }
}

function renderPileups() {
  const list = document.getElementById("pileupList");
  document.getElementById("pileupCount").textContent = `${vehicleState.pileups.length} flags`;
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
      return `<span style="height:${height}px" title="${escapeHtml(item.snapshot_id)} · ${item.watch_count} vehicles"></span>`;
    }).join("");
    return `<article class="pileup-item watch-item">
      <span class="badge badge-${crossVendor && nearby.length >= 4 ? "high" : "standard"}">Named watch</span>
      <h3>${escapeHtml(location.name)}</h3>
      <p>${escapeHtml(location.context)}</p>
      <p><strong>${nearby.length} vehicles within ${location.radius} m</strong>${counts.length ? ` · ${counts.map(([company, count]) => `${escapeHtml(company)} ${count}`).join(" · ")}` : ""}</p>
      <p>${crossVendor ? "Cross-vendor presence in this snapshot; review against match end time." : "No cross-vendor condition in this snapshot."}</p>
      <p>${escapeHtml(location.comparison)}</p>
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
  renderZoneFilter();
  renderQueue();
  renderDetail();
  renderHotspots();
  renderInterventions();
  renderCompliance();
  renderOutcomes();
  renderVehicles();
  renderHistoricalTrends();
  renderDailyBrief();
  renderAlerts();
  renderActivity();
  renderOperationalMap();
  document.getElementById("openIntake").disabled = !roleAllows("operator");
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
  });
});

document.getElementById("filters").addEventListener("input", renderQueue);
document.getElementById("filters").addEventListener("change", renderQueue);
document.getElementById("roleSelect").value = currentRole;
document.getElementById("roleSelect").addEventListener("change", event => {
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
document.getElementById("openIntake").addEventListener("click", openIntakeDialog);
document.getElementById("closeIntake").addEventListener("click", closeIntakeDialog);
document.getElementById("cancelIntake").addEventListener("click", closeIntakeDialog);
document.getElementById("intakeForm").addEventListener("submit", submitIntake);
document.getElementById("subscriptionForm").addEventListener("submit", submitSubscription);
document.getElementById("importFile").addEventListener("change", event => {
  const [file] = event.target.files;
  if (file) importJsonFile(file);
  event.target.value = "";
});
document.getElementById("exportData").addEventListener("click", exportTrialData);
document.getElementById("resetDemo").addEventListener("click", async () => {
  if (!requireRole("admin", "reset local edits")) return;
  const preservedAudit = [...(state.auditLog || [])];
  state = structuredClone(initialState);
  state.auditLog = preservedAudit;
  recordAudit("local_edits_reset", "trial workspace", "Verified source snapshot restored; prior activity ledger preserved");
  selectedIssueId = null;
  document.getElementById("filters").reset();
  localStorage.removeItem(STORAGE_KEY);
  const restoredSnapshot = await hydrateFromVerifiedSnapshot();
  renderAll();
  showNotice(restoredSnapshot ? "Local changes cleared; verified Base44 snapshot restored." : "Local trial data restored.", "success");
});

Promise.all([
  hydrateFromVerifiedSnapshot(),
  hydrateVehiclePositions(),
  hydrateSlaEvidence(),
  hydrateHistorical311()
]).finally(renderAll);
