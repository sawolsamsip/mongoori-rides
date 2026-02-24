import express from "express";
import { protect } from "../middleware/auth.js";
import { createCheckoutSession, confirmPaymentAndCreateBooking } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/confirm-payment", protect, confirmPaymentAndCreateBooking);

export default router;
