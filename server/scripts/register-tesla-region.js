/**
 * One-time Tesla Fleet API region registration.
 * Required once per region before owner OAuth/vehicle APIs work.
 * See: https://developer.tesla.com/docs/fleet-api/endpoints/partner-endpoints#register
 *
 * Prerequisites:
 * 1. Tesla app on developer.tesla.com with Client ID + Secret (Fleet API product).
 * 2. Allowed Origins include your domain (e.g. https://api.mongoori.com or https://rides.mongoori.com).
 * 3. Public key: put public-key.pem in server/ – the API serves it at /.well-known/appspecific/com.tesla.3p.public-key.pem
 *    (Generate: openssl ecparam -name prime256v1 -genkey -noout -out key.pem; openssl ec -in key.pem -pubout -out public-key.pem)
 *
 * Run from server folder:
 *   TESLA_PARTNER_DOMAIN=api.mongoori.com node scripts/register-tesla-region.js
 */
import "dotenv/config";

const TESLA_FLEET_API_BASE = process.env.TESLA_FLEET_API_BASE || "https://fleet-api.prd.na.vn.cloud.tesla.com";
const FLEET_AUTH_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const domain = process.env.TESLA_PARTNER_DOMAIN;

async function getPartnerToken() {
  const clientId = process.env.TESLA_CLIENT_ID;
  const clientSecret = process.env.TESLA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TESLA_CLIENT_ID and TESLA_CLIENT_SECRET are required");
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: TESLA_FLEET_API_BASE,
    scope: "openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds",
  });
  const res = await fetch(FLEET_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Partner token failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function registerPartnerAccount(partnerToken) {
  if (!domain) {
    throw new Error("TESLA_PARTNER_DOMAIN is required (e.g. api.mongoori.com). Must match allowed_origins root.");
  }
  const url = `${TESLA_FLEET_API_BASE}/api/1/partner_accounts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${partnerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }
  if (!res.ok) {
    throw new Error(`Register failed: ${res.status} ${text}`);
  }
  return json;
}

async function main() {
  console.log("Tesla Fleet API – region registration");
  console.log("Region (Fleet API base):", TESLA_FLEET_API_BASE);
  console.log("Domain to register:", domain || "(missing – set TESLA_PARTNER_DOMAIN)");
  if (!domain) {
    console.error("\nUsage: TESLA_PARTNER_DOMAIN=api.mongoori.com node scripts/register-tesla-region.js");
    process.exit(1);
  }
  const partnerToken = await getPartnerToken();
  console.log("Got partner token.");
  const result = await registerPartnerAccount(partnerToken);
  console.log("Registration response:", result);
  console.log("\nDone. Your app is now registered in this region. Owners can Connect Tesla and sync vehicles.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
