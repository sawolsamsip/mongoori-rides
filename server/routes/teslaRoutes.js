import express from "express";
import { protect } from "../middleware/auth.js";
import * as teslaFleetService from "../services/teslaFleetService.js";
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";

// All Tesla endpoints require owner and car belonging to owner (or booking belongs to owner)
const router = express.Router();

router.get("/charging-sessions/:carId", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Owner only" });
    }
    const car = await Car.findOne({ _id: req.params.carId, owner: req.user._id });
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    const vehicleId = car.teslaVehicleId || car._id.toString();
    const { start, end } = req.query;
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = end || new Date().toISOString().slice(0, 10);
    const result = await teslaFleetService.getChargingSessions(vehicleId, startDate, endDate);
    res.json({ success: result.ok, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/vehicle-telemetry/:carId", protect, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Owner only" });
    }
    const car = await Car.findOne({ _id: req.params.carId, owner: req.user._id });
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    const vehicleId = car.teslaVehicleId || car._id.toString();
    const result = await teslaFleetService.getVehicleTelemetry(vehicleId);
    res.json({ success: result.ok, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
