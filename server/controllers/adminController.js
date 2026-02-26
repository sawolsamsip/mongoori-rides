import User from "../models/User.js";
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";

/** Admin dashboard: platform stats and Tesla Partner status. Operator uses Partner token so owners/drivers get Tesla data without each owner OAuth. */
export const getDashboard = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    const [userCount, ownerCount, carCount, bookingCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "owner" }),
      Car.countDocuments(),
      Booking.countDocuments(),
    ]);
    const teslaPartnerConfigured = !!(process.env.TESLA_PARTNER_ACCESS_TOKEN || process.env.TESLA_ACCESS_TOKEN);
    res.json({
      success: true,
      stats: { userCount, ownerCount, carCount, bookingCount },
      teslaPartnerConfigured,
      message: teslaPartnerConfigured
        ? "Tesla data (charging sessions, telemetry) is fetched with Partner token and shown to owners and drivers."
        : "Set TESLA_PARTNER_ACCESS_TOKEN or TESLA_ACCESS_TOKEN in .env to serve Tesla data to owners/drivers.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
