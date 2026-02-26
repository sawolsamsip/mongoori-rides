import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getDashboard } from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", protect, requireAdmin, getDashboard);

export default router;
