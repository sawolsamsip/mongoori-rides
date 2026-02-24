import Stripe from "stripe";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import Invoice from "../models/Invoice.js";
import { sendBookingConfirmation } from "../services/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

// 픽업일 = 그날 00:00, 반납일 = 그날 23:59 로 해서 같은 날 반납·다음날 픽업이 겹치지 않게
function startOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function endOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

const checkAvailability = async (car, pickupDate, returnDate, excludeBookingId = null) => {
  const reqPickupStart = startOfDay(pickupDate);
  const reqReturnEnd = endOfDay(returnDate);
  const query = {
    car,
    status: { $ne: "cancelled" },
    $and: [
      { pickupDate: { $lt: reqReturnEnd } },
      { returnDate: { $gt: reqPickupStart } },
    ],
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const bookings = await Booking.find(query);
  return bookings.length === 0;
};

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { car: carId, pickupDate, returnDate, billingMode = "daily" } = req.body;

    const isAvailable = await checkAvailability(carId, pickupDate, returnDate);
    if (!isAvailable) {
      return res.json({ success: false, message: "Car is not available for selected dates" });
    }

    const car = await Car.findById(carId);
    if (!car) return res.json({ success: false, message: "Car not found" });

    // Date-only diff in UTC to avoid timezone off-by-one (e.g. 20 vs 21 days)
    const toUTC = (str) => {
      const [y, m, d] = str.split(/[-T]/).map(Number);
      return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0)).getTime();
    };
    const noOfDays = Math.round((toUTC(returnDate) - toUTC(pickupDate)) / (1000 * 60 * 60 * 24));
    if (noOfDays <= 0) {
      return res.json({ success: false, message: "Invalid date range" });
    }

    const baseDaily = car.pricePerDay || car.price;
    const weeklyPerWeek = car.pricePerWeek != null
      ? Number(car.pricePerWeek)
      : baseDaily ? (baseDaily * 7) / 1.2 : 0;
    if (!baseDaily) {
      return res.json({ success: false, message: "Car price not configured" });
    }

    let price;
    let weeks = 0;

    if (billingMode === "weekly") {
      if (noOfDays % 7 !== 0) {
        return res.json({ success: false, message: "Weekly plan requires multiples of 7 days" });
      }
      weeks = noOfDays / 7;
      price = weeklyPerWeek * weeks;
    } else {
      price = baseDaily * noOfDays;
    }

    const amountCents = Math.round(price * 100);

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${car.brand || "Tesla"} ${car.model} — ${billingMode === "weekly" ? "Weekly" : "Daily"} Rental`,
              description:
                billingMode === "weekly"
                  ? `${weeks} week${weeks > 1 ? "s" : ""} · ${pickupDate.split("T")[0]} to ${returnDate.split("T")[0]} · ${car.location || "Irvine, CA"}`
                  : `${pickupDate.split("T")[0]} to ${returnDate.split("T")[0]} (${noOfDays} day${noOfDays > 1 ? "s" : ""}) · ${car.location || "Irvine, CA"}`,
              images: car.image ? [car.image] : undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/car-details/${carId}?payment=cancelled`,
      client_reference_id: userId.toString(),
      metadata: {
        userId: userId.toString(),
        carId: carId.toString(),
        ownerId: car.owner.toString(),
        pickupDate,
        returnDate,
        price: String(price),
        noOfDays: String(noOfDays),
        billingMode,
        weeks: String(weeks),
      },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("createCheckoutSession", err);
    res.status(500).json({ success: false, message: err.message || "Payment session failed" });
  }
};

/** Get card last4 and brand from session (expand payment_intent.payment_method when retrieving). */
function getCardDetailsFromSession(session) {
  const pm = session.payment_intent?.payment_method;
  if (!pm || typeof pm !== "object") return {};
  const card = pm.card;
  if (!card) return {};
  return {
    cardLast4: card.last4 || null,
    cardBrand: card.brand ? String(card.brand).toLowerCase() : null,
  };
}

