import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

// 의미 있는 인보이스 번호: MR-INV-YYYYMM-XXXX (Mongoori Rides - Invoice - YearMonth - Sequence)
const invoiceSchema = new mongoose.Schema(
  {
    booking: { type: ObjectId, ref: "Booking", required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["paid", "cancelled", "refunded"],
      default: "paid",
    },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    cancelledAt: { type: Date },
    lineItems: [
      {
        description: String,
        amount: Number,
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
