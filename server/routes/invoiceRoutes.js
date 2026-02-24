import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getInvoiceByBooking,
  downloadInvoicePDF,
  listInvoicesForOwner,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/booking/:bookingId", protect, getInvoiceByBooking);
router.get("/booking/:bookingId/download", protect, downloadInvoicePDF);
router.get("/owner/list", protect, listInvoicesForOwner);

export default router;
