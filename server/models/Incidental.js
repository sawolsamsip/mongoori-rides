import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

// 사고/부대비용 등 – 운전자·차주 정보 취합 후 처리
const incidentalSchema = new mongoose.Schema(
  {
    booking: { type: ObjectId, ref: "Booking", required: true },
    type: { type: String, enum: ["accident", "damage", "toll_dispute", "other"], default: "accident" },
    reporter: { type: String, enum: ["driver", "owner", "system"], required: true },
    reportedBy: { type: ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["reported", "gathering_info", "under_review", "resolved", "disputed"],
      default: "reported",
    },
    title: { type: String },
    description: { type: String },
    driverStatement: { type: String },
    ownerStatement: { type: String },
    attachments: [{ url: String, name: String }],
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

incidentalSchema.index({ booking: 1 });
incidentalSchema.index({ status: 1 });

const Incidental = mongoose.model("Incidental", incidentalSchema);
export default Incidental;
