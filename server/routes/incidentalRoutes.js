import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createIncidental,
  addStatement,
  listByBooking,
  listForOwner,
  updateStatus,
} from "../controllers/incidentalController.js";

const router = express.Router();

router.post("/", protect, createIncidental);
router.post("/add-statement", protect, addStatement);
router.get("/booking/:bookingId", protect, listByBooking);
router.get("/owner/list", protect, listForOwner);
router.post("/update-status", protect, updateStatus);

export default router;
