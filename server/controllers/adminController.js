import User from "../models/User.js";
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";

/**
 * Set a user's role by email using a secret (for production when you can't run scripts).
 * POST /api/admin/set-role
 * Headers: X-Set-Admin-Secret: <SET_ADMIN_SECRET from env>
 * Body: { "email": "contact@mongoori.com", "role": "admin" }
 */
export const setRoleBySecret = async (req, res) => {
  try {
    const secret = req.headers["x-set-admin-secret"];
    const expected = process.env.SET_ADMIN_SECRET;
    if (!expected || secret !== expected) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { email, role } = req.body;
    if (!email || role !== "admin") {
      return res.status(400).json({ success: false, message: "Body: { email, role: 'admin' }" });
    }
    const user = await User.findOneAndUpdate(
      { email: String(email).trim() },
      { role: "admin" },
      { new: true }
    ).select("email name role");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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
