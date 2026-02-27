import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getDashboard, setRoleBySecret } from "../controllers/adminController.js";

const router = express.Router();

// No auth: use X-Set-Admin-Secret header (SET_ADMIN_SECRET in env) to set a user as admin (e.g. in production)
router.post("/set-role", setRoleBySecret);

router.get("/dashboard", protect, requireAdmin, getDashboard);

export default router;
