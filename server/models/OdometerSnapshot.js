import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

// Daily odometer snapshot per car (for usage stats like "miles driven per day").
const odometerSnapshotSchema = new mongoose.Schema(
  {
    car: { type: ObjectId, ref: "Car", required: true },
    // ISO date string YYYY-MM-DD (no time component).
    date: { type: String, required: true },
    // First odometer reading seen on this date.
    firstOdometer: { type: Number, required: true },
    // Last odometer reading seen on this date.
    lastOdometer: { type: Number, required: true },
  },
  { timestamps: true }
);

odometerSnapshotSchema.index({ car: 1, date: 1 }, { unique: true });

const OdometerSnapshot = mongoose.model("OdometerSnapshot", odometerSnapshotSchema);

export default OdometerSnapshot;