/** Shared: create booking + invoice from a paid Stripe checkout session (idempotent). */
export async function createBookingAndInvoiceFromSession(session) {
  const session_id = session.id;
  const { userId, carId, ownerId, pickupDate, returnDate, price, billingMode = "daily", noOfDays, weeks } = session.metadata || {};
  if (!userId || !carId || !ownerId || !pickupDate || !returnDate || !price) {
    return { success: false, message: "Invalid session metadata" };
  }

  const existing = await Booking.findOne({ stripeSessionId: session_id });
  if (existing) {
    const inv = await Invoice.findOne({ booking: existing._id });
    return { success: true, already: true, bookingId: existing._id, invoiceId: inv?._id };
  }

  const isAvailable = await checkAvailability(carId, pickupDate, returnDate);
  if (!isAvailable) {
    return { success: false, message: "Car is no longer available for these dates" };
  }

  const cardDetails = getCardDetailsFromSession(session);

  const booking = await Booking.create({
    car: carId,
    owner: ownerId,
    user: userId,
    pickupDate,
    returnDate,
    price: Number(price),
    status: "confirmed",
    stripeSessionId: session_id,
    billingMode,
    noOfDays: noOfDays ? Number(noOfDays) : undefined,
    weeks: weeks ? Number(weeks) : undefined,
    cardLast4: cardDetails.cardLast4 || undefined,
    cardBrand: cardDetails.cardBrand || undefined,
  });

  const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
  const count = await Invoice.countDocuments({
    invoiceNumber: new RegExp(`^MR-INV-${yearMonth}-`),
  });
  const seq = String(count + 1).padStart(4, "0");
  const invoiceNumber = `MR-INV-${yearMonth}-${seq}`;

  const invoice = await Invoice.create({
    booking: booking._id,
    invoiceNumber,
    amount: Number(price),
    currency: "usd",
    status: "paid",
    stripeSessionId: session_id,
    stripePaymentIntentId: session.payment_intent?.id || session.payment_intent,
    lineItems: [
      {
        description: `Vehicle rental · ${pickupDate.split("T")[0]} to ${returnDate.split("T")[0]}`,
        amount: Number(price),
        quantity: 1,
      },
    ],
  });

  return { success: true, bookingId: booking._id, invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber };
}

export const confirmPaymentAndCreateBooking = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.json({ success: false, message: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent.payment_method"],
    });

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    const result = await createBookingAndInvoiceFromSession(session);
    if (!result.success) {
      return res.json({ success: false, message: result.message });
    }
    if (!result.already && result.bookingId) {
      const booking = await Booking.findById(result.bookingId).populate("car");
      if (booking) await sendBookingConfirmation(booking, booking.car, result.invoiceNumber);
    }
    res.json({
      success: true,
      message: result.already ? "Booking already created" : "Booking and invoice created",
      bookingId: result.bookingId,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
    });
  } catch (err) {
    console.error("confirmPaymentAndCreateBooking", err);
    res.status(500).json({ success: false, message: err.message || "Confirmation failed" });
  }
};

/** Stripe webhook: verify signature with STRIPE_WEBHOOK_SECRET, then create booking+invoice on checkout.session.completed */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        const expanded = await stripe.checkout.sessions.retrieve(session.id, { expand: ["payment_intent.payment_method"] });
        const result = await createBookingAndInvoiceFromSession(expanded);
        if (result.success && !result.already && result.bookingId) {
          const booking = await Booking.findById(result.bookingId).populate("car");
          if (booking) await sendBookingConfirmation(booking, booking.car, result.invoiceNumber);
          console.log("Webhook: booking and invoice created", result.bookingId, result.invoiceNumber);
        }
      } catch (err) {
        console.error("Webhook createBookingAndInvoiceFromSession failed:", err);
        return res.status(500).send("Webhook handler error");
      }
    }
  }

  res.send();
};
