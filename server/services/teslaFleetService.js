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

/** 토큰은 .env의 TESLA_ACCESS_TOKEN 사용. OAuth 필요 시 이 함수 안에서 토큰 발급 로직 구현. */
async function getTeslaToken() {
  const clientId = process.env.TESLA_CLIENT_ID;
  const clientSecret = process.env.TESLA_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  // 옵션 1: .env에 직접 넣기 → return process.env.TESLA_ACCESS_TOKEN || null;
  // 옵션 2: OAuth 2.0으로 토큰 발급 후 반환 (Tesla Fleet API 문서 참고)
  return process.env.TESLA_ACCESS_TOKEN || null;
}

/**
 * Fetch charging sessions for a vehicle (or account) for invoice line items.
 * Endpoint: GET /api/1/dx/charging/sessions (fleet only)
 */
export async function getChargingSessions(vehicleId, startDate, endDate) {
  const token = await getTeslaToken();
  if (!token) return { ok: false, sessions: [], message: "Tesla API not configured" };
  try {
    const url = `${TESLA_API_BASE}/api/1/dx/charging/sessions?vehicle_id=${vehicleId}&start_date=${startDate}&end_date=${endDate}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return { ok: false, sessions: [], message: await res.text() };
    const data = await res.json();
    return { ok: true, sessions: data.response?.sessions || data.sessions || [] };
  } catch (e) {
    return { ok: false, sessions: [], message: e.message };
  }
}

/**
 * Get charging invoice PDF for a session (Tesla Fleet: charging_invoice).
 */
export async function getChargingInvoicePdf(sessionId) {
  const token = await getTeslaToken();
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
 * Tesla Fleet API vehicle commands (e.g. remote access) – scope: vehicle_charging_cmds, vehicle_cmds, etc.
 */
export async function grantVehicleAccess(vehicleId, startAt, endAt, driverInfo) {
  const token = await getTeslaToken();
  if (!token) return { ok: false, message: "Tesla API not configured" };
  // TODO: map to Tesla's vehicle sharing / key API when available in Fleet API
  return { ok: false, message: "Vehicle key API not implemented; configure TESLA_CLIENT_ID/SECRET and implement OAuth" };
}

/**
 * Get vehicle telemetry (battery, location, etc.) for dashboard.
 */
export async function getVehicleTelemetry(vehicleId) {
  const token = await getTeslaToken();
  if (!token) return { ok: false, data: null, message: "Tesla API not configured" };
  try {
    const url = `${TESLA_API_BASE}/api/1/vehicles/${vehicleId}/telemetry`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return { ok: false, data: null, message: await res.text() };
    const data = await res.json();
    return { ok: true, data: data.response || data };
  } catch (e) {
    return { ok: false, data: null, message: e.message };
  }
}
