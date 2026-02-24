import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

// Fastrak 등 통행료 데이터 (일일 수집 후 해당 차량/예약과 연동)
const tollSchema = new mongoose.Schema(
  {
    booking: { type: ObjectId, ref: "Booking" },
    car: { type: ObjectId, ref: "Car" },
    source: { type: String, default: "fastrak" },
    externalId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    tollDate: { type: Date },
    description: { type: String },
    raw: { type: mongoose.Schema.Types.Mixed },
    linkedToInvoice: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tollSchema.index({ booking: 1 });
tollSchema.index({ car: 1, tollDate: 1 });
tollSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });

const Toll = mongoose.model("Toll", tollSchema);
export default Toll;
