/**
 * Wipe all bookings and invoices (for local testing from scratch).
 * Run from server folder: node scripts/wipeBookings.js
 */
import "dotenv/config";
import connectDB from "../configs/db.js";
import Booking from "../models/Booking.js";
import Invoice from "../models/Invoice.js";

async function wipe() {
    await connectDB();
    const deletedBookings = await Booking.deleteMany({});
    const deletedInvoices = await Invoice.deleteMany({});
    console.log("Deleted bookings:", deletedBookings.deletedCount);
    console.log("Deleted invoices:", deletedInvoices.deletedCount);
    console.log("Done. You can test from scratch.");
    process.exit(0);
}

wipe().catch((err) => {
    console.error(err);
    process.exit(1);
});
