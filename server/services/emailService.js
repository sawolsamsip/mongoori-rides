/**
 * Optional email sending. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM) in .env to enable.
 * Booking confirmation and cancellation emails are sent to the renter.
 */
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  if (!host || !user) return null;
  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || "",
      },
    });
    return transporter;
  } catch (e) {
    console.warn("Email: nodemailer not installed or SMTP not configured.", e.message);
    return null;
  }
}

export async function sendMail(to, subject, html) {
  const trans = await getTransporter();
  if (!trans) return;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@mongoori.com";
  try {
    await trans.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

export async function sendBookingConfirmation(booking, car, invoiceNumber) {
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(booking.user).select("email name");
  if (!user?.email) return;
  const pickup = booking.pickupDate?.toISOString?.()?.slice(0, 10) || booking.pickupDate;
  const return_ = booking.returnDate?.toISOString?.()?.slice(0, 10) || booking.returnDate;
  await sendMail(
    user.email,
    `Booking confirmed – ${car?.brand || "Tesla"} ${car?.model}`,
    `<p>Hi ${user.name || "there"},</p><p>Your booking is confirmed.</p><p><strong>${car?.brand || "Tesla"} ${car?.model}</strong><br/>${pickup} to ${return_}<br/>Total: $${booking.price}</p><p>Invoice No. ${invoiceNumber || "—"}</p><p>— Mongoori Rides</p>`
  );
}

export async function sendBookingCancellation(booking, car) {
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(booking.user).select("email name");
  if (!user?.email) return;
  await sendMail(
    user.email,
    `Booking cancelled – ${car?.brand || "Tesla"} ${car?.model}`,
    `<p>Hi ${user.name || "there"},</p><p>Your booking has been cancelled.</p><p><strong>${car?.brand || "Tesla"} ${car?.model}</strong></p><p>— Mongoori Rides</p>`
  );
}
