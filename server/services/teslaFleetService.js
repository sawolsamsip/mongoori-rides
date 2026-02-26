/**
 * Tesla Fleet API integration (Supercharge, vehicle access, telemetry).
 *
 * ─── API 키/설정 넣는 곳: server/.env ───
 *   TESLA_CLIENT_ID=...
 *   TESLA_CLIENT_SECRET=...
 *   TESLA_FLEET_API_BASE=https://fleet-api.prd.na.vn.cloud.tesla.com  (필요 시 변경)
 *   TESLA_ACCESS_TOKEN=...   (또는 아래 getTeslaToken()에서 OAuth로 발급한 토큰 반환)
 *
 * Docs: https://developer.tesla.com/docs/fleet-api
 */

const TESLA_API_BASE = process.env.TESLA_FLEET_API_BASE || "https://fleet-api.prd.na.vn.cloud.tesla.com";

/** Resolve token: userToken (owner OAuth), or env TESLA_ACCESS_TOKEN / TESLA_PARTNER_ACCESS_TOKEN (Fleet Partner). Partner token is used when userToken is null so operator/admin can serve Tesla data to owners and drivers. */
function resolveToken(userToken) {
  return userToken || process.env.TESLA_PARTNER_ACCESS_TOKEN || process.env.TESLA_ACCESS_TOKEN || null;
}

/**
 * List all vehicles for the authenticated fleet account.
 * GET /api/1/vehicles (paginated, default page size 100)
 * @param {string|null} userToken - Owner's Tesla access token (from OAuth); if not set, uses env.
 */
export async function getVehicles(userToken = null) {
  const token = resolveToken(userToken);
  if (!token) return { ok: false, vehicles: [], message: "Tesla API not configured or connect your Tesla account" };
  try {
    const url = `${TESLA_API_BASE}/api/1/vehicles`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      let message = text;
      try {
        const errJson = JSON.parse(text);
        message = errJson.error_description || errJson.message || errJson.error || text;
      } catch (_) {}
      return { ok: false, vehicles: [], message };
    }
    const data = await res.json();
    // Fleet API returns { response: [...] } (array) or { response: { vehicles: [...] } }; some docs use just response as array
    const raw = data.response ?? data.vehicles ?? data;
    const list = Array.isArray(raw) ? raw : (raw?.vehicles ?? []);
    return { ok: true, vehicles: Array.isArray(list) ? list : [] };
  } catch (e) {
    return { ok: false, vehicles: [], message: e.message };
  }
}

/**
 * Get single vehicle details by VIN or vehicle id.
 * GET /api/1/vehicles/{vin}
 */
export async function getVehicle(vinOrId, userToken = null) {
  const token = resolveToken(userToken);
  if (!token) return { ok: false, data: null, message: "Tesla API not configured or connect your Tesla account" };
  if (!vinOrId) return { ok: false, data: null, message: "VIN or vehicle id required" };
  try {
    const url = `${TESLA_API_BASE}/api/1/vehicles/${encodeURIComponent(vinOrId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return { ok: false, data: null, message: await res.text() };
    const data = await res.json();
    return { ok: true, data: data.response ?? data };
  } catch (e) {
    return { ok: false, data: null, message: e.message };
  }
}

/**
 * Fetch charging sessions for a vehicle (or account) for invoice line items.
 * Endpoint: GET /api/1/dx/charging/sessions (fleet only)
 */
export async function getChargingSessions(vehicleId, startDate, endDate, userToken = null) {
  const token = resolveToken(userToken);
  if (!token) return { ok: false, sessions: [], message: "Tesla API not configured or connect your Tesla account" };
  try {
    const url = `${TESLA_API_BASE}/api/1/dx/charging/sessions?vehicle_id=${vehicleId}&start_date=${startDate}&end_date=${endDate}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const raw = await res.text();
    if (!res.ok) {
      let message = raw;
      try {
        const err = JSON.parse(raw);
        if (err.error === "unable to get user id") {
          message = "Charging sessions are only available for Tesla Fleet business accounts. Personal OAuth tokens do not have access.";
        } else if (err.error_description || err.error) {
          message = err.error_description || err.error;
        }
      } catch (_) {}
      return { ok: false, sessions: [], message };
    }
    const data = JSON.parse(raw);
    return { ok: true, sessions: data.response?.sessions || data.sessions || [] };
  } catch (e) {
    return { ok: false, sessions: [], message: e.message };
  }
}

/**
 * Get charging invoice PDF for a session (Tesla Fleet: charging_invoice).
 */
export async function getChargingInvoicePdf(sessionId, userToken = null) {
  const token = resolveToken(userToken);
  if (!token) return { ok: false, pdf: null, message: "Tesla API not configured" };
  try {
    const url = `${TESLA_API_BASE}/api/1/dx/charging/invoice/${sessionId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, pdf: null, message: await res.text() };
    const buffer = await res.arrayBuffer();
    return { ok: true, pdf: Buffer.from(buffer) };
  } catch (e) {
    return { ok: false, pdf: null, message: e.message };
  }
}

/**
 * Fleet key / vehicle access: grant driver access for reservation period.
 */
export async function grantVehicleAccess(vehicleId, startAt, endAt, driverInfo, userToken = null) {
  const token = resolveToken(userToken);
  if (!token) return { ok: false, message: "Tesla API not configured" };
  return { ok: false, message: "Vehicle key API not implemented" };
}

/**
 * Get vehicle telemetry (battery, location, etc.) for dashboard.
 */
export async function getVehicleTelemetry(vehicleId, userToken = null) {
  const token = resolveToken(userToken);
  if (!token) return { ok: false, data: null, message: "Tesla API not configured or connect your Tesla account" };
  try {
    const url = `${TESLA_API_BASE}/api/1/vehicles/${vehicleId}/telemetry`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const raw = await res.text();
    if (!res.ok) {
      let message = raw;
      if (typeof raw === "string" && (raw.trim().startsWith("<!") || raw.includes("</html>") || raw.includes("404"))) {
        message = res.status === 404 ? "Telemetry endpoint not available (404). This API may not be enabled for your region or account." : "Telemetry unavailable.";
      } else {
        try {
          const err = JSON.parse(raw);
          message = err.error_description || err.error || err.message || raw;
        } catch (_) {}
      }
      return { ok: false, data: null, message };
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      return { ok: false, data: null, message: "Invalid response from telemetry API." };
    }
    return { ok: true, data: data.response || data };
  } catch (e) {
    return { ok: false, data: null, message: e.message };
  }
}

/**
 * Heuristic check: is the authenticated account the OWNER of this vehicle?
 * Uses GET /api/1/vehicles/{vin}/drivers which is only available to owners.
 * If the call succeeds (2xx) we treat it as an owner vehicle; otherwise (4xx/5xx) as non-owner/driver.
 */
export async function isOwnerVehicle(vin, userToken = null) {
  const token = resolveToken(userToken);
  if (!token || !vin) return false;
  try {
    const url = `${TESLA_API_BASE}/api/1/vehicles/${encodeURIComponent(vin)}/drivers`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}
