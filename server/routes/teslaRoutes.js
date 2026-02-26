import express from "express";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/auth.js";
import * as teslaFleetService from "../services/teslaFleetService.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import OdometerSnapshot from "../models/OdometerSnapshot.js";

const router = express.Router();

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/authorize";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_SCOPES = "openid offline_access user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds";

/** Start Tesla OAuth: redirects to Tesla login. Query: token= (JWT). */
router.get("/auth", async (req, res) => {
  try {
    const authToken = req.query.token;
    if (!authToken) return res.status(400).send("Missing token. Sign in and try again.");
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const userId = typeof decoded === "string" ? decoded : (decoded?.id ?? decoded?._id ?? decoded?.userId);
    if (!userId) return res.status(400).send("Invalid token.");
    const clientId = process.env.TESLA_CLIENT_ID;
    const redirectUri = process.env.TESLA_REDIRECT_URI;
    if (!clientId || !redirectUri) return res.status(500).send("Tesla OAuth not configured (TESLA_CLIENT_ID, TESLA_REDIRECT_URI).");
    const state = jwt.sign({ userId, purpose: "tesla" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    const url = `${TESLA_AUTH_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(TESLA_SCOPES)}&state=${encodeURIComponent(state)}&prompt=login`;
    res.redirect(url);
  } catch (err) {
    res.status(401).send(err.message || "Invalid or expired token.");
  }
});

/** Tesla OAuth callback: exchange code for tokens, save to user, redirect to frontend. */
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=error&message=missing_params`);
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (decoded?.purpose !== "tesla" || !userId) return res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=error&message=invalid_state`);
    const clientId = process.env.TESLA_CLIENT_ID;
    const clientSecret = process.env.TESLA_CLIENT_SECRET;
    const redirectUri = process.env.TESLA_REDIRECT_URI;
    const audience = process.env.TESLA_FLEET_API_BASE || "https://fleet-api.prd.na.vn.cloud.tesla.com";
    if (!clientId || !clientSecret || !redirectUri) return res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=error&message=server_config`);
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      audience,
    });
    const tokenRes = await fetch(TESLA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=error&message=exchange_failed`);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const user = await User.findById(userId);
    if (!user) return res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=error&message=user_not_found`);
    user.teslaAccessToken = accessToken;
    user.teslaRefreshToken = refreshToken || user.teslaRefreshToken;
    user.teslaTokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    await user.save();
    res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=connected`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || ""}/owner/tesla?tesla=error&message=${encodeURIComponent(err.message || "callback_failed")}`);
  }
});

/** Whether the current owner has connected their Tesla account (owner only). */
router.get("/status", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner") return res.status(403).json({ success: false, message: "Owner only" });
    res.json({ success: true, connected: !!req.user.teslaAccessToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** List Tesla fleet vehicles (owner only). Enriches each vehicle with isOwner (true/false) so UI can show Owner vs Driver. */
router.get("/vehicles", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner") return res.status(403).json({ success: false, message: "Owner only" });
    const userToken = req.user.teslaAccessToken || null;
    const result = await teslaFleetService.getVehicles(userToken);

    if (!result.ok) {
      return res.json({ success: false, vehicles: [], message: result.message || "Could not load Tesla vehicles" });
    }

    const list = Array.isArray(result.vehicles) ? result.vehicles : [];
    const vinOrId = (v) => v.vin || v.id_s || v.id || v.vehicle_id;
    const vehicles = await Promise.all(
      list.map(async (v) => {
        const vid = vinOrId(v);
        let isOwner = true;
        if (vid && v.vin) {
          isOwner = await teslaFleetService.isOwnerVehicle(v.vin, userToken);
        } else if (vid) {
          const detail = await teslaFleetService.getVehicle(vid, userToken);
          const vin = detail.ok && detail.data ? detail.data.vin : null;
          isOwner = vin ? await teslaFleetService.isOwnerVehicle(vin, userToken) : true;
        }
        return { ...v, isOwner };
      })
    );
    res.json({ success: true, ok: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** Get single Tesla vehicle by VIN or id (owner only). */
router.get("/vehicles/:vinOrId", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner") return res.status(403).json({ success: false, message: "Owner only" });
    const userToken = req.user.teslaAccessToken || null;
    const result = await teslaFleetService.getVehicle(req.params.vinOrId, userToken);
    res.json({ success: result.ok, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/charging-sessions/:carId", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") return res.status(403).json({ success: false, message: "Owner or admin only" });
    const car = await Car.findOne({ _id: req.params.carId }).populate("owner");
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    const ownerId = (car.owner && (car.owner._id || car.owner)).toString();
    if (req.user.role === "owner" && ownerId !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Not your car" });
    const vehicleId = car.teslaVehicleId || car._id.toString();
    const { start, end } = req.query;
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = end || new Date().toISOString().slice(0, 10);
    const usePartnerToken = !!(process.env.TESLA_PARTNER_ACCESS_TOKEN || process.env.TESLA_ACCESS_TOKEN);
    const userToken = usePartnerToken ? null : (req.user.teslaAccessToken || null);
    const result = await teslaFleetService.getChargingSessions(vehicleId, startDate, endDate, userToken);
    res.json({ success: result.ok, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/vehicle-telemetry/:carId", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") return res.status(403).json({ success: false, message: "Owner or admin only" });
    const car = await Car.findOne({ _id: req.params.carId }).populate("owner");
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    const ownerId2 = (car.owner && (car.owner._id || car.owner)).toString();
    if (req.user.role === "owner" && ownerId2 !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Not your car" });
    const vehicleId = car.teslaVehicleId || car._id.toString();
    const usePartnerToken = !!(process.env.TESLA_PARTNER_ACCESS_TOKEN || process.env.TESLA_ACCESS_TOKEN);
    const userToken = usePartnerToken ? null : (req.user.teslaAccessToken || null);
    const result = await teslaFleetService.getVehicleTelemetry(vehicleId, userToken);

    // Record a daily odometer snapshot when telemetry is available.
    if (result.ok && result.data && typeof result.data.odometer === "number") {
      try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
        const existing = await OdometerSnapshot.findOne({ car: car._id, date: today });
        if (!existing) {
          await OdometerSnapshot.create({
            car: car._id,
            date: today,
            firstOdometer: result.data.odometer,
            lastOdometer: result.data.odometer,
          });
        } else if (result.data.odometer !== existing.lastOdometer) {
          existing.lastOdometer = result.data.odometer;
          await existing.save();
        }
      } catch (e) {
        console.error("Failed to record odometer snapshot:", e.message || e);
      }
    }

    res.json({ success: result.ok, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Daily usage (distance) based on odometer snapshots. Query: ?days=7 (default 7).
router.get("/usage/:carId/daily", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner") return res.status(403).json({ success: false, message: "Owner only" });
    const car = await Car.findOne({ _id: req.params.carId, owner: req.user._id });
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });

    const days = Math.max(1, Math.min(parseInt(req.query.days || "7", 10) || 7, 60));
    const since = new Date();
    since.setDate(since.getDate() - days - 1); // small buffer
    const cutoff = since.toISOString().slice(0, 10);

    const snapshots = await OdometerSnapshot.find({
      car: car._id,
      date: { $gt: cutoff },
    })
      .sort({ date: 1 })
      .lean();

    const daily = snapshots.map((s) => ({
      date: s.date,
      distance: Math.max(0, (s.lastOdometer ?? 0) - (s.firstOdometer ?? 0)),
      firstOdometer: s.firstOdometer,
      lastOdometer: s.lastOdometer,
    }));

    res.json({ success: true, days, usage: daily });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
